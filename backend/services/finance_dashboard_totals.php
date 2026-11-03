<?php
// Operational cash movements, not accrual revenue/expense or a bank reconciliation.
// Caller supplies the complete lists; never pass a display page to this function.
function finance_dashboard_totals(array $projections, array $realizations, int $year): array {
    $months = [];
    for ($m = 1; $m <= 12; $m++) {
        $months[$m] = ['month'=>$m, 'label'=>date('M', mktime(0,0,0,$m,1)),
            'projection'=>'0.00', 'realization'=>'0.00', 'income'=>'0.00', 'expense'=>'0.00'];
    }
    $outstanding = 0;
    foreach ($projections as $row) {
        if (($row['type'] ?? '') !== 'income' || !empty($row['is_historical_reference'])) continue;
        $amount = ac_cents((string)$row['amount']);
        $outstanding = ac_add($outstanding, $amount);
        $date = (string)($row['transaction_date'] ?? '');
        if ((int)substr($date,0,4) !== $year) continue;
        $m = (int)substr($date,5,2);
        if (isset($months[$m])) $months[$m]['projection'] = ac_decimal(ac_add(ac_cents($months[$m]['projection']), $amount));
    }
    foreach ($realizations as $row) {
        $type = $row['type'] ?? '';
        if (!in_array($type, ['income','expense'], true) || !empty($row['is_pending_realization'])) continue;
        $date = (string)($row['transaction_date'] ?? '');
        if ((int)substr($date,0,4) !== $year) continue;
        $m = (int)substr($date,5,2);
        if (!isset($months[$m])) continue;
        $amount = ac_cents((string)$row['amount']);
        $months[$m][$type] = ac_decimal(ac_add(ac_cents($months[$m][$type]), $amount));
        // The projection vs realization panel concerns receipts only.
        if ($type === 'income') $months[$m]['realization'] = ac_decimal(ac_add(ac_cents($months[$m]['realization']), $amount));
    }
    return ['months'=>$months, 'outstanding'=>ac_decimal($outstanding)];
}
