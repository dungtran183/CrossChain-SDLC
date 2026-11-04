import { motion } from "framer-motion";
import { useId } from "react";

type Props = {
  /** Đường SVG (toạ độ trong viewBox). */
  d: string;
  viewBox?: string;
  color?: string;
  /** Mỗi lần đổi `pulseKey` → một gói tin chạy dọc đường. */
  pulseKey?: number | string;
  active?: boolean;
  danger?: boolean;
  className?: string;
  label?: string;
};

/** Đường kết nối phát sáng, có gói tin chạy dọc khi `pulseKey` thay đổi; nét đứt chạy liên tục khi `active`. */
export default function FlowBeam({ d, viewBox = "0 0 100 20", color = "#22d3ee", pulseKey, active, danger, className = "", label }: Props) {
  const id = useId().replace(/:/g, "");
  const c = danger ? "#fb7185" : color;
  return (
    <svg viewBox={viewBox} className={`overflow-visible ${className}`} preserveAspectRatio="none" aria-label={label}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor={c} stopOpacity={0.1} />
          <stop offset="50%" stopColor={c} stopOpacity={0.6} />
          <stop offset="100%" stopColor={c} stopOpacity={0.1} />
        </linearGradient>
        <filter id={`f${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <path d={d} fill="none" stroke={`url(#g${id})`} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {active && (
        <motion.path
          d={d}
          fill="none"
          stroke={c}
          strokeWidth={1.5}
          strokeDasharray="4 8"
          vectorEffect="non-scaling-stroke"
          animate={{ strokeDashoffset: [0, -24] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      )}
      {pulseKey !== undefined && pulseKey !== 0 && (
        <g key={String(pulseKey)}>
          <motion.circle
            r={2.6}
            fill={c}
            filter={`url(#f${id})`}
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ offsetPath: `path("${d}")` }}
          />
          <motion.circle
            r={1.3}
            fill="#fff"
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ offsetPath: `path("${d}")` }}
          />
        </g>
      )}
    </svg>
  );
}
