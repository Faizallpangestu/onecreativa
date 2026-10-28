<?php
/**
 * ONE Creativa - Asset Histories + Transfer Requests API
 * GET    /asset_histories.php?asset_id=X       → Riwayat per aset
 * POST   /asset_histories.php                  → Catat aksi manual (pindah, stock opname, dll)
 * 
 * Transfer Requests (approval workflow):
 * GET    /asset_histories.php?requests=1&status=pending  → List request
 * POST   /asset_histories.php?request=1                  → Buat request
 * PUT    /asset_histories.php?request_id=X               → Approve/reject request
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET ────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    // --- List transfer requests ---
    if (!empty($_GET['requests'])) {
        $where = [];
        if (!empty($_GET['status'])) {
            $s = mysqli_real_escape_string($conn, $_GET['status']);
            $where[] = "r.status = '$s'";
        }
        if (!empty($_GET['asset_id'])) {
            $where[] = "r.asset_id = " . (int)$_GET['asset_id'];
        }
        $whereStr = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT r.*, a.name as asset_name, a.asset_code, a.location as current_location,
                       e1.full_name as requester_name, e2.full_name as reviewer_name
                FROM asset_transfer_requests r
                LEFT JOIN assets a ON r.asset_id = a.id
                LEFT JOIN employees e1 ON r.requested_by = e1.id
                LEFT JOIN employees e2 ON r.reviewed_by = e2.id
                $whereStr ORDER BY r.created_at DESC";
        $result = mysqli_query($conn, $sql);
        if (!$result) respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) $data[] = $row;
        respond(200, ['status' => 'success', 'data' => $data]);
    }

    // --- Semua riwayat (untuk Laporan Audit) ---
    if (!empty($_GET['all'])) {
        $where = [];
        if (!empty($_GET['action_type'])) {
            $act = mysqli_real_escape_string($conn, $_GET['action_type']);
            $where[] = "ah.action_type = '$act'";
        }
        if (!empty($_GET['asset_id'])) {
            $where[] = "ah.asset_id = " . (int)$_GET['asset_id'];
        }
        $whereStr = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT ah.*, e.full_name as performed_by_name, a.name as asset_name, a.asset_code
                FROM asset_histories ah
                LEFT JOIN employees e ON ah.performed_by = e.id
                LEFT JOIN assets a ON ah.asset_id = a.id
                $whereStr
                ORDER BY ah.performed_at DESC
                LIMIT 500";
        $result = mysqli_query($conn, $sql);
        if (!$result) respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) $data[] = $row;
        respond(200, ['status' => 'success', 'data' => $data]);
    }

    // --- Global History by action_type ---
    if (!empty($_GET['action_type'])) {
        $action = mysqli_real_escape_string($conn, $_GET['action_type']);
        $sql = "SELECT ah.*, e.full_name as performed_by_name, a.name as asset_name, a.asset_code 
                FROM asset_histories ah
                LEFT JOIN employees e ON ah.performed_by = e.id
                LEFT JOIN assets a ON ah.asset_id = a.id
                WHERE ah.action_type = '$action'
                ORDER BY ah.performed_at DESC";
        $result = mysqli_query($conn, $sql);
        if (!$result) respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) $data[] = $row;
        respond(200, ['status' => 'success', 'data' => $data]);
    }

    // --- Riwayat per aset ---
    $asset_id = (int)($_GET['asset_id'] ?? 0);
    if ($asset_id <= 0) respond(400, ['status' => 'error', 'message' => 'asset_id atau action_type diperlukan']);

    $limit = !empty($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $sql = "SELECT ah.*, e.full_name as performed_by_name
            FROM asset_histories ah
            LEFT JOIN employees e ON ah.performed_by = e.id
            WHERE ah.asset_id = $asset_id
            ORDER BY ah.performed_at DESC
            LIMIT $limit";
    $result = mysqli_query($conn, $sql);
    if (!$result) respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
    $data = [];
    while ($row = mysqli_fetch_assoc($result)) $data[] = $row;
    respond(200, ['status' => 'success', 'data' => $data]);
}

// ─── POST ───────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    // --- Buat transfer request ---
    if (!empty($_GET['request'])) {
        $asset_id     = (int)($data['asset_id'] ?? 0);
        $requested_by = (int)($data['requested_by'] ?? 0);
        $request_type = $data['request_type'] ?? 'pindah';
        $to_location  = $data['to_location'] ?? '';
        $reason       = $data['reason'] ?? '';

        if ($asset_id <= 0 || $requested_by <= 0) {
            respond(400, ['status' => 'error', 'message' => 'Data tidak lengkap']);
        }

        // Ambil lokasi saat ini
        $asset = mysqli_fetch_assoc(mysqli_query($conn, "SELECT location FROM assets WHERE id=$asset_id"));
        $from_location = $asset['location'] ?? '';

        $safeType    = mysqli_real_escape_string($conn, $request_type);
        $safeFrom    = mysqli_real_escape_string($conn, $from_location);
        $safeTo      = mysqli_real_escape_string($conn, $to_location);
        $safeReason  = mysqli_real_escape_string($conn, $reason);

        $sql = "INSERT INTO asset_transfer_requests (asset_id, requested_by, request_type, from_location, to_location, reason) VALUES ($asset_id, $requested_by, '$safeType', '$safeFrom', '$safeTo', '$safeReason')";
        if (mysqli_query($conn, $sql)) {
            respond(201, ['status' => 'success', 'message' => 'Request perpindahan berhasil dikirim']);
        } else {
            respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
        }
    }

    // --- Catat riwayat manual ---
    $asset_id      = (int)($data['asset_id'] ?? 0);
    $action_type   = $data['action_type'] ?? 'update_kondisi';
    $from_location = $data['from_location'] ?? '';
    $to_location   = $data['to_location'] ?? '';
    $cond_before   = $data['condition_before'] ?? '';
    $cond_after    = $data['condition_after'] ?? '';
    $stat_before   = $data['status_before'] ?? '';
    $stat_after    = $data['status_after'] ?? '';
    $notes         = $data['notes'] ?? '';
    $performed_by  = (int)($data['performed_by'] ?? 0);

    if ($asset_id <= 0) respond(400, ['status' => 'error', 'message' => 'asset_id diperlukan']);

    $safeAction  = mysqli_real_escape_string($conn, $action_type);
    $safeFrom    = mysqli_real_escape_string($conn, $from_location);
    $safeTo      = mysqli_real_escape_string($conn, $to_location);
    $safeCondB   = $cond_before ? "'" . mysqli_real_escape_string($conn, $cond_before) . "'" : "NULL";
    $safeCondA   = $cond_after  ? "'" . mysqli_real_escape_string($conn, $cond_after)  . "'" : "NULL";
    $safeStatB   = mysqli_real_escape_string($conn, $stat_before);
    $safeStatA   = mysqli_real_escape_string($conn, $stat_after);
    $safeNotes   = mysqli_real_escape_string($conn, $notes);
    $safePerf    = $performed_by > 0 ? $performed_by : "NULL";

    $sql = "INSERT INTO asset_histories (asset_id, action_type, from_location, to_location, condition_before, condition_after, status_before, status_after, notes, performed_by)
            VALUES ($asset_id, '$safeAction', '$safeFrom', '$safeTo', $safeCondB, $safeCondA, '$safeStatB', '$safeStatA', '$safeNotes', $safePerf)";

    // Update aset jika ada perubahan lokasi/kondisi/status
    $updateFields = [];
    if (!empty($to_location))  $updateFields[] = "location = '$safeTo'";
    if (!empty($cond_after))   $updateFields[] = "`condition` = " . $safeCondA;
    if (!empty($stat_after))   $updateFields[] = "status = '$safeStatA'";
    if (!empty($updateFields)) {
        mysqli_query($conn, "UPDATE assets SET " . implode(', ', $updateFields) . " WHERE id=$asset_id");
    }

    if (mysqli_query($conn, $sql)) {
        respond(201, ['status' => 'success', 'message' => 'Riwayat berhasil dicatat']);
    } else {
        respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
    }
}

// ─── PUT (Approve/Reject request) ───────────────────────────────────────────
if ($method === 'PUT') {
    $request_id = (int)($_GET['request_id'] ?? 0);
    if ($request_id <= 0) respond(400, ['status' => 'error', 'message' => 'request_id diperlukan']);

    $data         = json_decode(file_get_contents('php://input'), true) ?? [];
    $status       = $data['status'] ?? ''; // 'approved' atau 'rejected'
    $reviewed_by  = (int)($data['reviewed_by'] ?? 0);
    $review_notes = $data['review_notes'] ?? '';

    if (!in_array($status, ['approved', 'rejected'])) {
        respond(400, ['status' => 'error', 'message' => 'Status harus approved atau rejected']);
    }

    // Ambil request
    $req = mysqli_fetch_assoc(mysqli_query($conn, "SELECT * FROM asset_transfer_requests WHERE id=$request_id"));
    if (!$req) respond(404, ['status' => 'error', 'message' => 'Request tidak ditemukan']);

    $safeStatus = mysqli_real_escape_string($conn, $status);
    $safeNotes  = mysqli_real_escape_string($conn, $review_notes);
    $safeReviewer = $reviewed_by > 0 ? $reviewed_by : "NULL";

    mysqli_query($conn, "UPDATE asset_transfer_requests SET status='$safeStatus', reviewed_by=$safeReviewer, review_notes='$safeNotes', reviewed_at=NOW() WHERE id=$request_id");

    // Jika approved, update aset dan catat riwayat
    if ($status === 'approved') {
        $asset_id  = $req['asset_id'];
        $to_loc    = mysqli_real_escape_string($conn, $req['to_location']);
        $from_loc  = mysqli_real_escape_string($conn, $req['from_location']);
        $act_type  = mysqli_real_escape_string($conn, $req['request_type']);

        mysqli_query($conn, "UPDATE assets SET location='$to_loc' WHERE id=$asset_id");
        mysqli_query($conn, "INSERT INTO asset_histories (asset_id, action_type, from_location, to_location, notes, performed_by) VALUES ($asset_id, '$act_type', '$from_loc', '$to_loc', 'Disetujui via approval request #$request_id', $safeReviewer)");
    }

    respond(200, ['status' => 'success', 'message' => 'Request berhasil ' . ($status === 'approved' ? 'disetujui' : 'ditolak')]);
}

// ─── DELETE (Hapus riwayat audit) ────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) respond(400, ['status' => 'error', 'message' => 'ID tidak valid']);

    $sql = "DELETE FROM asset_histories WHERE id = $id";
    if (mysqli_query($conn, $sql)) {
        respond(200, ['status' => 'success', 'message' => 'Data riwayat berhasil dihapus']);
    } else {
        respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);
    }
}

respond(405, ['status' => 'error', 'message' => 'Method not allowed']);
