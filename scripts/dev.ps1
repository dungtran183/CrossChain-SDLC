# Chạy backend (:8000) trong cửa sổ riêng + frontend (:5173) ở cửa sổ hiện tại.
# Chạy: ./scripts/dev.ps1   → mở http://localhost:5173
$Root = Split-Path -Parent $PSScriptRoot
$py = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) { $py = "python" }

Start-Process -FilePath $py -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" `
    -WorkingDirectory (Join-Path $Root "backend")
Set-Location (Join-Path $Root "frontend")
npm run dev
