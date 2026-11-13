<?php
function enrollment_test_payload(mysqli $db, int $student = 1, string $scheme = 'full', ?array $rule = null): array {
    static $occurrence = 0;
    $rule ??= sp_catalog()['intensif_offline:'.$scheme];
    $external = 'fixture-'.(++$occurrence);
    [$enrollment] = ac_atomic($db, fn() => eb_enrollment($db, ['id' => 1, 'name' => 'Test Finance'], $student, 'isolated-test', $external, $rule['program'], $scheme, 'Fixture cohort', [], eb_decision($rule)));
    $charge = ac_one($db, "SELECT * FROM enrollment_charges WHERE enrollment_id=? AND charge_type='program_fee'", [(int)$enrollment['id']]);
    $schedule = sp_schedule(eb_decision($rule), '2026-11-13');
    return ['action' => 'add_invoice', 'student_id' => $student, 'enrollment_id' => (int)$enrollment['id'], 'charge_id' => (int)$charge['id'], 'bank_account_id' => 1, 'tanggal' => '2026-11-13', 'jatuhTempo' => $schedule[0]['jatuhTempo'], 'total' => $rule['amount'], 'status' => 'Unpaid'];
}
