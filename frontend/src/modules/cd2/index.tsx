// CĐ2 · CrossGuard — kiểm toán hợp đồng cầu nối trước triển khai: M1 → M2 → M3 → M4 + Exploit lab.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Boxes, Bug, Brain, FileCode2, FileText, Network, RotateCcw, Shield, ShieldCheck, Users } from "lucide-react";
import { createClient } from "../../lib/api";
import { useAction } from "../../lib/useAsync";
import { useTour, type TourStep } from "../../lib/tour";
import { ACCENTS } from "../../lib/theme";
import { useT } from "../../i18n/useT";
import { useToast } from "../../components/Toast";
import { complete } from "../../lib/progress";
import ModuleHeader from "../../components/ModuleHeader";
import GlassCard from "../../components/GlassCard";
import Button from "../../components/Button";
import Tabs from "../../components/Tabs";
import ThesisResultsCard from "../../components/ThesisResultsCard";
import TourBar, { TourButton } from "../../components/TourBar";
import { ErrorBanner, Skeleton } from "../../components/States";
import CodeViewer from "./CodeViewer";
import M1Panel from "./M1Panel";
import M2Panel from "./M2Panel";
import M3Panel from "./M3Panel";
import M4Panel from "./M4Panel";
import ExploitLab from "./ExploitLab";
import { CLS_COLORS, type EmbeddingRes, type ExploitRes, type M1Res, type M2Res, type M3Res, type M4Res, type SampleDetail, type SamplesRes } from "./types";

const A = ACCENTS.cd2;
type TabId = "m1" | "m2" | "m3" | "m4" | "ex";

export default function Cd2Page() {
  const { t, lang } = useT();
  const toast = useToast();
  const api = useMemo(() => createClient("cd2", "audit-flow"), []);
  const { busy, error, run, setError } = useAction();
  // Phân tích mẫu chạy độc lập với các hành động khác (khóa riêng).
  const analysis = useAction();
  const [list, setList] = useState<SamplesRes | null>(null);
  const [sel, setSel] = useState("Cd2VulnBridgeNoNonce");
  const [detail, setDetail] = useState<SampleDetail | null>(null);
  const [m1, setM1] = useState<M1Res | null>(null);
  const [k, setK] = useState<1 | 5>(5);
  const [m2, setM2] = useState<M2Res | null>(null);
  const [emb, setEmb] = useState<EmbeddingRes | null>(null);
  const [m3, setM3] = useState<M3Res | null>(null);
  const [eps, setEps] = useState(1);
  const [alpha, setAlpha] = useState(1);
  const [m4, setM4] = useState<M4Res | null>(null);
  const [ex, setEx] = useState<ExploitRes | null>(null);
  const [params] = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => (["m1", "m2", "m3", "m4", "ex"].includes(params.get("tab") ?? "") ? (params.get("tab") as TabId) : "m1"));

  const catLabel = useCallback((c: string) => list?.categories[c]?.[lang] ?? c, [list, lang]);

  useEffect(() => {
    run("list", async () => setList(await api.get<SamplesRes>("/api/cd2/samples")));
  }, [api, run]);

  const analyze = useCallback(
    (sid: string, kk: 1 | 5, afterExploit = false) =>
      analysis.run("analyze", async () => {
        const [d, a1, c, e, r] = await Promise.all([
          api.get<SampleDetail>(`/api/cd2/samples/${sid}`),
          api.post<M1Res>("/api/cd2/m1/analyze", { sample_id: sid }),
          api.post<M2Res>(`/api/cd2/m2/classify?k=${kk}`, { sample_id: sid }),
          api.get<EmbeddingRes>(`/api/cd2/m2/embedding?k=${kk}`),
          api.post<M4Res>("/api/cd2/m4/report?k=5", afterExploit ? { sample_id: sid, after_exploit: true } : { sample_id: sid }),
        ]);
        setDetail(d);
        setM1(a1);
        setM2(c);
        setEmb(e);
        setM4(r);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, analysis.run],
  );

  useEffect(() => {
    analyze(sel, k);
  }, [sel, k, analyze]);

  useEffect(() => {
    if (tab === "m1" && m1) complete("cd2", "m1");
    if (tab === "m2" && m2) complete("cd2", "m2");
    if (tab === "m4" && m4) complete("cd2", "m4");
  }, [tab, m1, m2, m4]);

  const runFl = (e = eps, a = alpha) => run("m3", async () => (setM3(await api.post<M3Res>("/api/cd2/m3/run", { rounds: 10, epsilon: e, alpha: a })), complete("cd2", "m3")));

  const runExploit = (target: "vuln" | "safe", sid = sel) =>
    run(`ex-${target}`, async () => {
      const r = await api.post<ExploitRes>(`/api/cd2/exploit/run?target=${target}&sample=${sid}`);
      setEx(r);
      toast({ anchor: "cd2-tabs", kind: r.exploited ? "error" : "success", title: r.exploited ? t("cd2.ex.exploited") : t("cd2.ex.blocked"), body: `${r.sample_id.slice(3)} · ${t(`cd2.ex.attack.${r.attack}`)}` });
      if (r.target === "vuln" && r.exploited) complete("cd2", "exploit");
      if (r.target === "safe" && !r.exploited) complete("cd2", "fixed");
      if (target === "safe") setM4(await api.post<M4Res>("/api/cd2/m4/report?k=5", { sample_id: sid, after_exploit: true }));
    });

  const reset = () =>
    run("reset", async () => {
      await api.post("/api/cd2/reset");
      setEx(null);
      setM3(null);
      setSel("Cd2VulnBridgeNoNonce");
      setTab("m1");
    });

  // ------------------------------------------------------------ trình chiếu
  const ref = useRef({ setSel, setTab, setK, runFl, runExploit, setEps, setAlpha });
  ref.current = { setSel, setTab, setK, runFl, runExploit, setEps, setAlpha };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const steps = useMemo<TourStep[]>(
    () => [
      { caption: "cd2.tour.s0", focus: "cd2-code", run: () => (ref.current.setSel("Cd2VulnBridgeNoNonce"), ref.current.setTab("m1")), hold: 3200 },
      { caption: "cd2.tour.s1", focus: "cd2-tabs", run: () => ref.current.setTab("m1"), hold: 3800 },
      { caption: "cd2.tour.s2", focus: "cd2-tabs", run: async () => (ref.current.setTab("m2"), ref.current.setK(1), await wait(1800), ref.current.setK(5)), hold: 3800 },
      { caption: "cd2.tour.s3", focus: "cd2-tabs", run: () => (ref.current.setTab("m3"), ref.current.setEps(1), ref.current.setAlpha(1), ref.current.runFl(1, 1)), hold: 5200 },
      { caption: "cd2.tour.s4", focus: "cd2-tabs", run: () => ref.current.setTab("m4"), hold: 4200 },
      { caption: "cd2.tour.s5", focus: "cd2-tabs", run: () => (ref.current.setTab("ex"), ref.current.runExploit("vuln", "Cd2VulnBridgeNoNonce")), hold: 5200 },
      { caption: "cd2.tour.s6", focus: "cd2-tabs", run: () => ref.current.runExploit("safe", "Cd2VulnBridgeNoNonce"), hold: 5200 },
      { caption: "cd2.tour.s7", focus: "cd2-tabs", run: () => ref.current.setTab("m4"), hold: 3600 },
    ],
    [],
  );
  const tour = useTour(steps);

  const current = list?.samples.find((s) => s.id === sel);
  const tabs = [
    { id: "m1", label: "M1", icon: <Network className="h-4 w-4" /> },
    { id: "m2", label: "M2", icon: <Brain className="h-4 w-4" /> },
    { id: "m3", label: "M3", icon: <Users className="h-4 w-4" /> },
    { id: "m4", label: "M4", icon: <FileText className="h-4 w-4" /> },
    { id: "ex", label: t("cd2.tabs.ex"), icon: <Bug className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        ns="cd2"
        accent={A.grad}
        glyph="CG"
        actions={
          <>
            <TourButton tour={tour} accent={A.grad} />
            <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={reset} loading={busy === "reset"}>
              {t("common.reset")}
            </Button>
          </>
        }
      />
      <ErrorBanner error={error ?? analysis.error} onClose={() => (setError(null), analysis.setError(null))} />

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <GlassCard title={t("cd2.samples")} icon={<Boxes className="h-4 w-4" />} accent={A.grad}>
          <div className="space-y-1.5">
            {!list && [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
            {list?.samples.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSel(s.id)}
                className={`relative w-full rounded-xl border px-3 py-2 text-left transition ${sel === s.id ? "border-violet-400/60 bg-violet-500/15" : "border-white/5 bg-white/[0.02] hover:border-white/20"}`}
              >
                {sel === s.id && <motion.span layoutId="cd2-sel" className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-violet-400 to-indigo-500" />}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {s.vulnerable ? <Bug className="h-3.5 w-3.5 text-rose-300" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />}
                  {s.title}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: CLS_COLORS[s.category] }} />
                  {s.category_label[lang]}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">{s.bug[lang]}</div>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          id="cd2-code"
          title={
            <span className="flex items-center gap-2">
              {detail?.title ?? "…"} <span className="font-mono text-xs text-slate-500">.sol</span>
            </span>
          }
          icon={<FileCode2 className="h-4 w-4" />}
          accent={A.grad}
          actions={
            m4 && (
              <span className={`chip ${m4.risk_tier === "high" ? "border-rose-400/50 text-rose-200" : m4.risk_tier === "medium" ? "border-amber-400/50 text-amber-200" : "border-emerald-400/50 text-emerald-200"}`}>
                <Shield className="h-3 w-3" /> {t(`cd2.m4.tier.${m4.risk_tier}`)} · p={m4.p_vuln.toFixed(2)}
              </span>
            )
          }
        >
          {detail ? <CodeViewer source={detail.source} risky={detail.bug_lines} maxHeight={480} /> : <Skeleton className="h-80" />}
        </GlassCard>
      </div>

      <GlassCard id="cd2-tabs" accent={A.grad}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={tabs} value={tab} onChange={(v) => setTab(v as TabId)} accent={A.grad} />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{t(`cd2.tabs.desc.${tab}`)}</span>
          </div>
        </div>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === "m1" && (m1 ? <M1Panel m1={m1} /> : <Skeleton className="h-96" />)}
          {tab === "m2" && (m2 && emb ? <M2Panel m2={m2} emb={emb} k={k} setK={setK} catLabel={catLabel} /> : <Skeleton className="h-96" />)}
          {tab === "m3" && <M3Panel res={m3} eps={eps} alpha={alpha} setEps={setEps} setAlpha={setAlpha} run={() => runFl()} busy={busy === "m3"} accent={A.grad} />}
          {tab === "m4" && (m4 ? <M4Panel r={m4} catLabel={catLabel} /> : <Skeleton className="h-96" />)}
          {tab === "ex" && <ExploitLab res={ex} run={(tg) => runExploit(tg)} busy={busy} vulnerable={!!current?.vulnerable} title={current?.title ?? ""} />}
        </motion.div>
      </GlassCard>

      <ThesisResultsCard
        source={t("cd2.thesis.source")}
        items={[
          { label: t("cd2.thesis.f1"), value: "86,17%" },
          { label: "PR-AUC", value: "0,88" },
          { label: t("cd2.thesis.fewshot"), value: "0,71 → 0,88" },
          { label: t("cd2.thesis.fl"), value: "86,7% @ ε = 1,0" },
          { label: t("cd2.thesis.scale"), value: "F1 82,1%" },
        ]}
      />
      <TourBar tour={tour} accent={A.grad} />
    </div>
  );
}
