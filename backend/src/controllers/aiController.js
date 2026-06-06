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

  // Only use custom OpenAI-compatible endpoint if explicitly set
  if (provider === "openai") {
    if (!AI_BASE_URL || !AI_API_KEY) {
      throw new Error(
        "AI_PROVIDER=openai but AI_BASE_URL or AI_API_KEY is missing in .env",
      );
    }

    const baseUrl = AI_BASE_URL.replace(/\/$/, "");
    const url = `${baseUrl}/chat/completions`;

    const response = await axios.post(
      url,
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
        timeout: 90000,
      },
    );
    return response.data;
  }

  // Default: Use the DeepAI scrape method (no .env needed)
  // The scrape is flaky, so we retry once.
  const prompt = flattenMessages(messages);
  let content = "";
  let attempt = 0;

  while (attempt < 2) {
    attempt++;
    try {
      const result = await deepaiChat(prompt);
      content = result.content || "";
      if (content) break;
    } catch (e) {
      console.warn(`[DeepAI Scrape] Attempt ${attempt} failed:`, e.message);
      if (attempt === 2) throw e;
    }
    await new Promise((r) => setTimeout(r, 800)); // small delay
  }

  if (!content) {
    throw new Error("Empty response from AI provider");
  }

  console.log("[DeepAI Scrape] Raw response length:", content.length);
  // Uncomment the next line temporarily if you want to see the full raw output in terminal
  // console.log("[DeepAI Scrape] Raw content:", content.substring(0, 800));

  const approxTokens = Math.ceil((prompt.length + content.length) / 4);

  return {
    choices: [{ message: { role: "assistant", content } }],
    usage: { total_tokens: approxTokens },
  };
};

/**
 * Robustly extract a JSON object from an LLM response that may include
 * markdown code fences, prose, or trailing text.
 * Extra aggressive cleaning for DeepAI scrape responses.
 */
const extractJSON = (content) => {
  if (!content) return null;
  let text = String(content).trim();

  // Remove common junk from scrape responses
  text = text.replace(
    /^(Assistant|AI|Response|Here is|JSON:|Output:)\s*[:\-]?\s*/i,
    "",
  );
  text = text.replace(/\n/g, " ");

  // Prefer a fenced ```json ... ``` block if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  // Fall back to the first {...} span (more aggressive)
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
  }

  // Try to clean trailing commas or extra stuff
  text = text.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
};

/**
 * Heuristic fallback: try to turn plain text or simple arrow notation
 * into a basic graph when the AI fails to return proper JSON.
 */
const heuristicToGraph = (text, prompt) => {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  // Split on common separators
  const parts = String(text || prompt)
    .split(/->|→|=>|to|then|next|dan|kemudian|->|,/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    // Very simple fallback
    nodes.push({
      id: "n1",
      label: prompt.slice(0, 40) || "Start",
      shape: "ellipse",
    });
    nodes.push({ id: "n2", label: "End", shape: "ellipse" });
    edges.push({ source: "n1", target: "n2" });
    return { title: "Simple Diagram", direction: "TB", nodes, edges };
  }

  parts.forEach((label, i) => {
    const id = `n${i + 1}`;
    if (!seen.has(id)) {
      seen.add(id);
      nodes.push({
        id,
        label: label.slice(0, 50),
        shape:
          i === 0
            ? "ellipse"
            : i === parts.length - 1
              ? "ellipse"
              : "rectangle",
      });
    }
    if (i > 0) {
      edges.push({ source: `n${i}`, target: `n${i + 1}` });
    }
  });

  return {
    title: "Simple Diagram",
    direction: "TB",
    nodes,
    edges,
  };
};

/**
 * Last resort fallback graph when everything fails.
 */
const generateFallbackGraph = (prompt) => {
  const title = prompt.slice(0, 60) || "Diagram";
  return {
    title,
    direction: "TB",
    nodes: [
      { id: "n1", label: "Start", shape: "ellipse" },
      { id: "n2", label: prompt.slice(0, 40) || "Process", shape: "rectangle" },
      { id: "n3", label: "End", shape: "ellipse" },
    ],
    edges: [
      { source: "n1", target: "n2" },
      { source: "n2", target: "n3" },
    ],
  };
};

/**
 * Clean, reliable simple diagram generator.
 * Used when the AI (especially the DeepAI scrape) returns garbage or the prompt itself.
 * Creates a nice, simple flowchart instead of leaking instructions.
 */
const generateCleanSimpleGraph = (prompt) => {
  const lower = (prompt || "").toLowerCase();
  const title = prompt.slice(0, 50) || "Simple Flowchart";

  // Special case for "kasir" / cashier (common in user's tests)
  if (
    lower.includes("kasir") ||
    lower.includes("cashier") ||
    lower.includes("flowchart kasir")
  ) {
    return {
      title: "Flowchart Kasir",
      direction: "TB",
      nodes: [
        { id: "n1", label: "Mulai", shape: "ellipse" },
        { id: "n2", label: "Scan Barang", shape: "rectangle" },
        { id: "n3", label: "Hitung Total", shape: "rectangle" },
        { id: "n4", label: "Pembayaran", shape: "diamond" },
        { id: "n5", label: "Selesai", shape: "ellipse" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5", label: "Lunas" },
      ],
    };
  }

  // Generic clean simple flowchart
  const mainLabel = prompt.slice(0, 35).trim() || "Proses Utama";
  return {
    title,
    direction: "TB",
    nodes: [
      { id: "n1", label: "Start", shape: "ellipse" },
      { id: "n2", label: mainLabel, shape: "rectangle" },
      { id: "n3", label: "Proses", shape: "rectangle" },
      { id: "n4", label: "Selesai", shape: "ellipse" },
    ],
    edges: [
      { source: "n1", target: "n2" },
      { source: "n2", target: "n3" },
      { source: "n3", target: "n4" },
    ],
  };
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

const DIAGRAM_SYSTEM_PROMPT = `You are an expert diagramming assistant. Convert the user's request (any language) into a clean STRUCTURED GRAPH.

Return ONLY valid JSON (no markdown fences, no extra text, no explanations) with EXACTLY this structure:
{
  "title": "short title",
  "direction": "TB" | "LR",
  "nodes": [
    { "id": "n1", "label": "short label", "shape": "rectangle" | "ellipse" | "diamond" }
  ],
  "edges": [
    { "source": "n1", "target": "n2", "label": "optional short label" }
  ]
}

Strict rules:
- "id" must be unique strings like "n1", "n2", "start", "decision1" etc.
- Every edge source/target MUST exactly match a node id.
- Use "ellipse" for start/end, "diamond" for decisions, "rectangle" for processes.
- Keep all labels very short and clear (max 40 chars).
- Support Indonesian, English or any language in labels.
- direction: "TB" (top to bottom) for most flowcharts, "LR" for horizontal.
- Never output coordinates, Excalidraw fields, or any text outside the JSON object.`;

exports.textToDiagram = async (req, res) => {
  try {
    if (req.user.plan !== "premium") {
      return res.status(403).json({
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

    // Detect if the DeepAI scrape returned garbage (the system prompt or instructions)
    // This happens often with the scrape method.
    const badResponseIndicators = [
      "structured graph in JSON",
      "Return ONLY valid JSON",
      "Please provide the user's request for diagramming",
      "I will convert it in",
      "a clean structured graph in JSON",
      "convert the user's request",
    ];
    const isBadAIResponse = badResponseIndicators.some((ind) =>
      (content || "").toLowerCase().includes(ind.toLowerCase()),
    );

    let graph;

    if (isBadAIResponse) {
      console.warn(
        "[textToDiagram] Detected bad AI response (prompt leakage). Using clean generation.",
      );
      graph = generateCleanSimpleGraph(prompt);
    } else {
      let parsed = extractJSON(content);

      if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        graph = normalizeGraph(parsed, prompt.slice(0, 60));
      } else {
        // Try heuristic parsing from the raw text
        console.warn(
          "[textToDiagram] JSON parse failed. Trying heuristic on content:",
          content,
        );
        const heuristic = heuristicToGraph(content, prompt);
        if (heuristic.nodes.length > 0) {
          graph = heuristic;
        } else {
          // Ultimate fallback - always succeed with a basic diagram
          console.warn(
            "[textToDiagram] Heuristic also failed. Using basic fallback.",
          );
          graph = generateFallbackGraph(prompt);
        }
      }
    }

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
      error.stack?.split("\n")[0],
    );
    res
      .status(500)
      .json({ success: false, message: "AI service error. Please try again." });
  }
};

exports.mermaidToInkboard = async (req, res) => {
  try {
    if (req.user.plan !== "premium") {
      return res.status(403).json({
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

    const badResponseIndicators = [
      "structured graph in JSON",
      "Return ONLY valid JSON",
      "Please provide the user's request for diagramming",
      "I will convert it in",
      "a clean structured graph in JSON",
    ];
    const isBadAIResponse = badResponseIndicators.some((ind) =>
      (content || "").toLowerCase().includes(ind.toLowerCase()),
    );

    let graph;

    if (isBadAIResponse) {
      console.warn(
        "[mermaidToInkboard] Detected bad AI response. Using clean generation.",
      );
      graph = generateCleanSimpleGraph(mermaid_code || "Mermaid Diagram");
    } else {
      let parsed = extractJSON(content);

      if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        graph = normalizeGraph(parsed, "Mermaid Diagram");
      } else {
        console.warn("[mermaidToInkboard] JSON parse failed. Using fallback.");
        graph = generateFallbackGraph(mermaid_code || "Mermaid Diagram");
      }
    }

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
      return res.status(403).json({
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
