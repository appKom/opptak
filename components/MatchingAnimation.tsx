import React, { useEffect, useRef, useState } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const NL = 6;
const NR = 6;
const W = 420;
const H = 290;
const NODE_R = 14;
const HEX_SIZE = 50;
const HEX_PAD = 30;

// ── Types ────────────────────────────────────────────────────────────────────
type NodeId = number;
type EdgeId = number;

interface GNode {
  id: NodeId;
  x: number;
  y: number;
  side: "L" | "R";
}

interface GEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
}

interface EdgePos {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface NodePos {
  x: number;
  y: number;
}

interface AnimFrame {
  visNodes: ReadonlySet<NodeId>;
  visEdges: ReadonlySet<EdgeId>;
  matchedEdges: ReadonlySet<EdgeId>;
  exploredEdge: EdgeId | null;
  pathMatchedEdges: ReadonlySet<EdgeId>;
  sourceNode: NodeId | null;
  edgeOverrides: ReadonlyMap<EdgeId, EdgePos>;
  nodeOverrides: ReadonlyMap<NodeId, NodePos>;
  ms: number;
}

// ── Seeded RNG ───────────────────────────────────────────────────────────────
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Hex grid ─────────────────────────────────────────────────────────────────
function hexPoints(): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  const colStep = Math.sqrt(3) * HEX_SIZE;
  const rowStep = 1.5 * HEX_SIZE;
  for (let row = 0; HEX_PAD + row * rowStep <= H - HEX_PAD; row++) {
    const y = HEX_PAD + row * rowStep;
    const xOffset = (row % 2) * (colStep / 2);
    for (let col = 0; HEX_PAD + xOffset + col * colStep <= W - HEX_PAD; col++) {
      pts.push({ x: HEX_PAD + xOffset + col * colStep, y });
    }
  }
  return pts;
}

const HEX_POINTS = hexPoints(); // 18 candidate positions

// ── Graph builder ────────────────────────────────────────────────────────────
function buildGraph(seed: number): { nodes: GNode[]; edges: GEdge[] } {
  const rng = mulberry32(seed);

  const pts = [...HEX_POINTS];
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  const nodes: GNode[] = [];
  for (let i = 0; i < NL; i++)
    nodes.push({ id: i, x: pts[i].x, y: pts[i].y, side: "L" });
  for (let i = 0; i < NR; i++)
    nodes.push({ id: NL + i, x: pts[NL + i].x, y: pts[NL + i].y, side: "R" });

  const edges: GEdge[] = [];
  let eid = 0;
  for (let l = 0; l < NL; l++) {
    const selected = new Set<number>();
    while (selected.size < 2) selected.add(Math.floor(rng() * NR));
    for (const r of selected) edges.push({ id: eid++, from: l, to: NL + r });
  }

  return { nodes, edges };
}

// ── Easing ───────────────────────────────────────────────────────────────────
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

const easeIn = (t: number) => t * t;

// ── Frame computation ────────────────────────────────────────────────────────
function computeFrames(nodes: GNode[], edges: GEdge[]): AnimFrame[] {
  const frames: AnimFrame[] = [];

  const visNodes = new Set<NodeId>();
  const visEdges = new Set<EdgeId>();
  const matchedEdges = new Set<EdgeId>();
  const pathMatchedEdges = new Set<EdgeId>();
  let exploredEdge: EdgeId | null = null;
  let sourceNode: NodeId | null = null;
  let edgeOverrides = new Map<EdgeId, EdgePos>();
  let nodeOverrides = new Map<NodeId, NodePos>();

  const snap = (ms: number) => {
    frames.push({
      visNodes: new Set(visNodes),
      visEdges: new Set(visEdges),
      matchedEdges: new Set(matchedEdges),
      exploredEdge,
      pathMatchedEdges: new Set(pathMatchedEdges),
      sourceNode,
      edgeOverrides: new Map(edgeOverrides),
      nodeOverrides: new Map(nodeOverrides),
      ms,
    });
  };

  // Phase 1 – spawn nodes
  for (let i = 0; i < NL + NR; i++) {
    visNodes.add(i);
    snap(160);
  }
  snap(350);

  // Phase 2 – spawn edges
  for (const e of edges) {
    visEdges.add(e.id);
    snap(120);
  }
  snap(500);

  // Phase 3 – matching algorithm
  const adj = new Map<NodeId, GEdge[]>();
  for (let l = 0; l < NL; l++) adj.set(l, []);
  for (const e of edges) adj.get(e.from)!.push(e);

  const matchR = new Map<NodeId, NodeId>();

  const syncMatchedEdges = () => {
    matchedEdges.clear();
    for (const e of edges) {
      if (matchR.get(e.to) === e.from) matchedEdges.add(e.id);
    }
  };

  const findMatchedEdge = (from: NodeId, to: NodeId) =>
    edges.find((e) => e.from === from && e.to === to);

  for (let l = 0; l < NL; l++) {
    const visited = new Set<NodeId>();
    sourceNode = l;
    exploredEdge = null;
    snap(350);

    let dfs: (u: NodeId) => boolean;
    dfs = (u: NodeId): boolean => {
      for (const e of adj.get(u) ?? []) {
        if (visited.has(e.to)) continue;
        visited.add(e.to);
        exploredEdge = e.id;
        snap(380);

        if (!matchR.has(e.to)) {
          matchR.set(e.to, u);
          return true;
        }

        const prevLeft = matchR.get(e.to)!;
        const displaced = findMatchedEdge(prevLeft, e.to);
        if (displaced) pathMatchedEdges.add(displaced.id);

        if (dfs(prevLeft)) {
          matchR.set(e.to, u);
          if (displaced) pathMatchedEdges.delete(displaced.id);
          return true;
        }
        if (displaced) pathMatchedEdges.delete(displaced.id);
      }
      return false;
    };

    const success = dfs(l);
    exploredEdge = null;
    pathMatchedEdges.clear();
    if (success) {
      syncMatchedEdges();
      snap(550);
    } else {
      snap(250);
    }
    sourceNode = null;
    snap(150);
  }

  // ── End phase ────────────────────────────────────────────────────────────

  // Pause on completed matching
  snap(900);

  // Fade out unmatched edges
  for (const e of edges) {
    if (!matchedEdges.has(e.id)) visEdges.delete(e.id);
  }
  snap(280);

  // Fade out unmatched nodes
  const matchedNodeIds = new Set<NodeId>();
  for (const e of edges) {
    if (matchedEdges.has(e.id)) {
      matchedNodeIds.add(e.from);
      matchedNodeIds.add(e.to);
    }
  }
  for (const nid of [...visNodes]) {
    if (!matchedNodeIds.has(nid)) visNodes.delete(nid);
  }
  snap(280);

  // Brief pause with only matched pairs visible
  snap(350);

  // Pre-compute geometry for each matched pair, sorted top-to-bottom by midY
  // so the spread animation doesn't cause unnecessary crossings.
  const matchedPairs = edges.filter((e) => matchedEdges.has(e.id));
  const pairData = matchedPairs
    .map((e) => {
      const fn = nodes[e.from];
      const tn = nodes[e.to];
      const dx = tn.x - fn.x;
      const dy = tn.y - fn.y;
      const halfLen = Math.hypot(dx, dy) / 2;
      const midX = (fn.x + tn.x) / 2;
      const midY = (fn.y + tn.y) / 2;
      const angle = Math.atan2(dy, dx);
      return { e, halfLen, midX, midY, angle };
    })
    .sort((a, b) => a.midY - b.midY);

  // Evenly distribute target Y positions so no two edges share the same row
  const n = pairData.length;
  const SPREAD_TOP = 42;
  const SPREAD_BOT = H - 42;
  const targetYs = pairData.map((_, i) =>
    n === 1 ? H / 2 : SPREAD_TOP + (i * (SPREAD_BOT - SPREAD_TOP)) / (n - 1),
  );

  // Rotate to horizontal while simultaneously moving each pair to its target Y
  const ROT_STEPS = 14;
  for (let fi = 1; fi <= ROT_STEPS; fi++) {
    const ease = easeInOut(fi / ROT_STEPS);
    edgeOverrides = new Map();
    nodeOverrides = new Map();
    for (let i = 0; i < pairData.length; i++) {
      const { e, halfLen, midX, midY, angle } = pairData[i];
      const cy = midY + (targetYs[i] - midY) * ease;
      const a = angle * (1 - ease);
      const x1 = midX - halfLen * Math.cos(a);
      const y1 = cy - halfLen * Math.sin(a);
      const x2 = midX + halfLen * Math.cos(a);
      const y2 = cy + halfLen * Math.sin(a);
      edgeOverrides.set(e.id, { x1, y1, x2, y2 });
      nodeOverrides.set(e.from, { x: x1, y: y1 });
      nodeOverrides.set(e.to, { x: x2, y: y2 });
    }
    snap(42);
  }

  // Fly off to the right from the spread positions
  const FLY_STEPS = 12;
  for (let fi = 1; fi <= FLY_STEPS; fi++) {
    const ease = easeIn(fi / FLY_STEPS);
    const xShift = ease * (W + NODE_R * 2 + 60);
    edgeOverrides = new Map();
    nodeOverrides = new Map();
    for (let i = 0; i < pairData.length; i++) {
      const { e, halfLen, midX } = pairData[i];
      const y = targetYs[i];
      const x1 = midX - halfLen + xShift;
      const x2 = midX + halfLen + xShift;
      edgeOverrides.set(e.id, { x1, y1: y, x2, y2: y });
      nodeOverrides.set(e.from, { x: x1, y });
      nodeOverrides.set(e.to, { x: x2, y });
    }
    snap(38);
  }

  // Clear: elements are off-screen, fade opacity to 0
  visNodes.clear();
  visEdges.clear();
  matchedEdges.clear();
  snap(400);

  // Pause before next iteration
  snap(300);

  return frames;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MatchingAnimation() {
  const seedRef = useRef(42);
  const graphRef = useRef(buildGraph(seedRef.current));
  const framesRef = useRef(
    computeFrames(graphRef.current.nodes, graphRef.current.edges),
  );
  const frameIdxRef = useRef(0);
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    frameIdxRef.current = 0;

    const advance = () => {
      const nextIdx = (frameIdxRef.current + 1) % framesRef.current.length;

      if (nextIdx === 0) {
        seedRef.current += 1;
        const newGraph = buildGraph(seedRef.current);
        graphRef.current = newGraph;
        framesRef.current = computeFrames(newGraph.nodes, newGraph.edges);
      }

      frameIdxRef.current = nextIdx;
      setTick((t) => t + 1);
      timerRef.current = setTimeout(
        advance,
        framesRef.current[frameIdxRef.current].ms,
      );
    };

    timerRef.current = setTimeout(advance, framesRef.current[0].ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const frame = framesRef.current[frameIdxRef.current];
  const { nodes, edges } = graphRef.current;

  const isNodeMatched = (id: NodeId) =>
    edges.some(
      (e) => frame.matchedEdges.has(e.id) && (e.from === id || e.to === id),
    );

  const isNodeOnPath = (id: NodeId) => {
    if (frame.sourceNode === id) return true;
    return edges.some(
      (e) =>
        (frame.exploredEdge === e.id || frame.pathMatchedEdges.has(e.id)) &&
        (e.from === id || e.to === id),
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full py-2">
      <p className="text-lg text-center text-gray-800 animate-pulse">
        Kjører matching-algoritme...
        <br />
        Vennligst vent
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: 400, height: "auto", overflow: "hidden" }}
        aria-label="Matching animation"
      >
        {/* Edges */}
        {edges.map((e) => {
          const ovr = frame.edgeOverrides.get(e.id);
          const x1 = ovr?.x1 ?? nodes[e.from].x;
          const y1 = ovr?.y1 ?? nodes[e.from].y;
          const x2 = ovr?.x2 ?? nodes[e.to].x;
          const y2 = ovr?.y2 ?? nodes[e.to].y;

          const visible = frame.visEdges.has(e.id);
          const matched = frame.matchedEdges.has(e.id);
          const explored = frame.exploredEdge === e.id;
          const onPath = frame.pathMatchedEdges.has(e.id);

          let stroke = "#d1d5db";
          let strokeWidth = 1.5;
          let dash: string | undefined;
          if (explored) {
            stroke = "#f97316";
            strokeWidth = 2.5;
            dash = "6 3";
          } else if (onPath) {
            stroke = "#f97316";
            strokeWidth = 3;
          } else if (matched) {
            stroke = "#005577";
            strokeWidth = 3;
          }

          return (
            <line
              key={e.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              opacity={visible ? 1 : 0}
              style={{
                transition: "opacity 0.18s, stroke 0.2s, stroke-width 0.2s",
              }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const ovr = frame.nodeOverrides.get(node.id);
          const cx = ovr?.x ?? node.x;
          const cy = ovr?.y ?? node.y;

          const visible = frame.visNodes.has(node.id);
          const isSource = frame.sourceNode === node.id;
          const matched = isNodeMatched(node.id);
          const onPath = !isSource && isNodeOnPath(node.id);

          const fill = isSource
            ? "#f97316"
            : onPath
            ? "#fb923c"
            : matched
            ? "#005577"
            : "#94a3b8";

          return (
            <circle
              key={node.id}
              cx={cx}
              cy={cy}
              r={NODE_R}
              fill={fill}
              stroke="white"
              strokeWidth={2}
              opacity={visible ? 1 : 0}
              style={{ transition: "opacity 0.22s, fill 0.25s" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
