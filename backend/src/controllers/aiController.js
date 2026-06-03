const axios = require("axios");
const { query } = require("../config/database");
const { deepaiChat } = require("../services/deepai");

const AI_BASE_URL = process.env.AI_BASE_URL;
const AI_API_KEY = process.env.AI_API_KEY;

const checkAIAccess = (req, res, next) => {
  if (req.user.plan !== "premium") {
    return res.status(403).json({
      success: false,
      message: "AI features require Premium plan",
      upgradeRequired: true,
      requiredPlan: "premium",
    });
  }
  next();
};

// Flatten OpenAI-style chat messages into a single prompt for providers that
// only accept one text query (like the DeepAI scrape).
const flattenMessages = (messages) =>
  (messages || [])
    .map((m) => {
      const role = m.role === "system" ? "Instructions" : "User";
      return `${role}:\n${m.content}`;
    })
    .join("\n\n");

/**
 * Provider-agnostic chat call. Uses the DeepAI scrape by default; falls back to
 * an OpenAI-compatible endpoint if AI_PROVIDER=openai is set.
 * Always returns an OpenAI-shaped object so callers stay unchanged:
 *   { choices: [{ message: { content } }], usage: { total_tokens } }
 */
const callAI = async (messages, maxTokens = 2000, temperature = 0.7) => {
  const provider = (process.env.AI_PROVIDER || "deepai").toLowerCase();

  if (provider === "openai") {
    const response = await axios.post(
      `${AI_BASE_URL}/chat/completions`,
      {
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );
    return response.data;
  }

  // Default: DeepAI scrape (free). Single-prompt, plain-text reply.
  const prompt = flattenMessages(messages);
  const { content } = await deepaiChat(prompt);

  if (!content) {
    throw new Error("Empty response from AI provider");
  }

  // Rough token estimate (~4 chars/token) for usage logging.
  const approxTokens = Math.ceil(
    (prompt.length + content.length) / 4,
  );

  return {
    choices: [{ message: { role: "assistant", content } }],
    usage: { total_tokens: approxTokens },
  };
};

/**
 * Robustly extract a JSON object from an LLM response that may include
 * markdown code fences, prose, or trailing text.
 */
const extractJSON = (content) => {
  if (!content) return null;
  let text = String(content).trim();

  // Prefer a fenced ```json ... ``` block if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  // Fall back to the first {...} span.
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
};

/**
 * Normalize an LLM "graph" into a safe, predictable shape:
 *   { title, direction: "TB"|"LR", nodes: [{id,label,shape}], edges: [{source,target,label}] }
 * Guarantees unique node ids and drops edges that reference unknown nodes.
 */
const normalizeGraph = (raw, fallbackTitle = "Diagram") => {
  const allowedShapes = ["rectangle", "ellipse", "diamond"];
  const out = {
    title:
      typeof raw?.title === "string" && raw.title.trim()
        ? raw.title.trim().slice(0, 120)
        : fallbackTitle,
    direction: raw?.direction === "LR" ? "LR" : "TB",
    nodes: [],
    edges: [],
  };

  const seen = new Set();
  const nodes = Array.isArray(raw?.nodes) ? raw.nodes : [];
  nodes.forEach((n, i) => {
    let id = String(n?.id ?? `n${i + 1}`).trim() || `n${i + 1}`;
    while (seen.has(id)) id = `${id}_${i}`;
    seen.add(id);
    out.nodes.push({
      id,
      label: String(n?.label ?? n?.text ?? id).slice(0, 200),
      shape: allowedShapes.includes(n?.shape) ? n.shape : "rectangle",
    });
  });

  const edges = Array.isArray(raw?.edges) ? raw.edges : [];
  edges.forEach((e) => {
    const source = String(e?.source ?? e?.from ?? "").trim();
    const target = String(e?.target ?? e?.to ?? "").trim();
    if (seen.has(source) && seen.has(target)) {
      out.edges.push({
        source,
        target,
        label: e?.label ? String(e.label).slice(0, 120) : "",
      });
    }
  });

  return out;
};

const DIAGRAM_SYSTEM_PROMPT = `You are an expert diagramming assistant. Convert the user's request into a STRUCTURED GRAPH, not drawing coordinates.

Return ONLY a single valid JSON object (no markdown, no prose) with EXACTLY this shape:
{
  "title": "short title",
  "direction": "TB" | "LR",
  "nodes": [
    { "id": "n1", "label": "Step text", "shape": "rectangle" | "ellipse" | "diamond" }
  ],
  "edges": [
    { "source": "n1", "target": "n2", "label": "optional edge label" }
  ]
}

Rules:
- Use "ellipse" for start/end nodes, "diamond" for decisions/conditions, "rectangle" for normal steps.
- Every edge's "source" and "target" MUST match an existing node "id".
- Keep labels concise. Use "direction": "TB" for flowcharts, "LR" for left-to-right pipelines.
- Do NOT include x, y, width, coordinates, or Excalidraw-specific fields.`;

exports.textToDiagram = async (req, res) => {
  try {
    if (req.user.plan !== "premium") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Premium plan required for AI features",
          upgradeRequired: true,
        });
    }

    const { prompt, board_id, style = "flowchart" } = req.body;
    if (!prompt || !String(prompt).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt is required" });
    }

    const aiResponse = await callAI(
      [
        { role: "system", content: DIAGRAM_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a ${style} diagram for: ${prompt}`,
        },
      ],
      2000,
      0.2, // low temperature → more reliable structured JSON
    );

    const content = aiResponse?.choices?.[0]?.message?.content;
    const parsed = extractJSON(content);

    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      console.error("[textToDiagram] Could not parse graph from AI:", content);
      return res.status(502).json({
        success: false,
        message:
          "The AI returned an unexpected response. Please rephrase and try again.",
      });
    }

    const graph = normalizeGraph(parsed, prompt.slice(0, 60));

    await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, 'text_to_diagram', $3, $4, $5, NOW())`,
      [
        req.user.id,
        board_id || null,
        prompt,
        JSON.stringify(graph),
        aiResponse.usage?.total_tokens || 0,
      ],
    );

    res.json({
      success: true,
      data: {
        // `graph` is the new, reliable payload the frontend converts to
        // valid Excalidraw elements. `diagram` is kept for backward compat.
        graph,
        diagram: { elements: [], appState: {}, files: {} },
        tokensUsed: aiResponse.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error(
      "Text to diagram error:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "AI service error. Please try again." });
  }
};

exports.mermaidToInkboard = async (req, res) => {
  try {
    if (req.user.plan !== "premium") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Premium plan required for AI features",
          upgradeRequired: true,
        });
    }

    const { mermaid_code, board_id } = req.body;
    if (!mermaid_code || !String(mermaid_code).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Mermaid code is required" });
    }

    const aiResponse = await callAI(
      [
        { role: "system", content: DIAGRAM_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Convert this Mermaid diagram into the graph JSON described above:\n\n${mermaid_code}`,
        },
      ],
      2000,
      0.2,
    );

    const content = aiResponse?.choices?.[0]?.message?.content;
    const parsed = extractJSON(content);

    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      console.error("[mermaidToInkboard] Could not parse graph:", content);
      return res.status(502).json({
        success: false,
        message:
          "Could not convert that Mermaid code. Please check the syntax and try again.",
      });
    }

    const graph = normalizeGraph(parsed, "Mermaid Diagram");

    await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, 'mermaid_to_inkboard', $3, $4, $5, NOW())`,
      [
        req.user.id,
        board_id || null,
        mermaid_code,
        JSON.stringify(graph),
        aiResponse.usage?.total_tokens || 0,
      ],
    );

    res.json({
      success: true,
      data: {
        graph,
        diagram: { elements: [], appState: {}, files: {} },
        tokensUsed: aiResponse.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error(
      "Mermaid to Inkboard error:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "AI service error. Please try again." });
  }
};

exports.wireframeToCode = async (req, res) => {
  try {
    if (req.user.plan !== "premium") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Premium plan required for AI features",
          upgradeRequired: true,
        });
    }

    const {
      canvas_data,
      framework = "react",
      board_id,
      description = "",
    } = req.body;
    if (!canvas_data) {
      return res
        .status(400)
        .json({ success: false, message: "Canvas data is required" });
    }

    const systemPrompt = `You are an expert UI developer. Convert wireframe/sketch descriptions into clean ${framework} code.
    
    Generate complete, working ${framework} component code based on the wireframe data provided.
    Use Tailwind CSS for styling. Make it responsive and modern.
    Return ONLY the code, no explanations.
    
    If framework is 'react', return a React component.
    If framework is 'html', return plain HTML with inline Tailwind classes.
    If framework is 'vue', return a Vue component.`;

    const wireframeDescription = `
    Framework: ${framework}
    Additional description: ${description}
    Canvas elements: ${JSON.stringify(canvas_data.elements?.slice(0, 50))}
    `;

    const aiResponse = await callAI(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate ${framework} code for this wireframe:\n${wireframeDescription}`,
        },
      ],
      4000,
    );

    const generatedCode = aiResponse.choices[0].message.content;

    await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, 'wireframe_to_code', $3, $4, $5, NOW())`,
      [
        req.user.id,
        board_id || null,
        description,
        generatedCode,
        aiResponse.usage?.total_tokens || 0,
      ],
    );

    res.json({
      success: true,
      data: {
        code: generatedCode,
        framework,
        tokensUsed: aiResponse.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error(
      "Wireframe to code error:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "AI service error. Please try again." });
  }
};

exports.getAIUsage = async (req, res) => {
  try {
    const result = await query(
      "SELECT tool_type, COUNT(*) as count, SUM(tokens_used) as total_tokens FROM ai_usage WHERE user_id = $1 GROUP BY tool_type",
      [req.user.id],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
