import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp, BellRing, ChevronDown, CircleCheck, CircleX, Crosshair, Info, Trash2 } from "lucide-react";
import { clearActivity, focusAnchor, useActivity } from "../lib/activity";
import { useT } from "../i18n/useT";

/** Thanh tiến độ cuộn mảnh ở mép trên cửa sổ. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-teal-400 via-violet-500 to-orange-400" style={{ scaleX: x }} />;
}

/**
 * Nhật ký sự kiện nổi (góc phải dưới): luôn đi theo thanh cuộn, gom mọi thông báo của trang
 * (kết quả giao dịch, phê duyệt, bước kịch bản…). Bấm một mục có ⌖ để cuộn tới nơi nó diễn ra.
 */
export default function ActivityDock() {
  const { t } = useT();
  const list = useActivity();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const last = list[list.length - 1];
  const unread = open ? 0 : list.filter((a) => a.id > seen).length;
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && last) setSeen(last.id);
  }, [open, last]);
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    box.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [list.length]);

  const icon = (k: string) => (k === "success" ? <CircleCheck className="h-3.5 w-3.5 text-emerald-300" /> : k === "error" ? <CircleX className="h-3.5 w-3.5 text-rose-300" /> : <Info className="h-3.5 w-3.5 text-sky-300" />);
  const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="fixed bottom-4 right-4 z-[55] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} className="glass w-[min(360px,calc(100vw-2rem))] overflow-hidden bg-surface-1/95">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="label">{t("dock.title")}</span>
              <span className="flex items-center gap-1">
                <button onClick={clearActivity} className="rounded-md p-1 text-slate-400 hover:bg-white/10" title={t("dock.clear")}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </span>
            </div>
            <div ref={box} className="max-h-[46vh] space-y-1 overflow-auto p-2">
              {list.length === 0 && <div className="p-3 text-center text-xs text-slate-500">{t("dock.empty")}</div>}
              {[...list].reverse().map((a) => (
                <motion.button
                  key={a.id}
                  layout
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => focusAnchor(a.anchor)}
                  className={`flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/5 ${a.anchor ? "" : "cursor-default"}`}
                >
                  <span className="mt-0.5 shrink-0">{icon(a.kind)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-100">{a.title}</span>
                    {(a.body || a.bodyKey) && <span className="block text-slate-400">{a.bodyKey ? t(a.bodyKey) : a.body}</span>}
                  </span>
                  <span className="shrink-0 text-right font-mono text-[10px] text-slate-500">
                    {time(a.at)}
                    {a.anchor && <Crosshair className="ml-auto mt-1 h-3 w-3 text-slate-400" />}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {showTop && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn-brut glass grid h-10 w-10 place-items-center rounded-full bg-surface-1" title={t("dock.top")}>
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <button onClick={() => setOpen((o) => !o)} className="btn-brut glass relative flex h-10 items-center gap-2 rounded-full bg-surface-1 px-3 text-xs font-semibold">
          <BellRing className={`h-4 w-4 ${unread ? "animate-[shake_0.5s_ease-in-out_2]" : ""}`} />
          <span className="hidden max-w-[220px] truncate sm:inline">{last ? last.title : t("dock.title")}</span>
          {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-surface-1 bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
        </button>
      </div>
    </div>
  );
}
