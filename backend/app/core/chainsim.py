"""ChainSim — nhiều chuỗi EVM in-memory (py-evm qua eth-tester), mỗi chuỗi một Web3 riêng.

Dùng chung cho mọi module (mỗi module tự tạo ChainSim của riêng mình — không singleton toàn cục):
- deploy(artifact, *args, alias=)          → triển khai hợp đồng từ contracts/artifacts
- transact(contract, fn, *args, sender=)    → gọi hàm ghi; tx lỗi vẫn được đào thành block status=0
                                              (để explorer thấy "tx đỏ") và trả lý do revert
- call(contract, fn, *args)                 → gọi hàm đọc
- faucet(addr, wei) · send_raw(raw)         → ví trình duyệt; send_raw tự kiểm chain_id (py-evm không kiểm)
- blocks(limit) · snapshot() / revert(id)   → explorer + đặt lại trạng thái
Mọi kết quả trả về là dict JSON-able (số lớn → chuỗi) để frontend/replay dùng trực tiếp.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Callable

import rlp
from eth_account.typed_transactions import TypedTransaction
from eth_tester import EthereumTester, PyEVMBackend
from eth_utils import event_abi_to_log_topic
from hexbytes import HexBytes
from web3 import Web3
from web3.providers.eth_tester import EthereumTesterProvider
from web3.providers.eth_tester.defaults import API_ENDPOINTS, static_return

from .artifacts import load_artifact

DEFAULT_CHAINS: dict[str, int] = {
    "chain-A": 31337,  # "Ethereum-like" — chuỗi nguồn
    "chain-B": 97,  # "BSC-like" — chuỗi đích
}

FAIL_GAS = 800_000  # gas cấp cho tx biết trước sẽ revert (để vẫn được đào thành block)
JS_SAFE_INT = 2**53 - 1


def jsonable(v: Any) -> Any:
    """Chuyển giá trị web3 (bytes, HexBytes, AttributeDict, int lớn) thành JSON an toàn cho JS."""
    if isinstance(v, (bytes, bytearray, HexBytes)):
        return "0x" + bytes(v).hex()
    if isinstance(v, bool) or v is None or isinstance(v, (str, float)):
        return v
    if isinstance(v, int):
        return v if abs(v) <= JS_SAFE_INT else str(v)
    if isinstance(v, dict) or hasattr(v, "items"):
        return {str(k): jsonable(x) for k, x in dict(v).items()}
    if isinstance(v, (list, tuple)):
        return [jsonable(x) for x in v]
    return str(v)


_REVERT_RE = re.compile(r"execution reverted:?\s*(.*)", re.S)


def revert_reason(exc: BaseException) -> str:
    """Rút gọn thông điệp revert từ exception của web3/eth-tester."""
    msg = str(exc.args[0] if getattr(exc, "args", None) else exc)
    m = _REVERT_RE.search(msg)
    reason = (m.group(1) if m else msg).strip().strip("'\"")
    if reason.startswith("b'") or reason in ("", "b''"):
        reason = reason.strip("b'") or "reverted"
    return reason[:200]


def raw_tx_chain_id(raw: bytes) -> int | None:
    """Đọc chain_id của raw tx (typed EIP-2718 hoặc legacy EIP-155). None nếu tx legacy không có chain_id."""
    if raw and raw[0] <= 0x7F:
        return int(TypedTransaction.from_bytes(HexBytes(raw)).as_dict()["chainId"])
    fields = rlp.decode(raw)
    v = int.from_bytes(fields[6], "big")
    return (v - 35) // 2 if v >= 35 else None


def _make_backend(chain_id: int) -> PyEVMBackend:
    """Tạo backend py-evm với chain_id riêng (mặc định của eth-tester là 131277322940537)."""
    genesis = PyEVMBackend.generate_genesis_params(overrides={"gas_limit": 30_000_000})
    backend = PyEVMBackend(genesis_parameters=genesis)
    # chain_id là thuộc tính lớp của chain py-evm; ghi đè trên instance để VM ký/kiểm tx theo id này.
    backend.chain.chain_id = chain_id
    return backend


def _make_provider(tester: EthereumTester, chain_id: int) -> EthereumTesterProvider:
    """Provider web3 trả về đúng chain_id (mặc định web3 trả hằng số cố định cho eth_chainId)."""
    endpoints = {ns: dict(methods) for ns, methods in API_ENDPOINTS.items()}  # copy 2 tầng, không deepcopy
    endpoints["eth"]["chainId"] = static_return(chain_id)
    return EthereumTesterProvider(tester, api_endpoints=endpoints)


EventHook = Callable[[str, dict], None]


@dataclass
class Chain:
    name: str
    chain_id: int
    w3: Web3
    tester: EthereumTester
    contracts: dict[str, Any] = field(default_factory=dict)
    on_event: EventHook | None = None
    _topics: dict[bytes, tuple[str, Any]] = field(default_factory=dict)
    _labels: dict[str, str] = field(default_factory=dict)  # địa chỉ → nhãn hiển thị

    # ------------------------------------------------------------------ cơ bản
    @property
    def accounts(self) -> list[str]:
        return list(self.w3.eth.accounts)

    def label(self, address: str, name: str) -> None:
        self._labels[Web3.to_checksum_address(address)] = name

    def label_of(self, address: str | None) -> str | None:
        if not address:
            return None
        return self._labels.get(Web3.to_checksum_address(address))

    def _emit(self, kind: str, data: dict) -> None:
        if self.on_event:
            try:
                self.on_event(kind, data)
            except Exception:  # noqa: BLE001 - bus không được làm hỏng giao dịch
                pass

    def deploy(self, artifact_name: str, *args: Any, sender: str | None = None, alias: str | None = None) -> Any:
        art = load_artifact(artifact_name)
        factory = self.w3.eth.contract(abi=art["abi"], bytecode=art["bytecode"])
        tx_hash = factory.constructor(*args).transact({"from": sender or self.accounts[0]})
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        contract = self.w3.eth.contract(address=receipt.contractAddress, abi=art["abi"])
        key = alias or artifact_name
        self.contracts[key] = contract
        self.label(receipt.contractAddress, key)
        for item in art["abi"]:
            if item.get("type") == "event":
                self._topics[bytes(event_abi_to_log_topic(item))] = (item["name"], contract)
        self._emit("tx", self.tx_summary(tx_hash, fn=f"deploy {key}"))
        return contract

    # ------------------------------------------------------------- giao dịch
    def transact(
        self,
        contract: Any,
        fn: str,
        *args: Any,
        sender: str | None = None,
        value: int = 0,
        note: str | None = None,
    ) -> dict:
        """Gọi hàm ghi. Nếu revert: vẫn đào tx (status=0) và trả `reason`."""
        sender = sender or self.accounts[0]
        params = {"from": sender, "value": value}
        func = contract.functions[fn](*args)
        reason = None
        try:
            func.call(params)
        except Exception as e:  # noqa: BLE001 - mọi lỗi revert/validation
            reason = revert_reason(e)
        if reason is None:
            tx_hash = func.transact(params)
        else:
            data = contract.encode_abi(fn, args=list(args))
            tx_hash = self.w3.eth.send_transaction(
                {"from": sender, "to": contract.address, "data": data, "value": value, "gas": FAIL_GAS}
            )
        summary = self.tx_summary(tx_hash, fn=note or fn)
        if reason is not None:
            summary["reason"] = reason
        self._emit("tx", summary)
        return summary

    def call(self, contract: Any, fn: str, *args: Any) -> Any:
        return contract.functions[fn](*args).call()

    def send_eth(self, to: str, wei: int, sender: str | None = None) -> dict:
        tx_hash = self.w3.eth.send_transaction({"from": sender or self.accounts[0], "to": to, "value": wei})
        s = self.tx_summary(tx_hash, fn="transfer")
        self._emit("tx", s)
        return s

    def faucet(self, address: str, wei: int = 10**18) -> dict:
        return self.send_eth(Web3.to_checksum_address(address), wei)

    def balance(self, address: str) -> int:
        return self.w3.eth.get_balance(Web3.to_checksum_address(address))

    def send_raw(self, raw: bytes | str) -> dict:
        """Nhận tx đã ký ở trình duyệt. Tự kiểm chain_id vì py-evm không từ chối tx sai chuỗi."""
        raw_b = bytes(HexBytes(raw))
        cid = raw_tx_chain_id(raw_b)
        if cid != self.chain_id:
            raise ValueError(f"chain_id mismatch: tx={cid} chain={self.chain_id} ({self.name})")
        tx_hash = self.w3.eth.send_raw_transaction(raw_b)
        s = self.tx_summary(tx_hash, fn="raw tx")
        self._emit("tx", s)
        return s

    # -------------------------------------------------------------- truy vấn
    def decode_logs(self, logs: list) -> list[dict]:
        out = []
        for lg in logs:
            topics = lg.get("topics") or []
            if not topics:
                continue
            hit = self._topics.get(bytes(topics[0]))
            if not hit:
                continue
            name, contract = hit
            try:
                ev = contract.events[name]().process_log(lg)
            except Exception:  # noqa: BLE001 - log của hợp đồng khác cùng chữ ký
                continue
            out.append(
                {
                    "event": name,
                    "address": lg["address"],
                    "contract": self.label_of(lg["address"]),
                    "args": jsonable(dict(ev["args"])),
                }
            )
        return out

    def tx_summary(self, tx_hash: Any, fn: str | None = None) -> dict:
        r = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        tx = self.w3.eth.get_transaction(tx_hash)
        to = r.get("to") or r.get("contractAddress")
        return {
            "chain": self.name,
            "chain_id": self.chain_id,
            "hash": jsonable(r["transactionHash"]),
            "block": r["blockNumber"],
            "from": r["from"],
            "from_label": self.label_of(r["from"]),
            "to": to,
            "to_label": self.label_of(to),
            "fn": fn,
            "value": jsonable(tx.get("value", 0)),
            "gas_used": r["gasUsed"],
            "status": int(r["status"]),
            "events": self.decode_logs(r["logs"]),
        }

    def blocks(self, limit: int = 12) -> list[dict]:
        head = self.w3.eth.block_number
        out = []
        for n in range(head, max(-1, head - limit), -1):
            b = self.w3.eth.get_block(n, full_transactions=False)
            out.append(
                {
                    "number": b["number"],
                    "hash": jsonable(b["hash"]),
                    "timestamp": b["timestamp"],
                    "tx_count": len(b["transactions"]),
                    "txs": [jsonable(h) for h in b["transactions"]],
                    "gas_used": b["gasUsed"],
                }
            )
        return out

    def snapshot(self) -> Any:
        return self.tester.take_snapshot()

    def revert(self, snapshot_id: Any) -> None:
        self.tester.revert_to_snapshot(snapshot_id)

    def info(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "chain_id": self.w3.eth.chain_id,
            "block_number": self.w3.eth.block_number,
            "accounts": len(self.accounts),
            "contracts": {k: c.address for k, c in sorted(self.contracts.items())},
        }


class ChainSim:
    """Tập hợp các chuỗi EVM độc lập. Mỗi module nên tạo ChainSim của riêng mình."""

    def __init__(self, chains: dict[str, int] | None = None, on_event: EventHook | None = None) -> None:
        self.chains: dict[str, Chain] = {}
        self.on_event = on_event
        for name, chain_id in (chains or DEFAULT_CHAINS).items():
            self.add_chain(name, chain_id)

    def add_chain(self, name: str, chain_id: int) -> Chain:
        tester = EthereumTester(backend=_make_backend(chain_id))
        w3 = Web3(_make_provider(tester, chain_id))
        chain = Chain(name=name, chain_id=chain_id, w3=w3, tester=tester, on_event=self.on_event)
        self.chains[name] = chain
        return chain

    def __getitem__(self, name: str) -> Chain:
        return self.chains[name]

    def __contains__(self, name: str) -> bool:
        return name in self.chains

    def info(self) -> list[dict[str, Any]]:
        return [c.info() for c in self.chains.values()]
