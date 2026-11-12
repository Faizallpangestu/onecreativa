-- ==============================================================================
-- ONE CREATIVA - RESTORE DATA FINANCE REAL PERIODE 01 AGUSTUS - 30 SEPTEMBER 2026
-- Sumber Repo : isi_database_finance_hostinger.sql (filter strictly 2026-08-01 s/d 2026-09-30)
-- Aman Di-import Berulang: memakai WHERE NOT EXISTS agar tidak menggandakan baris yang sudah ada.
-- ==============================================================================

SET NAMES utf8mb4;

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 25000000.00, 'Setoran modal operasional LPK Creativa', '2026-09-04', 1, 'Lunas', 'BCA (1832-918-428)', 'Siti Nurhatifah', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-04' AND `amount` = 25000000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Siti Nurhatifah')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'income', 'Biaya Kursus', 'Nopela', 15000000.00, 'Pembayaran Biaya Kursus Intensif', '2026-08-23', 1, 'Lunas', 'BCA (1832-918-428)', 'Nopela', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-23' AND `amount` = 15000000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Nopela')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'income', 'Biaya Kursus', 'Hanny', 15000000.00, 'Pembayaran Biaya Kursus Intensif', '2026-08-23', 1, 'Lunas', 'BCA (1832-918-428)', 'Hanny', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-23' AND `amount` = 15000000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Hanny')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 21000000.00, 'Setoran modal operasional LPK Creativa', '2026-08-10', 1, 'Lunas', 'BCA (1832-918-428)', 'Siti Nurhatifah', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-10' AND `amount` = 21000000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Siti Nurhatifah')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'expense', 'Operasional Kantor', 'PLN Persero', 1200000.00, 'Token Listrik Gedung LPK Periode Oktober', '2026-09-29', 1, 'Paid', 'Kas/Bank', 'PLN Persero', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-29' AND `amount` = 1200000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('PLN Persero')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'expense', 'Reimbursement', 'Staff Admin', 500000.00, 'Reimbursement Transport Dinas & Monitoring Peserta', '2026-09-25', 1, 'Paid', 'Kas/Bank', 'Staff Admin', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-25' AND `amount` = 500000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Staff Admin')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'expense', 'Gaji Karyawan', 'Karyawan LPK', 25000000.00, 'Penggajian Bulanan Sensei & Karyawan LPK', '2026-09-20', 1, 'Paid', 'Kas/Bank', 'Karyawan LPK', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-20' AND `amount` = 25000000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Karyawan LPK')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'expense', 'Operasional Kantor', 'PT Maju Internet', 850000.00, 'Langganan Internet Dedicated Fiber 100 Mbps', '2026-09-18', 1, 'Paid', 'Kas/Bank', 'PT Maju Internet', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-18' AND `amount` = 850000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('PT Maju Internet')
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `status`, `bank_name`, `source`, `metode`)
SELECT 'expense', 'Pembelian', 'Percetakan Mitra', 3200000.00, 'Cetak Modul Pelajaran Minna no Nihongo & Kotoba N5', '2026-09-14', 1, 'Paid', 'Kas Tunai', 'Percetakan Mitra', 'Transfer'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-14' AND `amount` = 3200000.00 AND LOWER(COALESCE(`party_name`, `source`, '')) = LOWER('Percetakan Mitra')
);

