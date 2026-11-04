"""API CĐ3 · CrossSentry (prefix /api/cd3) — xem docs/modules/CD3.md.

Các thao tác ghi (/start, /tick, /approve, /reject, /reset) trả kèm `state` = ảnh chụp toàn bộ dashboard
(lanes, evidence, risk, series, responses, G-surv, graph) để UI và chế độ replay chỉ cần một lần gọi.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ...core.chain_routes import make_chain_router
from ...core.chainsim import jsonable
from .service import Cd3Session
from .traffic import SCENARIOS

router = APIRouter(prefix="/api/cd3", tags=["cd3 · CrossSentry"])
_state: dict[str, Cd3Session] = {}


def session() -> Cd3Session:
    if "s" not in _state:
        _state["s"] = Cd3Session()
    return _state["s"]


router.include_router(make_chain_router("/chain", lambda: session().sim, tag="cd3 · chain"))


def _guard(fn, *a):
    try:
        return fn(*a)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.get("/status")
def status() -> dict:
    s = _state.get("s")
    return {"module": "cd3", "status": "ready", "phase": "P4", "tick": s.tick_no if s else 0, "scenarios": SCENARIOS}


@router.post("/reset")
def reset() -> dict:
    _state["s"] = Cd3Session()
    return {"module": "cd3", "reset": True, "state": _state["s"].snapshot()}


@router.get("/state")
def state() -> dict:
    return session().snapshot()


@router.post("/start")
def start(scenario: str = Query("normal")) -> dict:
    s = session()
    r = _guard(s.start, scenario)
    return jsonable({**r, "state": s.snapshot()})


@router.post("/tick")
def tick(n: int = Query(1, ge=1, le=10)) -> dict:
    s = session()
    r = s.tick(n)
    return jsonable({**r, "state": s.snapshot()})


@router.get("/events")
def events() -> dict:
    return {"lanes": session().snapshot()["lanes"]}


@router.get("/graph")
def graph() -> dict:
    return session().snapshot()["graph"]


@router.get("/evidence")
def evidence() -> dict:
    return {"evidence": session().snapshot()["evidence"]}


@router.get("/risk")
def risk() -> dict:
    return session().risk()


@router.get("/responses")
def responses() -> dict:
    snap = session().snapshot()
    return {"queue": snap["queue"], "actions": snap["actions"], "executed": snap["executed"]}


@router.post("/approve/{qid}")
def approve(qid: int) -> dict:
    s = session()
    return jsonable({**_guard(s.decide, qid, True), "state": s.snapshot()})


@router.post("/reject/{qid}")
def reject(qid: int) -> dict:
    s = session()
    return jsonable({**_guard(s.decide, qid, False), "state": s.snapshot()})


@router.get("/gsurv")
def gsurv() -> dict:
    return session().gsurv()


class TuneBody(BaseModel):
    w_d: float = Field(1.0, ge=0, le=2)
    w_g: float = Field(0.5, ge=0, le=2)
    w_c: float = Field(0.3, ge=0, le=2)


@router.post("/tune")
def tune(body: TuneBody) -> dict:
    return session().tune(body.w_d, body.w_g, body.w_c)
