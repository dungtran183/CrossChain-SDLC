"""Hợp đồng mẫu của CĐ2: đọc trực tiếp mã nguồn trong contracts/src/cd2 (dùng chung với pipeline biên dịch)."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parents[4] / "contracts" / "src" / "cd2"
LABELS = json.loads((Path(__file__).parent / "data" / "labels.json").read_text(encoding="utf-8"))
CATEGORIES: dict = LABELS["categories"]
CLASSES: list[str] = list(CATEGORIES)


@lru_cache(maxsize=None)
def source(sample_id: str) -> str:
    path = SRC_DIR / f"{sample_id}.sol"
    if not path.exists():
        raise KeyError(sample_id)
    return path.read_text(encoding="utf-8")


def meta(sample_id: str) -> dict:
    for s in LABELS["samples"]:
        if s["id"] == sample_id:
            return s
    raise KeyError(sample_id)


def bug_lines(src: str) -> list[int]:
    """Dòng (1-based) có chú thích BUG — vùng mã rủi ro để highlight."""
    return [i + 1 for i, line in enumerate(src.splitlines()) if "BUG" in line]


def list_samples() -> list[dict]:
    out = []
    for s in LABELS["samples"]:
        src = source(s["id"])
        out.append({**s, "lines": len(src.splitlines()), "vulnerable": s["category"] != "safe", "category_label": CATEGORIES[s["category"]]})
    return out
