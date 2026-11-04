import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "success" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** Lớp gradient cho variant primary (màu module). */
  accent?: string;
  loading?: boolean;
  icon?: ReactNode;
  size?: "sm" | "md";
};

const BASE =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

/** Nút có hiệu ứng vệt sáng quét khi hover; spinner khi loading. */
export default function Button({ variant = "primary", accent = "from-sky-400 to-fuchsia-500", loading, icon, size = "md", className = "", children, disabled, ...rest }: Props) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const v: Record<Variant, string> = {
    primary: `bg-gradient-to-r ${accent} text-ink-950 shadow-lg hover:brightness-110`,
    ghost: "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
    outline: "border border-white/15 text-slate-200 hover:border-white/30 hover:bg-white/5",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-900/40 hover:brightness-110",
    success: "bg-gradient-to-r from-emerald-400 to-teal-500 text-ink-950 shadow-lg hover:brightness-110",
  };
  return (
    <button {...rest} disabled={disabled || loading} className={`group ${BASE} ${sz} ${v[variant]} ${className}`}>
      {(variant === "primary" || variant === "danger" || variant === "success") && (
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] skew-x-[-20deg] bg-white/40 opacity-0 blur-md transition group-hover:animate-shimmer group-hover:opacity-100" />
      )}
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
