<?php
require 'backend/config/database.php';
$query = "CREATE TABLE IF NOT EXISTS positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
)";
if (mysqli_query($conn, $query)) {
    echo "Table positions created successfully\n";
} else {
    echo "Error creating table: " . mysqli_error($conn) . "\n";
}
