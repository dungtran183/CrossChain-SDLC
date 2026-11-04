// Trình phát diễn biến tấn công: hai cảnh song song — "Thực tế" và "Có công cụ của luận án" — chạy theo cùng một bước.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Pause, Play, RotateCcw, ShieldCheck, ShieldX } from "lucide-react";
import { useT } from "../../i18n/useT";
import AttackScene, { sceneState } from "./AttackScene";
import { STORIES } from "./stories";
import PaceControl from "../../components/PaceControl";
import { usePace } from "../../lib/pace";

const MOD_COLOR = { cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42" } as const;
/** Thời gian mỗi bước (1×): đủ đọc lời kể của cả hai cột (~230 ms/từ). */
const stepMs = (text: string) => Math.max(4000, 1600 + text.split(/\s+/).length * 230);

export type IncidentInfo = { id: string; name: string; date: string; loss: number };

export default function IncidentPlayer({ incident, fmt }: { incident: IncidentInfo; fmt: (m: number) => string }) {
  const { t, tl } = useT();
  const [pace] = usePace();
  const story = STORIES[incident.id];
  const [upto, setUpto] = useState(0);
  const [playing, setPlaying] = useState(true);
  const n = story.steps.length;
  const last = upto >= n - 1;

  const steps = tl(`inc.story.${story.id}.steps`);
  const real = sceneState(story, upto, false);
  const guard = sceneState(story, upto, true);
  const by = story.block.by;
  const color = MOD_COLOR[by];
  const lossReal = incident.loss * real.drained;
  const lossGuard = incident.loss * guard.drained;

  const guardText =
    upto < story.block.step ? steps[upto] : upto === story.block.step ? t(`inc.story.${story.id}.block`) : t("inc.player.prevented").replace("{n}", String(story.block.step + 1));

  const stepDur = stepMs(`${steps[upto] ?? ""} ${upto === story.block.step ? guardText : ""}`) / pace;

  useEffect(() => {
    if (!playing || last) {
      if (last) setPlaying(false);
      return;
    }
    const h = window.setTimeout(() => setUpto((u) => Math.min(n - 1, u + 1)), stepDur);
    return () => window.clearTimeout(h);
  }, [playing, upto, last, n, stepDur]);

  const go = (i: number) => {
    setPlaying(false);
    setUpto(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="space-y-4">
      {/* dòng thời gian các bước */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button className="chip" onClick={() => go(upto - 1)} disabled={upto === 0} aria-label={t("inc.player.prev")}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {last ? (
            <button
              className="chip"
              onClick={() => {
                setUpto(0);
                setPlaying(true);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("inc.player.restart")}
            </button>
          ) : (
            <button className="chip" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? t("inc.player.pause") : t("inc.player.play")}
            </button>
          )}
          <button className="chip" onClick={() => go(upto + 1)} disabled={last} aria-label={t("inc.player.next")}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <PaceControl compact />
        </div>
        <div className="flex min-w-0 flex-1 basis-full items-center gap-1 sm:basis-0">
          {story.steps.map((_, i) => {
            const isBlock = i === story.block.step;
            return (
              <button key={i} onClick={() => go(i)} className="group relative flex-1" title={steps[i]}>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isBlock ? color : "#ff4b4b" }}
                    initial={false}
                    animate={{ width: i < upto ? "100%" : i === upto ? "100%" : "0%" }}
                    transition={{ duration: i === upto && playing ? stepDur / 1000 : 0.3, ease: "linear" }}
                  />
                </div>
                <div className={`mt-1 flex items-center justify-center gap-0.5 text-[10px] font-semibold ${i === upto ? "text-white" : "text-slate-500"}`}>
                  {isBlock && <ShieldCheck className="h-3 w-3" style={{ color }} />}
                  <span className="hidden sm:inline">{t("inc.player.step")}</span> {i + 1}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* cột thực tế */}
        <div className="card-brut flex flex-col gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/[0.05] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
              <Flame className="h-3.5 w-3.5" /> {t("inc.player.real")}
            </span>
            <LossMeter value={lossReal} max={incident.loss} fmt={fmt} label={t("inc.player.lost")} tone="#ff4b4b" />
          </div>
          <AttackScene story={story} upto={upto} guarded={false} />
          <Narration key={`r${incident.id}${upto}`} n={upto + 1} text={steps[upto]} tone="#ff4b4b" />
        </div>

        {/* cột có công cụ */}
        <div className="card-brut flex flex-col gap-3 rounded-2xl border border-white/15 p-3" style={{ background: `${color}12` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold text-ink-950" style={{ background: color }}>
              <ShieldCheck className="h-3.5 w-3.5" /> {t("inc.player.with")} · {by.toUpperCase()}
            </span>
            <LossMeter value={lossGuard} max={incident.loss} fmt={fmt} label={t("inc.player.lost")} tone={color} />
          </div>
          <AttackScene story={story} upto={upto} guarded />
          <Narration key={`g${incident.id}${upto}`} n={upto + 1} text={guardText} tone={color} shield={upto >= story.block.step} />
        </div>
      </div>

      {/* kết cục */}
      <AnimatePresence>
        {last && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <ShieldX className="h-3.5 w-3.5" /> {t("inc.player.real")} · {fmt(incident.loss)}
              </div>
              <p className="text-sm text-slate-200">{t(`inc.story.${story.id}.outcome.real`)}</p>
            </div>
            <div className="flex items-center justify-center">
              <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 12 }} className="rounded-xl px-3 py-2 text-center text-ink-950" style={{ background: color }}>
                <div className="text-[10px] font-bold uppercase tracking-wide">{t("inc.player.saved")}</div>
                <div className="font-display text-lg font-extrabold">{fmt(Math.round(incident.loss - lossGuard))}</div>
              </motion.div>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: `${color}88`, background: `${color}14` }}>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold" style={{ color }}>
                <ShieldCheck className="h-3.5 w-3.5" /> {t("inc.player.with")} · {fmt(Math.round(lossGuard))}
              </div>
              <p className="text-sm text-slate-200">{t(`inc.story.${story.id}.outcome.with`)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Narration({ n, text, tone, shield }: { n: number; text: string; tone: string; shield?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex min-h-[4.5rem] gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: tone }}>
        {shield ? <ShieldCheck className="h-3.5 w-3.5 text-ink-950" /> : n}
      </span>
      <p className="text-sm leading-relaxed text-slate-200">{text}</p>
    </motion.div>
  );
}

function LossMeter({ value, max, fmt, label, tone }: { value: number; max: number; fmt: (m: number) => string; label: string; tone: string }) {
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <div className="min-w-[9rem] text-right">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-mono text-sm font-bold" style={{ color: tone }}>
        {fmt(Math.round(value))}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full" style={{ background: tone }} initial={false} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}
