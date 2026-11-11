<?php
/**
 * Shared helper untuk RPA Invoice & Receipt Automation (Fase 1 & Fase 2)
 */

if (!function_exists('rpa_get_secret')) {
    function rpa_get_secret(): string {
        if (defined('CREATIVA_WEBHOOK_SECRET') && CREATIVA_WEBHOOK_SECRET !== '') {
            return (string)CREATIVA_WEBHOOK_SECRET;
        }
        $envSecret = getenv('CREATIVA_WEBHOOK_SECRET');
        return ($envSecret !== false && trim($envSecret) !== '') ? trim($envSecret) : 'CREATIVA_SYNC_SECRET_2026';
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
        return 'https://creativabridging.com/status-pendaftaran';
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

