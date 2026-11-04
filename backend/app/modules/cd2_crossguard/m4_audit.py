"""M4 · Hồ sơ kiểm toán: mức rủi ro, bằng chứng, vùng mã, bất biến có kiểu, gợi ý sửa.

Bất biến (invariant) có kiểu: hard (phải luôn đúng — vi phạm = mất tài sản) / soft (khuyến nghị),
trạng thái: declared (mã đã cưỡng chế) · candidate (đề xuất, mã CHƯA cưỡng chế) · verified (Exploit lab đã kiểm).
"""
from __future__ import annotations

from . import m1_repr, m2_fewshot
from .samples import CATEGORIES, bug_lines, meta, source

INVARIANTS = [
    # (id, predicate, kind, flag cưỡng chế, nhóm lỗi liên quan, gợi ý sửa)
    ("INV-NONCE", "processed[msgId] == false trước release(); sau đó processed[msgId] = true", "hard", ("nonce_check", "nonce_mark"), "message_verification",
     {"vi": "Thêm require(!processed[msgId]) và đánh dấu processed[msgId] = true trước khi mint.", "en": "Add require(!processed[msgId]) and set processed[msgId] = true before minting."}),
    ("INV-SRC", "srcChainId == TRUSTED_CHAIN ∧ srcBridge == TRUSTED_BRIDGE", "hard", ("source_check",), "protocol_rule",
     {"vi": "Ràng buộc chuỗi và hợp đồng nguồn vào thông điệp đã ký và kiểm khi nhận.", "en": "Bind source chain and source bridge into the signed message and check them on receipt."}),
    ("INV-THRESH", "|{signer hợp lệ, đôi một khác nhau}| ≥ t, với t ≥ 2", "hard", ("dedupe_signers",), "bridge_logic",
     {"vi": "Đặt ngưỡng t ≥ 2 và loại chữ ký trùng (sắp xếp địa chỉ tăng dần).", "en": "Use t ≥ 2 and reject duplicate signers (require ascending signer addresses)."}),
    ("INV-ACL", "mọi hàm quản trị (set*) chỉ owner/governance gọi được", "hard", ("access_modifier",), "access_control",
     {"vi": "Gắn onlyOwner (hoặc timelock/multisig) cho setRelayer/setValidator.", "en": "Guard setRelayer/setValidator with onlyOwner (or a timelock/multisig)."}),
    ("INV-ORACLE", "block.number − updatedAt ≤ MAX_AGE ∧ |Δprice| ≤ bound", "soft", ("freshness_check",), "validator_oracle",
     {"vi": "Dùng nhiều nguồn giá (median), kiểm độ mới và giới hạn biên độ thay đổi.", "en": "Use multiple price sources (median), check freshness and bound price changes."}),
    ("INV-CEI", "trạng thái được cập nhật TRƯỚC mọi lời gọi ra ngoài (checks-effects-interactions) ∨ nonReentrant", "hard", ("reentrancy_guard",), "bridge_logic",
     {"vi": "Đặt credit[msg.sender] = 0 trước khi chuyển tiền và thêm modifier nonReentrant.", "en": "Zero credit[msg.sender] before transferring and add a nonReentrant modifier."}),
    ("INV-DOMAIN", "digest đã ký gắn block.chainid ∧ address(this) (domain separation, EIP-712)", "hard", ("domain_separation",), "message_verification",
     {"vi": "Đưa block.chainid và address(this) (hoặc domain EIP-712) vào thông điệp được ký.", "en": "Include block.chainid and address(this) (or an EIP-712 domain) in the signed message."}),
    ("INV-SUPPLY", "totalSupply(wrapped trên B) ≤ Σ locked (trên A)", "hard", (), None,
     {"vi": "Giám sát bất biến cung sau triển khai (xem CĐ3).", "en": "Monitor the supply invariant after deployment (see CĐ3)."}),
]


def tier(p: float) -> str:
    return "high" if p >= 0.7 else "medium" if p >= 0.5 else "low"


def report(sample_id: str, k: int = 5, verified: set[str] | None = None) -> dict:
    src = source(sample_id)
    m = meta(sample_id)
    flags = m1_repr.interaction_flags(src)
    cls = m2_fewshot.classify(src, k)
    lines = src.splitlines()
    spans = bug_lines(src)
    evidence = []
    invs = []
    fixes = []
    relevant = flags["release"] or flags["mint"]
    import re

    has_admin = bool(re.search(r"function\s+(set|update)\w*\s*\(", m1_repr.strip_comments(src)))
    applies = {
        "INV-NONCE": relevant,
        "INV-SRC": relevant and ("srcChainId" in src or "srcBridge" in src),
        "INV-THRESH": flags.get("multi_sig") or flags.get("threshold"),
        "INV-ACL": has_admin,
        "INV-ORACLE": flags.get("oracle_price"),
        "INV-CEI": flags.get("external_call"),
        "INV-DOMAIN": flags.get("verify_signature"),
        "INV-SUPPLY": relevant,
    }
    for inv_id, pred, kind, need, _cat, fix in INVARIANTS:
        if not applies[inv_id]:
            continue
        enforced = bool(need) and all(flags.get(n) for n in need)
        if inv_id == "INV-ACL" and flags.get("unguarded_admin"):
            enforced = False
        if inv_id == "INV-CEI" and not flags.get("state_after_call"):
            enforced = True  # đã theo checks-effects-interactions
        status = "declared" if enforced else "candidate"
        if verified and inv_id in verified:
            status = "verified"
        invs.append({"id": inv_id, "predicate": pred, "kind": kind, "status": status})
        if not enforced and need:
            fixes.append({"invariant": inv_id, **fix})
            evidence.append({"invariant": inv_id, "missing": list(need)})
    for ln in spans:
        evidence.append({"line": ln, "code": lines[ln - 1].strip()})
    return {
        "contract": m["title"],
        "sample_id": sample_id,
        "risk_tier": tier(cls["p_vuln"]),
        "p_vuln": cls["p_vuln"],
        "category": cls["label"],
        "category_label": CATEGORIES[cls["label"]],
        "ground_truth": m["category"],
        "k_shot": k,
        "contributions": cls["contributions"],
        "evidence": evidence,
        "code_spans": [{"start": max(1, ln - 1), "end": min(len(lines), ln + 1)} for ln in spans],
        "interactions": [k for k, v in flags.items() if v],
        "invariants": invs,
        "fixes": fixes,
        "generator": "CrossGuard",
    }
