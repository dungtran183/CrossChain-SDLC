#!/usr/bin/env bash
# Chạy backend (:8000) + frontend (:5173). Ctrl+C để dừng cả hai.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY="$ROOT/.venv/bin/python"; [[ -x "$PY" ]] || PY=python3

(cd "$ROOT/backend" && "$PY" -m uvicorn app.main:app --reload --port 8000) &
BACK=$!
trap 'kill $BACK 2>/dev/null || true' EXIT
cd "$ROOT/frontend" && npm run dev
