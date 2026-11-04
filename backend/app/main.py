"""FastAPI entrypoint. Chạy: `cd backend && python -m uvicorn app.main:app --reload --port 8000`."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core import bus
from .modules.registry import load_modules

app = FastAPI(
    title="Cross-Chain Secure SDLC — Thesis Demo API",
    version="0.1.0",
    description="Prototype minh họa — không phải kết quả thực nghiệm của luận án.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_modules = load_modules()
for _m in _modules:
    app.include_router(_m.router)
app.include_router(bus.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": app.version}


@app.get("/api/modules")
def modules() -> list[dict]:
    return [m.MODULE for m in _modules]
