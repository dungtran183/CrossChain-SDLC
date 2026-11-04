import { createContext, useCallback, useContext, type ReactNode } from "react";
import { logActivity } from "../lib/activity";

type Kind = "success" | "error" | "info";
type ToastItem = { kind: Kind; title: string; body?: string; anchor?: string };

const Ctx = createContext<(t: ToastItem) => void>(() => {});

/**
 * Thông báo sự kiện (kết quả giao dịch, lỗi, gợi ý). Không còn popup nổi: mọi thông báo đi vào nhật ký
 * và hiện trên dải sự kiện của header sticky (components/EventTicker.tsx), bấm để cuộn tới `anchor`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const push = useCallback((t: ToastItem) => logActivity(t), []);
  return <Ctx.Provider value={push}>{children}</Ctx.Provider>;
}

export const useToast = () => useContext(Ctx);
