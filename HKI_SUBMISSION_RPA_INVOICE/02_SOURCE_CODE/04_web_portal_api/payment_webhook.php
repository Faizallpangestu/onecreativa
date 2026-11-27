<?php
/**
 * Midtrans Webhook (Notification) Handler
 * POST /api/payment_webhook.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';
if (is_file(__DIR__ . '/config.rpa.local.php')) {
    require_once __DIR__ . '/config.rpa.local.php';
}
require_once 'database.php';

$inputSource = file_get_contents('php://input');
$notif = json_decode((string)$inputSource, true);

if (!is_array($notif) || empty($notif['order_id']) || empty($notif['transaction_status'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
    exit;
}

$serverKey = defined('MIDTRANS_SERVER_KEY') ? trim((string)MIDTRANS_SERVER_KEY) : '';
$isKeyConfigured = $serverKey !== '' && stripos($serverKey, 'YOUR_SERVER_KEY') === false;
if ($isKeyConfigured) {
    $expectedSig = hash(
        'sha512',
        (string)($notif['order_id'] ?? '')
        . (string)($notif['status_code'] ?? '')
        . (string)($notif['gross_amount'] ?? '')
        . $serverKey
    );
    $actualSig = strtolower(trim((string)($notif['signature_key'] ?? '')));
    if ($actualSig === '' || !hash_equals($expectedSig, $actualSig)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Invalid Midtrans signature_key']);
        exit;
    }
}

$transactionStatus = strtolower((string)$notif['transaction_status']);
$orderId = (string)$notif['order_id'];
$fraudStatus = strtolower((string)($notif['fraud_status'] ?? ''));
$customInvoice = trim((string)($notif['custom_field1'] ?? ''));
$nomor_invoice = $customInvoice !== ''
    ? $customInvoice
    : (preg_match('/^(.+?)-\d{8,13}-\d{2,4}$/', $orderId, $m) ? trim($m[1]) : explode('-', $orderId)[0]);

// Teruskan webhook ke ERP One-creativa apabila endpoint dikonfigurasi
$erpWebhookUrl = defined('ONE_CREATIVA_MIDTRANS_WEBHOOK_URL') ? trim((string)ONE_CREATIVA_MIDTRANS_WEBHOOK_URL) : '';
$erpResult = null;
if ($erpWebhookUrl !== '' && function_exists('curl_init')) {
    $ch = curl_init($erpWebhookUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_POSTFIELDS => (string)$inputSource,
    ]);
    $erpResp = curl_exec($ch);
    $erpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $erpResult = ['http_code' => $erpCode, 'response' => $erpResp ? json_decode($erpResp, true) : null];
}

// Pertahankan sinkronisasi tabel legacy `invoices` di cbidb jika barisnya ada
$legacyStatus = 'Menunggu';
try {
    $pdo = getDbConnection();

    if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
        $legacyStatus = ($fraudStatus === 'challenge') ? 'Menunggu' : 'Dibayar';
    } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire', 'failure'], true)) {
        $legacyStatus = 'Gagal/Batal';
    }

    if ($legacyStatus === 'Dibayar') {
        $stmt = $pdo->prepare("UPDATE invoices SET status = 'Dibayar', tanggal_bayar = NOW() WHERE nomor_invoice = ?");
        $stmt->execute([$nomor_invoice]);
    } elseif ($legacyStatus === 'Gagal/Batal') {
        $stmt = $pdo->prepare("UPDATE invoices SET status = 'Gagal' WHERE nomor_invoice = ? AND status != 'Dibayar'");
        $stmt->execute([$nomor_invoice]);
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Invoice $nomor_invoice processed ($legacyStatus)",
        'erp_forward' => $erpResult,
    ]);
} catch (Exception $e) {
    if ($erpResult && ($erpResult['http_code'] ?? 0) >= 200 && ($erpResult['http_code'] ?? 0) < 300) {
        echo json_encode([
            'status' => 'success',
            'message' => "Forwarded to ERP webhook ($nomor_invoice)",
            'erp_forward' => $erpResult,
        ]);
        exit;
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
