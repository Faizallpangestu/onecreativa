<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);

if($_SERVER['REQUEST_METHOD']==='GET'){
    $name=ac_text($_GET['file']??'','File foto',255);
    if(basename($name)!==$name||str_contains($name,'\\'))ac_fail('Foto tidak ditemukan.',404);
    $row=ac_one($conn,'SELECT e.user_id,r.name AS role_name FROM employees e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE e.photo_url=?',[$name]);
    if(!$row)ac_fail('Foto tidak ditemukan.',404);
    $lpk=$actor['role']==='lpk'&&in_array($row['role_name'],['sensei','sensei_intensif','peserta_intensif'],true);
    if((int)$row['user_id']!==(int)$actor['id']&&!ed_hr($actor)&&!$lpk)ac_fail('Foto berada di luar akses akun ini.',403);
    $path=(defined('EMPLOYEE_PHOTO_DIR')?EMPLOYEE_PHOTO_DIR:__DIR__.'/../uploads/photos').'/'.$name;
    if(!is_file($path)||is_link($path))ac_fail('Foto tidak ditemukan.',404);
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($path);
    if(!in_array($mime,['image/jpeg','image/png','image/webp','image/gif'],true))ac_fail('Format foto perlu diperiksa.',409);
    header('Content-Type: '.$mime);header('Content-Length: '.filesize($path));header('X-Content-Type-Options: nosniff');readfile($path);exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method tidak didukung"]);
    exit;
}

$employeeId = ac_id($_POST['employee_id'] ?? null);
$employee=ac_one($conn,'SELECT user_id FROM employees WHERE id=?',[$employeeId]);
if(!$employee)ac_fail('Employee tidak ditemukan.',404);
if((int)$employee['user_id']!==(int)$actor['id']&&!ed_hr($actor))ac_fail('Tidak dapat mengubah foto employee lain.',403);

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
$extension = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'][$mimeType];
$filename = 'emp_' . $employeeId . '_' . bin2hex(random_bytes(12)) . '.' . $extension;
$uploadDir = (defined('EMPLOYEE_PHOTO_DIR') ? EMPLOYEE_PHOTO_DIR : __DIR__ . '/../uploads/photos') . '/';
$uploadPath = $uploadDir . $filename;

// Pastikan direktori ada
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Preserve existing photo/history until the new file and database update succeed.

// Pindahkan file
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gagal menyimpan file"]);
    exit;
}

// Update database
try { ac_atomic($conn,function()use($conn,$actor,$employeeId,$filename){ac_query($conn,'UPDATE employees SET photo_url=? WHERE id=?',[$filename,$employeeId]);ed_audit($conn,$actor,$employeeId,'photo_updated',[]);}); }
catch(Throwable $e){if(is_file($uploadPath))unlink($uploadPath);throw $e;}

ed_respond(200,[
    "status" => "success",
    "message" => "Foto berhasil diupload",
    "photo" => $filename
]);
