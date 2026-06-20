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

// ── GET: Ambil semua departments ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = mysqli_query($conn, "SELECT id, name FROM departments ORDER BY name ASC");
    $data = [];
    while ($row = mysqli_fetch_assoc($q)) $data[] = $row;
    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// ── POST: Tambah department baru ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents("php://input"), true);
    $name = mysqli_real_escape_string($conn, trim($body['name'] ?? ''));
    if (!$name) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"Nama department wajib diisi"]); exit; }
    mysqli_query($conn, "INSERT INTO departments (name) VALUES ('$name')");
    echo json_encode(["status"=>"success","id"=>mysqli_insert_id($conn),"message"=>"Department berhasil ditambahkan"]);
    exit;
}

// ── DELETE: Hapus department ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body = json_decode(file_get_contents("php://input"), true);
    $id   = (int)($body['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(["status"=>"error","message"=>"ID tidak valid"]); exit; }
    mysqli_query($conn, "DELETE FROM departments WHERE id='$id'");
    echo json_encode(["status"=>"success","message"=>"Department berhasil dihapus"]);
    exit;
}

http_response_code(405);
echo json_encode(["status"=>"error","message"=>"Method not allowed"]);
