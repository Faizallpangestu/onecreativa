# RPA Auto-Watcher: Memantau pendaftar baru di creativabridging.com secara real-time
$php = "C:\Muhammadfaizal\php\php.exe"
$syncScript = "C:\Muhammadfaizal\htdocs\One-creativa\backend\api\sync_students_web.php"
$rpaService = "C:\Muhammadfaizal\htdocs\One-creativa\backend\services\rpa_automation.php"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🤖 RPA Auto-Watcher Creativa Bridging AKTIF" -ForegroundColor Green
Write-Host "Memantau pendaftar baru dari creativabridging.com setiap 4 detik..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

while ($true) {
    try {
        $out = & $php -r "require '$rpaService'; `$secret = rpa_get_secret(); `$_SERVER['REQUEST_METHOD'] = 'POST'; `$_SERVER['HTTP_X_WEBHOOK_SECRET'] = `$secret; require '$syncScript';" 2>&1
        $json = $out | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($json -and $json.created_invoices -gt 0) {
            $ts = Get-Date -Format 'HH:mm:ss'
            Write-Host "[$ts] ⚡ PENDAFTAR BARU TERDETEKSI! $($json.created_invoices) invoice otomatis dibuat & notifikasi WA+Email disiapkan." -ForegroundColor Green
        }
    } catch {}
    Start-Sleep -Seconds 4
}

