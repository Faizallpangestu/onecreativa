<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, 'SHOW COLUMNS FROM employees');
echo "EMPLOYEES TABLE:\n";
while($r = mysqli_fetch_assoc($res)) { echo $r['Field'] . " - " . $r['Type'] . "\n"; }

$res2 = mysqli_query($conn, 'SHOW COLUMNS FROM users');
echo "\nUSERS TABLE:\n";
while($r = mysqli_fetch_assoc($res2)) { echo $r['Field'] . " - " . $r['Type'] . "\n"; }
