import { FlaskConical } from "lucide-react";
import { useT } from "../i18n/useT";

/** Nhãn bắt buộc cho mật mã/ML "đồ chơi" (CLAUDE.md). */
export default function ToyBadge({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200" title={t("common.toyTooltip")}>
      <FlaskConical className="h-3 w-3" /> {label ?? t("common.toy")}
    </span>
  );
}
