<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/accounting_reports.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);

try {
    $actor = session_actor($conn);
    if (!$actor) ac_fail('Silakan login kembali.', 401);
    $allowedRoles = ['admin', 'super_admin', 'finance', 'finance_admin', 'director', 'direktur', 'manager', 'hr', 'hrd'];
    if (!in_array($actor['role'], $allowedRoles, true) && !ac_can($conn, $actor, 'read')) {
        ac_fail('Akses ke dashboard keuangan tidak diizinkan.', 403);
    }
    session_write_close();

    $year = !empty($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    if ($year < 2000 || $year > 2100) ac_fail('Tahun tidak valid.');

    $months = [];
    for ($m = 1; $m <= 12; $m++) {
        $months[$m] = [
            'month' => $m,
            'label' => date('M', mktime(0, 0, 0, $m, 1)),
            'projection' => '0',
            'realization' => '0',
            'income' => '0',
            'expense' => '0',
        ];
    }

    // === PROJECTION: Approved transactions that are unpaid (expected income/expenses) ===
    // Projection = amount from approved but unpaid transactions
    if (ac_table($conn, 'accounting_transactions')) {
        // Projections: approved but unpaid transactions for the given year
        $projStmt = $conn->prepare("
            SELECT MONTH(transaction_date) AS m,
                   CAST(SUM(amount) AS CHAR) AS total
            FROM accounting_transactions
            WHERE YEAR(transaction_date) = ?
              AND approval_status = 'approved'
              AND payment_status = 'unpaid'
            GROUP BY MONTH(transaction_date)
        ");
        $projStmt->bind_param('i', $year);
        $projStmt->execute();
        $projResult = $projStmt->get_result();
        while ($row = $projResult->fetch_assoc()) {
            $m = (int)$row['m'];
            if (isset($months[$m])) $months[$m]['projection'] = $row['total'] ?? '0';
        }
        $projStmt->close();

        // Realizations: paid/verified/posted transactions for the given year
        $realStmt = $conn->prepare("
            SELECT MONTH(transaction_date) AS m,
                   CAST(SUM(amount) AS CHAR) AS total
            FROM accounting_transactions
            WHERE YEAR(transaction_date) = ?
              AND payment_status IN ('paid', 'verified')
            GROUP BY MONTH(transaction_date)
        ");
        $realStmt->bind_param('i', $year);
        $realStmt->execute();
        $realResult = $realStmt->get_result();
        while ($row = $realResult->fetch_assoc()) {
            $m = (int)$row['m'];
            if (isset($months[$m])) $months[$m]['realization'] = $row['total'] ?? '0';
        }
        $realStmt->close();

        // Income & Expense by month from posted journals
        if (ac_table($conn, 'journal_entries')) {
            $flowStmt = $conn->prepare("
                SELECT MONTH(j.entry_date) AS m,
                       CAST(SUM(CASE WHEN a.account_group = 4 THEN l.credit - l.debit ELSE 0 END) AS CHAR) AS income,
                       CAST(SUM(CASE WHEN a.account_group = 5 THEN l.debit - l.credit ELSE 0 END) AS CHAR) AS expense
                FROM journal_lines l
                JOIN journal_entries j ON j.id = l.journal_entry_id
                JOIN accounts a ON a.id = l.account_id
                WHERE j.status = 'posted'
                  AND YEAR(j.entry_date) = ?
                  AND a.account_group IN (4, 5)
                GROUP BY MONTH(j.entry_date)
            ");
            $flowStmt->bind_param('i', $year);
            $flowStmt->execute();
            $flowResult = $flowStmt->get_result();
            while ($row = $flowResult->fetch_assoc()) {
                $m = (int)$row['m'];
                if (isset($months[$m])) {
                    $months[$m]['income'] = $row['income'] ?? '0';
                    $months[$m]['expense'] = $row['expense'] ?? '0';
                }
            }
            $flowStmt->close();
        }
    }

    // Fallback to legacy finance_records if no accounting_transactions data
    $hasAccountingData = false;
    foreach ($months as $m) {
        if ($m['income'] !== '0' || $m['expense'] !== '0' || $m['projection'] !== '0' || $m['realization'] !== '0') {
            $hasAccountingData = true;
            break;
        }
    }

    if (!$hasAccountingData && ac_table($conn, 'finance_records')) {
        $legacyStmt = $conn->prepare("
            SELECT MONTH(transaction_date) AS m, type,
                   CAST(SUM(amount) AS CHAR) AS total
            FROM finance_records
            WHERE YEAR(transaction_date) = ?
            GROUP BY MONTH(transaction_date), type
        ");
        $legacyStmt->bind_param('i', $year);
        $legacyStmt->execute();
        $legacyResult = $legacyStmt->get_result();
        while ($row = $legacyResult->fetch_assoc()) {
            $m = (int)$row['m'];
            if (!isset($months[$m])) continue;
            if ($row['type'] === 'income') {
                $months[$m]['income'] = $row['total'] ?? '0';
            } else {
                $months[$m]['expense'] = $row['total'] ?? '0';
            }
            $months[$m]['realization'] = ac_decimal(
                ac_cents($months[$m]['realization']) + ac_cents($row['total'] ?? '0')
            );
        }
        $legacyStmt->close();
    }

    // === INCOME BY SOURCE (account/bank) ===
    $incomeBySource = [];
    $expenseBySource = [];

    if (ac_table($conn, 'accounting_transactions') && ac_table($conn, 'cash_bank_accounts')) {
        // Income by cash account (bank)
        $incSrcStmt = $conn->prepare("
            SELECT cba.name AS account_name,
                   CAST(SUM(t.amount) AS CHAR) AS total,
                   COUNT(*) AS count
            FROM accounting_transactions t
            LEFT JOIN cash_bank_accounts cba ON cba.id = t.cash_account_id
            WHERE YEAR(t.transaction_date) = ?
              AND t.type = 'income'
              AND t.payment_status IN ('paid', 'verified')
            GROUP BY t.cash_account_id
            ORDER BY SUM(t.amount) DESC
        ");
        $incSrcStmt->bind_param('i', $year);
        $incSrcStmt->execute();
        $incomeBySource = $incSrcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $incSrcStmt->close();

        // Expense by cash account (bank)
        $expSrcStmt = $conn->prepare("
            SELECT cba.name AS account_name,
                   CAST(SUM(t.amount) AS CHAR) AS total,
                   COUNT(*) AS count
            FROM accounting_transactions t
            LEFT JOIN cash_bank_accounts cba ON cba.id = t.cash_account_id
            WHERE YEAR(t.transaction_date) = ?
              AND t.type = 'expense'
              AND t.payment_status IN ('paid', 'verified')
            GROUP BY t.cash_account_id
            ORDER BY SUM(t.amount) DESC
        ");
        $expSrcStmt->bind_param('i', $year);
        $expSrcStmt->execute();
        $expenseBySource = $expSrcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $expSrcStmt->close();
    }

    if (empty($incomeBySource) && ac_table($conn, 'finance_records')) {
        $legacyIncSrc = $conn->prepare("
            SELECT COALESCE(NULLIF(bank_name, ''), 'BCA') AS account_name,
                   CAST(SUM(amount) AS CHAR) AS total,
                   COUNT(*) AS count
            FROM finance_records
            WHERE YEAR(transaction_date) = ?
              AND type = 'income'
            GROUP BY COALESCE(NULLIF(bank_name, ''), 'BCA')
            ORDER BY SUM(amount) DESC
        ");
        $legacyIncSrc->bind_param('i', $year);
        $legacyIncSrc->execute();
        $incomeBySource = $legacyIncSrc->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyIncSrc->close();
    }

    if (empty($expenseBySource) && ac_table($conn, 'finance_records')) {
        $legacyExpSrc = $conn->prepare("
            SELECT COALESCE(NULLIF(bank_name, ''), 'BCA') AS account_name,
                   CAST(SUM(amount) AS CHAR) AS total,
                   COUNT(*) AS count
            FROM finance_records
            WHERE YEAR(transaction_date) = ?
              AND type = 'expense'
            GROUP BY COALESCE(NULLIF(bank_name, ''), 'BCA')
            ORDER BY SUM(amount) DESC
        ");
        $legacyExpSrc->bind_param('i', $year);
        $legacyExpSrc->execute();
        $expenseBySource = $legacyExpSrc->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyExpSrc->close();
    }

    // === PROJECTION DETAIL LIST (for audit drill-down) ===
    $projectionItems = [];
    $realizationItems = [];

    if (ac_table($conn, 'accounting_transactions')) {
        // Projection items (approved, unpaid)
        $piStmt = $conn->prepare("
            SELECT t.id, t.number, t.transaction_date, t.type, t.amount,
                   t.party_name, t.description, t.source_type, t.classification,
                   t.approval_status, t.payment_status,
                   cba.name AS cash_account_name,
                   t.source_id, t.source_number
            FROM accounting_transactions t
            LEFT JOIN cash_bank_accounts cba ON cba.id = t.cash_account_id
            WHERE YEAR(t.transaction_date) = ?
              AND t.approval_status = 'approved'
              AND t.payment_status = 'unpaid'
            ORDER BY t.transaction_date DESC
            LIMIT 200
        ");
        $piStmt->bind_param('i', $year);
        $piStmt->execute();
        $projectionItems = $piStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $piStmt->close();

        // Realization items (paid/verified)
        $riStmt = $conn->prepare("
            SELECT t.id, t.number, t.transaction_date, t.type, t.amount,
                   t.party_name, t.description, t.source_type, t.classification,
                   t.approval_status, t.payment_status,
                   cba.name AS cash_account_name,
                   t.paid_at, t.reference,
                   t.source_id, t.source_number
            FROM accounting_transactions t
            LEFT JOIN cash_bank_accounts cba ON cba.id = t.cash_account_id
            WHERE YEAR(t.transaction_date) = ?
              AND t.payment_status IN ('paid', 'verified')
            ORDER BY t.transaction_date DESC
            LIMIT 200
        ");
        $riStmt->bind_param('i', $year);
        $riStmt->execute();
        $realizationItems = $riStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $riStmt->close();
    }

    // Fallback/enrichment from salary_requests and finance_records
    if (ac_table($conn, 'salary_requests')) {
        $salStmt = $conn->prepare("
            SELECT s.id,
                   CONCAT('PAYROLL-', s.id) AS number,
                   COALESCE(s.payday, s.period_start) AS transaction_date,
                   'expense' AS type,
                   s.total_salary AS amount,
                   s.employee_name AS party_name,
                   CONCAT('Gaji ', s.month, ' - ', s.position_name) AS description,
                   'salary' AS source_type,
                   'Penggajian Karyawan' AS classification,
                   'approved' AS approval_status,
                   IF(s.status = 'paid', 'paid', 'unpaid') AS payment_status,
                   CONCAT(s.bank_name, ' (', s.account_number, ')') AS cash_account_name,
                   s.id AS salary_request_id
            FROM salary_requests s
            WHERE YEAR(COALESCE(s.payday, s.period_start)) = ?
            ORDER BY s.id DESC
        ");
        $salStmt->bind_param('i', $year);
        $salStmt->execute();
        $salList = $salStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $salStmt->close();

        foreach ($salList as $sal) {
            $m = (int)date('n', strtotime($sal['transaction_date']));
            if (isset($months[$m])) {
                $months[$m]['projection'] = ac_decimal(
                    ac_cents($months[$m]['projection']) + ac_cents($sal['amount'])
                );
            }
            $projectionItems[] = $sal;
        }
    }

    if (empty($realizationItems) && ac_table($conn, 'finance_records')) {
        $legacyReal = $conn->prepare("
            SELECT id,
                   CONCAT('FIN-', LPAD(id, 5, '0')) AS number,
                   transaction_date,
                   type,
                   amount,
                   COALESCE(NULLIF(account_name, ''), NULLIF(source, ''), 'Internal') AS party_name,
                   description,
                   'legacy_finance' AS source_type,
                   category AS classification,
                   'approved' AS approval_status,
                   'paid' AS payment_status,
                   CONCAT(COALESCE(NULLIF(bank_name, ''), 'BCA'), IF(account_number != '', CONCAT(' (', account_number, ')'), '')) AS cash_account_name,
                   created_at AS paid_at,
                   COALESCE(NULLIF(metode, ''), 'Transfer') AS reference,
                   salary_request_id,
                   budget_request_id
            FROM finance_records
            WHERE YEAR(transaction_date) = ?
            ORDER BY transaction_date DESC
            LIMIT 200
        ");
        $legacyReal->bind_param('i', $year);
        $legacyReal->execute();
        $realizationItems = $legacyReal->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyReal->close();

        // Also if we didn't have projection items for non-salary finance records, pair them as projections too!
        foreach ($realizationItems as $ri) {
            if (empty($ri['salary_request_id'])) {
                $projItem = $ri;
                $projItem['number'] = 'PROJ-' . substr($ri['number'], 4);
                $projItem['payment_status'] = 'unpaid';
                $m = (int)date('n', strtotime($projItem['transaction_date']));
                if (isset($months[$m])) {
                    $months[$m]['projection'] = ac_decimal(
                        ac_cents($months[$m]['projection']) + ac_cents($projItem['amount'])
                    );
                }
                $projectionItems[] = $projItem;
            }
        }
    }

    // === ENRICH WITH BILLING INVOICES (Student Invoices -> Proyeksi & Realisasi) ===
    if (ac_table($conn, 'billing_invoices')) {
        $invStmt = $conn->prepare("
            SELECT id,
                   tanggal AS transaction_date,
                   'income' AS type,
                   total AS amount,
                   customer AS party_name,
                   CONCAT('Tagihan Siswa - ', customer) AS description,
                   'invoice_billing' AS source_type,
                   'Pemasukan Pelatihan' AS classification,
                   'approved' AS approval_status,
                   status,
                   'BCA (1832-918-428)' AS cash_account_name,
                   jatuhTempo,
                   created_at
            FROM billing_invoices
            WHERE YEAR(tanggal) = ?
            ORDER BY id DESC
        ");
        $invStmt->bind_param('i', $year);
        $invStmt->execute();
        $invList = $invStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $invStmt->close();

        foreach ($invList as $inv) {
            $m = (int)date('n', strtotime($inv['transaction_date']));
            $isPaid = in_array(strtolower($inv['status']), ['paid', 'lunas']);

            // 1. Proyeksi: Semua invoice yang terbit adalah target kas masuk
            $projInv = $inv;
            $projInv['number'] = $inv['id'];
            $projInv['payment_status'] = $isPaid ? 'paid' : 'unpaid';
            if (isset($months[$m])) {
                $months[$m]['projection'] = ac_decimal(
                    ac_cents($months[$m]['projection']) + ac_cents($projInv['amount'])
                );
            }
            $projectionItems[] = $projInv;

            // 2. Realisasi: Jika sudah dibayar (Paid/Lunas), masuk ke Realisasi aktual
            if ($isPaid) {
                $realInv = $inv;
                $realInv['number'] = 'FIN-' . $inv['id'];
                $realInv['payment_status'] = 'paid';
                $realInv['paid_at'] = $inv['transaction_date'];
                if (isset($months[$m])) {
                    $months[$m]['realization'] = ac_decimal(
                        ac_cents($months[$m]['realization']) + ac_cents($realInv['amount'])
                    );
                    $months[$m]['income'] = ac_decimal(
                        ac_cents($months[$m]['income']) + ac_cents($realInv['amount'])
                    );
                }
                $realizationItems[] = $realInv;
            }
        }
    }

    // === INCOME BY CLASSIFICATION ===
    $incomeByClassification = [];
    $expenseByClassification = [];

    if (ac_table($conn, 'accounting_transactions')) {
        $incClsStmt = $conn->prepare("
            SELECT COALESCE(t.classification, 'lainnya') AS classification,
                   CAST(SUM(t.amount) AS CHAR) AS total
            FROM accounting_transactions t
            WHERE YEAR(t.transaction_date) = ?
              AND t.type = 'income'
              AND t.payment_status IN ('paid', 'verified')
            GROUP BY t.classification
            ORDER BY SUM(t.amount) DESC
        ");
        $incClsStmt->bind_param('i', $year);
        $incClsStmt->execute();
        $incomeByClassification = $incClsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $incClsStmt->close();

        $expClsStmt = $conn->prepare("
            SELECT COALESCE(t.classification, 'lainnya') AS classification,
                   CAST(SUM(t.amount) AS CHAR) AS total
            FROM accounting_transactions t
            WHERE YEAR(t.transaction_date) = ?
              AND t.type = 'expense'
              AND t.payment_status IN ('paid', 'verified')
            GROUP BY t.classification
            ORDER BY SUM(t.amount) DESC
        ");
        $expClsStmt->bind_param('i', $year);
        $expClsStmt->execute();
        $expenseByClassification = $expClsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $expClsStmt->close();
    }

    if (empty($incomeByClassification) && ac_table($conn, 'finance_records')) {
        $legacyIncCls = $conn->prepare("
            SELECT COALESCE(NULLIF(category, ''), 'Lainnya') AS classification,
                   CAST(SUM(amount) AS CHAR) AS total
            FROM finance_records
            WHERE YEAR(transaction_date) = ?
              AND type = 'income'
            GROUP BY COALESCE(NULLIF(category, ''), 'Lainnya')
            ORDER BY SUM(amount) DESC
        ");
        $legacyIncCls->bind_param('i', $year);
        $legacyIncCls->execute();
        $incomeByClassification = $legacyIncCls->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyIncCls->close();
    }

    if (empty($expenseByClassification) && ac_table($conn, 'finance_records')) {
        $legacyExpCls = $conn->prepare("
            SELECT COALESCE(NULLIF(category, ''), 'Lainnya') AS classification,
                   CAST(SUM(amount) AS CHAR) AS total
            FROM finance_records
            WHERE YEAR(transaction_date) = ?
              AND type = 'expense'
            GROUP BY COALESCE(NULLIF(category, ''), 'Lainnya')
            ORDER BY SUM(amount) DESC
        ");
        $legacyExpCls->bind_param('i', $year);
        $legacyExpCls->execute();
        $expenseByClassification = $legacyExpCls->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyExpCls->close();
    }

    // === TOTALS ===
    $totalProjection = '0';
    $totalRealization = '0';
    $totalIncome = '0';
    $totalExpense = '0';
    foreach ($months as $m) {
        $totalProjection = ac_decimal(ac_cents($totalProjection) + ac_cents($m['projection']));
        $totalRealization = ac_decimal(ac_cents($totalRealization) + ac_cents($m['realization']));
        $totalIncome = ac_decimal(ac_cents($totalIncome) + ac_cents($m['income']));
        $totalExpense = ac_decimal(ac_cents($totalExpense) + ac_cents($m['expense']));
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'year' => $year,
            'months' => array_values($months),
            'totals' => [
                'projection' => $totalProjection,
                'realization' => $totalRealization,
                'income' => $totalIncome,
                'expense' => $totalExpense,
                'balance' => ac_decimal(ac_cents($totalIncome) - ac_cents($totalExpense)),
                'selisih' => ac_decimal(ac_cents($totalProjection) - ac_cents($totalRealization)),
            ],
            'income_by_source' => $incomeBySource,
            'expense_by_source' => $expenseBySource,
            'income_by_classification' => $incomeByClassification,
            'expense_by_classification' => $expenseByClassification,
            'projection_items' => $projectionItems,
            'realization_items' => $realizationItems,
        ]
    ], JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);

} catch (AccountingException $e) {
    http_response_code($e->getCode() ?: 422);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Finance dashboard: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Dashboard gagal dimuat.']);
}
