<?php
/**
 * Shared helper untuk RPA Invoice & Receipt Automation (Fase 1 & Fase 2)
 */

$rpaLocalConfig = __DIR__ . '/../config/rpa.local.php';
if (is_file($rpaLocalConfig)) {
    include_once $rpaLocalConfig;
}

if (!function_exists('rpa_get_secret')) {
    function rpa_get_secret(): string {
        if (defined('CREATIVA_WEBHOOK_SECRET') && CREATIVA_WEBHOOK_SECRET !== '') {
            return (string)CREATIVA_WEBHOOK_SECRET;
        }
        $envSecret = getenv('CREATIVA_WEBHOOK_SECRET');
        return ($envSecret !== false && trim($envSecret) !== '') ? trim($envSecret) : 'CREATIVA_SYNC_SECRET_2026';
    }
}

if (!function_exists('rpa_get_receipt_webhook_url')) {
    function rpa_get_receipt_webhook_url(): string {
        if (defined('RPA_DISABLE_EXTERNAL_DELIVERY') && RPA_DISABLE_EXTERNAL_DELIVERY) return '';
        if (defined('N8N_RECEIPT_WEBHOOK_URL') && trim((string)N8N_RECEIPT_WEBHOOK_URL) !== '') {
            return trim((string)N8N_RECEIPT_WEBHOOK_URL);
        }
        $envUrl = getenv('N8N_RECEIPT_WEBHOOK_URL');
        return ($envUrl !== false && trim($envUrl) !== '') ? trim($envUrl) : '';
    }
}

if (!function_exists('rpa_base_api_url')) {
    function rpa_base_api_url(): string {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
        if ($host !== '' && (str_contains($host, 'one.creativabridging.com') || str_contains($host, 'localhost') || str_contains($host, '127.0.0.1'))) {
            $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api')), '/');
            if ($scriptDir === '' || $scriptDir === '.') {
                $scriptDir = '/api';
            }
            return "{$scheme}://{$host}{$scriptDir}";
        }
        return 'https://one.creativabridging.com/api';
    }
}

if (!function_exists('rpa_public_status_base_url')) {
    function rpa_public_status_base_url(): string {
        if (defined('CREATIVA_PUBLIC_STATUS_BASE_URL') && CREATIVA_PUBLIC_STATUS_BASE_URL !== '') {
            return rtrim((string)CREATIVA_PUBLIC_STATUS_BASE_URL, '/');
        }
        $envUrl = getenv('CREATIVA_PUBLIC_STATUS_BASE_URL');
        if ($envUrl !== false && trim($envUrl) !== '') {
            return rtrim(trim($envUrl), '/');
        }
        return 'https://creativabridging.com/siswa/dashboard';
    }
}

if (!function_exists('rpa_format_wa_phone')) {
    function rpa_format_wa_phone(string $phone): string {
        $digits = preg_replace('/[^0-9]/', '', $phone) ?: '';
        if ($digits !== '' && str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        }
        return $digits;
    }
}

if (!function_exists('rpa_terbilang_chunk')) {
    function rpa_terbilang_chunk(int $angka): string {
        $satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
        if ($angka < 12) return $satuan[$angka];
        if ($angka < 20) return rpa_terbilang_chunk($angka - 10) . ' Belas';
        if ($angka < 100) return trim(rpa_terbilang_chunk(intdiv($angka, 10)) . ' Puluh ' . rpa_terbilang_chunk($angka % 10));
        if ($angka < 200) return trim('Seratus ' . rpa_terbilang_chunk($angka - 100));
        if ($angka < 1000) return trim(rpa_terbilang_chunk(intdiv($angka, 100)) . ' Ratus ' . rpa_terbilang_chunk($angka % 100));
        if ($angka < 2000) return trim('Seribu ' . rpa_terbilang_chunk($angka - 1000));
        if ($angka < 1000000) return trim(rpa_terbilang_chunk(intdiv($angka, 1000)) . ' Ribu ' . rpa_terbilang_chunk($angka % 1000));
        if ($angka < 1000000000) return trim(rpa_terbilang_chunk(intdiv($angka, 1000000)) . ' Juta ' . rpa_terbilang_chunk($angka % 1000000));
        if ($angka < 1000000000000) return trim(rpa_terbilang_chunk(intdiv($angka, 1000000000)) . ' Miliar ' . rpa_terbilang_chunk($angka % 1000000000));
        return trim(rpa_terbilang_chunk(intdiv($angka, 1000000000000)) . ' Triliun ' . rpa_terbilang_chunk($angka % 1000000000000));
    }
}

if (!function_exists('rpa_terbilang')) {
    function rpa_terbilang($amount): string {
        $num = (int)round(abs((float)$amount));
        if ($num === 0) return 'Nol Rupiah';
        $words = preg_replace('/\s+/', ' ', trim(rpa_terbilang_chunk($num)));
        return $words . ' Rupiah';
    }
}

if (!function_exists('rpa_format_receipt_number')) {
    function rpa_format_receipt_number(int $paymentId, ?string $paymentDate = null): string {
        $ts = $paymentDate ? strtotime($paymentDate) : false;
        $ym = $ts !== false ? date('ym', $ts) : date('ym');
        return 'RCT-' . $ym . '-' . str_pad((string)$paymentId, 4, '0', STR_PAD_LEFT);
    }
}

if (!function_exists('rpa_ensure_billing_columns')) {
    function rpa_ensure_billing_columns(mysqli $conn): void {
        foreach (['public_token' => 'VARCHAR(64) NULL', 'meta_json' => 'LONGTEXT NULL'] as $col => $def) {
            $chk = @mysqli_query($conn, "SHOW COLUMNS FROM `billing_invoices` LIKE '{$col}'");
            if ($chk && mysqli_num_rows($chk) === 0) {
                @mysqli_query($conn, "ALTER TABLE `billing_invoices` ADD COLUMN `{$col}` {$def}");
            }
        }
    }
}

if (!function_exists('rpa_ensure_automation_logs_table')) {
    function rpa_ensure_automation_logs_table(mysqli $conn): void {
        @mysqli_query($conn, "CREATE TABLE IF NOT EXISTS `automation_logs` (
            `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
            `invoice_id` VARCHAR(64) NOT NULL,
            `stage` VARCHAR(64) NOT NULL DEFAULT 'phase1_delivery',
            `channel` VARCHAR(32) NOT NULL DEFAULT 'n8n',
            `status` VARCHAR(32) NOT NULL DEFAULT 'success',
            `recipient` VARCHAR(255) NULL,
            `detail_json` LONGTEXT NULL,
            `error_message` TEXT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_invoice` (`invoice_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }
}

if (!function_exists('rpa_ensure_processed_table')) {
    function rpa_ensure_processed_table(mysqli $conn): void {
        @mysqli_query($conn, "CREATE TABLE IF NOT EXISTS `rpa_processed_registrations` (
            `web_id` INT NOT NULL PRIMARY KEY,
            `invoice_id` VARCHAR(64) NOT NULL,
            `customer` VARCHAR(255) NOT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `deleted_at` DATETIME NULL,
            INDEX `idx_rpa_proc_inv` (`invoice_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }
}

if (!function_exists('rpa_ensure_invoice_token')) {
    function rpa_ensure_invoice_token(mysqli $conn, string $invoiceId): string {
        rpa_ensure_billing_columns($conn);
        $stmt = $conn->prepare("SELECT public_token FROM billing_invoices WHERE id = ? LIMIT 1");
        if (!$stmt) return '';
        $stmt->bind_param('s', $invoiceId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $token = trim((string)($row['public_token'] ?? ''));
        if ($token === '') {
            $token = bin2hex(random_bytes(16));
            $uStmt = $conn->prepare("UPDATE billing_invoices SET public_token = ? WHERE id = ?");
            if ($uStmt) {
                $uStmt->bind_param('ss', $token, $invoiceId);
                $uStmt->execute();
                $uStmt->close();
            }
        }
        return $token;
    }
}

if (!function_exists('rpa_build_public_urls')) {
    function rpa_build_public_urls(string $invoiceId, string $token, ?int $paymentId = null): array {
        $baseApi = rpa_base_api_url();
        $invEncoded = rawurlencode($invoiceId);
        $tokEncoded = rawurlencode($token);
        $invoiceUrl = "{$baseApi}/invoice_document.php?id={$invEncoded}&token={$tokEncoded}";
        $statusUrl = rpa_public_status_base_url() . "?inv={$invEncoded}&token={$tokEncoded}";
        $receiptUrl = $paymentId !== null && $paymentId > 0
            ? "{$baseApi}/receipt_document.php?payment_id={$paymentId}&token={$tokEncoded}"
            : "{$baseApi}/receipt_document.php?id={$invEncoded}&token={$tokEncoded}";
        return [
            'invoice_url' => $invoiceUrl,
            'pdf_render_url' => $invoiceUrl . '&print=1',
            'receipt_url' => $receiptUrl,
            'receipt_pdf_render_url' => $receiptUrl . '&print=1',
            'status_url' => $statusUrl,
        ];
    }
}

// Compatibility adapters stay inert until the remote API supports authoritative
// enrollment/charge/payment mapping and idempotent writes. A participant ID is not ownership.
function rpa_remote_dashboard_review(array $mapping): array {
    $required = ['student_id', 'enrollment_id', 'charge_id', 'participant_id', 'external_enrollment_id', 'invoice_id'];
    foreach ($required as $key) if (empty($mapping[$key])) return ['status' => 'needs_review', 'reason' => 'missing_authoritative_remote_mapping', 'writes_enabled' => false];
    if (isset($mapping['payment_id']) && ($mapping['billing_verified'] ?? false) !== true) return ['status' => 'needs_review', 'reason' => 'payment_not_verified', 'writes_enabled' => false];
    return ['status' => 'needs_review', 'reason' => 'remote_idempotency_contract_required', 'writes_enabled' => false];
}
function rpa_sync_invoices_to_remote_student_dashboard(int $rawId, string $invoiceId, float $total, array $installments, string $invoiceUrl, array $mapping = []): array {
    return rpa_remote_dashboard_review($mapping);
}
function rpa_sync_payment_to_remote_student_dashboard(int $rawId, string $invoiceId, float $amountPaid, array $mapping = []): array {
    return rpa_remote_dashboard_review($mapping);
}

if (!function_exists('rpa_record_log')) {
    function rpa_record_log(mysqli $conn, string $invoiceId, string $stage, string $channel, string $status, string $recipient, $detail = [], string $errorMsg = ''): void {
        rpa_ensure_automation_logs_table($conn);
        $detailJson = is_string($detail) ? $detail : (json_encode($detail, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}');
        $stmt = $conn->prepare("INSERT INTO automation_logs (invoice_id, stage, channel, status, recipient, detail_json, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if ($stmt) {
            $stmt->bind_param('sssssss', $invoiceId, $stage, $channel, $status, $recipient, $detailJson, $errorMsg);
            $stmt->execute();
            $stmt->close();
        }
    }
}

if (!function_exists('rpa_dispatch_webhook')) {
    function rpa_dispatch_webhook(string $url, array $payload, ?string $secret = null, int $timeoutSec = 4): array {
        $url = trim($url);
        if ($url === '') {
            return ['sent' => false, 'reason' => 'Webhook URL belum dikonfigurasi.'];
        }
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return ['sent' => false, 'reason' => 'Gagal mengenkode payload JSON.'];
        }
        $secretVal = $secret ?? rpa_get_secret();

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeoutSec,
                CURLOPT_CONNECTTIMEOUT => min(3, $timeoutSec),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Accept: application/json',
                    'X-Webhook-Secret: ' . $secretVal,
                ],
                CURLOPT_POSTFIELDS => $json,
            ]);
            $resp = curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            return [
                'sent' => ($err === '' && $code >= 200 && $code < 300),
                'http_code' => $code,
                'error' => $err,
                'response' => $resp,
            ];
        }

        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\nAccept: application/json\r\nX-Webhook-Secret: {$secretVal}\r\n",
                'content' => $json,
                'timeout' => $timeoutSec,
                'ignore_errors' => true,
            ],
        ]);
        $resp = @file_get_contents($url, false, $ctx);
        return [
            'sent' => ($resp !== false),
            'response' => $resp,
        ];
    }
}

if (!function_exists('rpa_get_midtrans_config')) {
    function rpa_get_midtrans_config(): array {
        $serverKey = defined('MIDTRANS_SERVER_KEY')
            ? trim((string)MIDTRANS_SERVER_KEY)
            : trim((string)(getenv('MIDTRANS_SERVER_KEY') ?: ''));
        $clientKey = defined('MIDTRANS_CLIENT_KEY')
            ? trim((string)MIDTRANS_CLIENT_KEY)
            : trim((string)(getenv('MIDTRANS_CLIENT_KEY') ?: ''));

        $isProdRaw = defined('MIDTRANS_IS_PRODUCTION')
            ? MIDTRANS_IS_PRODUCTION
            : getenv('MIDTRANS_IS_PRODUCTION');
        $isProduction = is_bool($isProdRaw)
            ? $isProdRaw
            : in_array(strtolower(trim((string)$isProdRaw)), ['1', 'true', 'yes', 'on'], true);

        $isConfigured = $serverKey !== ''
            && stripos($serverKey, 'YOUR_SERVER_KEY') === false
            && stripos($serverKey, 'YOUR_KEY') === false
            && strlen($serverKey) >= 12;

        return [
            'server_key' => $serverKey,
            'client_key' => $clientKey,
            'is_production' => $isProduction,
            'is_configured' => $isConfigured,
            'snap_url' => $isProduction
                ? 'https://app.midtrans.com/snap/v1/transactions'
                : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
            'status_api_base' => $isProduction
                ? 'https://api.midtrans.com/v2'
                : 'https://api.sandbox.midtrans.com/v2',
        ];
    }
}

if (!function_exists('rpa_midtrans_verify_signature')) {
    function rpa_midtrans_verify_signature(array $notif, ?string $serverKey = null): bool {
        $key = $serverKey !== null ? trim($serverKey) : rpa_get_midtrans_config()['server_key'];
        if ($key === '' || stripos($key, 'YOUR_SERVER_KEY') !== false) {
            return false;
        }
        $orderId = (string)($notif['order_id'] ?? '');
        $statusCode = (string)($notif['status_code'] ?? '');
        $grossAmount = (string)($notif['gross_amount'] ?? '');
        $signatureKey = strtolower(trim((string)($notif['signature_key'] ?? '')));
        if ($orderId === '' || $statusCode === '' || $grossAmount === '' || $signatureKey === '') {
            return false;
        }
        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . $key);
        return hash_equals($expected, $signatureKey);
    }
}

if (!function_exists('rpa_compute_installments_due')) {
    function rpa_compute_installments_due(array $meta, float $totalInvoice, float $paidTotal, string $fallbackDueDate): array {
        $rawInst = (!empty($meta['installments']) && is_array($meta['installments']))
            ? $meta['installments']
            : [[
                'id' => 1,
                'keterangan' => 'FULL PAYMENT',
                'jatuhTempo' => $fallbackDueDate,
                'nominal' => $totalInvoice,
            ]];

        $remainingPaidPool = max(0.0, $paidTotal);
        $items = [];
        $nextDue = null;
        foreach ($rawInst as $idx => $inst) {
            $nom = (float)($inst['nominal'] ?? $inst['amount'] ?? 0);
            $label = strtoupper((string)($inst['keterangan'] ?? $inst['deskripsi'] ?? $inst['label'] ?? (count($rawInst) === 1 ? 'FULL PAYMENT' : 'CICILAN KE-' . ($idx + 1))));
            $due = trim((string)($inst['jatuhTempo'] ?? $inst['tanggal'] ?? $fallbackDueDate));
            $applied = min($nom, $remainingPaidPool);
            $remainingPaidPool = max(0.0, $remainingPaidPool - $applied);
            $unpaid = max(0.0, $nom - $applied);
            $entry = [
                'index' => $idx + 1,
                'label' => $label,
                'jatuhTempo' => $due,
                'nominal' => $nom,
                'terbayar' => $applied,
                'sisa' => $unpaid,
                'status' => $unpaid <= 0.01 ? 'Paid' : ($applied > 0.01 ? 'Partially Paid' : 'Unpaid'),
            ];
            if ($nextDue === null && $unpaid > 0.01) {
                $nextDue = $entry;
            }
            $items[] = $entry;
        }

        return [
            'installments' => $items,
            'next_due' => $nextDue,
        ];
    }
}

if (!function_exists('rpa_ensure_payment_external_ref_column')) {
    function rpa_ensure_payment_external_ref_column(mysqli $conn): void {
        try {
            $chk = @mysqli_query($conn, "SHOW COLUMNS FROM `billing_pembayaran` LIKE 'external_ref'");
            if ($chk && mysqli_num_rows($chk) === 0) {
                @mysqli_query($conn, "ALTER TABLE `billing_pembayaran` ADD COLUMN `external_ref` VARCHAR(128) NULL");
                @mysqli_query($conn, "ALTER TABLE `billing_pembayaran` ADD INDEX `idx_billing_pembayaran_extref` (`external_ref`)");
            }
        } catch (Throwable $error) {
            error_log('Billing external_ref schema check: ' . $error->getMessage());
        }
    }
}

// Legacy callers cannot bypass the configured M3.1/M3.2 sender, PDF, CC or attempt history.
if (!function_exists('rpa_send_smtp_email')) {
    function rpa_send_smtp_email(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
        return false; // Use send_invoice_email / send_receipt_email with persisted identity.
    }
}

if (!function_exists('rpa_trigger_receipt_automation')) {
    function rpa_trigger_receipt_automation(
        mysqli $conn,
        array $invoice,
        int $paymentId,
        float $amtNumeric,
        float $paidTotalNumeric,
        float $remNumeric,
        string $status,
        string $paymentDate,
        string $method,
        string $customer
    ): array {
        $invoiceId = (string)($invoice['id'] ?? '');
        $publicToken = rpa_ensure_invoice_token($conn, $invoiceId);
        $receiptNumber = rpa_format_receipt_number($paymentId, $paymentDate);
        $urls = rpa_build_public_urls($invoiceId, $publicToken, $paymentId);
        $metaDecoded = !empty($invoice['meta_json']) ? (json_decode((string)$invoice['meta_json'], true) ?: []) : [];
        $programTitle = trim((string)($metaDecoded['program'] ?? $invoice['keterangan'] ?? 'Program Pelatihan Jepang'));
        $waPhone = rpa_format_wa_phone((string)($invoice['phone'] ?? ''));
        $emailAddr = trim((string)($invoice['email'] ?? ''));
        $terbilang = rpa_terbilang($amtNumeric);

        $fmtAmt = 'Rp ' . number_format($amtNumeric, 0, ',', '.');
        $fmtPaid = 'Rp ' . number_format($paidTotalNumeric, 0, ',', '.');
        $fmtRem = 'Rp ' . number_format($remNumeric, 0, ',', '.');
        $studentPortalUrl = 'https://creativabridging.com/siswa/dashboard';
        $waReceiptMsg =
            "Halo *{$customer}*,\n\n" .
            "Pembayaran Anda telah *TERVERIFIKASI* oleh sistem *LPK Creativa Bridging International*.\n\n" .
            "• No. Receipt: *{$receiptNumber}*\n" .
            "• No. Invoice: *{$invoiceId}*\n" .
            "• Program: *{$programTitle}*\n" .
            "• Nominal Dibayar: *{$fmtAmt}* ({$method})\n" .
            "• Total Terbayar: *{$fmtPaid}*\n" .
            "• Sisa Tagihan: *{$fmtRem}*\n" .
            "• Status Invoice: *{$status}*\n\n" .
            "🧾 *Unduh Kwitansi/Receipt Resmi:*\n{$urls['receipt_url']}\n\n" .
            "🌐 *Pantau Status Cicilan di Student Dashboard:*\n{$studentPortalUrl}\n\n" .
            "Terima kasih atas kepercayaannya! 🙏";

        $emailSubject = "Receipt Pembayaran Resmi #{$receiptNumber} (Invoice {$invoiceId}) - {$customer}";
        $emailHtml = "<div style='font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:620px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;'>"
            . "<h2 style='color:#065f46;margin-top:0;'>Receipt Pembayaran Resmi — LPK Creativa Bridging International</h2>"
            . "<p>Halo <strong>" . htmlspecialchars($customer) . "</strong>,</p>"
            . "<p>Terima kasih, pembayaran Anda untuk program <strong>" . htmlspecialchars($programTitle) . "</strong> telah berhasil diverifikasi.</p>"
            . "<table cellpadding='6' cellspacing='0' style='width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:14px 0;'>"
            . "<tr><td><strong>No. Receipt</strong></td><td><strong>" . htmlspecialchars($receiptNumber) . "</strong></td></tr>"
            . "<tr><td><strong>No. Invoice</strong></td><td>" . htmlspecialchars($invoiceId) . "</td></tr>"
            . "<tr><td><strong>Tanggal Bayar</strong></td><td>" . htmlspecialchars($paymentDate) . "</td></tr>"
            . "<tr><td><strong>Metode</strong></td><td>" . htmlspecialchars($method) . "</td></tr>"
            . "<tr><td><strong>Nominal Diterima</strong></td><td><strong>" . htmlspecialchars($fmtAmt) . "</strong></td></tr>"
            . "<tr><td><strong>Terbilang</strong></td><td><em>" . htmlspecialchars($terbilang) . "</em></td></tr>"
            . "<tr><td><strong>Sisa Tagihan</strong></td><td><strong>" . htmlspecialchars($fmtRem) . "</strong> (" . htmlspecialchars($status) . ")</td></tr>"
            . "</table>"
            . "<p style='margin:18px 0;text-align:center;'>"
            . "<a href='" . htmlspecialchars($urls['receipt_url']) . "' target='_blank' style='background:#065f46;color:#ffffff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:4px 6px;'>Unduh Receipt Resmi (PDF)</a>"
            . "<a href='https://creativabridging.com/siswa/dashboard' target='_blank' style='background:#163660;color:#ffffff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:4px 6px;'>Buka Student Dashboard</a>"
            . "</p>"
            . "</div>";

        $receiptPayload = [
            'event' => 'payment_verified',
            'payment_id' => $paymentId,
            'receipt_number' => $receiptNumber,
            'invoice_id' => $invoiceId,
            'public_token' => $publicToken,
            'customer' => $customer,
            'email' => $emailAddr,
            'phone' => (string)($invoice['phone'] ?? ''),
            'whatsapp_phone' => $waPhone,
            'program' => $programTitle,
            'payment_date' => $paymentDate,
            'payment_method' => $method,
            'amount' => $amtNumeric,
            'terbilang' => $terbilang,
            'terbayar' => $paidTotalNumeric,
            'sisa' => $remNumeric,
            'status_invoice' => $status,
            'receipt_url' => $urls['receipt_url'],
            'receipt_pdf_render_url' => $urls['receipt_pdf_render_url'],
            'invoice_url' => $urls['invoice_url'],
            'status_url' => $urls['status_url'],
            'whatsapp_message' => $waReceiptMsg,
            'email_subject' => $emailSubject,
            'email_html' => $emailHtml,
        ];

        // Receipt email belongs exclusively to bp_complete()/invoice_mail.php.
        $receiptEmailSent = false;

        // Kirim WhatsApp Receipt via Creativa WhatsApp Bot (port 3500)
        $receiptWaSent = false;
        if (!empty($waPhone) && rpa_get_receipt_webhook_url() === '' && !(defined('RPA_DISABLE_EXTERNAL_DELIVERY') && RPA_DISABLE_EXTERNAL_DELIVERY)) {
            $ch = curl_init("http://127.0.0.1:3500/send-message");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 8,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode(['number' => $waPhone, 'message' => $waReceiptMsg]),
            ]);
            $wres = curl_exec($ch);
            $wcode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($wcode >= 200 && $wcode < 300) {
                $j = json_decode((string)$wres, true);
                if (!empty($j['success']) && !empty($j['ready'])) {
                    $receiptWaSent = true;
                }
            }
        }

        // Catat pengiriman kwitansi ke automation_logs
        rpa_record_log(
            $conn,
            $invoiceId,
            'phase2_receipt_delivery',
            'WhatsApp',
            $receiptWaSent ? 'Terkirim' : 'Siap Kirim',
            $waPhone ?: $emailAddr,
            [
                'receipt_number' => $receiptNumber,
                'email_sent' => $receiptEmailSent,
                'wa_sent' => $receiptWaSent,
                'status_url' => $urls['status_url'],
                'receipt_url' => $urls['receipt_url'],
                'message' => "Notifikasi WhatsApp receipt #{$receiptNumber}: " . ($receiptWaSent ? 'Diterima gateway' : 'Belum dikonfirmasi')
            ],
            ''
        );

        $n8nReceiptUrl = rpa_get_receipt_webhook_url();
        $rpaDispatched = false;
        if ($n8nReceiptUrl !== '') {
            $dispatchPayload = $receiptPayload;
            // Older live exports must not send a second email before their cutover.
            $dispatchPayload['email'] = '';
            $dispatchPayload['email_subject'] = '';
            $dispatchPayload['email_html'] = '';
            $dispatchPayload['email_sender'] = 'php';
            $dispatch = rpa_dispatch_webhook($n8nReceiptUrl, $dispatchPayload, rpa_get_secret(), 4);
            $rpaDispatched = !empty($dispatch['sent']);
            rpa_record_log(
                $conn,
                $invoiceId,
                'phase2_receipt_trigger',
                'n8n',
                $rpaDispatched ? 'Dispatched' : 'Failed',
                $emailAddr ?: $waPhone,
                ['receipt_number' => $receiptNumber, 'payment_id' => $paymentId, 'http_code' => $dispatch['http_code'] ?? null],
                (string)($dispatch['error'] ?? '')
            );
        }

        return [
            'receipt_number' => $receiptNumber,
            'public_token' => $publicToken,
            'urls' => $urls,
            'email_sent' => $receiptEmailSent,
            'wa_sent' => $receiptWaSent,
            'rpa_dispatched' => $rpaDispatched,
            'payload' => $receiptPayload,
        ];
    }
}

if (!function_exists('rpa_send_invoice_notifications')) {
    function rpa_send_invoice_notifications(
        mysqli $conn,
        string $invoiceId,
        string $name,
        string $email,
        string $phone,
        string $program,
        float $total,
        array $installments,
        string $dueDate,
        string $statusUrl,
        string $invoiceUrl
    ): array {
        // Ignore legacy caller-supplied financial data; use the persisted official snapshot.
        $stmt = $conn->prepare('SELECT * FROM billing_invoices WHERE id=?');
        $stmt->bind_param('s', $invoiceId); $stmt->execute();
        $invoice = $stmt->get_result()->fetch_assoc(); $stmt->close();
        if (!$invoice) return ['email_sent' => false, 'wa_sent' => false, 'status' => 'needs_review'];
        $meta = json_decode($invoice['meta_json'] ?? '', true) ?: [];
        if (empty($meta['bank_name']) || empty($meta['account_number']) || empty($meta['account_holder'])) return ['email_sent' => false, 'wa_sent' => false, 'status' => 'needs_review'];
        $name = $invoice['customer']; $phone = $invoice['phone'];
        $waPhone = rpa_format_wa_phone($phone);
        $dueDateTime = $invoice['jatuhTempo'];
        $urls = rpa_build_public_urls($invoiceId, rpa_ensure_invoice_token($conn, $invoiceId));
        $invoiceUrl = $urls['invoice_url']; $statusUrl = $urls['status_url'];
        $waMsg = "Halo *{$name}*,\nInvoice resmi *{$invoiceId}* untuk " . ($meta['program'] ?? $invoice['keterangan'])
            . "\nTotal: Rp " . $invoice['total'] . "\nJatuh tempo: " . $dueDateTime
            . "\nRekening: " . $meta['bank_name'] . ' ' . $meta['account_number'] . ' a.n. ' . $meta['account_holder']
            . "\nDokumen resmi: " . $invoiceUrl;
        $emailSent = false;
        $emailSubject = ''; // Email is sent only through the M3.1 action.
        if (defined('RPA_DISABLE_EXTERNAL_DELIVERY') && RPA_DISABLE_EXTERNAL_DELIVERY) return ['email_sent' => false, 'wa_sent' => false, 'wa_message' => $waMsg];

        // Kirim WA via Wablas atau Fonnte jika token tersedia
        $envWablasToken = getenv('WABLAS_TOKEN') ?: (defined('WABLAS_TOKEN') ? WABLAS_TOKEN : '');
        $envWablasDomain = getenv('WABLAS_DOMAIN') ?: (defined('WABLAS_DOMAIN') ? WABLAS_DOMAIN : 'kudus.wablas.com');
        $envFonnteToken = getenv('FONNTE_TOKEN') ?: (defined('FONNTE_TOKEN') ? FONNTE_TOKEN : '');

        $waSent = false;
        if (!empty($envWablasToken) && !empty($waPhone)) {
            $ch = curl_init("https://{$envWablasDomain}/api/send-message");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 6,
                CURLOPT_HTTPHEADER => [
                    'Authorization: ' . $envWablasToken,
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS => json_encode(['phone' => $waPhone, 'message' => $waMsg]),
            ]);
            $wres = curl_exec($ch);
            $wcode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $waSent = ($wcode >= 200 && $wcode < 300);
        } elseif (!empty($envFonnteToken) && !empty($waPhone)) {
            $ch = curl_init("https://api.fonnte.com/send");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 6,
                CURLOPT_HTTPHEADER => [
                    'Authorization: ' . $envFonnteToken,
                ],
                CURLOPT_POSTFIELDS => [
                    'target' => $waPhone,
                    'message' => $waMsg,
                ],
            ]);
            $wres = curl_exec($ch);
            $wcode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $waSent = ($wcode >= 200 && $wcode < 300);
        }

        // Kirim WA via Creativa Local WhatsApp Bot (port 3500) jika aktif & terhubung
        if (!$waSent && !empty($waPhone)) {
            $ch = curl_init("http://127.0.0.1:3500/send-message");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 8,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode(['number' => $waPhone, 'message' => $waMsg]),
            ]);
            $wres = curl_exec($ch);
            $wcode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($wcode >= 200 && $wcode < 300) {
                $j = json_decode((string)$wres, true);
                if (!empty($j['success']) && !empty($j['ready'])) {
                    $waSent = true;
                }
            }
        }

        // Catat Log Pengiriman & Siapkan direct WA Link
        $waLink = "https://api.whatsapp.com/send?phone=" . urlencode($waPhone) . "&text=" . urlencode($waMsg);
        $statusLog = ($emailSent && $waSent) ? 'Success' : (($emailSent || $waSent) ? 'Partial' : 'Siap Kirim');

        rpa_record_log(
            $conn,
            $invoiceId,
            'rpa_phase1_registration',
            'WhatsApp',
            $statusLog,
            $waPhone ?: $email,
            [
                'email_sent' => $emailSent,
                'wa_sent' => $waSent,
                'wa_direct_link' => $waLink,
                'status_url' => $statusUrl,
                'due_date' => $dueDateTime,
                'message' => "Notifikasi WhatsApp invoice {$invoiceId}: " . ($waSent ? 'Diterima gateway' : 'Belum dikonfirmasi')
            ],
            ''
        );

        return [
            'email_sent' => $emailSent,
            'wa_sent' => $waSent,
            'wa_link' => $waLink,
            'wa_message' => $waMsg,
            'email_subject' => $emailSubject,
        ];
    }
}


