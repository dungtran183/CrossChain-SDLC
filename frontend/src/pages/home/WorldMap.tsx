// Bản đồ thế giới kiểu game: hai "lục địa" chuỗi khối nối bằng cây cầu; con đường Secure SDLC đi qua 5 cửa ải
// (giai đoạn) thuộc 3 vùng chuyên đề. Bấm cửa ải để nhân vật di chuyển tới và xem thông tin; "Vào màn" để mở module.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Lock, Sparkles, Star, Swords, Trophy } from "lucide-react";
import { useT } from "../../i18n/useT";
import { PHASES, QUESTS, XP_PER_QUEST, useProgress, type ModuleId } from "../../lib/progress";
import { MODULES } from "../../modules/registry";
import Button from "../../components/Button";

const POS = [
  { x: 190, y: 452 },
  { x: 372, y: 318 },
  { x: 600, y: 196 },
  { x: 828, y: 318 },
  { x: 1010, y: 452 },
];
const START = { x: 60, y: 560 };
const GOAL = { x: 1140, y: 560 };
const ROAD =
  "M 60 560 C 110 530, 140 480, 190 452 S 300 350, 372 318 S 520 200, 600 196 S 750 250, 828 318 S 950 420, 1010 452 S 1100 530, 1140 560";
const COLOR: Record<ModuleId, string> = { cd1: "#22d3ee", cd2: "#8b5cf6", cd3: "#f59e0b" };
const THREATS = [
  { x: 120, y: 380, phase: 0, icon: "🕵️" },
  { x: 300, y: 250, phase: 1, icon: "🐛" },
  { x: 680, y: 120, phase: 2, icon: "💣" },
  { x: 900, y: 240, phase: 3, icon: "🦹" },
  { x: 1090, y: 380, phase: 4, icon: "📉" },
];

function Continent({ d, color, label, sub }: { d: string; color: string; label: string; sub: string }) {
  return (
    <g>
      <path d={d} fill={`${color}14`} stroke={color} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 6" />
      <text x={label === "A" ? 70 : 1010} y={620} fill={color} fontSize={13} fontWeight={800} opacity={0.85}>
        {sub}
      </text>
    </g>
  );
}

function Blocks({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  return (
    <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, delay }}>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${x + i * 22}, ${y - i * 6})`}>
          <path d="M0 8 L10 3 L20 8 L10 13 Z" fill={color} opacity={0.75} />
          <path d="M0 8 L0 20 L10 25 L10 13 Z" fill={color} opacity={0.45} />
          <path d="M20 8 L20 20 L10 25 L10 13 Z" fill={color} opacity={0.3} />
        </g>
      ))}
    </motion.g>
  );
}

export default function WorldMap() {
  const { t, tl } = useT();
  const nav = useNavigate();
  const prog = useProgress();
  const firstOpen = PHASES.findIndex((p) => p.quests.some((q) => !prog.has(p.module, q)));
  const [sel, setSel] = useState(firstOpen < 0 ? 4 : firstOpen);
  const [hover, setHover] = useState<number | null>(null);
  const [travel, setTravel] = useState(false);
  useEffect(() => setTravel(true), [sel]);

  const phase = PHASES[sel];
  const mod = MODULES.find((m) => m.id === phase.module)!;
  const starsOf = (i: number) => {
    const p = PHASES[i];
    const d = p.quests.filter((q) => prog.has(p.module, q)).length;
    return d === 0 ? 0 : d === p.quests.length ? 3 : d * 2 >= p.quests.length ? 2 : 1;
  };
  const enter = () => nav(`${mod.path}${phase.tab ? `?tab=${phase.tab}` : ""}`);
  const levelNames = tl("world.levels");
  const clouds = useMemo(() => [0, 1, 2, 3].map((i) => ({ y: 70 + i * 90, d: 60 + i * 18, s: 0.7 + (i % 2) * 0.4 })), []);

  return (
    <section className="glass relative overflow-hidden">
      {/* HUD */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-amber-400 text-lg font-extrabold text-ink-950 shadow-lg">
            {prog.level + 1}
          </div>
          <div>
            <div className="label">{t("world.player")}</div>
            <div className="text-sm font-bold">{levelNames[prog.level] ?? ""}</div>
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
            <span>
              XP {prog.xp} / {prog.total * XP_PER_QUEST}
            </span>
            <span>
              {prog.done.size}/{prog.total} {t("world.quests")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400" animate={{ width: `${(prog.done.size / prog.total) * 100}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {MODULES.map((m) => {
            const full = prog.moduleDone(m.id) === QUESTS[m.id].length;
            return (
              <span key={m.id} title={t(`${m.id}.name`)} className={`grid h-9 w-9 place-items-center rounded-full border text-[10px] font-extrabold transition ${full ? `border-transparent bg-gradient-to-br ${m.accent} text-ink-950 shadow-lg` : "border-white/15 text-slate-500"}`}>
                {full ? <Trophy className="h-4 w-4" /> : m.glyph}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_360px]">
        {/* Bản đồ */}
        <div className="relative">
          <svg viewBox="0 0 1200 640" className="h-auto w-full select-none" role="img" aria-label={t("world.title")}>
            <defs>
              <radialGradient id="wmSea" cx="50%" cy="40%" r="75%">
                <stop offset="0" stopColor="#151d42" />
                <stop offset="1" stopColor="#070a1a" />
              </radialGradient>
              <linearGradient id="wmRoad" x1="0" x2="1">
                <stop offset="0" stopColor="#22d3ee" />
                <stop offset="0.5" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="wmGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <pattern id="wmGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" />
              </pattern>
            </defs>
            <rect width="1200" height="640" fill="url(#wmSea)" />
            <rect width="1200" height="640" fill="url(#wmGrid)" />

            {/* mây trôi */}
            {clouds.map((c, i) => (
              <motion.ellipse key={i} cy={c.y} rx={70 * c.s} ry={14 * c.s} fill="rgba(255,255,255,0.035)" initial={{ cx: -120 }} animate={{ cx: 1320 }} transition={{ duration: c.d, repeat: Infinity, ease: "linear", delay: -i * 17 }} />
            ))}

            {/* hai lục địa chuỗi khối */}
            <Continent label="A" sub={t("world.chainA")} color="#22d3ee" d="M 20 600 C 10 470, 40 330, 160 280 C 260 240, 380 250, 470 300 C 520 330, 520 420, 470 480 C 420 560, 300 620, 20 620 Z" />
            <Continent label="B" sub={t("world.chainB")} color="#f59e0b" d="M 1180 600 C 1190 470, 1160 330, 1040 280 C 940 240, 820 250, 730 300 C 680 330, 680 420, 730 480 C 780 560, 900 620, 1180 620 Z" />
            <Blocks x={60} y={500} color="#22d3ee" delay={0} />
            <Blocks x={300} y={430} color="#14b8a6" delay={1} />
            <Blocks x={840} y={430} color="#f59e0b" delay={0.5} />
            <Blocks x={1080} y={500} color="#f43f5e" delay={1.5} />

            {/* cây cầu liên chuỗi */}
            <g opacity={0.9}>
              <path d="M 470 360 Q 600 250 730 360" fill="none" stroke="#a78bfa" strokeWidth={6} strokeOpacity={0.35} />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const x = 490 + i * 36;
                const y = 360 - Math.sin((i / 6) * Math.PI) * 88;
                return <line key={i} x1={x} y1={y + 6} x2={x} y2={372} stroke="#a78bfa" strokeOpacity={0.25} strokeWidth={2} />;
              })}
              <line x1={470} y1={372} x2={730} y2={372} stroke="#a78bfa" strokeOpacity={0.3} strokeWidth={3} />
              {[0, 1, 2].map((i) => (
                <motion.circle key={i} r={5} fill="#e9d5ff" filter="url(#wmGlow)" style={{ offsetPath: 'path("M 470 360 Q 600 250 730 360")' }} animate={{ offsetDistance: ["0%", "100%"] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.85, ease: "easeInOut" }} />
              ))}
              <text x={600} y={398} textAnchor="middle" fill="#c4b5fd" fontSize={12} fontWeight={700}>
                {t("world.bridge")}
              </text>
            </g>

            {/* vùng chuyên đề */}
            {[
              { id: "cd1" as ModuleId, x: 190, y: 452, r: 110 },
              { id: "cd2" as ModuleId, x: 486, y: 257, r: 175 },
              { id: "cd3" as ModuleId, x: 919, y: 385, r: 160 },
            ].map((z) => (
              <g key={z.id}>
                <motion.circle cx={z.x} cy={z.y} r={z.r} fill={COLOR[z.id]} opacity={0.06} animate={{ opacity: [0.04, 0.09, 0.04] }} transition={{ duration: 5, repeat: Infinity }} />
              </g>
            ))}

            {/* con đường SDLC */}
            <path d={ROAD} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={16} strokeLinecap="round" />
            <path d={ROAD} fill="none" stroke="url(#wmRoad)" strokeWidth={10} strokeLinecap="round" strokeOpacity={0.35} />
            <motion.path d={ROAD} fill="none" stroke="url(#wmRoad)" strokeWidth={3} strokeDasharray="10 14" strokeLinecap="round" animate={{ strokeDashoffset: [0, -48] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />

            {/* các mối đe dọa quanh từng giai đoạn */}
            {THREATS.map((th, i) => (
              <motion.g key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 2.4 + i * 0.3, repeat: Infinity }} opacity={starsOf(th.phase) === 3 ? 0.25 : 0.9}>
                <text x={th.x} y={th.y} fontSize={24} textAnchor="middle">
                  {starsOf(th.phase) === 3 ? "🛡️" : th.icon}
                </text>
              </motion.g>
            ))}

            {/* điểm xuất phát và đích */}
            <g>
              <circle cx={START.x} cy={START.y} r={16} fill="#0f172a" stroke="#94a3b8" />
              <text x={START.x} y={START.y + 5} textAnchor="middle" fontSize={14}>
                🚩
              </text>
              <text x={START.x + 22} y={START.y + 34} fill="#94a3b8" fontSize={11}>
                {t("world.start")}
              </text>
              <circle cx={GOAL.x} cy={GOAL.y} r={20} fill="#0f172a" stroke={prog.done.size === prog.total ? "#fbbf24" : "#475569"} strokeWidth={2} />
              <text x={GOAL.x} y={GOAL.y + 6} textAnchor="middle" fontSize={18}>
                {prog.done.size === prog.total ? "🏆" : "🏰"}
              </text>
              <text x={GOAL.x - 4} y={GOAL.y + 40} textAnchor="end" fill="#94a3b8" fontSize={11}>
                {t("world.goal")}
              </text>
            </g>

            {/* cửa ải */}
            {PHASES.map((p, i) => {
              const c = COLOR[p.module];
              const st = starsOf(i);
              const active = sel === i;
              return (
                <g
                  key={p.n}
                  className="cursor-pointer"
                  onClick={() => setSel(i)}
                  onDoubleClick={() => (setSel(i), setTimeout(enter, 50))}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  {active && <motion.circle cx={POS[i].x} cy={POS[i].y} r={44} fill={c} opacity={0.25} filter="url(#wmGlow)" animate={{ r: [40, 50, 40] }} transition={{ duration: 2, repeat: Infinity }} />}
                  <motion.circle cx={POS[i].x} cy={POS[i].y} r={32} fill="#0b1024" stroke={c} strokeWidth={active ? 4 : 2.5} whileHover={{ scale: 1.08 }} style={{ transformOrigin: `${POS[i].x}px ${POS[i].y}px` }} />
                  <text x={POS[i].x} y={POS[i].y + 8} textAnchor="middle" fill="#fff" fontSize={24} fontWeight={900}>
                    {p.n}
                  </text>
                  {[0, 1, 2].map((k) => (
                    <text key={k} x={POS[i].x - 18 + k * 18} y={POS[i].y - 40} textAnchor="middle" fontSize={15} fill={k < st ? "#fbbf24" : "rgba(255,255,255,0.18)"}>
                      ★
                    </text>
                  ))}
                  <rect x={POS[i].x - 78} y={POS[i].y + 40} width={156} height={34} rx={10} fill="rgba(6,8,22,0.85)" stroke={c} strokeOpacity={hover === i || active ? 0.9 : 0.35} />
                  <text x={POS[i].x} y={POS[i].y + 55} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight={700}>
                    {tl("home.phases")[i]}
                  </text>
                  <text x={POS[i].x} y={POS[i].y + 68} textAnchor="middle" fill={c} fontSize={10} fontWeight={700}>
                    {p.module.toUpperCase()} · {t(`${p.module}.name`)}
                  </text>
                </g>
              );
            })}

            {/* nhân vật */}
            <motion.g initial={false} animate={{ x: POS[sel].x, y: POS[sel].y - 70 }} transition={{ type: "spring", stiffness: 60, damping: 14 }} onAnimationComplete={() => setTravel(false)}>
              <motion.g animate={{ y: travel ? [0, -12, 0] : [0, -5, 0] }} transition={{ duration: travel ? 0.4 : 1.6, repeat: Infinity }}>
                <circle r={18} fill="url(#wmRoad)" filter="url(#wmGlow)" opacity={0.7} />
                <circle r={14} fill="#0b1024" stroke="#fff" strokeWidth={2} />
                <path d="M0 -8 l7 3 v5 c0 5 -3 8 -7 10 c-4 -2 -7 -5 -7 -10 v-5 z" fill="#e9d5ff" />
              </motion.g>
            </motion.g>
          </svg>
          <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="h-3 w-3" /> {t("world.hint")}
          </div>
        </div>

        {/* Bảng thông tin cửa ải */}
        <AnimatePresence mode="wait">
          <motion.aside key={sel} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 border-t border-white/5 p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${mod.accent} text-xl font-black text-ink-950`}>{phase.n}</div>
              <div className="min-w-0">
                <div className="label" style={{ color: COLOR[phase.module] }}>
                  {t("world.phase")} {phase.n} · {phase.module.toUpperCase()} {t(`${phase.module}.name`)}
                </div>
                <div className="text-lg font-bold leading-tight">{tl("home.phases")[sel]}</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{t(`world.p${phase.n}.story`)}</p>
            <div>
              <div className="label mb-1.5 flex items-center gap-1">
                <Swords className="h-3 w-3" /> {t("world.threats")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tl(`world.p${phase.n}.threats`).map((x) => (
                  <span key={x} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-100">
                    {x}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-1.5 flex items-center gap-1">
                <Star className="h-3 w-3" /> {t("world.contrib")}
              </div>
              <ul className="space-y-1">
                {tl(`world.p${phase.n}.contrib`).map((x) => (
                  <li key={x} className="flex gap-2 text-xs text-slate-200">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLOR[phase.module] }} />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label mb-1.5">{t("world.missions")}</div>
              <ul className="space-y-1">
                {phase.quests.map((q) => {
                  const ok = prog.has(phase.module, q);
                  return (
                    <li key={q} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${ok ? "bg-emerald-400/10 text-emerald-100" : "bg-white/[0.03] text-slate-300"}`}>
                      {ok ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
                      <span className="flex-1">{t(`quest.${phase.module}.${q}`)}</span>
                      <span className="font-mono text-[10px] text-amber-200/80">+{XP_PER_QUEST}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button accent={mod.accent} className="mt-auto" icon={<ArrowRight className="h-4 w-4" />} onClick={enter}>
              {t("world.enter")}
            </Button>
          </motion.aside>
        </AnimatePresence>
      </div>
    </section>
  );
}
