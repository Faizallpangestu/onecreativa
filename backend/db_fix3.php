<?php
require __DIR__ . '/api/config/database.php';
$res = mysqli_query($conn, "SELECT id, email FROM users WHERE id = 7");
print_r(mysqli_fetch_assoc($res));
?>
