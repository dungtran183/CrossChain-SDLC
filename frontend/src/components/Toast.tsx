import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, CircleX, Info } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
type ToastItem = { id: number; kind: Kind; title: string; body?: string };

const Ctx = createContext<(t: Omit<ToastItem, "id">) => void>(() => {});
let seq = 0;

/** Thông báo nổi góc phải (kết quả giao dịch, lỗi, gợi ý). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = ++seq;
    setItems((xs) => [...xs.slice(-3), { ...t, id }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100%-2rem))] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              className={`glass pointer-events-auto flex gap-3 border-l-4 bg-surface-1/90 p-3 ${
                t.kind === "success" ? "border-l-emerald-400" : t.kind === "error" ? "border-l-rose-500" : "border-l-sky-400"
              }`}
            >
              {t.kind === "success" ? (
                <CircleCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : t.kind === "error" ? (
                <CircleX className="h-5 w-5 shrink-0 text-rose-400" />
              ) : (
                <Info className="h-5 w-5 shrink-0 text-sky-400" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t.title}</div>
                {t.body && <div className="break-words text-xs text-slate-400">{t.body}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
