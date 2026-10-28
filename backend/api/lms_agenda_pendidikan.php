<?php
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/relationships.php';

$actor = rs_start($conn);
$method = $_SERVER['REQUEST_METHOD'];

// GET: Ambil daftar agenda pendidikan
if ($method === 'GET') {
    $where = [];
    $params = [];
    
    if (!empty($_GET['cabang'])) {
        $where[] = 'cabang = ?';
        $params[] = $_GET['cabang'];
    }
    if (!empty($_GET['tahun'])) {
        $where[] = 'tahun = ?';
        $params[] = (int)$_GET['tahun'];
    }
    
    $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql = "SELECT * FROM lms_agenda_pendidikan {$whereClause} ORDER BY est_pra_pendidikan ASC, id ASC";
    
    if (count($params) > 0) {
        $stmt = $conn->prepare($sql);
        $types = str_repeat('s', count($params));
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
    } else {
        $res = $conn->query($sql);
        $data = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => $data
    ]);
    exit;
}

// Hanya pengajar / admin yang dapat mengelola agenda pendidikan
if (!rs_teacher($actor)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Hanya pengajar/admin dapat mengelola agenda pendidikan.']);
    exit;
}

// POST: Tambah atau Ubah Agenda Pendidikan
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $d = json_decode($raw, true) ?? $_POST;
    
    if (!is_array($d)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Data tidak valid.']);
        exit;
    }
    
    $id = !empty($d['id']) ? (int)$d['id'] : null;
    $cabang = trim($d['cabang'] ?? 'CJR');
    $batch = trim($d['batch'] ?? '');
    $program = trim($d['program'] ?? 'Program Intensif');
    $tahun = !empty($d['tahun']) ? (int)$d['tahun'] : 2026;
    
    $kapasitas_p = isset($d['kapasitas_p']) ? (int)$d['kapasitas_p'] : 0;
    $kapasitas_l = isset($d['kapasitas_l']) ? (int)$d['kapasitas_l'] : 0;
    $kapasitas_total = isset($d['kapasitas_total']) && $d['kapasitas_total'] !== '' 
        ? (int)$d['kapasitas_total'] 
        : ($kapasitas_p + $kapasitas_l);
        
    $kuota_p = isset($d['kuota_p']) ? (int)$d['kuota_p'] : 0;
    $kuota_l = isset($d['kuota_l']) ? (int)$d['kuota_l'] : 0;
    $kuota_total = isset($d['kuota_total']) && $d['kuota_total'] !== '' 
        ? (int)$d['kuota_total'] 
        : ($kuota_p + $kuota_l);
        
    $kuota_keterangan = trim($d['kuota_keterangan'] ?? '');
    
    $est_pra = !empty($d['est_pra_pendidikan']) ? $d['est_pra_pendidikan'] : null;
    $est_asrama = !empty($d['est_kedatangan_asrama']) ? $d['est_kedatangan_asrama'] : null;
    $est_offline = !empty($d['est_mulai_offline']) ? $d['est_mulai_offline'] : null;
    
    $act_pra = !empty($d['act_pra_pendidikan']) ? $d['act_pra_pendidikan'] : null;
    $act_asrama = !empty($d['act_kedatangan_asrama']) ? $d['act_kedatangan_asrama'] : null;
    $act_offline = !empty($d['act_mulai_offline']) ? $d['act_mulai_offline'] : null;
    
    $status = trim($d['status'] ?? 'Aktif');
    $notes = trim($d['notes'] ?? '');
    
    if (empty($cabang) || empty($batch)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Cabang dan Batch wajib diisi.']);
        exit;
    }
    
    if ($id) {
        $stmt = $conn->prepare("UPDATE lms_agenda_pendidikan SET 
            cabang = ?, batch = ?, program = ?, tahun = ?,
            kapasitas_p = ?, kapasitas_l = ?, kapasitas_total = ?,
            kuota_p = ?, kuota_l = ?, kuota_total = ?, kuota_keterangan = ?,
            est_pra_pendidikan = ?, est_kedatangan_asrama = ?, est_mulai_offline = ?,
            act_pra_pendidikan = ?, act_kedatangan_asrama = ?, act_mulai_offline = ?,
            status = ?, notes = ?
            WHERE id = ?");
            
        $stmt->bind_param(
            'sssiiiiiiisssssssssi',
            $cabang, $batch, $program, $tahun,
            $kapasitas_p, $kapasitas_l, $kapasitas_total,
            $kuota_p, $kuota_l, $kuota_total, $kuota_keterangan,
            $est_pra, $est_asrama, $est_offline,
            $act_pra, $act_asrama, $act_offline,
            $status, $notes, $id
        );
        $stmt->execute();
        
        echo json_encode(['status' => 'success', 'message' => 'Agenda pendidikan berhasil diperbarui.', 'id' => $id]);
        exit;
    } else {
        $stmt = $conn->prepare("INSERT INTO lms_agenda_pendidikan (
            cabang, batch, program, tahun,
            kapasitas_p, kapasitas_l, kapasitas_total,
            kuota_p, kuota_l, kuota_total, kuota_keterangan,
            est_pra_pendidikan, est_kedatangan_asrama, est_mulai_offline,
            act_pra_pendidikan, act_kedatangan_asrama, act_mulai_offline,
            status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->bind_param(
            'sssiiiiiiisssssssss',
            $cabang, $batch, $program, $tahun,
            $kapasitas_p, $kapasitas_l, $kapasitas_total,
            $kuota_p, $kuota_l, $kuota_total, $kuota_keterangan,
            $est_pra, $est_asrama, $est_offline,
            $act_pra, $act_asrama, $act_offline,
            $status, $notes
        );
        $stmt->execute();
        $newId = $conn->insert_id;
        
        echo json_encode(['status' => 'success', 'message' => 'Agenda pendidikan berhasil ditambahkan.', 'id' => $newId]);
        exit;
    }
}

// DELETE: Hapus agenda pendidikan
if ($method === 'DELETE') {
    $id = !empty($_GET['id']) ? (int)$_GET['id'] : null;
    if (!$id) {
        $raw = file_get_contents('php://input');
        $d = json_decode($raw, true);
        $id = !empty($d['id']) ? (int)$d['id'] : null;
    }
    
    if (!$id) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'ID agenda tidak valid.']);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM lms_agenda_pendidikan WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    echo json_encode(['status' => 'success', 'message' => 'Agenda berhasil dihapus.']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Metode tidak diizinkan.']);
