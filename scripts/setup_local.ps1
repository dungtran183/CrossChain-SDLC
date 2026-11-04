# Cài môi trường local trên Windows (PowerShell). Cần Python 3.11+ và Node 18+.
# Chạy: ./scripts/setup_local.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$py = (Get-Command python -ErrorAction SilentlyContinue)
if ($null -eq $py) { throw "Không tìm thấy python. Cài Python 3.11+ từ https://www.python.org/downloads/" }
Write-Host "[setup] $(python --version)"

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[setup] tạo .venv"
    python -m venv .venv
}
& .venv\Scripts\python.exe -m pip install -q --upgrade pip
& .venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt

$npm = (Get-Command npm -ErrorAction SilentlyContinue)
if ($null -eq $npm) {
    Write-Warning "Không tìm thấy npm — cài Node.js 20 LTS từ https://nodejs.org rồi chạy lại để có frontend."
} else {
    Write-Host "[setup] node $(node --version)"
    foreach ($dir in @("frontend", "contracts")) {
        Push-Location $dir
        if (Test-Path "package-lock.json") { npm ci --no-audit --no-fund } else { npm install --no-audit --no-fund }
        Pop-Location
    }
}

& .venv\Scripts\python.exe scripts\check_env.py
