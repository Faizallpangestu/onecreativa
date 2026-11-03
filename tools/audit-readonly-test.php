<?php
// Database-free regression: no configuration imports, connections or writes.
require_once __DIR__ . '/../check_counts.php';
class AuditFakeResult {
    private $row;
    function __construct($row) { $this->row = $row; }
    function fetch_row() { return $this->row; }
}
class AuditFakeConnection {
    public $value = ['0'];
    public array $queries = [];
    function real_escape_string($s) { return $s; }
    function query($sql) {
        $this->queries[] = $sql;
        return $this->value === false ? false : new AuditFakeResult($this->value);
    }
}
function verify($condition, $message) {
    if (!$condition) throw new RuntimeException($message);
}
$db = new AuditFakeConnection();
verify(audit_scalar($db, 'SELECT COUNT(*)') === 0.0, 'Real zero must remain zero');
foreach ([false, null, [null], ['not numeric']] as $bad) {
    $db->value = $bad;
    $failed = false;
    try { audit_scalar($db, 'SELECT broken'); } catch (RuntimeException $e) { $failed = true; }
    verify($failed, 'SQL failure or missing value must throw');
}
$db->value = ['1'];
ob_start();
audit_report($db);
$report = ob_get_clean();
$sql = implode("\n", $db->queries);
verify(str_contains($sql, "journal_status IS NULL OR journal_status <> 'posted'"), 'NULL status included');
verify(str_contains($sql, 't.legacy_finance_id=f.id'), 'Historical linkage checked');
verify(str_contains($sql, "TRIM(COALESCE(photo_path,''))"), 'Legacy proof gaps checked');
verify(str_contains($sql, "p.status='open'"), 'Historical period flag checked');
verify(str_contains($report, 'cutover strategy/date'), 'Cutover unresolved explicitly');
$db->value = ['0'];
ob_start();
audit_report($db);
$missing = ob_get_clean();
verify(str_contains($missing, 'MISSING'), 'Missing tables visible');
// Exercise the CLI failure path without ever attempting a connection.
putenv('DB_HOST');
verify(audit_run() === 1, 'Failure returns nonzero status');
echo "PASS: audit regression checks (no database accessed)\n";
