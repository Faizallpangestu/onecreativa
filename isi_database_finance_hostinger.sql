-- ==============================================================================
-- SQL IMPORT KEUANGAN HOSTINGER (u260890310_one)
-- Menambahkan data riil transaksi pemasukan & pengeluaran yang di-input Finance
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Pastikan tabel finance_records memiliki kolom status dan party_name
CREATE TABLE IF NOT EXISTS `finance_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('income', 'expense') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `party_name` VARCHAR(255) NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `transaction_date` DATE NOT NULL,
  `created_by` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `photo_path` VARCHAR(500) DEFAULT NULL,
  `drive_link` TEXT DEFAULT NULL,
  `metode` VARCHAR(50) DEFAULT 'Transfer',
  `source` VARCHAR(255) DEFAULT NULL,
  `bank_name` VARCHAR(255) DEFAULT 'BCA (1832-918-428)',
  `account_name` VARCHAR(255) DEFAULT NULL,
  `account_number` VARCHAR(100) DEFAULT NULL,
  `budget_request_id` INT UNSIGNED DEFAULT NULL,
  `salary_request_id` INT UNSIGNED DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Lunas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Insert 8 Transaksi Pemasukan Riil (Modal & Biaya Kursus Agustus-November 2026)
INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`) VALUES
('income', 'Modal', 'Anggi Alfin', 16800000.00, 'Setoran modal operasional LPK Creativa', '2026-11-04', 1, 'Lunas', 'BCA (1832-918-428)', 'Anggi Alfin', 'Transfer'),
('income', 'Modal', 'Siti Nurhatifah', 22580500.00, 'Setoran modal operasional LPK Creativa', '2026-10-03', 1, 'Lunas', 'BCA (1832-918-428)', 'Siti Nurhatifah', 'Transfer'),
('income', 'Modal', 'Siti Nurhatifah', 25000000.00, 'Setoran modal operasional LPK Creativa', '2026-09-04', 1, 'Lunas', 'BCA (1832-918-428)', 'Siti Nurhatifah', 'Transfer'),
('income', 'Biaya Kursus', 'Nopela', 15000000.00, 'Pembayaran Biaya Kursus Intensif', '2026-08-23', 1, 'Lunas', 'BCA (1832-918-428)', 'Nopela', 'Transfer'),
('income', 'Biaya Kursus', 'Hanny', 15000000.00, 'Pembayaran Biaya Kursus Intensif', '2026-08-23', 1, 'Lunas', 'BCA (1832-918-428)', 'Hanny', 'Transfer'),
('income', 'Modal', 'Siti Nurhatifah', 21000000.00, 'Setoran modal operasional LPK Creativa', '2026-08-10', 1, 'Lunas', 'BCA (1832-918-428)', 'Siti Nurhatifah', 'Transfer'),
('income', 'Biaya Kursus', 'R M Ramsyawaly', 15000000.00, 'Kelas Intensif Offline (Full Payment)', '2026-11-03', 1, 'Lunas', 'BCA (1832-918-428)', 'R M Ramsyawaly', 'Transfer'),
('income', 'Modal', 'creativa', 2000000.00, 'Setoran modal operasional kantor', '2026-10-01', 1, 'Lunas', 'BCA (1832-918-428)', 'creativa', 'Transfer');

-- 3. Insert 8 Transaksi Pengeluaran Riil (Gaji, Inventaris, Listrik, Operasional)
INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`) VALUES
('expense', 'Keperluan Kantor', 'yuns', 2000000.00, 'Pengadaan HP Operasional Kantor', '2026-10-01', 1, 'Paid', 'BCA (1832-918-428)', 'yuns', 'Transfer'),
('expense', 'Gaji Karyawan', 'Anggi Alfin S.Kom., M.Sc.', 10000000.00, 'Penggajian September 2026', '2026-10-07', 1, 'Paid', 'BCA (1832-918-428)', 'Anggi Alfin S.Kom., M.Sc.', 'Transfer'),
('expense', 'Operasional Kantor', 'PLN Persero', 1200000.00, 'Token Listrik Gedung LPK Periode Oktober', '2026-09-29', 1, 'Paid', 'Kas/Bank', 'PLN Persero', 'Transfer'),
('expense', 'Reimbursement', 'Staff Admin', 500000.00, 'Reimbursement Transport Dinas & Monitoring Peserta', '2026-09-25', 1, 'Paid', 'Kas/Bank', 'Staff Admin', 'Transfer'),
('expense', 'Gaji Karyawan', 'Karyawan LPK', 25000000.00, 'Penggajian Bulanan Sensei & Karyawan LPK', '2026-09-20', 1, 'Paid', 'Kas/Bank', 'Karyawan LPK', 'Transfer'),
('expense', 'Operasional Kantor', 'PT Maju Internet', 850000.00, 'Langganan Internet Dedicated Fiber 100 Mbps', '2026-09-18', 1, 'Paid', 'Kas/Bank', 'PT Maju Internet', 'Transfer'),
('expense', 'Pembelian', 'Percetakan Mitra', 3200000.00, 'Cetak Modul Pelajaran Minna no Nihongo & Kotoba N5', '2026-09-14', 1, 'Paid', 'Kas Tunai', 'Percetakan Mitra', 'Transfer'),
('expense', 'Pembelian Aset', 'Toko Office Equipment', 7500000.00, 'Pengadaan Laptop Admin Operasional Kantor', '2026-10-01', 1, 'Paid', 'Kas/Bank', 'Toko Office Equipment', 'Transfer');

SET FOREIGN_KEY_CHECKS = 1;
-- ==================== SELESAI IMPORT DATA ====================

