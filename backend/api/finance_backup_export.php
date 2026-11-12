<?php
/**
 * finance_backup_export.php
 * Ekspor & backup transaksi Pemasukan dan Pengeluaran berdasarkan rentang tanggal
 * (default: 2026-08-01 s/d 2026-09-30).
 *
 * Mendukung 3 format:
 * - format=sql  : SQL restore-ready (INSERT IGNORE dengan kolom asli & ID asli)
 * - format=csv  : CSV UTF-8 BOM siap buka di Excel
 * - format=json : Ringkasan total + daftar baris
 *
 * Akses wajib login sebagai role finance / finance_admin / admin / super_admin / director,
 * atau dijalankan melalui PHP CLI.
 */

if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
}

require_once __DIR__ . '/../config/database.php';

if (PHP_SAPI !== 'cli') {
    require_once __DIR__ . '/../services/api_session_guard.php';
    $actor = api_session_guard($conn, 'read');
    $allowedRoles = ['super_admin', 'admin', 'finance', 'finance_admin', 'director', 'direktur'];
    if (!in_array(strtolower((string)($actor['role'] ?? '')), $allowedRoles, true)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Hanya role Finance, Admin, atau Direksi yang dapat menarik backup transaksi keuangan.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function fbe_parse_cli_args(array $argv): array {
    $opts = [];
    foreach (array_slice($argv, 1) as $arg) {
        if (str_starts_with($arg, '--') && str_contains($arg, '=')) {
            [$k, $v] = explode('=', substr($arg, 2), 2);
            $opts[trim($k)] = trim($v);
        }
    }
    return $opts;
}

function fbe_valid_date(string $value, string $fallback): string {
    $value = trim($value);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return $fallback;
    }
    $dt = DateTime::createFromFormat('Y-m-d', $value);
    return ($dt && $dt->format('Y-m-d') === $value) ? $value : $fallback;
}

function fbe_table_exists(mysqli $conn, string $table): bool {
    $safe = $conn->real_escape_string($table);
    $res = @$conn->query("SHOW TABLES LIKE '{$safe}'");
    return $res && $res->num_rows > 0;
}

function fbe_table_columns(mysqli $conn, string $table): array {
    if (!fbe_table_exists($conn, $table)) {
        return [];
    }
    $cols = [];
    $res = @$conn->query("SHOW COLUMNS FROM `{$table}`");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $cols[] = $row['Field'];
        }
    }
    return $cols;
}

function fbe_fetch_all(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return [];
    }
    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();
    return $rows;
}

function fbe_sql_literal(mysqli $conn, mixed $value): string {
    if ($value === null) {
        return 'NULL';
    }
    if (is_int($value) || is_float($value)) {
        return (string)$value;
    }
    return "'" . $conn->real_escape_string((string)$value) . "'";
}

function fbe_build_insert_block(mysqli $conn, string $table, array $rows): string {
    if (empty($rows)) {
        return '';
    }
    $cols = array_keys($rows[0]);
    $quotedCols = implode(', ', array_map(fn($c) => "`{$c}`", $cols));
    $out = "-- Tabel `{$table}` (" . count($rows) . " baris)\n";
    $out .= "INSERT IGNORE INTO `{$table}` ({$quotedCols}) VALUES\n";
    $tuples = [];
    foreach ($rows as $row) {
        $vals = [];
        foreach ($cols as $col) {
            $vals[] = fbe_sql_literal($conn, $row[$col] ?? null);
        }
        $tuples[] = '(' . implode(', ', $vals) . ')';
    }
    $out .= implode(",\n", $tuples) . ";\n\n";
    return $out;
}

function fbe_collect_unified_data(mysqli $conn, string $from, string $to, string $typeFilter): array {
    $rows = [];
    $countsByTable = [];
    $seenFinanceIds = [];
    $seenLinkedAtKeys = [];
    $seenSalaryIds = [];

    // 1. finance_records
    if (fbe_table_exists($conn, 'finance_records')) {
        $frRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `finance_records` WHERE `transaction_date` BETWEEN ? AND ? ORDER BY `transaction_date` ASC, `id` ASC",
            'ss',
            [$from, $to]
        );
        foreach ($frRows as $r) {
            $t = strtolower(trim((string)($r['type'] ?? 'income')));
            if (!in_array($t, ['income', 'expense'], true)) {
                continue;
            }
            $seenFinanceIds[(int)$r['id']] = true;
            if (!empty($r['salary_request_id'])) {
                $seenSalaryIds[(int)$r['salary_request_id']] = true;
            }
            if ($typeFilter !== 'all' && $t !== $typeFilter) {
                continue;
            }
            $countsByTable['finance_records'] = ($countsByTable['finance_records'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'finance_records',
                'raw_id' => (int)$r['id'],
                'reference_no' => 'FIN-' . str_pad((string)$r['id'], 5, '0', STR_PAD_LEFT),
                'type' => $t,
                'date' => (string)$r['transaction_date'],
                'category' => (string)($r['category'] ?? 'Umum'),
                'party_name' => (string)(($r['party_name'] ?? '') ?: ($r['source'] ?? '') ?: '-'),
                'account_or_method' => (string)(($r['bank_name'] ?? '') ?: ($r['metode'] ?? 'Transfer')),
                'amount' => round((float)($r['amount'] ?? 0), 2),
                'status' => (string)(($r['status'] ?? '') ?: ($t === 'income' ? 'Lunas' : 'Paid')),
                'description' => (string)($r['description'] ?? ''),
                'proof' => (string)(($r['photo_path'] ?? '') ?: ($r['drive_link'] ?? '')),
            ];
        }
    }

    // 2. accounting_transactions (hindari duplikat terhadap legacy_finance_id)
    if (fbe_table_exists($conn, 'accounting_transactions')) {
        $atRows = fbe_fetch_all(
            $conn,
            "SELECT t.*, COALESCE(b.name, a.name, t.payment_method, '-') AS cash_label
             FROM `accounting_transactions` t
             LEFT JOIN `accounts` a ON a.id = t.cash_account_id
             LEFT JOIN `cash_bank_accounts` b ON b.account_id = t.cash_account_id
             WHERE t.`transaction_date` BETWEEN ? AND ?
             ORDER BY t.`transaction_date` ASC, t.`id` ASC",
            'ss',
            [$from, $to]
        );
        foreach ($atRows as $r) {
            if (!empty($r['source_type']) && !empty($r['source_id'])) {
                $seenLinkedAtKeys[$r['source_type'] . ':' . $r['source_id']] = true;
            }
            if (!empty($r['legacy_finance_id']) && isset($seenFinanceIds[(int)$r['legacy_finance_id']])) {
                continue;
            }
            $t = strtolower(trim((string)($r['type'] ?? '')));
            if (!in_array($t, ['income', 'expense'], true)) {
                continue;
            }
            if ($typeFilter !== 'all' && $t !== $typeFilter) {
                continue;
            }
            $countsByTable['accounting_transactions'] = ($countsByTable['accounting_transactions'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'accounting_transactions',
                'raw_id' => (int)$r['id'],
                'reference_no' => (string)(($r['number'] ?? '') ?: ('TRX-' . $r['id'])),
                'type' => $t,
                'date' => (string)$r['transaction_date'],
                'category' => (string)($r['category'] ?? 'Umum'),
                'party_name' => (string)(($r['party_name'] ?? '') ?: '-'),
                'account_or_method' => (string)($r['cash_label'] ?? '-'),
                'amount' => round((float)($r['amount'] ?? 0), 2),
                'status' => (string)(($r['payment_status'] ?? '') ?: ($r['approval_status'] ?? '-')),
                'description' => (string)($r['description'] ?? ''),
                'proof' => (string)(($r['attachment_key'] ?? '') ?: ($r['attachment_link'] ?? '')),
            ];
        }
    }

    // 3. billing_pembayaran terverifikasi (pemasukan siswa)
    if ($typeFilter !== 'expense' && fbe_table_exists($conn, 'billing_pembayaran')) {
        $bpRows = fbe_fetch_all(
            $conn,
            "SELECT bp.*, bi.customer AS inv_customer, bi.keterangan AS inv_desc
             FROM `billing_pembayaran` bp
             LEFT JOIN `billing_invoices` bi ON bi.id = bp.noInv
             WHERE bp.`tglBayar` BETWEEN ? AND ?
               AND LOWER(TRIM(COALESCE(bp.`statusVerif`, ''))) IN ('terverifikasi', 'verified', 'lunas', 'paid')
             ORDER BY bp.`tglBayar` ASC, bp.`id` ASC",
            'ss',
            [$from, $to]
        );
        foreach ($bpRows as $r) {
            if (isset($seenLinkedAtKeys['billing_payment:' . $r['id']])) {
                continue;
            }
            $countsByTable['billing_pembayaran'] = ($countsByTable['billing_pembayaran'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'billing_pembayaran',
                'raw_id' => (int)$r['id'],
                'reference_no' => (string)($r['noInv'] ?? ('PAY-' . $r['id'])),
                'type' => 'income',
                'date' => (string)$r['tglBayar'],
                'category' => 'Biaya Kursus / Billing Siswa',
                'party_name' => (string)(($r['customer'] ?? '') ?: ($r['inv_customer'] ?? 'Siswa')),
                'account_or_method' => (string)(($r['metode'] ?? '') ?: 'Transfer'),
                'amount' => round((float)($r['jumlah'] ?? 0), 2),
                'status' => (string)($r['statusVerif'] ?? 'Terverifikasi'),
                'description' => (string)(($r['inv_desc'] ?? '') ?: ('Pembayaran Invoice ' . ($r['noInv'] ?? ''))),
                'proof' => (string)($r['proof_path'] ?? ''),
            ];
        }
    }

    // 4. vendor_bills (tagihan vendor)
    if ($typeFilter !== 'income' && fbe_table_exists($conn, 'vendor_bills')) {
        $vbCols = fbe_table_columns($conn, 'vendor_bills');
        $dateCol = in_array('bill_date', $vbCols, true) ? 'bill_date' : 'due_date';
        $amtCol = in_array('amount', $vbCols, true) ? 'amount' : 'total_amount';
        $numCol = in_array('number', $vbCols, true) ? 'number' : 'bill_number';
        $hasVendors = fbe_table_exists($conn, 'vendors');
        $sqlVb = $hasVendors
            ? "SELECT vb.*, v.name AS vendor_name FROM `vendor_bills` vb LEFT JOIN `vendors` v ON v.id = vb.vendor_id WHERE vb.`{$dateCol}` BETWEEN ? AND ? ORDER BY vb.`{$dateCol}` ASC, vb.`id` ASC"
            : "SELECT vb.*, NULL AS vendor_name FROM `vendor_bills` vb WHERE vb.`{$dateCol}` BETWEEN ? AND ? ORDER BY vb.`{$dateCol}` ASC, vb.`id` ASC";
        $vbRows = fbe_fetch_all($conn, $sqlVb, 'ss', [$from, $to]);
        foreach ($vbRows as $r) {
            if (isset($seenLinkedAtKeys['vendor_bill:' . $r['id']])) {
                continue;
            }
            $countsByTable['vendor_bills'] = ($countsByTable['vendor_bills'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'vendor_bills',
                'raw_id' => (int)$r['id'],
                'reference_no' => (string)(($r[$numCol] ?? '') ?: ('BILL-' . $r['id'])),
                'type' => 'expense',
                'date' => (string)($r[$dateCol] ?? ''),
                'category' => 'Tagihan Vendor',
                'party_name' => (string)(($r['vendor_name'] ?? '') ?: 'Vendor'),
                'account_or_method' => 'Transfer / Utang Vendor',
                'amount' => round((float)($r[$amtCol] ?? 0), 2),
                'status' => (string)($r['status'] ?? 'open'),
                'description' => 'Tagihan Vendor #' . (($r[$numCol] ?? '') ?: $r['id']),
                'proof' => '',
            ];
        }
    }

    // 5. salary_requests terbayar
    if ($typeFilter !== 'income' && fbe_table_exists($conn, 'salary_requests')) {
        $srRows = fbe_fetch_all(
            $conn,
            "SELECT *, COALESCE(`paid_date`, `payday`, DATE(`created_at`)) AS eff_date
             FROM `salary_requests`
             WHERE LOWER(TRIM(COALESCE(`status`, ''))) IN ('paid', 'published')
               AND COALESCE(`paid_date`, `payday`, DATE(`created_at`)) BETWEEN ? AND ?
             ORDER BY eff_date ASC, `id` ASC",
            'ss',
            [$from, $to]
        );
        foreach ($srRows as $r) {
            if (isset($seenSalaryIds[(int)$r['id']]) || isset($seenLinkedAtKeys['salary:' . $r['id']])) {
                continue;
            }
            $countsByTable['salary_requests'] = ($countsByTable['salary_requests'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'salary_requests',
                'raw_id' => (int)$r['id'],
                'reference_no' => 'PAY-' . str_pad((string)$r['id'], 5, '0', STR_PAD_LEFT),
                'type' => 'expense',
                'date' => (string)($r['eff_date'] ?? ''),
                'category' => 'Gaji Karyawan',
                'party_name' => (string)(($r['employee_name'] ?? '') ?: 'Karyawan'),
                'account_or_method' => (string)(($r['bank_name'] ?? '') ?: 'Transfer'),
                'amount' => round((float)($r['total_salary'] ?? 0), 2),
                'status' => (string)($r['status'] ?? 'paid'),
                'description' => 'Penggajian Periode ' . ($r['month'] ?? '-'),
                'proof' => (string)($r['transfer_reference'] ?? ''),
            ];
        }
    }

    // 6. reimbursements disetujui / dibayar
    if ($typeFilter !== 'income' && fbe_table_exists($conn, 'reimbursements')) {
        $rmRows = fbe_fetch_all(
            $conn,
            "SELECT r.*, COALESCE(NULLIF(e.full_name, ''), u.email, 'Karyawan') AS requester_name
             FROM `reimbursements` r
             LEFT JOIN `users` u ON u.id = r.user_id
             LEFT JOIN `employees` e ON e.user_id = r.user_id
             WHERE DATE(r.`created_at`) BETWEEN ? AND ?
               AND LOWER(TRIM(COALESCE(r.`status`, ''))) IN ('approved', 'paid', 'disetujui', 'selesai')
             ORDER BY r.`created_at` ASC, r.`id` ASC",
            'ss',
            [$from, $to]
        );
        foreach ($rmRows as $r) {
            if (isset($seenLinkedAtKeys['reimbursement:' . $r['id']])) {
                continue;
            }
            $countsByTable['reimbursements'] = ($countsByTable['reimbursements'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'reimbursements',
                'raw_id' => (int)$r['id'],
                'reference_no' => 'RMB-' . str_pad((string)$r['id'], 5, '0', STR_PAD_LEFT),
                'type' => 'expense',
                'date' => substr((string)$r['created_at'], 0, 10),
                'category' => (string)($r['category'] ?? 'Reimbursement'),
                'party_name' => (string)($r['requester_name'] ?? 'Karyawan'),
                'account_or_method' => 'Reimbursement',
                'amount' => round((float)($r['amount'] ?? 0), 2),
                'status' => (string)($r['status'] ?? 'approved'),
                'description' => (string)($r['description'] ?? ''),
                'proof' => (string)($r['receipt_path'] ?? ''),
            ];
        }
    }

    // 7. invoice_records (pembayaran invoice client lama)
    if ($typeFilter !== 'expense' && fbe_table_exists($conn, 'invoice_records')) {
        $hasClients = fbe_table_exists($conn, 'invoice_clients');
        $sqlIr = $hasClients
            ? "SELECT ir.*, ic.name AS client_name FROM `invoice_records` ir LEFT JOIN `invoice_clients` ic ON ic.id = ir.client_id WHERE DATE(ir.`created_at`) BETWEEN ? AND ? ORDER BY ir.`created_at` ASC, ir.`id` ASC"
            : "SELECT ir.*, NULL AS client_name FROM `invoice_records` ir WHERE DATE(ir.`created_at`) BETWEEN ? AND ? ORDER BY ir.`created_at` ASC, ir.`id` ASC";
        $irRows = fbe_fetch_all($conn, $sqlIr, 'ss', [$from, $to]);
        foreach ($irRows as $r) {
            if (isset($seenLinkedAtKeys['invoice_payment:' . $r['id']])) {
                continue;
            }
            $countsByTable['invoice_records'] = ($countsByTable['invoice_records'] ?? 0) + 1;
            $rows[] = [
                'source_table' => 'invoice_records',
                'raw_id' => (int)$r['id'],
                'reference_no' => 'INV-REC-' . $r['id'],
                'type' => 'income',
                'date' => substr((string)$r['created_at'], 0, 10),
                'category' => 'Pembayaran Client Historis',
                'party_name' => (string)(($r['client_name'] ?? '') ?: 'Client'),
                'account_or_method' => 'Transfer',
                'amount' => round((float)($r['jumlah'] ?? 0), 2),
                'status' => 'Lunas',
                'description' => (string)($r['keterangan'] ?? ''),
                'proof' => (string)(($r['file_path'] ?? '') ?: ($r['drive_link'] ?? '')),
            ];
        }
    }

    usort($rows, function (array $a, array $b): int {
        $cmp = strcmp($a['date'], $b['date']);
        if ($cmp !== 0) {
            return $cmp;
        }
        $tCmp = strcmp($a['source_table'], $b['source_table']);
        return $tCmp !== 0 ? $tCmp : ($a['raw_id'] <=> $b['raw_id']);
    });

    $incomeCount = 0;
    $incomeTotal = 0.0;
    $expenseCount = 0;
    $expenseTotal = 0.0;
    foreach ($rows as $row) {
        if ($row['type'] === 'income') {
            $incomeCount++;
            $incomeTotal += (float)$row['amount'];
        } else {
            $expenseCount++;
            $expenseTotal += (float)$row['amount'];
        }
    }

    return [
        'summary' => [
            'from' => $from,
            'to' => $to,
            'type' => $typeFilter,
            'total_rows' => count($rows),
            'income_count' => $incomeCount,
            'income_total' => round($incomeTotal, 2),
            'expense_count' => $expenseCount,
            'expense_total' => round($expenseTotal, 2),
            'net_total' => round($incomeTotal - $expenseTotal, 2),
            'counts_by_table' => $countsByTable,
        ],
        'rows' => $rows,
    ];
}

function fbe_build_restore_sql(mysqli $conn, string $from, string $to, string $typeFilter): string {
    $dbNameRow = @$conn->query("SELECT DATABASE()")->fetch_row();
    $dbName = $dbNameRow[0] ?? 'u260890310_one';

    $out = "-- ==============================================================================\n";
    $out .= "-- ONE CREATIVA - BACKUP SQL TRANSAKSI KEUANGAN (RESTORE-READY / NON-DESTRUCTIVE)\n";
    $out .= "-- Sumber Database : {$dbName}\n";
    $out .= "-- Periode         : {$from} s/d {$to} (filter tipe: {$typeFilter})\n";
    $out .= "-- Tanggal Ekspor  : " . date('Y-m-d H:i:s') . "\n";
    $out .= "-- Catatan Import  : Memakai INSERT IGNORE & menjaga ID asli agar tidak menimpa data baru\n";
    $out .= "-- ==============================================================================\n\n";
    $out .= "SET NAMES utf8mb4;\n";
    $out .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    $journalIds = [];
    $totalExported = 0;

    // 1. finance_records
    if (fbe_table_exists($conn, 'finance_records')) {
        $typeSql = $typeFilter === 'all' ? '' : " AND `type` = ?";
        $sql = "SELECT * FROM `finance_records` WHERE `transaction_date` BETWEEN ? AND ?{$typeSql} ORDER BY `id` ASC";
        $rows = $typeFilter === 'all'
            ? fbe_fetch_all($conn, $sql, 'ss', [$from, $to])
            : fbe_fetch_all($conn, $sql, 'sss', [$from, $to, $typeFilter]);
        foreach ($rows as $r) {
            if (!empty($r['journal_entry_id'])) {
                $journalIds[(int)$r['journal_entry_id']] = true;
            }
        }
        $totalExported += count($rows);
        $out .= fbe_build_insert_block($conn, 'finance_records', $rows);
    }

    // 2. accounting_transactions
    if (fbe_table_exists($conn, 'accounting_transactions')) {
        $typeSql = $typeFilter === 'all' ? '' : " AND `type` = ?";
        $sql = "SELECT * FROM `accounting_transactions` WHERE `transaction_date` BETWEEN ? AND ?{$typeSql} ORDER BY `id` ASC";
        $rows = $typeFilter === 'all'
            ? fbe_fetch_all($conn, $sql, 'ss', [$from, $to])
            : fbe_fetch_all($conn, $sql, 'sss', [$from, $to, $typeFilter]);
        foreach ($rows as $r) {
            if (!empty($r['journal_entry_id'])) {
                $journalIds[(int)$r['journal_entry_id']] = true;
            }
        }
        $totalExported += count($rows);
        $out .= fbe_build_insert_block($conn, 'accounting_transactions', $rows);
    }

    // 3. billing_invoices & billing_pembayaran
    if ($typeFilter !== 'expense' && fbe_table_exists($conn, 'billing_invoices')) {
        $biRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `billing_invoices`
             WHERE (`tanggal` BETWEEN ? AND ?)
                OR EXISTS (SELECT 1 FROM `billing_pembayaran` bp WHERE bp.noInv = `billing_invoices`.id AND bp.tglBayar BETWEEN ? AND ?)
             ORDER BY `created_at` ASC",
            'ssss',
            [$from, $to, $from, $to]
        );
        $totalExported += count($biRows);
        $out .= fbe_build_insert_block($conn, 'billing_invoices', $biRows);
    }
    if ($typeFilter !== 'expense' && fbe_table_exists($conn, 'billing_pembayaran')) {
        $bpRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `billing_pembayaran` WHERE `tglBayar` BETWEEN ? AND ? ORDER BY `id` ASC",
            'ss',
            [$from, $to]
        );
        $totalExported += count($bpRows);
        $out .= fbe_build_insert_block($conn, 'billing_pembayaran', $bpRows);
    }

    // 4. vendors + vendor_bills
    if ($typeFilter !== 'income' && fbe_table_exists($conn, 'vendor_bills')) {
        $vbCols = fbe_table_columns($conn, 'vendor_bills');
        $dateCol = in_array('bill_date', $vbCols, true) ? 'bill_date' : 'due_date';
        $vbRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `vendor_bills` WHERE `{$dateCol}` BETWEEN ? AND ? ORDER BY `id` ASC",
            'ss',
            [$from, $to]
        );
        if (!empty($vbRows) && fbe_table_exists($conn, 'vendors')) {
            $vIds = array_values(array_unique(array_filter(array_map(fn($r) => (int)($r['vendor_id'] ?? 0), $vbRows))));
            if (!empty($vIds)) {
                $idList = implode(',', $vIds);
                $vRows = fbe_fetch_all($conn, "SELECT * FROM `vendors` WHERE `id` IN ({$idList}) ORDER BY `id` ASC");
                $out .= fbe_build_insert_block($conn, 'vendors', $vRows);
            }
        }
        $totalExported += count($vbRows);
        $out .= fbe_build_insert_block($conn, 'vendor_bills', $vbRows);
    }

    // 5. salary_requests
    if ($typeFilter !== 'income' && fbe_table_exists($conn, 'salary_requests')) {
        $srRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `salary_requests`
             WHERE COALESCE(`paid_date`, `payday`, DATE(`created_at`)) BETWEEN ? AND ?
             ORDER BY `id` ASC",
            'ss',
            [$from, $to]
        );
        $totalExported += count($srRows);
        $out .= fbe_build_insert_block($conn, 'salary_requests', $srRows);
    }

    // 6. reimbursements
    if ($typeFilter !== 'income' && fbe_table_exists($conn, 'reimbursements')) {
        $rmRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `reimbursements` WHERE DATE(`created_at`) BETWEEN ? AND ? ORDER BY `id` ASC",
            'ss',
            [$from, $to]
        );
        $totalExported += count($rmRows);
        $out .= fbe_build_insert_block($conn, 'reimbursements', $rmRows);
    }

    // 7. invoice_clients + invoice_records
    if ($typeFilter !== 'expense' && fbe_table_exists($conn, 'invoice_records')) {
        $irRows = fbe_fetch_all(
            $conn,
            "SELECT * FROM `invoice_records` WHERE DATE(`created_at`) BETWEEN ? AND ? ORDER BY `id` ASC",
            'ss',
            [$from, $to]
        );
        if (!empty($irRows) && fbe_table_exists($conn, 'invoice_clients')) {
            $cIds = array_values(array_unique(array_filter(array_map(fn($r) => (int)($r['client_id'] ?? 0), $irRows))));
            if (!empty($cIds)) {
                $idList = implode(',', $cIds);
                $icRows = fbe_fetch_all($conn, "SELECT * FROM `invoice_clients` WHERE `id` IN ({$idList}) ORDER BY `id` ASC");
                $out .= fbe_build_insert_block($conn, 'invoice_clients', $icRows);
            }
        }
        $totalExported += count($irRows);
        $out .= fbe_build_insert_block($conn, 'invoice_records', $irRows);
    }

    // 8. journal_entries & journal_lines tertaut agar integritas laporan terjaga
    if (!empty($journalIds) && fbe_table_exists($conn, 'journal_entries')) {
        $jList = implode(',', array_keys($journalIds));
        $jeRows = fbe_fetch_all($conn, "SELECT * FROM `journal_entries` WHERE `id` IN ({$jList}) ORDER BY `id` ASC");
        $out .= fbe_build_insert_block($conn, 'journal_entries', $jeRows);
        if (fbe_table_exists($conn, 'journal_lines')) {
            $jlRows = fbe_fetch_all($conn, "SELECT * FROM `journal_lines` WHERE `journal_entry_id` IN ({$jList}) ORDER BY `id` ASC");
            $out .= fbe_build_insert_block($conn, 'journal_lines', $jlRows);
        }
    }

    if ($totalExported === 0) {
        $out .= "-- Tidak ditemukan baris transaksi di database '{$dbName}' untuk rentang {$from} s/d {$to}.\n\n";
    }

    $out .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    $out .= "-- ==================== TOTAL BARIS TRANSAKSI DIEKSPOR: {$totalExported} ====================\n";
    return $out;
}

function fbe_build_csv(array $rows, array $summary): string {
    $fp = fopen('php://temp', 'r+');
    fwrite($fp, "\xEF\xBB\xBF");
    fputcsv($fp, [
        'No', 'Sumber Tabel', 'ID DB', 'No Referensi', 'Jenis',
        'Tanggal', 'Kategori', 'Pihak (Siswa/Vendor/Karyawan)',
        'Rekening / Metode', 'Nominal (Rp)', 'Status', 'Keterangan', 'Bukti / Link'
    ]);
    foreach ($rows as $idx => $r) {
        fputcsv($fp, [
            $idx + 1,
            $r['source_table'],
            $r['raw_id'],
            $r['reference_no'],
            $r['type'] === 'income' ? 'Pemasukan' : 'Pengeluaran',
            $r['date'],
            $r['category'],
            $r['party_name'],
            $r['account_or_method'],
            number_format((float)$r['amount'], 2, '.', ''),
            $r['status'],
            $r['description'],
            $r['proof'],
        ]);
    }
    fputcsv($fp, []);
    fputcsv($fp, ['RINGKASAN PERIODE', $summary['from'] . ' s/d ' . $summary['to']]);
    fputcsv($fp, ['Total Pemasukan (' . $summary['income_count'] . ' trx)', '', '', '', '', '', '', '', '', number_format((float)$summary['income_total'], 2, '.', '')]);
    fputcsv($fp, ['Total Pengeluaran (' . $summary['expense_count'] . ' trx)', '', '', '', '', '', '', '', '', number_format((float)$summary['expense_total'], 2, '.', '')]);
    fputcsv($fp, ['Selisih Bersih', '', '', '', '', '', '', '', '', number_format((float)$summary['net_total'], 2, '.', '')]);
    rewind($fp);
    $csv = stream_get_contents($fp);
    fclose($fp);
    return (string)$csv;
}

$args = (PHP_SAPI === 'cli' && isset($argv)) ? fbe_parse_cli_args($argv) : [];
$from = fbe_valid_date((string)($args['from'] ?? $_GET['from'] ?? '2026-08-01'), '2026-08-01');
$to = fbe_valid_date((string)($args['to'] ?? $_GET['to'] ?? '2026-09-30'), '2026-09-30');
if ($from > $to) {
    [$from, $to] = [$to, $from];
}
$typeFilter = strtolower(trim((string)($args['type'] ?? $_GET['type'] ?? 'all')));
if (!in_array($typeFilter, ['all', 'income', 'expense'], true)) {
    $typeFilter = 'all';
}
$format = strtolower(trim((string)($args['format'] ?? $_GET['format'] ?? 'json')));
if (!in_array($format, ['sql', 'csv', 'json'], true)) {
    $format = 'json';
}
$download = (($args['download'] ?? $_GET['download'] ?? '') === '1');
$baseFilename = "backup_finance_{$from}_sd_{$to}";

if ($format === 'sql') {
    $sqlContent = fbe_build_restore_sql($conn, $from, $to, $typeFilter);
    if (PHP_SAPI !== 'cli') {
        header('Content-Type: application/sql; charset=utf-8');
        if ($download) {
            header('Content-Disposition: attachment; filename="' . $baseFilename . '.sql"');
        }
    }
    echo $sqlContent;
    exit;
}

$dataset = fbe_collect_unified_data($conn, $from, $to, $typeFilter);

if ($format === 'csv') {
    $csvContent = fbe_build_csv($dataset['rows'], $dataset['summary']);
    if (PHP_SAPI !== 'cli') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $baseFilename . '.csv"');
    }
    echo $csvContent;
    exit;
}

if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
}
echo json_encode([
    'status' => 'success',
    'summary' => $dataset['summary'],
    'data' => $dataset['rows'],
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

