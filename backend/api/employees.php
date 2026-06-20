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

$method = $_SERVER['REQUEST_METHOD'];

function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function readJsonBody() {
    $rawBody = file_get_contents("php://input");
    $decodedBody = json_decode($rawBody, true);
    return is_array($decodedBody) ? $decodedBody : [];
}

if ($method === 'GET') {
    $query = mysqli_query($conn, "
        SELECT 
            e.id, 
            e.employee_code AS nik, 
            e.full_name AS name, 
            e.gender,
            e.position AS position_name, 
            e.photo_url AS photo,
            e.leave_balance,
            e.base_salary,
            u.email,
            r.name AS role_name,
            d.name AS department
        FROM employees e
        JOIN users u ON e.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON e.department_id = d.id
        ORDER BY e.id DESC
    ");

    if (!$query) {
        respond(500, [
            "status" => "error",
            "message" => "Gagal mengambil data employee",
            "error" => mysqli_error($conn)
        ]);
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($query)) {
        $row['position'] = $row['position_name']; // compatibility
        $data[] = $row;
    }

    respond(200, ["status" => "success", "data" => $data]);
}

if ($method === 'POST') {
    $data = readJsonBody();

    $nik = trim($data['nik'] ?? '');
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $passwordRaw = trim($data['password'] ?? '');
    $roleName = trim(strtolower($data['role_name'] ?? 'karyawan'));
    $position = trim($data['position_name'] ?? '');
    $gender = trim($data['gender'] ?? 'Laki-laki');
    $base_salary = isset($data['base_salary']) ? (float)$data['base_salary'] : 0;

    if ($nik === '' || $name === '' || $email === '') {
        respond(422, ["status" => "error", "message" => "NIK, nama, dan email wajib diisi"]);
    }

    $safeEmail = mysqli_real_escape_string($conn, $email);

    // Cek apakah email sudah digunakan oleh user lain
    $checkEmail = mysqli_query($conn, "SELECT id FROM users WHERE email = '$safeEmail'");
    if (mysqli_num_rows($checkEmail) > 0) {
        respond(422, ["status" => "error", "message" => "Email sudah digunakan. Silakan gunakan email lain."]);
    }

    // Cek apakah NIK sudah digunakan
    $safeNik = mysqli_real_escape_string($conn, $nik);
    $checkNik = mysqli_query($conn, "SELECT id FROM employees WHERE employee_code = '$safeNik'");
    if (mysqli_num_rows($checkNik) > 0) {
        respond(422, ["status" => "error", "message" => "NIK sudah digunakan. Silakan gunakan NIK lain."]);
    }

    // Get or Create Role
    $safeRole = mysqli_real_escape_string($conn, $roleName);
    $roleQuery = mysqli_query($conn, "SELECT id FROM roles WHERE name = '$safeRole' LIMIT 1");
    if ($roleRow = mysqli_fetch_assoc($roleQuery)) {
        $roleId = $roleRow['id'];
    } else {
        mysqli_query($conn, "INSERT INTO roles (name, label) VALUES ('$safeRole', '$safeRole')");
        $roleId = mysqli_insert_id($conn);
    }

    // Insert User
    if ($passwordRaw === '') $passwordRaw = '123456';
    $passwordHash = password_hash($passwordRaw, PASSWORD_BCRYPT);
    
    $insertUser = mysqli_query($conn, "INSERT INTO users (email, password_hash, role_id, created_at, updated_at) VALUES ('$safeEmail', '$passwordHash', $roleId, NOW(), NOW())");
    if (!$insertUser) {
        respond(500, ["status" => "error", "message" => "Gagal membuat user login", "error" => mysqli_error($conn)]);
    }
    $userId = mysqli_insert_id($conn);

    // Insert Employee
    $safeName = mysqli_real_escape_string($conn, $name);
    $safePos = mysqli_real_escape_string($conn, $position);
    $safeGender = mysqli_real_escape_string($conn, $gender);

    $insertEmp = mysqli_query($conn, "INSERT INTO employees (user_id, employee_code, full_name, gender, position, join_date, base_salary, created_at, updated_at) VALUES ($userId, '$safeNik', '$safeName', '$safeGender', '$safePos', CURDATE(), $base_salary, NOW(), NOW())");

    if (!$insertEmp) {
        mysqli_query($conn, "DELETE FROM users WHERE id = $userId"); // Rollback
        respond(500, ["status" => "error", "message" => "Gagal menyimpan data employee", "error" => mysqli_error($conn)]);
    }

    respond(201, ["status" => "success", "message" => "Employee ditambahkan beserta akun login"]);
}


if ($method === 'PUT') {
    $data = readJsonBody();

    $id = (int) ($data['id'] ?? 0);
    $nik = trim($data['nik'] ?? '');
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $passwordRaw = trim($data['password'] ?? '');
    $roleName = trim(strtolower($data['role_name'] ?? 'karyawan'));
    $position = trim($data['position_name'] ?? '');
    $gender = trim($data['gender'] ?? 'Laki-laki');
    $base_salary = isset($data['base_salary']) ? (float)$data['base_salary'] : 0;

    if ($id <= 0 || $nik === '' || $name === '' || $email === '') {
        respond(422, ["status" => "error", "message" => "Data tidak lengkap"]);
    }

    // Get user_id
    $empQuery = mysqli_query($conn, "SELECT user_id FROM employees WHERE id = $id");
    if (!$empQuery || mysqli_num_rows($empQuery) === 0) {
        respond(404, ["status" => "error", "message" => "Employee tidak ditemukan"]);
    }
    $userId = mysqli_fetch_assoc($empQuery)['user_id'];

    // Get or Create Role
    $safeRole = mysqli_real_escape_string($conn, $roleName);
    $roleQuery = mysqli_query($conn, "SELECT id FROM roles WHERE name = '$safeRole' LIMIT 1");
    if ($roleRow = mysqli_fetch_assoc($roleQuery)) {
        $roleId = $roleRow['id'];
    } else {
        mysqli_query($conn, "INSERT INTO roles (name, label) VALUES ('$safeRole', '$safeRole')");
        $roleId = mysqli_insert_id($conn);
    }

    $safeEmail = mysqli_real_escape_string($conn, $email);
    
    // Update User
    if ($passwordRaw !== '') {
        $passwordHash = password_hash($passwordRaw, PASSWORD_BCRYPT);
        mysqli_query($conn, "UPDATE users SET email = '$safeEmail', password_hash = '$passwordHash', role_id = $roleId, updated_at = NOW() WHERE id = $userId");
    } else {
        mysqli_query($conn, "UPDATE users SET email = '$safeEmail', role_id = $roleId, updated_at = NOW() WHERE id = $userId");
    }

    // Update Employee
    $safeNik = mysqli_real_escape_string($conn, $nik);
    $safeName = mysqli_real_escape_string($conn, $name);
    $safePos = mysqli_real_escape_string($conn, $position);
    $safeGender = mysqli_real_escape_string($conn, $gender);

    $updateEmp = mysqli_query($conn, "UPDATE employees SET employee_code = '$safeNik', full_name = '$safeName', gender = '$safeGender', position = '$safePos', base_salary = $base_salary, updated_at = NOW() WHERE id = $id");

    if (!$updateEmp) {
        respond(500, ["status" => "error", "message" => "Gagal mengupdate employee", "error" => mysqli_error($conn)]);
    }

    respond(200, ["status" => "success", "message" => "Employee dan kredensial diupdate"]);
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id <= 0) {
        respond(422, ["status" => "error", "message" => "ID tidak valid"]);
    }

    $empQuery = mysqli_query($conn, "SELECT user_id FROM employees WHERE id = $id");
    if ($empQuery && mysqli_num_rows($empQuery) > 0) {
        $userId = mysqli_fetch_assoc($empQuery)['user_id'];
        
        mysqli_query($conn, "DELETE FROM employees WHERE id = $id");
        if ($userId) {
            mysqli_query($conn, "DELETE FROM users WHERE id = $userId");
        }
        
        respond(200, ["status" => "success", "message" => "Employee dihapus"]);
    } else {
        respond(404, ["status" => "error", "message" => "Employee tidak ditemukan"]);
    }
}

respond(405, ["status" => "error", "message" => "Method tidak didukung"]);
