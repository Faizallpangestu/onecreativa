<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, "SHOW INDEX FROM attendance_logs");
echo json_encode(mysqli_fetch_all($res, MYSQLI_ASSOC));
?>
