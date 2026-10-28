<?php
require 'backend/config/database.php';
$q = mysqli_query($conn, "SELECT * FROM attendance_logs WHERE employee_id=7 AND date='2026-06-26'");
echo json_encode(mysqli_fetch_all($q, MYSQLI_ASSOC));
?>
