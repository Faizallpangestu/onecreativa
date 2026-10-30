<?php
require __DIR__ . '/../backend/config/database.php';
$tables = ['accounts', 'cash_bank_accounts', 'journal_entries', 'journal_lines', 'billing_invoices', 'billing_pembayaran', 'salary_requests', 'salaries', 'reimbursements', 'budget_requests', 'budget_realizations', 'finance_records', 'vendor_bills'];
foreach ($tables as $t) {
    $check = $conn->query("SHOW TABLES LIKE '$t'");
    if ($check && $check->num_rows > 0) {
        $cnt = $conn->query("SELECT COUNT(*) FROM $t")->fetch_row()[0];
        echo "$t: $cnt rows\n";
    } else {
        echo "$t: NOT FOUND\n";
    }
}
