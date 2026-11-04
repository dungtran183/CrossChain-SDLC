#!/usr/bin/env bash
# Cài môi trường local trên Linux/macOS (cần Python 3.11+ và Node 18+).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
bash scripts/setup.sh
.venv/bin/python scripts/check_env.py
