<?php
require_once __DIR__ . '/../config/database.php';

try {
    mysqli_query($conn, "ALTER TABLE employees ADD COLUMN base_salary DECIMAL(15,2) DEFAULT NULL");
    echo "Kolom base_salary di employees siap.\n";
} catch (Exception $e) { }

try {
    mysqli_query($conn, "ALTER TABLE payslips ADD COLUMN status ENUM('draft', 'published') DEFAULT 'draft'");
    echo "Kolom status di payslips siap.\n";
} catch (Exception $e) { }

echo "Migrasi database selesai.\n";
