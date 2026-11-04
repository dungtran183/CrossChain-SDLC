import time

import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.modules.cd2_crossguard import m1_repr, m2_fewshot, m3_federated, samples

client = TestClient(app)


def test_m1_detects_crosschain_interactions():
    flags = m1_repr.interaction_flags(samples.source("Cd2VulnBridgeNoNonce"))
    assert flags["mint"] and flags["release"] and flags["verify_signature"]
    assert not flags["nonce_check"] and not flags["nonce_mark"]  # đúng lỗi thiếu nonce
    safe = m1_repr.interaction_flags(samples.source("Cd2SafeBridge"))
    assert safe["nonce_check"] and safe["source_check"] and safe["dedupe_signers"] and safe["access_modifier"]
    g = m1_repr.structure_graph(samples.source("Cd2VulnBridgeAccess"))
    assert any(n["label"] == "setRelayer()" for n in g["nodes"])


def test_m2_one_and_five_shot():
    a1, a5 = m2_fewshot.episode_accuracy(1), m2_fewshot.episode_accuracy(5)
    assert 0 < a1 <= a5
    for s in samples.LABELS["samples"]:
        r = m2_fewshot.classify(samples.source(s["id"]), 5)
        assert abs(sum(r["probs"].values()) - 1) < 1e-3
        assert abs(sum(r["contributions"].values()) - 1) < 1e-3
        assert r["label"] == s["category"]


def test_m3_dp_sgd_clip_and_epsilon_monotone():
    r = m3_federated.run_fl(rounds=6, clients=5, epsilon=1.0, alpha=0.5)
    eps = [h["epsilon"] for h in r["history"]]
    assert all(b > a for a, b in zip(eps, eps[1:]))
    assert abs(eps[-1] - 1.0) < 1e-3
    assert all(h["grad_norm_post"] <= m3_federated.CLIP + 1e-9 for h in r["history"])
    F, _ = m3_federated.data()
    G = m3_federated._per_sample_grads(np.zeros((F.shape[1], 6)), F[:4], np.array([0, 1, 2, 3]))
    assert G.shape == (4, F.shape[1], 6)


def test_m4_invariants_for_each_vulnerable_sample():
    for s in samples.list_samples():
        r = client.post("/api/cd2/m4/report?k=5", json={"sample_id": s["id"]}).json()
        if s["vulnerable"]:
            assert r["risk_tier"] == "high"
            assert len(r["invariants"]) >= 1 and r["fixes"]
        else:
            assert r["risk_tier"] == "low"


def test_exploit_succeeds_on_vuln_and_blocked_on_safe():
    for sid in ["Cd2VulnBridgeNoNonce", "Cd2VulnBridgeAccess"]:
        v = client.post(f"/api/cd2/exploit/run?target=vuln&sample={sid}").json()
        s = client.post(f"/api/cd2/exploit/run?target=safe&sample={sid}").json()
        assert v["exploited"] and v["attacker_balance"] > v["locked"]
        assert not s["exploited"]
        assert any(tx["status"] == 0 for st in s["steps"] for tx in st["txs"])
    r = client.post("/api/cd2/m4/report?k=5", json={"sample_id": "Cd2VulnBridgeNoNonce"}).json()
    assert any(i["id"] == "INV-NONCE" and i["status"] == "verified" for i in r["invariants"])


def test_api_under_three_seconds():
    for method, path, body in [
        ("get", "/api/cd2/samples", None),
        ("post", "/api/cd2/m1/analyze", {"sample_id": "Cd2SafeBridge"}),
        ("post", "/api/cd2/m2/classify?k=1", {"sample_id": "Cd2SafeBridge"}),
        ("get", "/api/cd2/m2/embedding?k=5", None),
        ("post", "/api/cd2/m3/run", {"rounds": 10, "epsilon": 1.0, "alpha": 0.5}),
        ("post", "/api/cd2/exploit/run?target=vuln", None),
    ]:
        t = time.perf_counter()
        r = client.get(path) if method == "get" else client.post(path, json=body)
        assert r.status_code == 200, path
        assert time.perf_counter() - t < 3.0, path
