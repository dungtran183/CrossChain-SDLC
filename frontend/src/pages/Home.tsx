import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useT } from "../i18n/useT";
import { MODULES } from "../modules/registry";

export default function Home() {
  const { t } = useT();
  return (
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass relative overflow-hidden p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400/30 via-violet-500/30 to-amber-400/30 blur-3xl" />
        <h1 className="max-w-3xl bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">{t("home.heroBody")}</p>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-3">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + 0.1 * i, duration: 0.45 }}
            whileHover={{ y: -4 }}
          >
            <Link to={m.path} className="glass group flex h-full flex-col gap-4 p-6 transition hover:border-white/25">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${m.accent} text-lg font-extrabold text-ink-950`}
                >
                  {m.glyph}
                </div>
                <div>
                  <div className="text-xl font-bold">{t(`${m.id}.name`)}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">{t(`${m.id}.sdlc`)}</div>
                </div>
              </div>
              <div className="font-medium text-slate-200">{t(`${m.id}.topic`)}</div>
              <p className="flex-1 text-sm text-slate-400">{t(`${m.id}.summary`)}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="chip">Phase {m.phase}</span>
                <span className="text-slate-300 transition group-hover:translate-x-1">{t("home.open")} →</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
