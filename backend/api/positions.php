<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);
if($_SERVER['REQUEST_METHOD']==='GET'){
    if(!ed_hr($actor)&&!in_array($actor['role'],['finance'],true))ac_fail('Informasi struktur gaji terbatas untuk HRD/Finance.',403);
}elseif(!ed_hr($actor))ac_fail('Master jabatan hanya dikelola HRD/administrator.',403);
if($_SERVER['REQUEST_METHOD']==='DELETE')ac_fail('Master jabatan yang terkait employee dipertahankan. Gunakan status Inaktif.',409);

// ── GET: Ambil semua positions ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = mysqli_query($conn, "SELECT p.*, d.name as department_name, (SELECT COUNT(*) FROM employees WHERE position = p.name) as emp_count FROM positions p LEFT JOIN departments d ON p.department_id = d.id ORDER BY p.name ASC");
    $data = [];
    while ($row = mysqli_fetch_assoc($q)) $data[] = $row;
    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// ── POST: Tambah position baru ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body        = json_decode(file_get_contents("php://input"), true);
    $name        = mysqli_real_escape_string($conn, trim($body['name'] ?? ''));
    $base_salary = (int)($body['base_salary'] ?? 0);
    $department_id = !empty($body['department_id']) ? (int)$body['department_id'] : "NULL";
    $level = mysqli_real_escape_string($conn, trim($body['level'] ?? 'Staff'));
    $tunjangan = (float)($body['tunjangan'] ?? 0);
    $is_active = isset($body['is_active']) ? (int)$body['is_active'] : 1;
    $description = mysqli_real_escape_string($conn, trim($body['description'] ?? ''));

    if (!$name) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"Nama posisi wajib diisi"]); exit; }
    mysqli_query($conn, "INSERT INTO positions (name, base_salary, department_id, level, tunjangan, is_active, description) VALUES ('$name', $base_salary, $department_id, '$level', $tunjangan, $is_active, '$description')");
    echo json_encode(["status"=>"success","id"=>mysqli_insert_id($conn),"message"=>"Posisi berhasil ditambahkan"]);
    exit;
}

// ── PUT: Update position ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body        = json_decode(file_get_contents("php://input"), true);
    $id          = (int)($body['id'] ?? 0);
    $name        = mysqli_real_escape_string($conn, trim($body['name'] ?? ''));
    $base_salary = (int)($body['base_salary'] ?? 0);
    $department_id = !empty($body['department_id']) ? (int)$body['department_id'] : "NULL";
    $level = mysqli_real_escape_string($conn, trim($body['level'] ?? 'Staff'));
    $tunjangan = (float)($body['tunjangan'] ?? 0);
    $is_active = isset($body['is_active']) ? (int)$body['is_active'] : 1;
    $description = mysqli_real_escape_string($conn, trim($body['description'] ?? ''));

    if (!$id || !$name) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"Data tidak valid"]); exit; }
    mysqli_query($conn, "UPDATE positions SET name='$name', base_salary=$base_salary, department_id=$department_id, level='$level', tunjangan=$tunjangan, is_active=$is_active, description='$description' WHERE id='$id'");
    echo json_encode(["status"=>"success","message"=>"Posisi berhasil diupdate"]);
    exit;
}

// ── DELETE: Hapus position ────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body = json_decode(file_get_contents("php://input"), true);
    $id   = (int)($body['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"ID tidak valid"]); exit; }
    mysqli_query($conn, "DELETE FROM positions WHERE id='$id'");
    echo json_encode(["status"=>"success","message"=>"Posisi berhasil dihapus"]);
    exit;
}

http_response_code(405);
echo json_encode(["status"=>"error","message"=>"Method not allowed"]);
