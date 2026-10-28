<?php
require __DIR__ . '/config/database.php';

$columns = [
    "birth_place" => "VARCHAR(100)",
    "birth_date" => "DATE",
    "religion" => "VARCHAR(50)",
    "marital_status" => "VARCHAR(50)",
    "blood_type" => "VARCHAR(10)"
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
