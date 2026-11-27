<?php
/**
 * midtrans_webhook.php (RPA Fase 3)
 * Notification Webhook resmi dari Midtrans (QRIS, GoPay, ShopeePay, Virtual Account).
 *
 * Alur otomatis:
 * 1. Validasi SHA512 signature_key dari Midtrans.
 * 2. Cegah duplikasi / double-credit saat Midtrans mengirim ulang notifikasi (idempotent lock).
 * 3. Catat pembayaran terverifikasi ke billing_pembayaran & update status billing_invoices (Unpaid -> Partially Paid / Paid).
 * 4. Catat audit trail ke accounting_audit_logs + automation_logs.
 * 5. Picu RPA Fase 2 (rpa_trigger_receipt_automation) untuk menerbitkan Receipt RCT-YYMM-XXXX & kirim WA + Email.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Metode harus POST.']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/rpa_automation.php';

function mtw_respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mtw_format_method_label(array $notif): string {
    $type = strtolower(trim((string)($notif['payment_type'] ?? 'midtrans')));
    if ($type === 'qris') return 'Midtrans QRIS';
    if ($type === 'gopay') return 'Midtrans GoPay/QRIS';
    if ($type === 'shopeepay') return 'Midtrans ShopeePay/QRIS';
    if ($type === 'echannel') return 'Midtrans Mandiri Bill';
    if ($type === 'permata') return 'Midtrans VA Permata';
    if ($type === 'bank_transfer') {
        $bank = strtoupper(trim((string)($notif['va_numbers'][0]['bank'] ?? '')));
        if ($bank !== '') return substr("Midtrans VA {$bank}", 0, 50);
        if (!empty($notif['permata_va_number'])) return 'Midtrans VA PERMATA';
        return 'Midtrans Virtual Account';
    }
    return substr('Midtrans ' . strtoupper($type ?: 'ONLINE'), 0, 50);
}

function mtw_extract_invoice_id(array $notif): string {
    $custom1 = trim((string)($notif['custom_field1'] ?? ''));
    if ($custom1 !== '') return $custom1;
    $orderId = trim((string)($notif['order_id'] ?? ''));
    if ($orderId === '') return '';
    if (preg_match('/^(.+?)-\d{8,13}-\d{2,4}$/', $orderId, $m)) {
        return trim($m[1]);
    }
    return trim((string)explode('-', $orderId)[0]);
}

$raw = file_get_contents('php://input');
$notif = $raw ? json_decode($raw, true) : null;
if (!is_array($notif) || empty($notif['order_id']) || empty($notif['transaction_status'])) {
    mtw_respond(400, ['status' => 'error', 'message' => 'Payload notifikasi Midtrans tidak valid.']);
}

$mtConfig = rpa_get_midtrans_config();
if (!$mtConfig['is_configured']) {
    mtw_respond(503, ['status' => 'error', 'message' => 'Midtrans Server Key belum dikonfigurasi pada server.']);
}

$orderId = trim((string)$notif['order_id']);
$txId = trim((string)($notif['transaction_id'] ?? ''));
$txStatus = strtolower(trim((string)$notif['transaction_status']));
$fraudStatus = strtolower(trim((string)($notif['fraud_status'] ?? '')));
$invoiceId = mtw_extract_invoice_id($notif);

if (!rpa_midtrans_verify_signature($notif, $mtConfig['server_key'])) {
    rpa_record_log(
        $conn,
        $invoiceId ?: $orderId,
        'phase3_midtrans_webhook',
        'midtrans',
        'Gagal',
        '',
        ['order_id' => $orderId, 'transaction_status' => $txStatus],
        'Invalid Midtrans signature_key'
    );
    mtw_respond(403, ['status' => 'error', 'message' => 'Signature Midtrans tidak valid.']);
}

$isSettled = ($txStatus === 'settlement') || ($txStatus === 'capture' && $fraudStatus !== 'challenge' && $fraudStatus !== 'deny');
$isFailed = in_array($txStatus, ['cancel', 'deny', 'expire', 'failure'], true);

if (!$isSettled) {
    $logStatus = $isFailed ? 'Gagal' : 'Pending';
    rpa_record_log(
        $conn,
        $invoiceId ?: $orderId,
        'phase3_midtrans_webhook',
        'midtrans',
        $logStatus,
        '',
        [
            'order_id' => $orderId,
            'transaction_id' => $txId,
            'transaction_status' => $txStatus,
            'fraud_status' => $fraudStatus,
            'payment_type' => $notif['payment_type'] ?? '',
        ],
        ''
    );
    mtw_respond(200, [
        'status' => $isFailed ? 'recorded_failed' : 'pending',
        'invoice_id' => $invoiceId,
        'order_id' => $orderId,
        'transaction_status' => $txStatus,
    ]);
}

if ($invoiceId === '') {
    mtw_respond(400, ['status' => 'error', 'message' => 'Nomor invoice tidak dapat dipetakan dari order_id.']);
}

// DDL schema prep MUST run before begin_transaction() to prevent implicit MySQL commit.
rpa_ensure_billing_columns($conn);
rpa_ensure_payment_external_ref_column($conn);
rpa_ensure_automation_logs_table($conn);

$extRefOrder = 'midtrans:' . $orderId;
$extRefTx = $txId !== '' ? ('midtrans_tx:' . $txId) : $extRefOrder;
$methodLabel = mtw_format_method_label($notif);
$settlementTime = trim((string)($notif['settlement_time'] ?? $notif['transaction_time'] ?? ''));
$tsParsed = $settlementTime !== '' ? strtotime($settlementTime) : false;
$paymentDate = $tsParsed !== false ? date('Y-m-d', $tsParsed) : date('Y-m-d');
$grossCents = ac_cents((string)($notif['gross_amount'] ?? '0'));
if ($grossCents <= 0) {
    mtw_respond(400, ['status' => 'error', 'message' => 'Nominal gross_amount Midtrans harus lebih dari nol.']);
}

$paymentId = 0;
$amountRecordedDecimal = '0.00';
$paidTotalDecimal = '0.00';
$remainingDecimal = '0.00';
$statusAfter = 'Unpaid';
$invoiceRow = null;
$customer = '';
$alreadySettledPayment = null;
$alreadyFullyPaid = false;

$conn->begin_transaction();
try {
    $dupStmt = $conn->prepare("SELECT id, noInv, jumlah, sisa, tglBayar FROM billing_pembayaran WHERE external_ref IN (?, ?) LIMIT 1 FOR UPDATE");
    if ($dupStmt) {
        $dupStmt->bind_param('ss', $extRefOrder, $extRefTx);
        $dupStmt->execute();
        $alreadySettledPayment = $dupStmt->get_result()->fetch_assoc();
        $dupStmt->close();
    }

    if ($alreadySettledPayment) {
        $conn->commit();
        mtw_respond(200, [
            'status' => 'already_settled',
            'invoice_id' => (string)$alreadySettledPayment['noInv'],
            'order_id' => $orderId,
            'payment_id' => (int)$alreadySettledPayment['id'],
            'receipt_number' => rpa_format_receipt_number((int)$alreadySettledPayment['id'], (string)$alreadySettledPayment['tglBayar']),
        ]);
    }

    $invoiceRow = ac_one($conn, 'SELECT * FROM billing_invoices WHERE id = ? FOR UPDATE', [$invoiceId]);
    if (!$invoiceRow) {
        $conn->rollback();
        mtw_respond(404, ['status' => 'error', 'message' => "Invoice {$invoiceId} tidak ditemukan di ERP."]);
    }

    $payments = ac_rows($conn, 'SELECT jumlah, statusVerif FROM billing_pembayaran WHERE noInv = ? FOR UPDATE', [$invoiceId]);
    $totalCents = ac_cents((string)$invoiceRow['total']);
    $paidCents = 0;
    foreach ($payments as $pay) {
        if (in_array(strtolower(trim((string)$pay['statusVerif'])), ['terverifikasi', 'verified'], true)) {
            $paidCents = ac_add($paidCents, ac_cents((string)$pay['jumlah']));
        }
    }
    if ($paidCents === 0 && in_array(strtolower(trim((string)$invoiceRow['status'])), ['paid', 'lunas'], true)) {
        $paidCents = $totalCents;
    }

    $outstandingCents = max(0, $totalCents - $paidCents);
    if ($outstandingCents <= 0) {
        $alreadyFullyPaid = true;
        $conn->commit();
    } else {
        $creditCents = min($grossCents, $outstandingCents);
        $newPaidCents = ac_add($paidCents, $creditCents);
        $remainingCents = max(0, $totalCents - $newPaidCents);
        $statusAfter = $remainingCents === 0 ? 'Paid' : 'Partially Paid';

        $amountRecordedDecimal = ac_decimal($creditCents);
        $paidTotalDecimal = ac_decimal($newPaidCents);
        $remainingDecimal = ac_decimal($remainingCents);
        $customer = trim((string)($invoiceRow['customer'] ?? 'Kandidat LPK Creativa'));

        ac_query(
            $conn,
            "INSERT INTO billing_pembayaran(noInv, tglBayar, customer, metode, jumlah, sisa, statusVerif, external_ref) VALUES(?, ?, ?, ?, ?, ?, 'Terverifikasi', ?)",
            [$invoiceId, $paymentDate, $customer, $methodLabel, $amountRecordedDecimal, $remainingDecimal, $extRefOrder]
        );
        $paymentId = (int)$conn->insert_id;

        $meta = !empty($invoiceRow['meta_json']) ? (json_decode((string)$invoiceRow['meta_json'], true) ?: []) : [];
        if (isset($meta['midtrans_last']) && is_array($meta['midtrans_last']) && ($meta['midtrans_last']['order_id'] ?? '') === $orderId) {
            $meta['midtrans_last']['status'] = 'settled';
            $meta['midtrans_last']['settled_at'] = date('Y-m-d H:i:s');
            $meta['midtrans_last']['transaction_id'] = $txId;
            $metaEncoded = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            ac_query($conn, 'UPDATE billing_invoices SET status = ?, meta_json = ? WHERE id = ?', [$statusAfter, $metaEncoded, $invoiceId]);
        } else {
            ac_query($conn, 'UPDATE billing_invoices SET status = ? WHERE id = ?', [$statusAfter, $invoiceId]);
        }

        ac_audit(
            $conn,
            ['id' => 0, 'name' => 'Midtrans Gateway (RPA Phase 3)'],
            'billing_payment',
            (string)$paymentId,
            'verified_midtrans',
            [
                'invoice_id' => $invoiceId,
                'order_id' => $orderId,
                'transaction_id' => $txId,
                'payment_type' => (string)($notif['payment_type'] ?? ''),
                'gross_amount' => (string)($notif['gross_amount'] ?? ''),
                'amount_credited' => $amountRecordedDecimal,
                'remaining' => $remainingDecimal,
                'status' => $statusAfter,
            ]
        );

        $conn->commit();
    }
} catch (Throwable $e) {
    if ($conn->errno === 0) {
        @$conn->rollback();
    } else {
        @$conn->rollback();
    }
    error_log('Midtrans webhook DB error: ' . $e->getMessage());
    mtw_respond(500, ['status' => 'error', 'message' => 'Gagal memproses transaksi Midtrans ke database.']);
}

if ($alreadyFullyPaid) {
    rpa_record_log(
        $conn,
        $invoiceId,
        'phase3_midtrans_webhook',
        'midtrans',
        'Sudah Lunas',
        (string)($invoiceRow['email'] ?? ''),
        ['order_id' => $orderId, 'transaction_id' => $txId, 'gross_amount' => (string)($notif['gross_amount'] ?? '')],
        'Invoice sudah berstatus lunas sebelumnya.'
    );
    mtw_respond(200, ['status' => 'already_paid', 'invoice_id' => $invoiceId, 'order_id' => $orderId]);
}

rpa_record_log(
    $conn,
    $invoiceId,
    'phase3_midtrans_webhook',
    'midtrans',
    'Terkirim',
    (string)($invoiceRow['email'] ?? $invoiceRow['phone'] ?? ''),
    [
        'order_id' => $orderId,
        'transaction_id' => $txId,
        'payment_id' => $paymentId,
        'method' => $methodLabel,
        'amount' => $amountRecordedDecimal,
        'status_invoice' => $statusAfter,
    ],
    ''
);

$receiptAuto = rpa_trigger_receipt_automation(
    $conn,
    $invoiceRow,
    $paymentId,
    (float)$amountRecordedDecimal,
    (float)$paidTotalDecimal,
    (float)$remainingDecimal,
    $statusAfter,
    $paymentDate,
    $methodLabel,
    $customer
);

mtw_respond(200, [
    'status' => 'success',
    'data' => [
        'invoice_id' => $invoiceId,
        'order_id' => $orderId,
        'payment_id' => $paymentId,
        'receipt_number' => $receiptAuto['receipt_number'],
        'payment_status' => $statusAfter,
        'amount' => $amountRecordedDecimal,
        'terbayar' => $paidTotalDecimal,
        'sisa' => $remainingDecimal,
        'receipt_url' => $receiptAuto['urls']['receipt_url'],
        'status_url' => $receiptAuto['urls']['status_url'],
        'rpa_dispatched' => $receiptAuto['rpa_dispatched'],
    ],
]);

