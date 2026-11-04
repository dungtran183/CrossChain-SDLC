"""ZKP "đồ chơi" cho CĐ1 — minh họa luồng, KHÔNG an toàn cho thực tế (nhóm 64-bit).

Thay cho Groth16 trong luận án, demo dùng các khối sigma-protocol cổ điển:
- `commit(attr, salt)`            : cam kết băm C = keccak(attr ‖ salt) cho thuộc tính văn bản.
- `pedersen(v, r)`                : cam kết Pedersen C = g^v · h^r mod p (ẩn giá trị số, đồng cấu cộng).
- `merkle_tree / merkle_proof`    : chứng minh văn bằng thuộc lô đã neo on-chain.
- `prove_predicate / verify_predicate`:
      chứng minh "GPA ≥ ngưỡng" mà không lộ GPA. Với C_gpa = g^gpa·h^r, verifier tự tính
      C_d = C_gpa · g^(−ngưỡng) = g^d·h^r (d = gpa − ngưỡng). Prover chứng minh d ∈ [0, 2^k):
      phân rã bit d = Σ b_i·2^i, cam kết từng bit C_i, chứng minh OR (CDS) "C_i mở ra 0 hoặc 1",
      và Π C_i^(2^i) = C_d. Fiat–Shamir với ngữ cảnh (nonce, verifier) chống phát lại bằng chứng.
GPA được nhân 100 (3.42 → 342) để làm việc trên số nguyên.
"""
from __future__ import annotations

import hashlib
import json
import secrets
from dataclasses import dataclass

from eth_utils import keccak

# Nhóm Schnorr toy: p = 2q + 1 (safe prime 65-bit), g,h sinh nhóm con bậc q (bình phương mod p).
P = 18446744073709554719
Q = (P - 1) // 2
G = 4  # 2^2 — phần tử bậc q
K_BITS = 9  # d ∈ [0, 512) đủ cho GPA×100 ∈ [0, 400]


def _hash_to_group(label: bytes) -> int:
    x = int.from_bytes(hashlib.sha256(label).digest(), "big") % P
    return pow(x, 2, P)


H = _hash_to_group(b"Pi_univ toy generator h")  # log_g(h) không ai biết (toy)


def scale(gpa: float) -> int:
    return int(round(gpa * 100))


# ------------------------------------------------------------------ cam kết
def commit(attr: str, salt: bytes) -> bytes:
    """Cam kết băm: C = keccak(attr ‖ salt)."""
    return keccak(attr.encode() + salt)


def pedersen(v: int, r: int) -> int:
    return (pow(G, v % Q, P) * pow(H, r % Q, P)) % P


def i2b(x: int) -> bytes:
    return x.to_bytes(9, "big")


# ------------------------------------------------------------------- Merkle
def _pair(a: bytes, b: bytes) -> bytes:
    return keccak(a + b)


def merkle_tree(leaves: list[bytes]) -> list[list[bytes]]:
    """Các tầng từ lá tới gốc; số lẻ thì nhân đôi phần tử cuối."""
    levels = [list(leaves)]
    while len(levels[-1]) > 1:
        cur = levels[-1]
        if len(cur) % 2:
            cur = cur + [cur[-1]]
        levels.append([_pair(cur[i], cur[i + 1]) for i in range(0, len(cur), 2)])
    return levels


def merkle_root(leaves: list[bytes]) -> bytes:
    return merkle_tree(leaves)[-1][0]


def merkle_proof(leaves: list[bytes], index: int) -> list[dict]:
    proof = []
    for level in merkle_tree(leaves)[:-1]:
        lv = level + [level[-1]] if len(level) % 2 else level
        sib = index ^ 1
        proof.append({"hash": "0x" + lv[sib].hex(), "right": sib > index})
        index //= 2
    return proof


def merkle_verify(leaf: bytes, proof: list[dict], root: bytes) -> bool:
    h = leaf
    for step in proof:
        sib = bytes.fromhex(step["hash"][2:])
        h = _pair(h, sib) if step["right"] else _pair(sib, h)
    return h == root


# ------------------------------------------------------------ OR-proof (CDS)
def _challenge(*parts: object) -> int:
    data = json.dumps([str(p) for p in parts]).encode()
    return int.from_bytes(hashlib.sha256(data).digest(), "big") % Q


def _prove_bit(c: int, b: int, r: int, ctx: str) -> dict:
    """Chứng minh C = h^r (b=0) hoặc C/g = h^r (b=1) mà không lộ b."""
    ys = [c, (c * pow(G, Q - 1, P)) % P]  # Y0 = C, Y1 = C·g^-1
    fake = 1 - b
    e_f, z_f = secrets.randbelow(Q), secrets.randbelow(Q)
    a = [0, 0]
    a[fake] = (pow(H, z_f, P) * pow(ys[fake], Q - e_f, P)) % P
    w = secrets.randbelow(Q)
    a[b] = pow(H, w, P)
    e = _challenge(ctx, c, a[0], a[1])
    e_b = (e - e_f) % Q
    z_b = (w + e_b * r) % Q
    es, zs = [0, 0], [0, 0]
    es[b], zs[b], es[fake], zs[fake] = e_b, z_b, e_f, z_f
    return {"e0": es[0], "e1": es[1], "z0": zs[0], "z1": zs[1]}


def _verify_bit(c: int, pr: dict, ctx: str) -> bool:
    ys = [c, (c * pow(G, Q - 1, P)) % P]
    a = [(pow(H, pr[f"z{i}"], P) * pow(ys[i], Q - pr[f"e{i}"] % Q, P)) % P for i in (0, 1)]
    return (pr["e0"] + pr["e1"]) % Q == _challenge(ctx, c, a[0], a[1])


# ---------------------------------------------------------------- vị từ ≥
@dataclass
class Witness:
    """Bí mật của Holder — không bao giờ rời "máy" người học."""

    gpa: int  # ×100
    r: int  # độ ngẫu nhiên của C_gpa


def prove_predicate(w: Witness, threshold: int, c_gpa: int, ctx: str) -> dict:
    """Sinh chứng minh gpa ≥ threshold (cả hai ×100). Ném ValueError nếu witness không thỏa (prover trung thực)."""
    d = w.gpa - threshold
    if d < 0 or d >= 2**K_BITS:
        raise ValueError("witness does not satisfy the predicate")
    bits = [(d >> i) & 1 for i in range(K_BITS)]
    rs = [secrets.randbelow(Q) for _ in range(K_BITS - 1)]
    # r_last sao cho Σ r_i·2^i = r (mod q) → Π C_i^(2^i) = C_d
    acc = sum(ri * (1 << i) for i, ri in enumerate(rs)) % Q
    inv = pow(1 << (K_BITS - 1), Q - 2, Q)
    rs.append(((w.r - acc) * inv) % Q)
    commits = [pedersen(b, r) for b, r in zip(bits, rs)]
    ors = [_prove_bit(c, b, r, f"{ctx}|{i}") for i, (c, b, r) in enumerate(zip(commits, bits, rs))]
    return {
        "scheme": "toy-sigma-range/v1",
        "k_bits": K_BITS,
        "c_gpa": c_gpa,
        "bit_commitments": commits,
        "or_proofs": ors,
        "context": ctx,
    }


def verify_predicate(statement: dict, proof: dict) -> tuple[bool, str]:
    """Kiểm chứng minh theo statement công khai {threshold, c_gpa, context}. Trả (ok, lý do)."""
    try:
        if proof.get("context") != statement["context"]:
            return False, "context mismatch (replayed proof)"
        if proof["c_gpa"] != statement["c_gpa"]:
            return False, "commitment mismatch"
        cs = proof["bit_commitments"]
        if len(cs) != K_BITS or len(proof["or_proofs"]) != K_BITS:
            return False, "malformed proof"
        c_d = (statement["c_gpa"] * pow(G, Q - statement["threshold"] % Q, P)) % P
        prod = 1
        for i, c in enumerate(cs):
            prod = (prod * pow(c, 1 << i, P)) % P
        if prod != c_d:
            return False, "bit decomposition does not match C_gpa·g^-t"
        for i, (c, pr) in enumerate(zip(cs, proof["or_proofs"])):
            if not _verify_bit(c, pr, f"{statement['context']}|{i}"):
                return False, f"OR-proof of bit {i} invalid"
        return True, "ok"
    except (KeyError, TypeError, ValueError) as e:
        return False, f"malformed proof: {e}"


def proof_size(proof: dict) -> int:
    """Kích thước nhị phân ước lượng (mỗi phần tử nhóm/trường 9 byte)."""
    return 9 * (len(proof["bit_commitments"]) + 4 * len(proof["or_proofs"]))


def proof_digest(proof: dict) -> bytes:
    return keccak(json.dumps(proof, sort_keys=True, separators=(",", ":")).encode())
