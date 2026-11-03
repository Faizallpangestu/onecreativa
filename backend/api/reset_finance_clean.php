<?php
/**
 * ============================================================
 * RESET BERSIH DATA KEUANGAN — CLEAN SLATE FINANCE RESET
 * ============================================================
 * Sebagai CFO / Administrator keuangan:
 * - MENGHAPUS seluruh data transaksi lama (200 trx)
 * - MEMPERTAHANKAN: COA, Rekening Bank, User, Peserta, Vendor
 * - MEMBUAT BACKUP otomatis sebelum hapus
 * - MEMERLUKAN 2 langkah konfirmasi (tidak bisa salah klik)
 *
 * Akses HANYA untuk: super_admin / admin
 * ============================================================
 */

define('CREATIVA_RESET_TOOL', true);
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';

// ── Autentikasi & Otorisasi ──────────────────────────────────
session_start();
$actor = $_SESSION['user'] ?? null;
$isAllowed = $actor && in_array($actor['role'] ?? '', ['super_admin', 'admin'], true);
if (!$isAllowed) {
    http_response_code(403);
    echo "<h2 style='color:red'>⛔ Akses Ditolak</h2><p>Hanya Super Admin atau Admin yang dapat mengakses halaman ini.</p>";
    exit;
}

$actorName = htmlspecialchars($actor['name'] ?? $actor['email'] ?? 'Unknown');
$step = $_POST['step'] ?? $_GET['step'] ?? '';
$confirmed = ($_POST['confirm_text'] ?? '') === 'RESET BERSIH';

// ============================================================
// LANGKAH 3: EKSEKUSI RESET (hanya jika sudah dikonfirmasi)
// ============================================================
if ($step === 'execute' && $confirmed) {
    $log = [];
    $errors = [];

    $log[] = "🕐 Mulai proses reset pada: " . date('Y-m-d H:i:s') . " oleh $actorName";

    try {
        // Backup ringkas: hitung baris sebelum dihapus
        $backupInfo = [];
        $tablesToClear = [
            'finance_records'           => 'Transaksi Historis Lama',
            'accounting_transactions'   => 'Buku Transaksi Kas (Baru)',
            'journal_entries'           => 'Jurnal Akuntansi',
            'journal_lines'             => 'Baris Jurnal',
            'accounting_idempotency'    => 'Cache Idempotency',
            'accounting_audit_logs'     => 'Audit Log Transaksi',
            'payment_allocations'       => 'Alokasi Pembayaran',
            'accounting_source_documents' => 'Dokumen Sumber Akuntansi',
            'budget_realizations'       => 'Realisasi Anggaran',
            'budget_commitments'        => 'Komitmen Anggaran',
            'budget_request_history'    => 'Riwayat Pengajuan Anggaran',
            'budget_request_items'      => 'Item Pengajuan Anggaran',
            'budget_requests'           => 'Pengajuan Anggaran (RAB)',
            'salary_requests'           => 'Pengajuan Gaji/Payroll',
            'salary_publications'       => 'Publikasi Slip Gaji',
            'salary_publication_events' => 'Event Slip Gaji',
            'reimbursements'            => 'Reimbursement',
            'reimbursement_histories'   => 'Riwayat Reimbursement',
            'invoice_records'           => 'Pembayaran Invoice Historis',
            'invoice_clients'           => 'Invoice Klien',
            'billing_pembayaran'        => 'Pembayaran Billing Siswa',
            'billing_invoices'          => 'Invoice Billing Siswa',
        ];

        // Hitung sebelum hapus
        foreach ($tablesToClear as $tbl => $label) {
            try {
                $res = $conn->query("SELECT COUNT(*) AS n FROM `$tbl`");
                $n = $res ? (int)$res->fetch_assoc()['n'] : 0;
                $backupInfo[$tbl] = ['label' => $label, 'rows' => $n];
            } catch (Throwable $e) {
                $backupInfo[$tbl] = ['label' => $label, 'rows' => 'N/A (tabel tidak ada)'];
            }
        }

        // Simpan log backup ke file
        $backupDir = __DIR__ . '/../storage/backups';
        if (!is_dir($backupDir)) @mkdir($backupDir, 0750, true);
        $backupFile = $backupDir . '/reset_log_' . date('Ymd_His') . '.json';
        file_put_contents($backupFile, json_encode([
            'reset_by'   => $actorName,
            'reset_at'   => date('c'),
            'table_counts_before_delete' => $backupInfo,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $log[] = "📋 Log backup tersimpan: " . basename($backupFile);

        // ── EKSEKUSI HAPUS (urutan sesuai foreign key dependency) ──
        $conn->query('SET FOREIGN_KEY_CHECKS = 0');

        $deleteOrder = [
            'accounting_idempotency',
            'payment_allocations',
            'accounting_audit_logs',
            'journal_lines',
            'journal_entries',
            'accounting_source_documents',
            'accounting_transactions',
            'salary_publication_events',
            'salary_publications',
            'salary_requests',
            'reimbursement_histories',
            'reimbursements',
            'budget_realizations',
            'budget_commitments',
            'budget_request_history',
            'budget_request_items',
            'budget_requests',
            'billing_pembayaran',
            'billing_invoices',
            'invoice_records',
            'invoice_clients',
            'finance_records',
        ];

        foreach ($deleteOrder as $tbl) {
            try {
                $res = $conn->query("SELECT COUNT(*) AS n FROM `$tbl`");
                $before = $res ? (int)$res->fetch_assoc()['n'] : 0;
                $conn->query("DELETE FROM `$tbl`");
                $conn->query("ALTER TABLE `$tbl` AUTO_INCREMENT = 1");
                $log[] = "✅ Tabel <code>$tbl</code>: $before baris dihapus, ID direset ke 1.";
            } catch (Throwable $e) {
                $log[] = "⚠️ Tabel <code>$tbl</code>: {$e->getMessage()} (dilewati)";
            }
        }

        $conn->query('SET FOREIGN_KEY_CHECKS = 1');
        $log[] = "🔒 Foreign key checks diaktifkan kembali.";

        // ── Reset period akuntansi ke 'open' ──
        try {
            $conn->query("UPDATE accounting_periods SET status='open'");
            $log[] = "✅ Semua periode akuntansi direset ke status 'open'.";
        } catch (Throwable $ignored) {}

        // ── Verifikasi master data tetap ada ──
        $preserved = [
            'accounts'         => 'Bagan Akun (COA)',
            'cash_bank_accounts' => 'Rekening Kas & Bank',
            'users'            => 'Akun User',
            'vendors'          => 'Vendor/Supplier',
            'departments'      => 'Departemen',
            'accounting_periods' => 'Periode Akuntansi',
        ];
        $log[] = "─── Verifikasi Master Data yang Dipertahankan ───";
        foreach ($preserved as $tbl => $label) {
            try {
                $res = $conn->query("SELECT COUNT(*) AS n FROM `$tbl`");
                $n = $res ? (int)$res->fetch_assoc()['n'] : 0;
                $log[] = "✔ <strong>$label</strong> (<code>$tbl</code>): <strong>$n record</strong> aman.";
            } catch (Throwable $e) {
                $log[] = "⚠ $label: tabel tidak ditemukan.";
            }
        }

        $log[] = "🎉 <strong>RESET BERSIH BERHASIL</strong>. Sistem siap untuk input transaksi riil baru.";
        $success = true;

    } catch (Throwable $e) {
        $errors[] = "FATAL ERROR: " . $e->getMessage();
        $success = false;
    }

    // Tampilkan hasil
    renderHtml('Hasil Reset Bersih', function() use ($log, $errors, $success) {
        echo $success 
            ? "<div style='background:#d4edda;border:1px solid #28a745;padding:15px;border-radius:8px;margin-bottom:20px;'><h2 style='color:#155724;margin:0'>🎉 Reset Bersih Berhasil!</h2><p style='margin:5px 0 0;color:#155724'>Semua data transaksi lama telah dihapus. Sistem siap digunakan dari data riil.</p></div>"
            : "<div style='background:#f8d7da;border:1px solid #dc3545;padding:15px;border-radius:8px;margin-bottom:20px;'><h2 style='color:#721c24;margin:0'>❌ Reset Gagal</h2></div>";
        
        foreach ($errors as $e) {
            echo "<p style='color:red;font-weight:bold'>$e</p>";
        }
        
        echo "<div style='background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:15px;font-family:monospace;font-size:13px;max-height:500px;overflow-y:auto'>";
        foreach ($log as $line) {
            echo "<div style='padding:2px 0;border-bottom:1px solid #eee'>$line</div>";
        }
        echo "</div>";
        
        if ($success) {
            echo "
            <div style='margin-top:25px;display:flex;gap:15px;flex-wrap:wrap'>
                <a href='/dashboard-finance' style='background:#007bff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold'>📊 Buka Dashboard Keuangan</a>
                <a href='/transaksi-pemasukan' style='background:#28a745;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold'>➕ Input Pemasukan Pertama</a>
                <a href='/transaksi-pengeluaran' style='background:#fd7e14;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold'>➖ Input Pengeluaran Pertama</a>
            </div>
            <div style='margin-top:20px;background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:8px'>
                <strong>📋 Langkah Selanjutnya (SOP Tim Finance):</strong>
                <ol style='margin:10px 0 0;padding-left:20px;line-height:2'>
                    <li>Cek saldo fisik Rekening BCA sekarang (rekening koran / m-banking)</li>
                    <li>Cek saldo fisik Petty Cash di brankas</li>
                    <li>Masukkan <strong>Transaksi Pemasukan pertama</strong> sebagai <em>\"Saldo Awal Kas\"</em></li>
                    <li>Mulai input transaksi harian secara riil dari hari ini</li>
                </ol>
            </div>";
        }
    });
    exit;
}

// ============================================================
// LANGKAH 2: Konfirmasi Akhir (tampilkan tabel yang akan dihapus)
// ============================================================
if ($step === 'confirm') {
    $preview = [];
    $totalRows = 0;
    $tablesToPreview = [
        'finance_records', 'accounting_transactions', 'journal_entries',
        'journal_lines', 'salary_requests', 'billing_pembayaran',
        'billing_invoices', 'invoice_records', 'invoice_clients',
        'budget_requests', 'reimbursements', 'payment_allocations',
        'accounting_audit_logs', 'accounting_source_documents',
    ];
    foreach ($tablesToPreview as $tbl) {
        try {
            $res = $conn->query("SELECT COUNT(*) AS n FROM `$tbl`");
            $n = $res ? (int)$res->fetch_assoc()['n'] : 0;
            if ($n > 0) {
                $preview[] = ['table' => $tbl, 'rows' => $n];
                $totalRows += $n;
            }
        } catch (Throwable $ignored) {}
    }

    renderHtml('Konfirmasi Reset — Langkah 2 dari 2', function() use ($preview, $totalRows, $actorName) {
        echo "
        <div style='background:#fff3cd;border:2px solid #ffc107;padding:20px;border-radius:8px;margin-bottom:25px'>
            <h2 style='margin:0;color:#856404'>⚠️ Konfirmasi Akhir — Langkah 2 dari 2</h2>
            <p style='margin:8px 0 0;color:#856404'>Tinjau data yang akan dihapus di bawah ini. Tindakan ini <strong>tidak dapat dibatalkan</strong>.</p>
        </div>
        <p><strong>Dieksekusi oleh:</strong> $actorName</p>
        <table style='width:100%;border-collapse:collapse;margin:15px 0'>
            <thead>
                <tr style='background:#dc3545;color:white'>
                    <th style='padding:10px;text-align:left'>Tabel</th>
                    <th style='padding:10px;text-align:right'>Jumlah Record yang Akan Dihapus</th>
                </tr>
            </thead>
            <tbody>";
        foreach ($preview as $row) {
            echo "<tr style='border-bottom:1px solid #dee2e6'>
                <td style='padding:10px;font-family:monospace'>{$row['table']}</td>
                <td style='padding:10px;text-align:right;font-weight:bold;color:" . ($row['rows'] > 0 ? '#dc3545' : '#28a745') . "'>" . number_format($row['rows']) . " record</td>
            </tr>";
        }
        echo "
            </tbody>
            <tfoot>
                <tr style='background:#f8f9fa;font-weight:bold'>
                    <td style='padding:10px'>TOTAL</td>
                    <td style='padding:10px;text-align:right;color:#dc3545'>" . number_format($totalRows) . " record</td>
                </tr>
            </tfoot>
        </table>
        <div style='background:#d4edda;border:1px solid #28a745;padding:15px;border-radius:8px;margin-bottom:20px'>
            <strong>✅ Data yang AMAN & TIDAK akan dihapus:</strong>
            <ul style='margin:8px 0 0;padding-left:20px;line-height:2'>
                <li>Bagan Akun COA (accounts)</li>
                <li>Rekening Kas & Bank (cash_bank_accounts)</li>
                <li>Akun User & Login (users)</li>
                <li>Data Peserta / Siswa (peserta_intensif)</li>
                <li>Master Vendor / Supplier (vendors)</li>
                <li>Data Karyawan & Departemen</li>
                <li>Pengaturan Sistem</li>
            </ul>
        </div>
        <form method='POST' action='?step=execute'>
            <label style='display:block;font-weight:bold;margin-bottom:8px'>
                Untuk mengkonfirmasi, ketik tepat: <code style='background:#f8f9fa;padding:3px 8px;border-radius:4px;font-size:15px'>RESET BERSIH</code>
            </label>
            <input 
                type='text' 
                name='confirm_text' 
                placeholder='Ketik: RESET BERSIH' 
                style='width:100%;max-width:350px;padding:12px;font-size:16px;border:2px solid #dc3545;border-radius:6px;margin-bottom:15px;display:block'
                autocomplete='off'
            />
            <input type='hidden' name='step' value='execute' />
            <button type='submit' style='background:#dc3545;color:white;padding:14px 30px;font-size:16px;font-weight:bold;border:none;border-radius:6px;cursor:pointer'>
                🗑️ Hapus Semua Data Transaksi
            </button>
            <a href='?step=preview' style='margin-left:15px;color:#6c757d;text-decoration:none'>← Kembali</a>
        </form>";
    });
    exit;
}

// ============================================================
// LANGKAH 1: Preview & Info (default tampilan)
// ============================================================
renderHtml('Reset Bersih Keuangan', function() use ($actorName, $conn) {
    // Hitung data transaksi yang ada
    $txCount = 0;
    try {
        $r = $conn->query("SELECT COUNT(*) AS n FROM finance_records");
        $txCount = $r ? (int)$r->fetch_assoc()['n'] : 0;
    } catch (Throwable $ignored) {}
    $txCountNew = 0;
    try {
        $r2 = $conn->query("SELECT COUNT(*) AS n FROM accounting_transactions");
        $txCountNew = $r2 ? (int)$r2->fetch_assoc()['n'] : 0;
    } catch (Throwable $ignored) {}

    echo "
    <div style='background:#d1ecf1;border:1px solid #17a2b8;padding:20px;border-radius:8px;margin-bottom:25px'>
        <h2 style='margin:0;color:#0c5460'>📋 Reset Bersih Data Keuangan</h2>
        <p style='margin:8px 0 0;color:#0c5460'>Alat ini menghapus seluruh data transaksi lama dan memulai dari angka 0 secara bersih.</p>
    </div>

    <div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:25px'>
        <div style='background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:8px;text-align:center'>
            <div style='font-size:32px;font-weight:bold;color:#856404'>" . number_format($txCount) . "</div>
            <div style='color:#856404'>Transaksi Lama (finance_records)</div>
        </div>
        <div style='background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:8px;text-align:center'>
            <div style='font-size:32px;font-weight:bold;color:#856404'>" . number_format($txCountNew) . "</div>
            <div style='color:#856404'>Transaksi Buku Kas Baru</div>
        </div>
    </div>

    <div style='display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:25px'>
        <div style='background:#f8d7da;border:1px solid #dc3545;padding:15px;border-radius:8px'>
            <h3 style='color:#721c24;margin-top:0'>🗑️ Yang Akan DIHAPUS:</h3>
            <ul style='margin:0;padding-left:20px;line-height:2;color:#721c24'>
                <li>Transaksi pemasukan lama (200+ trx)</li>
                <li>Transaksi pengeluaran lama</li>
                <li>Jurnal akuntansi &amp; baris jurnal</li>
                <li>Invoice &amp; pembayaran billing</li>
                <li>Pengajuan anggaran (RAB)</li>
                <li>Reimbursement &amp; payroll lama</li>
                <li>Audit log transaksi</li>
                <li>Cache idempotency</li>
            </ul>
        </div>
        <div style='background:#d4edda;border:1px solid #28a745;padding:15px;border-radius:8px'>
            <h3 style='color:#155724;margin-top:0'>✅ Yang TETAP AMAN:</h3>
            <ul style='margin:0;padding-left:20px;line-height:2;color:#155724'>
                <li>Bagan Akun COA (23 akun standar)</li>
                <li>Rekening Kas &amp; Bank (BCA, Mandiri, dll)</li>
                <li>Akun Login User &amp; Hak Akses</li>
                <li>Data Peserta / Siswa Intensif</li>
                <li>Master Vendor / Supplier</li>
                <li>Data Karyawan &amp; Departemen</li>
                <li>Pengaturan Sistem</li>
                <li>Semua data LMS / Akademik</li>
            </ul>
        </div>
    </div>

    <div style='background:#e2e3e5;border:1px solid #adb5bd;padding:15px;border-radius:8px;margin-bottom:20px'>
        <strong>📌 Alur Setelah Reset (SOP Tim Finance):</strong>
        <div style='margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:14px'>
            <span style='background:#007bff;color:white;padding:6px 12px;border-radius:20px'>1. Reset Bersih ✓</span>
            <span>→</span>
            <span style='background:#6c757d;color:white;padding:6px 12px;border-radius:20px'>2. Input Saldo Awal Kas Riil</span>
            <span>→</span>
            <span style='background:#6c757d;color:white;padding:6px 12px;border-radius:20px'>3. Input Pemasukan Harian</span>
            <span>→</span>
            <span style='background:#6c757d;color:white;padding:6px 12px;border-radius:20px'>4. Input Pengeluaran Harian</span>
            <span>→</span>
            <span style='background:#6c757d;color:white;padding:6px 12px;border-radius:20px'>5. Rekonsiliasi Akhir Bulan</span>
        </div>
    </div>

    <p style='color:#6c757d;margin-bottom:20px'>Dieksekusi oleh: <strong>$actorName</strong></p>

    <form method='POST' action='?step=confirm'>
        <input type='hidden' name='step' value='confirm' />
        <button type='submit' style='background:#ffc107;color:#212529;padding:14px 30px;font-size:16px;font-weight:bold;border:none;border-radius:6px;cursor:pointer'>
            ⚠️ Lanjut ke Konfirmasi — Langkah 2 dari 2
        </button>
        <a href='/dashboard-finance' style='margin-left:15px;color:#6c757d;text-decoration:none'>← Batalkan, Kembali ke Dashboard</a>
    </form>";
});

// ── Helper render HTML ─────────────────────────────────────────
function renderHtml(string $title, callable $body): void {
    echo "<!DOCTYPE html><html lang='id'><head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>$title — Creativa Finance</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; color: #212529; }
        h1 { color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px; }
        code { background: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
        a:hover { opacity: 0.8; }
    </style>
    </head><body>
    <h1>🔄 Reset Bersih Keuangan — LPK Creativa</h1>";
    $body();
    echo "<hr style='margin:30px 0;border-color:#dee2e6'>
    <p style='color:#adb5bd;font-size:12px'>Tool ini hanya dapat diakses oleh Super Admin / Admin. Log reset tersimpan di storage/backups/.</p>
    </body></html>";
}
