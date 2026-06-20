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

$data = json_decode(file_get_contents("php://input"), true);
$uid  = trim($data['rfid_uid'] ?? '');

if (!$uid) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "UID kosong"]);
    exit;
}

date_default_timezone_set('Asia/Jakarta');
$time = date("H:i:s");
$date = date("Y-m-d");

// Ambil settings
$setQ = mysqli_query($conn, "SELECT * FROM settings ORDER BY id ASC LIMIT 1");
$settings = mysqli_fetch_assoc($setQ);
$check_in_time = $settings['check_in_time'] ?? '07:00:00';
$tolerance = (int)($settings['tolerance_minutes'] ?? 10);
$batas_masuk = date("H:i:s", strtotime("+$tolerance minutes", strtotime($check_in_time)));

// ── 1. Cari karyawan berdasarkan RFID UID ──────────────────────────────────
$uidEsc = mysqli_real_escape_string($conn, $uid);
$q      = mysqli_query($conn, "SELECT id, full_name AS name, photo_url AS photo FROM employees WHERE rfid_uid='$uidEsc'");
$emp    = mysqli_fetch_assoc($q);

if (!$emp) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "RFID tidak terdaftar"]);
    exit;
}

$emp_id = $emp['id'];

// ── 2. Cek apakah sudah absen hari ini ────────────────────────────────────
$cek   = mysqli_query($conn, "SELECT * FROM attendance WHERE employee_id='$emp_id' AND date='$date'");
$absen = mysqli_fetch_assoc($cek);

// ── 3. CHECK-IN (belum ada record hari ini) ────────────────────────────────
if (!$absen) {
    // Toleransi masuk
    $status       = "present";
    $late_minutes = 0;

    if ($time > $batas_masuk) {
        $status       = "late";
        $late_minutes = (int) floor((strtotime($time) - strtotime($check_in_time)) / 60);
    }

    mysqli_query($conn, "
        INSERT INTO attendance (employee_id, date, check_in, status, late_minutes, overtime_minutes)
        VALUES ('$emp_id', '$date', '$time', '$status', '$late_minutes', 0)
    ");

    echo json_encode([
        "status"       => "success",
        "type"         => "check-in",
        "late_minutes" => $late_minutes,
        "employee"     => [
            "id"    => $emp['id'],
            "name"  => $emp['name'],
            "photo" => $emp['photo'],
        ],
    ]);
    exit;
}

// ── 4. CHECK-OUT (sudah ada record, belum ada check_out) ──────────────────
if ($absen['check_out']) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sudah check-out hari ini"]);
    exit;
}

// Jam pulang tidak ada batas waktu
$needs_overtime_form = false;

mysqli_query($conn, "
    UPDATE attendance
    SET check_out = '$time', overtime_minutes = 0
    WHERE id = " . (int)$absen['id']
);

echo json_encode([
    "status"               => "success",
    "type"                 => "check-out",
    "overtime_minutes"     => 0,
    "needs_overtime_form"  => $needs_overtime_form,
    "employee"             => [
        "id"    => $emp['id'],
        "name"  => $emp['name'],
        "photo" => $emp['photo'],
    ],
]);
