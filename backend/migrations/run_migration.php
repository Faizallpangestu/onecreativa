<?php
/**
 * Script ini menjalankan migration untuk menambah kolom 'photo'.
 * Akses via browser: http://localhost/hris-creativa/backend/migrations/run_migration.php
 * Atau jalankan: php run_migration.php
 */

require '../config/database.php';

$result = mysqli_query($conn, "SHOW COLUMNS FROM employees LIKE 'photo'");

if (mysqli_num_rows($result) > 0) {
    echo "✅ Kolom 'photo' sudah ada di tabel employees. Tidak perlu diubah.\n";
} else {
    $alter = mysqli_query($conn, "ALTER TABLE employees ADD COLUMN photo VARCHAR(255) DEFAULT NULL AFTER email");

    if ($alter) {
        echo "✅ Kolom 'photo' berhasil ditambahkan ke tabel employees!\n";
    } else {
        echo "❌ Gagal menambahkan kolom: " . mysqli_error($conn) . "\n";
    }
}

mysqli_close($conn);
