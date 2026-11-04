"""CrossChain-VulnDB (bản tổng hợp, nhỏ): ~200 hợp đồng cầu nối Solidity sinh từ template + biến thể, seed cố định.

Mỗi lớp (5 nhóm lỗi + safe) có một "lõi" hàm release đặc trưng; biến thể đổi tên định danh, thêm hàm phụ
không liên quan, thỉnh thoảng thêm/bớt một guard phụ để dữ liệu không tách biệt hoàn hảo (few-shot có ý nghĩa).
"""
from __future__ import annotations

import random
from functools import lru_cache

from .samples import CLASSES

PER_CLASS = 34
SEED = 2026

NAMES = {
    "msg": ["msgId", "messageId", "id", "transferId"],
    "to": ["to", "recipient", "receiver", "user"],
    "amt": ["amount", "value", "qty"],
    "done": ["processed", "consumed", "used"],
    "tok": ["token", "wrapped", "asset"],
    "rel": ["relayer", "operator", "signer"],
}

EXTRAS = [
    "    uint256 public fee;\n    function setFee(uint256 f) external onlyOwner {{ fee = f; }}\n",
    "    bool public paused;\n    function pause() external onlyOwner {{ paused = true; }}\n",
    "    function version() external pure returns (uint256) {{ return {n}; }}\n",
    "    event Note(uint256 n);\n    function note(uint256 n) external {{ emit Note(n); }}\n",
    "    mapping(address => uint256) public stats;\n    function bump() external {{ stats[msg.sender] += 1; }}\n",
]

DECOYS = {
    "validator_oracle": "    uint256 public price;\n    address public oracle;\n    function quote(uint256 x) external view returns (uint256) {{ return x * price; }}\n",
    "bridge_logic": "    uint256 public threshold = 1;\n    function votes(bytes[] calldata sigs) external pure returns (uint256) {{ return sigs.length; }}\n",
    "message_verification": "    function check(bytes32 h, bytes calldata sig) external pure returns (address) {{ return ecrecover(h, uint8(sig[64]), bytes32(sig[0:32]), bytes32(sig[32:64])); }}\n",
    "access_control": "    address public keeper;\n    function setKeeper(address k) external {{\n        keeper = k;\n    }}\n",
    "protocol_rule": "    function route(uint256 srcChainId, address srcBridge) external pure returns (bytes32) {{ return keccak256(abi.encodePacked(srcChainId, srcBridge)); }}\n",
    "safe": "    mapping(bytes32 => bool) public seen;\n    function markSeen(bytes32 k) external onlyOwner {{\n        require(!seen[k], \"seen\");\n        seen[k] = true;\n    }}\n",
}

RECOVER = (
    "    function _recover(bytes32 h, bytes calldata sig) internal pure returns (address) {\n"
    "        bytes32 d = keccak256(abi.encodePacked(\"\\x19Ethereum Signed Message:\\n32\", h));\n"
    "        (bytes32 r, bytes32 s, uint8 v) = (bytes32(sig[0:32]), bytes32(sig[32:64]), uint8(sig[64]));\n"
    "        return ecrecover(d, v, r, s);\n    }\n"
)


def _core(cls: str, n: dict, rng: random.Random) -> str:
    m, to, a, done, tok, rel = n["msg"], n["to"], n["amt"], n["done"], n["tok"], n["rel"]
    mark = f"        {done}[{m}] = true;\n"
    check = f"        require(!{done}[{m}], \"processed\");\n"
    src = "        require(srcChainId == SRC_CHAIN_ID, \"bad source\");\n"
    mint = f"        {tok}.mint({to}, {a});\n        emit Released({m}, {to}, {a});\n"
    sig1 = f"        require(_recover(keccak256(abi.encodePacked({m}, {to}, {a}, srcChainId)), sig) == {rel}, \"sig\");\n"
    if cls == "message_verification":  # thiếu nonce
        body = src + sig1 + ("        // TODO: track message\n" if rng.random() < 0.3 else "") + mint
        params = f"bytes32 {m}, address {to}, uint256 {a}, uint256 srcChainId, bytes calldata sig"
        return f"    function release({params}) external {{\n{body}    }}\n" + RECOVER
    if cls == "bridge_logic":  # ngưỡng yếu, đếm trùng
        loop = (
            f"        uint256 ok = 0;\n        for (uint256 i = 0; i < sigs.length; i++) {{\n"
            f"            if (isValidator[_recover(keccak256(abi.encodePacked({m}, {to}, {a})), sigs[i])]) ok++;\n        }}\n"
            "        require(ok >= threshold, \"threshold\");\n"
        )
        params = f"bytes32 {m}, address {to}, uint256 {a}, bytes[] calldata sigs"
        head = "    uint256 public threshold = 1;\n    mapping(address => bool) public isValidator;\n"
        return head + f"    function release({params}) external {{\n{check}{loop}{mark}{mint}    }}\n" + RECOVER
    if cls == "protocol_rule":  # không kiểm nguồn
        params = f"bytes32 {m}, address {to}, uint256 {a}, uint256 srcChainId, address srcBridge, bytes calldata sig"
        body = check + f"        require(_recover(keccak256(abi.encodePacked({m}, {to}, {a}, srcChainId, srcBridge)), sig) == {rel}, \"sig\");\n" + mark + mint
        return f"    function release({params}) external {{\n{body}    }}\n" + RECOVER
    if cls == "access_control":  # setter không onlyOwner
        setter = f"    function set{rel.capitalize()}(address r) external {{\n        {rel} = r;\n    }}\n"
        body = f"        require(msg.sender == {rel}, \"only {rel}\");\n" + check + mark + mint
        return setter + f"    function release(bytes32 {m}, address {to}, uint256 {a}) external {{\n{body}    }}\n"
    if cls == "validator_oracle":  # giá oracle đơn lẻ, không kiểm độ mới
        upd = "    uint256 public price = 100;\n    uint256 public updatedAt;\n    address public oracle;\n"
        upd += "    function updatePrice(uint256 p) external {\n        require(msg.sender == oracle, \"oracle\");\n        price = p;\n        updatedAt = block.number;\n    }\n"
        body = check + mark + f"        uint256 out = ({a} * price) / 100;\n        {tok}.mint({to}, out);\n        emit Released({m}, {to}, out);\n"
        return upd + f"    function release(bytes32 {m}, address {to}, uint256 {a}) external {{\n{body}    }}\n"
    # safe
    loop = (
        "        address last = address(0);\n        uint256 ok = 0;\n"
        f"        for (uint256 i = 0; i < sigs.length; i++) {{\n            address s = _recover(keccak256(abi.encodePacked({m}, {to}, {a}, srcChainId, srcBridge)), sigs[i]);\n"
        "            require(s > last, \"duplicate\");\n            last = s;\n            if (isValidator[s]) ok++;\n        }\n"
        "        require(ok >= threshold, \"below threshold\");\n"
    )
    head = "    uint256 public threshold = 3;\n    mapping(address => bool) public isValidator;\n    address public trustedSrcBridge;\n"
    head += "    function setValidator(address v, bool on) external onlyOwner { isValidator[v] = on; }\n"
    srcchk = "        require(srcChainId == SRC_CHAIN_ID && srcBridge == trustedSrcBridge, \"untrusted source\");\n"
    params = f"bytes32 {m}, address {to}, uint256 {a}, uint256 srcChainId, address srcBridge, bytes[] calldata sigs"
    fresh = "        require(block.number - updatedAt <= MAX_AGE, \"stale\");\n" if rng.random() < 0.3 else ""
    return head + f"    function release({params}) external {{\n{srcchk}{check}{fresh}{loop}{mark}{mint}    }}\n" + RECOVER


def synth(cls: str, rng: random.Random, idx: int) -> str:
    n = {k: rng.choice(v) for k, v in NAMES.items()}
    lines = [
        "// SPDX-License-Identifier: MIT",
        "pragma solidity ^0.8.24;",
        f"contract Bridge{cls.title().replace('_', '')}{idx} {{",
        f"    IToken public {n['tok']};",
        f"    address public owner;",
        f"    address public {n['rel']};",
        "    uint256 public constant SRC_CHAIN_ID = 31337;",
        f"    mapping(bytes32 => bool) public {n['done']};",
        "    event Released(bytes32 indexed id, address indexed to, uint256 amount);",
        "    modifier onlyOwner() { require(msg.sender == owner, \"owner\"); _; }",
    ]
    body = _core(cls, n, rng)
    extras = rng.sample(EXTRAS, k=rng.randint(0, 3))
    # nhiễu: đôi khi hợp đồng lỗi có thêm guard không liên quan; bản safe đôi khi thiếu sự kiện
    if cls != "safe" and rng.random() < 0.25:
        extras.append("    function emergency() external onlyOwner {{ owner = address(0); }}\n")
    # mồi nhử: đoạn mã đặc trưng của lớp KHÁC trong một hàm phụ → few-shot 1-shot dễ nhầm hơn
    if rng.random() < 0.45:
        other = rng.choice([c for c in CLASSES if c != cls])
        extras.append(DECOYS[other])
    if cls == "safe" and rng.random() < 0.2:
        body = body.replace("emit Released", "// emit Released")
    parts = [body] + [e.format(n=rng.randint(1, 9)) for e in extras]
    rng.shuffle(parts)
    return "\n".join(lines) + "\n" + "".join(parts) + "}\n"


@lru_cache(maxsize=1)
def dataset() -> tuple[list[str], list[int]]:
    """(mã nguồn, nhãn lớp) — 6 lớp × PER_CLASS mẫu."""
    rng = random.Random(SEED)
    X, y = [], []
    for ci, cls in enumerate(CLASSES):
        for i in range(PER_CLASS):
            X.append(synth(cls, rng, i))
            y.append(ci)
    return X, y
