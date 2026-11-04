import { BookOpenCheck } from "lucide-react";
import { useT } from "../i18n/useT";

type Item = { label: string; value: string };

/**
 * Số liệu TRÍCH DẪN từ báo cáo chuyên đề — tách biệt rõ với số đo của demo (viền nét đứt, nhãn nguồn).
 */
export default function ThesisResultsCard({ items, source }: { items: Item[]; source: string }) {
  const { t } = useT();
  return (
    <section className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BookOpenCheck className="h-4 w-4 text-slate-300" /> {t("common.thesisResults")}
        </div>
        <span className="chip">
          {t("common.source")}: {source}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-white/[0.03] px-3 py-2">
            <div className="text-lg font-bold tabular-nums text-slate-100">{it.value}</div>
            <div className="text-xs text-slate-400">{it.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{t("common.thesisNote")}</p>
    </section>
  );
}
