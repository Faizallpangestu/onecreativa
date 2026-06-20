<?php
require_once __DIR__ . '/../config/database.php';

try {
    // Cari jabatan unik yang ada di karyawan tapi belum ada di tabel positions
    $query = mysqli_query($conn, "
        INSERT INTO positions (name, base_salary)
        SELECT DISTINCT position, 0 FROM employees 
        WHERE position IS NOT NULL AND position != '' 
        AND position NOT IN (SELECT name FROM positions)
    ");
    echo "Tabel positions berhasil diisi dari data karyawan eksisting.";
} catch (Exception $e) { 
    echo $e->getMessage();
}
