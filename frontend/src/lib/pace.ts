// Nhịp độ trình diễn dùng chung (kịch bản tự động, tick CĐ3, trình phát sự cố): 0.5× = chậm gấp đôi.
import { useEffect, useState } from "react";

export const PACES = [0.5, 0.75, 1, 1.5] as const;
export type Pace = (typeof PACES)[number];
const KEY = "xchain-pace";
const listeners = new Set<() => void>();

function read(): Pace {
  try {
    const v = Number(localStorage.getItem(KEY));
    return (PACES as readonly number[]).includes(v) ? (v as Pace) : 1;
  } catch {
    return 1;
  }
}

let pace: Pace = read();

export const getPace = () => pace;

export function setPace(p: Pace) {
  pace = p;
  try {
    localStorage.setItem(KEY, String(p));
  } catch {
    /* storage bị chặn — chỉ giữ trong phiên */
  }
  listeners.forEach((l) => l());
}

export function usePace(): [Pace, (p: Pace) => void] {
  const [p, setP] = useState(pace);
  useEffect(() => {
    const l = () => setP(pace);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return [p, setPace];
}

/** Thời lượng đã điều chỉnh theo nhịp độ hiện tại. */
export const paced = (ms: number) => Math.round(ms / pace);

/** Chờ `ms` theo nhịp độ (đọc lại nhịp độ mỗi 100 ms để đổi tốc độ có hiệu lực ngay). */
export async function pacedSleep(ms: number) {
  let done = 0;
  while (done < ms) {
    await new Promise((r) => setTimeout(r, 100));
    done += 100 * pace;
  }
}
