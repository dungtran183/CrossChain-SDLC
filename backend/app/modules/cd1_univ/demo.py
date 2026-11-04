"""CLI demo CĐ1: `python -m app.modules.cd1_univ.demo [--export]`.

Chạy kịch bản ≈ 3 phút trong docs/modules/CD1.md; --export ghi frontend/public/replays/cd1/credential-flow.json.
"""
from __future__ import annotations

import argparse


def run(export: bool = False) -> None:
    from ...core.replay import Recorder
    from ...main import app

    rec = Recorder(app, "cd1", "credential-flow", "python -m app.modules.cd1_univ.demo --export")
    say = print
    rec.post("/api/cd1/reset")
    rec.get("/api/cd1/state")
    r = rec.post("/api/cd1/setup")
    say(f"[setup]  relays={[x['name'] for x in r['relays']]} t={r['threshold']} verifier={r['verifier']}")
    r = rec.post("/api/cd1/issue")
    say(f"[issue]  batch #{r['batch_id']} root={r['root'][:18]}… anchored in block {r['txs'][0]['block']}")
    # Shamir minh họa (giá trị chọn sẵn cho replay)
    for use in ([1, 2, 3], [1, 2], [2, 4, 5], [1, 2, 3, 4, 5]):
        rec.post("/api/cd1/shamir", {"secret": 1234, "t": 3, "n": 5, "use": use})
    for sid, val in (("S2", 3.2), ("S3", 3.2)):
        r = rec.post("/api/cd1/prove", {"student_id": sid, "predicate": {"attr": "gpa", "op": ">=", "value": val}})
        say(f"[prove]  {sid}: {r['statement']['predicate']} satisfiable={r['satisfiable']} proof={r['proof_bytes']} B")
        r = rec.post("/api/cd1/verify")
        rec.get("/api/cd1/timeline")
        say(f"[verify] {sid}: accepted={r['accepted']} valid={r['valid_sigs']}/{r['threshold']} ({r['reason']})")
    for attrs in ({"role": "HR", "org": "ACME"}, {"role": "Sales", "org": "ACME"}, {"role": "Auditor"}):
        r = rec.post("/api/cd1/abe", {"attrs": attrs})
        say(f"[abe]    {attrs} → {'decrypted' if r['ok'] else r['reason']}")
    for kind in ("below_threshold", "signature", "duplicate", "proof", "replay"):
        r = rec.post("/api/cd1/tamper", {"kind": kind})
        say(f"[tamper] {kind:15s} accepted={r['accepted']} reason={r['reason']}")
    r = rec.post("/api/cd1/revoke", {"student_id": "S3"})
    say(f"[revoke] S3 in block {r['txs'][0]['block']}")
    rec.post("/api/cd1/prove", {"student_id": "S3", "predicate": {"attr": "gpa", "op": ">=", "value": 3.2}})
    r = rec.post("/api/cd1/verify")
    say(f"[verify] S3 after revoke: accepted={r['accepted']} reason={r['reason']}")
    rec.get("/api/cd1/timeline")
    if export:
        say(f"wrote {rec.save()}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", action="store_true", help="ghi replay JSON cho frontend")
    run(ap.parse_args().export)
