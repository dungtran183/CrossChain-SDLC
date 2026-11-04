// Dữ liệu các sự cố cầu nối tiêu biểu — dùng chung cho trang Sự cố thực tế và trang chủ.
export type ModId = "cd1" | "cd2" | "cd3";
export const COLOR: Record<ModId, string> = { cd1: "#22d3ee", cd2: "#8b5cf6", cd3: "#f59e0b" };

/** Tổn thất ước tính (triệu USD) theo các báo cáo công khai; `cat` = nhóm lỗi của CĐ2; `by` = chuyên đề phòng vệ. */
export const INCIDENTS: { id: string; name: string; date: string; loss: number; cat: string; by: ModId[]; demo: string }[] = [
  { id: "poly", name: "Poly Network", date: "2021-08", loss: 611, cat: "access_control", by: ["cd2", "cd3"], demo: "/cd2?tab=ex" },
  { id: "qubit", name: "Qubit Finance", date: "2022-01", loss: 80, cat: "bridge_logic", by: ["cd2"], demo: "/cd2?tab=m4" },
  { id: "wormhole", name: "Wormhole", date: "2022-02", loss: 326, cat: "message_verification", by: ["cd1", "cd2"], demo: "/cd1" },
  { id: "ronin", name: "Ronin Bridge", date: "2022-03", loss: 624, cat: "validator_oracle", by: ["cd1", "cd3"], demo: "/cd3" },
  { id: "harmony", name: "Harmony Horizon", date: "2022-06", loss: 100, cat: "validator_oracle", by: ["cd1", "cd3"], demo: "/cd1" },
  { id: "nomad", name: "Nomad Bridge", date: "2022-08", loss: 190, cat: "message_verification", by: ["cd2", "cd3"], demo: "/cd2?tab=ex" },
  { id: "bnb", name: "BNB Bridge", date: "2022-10", loss: 570, cat: "message_verification", by: ["cd1", "cd3"], demo: "/cd1" },
  { id: "multichain", name: "Multichain", date: "2023-07", loss: 126, cat: "access_control", by: ["cd1", "cd3"], demo: "/cd3" },
  { id: "orbit", name: "Orbit Bridge", date: "2024-01", loss: 81, cat: "validator_oracle", by: ["cd1", "cd3"], demo: "/cd3" },
];

/** Tổng tổn thất ước tính (triệu USD). */
export const TOTAL_LOSS = INCIDENTS.reduce((s, x) => s + x.loss, 0);
