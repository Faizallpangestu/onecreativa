<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

$tables = [
    'users', 'employees', 'roles', 'departments', 'positions',
    'peserta_intensif', 'attendance_logs', 'daily_reports',
    'leaves', 'settings', 'reimbursements', 'transactions',
    'matching_jobs', 'lpk_matching_job', 'matching_candidate_history', 'matching_student_links'
];

$results = [];
foreach ($tables as $t) {
    $chk = mysqli_query($conn, "SHOW TABLES LIKE '$t'");
    if ($chk && mysqli_num_rows($chk) > 0) {
        $ok = mysqli_query($conn, "ALTER TABLE `$t` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        $results[$t] = $ok ? 'success' : mysqli_error($conn);
    }
}

// Test LMS query
$test = mysqli_query($conn, "
    SELECT u.id AS user_id, e.id AS employee_id, u.email, r.name AS role_name, e.full_name, e.employee_code
    FROM users u 
    LEFT JOIN employees e ON e.user_id = u.id 
    LEFT JOIN roles r ON r.id = u.role_id 
    WHERE r.name IN ('sensei', 'sensei_intensif', 'peserta_intensif')
    ORDER BY u.id DESC
");

echo json_encode([
    'status' => 'success',
    'table_conversions' => $results,
    'lms_query_test' => $test ? 'ok' : mysqli_error($conn)
], JSON_PRETTY_PRINT);
