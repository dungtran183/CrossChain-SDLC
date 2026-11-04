import { Suspense, lazy, useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, FlaskConical, GitBranch, House, Menu, Moon, Sun, X } from "lucide-react";
import { useT, type Lang } from "./i18n/useT";
import { MODULES } from "./modules/registry";
import { MODE, checkHealth } from "./lib/api";
import Home from "./pages/Home";
import ParticleField from "./components/fx/ParticleField";
import ActivityDock, { ScrollProgress } from "./components/ActivityDock";
import { Loading } from "./components/States";
import { useToast } from "./components/Toast";
import { onQuest } from "./lib/progress";
import { useTheme } from "./lib/themeMode";

const Playground = lazy(() => import("./pages/Playground"));
const Incidents = lazy(() => import("./pages/Incidents"));
const REPO = "https://github.com/dungtran183/CrossChain-SDLC";

function LangToggle() {
  const { lang, setLang, t } = useT();
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1" aria-label={t("app.language")}>
      {(["vi", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`relative rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${lang === l ? "text-surface-0" : "text-slate-300 hover:text-white"}`}
        >
          {lang === l && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-white" />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const { t } = useT();
  return (
    <button onClick={toggle} className="btn-brut grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" title={t(mode === "light" ? "app.toDark" : "app.toLight")} aria-label={t(mode === "light" ? "app.toDark" : "app.toLight")}>
      {mode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

function ModeBadge() {
  const { t } = useT();
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    if (MODE === "replay") return;
    let alive = true;
    const ping = () => checkHealth().then((v) => alive && setOk(v));
    ping();
    const id = setInterval(ping, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  if (MODE === "replay") return null;
  const color = ok === null ? "bg-slate-400" : ok ? "bg-emerald-400" : "bg-rose-400";
  return (
    <span className="chip" title={ok ? "" : t("common.backendHint")}>
      <span className="relative flex h-2 w-2">
        {ok && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-70`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      {t("app.liveMode")} · {ok ? t("app.backendOk") : ok === null ? "…" : t("app.backendDown")}
    </span>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const item = (active: boolean) => `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"}`;
  return (
    <nav className="flex flex-col gap-1">
      <NavLink to="/" end onClick={onNavigate} className={({ isActive }) => item(isActive)}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
          <House className="h-4 w-4" />
        </span>
        {t("app.home")}
      </NavLink>
      <div className="label mt-4 mb-1 px-3">{t("app.modules")}</div>
      {MODULES.map((m) => (
        <NavLink key={m.id} to={m.path} onClick={onNavigate} className={({ isActive }) => item(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="nav-active" className={`absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b ${m.accent}`} />}
              <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${m.accent} text-[11px] font-extrabold text-ink-950 shadow-lg transition group-hover:scale-110`}>{m.glyph}</span>
              <span className="min-w-0">
                <span className="block font-semibold">{t(`${m.id}.name`)}</span>
                <span className="block truncate text-[11px] text-slate-400">{t(`${m.id}.short`)}</span>
              </span>
            </>
          )}
        </NavLink>
      ))}
      <div className="label mt-4 mb-1 px-3">{t("app.tools")}</div>
      <NavLink to="/incidents" onClick={onNavigate} className={({ isActive }) => item(isActive)}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15">
          <Flame className="h-4 w-4 text-rose-300" />
        </span>
        {t("inc.nav")}
      </NavLink>
      <NavLink to="/playground" onClick={onNavigate} className={({ isActive }) => item(isActive)}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
          <FlaskConical className="h-4 w-4" />
        </span>
        {t("app.playground")}
      </NavLink>
    </nav>
  );
}

const PARTICLES_LIGHT = ["22,20,15", "61,139,255", "162,107,255"];

export default function App() {
  const { t } = useT();
  const { mode } = useTheme();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const toast = useToast();

  // Thông báo "hoàn thành nhiệm vụ" kiểu game
  useEffect(
    () =>
      onQuest((id) => {
        if (id) toast({ kind: "info", title: t("world.questDone"), body: t(`quest.${id}`) });
      }),
    [toast, t],
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      <ScrollProgress />
      <ActivityDock />
      <ParticleField key={mode} className="fixed inset-0 -z-10 h-full w-full opacity-70" colors={mode === "light" ? PARTICLES_LIGHT : undefined} density={mode === "light" ? 0.6 : 1} />
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-3 py-4 sm:px-5 lg:py-6">
        <aside className="glass sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col p-4 lg:flex">
          <div className="mb-6 px-2">
            <div className="brand-title bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 bg-clip-text font-display text-base font-extrabold leading-tight tracking-tight text-transparent">{t("app.title")}</div>
            <div className="text-xs text-slate-400">{t("app.subtitle")}</div>
          </div>
          <NavItems />
          <div className="mt-auto space-y-3 px-2">
            <a href={REPO} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white">
              <GitBranch className="h-3.5 w-3.5" /> {t("app.source")}
            </a>
            <div className="text-[11px] leading-snug text-slate-500">{t("app.author")}</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="glass sticky top-3 z-40 flex flex-wrap items-center justify-between gap-3 bg-surface-1/60 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={() => setMenu(true)} aria-label="menu">
                <Menu className="h-5 w-5" />
              </button>
              <span className="brand-title bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 bg-clip-text font-display text-sm font-bold text-transparent lg:hidden">{t("app.title")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ModeBadge />
              <LangToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="min-w-0 flex-1 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.3 }}
              >
                <Suspense fallback={<div className="glass p-8"><Loading /></div>}>
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    {MODULES.map((m) => (
                      <Route key={m.id} path={m.path} element={<m.Page />} />
                    ))}
                    <Route path="/playground" element={<Playground />} />
                    <Route path="/incidents" element={<Incidents />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)}>
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass h-full w-72 rounded-none bg-surface-1/95 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between px-2">
                <div className="font-extrabold">{t("app.title")}</div>
                <button onClick={() => setMenu(false)} aria-label="close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavItems onNavigate={() => setMenu(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
