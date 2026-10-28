<?php
$_GET['month'] = '2026-07';
$_GET['role'] = 'finance';
require '../config/database.php';

$month = $_GET['month'];
    $q = mysqli_query($conn, "
        SELECT p.*, e.employee_code as nik, e.full_name as name, pos.name as position 
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN positions pos ON e.position = pos.name
        WHERE p.month = '$month'
    ");
    $data = [];
    if (!$q) {
        echo mysqli_error($conn);
        exit;
    }
    while ($r = mysqli_fetch_assoc($q)) {
        $r['potongan'] = $r['late_penalty'];
        $r['lembur'] = $r['overtime_pay'];
        $r['is_published'] = ($r['status'] === 'published');
        $data[] = $r;
    }
    echo json_encode(["status" => "success", "data" => $data]);
?>
