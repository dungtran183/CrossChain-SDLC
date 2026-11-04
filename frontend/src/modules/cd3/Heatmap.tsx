import { motion } from "framer-motion";
import { RISK_COLOR } from "./types";

/** Heatmap CRS tác nhân × tuyến; ô sáng/nhịp khi rủi ro cao; bấm để chọn chuỗi r(t). */
export default function Heatmap({ actors, corridors, matrix, selected, onSelect }: { actors: string[]; corridors: string[]; matrix: number[][]; selected: string | null; onSelect: (k: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-[11px]">
        <thead>
          <tr>
            <th />
            {corridors.map((c) => (
              <th key={c} className="px-1 font-semibold text-slate-300">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actors.map((a, i) => (
            <tr key={a}>
              <td className="pr-1 text-right font-mono text-slate-400">{a}</td>
              {corridors.map((c, j) => {
                const r = matrix[i]?.[j] ?? 0;
                const key = `${a}|${c}`;
                return (
                  <td key={c} className="p-0">
                    <motion.button
                      onClick={() => onSelect(key)}
                      className={`h-5 w-full rounded ${selected === key ? "ring-2 ring-white" : ""} ${r >= 0.75 ? "animate-pulse" : ""}`}
                      animate={{ backgroundColor: RISK_COLOR(r), opacity: 0.25 + 0.75 * Math.min(1, r * 1.3 + 0.05) }}
                      transition={{ duration: 0.5 }}
                      title={`${key}: r = ${r.toFixed(3)}`}
                    >
                      <span className="font-mono text-[9px] text-ink-950">{r >= 0.1 ? r.toFixed(2) : ""}</span>
                    </motion.button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
