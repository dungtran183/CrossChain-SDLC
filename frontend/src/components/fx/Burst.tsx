import { AnimatePresence, motion } from "framer-motion";

type Props = { trigger: unknown; color?: string; count?: number };

/** Tia sáng toả ra từ tâm (hiệu ứng thành công nhẹ, không thư viện). Đặt trong phần tử relative. */
export default function Burst({ trigger, color = "#34d399", count = 14 }: Props) {
  const key = String(trigger ?? "");
  return (
    <AnimatePresence>
      {key && (
        <motion.div key={key} className="pointer-events-none absolute inset-0 grid place-items-center" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.2, delay: 0.4 }}>
          {Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                initial={{ x: 0, y: 0, scale: 1 }}
                animate={{ x: Math.cos(a) * 70, y: Math.sin(a) * 70, scale: 0.2 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            );
          })}
          <motion.span
            className="absolute h-10 w-10 rounded-full border-2"
            style={{ borderColor: color }}
            initial={{ scale: 0.4, opacity: 1 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 0.9 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
