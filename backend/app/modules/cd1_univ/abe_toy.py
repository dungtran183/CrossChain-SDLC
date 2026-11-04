"""CP-ABE mô phỏng (toy): AES-GCM + kiểm chính sách thuộc tính trước khi "cấp" khóa giải mã.

CP-ABE thật gắn chính sách vào bản mã bằng mật mã cặp song tuyến; ở đây một "cơ quan khóa" (key authority)
giữ khóa đối xứng và chỉ trả khi thuộc tính người yêu cầu thỏa chính sách — đủ để minh họa luồng.
Chính sách: danh sách mệnh đề OR, mỗi mệnh đề là AND các cặp key=value, vd [["role=HR","org=ACME"],["role=Auditor"]].
"""
from __future__ import annotations

import base64
import json
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_KEYSTORE: dict[str, bytes] = {}  # ct_id → khóa (chỉ "cơ quan khóa" giữ)


def policy_str(policy: list[list[str]]) -> str:
    return " OR ".join("(" + " AND ".join(c) + ")" for c in policy)


def satisfies(policy: list[list[str]], attrs: dict[str, str]) -> bool:
    have = {f"{k}={v}" for k, v in attrs.items()}
    return any(all(lit in have for lit in clause) for clause in policy)


def encrypt(payload: dict, policy: list[list[str]]) -> dict:
    key = AESGCM.generate_key(bit_length=128)
    nonce = os.urandom(12)
    pt = json.dumps(payload, separators=(",", ":")).encode()
    aad = policy_str(policy).encode()
    ct = AESGCM(key).encrypt(nonce, pt, aad)
    ct_id = base64.urlsafe_b64encode(os.urandom(6)).decode()
    _KEYSTORE[ct_id] = key
    blob = nonce + ct
    return {"id": ct_id, "policy": policy, "policy_str": policy_str(policy), "ciphertext_b64": base64.b64encode(blob).decode(), "size": len(blob) + len(aad)}


def decrypt(ct: dict, attrs: dict[str, str]) -> dict:
    if not satisfies(ct["policy"], attrs):
        return {"ok": False, "reason": "attributes do not satisfy policy"}
    key = _KEYSTORE.get(ct["id"])
    if key is None:
        return {"ok": False, "reason": "unknown ciphertext"}
    blob = base64.b64decode(ct["ciphertext_b64"])
    pt = AESGCM(key).decrypt(blob[:12], blob[12:], ct["policy_str"].encode())
    return {"ok": True, "payload": json.loads(pt)}
