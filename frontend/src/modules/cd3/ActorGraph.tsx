import { useMemo } from "react";
import { Background, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Cd3State } from "./types";
import { RISK_COLOR } from "./types";
import { useTheme } from "../../lib/themeMode";

const COL: Record<string, number> = { user: 0, contract: 1, relayer: 2, validator: 3, oracle: 2 };

/** Đồ thị cầu nối: tác nhân ↔ hợp đồng, màu nút theo rủi ro tối đa, độ dày cạnh theo số tương tác. */
export default function ActorGraph({ graph, executed }: { graph: Cd3State["graph"]; executed: Record<string, string> }) {
  const { mode } = useTheme();
  const { nodes, edges } = useMemo(() => {
    const rows: Record<number, number> = {};
    const ns: Node[] = graph.nodes.map((n) => {
      const col = COL[n.type] ?? 2;
      const y = n.type === "contract" ? (n.id === "LockVault" ? 90 : 260) : (rows[col] = (rows[col] ?? 0) + 1) * 46 + (n.type === "oracle" ? 150 : 0);
      const c = n.type === "contract" ? "#a78bfa" : RISK_COLOR(n.risk);
      const iso = executed[n.id];
      return {
        id: n.id,
        position: { x: col * 170, y },
        data: { label: `${n.id}${n.type !== "contract" && n.risk >= 0.2 ? ` · ${n.risk.toFixed(2)}` : ""}${iso ? " ⛔" : ""}` },
        style: {
          background: n.type === "contract" ? "rgba(139,92,246,0.25)" : `${c}22`,
          border: `1.5px solid ${c}`,
          color: "rgb(var(--c-slate-100))",
          borderRadius: n.type === "contract" ? 12 : 999,
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          padding: "4px 10px",
          width: n.type === "contract" ? 130 : 96,
          boxShadow: n.risk >= 0.6 ? `0 0 22px -2px ${c}` : undefined,
          opacity: iso ? 0.55 : 1,
        },
      };
    });
    const max = Math.max(1, ...graph.edges.map((e) => e.count));
    const es: Edge[] = graph.edges.map((e, i) => {
      const src = graph.nodes.find((n) => n.id === e.source);
      const risky = (src?.risk ?? 0) >= 0.6;
      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        animated: risky,
        style: { stroke: risky ? "#f43f5e" : "rgba(148,163,184,0.45)", strokeWidth: 0.6 + (2.6 * e.count) / max },
      };
    });
    return { nodes: ns, edges: es };
  }, [graph, executed]);
  return (
    <div className="h-[420px] rounded-xl border border-white/10 bg-surface-0/60">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} zoomOnScroll={false} colorMode={mode}>
        <Background color={mode === "light" ? "rgba(22,20,15,0.1)" : "rgba(255,255,255,0.05)"} gap={22} />
      </ReactFlow>
    </div>
  );
}
