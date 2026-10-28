<?php
require __DIR__ . '/api/config/database.php';
mysqli_query($conn, "ALTER TABLE daily_reports ADD COLUMN notes TEXT NULL AFTER tasks");
echo "Done";
?>
