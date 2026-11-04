// "Lần đầu đến đây?" — bốn thẻ giải thích dễ hiểu, mỗi thẻ có một minh họa động nhỏ.
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useT } from "../../i18n/useT";

const C = { a: "#3d8bff", b: "#ff8f42", v: "#a26bff", r: "#ff4b4b", cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42", gold: "#ffc730" };

/** Khóa ở A → phát hành ở B. */
function ArtBridge({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      <rect x={8} y={22} width={54} height={50} rx={8} className="fill-surface-1" stroke={C.a} strokeWidth={2} />
      <rect x={138} y={22} width={54} height={50} rx={8} className="fill-surface-1" stroke={C.b} strokeWidth={2} />
      <text x={35} y={16} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-slate-300">A</text>
      <text x={165} y={16} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-slate-300">B</text>
      <path d="M 62 47 Q 100 10 138 47" fill="none" stroke={C.v} strokeWidth={2.5} strokeDasharray="4 4" />
      <rect x={24} y={38} width={22} height={18} rx={3} fill="none" className="stroke-slate-300" strokeWidth={2} />
      <path d="M 29 38 v -5 a 6 6 0 0 1 12 0 v 5" fill="none" className="stroke-slate-300" strokeWidth={2} />
      <motion.circle r={6} fill={C.gold} stroke="#b98600" style={{ offsetPath: 'path("M 62 47 Q 100 10 138 47")' }} animate={still ? undefined : { offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.5 }} />
      <motion.circle cx={165} cy={47} r={9} fill={C.gold} stroke="#b98600" animate={still ? undefined : { scale: [0, 0, 1, 1], opacity: [0, 0, 1, 1] }} transition={{ duration: 2.7, repeat: Infinity, times: [0, 0.75, 0.85, 1] }} style={{ transformOrigin: "165px 47px" }} />
    </svg>
  );
}

/** Kho tài sản bị rút bởi kẻ tấn công. */
function ArtAttack({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      <rect x={20} y={16} width={70} height={64} rx={10} className="fill-surface-1" stroke={C.a} strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.ellipse key={i} cx={55} cy={70 - i * 10} rx={22} ry={5} fill={C.gold} stroke="#b98600" animate={still ? undefined : { opacity: [1, 1, i > 1 ? 0.1 : 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.3 + i * 0.08, 0.4 + i * 0.08, 1] }} />
      ))}
      <circle cx={160} cy={40} r={12} className="fill-slate-200" />
      <path d="M 146 78 Q 160 52 174 78 Z" className="fill-slate-200" />
      <rect x={152} y={36} width={16} height={5} rx={2} fill={C.r} />
      {[0, 1, 2].map((i) => (
        <motion.ellipse key={i} rx={7} ry={3} fill={C.gold} stroke="#b98600" initial={{ cx: 80, cy: 40, opacity: 0 }} animate={still ? undefined : { cx: [80, 140], cy: [40, 58], opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4, repeatDelay: 1.6 }} />
      ))}
    </svg>
  );
}

/** Vòng đời khép kín 5 giai đoạn. */
function ArtCycle({ still }: { still: boolean }) {
  const pts = [0, 1, 2, 3, 4].map((i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return { x: 100 + 32 * Math.cos(a), y: 46 + 32 * Math.sin(a) };
  });
  const col = [C.cd1, C.cd2, C.cd2, C.cd3, C.cd3];
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      <circle cx={100} cy={46} r={32} fill="none" className="stroke-slate-400" strokeWidth={2} strokeDasharray="4 5" />
      <motion.g animate={still ? undefined : { rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 46px" }}>
        <circle cx={100} cy={14} r={4} className="fill-slate-100" />
      </motion.g>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={9} className="fill-surface-1" stroke={col[i]} strokeWidth={2.5} />
          <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={9} fontWeight={800} className="fill-slate-100">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Ba khiên của ba chuyên đề. */
function ArtShields({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      {(["cd1", "cd2", "cd3"] as const).map((k, i) => {
        const x = 46 + i * 54;
        return (
          <motion.g key={k} animate={still ? undefined : { y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35 }}>
            <path d={`M${x} 18 l20 8 v13 c0 13 -8 21 -20 26 c-12 -5 -20 -13 -20 -26 v-13 z`} fill={C[k]} stroke="#16140f" strokeWidth={2} />
            <text x={x} y={46} textAnchor="middle" fontSize={10} fontWeight={800} fill="#16140f">
              {k.toUpperCase()}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

const ART = [ArtBridge, ArtAttack, ArtCycle, ArtShields];

export default function Newcomer() {
  const { t, tl } = useT();
  const reduce = useReducedMotion() ?? false;
  const cards = tl("newbie.cards").map((s) => s.split("|"));
  return (
    <section className="space-y-3" id="newcomer" data-testid="newcomer">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="chip">
            <GraduationCap className="h-3 w-3" /> {t("newbie.badge")}
          </span>
          <h2 className="mt-2 font-display text-lg font-bold">{t("newbie.title")}</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, body], i) => {
          const Art = ART[i] ?? ArtBridge;
          return (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4 }}
              className="glass flex flex-col gap-3 p-4"
            >
              <div className="h-24 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <Art still={reduce} />
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-surface-0">{i + 1}</span>
                <h3 className="font-semibold leading-tight">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{body}</p>
              {i === 1 && (
                <Link to="/incidents" className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200">
                  {t("newbie.more")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
