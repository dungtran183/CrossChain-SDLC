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
      },
    },
  },
  plugins: [],
};
