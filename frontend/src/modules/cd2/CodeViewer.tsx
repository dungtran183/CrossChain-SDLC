import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

const KW = new Set("pragma solidity contract interface function external public internal private view pure returns return require mapping emit event modifier constructor memory calldata if for immutable constant true false uint256 uint8 bytes32 bytes address bool string".split(" "));
const TOKEN = /("[^"]*")|([A-Za-z_]\w*)|(\d+)|([^"A-Za-z_\d]+)/g;
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Tô màu một dòng bằng một lượt quét token (không thay thế lồng nhau). */
function highlight(line: string): string {
  const ci = line.indexOf("//");
  const code = ci >= 0 ? line.slice(0, ci) : line;
  const comment = ci >= 0 ? line.slice(ci) : "";
  const c = code.replace(TOKEN, (_m, str, word, num, other) => {
    if (str) return `<span class="text-emerald-300">${esc(str)}</span>`;
    if (word) return KW.has(word) ? `<span class="text-violet-300">${word}</span>` : word;
    if (num) return `<span class="text-amber-300">${num}</span>`;
    return esc(other);
  });
  const cm = comment ? `<span class="${/BUG/.test(comment) ? "text-rose-300 font-semibold" : "text-slate-500"}">${esc(comment)}</span>` : "";
  return c + cm;
}

/** Trình xem mã chỉ đọc: tô màu cú pháp Solidity, đánh số dòng, vùng rủi ro phát sáng đỏ. */
export default function CodeViewer({ source, risky, maxHeight = 460 }: { source: string; risky: number[]; maxHeight?: number }) {
  const lines = useMemo(() => source.split("\n"), [source]);
  const box = useRef<HTMLDivElement>(null);
  // Tự cuộn tới vùng rủi ro đầu tiên.
  useEffect(() => {
    const el = box.current;
    const first = risky[0];
    if (!el || !first) return;
    const row = el.querySelectorAll("tr")[Math.max(0, first - 6)] as HTMLElement | undefined;
    if (row) el.scrollTo({ top: row.offsetTop, behavior: "smooth" });
  }, [source, risky]);
  const hot = useMemo(() => {
    const s = new Set<number>();
    risky.forEach((l) => [l - 1, l, l + 1].forEach((x) => s.add(x)));
    return s;
  }, [risky]);
  return (
    <div ref={box} className="relative overflow-auto rounded-xl border border-white/10 bg-ink-950/80 font-mono text-[12px] leading-[1.55]" style={{ maxHeight }}>
      <motion.div
        key={source.length}
        className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-violet-400/15 to-transparent"
        initial={{ top: 0 }}
        animate={{ top: "100%" }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((l, i) => {
            const n = i + 1;
            const isRisk = hot.has(n);
            const isBug = risky.includes(n);
            return (
              <tr key={i} className={isBug ? "bg-rose-500/20" : isRisk ? "bg-rose-500/[0.07]" : ""}>
                <td className={`select-none border-r border-white/5 px-2 text-right align-top ${isBug ? "text-rose-300" : "text-slate-600"}`}>{n}</td>
                <td className="whitespace-pre px-3" dangerouslySetInnerHTML={{ __html: highlight(l) || " " }} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
