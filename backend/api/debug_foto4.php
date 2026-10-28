<?php
require_once 'cors.php';
require_once '../config/database.php';

$email = "nopelaprasica22@gmail.com"; // using a likely email structure, or we can just fetch all users that have a foto_profil in peserta_intensif

$query = mysqli_query($conn, "
SELECT users.*, roles.name as role_name, employees.full_name, employees.gender, employees.photo_url as photo, employees.employee_code, employees.id as employee_id, employees.position, employees.work_type, pi.foto_profil as foto_profil, pi.nama_lengkap
FROM users 
LEFT JOIN roles ON users.role_id = roles.id
LEFT JOIN employees ON employees.user_id = users.id
LEFT JOIN peserta_intensif pi ON pi.email = users.email
WHERE pi.nama_lengkap LIKE '%NOPELA%'
LIMIT 1
");

if (!$query) {
    die("SQL ERROR: " . mysqli_error($conn));
}
$data = mysqli_fetch_assoc($query);
echo json_encode($data);
