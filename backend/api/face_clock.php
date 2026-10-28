<?php
// ============================================================
// face_clock.php — Clock In / Clock Out via Face Recognition
// POST /api/face_clock.php
// Body: { employee_id, type: 'clock_in'|'clock_out', confidence, snapshot_base64? }
// ============================================================

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

$body        = json_decode(file_get_contents("php://input"), true);
$employee_id = (int)($body["employee_id"] ?? 0);
$type        = $body["type"]        ?? "";  // 'clock_in' | 'clock_out'
$confidence  = (float)($body["confidence"] ?? 0);
$snapshot_b64 = $body["snapshot"]   ?? null;
$latitude    = $body["latitude"]    ?? null;
$longitude   = $body["longitude"]   ?? null;
$ip          = $_SERVER['REMOTE_ADDR'] ?? "";
$ua          = $_SERVER['HTTP_USER_AGENT'] ?? "";

// ── Validasi input ────────────────────────────────────────────────────────────
if (!$employee_id || !in_array($type, ["clock_in", "clock_out"])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "employee_id dan type (clock_in/clock_out) diperlukan"]);
    exit;
}

// Pengecekan confidence dinonaktifkan sesuai permintaan agar absensi tetap bisa masuk meskipun wajah sulit dideteksi.

// ── Cek karyawan ada ─────────────────────────────────────────────────────────
$empRes = mysqli_query($conn, "SELECT id, full_name AS name, photo_url AS photo, work_type FROM employees WHERE id = $employee_id LIMIT 1");
$emp = mysqli_fetch_assoc($empRes);
if (!$emp) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Karyawan tidak ditemukan"]);
    exit;
}

// ── Ambil work schedule dari settings ──────────────────────────────────────
$settingQuery = mysqli_query($conn, "SELECT check_in_time, tolerance_minutes FROM settings LIMIT 1");
$settingData = mysqli_fetch_assoc($settingQuery);

$shiftStart = $settingData['check_in_time'] ?? "08:00:00";
$lateTolerance = isset($settingData['tolerance_minutes']) ? (int)$settingData['tolerance_minutes'] : 15;

$today = date("Y-m-d");
$now   = date("Y-m-d H:i:s");
$timeNow = date("H:i:s");

// ── Simpan snapshot jika ada ──────────────────────────────────────────────────
$snapshotPath = null;
if ($snapshot_b64) {
    $uploadDir = (defined('FACE_SNAPSHOT_DIR') ? FACE_SNAPSHOT_DIR : __DIR__.'/../uploads/face_snapshots') . '/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $filename = "face_{$employee_id}_{$type}_" . date("Ymd_His") . ".jpg";
    $imgData  = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $snapshot_b64));
    if ($imgData && file_put_contents($uploadDir . $filename, $imgData)) {
        $snapshotPath = "uploads/face_snapshots/" . $filename;
    }
}

$snapshotEsc = $snapshotPath ? "'$snapshotPath'" : "NULL";
$latEsc      = $latitude  ? (float)$latitude  : "NULL";
$lonEsc      = $longitude ? (float)$longitude : "NULL";
$confEsc     = (float)$confidence;

// ── CLOCK IN ──────────────────────────────────────────────────────────────────
if ($type === "clock_in") {
    // Cek apakah sudah clock in hari ini
    $existing = mysqli_query($conn, "SELECT id, check_in_at FROM attendance_logs WHERE employee_id = $employee_id AND date = '$today' LIMIT 1");
    if ($existing && mysqli_num_rows($existing) > 0) {
        $row = mysqli_fetch_assoc($existing);
        http_response_code(409);
        echo json_encode([
            "status"   => "error",
            "message"  => "Anda sudah absen masuk hari ini",
            "check_in" => $row["check_in_at"]
        ]);
        exit;
    }

    // Hitung status: present / late
    $shiftStartTime = strtotime($today . " " . $shiftStart);
    $nowTime        = strtotime($now);
    $lateSeconds    = ($nowTime - $shiftStartTime) - ($lateTolerance * 60);
    $lateMinutes    = max(0, (int)ceil($lateSeconds / 60));
    $status         = $lateMinutes > 0 ? "late" : "present";

    // Aturan Kedisiplinan: WFO yang terlambat tidak bisa absen masuk (Diubah agar tetap bisa absen)
    /*
    if ($status === "late" && strtoupper($emp['work_type']) === "WFO") {
        http_response_code(403);
        echo json_encode([
            "status"   => "error",
            "message"  => "Anda terlambat {$lateMinutes} menit! Karyawan WFO tidak diizinkan absen jika melewati batas waktu & toleransi."
        ]);
        exit;
    }
    */

    $notesEsc = $snapshotPath ? "'Face Snapshot: $snapshotPath'" : "NULL";

    $ok = mysqli_query($conn, "
        INSERT INTO attendance_logs 
            (employee_id, date, check_in_at, status, face_verified, check_in_lat, check_in_lng, notes)
        VALUES 
            ($employee_id, '$today', '$now', '$status', 1, $latEsc, $lonEsc, $notesEsc)
    ");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal menyimpan absensi: " . mysqli_error($conn)]);
        exit;
    }

    echo json_encode([
        "status"       => "success",
        "type"         => "clock_in",
        "message"      => $lateMinutes > 0 
                          ? "Anda terlambat {$lateMinutes} menit" 
                          : "Selamat datang, {$emp['name']}!",
        "employee"     => [
            "id"    => $employee_id,
            "name"  => $emp["name"],
            "photo" => $emp["photo"],
        ],
        "attendance"   => [
            "check_in"    => $now,
            "status"      => $status,
            "late_minutes"=> $lateMinutes,
            "confidence"  => $confidence,
        ]
    ]);
    exit;
}

// ── CLOCK OUT ─────────────────────────────────────────────────────────────────
if ($type === "clock_out") {
    // Cek sudah clock in hari ini
    $existing = mysqli_query($conn, "SELECT id, check_in_at, check_out_at FROM attendance_logs WHERE employee_id = $employee_id AND date = '$today' LIMIT 1");
    $record = $existing ? mysqli_fetch_assoc($existing) : null;

    if (!$record) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Anda belum absen masuk hari ini"]);
        exit;
    }

    if ($record["check_out_at"]) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Anda sudah absen pulang hari ini", "check_out" => $record["check_out_at"]]);
        exit;
    }

    $attId = (int)$record["id"];
    $notesEsc = $snapshotPath ? "'Face Snapshot Out: $snapshotPath'" : "NULL";

    $ok = mysqli_query($conn, "
        UPDATE attendance_logs SET
            check_out_at = '$now',
            check_out_lat = $latEsc,
            check_out_lng = $lonEsc,
            notes = CONCAT_WS(', ', notes, $notesEsc)
        WHERE id = $attId
    ");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal menyimpan clock out"]);
        exit;
    }

    // Hitung durasi kerja
    $nowTime      = strtotime($now);
    $checkInTime  = strtotime($record["check_in_at"]);
    $durationMins = (int)floor(($nowTime - $checkInTime) / 60);
    $durationH    = floor($durationMins / 60);
    $durationM    = $durationMins % 60;

    echo json_encode([
        "status"     => "success",
        "type"       => "clock_out",
        "message"    => "Sampai jumpa, {$emp['name']}! Durasi kerja: {$durationH}j {$durationM}m",
        "employee"   => [
            "id"    => $employee_id,
            "name"  => $emp["name"],
            "photo" => $emp["photo"],
        ],
        "attendance" => [
            "check_in"        => $record["check_in_at"],
            "check_out"       => $now,
            "duration_minutes"=> $durationMins,
            "overtime_minutes"=> 0, // removed overtime calc
            "confidence"      => $confidence,
        ]
    ]);
    exit;
}

