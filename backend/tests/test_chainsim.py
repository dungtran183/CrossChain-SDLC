import pytest
from eth_account import Account
from fastapi.testclient import TestClient

from app.core.chainsim import ChainSim, raw_tx_chain_id


def _signed(chain_id: int, to: str, nonce: int = 0) -> bytes:
    acct = Account.create()
    tx = {
        "to": to, "value": 1, "gas": 21_000, "maxFeePerGas": 5 * 10**9,
        "maxPriorityFeePerGas": 1, "nonce": nonce, "chainId": chain_id,
    }
    return acct, bytes(acct.sign_transaction(tx).raw_transaction)


def test_transact_returns_events_and_revert_is_mined():
    c = ChainSim()["chain-A"]
    ping = c.deploy("Ping", "x")
    ok = c.transact(ping, "ping", "hi")
    assert ok["status"] == 1 and ok["events"][0]["event"] == "Pinged"
    assert ok["events"][0]["args"]["note"] == "hi"
    assert ok["to_label"] == "Ping"
    bad = c.transact(ping, "ping", "hi", value=1)  # hàm non-payable → revert
    assert bad["status"] == 0 and "reason" in bad
    assert bad["block"] == ok["block"] + 1  # tx lỗi vẫn thành block


def test_faucet_send_raw_and_chain_id_check():
    sim = ChainSim()
    b = sim["chain-B"]
    acct, raw = _signed(97, b.accounts[1])
    b.faucet(acct.address, 10**18)
    assert raw_tx_chain_id(raw) == 97
    assert b.send_raw(raw)["status"] == 1
    acct2, raw_wrong = _signed(31337, b.accounts[1])
    b.faucet(acct2.address, 10**18)
    with pytest.raises(ValueError):
        b.send_raw(raw_wrong)


def test_snapshot_revert_and_blocks():
    c = ChainSim()["chain-A"]
    snap = c.snapshot()
    c.deploy("Ping", "x")
    assert c.w3.eth.block_number == 1
    assert c.blocks(5)[0]["tx_count"] == 1
    c.revert(snap)
    assert c.w3.eth.block_number == 0


def test_core_chain_routes():
    from app.main import app

    client = TestClient(app)
    info = client.get("/api/chain/chain-A/info").json()
    assert info["chain_id"] == 31337 and "Ping" in info["contracts"]
    acct, raw = _signed(31337, "0x" + "11" * 20)
    assert client.post("/api/chain/chain-A/faucet", json={"address": acct.address}).json()["status"] == 1
    assert client.post("/api/chain/chain-A/send_raw", json={"raw": "0x" + raw.hex()}).json()["status"] == 1
    _, raw_b = _signed(97, "0x" + "11" * 20)
    assert client.post("/api/chain/chain-A/send_raw", json={"raw": "0x" + raw_b.hex()}).status_code == 400
    assert client.get("/api/chain/nope/info").status_code == 404
