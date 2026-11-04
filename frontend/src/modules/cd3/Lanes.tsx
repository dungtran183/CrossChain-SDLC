import { AnimatePresence, motion } from "framer-motion";
import type { LaneEvent } from "./types";
import { CORRIDOR_COLORS } from "./types";
import { useT } from "../../i18n/useT";

const STATUS_STYLE: Record<string, string> = {
  pending: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  matched: "border-emerald-400/50 bg-emerald-400/10 text-emerald-100",
  late: "border-amber-400/60 bg-amber-400/15 text-amber-100 animate-blink",
  flagged: "border-rose-500/70 bg-rose-500/20 text-rose-100 animate-blink",
  reverted: "border-rose-500/40 bg-rose-950/40 text-rose-300 line-through",
};

/** Hai làn chuỗi: sự kiện Locked (A) và Minted (B) trượt vào; sự kiện không ghép được nhấp nháy. */
export default function Lanes({ lanes, hover, setHover }: { lanes: LaneEvent[]; hover: string | null; setHover: (m: string | null) => void }) {
  const { t } = useT();
  const row = (chain: "A" | "B") => lanes.filter((e) => e.chain === chain).slice(-12);
  return (
    <div className="space-y-2">
      {(["A", "B"] as const).map((c) => (
        <div key={c} className="flex items-center gap-3">
          <div className={`w-24 shrink-0 rounded-lg px-2 py-1 text-center text-[11px] font-bold ${c === "A" ? "bg-amber-400/15 text-amber-200" : "bg-rose-400/15 text-rose-200"}`}>
            chain-{c}
            <div className="font-normal text-slate-400">{c === "A" ? "LockVault" : "MintGateway"}</div>
          </div>
          <div className="relative flex min-h-[54px] flex-1 items-center gap-1.5 overflow-hidden rounded-xl border border-white/5 bg-ink-950/50 px-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink-950 to-transparent" />
            <AnimatePresence initial={false}>
              {row(c).map((e, i) => (
                <motion.div
                  key={`${e.tick}-${e.msgId ?? i}-${e.type}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 60, scale: 0.7 }}
                  animate={{ opacity: hover && e.msgId !== hover ? 0.35 : 1, x: 0, scale: e.msgId && e.msgId === hover ? 1.08 : 1 }}
                  exit={{ opacity: 0, x: -40, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  onMouseEnter={() => setHover(e.msgId)}
                  onMouseLeave={() => setHover(null)}
                  className={`shrink-0 cursor-default rounded-lg border px-1.5 py-1 text-[10px] leading-tight ${STATUS_STYLE[e.status] ?? STATUS_STYLE.pending}`}
                  title={e.rules?.join(", ") || e.reason || e.status}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    {e.corridor !== null && <span className="h-1.5 w-1.5 rounded-full" style={{ background: CORRIDOR_COLORS[e.corridor] }} />}
                    {e.type === "MintReverted" ? "✗ mint" : e.type}
                  </div>
                  <div className="font-mono text-slate-400">
                    {e.actor} · {e.amount || "—"}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pl-28 text-[10px] text-slate-400">
        {["pending", "matched", "late", "flagged", "reverted"].map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-sm border ${STATUS_STYLE[s].split(" ").slice(0, 2).join(" ")}`} /> {t(`cd3.lane.${s}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
