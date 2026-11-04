import { useEffect, useRef } from "react";
import { MODE, wsUrl } from "./api";

export type BusEvent = { type: string; source: string; data: unknown };

/** Lắng nghe WebSocket /ws (chỉ chế độ live); tự kết nối lại. */
export function useBus(onEvent: (e: BusEvent) => void, enabled = true) {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    if (MODE !== "live" || !enabled) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let timer: ReturnType<typeof setTimeout>;
    const connect = () => {
      ws = new WebSocket(wsUrl());
      ws.onmessage = (m) => {
        try {
          cb.current(JSON.parse(m.data));
        } catch {
          /* bỏ qua */
        }
      };
      ws.onclose = () => {
        if (!closed) timer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [enabled]);
}
