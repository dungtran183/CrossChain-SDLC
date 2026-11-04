import { TriangleAlert } from "lucide-react";

/** Dòng cảnh báo song ngữ luôn hiển thị (quy ước dự án): hiển thị cả hai ngôn ngữ. */
export default function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs text-amber-200/80 ${className}`}>
      <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
      <span>
        Minh họa — không phải kết quả thực nghiệm của luận án <span className="text-amber-200/40">/</span> Illustrative — not thesis results
      </span>
    </div>
  );
}
