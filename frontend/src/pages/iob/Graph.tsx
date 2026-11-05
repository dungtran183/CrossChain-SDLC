// Đồ thị "Internet of Blockchains": các chuỗi (nút) nối bằng cầu (cạnh), gói tin chạy liên tục trên từng cầu.
// Chế độ tự phát đi qua các sự cố theo thời gian: cầu bị tấn công lóe đỏ, bảng bên cạnh kể lại và cộng dồn tổn thất.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bug, CheckCircle2, Flame, Pause, Play, PlayCircle } from "lucide-react";
import { useT } from "../../i18n/useT";
import { usePace } from "../../lib/pace";
import AnimatedNumber from "../../components/fx/AnimatedNumber";
import { INCIDENTS } from "../incidents/data";
import { BRIDGES, CHAINS, EDGE_COLOR, EV_COLOR, TIMELINE_EVENTS, byId, edgePath, type Bridge } from "./data";

const EV_ICON = { hack: Flame, bug: Bug, foiled: CheckCircle2 } as const;

export default function IobGraph() {
  const { t, lang } = useT();
  const [pace] = usePace();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.3 });
  const [hover, setHover] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const [ei, setEi] = useState(0);
  const cur = TIMELINE_EVENTS[ei];
  const paths = useMemo(() => new Map(BRIDGES.map((b) => [b, edgePath(b)])), []);
  const fmt = (m: number) => (lang === "vi" ? `≈ ${m.toLocaleString("vi-VN")} triệu USD` : `≈ $${m.toLocaleString("en-US")}M`);
  const cumul = TIMELINE_EVENTS.slice(0, ei + 1).reduce((s, b) => s + (b.ev?.usd ?? 0), 0);

  useEffect(() => {
    if (!auto || !inView || reduce) return;
    const h = window.setTimeout(() => setEi((i) => (i + 1) % TIMELINE_EVENTS.length), 4200 / pace);
    return () => window.clearTimeout(h);
  }, [auto, inView, reduce, ei, pace]);

  const pickEdge = (b: Bridge) => {
    const i = TIMELINE_EVENTS.indexOf(b);
    if (i >= 0) {
      setEi(i);
      setAuto(false);
    }
  };
  const connected = (b: Bridge) => !hover || b.a === hover || b.b === hover;
  const hovered = hover ? byId(hover) : null;
  const hoveredEdges = hover ? BRIDGES.filter((b) => b.a === hover || b.b === hover) : [];
  const ev = cur.ev!;
  const EvIcon = EV_ICON[ev.kind];
  const evName = ev.source === "inc" ? (INCIDENTS.find((x) => x.id === ev.key)?.name ?? ev.key) : t(`proto.inc.${ev.key}.name`);
  const evBody = ev.source === "inc" ? t(`inc.items.${ev.key}.cause`) : t(`proto.inc.${ev.key}.body`);

  return (
    <div ref={box} className="grid gap-4 xl:grid-cols-[1fr_320px]" data-testid="iob-graph">
      <div className="relative self-start overflow-hidden rounded-2xl border border-white/10 bg-surface-0/40">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <svg viewBox="0 0 1000 540" className="relative h-auto w-full select-none" role="img" aria-label={t("iob.graph.title")}>
          <defs>
            <filter id="iobGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          {/* cầu nối */}
          {BRIDGES.map((b, i) => {
            const p = paths.get(b)!;
            const isCur = b === cur;
            const on = connected(b);
            return (
              <g key={i} opacity={on ? 1 : 0.12} className="transition-opacity">
                {isCur && (
                  <motion.path
                    d={p.d}
                    fill="none"
                    stroke={EV_COLOR[ev.kind]}
                    strokeWidth={10}
                    filter="url(#iobGlow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                <path
                  d={p.d}
                  fill="none"
                  stroke={isCur ? EV_COLOR[ev.kind] : EDGE_COLOR[b.type]}
                  strokeOpacity={isCur ? 1 : 0.55}
                  strokeWidth={isCur ? 3.5 : 2}
                  strokeDasharray={b.type === "native" ? "6 5" : undefined}
                />
                {!reduce && (
                  <motion.circle
                    r={3.2}
                    fill={isCur && ev.kind === "hack" ? "#ff4b4b" : EDGE_COLOR[b.type]}
                    style={{ offsetPath: `path("${p.d}")` }}
                    animate={{ offsetDistance: i % 2 ? ["100%", "0%"] : ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2.4 + (i % 4) * 0.6, repeat: Infinity, delay: (i * 0.29) % 2.5, ease: "easeInOut" }}
                  />
                )}
              </g>
            );
          })}
          {/* dấu sự cố trên cầu */}
          {TIMELINE_EVENTS.map((b) => {
            const p = paths.get(b)!;
            const isCur = b === cur;
            const c = EV_COLOR[b.ev!.kind];
            return (
              <g key={`m-${b.name}-${b.a}`} onClick={() => pickEdge(b)} className="cursor-pointer" opacity={connected(b) ? 1 : 0.15}>
                <motion.circle
                  cx={p.mid.x}
                  cy={p.mid.y}
                  r={isCur ? 13 : 9}
                  fill={c}
                  stroke="#16140f"
                  strokeWidth={2}
                  initial={false}
                  animate={{ scale: isCur ? [1, 1.25, 1] : 1 }}
                  transition={{ duration: 0.9, repeat: isCur ? Infinity : 0 }}
                  style={{ originX: `${p.mid.x}px`, originY: `${p.mid.y}px` }}
                />
                <text x={p.mid.x} y={p.mid.y + 4} textAnchor="middle" fontSize={isCur ? 14 : 12} fontWeight={900} fill="#fff">
                  {b.ev!.kind === "foiled" ? "✓" : "!"}
                </text>
                {isCur && (
                  <text x={p.mid.x} y={p.mid.y - 19} textAnchor="middle" fontSize={15} fontWeight={800} fill={c} stroke="rgb(var(--c-surface-0))" strokeWidth={4} paintOrder="stroke">
                    {b.name}
                  </text>
                )}
              </g>
            );
          })}
          {/* chuỗi */}
          {CHAINS.map((c) => {
            const dim = hover && hover !== c.id && !hoveredEdges.some((b) => b.a === c.id || b.b === c.id);
            return (
              <g key={c.id} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === c.id ? null : c.id)} className="cursor-pointer" opacity={dim ? 0.3 : 1}>
                {c.hub && (
                  <motion.circle
                    cx={c.x}
                    cy={c.y}
                    r={c.r + 9}
                    fill="none"
                    stroke={c.c}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    animate={reduce ? undefined : { rotate: 360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    style={{ originX: `${c.x}px`, originY: `${c.y}px` }}
                  />
                )}
                <circle cx={c.x} cy={c.y} r={c.r} fill={c.c} stroke="#16140f" strokeWidth={2} />
                <circle cx={c.x - c.r * 0.3} cy={c.y - c.r * 0.3} r={c.r * 0.28} fill="#fff" opacity={0.35} />
                <text x={c.x} y={c.y + c.r + 16} textAnchor="middle" fontSize={c.r > 20 ? 16 : 13.5} fontWeight={700} className="fill-slate-100" stroke="rgb(var(--c-surface-0))" strokeWidth={3} paintOrder="stroke">
                  {c.name}
                </text>
              </g>
            );
          })}
        </svg>
        {/* chú giải */}
        <div className="relative flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 px-3 py-2 text-[11px] text-slate-400">
          {(["bridge", "native", "rollup"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <svg width="22" height="6" aria-hidden>
                <line x1="0" y1="3" x2="22" y2="3" stroke={EDGE_COLOR[k]} strokeWidth="2.5" strokeDasharray={k === "native" ? "5 4" : undefined} />
              </svg>
              {t(`iob.graph.edge.${k}`)}
            </span>
          ))}
          {(["hack", "bug", "foiled"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: EV_COLOR[k] }} />
              {t(`iob.graph.ev.${k}`)}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-slate-400" /> {t("iob.graph.hub")}
          </span>
        </div>
      </div>

      {/* bảng sự kiện */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="label">{t("iob.graph.replay")}</span>
            <button className="chip" onClick={() => setAuto((a) => !a)} data-testid="iob-auto">
              {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {auto ? t("inc.player.pause") : t("inc.player.play")}
            </button>
          </div>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label={t("iob.graph.replay")}>
            {TIMELINE_EVENTS.map((b, i) => (
              <button
                key={`${b.name}-${b.a}`}
                role="tab"
                aria-selected={i === ei}
                title={`${b.ev!.date} · ${b.name}`}
                onClick={() => {
                  setEi(i);
                  setAuto(false);
                }}
                className="h-2.5 flex-1 rounded-full transition"
                style={{ background: i <= ei ? EV_COLOR[b.ev!.kind] : "rgb(var(--c-white) / 0.12)", minWidth: 10 }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={ei} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-3 space-y-2" data-testid="iob-event">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: EV_COLOR[ev.kind] }}>
                  <EvIcon className="h-3 w-3" /> {t(`iob.graph.ev.${ev.kind}`)}
                </span>
                <span className="font-mono text-xs text-slate-400">{ev.date}</span>
              </div>
              <div className="font-display text-base font-bold">{evName}</div>
              <div className="text-xs text-slate-400">
                {byId(cur.a).name} ↔ {byId(cur.b).name} · {cur.name}
              </div>
              {ev.usd && <div className="text-sm font-extrabold text-rose-300">{fmt(ev.usd)}</div>}
              <p className="text-sm leading-relaxed text-slate-300">{evBody}</p>
              {ev.source === "inc" && (
                <Link to={`/incidents?id=${ev.key}`} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200">
                  <PlayCircle className="h-3.5 w-3.5" /> {t("inc.view")}
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/[0.06] p-4">
          <div className="label mb-1">{t("iob.graph.cumul").replace("{date}", ev.date)}</div>
          <div className="font-display text-2xl font-extrabold text-rose-300">
            {lang === "vi" ? "≈ " : "≈ $"}
            <AnimatedNumber value={cumul / 1000} decimals={2} duration={0.8} locale={lang === "vi" ? "vi-VN" : "en-US"} />
            {lang === "vi" ? " tỷ USD" : "B"}
          </div>
          <div className="text-[11px] text-slate-400">{t("iob.graph.cumulNote")}</div>
        </div>
        <div className="min-h-[5.5rem] rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          {hovered ? (
            <>
              <div className="flex items-center gap-2 font-bold">
                <span className="h-3 w-3 rounded-full" style={{ background: hovered.c }} /> {hovered.name}
                {hovered.hub && <span className="chip text-[10px]">{t("iob.graph.hub")}</span>}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {hoveredEdges.length} {t("iob.graph.links")}: {hoveredEdges.map((b) => b.name).join(" · ")}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">{t("iob.graph.hint")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
