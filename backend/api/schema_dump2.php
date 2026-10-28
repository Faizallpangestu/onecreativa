<?php
require '../config/database.php';

$query = mysqli_query($conn, "SHOW COLUMNS FROM employees");
$cols = [];
while ($row = mysqli_fetch_assoc($query)) {
    $cols[] = $row;
}
echo json_encode($cols);
?>
