import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Spotlight from "./fx/Spotlight";

type Props = {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  accent?: string; // lớp gradient tailwind cho vạch trên
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
  delay?: number;
};

/** Thẻ kính mờ có vệt sáng theo chuột, tiêu đề + vùng hành động. */
export default function GlassCard({ title, icon, actions, accent, className = "", bodyClassName = "", children, delay = 0 }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass relative overflow-hidden ${className}`}
    >
      <Spotlight className="h-full rounded-2xl">
        {accent && <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accent} opacity-80`} />}
        {(title || actions) && (
          <header className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              {icon && <span className="text-slate-300">{icon}</span>}
              {title}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </header>
        )}
        <div className={`relative p-5 ${title || actions ? "pt-3" : ""} ${bodyClassName}`}>{children}</div>
      </Spotlight>
    </motion.section>
  );
}
