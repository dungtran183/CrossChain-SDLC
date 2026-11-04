// "Hiểu nhanh cho người mới": ví von đời thường + những gì sẽ thấy trên trang + chú giải thuật ngữ.
// Mở sẵn ở lần ghé đầu tiên, sau đó nhớ trạng thái thu gọn (localStorage).
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Eye, Lightbulb } from "lucide-react";
import { useT } from "../i18n/useT";

const KEY = (ns: string) => `xchain-primer-${ns}`;

function readOpen(ns: string) {
  try {
    return localStorage.getItem(KEY(ns)) !== "closed";
  } catch {
    return true;
  }
}

export default function Primer({ ns, accent }: { ns: string; accent: string }) {
  const { t, tl } = useT();
  const [open, setOpen] = useState(() => readOpen(ns));
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem(KEY(ns), o ? "closed" : "open");
      } catch {
        /* bỏ qua */
      }
      return !o;
    });
  const watch = tl(`${ns}.primer.watchList`);
  const terms = tl(`${ns}.primer.termList`).map((s) => s.split("|"));

  return (
    <section className="glass overflow-hidden" data-testid="primer">
      <button onClick={toggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5" aria-expanded={open}>
        <span className="flex items-center gap-2.5">
          <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${accent} text-ink-950`}>
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="font-display text-sm font-bold">{t("primer.badge")}</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          {open ? t("primer.hide") : t("primer.show")}
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="grid gap-4 border-t border-white/10 px-4 pb-5 pt-4 sm:px-5 lg:grid-cols-[1.1fr_1fr_1.3fr]">
              <div>
                <div className="label mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> {t("primer.analogy")}
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{t(`${ns}.primer.analogy`)}</p>
              </div>
              <div>
                <div className="label mb-1.5 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> {t("primer.watch")}
                </div>
                <ol className="space-y-1.5">
                  {watch.map((w, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="flex gap-2 text-sm text-slate-300">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br ${accent} text-[10px] font-bold text-ink-950`}>{i + 1}</span>
                      {w}
                    </motion.li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="label mb-1.5">{t("primer.terms")}</div>
                <dl className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {terms.map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                      <dt className="text-xs font-bold text-slate-100">{k}</dt>
                      <dd className="text-xs leading-snug text-slate-400">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
