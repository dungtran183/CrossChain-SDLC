/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: { 950: "#060816", 900: "#0b1024", 800: "#121a36", 700: "#1c2650" },
      },
      boxShadow: {
        glow: "0 0 40px -10px var(--tw-shadow-color)",
        "glow-lg": "0 0 80px -12px var(--tw-shadow-color)",
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
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
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
  plugins: [],
};
