import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipForward, X, Swords } from "lucide-react";
import { detailKey, type Tour } from "../lib/tour";
import { usePace } from "../lib/pace";
import { useT } from "../i18n/useT";
import Button from "./Button";
import Portal from "./Portal";
import PaceControl from "./PaceControl";

/** Nút bật kịch bản tấn công tự động. */
export function TourButton({ tour, accent }: { tour: Tour; accent: string }) {
  const { t } = useT();
  return (
    <Button accent={accent} icon={<Swords className="h-4 w-4" />} onClick={() => (tour.running ? tour.stop() : tour.start())}>
      {tour.running ? t("common.tourStop") : t("common.tourStart")}
    </Button>
  );
}

/**
 * Phụ đề kịch bản cố định đáy cửa sổ (portal ra <body> để luôn bám theo màn hình đang xem):
 * phụ đề + giải thích chi tiết + thanh thời gian đọc + tốc độ + điều khiển.
 */
export default function TourBar({ tour, accent }: { tour: Tour; accent: string }) {
  const { t } = useT();
  const [pace] = usePace();
  const dk = tour.running ? detailKey(tour.caption) : "";
  const detail = dk && t(dk) !== dk ? t(dk) : "";
  return (
    <Portal>
      <AnimatePresence>
        {tour.running && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] px-3 lg:pl-[19rem]"
          >
            <div className="glass pointer-events-auto mx-auto max-w-[900px] overflow-hidden border-white/20 bg-surface-1 shadow-2xl" role="status" aria-live="polite">
              <div className="h-1 w-full bg-white/5">
                <motion.div className={`h-full bg-gradient-to-r ${accent}`} animate={{ width: `${((tour.index + 1) / tour.total) * 100}%` }} />
              </div>
              <div className="flex items-start gap-4 px-4 py-3 sm:px-5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-sm font-bold text-ink-950`}>
                  {tour.index + 1}/{tour.total}
                </span>
                <AnimatePresence mode="wait">
                  <motion.div key={tour.index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-100 sm:text-base">{t(tour.caption)}</p>
                    {detail && <p className="max-h-28 overflow-auto text-xs leading-relaxed text-slate-300 sm:text-[13px]">{detail}</p>}
                  </motion.div>
                </AnimatePresence>
                <div className="flex shrink-0 items-center gap-1">
                  <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={tour.togglePause} title="Space" aria-label="pause">
                    {tour.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={tour.next} title="→" aria-label="next">
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={tour.stop} title="Esc" aria-label="stop">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* thanh thời gian đọc của bước hiện tại */}
              <div className="mx-4 h-1 overflow-hidden rounded-full bg-white/10 sm:mx-5">
                {tour.holdMs > 0 && (
                  <div
                    key={`${tour.index}-${pace}`}
                    className={`h-full origin-left bg-gradient-to-r ${accent}`}
                    style={{ animation: `tour-hold ${tour.holdMs / pace}ms linear forwards`, animationPlayState: tour.paused ? "paused" : "running" }}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-5">
                <span className="text-[10px] text-slate-500">{t("common.tourKeys")}</span>
                <PaceControl />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
