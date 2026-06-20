<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ["status" => "error", "message" => "Method not allowed"]);
}

$data = json_decode(file_get_contents("php://input"), true);
$month = $data['month'] ?? date('Y-m');

// Kalkulasi untuk seluruh karyawan (mengutamakan employees.base_salary, fallback ke positions.base_salary)
$query = mysqli_query($conn, "
SELECT 
    employees.id,
    COALESCE(NULLIF(employees.base_salary, 0), positions.base_salary) AS final_base_salary,
    0 as total_late,
    0 as total_overtime
FROM employees
LEFT JOIN attendance_logs 
  ON attendance_logs.employee_id = employees.id 
  AND DATE_FORMAT(attendance_logs.date, '%Y-%m') = '$month'
LEFT JOIN positions ON employees.position = positions.name
JOIN users ON employees.user_id = users.id
JOIN roles ON users.role_id = roles.id
WHERE roles.name IN ('karyawan', 'employee')
GROUP BY employees.id
");

$successCount = 0;

while ($row = mysqli_fetch_assoc($query)) {
    $emp_id = $row['id'];
    $base = $row['final_base_salary'] ?? 0;
    $late = $row['total_late'] ?? 0;
    $overtime = $row['total_overtime'] ?? 0;

    $potongan = $late * 1000; 
    $lembur = $overtime * 2000;

    $bpjs_tk  = $base * 0.02; 
    $bpjs_kes = $base * 0.01; 
    $bpjs_pen = $base * 0.01; 

    $taxable = ($base + $lembur) - 4500000;
    $pph21 = $taxable > 0 ? $taxable * 0.05 : 0;

    $total_potongan = $potongan + $bpjs_tk + $bpjs_kes + $bpjs_pen + $pph21;
    $total = $base + $lembur - $total_potongan;

    // Masukkan ke tabel payslips (ON DUPLICATE KEY UPDATE) dengan status DRAFT
    $sql_insert = "INSERT INTO payslips (
        employee_id, month, base_salary, late_minutes, overtime_minutes, 
        late_penalty, overtime_pay, bpjs_tk, bpjs_kes, bpjs_jp, pph21, total_potongan, total_salary, status
    ) VALUES (
        $emp_id, '$month', $base, $late, $overtime, 
        $potongan, $lembur, $bpjs_tk, $bpjs_kes, $bpjs_pen, $pph21, $total_potongan, $total, 'draft'
    ) ON DUPLICATE KEY UPDATE 
        base_salary = VALUES(base_salary),
        late_minutes = VALUES(late_minutes),
        overtime_minutes = VALUES(overtime_minutes),
        late_penalty = VALUES(late_penalty),
        overtime_pay = VALUES(overtime_pay),
        bpjs_tk = VALUES(bpjs_tk),
        bpjs_kes = VALUES(bpjs_kes),
        bpjs_jp = VALUES(bpjs_jp),
        pph21 = VALUES(pph21),
        total_potongan = VALUES(total_potongan),
        total_salary = VALUES(total_salary),
        status = 'draft'
    ";

    if (mysqli_query($conn, $sql_insert)) {
        $successCount++;
    }
}

respond(200, [
    "status" => "success", 
    "message" => "Berhasil menyimpan kalkulasi gaji untuk $successCount karyawan ke Finance."
]);
