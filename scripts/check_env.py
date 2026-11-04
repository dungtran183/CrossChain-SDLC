"""Kiểm tra môi trường: python deps, node/npm, artifacts và 2 chuỗi EVM giả lập.

Chạy từ gốc repo: python scripts/check_env.py   (exit code 1 nếu có mục FAIL)
"""
from __future__ import annotations

import importlib
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
try:
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252
except Exception:  # noqa: BLE001
    pass

results: list[tuple[str, bool, str]] = []


def check(name: str, fn) -> None:
    try:
        detail = fn() or ""
        results.append((name, True, str(detail)))
    except Exception as e:  # noqa: BLE001 - báo mọi lỗi
        results.append((name, False, f"{type(e).__name__}: {e}"))


def py_version():
    v = sys.version_info
    assert v >= (3, 11), f"cần Python ≥ 3.11, đang dùng {v.major}.{v.minor}"
    return sys.version.split()[0]


def pkg(mod: str):
    def _f():
        m = importlib.import_module(mod)
        return getattr(m, "__version__", "ok")

    return _f


def tool(cmd: str):
    def _f():
        exe = shutil.which(cmd)
        assert exe, f"không tìm thấy '{cmd}' trong PATH"
        return subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=20).stdout.strip()

    return _f


def chains():
    from app.core.chainsim import ChainSim

    sim = ChainSim()
    ids = {c["name"]: c["chain_id"] for c in sim.info()}
    assert ids == {"chain-A": 31337, "chain-B": 97}, ids
    ping = sim["chain-A"].deploy("Ping", "env-check")
    ping.functions.ping("hi").transact({"from": sim["chain-A"].accounts[0]})
    assert ping.functions.count().call() == 1
    return f"chain ids {ids}, Ping deployed at {ping.address[:10]}…"


check("python ≥ 3.11", py_version)
for mod in ["fastapi", "uvicorn", "web3", "eth_tester", "eth", "eth_account", "numpy", "sklearn", "cryptography"]:
    check(f"import {mod}", pkg(mod))
check("node", tool("node"))
check("npm", tool("npm"))
check("artifact Ping.json", lambda: (ROOT / "contracts/artifacts/Ping.json").stat().st_size)
check("ChainSim 2 chuỗi + deploy Ping", chains)

width = max(len(n) for n, _, _ in results)
failed = 0
for name, ok, detail in results:
    failed += not ok
    print(f"{'OK  ' if ok else 'FAIL'}  {name.ljust(width)}  {detail}")
print("\nAll good ✔" if not failed else f"\n{failed} check(s) failed ✘")
sys.exit(1 if failed else 0)
