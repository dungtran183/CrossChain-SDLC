import { useRef, type ReactNode, type HTMLAttributes } from "react";

/** Khung có vệt sáng đi theo chuột (dùng biến CSS, không re-render). */
export default function Spotlight({ children, className = "", color = "255,255,255", ...rest }: { children: ReactNode; className?: string; color?: string } & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      {...rest}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`group/spot relative ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--mx) var(--my), rgba(${color},0.08), transparent 45%)` }}
      />
      {children}
    </div>
  );
}
