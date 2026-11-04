// Kiểu dữ liệu dùng chung — khớp với app/core/chainsim.py (tx_summary, blocks).

export type TxEvent = {
  event: string;
  address: string;
  contract: string | null;
  args: Record<string, unknown>;
};

export type TxSummary = {
  chain: string;
  chain_id: number;
  hash: string;
  block: number;
  from: string;
  from_label: string | null;
  to: string | null;
  to_label: string | null;
  fn: string | null;
  value: number | string;
  gas_used: number;
  status: number;
  events: TxEvent[];
  reason?: string;
};

export type BlockInfo = {
  number: number;
  hash: string;
  timestamp: number;
  tx_count: number;
  txs: string[];
  gas_used: number;
};

export type ChainInfo = {
  name: string;
  chain_id: number;
  block_number: number;
  accounts: number;
  contracts: Record<string, string>;
};

export const short = (h: string | null | undefined, n = 6) =>
  !h ? "—" : h.length <= 2 * n + 2 ? h : `${h.slice(0, n + 2)}…${h.slice(-n)}`;
