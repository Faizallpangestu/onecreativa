<?php
// Synthetic approvals for isolated tests only; never copied into the production catalogue.
function pricing_fixture_catalog(): array {
    $approval = ['status' => 'approved', 'reference' => 'SYNTHETIC-TEST-ONLY', 'approved_by' => 'Test Finance', 'approved_on' => '2026-01-01'];
    return ['version' => 1, 'rules' => [
        ['id' => 'fixture-full', 'active' => true, 'program' => 'intensif_offline', 'scheme' => 'full', 'amount' => '15000000.50', 'discount' => '0.00', 'approval' => $approval,
            'installments' => [['label' => 'Full Payment', 'amount' => '15000000.50', 'due_days' => 7]]],
        ['id' => 'fixture-cicilan', 'active' => true, 'program' => 'intensif_offline', 'scheme' => 'cicilan', 'amount' => '15000000.50', 'discount' => '0.00', 'approval' => $approval,
            'installments' => [['label' => 'DP', 'amount' => '5000000.25', 'due_days' => 7], ['label' => 'Pelunasan', 'amount' => '10000000.25', 'due_days' => 37]]],
    ]];
}
