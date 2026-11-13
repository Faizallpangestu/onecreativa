<?php
require_once __DIR__.'/accounting_core.php';

function sp_programs(): array {
    // Legacy naming aliases only. These names do NOT approve any legacy price.
    return [
        'intensif_offline' => ['name' => 'Intensif Offline', 'aliases' => ['intensif', 'intensif offline', 'kelas intensif offline', 'kelas intensif offline (full payment)', 'kelas intensif offline (cicilan)', 'program pelatihan jepang']],
        'kaigo_dana_talang' => ['name' => 'Kaigo Dana Talang', 'aliases' => ['kaigo', 'kaigo dana talang', 'program kaigo dana talang', 'program ssw kaigo']],
        'matching_job' => ['name' => 'Matching Job', 'aliases' => ['matching job', 'program matching job']],
        'sotsugyousei' => ['name' => 'Sotsugyousei', 'aliases' => ['sotsugyousei', 'program sotsugyousei']],
        'kursus_reguler' => ['name' => 'Kursus Reguler', 'aliases' => ['kursus reguler', 'kelas reguler', 'reguler']],
    ];
}
function sp_key($value): string { return is_string($value) ? preg_replace('/\s+/u', ' ', mb_strtolower(trim($value))) : ''; }
function sp_program($value): ?string {
    $key = sp_key($value);
    foreach (sp_programs() as $id => $program) if ($key === $id || in_array($key, $program['aliases'], true)) return $id;
    return null;
}
function sp_scheme($value): ?string {
    $aliases = json_decode(file_get_contents(__DIR__.'/../config/payment_schemes.json'), true, 512, JSON_THROW_ON_ERROR);
    foreach ($aliases as $scheme => $names) if (in_array(sp_key($value), $names, true)) return $scheme;
    return null;
}
function sp_scheme_label(?string $scheme): ?string { return ['full' => 'Full Payment', 'cicilan' => 'Cicilan'][$scheme] ?? null; }

function sp_terms($terms, string $scheme, int $total): array {
    if (!is_array($terms) || !array_is_list($terms) || count($terms) < ($scheme === 'full' ? 1 : 2) || count($terms) > 120 || ($scheme === 'full' && count($terms) !== 1)) ac_fail('Jumlah termin rule tidak valid.');
    $sum = 0; $previous = -1;
    foreach ($terms as &$term) {
        $amount = ac_cents($term['amount'] ?? null);
        if (!$amount || !is_int($term['due_days'] ?? null) || $term['due_days'] < $previous || $term['due_days'] < 0 || $term['due_days'] > 3660) ac_fail('Nominal/jadwal termin rule tidak valid.');
        $term['label'] = ac_text($term['label'] ?? null, 'Label termin', 255);
        $term['amount'] = ac_decimal($amount); $sum = ac_add($sum, $amount); $previous = $term['due_days'];
    }
    unset($term);
    if ($sum !== $total) ac_fail('Total termin rule tidak sama dengan harga approved.');
    return $terms;
}
function sp_charge_policies(array $rule): array {
    $charges = $rule['charges'] ?? [];
    if (!is_array($charges) || !array_is_list($charges) || count($charges) > 120) ac_fail('Charge policies tidak valid.');
    $seen = []; $automatic = 0;
    foreach ($charges as &$charge) {
        if (!is_array($charge) || !in_array($charge['type'] ?? '', ['program_fee', 'registration_fee', 'additional_fee'], true) || !preg_match('/^[a-zA-Z0-9_-]{1,100}$/D', $charge['key'] ?? '')) ac_fail('Identitas charge policy tidak valid.');
        if (($charge['approval']['status'] ?? '') !== 'approved') ac_fail('Charge memerlukan approval tersendiri.');
        foreach (['reference', 'approved_by'] as $field) ac_text($charge['approval'][$field] ?? null, 'Approval charge', 255);
        ac_date($charge['approval']['approved_on'] ?? null);
        if (!in_array($charge['scheme'] ?? '', ['full', 'cicilan'], true)) ac_fail('Skema charge tidak valid.');
        $charge['label'] = ac_text($charge['label'] ?? null, 'Label charge', 255);
        $total = ac_cents($charge['amount'] ?? null);
        if (!$total || ac_cents($charge['discount'] ?? null) !== 0) ac_fail('Nominal/diskon charge tidak valid.');
        $charge['amount'] = ac_decimal($total);
        $charge['installments'] = sp_terms($charge['installments'] ?? null, $charge['scheme'], $total);
        if ($charge['type'] === 'program_fee' && ($charge['amount'] !== $rule['amount'] || $charge['scheme'] !== $rule['scheme'] || $charge['installments'] !== $rule['installments'])) ac_fail('Program fee harus sesuai rule program approved.');
        $key = $charge['type'].':'.$charge['key'];
        if (isset($seen[$key])) ac_fail('Charge policy duplikat.');
        $seen[$key] = true;
        if (!is_bool($charge['webhook_issue'] ?? null)) ac_fail('Otorisasi auto-issue charge diperlukan.');
        if (isset($charge['bank_account_id'])) $charge['bank_account_id'] = ac_id($charge['bank_account_id'], 'Rekening policy');
        if ($charge['webhook_issue'] && !isset($charge['bank_account_id'])) ac_fail('Rekening resmi auto-issue belum ditetapkan.');
        if ($charge['webhook_issue']) $automatic++;
    }
    unset($charge);
    if ($automatic > 1) ac_fail('Auto-issue webhook ambigu; satu initial charge harus ditetapkan eksplisit.');
    return $charges;
}

function sp_catalog(): array {
    $file = defined('STUDENT_PRICING_RULES_FILE') ? STUDENT_PRICING_RULES_FILE : __DIR__.'/../config/student_pricing.json';
    if (!is_file($file)) ac_fail('Konfigurasi pricing belum tersedia. Review Finance diperlukan.', 409);
    try { $config = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR); }
    catch (Throwable $error) { ac_fail('Konfigurasi pricing tidak valid. Review Finance diperlukan.', 409); }
    if (($config['version'] ?? null) !== 1 || !is_array($config['rules'] ?? null) || !array_is_list($config['rules'])) ac_fail('Format katalog pricing tidak valid.', 409);
    $rules = [];
    try {
        foreach ($config['rules'] as $rule) {
            if (!is_array($rule)) ac_fail('Rule pricing tidak valid.');
            if (($rule['approval']['status'] ?? '') !== 'approved' || ($rule['active'] ?? false) !== true) continue;
            $rule['id'] = ac_text($rule['id'] ?? null, 'ID rule', 100);
            foreach (['reference', 'approved_by'] as $field) ac_text($rule['approval'][$field] ?? null, 'Bukti persetujuan Finance', 255);
            ac_date($rule['approval']['approved_on'] ?? null);
            if (!isset(sp_programs()[$rule['program'] ?? '']) || !in_array($rule['scheme'] ?? '', ['full', 'cicilan'], true)) ac_fail('Program/skema rule tidak valid.');
            $total = ac_cents($rule['amount'] ?? null);
            if (!$total || ac_cents($rule['discount'] ?? null) !== 0) ac_fail('Nominal/diskon rule tidak didukung.');
            $rule['amount'] = ac_decimal($total); $rule['installments'] = sp_terms($rule['installments'] ?? null, $rule['scheme'], $total);
            $rule['charges'] = sp_charge_policies($rule);
            $key = $rule['program'].':'.$rule['scheme'];
            if (isset($rules[$key])) ac_fail('Rule aktif program/skema bertentangan.');
            $rule['hash'] = hash('sha256', json_encode($rule, JSON_THROW_ON_ERROR));
            $rules[$key] = $rule;
        }
    } catch (Throwable $error) { ac_fail('Rule pricing approved tidak lengkap atau bertentangan. Review Finance diperlukan.', 409); }
    return $rules;
}

function sp_evaluate($program, $scheme, array $claims = []): array {
    $programId = sp_program($program);
    try { $schemeId = sp_scheme($scheme); }
    catch (Throwable $error) { return ['status' => 'needs_review', 'reason' => 'invalid_pricing_configuration', 'program_id' => $programId, 'scheme' => null, 'amount' => null, 'rule' => null]; }
    $result = ['status' => 'needs_review', 'reason' => '', 'program_id' => $programId, 'scheme' => $schemeId, 'amount' => null, 'rule' => null];
    if (!$programId) return array_replace($result, ['reason' => 'unknown_program']);
    if (!$schemeId) return array_replace($result, ['reason' => 'unknown_scheme']);
    $amounts = [];
    foreach ($claims as $value) {
        if ($value === null || $value === '') continue; // Missing assertions never erase stored verified data.
        try { $amount = ac_cents($value); if (!$amount) ac_fail('Nominal harus positif.'); }
        catch (AccountingException $error) { return array_replace($result, ['reason' => 'invalid_amount']); }
        $amounts[] = $amount;
    }
    try { $rules = sp_catalog(); }
    catch (AccountingException $error) { return array_replace($result, ['reason' => 'invalid_pricing_configuration']); }
    $rule = $rules[$programId.':'.$schemeId] ?? null;
    if (!$rule) return array_replace($result, ['reason' => 'pricing_not_approved']);
    foreach ($amounts as $amount) if ($amount !== ac_cents($rule['amount'])) return array_replace($result, ['reason' => 'amount_mismatch']);
    return array_replace($result, ['status' => 'approved', 'reason' => '', 'amount' => $rule['amount'], 'rule' => $rule]);
}
function sp_schedule(array $decision, string $date): array {
    if ($decision['status'] !== 'approved') ac_fail('Pricing belum disetujui Finance.', 409);
    $anchor = new DateTimeImmutable(ac_date($date)); $schedule = [];
    foreach ($decision['rule']['installments'] as $index => $term) $schedule[] = [
        'id' => $index + 1, 'deskripsi' => $term['label'], 'keterangan' => $term['label'],
        'nominal' => $term['amount'], 'jatuhTempo' => $anchor->modify('+'.$term['due_days'].' days')->format('Y-m-d'),
    ];
    return $schedule;
}
function sp_proof(array $decision): array {
    return ['rule_id' => $decision['rule']['id'], 'rule_hash' => $decision['rule']['hash'], 'approval_reference' => $decision['rule']['approval']['reference']];
}
function sp_invoice_pricing(array $student, array $body, string $date, string $due): array {
    $decision = sp_evaluate($student['program'] ?? '', $student['metode_pembayaran'] ?? '', [$student['total_biaya'] ?? null]);
    if ($decision['status'] !== 'approved') ac_fail('Pricing siswa belum dapat dikonfirmasi ('.$decision['reason'].'). Review Finance diperlukan.', 409);
    $expected = sp_schedule($decision, $date);
    if (array_key_exists('skema', $body) && sp_scheme($body['skema']) !== $decision['scheme']) ac_fail('Skema invoice tidak sesuai pricing approved.');
    $actual = array_key_exists('installments', $body) ? $body['installments'] : $expected;
    if (!is_array($actual) || !array_is_list($actual) || count($actual) !== count($expected)) ac_fail('Jumlah termin tidak sesuai rule approved.');
    foreach ($actual as $index => $term) {
        if (!is_array($term) || ac_cents($term['nominal'] ?? null) !== ac_cents($expected[$index]['nominal']) || ($term['jatuhTempo'] ?? null) !== $expected[$index]['jatuhTempo']) ac_fail('Nominal atau jadwal termin tidak sesuai rule approved.');
    }
    if ($due !== $expected[0]['jatuhTempo']) ac_fail('Jatuh tempo invoice tidak sesuai rule approved.');
    return [$decision, array_replace($body, ['skema' => $decision['scheme'], 'installments' => $actual])];
}
function sp_format_rupiah($amount): string {
    [$whole, $fraction] = explode('.', ac_decimal(ac_cents($amount)));
    return 'Rp '.preg_replace('/\B(?=(\d{3})+(?!\d))/', '.', $whole).($fraction === '00' ? '' : ','.$fraction);
}
