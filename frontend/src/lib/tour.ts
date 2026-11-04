import { useCallback, useEffect, useRef, useState } from "react";
import { focusAnchor, logActivity } from "./activity";
import { getPace } from "./pace";
import { useT } from "../i18n/useT";

/**
 * Một bước của kịch bản tự động: phụ đề (key i18n) + hành động + thời gian dừng tối thiểu sau hành động.
 * Lời giải thích chi tiết lấy theo quy ước key: "<ns>.tour.sN" → "<ns>.tour.dN" (nếu có).
 */
export type TourStep = { caption: string; run?: () => Promise<unknown> | unknown; hold?: number; focus?: string };

export const detailKey = (caption: string) => caption.replace(/\.s(\d+)$/, ".d$1");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Engine kịch bản: chạy tuần tự các bước, có thể tạm dừng / bỏ qua (Space, →, Esc).
 * Thời gian dừng mỗi bước đủ để đọc hết phụ đề + giải thích, chia cho nhịp độ (0.5× = chậm gấp đôi).
 * `steps` nên ổn định (useMemo) — các hàm run đọc trạng thái mới nhất qua ref của component.
 */
export function useTour(steps: TourStep[]) {
  const { t } = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [index, setIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [holdMs, setHoldMs] = useState(0); // >0: đang ở pha đọc (sau khi hành động xong)
  const runId = useRef(0);
  const skip = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const stop = useCallback(() => {
    runId.current += 1;
    setIndex(-1);
    setPaused(false);
    setHoldMs(0);
    skip.current();
  }, []);

  const start = useCallback(async () => {
    const id = ++runId.current;
    setPaused(false);
    for (let i = 0; i < steps.length; i++) {
      if (runId.current !== id) return;
      const st = steps[i];
      setIndex(i);
      setHoldMs(0);
      logActivity({ kind: "info", title: `▶ ${i + 1}/${steps.length}`, bodyKey: st.caption, anchor: st.focus });
      try {
        // cuộn tới khu vực của bước trước khi chạy, để diễn biến luôn nằm trong tầm nhìn
        if (st.focus) focusAnchor(st.focus);
        await st.run?.();
        if (st.focus) setTimeout(() => focusAnchor(st.focus), 350); // phần tử có thể vừa xuất hiện
      } catch {
        /* lỗi bước được component hiển thị; kịch bản vẫn tiếp tục */
      }
      if (runId.current !== id) return;
      // thời gian đọc: ~260 ms/từ cho phụ đề + giải thích
      const tr = tRef.current;
      const dk = detailKey(st.caption);
      const detail = tr(dk) === dk ? "" : tr(dk);
      const hold = Math.max(st.hold ?? 2600, 1800 + (words(tr(st.caption)) + words(detail)) * 260);
      setHoldMs(hold);
      let waited = 0;
      let skipped = false;
      skip.current = () => {
        skipped = true;
      };
      while (!skipped && (waited < hold || pausedRef.current)) {
        if (runId.current !== id) return;
        await sleep(100);
        if (!pausedRef.current) waited += 100 * getPace();
      }
    }
    if (runId.current === id) {
      setIndex(-1);
      setHoldMs(0);
    }
  }, [steps]);

  const running = index >= 0;

  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight") skip.current();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, stop]);

  return {
    running,
    index,
    total: steps.length,
    caption: running ? steps[index].caption : "",
    holdMs,
    paused,
    start,
    stop,
    next: () => skip.current(),
    togglePause: () => setPaused((p) => !p),
  };
}

export type Tour = ReturnType<typeof useTour>;
