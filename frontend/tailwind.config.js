/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

// Theme sáng/tối bằng biến CSS (kênh RGB) → mọi lớp có sẵn như `text-slate-300`, `border-white/10`,
// `bg-surface-1/60` tự đổi theo `html[data-theme]`. Theme sáng lấy token từ blockchainist.net:
// giấy kem, mực đen, viền 2px, bóng cứng.
const rgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
};
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const ACCENTS = ["cyan", "teal", "violet", "indigo", "amber", "rose", "emerald", "sky", "fuchsia", "orange", "red", "lime", "pink", "yellow", "purple", "blue", "green"];

const LIGHT_SLATE = {
  50: "#16140f", 100: "#16140f", 200: "#24211b", 300: "#3a362e", 400: "#5f594e", 500: "#6d675c",
  600: "#8a8476", 700: "#b4ad9e", 800: "#d9d2c3", 900: "#efebe1", 950: "#f6f3ec",
};
const SURFACE = {
  dark: { 0: "#060816", 1: "#0b1024", 2: "#121a36", 3: "#1c2650" },
  light: { 0: "#f6f3ec", 1: "#fffdf8", 2: "#efebe1", 3: "#d9d2c3" },
};

function vars(mode) {
  const v = {};
  v["--c-white"] = rgb(mode === "dark" ? "#ffffff" : "#16140f");
  for (const s of SHADES) v[`--c-slate-${s}`] = rgb(mode === "dark" ? colors.slate[s] : LIGHT_SLATE[s]);
  for (const [k, hex] of Object.entries(SURFACE[mode])) v[`--c-surface-${k}`] = rgb(hex);
  // Sắc nhạt (50–300) dùng làm màu chữ trên nền tối → ở nền sáng thay bằng sắc đậm để đủ tương phản.
  const lightMap = { 50: 900, 100: 800, 200: 700, 300: 700 };
  for (const a of ACCENTS) for (const s of SHADES) v[`--c-${a}-${s}`] = rgb(colors[a][mode === "light" && lightMap[s] ? lightMap[s] : s]);
  return v;
}

const varColor = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const scale = (name) => Object.fromEntries(SHADES.map((s) => [s, varColor(`${name}-${s}`)]));

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        display: ["Unbounded", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        white: varColor("white"),
        slate: scale("slate"),
        ...Object.fromEntries(ACCENTS.map((a) => [a, scale(a)])),
        surface: { 0: varColor("surface-0"), 1: varColor("surface-1"), 2: varColor("surface-2"), 3: varColor("surface-3") },
        ink: { 950: "#0b0a07", 900: "#16140f", 800: "#121a36", 700: "#1c2650" },
        paper: "#f6f3ec",
        brand: { yellow: "#ffc730", orange: "#ff8f42", red: "#ff4b4b", pink: "#ff4fa3", violet: "#a26bff", blue: "#3d8bff", teal: "#00c9b0", lime: "#b6ec2c" },
      },
      boxShadow: {
        glow: "0 0 40px -10px var(--tw-shadow-color)",
        "glow-lg": "0 0 80px -12px var(--tw-shadow-color)",
        hard: "4px 4px 0 rgb(var(--c-white))",
      },
      keyframes: {
        shimmer: { "0%": { transform: "translateX(-120%)" }, "100%": { transform: "translateX(220%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "0.7" }, "100%": { transform: "scale(1.8)", opacity: "0" } },
        "gradient-x": { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.25" } },
      },
      animation: {
        shimmer: "shimmer 2.2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        shake: "shake 0.45s ease-in-out",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        blink: "blink 1s ease-in-out infinite",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root, html[data-theme="dark"], .theme-dark': vars("dark"),
        'html[data-theme="light"]': vars("light"),
        // vùng luôn tối (khối mã, log) ngay cả ở theme sáng
        'html[data-theme="light"] .theme-dark': vars("dark"),
      });
    }),
  ],
};
