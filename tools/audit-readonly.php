<?php
/** Audit-only helpers; importing this file never connects or writes. */
function audit_run(): int {
    $conn = null;
    $level = ob_get_level();
    try {
        foreach (['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'] as $key) {
            if (getenv($key) === false) throw new RuntimeException('Missing connection environment.');
        }
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        $conn = mysqli_init();
        $conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
        $conn->real_connect(getenv('DB_HOST'), getenv('DB_USER'), getenv('DB_PASS'), getenv('DB_NAME'), (int)(getenv('DB_PORT') ?: 3306));
        $conn->set_charset('utf8mb4');
        $conn->query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $conn->query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
        ob_start();
        audit_report($conn);
        $conn->rollback();
        ob_end_flush();
        return 0;
    } catch (Throwable $e) {
        while (ob_get_level() > $level) ob_end_clean();
        fwrite(STDERR, 'AUDIT FAILED: ' . get_class($e) . ' (code ' . $e->getCode() . '). No complete report; check connection, schema and permissions.' . PHP_EOL);
        return 1;
    } finally {
        if ($conn) $conn->close();
    }
}

function audit_review_coverage($conn): void {
    $legacy = audit_table_exists($conn, 'finance_records');
    $transactions = audit_table_exists($conn, 'accounting_transactions');
    $journals = audit_table_exists($conn, 'journal_entries');
    if ($journals) audit_line('Unknown/null journal entry status', audit_scalar($conn, "SELECT COUNT(*) FROM journal_entries WHERE status IS NULL OR status NOT IN ('draft','posted')"));
    if ($transactions) {
        audit_line('Paid/verified missing actual posted journal', audit_scalar($conn, $journals
            ? "SELECT COUNT(*) FROM accounting_transactions t WHERE payment_status IN ('paid','verified') AND NOT EXISTS (SELECT 1 FROM journal_entries j WHERE j.id=t.journal_entry_id AND j.status='posted')"
            : "SELECT COUNT(*) FROM accounting_transactions WHERE payment_status IN ('paid','verified')"));
        audit_line('Transactions missing proof reference', audit_scalar($conn, "SELECT COUNT(*) FROM accounting_transactions WHERE TRIM(COALESCE(attachment_key,''))='' AND TRIM(COALESCE(attachment_link,''))=''"));
    }
    if ($legacy) {
        audit_line('Legacy missing linked posted journal', audit_scalar($conn, $transactions && $journals
            ? "SELECT COUNT(*) FROM finance_records f WHERE NOT EXISTS (SELECT 1 FROM accounting_transactions t JOIN journal_entries j ON j.id=t.journal_entry_id AND j.status='posted' WHERE t.legacy_finance_id=f.id)"
            : 'SELECT COUNT(*) FROM finance_records'));
        audit_line('Legacy missing proof reference', audit_scalar($conn, "SELECT COUNT(*) FROM finance_records WHERE TRIM(COALESCE(photo_path,''))='' AND TRIM(COALESCE(drive_link,''))=''"));
        audit_line('Legacy without open historical period', audit_scalar($conn, audit_table_exists($conn, 'accounting_periods')
            ? "SELECT COUNT(*) FROM finance_records f WHERE NOT EXISTS (SELECT 1 FROM accounting_periods p WHERE p.month=DATE_FORMAT(f.transaction_date,'%Y-%m') AND p.status='open')"
            : 'SELECT COUNT(*) FROM finance_records'));
    }
    echo "- REVIEW REQUIRED: COA mapping and cutover strategy/date are not approved or inferred here." . PHP_EOL;
    echo "- Historical period gaps require review, not automatic reopening/backdating." . PHP_EOL;
    echo "- Proof references are not proof verification; journal links do not certify amounts or completeness." . PHP_EOL;
    echo "- Missing tables mean unavailable coverage, never a clean zero. Adjustment counts are inventory, not verified migration disposition." . PHP_EOL;
}
