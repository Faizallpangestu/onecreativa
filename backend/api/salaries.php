<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../services/salary_workflow.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn->query("SET time_zone='+07:00'");
try {
    $actor = session_actor($conn);
    if (!$actor) salary_fail('Silakan masuk kembali untuk mengakses penggajian.', 401);
    salary_require_access($actor);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!$csrf || !hash_equals($_SESSION['csrf_token'] ?? '', $csrf)) salary_fail('Sesi tidak valid. Muat ulang halaman.', 403);
        session_write_close();
        $data = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) salary_fail('Data penggajian tidak valid.');
        $result = ($data['action'] ?? '') === 'set_base_salary' ? salary_set_base_rate($conn,$actor,$data) : salary_mutate($conn, $actor, $data);
        echo json_encode(['status'=>'success', 'data'=>$result]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $permissions = salary_permissions($actor); $csrf = $_SESSION['csrf_token']; session_write_close();
        if (($_GET['view'] ?? '') === 'base_salary') $data = salary_base_settings($conn, $_GET['month'] ?? substr(salary_today(),0,7));
        elseif (isset($_GET['id'])) $data = salary_read($conn, (int)$_GET['id']);
        else {
            $month = $_GET['month'] ?? (new DateTimeImmutable('first day of last month', new DateTimeZone('Asia/Jakarta')))->format('Y-m');
            $all = ($_GET['all'] ?? '') === '1';
            $period = salary_period($month);
            $sql = 'SELECT s.*,f.id AS finance_record_id FROM salary_requests s LEFT JOIN finance_records f ON f.salary_request_id=s.id';
            $requests = salary_query($conn, $sql . ($all ? '' : ' WHERE s.month=?') . ' ORDER BY s.month DESC,s.employee_name,s.id DESC', $all?'':'s', $all?[]:[$month])->get_result()->fetch_all(MYSQLI_ASSOC);
            foreach ($requests as &$request) { $request=salary_normalize_totals($request); unset($request['attendance_json']); } unset($request);
            $data = ['preview'=>$all?[]:salary_preview($conn,$month), 'requests'=>$requests, 'period'=>$period, 'today'=>salary_today()];
        }
        echo json_encode(['status'=>'success','data'=>$data,'permissions'=>$permissions,'csrf_token'=>$csrf]);
    } else salary_fail('Method not allowed', 405);
} catch (SalaryWorkflowException $error) {
    http_response_code($error->getCode()); echo json_encode(['status'=>'error','message'=>$error->getMessage()]);
} catch (JsonException $error) {
    http_response_code(400); echo json_encode(['status'=>'error','message'=>'Format data penggajian tidak valid.']);
} catch (Throwable $error) {
    error_log('Salary workflow: '.$error->getMessage()); http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Penggajian gagal diproses. Data tidak diubah. Hubungi administrator.']);
}
