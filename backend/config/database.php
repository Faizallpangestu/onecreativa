<?php
date_default_timezone_set('Asia/Jakarta');

/**
 * ONE Creativa - Smart Database Config
 * Otomatis mendeteksi: Hostinger (db_env.php ada) atau Localhost (XAMPP)
 */

$envFile = __DIR__ . '/db_env.php';

if (file_exists($envFile)) {
    require $envFile; // Pakai kredensial Hostinger
} else {
    // Localhost / XAMPP
    $DB_HOST = 'localhost';
    $DB_USER = 'root';
    $DB_PASS = '';
    $DB_NAME = 'one-creativa';
}

$conn = mysqli_connect($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if (!$conn) {
    http_response_code(500);
    die(json_encode([
        "status"  => "error",
        "message" => "Koneksi database gagal: " . mysqli_connect_error()
    ]));
}

mysqli_set_charset($conn, 'utf8mb4');

// Auto-create tabel settings jika belum ada
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL DEFAULT 'PT. Creativa Bridging International',
    check_in_time VARCHAR(20) NOT NULL DEFAULT '08:00:00',
    tolerance_minutes INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");