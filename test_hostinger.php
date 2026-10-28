<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Mengecek Konfigurasi Hostinger...</h2>";

// 1. Cek versi PHP
echo "Versi PHP: " . phpversion() . "<br><br>";

// 2. Load database.php
$db_file = __DIR__ . '/config/database.php';
if (file_exists($db_file)) {
    echo "File database.php ditemukan!<br>";
    require $db_file;
    if (isset($conn) && $conn) {
        echo "<span style='color:green;'>Koneksi Database BERHASIL!</span><br>";
        
        // Cek tabel users
        $check_table = mysqli_query($conn, "SHOW TABLES LIKE 'users'");
        if (mysqli_num_rows($check_table) > 0) {
            echo "<span style='color:green;'>Tabel 'users' ADA!</span><br>";
            
            // Coba test query seperti login.php
            $query = mysqli_query($conn, "SELECT id, email FROM users LIMIT 1");
            if ($query) {
                $user = mysqli_fetch_assoc($query);
                if ($user) {
                    echo "<span style='color:green;'>Query berhasil, ada data user. Email: " . htmlspecialchars($user['email']) . "</span><br>";
                } else {
                    echo "<span style='color:orange;'>Query berhasil tapi tabel users KOSONG.</span><br>";
                }
            } else {
                echo "<span style='color:red;'>Query GAGAL: " . mysqli_error($conn) . "</span><br>";
            }
        } else {
            echo "<span style='color:red;'>Tabel 'users' TIDAK DITEMUKAN! Anda belum import database (.sql).</span><br>";
        }
    } else {
        echo "<span style='color:red;'>Koneksi Database GAGAL. Cek db_env.php Anda!</span><br>";
    }
} else {
    echo "<span style='color:red;'>File config/database.php tidak ditemukan di path: $db_file</span><br>";
    echo "Struktur folder Anda mungkin salah.<br>";
}
?>
