<?php
require 'backend/config/database.php';
$q = mysqli_query($conn, "SELECT * FROM attendance_logs WHERE date='" . date('Y-m-d') . "'");
echo json_encode(mysqli_fetch_all($q, MYSQLI_ASSOC));
?>
