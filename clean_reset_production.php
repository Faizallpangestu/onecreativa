<?php
/**
 * ONE CREATIVA - SCRIPT PEMBERSIH DATA PRODUKSI (CLEAN SLATE ZERO START)
 * Membersihkan seluruh transaksi lama (FIN-00356, CLIENT-2, dll) di Hostinger
 * Penggunaan: Buka di browser https://one.creativabridging.com/clean_reset_production.php?key=CREATIVA_CLEAN_2026
 */

header('Content-Type: text/html; charset=utf-8');

// Verifikasi Kunci Pengaman
$secretKey = 'CREATIVA_CLEAN_2026';
$providedKey = $_GET['key'] ?? $_POST['key'] ?? '';

if ($providedKey !== $secretKey) {
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>Akses Reset Keuangan Ditolak</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h2 { color: #f43f5e; margin-top: 0; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
            code { background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 6px; font-size: 13px; }
            a { display: inline-block; margin-top: 16px; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>⛔ Kunci Keamanan Diperlukan</h2>
            <p>Untuk mengeksekusi pembersihan data transaksi lama di server produksi, sertakan parameter kunci keamanan pada URL:</p>
            <p><code>?key=CREATIVA_CLEAN_2026</code></p>
            <a href="?key=CREATIVA_CLEAN_2026">▶ Eksekusi Pembersihan Sekarang</a>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Koneksi ke Database
require_once __DIR__ . '/config/database.php';

$tablesToTruncate = [
    'finance_records'               => 'Transaksi Historis Lama (FIN-00xxx)',
    'invoice_clients'               => 'Invoice Klien Lama (CLIENT-x)',
    'invoice_records'               => 'Pembayaran Invoice Klien',
    'accounting_transactions'       => 'Buku Transaksi Kas Baru',
    'journal_entries'               => 'Jurnal Akuntansi',
    'journal_lines'                 => 'Rincian Baris Jurnal',
    'accounting_source_documents'   => 'Dokumen Sumber Akuntansi',
    'payment_allocations'           => 'Alokasi Pembayaran',
    'student_payment_submissions'   => 'Bukti Bayar Siswa',
    'student_invoice_links'         => 'Tautan Invoice Siswa',
    'billing_invoices'              => 'Invoice Tagihan Siswa',
    'billing_pembayaran'            => 'Pembayaran Billing Siswa',
    'billing_terkirim'              => 'Riwayat Pengiriman Tagihan',
    'billing_siswa'                 => 'Data Siswa Billing Dummy',
    'budget_commitments'            => 'Komitmen Anggaran',
    'budget_realizations'           => 'Realisasi Anggaran',
    'budget_request_items'          => 'Item Pengajuan Anggaran',
    'budget_request_history'        => 'Riwayat Pengajuan Anggaran',
    'budget_requests'               => 'Pengajuan Anggaran (RAB)',
    'salary_slips'                  => 'Slip Gaji Karyawan',
    'salary_slip_events'            => 'Event Slip Gaji',
    'salary_requests'               => 'Pengajuan Payroll Gaji',
    'salary_request_history'        => 'Riwayat Pengajuan Gaji',
    'payroll'                       => 'Data Payroll Lama',
    'payslips'                      => 'Data Slip Lama',
    'reimbursements'                => 'Pengajuan Reimbursement',
    'reimbursement_histories'       => 'Riwayat Reimbursement',
    'vendor_bills'                  => 'Tagihan Vendor (Bills)',
    'financial_report_adjustments'  => 'Penyesuaian Laporan Keuangan',
    'accounting_audit_logs'         => 'Audit Log Transaksi',
    'accounting_idempotency'        => 'Cache Transaksi'
];

$logs = [];
$totalRowsDeleted = 0;

$conn->query('SET FOREIGN_KEY_CHECKS = 0');

foreach ($tablesToTruncate as $tbl => $label) {
    try {
        $cntQuery = $conn->query("SELECT COUNT(*) AS n FROM `$tbl`");
        $count = $cntQuery ? (int)$cntQuery->fetch_assoc()['n'] : 0;
        
        $conn->query("TRUNCATE TABLE `$tbl`");
        $totalRowsDeleted += $count;
        $logs[] = [
            'table' => $tbl,
            'label' => $label,
            'status' => 'success',
            'deleted' => $count
        ];
    } catch (Throwable $e) {
        $logs[] = [
            'table' => $tbl,
            'label' => $label,
            'status' => 'skipped',
            'message' => $e->getMessage()
        ];
    }
}

// Buka seluruh periode akuntansi
try {
    $conn->query("UPDATE accounting_periods SET status = 'open'");
} catch (Throwable $e) {}

$conn->query('SET FOREIGN_KEY_CHECKS = 1');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Pembersihan Database Berhasil - ONE Creativa</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #090d16; color: #f8fafc; padding: 40px 20px; margin: 0; }
        .container { max-width: 720px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; }
        .icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; font-size: 24px; }
        h1 { margin: 0; font-size: 20px; color: #10b981; }
        .subtitle { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
        .alert { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
        .alert strong { color: #34d399; font-size: 14px; }
        .alert p { margin: 4px 0 0; font-size: 13px; color: #a7f3d0; line-height: 1.5; }
        .table-log { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
        .table-log th { text-align: left; padding: 10px 12px; background: #1e293b; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 1px solid #334155; }
        .table-log td { padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }
        .badge-clean { background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; }
        .badge-skip { background: rgba(148, 163, 184, 0.1); color: #94a3b8; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
        .btn-primary { background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; transition: background 0.2s; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; }
        .btn-secondary:hover { background: #334155; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">✓</div>
            <div>
                <h1>Pembersihan Database Berhasil!</h1>
                <p class="subtitle">Seluruh data transaksi lama (FIN-00356, CLIENT-2, dll.) telah dihapus total dari database.</p>
            </div>
        </div>

        <div class="alert">
            <strong>Saldo & Dashboard Keuangan Telah Menjadi Rp 0 (Mulai dari Nol)</strong>
            <p>Sebanyak <strong><?php echo number_format($totalRowsDeleted, 0, ',', '.'); ?> data transaksi lama</strong> telah dihapus. Master akun COA, Rekening Bank BCA, dan Akun Pengguna tetap terjaga aman.</p>
        </div>

        <table class="table-log">
            <thead>
                <tr>
                    <th>Tabel Database</th>
                    <th>Keterangan</th>
                    <th>Status Pembersihan</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($logs as $l): ?>
                <tr>
                    <td><code><?php echo htmlspecialchars($l['table']); ?></code></td>
                    <td><?php echo htmlspecialchars($l['label']); ?></td>
                    <td>
                        <?php if ($l['status'] === 'success'): ?>
                            <span class="badge-clean">✓ Bersih (<?php echo $l['deleted']; ?> baris dihapus)</span>
                        <?php else: ?>
                            <span class="badge-skip">Dilewati</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <div class="actions">
            <a href="/dashboard-finance" class="btn-primary">📊 Buka Dashboard Finance (Sekarang Rp 0)</a>
            <a href="/transaksi-pemasukan" class="btn-secondary">➕ Input Pemasukan Baru</a>
        </div>
    </div>
</body>
</html>
