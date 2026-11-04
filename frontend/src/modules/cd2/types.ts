import type { TxSummary } from "../../lib/types";

export type Lang2 = { vi: string; en: string };
export type Sample = { id: string; title: string; category: string; bug: Lang2; lines: number; vulnerable: boolean; category_label: Lang2 };
export type SamplesRes = { samples: Sample[]; categories: Record<string, Lang2> };
export type SampleDetail = { id: string; title: string; category: string; source: string; bug_lines: number[] };

export type GNode = { id: string; type: string; label: string; external?: boolean };
export type GEdge = { source: string; target: string; kind: string };
export type M1Res = {
  tokens: { count: number; unique: number; sample: string[]; top: { token: string; n: number }[] };
  graph: { contract: string; nodes: GNode[]; edges: GEdge[]; stats: Record<string, number> };
  interactions: { kind: string; present: boolean; count: number }[];
};

export type M2Res = {
  k_shot: number;
  label: string;
  probs: Record<string, number>;
  distances: Record<string, number>;
  contributions: Record<string, number>;
  p_vuln: number;
  point: { x: number; y: number };
};
export type EmbeddingRes = {
  k_shot: number;
  points: { x: number; y: number; cls: string; support: boolean }[];
  prototypes: { x: number; y: number; cls: string }[];
  episode_accuracy: Record<string, number>;
};

export type FlRound = { round: number; accuracy: number; loss: number; epsilon: number | null; grad_norm_pre: number; grad_norm_post: number };
export type M3Res = {
  rounds: number;
  clients: { client: string; samples: number; label_hist: number[] }[];
  epsilon_target: number | null;
  alpha: number;
  sigma: number;
  clip: number;
  delta: number;
  sampling_rate: number;
  history: FlRound[];
  final_accuracy: number;
  baseline: { round: number; accuracy: number }[];
  baseline_final: number;
};

export type Invariant = { id: string; predicate: string; kind: "hard" | "soft"; status: "declared" | "candidate" | "verified" };
export type M4Res = {
  contract: string;
  sample_id: string;
  risk_tier: "high" | "medium" | "low";
  p_vuln: number;
  category: string;
  category_label: Lang2;
  ground_truth: string;
  k_shot: number;
  contributions: Record<string, number>;
  evidence: ({ invariant: string; missing: string[] } | { line: number; code: string })[];
  code_spans: { start: number; end: number }[];
  interactions: string[];
  invariants: Invariant[];
  fixes: ({ invariant: string } & Lang2)[];
  generator: string;
};

export type ExploitStep = { i: number; action: string; actor: string; info: Record<string, unknown>; txs: TxSummary[]; attacker_balance: number; locked: number };
export type ExploitRes = {
  sample_id: string;
  target: "vuln" | "safe";
  attack: string;
  steps: ExploitStep[];
  attacker_balance: number;
  locked: number;
  unbacked: number;
  exploited: boolean;
  contracts: Record<string, string>;
};

export const CLS_COLORS: Record<string, string> = {
  validator_oracle: "#f472b6",
  bridge_logic: "#fbbf24",
  message_verification: "#fb7185",
  access_control: "#60a5fa",
  protocol_rule: "#a78bfa",
  safe: "#34d399",
};
