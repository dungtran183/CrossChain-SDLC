// Màu nhận diện module: CĐ1 cyan/teal · CĐ2 violet/indigo · CĐ3 amber/rose.
export type Accent = {
  grad: string;
  hex: string;
  hex2: string;
  rgb: string;
  text: string;
  bgSoft: string;
  border: string;
};

export const ACCENTS: Record<"cd1" | "cd2" | "cd3" | "core", Accent> = {
  cd1: { grad: "from-cyan-400 to-teal-500", hex: "#22d3ee", hex2: "#14b8a6", rgb: "34,211,238", text: "text-cyan-300", bgSoft: "bg-cyan-400/10", border: "border-cyan-400/40" },
  cd2: { grad: "from-violet-500 to-indigo-500", hex: "#8b5cf6", hex2: "#6366f1", rgb: "139,92,246", text: "text-violet-300", bgSoft: "bg-violet-500/10", border: "border-violet-400/40" },
  cd3: { grad: "from-amber-400 to-rose-500", hex: "#f59e0b", hex2: "#f43f5e", rgb: "245,158,11", text: "text-amber-300", bgSoft: "bg-amber-400/10", border: "border-amber-400/40" },
  core: { grad: "from-sky-400 to-fuchsia-500", hex: "#38bdf8", hex2: "#d946ef", rgb: "56,189,248", text: "text-sky-300", bgSoft: "bg-sky-400/10", border: "border-sky-400/40" },
};

/** Bảng màu biểu đồ dùng chung (đủ tương phản trên nền tối). */
export const CHART = {
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(148,163,184,0.6)",
  good: "#34d399",
  bad: "#fb7185",
  warn: "#fbbf24",
  neutral: "#94a3b8",
  series: ["#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#f472b6", "#60a5fa"],
};
