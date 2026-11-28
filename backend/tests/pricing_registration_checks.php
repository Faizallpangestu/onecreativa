<?php
function pricing_registration_checks(mysqli $db, string $testName, string $pricingFile, string $registrationFile, array $base, callable $send, string $cookie, string $csrf): void {
    $start = $GLOBALS['checks']; $catalog = pricing_fixture_catalog();
    $configure = fn(array $value) => file_put_contents($pricingFile, eb_json($value));
    $webhook = fn(array $student) => $send('webhook_registration.php', ['secret' => $testName, 'student' => $student, 'defer_delivery_log' => true]);
    $sync = function (array $students) use ($registrationFile, $send, $cookie, $csrf) { file_put_contents($registrationFile, eb_json($students)); return $send('sync_students_web.php', [], $cookie, $csrf); };
    $student = ['external_student_id' => 'person-101', 'external_enrollment_id' => 'registration-101', 'id' => 101, 'nama' => 'Siswa Pricing', 'email' => 'pricing101@test.invalid', 'phone' => '0812345', 'program' => 'Intensif', 'skema' => 'Full Payment', 'total_biaya' => '15000000.50', 'batch' => '2026-A'];
    $snapshot = fn() => [ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id'), ac_rows($db, 'SELECT * FROM billing_pembayaran ORDER BY id')];
    try {
        billing_check($send('webhook_registration.php', ['secret' => 'wrong', 'student' => $student])['code'] === 401, 'Webhook still requires the authenticated upstream secret');
        billing_check(json_decode(file_get_contents(__DIR__.'/../config/student_pricing.json'), true)['rules'] === [], 'No fabricated approved policy in application catalogue');
        foreach (['Intensif' => 'intensif_offline', 'Kaigo' => 'kaigo_dana_talang', 'Matching Job' => 'matching_job', 'Sotsugyousei' => 'sotsugyousei', 'Reguler' => 'kursus_reguler'] as $name => $id) billing_check(sp_program($name) === $id, 'Program normalization: '.$name);
        foreach (json_decode(file_get_contents(__DIR__.'/../config/payment_schemes.json'), true) as $scheme => $aliases) foreach ($aliases as $alias) billing_check(sp_scheme(' '.strtoupper($alias).' ') === $scheme, 'PHP/FE shared scheme alias: '.$alias);
        billing_check(sp_scheme('not full') === null && sp_evaluate('Unknown', 'full')['reason'] === 'unknown_program', 'Unknown program/scheme never default to full or a known price');
        foreach (['0', '-1', '1e7', '15.000.000,50', '15000000.501', 15000000.5, [], "1.00\n"] as $claim) billing_check(sp_evaluate('Intensif', 'full', [$claim])['reason'] === 'invalid_amount', 'Invalid/float upstream amount: '.json_encode($claim));
        billing_check(sp_evaluate('Intensif', 'full', ['15000000.50', '1.00'])['reason'] === 'amount_mismatch', 'All upstream amount assertions must agree');
        $large = $catalog; $large['rules'] = [$large['rules'][0]];
        $large['rules'][0]['amount'] = $large['rules'][0]['installments'][0]['amount'] = $large['rules'][0]['charges'][0]['amount'] = $large['rules'][0]['charges'][0]['installments'][0]['amount'] = '9999999999999.99'; $configure($large);
        billing_check(sp_evaluate('Intensif', 'full', ['9999999999999.99'])['amount'] === '9999999999999.99', 'Exact decimal precision at DECIMAL(15,2) maximum'); $configure($catalog);
        $res = $webhook($student);
        billing_check($res['code'] === 200 && ($res['json']['summary']['invoices_created'] ?? 0) === 1, 'Webhook uses approved enrollment and server-authorized initial charge: '.json_encode($res['json']));
        $first = $res['json']['data'][0]; $id = $first['student_id']; $invoice = $first['invoice_id'];
        billing_check($first['enrollment_id'] && $first['charge_id'] && $first['nominal'] === '15000000.50' && $first['bank']['account_holder'] === 'Pemilik Resmi Uji', 'Webhook retains explicit enrollment/charge, exact amount and official bank holder');
        $repeat = $webhook($student);
        billing_check($repeat['code'] === 200 && $repeat['json']['data'][0]['invoice_id'] === $invoice && !$repeat['json']['data'][0]['invoice_created_now'] && !$repeat['json']['data'][0]['needs_delivery'], 'Webhook replay reuses same charge and never requests redispatch');
        ac_query($db, "UPDATE billing_invoices SET status='Paid' WHERE id=?", [$invoice]);
        ac_query($db, "INSERT INTO billing_pembayaran(noInv,jumlah,statusVerif) VALUES(?,?,'Terverifikasi')", [$invoice, '15000000.50']);
        $history = $snapshot(); $repeat = $webhook($student);
        billing_check($repeat['code'] === 200 && $repeat['json']['data'][0]['invoice_id'] === $invoice && $snapshot() === $history, 'Existing Paid invoice, token, metadata and verified payment unchanged');
        $res = $webhook(array_replace($student, ['total_biaya' => '1.00']));
        billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_status'] === 'needs_review' && !$res['json']['data'][0]['needs_delivery'] && !isset($res['json']['data'][0]['whatsapp_message']) && $snapshot() === $history, 'Pricing-review response cannot redispatch an existing invoice');
        $stored = ac_one($db, 'SELECT program,metode_pembayaran,total_biaya FROM peserta_intensif WHERE id=?', [$id]);
        foreach (['', null, '0', '-1', 'bad', '1.00'] as $amount) {
            $res = $sync([array_replace($student, ['total_biaya' => $amount])]);
            billing_check($res['code'] === 200 && $snapshot() === $history && ac_one($db, 'SELECT program,metode_pembayaran,total_biaya FROM peserta_intensif WHERE id=?', [$id]) === $stored, 'Repeated sync never clears preserved pricing or rewrites billing: '.json_encode($amount));
        }
        $res = $sync([$student]); billing_check($res['code'] === 200 && $res['json']['inserted'] === 0 && $res['json']['updated'] === 1 && $snapshot() === $history, 'Sync and webhook share exact person/enrollment identity; sync creates no invoice');
        $cases = [
            ['program' => 'Unknown', 'reason' => 'unknown_program'], ['skema' => 'Unknown', 'reason' => 'unknown_scheme'],
            ['program' => 'Matching Job', 'reason' => 'pricing_not_approved'], ['total_biaya' => '1.00', 'reason' => 'amount_mismatch'],
            ['nominal' => '1.00', 'reason' => 'amount_mismatch'], ['discount' => ['amount' => 1], 'reason' => 'discount_not_approved'],
            ['discount' => ['amount' => null], 'reason' => 'discount_not_approved'], ['details' => ['program' => 'Kaigo'], 'reason' => 'conflicting_program'],
            ['details' => ['skema' => 'cicilan'], 'reason' => 'conflicting_scheme'], ['installments' => [], 'reason' => 'invalid_installments'],
        ];
        foreach ($cases as $index => $patch) {
            $reason = $patch['reason']; unset($patch['reason']);
            $before = $snapshot(); $res = $webhook(array_replace($student, ['external_student_id' => 'review-person-'.$index, 'external_enrollment_id' => 'review-enrollment-'.$index, 'email' => 'review'.$index.'@test.invalid'], $patch));
            billing_check($res['code'] === 200 && ($res['json']['data'][0]['pricing_reason'] ?? '') === $reason && $res['json']['data'][0]['invoice_id'] === null && $snapshot() === $before, 'Registration pricing rejection: '.$reason);
        }
        $cicilan = array_replace($student, ['external_student_id' => 'person-cicilan', 'external_enrollment_id' => 'enroll-cicilan', 'email' => 'cicilan@test.invalid', 'skema' => 'Angsuran']);
        $res = $webhook($cicilan);
        billing_check($res['code'] === 200 && count($res['json']['data'][0]['installments']) === 2 && $res['json']['data'][0]['installments'][1]['nominal'] === '10000000.25', 'Webhook Angsuran preserves approved cicilan without fallback');
        foreach (['empty', 'malformed', 'missing-approval', 'bad-terms', 'duplicate-charge', 'unapproved-charge'] as $index => $mode) {
            $broken = $catalog;
            if ($mode === 'empty') $broken['rules'] = [];
            if ($mode === 'missing-approval') unset($broken['rules'][0]['approval']['reference']);
            if ($mode === 'bad-terms') $broken['rules'][0]['installments'][0]['amount'] = '1.00';
            if ($mode === 'duplicate-charge') $broken['rules'][0]['charges'][] = $broken['rules'][0]['charges'][0];
            if ($mode === 'unapproved-charge') $broken['rules'][0]['charges'][1]['approval']['status'] = 'draft';
            $configure($broken); if ($mode === 'malformed') file_put_contents($pricingFile, '{bad');
            $before = $snapshot(); $res = $webhook(array_replace($student, ['external_student_id' => 'config-person-'.$index, 'external_enrollment_id' => 'config-enroll-'.$index]));
            billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_status'] === 'needs_review' && $res['json']['data'][0]['invoice_id'] === null && $snapshot() === $before, 'Missing/invalid pricing or charge approval fails safely: '.$mode);
        }
        $configure($catalog);
        $noCharges = $catalog; $noCharges['rules'][0]['charges'] = []; $configure($noCharges);
        $res = $webhook(array_replace($student, ['external_student_id' => 'no-charge-policy', 'external_enrollment_id' => 'no-charge-policy']));
        billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_reason'] === 'charge_policy_not_approved' && $res['json']['data'][0]['invoice_id'] === null, 'A program pricing approval alone never authorizes charge types or occurrence keys');
        $configure($catalog);
        $before = $snapshot(); $delivery = ac_rows($db, 'SELECT * FROM billing_terkirim ORDER BY id');
        $db->query("CREATE TRIGGER be03_audit_failure BEFORE INSERT ON accounting_audit_logs FOR EACH ROW BEGIN IF NEW.entity_type='student_pricing' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Synthetic audit failure'; END IF; END");
        $res = $webhook(array_replace($student, ['external_student_id' => 'rollback-person', 'external_enrollment_id' => 'rollback-enroll'])); $db->query('DROP TRIGGER be03_audit_failure');
        billing_check($res['code'] === 500 && !ac_one($db, "SELECT id FROM student_enrollments WHERE external_enrollment_id='rollback-enroll'") && !ac_one($db, "SELECT id FROM student_external_identities WHERE external_student_id='student:rollback-person'") && $snapshot() === $before && ac_rows($db, 'SELECT * FROM billing_terkirim ORDER BY id') === $delivery, 'Audit failure rolls back identity, enrollment, charges, invoice, sequence and delivery log');
    } finally { $configure($catalog); }
    echo 'PASS: '.($GLOBALS['checks']-$start)." BE-02 pricing/registration regression checks.\n";
}
