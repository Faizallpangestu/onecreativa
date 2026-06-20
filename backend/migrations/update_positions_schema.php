<?php
require_once __DIR__ . '/../config/database.php';

try {
    mysqli_query($conn, "ALTER TABLE positions ADD COLUMN base_salary DECIMAL(15,2) DEFAULT 0");
    echo "Kolom base_salary di positions siap.\n";
} catch (Exception $e) { 
    echo $e->getMessage();
}
