import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Gavel, X } from "lucide-react";
import type { Cd3State, TuneRes } from "./types";
import { useT } from "../../i18n/useT";
import Button from "../../components/Button";
import Slider from "../../components/Slider";
import AnimatedNumber from "../../components/fx/AnimatedNumber";
import { CHART } from "../../lib/theme";
import { MODE } from "../../lib/api";

const LEVEL_COLORS = ["#34d399", "#a3e635", "#fbbf24", "#fb923c", "#f43f5e", "#be123c"];

type Props = {
  st: Cd3State;
  decide: (id: number, ok: boolean) => void;
  busy: string | null;
  tune: TuneRes | null;
  w: { w_d: number; w_g: number; w_c: number };
  setW: (w: { w_d: number; w_g: number; w_c: number }) => void;
  runTune: () => void;
};

/** M3: thang R0–R5, hàng chờ phê duyệt, nhật ký phản ứng, G-surv (Gini/Lorenz), điều chỉnh F(Θ). */
export default function ResponsePanel({ st, decide, busy, tune, w, setW, runTune }: Props) {
  const { t } = useT();
  const maxLevel = Math.max(0, ...Object.values(st.levels).map((l) => Number(l.slice(1))), ...Object.values(st.executed).map((l) => Number(l.slice(1))));
  const pending = st.queue.filter((q) => q.status === "pending");
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="label mb-2">{t("cd3.m3.ladder")}</div>
          <div className="grid grid-cols-6 gap-1.5">
            {["R0", "R1", "R2", "R3", "R4", "R5"].map((l, i) => (
              <motion.div
                key={l}
                animate={i === maxLevel ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: i === maxLevel ? Infinity : 0, duration: 1.4 }}
                className={`rounded-lg border px-1 py-2 text-center ${i <= maxLevel ? "border-transparent" : "border-white/10 opacity-50"}`}
                style={i <= maxLevel ? { background: `${LEVEL_COLORS[i]}33`, boxShadow: i === maxLevel ? `0 0 20px -4px ${LEVEL_COLORS[i]}` : undefined } : undefined}
              >
                <div className="text-sm font-extrabold" style={{ color: LEVEL_COLORS[i] }}>
                  {l}
                </div>
                <div className="text-[9px] leading-tight text-slate-300">{t(`cd3.level.${l}`)}</div>
                {i >= 4 && <div className="mt-0.5 text-[8px] text-slate-400">👤 {t("cd3.m3.human")}</div>}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="label mb-2 flex items-center gap-1">
            <Gavel className="h-3 w-3" /> {t("cd3.m3.queue")}
          </div>
          {st.queue.length === 0 && <div className="text-xs text-slate-500">{t("cd3.m3.noQueue")}</div>}
          <div className="space-y-1.5">
            {[...st.queue].reverse().map((q) => (
              <motion.div key={q.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${q.status === "pending" ? "border-rose-400/50 bg-rose-500/10" : "border-white/10 bg-surface-0/40"}`}>
                <span className="rounded-md px-1.5 py-0.5 font-bold text-ink-950" style={{ background: LEVEL_COLORS[Number(q.level[1])] }}>
                  {q.level}
                </span>
                <span className="font-semibold">{q.target}</span>
                <span className="truncate text-slate-400">
                  {q.corridor} · r={q.r} · t{q.tick}
                </span>
                {q.status === "pending" ? (
                  <span className="ml-auto flex gap-1">
                    <Button size="sm" variant="success" onClick={() => decide(q.id, true)} loading={busy === `d${q.id}`} icon={<Check className="h-3 w-3" />}>
                      {t("cd3.m3.approve")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(q.id, false)} icon={<X className="h-3 w-3" />}>
                      {t("cd3.m3.reject")}
                    </Button>
                  </span>
                ) : (
                  <span className={`ml-auto ${q.status === "approved" ? "text-emerald-300" : "text-slate-400"}`}>{t(`cd3.m3.${q.status}`)}</span>
                )}
              </motion.div>
            ))}
          </div>
          {pending.length > 0 && <p className="mt-2 text-[10px] text-slate-500">{t("cd3.m3.noAuto")}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="label mb-2">{t("cd3.m3.log")}</div>
          <div className="max-h-44 space-y-1 overflow-auto">
            {[...st.actions].reverse().map((a, i) => (
              <div key={i} className="flex gap-2 text-[11px]">
                <span className="w-8 font-mono text-slate-500">t{a.tick}</span>
                <span className="w-7 font-bold" style={{ color: a.level.startsWith("R") ? LEVEL_COLORS[Number(a.level[1])] : "#94a3b8" }}>
                  {a.level}
                </span>
                <span className="text-slate-300">{a.note ?? `${a.target}${a.corridor ? ` · ${a.corridor}` : ""}${a.decision ? ` · ${a.decision}` : ""}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[150px_1fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <div className="label">G-surv (Gini)</div>
            <AnimatedNumber value={st.gsurv.gini} decimals={3} className="text-3xl font-extrabold text-amber-200" />
            <div className="mt-1 text-[10px] text-slate-400">{t("cd3.m3.giniHint")}</div>
          </div>
          <div className="h-40 rounded-xl border border-white/10 bg-surface-0/60 p-2">
            <ResponsiveContainer>
              <AreaChart data={st.gsurv.lorenz} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} />
                <XAxis dataKey="p" type="number" domain={[0, 1]} stroke={CHART.axis} />
                <YAxis domain={[0, 1]} stroke={CHART.axis} />
                <Tooltip />
                <Area dataKey="p" stroke="#64748b" strokeDasharray="4 4" fill="none" isAnimationActive={false} name="equality" />
                <Area dataKey="l" stroke="#fbbf24" fill="#fbbf2433" name="Lorenz" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="label mb-2">F(Θ) = w_d·U_det − w_g·G_surv − w_c·C_op</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Slider label="w_d" value={w.w_d} min={0} max={2} step={0.5} options={MODE === "replay" ? [1] : undefined} onChange={(v) => setW({ ...w, w_d: v })} color="#34d399" />
            <Slider label="w_g" value={w.w_g} min={0} max={2} step={0.5} options={MODE === "replay" ? [0, 0.5, 1, 1.5] : undefined} onChange={(v) => setW({ ...w, w_g: v })} color="#fbbf24" />
            <Slider label="w_c" value={w.w_c} min={0} max={2} step={0.1} options={MODE === "replay" ? [0.3] : undefined} onChange={(v) => setW({ ...w, w_c: v })} color="#f472b6" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" accent="from-amber-400 to-rose-500" onClick={runTune} loading={busy === "tune"}>
              {t("cd3.m3.tune")}
            </Button>
            {tune && (
              <span className="text-xs text-slate-300">
                θ* = <b>{tune.best.theta}</b> · U_det {tune.best.U_det} · G_surv {tune.best.G_surv} · C_op {tune.best.C_op}
              </span>
            )}
          </div>
          {tune && (
            <div className="mt-2 h-44">
              <ResponsiveContainer>
                <LineChart data={tune.curve} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} />
                  <XAxis dataKey="theta" stroke={CHART.axis} />
                  <YAxis stroke={CHART.axis} />
                  <Tooltip />
                  <Line dataKey="F" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                  <Line dataKey="U_det" stroke="#34d399" dot={false} strokeDasharray="4 3" />
                  <Line dataKey="G_surv" stroke="#f472b6" dot={false} strokeDasharray="4 3" />
                  <ReferenceDot x={tune.best.theta} y={tune.best.F} r={6} fill="#fbbf24" stroke="#fff" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
