<?php
// ============================================================
// face_enroll.php — Simpan/Update Face Descriptors
// POST /api/face_enroll.php
// Body: { employee_id: int, descriptors: [[...],[...]], quality_score: float }
// ============================================================

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

// ── GET: Ambil semua descriptors aktif (untuk matching di frontend) ──────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = mysqli_query($conn, "
        SELECT 
            fe.employee_id,
            fe.descriptors,
            fe.quality_score,
            e.full_name AS employee_name,
            e.photo_url AS employee_photo
        FROM face_enrollments fe
        JOIN employees e ON e.id = fe.employee_id
        WHERE fe.is_active = 1 AND e.user_id=".(ed_hr($GLOBALS['verified_api_actor'])?'e.user_id':(int)$GLOBALS['verified_api_actor']['id'])."
    ");

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = [
            "employee_id"    => (int)$row["employee_id"],
            "employee_name"  => $row["employee_name"],
            "employee_photo" => $row["employee_photo"],
            "descriptors"    => json_decode($row["descriptors"], true),
            "quality_score"  => $row["quality_score"] ? (float)$row["quality_score"] : null,
        ];
    }

    echo json_encode(["status" => "success", "data" => $data, "total" => count($data)]);
    exit;
}

// ── POST: Enroll / Update wajah karyawan ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents("php://input"), true);

    $employee_id   = (int)($body["employee_id"]   ?? 0);
    $descriptors   = $body["descriptors"]          ?? null;
    $quality_score = (float)($body["quality_score"] ?? 0);
    $enrolled_by   = (int)$GLOBALS['verified_api_actor']['id'];

    // Validasi
    if (!$employee_id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "employee_id diperlukan"]);
        exit;
    }

    if (!$descriptors || !is_array($descriptors) || count($descriptors) < 1) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "descriptors tidak valid (min 1 sample)"]);
        exit;
    }

    // Cek karyawan ada
    $empCheck = mysqli_query($conn, "SELECT id, full_name AS name FROM employees WHERE id = $employee_id LIMIT 1");
    $emp = mysqli_fetch_assoc($empCheck);
    if (!$emp) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Karyawan tidak ditemukan"]);
        exit;
    }

    $descriptorsJson = mysqli_real_escape_string($conn, json_encode($descriptors));
    $sampleCount     = count($descriptors);
    $enrolledBy      = $enrolled_by ?: "NULL";

    // Cek sudah ada enrollment sebelumnya
    $existing = mysqli_query($conn, "SELECT id FROM face_enrollments WHERE employee_id = $employee_id LIMIT 1");

    if (mysqli_num_rows($existing) > 0) {
        // Update existing
        $ok = mysqli_query($conn, "
            UPDATE face_enrollments SET
                descriptors   = '$descriptorsJson',
                sample_count  = $sampleCount,
                quality_score = $quality_score,
                is_active     = 1,
                enrolled_at   = NOW(),
                enrolled_by   = $enrolledBy
            WHERE employee_id = $employee_id
        ");
        $action = "updated";
    } else {
        // Insert baru
        $ok = mysqli_query($conn, "
            INSERT INTO face_enrollments (employee_id, descriptors, sample_count, quality_score, enrolled_by)
            VALUES ($employee_id, '$descriptorsJson', $sampleCount, $quality_score, $enrolledBy)
        ");
        $action = "created";
    }

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal menyimpan: " . mysqli_error($conn)]);
        exit;
    }

    echo json_encode([
        "status"  => "success",
        "action"  => $action,
        "message" => "Wajah {$emp['name']} berhasil didaftarkan ({$sampleCount} sampel)",
        "data"    => ["employee_id" => $employee_id, "sample_count" => $sampleCount]
    ]);
    exit;
}

// ── DELETE: Reset enrollment (admin only) ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body        = json_decode(file_get_contents("php://input"), true);
    $employee_id = (int)($body["employee_id"] ?? 0);
    $role        = $body["role"] ?? "";

    if (!in_array($role, ["super_admin", "admin", "hrm"])) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Tidak punya akses"]);
        exit;
    }

    if (!$employee_id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "employee_id diperlukan"]);
        exit;
    }

    $ok = mysqli_query($conn, "
        UPDATE face_enrollments SET is_active = 0 WHERE employee_id = $employee_id
    ");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Enrollment direset"]);
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
