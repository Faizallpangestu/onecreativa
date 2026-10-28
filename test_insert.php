<?php
require 'backend/config/database.php';
$q = mysqli_query($conn, "INSERT INTO attendance_logs (employee_id, date, check_in_at, status, face_verified, check_in_lat, check_in_lng, notes) VALUES (7, '2026-06-26', '2026-06-26 08:00:00', 'present', 1, NULL, NULL, NULL)");
echo mysqli_error($conn);
if ($q) echo "OK";
?>
