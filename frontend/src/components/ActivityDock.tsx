import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useT } from "../i18n/useT";

/** Thanh tiến độ cuộn mảnh ở mép trên cửa sổ. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-teal-400 via-violet-500 to-orange-400" style={{ scaleX: x }} />;
}

/** Nút "Lên đầu trang" nhỏ ở góc dưới phải (thông báo sự kiện nay nằm trong header). */
export default function BackToTop() {
  const { t } = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="btn-brut glass fixed bottom-4 right-4 z-[55] grid h-10 w-10 place-items-center rounded-full bg-surface-1"
          title={t("dock.top")}
          aria-label={t("dock.top")}
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
