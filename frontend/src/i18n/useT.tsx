import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import vi from "./vi.json";
import en from "./en.json";

export type Lang = "vi" | "en";
const DICTS: Record<Lang, unknown> = { vi, en };
const STORAGE_KEY = "xchain-demo-lang";

function readLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}

function lookup(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object") return (node as Record<string, unknown>)[part];
    return undefined;
  }, dict);
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Chuỗi theo key dạng "cd2.m1.title"; thiếu key thì trả về chính key để dễ phát hiện. */
  t: (key: string) => string;
  /** Mảng chuỗi (vd danh sách bước). */
  tl: (key: string) => string[];
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage có thể bị chặn — bỏ qua */
    }
    document.documentElement.lang = l;
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[lang];
    return {
      lang,
      setLang,
      t: (key) => {
        const v = lookup(dict, key);
        return typeof v === "string" ? v : key;
      },
      tl: (key) => {
        const v = lookup(dict, key);
        return Array.isArray(v) ? (v as string[]) : [];
      },
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}
