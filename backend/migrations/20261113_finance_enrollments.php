<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if (in_array('--dry-run', $argv, true)) {
    echo "BE-03: add student_external_identities, student_enrollments, enrollment_charges, invoice_sequences and reconciliation view. No legacy identity backfill or invoice/payment updates. Requires maintenance window and reviewed backup. Run with --apply after review.\n";
    exit;
}
if (!in_array('--apply', $argv, true) && !in_array('--rollback-empty', $argv, true)) { fwrite(STDERR, "Use --dry-run, --apply or --rollback-empty after reviewing the migration/recovery guide.\n"); exit(1); }
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/enrollment_schema.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
if (in_array('--rollback-empty', $argv, true)) {
    enrollment_schema_rollback_empty($conn);
    echo "Empty BE-03 schema removed. Historical billing/payment rows preserved.\n";
    exit;
}
enrollment_schema_install($conn);
echo "BE-03 schema installed. Existing invoices require explicit enrollment reconciliation; no historical rows changed.\n";
