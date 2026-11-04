#!/usr/bin/env bash
# Cài môi trường cho Claude Code cloud (và Linux/macOS nói chung). Idempotent — chạy lại an toàn.
# - Dùng làm "Setup script" của Environment trên claude.ai/code:  bash scripts/setup_cloud.sh
# - Đồng thời được gọi bởi SessionStart hook (.claude/settings.json) khi CLAUDE_CODE_REMOTE=true.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\033[1;36m[setup]\033[0m %s\n' "$*"; }

PY="$(command -v python3.11 || command -v python3.12 || command -v python3 || command -v python)"
log "python: $($PY --version 2>&1) ($PY)"

# --- Python venv (.venv ở gốc repo) ---
if [[ ! -x .venv/bin/python ]]; then
  log "tạo .venv"
  "$PY" -m venv .venv
fi
STAMP=.venv/.requirements.sha
REQ_SHA="$(sha256sum backend/requirements.txt | cut -d' ' -f1)"
if [[ ! -f "$STAMP" || "$(cat "$STAMP")" != "$REQ_SHA" ]]; then
  log "pip install -r backend/requirements.txt"
  .venv/bin/python -m pip install -q --upgrade pip
  .venv/bin/python -m pip install -q -r backend/requirements.txt
  echo "$REQ_SHA" > "$STAMP"
else
  log "python deps đã cài (bỏ qua)"
fi

# Cho các lệnh sau của phiên Claude dùng .venv (CLAUDE_ENV_FILE chỉ có khi chạy từ SessionStart hook).
if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  {
    echo "export VIRTUAL_ENV=\"$ROOT/.venv\""
    echo "export PATH=\"$ROOT/.venv/bin:\$PATH\""
  } >> "$CLAUDE_ENV_FILE"
fi

# --- Node packages ---
if command -v npm >/dev/null 2>&1; then
  log "node: $(node --version)"
  for dir in frontend contracts; do
    if [[ ! -d "$dir/node_modules" ]]; then
      if [[ -f "$dir/package-lock.json" ]]; then
        log "npm ci ($dir)"; (cd "$dir" && npm ci --no-audit --no-fund --loglevel=error)
      else
        log "npm install ($dir)"; (cd "$dir" && npm install --no-audit --no-fund --loglevel=error)
      fi
    else
      log "$dir/node_modules đã có (bỏ qua)"
    fi
  done
else
  log "CẢNH BÁO: không tìm thấy npm — bỏ qua frontend/contracts"
fi

log "xong. Kiểm tra: .venv/bin/python scripts/check_env.py"
