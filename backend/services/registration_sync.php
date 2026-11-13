<?php
require_once __DIR__.'/student_pricing.php';

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
    if ($web !== null && $web !== '') $web = ac_id($web, 'ID pendaftar upstream'); else $web = null;
    if (isset($input['web_id'], $input['id']) && ac_id($input['id']) !== $web) ac_fail('ID upstream bertentangan.', 409);
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

function registration_invoice(mysqli $db, array $student, string $key): array {
    $webId = !empty($student['web_id']) ? (string)$student['web_id'] : '__missing__';
    $rows = ac_rows($db, "SELECT * FROM billing_invoices WHERE JSON_VALID(meta_json) AND
        (JSON_UNQUOTE(JSON_EXTRACT(meta_json,'$.registration_key'))=? OR JSON_UNQUOTE(JSON_EXTRACT(meta_json,'$.student_id'))=?
        OR (JSON_UNQUOTE(JSON_EXTRACT(meta_json,'$.web_id'))=? AND JSON_UNQUOTE(JSON_EXTRACT(meta_json,'$.source'))='rpa-phase1-webhook')) FOR UPDATE",
        [$key, (string)$student['id'], $webId]);
    if (count($rows) > 1) return [null, 'multiple_existing_invoices'];
    if ($rows) {
        $meta = json_decode($rows[0]['meta_json'], true);
        if (isset($meta['student_id']) && (string)$meta['student_id'] !== (string)$student['id']) return [null, 'invoice_owner_conflict'];
        if (($meta['registration_key'] ?? '') === $key || ($webId !== '__missing__' && (string)($meta['web_id'] ?? '') === $webId && ($meta['source'] ?? '') === 'rpa-phase1-webhook')) return [$rows[0], ''];
        return [null, 'existing_student_invoice_requires_review'];
    }
    // Contact collisions block issuance for review; they never establish ownership or student identity.
    if (($student['email'] ?? '') !== '' && ac_one($db, 'SELECT id FROM billing_invoices WHERE email=? LIMIT 1 FOR UPDATE', [$student['email']])) return [null, 'legacy_invoice_ownership_unknown'];
    return [null, ''];
}

function registration_process(mysqli $db, array $actor, array $input, string $channel, ?callable $publish = null): array {
    $parsed = registration_fields($input); $fields = $parsed['fields'];
    $identity = $fields['web_id'] !== null ? 'web:'.$fields['web_id'] : ($fields['no_ktp'] !== '' && $fields['no_ktp'] !== '-' ? 'nik:'.$fields['no_ktp'] : null);
    if ($identity === null) {
        ac_atomic($db, fn() => ac_audit($db, $actor, 'registration_review', bin2hex(random_bytes(12)), 'needs_review', ['channel' => $channel, 'source' => $fields['source'], 'reason' => 'missing_stable_identity', 'registration' => $fields]));
        return ['student' => null, 'student_created' => false, 'pricing' => ['status' => 'needs_review', 'reason' => 'missing_stable_identity'], 'invoice' => null];
    }
    $registrationKey = $fields['source'].':'.$identity;
    // Both entry points use the same source-ID lock; no new production index/table is required.
    $lock = 'reg:'.substr(hash('sha256', $registrationKey), 0, 55);
    if ((int)ac_one($db, 'SELECT GET_LOCK(?,5) AS acquired', [$lock])['acquired'] !== 1) ac_fail('Pendaftaran sedang diproses. Periksa hasil sebelum retry.', 409);
    try {
        return ac_atomic($db, function () use ($db, $actor, $parsed, $fields, $registrationKey, $channel, $publish) {
            $matches = $fields['web_id'] !== null ? ac_rows($db, "SELECT * FROM peserta_intensif WHERE web_id=? AND (source=? OR source IS NULL OR source='') FOR UPDATE", [$fields['web_id'], $fields['source']]) : [];
            if (!$matches && $fields['no_ktp'] !== '' && $fields['no_ktp'] !== '-') $matches = ac_rows($db, 'SELECT * FROM peserta_intensif WHERE no_ktp=? FOR UPDATE', [$fields['no_ktp']]);
            if (count($matches) > 1) ac_fail('Identitas pendaftar ambigu. Review Finance diperlukan.', 409);
            $old = $matches[0] ?? null;
            if ($old && !empty($old['source']) && $old['source'] !== $fields['source']) ac_fail('Sumber identitas siswa berbeda. Review diperlukan.', 409);
            if ($old && !empty($old['web_id']) && $fields['web_id'] !== null && (int)$old['web_id'] !== $fields['web_id']) ac_fail('Identitas upstream berbeda dari siswa existing.', 409);
            if ($fields['no_ktp'] !== '' && $fields['no_ktp'] !== '-') {
                $nikMatches = ac_rows($db, 'SELECT id FROM peserta_intensif WHERE no_ktp=? FOR UPDATE', [$fields['no_ktp']]);
                if (count($nikMatches) > 1 || ($nikMatches && (!$old || (int)$nikMatches[0]['id'] !== (int)$old['id']))) ac_fail('NIK dan ID upstream menunjuk siswa berbeda. Review diperlukan.', 409);
            }
            if (!$old && $fields['email'] !== '' && ac_one($db, 'SELECT id FROM peserta_intensif WHERE email=? AND (web_id IS NULL OR web_id=0) LIMIT 1 FOR UPDATE', [$fields['email']])) ac_fail('Identitas legacy perlu direview sebelum dihubungkan ke upstream.', 409);
            $program = $fields['program'] !== '' ? $fields['program'] : ($old['program'] ?? '');
            $scheme = $fields['metode_pembayaran'] !== '' ? $fields['metode_pembayaran'] : ($old['metode_pembayaran'] ?? '');
            $pricing = sp_evaluate($program, $scheme, $parsed['claims']);
            foreach ([$parsed['input'], $parsed['details']] as $record) {
                foreach (['program', 'programMinat'] as $key) if (!empty($record[$key]) && sp_program($record[$key]) !== $pricing['program_id']) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'conflicting_program', 'amount' => null]);
                foreach (['metodePembayaran', 'metode_pembayaran', 'tipe_pembayaran', 'skema'] as $key) if (!empty($record[$key]) && sp_scheme($record[$key]) !== $pricing['scheme']) $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'conflicting_scheme', 'amount' => null]);
            }
            foreach ([$parsed['input'], $parsed['details']] as $record) foreach (['discount', 'diskon'] as $discountKey) {
                if (!array_key_exists($discountKey, $record)) continue;
                $discount = $record[$discountKey];
                if (is_array($discount) && !array_key_exists('amount', $discount)) {
                    $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'discount_not_approved', 'amount' => null]);
                    continue;
                }
                $values = is_array($discount) ? array_values(array_intersect_key($discount, array_flip(['amount', 'value']))) : [$discount];
                foreach ($values as $value) {
                    try { if (ac_cents($value) !== 0) ac_fail('Diskon tidak approved.'); }
                    catch (AccountingException $error) { $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'discount_not_approved', 'amount' => null]); }
                }
            }
            $oldAmount = 0;
            foreach ([$parsed['input'], $parsed['details']] as $record) if ($pricing['status'] === 'approved' && array_key_exists('installments', $record)) {
                $date = date('Y-m-d'); $schedule = sp_schedule($pricing, $date);
                try { sp_invoice_pricing(['program' => $program, 'metode_pembayaran' => $scheme, 'total_biaya' => $pricing['amount']], ['installments' => $record['installments']], $date, $schedule[0]['jatuhTempo']); }
                catch (AccountingException $error) { $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'invalid_installments', 'amount' => null]); }
            }
            try { $oldAmount = ac_cents($old['total_biaya'] ?? '0'); } catch (AccountingException $ignored) {}
            if ($oldAmount > 0 && $pricing['status'] === 'approved' && ($oldAmount !== ac_cents($pricing['amount']) || sp_program($old['program'] ?? '') !== $pricing['program_id'] || sp_scheme($old['metode_pembayaran'] ?? '') !== $pricing['scheme'])) {
                $pricing = array_replace($pricing, ['status' => 'needs_review', 'reason' => 'stored_pricing_conflict', 'amount' => null]);
            }
            $write = array_filter($fields, fn($value) => $value !== '' && $value !== null);
            unset($write['program'], $write['metode_pembayaran']);
            if ($pricing['status'] === 'approved') {
                $write += ['program' => sp_programs()[$pricing['program_id']]['name'], 'metode_pembayaran' => sp_scheme_label($pricing['scheme']), 'total_biaya' => $pricing['amount']];
            } elseif (!$old) {
                $write += ['program' => $program, 'metode_pembayaran' => sp_scheme_label($pricing['scheme']) ?? $scheme, 'total_biaya' => null];
            }
            if (!$old) $write += ['no_wa' => '', 'email' => '', 'status' => $channel === 'sync' ? 'Aktif' : 'Menunggu Pembayaran'];
            $columns = array_column(ac_rows($db, 'SHOW COLUMNS FROM peserta_intensif'), 'Field');
            foreach (['web_id', 'source', 'program', 'metode_pembayaran', 'total_biaya'] as $required) if (!in_array($required, $columns, true)) ac_fail('Schema pendaftaran/pricing belum tersedia.', 409);
            $write = array_intersect_key($write, array_flip($columns));
            if ($old) {
                $assignments = implode(',', array_map(fn($column) => "`$column`=?", array_keys($write)));
                ac_query($db, 'UPDATE peserta_intensif SET '.$assignments.' WHERE id=?', [...array_values($write), (int)$old['id']]);
                $id = (int)$old['id'];
            } else {
                ac_query($db, 'INSERT INTO peserta_intensif (`'.implode('`,`', array_keys($write)).'`) VALUES('.implode(',', array_fill(0, count($write), '?')).')', array_values($write));
                $id = (int)$db->insert_id;
            }
            $student = ac_one($db, 'SELECT * FROM peserta_intensif WHERE id=?', [$id]);
            $result = ['student' => $student, 'student_created' => !$old, 'registration_key' => $registrationKey, 'pricing' => $pricing, 'invoice' => null];
            if ($publish) $result = $publish($result);
            ac_audit($db, $actor, 'student_pricing', (string)$id, $result['pricing']['status'], [
                'channel' => $channel, 'registration_key' => $registrationKey, 'reason' => $result['pricing']['reason'],
                'claimed_amounts' => $parsed['claims'], 'stored_amount' => $student['total_biaya'] ?? null,
                'pricing' => $result['pricing']['status'] === 'approved' ? sp_proof($result['pricing']) : null,
            ]);
            return $result;
        });
    } catch (mysqli_sql_exception $error) {
        if ($error->getCode() === 1062) ac_fail('Konflik data pendaftaran/invoice. Periksa hasil sebelum retry.', 409);
        throw $error;
    } finally { ac_query($db, 'SELECT RELEASE_LOCK(?)', [$lock]); }
}
