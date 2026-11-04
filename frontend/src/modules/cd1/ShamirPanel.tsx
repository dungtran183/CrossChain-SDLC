import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { KeySquare } from "lucide-react";
import type { Client } from "../../lib/api";
import { MODE } from "../../lib/api";
import type { ShamirRes } from "./types";
import { useT } from "../../i18n/useT";
import { complete } from "../../lib/progress";
import { CHART } from "../../lib/theme";

/** Shamir (t, n): chọn mảnh → khôi phục bí mật tại x = 0; đủ t mảnh mới đúng. */
export default function ShamirPanel({ api }: { api: Client }) {
  const { t } = useT();
  const [use, setUse] = useState<number[]>([1, 2, 3]);
  const [data, setData] = useState<ShamirRes | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const body = useMemo(() => ({ secret: 1234, t: 3, n: 5, use: [...use].sort() }), [use]);

  useEffect(() => {
    let alive = true;
    api
      .post<ShamirRes>("/api/cd1/shamir", body)
      .then((d) => alive && (setData(d), setErr(null)))
      .catch((e) => alive && setErr(String(e.message ?? e)));
    return () => {
      alive = false;
    };
  }, [api, body]);

  const toggle = (x: number) => (complete("cd1", "shamir"), setUse((u) => (u.includes(x) ? u.filter((v) => v !== x) : [...u, x])));
  const presets = MODE === "replay" ? [[1, 2, 3], [1, 2], [2, 4, 5], [1, 2, 3, 4, 5]] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-3">
        <p className="text-sm text-slate-300">{t("cd1.shamir.body")}</p>
        <div className="flex flex-wrap gap-2">
          {(data?.shares ?? [1, 2, 3, 4, 5].map((x) => ({ x, y: 0 }))).map((s) => {
            const on = use.includes(s.x);
            const disabled = presets !== null;
            return (
              <motion.button
                key={s.x}
                whileTap={{ scale: 0.92 }}
                disabled={disabled}
                onClick={() => toggle(s.x)}
                className={`rounded-xl border px-3 py-2 text-left font-mono text-xs transition ${on ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_-6px_#22d3ee]" : "border-white/10 bg-white/[0.03] text-slate-400"}`}
              >
                <KeySquare className="mb-1 h-3.5 w-3.5" />R{s.x}
                <div>
                  ({s.x}, {s.y})
                </div>
              </motion.button>
            );
          })}
        </div>
        {presets && (
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.join()} onClick={() => (complete("cd1", "shamir"), setUse(p))} className={`chip ${p.join() === [...use].sort().join() ? "border-cyan-300/60 text-cyan-100" : ""}`}>
                {"{"}
                {p.map((x) => `R${x}`).join(", ")}
                {"}"}
              </button>
            ))}
          </div>
        )}
        <motion.div
          key={`${data?.recovered}-${use.length}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-xl border p-3 text-sm ${data?.ok ? "border-emerald-400/40 bg-emerald-400/10" : "border-rose-400/40 bg-rose-500/10"}`}
        >
          <div className="text-xs text-slate-400">
            {t("cd1.shamir.recovered")} ({use.length}/{data?.t ?? 3} {t("cd1.shamir.shares")})
          </div>
          <div className="font-mono text-2xl font-bold">{data?.recovered ?? "—"}</div>
          <div className="text-xs">{data?.ok ? t("cd1.shamir.ok") : t("cd1.shamir.fail")}</div>
        </motion.div>
        {err && <div className="text-xs text-rose-300">{err}</div>}
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <ComposedChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} />
            <XAxis type="number" dataKey="x" domain={[0, 5.5]} ticks={[0, 1, 2, 3, 4, 5]} stroke={CHART.axis} />
            <YAxis type="number" dataKey="y" stroke={CHART.axis} width={48} />
            <Tooltip cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
            <Line data={data?.curve ?? []} dataKey="y" stroke="#22d3ee" dot={false} strokeWidth={2} isAnimationActive />
            <Scatter data={(data?.shares ?? []).filter((s) => use.includes(s.x))} fill="#5eead4" />
            <Scatter data={(data?.shares ?? []).filter((s) => !use.includes(s.x))} fill="#475569" />
            <Scatter data={data ? [{ x: 0, y: 1234 }] : []} fill="#fbbf24" shape="star" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-1 text-center text-[11px] text-slate-500">f(x) = {data?.coeffs.map((c, i) => (i === 0 ? `${c}` : `${c}x${i > 1 ? `^${i}` : ""}`)).join(" + ")} · GF({data?.p})</div>
      </div>
    </div>
  );
}
