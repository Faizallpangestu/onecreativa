<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = mysqli_real_escape_string($conn, $data['email'] ?? '');
$passwordRaw = $data['password'] ?? '';

$query = mysqli_query($conn, "
SELECT users.*, roles.name as role_name, employees.full_name, employees.gender, employees.photo_url as photo, employees.employee_code, employees.id as employee_id, employees.position
FROM users 
LEFT JOIN roles ON users.role_id = roles.id
LEFT JOIN employees ON employees.user_id = users.id
WHERE users.email='$email' OR employees.employee_code='$email'
LIMIT 1
");
$user = mysqli_fetch_assoc($query);

if ($user) {
    if (password_verify($passwordRaw, $user['password_hash']) || md5($passwordRaw) === $user['password_hash']) {
        unset($user['password_hash']); // Jangan kirim hash ke frontend
        // Map full_name ke name agar konsisten dengan frontend
        if (!isset($user['name']) && isset($user['full_name'])) {
            $user['name'] = $user['full_name'];
        }
        echo json_encode([
            "status" => "success",
            "message" => "Login berhasil",
            "user" => $user
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Password salah"
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Email atau password tidak ditemukan"
    ]);
}
