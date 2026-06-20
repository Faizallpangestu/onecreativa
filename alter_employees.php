<?php
require 'backend/config/database.php';
$query = "ALTER TABLE employees ADD COLUMN gender ENUM('Laki-laki', 'Perempuan') NULL AFTER full_name";
if (mysqli_query($conn, $query)) {
    echo "Column 'gender' added successfully\n";
} else {
    echo "Error adding column: " . mysqli_error($conn) . "\n";
}
