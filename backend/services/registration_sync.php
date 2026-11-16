<?php
require_once __DIR__.'/enrollment_billing.php';

// Only evidence from the authenticated registration source is considered here.
// General participant/payment status and client override flags are not approvals.
function registration_approval(array $parsed): array {
    $details = $parsed['details'];
    $review = sp_key($details['review_status'] ?? null);
    $screening = $details['screening'] ?? null;
    if ($review !== 'approved') return ['status' => 'needs_review', 'reason' => $review === 'rejected' ? 'registration_rejected' : 'registration_review_not_approved'];
    if (!is_array($screening) || !array_key_exists('eligible', $screening)) return ['status' => 'needs_review', 'reason' => 'screening_approval_missing'];
    $overall = sp_key($screening['overallStatus'] ?? null);
    if ($screening['eligible'] !== true || !in_array($overall, ['passed', 'pass', 'eligible'], true)) return ['status' => 'needs_review', 'reason' => 'screening_not_approved'];
    return ['status' => 'approved', 'reason' => '', 'review_status' => 'approved', 'screening_eligible' => true, 'screening_overall_status' => $overall];
}

function registration_person(array $parsed): ?string {
    $person = registration_external($parsed['input']['external_student_id'] ?? null, 'external_student_id');
    if ($person !== null) return 'student:'.$person;
    $nik = $parsed['fields']['no_ktp'];
    return preg_match('/^[1-9][0-9]{15}$/D', $nik) && !preg_match('/^(.)\1{15}$/D', $nik) ? 'nik:'.$nik : null;
}

function registration_fields(array $input): array {
    $details = $input['details'] ?? [];
    if (is_string($details)) $details = json_decode($details, true);
    if (!is_array($details)) ac_fail('Details pendaftaran tidak valid.');
    $read = static function (array $keys, int $max = 255) use ($input, $details): string {
        foreach ([$input, $details] as $record) foreach ($keys as $key) {
            if (isset($record[$key]) && $record[$key] !== '') return ac_text($record[$key], $key, $max, false);
        }
        return '';
    };
    $web = $input['web_id'] ?? $input['id'] ?? null;
    if ($web !== null && $web !== '' && $web !== 0 && $web !== '0') $web = registration_external($web, 'ID legacy upstream'); else $web = null;
    $name = $read(['nama', 'nama_lengkap', 'name', 'namaLengkap']);
    if ($name === '') ac_fail('Nama pendaftar diperlukan.');
    $fields = [
        'nama_lengkap' => $name, 'web_id' => $web, 'source' => 'creativabridging.com',
        'email' => $read(['email']), 'no_wa' => $read(['phone', 'no_wa', 'noWhatsapp', 'kontak'], 50),
        'no_ktp' => $read(['noKtp', 'no_ktp', 'nik'], 50), 'nis' => $read(['nis'], 50),
        'program' => $read(['program', 'programMinat'], 150),
        'metode_pembayaran' => $read(['metodePembayaran', 'metode_pembayaran', 'tipe_pembayaran', 'skema'], 100),
        'kota' => $read(['kotaDomisili', 'kota'], 100), 'alamat' => $read(['alamatLengkap', 'alamat'], 2000),
        'batch' => $read(['batch'], 100), 'status' => $read(['status'], 50),
    ];
    if (in_array($fields['status'], ['Pending', 'Pembayaran'], true)) $fields['status'] = 'Menunggu Pembayaran';
    $claims = [];
    foreach ([$input, $details] as $record) foreach (['nominal', 'total_biaya'] as $key) if (array_key_exists($key, $record)) $claims[] = $record[$key];
    return ['fields' => $fields, 'claims' => $claims, 'input' => $input, 'details' => $details];
}

function registration_external($value, string $label): ?string {
    if ($value === null || $value === '') return null;
    if (is_int($value) && $value > 0) $value = (string)$value;
    if (is_string($value) && trim($value) !== $value) ac_fail($label.' tidak boleh memiliki whitespace di awal/akhir.');
    return ac_text($value, $label, 191);
}
function registration_pricing(array $parsed, string $program, string $scheme, ?array $frozenRule = null, ?string $invoiceDate = null): array {
    $count = null;
    try {
        foreach ([$parsed['input'], $parsed['details']] as $record) {
            $candidate = sp_installment_count($scheme, $record['installment_count'] ?? null);
            if ($candidate !== null && $count !== null && $candidate !== $count) ac_fail('Jumlah termin bertentangan.');
            $count = $candidate ?? $count;
            foreach (['metodePembayaran', 'metode_pembayaran', 'tipe_pembayaran', 'skema'] as $field) if (!empty($record[$field])) {
                $named = sp_installment_count($record[$field]);
                if ($named !== null && $count !== null && $named !== $count) ac_fail('Jumlah termin bertentangan.');
                $count = $named ?? $count;
            }
        }
    } catch (AccountingException $error) { return ['status' => 'needs_review', 'reason' => 'invalid_installment_count', 'program_id' => sp_program($program), 'scheme' => sp_scheme($scheme), 'amount' => null, 'rule' => null]; }
    $pricing = $frozenRule ? eb_decision($frozenRule) : sp_evaluate($program, $scheme, $parsed['claims'], $count);
    if ($frozenRule && $count !== null && $count !== count($frozenRule['installments'])) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'invalid_installment_count']);
    if ($frozenRule) foreach ($parsed['claims'] as $claim) {
        if ($claim === null || $claim === '') continue;
        try { if (ac_cents($claim) !== ac_cents($frozenRule['amount'])) ac_fail('Nominal berbeda.'); }
        catch (AccountingException $error) { $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'amount_mismatch']); }
    }
    foreach ([$parsed['input'], $parsed['details']] as $record) {
        foreach (['program', 'programMinat'] as $field) if (!empty($record[$field]) && sp_program($record[$field]) !== $pricing['program_id']) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'conflicting_program']);
        foreach (['metodePembayaran', 'metode_pembayaran', 'tipe_pembayaran', 'skema'] as $field) if (!empty($record[$field]) && sp_scheme($record[$field]) !== $pricing['scheme']) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'conflicting_scheme']);
        foreach (['discount', 'diskon'] as $field) if (array_key_exists($field, $record)) {
            $discount = $record[$field];
            try {
                if (is_array($discount) && !array_key_exists('amount', $discount)) ac_fail('Diskon tidak valid.');
                $values = is_array($discount) ? array_values(array_intersect_key($discount, array_flip(['amount', 'value']))) : [$discount];
                foreach ($values as $value) if (ac_cents($value) !== 0) ac_fail('Diskon tidak approved.');
            } catch (AccountingException $error) { $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'discount_not_approved']); }
        }
        if ($pricing['status'] === 'approved' && array_key_exists('installments', $record)) {
            $date = $invoiceDate ?? date('Y-m-d'); $schedule = sp_schedule($pricing, $date);
            try {
                $actual = $record['installments'];
                if (!is_array($actual) || !array_is_list($actual) || count($actual) !== count($schedule)) ac_fail('Termin tidak sesuai snapshot.');
                foreach ($actual as $index => $term) if (!is_array($term) || ac_cents($term['nominal'] ?? null) !== ac_cents($schedule[$index]['nominal']) || ($term['jatuhTempo'] ?? null) !== $schedule[$index]['jatuhTempo']) ac_fail('Termin tidak sesuai snapshot.');
            }
            catch (AccountingException $error) { $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'invalid_installments']); }
        }
    }
    return $pricing;
}
function registration_invoice(mysqli $db, array $enrollment, array $charge): ?array {
    return eb_existing_invoice($db, $enrollment, $charge);
}

// Both authenticated ingestion paths call this inside registration_process's transaction.
function registration_auto_issue(mysqli $db, array $actor, array $context, string $date): array {
    require_once __DIR__.'/billing_invoice.php';
    $enrollment = $context['enrollment'];
    if (!$enrollment || $context['pricing']['status'] !== 'approved' || ($context['approval']['status'] ?? '') !== 'approved') return $context;
    $automatic = [];
    foreach (ac_rows($db, 'SELECT * FROM enrollment_charges WHERE enrollment_id=? ORDER BY id', [(int)$enrollment['id']]) as $candidate) if (eb_snapshot($candidate['policy_snapshot'], $candidate['policy_hash'])['webhook_issue']) $automatic[] = $candidate;
    if (count($automatic) !== 1) {
        $context['pricing'] = array_replace($context['pricing'], ['status' => 'needs_review', 'reason' => 'charge_policy_not_approved']);
        return $context;
    }
    [$enrollment, $charge, $rule, $policy] = eb_charge($db, (int)$context['student']['id'], (int)$enrollment['id'], (int)$automatic[0]['id']);
    $existing = registration_invoice($db, $enrollment, $charge);
    if (!$existing && ($reason = eb_legacy_review($db, $enrollment, $rule))) {
        ac_query($db, 'UPDATE student_enrollments SET review_reason=? WHERE id=?', [$reason, (int)$enrollment['id']]);
        $context['pricing'] = array_replace($context['pricing'], ['status' => 'needs_review', 'reason' => $reason]);
        return $context;
    }
    $date = $existing['tanggal'] ?? $date;
    $schedule = sp_schedule(['status' => 'approved', 'rule' => $policy], $date);
    $body = ['student_id' => (int)$context['student']['id'], 'enrollment_id' => (int)$enrollment['id'], 'charge_id' => (int)$charge['id'], 'bank_account_id' => $policy['bank_account_id'], 'tanggal' => $date, 'jatuhTempo' => $schedule[0]['jatuhTempo'], 'total' => $policy['amount']];
    // Configuration failure must preserve the registration, without a guessed bank snapshot.
    if (!$existing) {
        try { billing_invoice_bank($db, $body); }
        catch (AccountingException $error) {
            $context['pricing'] = array_replace($context['pricing'], ['status' => 'needs_review', 'reason' => 'official_bank_configuration_required']);
            return $context;
        }
    }
    $context['invoice_issue'] = billing_issue_charge($db, $actor, $body, true);
    $context['invoice'] = ac_one($db, 'SELECT * FROM billing_invoices WHERE id=?', [$context['invoice_issue']['id']]);
    if ($context['invoice_issue']['created_now']) {
        $invoice = $context['invoice'];
        $channel = !empty($invoice['phone']) && $invoice['phone'] !== '-' ? 'WhatsApp' : 'Email';
        ac_query($db, "INSERT INTO billing_terkirim(id,tglKirim,customer,kanal,penerima,statusKirim,statusBaca,created_at) VALUES(?,?,?,?,?,'Menunggu Bot','Pending',NOW())", [$invoice['id'], $date, $invoice['customer'], $channel, $channel === 'WhatsApp' ? $invoice['phone'] : $invoice['email']]);
    }
    // AKN-01: akun siswa dibuat setelah invoice resmi terbit (alur to-be notulen 31 Okt 2026).
    require_once __DIR__.'/student_account.php';
    $context['account'] = sa_provision($db, $actor, (int)$context['student']['id']);
    return $context;
}
function registration_process(mysqli $db, array $actor, array $input, string $channel, ?callable $publish = null): array {
    eb_ready($db);
    $parsed = registration_fields($input); $fields = $parsed['fields'];
    $external = registration_external($input['external_enrollment_id'] ?? null, 'external_enrollment_id');
    if (isset($input['source']) && $input['source'] !== $fields['source']) ac_fail('Namespace sumber tidak diotorisasi.');
    $identity = registration_person($parsed);
    $approval = registration_approval($parsed);
    if ($identity === null) {
        ac_atomic($db, fn() => ac_audit($db, $actor, 'registration_review', bin2hex(random_bytes(12)), 'needs_review', ['channel' => $channel, 'source' => $fields['source'], 'source_record_id' => $fields['web_id'], 'reason' => 'missing_upstream_student_identity', 'registration' => $fields, 'external_enrollment_id' => $external, 'approval' => $approval]));
        return ['student' => null, 'student_created' => false, 'enrollment' => null, 'pricing' => ['status' => 'needs_review', 'reason' => 'missing_upstream_student_identity'], 'invoice' => null];
    }
    $lock = 'reg:'.substr(hash('sha256', $fields['source'].':'.$identity), 0, 55);
    if ((int)ac_one($db, 'SELECT GET_LOCK(?,5) AS acquired', [$lock])['acquired'] !== 1) ac_fail('Pendaftaran sedang diproses. Periksa hasil sebelum retry.', 409);
    try {
        return ac_atomic($db, function () use ($db, $actor, $parsed, $fields, $identity, $external, $channel, $publish, $approval) {
            $mapping = ac_one($db, 'SELECT student_id FROM student_external_identities WHERE source=? AND external_student_id=? FOR UPDATE', [$fields['source'], $identity]);
            $old = $mapping ? ac_one($db, 'SELECT * FROM peserta_intensif WHERE id=? FOR UPDATE', [(int)$mapping['student_id']]) : null;
            if (preg_match('/^[1-9][0-9]{15}$/D', $fields['no_ktp']) && !preg_match('/^(.)\1{15}$/D', $fields['no_ktp'])) {
                $matches = ac_rows($db, 'SELECT * FROM peserta_intensif WHERE no_ktp=? FOR UPDATE', [$fields['no_ktp']]);
                if (count($matches) > 1 || ($old && $matches && (int)$old['id'] !== (int)$matches[0]['id']) || ($old && !empty($old['no_ktp']) && $old['no_ktp'] !== $fields['no_ktp'])) ac_fail('Identitas siswa/NIK bertentangan. Review diperlukan.', 409);
                $old ??= $matches[0] ?? null;
            }
            // Contacts can flag unresolved legacy people, but can never assign ownership.
            if (!$old && (($fields['email'] !== '' && ac_one($db, 'SELECT p.id FROM peserta_intensif p WHERE p.email=? AND NOT EXISTS(SELECT 1 FROM student_external_identities x WHERE x.student_id=p.id) LIMIT 1 FOR UPDATE', [$fields['email']])) || ($fields['no_wa'] !== '' && $fields['no_wa'] !== '-' && ac_one($db, 'SELECT p.id FROM peserta_intensif p WHERE p.no_wa=? AND NOT EXISTS(SELECT 1 FROM student_external_identities x WHERE x.student_id=p.id) LIMIT 1 FOR UPDATE', [$fields['no_wa']])))) ac_fail('Identitas legacy perlu direkonsiliasi sebelum dihubungkan ke sumber upstream.', 409);
            $previous = $external === null ? null : ac_one($db, 'SELECT * FROM student_enrollments WHERE source=? AND external_enrollment_id=? FOR UPDATE', [$fields['source'], $external]);
            if ($previous && (!$old || (int)$previous['student_id'] !== (int)$old['id'])) ac_fail('Enrollment dimiliki identitas siswa lain.', 409);
            // Missing fields may reuse this exact enrollment, never the student's previous program/fee.
            $program = $fields['program'] !== '' ? $fields['program'] : ($previous['program_id'] ?? '');
            $scheme = $fields['metode_pembayaran'] !== '' ? $fields['metode_pembayaran'] : ($previous['payment_scheme'] ?? '');
            $frozenRule = $previous && $previous['pricing_snapshot'] !== null ? eb_snapshot($previous['pricing_snapshot'], $previous['pricing_hash']) : null;
            $issued = $previous ? ac_one($db, "SELECT i.tanggal FROM enrollment_charges c JOIN billing_invoices i ON i.id=c.billing_invoice_id WHERE c.enrollment_id=? AND JSON_UNQUOTE(JSON_EXTRACT(c.policy_snapshot,'$.webhook_issue'))='true' LIMIT 1", [(int)$previous['id']]) : null;
            $pricing = registration_pricing($parsed, $program, $scheme, $frozenRule, $issued['tanggal'] ?? null);
            $invalidNik = $fields['no_ktp'] !== '' && $fields['no_ktp'] !== '-' && (!preg_match('/^[1-9][0-9]{15}$/D', $fields['no_ktp']) || preg_match('/^(.)\1{15}$/D', $fields['no_ktp']));
            if ($invalidNik) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'invalid_student_identity']);
            if ($frozenRule && ($frozenRule['source_registration_id'] ?? null) !== $fields['web_id']) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'source_registration_conflict']);
            if ($approval['status'] !== 'approved') $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => $approval['reason']]);
            if ($pricing['status'] === 'approved') {
                // Existing snapshots are immutable; legacy evidence requires explicit reconciliation.
                if ($frozenRule && !isset($frozenRule['registration_approval'])) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'legacy_registration_approval_needs_reconciliation']);
                else {
                    $pricing['rule']['registration_approval'] = $frozenRule['registration_approval'] ?? $approval;
                    $pricing['rule']['source_registration_id'] = $frozenRule['source_registration_id'] ?? $fields['web_id'];
                }
            }
            if ($external === null) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'missing_upstream_enrollment_identity']);
            $write = array_filter($fields, fn($value) => $value !== '' && $value !== null);
            if ($invalidNik) unset($write['no_ktp']);
            unset($write['web_id'], $write['program'], $write['metode_pembayaran']);
            if ($old) unset($write['batch'], $write['status']);
            // Keep legacy operational pricing intact for existing people, across all later enrollments.
            if (!$old) $write += ['no_wa' => '', 'email' => '', 'program' => $program, 'metode_pembayaran' => sp_scheme_label(sp_scheme($scheme)) ?? $scheme, 'total_biaya' => $pricing['status'] === 'approved' ? $pricing['amount'] : null, 'status' => $channel === 'sync' ? 'Aktif' : 'Menunggu Pembayaran'];
            $columns = array_column(ac_rows($db, 'SHOW COLUMNS FROM peserta_intensif'), 'Field');
            $write = array_intersect_key($write, array_flip($columns));
            if ($old) {
                $assignments = implode(',', array_map(fn($column) => $column.'=?', array_keys($write)));
                ac_query($db, 'UPDATE peserta_intensif SET '.$assignments.' WHERE id=?', [...array_values($write), (int)$old['id']]); $id = (int)$old['id'];
            } else {
                ac_query($db, 'INSERT INTO peserta_intensif ('.implode(',', array_keys($write)).') VALUES('.implode(',', array_fill(0, count($write), '?')).')', array_values($write)); $id = (int)$db->insert_id;
            }
            if (!$mapping) ac_query($db, 'INSERT INTO student_external_identities(student_id,source,external_student_id) VALUES(?,?,?)', [$id, $fields['source'], $identity]);
            $enrollment = null;
            if ($external !== null) [$enrollment, $pricing] = eb_enrollment($db, $actor, $id, $fields['source'], $external, $program, $scheme, $fields['batch'], $parsed['claims'], $pricing);
            $student = ac_one($db, 'SELECT * FROM peserta_intensif WHERE id=?', [$id]);
            $result = ['student' => $student, 'student_created' => !$old, 'enrollment' => $enrollment, 'pricing' => $pricing, 'approval' => $approval, 'invoice' => null];
            if ($publish) $result = $publish($result);
            ac_audit($db, $actor, 'student_pricing', (string)$id, $result['pricing']['status'], ['channel' => $channel, 'enrollment_id' => $enrollment['id'] ?? null, 'external_enrollment_id' => $external, 'legacy_web_id' => $fields['web_id'], 'approval' => $approval, 'upstream_status' => $fields['status'], 'cohort' => $fields['batch'], 'reason' => $result['pricing']['reason'], 'claimed_amounts' => $parsed['claims'], 'stored_amount' => $student['total_biaya'] ?? null]);
            return $result;
        });
    } catch (AccountingException $error) {
        if ($error->getCode() === 409) ac_atomic($db, fn() => ac_audit($db, $actor, 'registration_review', bin2hex(random_bytes(12)), 'needs_review', ['channel' => $channel, 'source' => $fields['source'], 'source_record_id' => $fields['web_id'], 'external_enrollment_id' => $external, 'reason' => $error->getMessage(), 'approval' => $approval]));
        throw $error;
    } catch (mysqli_sql_exception $error) {
        if (in_array($error->getCode(), [1062, 1205, 1213], true)) ac_fail('Konflik identitas/enrollment. Periksa data server sebelum retry.', 409);
        throw $error;
    } finally { ac_query($db, 'SELECT RELEASE_LOCK(?)', [$lock]); }
}
