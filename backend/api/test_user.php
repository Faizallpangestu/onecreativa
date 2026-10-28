<?php
require 'config/database.php';

$email = 'muhammadfaizal.mf10@gmail.com';
$password = '2260005';

$query = mysqli_query($conn, "SELECT * FROM users WHERE email='$email'");
$user = mysqli_fetch_assoc($query);

if (!$user) {
    echo "User not found in local DB!";
} else {
    echo "User found: " . $user['email'] . "<br>";
    echo "Hash in DB: " . $user['password_hash'] . "<br>";
    
    if (password_verify($password, $user['password_hash'])) {
        echo "Password matches (Bcrypt)!<br>";
    } elseif (md5($password) === $user['password_hash']) {
        echo "Password matches (MD5)!<br>";
    } else {
        echo "Password MISMATCH! To fix it, run this script again and it will reset it to 2260005.";
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        mysqli_query($conn, "UPDATE users SET password_hash='$newHash' WHERE email='$email'");
    }
}
