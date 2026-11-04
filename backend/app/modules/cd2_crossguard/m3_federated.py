"""M3 · Học liên kết bảo toàn riêng tư — FedVuln toy (numpy).

- 5 client giữ dữ liệu riêng, phân bố nhãn non-IID theo Dirichlet(α).
- Mô hình: hồi quy softmax trên đặc trưng fused của M2.
- DP-SGD: gradient từng mẫu được cắt chuẩn ≤ C, cộng nhiễu Gaussian N(0, σ²C²), rồi lấy trung bình.
- Kế toán riêng tư: "ước lượng toy" kiểu moments accountant ε(t) ≈ q·√(t·log(1/δ)) / σ
  (q tính như thể mỗi client giữ VIRTUAL_RECORDS bản ghi — dữ liệu demo quá nhỏ cho DP thật);
  σ được chọn để ε đạt đúng mục tiêu ở vòng cuối → ε tăng đơn điệu theo vòng.
- Server tổng hợp FedAvg có trọng số theo số mẫu (luận án: DAA).
"""
from __future__ import annotations

import math

import numpy as np

from .dataset import dataset
from .m2_fewshot import fused_features
from .samples import CLASSES

DELTA = 1e-5
CLIP = 1.0
LR = 0.8
LOCAL_STEPS = 3
BATCH = 16
VIRTUAL_RECORDS = 400  # mỗi client "đại diện" cho 400 bản ghi khi tính tỉ lệ lấy mẫu q (ước lượng toy)


def _softmax(Z: np.ndarray) -> np.ndarray:
    Z = Z - Z.max(1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(1, keepdims=True)


def _data():
    X, y = dataset()
    F = fused_features(X)
    F = np.hstack([F, np.ones((len(F), 1))])  # bias
    return F, np.array(y)


_CACHE: dict = {}


def data():
    if "d" not in _CACHE:
        _CACHE["d"] = _data()
    return _CACHE["d"]


def split(alpha: float, clients: int, seed: int = 0):
    F, y = data()
    rng = np.random.default_rng(seed)
    idx = rng.permutation(len(y))
    test = idx[: len(y) // 4]
    train = idx[len(y) // 4:]
    parts: list[list[int]] = [[] for _ in range(clients)]
    for c in range(len(CLASSES)):
        ids = train[y[train] == c]
        props = rng.dirichlet([alpha] * clients)
        cuts = (np.cumsum(props) * len(ids)).astype(int)[:-1]
        for k, chunk in enumerate(np.split(ids, cuts)):
            parts[k].extend(chunk.tolist())
    return [np.array(p, dtype=int) for p in parts], test


def sigma_for(eps: float, q: float, rounds: int) -> float:
    steps = rounds * LOCAL_STEPS
    return q * math.sqrt(steps * math.log(1 / DELTA)) / eps


def eps_at(sigma: float, q: float, steps: int) -> float:
    return q * math.sqrt(steps * math.log(1 / DELTA)) / sigma


def _per_sample_grads(W: np.ndarray, X: np.ndarray, y: np.ndarray) -> np.ndarray:
    P = _softmax(X @ W)
    P[np.arange(len(y)), y] -= 1.0
    return X[:, :, None] * P[:, None, :]  # (n, d, c)


def _eval(W, X, y):
    P = _softmax(X @ W)
    loss = float(-np.log(P[np.arange(len(y)), y] + 1e-12).mean())
    acc = float((P.argmax(1) == y).mean())
    return acc, loss


def run_fl(rounds: int = 10, clients: int = 5, epsilon: float | None = 1.0, alpha: float = 0.5, seed: int = 0) -> dict:
    """Chạy FL; epsilon=None → không DP (baseline). Trả số liệu theo vòng + tóm tắt client."""
    F, y = data()
    parts, test = split(alpha, clients, seed)
    rng = np.random.default_rng(seed + 1)
    d, c = F.shape[1], len(CLASSES)
    W = np.zeros((d, c))
    n_train = sum(len(p) for p in parts)
    q = BATCH / VIRTUAL_RECORDS
    sigma = sigma_for(epsilon, q, rounds) if epsilon else 0.0
    history = []
    for r in range(1, rounds + 1):
        updates, weights, pre, post = [], [], [], []
        for p in parts:
            if len(p) == 0:
                continue
            Wk = W.copy()
            for _ in range(LOCAL_STEPS):
                b = rng.choice(p, size=min(BATCH, len(p)), replace=False)
                G = _per_sample_grads(Wk, F[b], y[b])
                norms = np.sqrt((G**2).sum(axis=(1, 2)))
                pre.append(float(norms.mean()))
                if epsilon:
                    G = G / np.maximum(1.0, norms / CLIP)[:, None, None]
                    post.append(float(np.sqrt((G**2).sum(axis=(1, 2))).max()))
                    g = (G.sum(0) + rng.normal(0, sigma * CLIP, size=G.shape[1:])) / len(b)
                else:
                    post.append(float(norms.max()))
                    g = G.mean(0)
                Wk -= LR * g
            updates.append(Wk)
            weights.append(len(p))
        wts = np.array(weights, float) / sum(weights)
        W = sum(w * u for w, u in zip(wts, updates))
        acc, loss = _eval(W, F[test], y[test])
        history.append(
            {
                "round": r,
                "accuracy": round(acc, 4),
                "loss": round(loss, 4),
                "epsilon": round(eps_at(sigma, q, r * LOCAL_STEPS), 4) if epsilon else None,
                "grad_norm_pre": round(float(np.mean(pre)), 4),
                "grad_norm_post": round(float(np.max(post)), 4),
            }
        )
    client_info = [
        {"client": f"C{i + 1}", "samples": int(len(p)), "label_hist": [int((y[p] == k).sum()) for k in range(c)]} for i, p in enumerate(parts)
    ]
    return {
        "rounds": rounds,
        "clients": client_info,
        "epsilon_target": epsilon,
        "alpha": alpha,
        "sigma": round(sigma, 4),
        "clip": CLIP,
        "delta": DELTA,
        "sampling_rate": round(q, 4),
        "history": history,
        "final_accuracy": history[-1]["accuracy"],
    }


def _avg(runs: list[dict]) -> dict:
    """Trung bình theo vòng trên nhiều seed (giảm dao động do nhiễu DP trên dữ liệu nhỏ)."""
    out = dict(runs[0])
    hist = []
    for r_i, h0 in enumerate(runs[0]["history"]):
        h = dict(h0)
        for key in ("accuracy", "loss", "grad_norm_pre"):
            h[key] = round(float(np.mean([r["history"][r_i][key] for r in runs])), 4)
        hist.append(h)
    out["history"] = hist
    out["final_accuracy"] = hist[-1]["accuracy"]
    return out


def compare(rounds: int, epsilon: float | None, alpha: float, seeds: int = 4) -> dict:
    """Chạy DP và baseline không-DP (trung bình nhiều seed) để so sánh."""
    dp = _avg([run_fl(rounds, 5, epsilon, alpha, seed=s) for s in range(seeds)])
    base = _avg([run_fl(rounds, 5, None, alpha, seed=s) for s in range(seeds)])
    return {**dp, "seeds": seeds, "baseline": [{"round": h["round"], "accuracy": h["accuracy"]} for h in base["history"]], "baseline_final": base["final_accuracy"]}
