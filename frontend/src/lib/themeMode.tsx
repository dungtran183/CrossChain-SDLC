// Chế độ hiển thị sáng/tối. Mặc định sáng (phong cách blockchainist.net); lưu lựa chọn trong localStorage.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
const KEY = "xchain-theme";

function initial(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* storage bị chặn */
  }
  return "light";
}

const Ctx = createContext<{ mode: ThemeMode; toggle: () => void }>({ mode: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* bỏ qua */
    }
  }, [mode]);
  const toggle = useCallback(() => setMode((m) => (m === "light" ? "dark" : "light")), []);
  return <Ctx.Provider value={{ mode, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
