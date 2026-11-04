import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, KeyRound, RefreshCw, Send, ShieldAlert, Sparkles, Wallet as WalletIcon } from "lucide-react";
import { useT } from "../i18n/useT";
import { createClient } from "../lib/api";
import { short, type BlockInfo, type ChainInfo, type TxSummary } from "../lib/types";
import { useAction } from "../lib/useAsync";
import { ACCENTS } from "../lib/theme";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import ChainPanel from "../components/ChainPanel";
import Gauge from "../components/Gauge";
import Slider from "../components/Slider";
import Stepper, { type StepState } from "../components/Stepper";
import JsonViewer from "../components/JsonViewer";
import Shake from "../components/fx/Shake";
import Burst from "../components/fx/Burst";
import ScrambleText from "../components/fx/ScrambleText";
import FlowBeam from "../components/fx/FlowBeam";
import AnimatedNumber from "../components/fx/AnimatedNumber";
import { ErrorBanner } from "../components/States";
import { useToast } from "../components/Toast";

const CHAIN_IDS: Record<string, number> = { "chain-A": 31337, "chain-B": 97 };
const COLORS: Record<string, string> = { "chain-A": "#22d3ee", "chain-B": "#f59e0b" };

/** Trang thử nghiệm lõi: explorer 2 chuỗi, ví trình duyệt ký tx thô, trình diễn UI kit. */
export default function Playground() {
  const { t } = useT();
  const toast = useToast();
  const api = useMemo(() => createClient("core", "playground"), []);
  const { busy, error, run, setError } = useAction();
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [blocks, setBlocks] = useState<Record<string, BlockInfo[]>>({});
  const [txs, setTxs] = useState<TxSummary[]>([]);
  const [wallet, setWallet] = useState<{ address: string; sign: (cid: number, nonce: number, eth: string) => Promise<string> } | null>(null);
  const [nonces, setNonces] = useState<Record<string, number>>({ "chain-A": 0, "chain-B": 0 });
  const [flash, setFlash] = useState<{ k: number; tone: "danger" | "success" } | null>(null);
  const [gauge, setGauge] = useState(0.62);
  const [step, setStep] = useState(2);
  const [pulse, setPulse] = useState(0);

  const refresh = useCallback(async () => {
    const cs = await api.get<ChainInfo[]>("/api/chain");
    setChains(cs);
    const bs: Record<string, BlockInfo[]> = {};
    for (const c of cs) bs[c.name] = await api.get<BlockInfo[]>(`/api/chain/${c.name}/blocks?limit=12`);
    setBlocks(bs);
  }, [api]);

  useEffect(() => {
    run("load", refresh);
    // Ví ethers được tải lười (chunk riêng) để trang chủ nhẹ.
    import("../lib/wallet").then(({ loadWallet, signTransfer }) => {
      const w = loadWallet();
      setWallet({ address: w.address, sign: (cid, nonce, eth) => signTransfer(w, cid, "0x1111111111111111111111111111111111111111", eth, nonce) });
    });
  }, [run, refresh]);

  const add = (tx: TxSummary) => {
    setTxs((xs) => [...xs, tx]);
    setPulse((p) => p + 1);
  };

  const faucet = (chain: string) =>
    run("faucet", async () => {
      if (!wallet) return;
      add(await api.post<TxSummary>(`/api/chain/${chain}/faucet`, { address: wallet.address, eth: 1 }));
      toast({ kind: "success", title: t("pg.faucetOk"), body: `${chain} · 1 ETH` });
    });

  const send = (chain: string, wrongChain = false) =>
    run("send", async () => {
      if (!wallet) return;
      const cid = wrongChain ? (chain === "chain-A" ? 97 : 31337) : CHAIN_IDS[chain];
      const raw = await wallet.sign(cid, nonces[chain], wrongChain ? "0.000000000000000001" : "0.01");
      try {
        const tx = await api.post<TxSummary>(`/api/chain/${chain}/send_raw`, { raw });
        add(tx);
        setNonces((n) => ({ ...n, [chain]: n[chain] + 1 }));
        setFlash({ k: Date.now(), tone: "success" });
        toast({ kind: "success", title: t("pg.sentOk"), body: short(tx.hash, 8) });
      } catch (e) {
        setFlash({ k: Date.now(), tone: "danger" });
        toast({ kind: "error", title: t("pg.rejected"), body: e instanceof Error ? e.message : String(e) });
      }
    });

  const states: StepState[] = [0, 1, 2, 3, 4].map((i) => (i < step ? "done" : i === step ? "active" : "todo"));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="chip">{t("app.tools")}</span>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("pg.title")}</h1>
        <p className="max-w-3xl text-slate-300">{t("pg.body")}</p>
      </header>
      <ErrorBanner error={error} onClose={() => setError(null)} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard
          title={t("pg.explorer")}
          icon={<RefreshCw className="h-4 w-4" />}
          accent={ACCENTS.core.grad}
          actions={
            <Button size="sm" variant="ghost" loading={busy === "load"} onClick={() => run("load", refresh)} icon={<RefreshCw className="h-3.5 w-3.5" />}>
              {t("common.refresh")}
            </Button>
          }
        >
          <div className="space-y-4">
            {chains.map((c) => (
              <div key={c.name} className="space-y-2">
                <ChainPanel name={c.name} chainId={c.chain_id} txs={txs.filter((x) => x.chain === c.name)} color={COLORS[c.name]} />
                <div className="flex flex-wrap gap-1.5">
                  {(blocks[c.name] ?? []).slice(0, 8).map((b) => (
                    <span key={b.number} className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-slate-400" title={b.hash}>
                      #{b.number} · {b.tx_count}tx
                    </span>
                  ))}
                  {Object.entries(c.contracts).map(([n, a]) => (
                    <span key={n} className="chip font-mono text-[10px]">
                      {n} @ {short(a, 4)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <Shake trigger={flash?.k} tone={flash?.tone ?? null}>
          <GlassCard title={t("pg.wallet")} icon={<WalletIcon className="h-4 w-4" />} accent={ACCENTS.core.grad} className="h-full">
            <div className="relative space-y-4">
              <Burst trigger={flash?.tone === "success" ? flash.k : undefined} />
              <div className="rounded-xl border border-white/10 bg-surface-0/60 p-3">
                <div className="label mb-1 flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> {t("pg.address")}
                </div>
                {wallet ? <ScrambleText text={wallet.address} className="break-all text-sm text-sky-200" /> : "…"}
                <p className="mt-2 text-[11px] text-slate-500">{t("pg.walletNote")}</p>
              </div>
              {(["chain-A", "chain-B"] as const).map((c) => (
                <div key={c} className="flex flex-wrap items-center gap-2">
                  <span className="w-16 font-mono text-xs" style={{ color: COLORS[c] }}>
                    {c}
                  </span>
                  <Button size="sm" variant="ghost" icon={<Droplets className="h-3.5 w-3.5" />} onClick={() => faucet(c)} loading={busy === "faucet"}>
                    {t("pg.faucet")}
                  </Button>
                  <Button size="sm" accent={ACCENTS.core.grad} icon={<Send className="h-3.5 w-3.5" />} onClick={() => send(c)} loading={busy === "send"}>
                    {t("pg.send")}
                  </Button>
                  <Button size="sm" variant="danger" icon={<ShieldAlert className="h-3.5 w-3.5" />} onClick={() => send(c, true)}>
                    {t("pg.wrongChain")}
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>
        </Shake>
      </div>

      <GlassCard title={t("pg.kit")} icon={<Sparkles className="h-4 w-4" />} accent={ACCENTS.core.grad}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="label">Gauge · Slider · AnimatedNumber</div>
            <div className="flex items-center gap-6">
              <Gauge value={gauge} label="p_vuln" />
              <div className="text-4xl font-extrabold">
                <AnimatedNumber value={gauge * 1000} />
              </div>
            </div>
            <Slider label="value" value={gauge} min={0} max={1} onChange={setGauge} format={(v) => v.toFixed(2)} />
          </div>
          <div className="space-y-3">
            <div className="label">Stepper · FlowBeam</div>
            <Stepper steps={["Setup", "Issue", "Prove", "Verify", "Revoke"]} states={states} accent={ACCENTS.cd1.grad} onSelect={setStep} />
            <div className="flex items-center gap-2">
              <span className="chip">chain-A</span>
              <FlowBeam d="M 0 10 C 30 0, 70 20, 100 10" className="h-8 flex-1" pulseKey={pulse} active />
              <span className="chip">chain-B</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setPulse((p) => p + 1)}>
              {t("pg.pulse")}
            </Button>
          </div>
          <div className="space-y-3">
            <div className="label">JsonViewer</div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <JsonViewer data={txs[txs.length - 1] ?? { hint: t("pg.jsonHint") }} maxHeight={200} />
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
