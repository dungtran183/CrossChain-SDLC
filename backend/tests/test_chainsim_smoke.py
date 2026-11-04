from eth_account import Account

from app.core.chainsim import ChainSim


def test_two_independent_chains():
    sim = ChainSim()
    a, b = sim["chain-A"], sim["chain-B"]
    assert a.w3.eth.chain_id == 31337
    assert b.w3.eth.chain_id == 97
    a.w3.eth.send_transaction({"from": a.accounts[0], "to": a.accounts[1], "value": 1})
    assert a.w3.eth.block_number == 1
    assert b.w3.eth.block_number == 0  # chuỗi B không bị ảnh hưởng


def test_deploy_and_call_ping():
    chain = ChainSim()["chain-A"]
    ping = chain.deploy("Ping", "hello")
    assert ping.functions.label().call() == "hello"
    tx = ping.functions.ping("x").transact({"from": chain.accounts[1]})
    receipt = chain.w3.eth.wait_for_transaction_receipt(tx)
    assert ping.functions.count().call() == 1
    events = ping.events.Pinged().process_receipt(receipt)
    assert events[0]["args"]["note"] == "x"


def test_raw_tx_from_fresh_wallet():
    """Mô phỏng ví trình duyệt: ví mới ký tx thô, chuỗi nhận qua eth_sendRawTransaction."""
    chain = ChainSim()["chain-B"]
    w3 = chain.w3
    wallet = Account.create()
    w3.eth.send_transaction({"from": chain.accounts[0], "to": wallet.address, "value": 10**18})
    tx = {
        "to": chain.accounts[1],
        "value": 10**15,
        "gas": 21_000,
        "maxFeePerGas": w3.to_wei(5, "gwei"),
        "maxPriorityFeePerGas": 1,
        "nonce": 0,
        "chainId": 97,
    }
    tx_hash = w3.eth.send_raw_transaction(wallet.sign_transaction(tx).raw_transaction)
    assert w3.eth.wait_for_transaction_receipt(tx_hash).status == 1
