<?php
require 'backend/config/database.php';

// Add columns safely
$columns = [
    "department_id" => "INT NULL",
    "level" => "VARCHAR(50) DEFAULT 'Staff'",
    "tunjangan" => "DECIMAL(15,2) DEFAULT 0",
    "is_active" => "TINYINT(1) DEFAULT 1",
    "description" => "TEXT NULL"
];

foreach ($columns as $col => $def) {
    mysqli_query($conn, "ALTER TABLE positions ADD COLUMN $col $def");
}

echo "Positions table updated\n";
