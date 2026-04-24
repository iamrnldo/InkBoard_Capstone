const axios = require("axios");
const { query } = require("../config/database");

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

const callAI = async (messages, maxTokens = 2000) => {
  const response = await axios.post(
    `${AI_BASE_URL}/chat/completions`,
    {
      model: "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
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
};

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
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt is required" });
    }

    const systemPrompt = `You are an expert diagram creator for Inkboard (similar to Excalidraw). 
    Convert user descriptions into structured diagram data in Excalidraw/Inkboard JSON format.
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "elements": [array of Excalidraw elements],
      "appState": {"viewBackgroundColor": "#ffffff"},
      "files": {}
    }
    
    Each element should follow Excalidraw element format with: id, type, x, y, width, height, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity, text (for text elements), points (for arrows/lines).
    Style: ${style}. Make the diagram clean, well-organized, and visually appealing.`;

    const aiResponse = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a diagram for: ${prompt}` },
      ],
      3000,
    );

    const content = aiResponse.choices[0].message.content;
    let diagramData;
    try {
      const jsonMatch =
        content.match(/```json\n?([\s\S]*?)\n?```/) ||
        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      diagramData = JSON.parse(jsonStr);
    } catch (e) {
      diagramData = {
        elements: [
          {
            id: "text1",
            type: "text",
            x: 100,
            y: 100,
            width: 400,
            height: 50,
            text: content,
            strokeColor: "#000000",
            fontSize: 16,
            fontFamily: 1,
          },
        ],
        appState: { viewBackgroundColor: "#ffffff" },
        files: {},
      };
    }

    await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, 'text_to_diagram', $3, $4, $5, NOW())`,
      [
        req.user.id,
        board_id || null,
        prompt,
        JSON.stringify(diagramData),
        aiResponse.usage?.total_tokens || 0,
      ],
    );

    res.json({
      success: true,
      data: {
        diagram: diagramData,
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
    if (!mermaid_code) {
      return res
        .status(400)
        .json({ success: false, message: "Mermaid code is required" });
    }

    const systemPrompt = `You are an expert at converting Mermaid diagram syntax to Inkboard/Excalidraw JSON format.
    
    Convert the provided Mermaid diagram code into a valid Excalidraw JSON object.
    Return ONLY the JSON with this structure:
    {
      "elements": [array of Excalidraw elements],
      "appState": {"viewBackgroundColor": "#ffffff"},
      "files": {}
    }
    
    Parse the Mermaid syntax carefully and create appropriate shapes, arrows, and text elements.
    Use rectangles for nodes, arrows with labels for edges, and position elements logically.`;

    const aiResponse = await callAI(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Convert this Mermaid diagram to Inkboard format:\n\n${mermaid_code}`,
        },
      ],
      3000,
    );

    const content = aiResponse.choices[0].message.content;
    let diagramData;
    try {
      const jsonMatch =
        content.match(/```json\n?([\s\S]*?)\n?```/) ||
        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      diagramData = JSON.parse(jsonStr);
    } catch (e) {
      diagramData = {
        elements: [],
        appState: { viewBackgroundColor: "#ffffff" },
        files: {},
      };
    }

    await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, 'mermaid_to_inkboard', $3, $4, $5, NOW())`,
      [
        req.user.id,
        board_id || null,
        mermaid_code,
        JSON.stringify(diagramData),
        aiResponse.usage?.total_tokens || 0,
      ],
    );

    res.json({
      success: true,
      data: {
        diagram: diagramData,
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
