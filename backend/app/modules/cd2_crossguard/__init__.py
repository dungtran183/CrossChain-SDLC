"""CD2 · CrossGuard — kiểm toán hợp đồng thông minh liên chuỗi trước triển khai (M1–M4).

Đặc tả: docs/modules/CD2.md — hiện thực ở Phase P3.
"""
from .router import router

MODULE = {
    "id": "cd2",
    "package": "cd2_crossguard",
    "name": "CrossGuard",
    "sdlc_phase": "Secure Coding · Testing & Audit",
    "status": "ready",
    "phase": "P3",
}

__all__ = ["MODULE", "router"]
