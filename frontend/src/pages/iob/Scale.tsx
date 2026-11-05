// Bài toán N²: nối N chuỗi theo từng cặp cần N(N−1)/2 cầu nối, mỗi cầu một giả định tin cậy và một khối mã riêng.
// Với xác suất minh họa p mỗi cầu gặp sự cố trong một năm, xác suất có ít nhất một sự cố tăng rất nhanh theo N.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useT } from "../../i18n/useT";
import AnimatedNumber from "../../components/fx/AnimatedNumber";

function Ring({ n, hub }: { n: number; hub?: boolean }) {
  const pts = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return { x: 110 + 88 * Math.cos(a), y: 110 + 88 * Math.sin(a) };
      }),
    [n],
  );
  const edges = useMemo(() => {
    if (hub) return pts.map((p) => [p, { x: 110, y: 110 }] as const);
    const e: (readonly [{ x: number; y: number }, { x: number; y: number }])[] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) e.push([pts[i], pts[j]] as const);
    return e;
  }, [pts, n, hub]);
  const w = n > 24 ? 0.6 : n > 12 ? 0.9 : 1.4;
  return (
    <svg viewBox="0 0 220 220" className="h-auto w-full" aria-hidden>
      {edges.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hub ? "#00c9b0" : "#a26bff"} strokeOpacity={hub ? 0.8 : 0.5} strokeWidth={w} />
      ))}
      {hub && <circle cx={110} cy={110} r={16} fill="#ff4fa3" stroke="#16140f" strokeWidth={2} />}
      {pts.map((p, i) => (
        <motion.circle
          key={`${n}-${i}`}
          cx={p.x}
          cy={p.y}
          r={n > 24 ? 3.5 : 5}
          fill="#3d8bff"
          stroke="#16140f"
          strokeWidth={1.2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.01 }}
          style={{ originX: `${p.x}px`, originY: `${p.y}px` }}
        />
      ))}
    </svg>
  );
}

export default function Scale() {
  const { t, lang } = useT();
  const [n, setN] = useState(12);
  const [p, setP] = useState(2);
  const mesh = (n * (n - 1)) / 2;
  const risk = (m: number) => 100 * (1 - Math.pow(1 - p / 100, m));
  const loc = lang === "vi" ? "vi-VN" : "en-US";
  const num = (v: number, d = 0) => v.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]" data-testid="iob-scale">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 flex justify-between text-sm">
            <span className="font-semibold">{t("iob.scale.n")}</span>
            <span className="font-mono font-bold">{n}</span>
          </span>
          <input type="range" min={2} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-full accent-violet-500" aria-label={t("iob.scale.n")} />
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-sm">
            <span className="font-semibold">{t("iob.scale.p")}</span>
            <span className="font-mono font-bold">{num(p, 1)}%</span>
          </span>
          <input type="range" min={0.5} max={5} step={0.5} value={p} onChange={(e) => setP(Number(e.target.value))} className="w-full accent-rose-500" aria-label={t("iob.scale.p")} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-violet-400/40 bg-violet-500/10 p-3">
            <div className="label">{t("iob.scale.mesh")}</div>
            <div className="font-display text-2xl font-extrabold text-violet-300">
              <AnimatedNumber value={mesh} locale={loc} duration={0.5} />
            </div>
            <div className="text-[11px] text-slate-400">{t("iob.scale.bridges")}</div>
            <div className="mt-2 text-sm font-bold text-rose-300">
              <AnimatedNumber value={risk(mesh)} decimals={1} suffix="%" locale={loc} duration={0.5} />
            </div>
            <div className="text-[11px] text-slate-400">{t("iob.scale.risk")}</div>
          </div>
          <div className="rounded-xl border border-teal-400/40 bg-teal-500/10 p-3">
            <div className="label">{t("iob.scale.hub")}</div>
            <div className="font-display text-2xl font-extrabold text-teal-300">
              <AnimatedNumber value={n} locale={loc} duration={0.5} />
            </div>
            <div className="text-[11px] text-slate-400">{t("iob.scale.links")}</div>
            <div className="mt-2 text-sm font-bold text-amber-300">
              <AnimatedNumber value={risk(n)} decimals={1} suffix="%" locale={loc} duration={0.5} />
            </div>
            <div className="text-[11px] text-slate-400">{t("iob.scale.riskHub")}</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{t("iob.scale.body")}</p>
        <p className="text-[11px] text-slate-500">{t("iob.scale.note")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
          <Ring n={n} />
          <div className="text-center text-xs font-semibold text-slate-300">{t("iob.scale.meshCap").replace("{m}", num(mesh))}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
          <Ring n={n} hub />
          <div className="text-center text-xs font-semibold text-slate-300">{t("iob.scale.hubCap").replace("{n}", num(n))}</div>
        </div>
      </div>
    </div>
  );
}
