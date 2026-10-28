<?php
require 'backend/config/database.php';
mysqli_query($conn, "DELETE FROM attendance_logs WHERE employee_id=7 AND date='2026-06-26'");
echo "Deleted";
?>
