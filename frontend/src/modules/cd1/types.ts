import type { TxSummary } from "../../lib/types";

export type Student = { id: string; name: string; degree: string; major: string; year: number; issued: boolean; revoked: boolean };
export type Relay = { name: string; address: string };

export type Cd1State = {
  steps: Record<"setup" | "issue" | "prove" | "verify" | "revoke", "todo" | "done" | "error">;
  threshold: number;
  n: number;
  issuer: string;
  verifier: string;
  relays: Relay[];
  contracts: { registry: string | null; verifier: string | null };
  root: string | null;
  batch_id: number;
  students: Student[];
};

export type WithState = { state: Cd1State; txs?: TxSummary[] };

export type SetupRes = WithState & { relays: Relay[]; threshold: number; n: number; registry: string; verifier: string; ms: number };
export type IssueRes = WithState & { batch_id: number; root: string; leaves: { id: string; leaf: string; c_gpa: string }[]; tree: string[][]; ms: number };

export type Statement = {
  predicate: string;
  threshold: number;
  c_gpa: string;
  leaf: string;
  merkle_proof: { hash: string; right: boolean }[];
  root: string;
  batch_id: number;
  context: string;
  nonce: number | string;
  src_chain_id: number;
  holder?: string;
  commits?: Record<string, string>;
  disclosures?: { attr: string; value: string; salt: string }[];
};

export type ProveRes = WithState & {
  student_id: string;
  statement: Statement;
  proof: { scheme: string; k_bits: number; bit_commitments: string[]; or_proofs: Record<string, string>[]; context: string };
  proof_bytes: number;
  satisfiable: boolean;
  witness_hidden: Record<string, string | number>;
  holder_view: Record<string, number | string>;
  ms: number;
};

export type RelayCheck = { relay: string; address: string; ok: boolean; reasons: string[]; latency_ms?: number };

export type VerifyRes = WithState & {
  kind: string;
  msg_hash: string;
  relay_checks: RelayCheck[];
  signers: { relay: string; address: string }[];
  sigs: string[];
  valid_sigs: number;
  threshold: number;
  accepted: boolean;
  reason: string;
  ms: number;
  abe: { id: string; policy: string[][]; policy_str: string; size: number; preview: string } | null;
};

export type RevokeRes = WithState & { student_id: string; credential_hash: string; ms: number };

export type ShamirRes = {
  p: number;
  t: number;
  n: number;
  coeffs: number[];
  shares: { x: number; y: number }[];
  use: number[];
  recovered: number | null;
  ok: boolean;
  curve: { x: number; y: number }[];
};

export type AbeRes = { attrs: Record<string, string>; policy: string; ok: boolean; reason?: string; payload?: Record<string, string> };

export type Timeline = { phases: { phase: string; ms: number; proof_bytes?: number; sig_bytes?: number; abe_bytes?: number; leaves?: number }[] };
