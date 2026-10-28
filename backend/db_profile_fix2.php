<?php
require __DIR__ . '/config/database.php';

$columns = [
    "phone" => "VARCHAR(20)",
    "address" => "TEXT",
    "city" => "VARCHAR(100)",
    "emergency_name" => "VARCHAR(100)",
    "emergency_relation" => "VARCHAR(50)",
    "emergency_phone" => "VARCHAR(20)",
    "npwp" => "VARCHAR(50)",
    "bank_name" => "VARCHAR(50)",
    "bank_account" => "VARCHAR(50)"
];

foreach ($columns as $col => $type) {
    $sql = "ALTER TABLE employees ADD COLUMN $col $type";
    if (mysqli_query($conn, $sql)) {
        echo "Added $col to employees.\n";
    } else {
        echo "Error or already exists for $col: " . mysqli_error($conn) . "\n";
    }
}
?>
