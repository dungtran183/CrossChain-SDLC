// Dải sự kiện trong header sticky: luôn hiện sự kiện mới nhất (theo thanh cuộn), header lóe màu khi có
// sự kiện mới, bấm để cuộn tới nơi xảy ra; chuông mở nhật ký đầy đủ thả xuống ngay dưới header.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Bell, ChevronDown, CircleCheck, CircleX, Crosshair, Info, Lightbulb, Trash2 } from "lucide-react";
import { clearActivity, focusAnchor, useActivity, type Activity } from "../lib/activity";
import { useT } from "../i18n/useT";

const TONE: Record<Activity["kind"], string> = { success: "#22c55e", error: "#ff4b4b", info: "#3d8bff" };

function KindIcon({ kind, className = "h-4 w-4" }: { kind: Activity["kind"]; className?: string }) {
  if (kind === "success") return <CircleCheck className={`${className} text-emerald-400`} />;
  if (kind === "error") return <CircleX className={`${className} text-rose-400`} />;
  return <Info className={`${className} text-sky-400`} />;
}

function useNow(ms = 5000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export default function EventTicker() {
  const { t } = useT();
  const list = useActivity();
  const loc = useLocation();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const [flash, setFlash] = useState<Activity | null>(null);
  const last = list[list.length - 1];
  const unread = open ? 0 : list.filter((a) => a.id > seen).length;
  const boxRef = useRef<HTMLDivElement>(null);

  // lóe header khi có sự kiện mới
  useEffect(() => {
    if (!last) return;
    setFlash(last);
    const h = window.setTimeout(() => setFlash(null), 1400);
    return () => window.clearTimeout(h);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && last) setSeen(last.id);
  }, [open, last]);

  // đóng bảng khi bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, [open]);

  const ago = (at: number) => {
    const s = Math.max(0, Math.round((now - at) / 1000));
    if (s < 10) return t("dock.justNow");
    if (s < 60) return t("dock.secAgo").replace("{n}", String(s));
    return t("dock.minAgo").replace("{n}", String(Math.round(s / 60)));
  };
  const body = (a: Activity) => (a.bodyKey ? t(a.bodyKey) : a.body);
  const route = loc.pathname.replace(/^\//, "") || "home";
  const hintKey = `hint.${route}`;
  const hint = t(hintKey) === hintKey ? t("hint.home") : t(hintKey);
  // sự kiện cũ hơn 5 phút hoặc của trang khác → hiện gợi ý của trang hiện tại
  const showEvent = last && now - last.at < 5 * 60_000 && last.path.split("?")[0] === `#${loc.pathname}`;

  return (
    <div ref={boxRef} className="order-last flex w-full min-w-0 items-center gap-2 md:order-none md:w-auto md:flex-1">
      {/* lớp lóe màu phủ toàn header (header là phần tử định vị gần nhất) */}
      <AnimatePresence>
        {flash && (
          <motion.span
            key={flash.id}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ boxShadow: `0 0 0 3px ${TONE[flash.kind]}, 0 0 28px ${TONE[flash.kind]}66` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
          />
        )}
      </AnimatePresence>

      <button
        onClick={() => (showEvent && last?.anchor ? focusAnchor(last.anchor) : setOpen((o) => !o))}
        className="group flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left transition hover:bg-white/[0.06]"
        aria-live="polite"
        data-testid="event-ticker"
      >
        <AnimatePresence mode="wait" initial={false}>
          {showEvent && last ? (
            <motion.span key={last.id} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={{ duration: 0.25 }} className="flex min-w-0 flex-1 items-center gap-2.5">
              <KindIcon kind={last.kind} className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">
                <b className="font-semibold text-slate-100">{last.title}</b>
                {body(last) && <span className="text-slate-400"> · {body(last)}</span>}
              </span>
              <span className="hidden shrink-0 font-mono text-[10px] text-slate-500 sm:inline">{ago(last.at)}</span>
              {last.anchor && <Crosshair className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:scale-125 group-hover:text-white" />}
            </motion.span>
          ) : (
            <motion.span key={`hint-${route}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-w-0 flex-1 items-center gap-2.5">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{hint}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <button onClick={() => setOpen((o) => !o)} className="btn-brut relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" title={t("dock.title")} aria-label={t("dock.title")} aria-expanded={open} data-testid="event-bell">
        <Bell className={`h-4 w-4 ${unread ? "animate-[shake_0.5s_ease-in-out_2]" : ""}`} key={last?.id} />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-surface-1 bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass absolute right-2 top-full z-50 mt-2 w-[min(420px,calc(100vw-1.5rem))] overflow-hidden bg-surface-1" data-testid="event-log">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="label">
                {t("dock.title")} · {list.length}
              </span>
              <span className="flex items-center gap-1">
                <button onClick={clearActivity} className="rounded-md p-1 text-slate-400 hover:bg-white/10" title={t("dock.clear")} aria-label={t("dock.clear")}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10" aria-label="close">
                  <ChevronDown className="h-4 w-4 rotate-180" />
                </button>
              </span>
            </div>
            <div className="max-h-[60vh] space-y-1 overflow-auto p-2">
              {list.length === 0 && <div className="p-3 text-center text-xs text-slate-500">{t("dock.empty")}</div>}
              {[...list].reverse().map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    if (a.anchor) {
                      setOpen(false);
                      focusAnchor(a.anchor);
                    }
                  }}
                  className={`flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/5 ${a.anchor ? "" : "cursor-default"}`}
                >
                  <span className="mt-0.5 shrink-0">
                    <KindIcon kind={a.kind} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-100">{a.title}</span>
                    {body(a) && <span className="block text-slate-400">{body(a)}</span>}
                  </span>
                  <span className="shrink-0 text-right font-mono text-[10px] text-slate-500">
                    {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    {a.anchor && <Crosshair className="ml-auto mt-1 h-3 w-3 text-slate-400" />}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
