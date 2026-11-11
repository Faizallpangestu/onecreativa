-- ==============================================================================
-- BACKUP LENGKAP KEUANGAN YANG DI-UPLOAD FINANCE (JUNI - OKTOBER 2026)
-- Sumber Data : Database Hostinger (u260890310_cbidb & u260890310_one)
-- Tanggal Ekspor : 2026-11-05 03:34:32
-- Target      : Fintrack.com (Universal MySQL)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABEL PEMASUKAN / INVOICE (DIPROSES & DI-UPLOAD OLEH FINANCE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fintrack_pemasukan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nomor_invoice` VARCHAR(80) NOT NULL,
  `tanggal` DATE NOT NULL,
  `nama_pelanggan_siswa` VARCHAR(150) NOT NULL,
  `kategori_program` VARCHAR(150) NOT NULL,
  `nominal_rp` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Menunggu',
  `keterangan` TEXT DEFAULT NULL,
  `file_dokumen_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 2. TABEL PENGELUARAN & OPERASIONAL (DI-UPLOAD FINANCE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fintrack_pengeluaran` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nomor_referensi` VARCHAR(80) DEFAULT NULL,
  `tanggal` DATE NOT NULL,
  `penerima_vendor` VARCHAR(150) NOT NULL,
  `kategori` VARCHAR(100) NOT NULL,
  `sumber_dana_bank` VARCHAR(100) NOT NULL DEFAULT 'Bank BCA',
  `nominal_rp` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Paid',
  `keterangan` TEXT DEFAULT NULL,
  `bukti_transfer_foto` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 3. TABEL GABUNGAN FINTRACK (TRANSACTIONS - STANDARD FORMAT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fintrack_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('income', 'expense') NOT NULL,
  `reference_no` VARCHAR(80) DEFAULT NULL,
  `date` DATE NOT NULL,
  `party_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `account_name` VARCHAR(100) NOT NULL DEFAULT 'Bank BCA',
  `amount` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- INSERT DATA PEMASUKAN (38 TRANSAKSI INVOICE & MODAL JUNI-OKTOBER)
-- ==============================================================================
INSERT INTO `fintrack_pemasukan` (`nomor_invoice`, `tanggal`, `nama_pelanggan_siswa`, `kategori_program`, `nominal_rp`, `status`, `keterangan`, `file_dokumen_url`, `created_at`) VALUES
('INV/CBI/2026/08/0001', '2026-08-31', '0001 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15, 'Menunggu', 'Biaya Program Intensif — Batch 2', '/uploads/invoices/INVOICE-INV-CBI-2026-08-0001-MUHAMMAD-FAIZAL.html', '2026-08-31 10:00:00'),
('INV/CBI/2026/08/0002', '2026-08-31', '0002 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — BAtch 2', '/uploads/invoices/INVOICE-INV-CBI-2026-08-0002-MUHAMMAD-FAIZAL.html', '2026-08-31 10:00:00'),
('INV/CBI/202609/FINAL01', '2026-09-01', 'Budi Santoso', 'Intensif', 12000000, 'Menunggu', 'Biaya Intensif Batch 3 Cianjur', '', '2026-09-01 10:00:00'),
('INV/CBI/2026/09/0002', '2026-09-16', '0002 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0002-MUHAMMAD-FAIZAL.html', '2026-09-16 10:00:00'),
('INV/CBI/2026/09/0003', '2026-09-16', '0003 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0003-MUHAMMAD-FAIZAL.html', '2026-09-16 10:00:00'),
('INV/CBI/2026/09/0004', '2026-09-16', '0004 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0004-MUHAMMAD-FAIZAL.html', '2026-09-16 10:00:00'),
('INV/CBI/2026/09/0005', '2026-09-19', '0005 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0005-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0006', '2026-09-19', '0006 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0006-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0007', '2026-09-19', '0007 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0007-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0008', '2026-09-19', '0008 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0008-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0009', '2026-09-19', '0009 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0009-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0010', '2026-09-19', '0010 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0010-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0011', '2026-09-19', '0011 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0011-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0012', '2026-09-19', '0012 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0012-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0013', '2026-09-19', '0013 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0013-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0014', '2026-09-19', '0014 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0014-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('INV/CBI/2026/09/0015', '2026-09-19', '0015 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-INV-CBI-2026-09-0015-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609016', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609016-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609017', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609017-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609018', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609018-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609019', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609019-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609020', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609020-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609021', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609021-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609022', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609022-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609022', '2026-09-19', 'Muhammad Faizal', 'Intensif', 15000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-19 10:00:00'),
('TGCJ2609024', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609024-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609024', '2026-09-19', 'Muhammad Faizal', 'Intensif', 15000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-19 10:00:00'),
('TGCJ2609026', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609026-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609026', '2026-09-19', 'Muhammad Faizal', 'Intensif', 15000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-19 10:00:00'),
('TGCJ2609028', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609028-MUHAMMAD-FAIZAL.html', '2026-09-19 10:00:00'),
('TGCJ2609028', '2026-09-19', 'Muhammad Faizal', 'Intensif', 5000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-19 10:00:00'),
('TGCJ2609030', '2026-09-21', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609030-MUHAMMAD-FAIZAL.html', '2026-09-21 10:00:00'),
('TGCJ2609030', '2026-09-21', 'Muhammad Faizal', 'Intensif', 15000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-21 10:00:00'),
('TGCJ2609032', '2026-09-21', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609032-MUHAMMAD-FAIZAL.html', '2026-09-21 10:00:00'),
('TGCJ2609032', '2026-09-21', 'Muhammad Faizal', 'Intensif', 15000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-21 10:00:00'),
('TGCJ2609034', '2026-09-21', 'Siswa LPK Creativa', 'Biaya Program Intensif', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '/uploads/invoices/INVOICE-TGCJ2609034-MUHAMMAD-FAIZAL.html', '2026-09-21 10:00:00'),
('TGCJ2609034', '2026-09-21', 'Muhammad Faizal', 'Intensif', 15000000, 'Menunggu', 'Biaya Intensif', '', '2026-09-21 10:00:00'),
('FIN-00002', '2026-10-01', 'creativa', 'Modal', 2000000.00, 'Lunas', 'hp', 'finance/finance_1790845580_2385.png', '2026-10-01 16:06:20');

-- ==============================================================================
-- INSERT DATA PENGELUARAN (2 TRANSAKSI DI-UPLOAD FINANCE)
-- ==============================================================================
INSERT INTO `fintrack_pengeluaran` (`nomor_referensi`, `tanggal`, `penerima_vendor`, `kategori`, `sumber_dana_bank`, `nominal_rp`, `status`, `keterangan`, `bukti_transfer_foto`, `created_at`) VALUES
('FIN-00003', '2026-10-01', 'yuns', 'Keperluan Kantor', 'Bank BCA', 2000000.00, 'Paid', 'Pengadaan HP Operasional Kantor', 'finance/finance_1790846217_9050.png', '2026-10-01 16:16:57'),
('PAY-202609', '2026-10-07', 'Anggi Alfin S.Kom., M.Sc.', 'Gaji Karyawan', 'Bank BCA', 10000000.00, 'Paid', 'Penggajian September 2026 (Submitted by Finance Creativa)', NULL, '2026-10-07 13:49:43');

-- ==============================================================================
-- INSERT SEMUA KE TABEL GABUNGAN FINTRACK (40 TRANSAKSI KEUANGAN)
-- ==============================================================================
INSERT INTO `fintrack_transactions` (`type`, `reference_no`, `date`, `party_name`, `category`, `account_name`, `amount`, `status`, `description`, `created_at`) VALUES
('income', 'INV/CBI/2026/08/0001', '2026-08-31', '0001 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15, 'Menunggu', 'Biaya Program Intensif — Batch 2', '2026-08-31 10:00:00'),
('income', 'INV/CBI/2026/08/0002', '2026-08-31', '0002 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — BAtch 2', '2026-08-31 10:00:00'),
('income', 'INV/CBI/202609/FINAL01', '2026-09-01', 'Budi Santoso', 'Intensif', 'Bank BCA', 12000000, 'Menunggu', 'Biaya Intensif Batch 3 Cianjur', '2026-09-01 10:00:00'),
('income', 'INV/CBI/2026/09/0002', '2026-09-16', '0002 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-16 10:00:00'),
('income', 'INV/CBI/2026/09/0003', '2026-09-16', '0003 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-16 10:00:00'),
('income', 'INV/CBI/2026/09/0004', '2026-09-16', '0004 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-16 10:00:00'),
('income', 'INV/CBI/2026/09/0005', '2026-09-19', '0005 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0006', '2026-09-19', '0006 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0007', '2026-09-19', '0007 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0008', '2026-09-19', '0008 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0009', '2026-09-19', '0009 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0010', '2026-09-19', '0010 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0011', '2026-09-19', '0011 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0012', '2026-09-19', '0012 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0013', '2026-09-19', '0013 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0014', '2026-09-19', '0014 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'INV/CBI/2026/09/0015', '2026-09-19', '0015 MUHAMMAD FAIZAL', 'Biaya Program Intensif', 'Bank BCA', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609016', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609017', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609018', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609019', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609020', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609021', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609022', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609022', '2026-09-19', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Intensif', '2026-09-19 10:00:00'),
('income', 'TGCJ2609024', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609024', '2026-09-19', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Intensif', '2026-09-19 10:00:00'),
('income', 'TGCJ2609026', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609026', '2026-09-19', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Intensif', '2026-09-19 10:00:00'),
('income', 'TGCJ2609028', '2026-09-19', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 18000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-19 10:00:00'),
('income', 'TGCJ2609028', '2026-09-19', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 5000000, 'Menunggu', 'Biaya Intensif', '2026-09-19 10:00:00'),
('income', 'TGCJ2609030', '2026-09-21', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-21 10:00:00'),
('income', 'TGCJ2609030', '2026-09-21', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Intensif', '2026-09-21 10:00:00'),
('income', 'TGCJ2609032', '2026-09-21', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-21 10:00:00'),
('income', 'TGCJ2609032', '2026-09-21', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Intensif', '2026-09-21 10:00:00'),
('income', 'TGCJ2609034', '2026-09-21', 'Siswa LPK Creativa', 'Biaya Program Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Program Intensif — Batch 3', '2026-09-21 10:00:00'),
('income', 'TGCJ2609034', '2026-09-21', 'Muhammad Faizal', 'Intensif', 'Bank BCA', 15000000, 'Menunggu', 'Biaya Intensif', '2026-09-21 10:00:00'),
('income', 'FIN-00002', '2026-10-01', 'creativa', 'Modal', 'Bank BCA', 2000000.00, 'Lunas', 'Setoran Modal Operasional Kantor', '2026-10-01 16:06:20'),
('expense', 'FIN-00003', '2026-10-01', 'yuns', 'Keperluan Kantor', 'Bank BCA', 2000000.00, 'Paid', 'Pengadaan HP Operasional Kantor', '2026-10-01 16:16:57'),
('expense', 'PAY-202609', '2026-10-07', 'Anggi Alfin S.Kom., M.Sc.', 'Gaji Karyawan', 'Bank BCA', 10000000.00, 'Paid', 'Gaji September 2026 - Otorisasi Finance Creativa', '2026-10-07 13:49:43');

SET FOREIGN_KEY_CHECKS = 1;
-- ==================== SELESAI EKSPOR BACKUP ====================
