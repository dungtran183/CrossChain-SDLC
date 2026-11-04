"""Bộ sinh lưu lượng cầu nối theo tick, giao dịch THẬT trên ChainSim (chain-A LockVault → chain-B MintGateway).

Tác nhân (18): người dùng U1–U6 (tài khoản chain), relayer R1–R3 (nộp mint), validator V1–V7 (ký t=3),
oracle O1–O2 (chứng thực giá cho tuyến qua oracle). Relayer được phân công tất định theo msgId (monitor biết).
Kịch bản: normal · replay · delayed · collusion · slow_burn · boosting.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import keccak
from web3 import Web3

from ...core.chainsim import Chain

CORRIDORS = ["A→B", "B→A", "A→B·oracle"]
SCENARIOS = ["normal", "replay", "delayed", "collusion", "slow_burn", "boosting"]
THRESHOLD = 3


@dataclass
class Actor:
    id: str
    role: str  # user | relayer | validator | oracle
    address: str
    key: bytes | None = None


@dataclass
class Transfer:
    msg_id: bytes
    corridor: int
    sender: str
    recipient: str
    amount: int
    relayer: str
    signers: list[str]
    lock_tick: int
    due_tick: int
    mint_amount: int
    kind: str = "normal"


@dataclass
class Traffic:
    a: Chain
    b: Chain
    vault: object
    gateway: object
    guardian: str
    rng: random.Random = field(default_factory=lambda: random.Random(7))
    actors: dict[str, Actor] = field(default_factory=dict)
    pending: list[Transfer] = field(default_factory=list)
    minted: list[Transfer] = field(default_factory=list)
    scenario: str = "normal"
    scenario_tick: int = 0
    blocked: set = field(default_factory=set)  # validator đã bị cô lập (R4) — validator trung thực không chọn nữa

    def __post_init__(self) -> None:
        acc = self.a.accounts
        for i in range(6):
            self._add(Actor(f"U{i + 1}", "user", acc[1 + i]))
        for i in range(3):
            self._add(Actor(f"R{i + 1}", "relayer", acc[7 + i]))
        for i in range(7):
            k = keccak(f"cd3-validator-{i}".encode())
            self._add(Actor(f"V{i + 1}", "validator", Account.from_key(k).address, k))
        for i in range(2):
            k = keccak(f"cd3-oracle-{i}".encode())
            self._add(Actor(f"O{i + 1}", "oracle", Account.from_key(k).address, k))

    def _add(self, actor: Actor) -> None:
        self.actors[actor.id] = actor
        for c in (self.a, self.b):
            c.label(actor.address, actor.id)

    def by_role(self, role: str) -> list[Actor]:
        return [x for x in self.actors.values() if x.role == role]

    def by_address(self, addr: str) -> Actor | None:
        addr = Web3.to_checksum_address(addr)
        return next((x for x in self.actors.values() if x.address == addr), None)

    @staticmethod
    def relayer_for(msg_id: bytes) -> str:
        return f"R{int.from_bytes(msg_id[-2:], 'big') % 3 + 1}"

    # ---------------------------------------------------------------- giao dịch
    def lock(self, tick: int, user: str, recipient: str, amount: int, corridor: int, delay: int, signers: list[str], inflate: float = 1.0, kind: str = "normal") -> tuple[dict, Transfer | None]:
        u = self.actors[user]
        tx = self.a.transact(self.vault, "lock", amount, 97, self.actors[recipient].address, corridor, sender=u.address, note=f"lock · {CORRIDORS[corridor]}")
        if tx["status"] != 1:
            return tx, None
        msg_id = bytes.fromhex(tx["events"][0]["args"]["msgId"][2:])
        t = Transfer(msg_id, corridor, user, recipient, amount, self.relayer_for(msg_id), signers, tick, tick + delay, int(amount * inflate), kind)
        self.pending.append(t)
        return tx, t

    def mint(self, t: Transfer, relayer: str | None = None, note: str = "mint") -> dict:
        r = self.actors[relayer or t.relayer]
        recipient = self.actors[t.recipient].address
        h = Web3.solidity_keccak(["bytes32", "address", "uint256", "uint8", "address"], [t.msg_id, recipient, t.mint_amount, t.corridor, self.gateway.address])
        sigs = []
        for v in t.signers:
            va = self.actors[v]
            sigs.append((int(va.address, 16), bytes(Account.sign_message(encode_defunct(primitive=h), va.key).signature)))
        sigs.sort()
        return self.b.transact(self.gateway, "mint", t.msg_id, recipient, t.mint_amount, t.corridor, [s for _, s in sigs], sender=r.address, note=note)

    def signers(self, proposer: str | None = None, exclude: tuple[str, ...] = ()) -> list[str]:
        vals = [v.id for v in self.by_role("validator") if v.id not in exclude and v.id != proposer and v.id not in self.blocked]
        chosen = self.rng.sample(vals, THRESHOLD - (1 if proposer else 0))
        return ([proposer] if proposer else []) + chosen

    # ---------------------------------------------------------------- một tick
    def tick(self, tick: int) -> list[dict]:
        txs: list[dict] = []
        sc = self.scenario
        self.scenario_tick += 1
        users = [u.id for u in self.by_role("user")]
        honest_vals = ("V4", "V5", "V6") if sc == "collusion" else ()
        n = 3
        for _ in range(n):
            s, r = self.rng.sample(users[:4] if sc == "boosting" else users, 2)
            corridor = self.rng.choices([0, 1, 2], weights=[5, 2, 3])[0]
            amount = int(self.rng.lognormvariate(5.4, 0.35))
            delay = self.rng.choice([0, 0, 1])
            tx, t = self.lock(tick, s, r, amount, corridor, delay, self.signers(exclude=honest_vals))
            txs.append(tx)
            if t and sc == "delayed" and t.relayer == "R2":
                t.due_tick = tick + 6
                t.kind = "delayed"
        if sc == "slow_burn":
            # V7 có lịch sử tốt, giờ đề xuất mint "thổi phồng" trên tuyến A→B (các tuyến khác vẫn bình thường).
            s, r = self.rng.sample(users, 2)
            inflate = 1.0 + min(0.6, 0.15 + 0.05 * self.scenario_tick)
            tx, t = self.lock(tick, s, r, int(self.rng.lognormvariate(5.4, 0.3)), 0, 0, self.signers("V7"), inflate, "inflated")
            txs.append(tx)
            if self.scenario_tick % 2 == 0:
                s, r = self.rng.sample(users, 2)
                txs.append(self.lock(tick, s, r, int(self.rng.lognormvariate(5.4, 0.3)), 2, 0, self.signers("V7"))[0])
        if sc == "boosting":
            for _ in range(4):
                s, r = self.rng.sample(["U5", "U6"], 2)
                txs.append(self.lock(tick, s, r, self.rng.randint(1, 3), 1, 0, self.signers(), kind="circular")[0])
        # đến hạn → relayer nộp mint
        due = [t for t in self.pending if t.due_tick <= tick]
        self.pending = [t for t in self.pending if t.due_tick > tick]
        for t in due:
            tx = self.mint(t)
            txs.append(tx)
            if tx["status"] == 1:
                self.minted.append(t)
        if sc == "replay" and self.minted and self.rng.random() < 0.7:
            old = self.rng.choice(self.minted[-12:])
            txs.append(self.mint(old, relayer="R3", note="mint (replayed msgId)"))
        if sc == "collusion":
            for _ in range(self.rng.choice([1, 2])):
                forged = Transfer(keccak(f"forged-{tick}-{self.rng.random()}".encode()), 0, "U1", self.rng.choice(["U2", "U3"]), 0, "R3", ["V4", "V5", "V6"], tick, tick, self.rng.randint(2000, 5000), "forged")
                txs.append(self.mint(forged, note="mint (no lock!)"))
        return txs
