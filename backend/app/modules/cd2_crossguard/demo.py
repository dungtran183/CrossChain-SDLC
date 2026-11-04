"""CLI demo CĐ2: `python -m app.modules.cd2_crossguard.demo [--export]`.

Kịch bản ≈ 4 phút (docs/modules/CD2.md); --export ghi frontend/public/replays/cd2/audit-flow.json
gồm mọi mẫu × k∈{1,5}, FL với ε∈{0.5,1,2,4} × α∈{0.1,1}, báo cáo M4 và Exploit lab cho cả bản lỗi lẫn bản sửa.
"""
from __future__ import annotations

import argparse

EPS = [0.5, 1.0, 2.0, 4.0]
ALPHAS = [0.1, 1.0]


def run(export: bool = False) -> None:
    from ...core.replay import Recorder
    from ...main import app

    rec = Recorder(app, "cd2", "audit-flow", "python -m app.modules.cd2_crossguard.demo --export")
    say = print
    rec.post("/api/cd2/reset")
    ss = rec.get("/api/cd2/samples")["samples"]
    for k in (1, 5):
        e = rec.get(f"/api/cd2/m2/embedding?k={k}")
    say(f"[m2] episode accuracy 1-shot={e['episode_accuracy']['1']} 5-shot={e['episode_accuracy']['5']}")
    for s in ss:
        sid = s["id"]
        rec.get(f"/api/cd2/samples/{sid}")
        m1 = rec.post("/api/cd2/m1/analyze", {"sample_id": sid})
        for k in (1, 5):
            c = rec.post(f"/api/cd2/m2/classify?k={k}", {"sample_id": sid})
        r = rec.post("/api/cd2/m4/report?k=5", {"sample_id": sid})
        inter = [x["kind"] for x in m1["interactions"] if x["present"]]
        say(f"[{s['title']:24s}] M1 {len(m1['graph']['nodes'])} nodes {inter[:4]}… | M2 {c['label']} p={c['p_vuln']} | M4 {r['risk_tier']} {[i['id'] for i in r['invariants'] if i['status'] == 'candidate']}")
    for eps in EPS:
        for a in ALPHAS:
            r = rec.post("/api/cd2/m3/run", {"rounds": 10, "epsilon": eps, "alpha": a})
            say(f"[m3] ε={eps} α={a} σ={r['sigma']} acc={r['final_accuracy']} (no-DP {r['baseline_final']})")
    for s in ss:
        if not s["vulnerable"]:
            continue
        for target in ("vuln", "safe"):
            r = rec.post(f"/api/cd2/exploit/run?target={target}&sample={s['id']}")
            say(f"[exploit] {s['title']:24s} {target:4s} attack={r['attack']:20s} exploited={r['exploited']} balance={r['attacker_balance']} locked={r['locked']}")
        rec.post("/api/cd2/m4/report?k=5", {"sample_id": s["id"], "after_exploit": True})  # sau khi Exploit lab xác minh bất biến
    if export:
        say(f"wrote {rec.save()}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", action="store_true")
    run(ap.parse_args().export)
