<?php
require_once '../config/database.php';
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0;");
mysqli_query($conn, "DELETE FROM users WHERE email='muhammadfaizal.mf10@gmail.com'");
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 1;");
echo "Done";
