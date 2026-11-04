"""CĐ1 · Π_univ — xác thực ngữ nghĩa liên chuỗi bảo toàn riêng tư (ZKP + TSS + CP-ABE, toy).

Đặc tả: docs/modules/CD1.md — hiện thực ở Phase P2.
"""
from .router import router

MODULE = {
    "id": "cd1",
    "package": "cd1_univ",
    "name": "Π_univ",
    "sdlc_phase": "Secure Design",
    "status": "planned",
    "phase": "P2",
}

__all__ = ["MODULE", "router"]
