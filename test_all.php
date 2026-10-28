<?php
require 'backend/config/database.php';
$q = mysqli_query($conn, "SELECT full_name, work_type FROM employees");
echo json_encode(mysqli_fetch_all($q, MYSQLI_ASSOC));
?>
