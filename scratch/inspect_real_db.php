<?php
require __DIR__ . '/../backend/config/database.php';
$tables = ['invoice_clients', 'invoice_records', 'billing_invoices', 'billing_pembayaran', 'salary_requests', 'finance_records', 'budget_requests', 'budget_realizations'];
foreach ($tables as $t) {
    $res = $conn->query("SELECT COUNT(*) FROM $t");
    echo "$t: " . ($res ? $res->fetch_row()[0] : 'ERROR') . " rows\n";
}

$ir = $conn->query("SELECT * FROM invoice_records LIMIT 5");
if ($ir && $ir->num_rows > 0) {
    echo "\nSample invoice_records:\n";
    while ($row = $ir->fetch_assoc()) {
        print_r($row);
    }
}

$fr = $conn->query("SELECT * FROM finance_records LIMIT 5");
if ($fr && $fr->num_rows > 0) {
    echo "\nSample finance_records:\n";
    while ($row = $fr->fetch_assoc()) {
        print_r($row);
    }
}
