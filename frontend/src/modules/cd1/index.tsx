// CĐ1 · Π_univ — văn bằng số liên chuỗi: Merkle + ZKP vị từ + ủy ban ngưỡng t-of-n + CP-ABE.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  FileKey2,
  GraduationCap,
  KeyRound,
  Play,
  RotateCcw,
  ShieldX,
  Skull,
  Timer,
  Users,
} from "lucide-react";
import { createClient, MODE } from "../../lib/api";
import { useAction } from "../../lib/useAsync";
import { useTour, type TourStep } from "../../lib/tour";
import { ACCENTS } from "../../lib/theme";
import { short, type TxSummary } from "../../lib/types";
import { useT } from "../../i18n/useT";
import ModuleHeader from "../../components/ModuleHeader";
import GlassCard from "../../components/GlassCard";
import Button from "../../components/Button";
import Stepper, { type StepState } from "../../components/Stepper";
import ChainPanel from "../../components/ChainPanel";
import ThesisResultsCard from "../../components/ThesisResultsCard";
import TourBar, { TourButton } from "../../components/TourBar";
import FlowBeam from "../../components/fx/FlowBeam";
import Shake from "../../components/fx/Shake";
import Burst from "../../components/fx/Burst";
import ScrambleText from "../../components/fx/ScrambleText";
import { ErrorBanner, Empty } from "../../components/States";
import { useToast } from "../../components/Toast";
import CommitteeRing from "./CommitteeRing";
import MerkleView from "./MerkleView";
import StatementWitness from "./StatementWitness";
import ShamirPanel from "./ShamirPanel";
import Charts from "./Charts";
import type { AbeRes, Cd1State, IssueRes, ProveRes, RevokeRes, SetupRes, Timeline, VerifyRes } from "./types";

const A = ACCENTS.cd1;
const STEP_KEYS = ["setup", "issue", "prove", "verify", "revoke"] as const;
const TAMPERS = ["below_threshold", "signature", "duplicate", "proof", "context", "swap", "replay"] as const;

type Pred = { attr: "gpa" | "degree" | "major" | "year"; op: ">=" | "=="; value: number | string };
const GPA = (v: number): Pred => ({ attr: "gpa", op: ">=", value: v });
const EQ = (attr: Pred["attr"], v: string): Pred => ({ attr, op: "==", value: v });
/** Kịch bản chứng minh có sẵn (đều có trong bản ghi replay). */
const PRESETS: { id: string; sid: string; preds: Pred[] }[] = [
  { id: "s3", sid: "S3", preds: [GPA(3.2)] },
  { id: "s2", sid: "S2", preds: [GPA(3.2)] },
  { id: "s4", sid: "S4", preds: [EQ("degree", "Master")] },
  { id: "s1", sid: "S1", preds: [EQ("degree", "Master")] },
  { id: "s5", sid: "S5", preds: [GPA(3.8), EQ("major", "Software Engineering")] },
];
const ABE_PRESETS: Record<string, string>[] = [{ role: "HR", org: "ACME" }, { role: "Sales", org: "ACME" }, { role: "Auditor" }];

export default function Cd1Page() {
  const { t, tl } = useT();
  const toast = useToast();
  const api = useMemo(() => createClient("cd1", "credential-flow"), []);
  const { busy, error, run, setError } = useAction();

  const [state, setState] = useState<Cd1State | null>(null);
  const [txs, setTxs] = useState<TxSummary[]>([]);
  const [issue, setIssue] = useState<IssueRes | null>(null);
  const [prove, setProve] = useState<ProveRes | null>(null);
  const [verify, setVerify] = useState<VerifyRes | null>(null);
  const [attempts, setAttempts] = useState<VerifyRes[]>([]);
  const [abe, setAbe] = useState<AbeRes[]>([]);
  const [timeline, setTimeline] = useState<Timeline["phases"]>([]);
  const [preset, setPreset] = useState("s3");
  const [student, setStudent] = useState("S3");
  const [thr, setThr] = useState(3.2);
  const [discAttr, setDiscAttr] = useState<"none" | "degree" | "major" | "year">("none");
  const [discValue, setDiscValue] = useState("");
  const request = (): { sid: string; preds: Pred[] } => {
    const p = PRESETS.find((x) => x.id === preset);
    if (p) return { sid: p.sid, preds: p.preds };
    const preds: Pred[] = [GPA(thr)];
    if (discAttr !== "none") preds.push(EQ(discAttr, discValue));
    return { sid: student, preds };
  };
  const [beamAB, setBeamAB] = useState(0);
  const [beamIssue, setBeamIssue] = useState(0);
  const [flash, setFlash] = useState<{ k: number; tone: "danger" | "success" } | null>(null);

  const absorb = useCallback((r: { state?: Cd1State; txs?: TxSummary[] }) => {
    if (r.state) setState(r.state);
    if (r.txs?.length) setTxs((xs) => [...xs, ...r.txs!]);
  }, []);

  const refreshTimeline = useCallback(async () => {
    try {
      setTimeline((await api.get<Timeline>("/api/cd1/timeline")).phases);
    } catch {
      /* replay có thể chưa tới bước này */
    }
  }, [api]);

  useEffect(() => {
    run("load", async () => setState(await api.get<Cd1State>("/api/cd1/state")));
  }, [api, run]);

  // ------------------------------------------------------------- hành động
  const doReset = () =>
    run("reset", async () => {
      const r = await api.post<{ state: Cd1State }>("/api/cd1/reset");
      setState(r.state);
      setTxs([]);
      setIssue(null);
      setProve(null);
      setVerify(null);
      setAttempts([]);
      setAbe([]);
      setTimeline([]);
    });

  const doSetup = () =>
    run("setup", async () => {
      const r = await api.post<SetupRes>("/api/cd1/setup");
      absorb(r);
      setIssue(null);
      setProve(null);
      setVerify(null);
      setAttempts([]);
      toast({ kind: "success", title: t("cd1.toast.setup"), body: `ThresholdVerifier @ ${short(r.verifier, 4)}` });
    });

  const doIssue = () =>
    run("issue", async () => {
      const r = await api.post<IssueRes>("/api/cd1/issue");
      absorb(r);
      setIssue(r);
      setBeamIssue((x) => x + 1);
      toast({ kind: "success", title: t("cd1.toast.issue"), body: `root ${short(r.root, 6)}` });
    });

  const doProve = (req = request()) =>
    run("prove", async () => {
      const r = await api.post<ProveRes>("/api/cd1/prove", { student_id: req.sid, predicates: req.preds });
      absorb(r);
      setProve(r);
      setVerify(null);
    });

  const showVerify = (r: VerifyRes) => {
    absorb(r);
    setVerify(r);
    setAttempts((xs) => [r, ...xs].slice(0, 8));
    setBeamAB((x) => x + 1);
    setFlash({ k: Date.now(), tone: r.accepted ? "success" : "danger" });
    toast({ kind: r.accepted ? "success" : "error", title: r.accepted ? t("cd1.toast.accepted") : t("cd1.toast.rejected"), body: r.reason });
  };

  const doVerify = () =>
    run("verify", async () => {
      showVerify(await api.post<VerifyRes>("/api/cd1/verify"));
      await refreshTimeline();
    });

  const doTamper = (kind: (typeof TAMPERS)[number]) => run(`t-${kind}`, async () => showVerify(await api.post<VerifyRes>("/api/cd1/tamper", { kind })));

  const doRevoke = (sid = request().sid) =>
    run("revoke", async () => {
      const r = await api.post<RevokeRes>("/api/cd1/revoke", { student_id: sid });
      absorb(r);
      setBeamIssue((x) => x + 1);
      toast({ kind: "info", title: t("cd1.toast.revoked"), body: `${sid} · ${short(r.credential_hash, 6)}` });
    });

  const doAbe = (attrs: Record<string, string>) =>
    run("abe", async () => {
      const r = await api.post<AbeRes>("/api/cd1/abe", { attrs });
      setAbe((xs) => [r, ...xs.filter((x) => JSON.stringify(x.attrs) !== JSON.stringify(attrs))].slice(0, 4));
    });

  // ------------------------------------------------------------ trình chiếu
  const ref = useRef({ doReset, doSetup, doIssue, doProve, doVerify, doTamper, doRevoke, doAbe, setPreset });
  ref.current = { doReset, doSetup, doIssue, doProve, doVerify, doTamper, doRevoke, doAbe, setPreset };
  const steps = useMemo<TourStep[]>(
    () => [
      { caption: "cd1.tour.s0", run: () => ref.current.doReset(), hold: 2200 },
      { caption: "cd1.tour.s1", run: () => ref.current.doSetup() },
      { caption: "cd1.tour.s2", run: () => ref.current.doIssue(), hold: 3200 },
      { caption: "cd1.tour.s3", run: () => (ref.current.setPreset("s3"), ref.current.doProve(PRESETS[0])), hold: 3600 },
      { caption: "cd1.tour.s4", run: () => ref.current.doVerify(), hold: 3600 },
      { caption: "cd1.tour.s5", run: () => ref.current.doAbe({ role: "HR", org: "ACME" }), hold: 2800 },
      { caption: "cd1.tour.s6", run: () => ref.current.doTamper("below_threshold"), hold: 3200 },
      { caption: "cd1.tour.s7", run: () => ref.current.doTamper("signature"), hold: 2800 },
      { caption: "cd1.tour.s8", run: () => ref.current.doTamper("replay"), hold: 2800 },
      { caption: "cd1.tour.s9", run: () => ref.current.doRevoke("S3"), hold: 2400 },
      { caption: "cd1.tour.s10", run: async () => (await ref.current.doProve(PRESETS[0]), await ref.current.doVerify()), hold: 3800 },
      { caption: "cd1.tour.s11", hold: 3000 },
    ],
    [],
  );
  const tour = useTour(steps);

  // ------------------------------------------------------------- hiển thị
  const stepStates: StepState[] = STEP_KEYS.map((k) => {
    const s = state?.steps[k] ?? "todo";
    if (busy === k) return "active";
    return s === "done" ? "done" : s === "error" ? "error" : "todo";
  });
  const nextIdx = stepStates.findIndex((s) => s !== "done");
  if (nextIdx >= 0 && stepStates[nextIdx] === "todo" && !busy) stepStates[nextIdx] = "active";

  const signers = verify?.signers.map((s) => s.relay) ?? [];
  const chainTx = (c: string) => txs.filter((x) => x.chain === c);
  const lastProof = timeline.filter((p) => p.proof_bytes).slice(-1)[0]?.proof_bytes ?? prove?.proof_bytes ?? 0;
  const lastSig = timeline.filter((p) => p.sig_bytes && p.phase === "verify").slice(-1)[0]?.sig_bytes ?? 0;
  const lastAbe = timeline.filter((p) => p.abe_bytes).slice(-1)[0]?.abe_bytes ?? 0;
  const ready = state?.steps.setup === "done";
  const issued = state?.steps.issue === "done";
  const proved = !!prove;

  return (
    <div className="space-y-6">
      <ModuleHeader
        ns="cd1"
        accent={A.grad}
        glyph="Π"
        actions={
          <>
            <TourButton tour={tour} accent={A.grad} />
            <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={doReset} loading={busy === "reset"}>
              {t("common.reset")}
            </Button>
          </>
        }
      />
      <ErrorBanner error={error} onClose={() => setError(null)} />

      <GlassCard accent={A.grad}>
        <Stepper steps={tl("cd1.steps")} states={stepStates} accent={A.grad} />
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-white/5 pt-4">
          <Button accent={A.grad} icon={<Play className="h-4 w-4" />} onClick={doSetup} loading={busy === "setup"}>
            1 · {t("cd1.btn.setup")}
          </Button>
          <Button accent={A.grad} icon={<GraduationCap className="h-4 w-4" />} onClick={doIssue} loading={busy === "issue"} disabled={!ready}>
            2 · {t("cd1.btn.issue")}
          </Button>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pl-3">
            <label className="text-xs text-slate-400">
              {t("cd1.btn.scenario")}
              <select value={preset} onChange={(e) => setPreset(e.target.value)} className="ml-2 max-w-[340px] rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm text-slate-100">
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(`cd1.preset.${p.id}`)}
                  </option>
                ))}
                {MODE === "live" && <option value="custom">{t("cd1.preset.custom")}</option>}
              </select>
            </label>
            {preset === "custom" && (
              <>
                <select value={student} onChange={(e) => setStudent(e.target.value)} className="rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm text-slate-100">
                  {(state?.students ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} · {s.name}
                      {s.revoked ? " (revoked)" : ""}
                    </option>
                  ))}
                </select>
                <label className="text-xs text-slate-400">
                  GPA ≥
                  <input type="number" step={0.1} min={0} max={4} value={thr} onChange={(e) => setThr(Number(e.target.value))} className="ml-1 w-16 rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm text-slate-100" />
                </label>
                <select value={discAttr} onChange={(e) => setDiscAttr(e.target.value as typeof discAttr)} className="rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm text-slate-100">
                  <option value="none">{t("cd1.preset.noDisclose")}</option>
                  <option value="degree">degree =</option>
                  <option value="major">major =</option>
                  <option value="year">year =</option>
                </select>
                {discAttr !== "none" && (
                  <input value={discValue} onChange={(e) => setDiscValue(e.target.value)} placeholder="Master" className="w-36 rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm text-slate-100" />
                )}
              </>
            )}
            <Button accent={A.grad} icon={<FileKey2 className="h-4 w-4" />} onClick={() => doProve()} loading={busy === "prove"} disabled={!issued}>
              3 · {t("cd1.btn.prove")}
            </Button>
          </div>
          <Button accent={A.grad} icon={<BadgeCheck className="h-4 w-4" />} onClick={doVerify} loading={busy === "verify"} disabled={!proved}>
            4 · {t("cd1.btn.verify")}
          </Button>
          <Button variant="outline" icon={<ShieldX className="h-4 w-4" />} onClick={() => doRevoke()} loading={busy === "revoke"} disabled={!issued}>
            5 · {t("cd1.btn.revoke")} {request().sid}
          </Button>
        </div>
      </GlassCard>

      {/* Sân khấu 3 cột: Issuer · Committee · Verifier */}
      <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <GlassCard title={t("cd1.stage.issuer")} icon={<Building2 className="h-4 w-4" />} accent="from-cyan-400 to-sky-500">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(state?.students ?? []).map((s) => (
                <motion.span
                  key={s.id}
                  layout
                  className={`rounded-lg border px-2 py-1 text-[11px] ${
                    s.revoked ? "border-rose-400/50 bg-rose-500/10 text-rose-200 line-through" : s.issued ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 text-slate-400"
                  }`}
                  title={`${s.degree} · ${s.major}`}
                >
                  {s.id} · {s.name}
                </motion.span>
              ))}
            </div>
            {issue ? (
              <MerkleView tree={issue.tree} highlight={prove ? Number(prove.student_id.slice(1)) - 1 : null} />
            ) : (
              <Empty icon={<GraduationCap className="h-6 w-6" />}>{t("cd1.stage.noBatch")}</Empty>
            )}
            {state?.root && (
              <div className="rounded-lg bg-ink-950/60 p-2 text-[11px]">
                <span className="text-slate-400">{t("cd1.stage.anchored")} </span>
                <ScrambleText text={short(state.root, 10)} className="text-cyan-200" />
              </div>
            )}
          </div>
        </GlassCard>

        <div className="hidden items-center xl:flex">
          <FlowBeam d="M 0 50 C 15 50, 25 50, 40 50" viewBox="0 0 40 100" className="h-24 w-10" pulseKey={beamIssue} active={!!busy} color={A.hex} />
        </div>

        <GlassCard title={t("cd1.stage.committee")} icon={<Users className="h-4 w-4" />} accent={A.grad}>
          <CommitteeRing
            relays={state?.relays ?? []}
            threshold={state?.threshold ?? 3}
            checks={verify?.relay_checks ?? null}
            signers={signers}
            valid={verify?.valid_sigs ?? null}
            accepted={verify ? verify.accepted : null}
            pulse={beamAB}
          />
          {verify && verify.relay_checks.some((c) => !c.ok) && (
            <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-[11px] text-rose-200">{[...new Set(verify.relay_checks.flatMap((c) => c.reasons))].join(" · ")}</div>
          )}
        </GlassCard>

        <div className="hidden items-center xl:flex">
          <FlowBeam d="M 0 50 C 15 50, 25 50, 40 50" viewBox="0 0 40 100" className="h-24 w-10" pulseKey={beamAB} danger={verify ? !verify.accepted : false} color={A.hex} />
        </div>

        <Shake trigger={flash?.k} tone={flash?.tone ?? null}>
          <GlassCard title={t("cd1.stage.verifier")} icon={<BadgeCheck className="h-4 w-4" />} accent="from-teal-400 to-emerald-500" className="h-full">
            <div className="relative space-y-3">
              <Burst trigger={verify?.accepted ? flash?.k : undefined} />
              <AnimatePresence mode="wait">
                {verify ? (
                  <motion.div
                    key={verify.msg_hash + verify.kind}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl border p-4 text-center ${verify.accepted ? "border-emerald-400/50 bg-emerald-400/10" : "border-rose-500/50 bg-rose-500/10"}`}
                  >
                    <div className={`text-2xl font-extrabold ${verify.accepted ? "text-emerald-300" : "text-rose-300"}`}>
                      {verify.accepted ? `✓ ${t("common.accepted")}` : `✗ ${t("common.rejected")}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {t(`cd1.kind.${verify.kind}`)} · {verify.valid_sigs}/{verify.threshold} · <span className="font-mono">{verify.reason}</span>
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-slate-400">msgHash {short(verify.msg_hash, 8)}</div>
                  </motion.div>
                ) : (
                  <Empty icon={<BadgeCheck className="h-6 w-6" />}>{t("cd1.stage.waiting")}</Empty>
                )}
              </AnimatePresence>
              {verify?.abe && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-semibold">
                      <KeyRound className="h-3.5 w-3.5" /> CP-ABE
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">{verify.abe.policy_str}</div>
                  <div className="truncate font-mono text-[10px] text-slate-500">{verify.abe.preview}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ABE_PRESETS.map((p) => (
                      <button key={JSON.stringify(p)} className="chip hover:bg-white/10" onClick={() => doAbe(p)}>
                        {Object.entries(p)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    {abe.map((x) => (
                      <motion.div key={JSON.stringify(x.attrs)} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className={`rounded-lg px-2 py-1 text-[11px] ${x.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"}`}>
                        {x.ok ? "🔓" : "🔒"} {Object.values(x.attrs).join("/")} → {x.ok ? `${x.payload?.student} · ${x.payload?.predicate}` : x.reason}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </Shake>
      </div>

      {prove && (
        <GlassCard title={t("cd1.sw.title")} icon={<FileKey2 className="h-4 w-4" />} accent={A.grad} actions={<span className="chip">sigma-protocol · Fiat–Shamir</span>}>
          <StatementWitness data={prove} />
        </GlassCard>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <GlassCard title={t("cd1.tamper.title")} icon={<Skull className="h-4 w-4" />} accent="from-rose-500 to-orange-500">
          <p className="mb-3 text-sm text-slate-400">{t("cd1.tamper.body")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TAMPERS.map((k) => (
              <Button key={k} variant="danger" size="sm" onClick={() => doTamper(k)} loading={busy === `t-${k}`} disabled={!proved}>
                {t(`cd1.kind.${k}`)}
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-1.5">
            <AnimatePresence initial={false}>
              {attempts.map((a, i) => (
                <motion.div
                  key={`${a.msg_hash}-${a.kind}-${attempts.length - i}`}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs ${a.accepted ? "border-emerald-400/30 bg-emerald-400/5" : "border-rose-500/30 bg-rose-500/5"}`}
                >
                  <span className="font-semibold">{t(`cd1.kind.${a.kind}`)}</span>
                  <span className="font-mono text-slate-400">
                    {a.valid_sigs}/{a.threshold} · {a.txs?.[0] ? `#${a.txs[0].block}` : ""}
                  </span>
                  <span className={a.accepted ? "text-emerald-300" : "text-rose-300"}>{a.accepted ? "✓" : `✗ ${a.reason}`}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>

        <GlassCard title={t("cd1.chains")} icon={<Timer className="h-4 w-4" />} accent={A.grad}>
          <div className="space-y-3">
            <ChainPanel name={`chain-A · ${t("cd1.stage.issuerShort")}`} chainId={31337} txs={chainTx("chain-A")} color={A.hex} />
            <ChainPanel name={`chain-B · ${t("cd1.stage.verifierShort")}`} chainId={97} txs={chainTx("chain-B")} color="#2dd4bf" />
          </div>
        </GlassCard>
      </div>

      <GlassCard title={t("cd1.shamir.title")} icon={<KeyRound className="h-4 w-4" />} accent={A.grad} actions={<span className="chip">GF(65537)</span>}>
        <ShamirPanel api={api} />
      </GlassCard>

      <GlassCard title={t("common.measured")} icon={<Timer className="h-4 w-4" />} accent={A.grad}>
        {timeline.length ? (
          <Charts
            timeline={timeline}
            sizes={[
              { name: "ZKP proof", bytes: lastProof },
              { name: "t × ECDSA sig", bytes: lastSig },
              { name: "ABE ciphertext", bytes: lastAbe },
            ]}
          />
        ) : (
          <Empty>{t("cd1.charts.empty")}</Empty>
        )}
      </GlassCard>

      <ThesisResultsCard
        source={t("cd1.thesis.source")}
        items={[
          { label: t("cd1.thesis.latency"), value: "≈ 2,41 s" },
          { label: t("cd1.thesis.proof"), value: "175 B" },
          { label: t("cd1.thesis.sig"), value: "64 B" },
          { label: t("cd1.thesis.abe"), value: "846 B" },
          { label: t("cd1.thesis.tps"), value: "140 TPS" },
        ]}
      />
      <TourBar tour={tour} accent={A.grad} />
    </div>
  );
}
