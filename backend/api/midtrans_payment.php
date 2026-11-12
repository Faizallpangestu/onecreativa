<?php
/**
 * midtrans_payment.php (RPA Fase 3)
 * Membuat atau mengambil ulang tautan pembayaran online Midtrans (QRIS / Virtual Account)
 * untuk invoice LPK Creativa yang berstatus Unpaid atau Partially Paid.
 *
 * Akses:
 * - GET  ?id=<invoice_id>&token=<public_token>
 * - POST { invoice_id, token, mode: 'installment'|'full', amount? }
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

function mt_respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mt_map_invoice_state(mysqli $conn, string $invoiceId): ?array {
    $stmt = $conn->prepare("SELECT * FROM billing_invoices WHERE id = ? LIMIT 1");
    if (!$stmt) return null;
    $stmt->bind_param('s', $invoiceId);
    $stmt->execute();
    $invoice = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$invoice) return null;

    $paid = 0.0;
    $pStmt = $conn->prepare("SELECT COALESCE(SUM(jumlah), 0) AS paid FROM billing_pembayaran WHERE noInv = ? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified')");
    if ($pStmt) {
        $pStmt->bind_param('s', $invoiceId);
        $pStmt->execute();
        $paid = (float)(($pStmt->get_result()->fetch_assoc())['paid'] ?? 0);
        $pStmt->close();
    }

    $total = (float)$invoice['total'];
    $statusNorm = strtolower(trim((string)$invoice['status']));
    if ($paid <= 0 && in_array($statusNorm, ['paid', 'lunas'], true)) {
        $paid = $total;
    }

    $terbayar = min($total, $paid);
    $remaining = max(0.0, $total - $terbayar);
    $meta = !empty($invoice['meta_json']) ? (json_decode((string)$invoice['meta_json'], true) ?: []) : [];
    $instCalc = rpa_compute_installments_due($meta, $total, $terbayar, (string)($invoice['jatuhTempo'] ?? ''));

    return [
        'invoice' => $invoice,
        'meta' => $meta,
        'total' => $total,
        'terbayar' => $terbayar,
        'remaining' => $remaining,
        'next_due' => $instCalc['next_due'],
        'installments' => $instCalc['installments'],
    ];
}

$raw = file_get_contents('php://input');
$body = $raw ? (json_decode($raw, true) ?: []) : [];
if (!empty($_POST)) {
    $body = array_merge($body, $_POST);
}

$invoiceId = trim((string)($_GET['id'] ?? $body['invoice_id'] ?? $body['id'] ?? ''));
$token = trim((string)($_GET['token'] ?? $body['token'] ?? ''));
$apiKey = trim((string)($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? $body['secret'] ?? ''));

if ($invoiceId === '') {
    mt_respond(400, ['status' => 'error', 'message' => 'Nomor invoice wajib diisi.']);
}

rpa_ensure_billing_columns($conn);

$state = mt_map_invoice_state($conn, $invoiceId);
if (!$state) {
    mt_respond(404, ['status' => 'error', 'message' => 'Invoice tidak ditemukan.']);
}

$invoice = $state['invoice'];
$storedToken = trim((string)($invoice['public_token'] ?? ''));
$expectedSecret = rpa_get_secret();
$hasSecretAccess = ($apiKey !== '' && hash_equals($expectedSecret, $apiKey));
$hasTokenAccess = ($token !== '' && $storedToken !== '' && hash_equals($storedToken, $token));

if (!$hasSecretAccess && !$hasTokenAccess) {
    require_once __DIR__ . '/../config/session.php';
    $erpActor = session_actor($conn);
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    if (!$erpActor) {
        mt_respond(403, ['status' => 'error', 'message' => 'Akses ditolak: token invoice tidak valid.']);
    }
}

$mtConfig = rpa_get_midtrans_config();
$meta = $state['meta'];
$remaining = $state['remaining'];
$nextDue = $state['next_due'];
$dueNowNominal = $nextDue ? (float)$nextDue['sisa'] : $remaining;
$dueNowLabel = $nextDue ? (string)$nextDue['label'] : 'FULL PAYMENT';

$cachedLast = (!empty($meta['midtrans_last']) && is_array($meta['midtrans_last'])) ? $meta['midtrans_last'] : null;
$cachedValid = $cachedLast
    && !empty($cachedLast['redirect_url'])
    && (($cachedLast['status'] ?? 'pending') === 'pending')
    && (((int)($cachedLast['created_at_ts'] ?? 0)) > (time() - 72000));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    mt_respond(200, [
        'status' => 'success',
        'data' => [
            'invoice_id' => $invoiceId,
            'midtrans_enabled' => $mtConfig['is_configured'],
            'is_production' => $mtConfig['is_production'],
            'remaining' => $remaining,
            'due_now_nominal' => $dueNowNominal,
            'due_now_label' => $dueNowLabel,
            'active_payment_link' => $cachedValid ? $cachedLast['redirect_url'] : null,
            'active_order_id' => $cachedValid ? ($cachedLast['order_id'] ?? null) : null,
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    mt_respond(405, ['status' => 'error', 'message' => 'Metode HTTP harus GET atau POST.']);
}

if ($remaining <= 0.01) {
    mt_respond(409, ['status' => 'error', 'message' => 'Invoice ini sudah lunas. Tidak ada sisa tagihan.']);
}

if (!$mtConfig['is_configured']) {
    mt_respond(503, [
        'status' => 'unconfigured',
        'message' => 'Payment Gateway Midtrans belum diaktifkan. Isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di backend/config/rpa.local.php terlebih dahulu, atau gunakan Transfer Bank BCA manual.',
    ]);
}

$mode = strtolower(trim((string)($body['mode'] ?? 'installment')));
$requestedAmount = isset($body['amount']) && is_numeric($body['amount']) ? (float)$body['amount'] : 0.0;

if ($requestedAmount > 0) {
    $payAmount = min($remaining, $requestedAmount);
    $termLabel = abs($payAmount - $remaining) <= 0.01 ? 'PELUNASAN SISA TAGIHAN' : 'PEMBAYARAN SEBAGIAN';
} elseif ($mode === 'full') {
    $payAmount = $remaining;
    $termLabel = 'PELUNASAN TOTAL';
} else {
    $payAmount = min($remaining, max(0.0, $dueNowNominal > 0 ? $dueNowNominal : $remaining));
    $termLabel = $dueNowLabel;
}

$grossAmount = (int)round($payAmount);
if ($grossAmount < 1000) {
    mt_respond(400, ['status' => 'error', 'message' => 'Nominal pembayaran minimum untuk QRIS/VA adalah Rp 1.000.']);
}

if ($cachedValid && (int)($cachedLast['gross_amount'] ?? 0) === $grossAmount) {
    mt_respond(200, [
        'status' => 'success',
        'data' => [
            'invoice_id' => $invoiceId,
            'order_id' => (string)$cachedLast['order_id'],
            'snap_token' => (string)($cachedLast['snap_token'] ?? ''),
            'redirect_url' => (string)$cachedLast['redirect_url'],
            'gross_amount' => $grossAmount,
            'term_label' => (string)($cachedLast['term_label'] ?? $termLabel),
            'is_production' => $mtConfig['is_production'],
            'reused' => true,
        ],
    ]);
}

$publicToken = $storedToken !== '' ? $storedToken : rpa_ensure_invoice_token($conn, $invoiceId);
$urls = rpa_build_public_urls($invoiceId, $publicToken);
$orderId = preg_replace('/[^A-Za-z0-9_]/', '', $invoiceId) . '-' . time() . '-' . random_int(100, 999);
$programTitle = trim((string)($meta['program'] ?? $invoice['keterangan'] ?? 'Program LPK Creativa'));
$customerName = trim((string)($invoice['customer'] ?? 'Kandidat LPK Creativa'));
$customerEmail = trim((string)($invoice['email'] ?? ''));
if (!filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
    $customerEmail = 'finance@creativabridging.com';
}
$customerPhone = preg_replace('/[^0-9+]/', '', (string)($invoice['phone'] ?? '')) ?: '08152222672';
$itemName = mb_substr("{$invoiceId} {$termLabel}", 0, 50);

$snapPayload = [
    'transaction_details' => [
        'order_id' => $orderId,
        'gross_amount' => $grossAmount,
    ],
    'customer_details' => [
        'first_name' => mb_substr($customerName, 0, 50),
        'email' => $customerEmail,
        'phone' => $customerPhone,
    ],
    'item_details' => [[
        'id' => mb_substr($invoiceId, 0, 48),
        'price' => $grossAmount,
        'quantity' => 1,
        'name' => $itemName,
        'category' => mb_substr($programTitle, 0, 48),
    ]],
    'enabled_payments' => [
        'gopay',
        'other_qris',
        'shopeepay',
        'bca_va',
        'bni_va',
        'bri_va',
        'permata_va',
        'echannel',
        'cimb_va',
    ],
    'callbacks' => [
        'finish' => $urls['status_url'],
    ],
    'custom_field1' => $invoiceId,
    'custom_field2' => $termLabel,
];

if (!function_exists('curl_init')) {
    mt_respond(500, ['status' => 'error', 'message' => 'Ekstensi PHP cURL belum aktif untuk menghubungi Midtrans.']);
}

$ch = curl_init($mtConfig['snap_url']);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Basic ' . base64_encode($mtConfig['server_key'] . ':'),
    ],
    CURLOPT_POSTFIELDS => json_encode($snapPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$respRaw = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$respJson = $respRaw ? json_decode($respRaw, true) : null;
if ($curlErr !== '' || $httpCode < 200 || $httpCode >= 300 || empty($respJson['redirect_url'])) {
    $errMsg = !empty($respJson['error_messages'])
        ? implode('; ', (array)$respJson['error_messages'])
        : ($curlErr ?: "HTTP {$httpCode} dari Midtrans Snap API");

    rpa_record_log(
        $conn,
        $invoiceId,
        'phase3_snap_created',
        'midtrans',
        'Gagal',
        $customerEmail,
        ['order_id' => $orderId, 'gross_amount' => $grossAmount, 'http_code' => $httpCode],
        $errMsg
    );

    mt_respond(502, [
        'status' => 'error',
        'message' => 'Gagal membuat tautan pembayaran Midtrans: ' . $errMsg,
    ]);
}

$meta['midtrans_last'] = [
    'order_id' => $orderId,
    'snap_token' => (string)($respJson['token'] ?? ''),
    'redirect_url' => (string)$respJson['redirect_url'],
    'gross_amount' => $grossAmount,
    'term_label' => $termLabel,
    'status' => 'pending',
    'created_at_ts' => time(),
    'created_at' => date('Y-m-d H:i:s'),
];

$metaEncoded = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$uStmt = $conn->prepare("UPDATE billing_invoices SET meta_json = ? WHERE id = ?");
if ($uStmt) {
    $uStmt->bind_param('ss', $metaEncoded, $invoiceId);
    $uStmt->execute();
    $uStmt->close();
}

rpa_record_log(
    $conn,
    $invoiceId,
    'phase3_snap_created',
    'midtrans',
    'Terkirim',
    $customerEmail ?: $customerPhone,
    ['order_id' => $orderId, 'gross_amount' => $grossAmount, 'term_label' => $termLabel],
    ''
);

mt_respond(200, [
    'status' => 'success',
    'data' => [
        'invoice_id' => $invoiceId,
        'order_id' => $orderId,
        'snap_token' => (string)($respJson['token'] ?? ''),
        'redirect_url' => (string)$respJson['redirect_url'],
        'gross_amount' => $grossAmount,
        'term_label' => $termLabel,
        'is_production' => $mtConfig['is_production'],
        'reused' => false,
    ],
]);

