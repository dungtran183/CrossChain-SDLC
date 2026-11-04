import secrets

from fastapi.testclient import TestClient

from app.main import app
from app.modules.cd1_univ import threshold, zkp_toy
from app.modules.cd1_univ.zkp_toy import Witness

client = TestClient(app)


def test_merkle_proof_valid_and_invalid():
    leaves = [zkp_toy.commit(f"s{i}", b"salt") for i in range(5)]
    root = zkp_toy.merkle_root(leaves)
    for i in range(5):
        assert zkp_toy.merkle_verify(leaves[i], zkp_toy.merkle_proof(leaves, i), root)
    assert not zkp_toy.merkle_verify(zkp_toy.commit("evil", b"salt"), zkp_toy.merkle_proof(leaves, 2), root)


def _statement(gpa: float, thr: float):
    w = Witness(gpa=zkp_toy.scale(gpa), r=secrets.randbelow(zkp_toy.Q))
    c = zkp_toy.pedersen(w.gpa, w.r)
    st = {"threshold": zkp_toy.scale(thr), "c_gpa": c, "context": "ctx|1"}
    return w, c, st


def test_toy_zkp_accepts_true_rejects_false():
    w, c, st = _statement(3.42, 3.2)
    proof = zkp_toy.prove_predicate(w, st["threshold"], c, st["context"])
    assert zkp_toy.verify_predicate(st, proof) == (True, "ok")
    # proof bị sửa
    bad = {**proof, "or_proofs": [dict(proof["or_proofs"][0], z0=proof["or_proofs"][0]["z0"] + 1)] + proof["or_proofs"][1:]}
    assert not zkp_toy.verify_predicate(st, bad)[0]
    # proof dùng lại với ngữ cảnh (nonce) khác
    assert not zkp_toy.verify_predicate({**st, "context": "ctx|2"}, proof)[0]


def test_toy_zkp_wrong_witness_cannot_prove():
    w, c, st = _statement(2.90, 3.2)
    try:
        zkp_toy.prove_predicate(w, st["threshold"], c, st["context"])
        raise AssertionError("honest prover must refuse")
    except ValueError:
        pass
    # gian lận: giả vờ gpa = ngưỡng với cùng r → phân rã bit không khớp C_gpa
    fake = zkp_toy.prove_predicate(Witness(gpa=st["threshold"], r=w.r), st["threshold"], c, st["context"])
    assert not zkp_toy.verify_predicate(st, fake)[0]


def test_shamir_threshold():
    sp = threshold.shamir_split(1234, 3, 5)
    assert threshold.shamir_combine(sp["shares"][:3]) == 1234
    assert threshold.shamir_combine(sp["shares"][2:]) == 1234
    assert threshold.shamir_combine(sp["shares"][:2]) != 1234


def _flow():
    assert client.post("/api/cd1/reset").json()["reset"]
    client.post("/api/cd1/setup")
    client.post("/api/cd1/issue")
    r = client.post("/api/cd1/prove", json={"student_id": "S3", "predicate": {"attr": "gpa", "op": ">=", "value": 3.2}})
    assert r.status_code == 200 and r.json()["satisfiable"]
    assert "gpa" not in r.json()["statement"]  # witness không nằm trong statement


def test_threshold_onchain_accept_reject_replay_revoke():
    _flow()
    ok = client.post("/api/cd1/verify").json()
    assert ok["accepted"] and ok["valid_sigs"] == 3 and ok["txs"][0]["chain"] == "chain-B"
    for kind in ("below_threshold", "signature", "duplicate", "proof"):
        r = client.post("/api/cd1/tamper", json={"kind": kind}).json()
        assert not r["accepted"], kind
        assert r["valid_sigs"] < 3
    rep = client.post("/api/cd1/tamper", json={"kind": "replay"}).json()
    assert not rep["accepted"] and "replay" in rep["reason"] and rep["txs"][0]["status"] == 0
    client.post("/api/cd1/revoke", json={"student_id": "S3"})
    client.post("/api/cd1/prove", json={"student_id": "S3", "predicate": {"attr": "gpa", "op": ">=", "value": 3.2}})
    after = client.post("/api/cd1/verify").json()
    assert not after["accepted"]
    assert any("revoked" in reason for c in after["relay_checks"] for reason in c["reasons"])


def test_unsatisfied_predicate_rejected_and_abe():
    _flow()
    client.post("/api/cd1/verify")
    assert client.post("/api/cd1/abe", json={"attrs": {"role": "HR", "org": "ACME"}}).json()["ok"]
    assert not client.post("/api/cd1/abe", json={"attrs": {"role": "HR", "org": "Other"}}).json()["ok"]
    client.post("/api/cd1/prove", json={"student_id": "S2", "predicate": {"attr": "gpa", "op": ">=", "value": 3.2}})
    assert not client.post("/api/cd1/verify").json()["accepted"]
    phases = [p["phase"] for p in client.get("/api/cd1/timeline").json()["phases"]]
    assert {"setup", "issue", "prove", "verify"} <= set(phases)


def test_order_enforced():
    client.post("/api/cd1/reset")
    assert client.post("/api/cd1/issue").status_code == 400
