// Bản đồ khung Secure SDLC: năm giai đoạn trên một vòng tròn khép kín (giai đoạn 5 phản hồi về 1) bao quanh
// cây cầu liên chuỗi giữa chain-A và chain-B. Ba cung màu đánh dấu phạm vi của ba chuyên đề.
// Chọn một giai đoạn để xem mô tả, mối đe dọa, đóng góp và nội dung trình diễn; nhấp đúp để mở chuyên đề.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleCheck, Circle, ShieldAlert, Lightbulb, Presentation, PlayCircle } from "lucide-react";
import { useT } from "../../i18n/useT";
import { PHASES, QUESTS, useProgress, type ModuleId } from "../../lib/progress";
import { MODULES } from "../../modules/registry";
import Button from "../../components/Button";

const W = 1000;
const H = 720;
const CX = 500;
const CY = 360;
const R = 250;
const COLOR: Record<ModuleId, string> = { cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42" };
const ANG = [0, 1, 2, 3, 4].map((i) => -90 + i * 72); // giai đoạn 1 ở đỉnh, đi theo chiều kim đồng hồ

const rad = (a: number) => (a * Math.PI) / 180;
const pt = (a: number, r = R) => ({ x: CX + r * Math.cos(rad(a)), y: CY + r * Math.sin(rad(a)) });
function arc(a0: number, a1: number, r = R) {
  const p0 = pt(a0, r);
  const p1 = pt(a1, r);
  const large = (a1 - a0 + 360) % 360 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}
// phạm vi mỗi chuyên đề trên vòng (độ)
const ZONES: { id: ModuleId; a0: number; a1: number; mid: number }[] = [
  { id: "cd1", a0: -126, a1: -54, mid: -90 },
  { id: "cd2", a0: -54, a1: 90, mid: 18 },
  { id: "cd3", a0: 90, a1: 234, mid: 162 },
];

function ChainStack({ x, color, label }: { x: number; color: string; label: string }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <motion.g key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }}>
          <rect x={x - 34} y={CY - 52 + i * 32} width={68} height={24} rx={6} className="fill-surface-1" stroke={color} strokeWidth={2} />
          <text x={x} y={CY - 36 + i * 32} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" className="fill-slate-300">
            #{(label === "A" ? 120 : 87) + i}
          </text>
          {i < 2 && <line x1={x} y1={CY - 28 + i * 32} x2={x} y2={CY - 20 + i * 32} stroke={color} strokeWidth={2} />}
        </motion.g>
      ))}
      <text x={x} y={CY + 64} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-slate-200">
        chain-{label}
      </text>
    </g>
  );
}

export default function WorldMap() {
  const { t, tl } = useT();
  const nav = useNavigate();
  const prog = useProgress();
  const firstOpen = PHASES.findIndex((p) => p.quests.some((q) => !prog.has(p.module, q)));
  const [sel, setSel] = useState(firstOpen < 0 ? 0 : firstOpen);
  const [hover, setHover] = useState<number | null>(null);
  // tự giới thiệu: điểm đánh dấu tự đi qua từng giai đoạn khi người xem chưa tương tác
  const boxRef = useRef<HTMLElement>(null);
  const inView = useInView(boxRef, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [auto, setAuto] = useState(true);
  const [hold, setHold] = useState(false);
  const AUTO_MS = 6000;
  useEffect(() => {
    if (!auto || hold || !inView || reduce) return;
    const h = window.setTimeout(() => setSel((i) => (i + 1) % PHASES.length), AUTO_MS);
    return () => window.clearTimeout(h);
  }, [auto, hold, inView, reduce, sel]);
  // góc quay của điểm đánh dấu: luôn đi tiếp theo chiều kim đồng hồ quanh vòng
  const rot = useRef(ANG[sel] + 90);
  const angle = useMemo(() => {
    const target = ANG[sel] + 90;
    const cur = rot.current;
    const delta = (((target - cur) % 360) + 360) % 360;
    rot.current = cur + delta;
    return rot.current;
  }, [sel]);

  const av = useSpring(angle, { stiffness: 40, damping: 14 });
  useEffect(() => av.set(angle), [angle, av]);
  const mx = useTransform(av, (a) => CX + R * Math.cos(rad(a - 90)));
  const my = useTransform(av, (a) => CY + R * Math.sin(rad(a - 90)));

  const phase = PHASES[sel];
  const mod = MODULES.find((m) => m.id === phase.module)!;
  const doneOf = (i: number) => PHASES[i].quests.filter((q) => prog.has(PHASES[i].module, q)).length;
  const open = (i = sel) => {
    const p = PHASES[i];
    const m = MODULES.find((x) => x.id === p.module)!;
    nav(`${m.path}${p.tab ? `?tab=${p.tab}` : ""}`);
  };
  const phases = tl("home.phases");

  return (
    <section ref={boxRef} className="glass relative overflow-hidden" onPointerDown={() => setAuto(false)} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      {/* thanh mức độ trình diễn */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-3">
        <div>
          <div className="label">{t("world.label")}</div>
          <div className="font-display text-base font-bold">{t("world.title")}</div>
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="mb-1 flex justify-between font-mono text-[11px] text-slate-400">
            <span>{t("world.coverage")}</span>
            <span>
              {prog.done.size}/{prog.total}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-white/20 bg-white/5">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-400 via-violet-500 to-orange-400" animate={{ width: `${(prog.done.size / prog.total) * 100}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {MODULES.map((m) => {
            const d = prog.moduleDone(m.id);
            const n = QUESTS[m.id].length;
            return (
              <span key={m.id} title={t(`${m.id}.name`)} className="chip font-mono">
                <span className="h-2 w-2 rounded-full" style={{ background: COLOR[m.id] }} />
                {m.id.toUpperCase()} {d}/{n}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_380px]">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label={t("world.title")}>
            <defs>
              <filter id="wmGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <path id="wmFeedback" d={arc(-160, -100, R + 32)} />
              <marker id="wmArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" className="fill-slate-300" />
              </marker>
            </defs>

            {/* vòng Secure SDLC */}
            <circle cx={CX} cy={CY} r={R} fill="none" className="stroke-white/10" strokeWidth={30} />
            {ZONES.map((z) => (
              <path key={z.id} d={arc(z.a0, z.a1)} fill="none" stroke={COLOR[z.id]} strokeOpacity={hover !== null && PHASES[hover].module !== z.id ? 0.18 : 0.45} strokeWidth={30} />
            ))}
            <motion.circle cx={CX} cy={CY} r={R} fill="none" className="stroke-slate-300" strokeWidth={2} strokeDasharray="6 12" animate={{ strokeDashoffset: [0, -36] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            {/* gói tin chạy dọc vòng đời theo chiều kim đồng hồ */}
            {!reduce &&
              [0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={`pk${i}`}
                  r={4.5}
                  fill={["#00c9b0", "#a26bff", "#ff8f42", "#3d8bff"][i]}
                  style={{ offsetPath: `path("M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX} ${CY + R} A ${R} ${R} 0 1 1 ${CX} ${CY - R}")` }}
                  animate={{ offsetDistance: ["0%", "100%"] }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: -i * 4 }}
                />
              ))}
            {/* mũi tên chiều vòng lặp giữa các giai đoạn */}
            {ANG.map((a, i) => (
              <path key={i} d={arc(a + 24, a + 48, R)} fill="none" className="stroke-slate-200" strokeWidth={2.5} markerEnd="url(#wmArrow)" />
            ))}
            <text fontSize={11} fontWeight={700} className="fill-slate-300" letterSpacing={0.8}>
              <textPath href="#wmFeedback" startOffset="50%" textAnchor="middle">
                {t("world.feedback")}
              </textPath>
            </text>

            {/* nhãn chuyên đề trên các cung */}
            {ZONES.map((z) => {
              const p = pt(z.mid, R - 58);
              return (
                <g key={z.id}>
                  <rect x={p.x - 62} y={p.y - 13} width={124} height={26} rx={13} className="fill-surface-1" stroke={COLOR[z.id]} strokeWidth={2} />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={12} fontWeight={800} fill={COLOR[z.id]}>
                    {z.id.toUpperCase()} · {t(`${z.id}.name`)}
                  </text>
                </g>
              );
            })}

            {/* cầu liên chuỗi ở trung tâm */}
            <ChainStack x={CX - 88} color="#3d8bff" label="A" />
            <ChainStack x={CX + 88} color="#ff8f42" label="B" />
            <path d={`M ${CX - 54} ${CY - 20} Q ${CX} ${CY - 84} ${CX + 54} ${CY - 20}`} fill="none" stroke="#a26bff" strokeWidth={4} strokeLinecap="round" />
            <line x1={CX - 54} y1={CY - 8} x2={CX + 54} y2={CY - 8} stroke="#a26bff" strokeWidth={3} strokeOpacity={0.6} />
            {[0, 1, 2].map((i) => (
              <motion.circle key={i} r={5} fill="#a26bff" style={{ offsetPath: `path("M ${CX - 54} ${CY - 20} Q ${CX} ${CY - 84} ${CX + 54} ${CY - 20}")` }} animate={{ offsetDistance: ["0%", "100%"] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }} />
            ))}
            <text x={CX} y={CY - 66} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1.5} className="fill-violet-300">
              {t("world.bridge")}
            </text>
            <text x={CX} y={CY + 104} textAnchor="middle" fontSize={14} fontWeight={800} className="fill-slate-100" style={{ fontFamily: "Unbounded, sans-serif" }}>
              Secure SDLC
            </text>
            <text x={CX} y={CY + 122} textAnchor="middle" fontSize={11} className="fill-slate-400">
              {t("world.cycle")}
            </text>

            {/* điểm đánh dấu chạy quanh vòng tới giai đoạn đang chọn */}
            <motion.circle cx={mx} cy={my} r={13} fill={COLOR[phase.module]} filter="url(#wmGlow)" opacity={0.7} />
            <motion.circle cx={mx} cy={my} r={7} className="fill-surface-1" stroke={COLOR[phase.module]} strokeWidth={3} />

            {/* năm giai đoạn */}
            {PHASES.map((p, i) => {
              const c = COLOR[p.module];
              const pos = pt(ANG[i]);
              // nhãn đẩy ra ngoài vòng: theo phương ngang nhiều hơn để không đè lên nút ở hai bên
              const lab = { x: pos.x + Math.cos(rad(ANG[i])) * 140, y: pos.y + Math.sin(rad(ANG[i])) * (Math.sin(rad(ANG[i])) < 0 ? 80 : 92) };
              const done = doneOf(i);
              const frac = done / p.quests.length;
              const active = sel === i;
              const circ = 2 * Math.PI * 44;
              return (
                <g key={p.n} className="cursor-pointer" onClick={() => setSel(i)} onDoubleClick={() => open(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {active && <motion.circle cx={pos.x} cy={pos.y} r={52} fill={c} opacity={0.2} animate={{ r: [48, 56, 48] }} transition={{ duration: 2, repeat: Infinity }} />}
                  <circle cx={pos.x} cy={pos.y} r={38} className="fill-surface-1" stroke={active ? "currentColor" : c} strokeWidth={active ? 4 : 3} style={{ color: "rgb(var(--c-white))" }} />
                  {/* vòng tiến độ trình diễn của giai đoạn */}
                  <circle cx={pos.x} cy={pos.y} r={44} fill="none" className="stroke-white/10" strokeWidth={4} />
                  <motion.circle cx={pos.x} cy={pos.y} r={44} fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" strokeDasharray={circ} initial={false} animate={{ strokeDashoffset: circ * (1 - frac) }} transform={`rotate(-90 ${pos.x} ${pos.y})`} />
                  <text x={pos.x} y={pos.y + 9} textAnchor="middle" fontSize={26} fontWeight={800} className="fill-slate-100" style={{ fontFamily: "Unbounded, sans-serif" }}>
                    {p.n}
                  </text>
                  <rect x={lab.x - 86} y={lab.y - 20} width={172} height={40} rx={10} className="fill-surface-1" stroke={active || hover === i ? c : "rgb(var(--c-white) / 0.25)"} strokeWidth={2} />
                  <text x={lab.x} y={lab.y - 2} textAnchor="middle" fontSize={12.5} fontWeight={700} className="fill-slate-100">
                    {phases[i]}
                  </text>
                  <text x={lab.x} y={lab.y + 13} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" className="fill-slate-400">
                    {done}/{p.quests.length} · {p.module.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>{t("world.hint")}</span>
            {auto && !reduce && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-surface-1 px-2 py-0.5 text-slate-300" data-testid="world-auto">
                <PlayCircle className="h-3 w-3" /> {t("world.auto")}
                <span className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
                  <span key={`${sel}-${hold}`} className="block h-full origin-left bg-slate-300" style={{ animation: `tour-hold ${AUTO_MS}ms linear forwards`, animationPlayState: hold || !inView ? "paused" : "running" }} />
                </span>
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.aside key={sel} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 border-t border-white/10 p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center gap-3">
              <div className="card-brut grid h-12 w-12 place-items-center rounded-xl font-display text-xl font-black text-ink-950" style={{ background: COLOR[phase.module] }}>
                {phase.n}
              </div>
              <div className="min-w-0">
                <div className="label">
                  {t("world.phase")} {phase.n} · {phase.module.toUpperCase()} {t(`${phase.module}.name`)}
                </div>
                <div className="font-display text-lg font-bold leading-tight">{phases[sel]}</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{t(`world.p${phase.n}.story`)}</p>
            <div>
              <div className="label mb-1.5 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> {t("world.threats")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tl(`world.p${phase.n}.threats`).map((x) => (
                  <span key={x} className="chip">
                    {x}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" /> {t("world.contrib")}
              </div>
              <ul className="space-y-1">
                {tl(`world.p${phase.n}.contrib`).map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-slate-200">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: COLOR[phase.module] }} />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label mb-1.5 flex items-center gap-1">
                <Presentation className="h-3.5 w-3.5" /> {t("world.missions")}
              </div>
              <ul className="space-y-1">
                {phase.quests.map((q) => {
                  const ok = prog.has(phase.module, q);
                  return (
                    <li key={q} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${ok ? "bg-emerald-400/15 text-emerald-200" : "bg-white/[0.04] text-slate-300"}`}>
                      {ok ? <CircleCheck className="h-3.5 w-3.5 text-emerald-300" /> : <Circle className="h-3.5 w-3.5 text-slate-500" />}
                      {t(`quest.${phase.module}.${q}`)}
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button accent={mod.accent} className="mt-auto" icon={<ArrowRight className="h-4 w-4" />} onClick={() => open()}>
              {t("world.enter")} {phase.module.toUpperCase()} · {t(`${phase.module}.name`)}
            </Button>
          </motion.aside>
        </AnimatePresence>
      </div>
    </section>
  );
}
