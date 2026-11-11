<?php
/**
 * ONE CREATIVA - BACKUP EKSPORTIR KEUANGAN (JUNI - OKTOBER 2026)
 * Menghasilkan file SQL siap import ke fintrack.com
 * Akses: https://one.creativabridg ing.com/export_fintrack_juni_oktober.php
 */

header('Content-Type: text/plain; charset=utf-8');

// Koneksi ke Database Hostinger / Lokal
$base_dir = __DIR__;
$config_file = file_exists($base_dir . '/config/database.php') ? $base_dir . '/config/database.php' : $base_dir . '/backend/config/database.php';

if (!file_exists($config_file)) {
    die("-- Error: File database config tidak ditemukan.");
}

require_once $config_file;

$startDate = '2026-06-01';
$endDate = '2026-10-31';

$filename = 'fintrack_backup_juni_oktober_' . date('Ymd_His') . '.sql';

// Header Attachment untuk langsung Download File SQL di Browser
if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/sql; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
}

echo "-- ==============================================================================\n";
echo "-- BACKUP DATA KEUANGAN LPK CREATIVA (PERIODE JUNI s/d OKTOBER 2026)\n";
echo "-- Database Target: fintrack.com (Universal MySQL Format)\n";
echo "-- Tanggal Generate: " . date('Y-m-d H:i:s') . "\n";
echo "-- Filter Tanggal   : " . $startDate . " s/d " . $endDate . "\n";
echo "-- ==============================================================================\n\n";

echo "SET NAMES utf8mb4;\n";
echo "SET FOREIGN_KEY_CHECKS = 0;\n\n";

// Struktur Tabel Universal Fintrack
echo "-- ------------------------------------------------------------------------------\n";
echo "-- 1. TABEL PEMASUKAN\n";
echo "-- ------------------------------------------------------------------------------\n";
echo "CREATE TABLE IF NOT EXISTS `pemasukan` (\n";
echo "  `id` INT AUTO_INCREMENT PRIMARY KEY,\n";
echo "  `no_referensi` VARCHAR(60) DEFAULT NULL,\n";
echo "  `tanggal` DATE NOT NULL,\n";
echo "  `pelanggan_siswa` VARCHAR(150) NOT NULL,\n";
echo "  `kategori` VARCHAR(100) NOT NULL,\n";
echo "  `sumber_dana` VARCHAR(100) NOT NULL,\n";
echo "  `nominal` DECIMAL(15,2) NOT NULL,\n";
echo "  `status` VARCHAR(50) NOT NULL DEFAULT 'Lunas',\n";
echo "  `deskripsi` TEXT DEFAULT NULL,\n";
echo "  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
echo ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

echo "-- ------------------------------------------------------------------------------\n";
echo "-- 2. TABEL PENGELUARAN\n";
echo "-- ------------------------------------------------------------------------------\n";
echo "CREATE TABLE IF NOT EXISTS `pengeluaran` (\n";
echo "  `id` INT AUTO_INCREMENT PRIMARY KEY,\n";
echo "  `no_referensi` VARCHAR(60) DEFAULT NULL,\n";
echo "  `tanggal` DATE NOT NULL,\n";
echo "  `vendor_penerima` VARCHAR(150) NOT NULL,\n";
echo "  `kategori` VARCHAR(100) NOT NULL,\n";
echo "  `sumber_dana` VARCHAR(100) NOT NULL,\n";
echo "  `nominal` DECIMAL(15,2) NOT NULL,\n";
echo "  `status` VARCHAR(50) NOT NULL DEFAULT 'Paid',\n";
echo "  `deskripsi` TEXT DEFAULT NULL,\n";
echo "  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
echo ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

echo "-- ------------------------------------------------------------------------------\n";
echo "-- 3. TABEL GABUNGAN FINTRACK (TRANSACTIONS)\n";
echo "-- ------------------------------------------------------------------------------\n";
echo "CREATE TABLE IF NOT EXISTS `fintrack_transactions` (\n";
echo "  `id` INT AUTO_INCREMENT PRIMARY KEY,\n";
echo "  `type` ENUM('income', 'expense') NOT NULL,\n";
echo "  `reference_no` VARCHAR(60) DEFAULT NULL,\n";
echo "  `date` DATE NOT NULL,\n";
echo "  `party_name` VARCHAR(150) NOT NULL,\n";
echo "  `category` VARCHAR(100) NOT NULL,\n";
echo "  `account_name` VARCHAR(100) NOT NULL,\n";
echo "  `amount` DECIMAL(15,2) NOT NULL,\n";
echo "  `status` VARCHAR(50) NOT NULL,\n";
echo "  `description` TEXT DEFAULT NULL,\n";
echo "  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
echo ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

// Helper escape
function esc($conn, $val) {
    if ($val === null) return 'NULL';
    return "'" . $conn->real_escape_string((string)$val) . "'";
}

$incomeInserts = [];
$expenseInserts = [];
$fintrackInserts = [];

// ------------------------------------------------------------------------------
// A. TARIK DARI finance_records (JIKA ADA RECORD HISTORIS)
// ------------------------------------------------------------------------------
$chk = $conn->query("SHOW TABLES LIKE 'finance_records'");
if ($chk && $chk->num_rows > 0) {
    $q = $conn->query("SELECT * FROM finance_records WHERE transaction_date BETWEEN '$startDate' AND '$endDate' ORDER BY transaction_date ASC");
    if ($q) {
        while ($r = $q->fetch_assoc()) {
            $isInc = ($r['type'] === 'income');
            $ref = $r['reference_no'] ?: ('FIN-' . str_pad($r['id'], 5, '0', STR_PAD_LEFT));
            $tgl = $r['transaction_date'];
            $party = $r['party_name'] ?: ($isInc ? 'Siswa / Customer' : 'Vendor');
            $kat = $r['category'] ?: ($isInc ? 'Pendapatan' : 'Operasional');
            $acc = $r['payment_method'] ?: 'Bank BCA';
            $nom = (float)$r['amount'];
            $stat = $r['status'] ?: ($isInc ? 'Lunas' : 'Paid');
            $desc = $r['description'] ?: '-';

            if ($isInc) {
                $incomeInserts[] = "({$r['id']}, " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
                $fintrackInserts[] = "('income', " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
            } else {
                $expenseInserts[] = "({$r['id']}, " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
                $fintrackInserts[] = "('expense', " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
            }
        }
    }
}

// ------------------------------------------------------------------------------
// B. TARIK DARI billing_invoices & billing_pembayaran
// ------------------------------------------------------------------------------
$chk = $conn->query("SHOW TABLES LIKE 'billing_invoices'");
if ($chk && $chk->num_rows > 0) {
    $q = $conn->query("SELECT * FROM billing_invoices WHERE (tanggal BETWEEN '$startDate' AND '$endDate') OR (DATE(created_at) BETWEEN '$startDate' AND '$endDate') ORDER BY tanggal ASC");
    if ($q) {
        while ($r = $q->fetch_assoc()) {
            $ref = $r['id'];
            $tgl = $r['tanggal'] ?: substr($r['created_at'], 0, 10);
            $party = $r['customer'] ?: 'Siswa';
            $kat = 'Biaya Kursus & Pelatihan';
            $acc = 'Bank BCA';
            $nom = (float)$r['total'];
            $stat = $r['status'] ?: 'Lunas';
            $desc = $r['keterangan'] ?: 'Invoice Siswa';

            $incomeInserts[] = "(NULL, " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
            $fintrackInserts[] = "('income', " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
        }
    }
}

// ------------------------------------------------------------------------------
// C. TARIK DARI vendor_bills (PENGELUARAN TAGIHAN VENDOR)
// ------------------------------------------------------------------------------
$chk = $conn->query("SHOW TABLES LIKE 'vendor_bills'");
if ($chk && $chk->num_rows > 0) {
    $q = $conn->query("SELECT * FROM vendor_bills WHERE (bill_date BETWEEN '$startDate' AND '$endDate') OR (due_date BETWEEN '$startDate' AND '$endDate') OR (DATE(created_at) BETWEEN '$startDate' AND '$endDate')");
    if ($q) {
        while ($r = $q->fetch_assoc()) {
            $ref = $r['bill_number'] ?: ('BILL-' . $r['id']);
            $tgl = $r['bill_date'] ?: substr($r['created_at'], 0, 10);
            $party = $r['vendor_name'] ?: 'Vendor Rekanan';
            $kat = $r['category'] ?: 'Tagihan Vendor';
            $acc = 'Bank BCA';
            $nom = (float)$r['total_amount'];
            $stat = $r['status'] ?: 'Paid';
            $desc = $r['notes'] ?: 'Pembayaran Vendor';

            $expenseInserts[] = "(NULL, " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
            $fintrackInserts[] = "('expense', " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
        }
    }
}

// ------------------------------------------------------------------------------
// D. TARIK DARI salary_requests / payroll (PENGELUARAN GAJI KARYAWAN)
// ------------------------------------------------------------------------------
$chk = $conn->query("SHOW TABLES LIKE 'salary_requests'");
if ($chk && $chk->num_rows > 0) {
    $q = $conn->query("SELECT * FROM salary_requests WHERE (DATE(created_at) BETWEEN '$startDate' AND '$endDate') OR (period_month BETWEEN '2026-06' AND '2026-10')");
    if ($q) {
        while ($r = $q->fetch_assoc()) {
            $ref = 'PAY-' . str_pad($r['id'], 5, '0', STR_PAD_LEFT);
            $tgl = substr($r['created_at'], 0, 10) ?: ($r['period_month'] . '-25');
            $party = 'Karyawan LPK (Payroll)';
            $kat = 'Beban Gaji Karyawan';
            $acc = 'Bank BCA';
            $nom = (float)$r['total_amount'];
            $stat = 'Paid';
            $desc = 'Penggajian Periode ' . ($r['period_month'] ?: '2026');

            $expenseInserts[] = "(NULL, " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
            $fintrackInserts[] = "('expense', " . esc($conn, $ref) . ", " . esc($conn, $tgl) . ", " . esc($conn, $party) . ", " . esc($conn, $kat) . ", " . esc($conn, $acc) . ", {$nom}, " . esc($conn, $stat) . ", " . esc($conn, $desc) . ")";
        }
    }
}

// OUTPUT SQL KE FILE / BROWSER
if (!empty($incomeInserts)) {
    echo "-- INSERT DATA PEMASUKAN\n";
    echo "INSERT INTO `pemasukan` (`id`, `no_referensi`, `tanggal`, `pelanggan_siswa`, `kategori`, `sumber_dana`, `nominal`, `status`, `deskripsi`) VALUES\n";
    echo implode(",\n", $incomeInserts) . ";\n\n";
} else {
    echo "-- Tidak ada data pemasukan pada periode $startDate s/d $endDate di database.\n\n";
}

if (!empty($expenseInserts)) {
    echo "-- INSERT DATA PENGELUARAN\n";
    echo "INSERT INTO `pengeluaran` (`id`, `no_referensi`, `tanggal`, `vendor_penerima`, `kategori`, `sumber_dana`, `nominal`, `status`, `deskripsi`) VALUES\n";
    echo implode(",\n", $expenseInserts) . ";\n\n";
} else {
    echo "-- Tidak ada data pengeluaran pada periode $startDate s/d $endDate di database.\n\n";
}

if (!empty($fintrackInserts)) {
    echo "-- INSERT TABEL GABUNGAN FINTRACK\n";
    echo "INSERT INTO `fintrack_transactions` (`type`, `reference_no`, `date`, `party_name`, `category`, `account_name`, `amount`, `status`, `description`) VALUES\n";
    echo implode(",\n", $fintrackInserts) . ";\n\n";
}

echo "SET FOREIGN_KEY_CHECKS = 1;\n";
echo "-- ==================== SELESAI EKSPOR KEUANGAN ====================\n";

