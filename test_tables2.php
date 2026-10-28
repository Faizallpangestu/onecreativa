<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, "SELECT table_name FROM information_schema.columns WHERE column_name = 'user_id' AND table_schema = DATABASE()");
echo json_encode(mysqli_fetch_all($res, MYSQLI_ASSOC));
?>
