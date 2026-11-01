-- ============================================================================
-- CREATIVA BRIDGING INTERN - FINANCE & ACCOUNTING PRODUCTION MASTER SEED
-- Tanggal: 31 Oktober 2026
-- Database: one_creativa
-- ============================================================================

-- 1. PERIODE AKUNTANSI AKTIF (2026 - 2027)
-- Wajib terbuka agar jurnal transaksi dapat diposting tanpa error 'Periode belum dibuka'
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES
('2026-01', 'open'),
('2026-02', 'open'),
('2026-03', 'open'),
('2026-04', 'open'),
('2026-05', 'open'),
('2026-06', 'open'),
('2026-07', 'open'),
('2026-08', 'open'),
('2026-09', 'open'),
('2026-10', 'open'),
('2026-11', 'open'),
('2026-12', 'open'),
('2027-01', 'open'),
('2027-02', 'open'),
('2027-03', 'open'),
('2027-04', 'open'),
('2027-05', 'open'),
('2027-06', 'open');

-- 2. CHART OF ACCOUNTS (COA) STANDAR PSAK INDONESIA
-- Akun Induk & Akun Detail Operasional
INSERT IGNORE INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `is_detail`, `is_active`) VALUES
('1100', 'Kas / Bank (Induk)', 1, 'debit', 'cash', 0, 1),
('1200', 'Piutang Usaha', 1, 'debit', 'receivable', 1, 1),
('1300', 'Persediaan', 1, 'debit', 'inventory', 1, 1),
('1400', 'Aset Tetap', 1, 'debit', 'fixed_asset', 1, 1),
('1500', 'Uang Muka', 1, 'debit', 'prepayment', 1, 1),
('2100', 'Utang Usaha', 2, 'credit', 'payable', 1, 1),
('2200', 'Utang Gaji', 2, 'credit', 'payroll_payable', 1, 1),
('2300', 'Utang Pinjaman', 2, 'credit', 'loan', 1, 1),
('2400', 'Pendapatan Diterima di Muka', 2, 'credit', 'deferred_revenue', 1, 1),
('2500', 'Utang Reimbursement', 2, 'credit', 'reimbursement_payable', 1, 1),
('2600', 'Utang Pajak / Potongan (PPh 21 & BPJS)', 2, 'credit', 'tax_payable', 1, 1),
('3100', 'Modal Disetor', 3, 'credit', 'capital', 1, 1),
('3200', 'Laba Ditahan', 3, 'credit', 'retained_earnings', 1, 1),
('4100', 'Pendapatan Pelatihan', 4, 'credit', 'revenue', 1, 1),
('4200', 'Pendapatan Lain-lain', 4, 'credit', 'other_income', 1, 1),
('5100', 'Biaya Layanan Pendidikan', 5, 'debit', 'cost_of_services', 1, 1),
('5200', 'Beban Operasional Umum', 5, 'debit', 'operating_expense', 1, 1),
('5300', 'Beban Gaji Karyawan', 5, 'debit', 'operating_expense', 1, 1),
('5400', 'Beban Bunga / Administrasi Bank', 5, 'debit', 'other_expense', 1, 1),
('5500', 'Beban Pajak Penghasilan', 5, 'debit', 'income_tax', 1, 1);

-- Sub-Akun Kas & Bank Riil
INSERT INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `parent_id`, `is_detail`, `is_active`)
SELECT '1110', 'Petty Cash / Kas Tunai', 1, 'debit', 'cash', id, 1, 1 FROM `accounts` WHERE `code`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `is_active`=1;

INSERT INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `parent_id`, `is_detail`, `is_active`)
SELECT '1120', 'Bank BCA (1832-918-428)', 1, 'debit', 'cash', id, 1, 1 FROM `accounts` WHERE `code`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `is_active`=1;

INSERT INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `parent_id`, `is_detail`, `is_active`)
SELECT '1130', 'Bank Mandiri Cadangan', 1, 'debit', 'cash', id, 1, 1 FROM `accounts` WHERE `code`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `is_active`=1;

-- 3. REKENING KAS & BANK OPERASIONAL (cash_bank_accounts)
INSERT INTO `cash_bank_accounts` (`name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 'Rekening BCA Creativa Bridging Intern', id, 'Bank BCA', '1832-918-428', 1 FROM `accounts` WHERE `code`='1120' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT INTO `cash_bank_accounts` (`name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 'Petty Cash (Kas Kecil Tunai)', id, 'Kas Tunai Kasir', 'CASH-01', 1 FROM `accounts` WHERE `code`='1110' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT INTO `cash_bank_accounts` (`name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 'Rekening Cadangan Mandiri', id, 'Bank Mandiri', '130-0019283', 1 FROM `accounts` WHERE `code`='1130' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

-- 4. HAK AKSES ROLE KEUANGAN (finance_role_permissions)
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES
('finance', 'read', 1),
('finance', 'prepare', 1),
('finance', 'post', 1),
('finance', 'approve', 0),
('finance', 'configure', 0),
('admin', 'read', 1),
('admin', 'prepare', 0),
('admin', 'post', 0),
('admin', 'approve', 1),
('admin', 'configure', 1),
('super_admin', 'read', 1),
('super_admin', 'prepare', 0),
('super_admin', 'post', 0),
('super_admin', 'approve', 1),
('super_admin', 'configure', 1),
('director', 'read', 1),
('director', 'prepare', 0),
('director', 'post', 0),
('director', 'approve', 1),
('director', 'configure', 0),
('direktur', 'read', 1),
('direktur', 'prepare', 0),
('direktur', 'post', 0),
('direktur', 'approve', 1),
('direktur', 'configure', 0);
