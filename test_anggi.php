<?php
require 'backend/config/database.php';
$q = mysqli_query($conn, "SELECT * FROM employees WHERE full_name LIKE '%anggi%'");
echo json_encode(mysqli_fetch_all($q, MYSQLI_ASSOC));
?>
