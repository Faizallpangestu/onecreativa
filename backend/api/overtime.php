<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

// ── Roles yang boleh approve/reject ───────────────────────────────────────
define('APPROVER_ROLES', ['super_admin', 'manager']);

// ─────────────────────────────────────────────────────────────────────────
// GET — Ambil semua overtime requests
//   ?employee_id=X  → filter milik karyawan tertentu
//   ?status=pending → filter by status
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $where = [];

    if (!empty($_GET['employee_id'])) {
        $eid     = (int)$_GET['employee_id'];
        $where[] = "o.employee_id = '$eid'";
    }

    if (!empty($_GET['status'])) {
        $st      = mysqli_real_escape_string($conn, $_GET['status']);
        $where[] = "o.status = '$st'";
    }

    $whereStr = count($where) ? "WHERE " . implode(" AND ", $where) : "";

    $q = mysqli_query($conn, "
        SELECT
            o.id,
            o.employee_id,
            e.full_name AS employee_name,
            o.attendance_id,
            o.date,
            o.overtime_minutes,
            o.reason,
            o.status,
            o.approved_by,
            u.email AS approved_by_email,
            o.approved_at,
            o.reject_reason,
            o.created_at
        FROM overtime_requests o
        LEFT JOIN employees e ON e.id = o.employee_id
        LEFT JOIN users u ON u.id = o.approved_by
        $whereStr
        ORDER BY o.created_at DESC
    ");

    if (!$q) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($q)) {
        $data[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────
// POST — Submit overtime request (semua karyawan)
// Body: { employee_id, date, overtime_minutes, reason, attendance_id? }
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body             = json_decode(file_get_contents("php://input"), true);
    $employee_id      = (int)($body['employee_id'] ?? 0);
    $date             = mysqli_real_escape_string($conn, $body['date'] ?? date('Y-m-d'));
    $overtime_minutes = (int)($body['overtime_minutes'] ?? 0);
    $reason           = mysqli_real_escape_string($conn, $body['reason'] ?? '');
    $attendance_id    = !empty($body['attendance_id']) ? (int)$body['attendance_id'] : 'NULL';

    if (!$employee_id || $overtime_minutes <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "employee_id dan overtime_minutes wajib diisi"]);
        exit;
    }

    // Cegah duplikat request di tanggal yang sama
    $dupCheck = mysqli_query($conn, "
        SELECT id FROM overtime_requests
        WHERE employee_id = '$employee_id' AND date = '$date' AND status != 'rejected'
    ");
    if (mysqli_num_rows($dupCheck) > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Request lembur untuk tanggal ini sudah ada"]);
        exit;
    }

    $aidValue = ($attendance_id === 'NULL') ? 'NULL' : "'$attendance_id'";

    $ok = mysqli_query($conn, "
        INSERT INTO overtime_requests (employee_id, attendance_id, date, overtime_minutes, reason, status)
        VALUES ('$employee_id', $aidValue, '$date', '$overtime_minutes', '$reason', 'pending')
    ");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Request lembur berhasil disubmit", "id" => mysqli_insert_id($conn)]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────
// PUT — Approve atau Reject (hanya super_admin / manager)
// Body: { id, action: 'approve'|'reject', approver_id, approver_role, reject_reason? }
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body          = json_decode(file_get_contents("php://input"), true);
    $id            = (int)($body['id'] ?? 0);
    $action        = $body['action'] ?? '';         // 'approve' | 'reject'
    $approver_id   = (int)($body['approver_id'] ?? 0);
    $approver_role = $body['approver_role'] ?? '';
    $reject_reason = mysqli_real_escape_string($conn, $body['reject_reason'] ?? '');

    // Validasi role
    if (!in_array($approver_role, APPROVER_ROLES)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Tidak punya akses untuk approve/reject lembur"]);
        exit;
    }

    if (!$id || !in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak valid"]);
        exit;
    }

    // Ambil request
    $req = mysqli_fetch_assoc(mysqli_query($conn, "SELECT * FROM overtime_requests WHERE id = '$id'"));
    if (!$req) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Request tidak ditemukan"]);
        exit;
    }

    if ($req['status'] !== 'pending') {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Request sudah diproses sebelumnya"]);
        exit;
    }

    if ($action === 'approve') {
        $now = date('Y-m-d H:i:s');

        // Update status request
        mysqli_query($conn, "
            UPDATE overtime_requests
            SET status = 'approved', approved_by = '$approver_id', approved_at = '$now'
            WHERE id = '$id'
        ");

        // Update overtime_minutes di attendance (jika attendance_id tersedia)
        if ($req['attendance_id']) {
            $aid = (int)$req['attendance_id'];
            $ot  = (int)$req['overtime_minutes'];
            mysqli_query($conn, "UPDATE attendance SET overtime_minutes = '$ot' WHERE id = '$aid'");
        } else {
            // Cari attendance berdasarkan employee_id + date
            $eid  = (int)$req['employee_id'];
            $date = mysqli_real_escape_string($conn, $req['date']);
            $ot   = (int)$req['overtime_minutes'];
            $attQ = mysqli_query($conn, "SELECT id FROM attendance WHERE employee_id='$eid' AND date='$date' LIMIT 1");
            $att  = mysqli_fetch_assoc($attQ);
            if ($att) {
                mysqli_query($conn, "UPDATE attendance SET overtime_minutes = '$ot' WHERE id = '" . $att['id'] . "'");
            }
        }

        echo json_encode(["status" => "success", "message" => "Lembur disetujui"]);

    } else {
        // Reject
        mysqli_query($conn, "
            UPDATE overtime_requests
            SET status = 'rejected', approved_by = '$approver_id', approved_at = NOW(), reject_reason = '$reject_reason'
            WHERE id = '$id'
        ");

        echo json_encode(["status" => "success", "message" => "Lembur ditolak"]);
    }

    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
