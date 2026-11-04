import { useCallback, useEffect, useRef, useState } from "react";
import { focusAnchor, logActivity } from "./activity";

/** Một bước của chế độ Trình chiếu: phụ đề (key i18n) + hành động + thời gian dừng sau hành động. */
export type TourStep = { caption: string; run?: () => Promise<unknown> | unknown; hold?: number; focus?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Engine Tour: chạy tuần tự các bước, có thể tạm dừng / bỏ qua (Space, →, Esc).
 * `steps` nên ổn định (useMemo) — các hàm run đọc trạng thái mới nhất qua ref của component.
 */
export function useTour(steps: TourStep[]) {
  const [index, setIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const runId = useRef(0);
  const skip = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const stop = useCallback(() => {
    runId.current += 1;
    setIndex(-1);
    setPaused(false);
    skip.current();
  }, []);

  const start = useCallback(async () => {
    const id = ++runId.current;
    setPaused(false);
    for (let i = 0; i < steps.length; i++) {
      if (runId.current !== id) return;
      setIndex(i);
      logActivity({ kind: "info", title: `▶ ${i + 1}/${steps.length}`, bodyKey: steps[i].caption, anchor: steps[i].focus });
      try {
        // cuộn tới khu vực của bước trước khi chạy, để diễn biến luôn nằm trong tầm nhìn
        if (steps[i].focus) focusAnchor(steps[i].focus);
        await steps[i].run?.();
        if (steps[i].focus) setTimeout(() => focusAnchor(steps[i].focus), 350); // phần tử có thể vừa xuất hiện
      } catch {
        /* lỗi bước được component hiển thị; tour vẫn tiếp tục */
      }
      // chờ hold ms, cho phép bỏ qua và tạm dừng
      const hold = steps[i].hold ?? 2600;
      let waited = 0;
      let skipped = false;
      skip.current = () => {
        skipped = true;
      };
      while (!skipped && (waited < hold || pausedRef.current)) {
        if (runId.current !== id) return;
        await sleep(100);
        if (!pausedRef.current) waited += 100;
      }
    }
    if (runId.current === id) setIndex(-1);
  }, [steps]);

  const running = index >= 0;

  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
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
    paused,
    start,
    stop,
    next: () => skip.current(),
    togglePause: () => setPaused((p) => !p),
  };
}

export type Tour = ReturnType<typeof useTour>;
