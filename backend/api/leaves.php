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

define('APPROVER_ROLES', ['super_admin', 'manager']);

// ─────────────────────────────────────────────────────────────────────────
// GET — Ambil data cuti/izin/sakit
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $where = [];

    if (!empty($_GET['employee_id'])) {
        $eid     = (int)$_GET['employee_id'];
        $where[] = "l.employee_id = '$eid'";
    }

    if (!empty($_GET['status'])) {
        $st      = mysqli_real_escape_string($conn, $_GET['status']);
        $where[] = "l.status = '$st'";
    }

    if (!empty($_GET['category'])) {
        $cat     = mysqli_real_escape_string($conn, $_GET['category']);
        $where[] = "l.category = '$cat'";
    }

    $whereStr = count($where) ? "WHERE " . implode(" AND ", $where) : "";

    $q = mysqli_query($conn, "
        SELECT 
            l.id,
            l.employee_id,
            e.full_name AS employee_name,
            l.category,
            l.start_date,
            l.end_date,
            l.reason,
            l.attachment,
            l.status,
            l.created_at
        FROM leaves l
        LEFT JOIN employees e ON e.id = l.employee_id
        $whereStr
        ORDER BY l.created_at DESC
    ");

    if (!$q) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($q)) {
        // Build full URL for attachment if exists
        if ($row['attachment']) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];
            $row['attachment_url'] = $protocol . '://' . $host . '/One-creativa/backend/uploads/leaves/' . $row['attachment'];
        } else {
            $row['attachment_url'] = null;
        }
        $data[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────
// POST — Pengajuan Cuti / Izin / Sakit (multipart/form-data)
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $employee_id   = (int)($_POST['employee_id'] ?? 0);
    $category      = mysqli_real_escape_string($conn, $_POST['category'] ?? 'cuti');
    $start_date    = mysqli_real_escape_string($conn, $_POST['start_date'] ?? '');
    $end_date      = mysqli_real_escape_string($conn, $_POST['end_date'] ?? '');
    $reason        = mysqli_real_escape_string($conn, $_POST['reason'] ?? '');

    if (!$employee_id || !$start_date || !$end_date || !$category) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
        exit;
    }

    // Hitung hari (sederhana: selisih hari + 1)
    $start = new DateTime($start_date);
    $end   = new DateTime($end_date);
    $diff  = $start->diff($end)->days + 1;

    // Jika cuti, cek saldo
    if ($category === 'cuti') {
        $empQ = mysqli_query($conn, "SELECT leave_balance FROM employees WHERE id='$employee_id'");
        $emp  = mysqli_fetch_assoc($empQ);
        if (!$emp || $emp['leave_balance'] < $diff) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Saldo cuti tidak mencukupi (sisa: " . ($emp['leave_balance']??0) . ", diajukan: $diff hari)"]);
            exit;
        }
    }

    // Handle Upload Surat Sakit
    $filename = null;
    if ($category === 'sakit' && isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/leaves/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $ext = pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION);
        $filename = time() . '_' . $employee_id . '.' . $ext;
        if (!move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadDir . $filename)) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal upload file"]);
            exit;
        }
    }

    $filenameSql = $filename ? "'$filename'" : "NULL";

    $ok = mysqli_query($conn, "
        INSERT INTO leaves (employee_id, category, start_date, end_date, reason, attachment, status)
        VALUES ('$employee_id', '$category', '$start_date', '$end_date', '$reason', $filenameSql, 'pending')
    ");

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => ucfirst($category) . " berhasil diajukan"]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────
// PUT — Approve/Reject Cuti
// Body: { id, action: 'approve'|'reject', approver_role }
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_decode(file_get_contents("php://input"), true);
    
    $id            = (int)($body['id'] ?? 0);
    $action        = $body['action'] ?? '';
    $approver_role = $body['approver_role'] ?? '';

    // Validasi role
    if (!in_array($approver_role, APPROVER_ROLES)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Tidak punya akses"]);
        exit;
    }

    if (!$id || !in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak valid"]);
        exit;
    }

    // Ambil data leaves
    $lq = mysqli_query($conn, "SELECT * FROM leaves WHERE id='$id'");
    $leave = mysqli_fetch_assoc($lq);
    
    if (!$leave || $leave['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Pengajuan tidak valid atau sudah diproses"]);
        exit;
    }

    $status = ($action === 'approve') ? 'approved' : 'rejected';

    mysqli_begin_transaction($conn);
    try {
        mysqli_query($conn, "UPDATE leaves SET status = '$status' WHERE id = '$id'");

        // Jika diapprove dan kategorinya cuti, potong saldo cuti
        if ($status === 'approved' && $leave['category'] === 'cuti') {
            $start = new DateTime($leave['start_date']);
            $end   = new DateTime($leave['end_date']);
            $diff  = $start->diff($end)->days + 1;

            mysqli_query($conn, "UPDATE employees SET leave_balance = leave_balance - $diff WHERE id = '{$leave['employee_id']}'");
        }

        // Jika diapprove dan kategorinya dinas, insert otomatis ke attendance_logs sebagai hadir
        if ($status === 'approved' && $leave['category'] === 'dinas') {
            $start = new DateTime($leave['start_date']);
            $end   = new DateTime($leave['end_date']);
            
            $current = clone $start;
            while ($current <= $end) {
                // Hari minggu tidak dimasukkan absen kecuali dinas juga dihitung hari minggu.
                // Untuk amannya, masukkan saja karena sedang dinas
                $dateStr = $current->format('Y-m-d');
                $checkIn = $dateStr . ' 08:00:00';
                $checkOut = $dateStr . ' 17:00:00';
                $eid = $leave['employee_id'];
                
                $cek = mysqli_query($conn, "SELECT id FROM attendance_logs WHERE employee_id='$eid' AND date='$dateStr'");
                if (mysqli_num_rows($cek) == 0) {
                    mysqli_query($conn, "INSERT INTO attendance_logs (employee_id, date, check_in_at, check_out_at, status) VALUES ('$eid', '$dateStr', '$checkIn', '$checkOut', 'dinas')");
                } else {
                    mysqli_query($conn, "UPDATE attendance_logs SET status='dinas', check_in_at='$checkIn', check_out_at='$checkOut' WHERE employee_id='$eid' AND date='$dateStr'");
                }
                
                $current->modify('+1 day');
            }
        }

        mysqli_commit($conn);
        echo json_encode(["status" => "success", "message" => "Pengajuan berhasil di-" . $action]);
    } catch (Exception $e) {
        mysqli_rollback($conn);
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
