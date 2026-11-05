// Mô hình phân lớp của giao tiếp liên chuỗi (giống ngăn xếp mạng): thông điệp đi xuống ngăn xếp chuỗi A, qua lớp truyền tải,
// rồi đi lên ngăn xếp chuỗi B. Mỗi lớp có mối đe dọa riêng và chuyên đề phòng vệ tương ứng — chọn một lớp để xem.
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useT } from "../../i18n/useT";

type ModId = "cd1" | "cd2" | "cd3";
const MC: Record<ModId, string> = { cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42" };
const LAYERS: { k: string; c: string; by: ModId[] }[] = [
  { k: "app", c: "#ff4fa3", by: ["cd2", "cd3"] },
  { k: "msg", c: "#a26bff", by: ["cd1", "cd2"] },
  { k: "verify", c: "#00c9b0", by: ["cd1", "cd2"] },
  { k: "transport", c: "#3d8bff", by: ["cd3"] },
  { k: "consensus", c: "#ffc730", by: ["cd3"] },
];
const Y0 = 16;
const RH = 62;
const GAP = 6;
const rowY = (i: number) => Y0 + i * (RH + GAP);
const mid = (i: number) => rowY(i) + RH / 2;

export default function Layers() {
  const { t, tl } = useT();
  const [sel, setSel] = useState(2);
  const reduce = useReducedMotion();
  const path = `M 74 ${mid(0)} L 74 ${mid(3)} L 686 ${mid(3)} L 686 ${mid(0)}`;
  const L = LAYERS[sel];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]" data-testid="iob-layers">
      <svg viewBox="0 0 760 356" className="h-auto w-full select-none" role="img" aria-label={t("iob.layers.title")}>
        {LAYERS.map((l, i) => {
          const on = i === sel;
          return (
            <g key={l.k} onClick={() => setSel(i)} className="cursor-pointer">
              <rect x={6} y={rowY(i)} width={748} height={RH} rx={12} fill={on ? `${l.c}22` : "rgb(var(--c-white) / 0.03)"} stroke={on ? l.c : "rgb(var(--c-white) / 0.12)"} strokeWidth={on ? 2.5 : 1.2} />
              {[12, 624].map((x) => (
                <rect key={x} x={x} y={rowY(i) + 6} width={124} height={RH - 12} rx={9} fill={l.c} opacity={on ? 0.95 : 0.7} stroke="#16140f" strokeWidth={1.5} />
              ))}
              {[74, 686].map((x, j) => (
                <text key={x} x={x} y={mid(i) + 4} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#16140f">
                  {i === 4 ? (j ? t("proto.s.chainB") : t("proto.s.chainA")) : t(`iob.layers.${l.k}.name`)}
                </text>
              ))}
              <text x={350} y={mid(i) - 4} textAnchor="middle" fontSize={15} fontWeight={800} className="fill-slate-100">
                L{5 - i} · {t(`iob.layers.${l.k}.name`)}
              </text>
              <text x={350} y={mid(i) + 15} textAnchor="middle" fontSize={11} className="fill-slate-400">
                {t(`iob.layers.${l.k}.ex`)}
              </text>
              {l.by.map((m, j) => (
                <g key={m} transform={`translate(${574 - (l.by.length - 1 - j) * 38} ${mid(i) - 10})`}>
                  <rect width={34} height={20} rx={5} fill={MC[m]} stroke="#16140f" strokeWidth={1.2} />
                  <text x={17} y={14} textAnchor="middle" fontSize={10} fontWeight={900} fill="#16140f">
                    {m.toUpperCase()}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        {/* đường đi của thông điệp */}
        <path d={path} fill="none" stroke="rgb(var(--c-white) / 0.5)" strokeWidth={2.5} strokeDasharray="7 6" />
        {!reduce &&
          [0, 1].map((k) => (
            <motion.g key={k} style={{ offsetPath: `path("${path}")` }} animate={{ offsetDistance: ["0%", "100%"] }} transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: k * 3.5 }}>
              <rect x={-13} y={-9} width={26} height={18} rx={3} fill="#fff" stroke="#16140f" strokeWidth={2} />
              <path d="M -13 -9 L 0 2 L 13 -9" fill="none" stroke="#16140f" strokeWidth={2} />
            </motion.g>
          ))}
      </svg>

      <motion.div key={L.k} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: `${L.c}88`, background: `${L.c}10` }}>
        <div className="flex items-center gap-2">
          <span className="rounded-md px-2 py-0.5 font-mono text-xs font-black text-ink-950" style={{ background: L.c }}>
            L{5 - sel}
          </span>
          <span className="font-display text-base font-bold">{t(`iob.layers.${L.k}.name`)}</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{t(`iob.layers.${L.k}.role`)}</p>
        <div>
          <div className="label mb-1">{t("world.threats")}</div>
          <div className="flex flex-wrap gap-1.5">
            {tl(`iob.layers.${L.k}.threats`).map((x) => (
              <span key={x} className="rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-200">
                ⚠ {x}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="label mb-1">{t("iob.layers.defense")}</div>
          <div className="space-y-1.5">
            {L.by.map((m) => (
              <div key={m} className="flex gap-2 text-sm text-slate-200">
                <span className="mt-0.5 inline-flex h-5 shrink-0 items-center gap-0.5 rounded px-1 text-[10px] font-black text-ink-950" style={{ background: MC[m] }}>
                  <ShieldCheck className="h-3 w-3" /> {m.toUpperCase()}
                </span>
                {t(`iob.layers.${L.k}.${m}`)}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
