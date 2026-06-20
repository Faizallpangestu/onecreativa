<?php
require 'config/database.php';

// Cek apakah role admin ada
$res = mysqli_query($conn, "SELECT id FROM roles WHERE name='admin'");
$role = mysqli_fetch_assoc($res);

if (!$role) {
    mysqli_query($conn, "INSERT INTO roles (name) VALUES ('admin')");
    $role_id = mysqli_insert_id($conn);
    echo "Role admin created. ID: $role_id\n";
} else {
    $role_id = $role['id'];
    echo "Role admin found. ID: $role_id\n";
}

$email = 'admin@onecreativa.com';
$password = md5('adminerp123');

// Cek apakah user ada
$res2 = mysqli_query($conn, "SELECT id FROM users WHERE email='$email'");
if (mysqli_num_rows($res2) > 0) {
    mysqli_query($conn, "UPDATE users SET password='$password', role_id=$role_id WHERE email='$email'");
    echo "User admin updated.\n";
} else {
    mysqli_query($conn, "INSERT INTO users (name, email, password, role_id) VALUES ('Super Admin', '$email', '$password', $role_id)");
    echo "User admin created.\n";
}
