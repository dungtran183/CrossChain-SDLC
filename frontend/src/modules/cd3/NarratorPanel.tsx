// Khung "Diễn giải từng tick": mỗi dòng là một câu giải thích bằng lời thường về điều vừa xảy ra.
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { useT } from "../../i18n/useT";
import type { Narr, Tone } from "./narrator";

const TONE: Record<Tone, string> = { ok: "#22c55e", info: "#3d8bff", warn: "#f59e0b", bad: "#ff4b4b", act: "#a26bff" };

/** Điền {biến} vào mẫu câu và in đậm các đoạn **...**. */
export function fill(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 ? (
          <b key={i} className="font-semibold text-slate-100">
            {part}
          </b>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function NarratorPanel({ items }: { items: Narr[] }) {
  const { t } = useT();
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3" data-testid="cd3-narrator">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="label flex items-center gap-1.5">
          <BookOpenText className="h-3.5 w-3.5" /> {t("cd3.nar.title")}
        </span>
        <span className="flex flex-wrap gap-2 text-[10px] text-slate-400">
          {(["ok", "warn", "bad", "act"] as Tone[]).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: TONE[k] }} /> {t(`cd3.nar.tone.${k}`)}
            </span>
          ))}
        </span>
      </div>
      <div className="max-h-56 space-y-1.5 overflow-auto pr-1">
        {items.length === 0 && <p className="text-xs text-slate-400">{t("cd3.nar.empty")}</p>}
        <AnimatePresence initial={false}>
          {items.map((n) => (
            <motion.div key={n.id} layout initial={{ opacity: 0, x: -12, backgroundColor: `${TONE[n.tone]}33` }} animate={{ opacity: 1, x: 0, backgroundColor: `${TONE[n.tone]}0d` }} transition={{ duration: 0.6 }} className="flex gap-2 rounded-lg border-l-4 px-2.5 py-1.5 text-[13px] leading-snug text-slate-300" style={{ borderLeftColor: TONE[n.tone] }}>
              <span className="mt-0.5 shrink-0 font-mono text-[10px] text-slate-500">t{n.tick}</span>
              <span className="min-w-0">
                <Rich text={fill(t(n.key), { ...n.vars, levelName: n.vars.level ? t(`cd3.level.${n.vars.level}`) : "" })} />
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
