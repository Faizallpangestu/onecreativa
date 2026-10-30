<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../services/accounting_core.php';
require_once __DIR__ . '/../services/accounting_reports.php';

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private, max-age=0');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { http_response_code(200); exit; }

// ── Auto-create adjustment table ──
$conn->query("CREATE TABLE IF NOT EXISTS financial_report_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category ENUM('revenue','cogs','expense','asset','liability','equity') NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    type ENUM('debit','credit','inflow','outflow') NOT NULL DEFAULT 'debit',
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    adjustment_date DATE NOT NULL,
    notes TEXT NULL,
    created_by VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// ── Session ──
$actor = null;
try { $actor = session_actor($conn); } catch (Throwable $t) {}

// ══════════════════════════════════════════════════════════════════
// GET: FETCH FINANCIAL REPORTS — 100% from journal_entries (PSAK 1)
// ══════════════════════════════════════════════════════════════════
if ($method === 'GET') {
    $period  = $_GET['period']  ?? date('Y-m');
    $compare = $_GET['compare'] ?? '';   // optional prior period e.g. '2026-09'

    // Parse date range from period (YYYY-MM or 'all')
    if ($period === 'all') {
        $from = null;
        $to   = date('Y-m-d');
    } else {
        $year  = (int)substr($period, 0, 4);
        $month = (int)substr($period, 5, 2);
        if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Periode tidak valid.']);
            exit;
        }
        $from = sprintf('%04d-%02d-01', $year, $month);
        $to   = (new DateTimeImmutable($from))->format('Y-m-t');
    }

    // ── 1. Fetch real accounting data from journal_entries ──
    $reportData = null;
    $hasJournalData = false;
    if (ac_table($conn, 'journal_entries') && ac_table($conn, 'accounts')) {
        $reportParams = ['from' => $from ?? '', 'to' => $to];
        try {
            $reportData = ac_reports($conn, $reportParams);
            $posted = (int)($reportData['coverage']['posted_journals'] ?? 0);
            $hasJournalData = $posted > 0;
        } catch (Throwable $e) {
            $reportData = null;
        }
    }

    // ── 2. Comparative period (optional) ──
    $compareData = null;
    if ($compare && $compare !== $period && ac_table($conn, 'journal_entries')) {
        $cy = (int)substr($compare, 0, 4);
        $cm = (int)substr($compare, 5, 2);
        if ($cy >= 2000 && $cy <= 2100 && $cm >= 1 && $cm <= 12) {
            $cFrom = sprintf('%04d-%02d-01', $cy, $cm);
            $cTo   = (new DateTimeImmutable($cFrom))->format('Y-m-t');
            try {
                $compareData = ac_reports($conn, ['from' => $cFrom, 'to' => $cTo]);
            } catch (Throwable $e) {}
        }
    }

    // ── 3. Fetch manual adjustments ──
    $adjustments = [];
    $adjRes = $conn->query("SELECT * FROM financial_report_adjustments ORDER BY adjustment_date DESC, id DESC");
    if ($adjRes) {
        while ($r = $adjRes->fetch_assoc()) {
            $adjustments[] = [
                'id'              => (int)$r['id'],
                'title'           => $r['title'],
                'category'        => $r['category'],
                'account_name'    => $r['account_name'],
                'type'            => $r['type'],
                'amount'          => (float)$r['amount'],
                'adjustment_date' => $r['adjustment_date'],
                'notes'           => $r['notes'] ?? '',
                'created_by'      => $r['created_by'] ?? 'CFO Finance',
                'created_at'      => $r['created_at'],
            ];
        }
    }

    // ── 4. Build P&L from real COA journal data ──
    $pnl_from_journal  = $reportData ? $reportData['profit_loss'] : null;
    $bs_from_journal   = $reportData ? $reportData['balance_sheet'] : null;
    $cf_from_journal   = $reportData ? $reportData['cash_flow'] : null;
    $gl_rows           = $reportData ? ($reportData['general_ledger'] ?? []) : [];
    $aging             = $reportData ? ($reportData['aging'] ?? []) : [];
    $budget_vs_actual  = $reportData ? ($reportData['budget_vs_actual'] ?? []) : [];
    $trial_balance     = $reportData ? ($reportData['trial_balance'] ?? []) : [];
    $period_movements  = $reportData ? ($reportData['period_movements'] ?? []) : [];

    // ── 5. Build structured P&L by COA account group & report_class ──
    // Fetch per-account detail for structured display
    $revenue_lines      = [];
    $cogs_lines         = [];
    $opex_lines         = [];
    $other_income_lines = [];
    $total_revenue   = 0.0;
    $total_cogs      = 0.0;
    $total_opex      = 0.0;
    $total_other     = 0.0;

    if ($reportData && !empty($reportData['period_movements']['rows'])) {
        foreach ($reportData['period_movements']['rows'] as $row) {
            $grp    = (int)($row['account_group'] ?? 0);
            $cls    = $row['report_class'] ?? '';
            $normal = $row['normal_balance'] ?? 'credit';
            $debit  = (float)($row['debit']  ?? 0);
            $credit = (float)($row['credit'] ?? 0);
            $bal    = $normal === 'credit' ? $credit - $debit : $debit - $credit;

            $item = [
                'code'   => $row['code'],
                'name'   => $row['name'],
                'amount' => $bal,
            ];

            if ($grp === 4) {
                $revenue_lines[] = $item;
                $total_revenue  += $bal;
            } elseif ($grp === 5 && in_array($cls, ['cost_of_services', 'cogs'], true)) {
                $cogs_lines[] = $item;
                $total_cogs  += $bal;
            } elseif ($grp === 5) {
                $opex_lines[] = $item;
                $total_opex  += $bal;
            } elseif ($grp === 6 || in_array($cls, ['other_income', 'other_expense'], true)) {
                $other_income_lines[] = $item;
                $total_other         += $bal;
            }
        }
    }

    // Apply manual adjustments to P&L
    foreach ($adjustments as $adj) {
        $amt  = (float)$adj['amount'];
        $item = [
            'code'       => 'ADJ-' . $adj['id'],
            'name'       => $adj['title'] . ' (' . $adj['account_name'] . ')',
            'amount'     => $amt,
            'is_custom'  => true,
            'id'         => $adj['id'],
        ];
        if ($adj['category'] === 'revenue') { $revenue_lines[] = $item; $total_revenue += $amt; }
        elseif ($adj['category'] === 'cogs') { $cogs_lines[] = $item; $total_cogs += $amt; }
        elseif ($adj['category'] === 'expense') { $opex_lines[] = $item; $total_opex += $amt; }
    }

    $gross_profit     = $total_revenue - $total_cogs;
    $operating_profit = $gross_profit - $total_opex;
    $net_profit       = $operating_profit + $total_other;

    // ── 6. Build Balance Sheet from COA account group ──
    $bs_current_assets    = [];
    $bs_fixed_assets      = [];
    $bs_current_liab      = [];
    $bs_longterm_liab     = [];
    $bs_equity            = [];
    $total_current_assets = 0.0;
    $total_fixed_assets   = 0.0;
    $total_current_liab   = 0.0;
    $total_longterm_liab  = 0.0;
    $total_equity_bs      = 0.0;

    if ($reportData && !empty($reportData['trial_balance']['rows'])) {
        foreach ($reportData['trial_balance']['rows'] as $row) {
            $grp    = (int)($row['account_group'] ?? 0);
            $cls    = $row['report_class'] ?? '';
            $normal = $row['normal_balance'] ?? 'debit';
            $debit  = (float)($row['debit']  ?? 0);
            $credit = (float)($row['credit'] ?? 0);
            $bal    = $normal === 'debit' ? $debit - $credit : $credit - $debit;

            $item = ['code' => $row['code'], 'name' => $row['name'], 'amount' => $bal];

            if ($grp === 1) {
                if (in_array($cls, ['cash', 'receivable', 'inventory', 'prepaid', 'current_asset'], true)) {
                    $bs_current_assets[]   = $item;
                    $total_current_assets += $bal;
                } else {
                    $bs_fixed_assets[]   = $item;
                    $total_fixed_assets += $bal;
                }
            } elseif ($grp === 2) {
                if (in_array($cls, ['payable', 'tax_payable', 'accrued', 'deferred_revenue', 'current_liability',
                    'payroll_payable', 'reimbursement_payable', 'loan'], true)) {
                    $bs_current_liab[]   = $item;
                    $total_current_liab += $bal;
                } else {
                    $bs_longterm_liab[]  = $item;
                    $total_longterm_liab += $bal;
                }
            } elseif ($grp === 3) {
                $bs_equity[]         = $item;
                $total_equity_bs    += $bal;
            }
        }
    }

    // Apply balance sheet adjustments
    foreach ($adjustments as $adj) {
        $amt  = (float)$adj['amount'];
        $item = ['code' => 'ADJ-' . $adj['id'], 'name' => $adj['title'] . ' (' . $adj['account_name'] . ')', 'amount' => $amt, 'is_custom' => true, 'id' => $adj['id']];
        if ($adj['category'] === 'asset')     { $bs_current_assets[] = $item; $total_current_assets += $amt; }
        elseif ($adj['category'] === 'liability') { $bs_current_liab[] = $item; $total_current_liab += $amt; }
        elseif ($adj['category'] === 'equity') { $bs_equity[] = $item; $total_equity_bs += $amt; }
    }

    // Retained earnings from net profit (append to equity if not already from COA)
    if ($hasJournalData) {
        $bs_equity[] = ['code' => 'CALC-NP', 'name' => 'Laba Bersih Periode Berjalan', 'amount' => $net_profit, 'is_calculated' => true];
        $total_equity_bs += $net_profit;
    }

    $total_assets         = $total_current_assets + $total_fixed_assets;
    $total_liabilities    = $total_current_liab + $total_longterm_liab;
    $total_liab_equity    = $total_liabilities + $total_equity_bs;
    $balance_diff         = $total_assets - $total_liab_equity;

    // ── 7. Cash Flow from journal classification ──
    $cf_operating = [];
    $cf_investing = [];
    $cf_financing = [];
    $net_operating = 0.0;
    $net_investing = 0.0;
    $net_financing = 0.0;

    if ($reportData && !empty($reportData['cash_flow'])) {
        foreach ($reportData['cash_flow'] as $cfRow) {
            $class   = $cfRow['cash_flow_class'] ?? 'operating';
            $netAmt  = (float)($cfRow['net'] ?? 0);
            $item    = [
                'title'    => ucfirst($class) . ' Cash Flow',
                'incoming' => (float)($cfRow['incoming'] ?? 0),
                'outgoing' => (float)($cfRow['outgoing'] ?? 0),
                'amount'   => $netAmt,
            ];
            if ($class === 'operating')  { $cf_operating[] = $item; $net_operating += $netAmt; }
            elseif ($class === 'investing') { $cf_investing[] = $item; $net_investing += $netAmt; }
            elseif ($class === 'financing') { $cf_financing[] = $item; $net_financing += $netAmt; }
        }
    }

    // Cash beginning = sum of all cash accounts before this period
    $beginning_cash  = 0.0;
    if ($from && ac_table($conn, 'journal_lines')) {
        $bcRow = $conn->query("
            SELECT CAST(SUM(l.debit - l.credit) AS DECIMAL(15,2)) AS net
            FROM journal_lines l
            JOIN journal_entries j ON j.id = l.journal_entry_id
            JOIN accounts a ON a.id = l.account_id
            WHERE j.status = 'posted'
              AND j.entry_date < '$from'
              AND a.report_class = 'cash'
        ")?->fetch_assoc();
        $beginning_cash = (float)($bcRow['net'] ?? 0);
    }
    $total_cash_bank  = $total_current_assets; // approximate; filtered by cash accounts in balance sheet
    $net_cash_change  = $net_operating + $net_investing + $net_financing;
    $ending_cash      = $beginning_cash + $net_cash_change;

    // ── 8. KPIs ──
    $gross_margin   = $total_revenue > 0 ? round(($gross_profit / $total_revenue) * 100, 1) : 0;
    $net_margin     = $total_revenue > 0 ? round(($net_profit  / $total_revenue) * 100, 1) : 0;
    $current_ratio  = $total_current_liab > 0 ? round($total_current_assets / $total_current_liab, 2) : 0;
    $cash_ratio     = $total_current_liab > 0 ? round($total_cash_bank / $total_current_liab, 2) : 0;

    // ── 9. Unposted / coverage alerts ──
    $coverage = $reportData ? ($reportData['coverage'] ?? []) : [];

    // ── 10. Comparative period P&L delta ──
    $compare_pnl = null;
    if ($compareData) {
        $c_rev  = (float)($compareData['profit_loss']['revenue']         ?? 0);
        $c_cogs = (float)($compareData['profit_loss']['cost_of_services'] ?? 0);
        $c_net  = (float)($compareData['profit_loss']['net_profit']       ?? 0);
        $compare_pnl = [
            'period'         => $compare,
            'total_revenue'  => $c_rev,
            'total_cogs'     => $c_cogs,
            'gross_profit'   => $c_rev - $c_cogs,
            'net_profit'     => $c_net,
            'revenue_delta'  => $total_revenue - $c_rev,
            'net_profit_delta' => $net_profit - $c_net,
            'revenue_delta_pct' => $c_rev > 0 ? round((($total_revenue - $c_rev) / $c_rev) * 100, 1) : null,
        ];
    }

    echo json_encode([
        'status'         => 'success',
        'period'         => $period,
        'data_source'    => $hasJournalData ? 'live_journal' : 'no_data',
        'has_journal_data' => $hasJournalData,
        'coverage'       => $coverage,
        'kpis'           => [
            'total_revenue'        => $total_revenue,
            'total_cogs'           => $total_cogs,
            'gross_profit'         => $gross_profit,
            'total_opex'           => $total_opex,
            'net_profit'           => $net_profit,
            'total_assets'         => $total_assets,
            'total_liabilities'    => $total_liabilities,
            'total_equity'         => $total_equity_bs,
            'total_cash_and_bank'  => $total_cash_bank,
            'gross_margin'         => $gross_margin,
            'net_margin'           => $net_margin,
            'current_ratio'        => $current_ratio,
            'cash_ratio'           => $cash_ratio,
            'is_balanced'          => abs($balance_diff) < 1.0,
            'balance_diff'         => $balance_diff,
        ],
        'profit_loss'    => [
            'operating_revenue'     => $revenue_lines,
            'total_revenue'         => $total_revenue,
            'cost_of_services'      => $cogs_lines,
            'total_cogs'            => $total_cogs,
            'gross_profit'          => $gross_profit,
            'operating_expenses'    => $opex_lines,
            'total_opex'            => $total_opex,
            'operating_profit'      => $operating_profit,
            'other_income_expenses' => $other_income_lines,
            'total_other'           => $total_other,
            'net_profit'            => $net_profit,
        ],
        'balance_sheet'  => [
            'current_assets'            => $bs_current_assets,
            'total_current_assets'      => $total_current_assets,
            'fixed_assets'              => $bs_fixed_assets,
            'total_fixed_assets'        => $total_fixed_assets,
            'total_assets'              => $total_assets,
            'current_liabilities'       => $bs_current_liab,
            'total_current_liabilities' => $total_current_liab,
            'long_term_liabilities'     => $bs_longterm_liab,
            'total_long_term_liabilities' => $total_longterm_liab,
            'total_liabilities'         => $total_liabilities,
            'equity'                    => $bs_equity,
            'total_equity'              => $total_equity_bs,
            'total_liabilities_equity'  => $total_liab_equity,
            'is_balanced'               => abs($balance_diff) < 1.0,
            'balance_diff'              => $balance_diff,
        ],
        'cash_flow'      => [
            'operating' => $cf_operating,
            'investing'  => $cf_investing,
            'financing'  => $cf_financing,
            'summary'    => [
                'beginning_cash'  => $beginning_cash,
                'net_operating'   => $net_operating,
                'net_investing'   => $net_investing,
                'net_financing'   => $net_financing,
                'net_change'      => $net_cash_change,
                'ending_cash'     => $ending_cash,
                'verified_cash_bank' => $total_cash_bank,
            ],
        ],
        'trial_balance'    => $trial_balance,
        'period_movements' => $period_movements,
        'aging'            => $aging,
        'budget_vs_actual' => $budget_vs_actual,
        'adjustments'      => $adjustments,
        'compare'          => $compare_pnl,
        'unposted_alerts'  => [
            'unposted_payments'     => (int)($coverage['unposted_payments']     ?? 0),
            'unrecognized_documents'=> (int)($coverage['unrecognized_documents'] ?? 0),
            'needs_review'          => (int)($coverage['legacy_needs_review']    ?? 0),
        ],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ══════════════════════════════════════════════════════════
// POST: CRUD ADJUSTMENTS (tetap sama)
// ══════════════════════════════════════════════════════════
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Format payload JSON tidak valid.']);
        exit;
    }

    $action  = $input['action'] ?? '';
    $creator = $actor ? ($actor['name'] ?? 'CFO Finance') : 'CFO Finance';

    if (in_array($action, ['create', 'add'], true)) {
        $title    = trim($input['title']           ?? '');
        $category = trim($input['category']        ?? 'expense');
        $accName  = trim($input['account_name']    ?? '');
        $type     = trim($input['type']            ?? 'debit');
        $amount   = (float)($input['amount']       ?? 0);
        $date     = trim($input['adjustment_date'] ?? date('Y-m-d'));
        $notes    = trim($input['notes']           ?? '');
        if (!$title || $amount <= 0) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'Judul dan nominal penyesuaian harus diisi.']);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO financial_report_adjustments (title,category,account_name,type,amount,adjustment_date,notes,created_by) VALUES(?,?,?,?,?,?,?,?)");
        $stmt->bind_param('ssssdsss', $title, $category, $accName, $type, $amount, $date, $notes, $creator);
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Penyesuaian berhasil disimpan.', 'id' => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan: ' . $conn->error]);
        }
        $stmt->close(); exit;
    }

    if (in_array($action, ['update', 'edit'], true)) {
        $id       = (int)($input['id']             ?? 0);
        $title    = trim($input['title']           ?? '');
        $category = trim($input['category']        ?? 'expense');
        $accName  = trim($input['account_name']    ?? '');
        $type     = trim($input['type']            ?? 'debit');
        $amount   = (float)($input['amount']       ?? 0);
        $date     = trim($input['adjustment_date'] ?? date('Y-m-d'));
        $notes    = trim($input['notes']           ?? '');
        if (!$id || !$title || $amount <= 0) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'Data tidak valid untuk update.']);
            exit;
        }
        $stmt = $conn->prepare("UPDATE financial_report_adjustments SET title=?,category=?,account_name=?,type=?,amount=?,adjustment_date=?,notes=? WHERE id=?");
        $stmt->bind_param('ssssdssi', $title, $category, $accName, $type, $amount, $date, $notes, $id);
        $stmt->execute(); $stmt->close();
        echo json_encode(['status' => 'success', 'message' => 'Penyesuaian berhasil diperbarui.']); exit;
    }

    if ($action === 'delete') {
        $id = (int)($input['id'] ?? 0);
        if (!$id) { http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'ID tidak valid.']); exit; }
        $stmt = $conn->prepare("DELETE FROM financial_report_adjustments WHERE id=?");
        $stmt->bind_param('i', $id); $stmt->execute(); $stmt->close();
        echo json_encode(['status' => 'success', 'message' => 'Penyesuaian berhasil dihapus.']); exit;
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Aksi tidak dikenal.']);
    exit;
}
