// src/utils/diagram.js
// Converts a structured graph { title, direction, nodes, edges } returned by the
// AI backend into VALID Excalidraw elements.
//
// Why this exists: LLMs cannot reliably emit raw Excalidraw elements (they lack
// seed/versionNonce/bindings/points). Instead the backend returns a simple graph
// and we build the geometry here, then hand the skeletons to Excalidraw's
// official `convertToExcalidrawElements()` which fills in all required internals
// and wires up arrow ↔ node bindings automatically.

const NODE_W = 160;
const NODE_H = 60;
const GAP_X = 150; // horizontal gap between columns / siblings
const GAP_Y = 90; // vertical gap between rows / levels - tighter for 5-node flows to avoid clipping and improve fit in view

/**
 * Compute a simple layered layout (BFS levels) so nodes don't overlap.
 * Returns a Map<nodeId, {x, y}>.
 */
function layout(nodes, edges, direction) {
  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const indeg = new Map(ids.map((id) => [id, 0]));
  const adj = new Map(ids.map((id) => [id, []]));

  edges.forEach((e) => {
    if (idSet.has(e.source) && idSet.has(e.target)) {
      adj.get(e.source).push(e.target);
      indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
    }
  });

  // Assign a "level" to each node via longest-path-ish BFS from roots.
  const level = new Map(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => (indeg.get(id) || 0) === 0);
  if (queue.length === 0 && ids.length) queue.push(ids[0]); // cycle fallback

  const visited = new Set();
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const next of adj.get(cur) || []) {
      level.set(
        next,
        Math.max(level.get(next) || 0, (level.get(cur) || 0) + 1),
      );
      if (!visited.has(next)) queue.push(next);
    }
  }
  // Any nodes never reached (disconnected) keep level 0.
  ids.forEach((id) => {
    if (!level.has(id)) level.set(id, 0);
  });

  // Group nodes by level, then position within each level.
  const byLevel = new Map();
  ids.forEach((id) => {
    const lv = level.get(id) || 0;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv).push(id);
  });

  const pos = new Map();
  const isLR = direction === "LR";
  for (const [lv, group] of byLevel.entries()) {
    group.forEach((id, idx) => {
      if (isLR) {
        // levels go left→right, siblings stack vertically
        pos.set(id, {
          x: lv * (NODE_W + GAP_X),
          y: idx * (NODE_H + GAP_Y),
        });
      } else {
        // levels go top→bottom, siblings spread horizontally
        pos.set(id, {
          x: idx * (NODE_W + GAP_X),
          y: lv * (NODE_H + GAP_Y),
        });
      }
    });
  }
  return pos;
}

/**
 * Build Excalidraw element skeletons from a graph.
 * @param {{title?:string, direction?:string, nodes:Array, edges:Array}} graph
 * @returns {Array} skeleton elements for convertToExcalidrawElements()
 */
export function graphToSkeleton(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  if (nodes.length === 0) return [];

  const direction = graph?.direction === "LR" ? "LR" : "TB";
  const pos = layout(nodes, edges, direction);

  // Offset everything so the diagram lands in a tidy area of the canvas. (matched to manual for consistency)
  const OFFSET_X = 100;
  const OFFSET_Y = 50;

  const elements = [];

  // Nodes: each shape carries a bound label so text stays centered inside it.
  nodes.forEach((n) => {
    const p = pos.get(n.id) || { x: 0, y: 0 };
    const type =
      n.shape === "ellipse"
        ? "ellipse"
        : n.shape === "diamond"
          ? "diamond"
          : "rectangle";
    elements.push({
      id: n.id, // referenced by edges below
      type,
      x: OFFSET_X + p.x,
      y: OFFSET_Y + p.y,
      width: NODE_W,
      height: NODE_H,
      strokeColor: "#1e1e1e",
      backgroundColor: type === "diamond" ? "#fff3bf" : "#e7f5ff",
      label: {
        text: n.label || n.id,
        fontSize: 16,
      },
    });
  });

  // Edges: arrows bound to start/end nodes via `start`/`end` ids.
  edges.forEach((e) => {
    if (!pos.has(e.source) || !pos.has(e.target)) return;
    const arrow = {
      type: "arrow",
      x: 0,
      y: 0,
      strokeColor: "#1e1e1e",
      start: { id: e.source },
      end: { id: e.target },
    };
    if (e.label) {
      arrow.label = { text: e.label, fontSize: 14 };
    }
    elements.push(arrow);
  });

  return elements;
}

/**
 * Convert a graph into ready-to-render Excalidraw elements.
 * Requires the live module so we can use the official converter (which fills in
 * seed/versionNonce/bindings). Falls back to [] if anything is off.
 * @param {object} graph
 * @param {Function} convertToExcalidrawElements  from "@excalidraw/excalidraw"
 */
/**
 * Simple manual creator for basic diagram elements.
 * This is a reliable fallback that always produces renderable elements
 * without depending on the converter.
 */
function createManualElements(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  if (nodes.length === 0) return [];

  const direction = graph?.direction === "LR" ? "LR" : "TB";
  const pos = layout(nodes, edges, direction); // reuse the smart BFS layout for neat flow (like Lucidchart)

  // Tighter offsets + gaps so 5-node vertical flows (like kasir/kafe) fit fully in view without clipping at bottom
  // and lines/text/shapes have better balanced penataan (spacing, alignment)
  const OFFSET_X = 100;
  const OFFSET_Y = 50;

  const elements = [];
  const idToPos = new Map();

  // Use proper layout positions ...
  nodes.forEach((n) => {
    const p = pos.get(n.id) || { x: 0, y: 0 };
    let x = OFFSET_X + p.x;
    let y = OFFSET_Y + p.y;

    idToPos.set(n.id, { x, y });

    const isEllipse = n.shape === "ellipse";
    const isDiamond = n.shape === "diamond";

    let shapeHeight = NODE_H;
    let textYOffset = 12;
    let textHeight = NODE_H - 18;

    if (isDiamond) {
      // Diamonds are pointy - make them a bit taller and adjust text so label "Pembayaran" etc. is visible and centered inside
      shapeHeight = NODE_H + 18; // ~78px tall for better text room
      textYOffset = 18;
      textHeight = 50;
      // center the diamond horizontally a bit if needed (keep x)
    }

    // Shape
    const shape = {
      id: `shape-${n.id}`,
      type: isEllipse ? "ellipse" : isDiamond ? "diamond" : "rectangle",
      x,
      y,
      width: NODE_W,
      height: shapeHeight,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: isDiamond ? "#fff3bf" : "#e7f5ff",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
    };
    elements.push(shape);

    // Text label inside the shape - better padding for centering in ovals/rects/diamonds
    const text = {
      id: `text-${n.id}`,
      type: "text",
      x: x + 6,
      y: y + textYOffset,
      width: NODE_W - 12,
      height: textHeight,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      text: n.label || n.id,
      fontSize: 13,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      containerId: shape.id,
      originalText: n.label || n.id,
      lineHeight: 1.2,
    };
    elements.push(text);

    // Bind text to shape
    shape.boundElements.push({ type: "text", id: text.id });
  });

  // Arrows using the proper layout positions (straight vertical/horizontal lines for clean penataan)
  // Key fix: offset arrow start to AFTER the "from" shape (bottom for TB vertical) so the visible line segment
  // sits between shapes, not overlapping them. This makes lines much cleaner ("tidak amburadul").
  edges.forEach((e) => {
    const from = idToPos.get(e.source);
    const to = idToPos.get(e.target);
    if (!from || !to) return;

    const dx = to.x - from.x;
    let arrowStartY = from.y + NODE_H; // start the arrow line below the upper shape (for vertical TB flows)
    let dy = to.y - arrowStartY;

    // For horizontal (LR) or mixed, fall back to simple center-to-center delta
    if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
      arrowStartY = from.y;
      dy = to.y - from.y;
    }

    const arrowX = Math.min(from.x, to.x);
    const arrowY = Math.min(from.y, arrowStartY);

    const arrow = {
      id: `arrow-${e.source}-${e.target}`,
      type: "arrow",
      x: arrowX - 5,
      y: arrowY - 5,
      width: Math.abs(dx) + 20,
      height: Math.abs(dy) + 20,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [dx, dy], // exact delta → perfectly straight vertical lines for TB flow
      ],
      lastCommittedPoint: null,
      startBinding: { elementId: `shape-${e.source}`, focus: 0, gap: 6 },
      endBinding: { elementId: `shape-${e.target}`, focus: 0, gap: 6 },
      startArrowhead: null,
      endArrowhead: "arrow",
    };

    if (e.label) {
      arrow.label = {
        text: e.label,
        fontSize: 11,
      };
    }

    elements.push(arrow);
  });

  return elements;
}

/**
 * Convert a graph into ready-to-render Excalidraw elements.
 * Tries the official converter first, falls back to manual creation if it fails.
 */
export function graphToExcalidrawElements(graph, convertToExcalidrawElements) {
  const skeleton = graphToSkeleton(graph);
  if (skeleton.length === 0) return [];

  // Try official converter only if provided and is function
  if (typeof convertToExcalidrawElements === "function") {
    try {
      const result = convertToExcalidrawElements(skeleton);
      if (result && result.length > 0) {
        return result;
      }
    } catch (err) {
      console.warn(
        "[Diagram] Official converter failed, using manual fallback:",
        err.message,
      );
    }
  }

  // Reliable manual fallback (always works)
  console.warn("[Diagram] Using manual element creation for compatibility.");
  return createManualElements(graph);
}
