import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Boxes, Cpu, Flame, Gamepad2, Globe, Laptop, ShieldCheck } from "lucide-react";
import { useT } from "../i18n/useT";
import WorldMap from "./home/WorldMap";
import BigPicture from "./home/BigPicture";
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
          <text x={50} y={33 + i * 40} className="fill-cyan-200" fontSize={10} fontFamily="JetBrains Mono">
            A · #{120 + i}
          </text>
          {i < 3 && <line x1={83} y1={44 + i * 40} x2={83} y2={54 + i * 40} stroke="#22d3ee" strokeOpacity={0.5} />}
        </motion.g>
      ))}
      {/* chuỗi B (dọc phải) */}
      {blocks.map((i) => (
        <motion.g key={`b${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i + 0.3 }}>
          <rect x={434} y={14 + i * 40} width={86} height={30} rx={8} fill="rgba(245,158,11,0.08)" stroke="url(#hB)" strokeWidth={1.2} />
          <text x={444} y={33 + i * 40} className="fill-amber-200" fontSize={10} fontFamily="JetBrains Mono">
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

export default function Home() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-float rounded-full bg-gradient-to-br from-cyan-400/25 via-violet-500/25 to-amber-400/25 blur-3xl" />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative grid items-center gap-6 p-6 sm:p-8 xl:grid-cols-[1.25fr_1fr]">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="chip">
                <ShieldCheck className="h-3 w-3" /> {t("home.badge")}
              </span>
            </div>
            <h1 className="hero-title animate-gradient-x bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 bg-[length:200%_auto] bg-clip-text text-2xl font-extrabold leading-tight tracking-tight text-transparent sm:text-3xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">{t("home.heroBody")}</p>
            <p className="mt-2 text-xs text-slate-400">{t("app.author")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#world" onClick={(e) => (e.preventDefault(), document.getElementById("world")?.scrollIntoView({ behavior: "smooth" }))} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 px-5 py-2.5 text-sm font-bold text-ink-950 shadow-lg transition hover:brightness-110">
                <Gamepad2 className="h-4 w-4" /> {t("world.play")}
              </a>
              <Link to="/incidents" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
                <Flame className="h-4 w-4 text-rose-300" /> {t("inc.title")}
              </Link>
            </div>
          </div>
          <div className="hidden h-[200px] sm:block">
            <BridgeHero />
          </div>
        </div>
      </motion.section>

      <div id="world" className="scroll-mt-20">
        <WorldMap />
      </div>

      <BigPicture />

      <section className="grid gap-5 md:grid-cols-3">
        {[
          { icon: <Boxes className="h-5 w-5" />, k: "chain" },
          { icon: <Cpu className="h-5 w-5" />, k: "ml" },
          { icon: MODE === "replay" ? <Globe className="h-5 w-5" /> : <Laptop className="h-5 w-5" />, k: "modes" },
        ].map((x, i) => (
          <motion.div key={x.k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass p-5">
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
