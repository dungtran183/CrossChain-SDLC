import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export type StepState = "todo" | "active" | "done" | "error";

type Props = {
  steps: string[];
  states: StepState[];
  accent: string; // gradient
  onSelect?: (i: number) => void;
};

/** Thanh bước có animation: vạch tiến độ chạy, bước hiện tại có vòng sóng. */
export default function Stepper({ steps, states, accent, onSelect }: Props) {
  const doneCount = states.filter((s) => s === "done").length;
  const pct = steps.length > 1 ? Math.min(1, doneCount / (steps.length - 1)) : 0;
  return (
    <div className="relative">
      <div className="absolute left-5 right-5 top-5 h-[2px] rounded bg-white/10" />
      <motion.div
        className={`absolute left-5 top-5 h-[2px] rounded bg-gradient-to-r ${accent}`}
        initial={false}
        animate={{ width: `calc((100% - 2.5rem) * ${pct})` }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <ol className="relative grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const st = states[i] ?? "todo";
          return (
            <li key={s} className="flex flex-col items-center gap-2 text-center">
              <button
                type="button"
                onClick={() => onSelect?.(i)}
                disabled={!onSelect}
                className="relative grid h-10 w-10 place-items-center rounded-full disabled:cursor-default"
              >
                {st === "active" && <span className={`absolute inset-0 animate-pulse-ring rounded-full bg-gradient-to-br ${accent}`} />}
                <motion.span
                  layout
                  className={`relative grid h-10 w-10 place-items-center rounded-full border text-sm font-bold ${
                    st === "done"
                      ? `border-transparent bg-gradient-to-br ${accent} text-ink-950`
                      : st === "error"
                        ? "border-rose-400 bg-rose-500/20 text-rose-200"
                        : st === "active"
                          ? "border-white/60 bg-surface-2 text-white"
                          : "border-white/15 bg-surface-1 text-slate-500"
                  }`}
                  animate={st === "done" ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                >
                  {st === "done" ? <Check className="h-4 w-4" /> : st === "error" ? <X className="h-4 w-4" /> : i + 1}
                </motion.span>
              </button>
              <span className={`text-[11px] leading-tight sm:text-xs ${st === "todo" ? "text-slate-500" : "text-slate-200"}`}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
