<?php
// Synthetic, database-free integration checks. Never contact a remote service.
define('RPA_DISABLE_EXTERNAL_DELIVERY', true);
require_once __DIR__.'/../services/registration_sync.php';
require_once __DIR__.'/../services/rpa_automation.php';
require_once __DIR__.'/pricing_fixture.php';
$checks = 0;
function merge_check(bool $condition, string $label): void {
    global $checks;
    if (!$condition) throw new RuntimeException('FAIL: '.$label);
    $checks++; echo 'PASS: '.$label.PHP_EOL;
}
$registration = ['id' => 101, 'nama' => 'Synthetic registrant', 'noKtp' => '3201010101900001', 'program' => 'Intensif', 'skema' => 'full', 'external_enrollment_id' => 'fixture-enrollment', 'details' => ['review_status' => 'approved', 'screening' => ['eligible' => true, 'overallStatus' => 'passed']]];
foreach (['approved', 'pending', 'rejected', 'payment', ''] as $review) {
    $input = $registration; $input['details']['review_status'] = $review;
    $input['details'] = json_encode($input['details']);
    merge_check((registration_approval(registration_fields($input))['status'] === 'approved') === ($review === 'approved'), 'JSON approval gate: '.$review);
}
foreach ([false, 'true', null] as $eligible) {
    $input = $registration; $input['details']['screening']['eligible'] = $eligible; $input['manual_override'] = true;
    merge_check(registration_approval(registration_fields($input))['status'] === 'needs_review', 'Screening failure/ambiguous boolean cannot be overridden');
}
foreach (['Pending', 'Pembayaran', 'Aktif', 'Alumni'] as $status) {
    $input = $registration; unset($input['details']); $input['status'] = $status;
    merge_check(registration_approval(registration_fields($input))['status'] === 'needs_review', 'General status is not approval: '.$status);
}
$pending = $registration; $pending['details']['review_status'] = 'pending';
merge_check(registration_approval(registration_fields($pending))['status'] === 'needs_review' && registration_approval(registration_fields($registration))['status'] === 'approved', 'Pending-to-approved gate transition (pure policy)');
$duplicate = $registration; $duplicate['id'] = 102; $duplicate['details']['review_status'] = 'rejected';
merge_check(registration_person(registration_fields($duplicate)) === registration_person(registration_fields($registration)) && registration_approval(registration_fields($duplicate))['status'] !== 'approved', 'Duplicate source records do not create a second person identity or approve a rejected registration');
$missing = $registration; unset($missing['noKtp'], $missing['external_enrollment_id']);
$parsed = registration_fields($missing);
merge_check(registration_person($parsed) === null && $parsed['fields']['web_id'] === '101' && !isset($parsed['input']['external_enrollment_id']), 'Retain source record; never infer person/enrollment from participant ID');
$missing['email'] = 'synthetic@example.invalid'; $missing['phone'] = '000';
merge_check(registration_person(registration_fields($missing)) === null, 'Contacts never establish ownership');
$missing['external_student_id'] = 'verified-person-fixture';
merge_check(registration_person(registration_fields($missing)) === 'student:verified-person-fixture', 'Explicit external person ID is separate from source record');

$file = tempnam(sys_get_temp_dir(), 'merge01-pricing-');
define('STUDENT_PRICING_RULES_FILE', $file);
try {
    $legacy = pricing_fixture_catalog();
    file_put_contents($file, json_encode($legacy));
    merge_check(sp_evaluate('Intensif', 'cicilan')['status'] === 'approved', 'Previously approved rule without count retains its exact schedule');
    $catalog = ['version' => 1, 'rules' => [$legacy['rules'][0]]];
    foreach ([3, 6] as $count) {
        $rule = $legacy['rules'][1]; $rule['id'] = 'synthetic-'.$count; $rule['installment_count'] = $count;
        $rule['amount'] = '6.03'; $rule['installments'] = [];
        for ($i = 0; $i < $count; $i++) $rule['installments'][] = ['label' => 'Synthetic term '.($i + 1), 'amount' => $i === $count - 1 ? ($count === 3 ? '2.01' : '1.03') : ($count === 3 ? '2.01' : '1.00'), 'due_days' => 7 + 30 * $i];
        $rule['charges'][0]['amount'] = $rule['amount']; $rule['charges'][0]['installments'] = $rule['installments'];
        $catalog['rules'][] = $rule;
    }
    file_put_contents($file, json_encode($catalog));
    merge_check(sp_evaluate('Intensif', 'Full Payment')['status'] === 'approved', 'Full Payment remains one payment');
    foreach ([3, 6] as $count) {
        $decision = sp_evaluate('Intensif', 'Cicilan', ['6.03'], $count);
        $schedule = sp_schedule($decision, '2026-11-15');
        merge_check($decision['status'] === 'approved' && count($schedule) === $count && array_sum(array_map(fn($term) => ac_cents($term['nominal']), $schedule)) === 603, $count.' terms selected with exact decimal total');
        merge_check(sp_evaluate('Intensif', 'Angsuran '.$count.' Termin')['rule']['installment_count'] === $count, 'Named installment option normalized: '.$count);
    }
    merge_check(sp_evaluate('Intensif', 'DP')['reason'] === 'installment_count_required', 'Ambiguous installment option is never guessed');
    merge_check(sp_evaluate('Intensif', 'Cicilan', ['6.02'], 3)['reason'] === 'amount_mismatch', 'Upstream amount mismatch blocked');
    $conflict = $registration; $conflict['skema'] = 'Cicilan 3 Termin'; $conflict['details']['installment_count'] = 6;
    merge_check(registration_pricing(registration_fields($conflict), 'Intensif', 'Cicilan 3 Termin')['reason'] === 'invalid_installment_count', 'Conflicting source installment assertions blocked');
    $frozen = sp_evaluate('Intensif', 'Cicilan', [], 3)['rule']; $json = eb_json($frozen); $hash = hash('sha256', $json);
    $catalog['rules'][1]['installments'][0]['amount'] = '0.01'; file_put_contents($file, json_encode($catalog));
    merge_check(sp_evaluate('Intensif', 'Cicilan', [], 3)['reason'] === 'invalid_pricing_configuration', 'Invalid schedule total rejected');
    merge_check(eb_snapshot($json, $hash) === $frozen, 'Historical snapshot unchanged by catalog edits');
    $catalog['rules'][1]['installments'][0]['amount'] = '2.01'; $catalog['rules'][1]['installments'][1]['due_days'] = 1;
    file_put_contents($file, json_encode($catalog));
    merge_check(sp_evaluate('Intensif', 'Cicilan', [], 3)['reason'] === 'invalid_pricing_configuration', 'Unordered due dates rejected');
    file_put_contents($file, '{');
    merge_check(sp_evaluate('Intensif', 'full')['reason'] === 'invalid_pricing_configuration', 'Malformed configuration fails safely');
    file_put_contents($file, '{"version":1,"rules":[]}');
    merge_check(sp_evaluate('Intensif', 'full')['reason'] === 'pricing_not_approved', 'Empty approved catalog never issues a guessed price');
} finally { unlink($file); }

merge_check(eb_legacy_tombstone_reason(['invoice_id' => 'deleted-fixture'], null, 2) !== '', 'Ambiguous/deleted legacy tombstone blocks resurrection');
merge_check(eb_legacy_tombstone_reason(['invoice_id' => 'old-fixture'], ['enrollment_id' => 1], 2) === '', 'Proven distinct enrollment remains billable');
merge_check(eb_legacy_tombstone_reason(['invoice_id' => 'old-fixture'], ['enrollment_id' => 2], 2) !== '', 'Same consumed enrollment is not replaced');
merge_check(rpa_remote_dashboard_review([])['writes_enabled'] === false, 'Missing remote mapping disables writes');
$mapping = ['student_id' => 1, 'enrollment_id' => 2, 'charge_id' => 3, 'participant_id' => 101, 'external_enrollment_id' => 'fixture-enrollment', 'invoice_id' => 'fixture-invoice'];
merge_check(rpa_remote_dashboard_review($mapping)['reason'] === 'remote_idempotency_contract_required', 'Even complete-looking mapping cannot enable uncontracted writes');
merge_check(rpa_remote_dashboard_review($mapping + ['payment_id' => 4])['reason'] === 'payment_not_verified', 'Unverified remote payment rejected');
merge_check(rpa_sync_invoices_to_remote_student_dashboard(101, 'fixture-invoice', 1.0, [], '', $mapping)['writes_enabled'] === false && rpa_sync_payment_to_remote_student_dashboard(101, 'fixture-invoice', 1.0)['writes_enabled'] === false, 'Legacy remote adapters cannot perform writes');
merge_check(rpa_send_smtp_email('fixture@example.invalid', 'Fixture', '', '') === false, 'Legacy sender cannot bypass configured PHP email service');
$config = require __DIR__.'/../config/mail.example.php';
merge_check($config['invoice_email_sender'] === '' && $config['receipt_email_sender'] === '', 'Both configured PHP email senders default disabled');
// Source contracts below are intentionally not SQL concurrency/runtime API tests.
$sync = file_get_contents(__DIR__.'/../api/sync_students_web.php'); $webhook = file_get_contents(__DIR__.'/../api/webhook_registration.php');
merge_check(str_contains($sync, 'registration_auto_issue(') && str_contains($webhook, 'registration_auto_issue('), 'SOURCE CONTRACT: shared issuance gate across sync/webhook');
$billing = file_get_contents(__DIR__.'/../services/billing_invoice.php');
merge_check(str_contains($billing, '$id = eb_number($db)') && str_contains($billing, 'if ($existing) return') && str_contains($billing, 'eb_legacy_review('), 'SOURCE CONTRACT: atomic allocator, charge replay and tombstone guards');
$enrollment = file_get_contents(__DIR__.'/../services/enrollment_billing.php');
merge_check(str_contains($enrollment, 'Enrollment dimiliki siswa lain.') && str_contains($enrollment, "if (\$incoming['status'] !== 'approved')"), 'SOURCE CONTRACT: ownership mismatch and failed approval block new issuance');
$api = file_get_contents(__DIR__.'/../api/billing.php');
merge_check(str_contains($api, 'bp_verify(') && str_contains($api, 'bp_complete(') && str_contains($api, "'receipt_pdf'"), 'SOURCE CONTRACT: payment-id verification and official receipt endpoint retained');
$rpa = file_get_contents(__DIR__.'/../services/rpa_automation.php');
merge_check(!preg_match('/\bmail\s*\(/', $rpa) && substr_count($rpa, 'rpa_send_smtp_email(') === 1 && str_contains($rpa, "\$dispatchPayload['email'] = '';"), 'SOURCE CONTRACT: no fallback or second RPA/n8n email recipient');
echo $checks.' focused checks passed; no DB/network/SMTP/PDF integration executed.'.PHP_EOL;
