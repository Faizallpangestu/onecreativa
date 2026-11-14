<?php
/**
 * automation_status.php
 * Callback status pengiriman RPA n8n (Fase 1 & 2) + API Status Pendaftaran Kandidat (Step 9) + Reminder Cicilan H-3.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Webhook-Secret');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/rpa_automation.php';

$EXPECTED_SECRET = rpa_get_secret();

function compute_installments_progress(array $meta, float $totalInvoice, float $paidTotal, string $fallbackDueDate): array {
    return rpa_compute_installments_due($meta, $totalInvoice, $paidTotal, $fallbackDueDate)['installments'];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = trim((string)($_GET['action'] ?? 'status'));

    // ── A. Endpoint Cron n8n: Daftar cicilan jatuh tempo H-3 (wajib X-Webhook-Secret) ──
    if ($action === 'due_installments') {
        $providedSecret = trim((string)($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? $_GET['secret'] ?? ''));
        if ($providedSecret === '' || !hash_equals($EXPECTED_SECRET, $providedSecret)) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized webhook secret.']);
            exit;
        }

        $daysAhead = max(0, min(14, (int)($_GET['days'] ?? 3)));
        rpa_ensure_billing_columns($conn);
        rpa_ensure_automation_logs_table($conn);

        $todayStr = date('Y-m-d');
        $targetDateMax = date('Y-m-d', strtotime("+{$daysAhead} days"));
        $minDateCatchup = date('Y-m-d', strtotime('-7 days'));

        $remindedToday = [];
        $remRes = @mysqli_query($conn, "SELECT DISTINCT invoice_id FROM automation_logs WHERE stage = 'phase2_installment_reminder' AND DATE(created_at) = CURDATE() AND LOWER(status) IN ('terkirim','success')");
        if ($remRes) {
            while ($rr = mysqli_fetch_assoc($remRes)) {
                $remindedToday[$rr['invoice_id']] = true;
            }
        }

        $dueItems = [];
        $invRes = @mysqli_query($conn, "SELECT id, tanggal, customer, email, phone, total, status, jatuhTempo, keterangan, public_token, meta_json FROM billing_invoices WHERE LOWER(TRIM(status)) NOT IN ('paid','lunas') ORDER BY jatuhTempo ASC");
        if ($invRes) {
            while ($inv = mysqli_fetch_assoc($invRes)) {
                $invId = (string)$inv['id'];
                if (isset($remindedToday[$invId])) continue;

                $paid = 0.0;
                $pStmt = $conn->prepare("SELECT COALESCE(SUM(jumlah), 0) AS paid FROM billing_pembayaran WHERE noInv = ? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified')");
                if ($pStmt) {
                    $pStmt->bind_param('s', $invId);
                    $pStmt->execute();
                    $paid = (float)(($pStmt->get_result()->fetch_assoc())['paid'] ?? 0);
                    $pStmt->close();
                }

                $total = (float)$inv['total'];
                if ($paid >= $total - 0.01) continue;

                $meta = !empty($inv['meta_json']) ? (json_decode((string)$inv['meta_json'], true) ?: []) : [];
                $insts = compute_installments_progress($meta, $total, $paid, (string)$inv['jatuhTempo']);
                $nextDue = null;
                foreach ($insts as $inst) {
                    if ($inst['sisa'] > 0.01) {
                        $nextDue = $inst;
                        break;
                    }
                }
                if (!$nextDue || empty($nextDue['jatuhTempo'])) continue;

                $dueDate = substr($nextDue['jatuhTempo'], 0, 10);
                if ($dueDate < $minDateCatchup || $dueDate > $targetDateMax) continue;

                $token = trim((string)($inv['public_token'] ?? ''));
                if ($token === '') {
                    $token = rpa_ensure_invoice_token($conn, $invId);
                }
                $urls = rpa_build_public_urls($invId, $token);
                $waPhone = rpa_format_wa_phone((string)($inv['phone'] ?? ''));
                $emailAddr = trim((string)($inv['email'] ?? ''));
                if ($waPhone === '' && $emailAddr === '') continue;

                $diffDays = (int)round((strtotime($dueDate) - strtotime($todayStr)) / 86400);
                $dueBadge = $diffDays < 0
                    ? ('Lewat ' . abs($diffDays) . ' hari')
                    : ($diffDays === 0 ? 'Hari Ini' : "H-{$diffDays}");
                $fmtNom = 'Rp ' . number_format($nextDue['sisa'], 0, ',', '.');
                $customer = (string)($inv['customer'] ?? 'Siswa LPK');

                $waMsg =
                    "Halo *{$customer}*,\n\n" .
                    "Pengingat pembayaran termin *LPK Creativa Bridging International* ({$dueBadge}):\n\n" .
                    "• No. Invoice: *{$invId}*\n" .
                    "• Termin: *{$nextDue['label']}*\n" .
                    "• Jatuh Tempo: *{$dueDate}*\n" .
                    "• Nominal Tagihan Termin: *{$fmtNom}*\n" .
                    "• Rekening Resmi: *Bank BCA 1832-918-428* a.n. *CREATIVA BRIDGING INTERN*\n\n" .
                    "Bayar Instan (QRIS / Virtual Account) atau Lihat Invoice:\n{$urls['status_url']}\n\n" .
                    "Jika membayar via QRIS/VA di halaman tersebut, status tagihan & Receipt otomatis terbit tanpa perlu kirim bukti. Untuk transfer manual BCA, kirim bukti ke WhatsApp Finance +62 815-2222-672 atau email finance@creativabridging.com. Terima kasih! 🙏";

                $emailSubject = "[Pengingat Pembayaran {$dueBadge}] Invoice #{$invId} - {$nextDue['label']} ({$customer})";
                $emailHtml = "<div style='font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;'>"
                    . "<h2 style='color:#b45309;margin-top:0;'>Pengingat Pembayaran Termin ({$dueBadge})</h2>"
                    . "<p>Halo <strong>" . htmlspecialchars($customer) . "</strong>,</p>"
                    . "<p>Berikut pengingat jatuh tempo pembayaran pelatihan Anda di LPK Creativa Bridging International:</p>"
                    . "<table cellpadding='6' cellspacing='0' style='width:100%;border-collapse:collapse;background:#fffbeb;border:1px solid #fde68a;margin:14px 0;'>"
                    . "<tr><td><strong>No. Invoice</strong></td><td>" . htmlspecialchars($invId) . "</td></tr>"
                    . "<tr><td><strong>Termin</strong></td><td>" . htmlspecialchars($nextDue['label']) . "</td></tr>"
                    . "<tr><td><strong>Jatuh Tempo</strong></td><td><strong>" . htmlspecialchars($dueDate) . "</strong> ({$dueBadge})</td></tr>"
                    . "<tr><td><strong>Nominal Tagihan</strong></td><td><strong>" . htmlspecialchars($fmtNom) . "</strong></td></tr>"
                    . "<tr><td><strong>Rekening Resmi</strong></td><td>Bank BCA <strong>1832-918-428</strong> a/n <strong>CREATIVA BRIDGING INTERN</strong></td></tr>"
                    . "</table>"
                    . "<p style='margin:16px 0;'>"
                    . "<a href='" . htmlspecialchars($urls['status_url']) . "' style='background:#1d4ed8;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-right:8px;'>Bayar QRIS / VA &amp; Status</a>"
                    . "<a href='" . htmlspecialchars($urls['invoice_url']) . "' style='background:#059669;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;'>Buka Invoice PDF</a>"
                    . "</p></div>";

                $dueItems[] = [
                    'invoice_id' => $invId,
                    'customer' => $customer,
                    'email' => $emailAddr,
                    'phone' => (string)($inv['phone'] ?? ''),
                    'whatsapp_phone' => $waPhone,
                    'term_label' => $nextDue['label'],
                    'due_date' => $dueDate,
                    'due_badge' => $dueBadge,
                    'due_amount' => $nextDue['sisa'],
                    'invoice_url' => $urls['invoice_url'],
                    'status_url' => $urls['status_url'],
                    'whatsapp_message' => $waMsg,
                    'email_subject' => $emailSubject,
                    'email_html' => $emailHtml,
                ];
            }
        }

        echo json_encode([
            'status' => 'success',
            'count' => count($dueItems),
            'days_ahead' => $daysAhead,
            'data' => $dueItems,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ── B. Portal Status Pendaftaran & Pembayaran Kandidat (Step 9 bertoken) ──
    $invoiceId = trim((string)($_GET['id'] ?? ''));
    $token     = trim((string)($_GET['token'] ?? ''));

    if ($invoiceId === '' || $token === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Parameter id dan token wajib diisi.']);
        exit;
    }

    rpa_ensure_billing_columns($conn);

    $stmt = $conn->prepare("SELECT id, tanggal, customer, email, phone, total, status, jatuhTempo, keterangan, public_token, meta_json, created_at FROM billing_invoices WHERE id = ? LIMIT 1");
    $stmt->bind_param('s', $invoiceId);
    $stmt->execute();
    $inv = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$inv || empty($inv['public_token']) || !hash_equals((string)$inv['public_token'], $token)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Token atau nomor invoice tidak valid.']);
        exit;
    }

    $meta = !empty($inv['meta_json']) ? (json_decode((string)$inv['meta_json'], true) ?: []) : [];
    $paid = 0.0;
    $payments = [];
    $pStmt = $conn->prepare("SELECT id, tglBayar, customer, metode, jumlah, sisa, statusVerif, created_at FROM billing_pembayaran WHERE noInv = ? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified') ORDER BY id DESC");
    if ($pStmt) {
        $pStmt->bind_param('s', $invoiceId);
        $pStmt->execute();
        $pRes = $pStmt->get_result();
        while ($pRow = $pRes->fetch_assoc()) {
            $pId = (int)$pRow['id'];
            $amt = (float)($pRow['jumlah'] ?? 0);
            $paid += $amt;
            $pUrls = rpa_build_public_urls($invoiceId, (string)$inv['public_token'], $pId);
            $payments[] = [
                'payment_id' => $pId,
                'receipt_number' => rpa_format_receipt_number($pId, (string)$pRow['tglBayar']),
                'tglBayar' => $pRow['tglBayar'],
                'metode' => $pRow['metode'],
                'jumlah' => $amt,
                'receipt_url' => $pUrls['receipt_url'],
            ];
        }
        $pStmt->close();
    }

    $total = (float)$inv['total'];
    $statusNorm = strtolower(trim((string)$inv['status']));
    if ($paid <= 0 && in_array($statusNorm, ['paid', 'lunas'], true)) {
        $paid = $total;
    }
    $terbayar = min($total, $paid);
    $sisa = max(0.0, $total - $terbayar);
    $effectiveStatus = $sisa <= 0.01 ? 'Paid' : ($terbayar > 0.01 ? 'Partially Paid' : ($inv['status'] ?: 'Unpaid'));

    // Ambil data profil peserta di peserta_intensif jika tersedia
    $studentInfo = null;
    if (@mysqli_query($conn, "SHOW TABLES LIKE 'peserta_intensif'")->num_rows > 0) {
        $custName = (string)$inv['customer'];
        $custEmail = (string)($inv['email'] ?? '');
        $sStmt = $conn->prepare("SELECT nis, program, metode_pembayaran, batch, status, created_at FROM peserta_intensif WHERE (email != '' AND email = ?) OR LOWER(nama_lengkap) = LOWER(?) ORDER BY id DESC LIMIT 1");
        if ($sStmt) {
            $sStmt->bind_param('ss', $custEmail, $custName);
            $sStmt->execute();
            $studentInfo = $sStmt->get_result()->fetch_assoc();
            $sStmt->close();
        }
    }

    // Ambil status pengiriman terakhir
    $deliveryRow = null;
    $dStmt = $conn->prepare("SELECT tglKirim, kanal, penerima, statusKirim, statusBaca FROM billing_terkirim WHERE id = ? ORDER BY created_at DESC LIMIT 1");
    if ($dStmt) {
        $dStmt->bind_param('s', $invoiceId);
        $dStmt->execute();
        $deliveryRow = $dStmt->get_result()->fetch_assoc();
        $dStmt->close();
    }

    $urls = rpa_build_public_urls($invoiceId, (string)$inv['public_token'], !empty($payments) ? $payments[0]['payment_id'] : null);
    $instCalc = rpa_compute_installments_due($meta, $total, $terbayar, (string)$inv['jatuhTempo']);
    $installmentsProgress = $instCalc['installments'];
    $nextDueInst = $instCalc['next_due'];
    $screeningMeta = (!empty($meta['screening']) && is_array($meta['screening'])) ? $meta['screening'] : null;

    $hasReceipt = !empty($payments) || $effectiveStatus === 'Paid';
    $mtCfg = rpa_get_midtrans_config();
    $mtLast = (!empty($meta['midtrans_last']) && is_array($meta['midtrans_last'])) ? $meta['midtrans_last'] : null;
    $activePaymentLink = ($mtLast && !empty($mtLast['redirect_url']) && (($mtLast['status'] ?? 'pending') === 'pending') && (((int)($mtLast['created_at_ts'] ?? 0)) > (time() - 72000)))
        ? (string)$mtLast['redirect_url']
        : null;

    echo json_encode([
        'status' => 'success',
        'data' => [
            'invoice_id' => $inv['id'],
            'customer' => $inv['customer'],
            'email' => $inv['email'],
            'phone' => $inv['phone'],
            'tanggal' => $inv['tanggal'],
            'jatuhTempo' => $inv['jatuhTempo'],
            'keterangan' => $inv['keterangan'],
            'program' => (string)($meta['program'] ?? $studentInfo['program'] ?? $inv['keterangan'] ?? 'Intensif Offline'),
            'skema' => (string)($meta['skema'] ?? 'full'),
            'lokasi' => (string)($meta['lokasi'] ?? 'Cianjur'),
            'durasi' => (string)($meta['durasi'] ?? '7 Bulan'),
            'total' => $total,
            'terbayar' => $terbayar,
            'sisa' => $sisa,
            'payment_status' => $effectiveStatus,
            'due_now_nominal' => $nextDueInst ? (float)$nextDueInst['sisa'] : $sisa,
            'due_now_label' => $nextDueInst ? (string)$nextDueInst['label'] : 'FULL PAYMENT',
            'midtrans_enabled' => $mtCfg['is_configured'],
            'midtrans_is_production' => $mtCfg['is_production'],
            'active_payment_link' => $sisa > 0.01 ? $activePaymentLink : null,
            'invoice_url' => $urls['invoice_url'],
            'latest_receipt_url' => $hasReceipt ? $urls['receipt_url'] : null,
            'status_url' => $urls['status_url'],
            'student' => $studentInfo ? [
                'nis' => $studentInfo['nis'],
                'batch' => $studentInfo['batch'],
                'status' => $studentInfo['status'],
                'registered_at' => $studentInfo['created_at'],
            ] : null,
            'screening' => $screeningMeta,
            'installments' => $installmentsProgress,
            'payments' => $payments,
            'delivery' => $deliveryRow,
            'bank' => [
                'bank_name' => (string)($meta['bank_name'] ?? 'BCA'),
                'account_number' => (string)($meta['account_number'] ?? '1832-918-428'),
                'account_holder' => (string)($meta['account_holder'] ?? 'CREATIVA BRIDGING INTERN'),
            ],
            'checklist' => [
                ['key' => 'konsultasi', 'label' => 'Konsultasi', 'status' => $screeningMeta ? 'Selesai' : 'Terdaftar', 'done' => true],
                ['key' => 'screening', 'label' => 'Screening', 'status' => $screeningMeta['statusLabel'] ?? 'Lolos', 'done' => ($screeningMeta['overallStatus'] ?? 'passed') !== 'failed'],
                ['key' => 'pendaftaran', 'label' => 'Pendaftaran', 'status' => 'Terdaftar', 'done' => true],
                ['key' => 'invoice', 'label' => 'Invoice', 'status' => $inv['id'], 'done' => true],
                ['key' => 'pembayaran', 'label' => 'Pembayaran', 'status' => $effectiveStatus, 'done' => $effectiveStatus === 'Paid'],
                ['key' => 'receipt', 'label' => 'Receipt', 'status' => $hasReceipt ? 'Tersedia' : 'Menunggu Pembayaran', 'done' => $hasReceipt],
            ],
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $providedSecret = trim((string)($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? $_GET['secret'] ?? ''));
    $raw = file_get_contents('php://input');
    $body = $raw ? (json_decode($raw, true) ?: []) : [];
    if ($providedSecret === '' && !empty($body['secret'])) {
        $providedSecret = (string)$body['secret'];
    }

    if ($providedSecret === '' || !hash_equals($EXPECTED_SECRET, $providedSecret)) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized webhook secret.']);
        exit;
    }

    $action    = trim((string)($body['action'] ?? 'mark_delivery'));
    $invoiceId = trim((string)($body['invoice_id'] ?? $body['id'] ?? ''));
    if ($invoiceId === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'invoice_id wajib diisi.']);
        exit;
    }

    if (strtolower(trim((string)($body['stage'] ?? ''))) === 'invoice_email') {
        http_response_code(422);
        echo json_encode(['status'=>'error','message'=>'Status invoice_email hanya dicatat oleh pengiriman SMTP server.']);
        exit;
    }
    rpa_ensure_automation_logs_table($conn);

    if ($action === 'mark_delivery') {
        $kanal       = trim((string)($body['kanal'] ?? $body['channel'] ?? 'Keduanya'));
        $penerima    = trim((string)($body['penerima'] ?? $body['recipient'] ?? '-'));
        $statusKirim = trim((string)($body['statusKirim'] ?? $body['status'] ?? 'Terkirim'));
        $statusNorm  = stripos($statusKirim, 'gagal') !== false || stripos($statusKirim, 'fail') !== false ? 'Gagal' : 'Terkirim';
        $customer    = trim((string)($body['customer'] ?? ''));
        $stage       = trim((string)($body['stage'] ?? 'phase1_delivery'));
        $errorMsg    = trim((string)($body['error_message'] ?? ''));
        $today       = date('Y-m-d');

        $chkT = $conn->prepare("SELECT id FROM billing_terkirim WHERE id = ? LIMIT 1");
        $chkT->bind_param('s', $invoiceId);
        $chkT->execute();
        $existsT = (bool)$chkT->get_result()->fetch_assoc();
        $chkT->close();

        if ($existsT) {
            $uStmt = $conn->prepare("UPDATE billing_terkirim SET tglKirim = ?, kanal = ?, penerima = ?, statusKirim = ? WHERE id = ?");
            $uStmt->bind_param('sssss', $today, $kanal, $penerima, $statusNorm, $invoiceId);
            $uStmt->execute();
            $uStmt->close();
        } else {
            if ($customer === '') {
                $cStmt = $conn->prepare("SELECT customer FROM billing_invoices WHERE id = ? LIMIT 1");
                $cStmt->bind_param('s', $invoiceId);
                $cStmt->execute();
                $cRow = $cStmt->get_result()->fetch_assoc();
                $customer = (string)($cRow['customer'] ?? 'Siswa LPK');
                $cStmt->close();
            }
            $iStmt = $conn->prepare("INSERT INTO billing_terkirim (id, tglKirim, customer, kanal, penerima, statusKirim, statusBaca, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())");
            $iStmt->bind_param('ssssss', $invoiceId, $today, $customer, $kanal, $penerima, $statusNorm);
            $iStmt->execute();
            $iStmt->close();
        }

        rpa_record_log($conn, $invoiceId, $stage, $kanal, $statusNorm, $penerima, $body['details'] ?? $body, $errorMsg);

        echo json_encode([
            'status' => 'success',
            'message' => "Status pengiriman {$invoiceId} tercatat sebagai {$statusNorm}.",
            'data' => [
                'invoice_id' => $invoiceId,
                'kanal' => $kanal,
                'statusKirim' => $statusNorm,
            ]
        ]);
        exit;
    }

    if ($action === 'mark_receipt_delivery' || $action === 'mark_installment_reminder') {
        $defaultStage = $action === 'mark_receipt_delivery' ? 'phase2_receipt' : 'phase2_installment_reminder';
        $stage       = trim((string)($body['stage'] ?? $defaultStage));
        $kanal       = trim((string)($body['kanal'] ?? $body['channel'] ?? 'Keduanya'));
        $penerima    = trim((string)($body['penerima'] ?? $body['recipient'] ?? '-'));
        $statusKirim = trim((string)($body['statusKirim'] ?? $body['status'] ?? 'Terkirim'));
        $statusNorm  = stripos($statusKirim, 'gagal') !== false || stripos($statusKirim, 'fail') !== false ? 'Gagal' : 'Terkirim';
        $errorMsg    = trim((string)($body['error_message'] ?? ''));

        rpa_record_log($conn, $invoiceId, $stage, $kanal, $statusNorm, $penerima, $body['details'] ?? $body, $errorMsg);

        echo json_encode([
            'status' => 'success',
            'message' => "Log otomasi ({$stage}) untuk {$invoiceId} tercatat sebagai {$statusNorm}.",
            'data' => [
                'invoice_id' => $invoiceId,
                'stage' => $stage,
                'kanal' => $kanal,
                'status' => $statusNorm,
            ]
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Action tidak didukung.']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
