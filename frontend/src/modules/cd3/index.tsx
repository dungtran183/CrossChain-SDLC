// CĐ3 · CrossSentry — giám sát cầu nối sau triển khai: M1 sự kiện & ECA → M2 DS + CRS → M3 R0–R5 + G-surv.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Gauge as GaugeIcon, Pause, Play, RotateCcw, ShieldAlert, SkipForward, Siren, Workflow, Scale } from "lucide-react";
import { createClient, MODE, type Client } from "../../lib/api";
import { useAction } from "../../lib/useAsync";
import { useTour, type TourStep } from "../../lib/tour";
import { ACCENTS, CHART } from "../../lib/theme";
import { useT } from "../../i18n/useT";
import ModuleHeader from "../../components/ModuleHeader";
import GlassCard from "../../components/GlassCard";
import Button from "../../components/Button";
import Tabs from "../../components/Tabs";
import ThesisResultsCard from "../../components/ThesisResultsCard";
import TourBar, { TourButton } from "../../components/TourBar";
import AnimatedNumber from "../../components/fx/AnimatedNumber";
import Shake from "../../components/fx/Shake";
import { ErrorBanner, Empty, Skeleton } from "../../components/States";
import { useToast } from "../../components/Toast";
import Lanes from "./Lanes";
import Heatmap from "./Heatmap";
import MassBars from "./MassBars";
import ActorGraph from "./ActorGraph";
import ResponsePanel from "./ResponsePanel";
import { CORRIDOR_COLORS, RISK_COLOR, type Approval, type Cd3State, type StepRes, type TuneRes } from "./types";

const A = ACCENTS.cd3;
const REPLAY_FILES = ["normal", "slow_burn", "collusion"];
const ALL_SCENARIOS = ["normal", "replay", "delayed", "collusion", "slow_burn", "boosting"];
const SPEEDS = [1500, 900, 450];
type TabId = "m1" | "m2" | "m3";

export default function Cd3Page() {
  const { t } = useT();
  const toast = useToast();
  const [file, setFile] = useState("slow_burn");
  const api: Client = useMemo(() => createClient("cd3", MODE === "replay" ? file : "live", 220), [file]);
  const { busy, error, run, setError } = useAction();
  const [st, setSt] = useState<Cd3State | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<TabId>("m2");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [selEv, setSelEv] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [modal, setModal] = useState<Approval | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [tune, setTune] = useState<TuneRes | null>(null);
  const [w, setW] = useState({ w_d: 1, w_g: 0.5, w_c: 0.3 });
  const [alarm, setAlarm] = useState(0);
  const stRef = useRef<Cd3State | null>(null);
  stRef.current = st;

  const absorb = useCallback(
    (s: Cd3State) => {
      const prev = stRef.current;
      if (MODE === "replay" && prev && s.tick < prev.tick) {
        // hết bản ghi → dừng thay vì quay về đầu
        setPlaying(false);
        toast({ kind: "info", title: t("cd3.replayEnd") });
        return false;
      }
      setSt(s);
      const fresh = s.queue.find((q) => q.status === "pending" && !seen.has(q.id));
      if (fresh) {
        setModal(fresh);
        setPlaying(false); // con người trong vòng lặp: tạm dừng khi cần phê duyệt
        setAlarm((a) => a + 1);
      }
      return true;
    },
    [seen, t, toast],
  );

  useEffect(() => {
    run("load", async () => {
      setSt(null);
      setSeen(new Set());
      setTune(null);
      if (MODE === "replay") await api.post<StepRes>("/api/cd3/reset");
      setSt(await api.get<Cd3State>("/api/cd3/state"));
    });
  }, [api, run]);

  const tick = useCallback(() => run("tick", async () => absorb((await api.post<StepRes>("/api/cd3/tick?n=1")).state)), [api, run, absorb]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => tick(), SPEEDS[speed]);
    return () => clearInterval(id);
  }, [playing, speed, tick]);

  const startScenario = (sc: string) =>
    run("start", async () => {
      if (MODE === "replay") {
        if (REPLAY_FILES.includes(sc)) setFile(sc);
        return;
      }
      absorb((await api.post<StepRes>(`/api/cd3/start?scenario=${sc}`)).state);
      toast({ kind: "info", title: `${t("cd3.scenario")}: ${t(`cd3.sc.${sc}`)}` });
    });

  const reset = () =>
    run("reset", async () => {
      setPlaying(false);
      setSeen(new Set());
      setTune(null);
      setSt((await api.post<StepRes>("/api/cd3/reset")).state);
    });

  const decide = (id: number, ok: boolean) =>
    run(`d${id}`, async () => {
      setSeen((s) => new Set(s).add(id));
      setModal(null);
      const r = await api.post<StepRes>(`/api/cd3/${ok ? "approve" : "reject"}/${id}`);
      absorb(r.state);
      const tx = r.txs?.[0];
      if (ok && tx) toast({ kind: tx.status === 1 ? "success" : "error", title: t("cd3.toast.executed"), body: `${tx.fn} · chain-B #${tx.block}` });
    });

  const runTune = (ww = w) => run("tune", async () => setTune(await api.post<TuneRes>("/api/cd3/tune", ww)));

  // ------------------------------------------------------------ trình chiếu
  const ref = useRef({ tick, startScenario, decide, setTab, setPlaying, runTune, setW, setFile, reset });
  ref.current = { tick, startScenario, decide, setTab, setPlaying, runTune, setW, setFile, reset };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const ticks = async (n: number, gap = 650) => {
    for (let i = 0; i < n; i++) {
      await ref.current.tick();
      await sleep(gap);
    }
  };
  const approvePending = async (level: string, target?: string) => {
    for (let i = 0; i < 12; i++) {
      const q = stRef.current?.queue.find((x) => x.status === "pending" && x.level === level && (!target || x.target === target));
      if (q) {
        await sleep(1200);
        await ref.current.decide(q.id, true);
        return;
      }
      await ref.current.tick();
      await sleep(600);
    }
  };
  const steps = useMemo<TourStep[]>(
    () => [
      { caption: "cd3.tour.s0", run: async () => (MODE === "replay" ? ref.current.setFile("slow_burn") : await ref.current.reset(), ref.current.setTab("m1")), hold: 2500 },
      { caption: "cd3.tour.s1", run: () => ticks(MODE === "replay" ? 10 : 8), hold: 1500 },
      { caption: "cd3.tour.s2", run: async () => (await ref.current.startScenario("slow_burn"), ref.current.setTab("m2"), await ticks(2)), hold: 2500 },
      { caption: "cd3.tour.s3", run: () => approvePending("R4", "V7"), hold: 3500 },
      { caption: "cd3.tour.s4", run: async () => (ref.current.setTab("m1"), await ticks(3)), hold: 3000 },
      { caption: "cd3.tour.s5", run: async () => (MODE === "replay" ? (ref.current.setFile("collusion"), await sleep(1500), await ticks(10, 350)) : await ref.current.startScenario("collusion"), ref.current.setTab("m3"), await ticks(2)), hold: 2000 },
      { caption: "cd3.tour.s6", run: () => approvePending("R5"), hold: 3500 },
      { caption: "cd3.tour.s7", run: async () => (ref.current.setTab("m3"), ref.current.setW({ w_d: 1, w_g: 0, w_c: 0.3 }), await ref.current.runTune({ w_d: 1, w_g: 0, w_c: 0.3 }), await sleep(2500), ref.current.setW({ w_d: 1, w_g: 1, w_c: 0.3 }), await ref.current.runTune({ w_d: 1, w_g: 1, w_c: 0.3 })), hold: 4000 },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const tour = useTour(steps);

  // ------------------------------------------------------------- hiển thị
  const series = st?.series ?? [];
  const sel = series.find((s) => s.key === selKey) ?? series[0];
  const chartData = sel ? sel.r.map((r, i) => ({ tick: sel.start + i, r, trad: sel.trad[i] })) : [];
  const ev = st?.evidence.find((e) => e.id === selEv) ?? [...(st?.evidence ?? [])].reverse().find((e) => e.rules.length) ?? st?.evidence[st.evidence.length - 1];
  const supplyOk = st ? st.supply.minted <= st.supply.locked : true;
  const pendingCount = st?.queue.filter((q) => q.status === "pending").length ?? 0;
  const scenarios = MODE === "replay" ? REPLAY_FILES : ALL_SCENARIOS;
  const currentSc = MODE === "replay" ? file : st?.scenario;

  return (
    <div className="space-y-6">
      <ModuleHeader
        ns="cd3"
        accent={A.grad}
        glyph="CS"
        actions={
          <>
            <TourButton tour={tour} accent={A.grad} />
            <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={reset} loading={busy === "reset"}>
              {t("common.reset")}
            </Button>
          </>
        }
      />
      <ErrorBanner error={error} onClose={() => setError(null)} />

      {/* thanh điều khiển */}
      <GlassCard accent={A.grad} bodyClassName="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label mr-1">{t("cd3.scenario")}</span>
            {scenarios.map((sc) => (
              <button
                key={sc}
                onClick={() => startScenario(sc)}
                className={`relative rounded-full border px-3 py-1 text-xs transition ${currentSc === sc ? "border-transparent text-ink-950" : "border-white/10 text-slate-300 hover:border-white/30"}`}
              >
                {currentSc === sc && <motion.span layoutId="cd3-sc" className={`absolute inset-0 rounded-full bg-gradient-to-r ${A.grad}`} />}
                <span className="relative">{t(`cd3.sc.${sc}`)}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button accent={A.grad} icon={playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} onClick={() => setPlaying((p) => !p)}>
              {playing ? t("cd3.pause") : t("cd3.play")}
            </Button>
            <Button variant="ghost" icon={<SkipForward className="h-4 w-4" />} onClick={() => tick()} loading={busy === "tick" && !playing}>
              {t("cd3.step")}
            </Button>
            <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
              {["1×", "2×", "4×"].map((l, i) => (
                <button key={l} onClick={() => setSpeed(i)} className={`rounded-md px-2 py-1 ${speed === i ? "bg-white/15 text-white" : "text-slate-400"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        {MODE === "replay" && <p className="text-[11px] text-sky-300/70">{t("cd3.replayNote")}</p>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { k: "tick", v: <AnimatedNumber value={st?.tick ?? 0} />, c: "text-white" },
            { k: t("cd3.kpi.locked"), v: <AnimatedNumber value={st?.supply.locked ?? 0} />, c: "text-amber-200" },
            { k: t("cd3.kpi.minted"), v: <AnimatedNumber value={st?.supply.minted ?? 0} />, c: supplyOk ? "text-emerald-200" : "text-rose-300" },
            { k: t("cd3.kpi.pending"), v: pendingCount, c: pendingCount ? "text-rose-300" : "text-slate-300" },
            { k: t("cd3.kpi.bridge"), v: st?.paused ? `⏸ ${t("cd3.kpi.paused")}` : `● ${t("cd3.kpi.running")}`, c: st?.paused ? "text-rose-300" : "text-emerald-300" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-white/10 bg-ink-950/40 px-3 py-2">
              <div className={`text-xl font-bold tabular-nums ${x.c}`}>{x.v}</div>
              <div className="text-[11px] text-slate-400">{x.k}</div>
            </div>
          ))}
        </div>
        {!supplyOk && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
            ⚠ {t("cd3.kpi.invariant")}
          </motion.div>
        )}
        {st ? <Lanes lanes={st.lanes} hover={hover} setHover={setHover} /> : <Skeleton className="h-28" />}
      </GlassCard>

      <Shake trigger={alarm || undefined} tone={alarm ? "danger" : null}>
        <GlassCard accent={A.grad}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              tabs={[
                { id: "m1", label: t("cd3.tabs.m1"), icon: <Workflow className="h-4 w-4" /> },
                { id: "m2", label: t("cd3.tabs.m2"), icon: <Activity className="h-4 w-4" /> },
                { id: "m3", label: t("cd3.tabs.m3"), icon: <Scale className="h-4 w-4" /> },
              ]}
              value={tab}
              onChange={(v) => setTab(v as TabId)}
              accent={A.grad}
            />
          </div>
          {!st ? (
            <Skeleton className="h-96" />
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {tab === "m1" && (
                <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                  <ActorGraph graph={st.graph} executed={st.executed} />
                  <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-ink-900 text-slate-400">
                        <tr>
                          {["t", t("cd3.ev.kind"), t("cd3.ev.actors"), "p̂", "κ_L", "κ_P", t("cd3.ev.rules"), "Bel"].map((h) => (
                            <th key={h} className="px-2 py-1.5 text-left font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...st.evidence].reverse().map((e) => (
                          <tr
                            key={e.id}
                            onClick={() => (setSelEv(e.id), setTab("m2"))}
                            onMouseEnter={() => setHover(e.msgId)}
                            onMouseLeave={() => setHover(null)}
                            className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${e.rules.length ? "bg-rose-500/[0.07]" : ""}`}
                          >
                            <td className="px-2 py-1 font-mono text-slate-500">{e.tick}</td>
                            <td className="px-2 py-1">
                              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: CORRIDOR_COLORS[e.corridor] }} />
                              {e.kind}
                            </td>
                            <td className="px-2 py-1 font-mono text-slate-300">{e.attributed.map(([a]) => a).slice(0, 4).join(",")}</td>
                            <td className="px-2 py-1 font-mono">{e.p_hat.toFixed(2)}</td>
                            <td className="px-2 py-1 font-mono">{e.kappa_L.toFixed(2)}</td>
                            <td className="px-2 py-1 font-mono">{e.kappa_P.toFixed(2)}</td>
                            <td className="px-2 py-1 text-rose-200">{e.rules.join(", ") || "—"}</td>
                            <td className="px-2 py-1 font-mono font-bold" style={{ color: RISK_COLOR(e.bel) }}>
                              {e.bel.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {tab === "m2" && (
                <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="label mb-2">
                        {t("cd3.m2.ds")} {ev && <span className="font-mono normal-case text-slate-500">· #{ev.id} t{ev.tick} {ev.kind}</span>}
                      </div>
                      {ev ? <MassBars e={ev} /> : <Empty>{t("cd3.m2.noEv")}</Empty>}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="label mb-1">{t("cd3.m2.heatmap")}</div>
                      <Heatmap actors={st.risk.actors} corridors={st.risk.corridors} matrix={st.risk.matrix} selected={sel?.key ?? null} onSelect={setSelKey} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {series.map((s) => (
                        <button key={s.key} onClick={() => setSelKey(s.key)} className={`chip ${sel?.key === s.key ? "border-amber-300/70 text-amber-100" : ""}`}>
                          <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLOR(s.r[s.r.length - 1] ?? 0) }} />
                          {s.key}
                        </button>
                      ))}
                    </div>
                    <div className="h-72 rounded-xl border border-white/10 bg-ink-950/60 p-2">
                      {sel ? (
                        <ResponsiveContainer>
                          <LineChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke={CHART.grid} />
                            <XAxis dataKey="tick" stroke={CHART.axis} />
                            <YAxis domain={[0, 1]} stroke={CHART.axis} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <ReferenceLine y={0.75} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "R4", fill: "#f43f5e", fontSize: 10, position: "right" }} />
                            <ReferenceLine y={0.4} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: "R2", fill: "#fbbf24", fontSize: 10, position: "right" }} />
                            {sel.crs_detect && <ReferenceLine x={sel.crs_detect} stroke="#f59e0b" />}
                            {sel.trad_detect && <ReferenceLine x={sel.trad_detect} stroke="#64748b" />}
                            <Line type="monotone" dataKey="r" name={`CRS r(t) · ${sel.key}`} stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="trad" name={t("cd3.m2.trad")} stroke="#94a3b8" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Empty>{t("cd3.m2.noSeries")}</Empty>
                      )}
                    </div>
                    {sel && (
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-amber-400/10 p-2">
                          <div className="text-lg font-bold text-amber-200">{sel.crs_detect ? `t${sel.crs_detect}` : "—"}</div>
                          {t("cd3.m2.crsDetect")}
                        </div>
                        <div className="rounded-xl bg-white/5 p-2">
                          <div className="text-lg font-bold text-slate-300">{sel.trad_detect ? `t${sel.trad_detect}` : t("cd3.m2.notYet")}</div>
                          {t("cd3.m2.tradDetect")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {tab === "m3" && <ResponsePanel st={st} decide={decide} busy={busy} tune={tune} w={w} setW={setW} runTune={() => runTune()} />}
            </motion.div>
          )}
        </GlassCard>
      </Shake>

      <ThesisResultsCard
        source={t("cd3.thesis.source")}
        items={[
          { label: "macro-F1", value: "0,812 ± 0,011" },
          { label: "FPR", value: "0,013" },
          { label: t("cd3.thesis.ttd"), value: "293 → 21,3 (−92,7%)" },
          { label: t("cd3.thesis.scale"), value: "F1 0,91 · Gini 0,32" },
        ]}
      />

      {/* hộp thoại phê duyệt R4/R5 */}
      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="glass w-full max-w-md overflow-hidden border-rose-500/40 bg-ink-900/95">
              <div className="h-1 w-full animate-gradient-x bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 bg-[length:200%_auto]" />
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/20">
                    <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-rose-500/40" />
                    {modal.level === "R5" ? <Siren className="h-6 w-6 text-rose-300" /> : <ShieldAlert className="h-6 w-6 text-rose-300" />}
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-rose-300">{t("cd3.modal.title")}</div>
                    <div className="text-lg font-bold">
                      {modal.level} · {t(`cd3.level.${modal.level}`)} — {modal.target}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 rounded-xl bg-ink-950/60 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t("cd3.modal.corridor")}</span>
                    <span>{modal.corridor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CRS r</span>
                    <span className="font-mono text-rose-300">{modal.r}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t("common.reason")}</span>
                    <span>{modal.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t("cd3.modal.onchain")}</span>
                    <span className="font-mono text-xs">{modal.level === "R5" ? "MintGateway.pause()" : `MintGateway.blockActor(${modal.target})`}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{t("cd3.modal.body")}</p>
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1" icon={<GaugeIcon className="h-4 w-4" />} onClick={() => decide(modal.id, true)}>
                    {t("cd3.m3.approve")}
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => decide(modal.id, false)}>
                    {t("cd3.m3.reject")}
                  </Button>
                  <Button variant="outline" onClick={() => (setSeen((s) => new Set(s).add(modal.id)), setModal(null))}>
                    {t("cd3.modal.later")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <TourBar tour={tour} accent={A.grad} />
    </div>
  );
}
