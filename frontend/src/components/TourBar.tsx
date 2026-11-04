import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipForward, X, Clapperboard } from "lucide-react";
import type { Tour } from "../lib/tour";
import { useT } from "../i18n/useT";
import Button from "./Button";

/** Nút bật Trình chiếu. */
export function TourButton({ tour, accent }: { tour: Tour; accent: string }) {
  const { t } = useT();
  return (
    <Button accent={accent} icon={<Clapperboard className="h-4 w-4" />} onClick={() => (tour.running ? tour.stop() : tour.start())}>
      {tour.running ? t("common.tourStop") : t("common.tourStart")}
    </Button>
  );
}

/** Phụ đề trình chiếu cố định đáy màn hình + điều khiển + tiến độ. */
export default function TourBar({ tour, accent }: { tour: Tour; accent: string }) {
  const { t } = useT();
  return (
    <AnimatePresence>
      {tour.running && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(920px,calc(100%-2rem))]"
        >
          <div className="glass overflow-hidden border-white/20 bg-surface-1/85 shadow-2xl">
            <div className="h-1 w-full bg-white/5">
              <motion.div className={`h-full bg-gradient-to-r ${accent}`} animate={{ width: `${((tour.index + 1) / tour.total) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4 px-5 py-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-sm font-bold text-ink-950`}>
                {tour.index + 1}/{tour.total}
              </span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tour.index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="min-w-0 flex-1 text-sm text-slate-100 sm:text-base"
                >
                  {t(tour.caption)}
                </motion.p>
              </AnimatePresence>
              <div className="flex shrink-0 items-center gap-1">
                <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={tour.togglePause} title="Space">
                  {tour.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={tour.next} title="→">
                  <SkipForward className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={tour.stop} title="Esc">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="px-5 pb-2 text-[10px] text-slate-500">{t("common.tourKeys")}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
