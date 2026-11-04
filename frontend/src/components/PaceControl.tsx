import { Gauge } from "lucide-react";
import { PACES, usePace } from "../lib/pace";
import { useT } from "../i18n/useT";

/** Bộ chọn tốc độ trình diễn (dùng chung cho mọi trang). */
export default function PaceControl({ compact }: { compact?: boolean }) {
  const { t, lang } = useT();
  const [pace, setPace] = usePace();
  return (
    <div className="flex items-center gap-1.5" title={t("pace.title")}>
      {!compact && (
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Gauge className="h-3.5 w-3.5" /> {t("pace.label")}
        </span>
      )}
      <div role="radiogroup" aria-label={t("pace.title")} className="flex rounded-lg border border-white/10 p-0.5 text-xs">
        {PACES.map((p) => (
          <button key={p} role="radio" aria-checked={pace === p} onClick={() => setPace(p)} className={`rounded-md px-2 py-0.5 font-semibold tabular-nums transition ${pace === p ? "bg-slate-100 text-surface-0" : "text-slate-400 hover:text-white"}`}>
            {lang === "vi" ? String(p).replace(".", ",") : p}×
          </button>
        ))}
      </div>
    </div>
  );
}
