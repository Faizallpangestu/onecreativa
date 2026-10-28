<?php
require 'config/database.php';
$q1 = mysqli_query($conn, "ALTER TABLE employees ADD COLUMN work_type VARCHAR(50) DEFAULT 'WFO'");
$q2 = mysqli_query($conn, "ALTER TABLE employees ADD COLUMN gender ENUM('Laki-laki', 'Perempuan') NULL");
if ($q1 || $q2) {
    echo "Local DB Fixed!";
} else {
    echo "Already fixed or error: " . mysqli_error($conn);
}
