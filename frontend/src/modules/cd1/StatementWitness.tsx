import { motion } from "framer-motion";
import { Eye, Lock, Unlock } from "lucide-react";
import type { ProveRes } from "./types";
import { short } from "../../lib/types";
import { useT } from "../../i18n/useT";
import KeyValueTable from "../../components/KeyValueTable";
import ScrambleText from "../../components/fx/ScrambleText";

/** Hộp "Statement vs Witness": công khai (đi qua cầu) ↔ bí mật (ở lại máy Holder, làm mờ + khóa). */
export default function StatementWitness({ data }: { data: ProveRes }) {
  const { t } = useT();
  const st = data.statement;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-200">
          <Unlock className="h-4 w-4" /> {t("cd1.sw.statement")}
        </div>
        <p className="mb-3 text-[11px] text-slate-400">{t("cd1.sw.statementHint")}</p>
        <KeyValueTable
          rows={[
            [t("cd1.sw.predicate"), <span className="text-cyan-200">{st.predicate}</span>],
            ["C_gpa (Pedersen)", short(String(st.c_gpa), 6)],
            ["leaf", <ScrambleText text={short(st.leaf, 8)} />],
            ["Merkle path", `${st.merkle_proof.length} ${t("cd1.sw.hashes")}`],
            ["root", short(st.root, 6)],
            ["nonce", String(st.nonce)],
            [t("cd1.sw.proof"), `${data.proof_bytes} B · ${data.proof.k_bits} bit-OR-proofs`],
          ]}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Lock className="h-4 w-4" /> {t("cd1.sw.witness")}
        </div>
        <p className="mb-3 text-[11px] text-slate-400">{t("cd1.sw.witnessHint")}</p>
        <div className="relative">
          <div className="select-none blur-[5px]">
            <KeyValueTable rows={Object.entries(data.witness_hidden).map(([k, v]) => [k, String(v).repeat(3)])} />
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-ink-900/90 px-3 py-1.5 text-xs">
              <Lock className="h-3.5 w-3.5 text-amber-300" /> {t("cd1.sw.neverLeaves")}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2 text-[11px] text-slate-400">
          <Eye className="h-3.5 w-3.5" />
          {t("cd1.sw.holderPeek")}: GPA = <b className="text-slate-200">{data.holder_view.gpa.toFixed(2)}</b> · d = {data.holder_view.d.toFixed(2)}
          {!data.satisfiable && <span className="ml-auto text-rose-300">{t("cd1.sw.unsat")}</span>}
        </div>
      </motion.div>
    </div>
  );
}
