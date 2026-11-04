import type { TxSummary } from "../../lib/types";

export type Mass = { N: number; A: number; T: number };
export type LaneEvent = { tick: number; chain: "A" | "B"; type: string; msgId: string | null; amount: number; corridor: number | null; actor: string; status: string; rules?: string[]; reason?: string };
export type Evidence = {
  id: number;
  tick: number;
  kind: string;
  msgId: string;
  corridor: number;
  actors: { user: string | null; relayer: string | null; signers: string[]; oracle?: string | null };
  features: number[];
  p_hat: number;
  kappa_L: number;
  kappa_P: number;
  rules: string[];
  m_learn: Mass;
  m_rule: Mass;
  m_fused: Mass;
  K: number;
  bel: number;
  pl: number;
  attributed: [string, number][];
};
export type Series = { key: string; actor: string; corridor: string; r: number[]; trad: number[]; start: number; traditional: number; peak: number; crs_detect: number | null; trad_detect: number | null };
export type Approval = { id: number; level: "R4" | "R5"; target: string; corridor: string; r: number; reason: string; tick: number; status: "pending" | "approved" | "rejected" };
export type Action = { tick: number; level: string; target: string; corridor: string | null; r?: number; auto: boolean; decision?: string; note?: string };

export type Cd3State = {
  tick: number;
  scenario: string;
  scenarios: string[];
  paused: boolean;
  lanes: LaneEvent[];
  evidence: Evidence[];
  risk: { actors: string[]; corridors: string[]; matrix: number[][] };
  series: Series[];
  levels: Record<string, string>;
  actions: Action[];
  queue: Approval[];
  executed: Record<string, string>;
  gsurv: { gini: number; lorenz: { p: number; l: number }[]; impact: Record<string, number> };
  graph: { nodes: { id: string; type: string; chain?: string; risk: number }[]; edges: { source: string; target: string; count: number }[] };
  contracts: Record<string, string>;
  supply: { locked: number; minted: number };
};

export type StepRes = { state: Cd3State; txs?: TxSummary[]; tick?: number };
export type TuneRes = { weights: { w_d: number; w_g: number; w_c: number }; curve: { theta: number; U_det: number; G_surv: number; C_op: number; F: number }[]; best: { theta: number; U_det: number; G_surv: number; C_op: number; F: number } };

export const CORRIDOR_COLORS = ["#f59e0b", "#38bdf8", "#f472b6"];
export const RISK_COLOR = (r: number) => (r >= 0.75 ? "#f43f5e" : r >= 0.6 ? "#fb923c" : r >= 0.4 ? "#fbbf24" : r >= 0.2 ? "#a3e635" : "#34d399");
