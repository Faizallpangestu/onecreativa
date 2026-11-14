<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/accounting_reports.php';
require_once __DIR__.'/../services/finance_dashboard_totals.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);

try {
    $actor = session_actor($conn);
    if (!$actor) ac_fail('Silakan login kembali.', 401);
    $allowedRoles = ['admin', 'super_admin', 'finance', 'finance_admin', 'director', 'direktur', 'manager', 'hr', 'hrd'];
    $role = strtolower(trim($actor['role'] ?? ''));
    $email = strtolower(trim($actor['email'] ?? ''));
    if (!in_array($role, $allowedRoles, true) && $email !== 'muhammadfaizal.mf10@gmail.com' && !ac_can($conn, $actor, 'read')) {
        ac_fail('Akses ke dashboard keuangan tidak diizinkan.', 403);
    }
    session_write_close();

    $year = !empty($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    if ($year < 2000 || $year > 2100) ac_fail('Tahun tidak valid.');
    // Audit projection starts at the selected year and follows every future
    // dated obligation/receivable. The twelve-month chart remains scoped to
    // the selected year; the detail list is intentionally open-ended so a
    // CFO can audit next year and later schedules without losing records.
    $projectionStart = sprintf('%04d-01-01', $year);

    // Production may still have the legacy finance_records schema. Build the
    // compatibility fragments once so old databases do not fail the whole API.
    $hasAccountingTransactions = ac_table($conn, 'accounting_transactions');
    $legacyJoin = $hasAccountingTransactions
        ? "LEFT JOIN accounting_transactions t ON t.legacy_finance_id = f.id AND t.journal_status <> 'reversed'"
        : '';
    $legacyNotMigrated = $hasAccountingTransactions ? 'AND t.id IS NULL' : '';
    $hasLegacySalary = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='salary_request_id'") !== null;
    $hasLegacyBudget = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='budget_request_id'") !== null;
    $hasLegacyAccountName = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='account_name'") !== null;
    $hasLegacySource = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='source'") !== null;
    $hasLegacyBankName = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='bank_name'") !== null;
    $hasLegacyAccountNumber = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='account_number'") !== null;
    $hasLegacyMetode = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='metode'") !== null;
    $legacySalaryColumn = $hasLegacySalary ? 'f.salary_request_id' : 'NULL';
    $legacyBudgetColumn = $hasLegacyBudget ? 'f.budget_request_id' : 'NULL';
    $hasLegacyPartyName = ac_one($conn, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='party_name'") !== null;
    $legacyPartyColumn = $hasLegacyPartyName
        ? "COALESCE(NULLIF(f.party_name, ''), NULLIF(f.account_name, ''), NULLIF(f.source, ''), 'Internal')"
        : ($hasLegacyAccountName && $hasLegacySource
            ? "COALESCE(NULLIF(f.account_name, ''), NULLIF(f.source, ''), 'Internal')"
            : ($hasLegacyAccountName ? "COALESCE(NULLIF(f.account_name, ''), 'Internal')" : ($hasLegacySource ? "COALESCE(NULLIF(f.source, ''), 'Internal')" : "'Internal'")));
    $legacyBankColumn = $hasLegacyBankName ? "COALESCE(NULLIF(f.bank_name, ''), 'Kas/Bank')" : "'Kas/Bank'";
    $legacyAccountColumn = $hasLegacyAccountNumber ? "f.account_number" : "''";
    $legacyMetodeColumn = $hasLegacyMetode ? "COALESCE(NULLIF(f.metode, ''), 'Transfer')" : "'Transfer'";

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
    if ($hasAccountingTransactions) {
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
        if (ac_table($conn, 'journal_entries') && ac_table($conn, 'journal_lines') && ac_table($conn, 'accounts')) {
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

    // Merge legacy finance_records even when the new accounting tables already
    // contain data. Exclude records already migrated into accounting_transactions
    // so the historical ledger is preserved without double counting.
    if (ac_table($conn, 'finance_records')) {
        $legacyStmt = $conn->prepare("
            SELECT MONTH(f.transaction_date) AS m, f.type,
                   CAST(SUM(f.amount) AS CHAR) AS total
            FROM finance_records f
            {$legacyJoin}
            WHERE YEAR(f.transaction_date) = ?
              {$legacyNotMigrated}
            GROUP BY MONTH(f.transaction_date), f.type
        ");
        $legacyStmt->bind_param('i', $year);
        $legacyStmt->execute();
        $legacyResult = $legacyStmt->get_result();
        while ($row = $legacyResult->fetch_assoc()) {
            $m = (int)$row['m'];
            if (!isset($months[$m])) continue;
            if ($row['type'] === 'income') {
                $months[$m]['income'] = ac_decimal(
                    ac_cents($months[$m]['income']) + ac_cents($row['total'] ?? '0')
                );
            } else {
                $months[$m]['expense'] = ac_decimal(
                    ac_cents($months[$m]['expense']) + ac_cents($row['total'] ?? '0')
                );
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

    if (ac_table($conn, 'finance_records')) {
        $legacyIncSrc = $conn->prepare("
            SELECT COALESCE(NULLIF(f.bank_name, ''), 'BCA') AS account_name,
                   CAST(SUM(f.amount) AS CHAR) AS total,
                   COUNT(*) AS count
            FROM finance_records f
            {$legacyJoin}
            WHERE YEAR(f.transaction_date) = ?
              AND f.type = 'income'
              {$legacyNotMigrated}
            GROUP BY COALESCE(NULLIF(f.bank_name, ''), 'BCA')
            ORDER BY SUM(f.amount) DESC
        ");
        $legacyIncSrc->bind_param('i', $year);
        $legacyIncSrc->execute();
        $incomeBySource = $legacyIncSrc->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyIncSrc->close();
    }

    if (ac_table($conn, 'finance_records')) {
        $legacyExpSrc = $conn->prepare("
            SELECT COALESCE(NULLIF(f.bank_name, ''), 'BCA') AS account_name,
                   CAST(SUM(f.amount) AS CHAR) AS total,
                   COUNT(*) AS count
            FROM finance_records f
            {$legacyJoin}
            WHERE YEAR(f.transaction_date) = ?
              AND f.type = 'expense'
              {$legacyNotMigrated}
            GROUP BY COALESCE(NULLIF(f.bank_name, ''), 'BCA')
            ORDER BY SUM(f.amount) DESC
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
            WHERE t.transaction_date >= ?
              AND t.approval_status = 'approved'
              AND t.payment_status = 'unpaid'
            ORDER BY t.transaction_date DESC, t.id DESC
        ");
        $piStmt->bind_param('s', $projectionStart);
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
            ORDER BY t.transaction_date DESC, t.id DESC
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
            WHERE COALESCE(s.payday, s.period_start) >= ?
            ORDER BY s.id DESC
        ");
        $salStmt->bind_param('s', $projectionStart);
        $salStmt->execute();
        $salList = $salStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $salStmt->close();

        foreach ($salList as $sal) {
            $salDate = strtotime($sal['transaction_date']);
            $salYear = $salDate ? (int)date('Y', $salDate) : $year;
            $m = $salDate ? (int)date('n', $salDate) : 1;
            if ($sal['payment_status'] === 'paid') {
                $realSal = $sal;
                $realSal['number'] = 'FIN-' . $sal['number'];
                $realSal['paid_at'] = $sal['transaction_date'];
                $realSal['related_proj_id'] = $sal['id'];
                $realSal['related_proj_number'] = $sal['number'];
                if ($salYear === $year && isset($months[$m])) {
                    $months[$m]['realization'] = ac_decimal(
                        ac_cents($months[$m]['realization']) + ac_cents($sal['amount'])
                    );
                    $months[$m]['expense'] = ac_decimal(
                        ac_cents($months[$m]['expense']) + ac_cents($sal['amount'])
                    );
                }
                if ($salYear === $year) $realizationItems[] = $realSal;
            } else {
                if ($salYear === $year && isset($months[$m])) {
                    $months[$m]['projection'] = ac_decimal(
                        ac_cents($months[$m]['projection']) + ac_cents($sal['amount'])
                    );
                }
                $projectionItems[] = $sal;
            }
        }
    }

    if (ac_table($conn, 'finance_records')) {
        $legacyReal = $conn->prepare("
            SELECT f.id,
                   CONCAT('FIN-', LPAD(f.id, 5, '0')) AS number,
                   f.transaction_date,
                   f.type,
                   f.amount,
                   {$legacyPartyColumn} AS party_name,
                   f.description,
                   'legacy_finance' AS source_type,
                   f.category AS classification,
                   'unknown' AS approval_status,
                   'unknown' AS payment_status,
                   CONCAT({$legacyBankColumn}, IF({$legacyAccountColumn} != '', CONCAT(' (', {$legacyAccountColumn}, ')'), '')) AS cash_account_name,
                   NULL AS paid_at,
                   f.created_at AS recorded_at,
                   1 AS needs_review,
                   {$legacyMetodeColumn} AS reference,
                   {$legacySalaryColumn} AS salary_request_id,
                   {$legacyBudgetColumn} AS budget_request_id
            FROM finance_records f
            {$legacyJoin}
            WHERE YEAR(f.transaction_date) = ?
              {$legacyNotMigrated}
            ORDER BY f.transaction_date DESC, f.id DESC
        ");
        $legacyReal->bind_param('i', $year);
        $legacyReal->execute();
        $legacyRows = $legacyReal->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyReal->close();

        foreach ($legacyRows as $ri) {
            // Only add if not already in realization items (e.g. from salaryList)
            if (!empty($ri['salary_request_id'])) {
                $exists = false;
                foreach ($realizationItems as $cur) {
                    if (!empty($cur['salary_request_id']) && (int)$cur['salary_request_id'] === (int)$ri['salary_request_id']) {
                        $exists = true;
                        break;
                    }
                }
                if ($exists) continue;
            }
            $realizationItems[] = $ri;

        }
    }

    // === ENRICH WITH BILLING INVOICES (Student Invoices -> Proyeksi & Realisasi) ===
    if (ac_table($conn, 'billing_invoices')) {
        $billingPaidExpr = ac_table($conn, 'billing_pembayaran')
            ? "(SELECT COALESCE(SUM(bp.jumlah), 0) FROM billing_pembayaran bp WHERE bp.noInv = bi.id AND LOWER(TRIM(bp.statusVerif)) IN ('terverifikasi','verified'))"
            : '0';
        $billingAppliedExpr = "LEAST(bi.total, {$billingPaidExpr})";
        $paymentsByInv = [];
        if (ac_table($conn, 'billing_pembayaran')) {
            $payRes = @mysqli_query($conn, "SELECT id, noInv, tglBayar, jumlah, statusVerif FROM billing_pembayaran WHERE LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified') ORDER BY id ASC");
            if ($payRes) {
                while ($pRow = mysqli_fetch_assoc($payRes)) {
                    $noInv = $pRow['noInv'];
                    if (!isset($paymentsByInv[$noInv])) $paymentsByInv[$noInv] = [];
                    $paymentsByInv[$noInv][] = $pRow;
                }
            }
        }

        $invStmt = $conn->prepare("
             SELECT bi.id,
                    CASE WHEN bi.tanggal REGEXP '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN STR_TO_DATE(bi.tanggal, '%d/%m/%Y') ELSE DATE(bi.tanggal) END AS transaction_date,
                   'income' AS type,
                    GREATEST(0, bi.total - {$billingPaidExpr}) AS amount,
                    bi.total AS invoice_amount,
                    {$billingAppliedExpr} AS paid_amount,
                    bi.customer AS party_name,
                    CONCAT('Tagihan Siswa - ', bi.customer) AS description,
                   'invoice_billing' AS source_type,
                   'Pemasukan Pelatihan' AS classification,
                   'approved' AS approval_status,
                    CASE
                      WHEN bi.total > 0 AND bi.total - {$billingAppliedExpr} <= 0 THEN 'paid'
                      WHEN {$billingAppliedExpr} > 0 THEN 'partial'
                      ELSE 'unpaid'
                    END AS status,
                   'Belum diverifikasi' AS cash_account_name,
                    bi.jatuhTempo,
                    bi.meta_json,
                    bi.created_at
             FROM billing_invoices bi
              WHERE (CASE WHEN bi.tanggal REGEXP '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN STR_TO_DATE(bi.tanggal, '%d/%m/%Y') ELSE DATE(bi.tanggal) END) >= ?
             ORDER BY bi.id DESC
        ");
        $invStmt->bind_param('s', $projectionStart);
        $invStmt->execute();
        $invList = $invStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $invStmt->close();

        foreach ($invList as $inv) {
            $meta = !empty($inv['meta_json']) ? (json_decode((string)$inv['meta_json'], true) ?: []) : [];
            $installments = $meta['installments'] ?? [];

            // ── KONDISI A: SKEMA CICILAN (INSTALLMENTS PLAN) ──
            if (is_array($installments) && count($installments) > 0) {
                $totalPaid = (float)($inv['paid_amount'] ?? 0);
                $cumPaid = $totalPaid;
                $invPays = $paymentsByInv[$inv['id']] ?? [];
                $payIdx = 0;

                foreach ($installments as $idx => $inst) {
                    $itemNo = $idx + 1;
                    $instNominal = (float)($inst['nominal'] ?? 0);
                    $instDesc = !empty($inst['keterangan']) ? $inst['keterangan'] : (!empty($inst['deskripsi']) ? $inst['deskripsi'] : "Cicilan {$itemNo}");
                    $instDate = !empty($inst['jatuhTempo']) ? $inst['jatuhTempo'] : (!empty($inst['tanggal']) ? $inst['tanggal'] : $inv['transaction_date']);
                    $instTs = strtotime($instDate);
                    $instYear = $instTs ? (int)date('Y', $instTs) : $year;
                    $instMonth = $instTs ? (int)date('n', $instTs) : 1;

                    // Alokasi pembayaran masuk per termin
                    if ($cumPaid >= $instNominal) {
                        $terminPaid = $instNominal;
                        $terminUnpaid = 0.0;
                        $terminStatus = 'paid';
                        $cumPaid -= $instNominal;
                    } elseif ($cumPaid > 0) {
                        $terminPaid = $cumPaid;
                        $terminUnpaid = $instNominal - $cumPaid;
                        $terminStatus = 'partial';
                        $cumPaid = 0.0;
                    } else {
                        $terminPaid = 0.0;
                        $terminUnpaid = $instNominal;
                        $terminStatus = 'unpaid';
                    }

                    $termId = "{$inv['id']}-T{$itemNo}";
                    $displayDesc = "{$inv['party_name']} - {$instDesc} (No. {$inv['id']})";

                    // 1. Proyeksi: Tampilkan setiap termin dengan nominalnya sendiri
                    $projTerm = [
                        'id' => $termId,
                        'number' => $termId,
                        'transaction_date' => $instDate,
                        'type' => 'income',
                        'amount' => $terminUnpaid > 0 ? $terminUnpaid : $instNominal,
                        'invoice_amount' => $instNominal,
                        'paid_amount' => $terminPaid,
                        'party_name' => $inv['party_name'],
                        'description' => $displayDesc,
                        'source_type' => 'invoice_billing',
                        'classification' => 'Pemasukan Pelatihan (Cicilan)',
                        'approval_status' => 'approved',
                        'payment_status' => $terminStatus,
                        'cash_account_name' => 'BCA (1832-918-428)',
                        'jatuh_tempo' => $instDate,
                        'jatuhTempo' => $instDate,
                        'related_proj_id' => $termId,
                        'related_proj_number' => $termId,
                        'termin_info' => "{$instDesc} (Termin {$itemNo}/" . count($installments) . ")",
                        'parent_invoice_id' => $inv['id'],
                        'created_at' => $inv['created_at'],
                    ];
                    if ($terminStatus === 'paid') {
                        $projTerm['was_realized'] = true;
                    }
                    $projectionItems[] = $projTerm;

                    // 2. Realisasi: Jika belum lunas, buat baris pasangan Menunggu Bayar
                    if ($terminStatus !== 'paid') {
                        $todayIso = date('Y-m-d');
                        $isOverdue = $todayIso > $instDate;
                        $pendingReal = [
                            'id' => "PENDING-{$termId}",
                            'number' => "MENUNGGU-{$termId}",
                            'transaction_date' => $instDate,
                            'type' => 'income',
                            'amount' => 0,
                            'expected_amount' => $instNominal,
                            'paid_amount' => $terminPaid,
                            'party_name' => $inv['party_name'],
                            'description' => "{$inv['party_name']} - {$instDesc} (Menunggu Bayar)",
                            'source_type' => 'invoice_billing',
                            'classification' => 'Pemasukan Pelatihan (Cicilan)',
                            'approval_status' => 'approved',
                            'payment_status' => $isOverdue ? 'overdue' : 'unpaid',
                            'cash_account_name' => 'BCA (1832-918-428)',
                            'paid_at' => null,
                            'is_pending_realization' => true,
                            'related_proj_id' => $termId,
                            'related_proj_number' => $termId,
                            'termin_info' => "{$instDesc} (Termin {$itemNo}/" . count($installments) . ")",
                            'parent_invoice_id' => $inv['id'],
                        ];
                        $realizationItems[] = $pendingReal;
                    }

                    // Jika ada pembayaran terealisasi untuk termin ini
                    if ($terminPaid > 0) {
                        $payRow = $invPays[$payIdx] ?? null;
                        if ($payRow) $payIdx++;
                        $payDate = !empty($payRow['tglBayar']) ? $payRow['tglBayar'] : $instDate;

                        $realTerm = [
                            'id' => "FIN-{$termId}",
                            'number' => "FIN-{$termId}",
                            'transaction_date' => $payDate,
                            'type' => 'income',
                            'amount' => $terminPaid,
                            'expected_amount' => $instNominal,
                            'party_name' => $inv['party_name'],
                            'description' => "Pembayaran {$instDesc} - {$inv['party_name']} (No. {$inv['id']})",
                            'source_type' => 'invoice_billing',
                            'classification' => 'Pemasukan Pelatihan (Cicilan)',
                            'approval_status' => 'approved',
                            'payment_status' => $terminStatus,
                            'cash_account_name' => 'BCA (1832-918-428)',
                            'paid_at' => $payDate,
                            'related_proj_id' => $termId,
                            'related_proj_number' => $termId,
                            'termin_info' => "{$instDesc} (Termin {$itemNo}/" . count($installments) . ")",
                            'parent_invoice_id' => $inv['id'],
                        ];
                        $realizationItems[] = $realTerm;
                    }
                }
            } else {
                // ── KONDISI B: SKEMA FULL PAYMENT / REGULER ──
                $invTimestamp = strtotime($inv['transaction_date']);
                $invYear = $invTimestamp ? (int)date('Y', $invTimestamp) : $year;
                $m = $invTimestamp ? (int)date('n', $invTimestamp) : 1;
                $invoiceStatus = strtolower((string)($inv['status'] ?? 'unpaid'));
                $isPaid = $invoiceStatus === 'paid';
                $isPartial = $invoiceStatus === 'partial';

                // 1. Proyeksi: Invoice unpaid masuk ke proyeksi
                if (!$isPaid) {
                    $projInv = $inv;
                    $projInv['number'] = $inv['id'];
                    $projInv['payment_status'] = $isPartial ? 'partial' : 'unpaid';
                    $projectionItems[] = $projInv;

                    // Masukkan juga baris pasangan ke Realisasi Arus Kas dengan status Unpaid/Overdue
                    $todayIso = date('Y-m-d');
                    $due = !empty($inv['jatuhTempo']) ? $inv['jatuhTempo'] : $inv['transaction_date'];
                    $isOverdue = $todayIso > $due;
                    $pendingReal = $inv;
                    $pendingReal['id'] = 'PENDING-' . $inv['id'];
                    $pendingReal['number'] = 'MENUNGGU-' . $inv['id'];
                    $pendingReal['amount'] = 0;
                    $pendingReal['expected_amount'] = (float)$inv['invoice_amount'];
                    $pendingReal['payment_status'] = $isOverdue ? 'overdue' : 'unpaid';
                    $pendingReal['paid_at'] = null;
                    $pendingReal['is_pending_realization'] = true;
                    $pendingReal['related_proj_id'] = $inv['id'];
                    $pendingReal['related_proj_number'] = $inv['id'];
                    $realizationItems[] = $pendingReal;
                }

                // 2. Realisasi: Jika sudah dibayar (Paid/Lunas), masuk ke Realisasi aktual
                if (($isPaid || $isPartial) && (float)$inv['paid_amount'] > 0) {
                    $realInv = $inv;
                    $realInv['number'] = 'FIN-' . $inv['id'];
                    $realInv['amount'] = $inv['paid_amount'];
                    $realInv['payment_status'] = $isPaid ? 'paid' : 'partial';
                    $realInv['paid_at'] = null;
                    $realInv['needs_review'] = 1;
                    $realInv['date_basis'] = 'invoice_date_not_payment_date';
                    $realInv['related_proj_id'] = $inv['id'];
                    $realInv['related_proj_number'] = $inv['id'];
                    $realizationItems[] = $realInv;
                }
            }
        }
    }

    // === ENRICH WITH LEGACY CLIENT INVOICES (OUTSTANDING = PROJECTION) ===
    // invoice_clients stores the original bill while invoice_records stores
    // payments. Unpaid and partially paid balances must remain projections.
    if (ac_table($conn, 'invoice_clients')) {
        $paymentJoin = ac_table($conn, 'invoice_records')
            ? "LEFT JOIN invoice_records p ON p.client_id = c.id"
            : '';
        $paymentSum = ac_table($conn, 'invoice_records')
            ? 'COALESCE(SUM(p.jumlah), 0)'
            : '0';
        $clientInvStmt = $conn->prepare("
            SELECT c.id,
                   DATE(c.created_at) AS transaction_date,
                   'income' AS type,
                   CAST(c.total_biaya - {$paymentSum} AS DECIMAL(15,2)) AS amount,
                   c.name AS party_name,
                   CONCAT('Tagihan Client - ', c.name) AS description,
                   'invoice_client' AS source_type,
                   'Pemasukan Pelatihan' AS classification,
                   'approved' AS approval_status,
                   CASE WHEN {$paymentSum} > 0 THEN 'partial' ELSE 'unpaid' END AS payment_status,
                   'Belum diverifikasi' AS cash_account_name,
                   NULL AS due_date,
                   'recorded_date_not_due_date' AS date_basis,
                   c.id AS source_id,
                   c.total_biaya AS invoice_amount,
                   {$paymentSum} AS recorded_payment_amount,
                   c.created_at
            FROM invoice_clients c
            {$paymentJoin}
            WHERE c.created_at >= ?
            GROUP BY c.id, c.created_at, c.total_biaya, c.name
            HAVING c.total_biaya - {$paymentSum} > 0
            ORDER BY c.created_at DESC, c.id DESC
        ");
        $clientInvStmt->bind_param('s', $projectionStart);
        $clientInvStmt->execute();
        $clientInvList = $clientInvStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $clientInvStmt->close();
        foreach ($clientInvList as $inv) {
            $clientTimestamp = strtotime($inv['transaction_date']);
            $clientYear = $clientTimestamp ? (int)date('Y', $clientTimestamp) : $year;
            $m = $clientTimestamp ? (int)date('n', $clientTimestamp) : 1;
            $inv['number'] = 'CLIENT-' . $inv['id'];
            if ($clientYear === $year && isset($months[$m])) {
                $months[$m]['projection'] = ac_decimal(ac_cents($months[$m]['projection']) + ac_cents($inv['amount']));
            }
            $projectionItems[] = $inv;
        }
    }

    // === FUTURE COMMITMENTS (approved but not yet paid/realized) ===
    // These are not invoices, but they are real financial obligations already
    // approved by Finance. Keep them in the audit projection until a posted
    // accounting transaction exists, then the accounting ledger becomes the
    // single source of truth and this fallback is suppressed.
    if (ac_table($conn, 'vendor_bills') && ac_table($conn, 'vendors')) {
        $vendorStmt = $conn->prepare("\n            SELECT b.id, b.number, DATE(b.bill_date) AS transaction_date,\n                   'expense' AS type, b.amount, v.name AS party_name,\n                   CONCAT('Tagihan vendor - ', v.name) AS description,\n                   'vendor_bill' AS source_type, 'Tagihan Vendor' AS classification,\n                   'approved' AS approval_status, 'unpaid' AS payment_status,\n                   'BCA (1832-918-428)' AS cash_account_name, b.id AS source_id\n            FROM vendor_bills b\n            JOIN vendors v ON v.id = b.vendor_id\n            WHERE b.status = 'approved'\n              AND b.bill_date >= ?\n              AND NOT EXISTS (\n                SELECT 1 FROM accounting_transactions t\n                WHERE t.source_type = 'vendor_bill'\n                  AND t.source_id = CAST(b.id AS CHAR)\n                  AND t.journal_status <> 'reversed'\n              )\n            ORDER BY b.bill_date ASC, b.id ASC\n            LIMIT 500\n        ");
        $vendorStmt->bind_param('s', $projectionStart);
        $vendorStmt->execute();
        foreach ($vendorStmt->get_result()->fetch_all(MYSQLI_ASSOC) as $bill) {
            $billDate = strtotime($bill['transaction_date']);
            $billYear = $billDate ? (int)date('Y', $billDate) : $year;
            $billMonth = $billDate ? (int)date('n', $billDate) : 1;
            if ($billYear === $year && isset($months[$billMonth])) {
                $months[$billMonth]['projection'] = ac_decimal(ac_cents($months[$billMonth]['projection']) + ac_cents($bill['amount']));
            }
            $bill['number'] = $bill['number'] ?: 'BILL-' . $bill['id'];
            $projectionItems[] = $bill;
        }
        $vendorStmt->close();
    }

    if (ac_table($conn, 'reimbursements')) {
        $reimStmt = $conn->prepare("\n            SELECT r.id, CONCAT('REIMB-', r.id) AS number, DATE(r.created_at) AS transaction_date,\n                   'expense' AS type, r.amount,\n                   COALESCE(NULLIF(e.full_name, ''), u.email, CONCAT('Karyawan #', r.user_id)) AS party_name,\n                   r.description, 'reimbursement' AS source_type,\n                   CONCAT('Reimbursement - ', r.category) AS classification,\n                   'approved' AS approval_status, 'unpaid' AS payment_status,\n                   'BCA (1832-918-428)' AS cash_account_name, r.id AS source_id\n            FROM reimbursements r\n            LEFT JOIN users u ON u.id = r.user_id\n            LEFT JOIN employees e ON e.user_id = r.user_id\n            WHERE r.status = 'approved'\n              AND r.created_at >= ?\n              AND NOT EXISTS (\n                SELECT 1 FROM accounting_transactions t\n                WHERE t.source_type = 'reimbursement'\n                  AND t.source_id = CAST(r.id AS CHAR)\n                  AND t.journal_status <> 'reversed'\n              )\n            ORDER BY r.created_at ASC, r.id ASC\n            LIMIT 500\n        ");
        $reimStmt->bind_param('s', $projectionStart);
        $reimStmt->execute();
        foreach ($reimStmt->get_result()->fetch_all(MYSQLI_ASSOC) as $reim) {
            $reimDate = strtotime($reim['transaction_date']);
            $reimYear = $reimDate ? (int)date('Y', $reimDate) : $year;
            $reimMonth = $reimDate ? (int)date('n', $reimDate) : 1;
            if ($reimYear === $year && isset($months[$reimMonth])) {
                $months[$reimMonth]['projection'] = ac_decimal(ac_cents($months[$reimMonth]['projection']) + ac_cents($reim['amount']));
            }
            $projectionItems[] = $reim;
        }
        $reimStmt->close();
    }

    // Approved RAB/budget balances are expected cash outflows even before a
    // vendor bill is created. Subtract recorded realizations and open
    // commitments so audit totals never count the same budget twice.
    if (ac_table($conn, 'budget_requests') && ac_table($conn, 'budget_realizations')) {
        $budgetCommitmentExpr = ac_table($conn, 'budget_commitments')
            ? "COALESCE((SELECT SUM(c.amount) FROM budget_commitments c JOIN budget_request_items i ON i.id=c.budget_item_id WHERE i.budget_request_id=b.id AND c.status='open'),0)"
            : '0';
        $budgetStmt = $conn->prepare("\n            SELECT b.id, CONCAT('RAB-', LPAD(b.id, 6, '0')) AS number, b.period AS transaction_date,\n                   'expense' AS type,\n                   GREATEST(0, b.approved_amount\n                     - COALESCE((SELECT SUM(r.amount) FROM budget_realizations r WHERE r.budget_request_id=b.id AND r.status='recorded'),0)\n                     - {$budgetCommitmentExpr}) AS amount,\n                   'Komitmen RAB' AS party_name, b.title AS description,\n                   'budget_approval' AS source_type, 'Anggaran disetujui' AS classification,\n                   'approved' AS approval_status, 'unpaid' AS payment_status,\n                   'BCA (1832-918-428)' AS cash_account_name, b.id AS source_id\n            FROM budget_requests b\n            WHERE b.status IN ('approved','partially_realized')\n              AND b.approved_amount > 0\n              AND b.period >= ?\n            HAVING amount > 0\n            ORDER BY b.period ASC, b.id ASC\n            LIMIT 500\n        ");
        $budgetStmt->bind_param('s', $projectionStart);
        $budgetStmt->execute();
        foreach ($budgetStmt->get_result()->fetch_all(MYSQLI_ASSOC) as $budget) {
            $budgetDate = strtotime($budget['transaction_date']);
            $budgetYear = $budgetDate ? (int)date('Y', $budgetDate) : $year;
            $budgetMonth = $budgetDate ? (int)date('n', $budgetDate) : 1;
            if ($budgetYear === $year && isset($months[$budgetMonth])) {
                $months[$budgetMonth]['projection'] = ac_decimal(ac_cents($months[$budgetMonth]['projection']) + ac_cents($budget['amount']));
            }
            $projectionItems[] = $budget;
        }
        $budgetStmt->close();
    }

    // === STUDENT INVOICE AUDIT TRACE ===
    // The audit view keeps a linked paid-income copy in projection so Finance
    // can trace invoice lifecycle: unpaid projection -> paid projection ->
    // paid realization. Expenses never belong to this student-invoice trace.
    $projectionAuditKeys = [];
    foreach ($projectionItems as $existingProjection) {
        $projectionAuditKeys[(string)($existingProjection['source_type'] ?? '') . ':' . (string)($existingProjection['source_id'] ?? $existingProjection['id'] ?? '')] = true;
    }
    foreach ($realizationItems as $realized) {
        if (($realized['type'] ?? '') !== 'income' || ac_cents((string)($realized['amount'] ?? '0')) <= 0) continue;
        $realKey = (string)($realized['source_type'] ?? '') . ':' . (string)($realized['source_id'] ?? $realized['id'] ?? '');
        if (isset($projectionAuditKeys[$realKey])) continue;
        $auditProjection = $realized;
        $auditProjection['id'] = 'PROJ-REAL-' . ($realized['id'] ?? $realized['number'] ?? uniqid());
        $auditProjection['number'] = 'PROJ-' . ($realized['number'] ?? $realized['id'] ?? 'REAL');
        $auditProjection['payment_status'] = $realized['payment_status'] ?? 'unknown';
        $auditProjection['projection_status'] = 'historical_reference';
        $auditProjection['is_historical_reference'] = true;
        $auditProjection['was_realized'] = in_array($auditProjection['payment_status'], ['paid', 'verified'], true);
        $projectionItems[] = $auditProjection;
        $projectionAuditKeys[$realKey] = true;
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

    if (ac_table($conn, 'finance_records')) {
        $legacyIncCls = $conn->prepare("
            SELECT COALESCE(NULLIF(f.category, ''), 'Lainnya') AS classification,
                   CAST(SUM(f.amount) AS CHAR) AS total
            FROM finance_records f
            {$legacyJoin}
            WHERE YEAR(f.transaction_date) = ?
              AND f.type = 'income'
              {$legacyNotMigrated}
            GROUP BY COALESCE(NULLIF(f.category, ''), 'Lainnya')
            ORDER BY SUM(f.amount) DESC
        ");
        $legacyIncCls->bind_param('i', $year);
        $legacyIncCls->execute();
        $incomeByClassification = $legacyIncCls->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyIncCls->close();
    }

    if (ac_table($conn, 'finance_records')) {
        $legacyExpCls = $conn->prepare("
            SELECT COALESCE(NULLIF(f.category, ''), 'Lainnya') AS classification,
                   CAST(SUM(f.amount) AS CHAR) AS total
            FROM finance_records f
            {$legacyJoin}
            WHERE YEAR(f.transaction_date) = ?
              AND f.type = 'expense'
              {$legacyNotMigrated}
            GROUP BY COALESCE(NULLIF(f.category, ''), 'Lainnya')
            ORDER BY SUM(f.amount) DESC
        ");
        $legacyExpCls->bind_param('i', $year);
        $legacyExpCls->execute();
        $expenseByClassification = $legacyExpCls->get_result()->fetch_all(MYSQLI_ASSOC);
        $legacyExpCls->close();
    }

    // Rebuild cash totals from the same complete operational lists shown in
    // detail. Accrual revenue/expense journals must not be mixed with cash.
    $cashTotals = finance_dashboard_totals($projectionItems, $realizationItems, $year);
    $months = $cashTotals['months'];
    // === TOTALS ===
    // The audit KPI includes every open projection from the selected year
    // onward. Monthly chart values below remain selected-year-only.
    $totalProjCents = 0;
    $totalProjYearCents = 0;
    $totalRealCents = 0;
    $totalIncCents  = 0;
    $totalExpCents  = 0;
    foreach ($months as $m) {
        $totalProjYearCents += ac_cents((string)($m['projection'] ?? '0'));
        $totalRealCents += ac_cents((string)($m['realization'] ?? '0'));
        $totalIncCents  += ac_cents((string)($m['income'] ?? '0'));
        $totalExpCents  += ac_cents((string)($m['expense'] ?? '0'));
    }
    foreach ($projectionItems as $projectionItem) {
        if (($projectionItem['type'] ?? '') === 'income') {
            $totalProjCents += ac_cents((string)($projectionItem['amount'] ?? '0'));
        }
    }
    $totalProjection  = ac_decimal($totalProjCents);
    $totalRealization = ac_decimal($totalRealCents);
    $totalIncome      = ac_decimal($totalIncCents);
    $totalExpense     = ac_decimal($totalExpCents);

    // === P1: CFO ALERTS & INDICATORS (Non-blocking) ===
    $alerts = [];
    $unpostedCount = 0;
    $budgetAlerts = [];
    $overdueReceivables = [];
    $cashBurnRate = 0;
    $cashBalance  = 0;
    $monthsLeft   = null;

    // Alert 1: Unposted payments (paid/verified but not journaled)
    try {
        if (ac_table($conn, 'accounting_transactions')) {
            $upRow = $conn->query("SELECT COUNT(*) AS c FROM accounting_transactions WHERE journal_status='unposted' AND payment_status IN ('paid','verified')");
            $unpostedCount = (int)($upRow?->fetch_assoc()['c'] ?? 0);
        }
        if ($unpostedCount > 0) {
            $alerts[] = ['type' => 'warning', 'code' => 'UNPOSTED', 'message' => "$unpostedCount transaksi sudah dibayar tapi belum diposting ke jurnal", 'count' => $unpostedCount];
        }
    } catch (Throwable) {}

    // Alert 2: Budget overspend (>80% realized)
    try {
        if (ac_table($conn, 'budget_requests') && ac_table($conn, 'budget_realizations')) {
            $budgetRes = $conn->query("
                SELECT b.id, b.title, b.approved_amount,
                       COALESCE((SELECT SUM(r.amount) FROM budget_realizations r WHERE r.budget_request_id=b.id AND r.status='recorded'),0) AS realized
                FROM budget_requests b
                WHERE b.status='approved' AND b.approved_amount > 0
                  AND YEAR(b.period) = $year
            ");
            if ($budgetRes) {
                while ($br = $budgetRes->fetch_assoc()) {
                    $pct = (float)$br['approved_amount'] > 0 ? ((float)$br['realized'] / (float)$br['approved_amount']) * 100 : 0;
                    if ($pct >= 80) {
                        $budgetAlerts[] = ['title' => $br['title'], 'approved' => (float)$br['approved_amount'], 'realized' => (float)$br['realized'], 'pct' => round($pct, 1)];
                        if ($pct >= 100) {
                            $alerts[] = ['type' => 'danger',  'code' => 'BUDGET_EXCEEDED', 'message' => 'Anggaran "'.$br['title'].'" SUDAH MELEBIHI batas ('.round($pct,1).'%)', 'budget_id' => (int)$br['id']];
                        } else {
                            $alerts[] = ['type' => 'warning', 'code' => 'BUDGET_80PCT',    'message' => 'Anggaran "'.$br['title'].'" sudah '.round($pct,1).'% terpakai', 'budget_id' => (int)$br['id']];
                        }
                    }
                }
            }
        }
    } catch (Throwable) {}

    // Alert 3: Aging piutang > 30 hari
    try {
        $totalOverdue = 0;
        if (ac_table($conn, 'accounting_source_documents')) {
            $hasAlloc = ac_table($conn, 'payment_allocations');
            $allocSubquery = $hasAlloc
                ? "COALESCE((SELECT SUM(p.amount) FROM payment_allocations p WHERE p.source_document_id=d.id AND p.is_reversed=0),0)"
                : "0";
            $agingRes = $conn->query("
                SELECT d.source_type, d.source_id, d.due_date,
                       DATEDIFF(CURDATE(), d.due_date) AS days_overdue,
                       CAST(d.amount - $allocSubquery AS DECIMAL(15,2)) AS outstanding
                FROM accounting_source_documents d
                WHERE d.due_date < CURDATE()
                  AND d.amount > $allocSubquery
                ORDER BY days_overdue DESC
                LIMIT 20
            ");
            if ($agingRes) {
                while ($ag = $agingRes->fetch_assoc()) {
                    if ((float)$ag['outstanding'] > 0 && (int)$ag['days_overdue'] > 0) {
                        $overdueReceivables[] = $ag;
                        $totalOverdue += (float)$ag['outstanding'];
                    }
                }
            }
            if ($totalOverdue > 0) {
                $alerts[] = ['type' => 'danger', 'code' => 'OVERDUE_AR', 'message' => count($overdueReceivables).' piutang jatuh tempo belum dibayar (total: Rp '.number_format($totalOverdue,0,',','.') . ')', 'total_overdue' => $totalOverdue];
            }
        }
    } catch (Throwable) {}

    // Alert 4: Cash burn rate (avg monthly expense last 3 months)
    try {
        if (ac_table($conn, 'journal_lines') && ac_table($conn, 'journal_entries') && ac_table($conn, 'accounts')) {
            $burnRes = $conn->query("
                SELECT AVG(monthly_exp) AS avg_monthly_expense
                FROM (
                    SELECT MONTH(j.entry_date) AS m, SUM(l.debit - l.credit) AS monthly_exp
                    FROM journal_lines l
                    JOIN journal_entries j ON j.id = l.journal_entry_id
                    JOIN accounts a ON a.id = l.account_id
                    WHERE j.status = 'posted'
                      AND a.account_group = 5
                      AND j.entry_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                    GROUP BY MONTH(j.entry_date)
                ) t
            ");
            $cashBurnRate = (float)($burnRes?->fetch_assoc()['avg_monthly_expense'] ?? 0);

            $cashRes = $conn->query("
                SELECT SUM(l.debit - l.credit) AS total
                FROM journal_lines l
                JOIN journal_entries j ON j.id = l.journal_entry_id
                JOIN accounts a ON a.id = l.account_id
                WHERE j.status='posted' AND a.report_class='cash'
            ");
            $cashBalance = (float)($cashRes?->fetch_assoc()['total'] ?? 0);
            if ($cashBurnRate > 0 && $cashBalance > 0) {
                $monthsLeft = round($cashBalance / $cashBurnRate, 1);
                if ($monthsLeft < 3) {
                    $alerts[] = ['type' => 'danger', 'code' => 'LOW_CASH', 'message' => 'Saldo kas hanya cukup untuk '.number_format($monthsLeft, 1).' bulan berdasarkan burn rate saat ini'];
                }
            }
        }
    } catch (Throwable) {}

    echo json_encode([
        'status' => 'success',
        'data' => [
            'year' => $year,
            'months' => array_values($months),
            'totals' => [
                'projection'  => $totalProjection,
                'projection_outstanding' => $cashTotals['outstanding'],
                'projection_current_year' => ac_decimal($totalProjYearCents),
                'realization' => $totalRealization,
                'income'      => $totalIncome,
                'expense'     => $totalExpense,
                'balance'     => ac_decimal(ac_cents($totalIncome) - ac_cents($totalExpense)),
                'selisih'     => ac_decimal(ac_cents($totalProjection) - ac_cents($totalRealization)),
            ],
            'income_by_source'          => $incomeBySource,
            'expense_by_source'         => $expenseBySource,
            'income_by_classification'  => $incomeByClassification,
            'expense_by_classification' => $expenseByClassification,
            'projection_items'          => $projectionItems,
            'projection_horizon_start'  => $projectionStart,
            'projection_horizon'        => 'selected_year_and_all_future_dates',
            'realization_items'         => $realizationItems,
            'coverage' => ['complete'=>false, 'basis'=>'operational_records',
                'notice'=>'Catatan operasional lengkap untuk filter sumber; bukan laporan jurnal resmi atau saldo bank terverifikasi. Data historis memerlukan review.'],
            // P1 CFO alerts
            'alerts'                    => $alerts,
            'unposted_count'            => $unpostedCount,
            'budget_alerts'             => $budgetAlerts,
            'overdue_receivables'       => $overdueReceivables,
            'cash_burn_rate'            => $cashBurnRate,
            'cash_balance'              => $cashBalance,
            'cash_months_remaining'     => $monthsLeft,
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
