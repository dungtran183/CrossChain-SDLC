// Đăng ký module cho shell. Thêm/bớt module = thêm/bớt một dòng trong MODULES.
import type { ComponentType } from "react";
import Cd1Page from "./cd1";
import Cd2Page from "./cd2";
import Cd3Page from "./cd3";

export type ModuleDef = {
  id: "cd1" | "cd2" | "cd3";
  path: string;
  /** Lớp gradient Tailwind cho màu nhận diện module. */
  accent: string;
  /** Ký hiệu ngắn hiển thị trên sidebar/thẻ. */
  glyph: string;
  phase: string;
  Page: ComponentType;
};

export const MODULES: ModuleDef[] = [
  { id: "cd1", path: "/cd1", accent: "from-cyan-400 to-teal-500", glyph: "Π", phase: "P2", Page: Cd1Page },
  { id: "cd2", path: "/cd2", accent: "from-violet-500 to-indigo-500", glyph: "CG", phase: "P3", Page: Cd2Page },
  { id: "cd3", path: "/cd3", accent: "from-amber-400 to-rose-500", glyph: "CS", phase: "P4", Page: Cd3Page },
];
