<?php
/**
 * ONE Creativa - Asset Migration FIXED (tanpa FK constraint)
 * Jalankan: http://localhost/One-creativa/backend/api/assets_migrate.php
 */
header("Content-Type: application/json");
require '../config/database.php';

$results = [];

// Drop tables dulu jika ada (urutan penting karena relasi)
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS=0");

// 1. Tabel assets
$sql_assets = "CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Elektronik',
    brand VARCHAR(100) DEFAULT '',
    model VARCHAR(100) DEFAULT '',
    serial_number VARCHAR(150) DEFAULT '',
    purchase_date DATE DEFAULT NULL,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    location VARCHAR(255) NOT NULL DEFAULT 'Kantor Pusat',
    `condition` ENUM('Baik','Rusak Ringan','Rusak Berat','Tidak Layak') NOT NULL DEFAULT 'Baik',
    status ENUM('Aktif','Maintenance','Tidak Aktif','Dipinjam') NOT NULL DEFAULT 'Aktif',
    description TEXT,
    photo_path VARCHAR(500) DEFAULT NULL,
    qr_code VARCHAR(100) UNIQUE,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

if (mysqli_query($conn, $sql_assets)) {
    $results[] = ['table' => 'assets', 'status' => 'OK', 'msg' => 'Tabel assets siap'];
} else {
    $results[] = ['table' => 'assets', 'status' => 'ERROR', 'msg' => mysqli_error($conn)];
}

// 2. Tabel asset_histories
$sql_histories = "CREATE TABLE IF NOT EXISTS asset_histories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    action_type ENUM('tambah','pindah','update_kondisi','maintenance','stock_opname','hapus','pinjam','kembali') NOT NULL DEFAULT 'update_kondisi',
    from_location VARCHAR(255) DEFAULT '',
    to_location VARCHAR(255) DEFAULT '',
    condition_before VARCHAR(50) DEFAULT NULL,
    condition_after VARCHAR(50) DEFAULT NULL,
    status_before VARCHAR(50) DEFAULT '',
    status_after VARCHAR(50) DEFAULT '',
    notes TEXT,
    performed_by INT DEFAULT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset_id (asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

if (mysqli_query($conn, $sql_histories)) {
    $results[] = ['table' => 'asset_histories', 'status' => 'OK', 'msg' => 'Tabel asset_histories siap'];
} else {
    $results[] = ['table' => 'asset_histories', 'status' => 'ERROR', 'msg' => mysqli_error($conn)];
}

// 3. Tabel asset_transfer_requests
$sql_requests = "CREATE TABLE IF NOT EXISTS asset_transfer_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    requested_by INT NOT NULL,
    request_type ENUM('pindah','pinjam','maintenance') NOT NULL DEFAULT 'pindah',
    from_location VARCHAR(255) DEFAULT '',
    to_location VARCHAR(255) DEFAULT '',
    reason TEXT,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset_id (asset_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

if (mysqli_query($conn, $sql_requests)) {
    $results[] = ['table' => 'asset_transfer_requests', 'status' => 'OK', 'msg' => 'Tabel asset_transfer_requests siap'];
} else {
    $results[] = ['table' => 'asset_transfer_requests', 'status' => 'ERROR', 'msg' => mysqli_error($conn)];
}

// 4. Tabel maintenance_schedules
$sql_maintenance = "CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    completed_date DATE DEFAULT NULL,
    status ENUM('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
    priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    assigned_to INT DEFAULT NULL,
    cost DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_asset_id (asset_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

if (mysqli_query($conn, $sql_maintenance)) {
    $results[] = ['table' => 'maintenance_schedules', 'status' => 'OK', 'msg' => 'Tabel maintenance_schedules siap'];
} else {
    $results[] = ['table' => 'maintenance_schedules', 'status' => 'ERROR', 'msg' => mysqli_error($conn)];
}

mysqli_query($conn, "SET FOREIGN_KEY_CHECKS=1");

// 5. Buat folder
$photoDir = __DIR__ . '/../uploads/asset_photos';
if (!is_dir($photoDir)) {
    mkdir($photoDir, 0755, true);
    $results[] = ['folder' => 'uploads/asset_photos', 'status' => 'OK', 'msg' => 'Folder dibuat'];
} else {
    $results[] = ['folder' => 'uploads/asset_photos', 'status' => 'OK', 'msg' => 'Folder sudah ada'];
}

// Test insert data dummy
$testInsert = mysqli_query($conn, "SELECT COUNT(*) as c FROM assets");
$count = mysqli_fetch_assoc($testInsert)['c'];

echo json_encode([
    'status' => 'done',
    'total_assets' => $count,
    'results' => $results,
    'message' => 'Migrasi selesai! Silakan coba tambah aset.'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
