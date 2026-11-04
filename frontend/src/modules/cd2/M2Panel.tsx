import { motion } from "framer-motion";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { EmbeddingRes, M2Res } from "./types";
import { CLS_COLORS } from "./types";
import { useT } from "../../i18n/useT";
import Gauge from "../../components/Gauge";
import { CHART } from "../../lib/theme";

type Props = { m2: M2Res; emb: EmbeddingRes; k: number; setK: (k: 1 | 5) => void; catLabel: (c: string) => string };

const Star = (props: { cx?: number; cy?: number; fill?: string }) => {
  const { cx = 0, cy = 0, fill } = props;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 5 : 12;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} stroke="#fff" strokeWidth={1.2} style={{ filter: `drop-shadow(0 0 6px ${fill})` }} />;
};

const Query = (props: { cx?: number; cy?: number }) => {
  const { cx = 0, cy = 0 } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={16} fill="none" stroke="#fff" strokeOpacity={0.5} className="animate-pulse" />
      <rect x={cx - 7} y={cy - 7} width={14} height={14} transform={`rotate(45 ${cx} ${cy})`} fill="#fff" stroke="#8b5cf6" strokeWidth={2} />
    </g>
  );
};

/** M2 · few-shot prototype: không gian nhúng 2D, prototype (sao), mẫu truy vấn (kim cương) nối tới prototype. */
export default function M2Panel({ m2, emb, k, setK, catLabel }: Props) {
  const { t } = useT();
  const classes = Object.keys(CLS_COLORS);
  const sortedProbs = Object.entries(m2.probs).sort((a, b) => b[1] - a[1]);
  const nearest = emb.prototypes.find((p) => p.cls === m2.label);
  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold">{t("cd2.m2.space")}</div>
          <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
            {[1, 5].map((v) => (
              <button key={v} onClick={() => setK(v as 1 | 5)} className={`relative rounded-md px-3 py-1 ${k === v ? "text-ink-950" : "text-slate-300"}`}>
                {k === v && <motion.span layoutId="kshot" className="absolute inset-0 rounded-md bg-gradient-to-r from-violet-400 to-indigo-400" />}
                <span className="relative">{v}-shot</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-[360px]">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis type="number" dataKey="x" stroke={CHART.axis} tick={false} />
              <YAxis type="number" dataKey="y" stroke={CHART.axis} tick={false} width={10} />
              <ZAxis range={[28, 28]} />
              <Tooltip cursor={false} formatter={(v: number) => v.toFixed(2)} />
              {classes.map((c) => (
                <Scatter key={c} name={c} data={emb.points.filter((p) => p.cls === c)} fill={CLS_COLORS[c]} fillOpacity={0.45} isAnimationActive />
              ))}
              {classes.map((c) => (
                <Scatter key={`s${c}`} data={emb.points.filter((p) => p.cls === c && p.support)} fill="none" stroke={CLS_COLORS[c]} strokeWidth={1.5} shape="circle" />
              ))}
              {emb.prototypes.map((p) => (
                <Scatter key={`l${p.cls}`} data={[m2.point, { x: p.x, y: p.y }]} line={{ stroke: CLS_COLORS[p.cls], strokeOpacity: p.cls === m2.label ? 0.9 : 0.15, strokeWidth: p.cls === m2.label ? 2.5 : 1, strokeDasharray: p.cls === m2.label ? undefined : "4 4" }} shape={() => <g />} />
              ))}
              {emb.prototypes.map((p) => (
                <Scatter key={`p${p.cls}`} data={[p]} fill={CLS_COLORS[p.cls]} shape={<Star />} />
              ))}
              <Scatter data={[m2.point]} shape={<Query />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          {classes.map((c) => (
            <span key={c} className="flex items-center gap-1 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLS_COLORS[c] }} /> {catLabel(c)}
            </span>
          ))}
          <span className="text-slate-500">★ prototype · ◆ {t("cd2.m2.query")} · ○ support</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Gauge value={m2.p_vuln} label="p_vuln" size={140} />
          <div className="min-w-0">
            <div className="label">{t("cd2.m2.predicted")}</div>
            <div className="text-lg font-bold" style={{ color: CLS_COLORS[m2.label] }}>
              {catLabel(m2.label)}
            </div>
            <div className="text-xs text-slate-400">
              {k}-shot · d = {m2.distances[m2.label]?.toFixed(3)} {nearest ? "" : ""}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {t("cd2.m2.episode")}: 1-shot <b className="text-slate-200">{(emb.episode_accuracy["1"] * 100).toFixed(1)}%</b> → 5-shot{" "}
              <b className="text-slate-200">{(emb.episode_accuracy["5"] * 100).toFixed(1)}%</b>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="label mb-2">{t("cd2.m2.attention")}</div>
          {Object.entries(m2.contributions).map(([v, a], i) => (
            <div key={v} className="mb-1.5 flex items-center gap-2 text-xs">
              <span className="w-20 text-slate-300">{t(`cd2.view.${v}`)}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                <motion.div className="h-full rounded-full" style={{ background: ["#a78bfa", "#60a5fa", "#f472b6"][i] }} initial={{ width: 0 }} animate={{ width: `${a * 100}%` }} transition={{ duration: 0.7 }} />
              </div>
              <span className="w-10 text-right font-mono text-slate-400">{(a * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="label mb-2">{t("cd2.m2.probs")}</div>
          {sortedProbs.map(([c, p]) => (
            <div key={c} className="mb-1 flex items-center gap-2 text-[11px]">
              <span className="w-36 truncate text-slate-300">{catLabel(c)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <motion.div className="h-full rounded-full" style={{ background: CLS_COLORS[c] }} initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.6 }} />
              </div>
              <span className="w-10 text-right font-mono text-slate-400">{(p * 100).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
