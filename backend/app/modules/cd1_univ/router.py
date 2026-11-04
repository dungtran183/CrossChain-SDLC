"""API CĐ1 · Π_univ (prefix /api/cd1) — xem docs/modules/CD1.md."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...core.chain_routes import make_chain_router
from ...core.chainsim import jsonable
from . import threshold
from .service import Cd1Session

router = APIRouter(prefix="/api/cd1", tags=["cd1 · Π_univ"])
_state: dict[str, Cd1Session] = {}


def session() -> Cd1Session:
    if "s" not in _state:
        _state["s"] = Cd1Session()
    return _state["s"]


def _guard(fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


router.include_router(make_chain_router("/chain", lambda: session().sim, tag="cd1 · chain"))


@router.get("/status")
def status() -> dict:
    s = _state.get("s")
    return {"module": "cd1", "status": "ready", "phase": "P2", "steps": s.steps if s else None}


@router.post("/reset")
def reset() -> dict:
    _state["s"] = Cd1Session()
    return {"module": "cd1", "reset": True, "state": _state["s"].state()}


@router.get("/state")
def state() -> dict:
    return session().state()


@router.post("/setup")
def setup() -> dict:
    s = session()
    if s.steps["setup"] == "done":
        _state["s"] = s = Cd1Session()
    return jsonable({**s.setup(), "state": s.state()})


@router.post("/issue")
def issue() -> dict:
    s = session()
    return jsonable({**_guard(s.issue), "state": s.state()})


class Predicate(BaseModel):
    attr: Literal["gpa", "degree", "major", "year"] = "gpa"
    op: Literal[">=", "=="] = ">="
    value: float | str = 3.2


class ProveBody(BaseModel):
    student_id: str = "S3"
    predicate: Predicate | None = None
    predicates: list[Predicate] | None = None


@router.post("/prove")
def prove(body: ProveBody) -> dict:
    s = session()
    preds = body.predicates or [body.predicate or Predicate()]
    return {**_guard(s.prove, body.student_id, [p.model_dump() for p in preds]), "state": s.state()}


@router.post("/verify")
def verify() -> dict:
    s = session()
    return {**_guard(s.verify, None), "state": s.state()}


class TamperBody(BaseModel):
    kind: Literal["proof", "context", "swap", "signature", "below_threshold", "duplicate", "replay"]


@router.post("/tamper")
def tamper(body: TamperBody) -> dict:
    s = session()
    return {**_guard(s.verify, body.kind), "state": s.state()}


class RevokeBody(BaseModel):
    student_id: str = "S3"


@router.post("/revoke")
def revoke(body: RevokeBody) -> dict:
    s = session()
    return jsonable({**_guard(s.revoke, body.student_id), "state": s.state()})


@router.get("/timeline")
def timeline() -> dict:
    return session().timeline_view()


class ShamirBody(BaseModel):
    secret: int = Field(1234, ge=0, le=60000)
    t: int = Field(3, ge=1, le=7)
    n: int = Field(5, ge=1, le=7)
    use: list[int] = [1, 2, 3]


@router.post("/shamir")
def shamir(body: ShamirBody) -> dict:
    if body.t > body.n:
        raise HTTPException(400, "t must be <= n")
    return threshold.shamir_demo(body.secret, body.t, body.n, [x for x in body.use if 1 <= x <= body.n])


class AbeBody(BaseModel):
    attrs: dict[str, str]


@router.post("/abe")
def abe(body: AbeBody) -> dict:
    return _guard(session().abe_decrypt, body.attrs)
