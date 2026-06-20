<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

session_start();
// Dalam praktek aslinya, ambil session untuk role/user_id, tapi di sini via parameter URL (bisa get employee_id / role)
$month = $_GET['month'] ?? date('Y-m');
$employee_id = isset($_GET['employee_id']) ? intval($_GET['employee_id']) : 0;
$role = $_GET['role'] ?? 'finance'; // default 'finance' for backward compatibility

// 1. KARYAWAN: Hanya boleh lihat yang "published"
if ($role === 'karyawan' || $employee_id > 0) {
    $where = "WHERE p.month = '$month' AND p.status = 'published'";
    if ($employee_id > 0) {
        $where .= " AND p.employee_id = $employee_id";
    }

    $q = mysqli_query($conn, "
        SELECT p.*, e.employee_code as nik, e.full_name as name, pos.name as position 
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        JOIN positions pos ON e.position_id = pos.id
        $where
    ");

    $data = [];
    while ($r = mysqli_fetch_assoc($q)) {
        // ubah alias supaya konsisten dengan FE
        $r['potongan'] = $r['late_penalty'];
        $r['lembur'] = $r['overtime_pay'];
        $data[] = $r;
    }
    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// 2. FINANCE: Hanya boleh lihat yang ada di tabel payslips (bisa draft atau published) yang sudah di-Simpan HRD
if ($role === 'finance') {
    $q = mysqli_query($conn, "
        SELECT p.*, e.employee_code as nik, e.full_name as name, pos.name as position 
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        JOIN positions pos ON e.position_id = pos.id
        WHERE p.month = '$month'
    ");
    $data = [];
    while ($r = mysqli_fetch_assoc($q)) {
        $r['potongan'] = $r['late_penalty'];
        $r['lembur'] = $r['overtime_pay'];
        // pass is_published flag to FE
        $r['is_published'] = ($r['status'] === 'published');
        $data[] = $r;
    }
    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// 3. HRD: Melihat data LIVE calculation (belum di-save, atau gabungan dengan draft yang sudah disave)
if ($role === 'hrd') {
    // HRD Live Calc
    $query = mysqli_query($conn, "
        SELECT 
            employees.id,
            employees.employee_code as nik,
            employees.full_name as name,
            positions.name as position,
            COALESCE(NULLIF(employees.base_salary, 0), positions.base_salary) AS final_base_salary,
            0 as total_late,
            0 as total_overtime,
            p.status as saved_status
        FROM employees
        LEFT JOIN attendance_logs 
          ON attendance_logs.employee_id = employees.id 
          AND DATE_FORMAT(attendance_logs.date, '%Y-%m') = '$month'
        LEFT JOIN positions ON employees.position = positions.name
        JOIN users ON employees.user_id = users.id
        JOIN roles ON users.role_id = roles.id
        LEFT JOIN payslips p ON p.employee_id = employees.id AND p.month = '$month'
        WHERE roles.name IN ('karyawan', 'employee')
        GROUP BY employees.id
    ");

    $data = [];
    while ($row = mysqli_fetch_assoc($query)) {
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

        $data[] = [
            "id" => $row['id'],
            "nik" => $row['nik'],
            "name" => $row['name'],
            "position" => $row['position'],
            "base_salary" => $base,
            "potongan" => $potongan,
            "lembur" => $lembur,
            "bpjs_tk" => $bpjs_tk,
            "bpjs_kes" => $bpjs_kes,
            "bpjs_jp" => $bpjs_pen,
            "pph21" => $pph21,
            "total_potongan" => $total_potongan,
            "total_salary" => $total,
            "saved_status" => $row['saved_status'] // null jika belum disave, 'draft'/'published' jika sdh
        ];
    }
    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Role tidak dikenal"]);