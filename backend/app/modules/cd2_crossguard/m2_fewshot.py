"""M2 · Lõi phát hiện ngữ nghĩa — bản tượng trưng.

Luận án: Unitary Tensor Encoder + Neural ODE + attention fusion + mạng prototype few-shot.
Demo:   3 "nguồn" (view) → vector:
          text        : TF-IDF token (≈ CodeBERT) → TruncatedSVD 16 chiều
          structure   : thống kê đồ thị M1 (chuẩn hóa)
          interaction : cờ thao tác liên chuỗi / guard của M1
        Attention: trọng số α_v = softmax(β · margin_v) — view nào phân tách prototype rõ hơn cho mẫu này
        thì được tin hơn → E_fused = concat(√α_v · z_v). Prototype phân cấp: mỗi lớp có thể có nhiều
        dạng con (vd bridge_logic = ngưỡng yếu | reentrancy); prototype = trung bình k mẫu hỗ trợ mỗi dạng con,
        khoảng cách lớp = min trên các dạng con, xác suất lớp = tổng softmax(−d / T) của các dạng con.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

from . import m1_repr
from .dataset import dataset, subclasses
from .samples import CLASSES

VIEWS = ("text", "structure", "interaction")
STRUCT_KEYS = ["functions", "external_functions", "state_vars", "events", "modifiers", "guards", "edges", "writes", "calls"]
INTER_KEYS = [k for k, _ in m1_repr.INTERACTIONS]
TEMPERATURE = 0.2
BETA = 6.0


def _tok(src: str) -> list[str]:
    return m1_repr.tokens(src)


class Encoder:
    """Bộ mã hóa 3 view, học trên CrossChain-VulnDB tổng hợp (seed cố định)."""

    def __init__(self) -> None:
        X, _ = dataset()
        self.tfidf = TfidfVectorizer(tokenizer=_tok, lowercase=False, token_pattern=None, min_df=2, sublinear_tf=True)
        T = self.tfidf.fit_transform(X)
        self.svd = TruncatedSVD(n_components=16, random_state=0).fit(T)
        S = np.array([self._struct_raw(x) for x in X], dtype=float)
        self.s_mu, self.s_sd = S.mean(0), S.std(0) + 1e-6

    def _struct_raw(self, src: str) -> list[float]:
        st = m1_repr.structure_graph(src)["stats"]
        return [float(st[k]) for k in STRUCT_KEYS]

    def views(self, src: str) -> dict[str, np.ndarray]:
        t = self.svd.transform(self.tfidf.transform([src]))[0]
        s = (np.array(self._struct_raw(src)) - self.s_mu) / self.s_sd
        flags = m1_repr.interaction_flags(src)
        i = np.array([1.0 if flags[k] else 0.0 for k in INTER_KEYS])
        out = {"text": t, "structure": s, "interaction": i}
        return {k: v / (np.linalg.norm(v) + 1e-9) for k, v in out.items()}


@lru_cache(maxsize=1)
def encoder() -> Encoder:
    return Encoder()


@lru_cache(maxsize=1)
def corpus_views() -> tuple[dict[str, np.ndarray], np.ndarray]:
    X, y = dataset()
    enc = encoder()
    vs = [enc.views(x) for x in X]
    return {v: np.stack([d[v] for d in vs]) for v in VIEWS}, np.array(y)


def _subs() -> tuple[list[str], np.ndarray, np.ndarray]:
    names, sub = subclasses()
    parent = np.array([CLASSES.index(n.split("/")[0]) for n in names])
    return names, np.array(sub), parent


def support_indices(k: int, seed: int = 0) -> np.ndarray:
    _, sub, _ = _subs()
    rng = np.random.default_rng(seed)
    return np.concatenate([rng.choice(np.where(sub == j)[0], size=min(k, int((sub == j).sum())), replace=False) for j in range(sub.max() + 1)])


def _protos_from(V: dict[str, np.ndarray], idx: np.ndarray) -> dict[str, np.ndarray]:
    _, sub, _ = _subs()
    return {v: np.stack([V[v][idx][sub[idx] == j].mean(0) for j in range(sub.max() + 1)]) for v in VIEWS}


def prototypes(k: int, seed: int = 0) -> dict[str, np.ndarray]:
    V, _ = corpus_views()
    return _protos_from(V, support_indices(k, seed))


def _softmax(z: np.ndarray) -> np.ndarray:
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()


def attention(q: dict[str, np.ndarray], protos: dict[str, np.ndarray]) -> np.ndarray:
    """α_v ∝ exp(β · margin_v): margin = khoảng cách prototype gần thứ 2 − gần nhất (chuẩn hóa)."""
    margins = []
    for v in VIEWS:
        d = np.sort(np.linalg.norm(protos[v] - q[v], axis=1))
        margins.append((d[1] - d[0]) / (d.mean() + 1e-9))
    return _softmax(BETA * np.array(margins))


def classify_views(q: dict[str, np.ndarray], protos: dict[str, np.ndarray]) -> dict:
    """Khoảng cách tới từng prototype con → gộp về lớp cha (min khoảng cách, tổng xác suất)."""
    _, _, parent = _subs()
    alpha = attention(q, protos)
    d2 = sum(a * np.linalg.norm(protos[v] - q[v], axis=1) ** 2 for a, v in zip(alpha, VIEWS))
    dsub = np.sqrt(d2)
    psub = _softmax(-dsub / TEMPERATURE)
    n = len(CLASSES)
    dist = np.array([dsub[parent == c].min() for c in range(n)])
    probs = np.array([psub[parent == c].sum() for c in range(n)])
    return {"alpha": alpha, "dist": dist, "probs": probs, "dsub": dsub}


SUPPORT_DRAWS = 5  # trung bình trên nhiều lần rút tập hỗ trợ → kết quả ổn định, không phụ thuộc một lần rút


def classify(src: str, k: int = 5, seed: int = 0) -> dict:
    q = encoder().views(src)
    runs = [classify_views(q, prototypes(k, seed + d)) for d in range(SUPPORT_DRAWS)]
    r = {key: np.mean([x[key] for x in runs], axis=0) for key in ("alpha", "dist", "probs")}
    probs = r["probs"]
    best = int(np.argmin(r["dist"]))  # nhãn = prototype gần nhất (độc lập với nhiệt độ hiệu chỉnh)
    safe_i = CLASSES.index("safe")
    return {
        "k_shot": k,
        "label": CLASSES[best],
        "probs": {c: round(float(p), 4) for c, p in zip(CLASSES, probs)},
        "distances": {c: round(float(d), 4) for c, d in zip(CLASSES, r["dist"])},
        "contributions": {v: round(float(a), 4) for v, a in zip(VIEWS, r["alpha"])},
        "p_vuln": round(float(1 - probs[safe_i]), 4),
        "temperature": TEMPERATURE,
    }


def episode_accuracy(k: int, episodes: int = 12) -> float:
    """Độ chính xác trung bình trên các episode: k mẫu hỗ trợ/lớp, phần còn lại làm truy vấn."""
    V, y = corpus_views()
    accs = []
    for ep in range(episodes):
        idx = support_indices(k, seed=100 + ep)
        protos = _protos_from(V, idx)
        mask = np.ones(len(y), bool)
        mask[idx] = False
        correct = 0
        qi = np.where(mask)[0]
        for i in qi:
            r = classify_views({v: V[v][i] for v in VIEWS}, protos)
            correct += int(np.argmin(r["dist"]) == y[i])
        accs.append(correct / len(qi))
    return round(float(np.mean(accs)), 4)


@lru_cache(maxsize=4)
def embedding(k: int = 5) -> dict:
    """Chiếu PCA 2D các mẫu (fused, α đều) + prototype — cho scatter plot."""
    V, y = corpus_views()
    Z = np.concatenate([V[v] / np.sqrt(len(VIEWS)) for v in VIEWS], axis=1)
    pca = PCA(n_components=2, random_state=0).fit(Z)
    P = pca.transform(Z)
    protos = prototypes(k)
    PZ = np.concatenate([protos[v] / np.sqrt(len(VIEWS)) for v in VIEWS], axis=1)
    PP = pca.transform(PZ)
    sup = set(support_indices(k).tolist())
    return {
        "k_shot": k,
        "points": [{"x": round(float(p[0]), 4), "y": round(float(p[1]), 4), "cls": CLASSES[c], "support": i in sup} for i, (p, c) in enumerate(zip(P, y))],
        "prototypes": [{"x": round(float(p[0]), 4), "y": round(float(p[1]), 4), "cls": n.split("/")[0], "sub": n.split("/")[1]} for p, n in zip(PP, _subs()[0])],
        "_pca": pca,
    }


def project(src: str, k: int = 5) -> dict:
    q = encoder().views(src)
    z = np.concatenate([q[v] / np.sqrt(len(VIEWS)) for v in VIEWS])[None, :]
    p = embedding(k)["_pca"].transform(z)[0]
    return {"x": round(float(p[0]), 4), "y": round(float(p[1]), 4)}


def fused_features(src_list: list[str]) -> np.ndarray:
    """Đặc trưng fused (α đều) dùng cho M3 học liên kết."""
    enc = encoder()
    out = []
    for s in src_list:
        q = enc.views(s)
        out.append(np.concatenate([q[v] for v in VIEWS]))
    return np.stack(out)
