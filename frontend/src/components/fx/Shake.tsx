import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = { trigger: unknown; tone?: "danger" | "success" | null; className?: string; children: ReactNode };

/**
 * Bọc nội dung: mỗi lần `trigger` đổi → rung + viền đỏ (danger) hoặc phát sáng xanh (success).
 */
export default function Shake({ trigger, tone, className = "", children }: Props) {
  const key = String(trigger ?? "");
  return (
    <motion.div
      key={key}
      className={`relative ${className}`}
      animate={tone === "danger" ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
    >
      {children}
      {tone && key && (
        <motion.div
          className={`pointer-events-none absolute inset-0 rounded-2xl ring-2 ${
            tone === "danger" ? "ring-rose-500/80 shadow-[0_0_40px_-6px_rgba(244,63,94,0.7)]" : "ring-emerald-400/70 shadow-[0_0_40px_-6px_rgba(52,211,153,0.7)]"
          }`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.6, delay: 0.3 }}
        />
      )}
    </motion.div>
  );
}
