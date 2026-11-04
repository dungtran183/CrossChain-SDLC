import { motion } from "framer-motion";
import type { Relay, RelayCheck } from "./types";
import { useT } from "../../i18n/useT";

type Props = {
  relays: Relay[];
  threshold: number;
  checks: RelayCheck[] | null;
  signers: string[];
  valid: number | null;
  accepted: boolean | null;
  pulse: number;
};

/** Vòng ủy ban relay: nút sáng khi ký, đường gom chữ ký về tâm, thanh ngưỡng t/n. */
export default function CommitteeRing({ relays, threshold, checks, signers, valid, accepted, pulse }: Props) {
  const { t } = useT();
  const n = Math.max(relays.length, 5);
  const R = 92;
  const cx = 130;
  const cy = 120;
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  const names = relays.length ? relays.map((r) => r.name) : Array.from({ length: 5 }, (_, i) => `R${i + 1}`);
  const center = accepted === null ? "#94a3b8" : accepted ? "#34d399" : "#fb7185";

  return (
    <div className="relative">
      <svg viewBox="0 0 260 240" className="mx-auto w-full max-w-[300px]">
        <defs>
          <radialGradient id="ringGlow">
            <stop offset="0" stopColor={center} stopOpacity={0.35} />
            <stop offset="1" stopColor={center} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="none" className="stroke-white/20" strokeDasharray="3 5" />
        <motion.circle cx={cx} cy={cy} r={58} fill="url(#ringGlow)" key={`g${pulse}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} />
        {names.map((name, i) => {
          const p = pos(i);
          const isSigner = signers.includes(name);
          return (
            isSigner && (
              <motion.line
                key={`l${name}${pulse}`}
                x1={p.x}
                y1={p.y}
                x2={cx}
                y2={cy}
                stroke="#22d3ee"
                strokeWidth={2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 0.25 * signers.indexOf(name) }}
              />
            )
          );
        })}
        {names.map((name, i) => {
          const p = pos(i);
          const c = checks?.find((x) => x.relay === name);
          const isSigner = signers.includes(name);
          const fill = !c ? "rgba(148,163,184,0.12)" : !c.ok ? "rgba(244,63,94,0.25)" : isSigner ? "rgba(34,211,238,0.35)" : "rgba(20,184,166,0.15)";
          const stroke = !c ? "rgba(148,163,184,0.4)" : !c.ok ? "#fb7185" : isSigner ? "#22d3ee" : "#2dd4bf";
          return (
            <motion.g key={`${name}${pulse}`} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.08 * i, type: "spring" }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
              {isSigner && <circle cx={p.x} cy={p.y} r={22} fill="none" stroke="#22d3ee" strokeOpacity={0.4} className="animate-pulse" />}
              <circle cx={p.x} cy={p.y} r={17} fill={fill} stroke={stroke} strokeWidth={1.6} style={isSigner ? { filter: "drop-shadow(0 0 8px #22d3ee)" } : undefined} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-slate-100">
                {name}
              </text>
              {c && (
                <text x={p.x} y={p.y + 31} textAnchor="middle" fontSize={8.5} fill={c.ok ? (isSigner ? "#67e8f9" : "#5eead4") : "#fda4af"}>
                  {!c.ok ? "✗ refuse" : isSigner ? "✍ signed" : `✓ ${c.latency_ms ?? ""}ms`}
                </text>
              )}
            </motion.g>
          );
        })}
        <circle cx={cx} cy={cy} r={34} className="fill-surface-1" stroke={center} strokeWidth={1.5} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={800} className="fill-slate-50">
          {valid ?? 0}/{threshold}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={8} className="fill-slate-400">
          {t("cd1.ring.sigs")}
        </text>
      </svg>
      <div className="mx-auto mt-1 max-w-[260px]">
        <div className="mb-1 flex justify-between text-[10px] text-slate-400">
          <span>{t("cd1.ring.threshold")}</span>
          <span>
            t = {threshold} / n = {names.length}
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div className={`h-full ${accepted === false ? "bg-rose-500" : "bg-gradient-to-r from-cyan-400 to-teal-400"}`} animate={{ width: `${(Math.min(valid ?? 0, names.length) / names.length) * 100}%` }} transition={{ duration: 0.7 }} />
          <div className="absolute inset-y-0 w-[2px] bg-white" style={{ left: `${(threshold / names.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
