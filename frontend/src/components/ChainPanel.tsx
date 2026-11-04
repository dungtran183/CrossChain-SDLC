import { AnimatePresence, motion } from "framer-motion";
import { Boxes, CircleCheck, CircleX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { short, type TxSummary } from "../lib/types";
import { useT } from "../i18n/useT";
import JsonViewer from "./JsonViewer";

type Props = {
  name: string;
  chainId?: number;
  txs: TxSummary[];
  color?: string; // hex
  max?: number;
  compact?: boolean;
};

/**
 * Explorer mini của một chuỗi: mỗi tx là một khối trượt vào từ phải (auto-mine 1 tx/khối),
 * xanh = thành công, đỏ = revert; bấm để xem chi tiết (event đã giải mã, lý do revert).
 */
export default function ChainPanel({ name, chainId, txs, color = "#22d3ee", max = 8, compact }: Props) {
  const { t } = useT();
  const [sel, setSel] = useState<TxSummary | null>(null);
  const shown = txs.slice(-max);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ left: scroller.current.scrollWidth, behavior: "smooth" });
  }, [txs.length]);
  const head = txs.length ? txs[txs.length - 1].block : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-950/50 p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          </span>
          <Boxes className="h-3.5 w-3.5 text-slate-400" />
          {name}
          {chainId !== undefined && <span className="font-mono text-slate-500">id {chainId}</span>}
        </div>
        <span className="font-mono text-slate-400">
          {t("common.head")} #{head}
        </span>
      </div>
      <div ref={scroller} className="flex gap-2 overflow-x-auto pb-1">
        {shown.length === 0 && <div className="py-4 text-xs text-slate-500">{t("common.noTx")}</div>}
        <AnimatePresence initial={false}>
          {shown.map((tx) => {
            const ok = tx.status === 1;
            return (
              <motion.button
                layout
                key={tx.hash}
                initial={{ opacity: 0, x: 40, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                onClick={() => setSel(sel?.hash === tx.hash ? null : tx)}
                className={`relative shrink-0 rounded-xl border px-2.5 py-2 text-left transition hover:brightness-125 ${compact ? "w-[112px]" : "w-[132px]"} ${
                  ok ? "border-white/10 bg-white/[0.04]" : "border-rose-500/50 bg-rose-500/10"
                } ${sel?.hash === tx.hash ? "ring-2 ring-white/40" : ""}`}
                style={ok ? { boxShadow: `inset 0 1px 0 0 ${color}55` } : undefined}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  #{tx.block}
                  {ok ? <CircleCheck className="h-3 w-3 text-emerald-400" /> : <CircleX className="h-3 w-3 text-rose-400" />}
                </div>
                <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-100" title={tx.fn ?? ""}>
                  {tx.fn ?? "tx"}
                </div>
                <div className="truncate text-[10px] text-slate-400">{tx.to_label ?? short(tx.to, 4)}</div>
                {!compact && (
                  <div className="mt-1 truncate text-[10px]" style={{ color: ok ? color : "#fda4af" }}>
                    {ok ? tx.events.map((e) => e.event).join(", ") || "—" : tx.reason ?? "revert"}
                  </div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <JsonViewer data={sel} className="mt-2" maxHeight={220} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
