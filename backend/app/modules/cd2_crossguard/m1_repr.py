"""M1 · Thu thập & biểu diễn đa nguồn (bản nhẹ, minh họa).

Luận án: CPG (AST+CFG+PDG) + token CodeBERT + kiểu thao tác liên chuỗi.
Demo:  - tokens(): tokenizer regex cho Solidity
       - structure_graph(): đồ thị hàm ↔ biến trạng thái ↔ guard (require/modifier) ↔ event ↔ lời gọi ngoài
       - interactions(): heuristic nhận diện thao tác liên chuỗi và guard bảo vệ.
"""
from __future__ import annotations

import re

KEYWORDS = {
    "contract", "function", "external", "public", "internal", "private", "view", "pure", "returns", "return", "require",
    "mapping", "address", "uint256", "uint8", "bytes32", "bytes", "bool", "emit", "event", "modifier", "constructor",
    "memory", "calldata", "if", "for", "true", "false", "interface", "immutable", "constant", "string", "msg", "sender",
}
TOKEN_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*|0x[0-9a-fA-F]+|\d+|==|!=|>=|<=|&&|\|\||[-+*/=<>!{}()\[\];,.]")
COMMENT_RE = re.compile(r"//[^\n]*|/\*.*?\*/", re.S)
FUNC_RE = re.compile(r"\b(function\s+(\w+)|constructor)\s*\(([^)]*)\)([^{;]*)\{", re.S)
STATE_RE = re.compile(r"^\s{4}(?!function|event|modifier|constructor|//|emit|require|return)([A-Za-z_][\w\[\]\s=>().,]*?)\s+(?:public\s+|private\s+|internal\s+|immutable\s+|constant\s+)*(\w+)\s*(?:=[^;]*)?;", re.M)
EVENT_RE = re.compile(r"\bevent\s+(\w+)")
MOD_RE = re.compile(r"\bmodifier\s+(\w+)")


def strip_comments(src: str) -> str:
    return COMMENT_RE.sub("", src)


def tokens(src: str) -> list[str]:
    return TOKEN_RE.findall(strip_comments(src))


def _bodies(src: str) -> list[dict]:
    """Tách thân hàm bằng đếm ngoặc."""
    out = []
    for m in FUNC_RE.finditer(src):
        name = m.group(2) or "constructor"
        i = m.end()
        depth = 1
        while i < len(src) and depth:
            depth += {"{": 1, "}": -1}.get(src[i], 0)
            i += 1
        out.append({"name": name, "params": m.group(3), "head": m.group(4), "body": src[m.end(): i - 1], "start": src[: m.start()].count("\n") + 1})
    return out


def structure_graph(src: str) -> dict:
    """Nút/cạnh cho React Flow + thống kê cấu trúc."""
    code = strip_comments(src)
    cname = (re.search(r"\bcontract\s+(\w+)", code) or [None, "Contract"])[1]
    state_vars = sorted({m.group(2) for m in STATE_RE.finditer(code)} - KEYWORDS)
    events = EVENT_RE.findall(code)
    modifiers = MOD_RE.findall(code)
    funcs = [f for f in _bodies(code) if not f["name"].startswith("_")]
    nodes = [{"id": "c", "type": "contract", "label": cname}]
    edges = []
    for v in state_vars:
        nodes.append({"id": f"v:{v}", "type": "state", "label": v})
    for e in events:
        nodes.append({"id": f"e:{e}", "type": "event", "label": e})
    for md in modifiers:
        nodes.append({"id": f"m:{md}", "type": "modifier", "label": md})
    guards = 0
    for f in funcs:
        fid = f"f:{f['name']}"
        nodes.append({"id": fid, "type": "function", "label": f"{f['name']}()", "external": "external" in f["head"] or "public" in f["head"]})
        edges.append({"source": "c", "target": fid, "kind": "defines"})
        for md in modifiers:
            if re.search(rf"\b{md}\b", f["head"]):
                edges.append({"source": f"m:{md}", "target": fid, "kind": "guards"})
                guards += 1
        for k, req in enumerate(re.findall(r"require\s*\(([^;]*)\)\s*;", f["body"])):
            rid = f"r:{f['name']}:{k}"
            cond = req.split(",")[0].strip()
            nodes.append({"id": rid, "type": "require", "label": cond[:38]})
            edges.append({"source": rid, "target": fid, "kind": "checks"})
            guards += 1
        for v in state_vars:
            if re.search(rf"\b{v}\b\s*(\[[^\]]*\])?\s*(\+|-)?=(?!=)", f["body"]):
                edges.append({"source": fid, "target": f"v:{v}", "kind": "writes"})
            elif re.search(rf"\b{v}\b", f["body"]):
                edges.append({"source": f"v:{v}", "target": fid, "kind": "reads"})
        for e in events:
            if re.search(rf"emit\s+{e}\b", f["body"]):
                edges.append({"source": fid, "target": f"e:{e}", "kind": "emits"})
        for call in sorted(set(re.findall(r"\b(\w+)\.(mint|burn|transfer)\s*\(", f["body"]))):
            cid = f"x:{call[0]}.{call[1]}"
            if not any(n["id"] == cid for n in nodes):
                nodes.append({"id": cid, "type": "external", "label": f"{call[0]}.{call[1]}()"})
            edges.append({"source": fid, "target": cid, "kind": "calls"})
    stats = {
        "functions": len(funcs),
        "external_functions": sum(1 for f in funcs if "external" in f["head"] or "public" in f["head"]),
        "state_vars": len(state_vars),
        "events": len(events),
        "modifiers": len(modifiers),
        "guards": guards,
        "edges": len(edges),
        "writes": sum(1 for e in edges if e["kind"] == "writes"),
        "calls": sum(1 for e in edges if e["kind"] == "calls"),
    }
    return {"contract": cname, "nodes": nodes, "edges": edges, "stats": stats, "functions": [{"name": f["name"], "line": f["start"]} for f in funcs]}


# Thao tác liên chuỗi (luận án: "kiểu thao tác") và guard bảo vệ — heuristic.
INTERACTIONS = [
    ("lock", r"\block\s*\(|\bLocked\b"),
    ("burn", r"\.burn\s*\(|\bburn\s*\("),
    ("mint", r"\.mint\s*\("),
    ("release", r"\brelease\s*\("),
    ("verify_signature", r"\becrecover\s*\(|_recover\s*\("),
    ("multi_sig", r"bytes\[\]\s+calldata\s+sigs|sigs\.length"),
    ("nonce_check", r"require\s*\(\s*!\s*(processed|consumed|used)\["),
    ("nonce_mark", r"(processed|consumed|used)\[[^\]]+\]\s*=\s*true"),
    ("source_check", r"require\s*\([^;]*src\w*\s*==|require\s*\([^;]*==\s*SRC_CHAIN_ID|srcBridge\s*==\s*trusted"),
    ("threshold", r"\bthreshold\b"),
    ("dedupe_signers", r"s\s*>\s*last|duplicate|seen\["),
    ("access_modifier", r"\bonlyOwner\b|\bonlyRelayer\b|msg\.sender\s*==\s*(owner|deployer|oracle|governance)"),
    ("unguarded_admin", r"function\s+set\w+\([^)]*\)\s*external\s*\{"),
    ("oracle_price", r"\boracle\b|\bprice\b"),
    ("freshness_check", r"updatedAt\s*<=|block\.number\s*-\s*updatedAt|MAX_AGE"),
    ("external_call", r"\.call\{value:"),
    ("state_after_call", r"\.call\{value:[^;]*;[^}]*?\n[^}]*?\w+\[[^\]]+\]\s*(=|-=)"),
    ("reentrancy_guard", r"\bnonReentrant\b"),
    ("domain_separation", r"encodePacked\([^;]*(address\(this\)|block\.chainid)"),
    ("source_params", r"function\s+release\([^)]*src(ChainId|Bridge)"),
]


def interactions(src: str) -> list[dict]:
    code = strip_comments(src)
    out = []
    for name, pat in INTERACTIONS:
        hits = [code[: m.start()].count("\n") + 1 for m in re.finditer(pat, code)]
        out.append({"kind": name, "present": bool(hits), "count": len(hits)})
    return out


def interaction_flags(src: str) -> dict[str, bool]:
    return {x["kind"]: x["present"] for x in interactions(src)}


def analyze(src: str) -> dict:
    toks = tokens(src)
    g = structure_graph(src)
    inter = interactions(src)
    return {
        "tokens": {"count": len(toks), "unique": len(set(toks)), "sample": toks[:60], "top": _top(toks)},
        "graph": g,
        "interactions": inter,
    }


def _top(toks: list[str], k: int = 12) -> list[dict]:
    from collections import Counter

    c = Counter(t for t in toks if t not in KEYWORDS and re.match(r"[A-Za-z_]", t))
    return [{"token": t, "n": n} for t, n in c.most_common(k)]
