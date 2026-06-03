// src/utils/diagram.js
// Converts a structured graph { title, direction, nodes, edges } returned by the
// AI backend into VALID Excalidraw elements.
//
// Why this exists: LLMs cannot reliably emit raw Excalidraw elements (they lack
// seed/versionNonce/bindings/points). Instead the backend returns a simple graph
// and we build the geometry here, then hand the skeletons to Excalidraw's
// official `convertToExcalidrawElements()` which fills in all required internals
// and wires up arrow ↔ node bindings automatically.

const NODE_W = 200;
const NODE_H = 80;
const GAP_X = 120; // horizontal gap between columns / siblings
const GAP_Y = 120; // vertical gap between rows / levels

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
      level.set(next, Math.max(level.get(next) || 0, (level.get(cur) || 0) + 1));
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

  // Offset everything so the diagram lands in a tidy area of the canvas.
  const OFFSET_X = 120;
  const OFFSET_Y = 120;

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
export function graphToExcalidrawElements(graph, convertToExcalidrawElements) {
  const skeleton = graphToSkeleton(graph);
  if (skeleton.length === 0) return [];
  try {
    return convertToExcalidrawElements(skeleton);
  } catch (err) {
    console.error("graphToExcalidrawElements conversion failed:", err);
    return [];
  }
}
