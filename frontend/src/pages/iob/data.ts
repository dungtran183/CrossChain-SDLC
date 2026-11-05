// Dữ liệu minh họa "Internet of Blockchains": một số chuỗi tiêu biểu và cầu nối giữa chúng (không đầy đủ, không theo tỷ lệ),
// kèm các sự cố gắn với từng cầu. Tọa độ trên viewBox 1000×540.
export type Chain = { id: string; name: string; x: number; y: number; r: number; c: string; hub?: boolean };
export type EdgeType = "bridge" | "native" | "rollup";
export type IobEvent = {
  /** id trong INCIDENTS (trang Sự cố) hoặc khóa proto.inc.<key> */
  key: string;
  source: "inc" | "proto";
  date: string;
  usd?: number;
  kind: "hack" | "bug" | "foiled";
};
export type Bridge = { a: string; b: string; name: string; type: EdgeType; bend?: number; ev?: IobEvent };

export const CHAINS: Chain[] = [
  { id: "eth", name: "Ethereum", x: 500, y: 268, r: 34, c: "#627eea" },
  { id: "btc", name: "Bitcoin", x: 250, y: 104, r: 28, c: "#f7931a" },
  { id: "bsc", name: "BNB Chain", x: 740, y: 150, r: 24, c: "#f0b90b" },
  { id: "bbc", name: "BNB Beacon", x: 890, y: 70, r: 13, c: "#c99a09" },
  { id: "sol", name: "Solana", x: 800, y: 300, r: 22, c: "#14c08a" },
  { id: "poly", name: "Polygon", x: 655, y: 420, r: 18, c: "#8247e5" },
  { id: "arb", name: "Arbitrum", x: 400, y: 420, r: 16, c: "#28a0f0" },
  { id: "op", name: "Optimism", x: 520, y: 462, r: 16, c: "#ff0420" },
  { id: "avax", name: "Avalanche", x: 318, y: 320, r: 18, c: "#e84142" },
  { id: "near", name: "NEAR", x: 595, y: 92, r: 15, c: "#00a37a" },
  { id: "ronin", name: "Ronin", x: 372, y: 196, r: 14, c: "#1273ea" },
  { id: "one", name: "Harmony", x: 440, y: 82, r: 14, c: "#00aee9" },
  { id: "klay", name: "Klaytn", x: 900, y: 205, r: 14, c: "#ff6b35" },
  { id: "dot", name: "Polkadot", x: 132, y: 318, r: 26, c: "#e6007a", hub: true },
  { id: "aca", name: "Acala", x: 62, y: 452, r: 13, c: "#e6007a" },
  { id: "glmr", name: "Moonbeam", x: 220, y: 452, r: 14, c: "#3fb5b3" },
  { id: "atom", name: "Cosmos Hub", x: 840, y: 440, r: 24, c: "#6f7390", hub: true },
  { id: "osmo", name: "Osmosis", x: 950, y: 360, r: 14, c: "#9c5aff" },
  { id: "inj", name: "Injective", x: 950, y: 488, r: 13, c: "#0082fa" },
];

export const BRIDGES: Bridge[] = [
  { a: "eth", b: "ronin", name: "Ronin Bridge", type: "bridge", ev: { key: "ronin", source: "inc", date: "2022-03", usd: 624, kind: "hack" } },
  { a: "eth", b: "sol", name: "Wormhole", type: "bridge", ev: { key: "wormhole", source: "inc", date: "2022-02", usd: 326, kind: "hack" } },
  { a: "eth", b: "one", name: "Harmony Horizon", type: "bridge", ev: { key: "harmony", source: "inc", date: "2022-06", usd: 100, kind: "hack" } },
  { a: "eth", b: "glmr", name: "Nomad", type: "bridge", ev: { key: "nomad", source: "inc", date: "2022-08", usd: 190, kind: "hack" } },
  { a: "bbc", b: "bsc", name: "BSC Token Hub", type: "native", ev: { key: "bnb", source: "inc", date: "2022-10", usd: 570, kind: "hack" } },
  { a: "eth", b: "bsc", name: "Poly Network", type: "bridge", bend: 46, ev: { key: "poly", source: "inc", date: "2021-08", usd: 611, kind: "hack" } },
  { a: "eth", b: "bsc", name: "Qubit QBridge", type: "bridge", ev: { key: "qubit", source: "inc", date: "2022-01", usd: 80, kind: "hack" } },
  { a: "eth", b: "bsc", name: "Multichain", type: "bridge", bend: -46, ev: { key: "multichain", source: "inc", date: "2023-07", usd: 126, kind: "hack" } },
  { a: "eth", b: "klay", name: "Orbit Bridge", type: "bridge", ev: { key: "orbit", source: "inc", date: "2024-01", usd: 81, kind: "hack" } },
  { a: "eth", b: "poly", name: "Polygon PoS / Plasma", type: "bridge", ev: { key: "plasma", source: "proto", date: "2021-10", kind: "bug" } },
  { a: "eth", b: "near", name: "Rainbow Bridge", type: "bridge", ev: { key: "rainbow", source: "proto", date: "2022-08", kind: "foiled" } },
  { a: "atom", b: "osmo", name: "IBC", type: "native", ev: { key: "dragonberry", source: "proto", date: "2022-10", kind: "bug" } },
  { a: "dot", b: "aca", name: "XCM", type: "native", ev: { key: "acala", source: "proto", date: "2022-08", kind: "bug" } },
  { a: "eth", b: "arb", name: "Arbitrum Bridge", type: "rollup" },
  { a: "eth", b: "op", name: "OP Standard Bridge", type: "rollup" },
  { a: "eth", b: "avax", name: "Avalanche Bridge", type: "bridge" },
  { a: "btc", b: "eth", name: "WBTC", type: "bridge" },
  { a: "btc", b: "avax", name: "BTC.b", type: "bridge", bend: -20 },
  { a: "eth", b: "atom", name: "Gravity Bridge", type: "bridge", bend: 30 },
  { a: "eth", b: "dot", name: "Snowbridge", type: "bridge", bend: -24 },
  { a: "osmo", b: "inj", name: "IBC", type: "native" },
  { a: "atom", b: "inj", name: "IBC", type: "native" },
  { a: "dot", b: "glmr", name: "XCM", type: "native" },
  { a: "sol", b: "bsc", name: "Wormhole", type: "bridge", bend: 20 },
  { a: "poly", b: "atom", name: "Axelar", type: "bridge", bend: 18 },
];

export const EDGE_COLOR: Record<EdgeType, string> = { bridge: "#a26bff", native: "#00c9b0", rollup: "#3d8bff" };
export const EV_COLOR = { hack: "#ff4b4b", bug: "#ff8f42", foiled: "#22c55e" } as const;

/** Các sự cố theo thứ tự thời gian (dùng cho chế độ tự phát). */
export const TIMELINE_EVENTS = BRIDGES.filter((b) => b.ev).sort((x, y) => (x.ev!.date < y.ev!.date ? -1 : 1));

export const byId = (id: string) => CHAINS.find((c) => c.id === id)!;

/** Đường cong của một cầu (bend = độ lệch vuông góc của điểm điều khiển). */
export function edgePath(b: Bridge) {
  const A = byId(b.a);
  const B = byId(b.b);
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const L = Math.hypot(dx, dy) || 1;
  const k = b.bend ?? 0;
  const cx = mx - (dy / L) * k;
  const cy = my + (dx / L) * k;
  return { d: `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}`, mid: { x: (A.x + 2 * cx + B.x) / 4, y: (A.y + 2 * cy + B.y) / 4 } };
}
