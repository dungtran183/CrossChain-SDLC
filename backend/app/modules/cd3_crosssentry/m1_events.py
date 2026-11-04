"""M1 · Thu nhận sự kiện & tạo bằng chứng (ECA).

- Ghép Locked (chain-A) ↔ Minted (chain-B) theo msgId; người ký được khôi phục từ calldata của tx mint.
- Luật: mint không có lock · msgId xử lý 2 lần · độ trễ > ngưỡng · giá trị ra > vào · chuyển vòng giá trị nhỏ.
- Tín hiệu bất thường: IsolationForest (scikit-learn) huấn luyện trên lưu lượng bình thường tổng hợp.
- ECA: κ_L (độ tin cậy kênh học, giảm khi OOD) · κ_P (độ phủ luật = tỉ lệ sự kiện ghép được)
  → E_v(t) = ⟨p̂_v, κ_L, Π_v, κ_P⟩ → hai khối niềm tin → hợp nhất Dempster (M2).
"""
from __future__ import annotations

import math
from collections import defaultdict, deque

import numpy as np
from eth_account import Account
from eth_account.messages import encode_defunct
from sklearn.ensemble import IsolationForest
from web3 import Web3

from .m2_fusion import bel_pl, dempster_combine, mass, round_mass

LAT_MAX = 3
SEVERITY = {"mint_without_lock": 0.95, "double_process": 0.9, "value_out_gt_in": 0.85, "latency": 0.6, "circular_small": 0.7}


def _train_forest(seed: int = 3):
    rng = np.random.default_rng(seed)
    n = 300
    X = np.column_stack(
        [
            rng.choice([0, 0, 1], n),  # độ trễ (tick)
            rng.normal(2.35, 0.17, n),  # log10(amount)
            np.ones(n) + rng.normal(0, 0.01, n),  # tỉ lệ ra/vào
            rng.poisson(1.5, n) + 1,  # tần suất tác nhân trong 2 tick gần nhất
            rng.integers(1, 6, n),  # số đối tác khác nhau
        ]
    )
    forest = IsolationForest(n_estimators=80, random_state=seed).fit(X)
    return forest, X.mean(0), X.std(0) + 1e-6


class EventProcessor:
    def __init__(self, traffic) -> None:
        self.traffic = traffic
        self.forest, self.mu, self.sd = _train_forest()
        self.locks: dict[str, dict] = {}  # msgId → lock
        self.minted_ids: set[str] = set()
        self.recent = deque(maxlen=60)  # sự kiện để vẽ làn chuỗi
        self.window = deque(maxlen=3)  # (n_events, n_matched) theo tick
        self.activity: dict[str, deque] = defaultdict(lambda: deque(maxlen=5))
        self.partners: dict[str, deque] = defaultdict(lambda: deque(maxlen=12))
        self.edges: dict[tuple[str, str], int] = defaultdict(int)
        self.seq = 0
        self.signed: dict[str, int] = defaultdict(int)  # số lần ký của validator
        self.violated: dict[str, int] = defaultdict(int)  # số lần ký vào thông điệp vi phạm

    # ------------------------------------------------------------- tiện ích
    def _signers(self, tx_hash: str) -> list[str]:
        gw = self.traffic.gateway
        tx = self.traffic.b.w3.eth.get_transaction(tx_hash)
        _, p = gw.decode_function_input(tx["input"])
        recipient = Web3.to_checksum_address(p["recipient"])
        h = Web3.solidity_keccak(["bytes32", "address", "uint256", "uint8", "address"], [p["msgId"], recipient, p["amount"], p["corridor"], gw.address])
        out = []
        for s in p["sigs"]:
            a = self.traffic.by_address(Account.recover_message(encode_defunct(primitive=h), signature=s))
            out.append(a.id if a else "?")
        return out

    def _name(self, addr: str) -> str:
        a = self.traffic.by_address(addr)
        return a.id if a else addr[:8]

    def _kappa_p(self) -> float:
        ev = sum(x[0] for x in self.window)
        ok = sum(x[1] for x in self.window)
        return round(0.4 + 0.6 * (ok / ev if ev else 1.0), 4)

    def _evidence(self, tick: int, kind: str, corridor: int, actors: dict, feats: list[float], rules: list[str], attributed: list[str], msg_id: str, kp: float) -> dict:
        x = np.array(feats, dtype=float)
        df = float(self.forest.decision_function(x[None, :])[0])
        p_hat = 1 / (1 + math.exp(14 * df))
        z = float(np.abs((x - self.mu) / self.sd).mean())
        k_l = round(math.exp(-max(0.0, z - 1.5) / 2.5), 4)
        m_learn = mass(k_l * (1 - p_hat), k_l * p_hat)
        if rules:
            sev = max(SEVERITY[r] for r in rules)
            rel = 0.5 + 0.5 * kp
            m_rule = mass(0.0, rel * sev)
        else:
            m_rule = mass(kp * 0.85, 0.0)
        fused, k = dempster_combine(m_learn, m_rule)
        bel, pl = bel_pl(fused)
        self.seq += 1
        return {
            "id": self.seq,
            "tick": tick,
            "kind": kind,
            "msgId": msg_id,
            "corridor": corridor,
            "actors": actors,
            "features": [round(float(v), 3) for v in feats],
            "p_hat": round(p_hat, 4),
            "kappa_L": k_l,
            "kappa_P": kp,
            "rules": rules,
            "m_learn": round_mass(m_learn),
            "m_rule": round_mass(m_rule),
            "m_fused": round_mass(fused),
            "K": round(k, 4),
            "bel": round(bel, 4),
            "pl": round(pl, 4),
            "attributed": attributed,
        }

    # ------------------------------------------------------------- một tick
    def process(self, tick: int, txs: list[dict]) -> list[dict]:
        evidence: list[dict] = []
        n_events = n_matched = 0
        new_locks = []
        kp = self._kappa_p()
        for tx in txs:
            if tx["chain"] == "chain-A" and tx["status"] == 1:
                for ev in tx["events"]:
                    if ev["event"] != "Locked":
                        continue
                    a = ev["args"]
                    lock = {"msgId": a["msgId"], "sender": self._name(a["sender"]), "recipient": self._name(a["recipient"]), "amount": int(a["amount"]), "corridor": int(a["corridor"]), "tick": tick, "block": tx["block"], "flagged_latency": False}
                    self.locks[a["msgId"]] = lock
                    new_locks.append(lock)
                    n_events += 1
                    self.activity[lock["sender"]].append(tick)
                    self.partners[lock["sender"]].append(lock["recipient"])
                    self.edges[(lock["sender"], "LockVault")] += 1
                    self.recent.append({"tick": tick, "chain": "A", "type": "Locked", "msgId": a["msgId"], "amount": lock["amount"], "corridor": lock["corridor"], "actor": lock["sender"], "status": "pending"})
            elif tx["chain"] == "chain-B" and tx.get("fn", "").startswith("mint"):
                relayer = self._name(tx["from"])
                if tx["status"] != 1:
                    self.recent.append({"tick": tick, "chain": "B", "type": "MintReverted", "msgId": None, "amount": 0, "corridor": None, "actor": relayer, "status": "reverted", "reason": tx.get("reason")})
                    continue
                for ev in tx["events"]:
                    if ev["event"] != "Minted":
                        continue
                    a = ev["args"]
                    mid, amt, cor = a["msgId"], int(a["amount"]), int(a["corridor"])
                    signers = self._signers(tx["hash"])
                    for s in signers:
                        self.edges[(s, "MintGateway")] += 1
                    if cor == 2:
                        self.edges[(f"O{int(mid[-1], 16) % 2 + 1}", "MintGateway")] += 1
                    self.edges[(relayer, "MintGateway")] += 1
                    self.activity[relayer].append(tick)
                    n_events += 1
                    lock = self.locks.get(mid)
                    rules, kind = [], "pair"
                    if mid in self.minted_ids:
                        rules.append("double_process")
                        kind = "duplicate"
                    if lock is None:
                        rules.append("mint_without_lock")
                        kind = "orphan_mint"
                        latency, ratio, user = 0, 3.0, None
                    else:
                        n_matched += 2 if kind == "pair" else 0
                        latency = tick - lock["tick"]
                        ratio = amt / max(1, lock["amount"])
                        user = lock["sender"]
                        if ratio > 1.05:
                            rules.append("value_out_gt_in")
                        if latency > LAT_MAX:
                            rules.append("latency")
                        if lock["amount"] <= 5 and lock["recipient"] in self.partners[lock["sender"]] and len(self.partners[lock["sender"]]) >= 6 and len(set(self.partners[lock["sender"]])) <= 2:
                            rules.append("circular_small")
                    self.minted_ids.add(mid)
                    rate = len([t for t in self.activity[user or relayer] if t >= tick - 1]) if (user or relayer) else 1
                    cps = len(set(self.partners[user])) if user else 1
                    feats = [latency, math.log10(amt + 1), ratio, rate, cps]
                    oracle = f"O{int(mid[-1], 16) % 2 + 1}" if cor == 2 else None
                    actors = {"user": user, "relayer": relayer, "signers": signers, "oracle": oracle}
                    for v in signers:
                        self.signed[v] += 1
                    if any(r in rules for r in ("mint_without_lock", "value_out_gt_in")):
                        for v in signers:
                            self.violated[v] += 1
                        # Quy trách nhiệm theo tỉ lệ vi phạm lịch sử: validator ký nhiều thông điệp sai bị quy nhiều hơn
                        # người chỉ tình cờ cùng ký một lần (trọng số chuẩn hóa theo người cao nhất).
                        ratio_v = {v: self.violated[v] / self.signed[v] for v in signers}
                        top = max(ratio_v.values()) or 1.0
                        attributed = [[v, round((ratio_v[v] / top) ** 2, 3)] for v in signers] + ([[relayer, 1.0]] if "mint_without_lock" in rules else [])
                    elif "double_process" in rules or "latency" in rules:
                        attributed = [[relayer, 1.0]]
                    elif "circular_small" in rules:
                        attributed = [[user, 1.0]] if user else []
                    else:
                        attributed = [[x, 1.0] for x in [user, relayer, *signers, oracle] if x]
                    evidence.append(self._evidence(tick, kind, cor, actors, feats, rules, attributed, mid, kp))
                    if lock:
                        for r in self.recent:
                            if r["msgId"] == mid and r["type"] == "Locked":
                                r["status"] = "matched"
                    self.recent.append({"tick": tick, "chain": "B", "type": "Minted", "msgId": mid, "amount": amt, "corridor": cor, "actor": relayer, "status": "flagged" if rules else "matched", "rules": rules})
        # khóa chờ quá lâu → bằng chứng độ trễ cho relayer được phân công
        for mid, lock in self.locks.items():
            age = tick - lock["tick"]
            if mid not in self.minted_ids and age > LAT_MAX and not lock["flagged_latency"]:
                lock["flagged_latency"] = True
                relayer = self.traffic.relayer_for(bytes.fromhex(mid[2:]))
                feats = [age, math.log10(lock["amount"] + 1), 0.0, 1, 1]
                evidence.append(self._evidence(tick, "pending_lock", lock["corridor"], {"user": lock["sender"], "relayer": relayer, "signers": []}, feats, ["latency"], [[relayer, 1.0]], mid, kp))
                for r in self.recent:
                    if r["msgId"] == mid and r["type"] == "Locked":
                        r["status"] = "late"
        self.window.append((max(1, n_events), n_matched))
        return evidence

    def graph(self, risk_of: dict[str, float]) -> dict:
        nodes = [{"id": "LockVault", "type": "contract", "chain": "A", "risk": 0}, {"id": "MintGateway", "type": "contract", "chain": "B", "risk": 0}]
        for a in self.traffic.actors.values():
            nodes.append({"id": a.id, "type": a.role, "risk": round(risk_of.get(a.id, 0.0), 3)})
        edges = [{"source": s, "target": t, "count": c} for (s, t), c in self.edges.items()]
        return {"nodes": nodes, "edges": edges}
