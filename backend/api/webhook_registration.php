<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Webhook-Secret");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/rpa_automation.php';
require_once __DIR__ . '/../services/registration_sync.php';
require_once __DIR__ . '/../services/billing_invoice.php';

$EXPECTED_SECRET = rpa_get_secret();

// 1. Health check & Documentation via GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $apiKey = $_GET['api_key'] ?? $_GET['secret'] ?? '';
    $isAuthorized = ($apiKey === $EXPECTED_SECRET);
    
    // Hitung status integrasi saat ini
    $totalPeserta = 0;
    $totalInvoices = 0;
    if ($res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM peserta_intensif WHERE source = 'creativabridging.com'")) {
        $totalPeserta = (int)(mysqli_fetch_assoc($res)['cnt'] ?? 0);
    }
    if ($res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM billing_invoices")) {
        $totalInvoices = (int)(mysqli_fetch_assoc($res)['cnt'] ?? 0);
    }

    echo json_encode([
        'status' => 'online',
        'service' => 'ONE Creativa Webhook Registration Integration',
        'layer' => 'Layer 2 (Integrasi Pendaftaran Web & Tagihan Otomatis)',
        'target_website' => 'https://creativabridging.com',
        'authorized' => $isAuthorized,
        'endpoint' => 'https://one.creativabridging.com/api/webhook_registration.php',
        'stats' => [
            'web_students_registered' => $totalPeserta,
            'total_billing_invoices' => $totalInvoices
        ],
        'usage' => [
            'method' => 'POST',
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Webhook-Secret' => 'CREATIVA_SYNC_SECRET_2026'
            ],
            'sample_payload' => [
                'secret' => 'CREATIVA_SYNC_SECRET_2026',
                'student' => [
                    'id' => 101,
                    'nama' => 'Nama Peserta',
                    'phone' => '081234567890',
                    'email' => 'peserta@example.com',
                    'noKtp' => '3203010101990001',
                    'program' => 'Program Pelatihan Jepang',
                    'skema' => 'cicilan',
                    'status' => 'Pending',
                    'kota' => 'Cianjur',
                    'alamat' => 'Jl. Raya Bandung, Cianjur',
                    'batch' => 'Batch 2'
                ]
            ]
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 2. Autentikasi Webhook (POST)
$providedSecret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? $_GET['secret'] ?? '';

$rawInput = file_get_contents('php://input');
$body = [];
if ($rawInput) {
    $body = json_decode($rawInput, true) ?: [];
}
if (!$providedSecret && !empty($body['secret'])) {
    $providedSecret = $body['secret'];
}
if (!$providedSecret && !empty($body['api_key'])) {
    $providedSecret = $body['api_key'];
}

if ($providedSecret !== $EXPECTED_SECRET) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized: Webhook secret tidak valid atau belum disertakan.',
        'hint' => 'Sertakan header X-Webhook-Secret: CREATIVA_SYNC_SECRET_2026 atau ?api_key=CREATIVA_SYNC_SECRET_2026'
    ]);
    exit;
}

try {
    // 3. Normalisasi data siswa (mendukung single atau array students)
    $studentsToProcess = [];
    if (!empty($body['students']) && is_array($body['students'])) {
        $studentsToProcess = $body['students'];
    } elseif (!empty($body['student']) && is_array($body['student'])) {
        $studentsToProcess = [$body['student']];
    } elseif (!empty($body['nama']) || !empty($body['nama_lengkap'])) {
        $studentsToProcess = [$body];
    }

    if (empty($studentsToProcess)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Payload kosong atau tidak ada data pendaftar yang dikirim.'
        ]);
        exit;
    }

    // Pastikan seluruh kolom yang dibutuhkan peserta_intensif sudah ada (self-healing migration)
    $existingCols = [];
    if ($colRes = mysqli_query($conn, "SHOW COLUMNS FROM peserta_intensif")) {
        while ($col = mysqli_fetch_assoc($colRes)) {
            $existingCols[strtolower($col['Field'])] = true;
        }
    }
    $columnsToEnsure = [
        'web_id' => 'INT(11) DEFAULT NULL',
        'affiliator' => 'VARCHAR(100) DEFAULT NULL',
        'nis' => 'VARCHAR(50) DEFAULT NULL',
        'program' => "VARCHAR(150) DEFAULT 'Program Pelatihan Jepang'",
        'metode_pembayaran' => 'VARCHAR(100) DEFAULT NULL',
        'total_biaya' => 'DECIMAL(15,2) DEFAULT NULL',
        'batch' => "VARCHAR(100) DEFAULT 'Batch 2'",
        'level' => "VARCHAR(50) DEFAULT 'N5'",
        'alamat' => 'TEXT DEFAULT NULL',
        'kota' => "VARCHAR(100) DEFAULT 'Kab. Cianjur'",
        'provinsi' => "VARCHAR(100) DEFAULT 'Jawa Barat'",
        'kode_pos' => "VARCHAR(20) DEFAULT '43211'",
        'negara' => "VARCHAR(50) DEFAULT 'Indonesia'",
        'source' => "VARCHAR(50) DEFAULT 'creativabridging.com'",
        'status' => "VARCHAR(50) DEFAULT 'Aktif'",
        'no_ktp' => 'VARCHAR(50) DEFAULT NULL'
    ];
    foreach ($columnsToEnsure as $colName => $colDef) {
        if (!isset($existingCols[$colName])) {
            @mysqli_query($conn, "ALTER TABLE `peserta_intensif` ADD COLUMN `$colName` $colDef");
        }
    }

    // Pastikan kolom meta_json & public_token ada pada billing_invoices
    foreach (['public_token' => 'VARCHAR(64) NULL', 'meta_json' => 'LONGTEXT NULL'] as $bCol => $bDef) {
        $chkB = @mysqli_query($conn, "SHOW COLUMNS FROM `billing_invoices` LIKE '{$bCol}'");
        if ($chkB && mysqli_num_rows($chkB) === 0) {
            @mysqli_query($conn, "ALTER TABLE `billing_invoices` ADD COLUMN `{$bCol}` {$bDef}");
        }
    }

    $todayDate = date('Y-m-d');
    $deliveryModePending = !empty($body['defer_delivery_log']);

    $results = [];
    $createdStudents = 0;
    $updatedStudents = 0;
    $createdInvoices = 0;

    $pricingReviews = 0;
    $webhookActor = ['id' => 0, 'role' => 'integration', 'name' => 'Registration webhook'];
    foreach ($studentsToProcess as $p) {
        if (!is_array($p)) ac_fail('Data pendaftar tidak valid.');
        $outcome = registration_process($conn, $webhookActor, $p, 'webhook', function (array $context) use ($conn, $webhookActor, $todayDate, $deliveryModePending) {
        $student = $context['student']; $enrollment = $context['enrollment'];
        if (!$enrollment || $context['pricing']['status'] !== 'approved') return $context;
        $candidates = ac_rows($conn, 'SELECT * FROM enrollment_charges WHERE enrollment_id=? ORDER BY id', [(int)$enrollment['id']]);
        $automatic = [];
        foreach ($candidates as $candidate) if (eb_snapshot($candidate['policy_snapshot'], $candidate['policy_hash'])['webhook_issue']) $automatic[] = $candidate;
        if (count($automatic) !== 1) {
            $context['pricing'] = array_replace($context['pricing'], ['status' => 'needs_review', 'reason' => 'charge_policy_not_approved']);
            return $context;
        }
        [$enrollment, $charge, $rule, $policy] = eb_charge($conn, (int)$student['id'], (int)$enrollment['id'], (int)$automatic[0]['id']);
        $existingInv = registration_invoice($conn, $enrollment, $charge);
        $date = $existingInv ? $existingInv['tanggal'] : $todayDate;
        $schedule = sp_schedule(['status' => 'approved', 'rule' => $policy], $date);
        $issued = billing_issue_charge($conn, $webhookActor, [
            'student_id' => (int)$student['id'], 'enrollment_id' => (int)$enrollment['id'], 'charge_id' => (int)$charge['id'],
            'bank_account_id' => $policy['bank_account_id'], 'tanggal' => $date, 'jatuhTempo' => $schedule[0]['jatuhTempo'], 'total' => $policy['amount'],
        ], true);
        $invoiceId = $issued['id']; $invoiceCreatedNow = $issued['created_now'];
        $existingInv = ac_one($conn, 'SELECT * FROM billing_invoices WHERE id=?', [$invoiceId]);
        $metaArray = json_decode($existingInv['meta_json'], true);
        $studentId = (int)$student['id']; $nis = $student['nis'] ?? '';
        $name = $existingInv['customer']; $email = $existingInv['email']; $phone = $existingInv['phone'];
        $program = $metaArray['program']; $skema = $metaArray['skema']; $metodeLabel = sp_scheme_label($skema);
        $programAmount = $existingInv['total']; $installments = $metaArray['installments'];
        $dueDate = $existingInv['jatuhTempo']; $dueNowNominal = $installments[0]['nominal'];
        $invoiceStatus = $existingInv['status']; $publicToken = $existingInv['public_token'];
        $bankName = $metaArray['bank_name']; $bankNumber = $metaArray['account_number']; $bankHolder = $metaArray['account_holder'];
        $deliveryStatus = $deliveryModePending ? 'Menunggu Bot' : 'Terkirim';
        if ($invoiceCreatedNow) {
            // Existing delivery semantics retained for BE-04; this endpoint performs no external send.
            $kanal = ($phone && $phone !== '-') ? 'WhatsApp' : 'Email';
            ac_query($conn, "INSERT INTO billing_terkirim(id,tglKirim,customer,kanal,penerima,statusKirim,statusBaca,created_at) VALUES(?,?,?,?,?,?,'Pending',NOW())", [$invoiceId, $todayDate, $name, $kanal, $kanal === 'WhatsApp' ? $phone : ($email ?: '-'), $deliveryStatus]);
        } else {
            $delivery = ac_one($conn, 'SELECT statusKirim FROM billing_terkirim WHERE id=? ORDER BY created_at DESC LIMIT 1', [$invoiceId]);
            $deliveryStatus = $delivery['statusKirim'] ?? 'Menunggu Bot';
        }
        $needsDelivery = $invoiceCreatedNow && !$deliveryModePending && (
            $invoiceCreatedNow ||
            strtolower(trim($deliveryStatus)) === 'menunggu bot'
        );

        $urls = rpa_build_public_urls($invoiceId, $publicToken);
        $invoiceDocUrl = $urls['invoice_url'];
        $pdfRenderUrl  = $urls['pdf_render_url'];
        $statusPortalUrl = $urls['status_url'];

        // ── D. Format Pesan WhatsApp & Email Otomatis untuk n8n & Fallback ──
        $cleanPhone = rpa_format_wa_phone($phone);
        $formattedTotal = sp_format_rupiah($programAmount);
        $formattedDueNow = $dueNowNominal !== null ? sp_format_rupiah($dueNowNominal) : 'Perlu review Finance';
        $plainWaMessage =
            "Halo *{$name}*,\n\n" .
            "Terima kasih telah mendaftar di *LPK Creativa Bridging International*.\n" .
            "Berikut rincian invoice resmi Anda:\n\n" .
            "• No. Invoice: *{$invoiceId}*\n" .
            "• Program: *{$program}*\n" .
            "• Skema: *{$metodeLabel}*\n" .
            "• Tagihan Awal (" . ($skema === 'cicilan' ? 'DP / Termin 1' : 'Full Payment') . "): *{$formattedDueNow}*\n" .
            "• Total Tagihan: *{$formattedTotal}*\n" .
            "• Jatuh Tempo: *{$dueDate}*\n" .
            "• Rekening Resmi: *Bank {$bankName} {$bankNumber}* a.n. *{$bankHolder}*\n\n" .
            "Lihat / Cetak Invoice Resmi:\n{$invoiceDocUrl}\n\n" .
            "Pantau Status Pendaftaran & Unduh Receipt:\n{$statusPortalUrl}\n\n" .
            "Mohon cantumkan No. Invoice *{$invoiceId}* pada berita transfer dan kirimkan bukti transfer ke finance@creativabridging.com atau WA Finance +62 815-2222-672.\n" .
            "Terima kasih! 🙏";
        $waLink = $cleanPhone ? "https://api.whatsapp.com/send?phone={$cleanPhone}&text=" . rawurlencode($plainWaMessage) : null;

        $emailSubject = "Invoice Pendaftaran Resmi #{$invoiceId} - {$name} ({$program})";
        $emailHtml = "<div style='font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:620px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;'>"
            . "<h2 style='color:#163660;margin-top:0;'>Invoice Resmi LPK Creativa Bridging International</h2>"
            . "<p>Halo <strong>" . htmlspecialchars($name) . "</strong>,</p>"
            . "<p>Pendaftaran Anda untuk program <strong>" . htmlspecialchars($program) . "</strong> telah kami terima. Terlampir / tercantum tautan invoice tagihan resmi Anda:</p>"
            . "<table cellpadding='6' cellspacing='0' style='width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:14px 0;'>"
            . "<tr><td><strong>Nomor Invoice</strong></td><td>" . htmlspecialchars($invoiceId) . "</td></tr>"
            . "<tr><td><strong>Metode Pembayaran</strong></td><td>" . htmlspecialchars($metodeLabel) . "</td></tr>"
            . "<tr><td><strong>Tagihan Jatuh Tempo (" . htmlspecialchars($dueDate) . ")</strong></td><td><strong>" . htmlspecialchars($formattedDueNow) . "</strong></td></tr>"
            . "<tr><td><strong>Total Tagihan</strong></td><td>" . htmlspecialchars($formattedTotal) . "</td></tr>"
            . "<tr><td><strong>Rekening Tujuan</strong></td><td>Bank " . htmlspecialchars($bankName) . " <strong>" . htmlspecialchars($bankNumber) . "</strong> a/n <strong>" . htmlspecialchars($bankHolder) . "</strong></td></tr>"
            . "</table>"
            . "<p style='margin:18px 0;display:flex;gap:10px;flex-wrap:wrap;'>"
            . "<a href='" . htmlspecialchars($invoiceDocUrl) . "' style='background:#163660;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-right:8px;'>Lihat &amp; Unduh Invoice Resmi</a>"
            . "<a href='" . htmlspecialchars($statusPortalUrl) . "' style='background:#047857;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;'>Pantau Status Pendaftaran</a>"
            . "</p>"
            . "<p style='font-size:12px;color:#64748b;'>Cantumkan Nomor Invoice pada berita transfer dan kirim bukti transfer ke finance@creativabridging.com atau WA +62 815-2222-672.</p>"
            . "</div>";

        $context['api_result'] = [
            'student_id' => $studentId, 'enrollment_id' => (int)$enrollment['id'], 'charge_id' => (int)$charge['id'], 'charge_type' => $charge['charge_type'], 'charge_key' => $charge['charge_key'],
            'nis' => $nis,
            'nama' => $name,
            'email' => $email,
            'phone' => $phone,
            'whatsapp_phone' => $cleanPhone,
            'program' => $program,
            'skema' => $skema,
            'metode_pembayaran' => $metodeLabel,
            'invoice_id' => $invoiceId,
            'public_token' => $publicToken,
            'invoice_url' => $invoiceDocUrl,
            'pdf_render_url' => $pdfRenderUrl,
            'status_url' => $statusPortalUrl,
            'nominal' => $programAmount,
            'due_now_nominal' => $dueNowNominal,
            'status_invoice' => $invoiceStatus,
            'jatuh_tempo' => $dueDate,
            'installments' => $installments,
            'bank' => [
                'bank_name' => $bankName,
                'account_number' => $bankNumber,
                'account_holder' => $bankHolder,
            ],
            'invoice_created_now' => $invoiceCreatedNow,
            'needs_delivery' => $needsDelivery,
            'delivery_status' => $deliveryStatus,
            'whatsapp_link' => $waLink,
            'whatsapp_message' => $plainWaMessage,
            'email_subject' => $emailSubject,
            'email_html' => $emailHtml,
            'pricing_status' => $context['pricing']['status'],
            'pricing_reason' => $context['pricing']['reason'],
        ];
        $context['invoice'] = $existingInv;
        return $context;
        });
        if ($outcome['student']) { if ($outcome['student_created']) $createdStudents++; else $updatedStudents++; }
        if ($outcome['pricing']['status'] === 'needs_review') $pricingReviews++;
        $result = $outcome['api_result'] ?? [
            'student_id' => $outcome['student']['id'] ?? null, 'enrollment_id' => $outcome['enrollment']['id'] ?? null, 'charge_id' => null,
            'nis' => $outcome['student']['nis'] ?? '',
            'nama' => $outcome['student']['nama_lengkap'] ?? ($p['nama'] ?? $p['name'] ?? ''),
            'invoice_id' => null, 'invoice_created_now' => false, 'needs_delivery' => false,
            'nominal' => null, 'due_now_nominal' => null, 'installments' => [],
            'pricing_status' => 'needs_review', 'pricing_reason' => $outcome['pricing']['reason'],
        ];
        if ($result['invoice_created_now']) $createdInvoices++;
        $results[] = $result;
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Integrasi webhook berhasil: {$createdStudents} siswa baru dibuat, {$updatedStudents} diperbarui, {$createdInvoices} invoice otomatis diterbitkan.",
        'summary' => [
            'processed' => count($results),
            'students_created' => $createdStudents,
            'students_updated' => $updatedStudents,
            'invoices_created' => $createdInvoices,
            'pricing_needs_review' => $pricingReviews
        ],
        'data' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code($e instanceof AccountingException ? $e->getCode() : 500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Terjadi kesalahan sistem saat memproses webhook: ' . $e->getMessage()
    ]);
}
