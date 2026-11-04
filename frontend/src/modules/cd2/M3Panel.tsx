import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Play, Server, ShieldCheck } from "lucide-react";
import type { M3Res } from "./types";
import { CLS_COLORS } from "./types";
import { useT } from "../../i18n/useT";
import Slider from "../../components/Slider";
import Button from "../../components/Button";
import { CHART } from "../../lib/theme";

type Props = { res: M3Res | null; eps: number; alpha: number; setEps: (v: number) => void; setAlpha: (v: number) => void; run: () => void; busy: boolean; accent: string };

/** Sơ đồ 5 client ↔ server, gói tin chạy mỗi vòng; ε tích lũy; accuracy DP vs không DP. */
function FedDiagram({ round, res }: { round: number; res: M3Res | null }) {
  const cx = 200;
  const cy = 120;
  const clients = res?.clients ?? Array.from({ length: 5 }, (_, i) => ({ client: `C${i + 1}`, samples: 0, label_hist: [] as number[] }));
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      {clients.map((c, i) => {
        const a = Math.PI + (i / (clients.length - 1)) * Math.PI;
        const x = cx + 165 * Math.cos(a) * 0.95;
        const y = cy + 95 * Math.sin(a) + 100;
        const d = `M ${x} ${y - 18} L ${cx} ${cy + 18}`;
        const total = c.label_hist.reduce((s, v) => s + v, 0) || 1;
        let acc = 0;
        return (
          <g key={c.client}>
            <path d={d} stroke="rgba(167,139,250,0.25)" strokeDasharray="3 5" />
            {round > 0 && (
              <>
                <motion.circle key={`u${round}`} r={3.5} fill="#c4b5fd" style={{ offsetPath: `path("${d}")`, filter: "drop-shadow(0 0 4px #a78bfa)" }} initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 0.45, delay: i * 0.04 }} />
                <motion.circle key={`d${round}`} r={2.5} fill="#34d399" style={{ offsetPath: `path("${d}")` }} initial={{ offsetDistance: "100%", opacity: 0 }} animate={{ offsetDistance: "0%", opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
              </>
            )}
            <rect x={x - 26} y={y - 18} width={52} height={36} rx={9} fill="rgba(139,92,246,0.12)" stroke="#8b5cf6" strokeOpacity={0.6} />
            <text x={x} y={y - 3} textAnchor="middle" fontSize={10} fontWeight={700} fill="#e9d5ff">
              {c.client}
            </text>
            {c.label_hist.map((v, k) => {
              const w = (v / total) * 44;
              const el = <rect key={k} x={x - 22 + acc} y={y + 6} width={w} height={5} fill={Object.values(CLS_COLORS)[k]} />;
              acc += w;
              return el;
            })}
          </g>
        );
      })}
      <motion.g animate={round > 0 ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.5 }} key={round} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={26} fill="rgba(99,102,241,0.2)" stroke="#818cf8" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#e0e7ff">
          FedAvg
        </text>
      </motion.g>
      <text x={cx} y={cy - 36} textAnchor="middle" fontSize={11} fill="#a5b4fc">
        round {round}/{res?.rounds ?? "–"}
      </text>
    </svg>
  );
}

export default function M3Panel({ res, eps, alpha, setEps, setAlpha, run, busy, accent }: Props) {
  const { t } = useT();
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (!res) return;
    setRound(0);
    let r = 0;
    const id = setInterval(() => {
      r += 1;
      setRound(r);
      if (r >= res.rounds) clearInterval(id);
    }, 320);
    return () => clearInterval(id);
  }, [res]);
  const hist = (res?.history ?? []).slice(0, round).map((h) => ({ ...h, baseline: res?.baseline[h.round - 1]?.accuracy }));
  const cur = hist[hist.length - 1];
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-2">
          <FedDiagram round={round} res={res} />
        </div>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Slider label={t("cd2.m3.eps")} value={eps} min={0.5} max={4} step={0.5} options={[0.5, 1, 2, 4]} onChange={setEps} format={(v) => `ε = ${v}`} />
          <Slider label={t("cd2.m3.alpha")} value={alpha} min={0.1} max={1} step={0.1} options={[0.1, 1]} onChange={setAlpha} format={(v) => `α = ${v}`} color="#60a5fa" />
          <Button accent={accent} icon={<Play className="h-4 w-4" />} onClick={run} loading={busy} className="w-full">
            {t("cd2.m3.run")}
          </Button>
          {res && (
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-lg bg-white/5 py-1.5">
                <div className="font-mono text-sm text-slate-100">{res.sigma}</div>σ
              </div>
              <div className="rounded-lg bg-white/5 py-1.5">
                <div className="font-mono text-sm text-slate-100">C = {res.clip}</div>clip
              </div>
              <div className="rounded-lg bg-white/5 py-1.5">
                <div className="font-mono text-sm text-slate-100">{res.delta}</div>δ
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: t("cd2.m3.accDp"), v: cur ? `${(cur.accuracy * 100).toFixed(1)}%` : "—", c: "text-violet-200" },
            { k: t("cd2.m3.accBase"), v: cur?.baseline !== undefined ? `${(cur.baseline * 100).toFixed(1)}%` : "—", c: "text-slate-200" },
            { k: t("cd2.m3.epsSpent"), v: cur?.epsilon !== null && cur ? `ε = ${cur.epsilon}` : "—", c: "text-amber-200" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className={`text-xl font-bold tabular-nums ${x.c}`}>{x.v}</div>
              <div className="text-[11px] text-slate-400">{x.k}</div>
            </div>
          ))}
        </div>
        <div className="h-52 rounded-xl border border-white/10 bg-ink-950/60 p-2">
          <ResponsiveContainer>
            <LineChart data={hist} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis dataKey="round" stroke={CHART.axis} />
              <YAxis domain={[0, 1]} stroke={CHART.axis} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="accuracy" name={t("cd2.m3.accDp")} stroke="#a78bfa" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="baseline" name={t("cd2.m3.accBase")} stroke="#94a3b8" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-40 rounded-xl border border-white/10 bg-ink-950/60 p-2">
            <div className="label px-2">{t("cd2.m3.epsCurve")}</div>
            <ResponsiveContainer height="85%">
              <AreaChart data={hist} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="epsG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#fbbf24" stopOpacity={0.5} />
                    <stop offset="1" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} />
                <XAxis dataKey="round" stroke={CHART.axis} />
                <YAxis stroke={CHART.axis} />
                <Tooltip />
                <Area type="monotone" dataKey="epsilon" stroke="#fbbf24" fill="url(#epsG)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-40 rounded-xl border border-white/10 bg-ink-950/60 p-2">
            <div className="label flex items-center gap-1 px-2">
              <ShieldCheck className="h-3 w-3" /> {t("cd2.m3.clip")}
            </div>
            <ResponsiveContainer height="85%">
              <LineChart data={hist} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} />
                <XAxis dataKey="round" stroke={CHART.axis} />
                <YAxis stroke={CHART.axis} />
                <Tooltip />
                <Line dataKey="grad_norm_pre" name="‖g‖ pre" stroke="#fb7185" dot={false} isAnimationActive={false} />
                <Line dataKey="grad_norm_post" name="‖g‖ post ≤ C" stroke="#34d399" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-slate-500">
          <Server className="h-3 w-3" /> {t("cd2.m3.note")}
        </p>
      </div>
    </div>
  );
}
