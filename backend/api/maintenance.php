<?php
/**
 * ONE Creativa - Maintenance API
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require '../config/database.php';

function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// GET
if ($method === 'GET') {
    if (!empty($_GET['stats'])) {
        $total     = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM maintenance_schedules"))['c'];
        $scheduled = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM maintenance_schedules WHERE status='scheduled'"))['c'];
        $in_prog   = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM maintenance_schedules WHERE status='in_progress'"))['c'];
        $done      = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM maintenance_schedules WHERE status='completed'"))['c'];
        $biaya     = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COALESCE(SUM(cost),0) as total FROM maintenance_schedules WHERE status='completed'"))['total'];
        respond(200, ['status'=>'success','data'=>['total'=>$total,'scheduled'=>$scheduled,'in_progress'=>$in_prog,'completed'=>$done,'total_biaya'=>(float)$biaya]]);
    }

    if ($id > 0) {
        $r = mysqli_query($conn, "SELECT m.*, a.name as asset_name, a.asset_code, a.location as asset_location, e.full_name as assigned_name FROM maintenance_schedules m LEFT JOIN assets a ON m.asset_id=a.id LEFT JOIN employees e ON m.assigned_to=e.id WHERE m.id=$id LIMIT 1");
        if (!$r || mysqli_num_rows($r) === 0) respond(404, ['status'=>'error','message'=>'Tidak ditemukan']);
        respond(200, ['status'=>'success','data'=>mysqli_fetch_assoc($r)]);
    }

    $where = [];
    if (!empty($_GET['status']))   $where[] = "m.status='" . mysqli_real_escape_string($conn, $_GET['status']) . "'";
    if (!empty($_GET['priority'])) $where[] = "m.priority='" . mysqli_real_escape_string($conn, $_GET['priority']) . "'";
    if (!empty($_GET['asset_id'])) $where[] = "m.asset_id=" . (int)$_GET['asset_id'];
    if (!empty($_GET['search'])) {
        $s = mysqli_real_escape_string($conn, $_GET['search']);
        $where[] = "(m.title LIKE '%$s%' OR a.name LIKE '%$s%' OR a.asset_code LIKE '%$s%')";
    }
    $whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql = "SELECT m.*, a.name as asset_name, a.asset_code, a.location as asset_location, e.full_name as assigned_name
            FROM maintenance_schedules m
            LEFT JOIN assets a ON m.asset_id = a.id
            LEFT JOIN employees e ON m.assigned_to = e.id
            $whereStr ORDER BY m.scheduled_date ASC, m.priority DESC";
    $r = mysqli_query($conn, $sql);
    if (!$r) respond(500, ['status'=>'error','message'=>mysqli_error($conn)]);
    $data = [];
    while ($row = mysqli_fetch_assoc($r)) $data[] = $row;
    respond(200, ['status'=>'success','data'=>$data,'total'=>count($data)]);
}

// POST
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $asset_id      = (int)($body['asset_id'] ?? 0);
    $title         = trim($body['title'] ?? '');
    $description   = $body['description'] ?? '';
    $scheduled_date= $body['scheduled_date'] ?? date('Y-m-d');
    $priority      = $body['priority'] ?? 'medium';
    $cost          = (float)($body['cost'] ?? 0);
    $notes         = $body['notes'] ?? '';
    $created_by    = (int)($body['created_by'] ?? 0);
    $assigned_to   = (int)($body['assigned_to'] ?? 0);

    if ($asset_id <= 0 || empty($title)) respond(400, ['status'=>'error','message'=>'asset_id dan title wajib diisi']);

    $safeTitle  = mysqli_real_escape_string($conn, $title);
    $safeDesc   = mysqli_real_escape_string($conn, $description);
    $safeDate   = mysqli_real_escape_string($conn, $scheduled_date);
    $safePrio   = mysqli_real_escape_string($conn, $priority);
    $safeNotes  = mysqli_real_escape_string($conn, $notes);
    $safeAssign = $assigned_to > 0 ? $assigned_to : "NULL";
    $safeCreator= $created_by > 0 ? $created_by : "NULL";

    $sql = "INSERT INTO maintenance_schedules (asset_id, title, description, scheduled_date, priority, cost, notes, assigned_to, created_by)
            VALUES ($asset_id, '$safeTitle', '$safeDesc', '$safeDate', '$safePrio', $cost, '$safeNotes', $safeAssign, $safeCreator)";

    if (mysqli_query($conn, $sql)) {
        $newId = mysqli_insert_id($conn);
        // Update status aset jadi Maintenance
        mysqli_query($conn, "UPDATE assets SET status='Maintenance' WHERE id=$asset_id");
        // Catat riwayat
        mysqli_query($conn, "INSERT INTO asset_histories (asset_id, action_type, notes, performed_by) VALUES ($asset_id, 'maintenance', 'Dijadwalkan maintenance: $safeTitle', $safeCreator)");
        respond(201, ['status'=>'success','message'=>'Jadwal maintenance berhasil ditambahkan','id'=>$newId]);
    } else {
        respond(500, ['status'=>'error','message'=>mysqli_error($conn)]);
    }
}

// PUT - Update status maintenance
if ($method === 'PUT') {
    if ($id <= 0) respond(400, ['status'=>'error','message'=>'ID tidak valid']);
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $old = mysqli_fetch_assoc(mysqli_query($conn, "SELECT * FROM maintenance_schedules WHERE id=$id"));
    if (!$old) respond(404, ['status'=>'error','message'=>'Tidak ditemukan']);

    $status        = $body['status'] ?? $old['status'];
    $notes         = $body['notes'] ?? $old['notes'];
    $cost          = isset($body['cost']) ? (float)$body['cost'] : (float)$old['cost'];
    $completed_date= ($status === 'completed') ? "'" . date('Y-m-d') . "'" : "NULL";
    $updated_by    = (int)($body['updated_by'] ?? 0);

    $safeStatus = mysqli_real_escape_string($conn, $status);
    $safeNotes  = mysqli_real_escape_string($conn, $notes);

    mysqli_query($conn, "UPDATE maintenance_schedules SET status='$safeStatus', notes='$safeNotes', cost=$cost, completed_date=$completed_date WHERE id=$id");

    // Jika selesai maintenance, update status aset kembali ke Aktif
    if ($status === 'completed') {
        mysqli_query($conn, "UPDATE assets SET status='Aktif' WHERE id={$old['asset_id']}");
        $safeUpdater = $updated_by > 0 ? $updated_by : "NULL";
        mysqli_query($conn, "INSERT INTO asset_histories (asset_id, action_type, notes, performed_by) VALUES ({$old['asset_id']}, 'maintenance', 'Maintenance selesai: {$old['title']}', $safeUpdater)");
    }

    respond(200, ['status'=>'success','message'=>'Status maintenance diperbarui']);
}

// DELETE
if ($method === 'DELETE') {
    if ($id <= 0) respond(400, ['status'=>'error','message'=>'ID tidak valid']);
    mysqli_query($conn, "DELETE FROM maintenance_schedules WHERE id=$id");
    respond(200, ['status'=>'success','message'=>'Jadwal maintenance dihapus']);
}

respond(405, ['status'=>'error','message'=>'Method not allowed']);
