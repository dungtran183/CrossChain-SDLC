import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useT, type Lang } from "./i18n/useT";
import { MODULES } from "./modules/registry";
import { MODE, checkHealth } from "./lib/api";
import Home from "./pages/Home";

function LangToggle() {
  const { lang, setLang, t } = useT();
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1" aria-label={t("app.language")}>
      {(["vi", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
            lang === l ? "bg-white text-ink-950" : "text-slate-300 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function BackendBadge() {
  const { t } = useT();
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    checkHealth().then(setOk);
  }, []);
  if (MODE === "replay") return <span className="chip">● {t("app.replayMode")}</span>;
  const color = ok === null ? "text-slate-400" : ok ? "text-emerald-400" : "text-rose-400";
  return (
    <span className="chip">
      <span className={color}>●</span> {ok ? t("app.backendOk") : t("app.backendDown")}
    </span>
  );
}

export default function App() {
  const { t } = useT();
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
      <aside className="glass sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="text-lg font-extrabold tracking-tight">{t("app.title")}</div>
          <div className="text-xs text-slate-400">{t("app.subtitle")}</div>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"}`
            }
          >
            {t("app.home")}
          </NavLink>
          {MODULES.map((m) => (
            <NavLink
              key={m.id}
              to={m.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${m.accent} text-[11px] font-extrabold text-ink-950`}
              >
                {m.glyph}
              </span>
              <span>
                <span className="block font-semibold">{t(`${m.id}.name`)}</span>
                <span className="block text-[11px] text-slate-400">{m.id.toUpperCase()}</span>
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-2 text-[11px] leading-snug text-slate-500">{t("app.disclaimer")}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="glass flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <nav className="flex gap-2 md:hidden">
            <NavLink to="/" className="chip">
              {t("app.home")}
            </NavLink>
            {MODULES.map((m) => (
              <NavLink key={m.id} to={m.path} className="chip">
                {t(`${m.id}.name`)}
              </NavLink>
            ))}
          </nav>
          <span className="hidden text-sm text-amber-200/80 md:inline">⚠ {t("app.disclaimer")}</span>
          <div className="flex items-center gap-3">
            <BackendBadge />
            <LangToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                {MODULES.map((m) => (
                  <Route key={m.id} path={m.path} element={<m.Page />} />
                ))}
                <Route path="*" element={<Home />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
