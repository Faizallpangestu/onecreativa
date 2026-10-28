<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, 'SELECT * FROM settings LIMIT 1');
echo json_encode(mysqli_fetch_assoc($res));
?>
