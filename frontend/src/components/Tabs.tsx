import { motion } from "framer-motion";
import { useId, type ReactNode } from "react";

type Tab = { id: string; label: ReactNode; icon?: ReactNode };

/** Tab với chỉ báo trượt (layoutId). */
export default function Tabs({ tabs, value, onChange, accent = "from-sky-400 to-fuchsia-500" }: { tabs: Tab[]; value: string; onChange: (id: string) => void; accent?: string }) {
  const id = useId();
  return (
    <div className="tabs-brut flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${value === t.id ? "text-ink-950" : "text-slate-300 hover:text-white"}`}
        >
          {value === t.id && (
            <motion.span layoutId={`tab-${id}`} className={`absolute inset-0 rounded-xl bg-gradient-to-r ${accent}`} transition={{ type: "spring", stiffness: 380, damping: 32 }} />
          )}
          <span className="relative flex items-center gap-2">
            {t.icon}
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}
