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

// Schema is installed by the reviewed CLI migration.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = mysqli_query($conn, "SELECT * FROM settings ORDER BY id ASC LIMIT 1");
    $settings = mysqli_fetch_assoc($q);

    if (!$settings) {
        $settings = [
            "company_name"       => "PT. Creativa Bridging International",
            "check_in_time"      => "07:00:00",
            "tolerance_minutes"  => 10,
            "office_latitude"    => "-6.2088",
            "office_longitude"   => "106.8456",
            "office_radius"      => 50
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
    $office_latitude   = mysqli_real_escape_string($conn, $body['office_latitude'] ?? '');
    $office_longitude  = mysqli_real_escape_string($conn, $body['office_longitude'] ?? '');
    $office_radius     = (int)($body['office_radius'] ?? 0);

    // Ambil baris pertama
    $q   = mysqli_query($conn, "SELECT id FROM settings ORDER BY id ASC LIMIT 1");
    $row = mysqli_fetch_assoc($q);

    if ($row) {
        // UPDATE — query dalam satu baris agar tidak ada syntax error
        $id = (int)$row['id'];
        $updateQuery = "UPDATE settings SET 
            company_name='$company_name', 
            check_in_time='$check_in_time', 
            tolerance_minutes='$tolerance_minutes'";
            
        if ($office_latitude) $updateQuery .= ", office_latitude='$office_latitude'";
        if ($office_longitude) $updateQuery .= ", office_longitude='$office_longitude'";
        if ($office_radius) $updateQuery .= ", office_radius='$office_radius'";
        
        $updateQuery .= ", updated_at=NOW() WHERE id=$id";
        $ok = mysqli_query($conn, $updateQuery);
    } else {
        // INSERT baris pertama
        $ok = mysqli_query($conn, "INSERT INTO settings (company_name, check_in_time, tolerance_minutes, office_latitude, office_longitude, office_radius) VALUES ('$company_name', '$check_in_time', '$tolerance_minutes', '$office_latitude', '$office_longitude', '$office_radius')");
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
