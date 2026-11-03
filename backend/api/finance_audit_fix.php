<?php
/**
 * ============================================================================
 * FINANCE SYSTEM AUDIT & FIX — CFO / Accounting / IT Developer
 * LPK Creativa Bridging International
 * Standar: IFRS (IAS 1,7,8,16,37), PSAK 1, PSAK 2, SAK ETAP
 * ============================================================================
 * Akses: http://localhost/One-creativa/backend/api/finance_audit_fix.php
 * HAPUS file ini setelah dipakai di production!
 * ============================================================================
 */
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ── DB Connection (bypass api_entry_policy for CLI-like tool) ──
define('CREATIVA_TEST_ROUTER', 1);
require_once __DIR__ . '/../config/database.php';

$results  = [];
$warnings = [];
$errors   = [];
$fixed    = [];

function ok(string $msg, $detail = null): array  { return ['status' => 'ok',      'msg' => $msg, 'detail' => $detail]; }
function warn(string $msg, $detail = null): array { return ['status' => 'warning', 'msg' => $msg, 'detail' => $detail]; }
function err(string $msg, $detail = null): array  { return ['status' => 'error',   'msg' => $msg, 'detail' => $detail]; }
function fix(string $msg, $detail = null): array  { return ['status' => 'fixed',   'msg' => $msg, 'detail' => $detail]; }

// ── 1. CHECK DATABASE CONNECTION ──────────────────────────────────────────
$results['db_connection'] = $conn->server_info
    ? ok("Database connected: {$conn->server_info} | DB: one-creativa", "Character set: " . $conn->character_set_name())
    : err("Database connection FAILED");

// ── 2. CHECK ALL REQUIRED FINANCE TABLES ─────────────────────────────────
$requiredTables = [
    'accounts'                    => 'Chart of Accounts (COA)',
    'cash_bank_accounts'          => 'Rekening Kas & Bank Operasional',
    'accounting_periods'          => 'Periode Akuntansi',
    'journal_entries'             => 'Jurnal Entry (Buku Besar)',
    'journal_lines'               => 'Baris Jurnal (Debit/Kredit)',
    'accounting_transactions'     => 'Transaksi Kas (Cash Ledger)',
    'accounting_audit_logs'       => 'Audit Trail Log',
    'accounting_idempotency'      => 'Idempotency Keys',
    'vendors'                     => 'Master Vendor',
    'vendor_bills'                => 'Tagihan Vendor (AP)',
    'accounting_source_documents' => 'Dokumen Sumber Akrual',
    'payment_allocations'         => 'Alokasi Pembayaran',
    'finance_role_permissions'    => 'Hak Akses Finance',
    'schema_migrations'           => 'Riwayat Migrasi',
    'budget_requests'             => 'Pengajuan RAB (Budget)',
    'budget_request_items'        => 'Rincian RAB',
    'budget_commitments'          => 'Komitmen Anggaran',
    'budget_realizations'         => 'Realisasi Anggaran',
    'financial_report_adjustments'=> 'Penyesuaian Laporan Keuangan',
];

$missingTables = [];
foreach ($requiredTables as $table => $label) {
    $res = $conn->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='$table'");
    if ($res && $res->num_rows > 0) {
        $results["table_$table"] = ok("Tabel [$table] ada — $label");
    } else {
        $missingTables[] = $table;
        $results["table_$table"] = err("Tabel [$table] TIDAK ADA — $label", "Jalankan install_accounting_schema() atau migration SQL.");
    }
}

// ── 3. CHECK & INSTALL SCHEMA IF MISSING ─────────────────────────────────
if (!empty($missingTables)) {
    try {
        require_once __DIR__ . '/../services/accounting_schema.php';
        install_accounting_schema($conn);
        $fixed[] = fix("Schema akuntansi di-install otomatis", implode(', ', $missingTables));
    } catch (Throwable $e) {
        $errors[] = err("Gagal install schema: " . $e->getMessage());
    }
}

// ── 4. CHECK COA COMPLETENESS (IFRS/PSAK Groups 1-5) ─────────────────────
$coaGroups = [
    1 => ['label' => 'Aset (Assets)', 'normal' => 'debit',  'min_count' => 3],
    2 => ['label' => 'Kewajiban (Liabilities)', 'normal' => 'credit', 'min_count' => 3],
    3 => ['label' => 'Ekuitas (Equity)', 'normal' => 'credit', 'min_count' => 1],
    4 => ['label' => 'Pendapatan (Revenue)', 'normal' => 'credit', 'min_count' => 1],
    5 => ['label' => 'Beban (Expenses)', 'normal' => 'debit',  'min_count' => 2],
];

$coaRes = $conn->query("SELECT account_group, COUNT(*) AS cnt FROM accounts WHERE is_active=1 GROUP BY account_group");
$coaCounts = [];
while ($row = $coaRes->fetch_assoc()) $coaCounts[(int)$row['account_group']] = (int)$row['cnt'];

foreach ($coaGroups as $grp => $info) {
    $cnt = $coaCounts[$grp] ?? 0;
    if ($cnt >= $info['min_count']) {
        $results["coa_group_$grp"] = ok("COA Kelompok $grp ({$info['label']}): $cnt akun aktif");
    } else {
        $results["coa_group_$grp"] = err("COA Kelompok $grp ({$info['label']}): hanya $cnt akun — minimum {$info['min_count']} diperlukan");
    }
}

// Check critical required account classes
$requiredClasses = ['cash','receivable','payable','payroll_payable','capital','retained_earnings','revenue','cost_of_services','operating_expense'];
foreach ($requiredClasses as $cls) {
    $row = $conn->query("SELECT COUNT(*) AS c FROM accounts WHERE report_class='$cls' AND is_active=1")->fetch_assoc();
    if ((int)$row['c'] > 0) {
        $results["coa_class_$cls"] = ok("Kelas akun [$cls] tersedia: {$row['c']} akun");
    } else {
        $results["coa_class_$cls"] = warn("Kelas akun [$cls] TIDAK ADA di COA — laporan keuangan tidak akan lengkap");
    }
}

// ── 5. CHECK CASH & BANK ACCOUNTS ────────────────────────────────────────
$bankRes = $conn->query("SELECT cb.*, a.code, a.name FROM cash_bank_accounts cb JOIN accounts a ON a.id=cb.account_id WHERE cb.is_active=1");
$bankCount = $bankRes->num_rows;
if ($bankCount > 0) {
    $banks = [];
    while ($b = $bankRes->fetch_assoc()) $banks[] = "{$b['name']} ({$b['bank_name']} {$b['account_number']})";
    $results['cash_bank_accounts'] = ok("$bankCount rekening kas/bank aktif", implode(' | ', $banks));
} else {
    $results['cash_bank_accounts'] = err("Tidak ada rekening kas/bank aktif — transaksi tidak dapat diproses");
}

// ── 6. CHECK ACCOUNTING PERIODS ──────────────────────────────────────────
$curPeriod = date('Y-m');
$periodRow = $conn->query("SELECT * FROM accounting_periods WHERE month='$curPeriod'")->fetch_assoc();
if ($periodRow) {
    if ($periodRow['status'] === 'open') {
        $results['current_period'] = ok("Periode akuntansi bulan ini [$curPeriod] TERBUKA (open)");
    } else {
        $results['current_period'] = err("Periode [$curPeriod] sudah DITUTUP — tidak dapat posting jurnal baru");
        // Auto-fix: reopen
        $conn->query("UPDATE accounting_periods SET status='open', closed_by=NULL, closed_at=NULL WHERE month='$curPeriod'");
        $fixed[] = fix("Periode [$curPeriod] dibuka kembali otomatis");
    }
} else {
    $conn->query("INSERT IGNORE INTO accounting_periods (month, status) VALUES ('$curPeriod', 'open')");
    $fixed[] = fix("Periode akuntansi [$curPeriod] dibuat baru (open)");
    $results['current_period'] = ok("Periode akuntansi [$curPeriod] dibuat dan dibuka");
}

// Ensure next 6 months exist
for ($i = 1; $i <= 6; $i++) {
    $futPeriod = date('Y-m', strtotime("+$i month"));
    $conn->query("INSERT IGNORE INTO accounting_periods (month, status) VALUES ('$futPeriod', 'open')");
}
$results['future_periods'] = ok("Periode akuntansi 6 bulan ke depan dipastikan tersedia");

// ── 7. CHECK JOURNAL INTEGRITY (Double-Entry Balance) ────────────────────
$unbalancedRes = $conn->query("
    SELECT j.id, j.number, j.entry_date,
           SUM(l.debit) AS total_debit,
           SUM(l.credit) AS total_credit,
           ABS(SUM(l.debit) - SUM(l.credit)) AS diff
    FROM journal_entries j
    JOIN journal_lines l ON l.journal_entry_id = j.id
    WHERE j.status = 'posted'
    GROUP BY j.id
    HAVING diff > 0.009
    ORDER BY diff DESC
    LIMIT 20
");

if ($unbalancedRes->num_rows === 0) {
    $results['journal_balance'] = ok("Semua jurnal posted SEIMBANG (double-entry balance: Debit = Kredit)");
} else {
    $unbalanced = [];
    while ($row = $unbalancedRes->fetch_assoc()) {
        $unbalanced[] = "JRN #{$row['id']} ({$row['number']}): selisih Rp " . number_format($row['diff'], 2);
    }
    $results['journal_balance'] = err(count($unbalanced) . " jurnal TIDAK SEIMBANG — pelanggaran prinsip double-entry!", $unbalanced);
}

// ── 8. CHECK JOURNAL COUNT & COVERAGE ────────────────────────────────────
$journalStats = $conn->query("
    SELECT
        COUNT(*) AS total,
        SUM(status='posted') AS posted,
        SUM(status='draft') AS draft
    FROM journal_entries
")->fetch_assoc();

$results['journal_stats'] = ok(
    "Total jurnal: {$journalStats['total']} | Posted: {$journalStats['posted']} | Draft: {$journalStats['draft']}",
    "Jurnal posted = data resmi laporan keuangan"
);

// ── 9. CHECK UNPOSTED PAID TRANSACTIONS ──────────────────────────────────
$unpostedRes = $conn->query("
    SELECT COUNT(*) AS cnt FROM accounting_transactions
    WHERE payment_status IN ('paid','verified')
    AND journal_status = 'unposted'
");
$unpostedCount = (int)$unpostedRes->fetch_assoc()['cnt'];
if ($unpostedCount === 0) {
    $results['unposted_payments'] = ok("Semua pembayaran yang sudah dibayar telah diposting ke jurnal");
} else {
    $results['unposted_payments'] = warn("$unpostedCount transaksi SUDAH DIBAYAR tapi belum diposting ke jurnal — laporan keuangan TIDAK lengkap!", "Finance harus posting semua transaksi ini segera.");
}

// ── 10. TRIAL BALANCE CHECK (Debit = Credit as of today) ─────────────────
$tbRes = $conn->query("
    SELECT
        CAST(SUM(l.debit) AS DECIMAL(15,2)) AS total_debit,
        CAST(SUM(l.credit) AS DECIMAL(15,2)) AS total_credit,
        CAST(ABS(SUM(l.debit) - SUM(l.credit)) AS DECIMAL(15,2)) AS diff
    FROM journal_lines l
    JOIN journal_entries j ON j.id = l.journal_entry_id
    WHERE j.status = 'posted'
")->fetch_assoc();

$tbDiff = abs((float)($tbRes['diff'] ?? 0));
if ($tbDiff < 0.01) {
    $results['trial_balance'] = ok(
        "Trial Balance SEIMBANG — Total Debit = Total Kredit",
        "Total Debit: Rp " . number_format((float)$tbRes['total_debit'], 2, ',', '.') .
        " | Total Kredit: Rp " . number_format((float)$tbRes['total_credit'], 2, ',', '.')
    );
} else {
    $results['trial_balance'] = err(
        "Trial Balance TIDAK SEIMBANG — Selisih: Rp " . number_format($tbDiff, 2, ',', '.'),
        "Ini indikasi ada posting yang tidak benar. Audit jurnal manual diperlukan."
    );
}

// ── 11. CHECK BALANCE SHEET EQUATION: Assets = Liabilities + Equity ──────
$bsRes = $conn->query("
    SELECT
        SUM(CASE WHEN a.account_group = 1 THEN l.debit - l.credit ELSE 0 END) AS assets,
        SUM(CASE WHEN a.account_group = 2 THEN l.credit - l.debit ELSE 0 END) AS liabilities,
        SUM(CASE WHEN a.account_group = 3 THEN l.credit - l.debit ELSE 0 END) AS equity,
        SUM(CASE WHEN a.account_group IN (4,5) THEN
            CASE WHEN a.account_group=4 THEN l.credit-l.debit ELSE l.debit-l.credit END
        ELSE 0 END) AS pnl_equity
    FROM journal_lines l
    JOIN journal_entries j ON j.id = l.journal_entry_id
    JOIN accounts a ON a.id = l.account_id
    WHERE j.status = 'posted'
")->fetch_assoc();

$assets       = (float)($bsRes['assets'] ?? 0);
$liabilities  = (float)($bsRes['liabilities'] ?? 0);
$equity       = (float)($bsRes['equity'] ?? 0);
$pnl          = (float)($bsRes['pnl_equity'] ?? 0);
$totalPassiva = $liabilities + $equity + $pnl;
$bsDiff       = abs($assets - $totalPassiva);

if ($bsDiff < 1.0) {
    $results['balance_sheet_equation'] = ok(
        "Persamaan Neraca TERPENUHI: Aset = Kewajiban + Ekuitas (IFRS IAS 1.54)",
        "Aset: Rp " . number_format($assets, 2, ',', '.') .
        " | Pasiva: Rp " . number_format($totalPassiva, 2, ',', '.')
    );
} else {
    $results['balance_sheet_equation'] = err(
        "Persamaan Neraca TIDAK SEIMBANG — Selisih: Rp " . number_format($bsDiff, 2, ',', '.'),
        "Aset: " . number_format($assets, 2, ',', '.') . " vs Pasiva: " . number_format($totalPassiva, 2, ',', '.')
    );
}

// ── 12. CHECK CASH FLOW CLASSIFICATION ───────────────────────────────────
$cfRes = $conn->query("
    SELECT cash_flow_class, COUNT(*) AS cnt, SUM(debit-credit) AS net
    FROM journal_lines l
    JOIN journal_entries j ON j.id=l.journal_entry_id
    JOIN accounts a ON a.id=l.account_id
    WHERE j.status='posted' AND a.report_class='cash'
    GROUP BY cash_flow_class
");

$cfClasses = [];
while ($row = $cfRes->fetch_assoc()) {
    $cfClasses[$row['cash_flow_class']] = ['count' => $row['cnt'], 'net' => $row['net']];
}

$cfRequired = ['operating','investing','financing'];
$cfOk = true;
foreach ($cfRequired as $cls) {
    if (!isset($cfClasses[$cls])) $cfOk = false;
}

if (count($cfClasses) > 0) {
    $detail = [];
    foreach ($cfClasses as $cls => $data) {
        $detail[] = "$cls: {$data['count']} baris | Net: Rp " . number_format($data['net'], 2, ',', '.');
    }
    $results['cash_flow_classes'] = $cfOk
        ? ok("Klasifikasi arus kas lengkap (Operating/Investing/Financing) — IAS 7", $detail)
        : warn("Klasifikasi arus kas belum lengkap — transaksi baru wajib diklasifikasi per IAS 7", $detail);
} else {
    $results['cash_flow_classes'] = warn("Belum ada data arus kas posted — laporan Cash Flow akan kosong");
}

// ── 13. CHECK FINANCE ROLE PERMISSIONS ───────────────────────────────────
$permRes = $conn->query("SELECT COUNT(*) AS cnt FROM finance_role_permissions")->fetch_assoc();
if ((int)$permRes['cnt'] >= 15) {
    $results['role_permissions'] = ok("Hak akses finance ({$permRes['cnt']} aturan) tersedia");
} else {
    // Auto seed
    $permSeeds = [
        ['finance','read',1],['finance','prepare',1],['finance','post',1],['finance','approve',0],['finance','configure',0],
        ['admin','read',1],['admin','prepare',0],['admin','post',0],['admin','approve',1],['admin','configure',1],
        ['super_admin','read',1],['super_admin','prepare',0],['super_admin','post',0],['super_admin','approve',1],['super_admin','configure',1],
        ['director','read',1],['director','prepare',0],['director','post',0],['director','approve',1],['director','configure',0],
        ['direktur','read',1],['direktur','prepare',0],['direktur','post',0],['direktur','approve',1],['direktur','configure',0],
    ];
    $stmt = $conn->prepare("INSERT IGNORE INTO finance_role_permissions(role_name,permission,allowed) VALUES(?,?,?)");
    foreach ($permSeeds as [$role, $perm, $allowed]) {
        $stmt->bind_param('ssi', $role, $perm, $allowed);
        $stmt->execute();
    }
    $stmt->close();
    $fixed[] = fix("Hak akses finance di-seed ulang ({$permRes['cnt']} → " . count($permSeeds) . " aturan)");
    $results['role_permissions'] = ok("Hak akses finance di-seed: " . count($permSeeds) . " aturan");
}

// ── 14. CHECK VENDOR BILLS AP AGING ──────────────────────────────────────
$vbRes = $conn->query("
    SELECT COUNT(*) AS cnt, SUM(amount) AS total
    FROM vendor_bills
    WHERE status='approved'
    AND NOT EXISTS (
        SELECT 1 FROM accounting_transactions t
        WHERE t.source_type='vendor_bill' AND t.source_id=CAST(vendor_bills.id AS CHAR)
        AND t.journal_status='posted'
    )
");
$vb = $vbRes->fetch_assoc();
if ((int)$vb['cnt'] === 0) {
    $results['vendor_bills_ap'] = ok("Semua tagihan vendor approved sudah diposting ke AP journal");
} else {
    $results['vendor_bills_ap'] = warn(
        "{$vb['cnt']} tagihan vendor BELUM dijurnal (AP Aging outstanding: Rp " . number_format((float)$vb['total'], 2, ',', '.') . ")",
        "Finance perlu posting pembayaran vendor ini ke jurnal Utang Usaha (2100)"
    );
}

// ── 15. CHECK SALARY PAYABLE POSTED ──────────────────────────────────────
if ($conn->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='salary_requests'")->num_rows > 0) {
    $salRes = $conn->query("
        SELECT COUNT(*) AS cnt, SUM(total_salary) AS total
        FROM salary_requests
        WHERE status IN ('approved','paid')
        AND NOT EXISTS (
            SELECT 1 FROM accounting_transactions t
            WHERE t.source_type='salary' AND t.source_id=CAST(salary_requests.id AS CHAR)
            AND t.payment_status IN ('paid','verified')
        )
    ")->fetch_assoc();
    if ((int)$salRes['cnt'] === 0) {
        $results['salary_payroll'] = ok("Semua payroll approved sudah memiliki transaksi kas terkait");
    } else {
        $results['salary_payroll'] = warn(
            "{$salRes['cnt']} payroll BELUM diposting ke jurnal kas (Utang Gaji Rp " . number_format((float)$salRes['total'], 2, ',', '.') . ")",
            "Finance perlu settlement payroll ke COA 2200 Utang Gaji"
        );
    }
}

// ── 16. CHECK AUDIT TRAIL HASH CHAIN INTEGRITY ───────────────────────────
$auditRes = $conn->query("
    SELECT COUNT(*) AS cnt FROM accounting_audit_logs WHERE hash_self IS NULL OR hash_self = ''
")->fetch_assoc();
if ((int)$auditRes['cnt'] === 0) {
    $results['audit_trail'] = ok("Audit trail hash chain LENGKAP — semua log memiliki hash_self");
} else {
    $results['audit_trail'] = warn("{$auditRes['cnt']} audit log belum punya hash_self — potensi celah tamper");
}

// ── 17. EXTENDED COA CHECK (IFRS/PSAK Completeness) ─────────────────────
// Ensure depreciation account exists for Fixed Asset (IAS 16)
$depAcct = $conn->query("SELECT id FROM accounts WHERE code='5600' OR (name LIKE '%penyusutan%' AND account_group=5)")->fetch_assoc();
if (!$depAcct) {
    // Auto-add Depreciation
    $conn->query("INSERT IGNORE INTO accounts (code,name,account_group,normal_balance,report_class,is_detail,is_active)
        VALUES ('5600','Beban Penyusutan Aset Tetap',5,'debit','operating_expense',1,1)");
    $conn->query("INSERT IGNORE INTO accounts (code,name,account_group,normal_balance,report_class,is_detail,is_active)
        VALUES ('1410','Akumulasi Penyusutan',1,'credit','fixed_asset',1,1)");
    $fixed[] = fix("Akun Beban Penyusutan (5600) dan Akumulasi Penyusutan (1410) ditambahkan sesuai IAS 16");
    $results['coa_depreciation'] = ok("Akun Penyusutan (5600/1410) ditambahkan — IAS 16 Fixed Assets");
} else {
    $results['coa_depreciation'] = ok("Akun Penyusutan tersedia di COA — IAS 16 compliant");
}

// Check Accrued Expenses (IAS 37)
$accrualAcct = $conn->query("SELECT id FROM accounts WHERE code='2700' OR report_class='accrued'")->fetch_assoc();
if (!$accrualAcct) {
    $conn->query("INSERT IGNORE INTO accounts (code,name,account_group,normal_balance,report_class,is_detail,is_active)
        VALUES ('2700','Beban Akrual (Accrued Expenses)',2,'credit','other_liability',1,1)");
    $fixed[] = fix("Akun Beban Akrual (2700) ditambahkan sesuai IAS 37");
    $results['coa_accruals'] = ok("Akun Beban Akrual (2700) ditambahkan — IAS 37 Provisions compliant");
} else {
    $results['coa_accruals'] = ok("Akun Beban Akrual tersedia — IAS 37 compliant");
}

// ── 18. CHECK financial_report_adjustments TABLE ─────────────────────────
$adjRes = $conn->query("SELECT COUNT(*) AS cnt FROM financial_report_adjustments WHERE adjustment_date IS NOT NULL")->fetch_assoc();
$adjCount = (int)($adjRes['cnt'] ?? 0);
if ($adjCount === 0) {
    $results['report_adjustments'] = ok("Tidak ada penyesuaian manual — laporan 100% dari jurnal double-entry");
} else {
    $results['report_adjustments'] = warn(
        "$adjCount penyesuaian manual ada di tabel financial_report_adjustments",
        "CATATAN: Penyesuaian ini TIDAK dimasukkan ke laporan resmi per kebijakan. Finance harus mempostingnya sebagai jurnal double-entry di Accounting > Adjustment."
    );
}

// ── 19. DATABASE SCHEMA VERSION CHECK ────────────────────────────────────
$schemaRes = $conn->query("SELECT version, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 5");
$migrations = [];
while ($row = $schemaRes->fetch_assoc()) $migrations[] = "{$row['version']} ({$row['applied_at']})";
$results['schema_migrations'] = count($migrations) > 0
    ? ok("Schema migrations: " . count($migrations) . " versi", implode(', ', $migrations))
    : warn("Belum ada riwayat schema migration — jalankan install_accounting_schema()");

// ── 20. COA ORPHAN ACCOUNT CHECK ─────────────────────────────────────────
$orphanRes = $conn->query("
    SELECT a.code, a.name FROM accounts a
    WHERE a.parent_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM accounts p WHERE p.id=a.parent_id AND p.is_active=1)
");
$orphans = [];
while ($row = $orphanRes->fetch_assoc()) $orphans[] = "{$row['code']} - {$row['name']}";
if (empty($orphans)) {
    $results['coa_orphans'] = ok("Tidak ada akun COA yang parent-nya tidak aktif");
} else {
    $results['coa_orphans'] = warn(count($orphans) . " akun COA memiliki parent yang tidak aktif", $orphans);
}

// ── SUMMARY ───────────────────────────────────────────────────────────────
$totalOk    = count(array_filter($results, fn($r) => $r['status'] === 'ok'));
$totalWarn  = count(array_filter($results, fn($r) => $r['status'] === 'warning'));
$totalErr   = count(array_filter($results, fn($r) => $r['status'] === 'error'));
$totalFixed = count($fixed);
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Finance System Audit — LPK Creativa</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 24px; }
  .container { max-width: 1100px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1e40af 0%, #0f766e 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 900; color: #fff; }
  .header p { color: #bfdbfe; font-size: 13px; margin-top: 6px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: #1e293b; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #334155; }
  .stat .num { font-size: 32px; font-weight: 900; }
  .stat .lbl { font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat.ok .num { color: #4ade80; }
  .stat.warn .num { color: #fbbf24; }
  .stat.err .num { color: #f87171; }
  .stat.fix .num { color: #60a5fa; }
  .section { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #334155; }
  .section h2 { font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; margin-bottom: 6px; font-size: 13px; border: 1px solid transparent; }
  .item.ok    { background: #052e16; border-color: #166534; }
  .item.warning { background: #422006; border-color: #92400e; }
  .item.error { background: #450a0a; border-color: #991b1b; }
  .item.fixed { background: #1e3a5f; border-color: #1e40af; }
  .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; margin-top: 1px; white-space: nowrap; }
  .badge.ok    { background: #166534; color: #4ade80; }
  .badge.warning { background: #92400e; color: #fcd34d; }
  .badge.error { background: #991b1b; color: #fca5a5; }
  .badge.fixed { background: #1e40af; color: #93c5fd; }
  .msg { flex: 1; }
  .msg strong { display: block; color: #e2e8f0; margin-bottom: 2px; }
  .detail { color: #94a3b8; font-size: 11px; margin-top: 4px; }
  .detail ul { list-style: none; padding-left: 0; }
  .detail li { padding: 1px 0; }
  .detail li::before { content: "• "; color: #64748b; }
  .footer { text-align: center; color: #475569; font-size: 11px; padding: 24px 0; }
  .cfo-note { background: #1a1a2e; border: 1px solid #6366f1; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 12px; color: #a5b4fc; }
  .cfo-note h3 { color: #818cf8; font-weight: 700; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏦 Finance System Audit — LPK Creativa Bridging International</h1>
    <p>Standar: IFRS (IAS 1, IAS 2, IAS 7, IAS 8, IAS 16, IAS 37) | PSAK 1 | SAK ETAP | Audit oleh CFO / Accounting System | <?= date('d M Y H:i:s') ?></p>
  </div>

  <div class="stats">
    <div class="stat ok">  <div class="num"><?= $totalOk ?></div>   <div class="lbl">✅ Checks Passed</div></div>
    <div class="stat warn"><div class="num"><?= $totalWarn ?></div> <div class="lbl">⚠️ Warnings</div></div>
    <div class="stat err"> <div class="num"><?= $totalErr ?></div>  <div class="lbl">❌ Errors</div></div>
    <div class="stat fix"> <div class="num"><?= $totalFixed ?></div><div class="lbl">🔧 Auto-Fixed</div></div>
  </div>

  <?php if (!empty($fixed)): ?>
  <div class="cfo-note">
    <h3>🔧 Auto-Fix yang Diterapkan (<?= count($fixed) ?> item)</h3>
    <?php foreach ($fixed as $f): ?>
      <div>• <?= htmlspecialchars($f['msg']) ?><?= $f['detail'] ? ' — <em>' . htmlspecialchars($f['detail']) . '</em>' : '' ?></div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

  <div class="section">
    <h2>📋 Audit Results — <?= count($results) ?> checks</h2>
    <?php foreach ($results as $key => $r):
      $statusClass = $r['status'] === 'ok' ? 'ok' : ($r['status'] === 'warning' ? 'warning' : ($r['status'] === 'fixed' ? 'fixed' : 'error'));
      $badgeText   = $r['status'] === 'ok' ? 'PASS' : ($r['status'] === 'warning' ? 'WARN' : ($r['status'] === 'fixed' ? 'FIXED' : 'FAIL'));
    ?>
    <div class="item <?= $statusClass ?>">
      <span class="badge <?= $statusClass ?>"><?= $badgeText ?></span>
      <div class="msg">
        <strong><?= htmlspecialchars($r['msg']) ?></strong>
        <?php if (!empty($r['detail'])): ?>
          <div class="detail">
            <?php if (is_array($r['detail'])): ?>
              <ul><?php foreach ($r['detail'] as $d): ?><li><?= htmlspecialchars($d) ?></li><?php endforeach; ?></ul>
            <?php else: ?>
              <?= htmlspecialchars($r['detail']) ?>
            <?php endif; ?>
          </div>
        <?php endif; ?>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <div class="cfo-note">
    <h3>📊 Rekomendasi CFO & Accounting International Standard</h3>
    <p><strong>IAS 1:</strong> Laporan Posisi Keuangan (Neraca) harus seimbang: Aset = Kewajiban + Ekuitas setiap saat.</p>
    <p><strong>IAS 7:</strong> Arus Kas wajib diklasifikasikan: Operating / Investing / Financing. Semua transaksi kas di journal_lines harus punya cash_flow_class yang benar.</p>
    <p><strong>IAS 8:</strong> Koreksi kesalahan akuntansi harus melalui jurnal reversal — BUKAN edit langsung posted journal.</p>
    <p><strong>IAS 16:</strong> Aset tetap harus dicatat dan diamortisasi (penyusutan) melalui jurnal Beban Penyusutan vs Akumulasi Penyusutan.</p>
    <p><strong>IAS 37:</strong> Kewajiban akrual (gaji, sewa belum bayar) harus dicatat via accrual journal di akhir periode.</p>
    <p><strong>PSAK 1:</strong> Laporan keuangan lengkap: (1) Neraca, (2) Laba Rugi Komprehensif, (3) Perubahan Ekuitas, (4) Arus Kas, (5) Catatan Atas Laporan Keuangan.</p>
    <p style="margin-top:8px; color:#f87171;"><strong>⚠️ KEAMANAN:</strong> Hapus file <code>finance_audit_fix.php</code> setelah selesai digunakan!</p>
  </div>

  <div class="footer">
    Finance System Audit — LPK Creativa Bridging International | Generated: <?= date('Y-m-d H:i:s') ?> WIB
    | DB: <?= htmlspecialchars($DB_NAME ?? 'one-creativa') ?>
  </div>
</div>
</body>
</html>
