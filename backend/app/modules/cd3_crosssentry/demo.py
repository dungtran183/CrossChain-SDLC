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

    rec = Recorder(app, "cd3", name, "python -m app.modules.cd3_crosssentry.demo --export")
    say = print
    rec.post("/api/cd3/reset")
    rec.get("/api/cd3/state")
    warm = 20 if name == "normal" else 10
    for _ in range(warm):
        st = rec.post("/api/cd3/tick?n=1")["state"]
    say(f"[{name}] normal ×{warm}: max r = {max(max(r) for r in st['risk']['matrix']):.2f}, gini={st['gsurv']['gini']}")
    if name != "normal":
        rec.post(f"/api/cd3/start?scenario={name}")
        approved: set[str] = set()
        for i in range(18):
            st = rec.post("/api/cd3/tick?n=1")["state"]
            top = st["series"][0] if st["series"] else None
            if name == "slow_burn":
                q = _pending(st, "R4", "V7")
                if q and "V7" not in approved:
                    st = rec.post(f"/api/cd3/approve/{q['id']}")["state"]
                    approved.add("V7")
                    say(f"  tick {st['tick']}: approve R4 isolate V7 (r={q['r']})")
                q2 = _pending(st, "R4", "V2") or _pending(st, "R4", "V1") or _pending(st, "R4", "V3")
                if q2 and i >= 6:
                    st = rec.post(f"/api/cd3/reject/{q2['id']}")["state"]
                    say(f"  tick {st['tick']}: reject R4 for {q2['target']} (co-signer, weak evidence)")
            if name == "collusion":
                q = _pending(st, "R5")
                if q and i >= 4 and "bridge" not in approved:
                    st = rec.post(f"/api/cd3/approve/{q['id']}")["state"]
                    approved.add("bridge")
                    say(f"  tick {st['tick']}: approve R5 pause bridge")
            if top and i % 6 == 5:
                say(f"  tick {st['tick']}: top {top['key']} r={top['r'][-1]} (traditional {top['traditional']}) queue={[(q['level'], q['target']) for q in st['queue'] if q['status'] == 'pending']}")
    for w in TUNES:
        r = rec.post("/api/cd3/tune", {"w_d": w[0], "w_g": w[1], "w_c": w[2]})
        say(f"  tune w={w}: best θ={r['best']['theta']} F={r['best']['F']} G={r['best']['G_surv']}")
    say(f"[{name}] supply locked={st['supply']['locked']} minted={st['supply']['minted']} executed={st['executed']}")
    if export:
        say(f"wrote {rec.save()}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", action="store_true")
    ap.add_argument("--scenario", default="all", help="normal | slow_burn | collusion | all")
    a = ap.parse_args()
    for sc in ["normal", "slow_burn", "collusion"] if a.scenario == "all" else [a.scenario]:
        scenario(sc, a.export)
