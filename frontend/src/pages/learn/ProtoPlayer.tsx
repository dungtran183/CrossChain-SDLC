// Trình phát mô phỏng một giao thức: hai chế độ (luồng chuẩn / sự cố), tự chạy theo nhịp độ chung, điều khiển từng bước,
// lời kể cho mỗi bước. Tạm dừng khi cảnh ra khỏi màn hình.
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Pause, Play, RotateCcw, Workflow } from "lucide-react";
import { useT } from "../../i18n/useT";
import { usePace } from "../../lib/pace";
import PaceControl from "../../components/PaceControl";
import type { Mode, ProtoDef } from "./protocols";

const stepMs = (text: string) => Math.max(3800, 1500 + text.split(/\s+/).length * 220);

export default function ProtoPlayer({ proto, mode, setMode }: { proto: ProtoDef; mode: Mode; setMode: (m: Mode) => void }) {
  const { t, tl } = useT();
  const [pace] = usePace();
  const steps = tl(`proto.${proto.id}.${mode}`);
  const n = steps.length;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box, { amount: 0.35 });
  const last = step >= n - 1;
  const dur = stepMs(steps[step] ?? "") / pace;
  const atk = mode === "attack";
  const tone = atk ? "#ff4b4b" : proto.color;

  useEffect(() => {
    if (!playing || !visible) return;
    if (last) {
      setPlaying(false);
      return;
    }
    const h = window.setTimeout(() => setStep((s) => Math.min(n - 1, s + 1)), dur);
    return () => window.clearTimeout(h);
  }, [playing, visible, step, last, n, dur]);

  const go = (i: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(n - 1, i)));
  };
  const Scene = proto.Scene;

  return (
    <div ref={box} className="space-y-3" data-testid="proto-player">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="tabs-brut flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="tablist" aria-label={t("proto.modeLabel")}>
          {(["normal", "attack"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === m ? "text-ink-950" : "text-slate-300 hover:text-white"}`}
            >
              {mode === m && (
                <motion.span layoutId="proto-mode" className="absolute inset-0 rounded-lg" style={{ background: m === "attack" ? "#ff4b4b" : proto.color }} transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <span className={`relative flex items-center gap-1.5 ${mode === m && m === "attack" ? "text-white" : ""}`}>
                {m === "attack" ? <Flame className="h-3.5 w-3.5" /> : <Workflow className="h-3.5 w-3.5" />}
                {t(`proto.mode.${m}`)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button className="chip" onClick={() => go(step - 1)} disabled={step === 0} aria-label={t("inc.player.prev")}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {last ? (
            <button
              className="chip"
              onClick={() => {
                setStep(0);
                setPlaying(true);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("inc.player.restart")}
            </button>
          ) : (
            <button className="chip" onClick={() => setPlaying((p) => !p)} data-testid="proto-play">
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? t("inc.player.pause") : t("inc.player.play")}
            </button>
          )}
          <button className="chip" onClick={() => go(step + 1)} disabled={last} aria-label={t("inc.player.next")} data-testid="proto-next">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <PaceControl compact />
        </div>
      </div>

      <div className="card-brut overflow-hidden rounded-2xl border p-2" style={{ borderColor: `${tone}66`, background: `${tone}0d` }}>
        <Scene step={step} mode={mode} />
      </div>

      {/* thanh tiến trình theo bước */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <button key={i} onClick={() => go(i)} className="flex-1" title={s} aria-label={`${t("inc.player.step")} ${i + 1}`}>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: tone }}
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: i === step && playing && visible ? dur / 1000 : 0.25, ease: "linear" }}
              />
            </div>
          </button>
        ))}
      </div>

      <motion.div
        key={`${proto.id}-${mode}-${step}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[4.5rem] gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3"
        data-testid="proto-narration"
      >
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold text-ink-950" style={{ background: tone, color: atk ? "#fff" : undefined }}>
          {step + 1}
        </span>
        <p className="text-sm leading-relaxed text-slate-200">{steps[step]}</p>
      </motion.div>
    </div>
  );
}
