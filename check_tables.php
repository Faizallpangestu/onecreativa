<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, 'SHOW COLUMNS FROM attendance_logs');
echo "ATTENDANCE_LOGS TABLE:\n";
if ($res) while($r = mysqli_fetch_assoc($res)) { echo $r['Field'] . "\n"; }

$res2 = mysqli_query($conn, 'SHOW COLUMNS FROM leave_requests');
echo "\nLEAVE_REQUESTS TABLE:\n";
if ($res2) while($r = mysqli_fetch_assoc($res2)) { echo $r['Field'] . "\n"; }
