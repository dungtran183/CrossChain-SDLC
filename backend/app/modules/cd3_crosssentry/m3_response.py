"""M3 · Chọn phản ứng R0–R5 (R4/R5 cần con người phê duyệt) + G-surv (Gini) + điều chỉnh tham số.

R0 Observe · R1 Alert · R2 Throttle/Cap · R3 Confirmation threshold · R4 Isolate actor · R5 Pause bridge.
F(Θ) = w_d·U_det − w_g·G_surv − w_c·C_op.
"""
from __future__ import annotations

import numpy as np

LEVELS = ["R0", "R1", "R2", "R3", "R4", "R5"]
BASE_THRESHOLDS = [0.2, 0.4, 0.6, 0.75]  # ranh giới R0|R1|R2|R3|R4
HUMAN = {"R4", "R5"}


def level_for(r: float, value_at_risk: float = 0.0, scale: float = 1.0) -> str:
    th = [t * scale for t in BASE_THRESHOLDS]
    lv = sum(r >= t for t in th)
    if value_at_risk > 5000 and lv >= 2:  # tài sản lớn → nâng một bậc
        lv += 1
    return LEVELS[min(lv, 4)]


def gini(x) -> float:
    a = np.sort(np.asarray(x, dtype=float))
    n = len(a)
    if n == 0 or a.sum() == 0:
        return 0.0
    idx = np.arange(1, n + 1)
    return float((2 * (idx * a).sum()) / (n * a.sum()) - (n + 1) / n)


def lorenz(x) -> list[dict]:
    a = np.sort(np.asarray(x, dtype=float))
    if a.sum() == 0:
        return [{"p": round(i / max(1, len(a)), 4), "l": round(i / max(1, len(a)), 4)} for i in range(len(a) + 1)]
    cum = np.concatenate([[0], np.cumsum(a)]) / a.sum()
    return [{"p": round(i / len(a), 4), "l": round(float(c), 4)} for i, c in enumerate(cum)]


def tune(series: dict[str, list[float]], attackers: set[str], w_d: float, w_g: float, w_c: float) -> dict:
    """Quét hệ số ngưỡng θ trên lịch sử r(t) đã ghi; trả đường F(θ) và θ tốt nhất."""
    curve = []
    keys = list(series)
    for theta in np.round(np.linspace(0.5, 1.6, 12), 3):
        impact: dict[str, float] = {}
        detected = false_pos = 0
        for k in keys:
            lv = [LEVELS.index(level_for(r, scale=float(theta))) for r in series[k]]
            a = k.split("|")[0]
            impact[a] = impact.get(a, 1.0) + float(np.mean(lv))
            hit = any(v >= 2 for v in lv)
            actor = k.split("|")[0]
            if actor in attackers:
                detected += int(hit)
            else:
                false_pos += int(hit)
        n_att = max(1, len({k.split('|')[0] for k in keys} & attackers))
        n_ben = max(1, len({k.split('|')[0] for k in keys} - attackers))
        u = min(1.0, detected / n_att)
        g = gini(list(impact.values()))
        c = false_pos / max(1, len(keys)) * (len(keys) / n_ben)
        c = min(1.0, c)
        f = w_d * u - w_g * g - w_c * c
        curve.append({"theta": float(theta), "U_det": round(u, 4), "G_surv": round(g, 4), "C_op": round(c, 4), "F": round(f, 4)})
    best = max(curve, key=lambda p: p["F"])
    return {"weights": {"w_d": w_d, "w_g": w_g, "w_c": w_c}, "curve": curve, "best": best}
