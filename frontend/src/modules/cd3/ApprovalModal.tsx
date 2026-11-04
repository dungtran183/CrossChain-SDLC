// Hộp thoại phê duyệt R4/R5: luôn nằm giữa cửa sổ đang xem (portal ra <body>), khóa cuộn nền,
// focus sẵn nút Phê duyệt; Enter = phê duyệt, Esc = để sau.
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gauge as GaugeIcon, ShieldAlert, Siren } from "lucide-react";
import { useT } from "../../i18n/useT";
import Button from "../../components/Button";
import Portal from "../../components/Portal";
import type { Approval } from "./types";

type Props = { modal: Approval | null; onDecide: (id: number, ok: boolean) => void; onLater: (id: number) => void };

export default function ApprovalModal({ modal, onDecide, onLater }: Props) {
  const { t } = useT();
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const h = window.setTimeout(() => okRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLater(modal.id);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(h);
      window.removeEventListener("keydown", onKey);
    };
  }, [modal, onLater]);

  return (
    <Portal>
      <AnimatePresence>
        {modal && (
          <motion.div role="dialog" aria-modal="true" aria-labelledby="cd3-modal-title" className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="glass max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-auto border-rose-500/40 bg-surface-1">
              <div className="h-1 w-full animate-gradient-x bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 bg-[length:200%_auto]" />
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/20">
                    <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-rose-500/40" />
                    {modal.level === "R5" ? <Siren className="h-6 w-6 text-rose-300" /> : <ShieldAlert className="h-6 w-6 text-rose-300" />}
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-rose-300">{t("cd3.modal.title")}</div>
                    <div id="cd3-modal-title" className="text-lg font-bold">
                      {modal.level} · {t(`cd3.level.${modal.level}`)} — {modal.target}
                    </div>
                  </div>
                </div>
                <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-slate-200">{t(`cd3.modal.what${modal.level}`).replace(/\{target\}/g, modal.target).replace(/\{corridor\}/g, modal.corridor)}</p>
                <div className="space-y-1 rounded-xl bg-surface-0/60 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">{t("cd3.modal.corridor")}</span>
                    <span>{modal.corridor}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">CRS r</span>
                    <span className="font-mono text-rose-300">{modal.r}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">{t("common.reason")}</span>
                    <span className="text-right">{modal.reason}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">{t("cd3.modal.onchain")}</span>
                    <span className="font-mono text-xs">{modal.level === "R5" ? "MintGateway.pause()" : `MintGateway.blockActor(${modal.target})`}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{t("cd3.modal.body")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button ref={okRef} variant="danger" className="flex-1" icon={<GaugeIcon className="h-4 w-4" />} onClick={() => onDecide(modal.id, true)}>
                    {t("cd3.m3.approve")}
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => onDecide(modal.id, false)}>
                    {t("cd3.m3.reject")}
                  </Button>
                  <Button variant="outline" onClick={() => onLater(modal.id)}>
                    {t("cd3.modal.later")}
                  </Button>
                </div>
                <div className="text-[10px] text-slate-500">{t("cd3.modal.keys")}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
