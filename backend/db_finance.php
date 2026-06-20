<?php
require __DIR__ . '/config/database.php';

$sql = "CREATE TABLE IF NOT EXISTS finance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(100) DEFAULT 'Lainnya',
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (mysqli_query($conn, $sql)) {
    echo "Created finance_records table.\n";
} else {
    echo "Error creating table: " . mysqli_error($conn) . "\n";
}
