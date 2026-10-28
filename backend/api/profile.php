<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);
$targetId=(int)(($_SERVER['REQUEST_METHOD']==='GET'?$_GET:$_POST)['user_id']??$actor['id']);
if($targetId!==(int)$actor['id']&&!ed_hr($actor))ac_fail('Tidak dapat mengakses profil pengguna lain.',403);
if($_SERVER['REQUEST_METHOD']!=='GET'&&$targetId!==(int)$actor['id']&&!ed_accounts($actor,'system')){
    $target=ac_one($conn,'SELECT r.name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?',[$targetId]);
    if(!$target||!in_array($target['name'],['karyawan','employee','staff','sensei','sensei_intensif'],true))ac_fail('Profil akun dengan role khusus hanya dikelola administrator.',403);
}
if($_SERVER['REQUEST_METHOD']==='GET')$_GET['user_id']=$targetId;else $_POST['user_id']=$targetId;

/**
 * Helper: kirim response JSON lalu hentikan eksekusi.
 */
function respond($httpCode, $payload) {
    if($httpCode>=500)$payload=['status'=>'error','message'=>'Profil gagal diproses. Hubungi administrator dengan ID permintaan.'];
    ed_respond($httpCode,$payload);
}

/**
 * Helper: pastikan user_id benar-benar ada di tabel users.
 * Jika tidak ada → sesi di browser sudah tidak valid (akun dihapus / DB di-reset).
 */
function assertUserExists($conn, $user_id) {
    $stmt = mysqli_prepare($conn, "SELECT id FROM users WHERE id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    $exists = mysqli_stmt_num_rows($stmt) > 0;
    mysqli_stmt_close($stmt);

    if (!$exists) {
        respond(401, [
            "status"  => "error",
            "code"    => "SESSION_INVALID",
            "message" => "Sesi login Anda sudah tidak valid (akun tidak ditemukan). Silakan login ulang."
        ]);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

/* =========================================================
 * GET — ambil profil
 * ========================================================= */
if ($method === 'GET') {
    $user_id = (int)($_GET['user_id'] ?? 0);
    if (!$user_id) respond(400, ["status" => "error", "message" => "user_id is required"]);

    assertUserExists($conn, $user_id);

    $stmt = mysqli_prepare($conn, "
        SELECT 
            e.id as employee_id, e.employee_code as nik, e.full_name as name, 
            e.gender, e.position, e.work_type, e.photo_url, e.birth_place, e.birth_date, 
            e.religion, e.marital_status, e.blood_type, e.created_at, 
            e.phone, e.address, e.city, e.emergency_name, e.emergency_relation, 
            e.emergency_phone, e.npwp, e.bank_name, e.bank_account,
            e.bpjs_tk, e.bpjs_kes,
            u.email, u.is_active, r.name as role_name, d.name as department
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.id = ?
        LIMIT 1
    ");
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    mysqli_stmt_execute($stmt);
    $profile = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    respond(200, ["status" => "success", "data" => $profile]);
}

/* =========================================================
 * POST — simpan / update profil
 * ========================================================= */
if ($method === 'POST') {
    $user_id = (int)($_POST['user_id'] ?? 0);
    if (!$user_id) respond(400, ["status" => "error", "message" => "user_id is required"]);

    assertUserExists($conn, $user_id);

    // Ambil data employee yang sudah ada (untuk fallback agar field kosong tidak menimpa data lama)
    $stmt = mysqli_prepare($conn, "SELECT * FROM employees WHERE user_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    mysqli_stmt_execute($stmt);
    $existing = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if(!$existing)respond(409,['status'=>'error','message'=>'Profil employee belum terhubung. Administrator perlu meninjau relasi akun sebelum recovery.']);
    if(!ed_hr($actor)){
        foreach(['nik'=>'employee_code','position'=>'position'] as $input=>$column){
            if(isset($_POST[$input])&&trim($_POST[$input])!==''&&trim($_POST[$input])!==($existing[$column]??''))ac_fail('Identitas staff dan jabatan hanya dapat diubah HRD.',403);
            $_POST[$input]=$existing[$column]??'';
        }
        if(!empty($_POST['department'])){
            $department=ac_one($conn,'SELECT name FROM departments WHERE id=?',[(int)($existing['department_id']??0)]);
            if(trim($_POST['department'])!==($department['name']??''))ac_fail('Departemen hanya dapat diubah HRD.',403);
        }
        if(!empty($_POST['join_date'])&&$_POST['join_date']!==($existing['join_date']??''))ac_fail('Tanggal bergabung hanya dapat diubah HRD.',403);
        unset($_POST['department'],$_POST['join_date']);
    }

    $in = function ($key) use ($existing) { return trim($_POST[$key] ?? $existing[$key] ?? ''); };

    // Nama wajib — jangan sampai tertimpa string kosong
    $name = $in('name');
    if ($name === '') $name = $existing['full_name'] ?? '';
    if ($name === '') {
        respond(422, ["status" => "error", "message" => "Nama lengkap wajib diisi."]);
    }

    // NIK: NULL jika kosong (kolom employee_code UNIQUE & nullable)
    $nik = $in('nik');
    $nik = ($nik === '') ? ($existing['employee_code'] ?? null) : $nik;

    // Cek NIK bentrok dengan karyawan lain
    if ($nik !== null) {
        $stmt = mysqli_prepare($conn, "SELECT user_id FROM employees WHERE employee_code = ? AND user_id <> ? LIMIT 1");
        mysqli_stmt_bind_param($stmt, "si", $nik, $user_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_store_result($stmt);
        $nikTaken = mysqli_stmt_num_rows($stmt) > 0;
        mysqli_stmt_close($stmt);
        if ($nikTaken) {
            respond(409, ["status" => "error", "message" => "NIK \"$nik\" sudah digunakan oleh karyawan lain."]);
        }
    }

    $birth_date = $in('birth_date');
    $birth_date = ($birth_date === '') ? null : $birth_date;

    $fields = [
        'full_name'          => $name,
        'employee_code'      => $nik,
        'birth_place'        => $in('birth_place'),
        'birth_date'         => $birth_date,
        'gender'             => $in('gender'),
        'religion'           => $in('religion'),
        'marital_status'     => $in('marital_status'),
        'blood_type'         => $in('blood_type'),
        'phone'              => $in('phone'),
        'address'            => $in('address'),
        'city'               => $in('city'),
        'emergency_name'     => $in('emergency_name'),
        'emergency_relation' => $in('emergency_relation'),
        'emergency_phone'    => $in('emergency_phone'),
        'npwp'               => $in('npwp'),
        'bpjs_tk'            => $in('bpjs_tk'),
        'bpjs_kes'           => $in('bpjs_kes'),
        'bank_name'          => $in('bank_name'),
        'bank_account'       => $in('bank_account'),
        'position'           => $in('position') ?: ($existing['position'] ?? ''),
        'work_type'          => $in('work_type'),
    ];

    // Upload foto (validasi tipe & ukuran)
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($_FILES['photo']['tmp_name']);
        if (!isset($allowed[$mime])||!is_uploaded_file($_FILES['photo']['tmp_name'])) {
            respond(422, ["status" => "error", "message" => "Format foto harus JPG, PNG, WEBP, atau GIF."]);
        }
        if ($_FILES['photo']['size'] > 5 * 1024 * 1024) {
            respond(422, ["status" => "error", "message" => "Ukuran foto maksimal 5MB."]);
        }

        // Simpan di backend/uploads/photos — folder standar foto karyawan
        // (diakses frontend via proxy /uploads/photos/ → lihat PHOTO_BASE_URL di src/services/api.js)
        $uploadDir = (defined('EMPLOYEE_PHOTO_DIR')?EMPLOYEE_PHOTO_DIR:__DIR__.'/../uploads/photos').'/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0750, true);

        $filename = 'emp_'.$existing['id'].'_'.bin2hex(random_bytes(12)).'.'.$allowed[$mime];
        if (!move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $filename)) {
            respond(500, ["status" => "error", "message" => "Gagal mengunggah foto."]);
        }
        $fields['photo_url'] = $filename;
    }

    mysqli_begin_transaction($conn);
    try {
        $cols  = array_keys($fields);
        $vals  = array_values($fields);
        $types = str_repeat('s', count($vals));

        if ($existing) {
            $set = implode(', ', array_map(fn($c) => "$c = ?", $cols));
            $sql = "UPDATE employees SET $set WHERE user_id = ?";
            $types .= 'i';
            $vals[] = $user_id;
        } else {
            $cols[] = 'user_id';
            $vals[] = $user_id;
            $types .= 'i';
            $placeholders = implode(', ', array_fill(0, count($cols), '?'));
            $sql = "INSERT INTO employees (" . implode(', ', $cols) . ") VALUES ($placeholders)";
        }

        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) throw new Exception(mysqli_error($conn));
        mysqli_stmt_bind_param($stmt, $types, ...$vals);
        if (!mysqli_stmt_execute($stmt)) throw new Exception(mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);

        // Email (cek bentrok dengan user lain)
        $email = $in('email');
        if ($email !== '') {
            $stmt = mysqli_prepare($conn, "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1");
            mysqli_stmt_bind_param($stmt, "si", $email, $user_id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_store_result($stmt);
            $emailTaken = mysqli_stmt_num_rows($stmt) > 0;
            mysqli_stmt_close($stmt);
            if ($emailTaken) throw new Exception("Email \"$email\" sudah digunakan akun lain.");

            $stmt = mysqli_prepare($conn, "UPDATE users SET email = ? WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "si", $email, $user_id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        // Join date
        $join_date = $in('join_date');
        if ($join_date !== '') {
            $join_date=ac_date($join_date);
            $stmt = mysqli_prepare($conn, "UPDATE employees SET join_date = ? WHERE user_id = ?");
            mysqli_stmt_bind_param($stmt, "si", $join_date, $user_id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        // Department uses exact master identity.
        $department = $in('department');
        if ($department !== '') {
            $stmt = mysqli_prepare($conn, "SELECT id FROM departments WHERE name = ? LIMIT 1");
            mysqli_stmt_bind_param($stmt, "s", $department);
            mysqli_stmt_execute($stmt);
            $dep = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
            mysqli_stmt_close($stmt);
            if ($dep) {
                $stmt = mysqli_prepare($conn, "UPDATE employees SET department_id = ? WHERE user_id = ?");
                mysqli_stmt_bind_param($stmt, "ii", $dep['id'], $user_id);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
        }

        ed_audit($conn,$actor,(int)$existing['id'],'profile_updated',['user_id'=>$user_id,'fields'=>array_keys($fields)]);
        mysqli_commit($conn);
    } catch (Exception $e) {
        mysqli_rollback($conn);
        error_log(json_encode(['request_id'=>$GLOBALS['employee_request_id'],'module'=>'profile','error_class'=>get_class($e),'error_code'=>$e->getCode()]));
        respond(500, ["status" => "error", "message" => 'Profil gagal disimpan.']);
    }

    // Kembalikan data terbaru untuk sinkronisasi frontend
    $stmt = mysqli_prepare($conn, "SELECT full_name, position, photo_url FROM employees WHERE user_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    mysqli_stmt_execute($stmt);
    $fresh = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    respond(200, [
        "status"    => "success",
        "message"   => "Profile updated successfully",
        "name"      => $fresh['full_name'] ?? $name,
        "position"  => $fresh['position'] ?? null,
        "photo_url" => $fresh['photo_url'] ?? null,
    ]);
}

respond(405, ["status" => "error", "message" => "Method not allowed"]);
