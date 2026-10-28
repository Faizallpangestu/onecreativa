<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../services/salary_workflow.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn->query("SET time_zone='+07:00'");
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') salary_fail('Method not allowed',405);
    $actor = session_actor($conn);
    if (!$actor) salary_fail('Silakan masuk kembali untuk melihat slip gaji.',401);
    session_write_close();
    $month = $_GET['month'] ?? date('Y-m'); salary_period($month);
    $employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : 0;
    $manages = in_array($actor['role'],['finance','admin','super_admin','hr','hrd','manager'],true);
    if (!$manages) {
        if (!in_array($actor['role'],['karyawan','employee','staff'],true)) salary_fail('Anda tidak berhak melihat slip gaji.',403);
        $employee = salary_query($conn,'SELECT id FROM employees WHERE user_id=?','i',[(int)$actor['id']])->get_result()->fetch_assoc();
        if (!$employee) salary_fail('Data karyawan tidak ditemukan.',404);
        if ($employeeId && $employeeId !== (int)$employee['id']) salary_fail('Hanya slip gaji Anda yang dapat dilihat.',403);
        $employeeId = (int)$employee['id'];
    }
    if ($manages && ($_GET['role'] ?? '') === 'hrd' && !$employeeId) {
        $rows = salary_preview($conn,$month);
        $saved = array_column(salary_query($conn,'SELECT employee_id,status,base_salary,work_days,meal_allowance,transport_allowance,total_salary FROM salary_requests WHERE month=?','s',[$month])->get_result()->fetch_all(MYSQLI_ASSOC),null,'employee_id');
        $data = array_map(function ($row) use ($saved) {
            $request = $saved[$row['employee_id']] ?? null;
            if (($request['status'] ?? '') === 'paid') foreach (['base_salary','work_days','meal_allowance','transport_allowance','total_salary'] as $field) $row[$field]=$request[$field];
            return $row + ['status'=>($request['status'] ?? '')==='paid' || $row['legacy_published'] ? 'published' : 'draft', 'id'=>$row['employee_id'],'name'=>$row['employee_name'],'nik'=>$row['employee_code'],'position'=>$row['position_name'],
            'hari_kerja'=>$row['work_days'],'uang_makan'=>$row['meal_allowance'],'uang_transport'=>$row['transport_allowance'],'lembur'=>0,'potongan'=>0,'total_potongan'=>0,'bpjs_tk'=>0,'bpjs_kes'=>0,'bpjs_jp'=>0,'pph21'=>0]; },$rows);
    } else {
        $all = ($_GET['all'] ?? '') === '1';
        $where = ($all ? '' : ' AND p.month=?').($employeeId ? ' AND p.employee_id=?' : '');
        $types = ($all ? '' : 's').($employeeId ? 'i' : '');
        $params = array_merge($all ? [] : [$month],$employeeId ? [$employeeId] : []);
        $legacy = salary_query($conn,"SELECT p.*,e.employee_code AS nik,e.full_name AS name,e.position FROM payslips p JOIN employees e ON e.id=p.employee_id
            WHERE p.status='published'$where AND NOT EXISTS(SELECT 1 FROM salary_requests s JOIN salary_slips ss ON ss.salary_request_id=s.id WHERE s.employee_id=p.employee_id AND s.month=p.month)",
            $types,$params)->get_result()->fetch_all(MYSQLI_ASSOC);
        foreach ($legacy as &$row) { $row['potongan']=$row['late_penalty']; $row['lembur']=$row['overtime_pay']; $row['payment_status']='paid'; } unset($row);
        $current = salary_query($conn,"SELECT p.*,ss.snapshot_json AS slip_snapshot_json,ss.published_at AS slip_published_at FROM salary_requests p JOIN salary_slips ss ON ss.salary_request_id=p.id WHERE p.status IN ('approved','paid')".$where.($manages?'':' AND ss.user_id=?'),
            $types.($manages?'':'i'),array_merge($params,$manages?[]:[(int)$actor['id']]))->get_result()->fetch_all(MYSQLI_ASSOC);
        foreach ($current as &$row) {
            $snapshot=json_decode($row['slip_snapshot_json'],true,512,JSON_THROW_ON_ERROR);
            foreach (['recipient_email','bpjs_tk_number','bpjs_kes_number'] as $field) $row[$field]=$snapshot[$field];
            $row['payment_status']=$row['status']; $row['salary_request_id']=$row['id']; unset($row['slip_snapshot_json']);
            unset($row['attendance_json']); $row['nik']=$row['employee_code']; $row['name']=$row['employee_name']; $row['position']=$row['position_name'];
            $row['uang_makan']=$row['meal_allowance']; $row['uang_transport']=$row['transport_allowance']; $row['hari_kerja']=$row['work_days'];
            $row=salary_normalize_totals($row);
            $row['potongan']=$row['leave_deduction']; $row['total_potongan']=$row['total_deductions'];
            $row['bpjs_tk']=$row['bpjs_tk_deduction']; $row['bpjs_kes']=$row['bpjs_kes_deduction'];
            foreach (['lembur','bpjs_jp','pph21','late_minutes','overtime_minutes'] as $field) $row[$field]=0;
            $row['status']='published'; $row['published_at']=$row['slip_published_at'];
        } unset($row);
        $data = array_merge($current,$legacy);
        usort($data,fn($a,$b)=>strcmp($b['month'],$a['month']));
    }
    echo json_encode(['status'=>'success','data'=>$data]);
} catch (SalaryWorkflowException $error) { http_response_code($error->getCode()); echo json_encode(['status'=>'error','message'=>$error->getMessage()]); }
catch (Throwable $error) { error_log('Payslip read: '.$error->getMessage()); http_response_code(500); echo json_encode(['status'=>'error','message'=>'Slip gaji gagal dimuat.']); }
