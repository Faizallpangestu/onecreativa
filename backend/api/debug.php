<?php
require '../config/database.php';
$q = mysqli_query($conn, "SHOW COLUMNS FROM employees");
$cols = [];
while ($r = mysqli_fetch_assoc($q)) {
    $cols[] = $r['Field'];
}
echo json_encode($cols);
