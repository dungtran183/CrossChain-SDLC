"""Route chuỗi dùng chung.

- `make_chain_router(prefix, get_sim)`: tạo router `/…/chain/{name}/info|blocks` cho ChainSim của một module
  (vd prefix="/api/cd1/chain"), để mỗi module có explorer riêng mà không chia sẻ trạng thái.
- `router`: chuỗi "playground" của lõi tại `/api/chain/*` (faucet, send_raw cho ví trình duyệt).
"""
from __future__ import annotations

from typing import Callable

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .bus import bus
from .chainsim import Chain, ChainSim


def _chain(sim: ChainSim, name: str) -> Chain:
    if name not in sim:
        raise HTTPException(404, f"unknown chain '{name}'")
    return sim[name]


def make_chain_router(prefix: str, get_sim: Callable[[], ChainSim], tag: str = "chain") -> APIRouter:
    r = APIRouter(prefix=prefix, tags=[tag])

    @r.get("")
    def chains() -> list[dict]:
        return get_sim().info()

    @r.get("/{name}/info")
    def info(name: str) -> dict:
        return _chain(get_sim(), name).info()

    @r.get("/{name}/blocks")
    def blocks(name: str, limit: int = 12) -> list[dict]:
        return _chain(get_sim(), name).blocks(max(1, min(limit, 50)))

    return r


# ---------------------------------------------------------------- playground
_playground: dict[str, ChainSim] = {}


def playground() -> ChainSim:
    if "sim" not in _playground:
        sim = ChainSim(on_event=bus.hook("core"))
        for c in sim.chains.values():
            ping = c.deploy("Ping", f"hello from {c.name}")
            c.transact(ping, "ping", "genesis")
        _playground["sim"] = sim
    return _playground["sim"]


router = make_chain_router("/api/chain", playground, tag="core · chain")


class FaucetBody(BaseModel):
    address: str
    eth: float = 1.0


class RawBody(BaseModel):
    raw: str


@router.post("/{name}/faucet")
def faucet(name: str, body: FaucetBody) -> dict:
    wei = int(max(0.0, min(body.eth, 100.0)) * 10**18)
    return _chain(playground(), name).faucet(body.address, wei)


@router.post("/{name}/send_raw")
def send_raw(name: str, body: RawBody) -> dict:
    try:
        return _chain(playground(), name).send_raw(body.raw)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.get("/{name}/balance/{address}")
def balance(name: str, address: str) -> dict:
    c = _chain(playground(), name)
    return {"address": address, "wei": str(c.balance(address)), "nonce": c.w3.eth.get_transaction_count(c.w3.to_checksum_address(address))}


@router.post("/reset")
def reset() -> dict:
    _playground.clear()
    playground()
    return {"reset": True}
