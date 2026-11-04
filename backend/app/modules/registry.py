"""Đăng ký module. Thêm/bớt module = thêm/bớt một dòng ở MODULES."""
from __future__ import annotations

from importlib import import_module

MODULES: list[str] = [
    "cd1_univ",
    "cd2_crossguard",
    "cd3_crosssentry",
]


def load_modules():
    """Trả về list các package module (mỗi package có `MODULE` metadata và `router`)."""
    return [import_module(f"app.modules.{name}") for name in MODULES]
