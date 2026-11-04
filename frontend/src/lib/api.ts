// Client API dùng chung cho mọi module.
// - live:   gọi backend FastAPI qua /api (Vite proxy khi dev, hoặc VITE_API_BASE).
// - replay: trả lời request từ file ghi sẵn public/replays/<module>/<scenario>.json (GitHub Pages).
//           File do `python -m app.modules.<m>.demo --export` sinh ra (định dạng "api-calls/v1"),
//           nên giao diện ở replay chạy y hệt live, chỉ không có tính toán thật.

export const MODE: "live" | "replay" = import.meta.env.VITE_MODE === "replay" ? "replay" : "live";
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

async function readError(r: Response, what: string): Promise<ApiError> {
  let detail = "";
  try {
    const j = await r.json();
    detail = typeof j?.detail === "string" ? j.detail : JSON.stringify(j?.detail ?? j);
  } catch {
    /* body không phải JSON */
  }
  return new ApiError(`${r.status} ${detail || r.statusText} — ${what}`, r.status);
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw await readError(r, `GET ${path}`);
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw await readError(r, `POST ${path}`);
  return r.json() as Promise<T>;
}

// ------------------------------------------------------------------ replay
export type ReplayCall = { method: "GET" | "POST"; path: string; body: unknown; response: unknown; status?: number };
export type ReplayFile = {
  module: string;
  scenario: string;
  format: string;
  generated_by: string;
  generated_at?: string;
  calls: ReplayCall[];
};

const replayCache = new Map<string, Promise<ReplayFile>>();

export function loadReplay(module: string, scenario: string): Promise<ReplayFile> {
  const key = `${module}/${scenario}`;
  if (!replayCache.has(key)) {
    const p = fetch(`${import.meta.env.BASE_URL}replays/${module}/${scenario}.json`).then((r) => {
      if (!r.ok) throw new ApiError(`Replay not found: ${key}`, 404);
      return r.json() as Promise<ReplayFile>;
    });
    p.catch(() => replayCache.delete(key));
    replayCache.set(key, p);
  }
  return replayCache.get(key)!;
}

/** Chuẩn hóa body để so khớp (bỏ khóa undefined, sắp xếp khóa). */
function canon(v: unknown): string {
  if (v === undefined || v === null) return "null";
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Bộ phát lại theo "dòng thời gian": POST tìm bản ghi khớp kế tiếp sau vị trí hiện tại (rồi quay vòng
 * từ đầu — hỗ trợ chạy lại sau reset); GET trả bản ghi khớp gần nhất trước vị trí hiện tại.
 * Không khớp body → dùng bản ghi cùng path; không có path → lỗi ReplayMiss.
 */
class ReplayPlayer {
  private pos = -1;
  constructor(private file: ReplayFile) {}

  private find(method: string, path: string, body: unknown): number {
    const calls = this.file.calls;
    const exact = (c: ReplayCall) => c.method === method && c.path === path && canon(c.body) === canon(body);
    const loose = (c: ReplayCall) => c.method === method && c.path.split("?")[0] === path.split("?")[0];
    const pathEq = (c: ReplayCall) => c.method === method && c.path === path;
    for (const pred of [exact, pathEq, loose]) {
      if (method === "GET") {
        for (let i = Math.min(this.pos, calls.length - 1); i >= 0; i--) if (pred(calls[i])) return i;
        for (let i = Math.max(0, this.pos + 1); i < calls.length; i++) if (pred(calls[i])) return i;
      } else {
        for (let i = this.pos + 1; i < calls.length; i++) if (pred(calls[i])) return i;
        for (let i = 0; i <= Math.min(this.pos, calls.length - 1); i++) if (pred(calls[i])) return i;
      }
    }
    return -1;
  }

  respond(method: "GET" | "POST", path: string, body: unknown): unknown {
    const i = this.find(method, path, body);
    if (i < 0) throw new ApiError(`Replay: no recording for ${method} ${path}`, 404);
    const call = this.file.calls[i];
    // Chỉ các thao tác làm đổi trạng thái (phản hồi có "state"/"txs") mới dời con trỏ dòng thời gian;
    // các tính toán thuần (vd Shamir, ABE) có thể gọi bất kỳ lúc nào.
    const r = call.response as Record<string, unknown> | null;
    const stateful = !!r && typeof r === "object" && ("state" in r || "txs" in r);
    if (method === "POST" && stateful) this.pos = i;
    if (call.status && call.status >= 400) {
      const d = (call.response as { detail?: unknown })?.detail;
      throw new ApiError(`${call.status} ${typeof d === "string" ? d : JSON.stringify(d)} — ${method} ${path}`, call.status);
    }
    // Bản sao sâu để component không sửa nhầm dữ liệu ghi.
    return structuredClone(call.response);
  }

  hasCall(method: "GET" | "POST", path: string, body?: unknown): boolean {
    return this.file.calls.some((c) => c.method === method && c.path === path && (body === undefined || canon(c.body) === canon(body)));
  }
}

export type Client = {
  module: string;
  scenario: string;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  /** Replay: request này có trong bản ghi không (để làm mờ nút không khả dụng). Live: luôn true. */
  available(method: "GET" | "POST", path: string, body?: unknown): Promise<boolean>;
};

/**
 * Tạo client cho một module. `scenario` là tên file replay (bỏ qua ở live).
 * `latency` (ms) mô phỏng độ trễ mạng ở replay để animation tự nhiên.
 */
export function createClient(module: string, scenario: string, latency = 320): Client {
  if (MODE === "live") {
    return {
      module,
      scenario,
      get: apiGet,
      post: apiPost,
      available: async () => true,
    };
  }
  let player: Promise<ReplayPlayer> | null = null;
  const getPlayer = () => (player ??= loadReplay(module, scenario).then((f) => new ReplayPlayer(f)));
  return {
    module,
    scenario,
    async get<T>(path: string) {
      const p = await getPlayer();
      await sleep(latency * 0.4);
      return p.respond("GET", path, null) as T;
    },
    async post<T>(path: string, body?: unknown) {
      const p = await getPlayer();
      await sleep(latency);
      return p.respond("POST", path, body ?? null) as T;
    },
    async available(method, path, body) {
      try {
        return (await getPlayer()).hasCall(method, path, body);
      } catch {
        return false;
      }
    },
  };
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

/** URL WebSocket của backend (live). */
export function wsUrl(): string {
  const base = API_BASE || window.location.origin;
  return base.replace(/^http/, "ws") + "/ws";
}
