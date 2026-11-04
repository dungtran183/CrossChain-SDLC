import { motion } from "framer-motion";
import { Download, FileWarning, Lightbulb, ShieldAlert, ShieldCheck } from "lucide-react";
import type { M4Res } from "./types";
import { CLS_COLORS } from "./types";
import { useT } from "../../i18n/useT";
import Button from "../../components/Button";
import Gauge from "../../components/Gauge";

const TIER = { high: "from-rose-500 to-red-600", medium: "from-amber-400 to-orange-500", low: "from-emerald-400 to-teal-500" };
const STATUS = { declared: "border-sky-400/50 bg-sky-400/10 text-sky-200", candidate: "border-amber-400/50 bg-amber-400/10 text-amber-200", verified: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" };

/** M4 · hồ sơ kiểm toán dạng báo cáo + tải JSON. */
export default function M4Panel({ r, catLabel }: { r: M4Res; catLabel: (c: string) => string }) {
  const { t, lang } = useT();
  const download = () => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${r.contract}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.05] to-transparent p-4">
        <motion.div initial={{ rotate: -8, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} className={`grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br ${TIER[r.risk_tier]} text-center text-ink-950 shadow-lg`}>
          {r.risk_tier === "low" ? <ShieldCheck className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
          <span className="-mt-3 text-[11px] font-extrabold uppercase">{t(`cd2.m4.tier.${r.risk_tier}`)}</span>
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="label">{t("cd2.m4.reportFor")}</div>
          <div className="text-xl font-bold">{r.contract}</div>
          <div className="text-sm" style={{ color: CLS_COLORS[r.category] }}>
            {catLabel(r.category)}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {r.interactions.map((x) => (
              <span key={x} className="chip text-[10px]">
                {x}
              </span>
            ))}
          </div>
        </div>
        <Gauge value={r.p_vuln} label="p_vuln" size={120} />
        <Button variant="ghost" icon={<Download className="h-4 w-4" />} onClick={download}>
          {t("common.download")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="label mb-2">{t("cd2.m4.invariants")}</div>
          <div className="space-y-2">
            {r.invariants.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg border border-white/5 bg-surface-0/50 p-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-100">{inv.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${inv.kind === "hard" ? "border-rose-400/40 text-rose-200" : "border-slate-400/40 text-slate-300"}`}>{inv.kind}</span>
                  <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] ${STATUS[inv.status]}`}>{t(`cd2.m4.status.${inv.status}`)}</span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-300">{inv.predicate}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="label mb-2 flex items-center gap-1">
              <FileWarning className="h-3 w-3" /> {t("cd2.m4.evidence")}
            </div>
            <ul className="space-y-1 text-xs">
              {r.evidence.length === 0 && <li className="text-slate-500">—</li>}
              {r.evidence.map((e, i) =>
                "line" in e ? (
                  <li key={i} className="rounded bg-rose-500/10 px-2 py-1 font-mono text-[11px] text-rose-100">
                    L{e.line}: {e.code}
                  </li>
                ) : (
                  <li key={i} className="text-slate-300">
                    <b>{e.invariant}</b> — {t("cd2.m4.missing")}: <span className="font-mono text-amber-200">{e.missing.join(", ")}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="label mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> {t("cd2.m4.fixes")}
            </div>
            {r.fixes.length === 0 ? (
              <div className="text-xs text-emerald-300">{t("cd2.m4.noFix")}</div>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-200">
                {r.fixes.map((f) => (
                  <li key={f.invariant} className="flex gap-2">
                    <span className="font-mono text-violet-300">{f.invariant}</span> {f[lang]}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
