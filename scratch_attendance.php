<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, 'DESCRIBE employees');
echo json_encode(mysqli_fetch_all($res, MYSQLI_ASSOC), JSON_PRETTY_PRINT);
