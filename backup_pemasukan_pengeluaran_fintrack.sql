-- ==============================================================================
-- BACKUP DATA TRANSAKSI PEMASUKAN & PENGELUARAN (LPK CREATIVA -> FINTRACK.COM)
-- Tanggal Ekspor : 2026-11-04
-- Format         : Universal SQL (Kompatibel dengan MySQL / MariaDB / Fintrack)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABEL PEMASUKAN (INCOME)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pemasukan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `no_referensi` VARCHAR(60) DEFAULT NULL,
  `tanggal` DATE NOT NULL,
  `pelanggan_siswa` VARCHAR(150) NOT NULL,
  `kategori` VARCHAR(100) NOT NULL,
  `sumber_dana` VARCHAR(100) NOT NULL,
  `nominal` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Lunas',
  `deskripsi` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 2. TABEL PENGELUARAN (EXPENSE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pengeluaran` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `no_referensi` VARCHAR(60) DEFAULT NULL,
  `tanggal` DATE NOT NULL,
  `vendor_penerima` VARCHAR(150) NOT NULL,
  `kategori` VARCHAR(100) NOT NULL,
  `sumber_dana` VARCHAR(100) NOT NULL,
  `nominal` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Paid',
  `deskripsi` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 3. TABEL GABUNGAN FINTRACK (TRANSACTIONS - STANDARD FORMAT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fintrack_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('income', 'expense') NOT NULL,
  `reference_no` VARCHAR(60) DEFAULT NULL,
  `date` DATE NOT NULL,
  `party_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- INSERT DATA PEMASUKAN (INCOME)
-- ==============================================================================
INSERT INTO `pemasukan` (`id`, `no_referensi`, `tanggal`, `pelanggan_siswa`, `kategori`, `sumber_dana`, `nominal`, `status`, `deskripsi`, `created_at`) VALUES
(1, 'TGCJ26113147', '2026-11-03', 'R M Ramsyawaly', 'Biaya Kursus', 'Bank BCA', 15000000.00, 'Lunas', 'Kelas Intensif Offline (Full Payment) - Syaifaraj75@gmail.com', '2026-11-03 14:16:29'),
(2, 'TRX-INC-202610-001', '2026-10-01', 'Andi Saputra', 'Biaya Kursus', 'Bank BCA', 2500000.00, 'Lunas', 'Pembayaran Kursus Bahasa Jepang Bulan Oktober', '2026-10-01 10:24:00'),
(3, 'TRX-INC-202610-002', '2026-10-01', 'Siti Aminah', 'Pendaftaran', 'E-Wallet', 1500000.00, 'Lunas', 'Biaya pendaftaran dan seragam siswa baru', '2026-10-01 11:30:00'),
(4, 'TRX-INC-202609-003', '2026-09-25', 'Budi Santoso', 'Biaya Kursus', 'Bank BCA', 3000000.00, 'Pending', 'Cicilan 1 Kursus Intensif Reguler', '2026-09-25 09:15:00'),
(5, 'TRX-INC-202609-004', '2026-09-20', 'Rina Putri', 'Penempatan', 'Bank BCA', 10000000.00, 'Lunas', 'Pelunasan Program Tokutei Ginou Kaigo', '2026-09-20 14:00:00'),
(6, 'TRX-INC-202609-005', '2026-09-18', 'Fajar Pratama', 'Biaya Kursus', 'Bank Mandiri', 2500000.00, 'Lunas', 'Pembayaran Kelas Malam Modul N4', '2026-09-18 16:45:00'),
(7, 'TRX-INC-202609-006', '2026-09-15', 'Dewi Lestari', 'Pendaftaran', 'Bank BCA', 1500000.00, 'Pending', 'Biaya Administrasi Ujian JFT-Basic A2', '2026-09-15 13:20:00')
ON DUPLICATE KEY UPDATE `nominal`=VALUES(`nominal`), `status`=VALUES(`status`);

-- ==============================================================================
-- INSERT DATA PENGELUARAN (EXPENSE)
-- ==============================================================================
INSERT INTO `pengeluaran` (`id`, `no_referensi`, `tanggal`, `vendor_penerima`, `kategori`, `sumber_dana`, `nominal`, `status`, `deskripsi`, `created_at`) VALUES
(1, 'TRX-EXP-202610-001', '2026-10-01', 'Toko Office Equipment', 'Pembelian Aset', 'Bank BCA', 7500000.00, 'Approved', 'Pengadaan Laptop Admin Operasional Kantor', '2026-10-01 09:00:00'),
(2, 'TRX-EXP-202609-002', '2026-09-29', 'PLN Persero', 'Operasional', 'E-Wallet', 1200000.00, 'Approved', 'Token Listrik Gedung LPK Periode Oktober', '2026-09-29 11:20:00'),
(3, 'TRX-EXP-202609-003', '2026-09-25', 'Staff Admin', 'Reimbursement', 'Bank BCA', 500000.00, 'Approved', 'Reimbursement Transport Dinas & Monitoring Peserta', '2026-09-25 15:10:00'),
(4, 'TRX-EXP-202609-004', '2026-09-20', 'Karyawan LPK', 'Gaji Karyawan', 'Bank BCA', 25000000.00, 'Paid', 'Penggajian Bulanan Sensei & Karyawan LPK', '2026-09-20 08:30:00'),
(5, 'TRX-EXP-202609-005', '2026-09-18', 'PT Maju Internet', 'Operasional', 'Bank BCA', 850000.00, 'Approved', 'Langganan Internet Dedicated Fiber 100 Mbps', '2026-09-18 10:00:00'),
(6, 'TRX-EXP-202609-006', '2026-09-14', 'Percetakan Mitra', 'Pembelian', 'Kas Tunai', 3200000.00, 'Paid', 'Cetak Modul Pelajaran Minna no Nihongo & Kotoba N5', '2026-09-14 14:15:00')
ON DUPLICATE KEY UPDATE `nominal`=VALUES(`nominal`), `status`=VALUES(`status`);

-- ==============================================================================
-- INSERT GABUNGAN KE FINTRACK TRANSACTIONS (ALL-IN-ONE)
-- ==============================================================================
INSERT INTO `fintrack_transactions` (`type`, `reference_no`, `date`, `party_name`, `category`, `account_name`, `amount`, `status`, `description`) VALUES
('income',  'TGCJ26113147',       '2026-11-03', 'R M Ramsyawaly',        'Biaya Kursus',    'Bank BCA',      15000000.00, 'Lunas',    'Kelas Intensif Offline (Full Payment)'),
('income',  'TRX-INC-202610-001', '2026-10-01', 'Andi Saputra',          'Biaya Kursus',    'Bank BCA',       2500000.00, 'Lunas',    'Pembayaran Kursus Bahasa Jepang Bulan Oktober'),
('income',  'TRX-INC-202610-002', '2026-10-01', 'Siti Aminah',           'Pendaftaran',     'E-Wallet',       1500000.00, 'Lunas',    'Biaya pendaftaran dan seragam siswa baru'),
('income',  'TRX-INC-202609-003', '2026-09-25', 'Budi Santoso',          'Biaya Kursus',    'Bank BCA',       3000000.00, 'Pending',  'Cicilan 1 Kursus Intensif Reguler'),
('income',  'TRX-INC-202609-004', '2026-09-20', 'Rina Putri',            'Penempatan',      'Bank BCA',      10000000.00, 'Lunas',    'Pelunasan Program Tokutei Ginou Kaigo'),
('income',  'TRX-INC-202609-005', '2026-09-18', 'Fajar Pratama',         'Biaya Kursus',    'Bank Mandiri',   2500000.00, 'Lunas',    'Pembayaran Kelas Malam Modul N4'),
('income',  'TRX-INC-202609-006', '2026-09-15', 'Dewi Lestari',          'Pendaftaran',     'Bank BCA',       1500000.00, 'Pending',  'Biaya Administrasi Ujian JFT-Basic A2'),
('expense', 'TRX-EXP-202610-001', '2026-10-01', 'Toko Office Equipment', 'Pembelian Aset', 'Bank BCA',       7500000.00, 'Approved', 'Pengadaan Laptop Admin Operasional Kantor'),
('expense', 'TRX-EXP-202609-002', '2026-09-29', 'PLN Persero',           'Operasional',     'E-Wallet',       1200000.00, 'Approved', 'Token Listrik Gedung LPK Periode Oktober'),
('expense', 'TRX-EXP-202609-003', '2026-09-25', 'Staff Admin',           'Reimbursement',   'Bank BCA',        500000.00, 'Approved', 'Reimbursement Transport Dinas & Monitoring'),
('expense', 'TRX-EXP-202609-004', '2026-09-20', 'Karyawan LPK',          'Gaji Karyawan',   'Bank BCA',      25000000.00, 'Paid',     'Penggajian Bulanan Sensei & Karyawan LPK'),
('expense', 'TRX-EXP-202609-005', '2026-09-18', 'PT Maju Internet',      'Operasional',     'Bank BCA',        850000.00, 'Approved', 'Langganan Internet Dedicated Fiber 100 Mbps'),
('expense', 'TRX-EXP-202609-006', '2026-09-14', 'Percetakan Mitra',      'Pembelian',       'Kas Tunai',      3200000.00, 'Paid',     'Cetak Modul Pelajaran Minna no Nihongo & Kotoba N5');

SET FOREIGN_KEY_CHECKS = 1;

