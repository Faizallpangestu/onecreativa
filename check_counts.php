<?php
/**
 * Read-only finance integrity audit for production or staging.
 * Run: php check_counts.php
 * This script never inserts, updates, deletes, or posts accounting data.
 */
require __DIR__ . '/backend/config/database.php';

mysqli_report(MYSQLI_REPORT_OFF);

function audit_table_exists(mysqli $conn, string $table): bool {
    $safe = $conn->real_escape_string($table);
    $result = $conn->query("SHOW TABLES LIKE '{$safe}'");
    return $result && $result->num_rows > 0;
}

function audit_scalar(mysqli $conn, string $sql): float {
    $result = $conn->query($sql);
    if (!$result) return 0;
    $row = $result->fetch_row();
    return (float)($row[0] ?? 0);
}

function audit_line(string $label, $value): void {
    echo str_pad($label, 46) . ': ' . $value . PHP_EOL;
}

echo "ONE CREATIVA - FINANCE INTEGRITY AUDIT (READ ONLY)" . PHP_EOL;
echo "Generated: " . date('c') . PHP_EOL . PHP_EOL;

if (audit_table_exists($conn, 'finance_records')) {
    audit_line('Legacy finance records', (int)audit_scalar($conn, 'SELECT COUNT(*) FROM finance_records'));
    audit_line('Legacy income records', (int)audit_scalar($conn, "SELECT COUNT(*) FROM finance_records WHERE type='income'"));
    audit_line('Legacy expense records', (int)audit_scalar($conn, "SELECT COUNT(*) FROM finance_records WHERE type='expense'"));
} else {
    audit_line('Legacy finance_records table', 'MISSING');
}

if (audit_table_exists($conn, 'accounting_transactions')) {
    audit_line('Accounting transactions', (int)audit_scalar($conn, 'SELECT COUNT(*) FROM accounting_transactions'));
    audit_line('Paid/verified without posted journal', (int)audit_scalar($conn, "SELECT COUNT(*) FROM accounting_transactions WHERE payment_status IN ('paid','verified') AND journal_status <> 'posted'"));
    audit_line('Posted accounting transactions', (int)audit_scalar($conn, "SELECT COUNT(*) FROM accounting_transactions WHERE journal_status='posted'"));
} else {
    audit_line('accounting_transactions table', 'MISSING');
}

if (audit_table_exists($conn, 'journal_entries') && audit_table_exists($conn, 'journal_lines')) {
    audit_line('Journal entries', (int)audit_scalar($conn, 'SELECT COUNT(*) FROM journal_entries'));
    audit_line('Posted journals', (int)audit_scalar($conn, "SELECT COUNT(*) FROM journal_entries WHERE status='posted'"));
    audit_line('Unbalanced posted journals', (int)audit_scalar($conn, "SELECT COUNT(*) FROM journal_entries j WHERE j.status='posted' AND (SELECT COALESCE(SUM(l.debit-l.credit),0) FROM journal_lines l WHERE l.journal_entry_id=j.id) <> 0"));
    audit_line('Posted journals with fewer than 2 lines', (int)audit_scalar($conn, "SELECT COUNT(*) FROM journal_entries j WHERE j.status='posted' AND (SELECT COUNT(*) FROM journal_lines l WHERE l.journal_entry_id=j.id) < 2"));
} else {
    audit_line('Journal tables', 'MISSING');
}

if (audit_table_exists($conn, 'financial_report_adjustments')) {
    audit_line('Legacy report adjustments pending migration', (int)audit_scalar($conn, 'SELECT COUNT(*) FROM financial_report_adjustments'));
}

echo PHP_EOL . "Review rules:" . PHP_EOL;
echo "- Any non-zero exception must be resolved or documented before official publication." . PHP_EOL;
echo "- Legacy records are not official accounting until mapped to approved double-entry journals." . PHP_EOL;
echo "- Bank statements, opening balances, receivables, payables, and tax balances require external reconciliation." . PHP_EOL;
