# RPA Auto-Watcher: Memantau pendaftar baru & bukti pembayaran di creativabridging.com secara real-time
$php = "C:\Muhammadfaizal\php\php.exe"
$syncScript = "C:\Muhammadfaizal\htdocs\One-creativa\backend\api\sync_students_web.php"
$rpaService = "C:\Muhammadfaizal\htdocs\One-creativa\backend\services\rpa_automation.php"
$automationScript = "C:\Muhammadfaizal\htdocs\One-creativa\backend\api\automation_status.php"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🤖 RPA Auto-Watcher Creativa Bridging AKTIF" -ForegroundColor Green
Write-Host "Memantau pendaftar baru & bukti transfer setiap 4 detik..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$loopCount = 0
while ($true) {
    try {
        $out = & $php -r "require '$rpaService'; `$secret = rpa_get_secret(); `$_SERVER['REQUEST_METHOD'] = 'POST'; `$_SERVER['HTTP_X_WEBHOOK_SECRET'] = `$secret; require '$syncScript';" 2>&1
        $json = $out | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($json) {
            $ts = Get-Date -Format 'HH:mm:ss'
            if ($json.created_invoices -gt 0) {
                Write-Host "[$ts] ⚡ PENDAFTAR BARU TERDETEKSI! $($json.created_invoices) invoice otomatis dibuat & notifikasi WA+Email disiapkan." -ForegroundColor Green
            }
            if ($json.verified_payments -gt 0) {
                Write-Host "[$ts] 💰 BUKTI PEMBAYARAN TERDETEKSI! $($json.verified_payments) pembayaran berhasil diverifikasi & Kwitansi/Receipt resmi dikirim otomatis via WA + Email." -ForegroundColor Cyan
            }
        }

        # Cek jatuh tempo cicilan (Reminder H-3) setiap 100 iterasi (~7 menit)
        $loopCount++
        if ($loopCount % 100 -eq 0) {
            $dueOut = & $php -r "require '$rpaService'; `$secret = rpa_get_secret(); `$_SERVER['REQUEST_METHOD'] = 'GET'; `$_SERVER['HTTP_X_WEBHOOK_SECRET'] = `$secret; `$_GET['action'] = 'due_installments'; require '$automationScript';" 2>&1
            $dueJson = $dueOut | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($dueJson -and $dueJson.count -gt 0) {
                $ts = Get-Date -Format 'HH:mm:ss'
                Write-Host "[$ts] ⏰ PENGINGAT JATUH TEMPO: $($dueJson.count) termin cicilan mendekati jatuh tempo (H-3/H-1)." -ForegroundColor Yellow
            }
        }
    } catch {}
    Start-Sleep -Seconds 4
}

