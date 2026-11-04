"""CLI demo CĐ3: `python -m app.modules.cd3_crosssentry.demo [--export]`.

--export ghi frontend/public/replays/cd3/{normal,slow_burn,collusion}.json (kịch bản trong docs/modules/CD3.md).
"""
from __future__ import annotations

import argparse

TUNES = [(1.0, 0.0, 0.3), (1.0, 0.5, 0.3), (1.0, 1.0, 0.3), (1.0, 1.5, 0.3)]


def _pending(st: dict, level: str, target: str | None = None) -> dict | None:
    return next((q for q in st["queue"] if q["status"] == "pending" and q["level"] == level and (target is None or q["target"] == target)), None)


def scenario(name: str, export: bool) -> None:
    from ...core.replay import Recorder
    from ...main import app
    from .service import ATTACKERS

    rec = Recorder(app, "cd3", name, "python -m app.modules.cd3_crosssentry.demo --export")
    say = print
    rec.post("/api/cd3/reset")
    rec.get("/api/cd3/state")
    warm = 20 if name == "normal" else 8
    for _ in range(warm):
        st = rec.post("/api/cd3/tick?n=1")["state"]
    say(f"[{name}] normal ×{warm}: max r = {max(max(r) for r in st['risk']['matrix']):.2f}, gini={st['gsurv']['gini']}")
    if name != "normal":
        rec.post(f"/api/cd3/start?scenario={name}")
        culprits = ATTACKERS.get(name, set())
        for i in range(16):
            st = rec.post("/api/cd3/tick?n=1")["state"]
            for q in [q for q in st["queue"] if q["status"] == "pending"]:
                if q["level"] == "R4" and q["target"] in culprits:
                    st = rec.post(f"/api/cd3/approve/{q['id']}")["state"]
                    say(f"  tick {st['tick']}: approve R4 isolate {q['target']} (r={q['r']})")
                elif q["level"] == "R5" and i >= 3:
                    st = rec.post(f"/api/cd3/approve/{q['id']}")["state"]
                    say(f"  tick {st['tick']}: approve R5 pause bridge")
                elif q["level"] == "R4" and i >= 2:
                    st = rec.post(f"/api/cd3/reject/{q['id']}")["state"]
                    say(f"  tick {st['tick']}: reject R4 for {q['target']} (weak evidence)")
        top = st["series"][0] if st["series"] else None
        if top:
            say(f"  top {top['key']} r={top['r'][-1]} crs_detect={top['crs_detect']} trad_detect={top['trad_detect']}")
    for w in TUNES:
        r = rec.post("/api/cd3/tune", {"w_d": w[0], "w_g": w[1], "w_c": w[2]})
    say(f"[{name}] supply locked={st['supply']['locked']} minted={st['supply']['minted']} executed={st['executed']} rules={sorted({x for e in st['evidence'] for x in e['rules']})}")
    if export:
        say(f"wrote {rec.save()}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", action="store_true")
    ap.add_argument("--scenario", default="all", help="tên kịch bản hoặc all")
    a = ap.parse_args()
    from .traffic import SCENARIOS

    for sc in SCENARIOS if a.scenario == "all" else [a.scenario]:
        scenario(sc, a.export)
