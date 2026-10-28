<?php
// Integration tests use a temporary database. No accounts or transactions in the application DB are changed.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/budget_schema.php';
require_once __DIR__ . '/../services/budget_workflow.php';
require_once __DIR__ . '/../config/session.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
session_save_path(sys_get_temp_dir());
$testName = 'one_creativa_rab_test_' . bin2hex(random_bytes(6));
if (!preg_match('/^one_creativa_rab_test_[a-f0-9]{12}$/D', $testName)) throw new RuntimeException('Invalid test database');
$originalDatabase = $conn->query('SELECT DATABASE()')->fetch_row()[0];
if ($testName === $originalDatabase) throw new RuntimeException('Test database must be isolated');
$conn->query("CREATE DATABASE `$testName`");
$conn->select_db($testName);
$checks = 0;
function verify(bool $condition, string $label): void {
    global $checks;
    if (!$condition) throw new RuntimeException("FAILED: $label");
    $checks++;
}
function denied(callable $call, int $code, string $label): void {
    try { $call(); } catch (BudgetWorkflowException $error) { verify($error->getCode() === $code, $label); return; }
    throw new RuntimeException("FAILED: $label was allowed");
}
function submission(string $key, bool $submit = false, string $period = '2026-10'): array {
    return ['action' => 'create', 'request_key' => $key, 'title' => 'Kebutuhan kantor', 'period' => $period,
        'notes' => 'Pengujian terisolasi', 'submit' => $submit, 'total_amount' => '1.00',
        'items' => [['category' => 'Perlengkapan Kantor', 'description' => 'Kertas', 'quantity' => 2, 'unit' => 'rim', 'unit_price' => '50000.25'],
                    ['category' => 'Operasional', 'description' => 'Tinta', 'quantity' => 1, 'unit' => 'botol', 'unit_price' => '20000.10']]];
}
try {
    $conn->query('CREATE TABLE roles(id INT PRIMARY KEY,name VARCHAR(50)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE users(id INT PRIMARY KEY,role_id INT,is_active INT DEFAULT 1,email VARCHAR(100), password_hash VARCHAR(255)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE employees(id INT PRIMARY KEY,user_id INT,full_name VARCHAR(100),gender VARCHAR(20),photo_url VARCHAR(200),employee_code VARCHAR(30),position VARCHAR(100)) ENGINE=InnoDB');
    $conn->query("INSERT INTO roles VALUES(1,'finance'),(2,'admin'),(3,'ga'),(4,'super_admin')");
    $conn->query("INSERT INTO users(id,role_id,email) VALUES(1,1,'finance@test'),(2,2,'admin@test'),(3,3,'ga@test'),(4,1,'second@test'),(5,4,'super@test')");
    budget_query($conn, 'UPDATE users SET password_hash=?', 's', [password_hash('isolated-test-only', PASSWORD_DEFAULT)]);
    $conn->query("CREATE TABLE finance_records(id INT AUTO_INCREMENT PRIMARY KEY,type ENUM('income','expense'),category VARCHAR(100),amount DECIMAL(15,2),description TEXT,source VARCHAR(255),transaction_date DATE,created_by INT) ENGINE=InnoDB");
    install_budget_schema($conn); install_budget_schema($conn);
    $finance = ['id' => 1, 'role' => 'finance', 'name' => 'Finance'];
    $other = ['id' => 4, 'role' => 'finance', 'name' => 'Finance lain'];
    $admin = ['id' => 2, 'role' => 'admin', 'name' => 'Admin'];
    $ga = ['id' => 3, 'role' => 'ga', 'name' => 'GA'];
    start_app_session(); verify(session_status() === PHP_SESSION_ACTIVE, 'Server session started'); $_SESSION['user_id'] = 1;
    verify(session_actor($conn)['role'] === 'finance', 'Session role comes from database');
    $_SESSION['user_id'] = 3;
    verify(session_actor($conn)['role'] === 'ga', 'Client cannot set session actor role');
    $conn->query('UPDATE users SET is_active=0 WHERE id=3');
    verify(session_actor($conn) === null, 'Inactive account denied');
    session_write_close();

    $input = submission('11111111-1111-1111-1111-111111111111');
    $draft = budget_mutate($conn, $finance, $input);
    verify($draft['total_amount'] === '120000.60', 'Server computes exact totals and ignores client total');
    verify($draft['status'] === 'draft' && count($draft['items']) === 2, 'Draft and multi-item RAB stored');
    verify(count($draft['history']) === 1 && $draft['finance_record_id'] === null, 'Draft history without income');
    $retry = budget_mutate($conn, $finance, $input);
    verify($retry['id'] === $draft['id'] && count($retry['history']) === 1, 'Create retry does not duplicate RAB or history');
    denied(fn() => budget_mutate($conn, $ga, $input), 403, 'Other roles denied');
    denied(fn() => budget_mutate($conn, $admin, $input), 403, 'Admin cannot impersonate Finance to create');
    denied(fn() => budget_mutate($conn, $other, ['action'=>'save','id'=>$draft['id'],'version'=>1]+$input), 403, 'Other Finance cannot edit draft');
    denied(fn() => budget_mutate($conn, $finance, ['action'=>'approve','id'=>$draft['id'],'version'=>1]), 403, 'Finance cannot approve');
    denied(fn() => budget_mutate($conn, $admin, ['action'=>'approve','id'=>$draft['id'],'version'=>1]), 409, 'Admin cannot approve draft');
    $invalid = $input; $invalid['items'][0]['unit_price'] = '-1';
    denied(fn() => budget_validate($invalid), 422, 'Negative price rejected');
    $invalid['items'][0]['unit_price'] = '9999999999999.99';
    denied(fn() => budget_validate($invalid), 422, 'Overflow rejected');
    $invalid = $input; $invalid['period'] = '2026-13';
    denied(fn() => budget_validate($invalid), 422, 'Invalid period rejected');
    $invalid = $input; $invalid['items'][0]['quantity'] = '1.5';
    denied(fn() => budget_validate($invalid), 422, 'Fractional quantity rejected');
    $savedInput = ['action'=>'save','id'=>$draft['id'],'version'=>1]+$input;
    $savedInput['items'][0]['quantity'] = 3;
    $saved = budget_mutate($conn, $finance, $savedInput);
    verify($saved['total_amount'] === '170000.85' && count($saved['history']) === 2, 'Draft edit totals and history updated');
    $oldSnapshot = json_decode($saved['history'][1]['snapshot_json'], true);
    verify($oldSnapshot['items'][0]['quantity'] === 2 && $oldSnapshot['total_amount'] === '120000.60', 'Previous item snapshot retained');
    denied(fn() => budget_mutate($conn, $finance, ['action'=>'submit','id'=>$draft['id'],'version'=>1]), 409, 'Stale version rejected');
    $pending = budget_mutate($conn, $finance, ['action'=>'submit','id'=>$draft['id'],'version'=>$saved['version']]);
    verify($pending['status'] === 'submitted' && $pending['submitted_at'] !== null, 'Submission timestamp saved');
    denied(fn() => budget_mutate($conn, $finance, ['action'=>'save','id'=>$pending['id'],'version'=>$pending['version']]+$input), 409, 'Submitted details locked');
    $approved = budget_mutate($conn, $admin, ['action'=>'approve','id'=>$pending['id'],'version'=>$pending['version'],'note'=>'Sesuai kebutuhan']);
    verify($approved['status'] === 'approved' && $approved['reviewed_by_name'] === 'Admin', 'Admin decision and identity stored');
    $income = $conn->query('SELECT * FROM finance_records')->fetch_assoc();
    verify($income === null && $approved['finance_record_id'] === null, 'Approval creates no cash receipt');
    $approvedRetry = budget_mutate($conn, $admin, ['action'=>'approve','id'=>$pending['id'],'version'=>$pending['version']]);
    verify($approvedRetry['finance_record_id'] === $approved['finance_record_id'] && (int)$conn->query('SELECT COUNT(*) FROM finance_records')->fetch_row()[0] === 0, 'Repeat approval creates no income');
    verify(count($approved['history']) === 4, 'Complete draft/edit/submit/approve history retained');
    denied(fn() => budget_mutate($conn, $finance, ['action'=>'cancel','id'=>$approved['id'],'version'=>$approved['version']]), 409, 'Approved RAB cannot be cancelled');

    $second = budget_mutate($conn, $finance, submission('22222222-2222-2222-2222-222222222222', true, '2026-11'));
    denied(fn() => budget_mutate($conn, $admin, ['action'=>'reject','id'=>$second['id'],'version'=>$second['version'],'note'=>'']), 422, 'Rejection requires reason');
    $rejected = budget_mutate($conn, $admin, ['action'=>'reject','id'=>$second['id'],'version'=>$second['version'],'note'=>'Belum diperlukan']);
    verify($rejected['status'] === 'rejected' && $rejected['finance_record_id'] === null && $rejected['review_note'] === 'Belum diperlukan', 'Rejected RAB creates no income and retains reason');
    $third = budget_mutate($conn, $finance, submission('33333333-3333-3333-3333-333333333333', true, '2026-11'));
    $cancelled = budget_mutate($conn, $finance, ['action'=>'cancel','id'=>$third['id'],'version'=>$third['version'],'note'=>'Revisi kebutuhan']);
    verify($cancelled['status'] === 'cancelled' && count($cancelled['history']) === 3 && $cancelled['finance_record_id'] === null, 'Cancellation retains history without income');
    verify((int)$conn->query("SELECT COUNT(*) FROM budget_requests WHERE period='2026-11-01'")->fetch_row()[0] === 2, 'Monthly history includes rejected and cancelled submissions');

    // A database failure after the decision must roll back both income and status.
    $rollback = budget_mutate($conn, $finance, submission('44444444-4444-4444-4444-444444444444', true));
    $conn->query("CREATE TRIGGER reject_approval_history BEFORE INSERT ON budget_request_history FOR EACH ROW BEGIN IF NEW.action='approve' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Test failure'; END IF; END");
    try { budget_mutate($conn, $admin, ['action'=>'approve','id'=>$rollback['id'],'version'=>$rollback['version']]); throw new RuntimeException('Rollback failure was not triggered'); }
    catch (mysqli_sql_exception $error) { verify($error->getMessage() === 'Test failure', 'Approval failure injected'); }
    $after = budget_read($conn, (int)$rollback['id']);
    verify($after['status'] === 'submitted' && $after['finance_record_id'] === null && count($after['history']) === 2, 'Failed approval rolls back income, status and history');
    $conn->query('DROP TRIGGER reject_approval_history');
    $concurrent = budget_mutate($conn, $finance, submission('55555555-5555-5555-5555-555555555555', true));
    $workers = [];
    for ($index = 0; $index < 2; $index++) {
        $process = proc_open([PHP_BINARY, __DIR__ . '/budget_approval_worker.php', $testName, (string)$concurrent['id'], (string)$concurrent['version']],
            [['pipe','r'],['pipe','w'],['pipe','w']], $workerPipes);
        if (!is_resource($process)) throw new RuntimeException('Cannot start approval worker');
        fclose($workerPipes[0]); $workers[] = [$process, $workerPipes];
    }
    $workerResults = [];
    foreach ($workers as [$process, $workerPipes]) {
        $workerOutput = stream_get_contents($workerPipes[1]); $workerError = stream_get_contents($workerPipes[2]);
        fclose($workerPipes[1]); fclose($workerPipes[2]);
        verify(proc_close($process) === 0 && !$workerError, 'Concurrent approval worker succeeded');
        $workerResults[] = json_decode($workerOutput, true);
    }
    verify($workerResults[0]['finance_record_id'] === $workerResults[1]['finance_record_id'], 'Concurrent approvals return the same noncash decision');
    $concurrentResult = budget_read($conn, (int)$concurrent['id']);
    verify(count($concurrentResult['history']) === 3, 'Concurrent approvals record one approval event');
    require __DIR__ . '/budget_http_checks.php';
    budget_http_checks($conn, $testName);
    echo "PASS: $checks budget workflow checks.\n";
} finally {
    $conn->select_db($originalDatabase);
    $conn->query("DROP DATABASE `$testName`");
}
