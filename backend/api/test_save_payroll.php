<?php
require '../config/database.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$month = '2026-07';

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

while ($row = mysqli_fetch_assoc($query)) {
    $emp_id = $row['id'];
    $base = $row['final_base_salary'] ?? 0;
    
    $sql_insert = "INSERT INTO payslips (
        employee_id, month, base_salary, late_minutes, overtime_minutes, 
        late_penalty, overtime_pay, bpjs_tk, bpjs_kes, bpjs_jp, pph21, total_potongan, total_salary, status
    ) VALUES (
        $emp_id, '$month', $base, 0, 0, 
        0, 0, 0, 0, 0, 0, 0, $base, 'draft'
    ) ON DUPLICATE KEY UPDATE 
        base_salary = VALUES(base_salary), status = 'draft'";
        
    try {
        mysqli_query($conn, $sql_insert);
        echo "Inserted for $emp_id. ";
    } catch (Exception $e) {
        echo "Error for $emp_id: " . $e->getMessage();
    }
}
?>
