"""CD3 · CrossSentry — giám sát bất thường & đánh giá tin cậy thích ứng sau triển khai (M1–M3).

Đặc tả: docs/modules/CD3.md — hiện thực ở Phase P4.
"""
from .router import router

MODULE = {
    "id": "cd3",
    "package": "cd3_crosssentry",
    "name": "CrossSentry",
    "sdlc_phase": "Secure Operations · Optimization",
    "status": "planned",
    "phase": "P4",
}

__all__ = ["MODULE", "router"]
