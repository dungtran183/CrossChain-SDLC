import { useEffect, useState } from "react";

const CHARS = "0123456789abcdef";

/** Hiệu ứng "giải mã" cho hash/hex: ký tự ngẫu nhiên hội tụ dần về giá trị thật. */
export default function ScrambleText({ text, className = "", duration = 700 }: { text: string; className?: string; duration?: number }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const fixed = Math.floor(p * text.length);
      setShown(
        text
          .split("")
          .map((ch, i) => (i < fixed || ch === "x" || ch === "…" ? ch : CHARS[Math.floor(Math.random() * 16)]))
          .join(""),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);
  return <span className={`font-mono ${className}`}>{shown}</span>;
}
