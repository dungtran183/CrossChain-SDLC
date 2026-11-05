// Động lực & phương pháp luận: chuỗi lập luận từ bối cảnh tới luận điểm, mô phỏng "phủ rủi ro" theo chuyên đề trên các sự cố
// thực tế, định vị so với các công trình liên quan, chu trình nghiên cứu khép kín, truy vết RQ → phương pháp → thước đo,
// và giới hạn của bản trình diễn.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, FlaskConical, Info, Target } from "lucide-react";
import { useT } from "../i18n/useT";
import { MODULES } from "../modules/registry";
import AnimatedNumber from "../components/fx/AnimatedNumber";
import { INCIDENTS, TOTAL_LOSS, type ModId } from "./incidents/data";

const MC: Record<ModId, string> = { cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42" };
const IDS: ModId[] = ["cd1", "cd2", "cd3"];

function Section({ label, title, body, children, id }: { label: string; title: string; body?: string; children: React.ReactNode; id?: string }) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.5 }} className="glass scroll-mt-24 space-y-4 p-4 sm:p-6">
      <div>
        <div className="label">{label}</div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {body && <p className="mt-1 max-w-4xl text-sm text-slate-300">{body}</p>}
      </div>
      {children}
    </motion.section>
  );
}

/** Chuỗi lập luận 5 bước, có gói tin chạy dọc theo chuỗi. */
function ArgumentChain() {
  const { tl } = useT();
  const items = tl("method.chain").map((s) => s.split("|"));
  const colors = ["#3d8bff", "#ff4b4b", "#ff8f42", "#a26bff", "#00c9b0"];
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <div className="absolute left-6 right-6 top-6 hidden h-[3px] rounded bg-gradient-to-r from-sky-400 via-rose-400 to-teal-400 opacity-50 lg:block" />
      {!reduce && (
        <motion.div className="absolute top-[18px] hidden h-3 w-3 rounded-full bg-white shadow-[0_0_14px_#fff] lg:block" animate={{ left: ["3%", "96%"] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} />
      )}
      <ol className="grid gap-3 lg:grid-cols-5">
        {items.map(([label, title, ev, to], i) => {
          const inner = (
            <>
              <span className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl border-2 border-surface-0 font-display text-lg font-black text-ink-950 shadow-lg" style={{ background: colors[i] }}>
                {i + 1}
              </span>
              <span className="label mt-2 block" style={{ color: colors[i] }}>
                {label}
              </span>
              <span className="mt-0.5 block text-sm font-bold leading-snug">{title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-400">{ev}</span>
              {to && <ArrowRight className="mt-2 h-3.5 w-3.5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />}
            </>
          );
          return (
            <motion.li key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 * i }}>
              {to?.startsWith("#") ? (
                <a
                  href={to}
                  onClick={(e) => (e.preventDefault(), document.getElementById(to.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }))}
                  className="group block h-full rounded-xl p-2 transition hover:bg-white/[0.04]"
                >
                  {inner}
                </a>
              ) : (
                <Link to={to || "/"} className="group block h-full rounded-xl p-2 transition hover:bg-white/[0.04]">
                  {inner}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/** Bộ mô phỏng phủ rủi ro: chọn tổ hợp chuyên đề → bao nhiêu tổn thất thực tế được phòng vệ. */
function Coverage() {
  const { t, lang } = useT();
  const [on, setOn] = useState<Record<ModId, boolean>>({ cd1: true, cd2: false, cd3: false });
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const loc = lang === "vi" ? "vi-VN" : "en-US";
  const list = useMemo(() => [...INCIDENTS].sort((a, b) => b.loss - a.loss), []);
  const max = list[0].loss;
  const covered = (by: ModId[]) => by.some((m) => on[m]);
  const share = (sel: ModId[]) => INCIDENTS.filter((x) => x.by.some((m) => sel.includes(m))).reduce((s, x) => s + x.loss, 0) / TOTAL_LOSS;
  const cur = share(IDS.filter((m) => on[m]));
  const n = INCIDENTS.filter((x) => covered(x.by)).length;
  const fmt = (m: number) => (lang === "vi" ? `${m.toLocaleString("vi-VN")} tr USD` : `$${m.toLocaleString("en-US")}M`);

  return (
    <div ref={ref} className="grid gap-5 xl:grid-cols-[1fr_1.3fr]" data-testid="method-coverage">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("method.cover.pick")}>
          {IDS.map((m) => (
            <button
              key={m}
              aria-pressed={on[m]}
              data-testid={`cover-${m}`}
              onClick={() => setOn((o) => ({ ...o, [m]: !o[m] }))}
              className="btn-brut flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition"
              style={on[m] ? { background: MC[m], borderColor: MC[m], color: "#16140f" } : { borderColor: `${MC[m]}88` }}
            >
              <span className="grid h-4 w-4 place-items-center rounded border border-current">{on[m] && <Check className="h-3 w-3" />}</span>
              {m.toUpperCase()} · {t(`${m}.name`)}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="label">{t("method.cover.covered")}</div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold" style={{ color: cur >= 0.999 ? "#22c55e" : "#ffc730" }} data-testid="cover-pct">
              <AnimatedNumber value={seen ? cur * 100 : 0} decimals={0} suffix="%" locale={loc} />
            </span>
            <span className="text-sm text-slate-400">
              {n}/{INCIDENTS.length} {t("inc.cases")}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-400 via-violet-500 to-orange-400" initial={false} animate={{ width: `${seen ? cur * 100 : 0}%` }} transition={{ duration: 0.8 }} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[["cd1"], ["cd2"], ["cd3"], IDS].map((sel) => (
              <div key={sel.join()} className="rounded-lg bg-surface-0/50 px-1 py-1.5">
                <div className="text-sm font-extrabold" style={{ color: sel.length === 3 ? "#22c55e" : MC[sel[0] as ModId] }}>
                  {Math.round(share(sel as ModId[]) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400">{sel.length === 3 ? t("method.cover.all") : `${t("method.cover.only")} ${sel[0].toUpperCase()}`}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{t("method.cover.conclusion")}</p>
      </div>

      <div className="space-y-1.5">
        {list.map((x) => {
          const c = covered(x.by);
          return (
            <motion.div key={x.id} layout className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm sm:grid-cols-[9rem_1fr_5.5rem_auto]">
              <Link to={`/incidents?id=${x.id}`} className="truncate font-semibold hover:underline">
                {x.name}
              </Link>
              <div className="h-5 overflow-hidden rounded-md bg-white/[0.06]">
                <motion.div className="h-full rounded-md" initial={false} animate={{ width: `${(x.loss / max) * 100}%`, background: c ? "#22c55e" : "#ff4b4b" }} transition={{ duration: 0.5 }} />
              </div>
              <span className={`hidden text-right font-mono text-[11px] font-semibold sm:block ${c ? "text-emerald-400" : "text-rose-400"}`}>{fmt(x.loss)}</span>
              <div className="flex gap-1">
                {IDS.map((m) => (
                  <span
                    key={m}
                    className="grid h-5 w-7 place-items-center rounded text-[9px] font-black"
                    style={x.by.includes(m) ? { background: on[m] ? MC[m] : `${MC[m]}33`, color: on[m] ? "#16140f" : MC[m] } : { background: "transparent", color: "rgb(var(--c-slate-600))" }}
                  >
                    {x.by.includes(m) ? m.slice(2) : "·"}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
        <p className="pt-1 text-[11px] text-slate-500">{t("method.cover.note")}</p>
      </div>
    </div>
  );
}

/** Ma trận định vị so với các công trình liên quan. */
function GapMatrix() {
  const { t, tl } = useT();
  const cols = tl("method.gap.cols");
  const rows = tl("method.gap.rows").map((s) => s.split("|"));
  const mark = (v: string) =>
    v === "●" ? (
      <span className="inline-block h-3.5 w-3.5 rounded-full bg-emerald-400" aria-label="●" />
    ) : v === "◐" ? (
      <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-amber-400 bg-[linear-gradient(90deg,#fbbf24_50%,transparent_50%)]" aria-label="◐" />
    ) : (
      <span className="text-slate-600">—</span>
    );
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm" data-testid="method-gap">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-2 py-1 text-left font-semibold">{t("method.gap.work")}</th>
              {cols.map((c) => (
                <th key={c} className="px-2 py-1 text-center font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, venue, ...v], i) => {
              const me = i === rows.length - 1;
              return (
                <motion.tr key={name} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.06 * i }} className={me ? "bg-teal-500/15" : "bg-white/[0.03]"}>
                  <td className={`rounded-l-lg px-2 py-2 ${me ? "font-bold" : ""}`}>
                    <div>{name}</div>
                    <div className="text-[11px] text-slate-400">{venue}</div>
                  </td>
                  {v.map((x, j) => (
                    <td key={j} className={`px-2 py-2 text-center ${j === v.length - 1 ? "rounded-r-lg" : ""}`}>
                      {mark(x)}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">{t("method.gap.note")}</p>
    </div>
  );
}

/** Chu trình nghiên cứu khép kín 6 bước. */
function Cycle() {
  const { t, tl } = useT();
  const steps = tl("method.cycle.steps").map((s) => s.split("|"));
  const links = ["/incidents", "/iob", "/cd1", "/playground", "/cd3", "/"];
  const colors = ["#3d8bff", "#ff4fa3", "#a26bff", "#00c9b0", "#ff8f42", "#22c55e"];
  const [sel, setSel] = useState(0);
  const [auto, setAuto] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.4 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!auto || !inView || reduce) return;
    const h = window.setTimeout(() => setSel((i) => (i + 1) % steps.length), 5200);
    return () => window.clearTimeout(h);
  }, [auto, inView, reduce, sel, steps.length]);
  const C = 170;
  const R = 122;
  const pt = (i: number) => {
    const a = ((-90 + (i * 360) / steps.length) * Math.PI) / 180;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
  };
  const s = steps[sel] ?? [];
  return (
    <div ref={box} className="grid items-center gap-5 lg:grid-cols-[minmax(0,360px)_1fr]" onPointerDown={() => setAuto(false)} data-testid="method-cycle">
      <svg viewBox="0 0 340 340" className="mx-auto h-auto w-full max-w-[360px] select-none" role="img" aria-label={t("method.cycle.title")}>
        <defs>
          <marker id="cyArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="rgb(var(--c-slate-400))" />
          </marker>
        </defs>
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgb(var(--c-white) / 0.2)" strokeWidth={3} strokeDasharray="6 7" />
        {steps.map((_, i) => {
          const a = pt(i);
          const b = pt((i + 1) % steps.length);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const k = 1.12;
          return (
            <path key={`e${i}`} d={`M ${a.x} ${a.y} Q ${C + (mx - C) * k} ${C + (my - C) * k} ${b.x} ${b.y}`} fill="none" stroke="rgb(var(--c-slate-400))" strokeWidth={1.5} markerEnd="url(#cyArrow)" opacity={0.6} />
          );
        })}
        {!reduce && (
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ originX: `${C}px`, originY: `${C}px` }}>
            <circle cx={C} cy={C - R} r={5} className="fill-slate-100" />
          </motion.g>
        )}
        <text x={C} y={C - 8} textAnchor="middle" fontSize={13} fontWeight={800} className="fill-slate-100">
          {t("method.cycle.center")}
        </text>
        <text x={C} y={C + 10} textAnchor="middle" fontSize={10} className="fill-slate-400">
          {t("method.cycle.centerSub")}
        </text>
        {steps.map(([name], i) => {
          const p = pt(i);
          const on = i === sel;
          return (
            <g
              key={i}
              onClick={() => {
                setSel(i);
                setAuto(false);
              }}
              className="cursor-pointer"
            >
              <motion.circle cx={p.x} cy={p.y} r={on ? 26 : 21} fill={colors[i]} stroke="#16140f" strokeWidth={2} initial={false} animate={{ r: on ? 26 : 21 }} />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={15} fontWeight={900} fill="#16140f">
                {i + 1}
              </text>
              <text x={p.x} y={p.y + (p.y > C ? 42 : -32)} textAnchor="middle" fontSize={10.5} fontWeight={on ? 800 : 600} className={on ? "fill-slate-100" : "fill-slate-400"}>
                {name}
              </text>
            </g>
          );
        })}
      </svg>
      <motion.div key={sel} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 rounded-2xl border p-5" style={{ borderColor: `${colors[sel]}88`, background: `${colors[sel]}10` }}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg font-black text-ink-950" style={{ background: colors[sel] }}>
            {sel + 1}
          </span>
          <span className="font-display text-base font-bold">{s[0]}</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{s[1]}</p>
        <div>
          <div className="label mb-1">{t("method.cycle.output")}</div>
          <p className="text-sm text-slate-300">{s[2]}</p>
        </div>
        <Link to={links[sel]} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-200 hover:text-white">
          {s[3]} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <div className="flex gap-1 pt-1">
          {steps.map((_, i) => (
            <button key={i} aria-label={`${i + 1}`} onClick={() => (setSel(i), setAuto(false))} className="h-1.5 flex-1 rounded-full" style={{ background: i === sel ? colors[i] : "rgb(var(--c-white) / 0.15)" }} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/** Truy vết câu hỏi nghiên cứu → phương pháp → thước đo → nơi trình diễn. */
function Trace() {
  const { t, tl } = useT();
  const rq = tl("big.rq");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5 text-sm" data-testid="method-trace">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
            <th className="px-2 py-1 font-semibold">{t("method.trace.rq")}</th>
            <th className="px-2 py-1 font-semibold">{t("method.trace.method")}</th>
            <th className="px-2 py-1 font-semibold">{t("method.trace.metric")}</th>
            <th className="px-2 py-1 font-semibold">{t("method.trace.demo")}</th>
          </tr>
        </thead>
        <tbody>
          {MODULES.map((m, i) => (
            <tr key={m.id} className="bg-white/[0.03] align-top">
              <td className="w-[32%] rounded-l-lg border-l-4 px-3 py-2" style={{ borderColor: MC[m.id] }}>
                <div className="mb-0.5 text-xs font-black" style={{ color: MC[m.id] }}>
                  RQ{i + 1} · {m.id.toUpperCase()}
                </div>
                <div className="text-slate-200">{rq[i]}</div>
              </td>
              <td className="px-3 py-2 text-slate-300">{t(`method.trace.${m.id}`)}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {tl(`big.${m.id}.results`).map((r) => {
                    const [v, l] = r.split("|");
                    return (
                      <span key={r} className="rounded-md bg-surface-0/50 px-1.5 py-0.5 text-[11px]">
                        <b style={{ color: MC[m.id] }}>{v}</b> <span className="text-slate-400">{l}</span>
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="rounded-r-lg px-3 py-2">
                <Link to={m.path} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-slate-200 hover:text-white">
                  {t(`${m.id}.name`)} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Method() {
  const { t, tl } = useT();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="chip">
          <Target className="h-3 w-3" /> {t("method.badge")}
        </span>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("method.title")}</h1>
        <p className="max-w-4xl text-slate-300">{t("method.body")}</p>
      </header>

      <Section label={t("method.chainLabel")} title={t("method.chainTitle")}>
        <ArgumentChain />
      </Section>

      <Section label={t("method.cover.label")} title={t("method.cover.title")} body={t("method.cover.body")}>
        <Coverage />
      </Section>

      <Section id="gap" label={t("method.gap.label")} title={t("method.gap.title")} body={t("method.gap.body")}>
        <GapMatrix />
      </Section>

      <Section label={t("method.cycle.label")} title={t("method.cycle.title")} body={t("method.cycle.body")}>
        <Cycle />
      </Section>

      <Section label={t("method.trace.label")} title={t("method.trace.title")}>
        <Trace />
      </Section>

      <section className="glass space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-400" />
          <span className="label">{t("method.limits.label")}</span>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {tl("method.limits.items").map((x) => (
            <li key={x} className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {x}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-[11px] leading-relaxed text-slate-500">{t("method.refs")}</p>
    </div>
  );
}
