// Diễn biến từng bước của các sự cố (đơn giản hóa cho người ngoài lĩnh vực) và điểm mà công cụ của luận án can thiệp.
// Văn bản nằm trong i18n: inc.story.<id>.steps[i], inc.story.<id>.block, inc.story.<id>.outcome.

export type StepKind = "keys" | "forge" | "accept" | "mint" | "drain" | "upgrade" | "hijack" | "copy" | "late";
export type Step = { kind: StepKind; n?: number; w?: number }; // n: số khóa bị chiếm thêm (keys); w: tỉ trọng tài sản bị rút (drain)
export type Story = {
  id: string;
  validators: number; // số validator / guardian / chữ ký minh họa
  steps: Step[];
  // bước công cụ của luận án can thiệp. CĐ1/CĐ2 ngăn ngay tại bước đó; CĐ3 giám sát nên bước đó vẫn xảy ra
  // (được quan sát) rồi các bước sau bị chặn nhờ phản ứng R4/R5.
  // keys: số khóa kẻ tấn công vẫn chiếm được khi có công cụ (bị lộ nhưng không đủ ngưỡng).
  block: { step: number; by: "cd1" | "cd2" | "cd3"; keys?: number };
};

export const STORIES: Record<string, Story> = {
  ronin: { id: "ronin", validators: 9, steps: [{ kind: "keys", n: 4 }, { kind: "keys", n: 1 }, { kind: "forge" }, { kind: "drain" }, { kind: "late" }], block: { step: 1, by: "cd1" } },
  wormhole: { id: "wormhole", validators: 7, steps: [{ kind: "forge" }, { kind: "accept" }, { kind: "mint" }, { kind: "drain" }], block: { step: 1, by: "cd1" } },
  nomad: { id: "nomad", validators: 3, steps: [{ kind: "upgrade" }, { kind: "forge" }, { kind: "drain" }, { kind: "copy" }], block: { step: 0, by: "cd2" } },
  poly: { id: "poly", validators: 4, steps: [{ kind: "forge" }, { kind: "hijack" }, { kind: "accept" }, { kind: "drain" }], block: { step: 1, by: "cd2" } },
  qubit: { id: "qubit", validators: 3, steps: [{ kind: "forge" }, { kind: "accept" }, { kind: "mint" }, { kind: "drain" }], block: { step: 1, by: "cd2" } },
  harmony: { id: "harmony", validators: 5, steps: [{ kind: "keys", n: 2 }, { kind: "forge" }, { kind: "drain" }], block: { step: 0, by: "cd1", keys: 2 } },
  bnb: { id: "bnb", validators: 5, steps: [{ kind: "forge" }, { kind: "accept" }, { kind: "mint" }, { kind: "drain" }], block: { step: 1, by: "cd1" } },
  multichain: { id: "multichain", validators: 3, steps: [{ kind: "keys", n: 3 }, { kind: "drain" }, { kind: "late" }], block: { step: 0, by: "cd1", keys: 1 } },
  orbit: { id: "orbit", validators: 10, steps: [{ kind: "keys", n: 7 }, { kind: "forge" }, { kind: "drain", w: 0.15 }, { kind: "drain", w: 0.85 }], block: { step: 2, by: "cd3" } },
};
