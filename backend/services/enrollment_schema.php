<?php
require_once __DIR__.'/accounting_core.php';

// Explicit migration only. Creation endpoints must never run this DDL.
function enrollment_schema_install(mysqli $db): void {
    if (ac_table($db, 'schema_migrations')) {
        $applied = ac_one($db, 'SELECT checksum FROM schema_migrations WHERE version=?', ['finance_enrollments_v1']);
        if ($applied && $applied['checksum'] !== hash_file('sha256', __FILE__)) ac_fail('Migration checksum changed; review a new version before applying.', 409);
    }
    foreach (['peserta_intensif', 'billing_invoices'] as $table) {
        $info = ac_one($db, 'SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [$table]);
        if (($info['ENGINE'] ?? '') !== 'InnoDB') ac_fail('Migration requires existing InnoDB '.$table, 409);
    }
    $student = ac_one($db, "SHOW COLUMNS FROM peserta_intensif LIKE 'id'");
    if (!preg_match('/^int(?:\(\d+\))?( unsigned)?$/D', $student['Type'] ?? '')) ac_fail('Unsupported student ID type; review migration.', 409);
    $studentType = $student['Type'];
    $invoice = ac_one($db, "SELECT COLUMN_TYPE,CHARACTER_SET_NAME,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='billing_invoices' AND COLUMN_NAME='id'");
    if (($invoice['COLUMN_TYPE'] ?? '') !== 'varchar(50)' || !preg_match('/^[a-z0-9_]+$/D', ($invoice['CHARACTER_SET_NAME'] ?? '').($invoice['COLLATION_NAME'] ?? ''))) ac_fail('Unsupported invoice key; review migration.', 409);
    $invoiceType = 'VARCHAR(50) CHARACTER SET '.$invoice['CHARACTER_SET_NAME'].' COLLATE '.$invoice['COLLATION_NAME'];
    $duplicates = ac_one($db, 'SELECT id FROM billing_invoices GROUP BY id HAVING COUNT(*)>1 LIMIT 1');
    if ($duplicates) ac_fail('Duplicate legacy invoice numbers require reconciliation.', 409);
    $unique = ac_one($db, "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='billing_invoices' AND NON_UNIQUE=0 GROUP BY INDEX_NAME HAVING COUNT(*)=1 AND MAX(COLUMN_NAME)='id'");
    if (!$unique) ac_fail('billing_invoices.id requires an existing unique index; review conflicts first.', 409);
    $db->query("CREATE TABLE IF NOT EXISTS student_external_identities (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, student_id $studentType NOT NULL,
        source VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        external_student_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_external(source,external_student_id),
        FOREIGN KEY(student_id) REFERENCES peserta_intensif(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB");
    $db->query("CREATE TABLE IF NOT EXISTS student_enrollments (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, student_id $studentType NOT NULL,
        source VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        external_enrollment_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        program_id VARCHAR(60) NULL, cohort VARCHAR(100) NULL, payment_scheme VARCHAR(20) NULL,
        enrollment_status VARCHAR(30) NOT NULL DEFAULT 'needs_review', review_reason VARCHAR(100) NOT NULL DEFAULT '',
        pricing_snapshot LONGTEXT NULL, pricing_hash CHAR(64) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_enrollment_external(source,external_enrollment_id), INDEX(student_id),
        FOREIGN KEY(student_id) REFERENCES peserta_intensif(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB");
    $db->query("CREATE TABLE IF NOT EXISTS enrollment_charges (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, enrollment_id BIGINT UNSIGNED NOT NULL,
        charge_type VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        charge_key VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        amount DECIMAL(15,2) NOT NULL, policy_snapshot LONGTEXT NOT NULL, policy_hash CHAR(64) NOT NULL,
        billing_invoice_id $invoiceType NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_enrollment_charge(enrollment_id,charge_type,charge_key), UNIQUE KEY uq_charge_invoice(billing_invoice_id),
        FOREIGN KEY(enrollment_id) REFERENCES student_enrollments(id) ON DELETE RESTRICT,
        FOREIGN KEY(billing_invoice_id) REFERENCES billing_invoices(id) ON DELETE RESTRICT,
        CHECK(amount>0)
    ) ENGINE=InnoDB");
    $db->query("CREATE TABLE IF NOT EXISTS invoice_sequences(prefix CHAR(8) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,next_value INT UNSIGNED NOT NULL,CHECK(next_value BETWEEN 1 AND 10000)) ENGINE=InnoDB");
    foreach (['student_external_identities' => ['source,external_student_id'], 'student_enrollments' => ['source,external_enrollment_id'], 'enrollment_charges' => ['enrollment_id,charge_type,charge_key', 'billing_invoice_id'], 'invoice_sequences' => ['prefix']] as $table => $required) {
        $indexes = array_column(ac_rows($db, 'SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND NON_UNIQUE=0 GROUP BY INDEX_NAME', [$table]), 'cols');
        foreach ($required as $columns) if (!in_array($columns, $indexes, true)) ac_fail('Missing required uniqueness on '.$table.'. Review partial migration.', 409);
        if (($table === 'student_enrollments' && in_array('student_id', $indexes, true)) || ($table === 'enrollment_charges' && in_array('enrollment_id', $indexes, true))) ac_fail('Unexpected one-enrollment/student or one-charge/enrollment constraint. Review migration.', 409);
    }
    foreach ([['student_external_identities','student_id','peserta_intensif'],['student_enrollments','student_id','peserta_intensif'],['enrollment_charges','enrollment_id','student_enrollments'],['enrollment_charges','billing_invoice_id','billing_invoices']] as [$table,$column,$parent]) {
        if (!ac_one($db, "SELECT k.CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.COLUMN_NAME=? AND k.REFERENCED_TABLE_NAME=? AND k.REFERENCED_COLUMN_NAME='id' AND r.DELETE_RULE IN ('RESTRICT','NO ACTION')", [$table,$column,$parent])) ac_fail('Missing restrictive ownership FK on '.$table.'. Review partial migration.',409);
    }
    // Initial high-water marks only, under deployment maintenance. Runtime allocation locks a sequence row.
    $db->query("INSERT INTO invoice_sequences(prefix,next_value) SELECT LEFT(id,8),MAX(CAST(RIGHT(id,4) AS UNSIGNED))+1 FROM billing_invoices WHERE id REGEXP '^TGCJ[0-9]{8}$' GROUP BY LEFT(id,8) ON DUPLICATE KEY UPDATE next_value=GREATEST(next_value,VALUES(next_value))");
    $db->query("CREATE OR REPLACE VIEW enrollment_invoice_reconciliation AS SELECT i.id AS billing_invoice_id,'needs_review' AS enrollment_status FROM billing_invoices i LEFT JOIN enrollment_charges c ON c.billing_invoice_id=i.id WHERE c.id IS NULL");
    $db->query('CREATE TABLE IF NOT EXISTS schema_migrations(version VARCHAR(100) PRIMARY KEY,checksum CHAR(64) NOT NULL,applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    ac_query($db, 'INSERT IGNORE INTO schema_migrations(version,checksum) VALUES(?,?)', ['finance_enrollments_v1', hash_file('sha256', __FILE__)]);
}

function enrollment_schema_rollback_empty(mysqli $db): void {
    foreach (['enrollment_charges', 'student_enrollments', 'student_external_identities'] as $table) if (ac_table($db, $table) && (int)ac_one($db, "SELECT COUNT(*) AS n FROM $table")['n'] !== 0) ac_fail('Rollback refused: enrollment/charge data exists. Preserve tables and use forward recovery.', 409);
    if (ac_table($db, 'billing_invoices') && ac_one($db, "SELECT id FROM billing_invoices WHERE JSON_VALID(meta_json) AND JSON_EXTRACT(meta_json,'$.enrollment_id') IS NOT NULL LIMIT 1")) ac_fail('Rollback refused: issued enrollment invoice exists.', 409);
    $db->query('DROP VIEW IF EXISTS enrollment_invoice_reconciliation');
    foreach (['enrollment_charges', 'student_enrollments', 'student_external_identities', 'invoice_sequences'] as $table) $db->query("DROP TABLE IF EXISTS $table");
    if (ac_table($db, 'schema_migrations')) ac_query($db, 'DELETE FROM schema_migrations WHERE version=?', ['finance_enrollments_v1']);
}
