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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method tidak didukung"]);
    exit;
}

$employeeId = $_POST['employee_id'] ?? null;

if (!$employeeId) {
    http_response_code(422);
    echo json_encode(["status" => "error", "message" => "employee_id wajib diisi"]);
    exit;
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(422);
    echo json_encode(["status" => "error", "message" => "File foto tidak valid"]);
    exit;
}

$file = $_FILES['photo'];

// Validasi tipe file
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(422);
    echo json_encode(["status" => "error", "message" => "Hanya file JPG, PNG, WebP, GIF yang diizinkan"]);
    exit;
}

// Validasi ukuran (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(422);
    echo json_encode(["status" => "error", "message" => "Ukuran file maksimal 5MB"]);
    exit;
}

// Buat nama file unik
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'emp_' . $employeeId . '_' . time() . '.' . $extension;
$uploadDir = __DIR__ . '/../uploads/photos/';
$uploadPath = $uploadDir . $filename;

// Pastikan direktori ada
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Hapus foto lama jika ada
$query = mysqli_query($conn, "SELECT photo_url FROM employees WHERE id = " . (int)$employeeId);
$emp = mysqli_fetch_assoc($query);

if ($emp && $emp['photo_url']) {
    $oldPath = $uploadDir . $emp['photo_url'];
    if (file_exists($oldPath)) {
        unlink($oldPath);
    }
}

// Pindahkan file
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gagal menyimpan file"]);
    exit;
}

// Update database
$safeFilename = mysqli_real_escape_string($conn, $filename);
$updateQuery = mysqli_query($conn, "UPDATE employees SET photo_url = '$safeFilename' WHERE id = " . (int)$employeeId);

if (!$updateQuery) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gagal update database", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode([
    "status" => "success",
    "message" => "Foto berhasil diupload",
    "photo" => $filename
]);
