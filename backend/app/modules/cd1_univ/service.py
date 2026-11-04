"""Trạng thái phiên demo CĐ1 Π_univ (Relay-TSS cho văn bằng số liên chuỗi).

Vai trò: Issuer (trường, chain-A) · Holder (người học) · Relay committee (n=5, t=3) · Verifier (doanh nghiệp, chain-B).
Luồng: setup → issue (Merkle root lên chain-A) → prove (ZKP vị từ, witness ở lại Holder) →
       verify (relay kiểm proof + Merkle + thu hồi → ký → submitAttestation trên chain-B) → revoke.
"""
from __future__ import annotations

import secrets
import time
from typing import Any

from eth_abi import encode
from eth_utils import keccak

from ...core.bus import bus
from ...core.chainsim import ChainSim, jsonable
from . import abe_toy, threshold, zkp_toy
from .zkp_toy import Witness

N_RELAYS = 5
THRESHOLD = 3
SRC_CHAIN_ID = 31337
VERIFIER_NAME = "ACME Corp"

STUDENTS = [
    {"id": "S1", "name": "Nguyễn An", "degree": "Bachelor", "major": "Information Security", "year": 2024, "gpa": 3.65},
    {"id": "S2", "name": "Trần Bình", "degree": "Bachelor", "major": "Computer Science", "year": 2024, "gpa": 2.90},
    {"id": "S3", "name": "Lê Chi", "degree": "Bachelor", "major": "Information Security", "year": 2024, "gpa": 3.42},
    {"id": "S4", "name": "Phạm Dũng", "degree": "Master", "major": "Blockchain Engineering", "year": 2024, "gpa": 3.10},
    {"id": "S5", "name": "Võ Em", "degree": "Bachelor", "major": "Software Engineering", "year": 2024, "gpa": 3.88},
]
TEXT_ATTRS = ("name", "degree", "major", "year")


def h(b: bytes) -> str:
    return "0x" + b.hex()


class Cd1Session:
    def __init__(self) -> None:
        self.sim = ChainSim(on_event=bus.hook("cd1"))
        self.a = self.sim["chain-A"]
        self.b = self.sim["chain-B"]
        self.issuer = self.a.accounts[0]
        self.relayer_tx = self.b.accounts[1]  # tài khoản trả gas để nộp attestation trên chain-B
        self.a.label(self.issuer, "Issuer (University)")
        self.b.label(self.relayer_tx, "Relay gateway")
        self.committee = threshold.make_committee(N_RELAYS)
        self.registry = None
        self.verifier = None
        self.batch_id = 0
        self.root: bytes | None = None
        self.creds: dict[str, dict] = {}  # id → {leaf, salts, commitments, witness}
        self.leaves: list[bytes] = []
        self.last: dict | None = None  # statement/proof/msg cuối cùng
        self.last_accepted: dict | None = None
        self.timeline: list[dict] = []
        self.txs: list[dict] = []
        self.steps: dict[str, str] = {k: "todo" for k in ("setup", "issue", "prove", "verify", "revoke")}
        self.abe_ct: dict | None = None
        self.attempt = 0

    # ------------------------------------------------------------- tiện ích
    def _tx(self, tx: dict) -> dict:
        self.txs.append(tx)
        return tx

    def _time(self, phase: str, t0: float, **sizes: Any) -> float:
        ms = round((time.perf_counter() - t0) * 1000, 2)
        self.timeline.append({"phase": phase, "ms": ms, **sizes})
        return ms

    def _require(self, *steps: str) -> None:
        for s in steps:
            if self.steps.get(s) not in ("done", "error"):
                raise ValueError(f"step '{s}' must run first")

    def public_student(self, s: dict) -> dict:
        return {k: s[k] for k in ("id", "name", "degree", "major", "year")}

    def state(self) -> dict:
        return jsonable(
            {
                "steps": self.steps,
                "threshold": THRESHOLD,
                "n": N_RELAYS,
                "issuer": self.issuer,
                "verifier": VERIFIER_NAME,
                "relays": [{"name": r.name, "address": r.address} for r in self.committee],
                "contracts": {
                    "registry": self.registry.address if self.registry else None,
                    "verifier": self.verifier.address if self.verifier else None,
                },
                "root": h(self.root) if self.root else None,
                "batch_id": self.batch_id,
                "students": [
                    {**self.public_student(s), "issued": s["id"] in self.creds, "revoked": self._revoked(s["id"])} for s in STUDENTS
                ],
                "chains": self.sim.info(),
            }
        )

    def _revoked(self, sid: str) -> bool:
        if not self.registry or sid not in self.creds:
            return False
        return bool(self.a.call(self.registry, "isRevoked", self.creds[sid]["leaf"]))

    # ---------------------------------------------------------------- bước 1
    def setup(self) -> dict:
        t0 = time.perf_counter()
        n0 = len(self.txs)
        self.registry = self.a.deploy("Cd1CredentialRegistry", sender=self.issuer, alias="CredentialRegistry")
        self._tx(self.a.last_deploy)
        self.verifier = self.b.deploy(
            "Cd1ThresholdVerifier", [r.address for r in self.committee], THRESHOLD, alias="ThresholdVerifier"
        )
        self._tx(self.b.last_deploy)
        ms = self._time("setup", t0)
        self.steps["setup"] = "done"
        return {
            "relays": [{"name": r.name, "address": r.address} for r in self.committee],
            "threshold": THRESHOLD,
            "n": N_RELAYS,
            "registry": self.registry.address,
            "verifier": self.verifier.address,
            "ms": ms,
            "txs": self.txs[n0:],
        }

    # ---------------------------------------------------------------- bước 2
    def issue(self) -> dict:
        self._require("setup")
        t0 = time.perf_counter()
        self.batch_id += 1
        self.creds.clear()
        self.leaves = []
        leaves_view = []
        for s in STUDENTS:
            salts = {a: secrets.token_bytes(16) for a in TEXT_ATTRS}
            commits = {a: zkp_toy.commit(str(s[a]), salts[a]) for a in TEXT_ATTRS}
            w = Witness(gpa=zkp_toy.scale(s["gpa"]), r=secrets.randbelow(zkp_toy.Q))
            c_gpa = zkp_toy.pedersen(w.gpa, w.r)
            leaf = keccak(s["id"].encode() + b"".join(commits[a] for a in TEXT_ATTRS) + zkp_toy.i2b(c_gpa))
            self.creds[s["id"]] = {"leaf": leaf, "salts": salts, "commits": commits, "witness": w, "c_gpa": c_gpa, "index": len(self.leaves)}
            self.leaves.append(leaf)
            leaves_view.append({"id": s["id"], "leaf": h(leaf), "c_gpa": str(c_gpa)})
        self.root = zkp_toy.merkle_root(self.leaves)
        tree = [[h(x) for x in lvl] for lvl in zkp_toy.merkle_tree(self.leaves)]
        tx = self._tx(self.a.transact(self.registry, "anchorRoot", self.root, self.batch_id, len(self.leaves), sender=self.issuer))
        ms = self._time("issue", t0, leaves=len(self.leaves))
        self.steps["issue"] = "done"
        self.steps["revoke"] = "todo"
        return {"batch_id": self.batch_id, "root": h(self.root), "leaves": leaves_view, "tree": tree, "ms": ms, "txs": [tx]}

    # ---------------------------------------------------------------- bước 3
    def prove(self, student_id: str, attr: str, op: str, value: float) -> dict:
        self._require("issue")
        if attr != "gpa" or op != ">=":
            raise ValueError("demo supports predicate gpa >= value")
        if student_id not in self.creds:
            raise ValueError(f"unknown student {student_id}")
        t0 = time.perf_counter()
        cred = self.creds[student_id]
        threshold_v = zkp_toy.scale(value)
        nonce = secrets.randbelow(2**62)
        ctx = f"{VERIFIER_NAME}|nonce={nonce}|src={SRC_CHAIN_ID}"
        statement = {
            "predicate": f"gpa >= {value:.2f}",
            "threshold": threshold_v,
            "c_gpa": cred["c_gpa"],
            "leaf": h(cred["leaf"]),
            "merkle_proof": zkp_toy.merkle_proof(self.leaves, cred["index"]),
            "root": h(self.root),
            "batch_id": self.batch_id,
            "context": ctx,
            "nonce": nonce,
            "src_chain_id": SRC_CHAIN_ID,
        }
        honest = True
        try:
            proof = zkp_toy.prove_predicate(cred["witness"], threshold_v, cred["c_gpa"], ctx)
        except ValueError:
            # Prover trung thực không thể chứng minh điều sai → demo tạo "bằng chứng gian lận" để relay từ chối.
            honest = False
            fake = Witness(gpa=threshold_v, r=cred["witness"].r)
            proof = zkp_toy.prove_predicate(fake, threshold_v, cred["c_gpa"], ctx)
        ms = self._time("prove", t0, proof_bytes=zkp_toy.proof_size(proof))
        self.last = {"student_id": student_id, "statement": statement, "proof": proof, "honest": honest}
        self.steps["prove"] = "done"
        s = next(x for x in STUDENTS if x["id"] == student_id)
        return jsonable(
            {
                "student_id": student_id,
                "statement": statement,
                "proof": proof,
                "proof_bytes": zkp_toy.proof_size(proof),
                "satisfiable": honest,
                "witness_hidden": {
                    "gpa": "•••",
                    "randomness r": "•••",
                    "salts": len(TEXT_ATTRS),
                    "bits of d": zkp_toy.K_BITS,
                },
                # Hiển thị riêng phía Holder (không gửi qua cầu) để khán giả đối chiếu:
                "holder_view": {"gpa": s["gpa"], "d": (cred["witness"].gpa - threshold_v) / 100},
                "ms": ms,
            }
        )

    # ---------------------------------------------------------------- bước 4
    def _msg_hash(self, st: dict, proof: dict, attempt: int) -> bytes:
        """msgHash = keccak(root, statementHash, proofDigest, nonce, srcChainId); nonce = (challenge của verifier ‖ lượt relay)."""
        st_hash = keccak(f"{st['predicate']}|{st['leaf']}|{st['c_gpa']}".encode())
        nonce = (st["nonce"] << 32) | attempt
        return keccak(
            encode(
                ["bytes32", "bytes32", "bytes32", "uint256", "uint256"],
                [bytes.fromhex(st["root"][2:]), st_hash, zkp_toy.proof_digest(proof), nonce, st["src_chain_id"]],
            )
        )

    def _relay_check(self, st: dict, proof: dict) -> list[dict]:
        """Mỗi relay độc lập: đọc root + trạng thái thu hồi trên chain-A, kiểm Merkle, kiểm ZKP."""
        onchain_root = self.a.call(self.registry, "roots", st["batch_id"])
        leaf = bytes.fromhex(st["leaf"][2:])
        merkle_ok = zkp_toy.merkle_verify(leaf, st["merkle_proof"], onchain_root)
        revoked = bool(self.a.call(self.registry, "isRevoked", leaf))
        zk_ok, zk_reason = zkp_toy.verify_predicate(st, proof)
        out = []
        for r in self.committee:
            reasons = []
            if not merkle_ok:
                reasons.append("merkle proof invalid")
            if revoked:
                reasons.append("credential revoked")
            if not zk_ok:
                reasons.append(f"zkp: {zk_reason}")
            out.append({"relay": r.name, "address": r.address, "ok": not reasons, "reasons": reasons})
        return out

    def _submit(self, msg_hash: bytes, sigs: list[bytes], note: str) -> dict:
        return self._tx(self.b.transact(self.verifier, "submitAttestation", msg_hash, sigs, sender=self.relayer_tx, note=note))

    def _outcome(self, tx: dict) -> tuple[bool, str, int]:
        if tx["status"] == 0:
            return False, tx.get("reason", "reverted"), 0
        for ev in tx["events"]:
            if ev["event"] == "AttestationAccepted":
                return True, "accepted", int(ev["args"]["validSigs"])
            if ev["event"] == "AttestationRejected":
                return False, str(ev["args"]["reason"]), int(ev["args"]["validSigs"])
        return False, "no event", 0

    def verify(self, kind: str | None = None) -> dict:
        """Xác minh liên chuỗi. `kind` = None (trung thực) hoặc kiểu giả mạo: proof|signature|below_threshold|duplicate|replay."""
        self._require("prove")
        assert self.last is not None
        t0 = time.perf_counter()
        st, proof = dict(self.last["statement"]), dict(self.last["proof"])
        if kind == "proof":
            ors = [dict(x) for x in proof["or_proofs"]]
            ors[0]["z0"] = (ors[0]["z0"] + 1) % zkp_toy.Q
            proof["or_proofs"] = ors
        if kind == "replay":
            if not self.last_accepted:
                raise ValueError("no accepted attestation to replay yet")
            msg_hash, sigs = self.last_accepted["msg_hash"], self.last_accepted["sigs"]
            checks = [{"relay": "—", "address": "", "ok": True, "reasons": ["re-submitting an already accepted message"]}]
            signers = []
        else:
            checks = self._relay_check(st, proof)
            self.attempt += 1
            msg_hash = self._msg_hash(st, proof, self.attempt)
            # Relay phản hồi với độ trễ khác nhau; gateway nộp ngay khi gom đủ t chữ ký nhanh nhất.
            for c in checks:
                c["latency_ms"] = 40 + secrets.randbelow(160)
            ok = sorted((c for c in checks if c["ok"]), key=lambda c: c["latency_ms"])[:THRESHOLD]
            relays = [r for c in ok for r in self.committee if r.name == c["relay"]]
            if kind == "below_threshold":
                relays = relays[: THRESHOLD - 1]
            if kind == "signature":
                relays = [threshold.forged_signer(i) for i in range(THRESHOLD)]
            sigs = [r.sign(msg_hash) for r in relays]
            if kind == "duplicate" and sigs:
                sigs = [sigs[0]] * THRESHOLD
                relays = [relays[0]] * THRESHOLD
            signers = [{"relay": r.name, "address": r.address} for r in relays]
        sign_ms = round((time.perf_counter() - t0) * 1000, 2)
        tx = self._submit(msg_hash, sigs, note=f"submitAttestation{' · ' + kind if kind else ''}")
        accepted, reason, valid = self._outcome(tx)
        if accepted and kind is None:
            self.last_accepted = {"msg_hash": msg_hash, "sigs": sigs}
        ms = self._time("verify" if kind is None else f"tamper:{kind}", t0, sig_bytes=65 * len(sigs))
        abe = None
        if accepted:
            payload = {"student": self.last["student_id"], "predicate": st["predicate"], "msgHash": h(msg_hash), "tx": tx["hash"]}
            self.abe_ct = abe_toy.encrypt(payload, [["role=HR", "org=ACME"], ["role=Auditor"]])
            abe = {k: self.abe_ct[k] for k in ("id", "policy", "policy_str", "size")} | {"preview": self.abe_ct["ciphertext_b64"][:48] + "…"}
            self.timeline.append({"phase": "abe", "ms": 0.1, "abe_bytes": self.abe_ct["size"]})
        if kind is None:
            self.steps["verify"] = "done"  # bước đã chạy; kết quả chấp nhận/từ chối hiển thị riêng
        return jsonable(
            {
                "kind": kind or "honest",
                "msg_hash": h(msg_hash),
                "relay_checks": checks,
                "signers": signers,
                "sigs": [h(s)[:20] + "…" for s in sigs],
                "valid_sigs": valid,
                "threshold": THRESHOLD,
                "accepted": accepted,
                "reason": reason,
                "sign_ms": sign_ms,
                "ms": ms,
                "abe": abe,
                "txs": [tx],
            }
        )

    # ---------------------------------------------------------------- bước 5
    def revoke(self, student_id: str) -> dict:
        self._require("issue")
        t0 = time.perf_counter()
        cred = self.creds[student_id]
        tx = self._tx(self.a.transact(self.registry, "revoke", cred["leaf"], sender=self.issuer))
        ms = self._time("revoke", t0)
        self.steps["revoke"] = "done"
        return {"student_id": student_id, "credential_hash": h(cred["leaf"]), "ms": ms, "txs": [tx]}

    # ------------------------------------------------------------- phụ trợ
    def abe_decrypt(self, attrs: dict[str, str]) -> dict:
        if not self.abe_ct:
            raise ValueError("no ciphertext yet — run verify first")
        return {"attrs": attrs, "policy": self.abe_ct["policy_str"], **abe_toy.decrypt(self.abe_ct, attrs)}

    def timeline_view(self) -> dict:
        return {"phases": self.timeline}
