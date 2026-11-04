// Diễn giải từng tick cho người mới: so sánh trạng thái trước/sau và sinh câu giải thích bằng lời thường,
// bám theo các luật của bộ phát hiện sự kiện (backend/app/modules/cd3_crosssentry/m1_events.py).
import type { Cd3State, Evidence } from "./types";

export type Tone = "ok" | "info" | "warn" | "bad" | "act";
export type Narr = { id: string; tick: number; tone: Tone; key: string; vars: Record<string, string | number>; important: boolean };

const amountOf = (e: Evidence) => Math.max(0, Math.round(10 ** (e.features[1] ?? 0) - 1));
const list = (xs: string[]) => xs.filter(Boolean).join(", ") || "—";

export function narrate(prev: Cd3State | null, next: Cd3State): Narr[] {
  if (!prev || next.tick < prev.tick) return [];
  const out: Narr[] = [];
  const tick = next.tick;
  const cor = (i: number) => next.risk.corridors[i] ?? String(i);
  const push = (tone: Tone, key: string, vars: Narr["vars"] = {}, important = false) => out.push({ id: `${tick}-${out.length}-${key}`, tick, tone, key, vars, important });

  // 1) sự kiện mới (bằng chứng có id tăng dần)
  const lastId = prev.evidence.reduce((m, e) => Math.max(m, e.id), 0);
  const fresh = next.evidence.filter((e) => e.id > lastId);
  const pairs = fresh.filter((e) => e.kind === "pair" && e.rules.length === 0 && e.p_hat < 0.7);
  if (pairs.length) push("ok", "cd3.nar.pairs", { n: pairs.length });
  let systemic = 0;
  for (const e of fresh) {
    const signers = list(e.actors.signers);
    const relayer = e.actors.relayer ?? "—";
    const user = e.actors.user ?? "—";
    const base = { signers, relayer, user, corridor: cor(e.corridor), amount: amountOf(e) };
    if (e.rules.includes("mint_without_lock")) push("bad", "cd3.nar.orphan", base, true);
    if (e.rules.includes("value_out_gt_in")) {
      const ratio = (e.features[2] ?? 1).toFixed(2).replace(/\.?0+$/, "");
      if (e.actors.oracle) push("bad", "cd3.nar.inflatedOracle", { ...base, ratio, oracle: e.actors.oracle }, true);
      else push("bad", "cd3.nar.inflated", { ...base, ratio }, true);
    }
    if (e.rules.includes("double_process")) push("bad", "cd3.nar.duplicate", base, true);
    if (e.rules.includes("latency")) push("warn", "cd3.nar.latency", { ...base, lat: Math.round(e.features[0] ?? 0) }, true);
    if (e.rules.includes("latency_systemic")) systemic++;
    if (e.rules.includes("circular_small")) push("warn", "cd3.nar.circular", base, true);
    if (e.rules.length === 0 && e.p_hat >= 0.7) push("warn", "cd3.nar.learnOnly", { ...base, p: e.p_hat.toFixed(2), who: e.actors.user ?? relayer }, true);
  }
  if (systemic) push("info", "cd3.nar.latencySys", { n: systemic }, true);

  // 2) mint bị chặn on-chain
  const reverted = next.lanes.filter((l) => l.tick > prev.tick && l.type === "MintReverted");
  if (reverted.length) {
    const reasons = Array.from(new Set(reverted.map((l) => l.reason ?? "revert")));
    push("act", "cd3.nar.reverted", { n: reverted.length, reason: reasons.join(", ") }, true);
  }

  // 3) mức phản ứng tự động R1–R3 (R4/R5 đi qua hàng đợi phê duyệt)
  const seenAct = new Set<string>();
  for (const a of next.actions.filter((x) => x.tick > prev.tick && x.auto)) {
    const k = `${a.target}|${a.corridor}|${a.level}`;
    if (seenAct.has(k)) continue;
    seenAct.add(k);
    push(a.level >= "R2" ? "warn" : "info", "cd3.nar.level", { actor: a.target, corridor: a.corridor ?? "—", r: (a.r ?? 0).toFixed(2), level: a.level }, a.level >= "R2");
  }

  // 4) đề xuất cần phê duyệt và quyết định của con người
  const prevQ = new Map(prev.queue.map((q) => [q.id, q.status]));
  for (const q of next.queue) {
    const before = prevQ.get(q.id);
    if (!before && q.status === "pending") push("bad", "cd3.nar.proposal", { level: q.level, target: q.target, corridor: q.corridor, r: q.r }, true);
    if (before === "pending" && q.status !== "pending") push("act", q.status === "approved" ? "cd3.nar.approved" : "cd3.nar.rejected", { level: q.level, target: q.target, fn: q.level === "R5" ? "pause()" : `blockActor(${q.target})` }, true);
  }

  // 5) trạng thái cầu nối và bất biến cung
  if (!prev.paused && next.paused) push("act", "cd3.nar.paused", {}, true);
  if (prev.supply.minted <= prev.supply.locked && next.supply.minted > next.supply.locked) push("bad", "cd3.nar.supply", { m: next.supply.minted, l: next.supply.locked }, true);

  if (!out.length && next.tick > prev.tick) push("info", "cd3.nar.quiet", {});
  return out;
}
