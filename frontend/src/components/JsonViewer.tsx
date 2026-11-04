import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

function Node({ k, v, depth }: { k?: string; v: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isObj = v !== null && typeof v === "object";
  const keyEl = k !== undefined && <span className="text-sky-300">"{k}"</span>;
  if (!isObj) {
    const cls = typeof v === "string" ? "text-emerald-300" : typeof v === "number" ? "text-amber-300" : "text-fuchsia-300";
    return (
      <div className="pl-4">
        {keyEl}
        {keyEl && ": "}
        <span className={`${cls} break-all`}>{JSON.stringify(v)}</span>
      </div>
    );
  }
  const entries = Array.isArray(v) ? v.map((x, i) => [String(i), x] as const) : Object.entries(v as object);
  const [o, c] = Array.isArray(v) ? ["[", "]"] : ["{", "}"];
  return (
    <div className="pl-4">
      <button onClick={() => setOpen(!open)} className="-ml-4 inline-flex items-center text-slate-400 hover:text-white">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {keyEl}
      {keyEl && ": "}
      <span className="text-slate-500">{o}</span>
      {!open && <span className="text-slate-500"> {entries.length} … {c}</span>}
      {open && (
        <>
          {entries.map(([kk, vv]) => (
            <Node key={kk} k={Array.isArray(v) ? undefined : kk} v={vv} depth={depth + 1} />
          ))}
          <span className="text-slate-500">{c}</span>
        </>
      )}
    </div>
  );
}

/** Xem JSON thu gọn được + nút sao chép. */
export default function JsonViewer({ data, className = "", maxHeight = 320 }: { data: unknown; className?: string; maxHeight?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`theme-dark card-brut relative rounded-xl border border-white/10 bg-surface-0 text-slate-100 ${className}`}>
      <button
        className="absolute right-2 top-2 rounded-lg bg-white/5 p-1.5 text-slate-400 hover:text-white"
        onClick={() => {
          navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        aria-label="copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <div className="overflow-auto p-3 font-mono text-[12px] leading-relaxed" style={{ maxHeight }}>
        <Node v={data} depth={0} />
      </div>
    </div>
  );
}
