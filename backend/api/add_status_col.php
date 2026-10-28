<?php
require '../config/database.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    mysqli_query($conn, "ALTER TABLE payslips ADD COLUMN status ENUM('draft', 'published') DEFAULT 'draft'");
    echo "Column added.";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
