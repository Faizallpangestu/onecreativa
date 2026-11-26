<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tidak ada file yang diunggah atau terjadi kesalahan upload."]);
    exit;
}

$file = $_FILES['file'];
$uploadDir = __DIR__ . '/../uploads/lms_materials/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Allow PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, MP4, MP3, JPG, PNG, WEBP
$originalName = basename($file['name']);
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

$allowedExts = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'mp4', 'webm', 'mp3', 'wav', 'jpg', 'jpeg', 'png', 'webp'];
if (!in_array($ext, $allowedExts)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Format file tidak didukung. Harap unggah PDF, PPT, Word, Video (MP4), Audio (MP3), atau Gambar."]);
    exit;
}

// 100MB limit for educational videos/documents
if ($file['size'] > 100 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Ukuran file terlalu besar. Maksimal 100 MB."]);
    exit;
}

$cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
$newFileName = 'materi_' . time() . '_' . substr($cleanBase, 0, 30) . '.' . $ext;
$targetPath = $uploadDir . $newFileName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Relative URL for browser access
    $fileUrl = '/backend/uploads/lms_materials/' . $newFileName;
    
    // Format file size
    $bytes = $file['size'];
    if ($bytes >= 1048576) {
        $formattedSize = number_format($bytes / 1048576, 1) . ' MB';
    } elseif ($bytes >= 1024) {
        $formattedSize = number_format($bytes / 1024, 1) . ' KB';
    } else {
        $formattedSize = $bytes . ' B';
    }

    echo json_encode([
        "status" => "success",
        "message" => "File materi berhasil diunggah",
        "data" => [
            "file_name" => $originalName,
            "saved_name" => $newFileName,
            "file_url" => $fileUrl,
            "file_size" => $formattedSize,
            "extension" => $ext
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gagal memindahkan file ke direktori penyimpanan."]);
}
