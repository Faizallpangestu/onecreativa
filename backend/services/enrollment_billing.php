<?php
require_once __DIR__.'/student_pricing.php';

function eb_ready(mysqli $db): void {
    foreach (['student_external_identities', 'student_enrollments', 'enrollment_charges', 'invoice_sequences'] as $table) if (!ac_table($db, $table)) ac_fail('Migrasi enrollment BE-03 belum tersedia. Hubungi Finance/DB PIC.', 409);
    if (!ac_table($db, 'schema_migrations') || !ac_one($db, 'SELECT version FROM schema_migrations WHERE version=?', ['finance_enrollments_v1'])) ac_fail('Migrasi enrollment BE-03 belum selesai diverifikasi.', 409);
}
function eb_json(array $value): string { return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE); }
function eb_snapshot(string $json, string $hash): array {
    if (!hash_equals($hash, hash('sha256', $json))) ac_fail('Snapshot pricing perlu direkonsiliasi.', 409);
    try { $value = json_decode($json, true, 512, JSON_THROW_ON_ERROR); }
    catch (Throwable $error) { ac_fail('Snapshot pricing tidak valid.', 409); }
    if (!is_array($value)) ac_fail('Snapshot pricing tidak valid.', 409);
    return $value;
}
function eb_decision(array $rule): array {
    return ['status' => 'approved', 'reason' => '', 'program_id' => $rule['program'], 'scheme' => $rule['scheme'], 'amount' => $rule['amount'], 'rule' => $rule];
}

// Caller owns the registration transaction. External occurrence identity is explicit, never web_id.
function eb_enrollment(mysqli $db, array $actor, int $student, string $source, string $external, string $program, string $scheme, string $cohort, array $claims, array $decision): array {
    $old = ac_one($db, 'SELECT * FROM student_enrollments WHERE source=? AND external_enrollment_id=? FOR UPDATE', [$source, $external]);
    if ($old && (int)$old['student_id'] !== $student) ac_fail('Enrollment dimiliki siswa lain.', 409);
    if ($old && $old['pricing_snapshot'] !== null) {
        $rule = eb_snapshot($old['pricing_snapshot'], $old['pricing_hash']);
        $incoming = $decision;
        $decision = eb_decision($rule);
        if (sp_program($program) !== $rule['program'] || sp_scheme($scheme) !== $rule['scheme'] || ($cohort !== '' && $cohort !== (string)$old['cohort'])) $decision = array_replace($decision, ['status' => 'needs_review', 'reason' => 'enrollment_identity_conflict']);
        foreach ($claims as $claim) {
            if ($claim === null || $claim === '') continue;
            try { if (ac_cents($claim) !== ac_cents($rule['amount'])) ac_fail('Nominal bertentangan.'); }
            catch (AccountingException $error) { if ($decision['status'] === 'approved') $decision = array_replace($decision, ['status' => 'needs_review', 'reason' => 'amount_mismatch']); }
        }
        if ($decision['status'] === 'approved' && in_array($incoming['reason'], ['invalid_amount', 'discount_not_approved', 'invalid_installments', 'conflicting_program', 'conflicting_scheme'], true)) $decision = array_replace($decision, ['status' => 'needs_review', 'reason' => $incoming['reason']]);
        // Immutable approved snapshot; a failed incoming assertion blocks issuance until resolved.
        ac_query($db, 'UPDATE student_enrollments SET review_reason=? WHERE id=?', [$decision['reason'], (int)$old['id']]);
    } else {
        $snapshot = $decision['status'] === 'approved' ? eb_json($decision['rule']) : null;
        $values = [sp_program($program), $cohort ?: null, sp_scheme($scheme), $decision['status'], $decision['reason'], $snapshot, $snapshot === null ? null : hash('sha256', $snapshot)];
        if ($old) {
            ac_query($db, 'UPDATE student_enrollments SET program_id=?,cohort=?,payment_scheme=?,enrollment_status=?,review_reason=?,pricing_snapshot=?,pricing_hash=? WHERE id=?', [...$values, (int)$old['id']]);
        } else {
            ac_query($db, 'INSERT INTO student_enrollments(student_id,source,external_enrollment_id,program_id,cohort,payment_scheme,enrollment_status,review_reason,pricing_snapshot,pricing_hash) VALUES(?,?,?,?,?,?,?,?,?,?)', [$student, $source, $external, ...$values]);
            $old = ['id' => (int)$db->insert_id];
        }
        if ($decision['status'] === 'approved') foreach ($decision['rule']['charges'] as $policy) {
            $json = eb_json($policy);
            ac_query($db, 'INSERT INTO enrollment_charges(enrollment_id,charge_type,charge_key,amount,policy_snapshot,policy_hash) VALUES(?,?,?,?,?,?)', [(int)$old['id'], $policy['type'], $policy['key'], $policy['amount'], $json, hash('sha256', $json)]);
        }
    }
    $enrollment = ac_one($db, 'SELECT * FROM student_enrollments WHERE id=?', [(int)$old['id']]);
    ac_audit($db, $actor, 'student_enrollment', (string)$old['id'], $decision['status'], ['student_id' => $student, 'source' => $source, 'external_enrollment_id' => $external, 'reason' => $decision['reason'], 'pricing_hash' => $enrollment['pricing_hash']]);
    return [$enrollment, $decision];
}

function eb_charge(mysqli $db, int $student, int $enrollmentId, int $chargeId, bool $lock = true): array {
    eb_ready($db);
    $suffix = $lock ? ' FOR UPDATE' : '';
    $enrollment = ac_one($db, 'SELECT * FROM student_enrollments WHERE id=?'.$suffix, [$enrollmentId]);
    if (!$enrollment) ac_fail('Enrollment tidak ditemukan.', 404);
    if ((int)$enrollment['student_id'] !== $student) ac_fail('Enrollment bukan milik siswa ini.', 409);
    $charge = ac_one($db, 'SELECT * FROM enrollment_charges WHERE id=? AND enrollment_id=?'.$suffix, [$chargeId, $enrollmentId]);
    if (!$charge) ac_fail('Charge tidak terotorisasi untuk enrollment ini.', 422);
    $rule = eb_snapshot($enrollment['pricing_snapshot'] ?? '', $enrollment['pricing_hash'] ?? '');
    $policy = eb_snapshot($charge['policy_snapshot'], $charge['policy_hash']);
    $expected = array_values(array_filter($rule['charges'] ?? [], fn($candidate) => $candidate['type'] === $charge['charge_type'] && $candidate['key'] === $charge['charge_key']));
    if (count($expected) !== 1 || $expected[0] !== $policy || $policy['amount'] !== $charge['amount']) ac_fail('Otorisasi charge tidak sesuai snapshot enrollment.', 409);
    return [$enrollment, $charge, $rule, $policy];
}
function eb_existing_invoice(mysqli $db, array $enrollment, array $charge): ?array {
    if ($charge['billing_invoice_id'] === null) return null;
    $invoice = ac_one($db, 'SELECT * FROM billing_invoices WHERE id=? FOR UPDATE', [$charge['billing_invoice_id']]);
    $meta = json_decode($invoice['meta_json'] ?? '', true);
    if (!$invoice || !is_array($meta) || (string)($meta['student_id'] ?? '') !== (string)$enrollment['student_id'] || (string)($meta['enrollment_id'] ?? '') !== (string)$enrollment['id'] || (string)($meta['charge_id'] ?? '') !== (string)$charge['id']) ac_fail('Ownership invoice/charge perlu direkonsiliasi.', 409);
    // Cancelled/voided charges remain consumed. Replacements require a separate approved process.
    return $invoice;
}
function eb_number(mysqli $db, ?string $period = null): string {
    $period ??= (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('ym');
    if (!preg_match('/^\d{2}(0[1-9]|1[0-2])$/D', $period)) ac_fail('Periode sequence tidak valid.');
    $prefix = 'TGCJ'.$period;
    ac_query($db, 'INSERT IGNORE INTO invoice_sequences(prefix,next_value) VALUES(?,1)', [$prefix]);
    $next = (int)ac_one($db, 'SELECT next_value FROM invoice_sequences WHERE prefix=? FOR UPDATE', [$prefix])['next_value'];
    while ($next <= 9999) {
        $id = $prefix.str_pad((string)$next++, 4, '0', STR_PAD_LEFT);
        if (ac_one($db, 'SELECT id FROM billing_invoices WHERE id=?', [$id])) continue;
        ac_query($db, 'UPDATE invoice_sequences SET next_value=? WHERE prefix=?', [$next, $prefix]);
        return $id;
    }
    ac_fail('Nomor invoice periode ini telah mencapai 9999. Review Finance diperlukan.', 409);
}
function eb_lookups(mysqli $db): array {
    if (!ac_table($db, 'student_enrollments') || !ac_table($db, 'enrollment_charges')) return ['enrollments' => [], 'charges' => [], 'enrollment_schema_ready' => false];
    $enrollments = ac_rows($db, 'SELECT id,student_id,source,external_enrollment_id,program_id,cohort,payment_scheme,enrollment_status,review_reason FROM student_enrollments ORDER BY id DESC');
    foreach ($enrollments as &$enrollment) $enrollment['program'] = sp_programs()[$enrollment['program_id']]['name'] ?? $enrollment['program_id'];
    unset($enrollment);
    $charges = ac_rows($db, 'SELECT c.id,c.enrollment_id,c.charge_type,c.charge_key,c.amount,c.billing_invoice_id,c.policy_snapshot,c.policy_hash FROM enrollment_charges c JOIN student_enrollments e ON e.id=c.enrollment_id WHERE e.enrollment_status=\'approved\' AND e.review_reason=\'\' ORDER BY c.id');
    foreach ($charges as &$charge) {
        $policy = eb_snapshot($charge['policy_snapshot'], $charge['policy_hash']);
        $charge['label'] = $policy['label']; $charge['scheme'] = $policy['scheme']; $charge['installments'] = $policy['installments'];
        unset($charge['policy_snapshot'], $charge['policy_hash']);
    }
    unset($charge);
    return ['enrollments' => $enrollments, 'charges' => $charges, 'enrollment_schema_ready' => true];
}
