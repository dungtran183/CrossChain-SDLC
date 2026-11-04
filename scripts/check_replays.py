"""Kiểm tra các file replay cần cho GitHub Pages tồn tại và đúng định dạng api-calls/v1.

Chạy: python scripts/check_replays.py   (exit 1 nếu thiếu/hỏng) — dùng trong CI.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "replays"
REQUIRED = {
    "core": ["playground"],
    "cd1": ["credential-flow"],
    "cd2": ["audit-flow"],
    "cd3": ["normal", "slow_burn", "collusion", "replay", "delayed", "boosting", "oracle_skew", "flash_drain", "liveness"],
}

ok = True
for module, names in REQUIRED.items():
    for name in names:
        p = ROOT / module / f"{name}.json"
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
            assert d["module"] == module and d["format"] == "api-calls/v1", "bad header"
            assert d["calls"] and all({"method", "path", "response"} <= set(c) for c in d["calls"]), "bad calls"
            print(f"OK    {module}/{name}.json  {len(d['calls'])} calls  {p.stat().st_size // 1024} KB")
        except Exception as e:  # noqa: BLE001
            ok = False
            print(f"FAIL  {module}/{name}.json  {type(e).__name__}: {e}")
sys.exit(0 if ok else 1)
