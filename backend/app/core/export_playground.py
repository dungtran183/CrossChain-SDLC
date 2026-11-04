"""Ghi replay cho trang /playground: `python -m app.core.export_playground`."""
from __future__ import annotations

from eth_account import Account

from ..main import app
from . import chain_routes
from .replay import Recorder


def main() -> None:
    chain_routes._playground.clear()
    rec = Recorder(app, "core", "playground", "python -m app.core.export_playground")
    rec.post("/api/chain/reset")
    rec.get("/api/chain")
    for name in ("chain-A", "chain-B"):
        rec.get(f"/api/chain/{name}/blocks?limit=12")
    wallet = Account.from_key("0x" + "42" * 32)
    for name, cid in (("chain-A", 31337), ("chain-B", 97)):
        rec.post(f"/api/chain/{name}/faucet", {"address": wallet.address, "eth": 1})
    to = "0x" + "11" * 20
    for nonce, (name, cid) in enumerate((("chain-A", 31337), ("chain-A", 31337))):
        tx = {"to": to, "value": 10**16, "gas": 21_000, "maxFeePerGas": 5 * 10**9, "maxPriorityFeePerGas": 1, "nonce": nonce, "chainId": cid, "type": 2}
        rec.post(f"/api/chain/{name}/send_raw", {"raw": "0x" + bytes(wallet.sign_transaction(tx).raw_transaction).hex()})
    bad = {"to": to, "value": 1, "gas": 21_000, "maxFeePerGas": 5 * 10**9, "maxPriorityFeePerGas": 1, "nonce": 2, "chainId": 97, "type": 2}
    rec.post("/api/chain/chain-A/send_raw", {"raw": "0x" + bytes(wallet.sign_transaction(bad).raw_transaction).hex()}, allow_error=True)
    tx = {"to": to, "value": 10**16, "gas": 21_000, "maxFeePerGas": 5 * 10**9, "maxPriorityFeePerGas": 1, "nonce": 0, "chainId": 97, "type": 2}
    rec.post("/api/chain/chain-B/send_raw", {"raw": "0x" + bytes(wallet.sign_transaction(tx).raw_transaction).hex()})
    for name in ("chain-A", "chain-B"):
        rec.get(f"/api/chain/{name}/blocks?limit=12")
    print("wrote", rec.save())


if __name__ == "__main__":
    main()
