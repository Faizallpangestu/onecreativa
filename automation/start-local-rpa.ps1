$ErrorActionPreference = "Stop"
$AutoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $AutoDir

$envFile = Join-Path $AutoDir ".env"
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $AutoDir ".env.example") $envFile
  Write-Host "File .env dibuat dari .env.example. Isi WABLAS_TOKEN jika ingin kirim WhatsApp." -ForegroundColor Yellow
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $parts = $line.Split('=', 2)
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
  }
}

$env:TZ = "Asia/Jakarta"
$env:GENERIC_TIMEZONE = "Asia/Jakarta"
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE = "false"
$env:N8N_SECURE_COOKIE = "false"
$env:WEBHOOK_URL = "http://localhost:5678/"
if (-not $env:PLAYWRIGHT_WORKER_URL) { $env:PLAYWRIGHT_WORKER_URL = "http://localhost:3100" }
if (-not $env:ONECREATIVA_BASE_URL) { $env:ONECREATIVA_BASE_URL = "http://localhost/One-creativa/backend" }

$isWorkerAlive = (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
if (-not $isWorkerAlive) {
  Write-Host "[1/2] Menyalakan Playwright PDF Worker pada port 3100..." -ForegroundColor Cyan
  Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $AutoDir -WindowStyle Minimized
  Start-Sleep -Seconds 2
}
else {
  Write-Host "[1/2] Playwright PDF Worker sudah berjalan di port 3100." -ForegroundColor Green
}

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:3100/health" -TimeoutSec 3
  Write-Host "Playwright Health OK: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
}
catch {
  Write-Warning "Playwright worker belum merespons di http://127.0.0.1:3100/health: $($_.Exception.Message)"
}

$n8nDir = Join-Path $env:LOCALAPPDATA "creativa-n8n"
$n8nBin = Join-Path $n8nDir "node_modules\n8n\bin\n8n"
$n8nMarker = Join-Path $n8nDir ".installed.ok"
$ErrorActionPreference = "Continue"
if (-not (Test-Path $n8nMarker) -or -not (Test-Path $n8nBin)) {
  Write-Host "[2/2] Memasang n8n lokal ke $n8nDir (sekali saja, mohon tunggu 1-3 menit)..." -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $n8nDir | Out-Null
  '{"name":"creativa-n8n-local","version":"1.0.0","private":true}' | Set-Content (Join-Path $n8nDir "package.json") -Encoding UTF8
  & npm install --prefix $n8nDir n8n --no-audit --no-fund --loglevel=error
  if ($LASTEXITCODE -eq 0 -and (Test-Path $n8nBin)) {
    Set-Content -Path $n8nMarker -Value (Get-Date -Format o) -Encoding UTF8
  } else {
    Write-Warning "Instalasi n8n gagal dengan kode $LASTEXITCODE. Coba jalankan ulang script ini."
    exit 1
  }
}

Write-Host "[2/2] Menyalakan n8n lokal pada http://localhost:5678 ..." -ForegroundColor Cyan
Write-Host "(Tekan Ctrl+C untuk menghentikan n8n lokal)" -ForegroundColor DarkGray
& node $n8nBin start
