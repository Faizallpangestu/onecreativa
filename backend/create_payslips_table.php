<?php
require_once __DIR__ . '/config/database.php';

$sql = "CREATE TABLE IF NOT EXISTS payslips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month VARCHAR(10) NOT NULL,
    base_salary DECIMAL(15,2) DEFAULT 0,
    late_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    late_penalty DECIMAL(15,2) DEFAULT 0,
    overtime_pay DECIMAL(15,2) DEFAULT 0,
    bpjs_tk DECIMAL(15,2) DEFAULT 0,
    bpjs_kes DECIMAL(15,2) DEFAULT 0,
    bpjs_jp DECIMAL(15,2) DEFAULT 0,
    pph21 DECIMAL(15,2) DEFAULT 0,
    total_potongan DECIMAL(15,2) DEFAULT 0,
    total_salary DECIMAL(15,2) DEFAULT 0,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY emp_month (employee_id, month)
)";

if (mysqli_query($conn, $sql)) {
    echo "Tabel payslips berhasil dibuat!\n";
} else {
    echo "Gagal membuat tabel payslips: " . mysqli_error($conn) . "\n";
}
