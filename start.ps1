$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$BundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

# 번들 파이썬은 fastapi 등 의존성이 실제로 있을 때만 사용하고, 없으면 시스템 py -3로 폴백한다.
# (codex 런타임이 리셋되어 패키지가 빠져도 이 런처가 계속 동작하도록.)
$UseBundled = $false
if (Test-Path $BundledPython) {
  # 프로브 중에는 에러 중단(Stop)을 끈다: 깨진 번들 파이썬의 stderr가 스크립트를 멈추지 않도록.
  $eap = $ErrorActionPreference
  $ErrorActionPreference = 'SilentlyContinue'
  & $BundledPython -c "import fastapi" 1>$null 2>$null
  if ($LASTEXITCODE -eq 0) { $UseBundled = $true }
  $ErrorActionPreference = $eap
}

Write-Host ""
Write-Host "Folio OS starting..." -ForegroundColor Green
Write-Host "Open this address in your browser: http://localhost:8787" -ForegroundColor Cyan
Write-Host "Keep this window open while using the archive." -ForegroundColor Yellow
Write-Host ""

# Exit code 3 = restart signal from the in-app restart button.
# Loop until the server exits with any other code.
$shouldRestart = $true
while ($shouldRestart) {
  try {
    if ($UseBundled) {
      & $BundledPython app.py
    } else {
      py -3 app.py
    }
  } catch {
    Write-Host ""
    Write-Host "The archive could not start:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to close"
    $shouldRestart = $false
    continue
  }
  $shouldRestart = ($LASTEXITCODE -eq 3)
  if ($shouldRestart) {
    Write-Host ""
    Write-Host "Restarting..." -ForegroundColor Yellow
    Write-Host ""
  }
}
