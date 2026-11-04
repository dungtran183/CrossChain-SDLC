"""Nạp ABI/bytecode đã biên dịch sẵn từ contracts/artifacts/<Name>.json."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

ARTIFACTS_DIR = Path(__file__).resolve().parents[3] / "contracts" / "artifacts"


@lru_cache(maxsize=None)
def load_artifact(name: str) -> dict:
    path = ARTIFACTS_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Artifact '{name}' not found at {path}. Run: cd contracts && npm run compile")
    return json.loads(path.read_text(encoding="utf-8"))


def list_artifacts() -> list[str]:
    return sorted(p.stem for p in ARTIFACTS_DIR.glob("*.json"))
