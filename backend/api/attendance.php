<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);ed_personal_scope($conn,$actor);
if($_SERVER['REQUEST_METHOD']==='DELETE')ac_fail('Riwayat absensi tidak dihapus. Ajukan koreksi dengan alasan kepada administrator.',409);

// ── GET: Ambil semua data attendance ──────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $where = "";
    if (!empty($_GET['employee_id'])) {
        $eid = (int)$_GET['employee_id'];
        $where = "WHERE attendance_logs.employee_id = '$eid'";
    }
    // Ambil setting jam kerja
    $settingQuery = mysqli_query($conn, "SELECT check_in_time FROM settings LIMIT 1");
    $settingData = mysqli_fetch_assoc($settingQuery);
    $shiftStart = $settingData['check_in_time'] ?? "08:00:00";

    $query = mysqli_query(
        $conn,
        "SELECT
            attendance_logs.id,
            attendance_logs.employee_id,
            employees.employee_code,
            employees.position AS department,
            employees.full_name AS name,
            employees.work_type,
            attendance_logs.date,
            attendance_logs.check_in_at AS check_in,
            attendance_logs.check_out_at AS check_out,
            attendance_logs.status,
            attendance_logs.notes,
            attendance_logs.check_in_lat,
            attendance_logs.check_in_lng,
            attendance_logs.check_out_lat,
            attendance_logs.check_out_lng,
            GREATEST(0, TIMESTAMPDIFF(MINUTE, CONCAT(attendance_logs.date, ' $shiftStart'), attendance_logs.check_in_at)) AS late_minutes,
            GREATEST(0, TIMESTAMPDIFF(MINUTE, attendance_logs.check_in_at, attendance_logs.check_out_at)) AS working_minutes
         FROM attendance_logs
         LEFT JOIN employees ON employees.id = attendance_logs.employee_id
         $where
         ORDER BY attendance_logs.date DESC, attendance_logs.check_in_at DESC"
    );

    if (!$query) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal mengambil data", "error" => mysqli_error($conn)]);
        exit;
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($query)) {
        $data[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// ── PUT: Edit attendance (khusus super_admin) ─────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body    = json_decode(file_get_contents("php://input"), true);
    $id      = (int)($body['id'] ?? 0);
    $role    = $actor['role'];

    if ($role !== 'super_admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Tidak punya akses"]);
        exit;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID tidak valid"]);
        exit;
    }

    $check_in        = mysqli_real_escape_string($conn, $body['check_in']  ?? '');
    $check_out       = mysqli_real_escape_string($conn, $body['check_out'] ?? '');
    $status          = mysqli_real_escape_string($conn, $body['status']    ?? 'present');
    $late_minutes    = (int)($body['late_minutes']    ?? 0);
    $overtime_minutes = (int)($body['overtime_minutes'] ?? 0);

    // Recalculate status from check_in if not manually set
    $checkOutVal = $check_out ? "'$check_out'" : "NULL";

    $ok = mysqli_query($conn, "
        UPDATE attendance_logs SET
            check_in_at      = '$check_in',
            check_out_at     = $checkOutVal,
            status           = '$status'
        WHERE id = '$id'
    ");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Data absensi berhasil diupdate"]);
    exit;
}

// ── DELETE: Hapus record attendance (khusus super_admin) ──────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body = json_decode(file_get_contents("php://input"), true);
    $id   = (int)($body['id'] ?? 0);
    $role = $actor['role'];

    if ($role !== 'super_admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Tidak punya akses"]);
        exit;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID tidak valid"]);
        exit;
    }

    $ok = mysqli_query($conn, "DELETE FROM attendance_logs WHERE id = '$id'");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Data absensi berhasil dihapus"]);
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
