#!/usr/bin/env bash
# Tái sinh toàn bộ kịch bản replay (frontend/public/replays/**) từ backend thật.
# Chạy sau khi đổi logic module; commit các file JSON để GitHub Pages dùng.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY="$ROOT/.venv/bin/python"; [[ -x "$PY" ]] || PY=python3
cd "$ROOT/backend"
"$PY" -m app.core.export_playground
"$PY" -m app.modules.cd1_univ.demo --export
"$PY" -m app.modules.cd2_crossguard.demo --export
"$PY" -m app.modules.cd3_crosssentry.demo --export
"$PY" "$ROOT/scripts/check_replays.py"
