import { useCallback, useRef, useState } from "react";

/** Bọc một hành động async: trạng thái busy + lỗi, chống bấm đúp. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  const run = useCallback(async <T,>(name: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (lock.current) return undefined;
    lock.current = true;
    setBusy(name);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }, []);

  return { busy, error, run, setError };
}
