// Khối dựng SVG dùng chung cho các mô phỏng giao thức liên chuỗi (viewBox 600×300).
// Màu theo bộ nhận diện blockchainist.net; nền/viền chữ đổi theo theme qua lớp fill-surface-1 / fill-slate-*.
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export const K = {
  a: "#3d8bff",
  b: "#ff8f42",
  v: "#a26bff",
  red: "#ff4b4b",
  green: "#22c55e",
  gold: "#ffc730",
  goldEdge: "#b98600",
  teal: "#00c9b0",
  pink: "#ff4fa3",
  ink: "#16140f",
  gray: "#94a3b8",
};

export type P = { x: number; y: number };

/** Khung một chuỗi: hình chữ nhật bo góc, tiêu đề và phụ đề (mono). */
export function ChainBox({ x, y, w, h, color, title, sub, alert }: { x: number; y: number; w: number; h: number; color: string; title: string; sub?: string; alert?: boolean }) {
  return (
    <g>
      <motion.rect x={x} y={y} width={w} height={h} rx={14} className="fill-surface-1" initial={false} animate={{ stroke: alert ? K.red : color }} strokeWidth={alert ? 3 : 2} />
      <text x={x + w / 2} y={y + 18} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-slate-100">
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + 31} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" className="fill-slate-400">
          {sub}
        </text>
      )}
    </g>
  );
}

/** Chuỗi khối nhỏ nằm ngang hoặc dọc, có thể chạy (khối mới xuất hiện). */
export function Blocks({
  x,
  y,
  n,
  color,
  dir = "h",
  w = 22,
  h = 14,
  gap = 8,
  start = 0,
  hi,
}: {
  x: number;
  y: number;
  n: number;
  color: string;
  dir?: "h" | "v";
  w?: number;
  h?: number;
  gap?: number;
  start?: number;
  hi?: number;
}) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const bx = dir === "h" ? x + i * (w + gap) : x;
        const by = dir === "v" ? y + i * (h + gap) : y;
        const isHi = hi === i;
        return (
          <g key={i}>
            <motion.rect
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              x={bx}
              y={by}
              width={w}
              height={h}
              rx={3}
              fill={isHi ? `${K.gold}` : `${color}22`}
              stroke={isHi ? K.goldEdge : color}
              strokeWidth={1.4}
            />
            {w >= 30 && (
              <text x={bx + w / 2} y={by + h / 2 + 3} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" className="fill-slate-300">
                #{start + i}
              </text>
            )}
            {i < n - 1 &&
              (dir === "h" ? (
                <line x1={bx + w} y1={by + h / 2} x2={bx + w + gap} y2={by + h / 2} stroke={color} strokeOpacity={0.6} />
              ) : (
                <line x1={bx + w / 2} y1={by + h} x2={bx + w / 2} y2={by + h + gap} stroke={color} strokeOpacity={0.6} />
              ))}
          </g>
        );
      })}
    </g>
  );
}

/** Hình người dùng / tác nhân. `bad` = kẻ tấn công (mặt nạ đỏ); `off` = mất kết nối (mờ). */
export function Person({ x, y, label, bad, off, s = 1, color }: { x: number; y: number; label?: string; bad?: boolean; off?: boolean; s?: number; color?: string }) {
  return (
    <motion.g initial={false} animate={{ opacity: off ? 0.35 : 1 }}>
      <circle cx={x} cy={y - 10 * s} r={10 * s} className={color ? undefined : "fill-slate-200"} fill={color} />
      <path d={`M${x - 12 * s} ${y + 18 * s} Q${x} ${y - 4 * s} ${x + 12 * s} ${y + 18 * s} Z`} className={color ? undefined : "fill-slate-200"} fill={color} />
      {bad && <rect x={x - 7 * s} y={y - 13 * s} width={14 * s} height={4 * s} rx={2} fill={K.red} />}
      {label && (
        <text x={x} y={y + 30 * s} textAnchor="middle" fontSize={10} fontWeight={600} className="fill-slate-300">
          {label}
        </text>
      )}
    </motion.g>
  );
}

export type NodeState = "idle" | "watch" | "ok" | "bad" | "off";
const NODE_FILL: Record<NodeState, string> = { idle: K.gray, watch: K.a, ok: K.green, bad: K.red, off: "#64748b" };

/** Nút validator / notary / watcher. */
export function Node({ x, y, r = 9, state = "idle", check, label, delay = 0 }: { x: number; y: number; r?: number; state?: NodeState; check?: boolean; label?: string; delay?: number }) {
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={r}
        initial={false}
        animate={{ fill: NODE_FILL[state], scale: state === "bad" ? [1, 1.3, 1] : 1, opacity: state === "off" ? 0.4 : 1 }}
        transition={{ delay, duration: 0.4 }}
        stroke="rgb(var(--c-white))"
        strokeWidth={1.4}
        style={{ originX: `${x}px`, originY: `${y}px` }}
      />
      {check && (
        <motion.path
          d={`M${x - r * 0.45} ${y} l${r * 0.32} ${r * 0.34} l${r * 0.6} -${r * 0.7}`}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.35 }}
        />
      )}
      {label && (
        <text x={x} y={y + r + 11} textAnchor="middle" fontSize={8.5} fontFamily="JetBrains Mono" className="fill-slate-400">
          {label}
        </text>
      )}
    </g>
  );
}

/** Chồng đồng xu (kho tài sản); `n` đồng còn lại trên `max`. */
export function Coins({ x, y, n, max = 8, rx = 26 }: { x: number; y: number; n: number; max?: number; rx?: number }) {
  return (
    <g>
      {Array.from({ length: max }, (_, i) => (
        <motion.ellipse key={i} cx={x} cy={y - i * 9} rx={rx} ry={6} initial={false} animate={{ opacity: i < n ? 1 : 0.08 }} fill={K.gold} stroke={K.goldEdge} strokeWidth={1.4} />
      ))}
    </g>
  );
}

export function Coin({ r = 7 }: { r?: number }) {
  return <ellipse cx={0} cy={0} rx={r * 1.3} ry={r * 0.6} fill={K.gold} stroke={K.goldEdge} strokeWidth={1.4} />;
}

/** Token đã được phát hành (hình vuông bo góc). `bad` = không có bảo chứng. */
export function Token({ bad, s = 14 }: { bad?: boolean; s?: number }) {
  return (
    <g>
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={3} fill={bad ? K.red : K.b} stroke={bad ? "#7f1d1d" : "#9a4a10"} strokeWidth={1.2} />
      <text x={0} y={3} textAnchor="middle" fontSize={8} fontWeight={800} fill="#fff">
        w
      </text>
    </g>
  );
}

/** Ổ khóa: `open` = đã mở; `label` ghi bên dưới (ví dụ H). */
export function Lock({ x, y, open, color = "currentColor", label }: { x: number; y: number; open?: boolean; color?: string; label?: string }) {
  return (
    <g>
      <rect x={x - 9} y={y - 2} width={18} height={14} rx={3} fill="none" stroke={color} strokeWidth={2} />
      <motion.path
        d={`M ${x - 5} ${y - 2} v -5 a 5 5 0 0 1 10 0 v 5`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        initial={false}
        animate={{ y: open ? -5 : 0, rotate: open ? -20 : 0 }}
        style={{ originX: `${x + 5}px`, originY: `${y - 2}px` }}
      />
      {label && (
        <text x={x} y={y + 9} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

/** Chìa khóa (bí mật s). */
export function KeyIcon({ color = K.gold }: { color?: string }) {
  return (
    <g>
      <circle cx={-6} cy={0} r={5} fill="none" stroke={color} strokeWidth={2.4} />
      <path d="M -1 0 H 10 M 6 0 V 4 M 9 0 V 3" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

/** Đồng hồ hẹn giờ dạng vòng: `frac` 0..1 thời gian đã trôi. */
export function Timer({ x, y, frac, label, color = K.a, r = 13, expired }: { x: number; y: number; frac: number; label: string; color?: string; r?: number; expired?: boolean }) {
  const c = 2 * Math.PI * r;
  const tone = expired ? K.red : color;
  return (
    <g>
      <circle cx={x} cy={y} r={r} className="fill-surface-1" stroke="rgb(var(--c-white) / 0.15)" strokeWidth={3} />
      <motion.circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - Math.min(1, frac)) }}
        transition={{ duration: 0.9 }}
        transform={`rotate(-90 ${x} ${y})`}
        strokeLinecap="round"
      />
      <text x={x} y={y + 3} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={tone}>
        {label}
      </text>
    </g>
  );
}

/** Nhãn dạng viên thuốc. Bề rộng ước lượng theo số ký tự. */
export function Tag({
  x,
  y,
  text,
  color = K.v,
  solid,
  anchor = "middle",
  size = 9.5,
  delay = 0,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  solid?: boolean;
  anchor?: "start" | "middle" | "end";
  size?: number;
  delay?: number;
}) {
  const w = Math.max(24, text.length * size * 0.56 + 14);
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return (
    <motion.g initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
      <rect x={x0} y={y - size - 2} width={w} height={size + 9} rx={(size + 9) / 2} fill={solid ? color : `${color}22`} stroke={color} strokeWidth={1.3} />
      <text x={x0 + w / 2} y={y + 1.5} textAnchor="middle" fontSize={size} fontWeight={700} fill={solid ? "#16140f" : color}>
        {text}
      </text>
    </motion.g>
  );
}

/** Phong bì thông điệp, vẽ quanh gốc (0,0). */
export function Envelope({ color = K.v, bad, label }: { color?: string; bad?: boolean; label?: string }) {
  const c = bad ? K.red : color;
  return (
    <g>
      <rect x={-14} y={-9} width={28} height={18} rx={3} fill="#fff" stroke={c} strokeWidth={2} />
      <path d="M -14 -9 L 0 2 L 14 -9" fill="none" stroke={c} strokeWidth={2} />
      {label && (
        <text x={0} y={22} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={c}>
          {label}
        </text>
      )}
    </g>
  );
}

/** Di chuyển phần tử con từ `from` tới `to` (con được vẽ quanh gốc 0,0). `via` = điểm trung gian. */
export function Fly({ from, to, via, children, dur = 1.1, delay = 0, keep = true, repeat }: { from: P; to: P; via?: P[]; children: ReactNode; dur?: number; delay?: number; keep?: boolean; repeat?: number }) {
  const xs = [from.x, ...(via ?? []).map((p) => p.x), to.x];
  const ys = [from.y, ...(via ?? []).map((p) => p.y), to.y];
  return (
    <motion.g initial={{ x: from.x, y: from.y, opacity: 0 }} animate={{ x: xs, y: ys, opacity: keep ? [0, 1, 1] : [0, 1, 1, 0] }} transition={{ duration: dur, delay, ease: "easeInOut", repeat, repeatDelay: 0.4 }}>
      {children}
    </motion.g>
  );
}

/** Tia quan sát / truyền tin vẽ dần. */
export function Beam({ a, b, color = K.a, dash, delay = 0, width = 2, arrow }: { a: P; b: P; color?: string; dash?: boolean; delay?: number; width?: number; arrow?: string }) {
  return (
    <motion.line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash ? "5 5" : undefined}
      markerEnd={arrow ? `url(#${arrow})` : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.9 }}
      transition={{ duration: 0.7, delay }}
    />
  );
}

/** Vụ nổ nhỏ báo sự cố. */
export function Burst({ x, y, color = K.red, r = 22 }: { x: number; y: number; color?: string; r?: number }) {
  return (
    <g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <motion.line
          key={a}
          x1={x}
          y1={y}
          x2={x + r * Math.cos((a * Math.PI) / 180)}
          y2={y + r * Math.sin((a * Math.PI) / 180)}
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.8 }}
        />
      ))}
    </g>
  );
}

/** Dấu kiểm / dấu chéo trong vòng tròn. */
export function Verdict({ x, y, ok, r = 11 }: { x: number; y: number; ok: boolean; r?: number }) {
  const c = ok ? K.green : K.red;
  return (
    <motion.g initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} style={{ originX: `${x}px`, originY: `${y}px` }}>
      <circle cx={x} cy={y} r={r} fill={c} stroke="#16140f" strokeWidth={1.5} />
      {ok ? (
        <path d={`M${x - r * 0.45} ${y} l${r * 0.3} ${r * 0.35} l${r * 0.6} -${r * 0.7}`} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
      ) : (
        <path d={`M${x - r * 0.4} ${y - r * 0.4} l${r * 0.8} ${r * 0.8} M${x + r * 0.4} ${y - r * 0.4} l-${r * 0.8} ${r * 0.8}`} stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
      )}
    </motion.g>
  );
}

/** Định nghĩa marker mũi tên dùng chung (đặt trong <defs>). */
export function Arrows({ prefix }: { prefix: string }) {
  return (
    <defs>
      {Object.entries({ red: K.red, a: K.a, v: K.v, green: K.green, b: K.b, gray: K.gray }).map(([k, c]) => (
        <marker key={k} id={`${prefix}-${k}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

/** Khung SVG chuẩn cho mọi cảnh. */
export function Stage({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 600 300" className="h-auto w-full select-none" role="img" aria-label={label}>
      {children}
    </svg>
  );
}
