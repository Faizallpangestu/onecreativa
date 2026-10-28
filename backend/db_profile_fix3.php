<?php
require __DIR__ . '/config/database.php';

$columns = [
    "bpjs_tk" => "VARCHAR(50)",
    "bpjs_kes" => "VARCHAR(50)"
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
