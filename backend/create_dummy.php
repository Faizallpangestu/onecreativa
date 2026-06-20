<?php
require_once __DIR__ . '/config/database.php';

// 1. Buat Role (pastikan ada)
mysqli_query($conn, "INSERT IGNORE INTO roles (name) VALUES ('karyawan')");
$qRole = mysqli_query($conn, "SELECT id FROM roles WHERE name='karyawan'");
$role_id = mysqli_fetch_assoc($qRole)['id'];

// 2. Buat User
$email = "andi@creativa.com";
$password = password_hash("123456", PASSWORD_DEFAULT);
mysqli_query($conn, "INSERT IGNORE INTO users (email, password_hash, role_id) VALUES ('$email', '$password', $role_id)");
$qUser = mysqli_query($conn, "SELECT id FROM users WHERE email='$email'");
$user_id = mysqli_fetch_assoc($qUser)['id'];

// 3. Buat Department & Position
mysqli_query($conn, "INSERT IGNORE INTO departments (name) VALUES ('IT')");
$dept_id = mysqli_insert_id($conn) ?: mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM departments LIMIT 1"))['id'];

mysqli_query($conn, "INSERT IGNORE INTO positions (name, base_salary) VALUES ('Staff IT', 5000000)");
$pos_id = mysqli_insert_id($conn) ?: mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM positions WHERE name='Staff IT' LIMIT 1"))['id'];

// 4. Buat Employee
mysqli_query($conn, "INSERT IGNORE INTO employees (employee_code, full_name, user_id, department_id, position_id) 
    VALUES ('EMP999', 'Andi Budiman', $user_id, $dept_id, $pos_id)");

$qEmp = mysqli_query($conn, "SELECT id FROM employees WHERE employee_code='EMP999'");
$emp_id = mysqli_fetch_assoc($qEmp)['id'];

// 5. Insert Absensi (biar ada lembur / telat)
$month = date('Y-m');
mysqli_query($conn, "INSERT IGNORE INTO attendance (employee_id, date, status, late_minutes, overtime_minutes) 
    VALUES ($emp_id, '$month-15', 'present', 15, 120)");

echo "Data Dummy Andi Budiman (Karyawan) berhasil dibuat!\n";
