<?php
require_once 'cors.php';
require_once '../config/database.php';

$query = mysqli_query($conn, "
SELECT users.id, users.email, users.name, pi.foto_profil, pi.nama_lengkap 
FROM users 
LEFT JOIN peserta_intensif pi ON pi.email = users.email 
WHERE users.name LIKE '%NOPELA%'
");

if (!$query) {
    die("SQL ERROR: " . mysqli_error($conn));
}

$data = [];
while ($row = mysqli_fetch_assoc($query)) {
    $data[] = $row;
}
echo json_encode($data);
