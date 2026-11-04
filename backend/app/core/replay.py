"""Ghi kịch bản replay cho chế độ GitHub Pages.

`Recorder` bọc FastAPI TestClient: mỗi lời gọi get/post được ghi {method, path, body, response}.
Frontend ở VITE_MODE=replay trả lời đúng các request đó từ file JSON → mọi màn hình chạy như live.
Dùng trong `python -m app.modules.<m>.demo --export`.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

REPLAY_DIR = Path(__file__).resolve().parents[3] / "frontend" / "public" / "replays"


class Recorder:
    def __init__(self, app: Any, module: str, scenario: str, generated_by: str) -> None:
        self.client = TestClient(app)
        self.module = module
        self.scenario = scenario
        self.generated_by = generated_by
        self.calls: list[dict] = []

    def _record(self, method: str, path: str, body: Any, r, allow_error: bool) -> Any:
        if r.status_code >= 400 and not allow_error:
            raise RuntimeError(f"{method} {path} → {r.status_code}: {r.text[:300]}")
        data = r.json()
        call = {"method": method, "path": path, "body": body, "response": data}
        if r.status_code >= 400:
            call["status"] = r.status_code  # frontend ném lỗi như live
        self.calls.append(call)
        return data

    def get(self, path: str, allow_error: bool = False) -> Any:
        return self._record("GET", path, None, self.client.get(path), allow_error)

    def post(self, path: str, body: Any = None, allow_error: bool = False) -> Any:
        r = self.client.post(path, json=body) if body is not None else self.client.post(path)
        return self._record("POST", path, body, r, allow_error)

    def dump(self) -> dict:
        return {
            "module": self.module,
            "scenario": self.scenario,
            "format": "api-calls/v1",
            "lang_neutral": True,
            "generated_by": self.generated_by,
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "calls": self.calls,
        }

    def save(self, out_dir: Path | None = None) -> Path:
        out = (out_dir or REPLAY_DIR / self.module) / f"{self.scenario}.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(self.dump(), ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        return out
