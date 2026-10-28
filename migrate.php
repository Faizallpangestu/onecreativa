<?php
require 'backend/config/database.php';
$sql = "ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_type ENUM('WFO', 'WFH') DEFAULT 'WFO' AFTER base_salary";
if(mysqli_query($conn, $sql)) {
    echo "Success adding work_type column.\n";
} else {
    echo "Error: " . mysqli_error($conn) . "\n";
}
?>
