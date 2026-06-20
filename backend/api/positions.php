<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

// ── GET: Ambil semua positions ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = mysqli_query($conn, "SELECT id, name, base_salary FROM positions ORDER BY name ASC");
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
    if (!$name) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"Nama posisi wajib diisi"]); exit; }
    mysqli_query($conn, "INSERT INTO positions (name, base_salary) VALUES ('$name', '$base_salary')");
    echo json_encode(["status"=>"success","id"=>mysqli_insert_id($conn),"message"=>"Posisi berhasil ditambahkan"]);
    exit;
}

// ── PUT: Update position ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body        = json_decode(file_get_contents("php://input"), true);
    $id          = (int)($body['id'] ?? 0);
    $name        = mysqli_real_escape_string($conn, trim($body['name'] ?? ''));
    $base_salary = (int)($body['base_salary'] ?? 0);
    if (!$id || !$name) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"Data tidak valid"]); exit; }
    mysqli_query($conn, "UPDATE positions SET name='$name', base_salary='$base_salary' WHERE id='$id'");
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
