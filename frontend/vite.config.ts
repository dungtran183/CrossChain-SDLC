import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE: đường dẫn gốc khi deploy GitHub Pages (vd "/CrossChain-SDLC/"); local để "/".
// VITE_MODE=replay (file .env.replay): đọc kịch bản JSON trong public/replays, không cần backend.
// VITE_API_BASE: URL backend khi frontend và backend khác origin (mặc định cùng origin / proxy dev).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = {
    "/api": "http://localhost:8000",
    "/ws": { target: "ws://localhost:8000", ws: true },
  };
  return {
    base: env.VITE_BASE || "/",
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Tách thư viện lớn thành chunk riêng → trang chủ tải nhanh, cache tốt giữa các module.
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion"],
            charts: ["recharts"],
            flow: ["@xyflow/react"],
          },
        },
      },
    },
  };
});
