import { motion } from "framer-motion";
import { CircleAlert, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "../i18n/useT";
import { MODE } from "../lib/api";

/** Thông báo lỗi (gợi ý chạy backend khi ở live). */
export function ErrorBanner({ error, onClose }: { error: string | null; onClose?: () => void }) {
  const { t } = useT();
  if (!error) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="break-words">{error}</div>
        {MODE === "live" && /fetch|Failed|NetworkError|50\d/.test(error) && <div className="mt-1 text-xs text-rose-200/70">{t("common.backendHint")}</div>}
      </div>
      {onClose && (
        <button className="text-rose-200/70 hover:text-white" onClick={onClose}>
          ×
        </button>
      )}
    </motion.div>
  );
}

export function Empty({ children, icon }: { children?: ReactNode; icon?: ReactNode }) {
  const { t } = useT();
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-500">
      {icon ?? <Inbox className="h-6 w-6" />}
      {children ?? t("common.empty")}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" /> {label ?? t("common.loading")}
    </div>
  );
}

/** Khung xương nhấp nháy khi đang tải. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${className}`}><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" /></div>;
}
