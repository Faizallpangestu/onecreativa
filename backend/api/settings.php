<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

// Auto-create tabel settings jika belum ada
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL DEFAULT 'PT. Creativa',
    check_in_time VARCHAR(20) NOT NULL DEFAULT '07:00:00',
    tolerance_minutes INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// ── GET: Ambil Settings ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = mysqli_query($conn, "SELECT * FROM settings ORDER BY id ASC LIMIT 1");
    $settings = mysqli_fetch_assoc($q);

    if (!$settings) {
        $settings = [
            "company_name"       => "PT. Creativa Bridging International",
            "check_in_time"      => "07:00:00",
            "tolerance_minutes"  => 10
        ];
    }

    echo json_encode(["status" => "success", "data" => $settings]);
    exit;
}

// ── PUT: Update Settings ────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_decode(file_get_contents("php://input"), true);

    $company_name      = mysqli_real_escape_string($conn, $body['company_name'] ?? '');
    $check_in_time     = mysqli_real_escape_string($conn, $body['check_in_time'] ?? '');
    $tolerance_minutes = (int)($body['tolerance_minutes'] ?? 0);

    if (!$company_name || !$check_in_time) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
        exit;
    }

    // Ambil baris pertama
    $q   = mysqli_query($conn, "SELECT id FROM settings ORDER BY id ASC LIMIT 1");
    $row = mysqli_fetch_assoc($q);

    if ($row) {
        // UPDATE — query dalam satu baris agar tidak ada syntax error
        $id = (int)$row['id'];
        $ok = mysqli_query($conn, "UPDATE settings SET company_name='$company_name', check_in_time='$check_in_time', tolerance_minutes='$tolerance_minutes', updated_at=NOW() WHERE id=$id");
    } else {
        // INSERT baris pertama
        $ok = mysqli_query($conn, "INSERT INTO settings (company_name, check_in_time, tolerance_minutes) VALUES ('$company_name', '$check_in_time', '$tolerance_minutes')");
    }

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Pengaturan berhasil disimpan"]);
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
