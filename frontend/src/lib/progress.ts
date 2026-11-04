// Mức độ trình diễn: mỗi thao tác quan trọng trong module là một nội dung trình diễn.
// Lưu trong localStorage của trình duyệt (chỉ người xem hiện tại); bản đồ Secure SDLC đọc để hiện tiến độ.
import { useEffect, useState } from "react";

export type ModuleId = "cd1" | "cd2" | "cd3";

export const QUESTS: Record<ModuleId, string[]> = {
  cd1: ["setup", "issue", "prove", "accepted", "tamper", "revoke", "shamir", "abe"],
  cd2: ["m1", "m2", "m3", "m4", "exploit", "fixed"],
  cd3: ["run", "attack", "approve", "pause", "tune"],
};

/** Năm giai đoạn Secure SDLC ↔ module + nhiệm vụ thuộc giai đoạn đó + tab mở khi vào màn. */
export const PHASES: { n: number; module: ModuleId; quests: string[]; tab?: string }[] = [
  { n: 1, module: "cd1", quests: QUESTS.cd1 },
  { n: 2, module: "cd2", quests: ["m1", "m2", "m3"], tab: "m1" },
  { n: 3, module: "cd2", quests: ["m4", "exploit", "fixed"], tab: "m4" },
  { n: 4, module: "cd3", quests: ["run", "attack", "approve", "pause"], tab: "m2" },
  { n: 5, module: "cd3", quests: ["tune"], tab: "m3" },
];

const KEY = "xchain-progress";
const EVENT = "xchain-quest";

function read(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function write(s: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    /* storage bị chặn — tiến độ chỉ tồn tại trong phiên */
  }
}

let memory: Set<string> | null = null;
const state = () => (memory ??= read());

/** Đánh dấu hoàn thành nhiệm vụ `module.quest` (vd "cd1.setup"); phát sự kiện nếu là lần đầu. */
export function complete(module: ModuleId, quest: string) {
  const id = `${module}.${quest}`;
  const s = state();
  if (s.has(id)) return;
  s.add(id);
  write(s);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

export function resetProgress() {
  memory = new Set();
  write(memory);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

export function onQuest(fn: (id: string | null) => void) {
  const h = (e: Event) => fn((e as CustomEvent<string | null>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** Hook: tập nội dung đã trình diễn, tự cập nhật khi có nội dung mới. */
export function useProgress() {
  const [done, setDone] = useState<Set<string>>(() => new Set(state()));
  useEffect(() => onQuest(() => setDone(new Set(state()))), []);
  const total = Object.values(QUESTS).flat().length;
  return {
    done,
    total,
    has: (m: ModuleId, q: string) => done.has(`${m}.${q}`),
    moduleDone: (m: ModuleId) => QUESTS[m].filter((q) => done.has(`${m}.${q}`)).length,
  };
}
