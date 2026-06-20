<?php
require __DIR__ . '/config/database.php';

$sql1 = "ALTER TABLE employees ADD COLUMN leave_balance INT DEFAULT 12";
if (mysqli_query($conn, $sql1)) {
    echo "Added leave_balance to employees.\n";
} else {
    echo "Error or already exists: " . mysqli_error($conn) . "\n";
}

$sql2 = "CREATE TABLE IF NOT EXISTS leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    category VARCHAR(50),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    attachment VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approver_role VARCHAR(50)
)";
if (mysqli_query($conn, $sql2)) {
    echo "Created leaves table.\n";
} else {
    echo "Error creating leaves table: " . mysqli_error($conn) . "\n";
}
