<?php
function billing_integration_checks(mysqli $db, string $testName, array $base, callable $send, string $cookie, string $csrf): void {
    require_once __DIR__.'/../services/student_billing.php';
    $create = fn(array $patch) => $send('billing.php', array_replace($base, ['id' => 'HARDEN-'.bin2hex(random_bytes(5))], $patch), $cookie, $csrf);
    $link = fn(array $patch) => $send('student_billing.php', array_replace(['action' => 'link', 'student_id' => 1, 'billing_invoice_id' => 'INV-VALID'], $patch), $cookie, $csrf);
    $auditCount = fn() => ac_one($db, "SELECT COUNT(*) AS n FROM accounting_audit_logs WHERE entity_type IN ('billing_invoice','student_invoice_link')")['n'];
    $beforeInvoices = ac_one($db, 'SELECT COUNT(*) AS n FROM billing_invoices')['n'];
    $beforeAudit = $auditCount();
    foreach ([3 => 'inactive COA', 4 => 'noncash COA', 5 => 'missing official holder'] as $id => $label) {
        billing_check($create(['bank_account_id' => $id])['code'] === 409, "Official bank configuration rejects $label");
    }
    $db->query('ALTER TABLE cash_bank_accounts CHANGE account_holder unavailable_holder VARCHAR(255)');
    billing_check($create(['account_holder' => 'Client cannot fill official gap'])['code'] === 409, 'Missing official holder column fails closed even with client holder');
    $db->query('ALTER TABLE cash_bank_accounts CHANGE unavailable_holder account_holder VARCHAR(255)');
    foreach (['cash_bank_accounts', 'accounts'] as $table) {
        $db->query("RENAME TABLE `$table` TO `unavailable_$table`");
        billing_check($create([])['code'] === 409, "Missing $table master fails closed");
        $db->query("RENAME TABLE `unavailable_$table` TO `$table`");
    }
    foreach (['bank_name', 'account_number'] as $field) {
        $value = ac_one($db, "SELECT `$field` AS value FROM cash_bank_accounts WHERE id=1")['value'];
        $db->query("UPDATE cash_bank_accounts SET `$field`='' WHERE id=1");
        billing_check($create([])['code'] === 409, "Missing official $field fails closed");
        ac_query($db, "UPDATE cash_bank_accounts SET `$field`=? WHERE id=1", [$value]);
    }
    billing_check(ac_one($db, 'SELECT COUNT(*) AS n FROM billing_invoices')['n'] === $beforeInvoices && $auditCount() === $beforeAudit, 'Rejected bank metadata persists neither invoice nor creation audit');
    billing_check($create(['bank_name' => 'Bank Uji', 'account_number' => '000123456', 'account_holder' => 'Pemilik Resmi Uji'])['code'] === 200, 'Matching optional bank assertions are accepted against official source');

    billing_check($link(['student_id' => 2, 'invoice_student_id' => 2, 'meta_json' => '{"student_id":2}'])['code'] === 409, 'First cross-student link and request ownership spoof are rejected');
    billing_check(!ac_one($db, "SELECT id FROM student_invoice_links WHERE billing_invoice_id='INV-VALID'"), 'Rejected ownership attempt creates no relationship');
    $linked = $link([]);
    billing_check($linked['code'] === 200 && $link([])['json']['data']['id'] === $linked['json']['data']['id'], 'Persisted matching invoice owner links successfully and retries idempotently');
    $id = (int)$linked['json']['data']['id'];
    billing_check($link(['student_id' => 2])['code'] === 409, 'An existing invoice link cannot change students');
    $db->query("UPDATE student_invoice_links SET student_id=2 WHERE id=$id");
    billing_check($link(['student_id' => 2])['code'] === 409, 'Even an existing conflicting link cannot override the invoice owner');
    try {
        sb_bill($db, ac_one($db, 'SELECT * FROM student_invoice_links WHERE id=?', [$id]));
        throw new RuntimeException('Conflicting relationship was readable');
    } catch (AccountingException $error) {
        billing_check($error->getCode() === 409, 'Read/payment source validation also blocks a persisted cross-student link');
    }
    $db->query("UPDATE student_invoice_links SET student_id=1 WHERE id=$id");
    billing_check($link(['billing_invoice_id' => 'OLD-0', 'student_id' => 1])['code'] === 409, 'Unknown legacy owner cannot be inferred from request, name or email');
    ac_query($db, 'INSERT INTO student_invoice_links(student_id,billing_invoice_id,linked_by) VALUES(1,?,1)', ['OLD-1']);
    $oldId = (int)$db->insert_id;
    billing_check($link(['billing_invoice_id' => 'OLD-1'])['json']['data']['id'] == $oldId && $link(['billing_invoice_id' => 'OLD-1', 'student_id' => 2])['code'] === 409, 'Legacy existing link retains same-student retry and rejects reassignment');
    billing_check(sb_bill($db, ac_one($db, 'SELECT * FROM student_invoice_links WHERE id=?', [$oldId]))['amount'] === '1000.00', 'Legacy existing link retains its actual balance');
    $originalMeta = ac_one($db, "SELECT meta_json FROM billing_invoices WHERE id='OLD-0'")['meta_json'];
    foreach (['{"student_id":"2junk"}', '{"student_id":0}', '{invalid-json'] as $badMeta) {
        ac_query($db, "UPDATE billing_invoices SET meta_json=? WHERE id='OLD-0'", [$badMeta]);
        billing_check($link(['billing_invoice_id' => 'OLD-0'])['code'] === 409, 'Malformed persisted ownership fails closed: '.$badMeta);
    }
    ac_query($db, "UPDATE billing_invoices SET meta_json=? WHERE id='OLD-0'", [$originalMeta]);
    $db->query("INSERT INTO invoice_clients VALUES(1,'Siswa Resmi',1000)");
    billing_check($link(['billing_invoice_id' => null, 'invoice_client_id' => 1])['code'] === 409, 'Alternate invoice_client link cannot assign an unknown owner');
    ac_query($db, 'INSERT INTO student_invoice_links(student_id,invoice_client_id,linked_by) VALUES(1,1,1)');
    billing_check($link(['billing_invoice_id' => null, 'invoice_client_id' => 1])['code'] === 200, 'Existing legacy invoice_client relationship remains retryable');
    $db->query('ALTER TABLE invoice_clients ADD student_id INT NULL, ADD meta_json LONGTEXT NULL');
    $db->query("INSERT INTO invoice_clients VALUES(2,'Customer',1000,1,NULL),(3,'Conflict',1000,1,'{\"student_id\":2}')");
    billing_check($link(['billing_invoice_id' => null, 'invoice_client_id' => 2])['code'] === 200, 'Alternate source uses persisted owner when an official student_id column is available');
    billing_check($link(['billing_invoice_id' => null, 'invoice_client_id' => 3])['code'] === 409, 'Conflicting persisted owner column and metadata are rejected');
    $beforeLinks = ac_one($db, 'SELECT COUNT(*) AS n FROM student_invoice_links')['n'];
    billing_check($link(['billing_invoice_id' => 'OLD-0'])['code'] === 409 && ac_one($db, 'SELECT COUNT(*) AS n FROM student_invoice_links')['n'] === $beforeLinks, 'Ownership rejections do not create partial relationships');

    // Real MySQL 1205 in independent connections: test both early and post-insert rollback.
    $locker = new mysqli($GLOBALS['DB_HOST'], $GLOBALS['DB_USER'], $GLOBALS['DB_PASS'], $testName);
    $worker = function (string $mode, array $payload) use ($send, $cookie, $csrf): array {
        $endpoint = $mode === 'link' ? 'student_billing.php' : 'billing.php';
        $response = $send($endpoint, $payload + ['action' => $mode === 'link' ? 'link' : 'add_invoice'], $cookie, $csrf);
        return ['code' => $response['code']] + ($response['json'] ?? []);
    };
    try {
        $locker->begin_transaction();
        $locker->query('SELECT id FROM peserta_intensif WHERE id=1 FOR UPDATE');
        $result = $worker('invoice', array_replace($base, ['id' => 'LOCK-EARLY']));
        $locker->rollback();
        billing_check($result['code'] === 409 && $result['status'] === 'error' && !ac_one($db, "SELECT id FROM billing_invoices WHERE id='LOCK-EARLY'"), 'Real 1205 on student lock returns retryable conflict without invoice');
        $db->query('CREATE TABLE billing_lock_guard(id INT PRIMARY KEY,value INT) ENGINE=InnoDB');
        $db->query('INSERT INTO billing_lock_guard VALUES(1,0)');
        $db->query('CREATE TRIGGER audit_lock BEFORE INSERT ON accounting_audit_logs FOR EACH ROW UPDATE billing_lock_guard SET value=value+1 WHERE id=1');
        $beforeAudit = $auditCount();
        $locker->begin_transaction();
        $locker->query('SELECT id FROM billing_lock_guard WHERE id=1 FOR UPDATE');
        $result = $worker('invoice', array_replace($base, ['id' => 'LOCK-LATE']));
        $locker->rollback();
        billing_check($result['code'] === 409 && !ac_one($db, "SELECT id FROM billing_invoices WHERE id='LOCK-LATE'") && $auditCount() === $beforeAudit, 'Real 1205 during audit rolls back the already-inserted invoice and audit');
        billing_check($create(['id' => 'LOCK-LATE'])['code'] === 200, 'Invoice creation can succeed after lock release without stale partial state');
        billing_check($create(['id' => 'LINK-LOCK'])['code'] === 200, 'Prepare owned invoice for relationship rollback check');
        $beforeAudit = $auditCount();
        $locker->begin_transaction();
        $locker->query('SELECT id FROM billing_lock_guard WHERE id=1 FOR UPDATE');
        $result = $worker('link', ['student_id' => 1, 'billing_invoice_id' => 'LINK-LOCK']);
        $locker->rollback();
        billing_check($result['code'] === 409 && !ac_one($db, "SELECT id FROM student_invoice_links WHERE billing_invoice_id='LINK-LOCK'") && $auditCount() === $beforeAudit, 'Real 1205 during link audit rolls back the already-inserted relationship');
        billing_check($link(['billing_invoice_id' => 'LINK-LOCK'])['code'] === 200, 'Link retry succeeds once contention is released');
    } finally {
        $locker->rollback(); $locker->close();
        $db->query('DROP TRIGGER IF EXISTS audit_lock');
    }
}
