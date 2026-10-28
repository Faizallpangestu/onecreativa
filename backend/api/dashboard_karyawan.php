<?php
header("Content-Type: application/json");
header('Cache-Control: no-store, private, max-age=0');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
$actor = session_actor($conn);
if (!$actor) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Silakan masuk kembali.']); exit; }
session_write_close();

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($user_id !== (int)$actor['id']) { http_response_code(403); echo json_encode(['status'=>'error','message'=>'Hanya dashboard Anda yang dapat dilihat.']); exit; }

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required"]);
    exit;
}

// Get employee — removed invalid position_id column
$qEmp = mysqli_query($conn, "SELECT id, full_name, employee_code, department_id FROM employees WHERE user_id = $user_id LIMIT 1");
if (!$qEmp || mysqli_num_rows($qEmp) == 0) {
    echo json_encode([
        "status" => "success",
        "data" => [
            "stats" => [
                'hadir_hari_ini'  => '--:--',
                'status_absen'    => 'Belum Absen',
                'total_kehadiran' => 0,
                'izin_cuti'       => 0,
                'terlambat'       => 0,
                'alpa'            => 0,
                'total_hari_kerja'=> 22
            ],
            "calendar" => [],
            "gaji"     => null,
            "tugas"    => []
        ]
    ]);
    exit;
}

$emp     = mysqli_fetch_assoc($qEmp);
$emp_id  = $emp['id'];

$month = date('m');
$year  = date('Y');
$today = date('Y-m-d');

// Default Stats
$stats = [
    'hadir_hari_ini'  => '--:--',
    'status_absen'    => 'Belum Absen',
    'total_kehadiran' => 0,
    'izin_cuti'       => 0,
    'terlambat'       => 0,
    'alpa'            => 0,
    'total_hari_kerja'=> 22
];

// 1. Hadir Hari Ini — from attendance_logs
$qToday = mysqli_query($conn, "
    SELECT check_in_at, status 
    FROM attendance_logs 
    WHERE employee_id = $emp_id AND date = '$today' 
    ORDER BY check_in_at DESC LIMIT 1
");
if ($qToday && mysqli_num_rows($qToday) > 0) {
    $rowToday = mysqli_fetch_assoc($qToday);
    if ($rowToday['check_in_at']) {
        $stats['hadir_hari_ini'] = date('H:i', strtotime($rowToday['check_in_at']));
        $stats['status_absen']   = ($rowToday['status'] === 'late') ? 'Terlambat' : 'Sudah Absen';
    }
}

// 2. Statistik Bulan Ini (Total Kehadiran, Terlambat, Alpa) — from attendance_logs
$qStats = mysqli_query($conn, "
    SELECT status, COUNT(*) as count 
    FROM attendance_logs 
    WHERE employee_id = $emp_id 
      AND MONTH(date) = '$month' 
      AND YEAR(date) = '$year'
    GROUP BY status
");
if ($qStats) {
    while ($row = mysqli_fetch_assoc($qStats)) {
        $s = strtolower($row['status']);
        if ($s === 'present' || $s === 'dinas') {
            $stats['total_kehadiran'] += (int)$row['count'];
        }
        if ($s === 'late') {
            $stats['total_kehadiran'] += (int)$row['count']; // Terlambat tetap dihitung hadir
            $stats['terlambat']       += (int)$row['count'];
        }
        if ($s === 'absent') {
            $stats['alpa'] += (int)$row['count'];
        }
    }
}

// 3. Izin Cuti Bulan Ini — check both tables (leaves & leave_requests)
// Try leaves table first (with 'approved' lowercase)
$qLeave = mysqli_query($conn, "
    SELECT COUNT(*) as count 
    FROM leaves 
    WHERE employee_id = $emp_id 
      AND LOWER(status) = 'approved'
      AND MONTH(start_date) = '$month' 
      AND YEAR(start_date) = '$year'
");
if ($qLeave && $row = mysqli_fetch_assoc($qLeave)) {
    $stats['izin_cuti'] = (int)$row['count'];
}

// Also check leave_requests if exists
$checkLR = mysqli_query($conn, "SHOW TABLES LIKE 'leave_requests'");
if (mysqli_num_rows($checkLR) > 0) {
    $qLeave2 = mysqli_query($conn, "
        SELECT COUNT(*) as count 
        FROM leave_requests 
        WHERE employee_id = $emp_id 
          AND LOWER(status) = 'approved'
          AND MONTH(start_date) = '$month' 
          AND YEAR(start_date) = '$year'
    ");
    if ($qLeave2 && $row2 = mysqli_fetch_assoc($qLeave2)) {
        $stats['izin_cuti'] += (int)$row2['count'];
    }
}

// 4. Kalender presensi bulan ini
$calendar = [];
$qCal = mysqli_query($conn, "
    SELECT date, status, check_in_at, check_out_at 
    FROM attendance_logs 
    WHERE employee_id = $emp_id 
      AND MONTH(date) = '$month' 
      AND YEAR(date) = '$year'
");
if ($qCal) {
    while ($row = mysqli_fetch_assoc($qCal)) {
        $calendar[$row['date']] = [
            'status'    => $row['status'],
            'check_in'  => $row['check_in_at']  ? date('H:i', strtotime($row['check_in_at']))  : null,
            'check_out' => $row['check_out_at'] ? date('H:i', strtotime($row['check_out_at'])) : null,
        ];
    }
}

// 5. Slip Gaji Terbaru — try payslips first, then payroll
$gaji = null;
$checkPayslips = mysqli_query($conn, "SHOW TABLES LIKE 'payslips'");
if (mysqli_num_rows($checkPayslips) > 0) {
    $qGaji = mysqli_query($conn, "
        SELECT employee_id, month as period_label, total_salary as net_salary, status, published_at as created_at
        FROM payslips 
        WHERE employee_id = $emp_id AND status = 'published'
        ORDER BY id DESC LIMIT 1
    ");
    if ($qGaji && mysqli_num_rows($qGaji) > 0) {
        $gaji = mysqli_fetch_assoc($qGaji);
    }
}
if (!$gaji) {
    $checkPayroll = mysqli_query($conn, "SHOW TABLES LIKE 'payroll'");
    if (mysqli_num_rows($checkPayroll) > 0) {
        $qGaji2 = mysqli_query($conn, "
            SELECT period_month, period_year, net_salary, is_published as status, created_at
            FROM payroll 
            WHERE employee_id = $emp_id
            ORDER BY id DESC LIMIT 1
        ");
        if ($qGaji2 && mysqli_num_rows($qGaji2) > 0) {
            $gaji = mysqli_fetch_assoc($qGaji2);
        }
    }
}

// Only slips checked and published by Finance appear on the employee dashboard.
if (mysqli_query($conn, "SHOW TABLES LIKE 'salary_requests'")->num_rows) {
    $paidSalary = mysqli_query($conn, "SELECT s.employee_id,s.month AS period_label,s.total_salary AS net_salary,
        IF(s.status='paid','Sudah Ditransfer','Disetujui · Menunggu Transfer') AS status,s.status AS payment_status,
        ss.published_at AS created_at,s.paid_date,s.id AS salary_request_id
        FROM salary_requests s JOIN salary_slips ss ON ss.salary_request_id=s.id
        WHERE s.employee_id=$emp_id AND ss.user_id=$user_id AND s.status IN ('approved','paid') ORDER BY s.month DESC,s.id DESC LIMIT 1")->fetch_assoc();
    if ($paidSalary && (!$gaji || $paidSalary['period_label'] >= ($gaji['period_label'] ?? sprintf('%04d-%02d',$gaji['period_year'] ?? 0,$gaji['period_month'] ?? 0)))) $gaji=$paidSalary;
}
if ($gaji && !empty($gaji['period_label'])) {
    $gaji['period_month'] = (int)substr($gaji['period_label'],5,2);
    $gaji['period_year'] = (int)substr($gaji['period_label'],0,4);
}

// 6. Tugas (Daily Reports)
$tugas = [];
$checkTasks = mysqli_query($conn, "SHOW TABLES LIKE 'daily_reports'");
if (mysqli_num_rows($checkTasks) > 0) {
    $qTugas = mysqli_query($conn, "
        SELECT id, report_date, tasks 
        FROM daily_reports 
        WHERE employee_id = $emp_id 
        ORDER BY report_date DESC LIMIT 3
    ");
    if ($qTugas) {
        while ($row = mysqli_fetch_assoc($qTugas)) {
            $t = json_decode($row['tasks'], true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($t) && count($t) > 0) {
                $total    = count($t);
                $done     = count(array_filter($t, fn($x) => ($x['status'] ?? '') === 'done' || ($x['is_completed'] ?? false)));
                $tugas[]  = [
                    'id'          => $row['id'],
                    'report_date' => $row['report_date'],
                    'preview'     => $t[0]['text'] ?? ($t[0]['task_name'] ?? 'Laporan Harian'),
                    'status'      => $done === $total ? 'completed' : 'in_progress',
                    'total'       => $total,
                    'done'        => $done,
                ];
            } else {
                $tugas[] = [
                    'id'          => $row['id'],
                    'report_date' => $row['report_date'],
                    'preview'     => 'Laporan Harian',
                    'status'      => 'completed',
                    'total'       => 0,
                    'done'        => 0,
                ];
            }
        }
    }
}

echo json_encode([
    "status" => "success",
    "data"   => [
        "stats"    => $stats,
        "calendar" => $calendar,
        "gaji"     => $gaji,
        "tugas"    => $tugas
    ]
]);
