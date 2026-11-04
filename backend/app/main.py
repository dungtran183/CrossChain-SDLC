"""FastAPI entrypoint. Chạy: `cd backend && python -m uvicorn app.main:app --reload --port 8000`."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core import bus, chain_routes
from .modules.registry import load_modules

app = FastAPI(
    title="Cross-Chain Secure SDLC — Thesis Demo API",
    version="1.0.0",
    description="API của prototype luận án: CĐ1 Π_univ · CĐ2 CrossGuard · CĐ3 CrossSentry trên hai chuỗi EVM.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        *[o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

_modules = load_modules()
for _m in _modules:
    app.include_router(_m.router)
app.include_router(bus.router)
app.include_router(chain_routes.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": app.version}


@app.get("/api/modules")
def modules() -> list[dict]:
    return [m.MODULE for m in _modules]


# Tùy chọn: nếu đã `npm run build` thì backend phục vụ luôn giao diện (một cổng duy nhất, :8000).
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.is_dir() and os.environ.get("SERVE_FRONTEND", "1") != "0":
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="frontend")
