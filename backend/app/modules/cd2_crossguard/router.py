"""API CĐ2 · CrossGuard (prefix /api/cd2) — xem docs/modules/CD2.md."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from . import exploit, m1_repr, m2_fewshot, m3_federated, m4_audit, samples

router = APIRouter(prefix="/api/cd2", tags=["cd2 · CrossGuard"])
_verified: dict[str, set[str]] = {}  # sample → bất biến đã được Exploit lab kiểm

INV_BY_ATTACK = {"replay": "INV-NONCE", "duplicate_sig": "INV-THRESH", "fake_source": "INV-SRC", "hijack_relayer": "INV-ACL", "oracle_manipulation": "INV-ORACLE", "reentrancy": "INV-CEI", "cross_chain_replay": "INV-DOMAIN"}


def _src(sample_id: str | None, code: str | None) -> str:
    if code:
        if len(code) > 20_000:
            raise HTTPException(400, "code too long")
        return code
    try:
        return samples.source(sample_id or "Cd2VulnBridgeNoNonce")
    except KeyError as e:
        raise HTTPException(404, f"unknown sample {sample_id}") from e


@router.get("/status")
def status() -> dict:
    return {"module": "cd2", "status": "ready", "phase": "P3"}


@router.post("/reset")
def reset() -> dict:
    _verified.clear()
    return {"module": "cd2", "reset": True}


@router.get("/samples")
def list_samples() -> dict:
    return {"samples": samples.list_samples(), "categories": samples.CATEGORIES}


@router.get("/samples/{sample_id}")
def get_sample(sample_id: str) -> dict:
    src = _src(sample_id, None)
    return {**samples.meta(sample_id), "source": src, "bug_lines": samples.bug_lines(src)}


class CodeBody(BaseModel):
    sample_id: str | None = "Cd2VulnBridgeNoNonce"
    code: str | None = None
    after_exploit: bool = False  # chỉ để phân biệt bản ghi replay (báo cáo sau khi Exploit lab xác minh)


@router.post("/m1/analyze")
def m1(body: CodeBody) -> dict:
    return m1_repr.analyze(_src(body.sample_id, body.code))


@router.post("/m2/classify")
def m2(body: CodeBody, k: int = Query(5, ge=1, le=10)) -> dict:
    src = _src(body.sample_id, body.code)
    return {**m2_fewshot.classify(src, k), "point": m2_fewshot.project(src, k)}


@router.get("/m2/embedding")
def m2_embedding(k: int = Query(5, ge=1, le=10)) -> dict:
    e = m2_fewshot.embedding(k)
    return {
        "k_shot": k,
        "points": e["points"],
        "prototypes": e["prototypes"],
        "episode_accuracy": {"1": m2_fewshot.episode_accuracy(1), "5": m2_fewshot.episode_accuracy(5)},
    }


class FlBody(BaseModel):
    rounds: int = Field(10, ge=1, le=30)
    epsilon: float | None = Field(1.0, gt=0, le=10)
    alpha: float = Field(0.5, gt=0, le=10)


@router.post("/m3/run")
def m3(body: FlBody) -> dict:
    return m3_federated.compare(body.rounds, body.epsilon, body.alpha)


@router.post("/m4/report")
def m4(body: CodeBody, k: int = Query(5, ge=1, le=10)) -> dict:
    sid = body.sample_id or "Cd2VulnBridgeNoNonce"
    _src(sid, None)
    return m4_audit.report(sid, k, _verified.get(sid))


@router.post("/exploit/run")
def exploit_run(target: Literal["vuln", "safe"] = Query("vuln"), sample: str = Query("Cd2VulnBridgeNoNonce")) -> dict:
    if sample not in exploit.ATTACKS:
        raise HTTPException(400, "exploit lab supports the 5 vulnerable samples")
    r = exploit.run(sample, target)
    if target == "safe" and not r["exploited"]:
        _verified.setdefault(sample, set()).add(INV_BY_ATTACK[r["attack"]])
    return r
