<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$database = $argv[1] ?? '';
if (!preg_match('/^one_creativa_rab_test_[a-f0-9]{12}$/D', $database)) throw new RuntimeException('Only isolated test databases allowed');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/budget_workflow.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn->select_db($database);
$request = budget_mutate($conn, ['id' => 2, 'name' => 'Admin', 'role' => 'admin'],
    ['action' => 'approve', 'id' => (int)$argv[2], 'version' => (int)$argv[3]]);
echo json_encode(['status' => $request['status'], 'finance_record_id' => $request['finance_record_id']]);
