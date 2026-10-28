<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);ed_personal_scope($conn,$actor);
require_once __DIR__.'/../services/relationships.php';
if($_SERVER['REQUEST_METHOD']==='GET'&&($_GET['view']??'')==='file'){
 $row=ac_one($conn,'SELECT l.attachment,e.user_id FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE l.id=?',[ac_id($_GET['id']??null)]);
 if(!$row)ac_fail('Lampiran tidak ditemukan.',404);
 if(!ed_hr($actor)&&(int)$row['user_id']!==(int)$actor['id'])ac_fail('Lampiran employee lain tidak diizinkan.',403);
 rs_file('leaves',$row['attachment']??'','leaves');
}

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
            $row['attachment_url'] = '/api/leaves.php?view=file&id='.$row['id'];
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
        $filename = rs_upload('attachment','leaves');
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
    $approver_role = $actor['role'];

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

    mysqli_begin_transaction($conn);
    // Lock the request before checking its approval state.
    $lq = mysqli_query($conn, "SELECT * FROM leaves WHERE id='$id' FOR UPDATE");
    $leave = mysqli_fetch_assoc($lq);
    
    if (!$leave || $leave['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Pengajuan tidak valid atau sudah diproses"]);
        exit;
    }

    $status = ($action === 'approve') ? 'approved' : 'rejected';

    try {
        $employee=ac_one($conn,'SELECT user_id,leave_balance FROM employees WHERE id=? FOR UPDATE',[(int)$leave['employee_id']]);
        if(!$employee)ac_fail('Employee tidak ditemukan.',409);
        if((int)$employee['user_id']===(int)$actor['id'])ac_fail('Pengajuan sendiri harus disetujui reviewer lain.',403);
        mysqli_query($conn, "UPDATE leaves SET status = '$status' WHERE id = '$id'");

        // Jika diapprove dan kategorinya cuti, potong saldo cuti
        if ($status === 'approved' && $leave['category'] === 'cuti') {
            $start = new DateTime($leave['start_date']);
            $end   = new DateTime($leave['end_date']);
            $diff  = $start->diff($end)->days + 1;

            if((float)$employee['leave_balance']<$diff)ac_fail('Saldo cuti tidak cukup.',409);
            mysqli_query($conn, "UPDATE employees SET leave_balance = leave_balance - $diff WHERE id = '{$leave['employee_id']}'");
        }

        // Leave is absence, not a fabricated worked shift. Preserve recorded attendance.
        if($status==='approved'){
            $current=new DateTimeImmutable(ac_date($leave['start_date']));$end=new DateTimeImmutable(ac_date($leave['end_date']));
            while($current<=$end){$date=$current->format('Y-m-d');$existing=ac_one($conn,'SELECT id FROM attendance_logs WHERE employee_id=? AND date=? FOR UPDATE',[(int)$leave['employee_id'],$date]);
                if($existing)ac_fail('Absensi pada periode ini sudah tercatat. Review konflik sebelum persetujuan cuti.',409);
                ac_query($conn,'INSERT INTO attendance_logs(employee_id,date,status) VALUES(?,?,?)',[(int)$leave['employee_id'],$date,$leave['category']]);$current=$current->modify('+1 day');
            }
        }
        ed_audit($conn,$actor,(int)$leave['employee_id'],'leave_'.$status,['leave_id'=>$id]);
        mysqli_commit($conn);
        echo json_encode(["status" => "success", "message" => "Pengajuan berhasil di-" . $action]);
    } catch (Throwable $e) {
        mysqli_rollback($conn);
        if($e instanceof AccountingException)ed_respond($e->getCode(),["status"=>"error","message"=>$e->getMessage()]);
        throw $e;
    }
    
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
