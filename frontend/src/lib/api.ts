// Client API dùng chung cho mọi module.
// - live:   gọi backend FastAPI qua /api (Vite proxy khi dev).
// - replay: đọc kịch bản JSON tĩnh trong public/replays/<module>/<name>.json (GitHub Pages).

export const MODE: "live" | "replay" = import.meta.env.VITE_MODE === "replay" ? "replay" : "live";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — GET ${path}`);
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — POST ${path}`);
  return r.json() as Promise<T>;
}

export async function loadReplay<T>(module: string, name: string): Promise<T> {
  const r = await fetch(`${import.meta.env.BASE_URL}replays/${module}/${name}.json`);
  if (!r.ok) throw new Error(`Replay not found: ${module}/${name}`);
  return r.json() as Promise<T>;
}

export type Health = { status: string; version: string };

export async function checkHealth(): Promise<boolean> {
  if (MODE === "replay") return false;
  try {
    return (await apiGet<Health>("/api/health")).status === "ok";
  } catch {
    return false;
  }
}
