<?php
require 'backend/config/database.php';

$query = "UPDATE payslips 
          SET bpjs_tk = 0, 
              bpjs_kes = 0, 
              bpjs_jp = 0, 
              pph21 = 0, 
              total_potongan = late_penalty, 
              total_salary = base_salary + overtime_pay - late_penalty";

if (mysqli_query($conn, $query)) {
    echo "Database updated successfully.\n";
} else {
    echo "Error updating database: " . mysqli_error($conn) . "\n";
}
?>
