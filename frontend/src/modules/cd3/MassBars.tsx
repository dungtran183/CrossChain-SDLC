import { motion } from "framer-motion";
import type { Evidence, Mass } from "./types";
import { useT } from "../../i18n/useT";

function Bar({ m, label }: { m: Mass; label: string }) {
  const seg = [
    { k: "N", v: m.N, c: "#34d399" },
    { k: "A", v: m.A, c: "#f43f5e" },
    { k: "Θ", v: m.T, c: "#64748b" },
  ];
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono">
          N {m.N.toFixed(2)} · A {m.A.toFixed(2)} · Θ {m.T.toFixed(2)}
        </span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-white/5">
        {seg.map((s) => (
          <motion.div key={s.k} className="h-full" style={{ background: s.c }} initial={{ width: 0 }} animate={{ width: `${s.v * 100}%` }} transition={{ duration: 0.6 }} />
        ))}
      </div>
    </div>
  );
}

/** Khối niềm tin Dempster–Shafer trước/sau hợp nhất + khoảng [Bel, Pl] + xung đột K. */
export default function MassBars({ e }: { e: Evidence }) {
  const { t } = useT();
  return (
    <div className="space-y-3">
      <Bar m={e.m_learn} label={`${t("cd3.m2.learn")} (p̂ = ${e.p_hat}, κ_L = ${e.kappa_L})`} />
      <Bar m={e.m_rule} label={`${t("cd3.m2.rule")} (κ_P = ${e.kappa_P}${e.rules.length ? ` · ${e.rules.join(", ")}` : ""})`} />
      <div className="text-center text-xs text-slate-500">⊕ Dempster · K = {e.K.toFixed(3)}</div>
      <Bar m={e.m_fused} label={t("cd3.m2.fused")} />
      <div>
        <div className="mb-1 text-[11px] text-slate-400">[Bel(A), Pl(A)] = [{e.bel.toFixed(2)}, {e.pl.toFixed(2)}]</div>
        <div className="relative h-3 rounded-full bg-white/5">
          <motion.div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" initial={false} animate={{ left: `${e.bel * 100}%`, width: `${Math.max(1, (e.pl - e.bel) * 100)}%` }} />
          <motion.div className="absolute -top-1 h-5 w-0.5 bg-white" initial={false} animate={{ left: `${e.bel * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
