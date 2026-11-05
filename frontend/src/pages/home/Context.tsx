// "Bối cảnh nghiên cứu" trên trang chủ: ba thẻ dẫn tới Internet of Blockchains, mô phỏng giao thức và động lực & phương pháp,
// mỗi thẻ có một minh họa động nhỏ.
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { useT } from "../../i18n/useT";

function ArtNet({ still }: { still: boolean }) {
  const n = [
    { x: 100, y: 45, c: "#3d8bff", r: 10 },
    { x: 40, y: 22, c: "#ffc730", r: 7 },
    { x: 162, y: 20, c: "#ff8f42", r: 7 },
    { x: 172, y: 70, c: "#a26bff", r: 6 },
    { x: 34, y: 72, c: "#ff4fa3", r: 7 },
    { x: 104, y: 82, c: "#00c9b0", r: 6 },
  ];
  const e = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [2, 3],
    [4, 5],
    [1, 4],
  ];
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      {e.map(([a, b], i) => (
        <line key={i} x1={n[a].x} y1={n[a].y} x2={n[b].x} y2={n[b].y} stroke="rgb(var(--c-white) / 0.25)" strokeWidth={1.5} />
      ))}
      {!still &&
        e.map(([a, b], i) => (
          <motion.circle
            key={`p${i}`}
            r={2.2}
            fill={n[a].c}
            initial={{ cx: n[a].x, cy: n[a].y, opacity: 0 }}
            animate={{ cx: [n[a].x, n[b].x], cy: [n[a].y, n[b].y], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      <motion.line
        x1={n[0].x}
        y1={n[0].y}
        x2={n[2].x}
        y2={n[2].y}
        stroke="#ff4b4b"
        strokeWidth={3}
        initial={{ opacity: 0 }}
        animate={still ? undefined : { opacity: [0, 0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.6, 0.7, 0.9] }}
      />
      {n.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} stroke="#16140f" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function ArtProto({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      <rect x={8} y={20} width={50} height={50} rx={8} className="fill-surface-1" stroke="#3d8bff" strokeWidth={2} />
      <rect x={142} y={20} width={50} height={50} rx={8} className="fill-surface-1" stroke="#ff8f42" strokeWidth={2} />
      {[78, 100, 122].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={22}
          r={7}
          initial={{ fill: "#94a3b8" }}
          animate={still ? undefined : { fill: ["#94a3b8", "#94a3b8", "#22c55e", "#22c55e"] }}
          transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.2 + i * 0.1, 0.3 + i * 0.1, 1] }}
          stroke="#16140f"
          strokeWidth={1.2}
        />
      ))}
      <motion.g initial={{ x: 58, y: 56 }} animate={still ? undefined : { x: [58, 58, 132], y: [56, 56, 56], opacity: [0, 1, 1] }} transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.55, 0.95] }}>
        <rect x={-10} y={-7} width={20} height={14} rx={2} fill="#fff" stroke="#a26bff" strokeWidth={2} />
        <path d="M -10 -7 L 0 1 L 10 -7" fill="none" stroke="#a26bff" strokeWidth={2} />
      </motion.g>
      <rect x={24} y={38} width={18} height={14} rx={3} fill="none" stroke="#3d8bff" strokeWidth={2} />
      <path d="M 28 38 v -4 a 5 5 0 0 1 10 0 v 4" fill="none" stroke="#3d8bff" strokeWidth={2} />
      <motion.rect
        x={159}
        y={36}
        width={16}
        height={16}
        rx={3}
        fill="#ff8f42"
        initial={{ opacity: 0 }}
        animate={still ? undefined : { opacity: [0, 0, 1, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
      />
    </svg>
  );
}

function ArtMethod({ still }: { still: boolean }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { x: 100 + 34 * Math.cos(a), y: 45 + 34 * Math.sin(a) };
  });
  const col = ["#3d8bff", "#ff4fa3", "#a26bff", "#00c9b0", "#ff8f42", "#22c55e"];
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      <circle cx={100} cy={45} r={34} fill="none" className="stroke-slate-400" strokeWidth={2} strokeDasharray="4 5" />
      <motion.g animate={still ? undefined : { rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ originX: "100px", originY: "45px" }}>
        <circle cx={100} cy={11} r={4} className="fill-slate-100" />
      </motion.g>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={7} fill={col[i]} stroke="#16140f" strokeWidth={1.5} />
      ))}
      <circle cx={100} cy={45} r={12} fill="none" stroke="#ff4b4b" strokeWidth={2} />
      <circle cx={100} cy={45} r={6} fill="none" stroke="#ff4b4b" strokeWidth={2} />
      <circle cx={100} cy={45} r={2} fill="#ff4b4b" />
    </svg>
  );
}

export default function Context() {
  const { t, tl } = useT();
  const still = !!useReducedMotion();
  const cards = tl("ctx.cards").map((s) => s.split("|"));
  const to = ["/iob", "/protocols", "/method"];
  const arts = [ArtNet, ArtProto, ArtMethod];
  const accents = ["#3d8bff", "#a26bff", "#00c9b0"];
  return (
    <section className="glass space-y-4 p-5 sm:p-6" data-testid="home-context">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 via-violet-500 to-teal-400 text-ink-950">
          <Compass className="h-5 w-5" />
        </span>
        <div>
          <div className="label">{t("ctx.label")}</div>
          <h2 className="text-lg font-bold sm:text-xl">{t("ctx.title")}</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([title, body, cta], i) => {
          const Art = arts[i];
          return (
            <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
              <Link to={to[i]} className="card-brut group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="h-24 border-b border-white/10 px-3 py-2" style={{ background: `${accents[i]}12` }}>
                  <Art still={still} />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <div className="font-display text-sm font-bold">{title}</div>
                  <p className="text-sm text-slate-300">{body}</p>
                  <span className="mt-auto flex items-center gap-1 pt-1 text-xs font-semibold" style={{ color: accents[i] }}>
                    {cta} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
