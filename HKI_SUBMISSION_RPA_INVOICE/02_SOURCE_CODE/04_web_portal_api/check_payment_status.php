<?php
/**
 * Polling API for React Frontend
 * GET /api/check_payment_status.php?order_id=...
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';
require_once 'database.php';

$orderId = $_GET['order_id'] ?? '';
if (!$orderId) {
    echo json_encode(['status' => 'error', 'message' => 'No order_id']);
    exit;
}

$nomor_invoice = explode('-', $orderId)[0];

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT status FROM invoices WHERE nomor_invoice = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$nomor_invoice]);
    $inv = $stmt->fetch();

    if ($inv) {
        echo json_encode(['status' => 'success', 'payment_status' => $inv['status']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invoice not found']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
