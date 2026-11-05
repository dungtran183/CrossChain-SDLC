// Các cơ chế giao tiếp liên chuỗi: mô phỏng động từng giao thức (luồng chuẩn ↔ sự cố), giả định tin cậy, ưu/nhược,
// sự cố thực tế, liên hệ với luận án, bảng so sánh và tam giác bất khả của khả năng tương tác.
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, Bug, CheckCircle2, Flame, PlayCircle, ShieldCheck, Swords, Waypoints } from "lucide-react";
import { useT } from "../i18n/useT";
import { MODULES } from "../modules/registry";
import { focusAnchor } from "../lib/activity";
import ProtoPlayer from "./learn/ProtoPlayer";
import { MOD_COLOR, PROTOCOLS, type Mode, type ProtoDef, type ProtoId } from "./learn/protocols";

function Dots({ v, color, label }: { v: number; color: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={label} aria-label={label ? `${label}: ${v}/5` : `${v}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full border border-white/20" style={{ background: i <= v ? color : "transparent" }} />
      ))}
    </span>
  );
}

const KIND_ICON = { hack: Flame, bug: Bug, foiled: CheckCircle2, attack: Swords } as const;
const KIND_TONE = { hack: "#ff4b4b", bug: "#ff8f42", foiled: "#22c55e", attack: "#a26bff" } as const;

/** Tam giác bất khả của khả năng tương tác (trustless · extensible · generalizable). */
function Trilemma({ sel, onPick }: { sel: ProtoId; onPick: (id: ProtoId) => void }) {
  const { t } = useT();
  const V = [
    { x: 210, y: 34 },
    { x: 40, y: 300 },
    { x: 380, y: 300 },
  ];
  const pos = (w: [number, number, number]) => ({ x: w[0] * V[0].x + w[1] * V[1].x + w[2] * V[2].x, y: w[0] * V[0].y + w[1] * V[1].y + w[2] * V[2].y });
  const labels = [t("proto.tri.trustless"), t("proto.tri.extensible"), t("proto.tri.general")];
  return (
    <svg viewBox="0 0 420 340" className="h-auto w-full" role="img" aria-label={t("proto.tri.title")}>
      <polygon points={V.map((p) => `${p.x},${p.y}`).join(" ")} className="fill-white/[0.03]" stroke="rgb(var(--c-white) / 0.35)" strokeWidth={2} strokeDasharray="6 5" />
      {V.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={6} className="fill-slate-100" />
          <text x={p.x + (i === 0 ? 0 : i === 1 ? -4 : 4)} y={i === 0 ? p.y - 14 : p.y + 24} textAnchor={i === 0 ? "middle" : i === 1 ? "start" : "end"} fontSize={13} fontWeight={800} className="fill-slate-100">
            {labels[i]}
          </text>
        </g>
      ))}
      {PROTOCOLS.map((p) => {
        const c = pos(p.tri);
        const on = p.id === sel;
        return (
          <g key={p.id} onClick={() => onPick(p.id)} className="cursor-pointer">
            {on && (
              <motion.circle
                cx={c.x}
                cy={c.y}
                r={20}
                fill={p.color}
                initial={{ opacity: 0.5, scale: 0.6 }}
                animate={{ opacity: [0.35, 0.1, 0.35], scale: 1 }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ originX: `${c.x}px`, originY: `${c.y}px` }}
              />
            )}
            <circle cx={c.x} cy={c.y} r={on ? 10 : 8} fill={p.color} stroke="#16140f" strokeWidth={2} />
            <text x={c.x} y={c.y - 14} textAnchor="middle" fontSize={11} fontWeight={on ? 800 : 600} className={on ? "fill-slate-100" : "fill-slate-300"}>
              {t(`proto.${p.id}.short`)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Protocols() {
  const { t, tl, lang } = useT();
  const [sp] = useSearchParams();
  const q = sp.get("p") as ProtoId | null;
  const [pick, setPick] = useState<ProtoId>(PROTOCOLS.some((p) => p.id === q) ? (q as ProtoId) : "notary");
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "attack" ? "attack" : "normal");
  const qm = sp.get("mode");
  // liên kết ngoài (?p=…&mode=…) khi trang đang mở: đồng bộ lựa chọn
  useEffect(() => {
    if (q && PROTOCOLS.some((p) => p.id === q)) setPick(q);
    if (qm === "attack" || qm === "normal") setMode(qm);
  }, [q, qm]);
  const proto = useMemo(() => PROTOCOLS.find((p) => p.id === pick) as ProtoDef, [pick]);
  const fmt = (m: number) => (lang === "vi" ? `≈ ${m.toLocaleString("vi-VN")} triệu USD` : `≈ $${m.toLocaleString("en-US")}M`);
  const choose = (id: ProtoId, scroll = false) => {
    setPick(id);
    setMode("normal");
    if (scroll) focusAnchor("proto-stage");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="chip">
          <Waypoints className="h-3 w-3" /> {t("proto.badge")}
        </span>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("proto.title")}</h1>
        <p className="max-w-4xl text-slate-300">{t("proto.body")}</p>
      </header>

      {/* chọn giao thức */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" role="tablist" aria-label={t("proto.pick")}>
        {PROTOCOLS.map((p, i) => {
          const on = p.id === pick;
          return (
            <motion.button
              key={p.id}
              role="tab"
              aria-selected={on}
              data-testid={`proto-tab-${p.id}`}
              onClick={() => choose(p.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -3 }}
              className={`glass relative flex flex-col items-start gap-1.5 overflow-hidden p-3 text-left transition ${on ? "ring-2" : "opacity-80 hover:opacity-100"}`}
              style={on ? { ["--tw-ring-color" as string]: p.color } : undefined}
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />
              <span className="flex w-full items-center justify-between gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg text-base text-ink-950" style={{ background: p.color }}>
                  {p.glyph}
                </span>
                <span className="label !text-[9px]">{t(`proto.${p.id}.family`)}</span>
              </span>
              <span className="font-display text-[13px] font-bold leading-tight">{t(`proto.${p.id}.name`)}</span>
              <span className="text-[11px] leading-snug text-slate-400">{t(`proto.${p.id}.tag`)}</span>
              <span className="mt-auto flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                {t("proto.col.trust")} <Dots v={p.trust} color={p.color} />
              </span>
            </motion.button>
          );
        })}
      </section>

      {/* mô phỏng + mô tả */}
      <section id="proto-stage" className="grid scroll-mt-24 gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="glass min-w-0 space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base font-bold sm:text-lg" style={{ color: proto.color }}>
              {t(`proto.${proto.id}.name`)}
            </h2>
            <span className="text-xs text-slate-400">{t(`proto.${proto.id}.examplesLine`)}</span>
          </div>
          <ProtoPlayer key={`${proto.id}-${mode}`} proto={proto} mode={mode} setMode={setMode} />
        </div>

        <div className="glass min-w-0 space-y-4 p-5">
          <div>
            <div className="label mb-1">{t("proto.idea")}</div>
            <p className="text-sm leading-relaxed text-slate-200">{t(`proto.${proto.id}.idea`)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="label">{t("proto.trustModel")}</span>
              <Dots v={proto.trust} color={proto.color} label={t("proto.col.trust")} />
            </div>
            <p className="text-sm text-slate-300">{t(`proto.${proto.id}.trustText`)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div>
              <div className="label mb-1 flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> {t("proto.pros")}
              </div>
              <ul className="space-y-1">
                {tl(`proto.${proto.id}.pros`).map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label mb-1 flex items-center gap-1 text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {t("proto.cons")}
              </div>
              <ul className="space-y-1">
                {tl(`proto.${proto.id}.cons`).map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* sự cố thực tế + liên hệ luận án */}
      <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="glass min-w-0 space-y-3 p-5">
          <div className="label">{t("proto.incidents")}</div>
          <div className="grid gap-3 md:grid-cols-2">
            {proto.incidents.map((x, i) => {
              const Icon = KIND_ICON[x.kind];
              const tone = KIND_TONE[x.kind];
              return (
                <motion.article
                  key={`${proto.id}-${x.key}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: tone }}>
                      <Icon className="h-3 w-3" /> {t(`proto.kind.${x.kind}`)}
                    </span>
                    <span className="font-semibold">{t(`proto.inc.${x.key}.name`)}</span>
                    <span className="text-xs text-slate-400">{x.date}</span>
                    {x.usd && <span className="rounded bg-rose-500/15 px-1.5 text-xs font-bold text-rose-300">{fmt(x.usd)}</span>}
                  </div>
                  <p className="text-sm text-slate-300">{t(`proto.inc.${x.key}.body`)}</p>
                  {x.inc && (
                    <Link to={`/incidents?id=${x.inc}`} className="mt-auto flex items-center gap-1 self-start text-xs font-semibold text-rose-300 hover:text-rose-200">
                      <PlayCircle className="h-3.5 w-3.5" /> {t("inc.view")}
                    </Link>
                  )}
                </motion.article>
              );
            })}
          </div>
        </div>
        <div className="glass min-w-0 space-y-3 p-5">
          <div className="label">{t("proto.thesisLink")}</div>
          {proto.thesis.map((m) => {
            const mod = MODULES.find((x) => x.id === m)!;
            return (
              <div key={m} className="rounded-xl border p-3" style={{ borderColor: `${MOD_COLOR[m]}66`, background: `${MOD_COLOR[m]}10` }}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <span className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-black text-ink-950" style={{ background: MOD_COLOR[m] }}>
                      {mod.glyph}
                    </span>
                    {m.toUpperCase()} · {t(`${m}.name`)}
                  </span>
                  <Link to={mod.path} className="flex items-center gap-1 text-xs text-slate-300 hover:text-white">
                    {t("home.open")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <p className="text-sm text-slate-200">{t(`proto.${proto.id}.thesis.${m}`)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* so sánh + tam giác bất khả */}
      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="glass min-w-0 p-5">
          <div className="label mb-3">{t("proto.compare")}</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-1 font-semibold">{t("proto.col.name")}</th>
                  {(["trust", "general", "speed", "cost", "extensible"] as const).map((c) => (
                    <th key={c} className="px-2 py-1 font-semibold">
                      {t(`proto.col.${c}`)}
                    </th>
                  ))}
                  <th className="px-2 py-1 font-semibold">{t("proto.col.losses")}</th>
                </tr>
              </thead>
              <tbody>
                {PROTOCOLS.map((p) => {
                  const loss = p.incidents.reduce((s, x) => s + (x.usd ?? 0), 0);
                  const on = p.id === pick;
                  return (
                    <tr key={p.id} onClick={() => choose(p.id, true)} className={`cursor-pointer transition ${on ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}>
                      <td className="rounded-l-lg px-2 py-2">
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                          {t(`proto.${p.id}.short`)}
                        </span>
                      </td>
                      {(["trust", "general", "speed", "cost", "extensible"] as const).map((c) => (
                        <td key={c} className="px-2 py-2">
                          <Dots v={p[c]} color={p.color} />
                        </td>
                      ))}
                      <td className="rounded-r-lg px-2 py-2 text-xs font-semibold text-rose-300">{loss ? fmt(loss) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{t("proto.compareNote")}</p>
        </div>
        <div className="glass min-w-0 p-5">
          <div className="label mb-1">{t("proto.tri.title")}</div>
          <p className="mb-2 text-xs text-slate-400">{t("proto.tri.body")}</p>
          <Trilemma sel={pick} onPick={(id) => choose(id, true)} />
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-slate-500">{t("proto.refs")}</p>
    </div>
  );
}
