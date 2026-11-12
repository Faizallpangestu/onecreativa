-- ==============================================================================
-- ONE CREATIVA - BACKUP SQL TRANSAKSI KEUANGAN (RESTORE-READY / NON-DESTRUCTIVE)
-- Sumber Database : one-creativa
-- Periode         : 2026-08-01 s/d 2026-09-30 (filter tipe: all)
-- Tanggal Ekspor  : 2026-11-12 11:39:58
-- Catatan Import  : Memakai INSERT IGNORE & menjaga ID asli agar tidak menimpa data baru
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Tabel `finance_records` (5 baris)
INSERT IGNORE INTO `finance_records` (`id`, `type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `account_name`, `account_number`, `budget_request_id`, `salary_request_id`, `status`, `bank_account_id`, `journal_entry_id`) VALUES
(11, 'expense', 'Operasional Kantor', 'PLN Persero', '1200000.00', 'Token Listrik Gedung LPK Periode Oktober', '2026-09-29', 1, '2026-11-08 01:19:29', NULL, NULL, 'Transfer', 'PLN Persero', 'Kas/Bank', NULL, NULL, NULL, NULL, 'Paid', NULL, NULL),
(12, 'expense', 'Reimbursement', 'Staff Admin', '500000.00', 'Reimbursement Transport Dinas & Monitoring Peserta', '2026-09-25', 1, '2026-11-08 01:19:29', NULL, NULL, 'Transfer', 'Staff Admin', 'Kas/Bank', NULL, NULL, NULL, NULL, 'Paid', NULL, NULL),
(13, 'expense', 'Gaji Karyawan', 'Karyawan LPK', '25000000.00', 'Penggajian Bulanan Sensei & Karyawan LPK', '2026-09-20', 1, '2026-11-08 01:19:29', NULL, NULL, 'Transfer', 'Karyawan LPK', 'Kas/Bank', NULL, NULL, NULL, NULL, 'Paid', NULL, NULL),
(14, 'expense', 'Operasional Kantor', 'PT Maju Internet', '850000.00', 'Langganan Internet Dedicated Fiber 100 Mbps', '2026-09-18', 1, '2026-11-08 01:19:29', NULL, NULL, 'Transfer', 'PT Maju Internet', 'Kas/Bank', NULL, NULL, NULL, NULL, 'Paid', NULL, NULL),
(15, 'expense', 'Pembelian', 'Percetakan Mitra', '3200000.00', 'Cetak Modul Pelajaran Minna no Nihongo & Kotoba N5', '2026-09-14', 1, '2026-11-08 01:19:29', NULL, NULL, 'Transfer', 'Percetakan Mitra', 'Kas Tunai', NULL, NULL, NULL, NULL, 'Paid', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
-- ==================== TOTAL BARIS TRANSAKSI DIEKSPOR: 5 ====================
