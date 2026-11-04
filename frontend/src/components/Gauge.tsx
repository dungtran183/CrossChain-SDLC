import { motion } from "framer-motion";
import AnimatedNumber from "./fx/AnimatedNumber";

type Props = { value: number; label?: string; size?: number; colors?: [string, string, string]; suffix?: string; decimals?: number };

/** Đồng hồ cung 240°; màu theo ngưỡng thấp/trung/cao. value ∈ [0,1]. */
export default function Gauge({ value, label, size = 150, colors = ["#34d399", "#fbbf24", "#fb7185"], suffix = "", decimals = 2 }: Props) {
  const v = Math.max(0, Math.min(1, value || 0));
  const r = 52;
  const C = 2 * Math.PI * r;
  const arc = (240 / 360) * C;
  const color = v < 0.4 ? colors[0] : v < 0.7 ? colors[1] : colors[2];
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size * 0.82 }}>
      <svg viewBox="0 0 120 110" width={size} height={size * 0.92} className="absolute top-0">
        <g transform="rotate(150 60 60)">
          <circle cx="60" cy="60" r={r} fill="none" className="stroke-white/10" strokeWidth="9" strokeDasharray={`${arc} ${C}`} strokeLinecap="round" />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${C}`}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: arc * (1 - v) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </g>
      </svg>
      <div className="relative mt-2 text-center">
        <AnimatedNumber value={v} decimals={decimals} className="text-2xl font-extrabold tabular-nums" suffix={suffix} />
        {label && <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>}
      </div>
    </div>
  );
}
