import { motion } from "framer-motion";
import { short } from "../../lib/types";

/** Cây Merkle thu nhỏ: lá dưới cùng → gốc trên cùng; lá được chọn và đường chứng minh được tô sáng. */
export default function MerkleView({ tree, highlight }: { tree: string[][]; highlight?: number | null }) {
  if (!tree.length) return null;
  const levels = [...tree].reverse(); // gốc trước
  const path = new Set<string>();
  if (highlight !== null && highlight !== undefined) {
    let idx = highlight;
    for (let l = 0; l < tree.length; l++) {
      path.add(`${l}:${idx}`);
      idx = Math.floor(idx / 2);
    }
  }
  return (
    <div className="space-y-2">
      {levels.map((lvl, li) => {
        const level = tree.length - 1 - li;
        return (
          <div key={li} className="flex justify-center gap-1.5">
            {lvl.map((hsh, i) => {
              const on = path.has(`${level}:${i}`);
              const isRoot = level === tree.length - 1;
              return (
                <motion.div
                  key={`${level}-${i}-${hsh}`}
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.06 * (tree.length - li) + 0.03 * i }}
                  title={hsh}
                  className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${
                    isRoot
                      ? "border-cyan-300/70 bg-cyan-400/20 text-cyan-100 shadow-[0_0_16px_-4px_#22d3ee]"
                      : on
                        ? "border-teal-300/60 bg-teal-400/15 text-teal-100"
                        : "border-white/10 bg-white/[0.03] text-slate-400"
                  }`}
                >
                  {isRoot ? "root " : level === 0 ? `S${i + 1} ` : ""}
                  {short(hsh, 3)}
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
