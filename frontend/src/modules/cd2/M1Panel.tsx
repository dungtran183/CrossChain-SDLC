import { useMemo } from "react";
import { motion } from "framer-motion";
import { Background, ReactFlow, type Edge, type Node, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Check, Minus, Network, Text, Workflow } from "lucide-react";
import type { M1Res } from "./types";
import { useT } from "../../i18n/useT";

const TYPE_STYLE: Record<string, { bg: string; border: string; col: number }> = {
  modifier: { bg: "rgba(96,165,250,0.15)", border: "#60a5fa", col: 0 },
  require: { bg: "rgba(52,211,153,0.12)", border: "#34d399", col: 0 },
  contract: { bg: "rgba(139,92,246,0.3)", border: "#a78bfa", col: 1 },
  function: { bg: "rgba(139,92,246,0.18)", border: "#8b5cf6", col: 1 },
  state: { bg: "rgba(251,191,36,0.12)", border: "#fbbf24", col: 2 },
  event: { bg: "rgba(244,114,182,0.12)", border: "#f472b6", col: 2 },
  external: { bg: "rgba(251,113,133,0.15)", border: "#fb7185", col: 2 },
};
const EDGE_COLOR: Record<string, string> = { defines: "#64748b", guards: "#60a5fa", checks: "#34d399", writes: "#fbbf24", reads: "#a3a3a3", emits: "#f472b6", calls: "#fb7185" };

function layout(m1: M1Res): { nodes: Node[]; edges: Edge[] } {
  const cols: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  const nodes: Node[] = m1.graph.nodes.map((n) => {
    const st = TYPE_STYLE[n.type] ?? TYPE_STYLE.function;
    const col = st.col;
    const y = n.type === "contract" ? -70 : cols[col]++ * 52;
    return {
      id: n.id,
      position: { x: col * 250, y },
      data: { label: n.label },
      style: {
        background: st.bg,
        border: `1px solid ${st.border}`,
        color: "#e2e8f0",
        borderRadius: 10,
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        padding: "4px 8px",
        width: 200,
        boxShadow: n.type === "contract" ? `0 0 24px -6px ${st.border}` : undefined,
      },
    };
  });
  const edges: Edge[] = m1.graph.edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    animated: e.kind === "calls" || e.kind === "writes",
    style: { stroke: EDGE_COLOR[e.kind] ?? "#64748b", strokeWidth: 1.3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR[e.kind] ?? "#64748b", width: 14, height: 14 },
  }));
  return { nodes, edges };
}

/** M1 · biểu diễn đa nguồn: đồ thị cấu trúc (≈CPG), văn bản (token), tương tác liên chuỗi. */
export default function M1Panel({ m1 }: { m1: M1Res }) {
  const { t } = useT();
  const g = useMemo(() => layout(m1), [m1]);
  const maxTop = Math.max(...m1.tokens.top.map((x) => x.n), 1);
  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-xl border border-white/10 bg-ink-950/60">
        <div className="flex items-center justify-between px-3 py-2 text-xs">
          <span className="flex items-center gap-2 font-semibold">
            <Workflow className="h-3.5 w-3.5 text-violet-300" /> {t("cd2.m1.structure")}
          </span>
          <span className="text-slate-400">
            {m1.graph.nodes.length} nodes · {m1.graph.edges.length} edges
          </span>
        </div>
        <div className="h-[420px]">
          <ReactFlow nodes={g.nodes} edges={g.edges} fitView proOptions={{ hideAttribution: true }} nodesDraggable panOnScroll={false} zoomOnScroll={false} colorMode="dark">
            <Background color="rgba(255,255,255,0.06)" gap={20} />
          </ReactFlow>
        </div>
        <div className="flex flex-wrap gap-2 px-3 pb-3 text-[10px]">
          {Object.entries(EDGE_COLOR).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1 text-slate-400">
              <span className="h-0.5 w-4" style={{ background: c }} />
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
            <Network className="h-3.5 w-3.5 text-violet-300" /> {t("cd2.m1.interaction")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {m1.interactions.map((x, i) => (
              <motion.span
                key={x.kind}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${x.present ? "border-violet-400/50 bg-violet-500/15 text-violet-100" : "border-white/10 text-slate-500 line-through"}`}
              >
                {x.present ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {x.kind}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2">
              <Text className="h-3.5 w-3.5 text-violet-300" /> {t("cd2.m1.text")}
            </span>
            <span className="font-normal text-slate-400">
              {m1.tokens.count} tokens · {m1.tokens.unique} unique
            </span>
          </div>
          <div className="space-y-1">
            {m1.tokens.top.map((x, i) => (
              <div key={x.token} className="flex items-center gap-2 text-[11px]">
                <span className="w-28 truncate font-mono text-slate-300">{x.token}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" initial={{ width: 0 }} animate={{ width: `${(x.n / maxTop) * 100}%` }} transition={{ delay: i * 0.04 }} />
                </div>
                <span className="w-6 text-right font-mono text-slate-500">{x.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {["functions", "state_vars", "guards"].map((k) => (
            <div key={k} className="rounded-xl bg-white/[0.03] py-2">
              <div className="text-xl font-bold">{m1.graph.stats[k]}</div>
              <div className="text-[10px] text-slate-400">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
