<?php
function billing_integration_checks(mysqli $db, string $testName, array $base, callable $send, string $cookie, string $csrf): void {
    $start = $GLOBALS['checks'];
    $post = fn(array $body) => $send('billing.php', $body, $cookie, $csrf);
    $valid = $post($base);
    billing_check($valid['code'] === 200 && $valid['json']['status'] === 'success' && $valid['json']['data']['created_now'], 'Official enrollment charge creates one server-numbered invoice: '.eb_json($valid['json'] ?? []));
    $id = $valid['json']['data']['id'];
    $stored = ac_one($db, 'SELECT * FROM billing_invoices WHERE id=?', [$id]); $meta = json_decode($stored['meta_json'], true);
    billing_check(preg_match('/^TGCJ[0-9]{8}$/D', $id) === 1 && $stored['status'] === 'Unpaid' && $stored['total'] === '15000000.50', 'Atomic server number, initial Unpaid and exact approved amount');
    billing_check($meta['student_id'] === 1 && $meta['enrollment_id'] === $base['enrollment_id'] && $meta['charge_id'] === $base['charge_id'] && $meta['discount']['amount'] === '0.00', 'Invoice metadata binds student, enrollment, charge and zero discount');
    billing_check($meta['bank_account_id'] === 1 && $meta['account_number'] === '000123456' && $meta['account_holder'] === 'Pemilik Resmi Uji', 'BE-01.1 official bank snapshot retains leading zeros and verified holder');
    $audit = ac_one($db, "SELECT * FROM accounting_audit_logs WHERE entity_type='billing_invoice' AND entity_id=?", [$id]);
    billing_check((int)$audit['actor_id'] === 1 && strlen($audit['hash_self']) === 64, 'Creation retains actor and hash audit');
    $replay = $post($base);
    billing_check($replay['code'] === 200 && $replay['json']['data']['id'] === $id && !$replay['json']['data']['created_now'], 'Same charge replay returns the committed invoice, without a new number');
    $cases = [
        'Amount manipulation' => ['total' => '1.00'], 'Zero' => ['total' => '0'], 'Negative' => ['total' => '-1'],
        'Localized amount' => ['total' => '15.000.000,50'], 'Exponent' => ['total' => '1.5e7'], 'Excess precision' => ['total' => '15000000.501'], 'Float' => ['total' => 15000000.5], 'Missing amount' => ['total' => null],
        'Paid status' => ['status' => 'Paid'], 'Partial status' => ['status' => 'Partially Paid'], 'Lunas alias' => ['status' => 'Lunas'], 'Sebagian alias' => ['status' => 'Sebagian'], 'Overdue' => ['status' => 'Overdue'], 'Null status' => ['status' => null],
        'Unauthorized discount' => ['discount' => ['value' => 1, 'amount' => 1]], 'Hidden discount' => ['discount' => ['value' => 10, 'amount' => 0]], 'Missing discount amount' => ['discount' => ['value' => 0]], 'Negative discount' => ['discount' => '-1'],
        'Subtotal mismatch' => ['subtotal' => '16000000.50'], 'Item amount mismatch' => ['items' => [['harga' => '15000000.50', 'jumlah' => '1']]],
        'Conflicting item aliases' => ['items' => [['harga' => '15000000.50', 'price' => 1, 'jumlah' => '15000000.50']]],
        'Item discount' => ['items' => [['harga' => '15000000.50', 'jumlah' => '15000000.50', 'diskon' => 1]]],
        'Unsupported split' => ['items' => [['price' => 1, 'amount' => 1], ['price' => '14999999.50', 'amount' => '14999999.50']]],
        'Empty items' => ['items' => []], 'Qty manipulation' => ['items' => [['qty' => 2, 'price' => '15000000.50', 'amount' => '15000000.50']]],
        'Bad installments' => ['installments' => [['nominal' => 1, 'jatuhTempo' => '2026-11-20']]], 'Empty installments' => ['installments' => []], 'Null installments' => ['installments' => null],
        'Bad due' => ['jatuhTempo' => '2026-11-21'], 'Bad scheme' => ['skema' => 'cicilan'], 'Unknown scheme' => ['skema' => 'not full'], 'Date order' => ['jatuhTempo' => '2026-11-12'],
        'Missing student' => ['student_id' => null], 'Web ID bypass' => ['student_id' => null, 'web_id' => 1], 'Manual bypass' => ['student_id' => null, 'invoice_type' => 'manual'],
        'Missing enrollment' => ['enrollment_id' => null], 'Forged charge' => ['charge_id' => 999999], 'Forged charge type' => ['charge_type' => 'additional_fee'], 'Forged occurrence key' => ['charge_key' => 'random-bypass'], 'Client invoice number' => ['id' => 'TGCJ26119999'],
        'Missing bank' => ['bank_account_id' => null], 'Unknown bank' => ['bank_account_id' => 999], 'Inactive bank' => ['bank_account_id' => 2], 'Bank number spoof' => ['account_number' => 'attacker'], 'Bank holder spoof' => ['account_holder' => 'Attacker'], 'Bank name spoof' => ['bank_name' => 'Other Bank'],
        'Malformed descriptive metadata' => ['includes' => ['bad' => 'value']],
    ];
    $fresh = enrollment_test_payload($db); $before = ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id');
    foreach ($cases as $label => $patch) {
        $res = $post(array_replace($fresh, $patch));
        billing_check($res['code'] === 422 && ($res['json']['status'] ?? '') === 'error' && is_string($res['json']['message']), 'BE-01/BE-03 rejects '.$label.': '.json_encode($res['json']));
    }
    billing_check($post(array_replace($fresh, ['student_id' => 999999]))['code'] === 404, 'Unknown database student returns 404');
    billing_check($post(array_replace($fresh, ['student_id' => 2]))['code'] === 409, 'Enrollment of another student rejected despite duplicate names/emails');
    billing_check($post(array_replace($fresh, ['enrollment_id' => 999999]))['code'] === 404, 'Unknown enrollment returns 404');
    billing_check(ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id') === $before, 'All rejected payloads leave invoices unchanged');
    $db->query('ALTER TABLE billing_invoices CHANGE meta_json temporarily_unavailable_meta LONGTEXT');
    billing_check($post($fresh)['code'] === 409, 'Missing metadata storage still fails closed without runtime DDL');
    $db->query('ALTER TABLE billing_invoices CHANGE temporarily_unavailable_meta meta_json LONGTEXT');
    foreach ([3 => 'inactive COA', 4 => 'noncash COA', 5 => 'missing official holder'] as $bank => $label) billing_check($post(array_replace($fresh, ['bank_account_id' => $bank]))['code'] === 409, 'Official bank still rejects '.$label);
    $db->query('ALTER TABLE cash_bank_accounts CHANGE account_holder unavailable_holder VARCHAR(255)');
    billing_check($post(array_replace($fresh, ['account_holder' => 'Client gap filler']))['code'] === 409, 'Missing official account_holder column still fails closed');
    $db->query('ALTER TABLE cash_bank_accounts CHANGE unavailable_holder account_holder VARCHAR(255)');
    foreach (['bank_name', 'account_number'] as $field) {
        $value = ac_one($db, "SELECT $field AS value FROM cash_bank_accounts WHERE id=1")['value'];
        $db->query("UPDATE cash_bank_accounts SET $field='' WHERE id=1");
        billing_check($post($fresh)['code'] === 409, 'Missing official '.$field.' still fails closed');
        ac_query($db, "UPDATE cash_bank_accounts SET $field=? WHERE id=1", [$value]);
    }
    $sensei = $send('login.php', ['email' => 'sensei@test', 'password' => 'isolated-test-only'])['cookie'];
    billing_check($send('billing.php', $fresh, $sensei, $send('session.php', null, $sensei)['json']['csrf_token'])['code'] === 403, 'User without prepare permission returns 403');
    $db->query("INSERT INTO finance_role_permissions VALUES('finance','prepare',0)");
    billing_check($post($fresh)['code'] === 403, 'Configured permission denial overrides role defaults');
    $db->query("DELETE FROM finance_role_permissions WHERE role_name='finance'");
    $admin = $send('login.php', ['email' => 'finance-admin@test', 'password' => 'isolated-test-only'])['cookie'];
    billing_check($send('billing.php', $fresh, $admin, $send('session.php', null, $admin)['json']['csrf_token'])['code'] === 200, 'Finance admin alias retains creation permission');
    $plan = enrollment_test_payload($db, 1, 'cicilan'); $plan['skema'] = 'Angsuran';
    $plan['installments'] = [['nominal' => '5000000.25', 'jatuhTempo' => '2026-11-20', 'status' => 'Paid', 'terbayar' => 5000000], ['nominal' => '10000000.25', 'jatuhTempo' => '2026-12-20']];
    $res = $post($plan); billing_check($res['code'] === 200, 'Approved cicilan preserves exact decimal terms and shared Angsuran normalization');
    $planMeta = json_decode(ac_one($db, 'SELECT meta_json FROM billing_invoices WHERE id=?', [$res['json']['data']['id']])['meta_json'], true);
    billing_check(!isset($planMeta['installments'][0]['status'], $planMeta['installments'][0]['terbayar']), 'Client installment payment/status flags are discarded');
    $oldFee = ac_one($db, 'SELECT total_biaya,program FROM peserta_intensif WHERE id=1');
    $db->query("UPDATE peserta_intensif SET total_biaya=NULL,program='Changed legacy program' WHERE id=1");
    billing_check($post(enrollment_test_payload($db))['code'] === 200, 'Later charge pricing is independent of mutable student operational fee/program');
    ac_query($db, 'UPDATE peserta_intensif SET total_biaya=?,program=? WHERE id=1', [$oldFee['total_biaya'], $oldFee['program']]);
    $link = fn(array $patch) => $send('student_billing.php', array_replace(['action' => 'link', 'student_id' => 1, 'billing_invoice_id' => $id], $patch), $cookie, $csrf);
    billing_check($link(['student_id' => 2, 'meta_json' => '{"student_id":2}'])['code'] === 409, 'BE-01.1 request ownership spoof cannot cross-link students');
    $linked = $link([]); billing_check($linked['code'] === 200 && $link([])['json']['data']['id'] === $linked['json']['data']['id'], 'Correct invoice/student relation links and retries idempotently');
    billing_check($link(['billing_invoice_id' => 'OLD-0'])['code'] === 409, 'Unknown legacy owner remains blocked from new student linking');
    ac_query($db, 'INSERT INTO student_invoice_links(student_id,billing_invoice_id,linked_by) VALUES(1,?,1)', ['OLD-1']);
    billing_check($link(['billing_invoice_id' => 'OLD-1'])['code'] === 200, 'Historical same-student link still readable/retryable');
    $badMeta = $meta; $badMeta['student_id'] = 2;
    ac_query($db, 'UPDATE billing_invoices SET meta_json=? WHERE id=?', [eb_json($badMeta), $id]);
    billing_check($link(['student_id' => 2])['code'] === 409, 'Relational enrollment owner cannot be overridden by conflicting stored invoice metadata');
    ac_query($db, 'UPDATE billing_invoices SET meta_json=? WHERE id=?', [$stored['meta_json'], $id]);
    $locker = new mysqli($GLOBALS['DB_HOST'], $GLOBALS['DB_USER'], $GLOBALS['DB_PASS'], $testName);
    try {
        $locked = enrollment_test_payload($db); $before = ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id');
        $locker->begin_transaction(); $locker->query('SELECT id FROM peserta_intensif WHERE id=1 FOR UPDATE');
        $res = $post($locked); $locker->rollback();
        billing_check($res['code'] === 409 && ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id') === $before, 'Real MySQL 1205 returns conflict and rolls back before invoice creation');
        $db->query('CREATE TABLE billing_lock_guard(id INT PRIMARY KEY,value INT) ENGINE=InnoDB'); $db->query('INSERT INTO billing_lock_guard VALUES(1,0)');
        $db->query("CREATE TRIGGER audit_lock BEFORE INSERT ON accounting_audit_logs FOR EACH ROW UPDATE billing_lock_guard SET value=value+1 WHERE id=1");
        $locker->begin_transaction(); $locker->query('SELECT id FROM billing_lock_guard WHERE id=1 FOR UPDATE');
        $res = $post($locked); $locker->rollback();
        billing_check($res['code'] === 409 && ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id') === $before && ac_one($db, 'SELECT billing_invoice_id FROM enrollment_charges WHERE id=?', [$locked['charge_id']])['billing_invoice_id'] === null, 'Late real 1205 rolls back invoice, charge consumption, sequence and audit');
        $db->query('DROP TRIGGER audit_lock'); $db->query('DROP TABLE billing_lock_guard');
        billing_check($post($locked)['code'] === 200, 'Explicit same-charge retry succeeds after lock release');
    } finally { $locker->rollback(); $locker->close(); }
    $read = $send('billing.php', null, $cookie); $legacy = array_column($read['json']['data']['invoices'] ?? [], null, 'id');
    billing_check($read['code'] === 200 && $legacy['OLD-0']['status'] === 'Paid' && $legacy['OLD-1']['status'] === 'Paid' && $legacy['OLD-2']['terbayar'] === '200.00' && $legacy['OLD-2']['sisa'] === '800.00', 'Historical Paid/Lunas and verified partial payment reads retain exact balances');
    billing_check($legacy['OLD-0']['enrollment_resolution'] === 'needs_review', 'Historical invoice without provable enrollment is explicitly flagged for reconciliation');
    echo 'PASS: '.($GLOBALS['checks']-$start)." BE-01/01.1 and creation security checks.\n";
}
