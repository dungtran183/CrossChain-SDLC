// Minh họa động "Internet of Blockchains" ở chân thanh bên: các chuỗi nối bằng cầu, gói tin chạy liên tục,
// định kỳ một cầu bị tấn công (lóe đỏ). Co giãn theo khoảng trống còn lại dưới menu (đo bằng ResizeObserver), ẩn khi hết chỗ;
// bấm để mở trang Internet of Blockchains.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useT } from "../i18n/useT";

const N = [
  { x: 112, y: 48, r: 11, c: "#3d8bff" },
  { x: 44, y: 20, r: 8, c: "#ffc730" },
  { x: 182, y: 18, r: 8, c: "#ff8f42" },
  { x: 196, y: 68, r: 7, c: "#a26bff" },
  { x: 150, y: 86, r: 7, c: "#00c9b0" },
  { x: 66, y: 84, r: 8, c: "#ff4fa3" },
  { x: 20, y: 56, r: 6, c: "#22c55e" },
];
const E: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [5, 6],
  [1, 6],
  [2, 3],
  [4, 3],
];
const HACK = 2; // cạnh bị tấn công định kỳ

export default function SidebarNetwork() {
  const { t } = useT();
  const still = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // chiều cao hình (px) vừa với khoảng trống còn lại; null = không đủ chỗ
  const [svgH, setSvgH] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    const nav = box?.firstElementChild as HTMLElement | null;
    if (!el || !box || !nav || typeof ResizeObserver === "undefined") return;
    const check = () => {
      // khoảng trống còn lại − (lề + viền + khoảng cách ≈ 30px); hình co giãn trong [48px, tỷ lệ gốc 220×100]
      const full = ((box.clientWidth - 26) * 100) / 220;
      const room = box.clientHeight - nav.offsetHeight - 30;
      setSvgH(room >= 48 ? Math.min(full, room) : null);
    };
    const ro = new ResizeObserver(check);
    ro.observe(box);
    ro.observe(nav);
    check();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="mt-auto shrink-0 pt-3" style={{ display: svgH ? undefined : "none" }}>
      <Link to="/iob" className="group relative block rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:bg-white/[0.06]" data-testid="sidebar-iob" aria-label={t("app.nav.iob")}>
        <svg viewBox="0 0 220 100" preserveAspectRatio="xMidYMid meet" className="w-full" style={{ height: svgH ?? 0 }} aria-hidden>
          {E.map(([a, b], i) => (
            <line key={i} x1={N[a].x} y1={N[a].y} x2={N[b].x} y2={N[b].y} stroke="rgb(var(--c-white) / 0.22)" strokeWidth={1.5} />
          ))}
          {!still &&
            E.map(([a, b], i) => (
              <motion.circle
                key={`p${i}`}
                r={2.4}
                fill={N[a].c}
                initial={{ cx: N[a].x, cy: N[a].y, opacity: 0 }}
                animate={{ cx: [N[a].x, N[b].x], cy: [N[a].y, N[b].y], opacity: [0, 1, 0] }}
                transition={{ duration: 2 + (i % 3) * 0.5, repeat: Infinity, delay: i * 0.37, ease: "easeInOut" }}
              />
            ))}
          {/* cầu bị tấn công: lóe đỏ rồi tắt */}
          <motion.line
            x1={N[E[HACK][0]].x}
            y1={N[E[HACK][0]].y}
            x2={N[E[HACK][1]].x}
            y2={N[E[HACK][1]].y}
            stroke="#ff4b4b"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={still ? undefined : { opacity: [0, 0, 1, 1, 0] }}
            transition={{ duration: 6, times: [0, 0.6, 0.65, 0.85, 0.9], repeat: Infinity }}
          />
          {N.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} stroke="rgb(var(--c-surface-1))" strokeWidth={2} />
              {i === 0 && (
                <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize={8} fontWeight={800} fill="#16140f">
                  Ξ
                </text>
              )}
            </g>
          ))}
        </svg>
        <span className="absolute bottom-1.5 left-2 rounded-md bg-surface-1/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 transition group-hover:text-white">
          {t("app.iobWidget")} →
        </span>
      </Link>
    </div>
  );
}
