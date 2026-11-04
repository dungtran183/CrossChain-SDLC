// CĐ3 · CrossSentry — giám sát cầu nối sau triển khai: M1 sự kiện & ECA → M2 DS + CRS → M3 R0–R5 + G-surv.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Pause, Play, RotateCcw, SkipForward, Workflow, Scale } from "lucide-react";
import { createClient, MODE, type Client } from "../../lib/api";
import { useAction } from "../../lib/useAsync";
import { useTour, type TourStep } from "../../lib/tour";
import { ACCENTS, CHART } from "../../lib/theme";
import { useT } from "../../i18n/useT";
import { complete } from "../../lib/progress";
import ModuleHeader from "../../components/ModuleHeader";
import Primer from "../../components/Primer";
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
import ApprovalModal from "./ApprovalModal";
import NarratorPanel, { fill } from "./NarratorPanel";
import { narrate, type Narr } from "./narrator";
import PaceControl from "../../components/PaceControl";
import { pacedSleep, usePace } from "../../lib/pace";
import { CORRIDOR_COLORS, RISK_COLOR, type Approval, type Cd3State, type StepRes, type TuneRes } from "./types";

const A = ACCENTS.cd3;
const ALL_SCENARIOS = ["normal", "slow_burn", "collusion", "replay", "delayed", "boosting", "oracle_skew", "flash_drain", "liveness"];
const REPLAY_FILES = ALL_SCENARIOS;
const TICK_MS = 2000; // 1× — chia theo nhịp độ chung (0.5× = 4 s/tick)
type TabId = "m1" | "m2" | "m3";

export default function Cd3Page() {
  const { t } = useT();
  const toast = useToast();
  const [file, setFile] = useState("slow_burn");
  const api: Client = useMemo(() => createClient("cd3", MODE === "replay" ? file : "live", 220), [file]);
  const { busy, error, run, setError } = useAction();
  const [st, setSt] = useState<Cd3State | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pace] = usePace();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => (["m1", "m2", "m3"].includes(params.get("tab") ?? "") ? (params.get("tab") as TabId) : "m2"));
  const [selKey, setSelKey] = useState<string | null>(null);
  const [selEv, setSelEv] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [modal, setModal] = useState<Approval | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [tune, setTune] = useState<TuneRes | null>(null);
  const [w, setW] = useState({ w_d: 1, w_g: 0.5, w_c: 0.3 });
  const [alarm, setAlarm] = useState(0);
  const [narr, setNarr] = useState<Narr[]>([]);
  const stRef = useRef<Cd3State | null>(null);
  stRef.current = st;

  const absorb = useCallback(
    (s: Cd3State) => {
      const prev = stRef.current;
      if (MODE === "replay" && prev && s.tick < prev.tick) {
        // hết bản ghi → dừng thay vì quay về đầu
        setPlaying(false);
        toast({ anchor: "cd3-control", kind: "info", title: t("cd3.replayEnd") });
        return false;
      }
      setSt(s);
      // diễn giải điều vừa xảy ra; sự kiện quan trọng cũng lên dải thông báo ở header
      const said = narrate(prev, s);
      if (said.length) {
        setNarr((xs) => [...[...said].reverse(), ...xs].slice(0, 80));
        const top = said.filter((n) => n.important && n.key !== "cd3.nar.proposal").slice(0, 2);
        for (const n of top) {
          const text = fill(t(n.key), { ...n.vars, levelName: n.vars.level ? t(`cd3.level.${n.vars.level}`) : "" }).replace(/\*\*/g, "");
          toast({ anchor: "cd3-narrator", kind: n.tone === "bad" ? "error" : n.tone === "act" ? "success" : "info", title: `t${n.tick} · ${t(`cd3.nar.tone.${n.tone}`)}`, body: text });
        }
      }
      const fresh = s.queue.find((q) => q.status === "pending" && !seen.has(q.id));
      if (fresh) {
        setModal(fresh);
        setPlaying(false); // con người trong vòng lặp: tạm dừng khi cần phê duyệt
        toast({ anchor: "cd3-tabs", kind: "error", title: t("cd3.toast.pending").replace("{level}", fresh.level).replace("{target}", fresh.target), body: fresh.reason });
        setAlarm((a) => a + 1);
      }
      return true;
    },
    [seen, t, toast],
  );

  useEffect(() => {
    run("load", async () => {
      setSt(null);
      setNarr([]);
      setSeen(new Set());
      setTune(null);
      if (MODE === "replay") await api.post<StepRes>("/api/cd3/reset");
      setSt(await api.get<Cd3State>("/api/cd3/state"));
    });
  }, [api, run]);

  const tick = useCallback(() => run("tick", async () => (absorb((await api.post<StepRes>("/api/cd3/tick?n=1")).state), complete("cd3", "run"))), [api, run, absorb]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => tick(), TICK_MS / pace);
    return () => clearInterval(id);
  }, [playing, pace, tick]);

  const startScenario = (sc: string) =>
    run("start", async () => {
      if (MODE === "replay") {
        if (REPLAY_FILES.includes(sc)) setFile(sc);
        if (sc !== "normal") complete("cd3", "attack");
        return;
      }
      absorb((await api.post<StepRes>(`/api/cd3/start?scenario=${sc}`)).state);
      if (sc !== "normal") complete("cd3", "attack");
      toast({ anchor: "cd3-control", kind: "info", title: `${t("cd3.scenario")}: ${t(`cd3.sc.${sc}`)}` });
    });

  const reset = () =>
    run("reset", async () => {
      setPlaying(false);
      setSeen(new Set());
      setTune(null);
      setNarr([]);
      setSt((await api.post<StepRes>("/api/cd3/reset")).state);
    });

  const decide = (id: number, ok: boolean) =>
    run(`d${id}`, async () => {
      setSeen((s) => new Set(s).add(id));
      setModal(null);
      const r = await api.post<StepRes>(`/api/cd3/${ok ? "approve" : "reject"}/${id}`);
      const q = r.state.queue.find((x) => x.id === id);
      if (ok && q) complete("cd3", q.level === "R5" ? "pause" : "approve");
      absorb(r.state);
      const tx = r.txs?.[0];
      if (ok && tx) toast({ anchor: "cd3-control", kind: tx.status === 1 ? "success" : "error", title: t("cd3.toast.executed"), body: `${tx.fn} · chain-B #${tx.block}` });
    });

  const later = useCallback((id: number) => {
    setSeen((s) => new Set(s).add(id));
    setModal(null);
  }, []);

  const runTune = (ww = w) => run("tune", async () => (setTune(await api.post<TuneRes>("/api/cd3/tune", ww)), complete("cd3", "tune")));

  // ------------------------------------------------------------ trình chiếu
  const ref = useRef({ tick, startScenario, decide, setTab, setPlaying, runTune, setW, setFile, reset });
  ref.current = { tick, startScenario, decide, setTab, setPlaying, runTune, setW, setFile, reset };
  const sleep = pacedSleep;
  const ticks = async (n: number, gap = 1100) => {
    for (let i = 0; i < n; i++) {
      await ref.current.tick();
      await sleep(gap);
    }
  };
  const approvePending = async (level: string, target?: string) => {
    for (let i = 0; i < 12; i++) {
      const q = stRef.current?.queue.find((x) => x.status === "pending" && x.level === level && (!target || x.target === target));
      if (q) {
        await sleep(3200); // để người xem đọc hộp thoại trước khi phê duyệt
        await ref.current.decide(q.id, true);
        return;
      }
      await ref.current.tick();
      await sleep(1000);
    }
  };
  const steps = useMemo<TourStep[]>(
    () => [
      { caption: "cd3.tour.s0", focus: "cd3-control", run: async () => (MODE === "replay" ? ref.current.setFile("slow_burn") : await ref.current.reset(), ref.current.setTab("m1")), hold: 2500 },
      { caption: "cd3.tour.s1", focus: "cd3-control", run: () => ticks(MODE === "replay" ? 10 : 8), hold: 1500 },
      { caption: "cd3.tour.s2", focus: "cd3-tabs", run: async () => (await ref.current.startScenario("slow_burn"), ref.current.setTab("m2"), await ticks(2)), hold: 2500 },
      { caption: "cd3.tour.s3", focus: "cd3-tabs", run: () => approvePending("R4", "V7"), hold: 3500 },
      { caption: "cd3.tour.s4", focus: "cd3-tabs", run: async () => (ref.current.setTab("m1"), await ticks(3)), hold: 3000 },
      { caption: "cd3.tour.s5", focus: "cd3-control", run: async () => (MODE === "replay" ? (ref.current.setFile("collusion"), await sleep(1500), await ticks(10, 350)) : await ref.current.startScenario("collusion"), ref.current.setTab("m3"), await ticks(2)), hold: 2000 },
      { caption: "cd3.tour.s6", focus: "cd3-tabs", run: () => approvePending("R5"), hold: 3500 },
      { caption: "cd3.tour.s7", focus: "cd3-tabs", run: async () => (ref.current.setTab("m3"), ref.current.setW({ w_d: 1, w_g: 0, w_c: 0.3 }), await ref.current.runTune({ w_d: 1, w_g: 0, w_c: 0.3 }), await sleep(2500), ref.current.setW({ w_d: 1, w_g: 1, w_c: 0.3 }), await ref.current.runTune({ w_d: 1, w_g: 1, w_c: 0.3 })), hold: 4000 },
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
      <Primer ns="cd3" accent={A.grad} />
      <ErrorBanner error={error} onClose={() => setError(null)} />

      {/* thanh điều khiển */}
      <GlassCard id="cd3-control" accent={A.grad} bodyClassName="space-y-4">
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
            <PaceControl />
          </div>
        </div>
        {currentSc && (
          <motion.p key={currentSc} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-amber-100/80">
            ▸ {t(`cd3.scHint.${currentSc}`)}
          </motion.p>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { k: "tick", v: <AnimatedNumber value={st?.tick ?? 0} />, c: "text-white" },
            { k: t("cd3.kpi.locked"), v: <AnimatedNumber value={st?.supply.locked ?? 0} />, c: "text-amber-200" },
            { k: t("cd3.kpi.minted"), v: <AnimatedNumber value={st?.supply.minted ?? 0} />, c: supplyOk ? "text-emerald-200" : "text-rose-300" },
            { k: t("cd3.kpi.pending"), v: pendingCount, c: pendingCount ? "text-rose-300" : "text-slate-300" },
            { k: t("cd3.kpi.bridge"), v: st?.paused ? `⏸ ${t("cd3.kpi.paused")}` : `● ${t("cd3.kpi.running")}`, c: st?.paused ? "text-rose-300" : "text-emerald-300" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-white/10 bg-surface-0/40 px-3 py-2">
              <div className={`text-xl font-bold tabular-nums ${x.c}`} data-testid={x.k === "tick" ? "cd3-tick" : undefined}>
                {x.v}
              </div>
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
        <div id="cd3-narrator" className="scroll-mt-24">
          <NarratorPanel items={narr} />
        </div>
      </GlassCard>

      <Shake trigger={alarm || undefined} tone={alarm ? "danger" : null}>
        <GlassCard id="cd3-tabs" accent={A.grad}>
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
                      <thead className="sticky top-0 bg-surface-1 text-slate-400">
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
                    <div className="h-72 rounded-xl border border-white/10 bg-surface-0/60 p-2">
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

      {/* hộp thoại phê duyệt R4/R5 — portal ra <body> nên luôn ở giữa màn hình đang xem */}
      <ApprovalModal modal={modal} onDecide={decide} onLater={later} />
      <TourBar tour={tour} accent={A.grad} />
    </div>
  );
}
