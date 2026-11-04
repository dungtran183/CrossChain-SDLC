"""M2 · Hợp nhất bằng chứng Dempster–Shafer + CRS (rủi ro theo cặp tác nhân–tuyến).

Khung phân biệt Θ = {N (normal), A (anomalous)}; khối niềm tin m({N}), m({A}), m(Θ).
- dempster_combine(m1, m2): quy tắc Dempster, K = xung đột (m1(N)·m2(A) + m1(A)·m2(N)).
- bel_pl(m): Bel(A) = m(A), Pl(A) = m(A) + m(Θ).
- CRS: r ← λ·r + (1−λ)·s_t; nếu Bel(A) > τ thì cộng bước nhảy J·Bel(A); không có bằng chứng → r ← λ·r.
"""
from __future__ import annotations

from dataclasses import dataclass, field

Mass = dict[str, float]  # khóa "N", "A", "T" (Θ)


def mass(n: float, a: float) -> Mass:
    n, a = max(0.0, n), max(0.0, a)
    s = n + a
    if s > 1:
        n, a = n / s, a / s
    return {"N": n, "A": a, "T": max(0.0, 1.0 - n - a)}


def dempster_combine(m1: Mass, m2: Mass) -> tuple[Mass, float]:
    """Trả (m kết hợp, K). K = 1 → xung đột hoàn toàn (trả Θ)."""
    k = m1["N"] * m2["A"] + m1["A"] * m2["N"]
    if k >= 1.0 - 1e-12:
        return {"N": 0.0, "A": 0.0, "T": 1.0}, 1.0
    n = (m1["N"] * m2["N"] + m1["N"] * m2["T"] + m1["T"] * m2["N"]) / (1 - k)
    a = (m1["A"] * m2["A"] + m1["A"] * m2["T"] + m1["T"] * m2["A"]) / (1 - k)
    t = (m1["T"] * m2["T"]) / (1 - k)
    return {"N": n, "A": a, "T": t}, k


def bel_pl(m: Mass) -> tuple[float, float]:
    return m["A"], m["A"] + m["T"]


def round_mass(m: Mass) -> Mass:
    return {k: round(v, 4) for k, v in m.items()}


@dataclass
class CRS:
    """Trạng thái rủi ro r_{v,c}(t) theo (tác nhân, tuyến)."""

    lam: float = 0.85
    jump: float = 0.35
    tau: float = 0.55
    r: dict[tuple[str, str], float] = field(default_factory=dict)
    history: dict[tuple[str, str], list[float]] = field(default_factory=dict)
    cumulative: dict[tuple[str, str], list[float]] = field(default_factory=dict)  # điểm tích lũy truyền thống
    trad_history: dict[tuple[str, str], list[float]] = field(default_factory=dict)

    def update(self, key: tuple[str, str], bel_a: float | None) -> float:
        r = self.r.get(key, 0.0)
        if bel_a is None:
            r = self.lam * r
        else:
            r = self.lam * r + (1 - self.lam) * bel_a
            if bel_a > self.tau:
                r = min(1.0, r + self.jump * bel_a)
            self.cumulative.setdefault(key, []).append(bel_a)
        self.r[key] = r
        return r

    def step(self, observed: dict[tuple[str, str], float], keys: list[tuple[str, str]]) -> None:
        """Cập nhật mọi khóa đã biết (khóa không có bằng chứng thì suy giảm) và ghi lịch sử."""
        for key in set(keys) | set(observed):
            self.update(key, observed.get(key))
            self.history.setdefault(key, []).append(round(self.r[key], 4))
            self.trad_history.setdefault(key, []).append(round(self.traditional(key), 4))

    def traditional(self, key: tuple[str, str]) -> float:
        """Điểm tích lũy kiểu cũ: trung bình Bel(A) trên toàn lịch sử — phản ứng chậm với slow-burn."""
        xs = self.cumulative.get(key, [])
        return sum(xs) / len(xs) if xs else 0.0
