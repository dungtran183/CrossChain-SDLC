import { motion } from "framer-motion";
import { useT } from "../i18n/useT";

type Props = {
  /** Tiền tố key i18n của module, vd "cd1". */
  ns: string;
  accent: string;
  glyph: string;
  phase: string;
};

/** Trang tạm cho module chưa hiện thực: tiêu đề, tóm tắt và các bước/khối kiến trúc dự kiến. */
export default function ModulePlaceholder({ ns, accent, glyph, phase }: Props) {
  const { t, tl } = useT();
  const steps = tl(`${ns}.steps`);

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-5">
        <div
          className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-2xl font-extrabold text-ink-950 shadow-lg`}
        >
          {glyph}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{t(`${ns}.sdlc`)}</span>
            <span className="chip">
              {t("status.phase")} {phase}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t(`${ns}.name`)} <span className="text-slate-400 font-medium">— {t(`${ns}.topic`)}</span>
          </h1>
          <p className="max-w-3xl text-slate-300">{t(`${ns}.summary`)}</p>
        </div>
      </header>

      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            className="glass relative overflow-hidden p-5"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="mb-3 font-mono text-xs text-slate-400">STEP {i + 1}</div>
            <div className="font-semibold">{s}</div>
            <div className="mt-4 h-20 rounded-xl border border-dashed border-white/10 bg-white/[0.02]" />
          </motion.li>
        ))}
      </ol>

      <div className="glass p-6 text-sm text-slate-400">
        {t("status.planned")} · {t("status.phase")} {phase} · docs/modules/{ns.toUpperCase()}.md
      </div>
    </div>
  );
}
