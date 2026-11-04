import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useT } from "../i18n/useT";
import ToyBadge from "./ToyBadge";

type Props = { ns: string; accent: string; glyph: string; actions?: ReactNode; toy?: boolean };

/** Tiêu đề module: biểu tượng gradient phát sáng, chuyên đề, giai đoạn SDLC, tóm tắt. */
export default function ModuleHeader({ ns, accent, glyph, actions, toy = true }: Props) {
  const { t } = useT();
  return (
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 items-start gap-5">
        <motion.div
          initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="relative shrink-0"
        >
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accent} opacity-60 blur-xl`} />
          <div className={`relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-2xl font-extrabold text-ink-950 shadow-lg`}>
            {glyph}
          </div>
        </motion.div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{t(`${ns}.sdlc`)}</span>
            {toy && <ToyBadge />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className={`bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>{t(`${ns}.name`)}</span>{" "}
            <span className="font-medium text-slate-400">— {t(`${ns}.topic`)}</span>
          </h1>
          <p className="max-w-4xl text-sm text-slate-300">{t(`${ns}.summary`)}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
