<?php
// Called only by billing_invoice_test.php inside its disposable database/HTTP fixture.
function pricing_registration_checks(mysqli $db, string $testName, string $pricingFile, string $registrationFile, array $base, callable $send, string $cookie, string $csrf): void {
    $start = $GLOBALS['checks'];
    $catalog = pricing_fixture_catalog();
    $configure = static fn(array $value) => file_put_contents($pricingFile, json_encode($value, JSON_THROW_ON_ERROR));
    $webhook = static fn(array $student) => $send('webhook_registration.php', ['secret' => $testName, 'student' => $student, 'defer_delivery_log' => true]);
    $sync = static function (array $students) use ($registrationFile, $send, $cookie, $csrf): array {
        file_put_contents($registrationFile, json_encode($students, JSON_THROW_ON_ERROR));
        return $send('sync_students_web.php', [], $cookie, $csrf);
    };
    $student = ['id' => 101, 'nama' => 'Siswa Pricing', 'email' => 'pricing101@test.invalid', 'phone' => '0812345', 'program' => 'Kelas Intensif Offline', 'skema' => 'Full Payment', 'total_biaya' => '15000000.50'];
    $snapshot = static fn() => [ac_rows($db, 'SELECT * FROM billing_invoices ORDER BY id'), ac_rows($db, 'SELECT * FROM billing_pembayaran ORDER BY id')];
    try {
        billing_check(json_decode(file_get_contents(__DIR__.'/../config/student_pricing.json'), true)['rules'] === [], 'Application catalogue contains no invented Finance approvals');
        foreach (['Intensif' => 'intensif_offline', 'Program SSW Kaigo' => 'kaigo_dana_talang', 'Matching Job' => 'matching_job', 'Sotsugyousei' => 'sotsugyousei', 'Reguler' => 'kursus_reguler'] as $name => $id) billing_check(sp_program($name) === $id, 'Canonical program alias: '.$name);
        $aliases = json_decode(file_get_contents(__DIR__.'/../config/payment_schemes.json'), true);
        foreach ($aliases as $scheme => $names) foreach ($names as $name) billing_check(sp_scheme('  '.strtoupper($name).'  ') === $scheme, 'Shared scheme alias: '.$name);
        billing_check(sp_scheme('not full') === null && sp_scheme('DP khusus 12 bulan') === null, 'Unknown schemes never default to full or guessed installments');
        billing_check(sp_evaluate('Unknown', 'full')['reason'] === 'unknown_program', 'Unknown program needs review');
        billing_check(sp_evaluate('Intensif', 'Unknown')['reason'] === 'unknown_scheme', 'Unknown scheme needs review');
        foreach (['0', '-1', '1e7', '15.000.000,50', '15000000.501', 15000000.5, [], '1.00'."\n"] as $value) billing_check(sp_evaluate('Intensif', 'full', [$value])['reason'] === 'invalid_amount', 'Invalid upstream amount cannot become approved: '.json_encode($value));
        billing_check(sp_evaluate('Intensif', 'full', ['1.00'])['reason'] === 'amount_mismatch', 'Valid decimal manipulation fails approved-price comparison');
        billing_check(sp_evaluate('Intensif', 'full', ['15000000.50', '1.00'])['reason'] === 'amount_mismatch', 'Every upstream amount assertion is checked');
        foreach (['full', 'Angsuran', 'DP'] as $scheme) {
            $decision = sp_evaluate('Intensif', $scheme, ['15000000.50']);
            $terms = sp_schedule($decision, '2026-11-13');
            billing_check($decision['status'] === 'approved' && array_sum(array_map(fn($term) => ac_cents($term['nominal']), $terms)) === 1500000050 && count($terms) === ($scheme === 'full' ? 1 : 2), 'Approved exact schedule: '.$scheme);
        }
        $large = $catalog; $large['rules'] = [$large['rules'][0]];
        $large['rules'][0]['amount'] = $large['rules'][0]['installments'][0]['amount'] = '9999999999999.99';
        $configure($large);
        billing_check(sp_evaluate('Intensif', 'full', ['9999999999999.99'])['amount'] === '9999999999999.99', 'Decimal precision retained at DECIMAL(15,2) maximum');
        $configure($catalog);

        // BE-02 does not depend on the official bank-holder column; BE-01 bank checks stay intact.
        $db->query('ALTER TABLE cash_bank_accounts CHANGE account_holder temporarily_unavailable_holder VARCHAR(255)');
        $response = $webhook($student);
        $db->query('ALTER TABLE cash_bank_accounts CHANGE temporarily_unavailable_holder account_holder VARCHAR(255)');
        billing_check($response['code'] === 200 && ($response['json']['summary']['invoices_created'] ?? 0) === 1, 'Approved webhook registration creates one invoice without a bank-holder dependency');
        $item = $response['json']['data'][0]; $id = $item['student_id']; $invoice = $item['invoice_id'];
        $row = ac_one($db, 'SELECT * FROM billing_invoices WHERE id=?', [$invoice]); $meta = json_decode($row['meta_json'], true);
        billing_check($row['total'] === '15000000.50' && $row['status'] === 'Unpaid' && $meta['student_id'] === (int)$id && $meta['pricing']['approval_reference'] === 'SYNTHETIC-TEST-ONLY', 'Webhook invoice stores exact approved amount, owner and pricing proof');
        billing_check($item['nominal'] === '15000000.50' && $item['installments'][0]['nominal'] === '15000000.50' && $item['jatuh_tempo'] === date('Y-m-d', strtotime('+7 days')), 'Webhook uses rule dates and decimal-string API amounts');
        $db->query("UPDATE billing_invoices SET status='Paid' WHERE id='".$db->real_escape_string($invoice)."'");
        ac_query($db, 'INSERT INTO billing_pembayaran(noInv,jumlah,statusVerif) VALUES(?,?,?)', [$invoice, '15000000.50', 'Terverifikasi']);
        $history = $snapshot();
        $repeat = $webhook($student);
        billing_check($repeat['code'] === 200 && $repeat['json']['data'][0]['invoice_id'] === $invoice && !$repeat['json']['data'][0]['invoice_created_now'] && (int)$repeat['json']['data'][0]['student_id'] === (int)$id, 'Webhook replay reuses stable database student and exact registration invoice');
        billing_check($snapshot() === $history, 'Replay leaves paid invoice, token, metadata and verified payment byte-for-byte unchanged');
        $tampered = $webhook(array_replace($student, ['total_biaya' => '1.00']));
        billing_check($tampered['code'] === 200 && $tampered['json']['data'][0]['pricing_reason'] === 'amount_mismatch' && $snapshot() === $history, 'Tampered replay needs review and cannot rewrite existing invoice/payment');

        $synced = $sync([$student]);
        billing_check($synced['code'] === 200 && $synced['json']['inserted'] === 0 && $synced['json']['updated'] === 1 && $synced['json']['pricing_needs_review'] === 0, 'Student sync uses the same approved program/scheme rules as webhook');
        $stored = ac_one($db, 'SELECT id,total_biaya,program,metode_pembayaran FROM peserta_intensif WHERE id=?', [$id]);
        foreach (['', null, '0', '-1', 'bad', '1.00'] as $amount) {
            $res = $sync([array_replace($student, ['total_biaya' => $amount])]);
            billing_check($res['code'] === 200 && ac_one($db, 'SELECT id,total_biaya,program,metode_pembayaran FROM peserta_intensif WHERE id=?', [$id]) === $stored && $snapshot() === $history, 'Repeated sync preserves positive stored pricing and historical billing: '.json_encode($amount));
        }
        billing_check($sync([['id' => 101, 'nama' => 'Siswa Pricing']])['code'] === 200 && ac_one($db, 'SELECT id,total_biaya,program,metode_pembayaran FROM peserta_intensif WHERE id=?', [$id]) === $stored, 'Missing upstream program/scheme/amount cannot erase stored values');
        $changed = $catalog; $changed['rules'][0]['amount'] = $changed['rules'][0]['installments'][0]['amount'] = '16000000.00'; $configure($changed);
        $res = $sync([array_replace($student, ['total_biaya' => '16000000.00'])]);
        billing_check($res['json']['pricing_reviews'][0]['reason'] === 'stored_pricing_conflict' && ac_one($db, 'SELECT id,total_biaya,program,metode_pembayaran FROM peserta_intensif WHERE id=?', [$id]) === $stored, 'Even a newly approved different price cannot automatically overwrite positive stored pricing');
        $configure($catalog);

        $cases = [
            ['program' => 'Unrecognized', 'reason' => 'unknown_program'],
            ['skema' => 'Unrecognized', 'reason' => 'unknown_scheme'],
            ['program' => 'Matching Job', 'reason' => 'pricing_not_approved'],
            ['total_biaya' => '1.00', 'reason' => 'amount_mismatch'],
            ['nominal' => '1.00', 'reason' => 'amount_mismatch'],
            ['discount' => ['amount' => '1.00'], 'reason' => 'discount_not_approved'],
            ['discount' => ['amount' => null, 'value' => null], 'reason' => 'discount_not_approved'],
            ['details' => ['total_biaya' => '0'], 'reason' => 'invalid_amount'],
            ['details' => ['program' => 'Kaigo'], 'reason' => 'conflicting_program'],
            ['details' => ['skema' => 'cicilan'], 'reason' => 'conflicting_scheme'],
            ['installments' => [], 'reason' => 'invalid_installments'],
            ['details' => ['installments' => [['nominal' => '1.00']]], 'reason' => 'invalid_installments'],
        ];
        foreach ($cases as $index => $patch) {
            $reason = $patch['reason']; unset($patch['reason']);
            $payload = array_replace($student, ['id' => 200 + $index, 'email' => 'review'.$index.'@test.invalid'], $patch);
            $before = $snapshot(); $res = $webhook($payload); $result = $res['json']['data'][0] ?? [];
            billing_check($res['code'] === 200 && ($result['pricing_reason'] ?? '') === $reason && $result['invoice_id'] === null && !$result['needs_delivery'] && ac_one($db, 'SELECT total_biaya FROM peserta_intensif WHERE web_id=?', [$payload['id']])['total_biaya'] === null && $snapshot() === $before, 'Unconfirmed registration preserves identity without guessed invoice: '.$reason);
        }
        $cicilan = $webhook(array_replace($student, ['id' => 300, 'email' => 'cicilan@test.invalid', 'skema' => 'Angsuran']));
        billing_check($cicilan['code'] === 200 && count($cicilan['json']['data'][0]['installments']) === 2 && $cicilan['json']['data'][0]['skema'] === 'cicilan' && $cicilan['json']['data'][0]['installments'][1]['nominal'] === '10000000.25', 'Webhook Angsuran uses approved installments without full-payment fallback');
        $syncOnly = array_replace($student, ['id' => 301, 'email' => 'sync-only@test.invalid', 'skema' => 'DP']);
        $before = $snapshot(); $res = $sync([$syncOnly]);
        billing_check($res['code'] === 200 && $res['json']['inserted'] === 1 && $snapshot() === $before && ac_one($db, 'SELECT metode_pembayaran FROM peserta_intensif WHERE web_id=301')['metode_pembayaran'] === 'Cicilan', 'Sync creates canonical student without issuing or repricing any invoice');
        $res = $webhook($syncOnly);
        billing_check($res['code'] === 200 && $res['json']['summary']['students_created'] === 0 && $res['json']['summary']['invoices_created'] === 1, 'Webhook after sync reuses database identity and issues one approved invoice');

        $noIdentity = $student; unset($noIdentity['id']); $noIdentity['email'] = 'no-identity@test.invalid';
        $before = (int)ac_one($db, 'SELECT COUNT(*) AS n FROM peserta_intensif')['n'];
        $res = $webhook($noIdentity);
        billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_reason'] === 'missing_stable_identity' && (int)ac_one($db, 'SELECT COUNT(*) AS n FROM peserta_intensif')['n'] === $before, 'Name/email alone never create or select a student; missing identity is audited for review');
        $res = $webhook(array_replace($student, ['web_id' => 999]));
        billing_check($res['code'] === 409, 'Conflicting upstream identity aliases return 409');
        $res = $webhook(array_replace($student, ['id' => 302, 'email' => 'student@test.invalid']));
        billing_check($res['code'] === 409, 'Legacy email collision requires review instead of auto-linking by contact');
        billing_check((int)ac_one($db, "SELECT COUNT(*) AS n FROM peserta_intensif WHERE nama_lengkap='Siswa Pricing'")['n'] > 3, 'Identical names with different stable source IDs remain distinct students');
        $before = $snapshot();
        $res = $sync([array_replace($student, ['id' => 350, 'email' => 'invalid-sync@test.invalid', 'total_biaya' => '1.00'])]);
        billing_check($res['code'] === 200 && $res['json']['pricing_reviews'][0]['reason'] === 'amount_mismatch' && ac_one($db, 'SELECT total_biaya FROM peserta_intensif WHERE web_id=350')['total_biaya'] === null && $snapshot() === $before, 'New sync amount tampering has the same review outcome as webhook');
        $lock = 'reg:'.substr(hash('sha256', 'creativabridging.com:web:700'), 0, 55);
        ac_query($db, 'SELECT GET_LOCK(?,0)', [$lock]);
        try { $res = $webhook(array_replace($student, ['id' => 700, 'email' => 'locked@test.invalid'])); }
        finally { ac_query($db, 'SELECT RELEASE_LOCK(?)', [$lock]); }
        billing_check($res['code'] === 409 && !ac_one($db, 'SELECT id FROM peserta_intensif WHERE web_id=700') && $snapshot() === $before, 'Concurrent source-identity lock conflict returns 409 without partial student or invoice');
        $nikOnly = $student; unset($nikOnly['id']); $nikOnly['noKtp'] = 'SYNTHETIC-NIK-1'; $nikOnly['email'] = 'nik@test.invalid';
        $res = $webhook($nikOnly); $repeat = $webhook($nikOnly);
        billing_check($res['code'] === 200 && $repeat['code'] === 200 && $res['json']['data'][0]['invoice_id'] === $repeat['json']['data'][0]['invoice_id'] && !$repeat['json']['data'][0]['invoice_created_now'], 'Stable NIK fallback also reuses its exact registration invoice');
        billing_check($webhook(array_replace($student, ['noKtp' => 'SYNTHETIC-NIK-1']))['code'] === 409, 'NIK/source-ID conflict cannot overwrite another student identity');

        // Exact legacy source-ID can be reused, but student-only/contact matches do not imply a registration invoice.
        foreach (['legacy', 'student-only', 'orphan', 'legacy-decimal'] as $index => $mode) {
            $payload = array_replace($student, ['id' => 400 + $index, 'email' => $mode.'@test.invalid']); $sync([$payload]);
            $owner = ac_one($db, 'SELECT * FROM peserta_intensif WHERE web_id=?', [$payload['id']]);
            $metadata = str_starts_with($mode, 'legacy') ? ['web_id' => $payload['id'], 'source' => 'rpa-phase1-webhook'] : ($mode === 'student-only' ? ['student_id' => (int)$owner['id']] : []);
            if ($mode === 'legacy-decimal') $metadata['installments'] = [['nominal' => 15000000.5, 'jatuhTempo' => '2026-01-01']];
            ac_query($db, 'INSERT INTO billing_invoices(id,total,email,status,meta_json,jatuhTempo) VALUES(?,?,?,?,?,?)', ['BE02-'.$mode, '15000000.50', $payload['email'], 'Paid', json_encode($metadata), '2026-01-01']);
            $before = $snapshot(); $res = $webhook($payload); $result = $res['json']['data'][0] ?? [];
            billing_check($res['code'] === 200 && $snapshot() === $before && (str_starts_with($mode, 'legacy') ? $result['invoice_id'] === 'BE02-'.$mode : $result['invoice_id'] === null && $result['pricing_status'] === 'needs_review'), 'Legacy invoice ownership compatibility: '.$mode);
            if ($mode === 'legacy-decimal') billing_check($result['due_now_nominal'] === null && $result['pricing_reason'] === 'legacy_installment_requires_review', 'Historical float metadata is preserved for review without float rounding or guessed due amount');
        }
        $owner = ac_one($db, 'SELECT id FROM peserta_intensif WHERE web_id=101');
        ac_query($db, 'INSERT INTO billing_invoices(id,total,status,meta_json) VALUES(?,?,?,?)', ['BE02-DUPLICATE-OWNER', '15000000.50', 'Unpaid', json_encode(['student_id' => (int)$owner['id']])]);
        $before = $snapshot(); $res = $webhook($student);
        billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_reason'] === 'multiple_existing_invoices' && $snapshot() === $before, 'Multiple candidate invoices require review rather than guessing a business-level duplicate');
        $conflict = array_replace($student, ['id' => 404, 'email' => 'owner-conflict@test.invalid']); $sync([$conflict]);
        ac_query($db, 'INSERT INTO billing_invoices(id,total,status,meta_json) VALUES(?,?,?,?)', ['BE02-WRONG-OWNER', '15000000.50', 'Unpaid', json_encode(['registration_key' => 'creativabridging.com:web:404', 'student_id' => (int)$id])]);
        $res = $webhook($conflict);
        billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_reason'] === 'invoice_owner_conflict' && $res['json']['data'][0]['invoice_id'] === null, 'Even an exact registration key cannot bypass a conflicting stored invoice owner');

        foreach (['empty', 'malformed', 'missing-approval', 'conflicting', 'bad-terms', 'missing-file'] as $index => $mode) {
            $broken = $catalog;
            if ($mode === 'empty') $broken['rules'] = [];
            if ($mode === 'missing-approval') unset($broken['rules'][0]['approval']['reference']);
            if ($mode === 'conflicting') $broken['rules'][] = $broken['rules'][0];
            if ($mode === 'bad-terms') $broken['rules'][0]['installments'][0]['amount'] = '1.00';
            $configure($broken);
            if ($mode === 'malformed') file_put_contents($pricingFile, '{invalid');
            if ($mode === 'missing-file') unlink($pricingFile);
            // Missing file cannot pass the private HTTP router, so test the same service in-process.
            if ($mode === 'missing-file') {
                billing_check(sp_evaluate('Intensif', 'full')['reason'] === 'invalid_pricing_configuration', 'Missing pricing file fails safely');
                $configure($catalog); continue;
            }
            $before = $snapshot(); $res = $webhook(array_replace($student, ['id' => 500 + $index, 'email' => 'config'.$index.'@test.invalid']));
            billing_check($res['code'] === 200 && $res['json']['data'][0]['pricing_status'] === 'needs_review' && $res['json']['data'][0]['invoice_id'] === null && $snapshot() === $before, 'Pricing configuration fails closed without registration data loss: '.$mode);
            $bill = $send('billing.php', array_replace($base, ['id' => 'BE02-CONFIG-'.$index]), $cookie, $csrf);
            billing_check($bill['code'] === 409, 'BE-01 invoice creation requires approved pricing configuration: '.$mode);
        }
        $configure($catalog);
        $before = $snapshot(); $deliveryBefore = ac_rows($db, 'SELECT * FROM billing_terkirim ORDER BY id');
        $db->query("CREATE TRIGGER be02_audit_failure BEFORE INSERT ON accounting_audit_logs FOR EACH ROW BEGIN IF NEW.entity_type='student_pricing' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Synthetic audit failure'; END IF; END");
        $res = $webhook(array_replace($student, ['id' => 600, 'email' => 'rollback@test.invalid']));
        $db->query('DROP TRIGGER be02_audit_failure');
        billing_check($res['code'] === 500 && !ac_one($db, 'SELECT id FROM peserta_intensif WHERE web_id=600') && $snapshot() === $before && ac_rows($db, 'SELECT * FROM billing_terkirim ORDER BY id') === $deliveryBefore, 'Audit failure rolls back registration, invoice and delivery log without changing payments');
        billing_check((int)ac_one($db, "SELECT COUNT(*) AS n FROM accounting_audit_logs WHERE entity_type='student_pricing' AND action='needs_review'")['n'] > 0, 'Needs-review decisions retain audit trail');
    } finally { $configure($catalog); }
    echo 'PASS: '.($GLOBALS['checks'] - $start)." BE-02 pricing/registration checks.\n";
}
