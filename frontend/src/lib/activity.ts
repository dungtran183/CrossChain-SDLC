// Nhật ký sự kiện toàn cục: mọi thông báo (toast) đều được ghi lại để người xem theo dõi
// diễn biến dù đang cuộn ở bất kỳ đâu trên trang. `anchor` = id phần tử để cuộn tới.
import { useEffect, useState } from "react";

export type ActivityKind = "success" | "error" | "info";
export type Activity = { id: number; kind: ActivityKind; title: string; body?: string; bodyKey?: string; anchor?: string; at: number; path: string };

const MAX = 40;
let items: Activity[] = [];
let seq = 0;
const listeners = new Set<() => void>();

export function logActivity(a: Omit<Activity, "id" | "at" | "path">) {
  items = [...items, { ...a, id: ++seq, at: Date.now(), path: window.location.hash }].slice(-MAX);
  listeners.forEach((l) => l());
}

export function clearActivity() {
  items = [];
  listeners.forEach((l) => l());
}

export function useActivity() {
  const [list, setList] = useState(items);
  useEffect(() => {
    const l = () => setList(items);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return list;
}

/** Cuộn mượt tới phần tử theo id và nháy viền để người xem thấy chỗ vừa thay đổi. */
export function focusAnchor(id?: string) {
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("flash-focus");
  void el.offsetWidth; // khởi động lại animation
  el.classList.add("flash-focus");
}
