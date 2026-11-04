# Tái sinh toàn bộ kịch bản replay (Windows). Chạy: ./scripts/export_replays.ps1
$Root = Split-Path -Parent $PSScriptRoot
$py = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) { $py = "python" }
Push-Location (Join-Path $Root "backend")
& $py -m app.core.export_playground
& $py -m app.modules.cd1_univ.demo --export
& $py -m app.modules.cd2_crossguard.demo --export
& $py -m app.modules.cd3_crosssentry.demo --export
& $py (Join-Path $Root "scripts\check_replays.py")
Pop-Location
