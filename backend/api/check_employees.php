<?php
require '../config/database.php';
$res = mysqli_query($conn, 'SHOW CREATE TABLE employees');
echo json_encode(mysqli_fetch_assoc($res));
?>
