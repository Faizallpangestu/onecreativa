<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../services/budget_workflow.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$requestId=bin2hex(random_bytes(8));header('X-Request-ID: '.$requestId);
try {
    $actor = session_actor($conn);
    if (!$actor) budget_fail('Sesi login perlu diperbarui. Silakan masuk kembali untuk mengakses RAB.', 401);
    budget_require_access($actor,$conn);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!$csrf || !hash_equals($_SESSION['csrf_token'] ?? '', $csrf)) budget_fail('Sesi tidak valid. Muat ulang halaman.', 403);
        // Release the session lock; database row locks protect concurrent approvals.
        session_write_close();
        $multipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') === 0;
        if ($multipart && !isset($_POST['payload'])) budget_fail('Unggahan terlalu besar atau tidak valid. Gambar maksimal 2 MB.', 413);
        $data = json_decode($multipart ? $_POST['payload'] : file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) budget_fail('Data pengajuan tidak valid.');
        $request = budget_mutate($conn, $actor, $data, $_FILES['attachment'] ?? null);
        echo json_encode(['status' => 'success', 'data' => $request]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $permissions = budget_permissions($actor,$conn);
        $csrf = $_SESSION['csrf_token'];
        session_write_close();
        if (isset($_GET['image'])) {
            budget_serve_attachment($conn, (int)($_GET['id'] ?? 0), (string)$_GET['image']);
            exit;
        }
        if (isset($_GET['id'])) {
            $data = budget_read($conn, (int)$_GET['id']);
        } else {
            $where = []; $types = ''; $params = [];
            if (!empty($_GET['month'])) {
                $month = $_GET['month'];
                if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/D', $month)) budget_fail('Filter bulan tidak valid.');
                if (($_GET['month_by'] ?? '') === 'submitted') {
                    $where[] = 'b.submitted_at>=? AND b.submitted_at<DATE_ADD(?, INTERVAL 1 MONTH)';
                    $params = [$month . '-01', $month . '-01']; $types = 'ss';
                } else { $where[] = 'b.period=?'; $params[] = $month . '-01'; $types .= 's'; }
            }
            $sql = "SELECT b.*, f.id AS finance_record_id FROM budget_requests b LEFT JOIN finance_records f ON f.budget_request_id=b.id";
            if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
            $sql .= ' ORDER BY b.period DESC, b.created_at DESC, b.id DESC';
            $data = budget_query($conn, $sql, $types, $params)->get_result()->fetch_all(MYSQLI_ASSOC);
        }
        echo json_encode(['status' => 'success', 'data' => $data, 'permissions' => $permissions, 'csrf_token' => $csrf]);
    } else budget_fail('Method not allowed', 405);
} catch (BudgetWorkflowException|AccountingException $error) {
    http_response_code($error->getCode());
    echo json_encode(['status' => 'error', 'message' => $error->getMessage(), 'request_id'=>$requestId]);
} catch (JsonException $error) {
    http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Format data pengajuan tidak valid.']);
} catch (Throwable $error) {
    error_log('Budget workflow '.$requestId.': ' . $error->getMessage());
    http_response_code(500); echo json_encode(['status' => 'error', 'message' => 'RAB gagal diproses. Data tidak diubah. Hubungi administrator dengan ID permintaan.', 'request_id'=>$requestId]);
}
