// Bức tranh tổng thể: vòng đời một thông điệp liên chuỗi, các mối đe dọa ở từng chặng và chuyên đề nào phòng vệ.
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useT } from "../../i18n/useT";
import { MODULES } from "../../modules/registry";

type ModId = "cd1" | "cd2" | "cd3";
const COLOR: Record<ModId, string> = { cd1: "#22d3ee", cd2: "#8b5cf6", cd3: "#f59e0b" };
// chặng → các mối đe dọa (khóa i18n) → chuyên đề phòng vệ
const STAGES: { key: string; threats: { k: string; by: ModId[] }[] }[] = [
  { key: "design", threats: [{ k: "privacy", by: ["cd1"] }, { k: "trust", by: ["cd1"] }] },
  { key: "code", threats: [{ k: "logic", by: ["cd2"] }, { k: "reentrancy", by: ["cd2"] }, { k: "access", by: ["cd2"] }] },
  { key: "lock", threats: [{ k: "fakeSource", by: ["cd2", "cd3"] }] },
  { key: "relay", threats: [{ k: "forgery", by: ["cd1", "cd2"] }, { k: "collusion", by: ["cd1", "cd3"] }, { k: "replay", by: ["cd1", "cd2", "cd3"] }] },
  { key: "mint", threats: [{ k: "oracle", by: ["cd2", "cd3"] }, { k: "drain", by: ["cd3"] }] },
  { key: "operate", threats: [{ k: "slowburn", by: ["cd3"] }, { k: "outage", by: ["cd3"] }] },
];

export default function BigPicture() {
  const { t, tl } = useT();
  const [focus, setFocus] = useState<ModId | null>(null);

  return (
    <section className="glass space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label">{t("big.label")}</div>
          <h2 className="text-2xl font-bold">{t("big.title")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onMouseEnter={() => setFocus(m.id)}
              onMouseLeave={() => setFocus(null)}
              onClick={() => setFocus(focus === m.id ? null : m.id)}
              className={`chip transition ${focus === m.id ? "border-white/40 text-white" : ""}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: COLOR[m.id] }} /> {m.id.toUpperCase()} · {t(`${m.id}.name`)}
            </button>
          ))}
        </div>
      </div>

      {/* luận điểm */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5">
          <div className="label mb-1">{t("big.thesisLabel")}</div>
          <p className="text-lg font-semibold leading-snug text-slate-100">{t("big.thesis")}</p>
          <p className="mt-3 text-sm text-slate-400">{t("big.problem")}</p>
        </div>
        <div className="space-y-2">
          {tl("big.rq").map((q, i) => {
            const id = (["cd1", "cd2", "cd3"] as ModId[])[i];
            return (
              <motion.div
                key={q}
                onMouseEnter={() => setFocus(id)}
                onMouseLeave={() => setFocus(null)}
                animate={{ opacity: !focus || focus === id ? 1 : 0.35 }}
                className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black text-ink-950" style={{ background: COLOR[id] }}>
                  RQ{i + 1}
                </span>
                <span className="text-sm text-slate-200">{q}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* vòng đời thông điệp liên chuỗi */}
      <div>
        <div className="label mb-3">{t("big.lifecycle")}</div>
        <div className="relative">
          <div className="absolute left-4 right-4 top-7 hidden h-[3px] rounded bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 opacity-50 lg:block" />
          <motion.div
            className="absolute top-[22px] hidden h-3 w-3 rounded-full bg-white shadow-[0_0_14px_#fff] lg:block"
            animate={{ left: ["2%", "97%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {STAGES.map((st, i) => {
              const lit = !focus || st.threats.some((th) => th.by.includes(focus));
              return (
                <motion.div key={st.key} animate={{ opacity: lit ? 1 : 0.3 }} className="relative space-y-2">
                  <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-surface-1 text-2xl shadow-lg">{["📐", "⌨️", "🔒", "🛰️", "🪙", "📡"][i]}</div>
                  <div className="text-center text-sm font-semibold">{t(`big.stage.${st.key}`)}</div>
                  <div className="text-center text-[11px] text-slate-400">{t(`big.stageSub.${st.key}`)}</div>
                  <div className="space-y-1.5">
                    {st.threats.map((th) => {
                      const on = !focus || th.by.includes(focus);
                      return (
                        <motion.div key={th.k} animate={{ opacity: on ? 1 : 0.25, scale: on && focus ? 1.03 : 1 }} className="rounded-lg border border-rose-400/25 bg-rose-500/[0.07] px-2 py-1.5">
                          <div className="text-[11px] font-semibold text-rose-100">⚠ {t(`big.threat.${th.k}`)}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {th.by.map((m) => (
                              <span key={m} className="inline-flex items-center gap-0.5 rounded px-1 text-[9px] font-bold text-ink-950" style={{ background: COLOR[m] }}>
                                <ShieldCheck className="h-2.5 w-2.5" /> {m.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* đóng góp của từng chuyên đề */}
      <div className="grid gap-4 lg:grid-cols-3">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: !focus || focus === m.id ? 1 : 0.35, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onMouseEnter={() => setFocus(m.id)}
            onMouseLeave={() => setFocus(null)}
            className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.accent}`} />
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${m.accent} text-sm font-black text-ink-950`}>{m.glyph}</div>
              <div>
                <div className="font-bold">
                  {m.id.toUpperCase()} · {t(`${m.id}.name`)}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">{t(`${m.id}.sdlc`)}</div>
              </div>
            </div>
            <div>
              <div className="label mb-1">{t("big.problemLabel")}</div>
              <p className="text-sm text-slate-300">{t(`big.${m.id}.problem`)}</p>
            </div>
            <div>
              <div className="label mb-1">{t("big.contribLabel")}</div>
              <ul className="space-y-1.5">
                {tl(`big.${m.id}.contrib`).map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLOR[m.id] }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {tl(`big.${m.id}.results`).map((r) => {
                const [v, l] = r.split("|");
                return (
                  <div key={r} className="rounded-lg bg-surface-0/50 px-2 py-1.5">
                    <div className="text-base font-extrabold" style={{ color: COLOR[m.id] }}>
                      {v}
                    </div>
                    <div className="text-[10px] text-slate-400">{l}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500">{t(`${m.id}.pubs`)}</span>
              <Link to={m.path} className="flex items-center gap-1 text-slate-200 hover:text-white">
                {t("home.open")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
