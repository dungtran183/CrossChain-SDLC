"""Phiên giám sát CĐ3 CrossSentry: ChainSim riêng + bộ sinh lưu lượng + M1 → M2 → M3 theo tick."""
from __future__ import annotations

from ...core.bus import bus
from ...core.chainsim import ChainSim, jsonable
from .m1_events import EventProcessor
from .m2_fusion import CRS
from .m3_response import HUMAN, LEVELS, gini, level_for, lorenz, tune
from .traffic import CORRIDORS, SCENARIOS, Traffic

ATTACKERS = {"replay": {"R3"}, "delayed": {"R2"}, "collusion": {"V5", "V6", "V7", "R3"}, "slow_burn": {"V7"}, "boosting": {"U5", "U6"}}


class Cd3Session:
    def __init__(self) -> None:
        self.sim = ChainSim(on_event=bus.hook("cd3"))
        self.a, self.b = self.sim["chain-A"], self.sim["chain-B"]
        self.guardian = self.b.accounts[0]
        self.b.label(self.guardian, "CrossSentry guardian")
        self.vault = self.a.deploy("Cd3LockVault", alias="LockVault")
        self.token = self.b.deploy("Cd3WrappedToken", alias="wBRIDGE")
        self.traffic = Traffic(self.a, self.b, self.vault, None, self.guardian)  # gateway gán sau
        vals = [v.address for v in self.traffic.by_role("validator")]
        self.gateway = self.b.deploy("Cd3MintGateway", self.token.address, vals, 3, self.guardian, alias="MintGateway")
        self.traffic.gateway = self.gateway
        self.b.transact(self.token, "setMinter", self.gateway.address)
        self.m1 = EventProcessor(self.traffic)
        self.crs = CRS()
        self.tick_no = 0
        self.evidence: list[dict] = []
        self.levels: dict[str, str] = {}  # "actor|corridor" → mức hiện tại
        self.actions: list[dict] = []  # nhật ký phản ứng
        self.queue: list[dict] = []  # chờ phê duyệt R4/R5
        self.executed: dict[str, str] = {}  # actor → "R4" | bridge → "R5"
        self.impact: dict[str, float] = {a: 0.0 for a in self.traffic.actors}
        self.scenarios_seen: list[str] = ["normal"]
        self.seq = 0
        self.paused = False

    # ------------------------------------------------------------------ điều khiển
    def start(self, scenario: str) -> dict:
        if scenario not in SCENARIOS:
            raise ValueError(f"unknown scenario {scenario}")
        prev = self.traffic.scenario
        self.traffic.scenario = scenario
        self.traffic.scenario_tick = 0
        loose = scenario == "replay"
        txs = []
        if bool(self.b.call(self.gateway, "loose")) != loose:
            txs.append(self.b.transact(self.gateway, "setLoose", loose, sender=self.guardian, note=f"setLoose({loose})"))
        self.scenarios_seen.append(scenario)
        self.actions.append({"tick": self.tick_no, "level": "—", "target": "scenario", "corridor": None, "note": f"{prev} → {scenario}", "auto": True})
        return {"scenario": scenario, "txs": txs}

    def tick(self, n: int = 1) -> dict:
        all_txs: list[dict] = []
        new_ev: list[dict] = []
        for _ in range(max(1, min(n, 10))):
            self.tick_no += 1
            txs = self.traffic.tick(self.tick_no)
            ev = self.m1.process(self.tick_no, txs)
            self._fuse(ev)
            self._respond()
            all_txs += txs
            new_ev += ev
        self.evidence = (self.evidence + new_ev)[-80:]
        return {"tick": self.tick_no, "new_evidence": len(new_ev), "txs": all_txs[-40:]}

    # ------------------------------------------------------------------ M2
    def _fuse(self, ev: list[dict]) -> None:
        observed: dict[tuple[str, str], float] = {}
        for e in ev:
            c = CORRIDORS[e["corridor"]]
            for actor, w in e["attributed"]:
                k = (actor, c)
                observed[k] = max(observed.get(k, 0.0), e["bel"] * w)
        keys = list(self.crs.r) or [(a, c) for a in self.traffic.actors for c in CORRIDORS[:1]]
        self.crs.step(observed, keys)

    # ------------------------------------------------------------------ M3
    def _respond(self) -> None:
        corridor_hot: dict[str, int] = {}
        for (actor, cor), r in self.crs.r.items():
            key = f"{actor}|{cor}"
            lv = level_for(r)
            if lv == "R4":
                corridor_hot[cor] = corridor_hot.get(cor, 0) + 1
            prev = self.levels.get(key, "R0")
            self.levels[key] = lv
            if LEVELS.index(lv) > LEVELS.index(prev):
                if lv in HUMAN:
                    if actor not in self.executed and not any(q["target"] == actor and q["status"] == "pending" for q in self.queue):
                        self._enqueue("R4", actor, cor, r, "CRS ≥ 0.75")
                else:
                    self.actions.append({"tick": self.tick_no, "level": lv, "target": actor, "corridor": cor, "r": round(r, 3), "auto": True})
        # Cường độ giám sát lên từng tác nhân: nền 1 (giám sát chung) + mức phản ứng hiện tại + biện pháp đã thi hành.
        self.impact = {a: 1.0 for a in self.traffic.actors}
        for (actor, _cor), lv in ((tuple(k.split("|")), v) for k, v in self.levels.items()):
            self.impact[actor] += LEVELS.index(lv)
        for target, lv in self.executed.items():
            if target in self.impact:
                self.impact[target] += 4
            elif target == "bridge":
                for a in self.impact:
                    self.impact[a] += 1
        for cor, hot in corridor_hot.items():
            if hot >= 3 and "bridge" not in self.executed and not any(q["level"] == "R5" and q["status"] == "pending" for q in self.queue):
                self._enqueue("R5", "bridge", cor, 1.0, f"{hot} actors at R4 on {cor}")

    def _enqueue(self, level: str, target: str, cor: str, r: float, reason: str) -> None:
        self.seq += 1
        self.queue.append({"id": self.seq, "level": level, "target": target, "corridor": cor, "r": round(r, 3), "reason": reason, "tick": self.tick_no, "status": "pending"})

    def decide(self, qid: int, approve: bool) -> dict:
        q = next((x for x in self.queue if x["id"] == qid), None)
        if q is None:
            raise ValueError(f"unknown approval {qid}")
        if q["status"] != "pending":
            raise ValueError("already decided")
        txs = []
        if approve:
            if q["level"] == "R4":
                addr = self.traffic.actors[q["target"]].address
                txs.append(self.b.transact(self.gateway, "blockActor", addr, sender=self.guardian, note=f"blockActor({q['target']})"))
            else:
                txs.append(self.b.transact(self.gateway, "pause", sender=self.guardian, note="pause()"))
                self.paused = True
            self.executed[q["target"]] = q["level"]
        q["status"] = "approved" if approve else "rejected"
        self.actions.append({"tick": self.tick_no, "level": q["level"], "target": q["target"], "corridor": q["corridor"], "auto": False, "decision": q["status"]})
        return {"approval": q, "txs": txs}

    # ------------------------------------------------------------------ xem
    def risk(self) -> dict:
        actors = list(self.traffic.actors)
        matrix = [[round(self.crs.r.get((a, c), 0.0), 4) for c in CORRIDORS] for a in actors]
        return {"actors": actors, "corridors": CORRIDORS, "matrix": matrix}

    def series(self, top: int = 6) -> list[dict]:
        keys = sorted(self.crs.history, key=lambda k: -max(self.crs.history[k][-15:]))[:top]
        out = []
        for k in keys:
            h = self.crs.history[k]
            th = self.crs.trad_history.get(k, [0.0] * len(h))
            first = self.tick_no - len(h) + 1  # tick ứng với h[0]
            crs_hit = next((first + i for i, v in enumerate(h) if v >= 0.6), None)
            trad_hit = next((first + i for i, v in enumerate(th) if v >= 0.6), None)
            out.append({
                "key": f"{k[0]}|{k[1]}", "actor": k[0], "corridor": k[1],
                "r": h[-40:], "trad": th[-40:], "start": first + max(0, len(h) - 40),
                "traditional": round(self.crs.traditional(k), 4), "peak": max(h),
                "crs_detect": crs_hit, "trad_detect": trad_hit,
            })
        return out

    def gsurv(self) -> dict:
        vals = [round(v, 4) for v in self.impact.values()]
        return {"gini": round(gini(vals), 4), "lorenz": lorenz(vals), "impact": dict(zip(self.impact, vals))}

    def tune(self, w_d: float, w_g: float, w_c: float) -> dict:
        series = {f"{k[0]}|{k[1]}": v for k, v in self.crs.history.items()}
        attackers = set().union(*(ATTACKERS.get(s, set()) for s in self.scenarios_seen))
        return tune(series, attackers, w_d, w_g, w_c)

    def snapshot(self) -> dict:
        """Toàn bộ trạng thái cho UI (một lần gọi — tiện cho replay)."""
        rk = self.risk()
        risk_of = {a: max(row) for a, row in zip(rk["actors"], rk["matrix"])}
        lanes = list(self.m1.recent)[-40:]
        return jsonable(
            {
                "tick": self.tick_no,
                "scenario": self.traffic.scenario,
                "scenarios": SCENARIOS,
                "paused": self.paused,
                "lanes": lanes,
                "evidence": self.evidence[-14:],
                "risk": rk,
                "series": self.series(),
                "levels": {k: v for k, v in self.levels.items() if v != "R0"},
                "actions": self.actions[-14:],
                "queue": self.queue[-8:],
                "executed": self.executed,
                "gsurv": self.gsurv(),
                "graph": self.m1.graph(risk_of),
                "contracts": {"vault": self.vault.address, "gateway": self.gateway.address, "token": self.token.address},
                "supply": {"locked": int(self.a.call(self.vault, "totalLocked")), "minted": int(self.b.call(self.token, "totalSupply"))},
            }
        )
