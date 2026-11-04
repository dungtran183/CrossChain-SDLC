"""ChainSim — nhiều chuỗi EVM in-memory (py-evm qua eth-tester), mỗi chuỗi một Web3 riêng.

Bản tối thiểu (Phase 0-init). Phase P1 sẽ bổ sung: faucet, send_raw, snapshot/revert,
truy vấn block/tx/log và phát sự kiện lên event bus.

Lưu ý cho P1: py-evm KHÔNG từ chối raw tx ký với chain_id khác — send_raw phải tự giải mã tx
(eth_account.typed_transactions / rlp) và so chain_id trước khi chuyển cho eth_sendRawTransaction.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from eth_tester import EthereumTester, PyEVMBackend
from web3 import Web3
from web3.providers.eth_tester import EthereumTesterProvider
from web3.providers.eth_tester.defaults import API_ENDPOINTS, static_return

from .artifacts import load_artifact

DEFAULT_CHAINS: dict[str, int] = {
    "chain-A": 31337,  # "Ethereum-like" — chuỗi nguồn
    "chain-B": 97,  # "BSC-like" — chuỗi đích
}


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


@dataclass
class Chain:
    name: str
    chain_id: int
    w3: Web3
    tester: EthereumTester
    contracts: dict[str, Any] = field(default_factory=dict)

    @property
    def accounts(self) -> list[str]:
        return list(self.w3.eth.accounts)

    def deploy(self, artifact_name: str, *args: Any, sender: str | None = None) -> Any:
        art = load_artifact(artifact_name)
        factory = self.w3.eth.contract(abi=art["abi"], bytecode=art["bytecode"])
        tx_hash = factory.constructor(*args).transact({"from": sender or self.accounts[0]})
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        contract = self.w3.eth.contract(address=receipt.contractAddress, abi=art["abi"])
        self.contracts[artifact_name] = contract
        return contract

    def info(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "chain_id": self.w3.eth.chain_id,
            "block_number": self.w3.eth.block_number,
            "accounts": len(self.accounts),
            "contracts": sorted(self.contracts),
        }


class ChainSim:
    """Tập hợp các chuỗi EVM độc lập. Mỗi module nên tạo ChainSim của riêng mình."""

    def __init__(self, chains: dict[str, int] | None = None) -> None:
        self.chains: dict[str, Chain] = {}
        for name, chain_id in (chains or DEFAULT_CHAINS).items():
            self.add_chain(name, chain_id)

    def add_chain(self, name: str, chain_id: int) -> Chain:
        tester = EthereumTester(backend=_make_backend(chain_id))
        w3 = Web3(_make_provider(tester, chain_id))
        chain = Chain(name=name, chain_id=chain_id, w3=w3, tester=tester)
        self.chains[name] = chain
        return chain

    def __getitem__(self, name: str) -> Chain:
        return self.chains[name]

    def info(self) -> list[dict[str, Any]]:
        return [c.info() for c in self.chains.values()]
