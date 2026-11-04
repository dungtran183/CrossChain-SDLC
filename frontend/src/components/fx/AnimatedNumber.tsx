import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

type Props = { value: number; decimals?: number; duration?: number; className?: string; prefix?: string; suffix?: string };

/** Số "chạy" mượt từ giá trị cũ sang mới. */
export default function AnimatedNumber({ value, decimals = 0, duration = 0.8, className, prefix = "", suffix = "" }: Props) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => `${prefix}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`);
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: "easeOut" });
    return () => c.stop();
  }, [value, duration, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}
