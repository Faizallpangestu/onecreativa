<?php
header('Content-Type: application/json');
require __DIR__ . '/../config/database.php';

$out = [];
$q = mysqli_query($conn, "SHOW VARIABLES LIKE 'collation_connection'");
$row = mysqli_fetch_assoc($q);
$out['collation_connection'] = $row['Value'] ?? null;

$q = mysqli_query($conn, "SHOW VARIABLES LIKE 'character_set_connection'");
$row = mysqli_fetch_assoc($q);
$out['character_set_connection'] = $row['Value'] ?? null;

$q = mysqli_query($conn, "SHOW VARIABLES LIKE 'collation_database'");
$row = mysqli_fetch_assoc($q);
$out['collation_database'] = $row['Value'] ?? null;

$sql = "SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND ((TABLE_NAME = 'users' AND COLUMN_NAME = 'email')
       OR (TABLE_NAME = 'employees' AND COLUMN_NAME = 'employee_code'))";

$cols = [];
$res = mysqli_query($conn, $sql);
while ($r = mysqli_fetch_assoc($res)) {
    $cols[] = $r;
}
$out['columns'] = $cols;

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
