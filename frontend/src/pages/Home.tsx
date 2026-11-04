import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Cpu, Globe, Laptop, ShieldCheck } from "lucide-react";
import { useT } from "../i18n/useT";
import { MODULES } from "../modules/registry";
import Spotlight from "../components/fx/Spotlight";
import { MODE } from "../lib/api";

/** Hai chuỗi khối và cây cầu: gói tin chạy liên tục giữa chuỗi A và B. */
function BridgeHero() {
  const blocks = [0, 1, 2, 3];
  const pathAB = "M 150 70 C 230 10, 330 10, 410 70";
  const pathBA = "M 410 110 C 330 170, 230 170, 150 110";
  return (
    <svg viewBox="0 0 560 180" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="hA" x1="0" x2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="hB" x1="0" x2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="hBridge" x1="0" x2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="hGlow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* chuỗi A (dọc trái) */}
      {blocks.map((i) => (
        <motion.g key={`a${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }}>
          <rect x={40} y={14 + i * 40} width={86} height={30} rx={8} fill="rgba(34,211,238,0.08)" stroke="url(#hA)" strokeWidth={1.2} />
          <text x={50} y={33 + i * 40} fill="#a5f3fc" fontSize={10} fontFamily="JetBrains Mono">
            A · #{120 + i}
          </text>
          {i < 3 && <line x1={83} y1={44 + i * 40} x2={83} y2={54 + i * 40} stroke="#22d3ee" strokeOpacity={0.5} />}
        </motion.g>
      ))}
      {/* chuỗi B (dọc phải) */}
      {blocks.map((i) => (
        <motion.g key={`b${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i + 0.3 }}>
          <rect x={434} y={14 + i * 40} width={86} height={30} rx={8} fill="rgba(245,158,11,0.08)" stroke="url(#hB)" strokeWidth={1.2} />
          <text x={444} y={33 + i * 40} fill="#fde68a" fontSize={10} fontFamily="JetBrains Mono">
            B · #{87 + i}
          </text>
          {i < 3 && <line x1={477} y1={44 + i * 40} x2={477} y2={54 + i * 40} stroke="#f59e0b" strokeOpacity={0.5} />}
        </motion.g>
      ))}
      {/* cầu nối */}
      <path d={pathAB} fill="none" stroke="url(#hBridge)" strokeWidth={2} strokeOpacity={0.5} />
      <path d={pathBA} fill="none" stroke="url(#hBridge)" strokeWidth={2} strokeOpacity={0.3} strokeDasharray="4 6" />
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`p${i}`}
          r={4}
          fill="#e9d5ff"
          filter="url(#hGlow)"
          style={{ offsetPath: `path("${pathAB}")` }}
          animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
        />
      ))}
      {[0, 1].map((i) => (
        <motion.circle
          key={`q${i}`}
          r={3}
          fill="#fde68a"
          filter="url(#hGlow)"
          style={{ offsetPath: `path("${pathBA}")` }}
          animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 + i * 1.4, ease: "easeInOut" }}
        />
      ))}
      {/* khiên bảo vệ ở giữa */}
      <motion.g animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "280px 90px" }}>
        <circle cx={280} cy={90} r={26} fill="rgba(139,92,246,0.15)" stroke="#a78bfa" strokeOpacity={0.6} />
        <path d="M280 74 l12 5 v9 c0 8 -5 13 -12 16 c-7 -3 -12 -8 -12 -16 v-9 z" fill="none" stroke="#e9d5ff" strokeWidth={1.6} />
        <path d="M274 90 l4 4 l8 -8" fill="none" stroke="#e9d5ff" strokeWidth={1.6} />
      </motion.g>
    </svg>
  );
}

const PHASE_COLORS = ["#22d3ee", "#8b5cf6", "#818cf8", "#f59e0b", "#f43f5e"];

function SdlcTimeline() {
  const { t, tl } = useT();
  const phases = tl("home.phases");
  return (
    <section className="glass p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="label">{t("home.sdlcLabel")}</div>
          <h2 className="text-xl font-bold">{t("home.sdlcTitle")}</h2>
        </div>
        <p className="max-w-xl text-sm text-slate-400">{t("home.sdlcBody")}</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-6 hidden h-[2px] bg-gradient-to-r from-cyan-400 via-violet-500 to-rose-500 opacity-40 md:block" />
        <div className="grid gap-4 md:grid-cols-5">
          {phases.map((p, i) => {
            const mod = MODULES.find((m) => m.sdlc.includes(i + 1));
            return (
              <motion.div key={p} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border-2 bg-ink-900 text-sm font-bold" style={{ borderColor: PHASE_COLORS[i], boxShadow: `0 0 24px -6px ${PHASE_COLORS[i]}` }}>
                  {i + 1}
                </div>
                <div className="text-center text-sm font-semibold">{p}</div>
                {mod && (
                  <Link to={mod.path} className="mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">
                    <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${mod.accent}`} />
                    {mod.id.toUpperCase()} · {t(`${mod.id}.name`)}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, tl } = useT();
  const stats = tl("home.stats");
  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-float rounded-full bg-gradient-to-br from-cyan-400/25 via-violet-500/25 to-amber-400/25 blur-3xl" />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative grid items-center gap-6 p-6 sm:p-10 xl:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="chip">
                <ShieldCheck className="h-3 w-3" /> {t("home.badge")}
              </span>
              <span className="chip">{MODE === "replay" ? t("app.replayMode") : t("app.liveMode")}</span>
            </div>
            <h1 className="animate-gradient-x bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 bg-[length:200%_auto] bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">{t("home.heroBody")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {MODULES.map((m) => (
                <Link key={m.id} to={m.path} className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${m.accent} px-4 py-2 text-sm font-semibold text-ink-950 shadow-lg transition hover:brightness-110`}>
                  {m.id.toUpperCase()} · {t(`${m.id}.name`)}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((s, i) => {
                const [v, l] = s.split("|");
                return (
                  <motion.div key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-xl font-extrabold">{v}</div>
                    <div className="text-[11px] text-slate-400">{l}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="h-[220px] sm:h-[280px]">
            <BridgeHero />
          </div>
        </div>
      </motion.section>

      <section className="grid gap-5 lg:grid-cols-3">
        {MODULES.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + 0.1 * i, duration: 0.45 }} whileHover={{ y: -6, rotateX: 2, rotateY: -2 }} style={{ perspective: 800 }}>
            <Link to={m.path} className="glass group block h-full overflow-hidden transition hover:border-white/25">
              <Spotlight className="flex h-full flex-col gap-4 p-6">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.accent}`} />
                <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${m.accent} opacity-10 blur-2xl transition group-hover:opacity-30`} />
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${m.accent} text-lg font-extrabold text-ink-950 shadow-lg transition group-hover:rotate-6 group-hover:scale-110`}>{m.glyph}</div>
                  <div>
                    <div className="text-xl font-bold">{t(`${m.id}.name`)}</div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">{t(`${m.id}.sdlc`)}</div>
                  </div>
                </div>
                <div className="font-medium text-slate-200">{t(`${m.id}.topic`)}</div>
                <p className="text-sm text-slate-400">{t(`${m.id}.summary`)}</p>
                <ul className="flex-1 space-y-1.5">
                  {tl(`${m.id}.steps`).map((s) => (
                    <li key={s} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${m.accent}`} />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between text-sm">
                  <span className="chip">{t(`${m.id}.pubs`)}</span>
                  <span className="flex items-center gap-1 text-slate-300 transition group-hover:translate-x-1">
                    {t("home.open")} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Spotlight>
            </Link>
          </motion.div>
        ))}
      </section>

      <SdlcTimeline />

      <section className="grid gap-5 md:grid-cols-3">
        {[
          { icon: <Boxes className="h-5 w-5" />, k: "chain" },
          { icon: <Cpu className="h-5 w-5" />, k: "ml" },
          { icon: MODE === "replay" ? <Globe className="h-5 w-5" /> : <Laptop className="h-5 w-5" />, k: "modes" },
        ].map((x, i) => (
          <motion.div key={x.k} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass p-5">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <span className="text-slate-300">{x.icon}</span>
              {t(`home.tech.${x.k}.title`)}
            </div>
            <p className="text-sm text-slate-400">{t(`home.tech.${x.k}.body`)}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
