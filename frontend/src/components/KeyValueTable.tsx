import type { ReactNode } from "react";

/** Bảng khóa–giá trị gọn; giá trị dài tự xuống dòng (font mono). */
export default function KeyValueTable({ rows, className = "" }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={`divide-y divide-white/5 text-sm ${className}`}>
      {rows.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[minmax(110px,40%)_1fr] gap-3 py-1.5">
          <dt className="text-slate-400">{k}</dt>
          <dd className="min-w-0 break-all font-mono text-[12px] text-slate-100">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
