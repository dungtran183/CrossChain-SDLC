// Danh mục các cơ chế giao tiếp liên chuỗi được mô phỏng. Văn bản nằm trong i18n: proto.<id>.*
// Thang điểm 1..5 là đánh giá định tính để so sánh tương đối (không phải số đo).
import type { ComponentType } from "react";
import NotaryScene from "./scenes/Notary";
import HtlcScene from "./scenes/Htlc";
import SidechainScene from "./scenes/Sidechain";
import RelayScene from "./scenes/Relay";
import HubScene from "./scenes/Hub";
import OptimisticScene from "./scenes/Optimistic";

export type Mode = "normal" | "attack";
export type SceneProps = { step: number; mode: Mode };
export type ProtoId = "notary" | "htlc" | "sidechain" | "relay" | "hub" | "optimistic";
export type ModId = "cd1" | "cd2" | "cd3";

export type ProtoIncident = {
  /** khóa i18n: proto.inc.<key>.{name,body} */
  key: string;
  date: string;
  /** tổn thất ước tính (triệu USD); bỏ trống nếu không mất tiền */
  usd?: number;
  kind: "hack" | "bug" | "foiled" | "attack";
  /** id trong trang Sự cố thực tế (nếu có diễn biến từng bước) */
  inc?: string;
};

export type ProtoDef = {
  id: ProtoId;
  color: string;
  glyph: string;
  Scene: ComponentType<SceneProps>;
  /** 1..5: càng cao càng ít phải tin bên thứ ba */
  trust: number;
  /** 1..5: 1 = chỉ hoán đổi tài sản, 5 = thông điệp tùy ý */
  general: number;
  /** 1..5: càng cao càng nhanh */
  speed: number;
  /** 1..5: càng cao chi phí on-chain càng thấp */
  cost: number;
  /** 1..5: càng cao càng dễ kết nối thêm chuỗi mới */
  extensible: number;
  /** vị trí trên tam giác bất khả (trustless, extensible, generalizable), tổng = 1 */
  tri: [number, number, number];
  incidents: ProtoIncident[];
  thesis: ModId[];
};

export const PROTOCOLS: ProtoDef[] = [
  {
    id: "notary",
    color: "#a26bff",
    glyph: "✍",
    Scene: NotaryScene,
    trust: 1,
    general: 5,
    speed: 4,
    cost: 4,
    extensible: 5,
    tri: [0.04, 0.5, 0.46],
    incidents: [
      { key: "ronin", date: "2022-03", usd: 624, kind: "hack", inc: "ronin" },
      { key: "wormhole", date: "2022-02", usd: 326, kind: "hack", inc: "wormhole" },
      { key: "harmony", date: "2022-06", usd: 100, kind: "hack", inc: "harmony" },
      { key: "multichain", date: "2023-07", usd: 126, kind: "hack", inc: "multichain" },
      { key: "orbit", date: "2024-01", usd: 81, kind: "hack", inc: "orbit" },
    ],
    thesis: ["cd1", "cd3"],
  },
  {
    id: "htlc",
    color: "#ffc730",
    glyph: "⏳",
    Scene: HtlcScene,
    trust: 5,
    general: 1,
    speed: 2,
    cost: 3,
    extensible: 3,
    tri: [0.5, 0.45, 0.05],
    incidents: [
      { key: "freeOption", date: "2019", kind: "attack" },
      { key: "floodLoot", date: "2020", kind: "attack" },
      { key: "cycling", date: "2023-10", kind: "bug" },
    ],
    thesis: ["cd1", "cd3"],
  },
  {
    id: "sidechain",
    color: "#3d8bff",
    glyph: "⇅",
    Scene: SidechainScene,
    trust: 2,
    general: 3,
    speed: 2,
    cost: 3,
    extensible: 2,
    tri: [0.18, 0.17, 0.65],
    incidents: [
      { key: "roninSide", date: "2022-03", usd: 624, kind: "hack", inc: "ronin" },
      { key: "plasma", date: "2021-10", kind: "bug" },
    ],
    thesis: ["cd1", "cd3"],
  },
  {
    id: "relay",
    color: "#00c9b0",
    glyph: "⛓",
    Scene: RelayScene,
    trust: 5,
    general: 4,
    speed: 3,
    cost: 1,
    extensible: 1,
    tri: [0.52, 0.04, 0.44],
    incidents: [
      { key: "bnb", date: "2022-10", usd: 570, kind: "hack", inc: "bnb" },
      { key: "dragonberry", date: "2022-10", kind: "bug" },
    ],
    thesis: ["cd1", "cd2"],
  },
  {
    id: "hub",
    color: "#ff4fa3",
    glyph: "✺",
    Scene: HubScene,
    trust: 4,
    general: 5,
    speed: 4,
    cost: 3,
    extensible: 2,
    tri: [0.4, 0.14, 0.46],
    incidents: [
      { key: "poly", date: "2021-08", usd: 611, kind: "hack", inc: "poly" },
      { key: "acala", date: "2022-08", kind: "bug" },
    ],
    thesis: ["cd2", "cd3"],
  },
  {
    id: "optimistic",
    color: "#ff8f42",
    glyph: "👁",
    Scene: OptimisticScene,
    trust: 3,
    general: 5,
    speed: 1,
    cost: 4,
    extensible: 4,
    tri: [0.3, 0.36, 0.34],
    incidents: [
      { key: "nomad", date: "2022-08", usd: 190, kind: "hack", inc: "nomad" },
      { key: "rainbow", date: "2022-05/08", kind: "foiled" },
    ],
    thesis: ["cd2", "cd3"],
  },
];

export const MOD_COLOR: Record<ModId, string> = { cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42" };
