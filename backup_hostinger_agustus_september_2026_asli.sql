-- ==============================================================================
-- ONE CREATIVA - BACKUP & RESTORE TRANSAKSI ASLI HOSTINGER (AGUSTUS - SEPTEMBER 2026)
-- Sumber Resmi : u260890310_one.20260926065728.sql.gz (Snapshot Hostinger 2026-09-26 13:57)
-- Rentang Data : 2026-08-01 s/d 2026-09-26 (61 transaksi finance_records + 1 invoice_records)
-- Dikonversi   : 100% cocok dengan skema tabel finance_records terbaru (u260890310_one)
-- Aman Impor   : Menggunakan auto-increment baru + WHERE NOT EXISTS (tidak menimpa id 58..66)
-- ==============================================================================

SET NAMES utf8mb4;

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 102000.00, 'Token Kantor Ruko B1', '2026-08-03', 7, '2026-08-20 18:00:43', NULL, 'https://drive.google.com/file/d/178h0jyom4aEt9UF6F7OSJXa6aYNyX2NS/view?usp=drive_link', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-03' AND `amount` = 102000.00 AND COALESCE(`description`, '') = 'Token Kantor Ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Kori Suripno', 200000.00, 'Pembayaran IPL Ruko Bulan Agustus Dibayar oleh Yuni Sensei (SAMIT)', '2026-08-05', 7, '2026-08-20 18:01:48', NULL, 'https://drive.google.com/file/d/1sOpgUygPfzZp9kcjyx2xDOp7nrvDmdYP/view?usp=drive_link', 'Transfer', 'Kori Suripno', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-05' AND `amount` = 200000.00 AND COALESCE(`description`, '') = 'Pembayaran IPL Ruko Bulan Agustus Dibayar oleh Yuni Sensei (SAMIT)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 200000.00, 'Pembayaran IPL Ruko B1 Bulan Agustus', '2026-08-05', 8, '2026-08-22 09:54:13', 'finance/finance_1787367253_7328.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-05' AND `amount` = 200000.00 AND COALESCE(`description`, '') = 'Pembayaran IPL Ruko B1 Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 100000.00, 'Reimburstment untuk pembelian token kantor B1 di tanggal 3', '2026-08-05', 8, '2026-08-22 10:06:12', 'finance/finance_1787367972_1900.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-05' AND `amount` = 100000.00 AND COALESCE(`description`, '') = 'Reimburstment untuk pembelian token kantor B1 di tanggal 3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Apotek Bunda Medika', 15000.00, 'Pembelian  Tera F dan Omeprazole untuk Staff', '2026-08-07', 4, '2026-08-27 11:13:50', 'finance/finance_1787804030_3052.jpeg', NULL, 'Cash', 'Apotek Bunda Medika', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-07' AND `amount` = 15000.00 AND COALESCE(`description`, '') = 'Pembelian  Tera F dan Omeprazole untuk Staff'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Purnama Indah', 10000.00, 'Lakban Bening', '2026-08-08', 4, '2026-08-27 11:15:38', 'finance/finance_1787804138_4916.jpeg', NULL, 'Cash', 'Toko Purnama Indah', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-08' AND `amount` = 10000.00 AND COALESCE(`description`, '') = 'Lakban Bening'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'J&T', 13000.00, 'Ongkos Kirim Lanyar dan buku ke Tangerang', '2026-08-08', 4, '2026-08-27 11:17:54', 'finance/finance_1787804274_2231.jpeg', NULL, 'Cash', 'J&T', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-08' AND `amount` = 13000.00 AND COALESCE(`description`, '') = 'Ongkos Kirim Lanyar dan buku ke Tangerang'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'SAKURA MITRA INTERNATIONAL', 21800000.00, 'Refund Dp Partisi Kursi Meja', '2026-08-10', 2, '2026-08-18 15:31:16', NULL, 'https://drive.google.com/file/d/1tGyLHDBjGfh7ayvOLHH46M7UTJDqLziS/view?usp=drive_link', 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-10' AND `amount` = 21800000.00 AND COALESCE(`description`, '') = 'Refund Dp Partisi Kursi Meja'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'CREATIVA BRIDGING INTERNATIONAL', 3500000.00, 'Gaji Staff Administrasi dan Marketing Juli Dibayarkan 4 Agustus 2026', '2026-08-10', 7, '2026-08-21 10:08:06', NULL, NULL, 'Transfer', 'CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 3500000.00 AND COALESCE(`description`, '') = 'Gaji Staff Administrasi dan Marketing Juli Dibayarkan 4 Agustus 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'CREATIVA BRIDGING INTERNATIONAL', 3500000.00, 'Gaji Manager Juli Dibayarkan 4 Agustus 2026', '2026-08-10', 7, '2026-08-21 10:22:35', NULL, NULL, 'Transfer', 'CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 3500000.00 AND COALESCE(`description`, '') = 'Gaji Manager Juli Dibayarkan 4 Agustus 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'CREATIVA BRIDGING INTERNATIONAL', 3468838.00, 'Gaji General Affair Juli Dibayarkan 4 Agustus 2026', '2026-08-10', 7, '2026-08-21 10:23:31', NULL, NULL, 'Transfer', 'CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 3468838.00 AND COALESCE(`description`, '') = 'Gaji General Affair Juli Dibayarkan 4 Agustus 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 745500.00, 'Pembayaran BPJS Ketenagakerjaan dan Kesehetan Bulan Agustus', '2026-08-10', 7, '2026-08-24 15:35:51', 'finance/finance_1787560551_4471.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-10' AND `amount` = 745500.00 AND COALESCE(`description`, '') = 'Pembayaran BPJS Ketenagakerjaan dan Kesehetan Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Ketenagakerjaan', 413859.00, 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan Agustus', '2026-08-10', 7, '2026-08-24 15:45:20', 'finance/finance_1787561120_2887.jpeg', NULL, 'Transfer', 'BPJS Ketenagakerjaan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 413859.00 AND COALESCE(`description`, '') = 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPSJ Kesehatan', 334120.00, 'Pembayaran BPJS Kesehatan CREATIVA Bulan Agustus', '2026-08-10', 7, '2026-08-24 15:46:51', 'finance/finance_1787561211_9748.jpeg', NULL, 'Transfer', 'BPSJ Kesehatan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 334120.00 AND COALESCE(`description`, '') = 'Pembayaran BPJS Kesehatan CREATIVA Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 1000000.00, 'Dana untuk lomba 17 Agustus', '2026-08-12', 4, '2026-08-24 13:33:16', 'finance/finance_1787553196_1417.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-12' AND `amount` = 1000000.00 AND COALESCE(`description`, '') = 'Dana untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko AA', 173500.00, 'Bahan Kebutuhan Lomba 17 Agustus seperti pita, kertas kado, slinger bendera, dll', '2026-08-12', 7, '2026-08-24 14:12:26', 'finance/finance_1787555572_4941.jpeg', NULL, 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 173500.00 AND COALESCE(`description`, '') = 'Bahan Kebutuhan Lomba 17 Agustus seperti pita, kertas kado, slinger bendera, dll'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko AA', 1000.00, 'Parkir Toko AA ke 1', '2026-08-12', 7, '2026-08-24 14:13:33', NULL, NULL, 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 1000.00 AND COALESCE(`description`, '') = 'Parkir Toko AA ke 1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Niceso', 167000.00, 'Pembelian bahan hadiah untuk Juara 1,2,3', '2026-08-12', 7, '2026-08-24 14:15:05', 'finance/finance_1787555705_8858.jpeg', NULL, 'Cash', 'Niceso', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 167000.00 AND COALESCE(`description`, '') = 'Pembelian bahan hadiah untuk Juara 1,2,3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Niceso', 2000.00, 'Parkir Niceso ke 2', '2026-08-12', 7, '2026-08-24 14:15:56', NULL, NULL, 'Cash', 'Niceso', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 2000.00 AND COALESCE(`description`, '') = 'Parkir Niceso ke 2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'PD Sumber Mekar', 28000.00, 'Pembelian Karung untuk lomba 17 Agustus', '2026-08-12', 7, '2026-08-24 14:19:23', 'finance/finance_1787555963_6041.jpeg', NULL, 'Transfer', 'PD Sumber Mekar', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 28000.00 AND COALESCE(`description`, '') = 'Pembelian Karung untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'TB Faqih Jaya', 16000.00, 'Pembelian Kuas dan Serat glasswool', '2026-08-13', 4, '2026-08-27 11:21:59', 'finance/finance_1787804519_9473.jpeg', NULL, 'Cash', 'TB Faqih Jaya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-13' AND `amount` = 16000.00 AND COALESCE(`description`, '') = 'Pembelian Kuas dan Serat glasswool'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Tambahan dana untuk 17 Agustus', '2026-08-14', 4, '2026-08-24 13:35:27', 'finance/finance_1787553327_6599.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-14' AND `amount` = 200000.00 AND COALESCE(`description`, '') = 'Tambahan dana untuk 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 50000.00, 'Pembelian Terigu, Bola, Tali Rapia', '2026-08-14', 7, '2026-08-24 14:29:41', 'finance/finance_1787556581_6446.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 50000.00 AND COALESCE(`description`, '') = 'Pembelian Terigu, Bola, Tali Rapia'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 45000.00, 'Baskom untuk perlombaan 17 Agustus', '2026-08-14', 7, '2026-08-24 14:31:29', 'finance/finance_1787556689_2435.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 45000.00 AND COALESCE(`description`, '') = 'Baskom untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 25000.00, 'Coklat koin untuk perlombaan 17 Agustus', '2026-08-14', 7, '2026-08-24 14:32:53', 'finance/finance_1787556773_3703.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 25000.00 AND COALESCE(`description`, '') = 'Coklat koin untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indomarett', 32700.00, 'Piring Kertas untuk lomba 17 Agustus', '2026-08-14', 7, '2026-08-24 14:54:59', 'finance/finance_1787558099_2137.jpeg', NULL, 'Cash', 'Indomarett', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 32700.00 AND COALESCE(`description`, '') = 'Piring Kertas untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 24000.00, 'Kardus bekas dan bendera 1 pak', '2026-08-14', 7, '2026-08-24 14:56:25', 'finance/finance_1787558185_4600.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 24000.00 AND COALESCE(`description`, '') = 'Kardus bekas dan bendera 1 pak'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko Sembako', 522000.00, 'Makanan ringan dan lain lain untuk hadiah perlombaan\nCatatan: 163000 + 359000 = 522000', '2026-08-14', 7, '2026-08-24 14:58:42', 'finance/finance_1787558322_1517.jpeg', NULL, 'Cash', 'Toko Sembako', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 522000.00 AND COALESCE(`description`, '') = 'Makanan ringan dan lain lain untuk hadiah perlombaan\nCatatan: 163000 + 359000 = 522000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Samudra', 45000.00, 'Bola Warna Warni untuk perlombaan 17 Agustus', '2026-08-14', 7, '2026-08-24 15:10:08', 'finance/finance_1787559008_1854.jpeg', NULL, 'Cash', 'Samudra', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 45000.00 AND COALESCE(`description`, '') = 'Bola Warna Warni untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Samudra', 2000.00, 'Parkir toko samudra ke 3', '2026-08-14', 7, '2026-08-24 15:10:52', NULL, NULL, 'Cash', 'Samudra', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 2000.00 AND COALESCE(`description`, '') = 'Parkir toko samudra ke 3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko AA', 20000.00, 'Tambahan Kertas Kado x4, kapur dan parkir\nCatatan: kertas kado x4 8000\r\nkapur 10000\r\nparkir 2000', '2026-08-14', 7, '2026-08-24 15:17:50', NULL, NULL, 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 20000.00 AND COALESCE(`description`, '') = 'Tambahan Kertas Kado x4, kapur dan parkir\nCatatan: kertas kado x4 8000\r\nkapur 10000\r\nparkir 2000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'D.I.Y', 45000.00, 'Tambahan Slinger Bendera x 3\nCatatan: satuan 15000', '2026-08-15', 7, '2026-08-24 15:19:44', NULL, NULL, 'Cash', 'D.I.Y', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-15' AND `amount` = 45000.00 AND COALESCE(`description`, '') = 'Tambahan Slinger Bendera x 3\nCatatan: satuan 15000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Warung Madura', 17000.00, 'Kerupuk  x3 dan es batu untuk lomba 17 Agustus', '2026-08-15', 7, '2026-08-24 15:22:42', NULL, NULL, 'Cash', 'Warung Madura', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-15' AND `amount` = 17000.00 AND COALESCE(`description`, '') = 'Kerupuk  x3 dan es batu untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Warung Madura', 37000.00, 'Aqua gelas 2 dus untuk perlombaan 17 Agustus', '2026-08-16', 4, '2026-08-27 11:24:54', 'finance/finance_1787804694_8733.jpeg', NULL, 'Transfer', 'Warung Madura', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-16' AND `amount` = 37000.00 AND COALESCE(`description`, '') = 'Aqua gelas 2 dus untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 22990.00, 'Kuota Zoom Bulan Agustus', '2026-08-23', 4, '2026-08-27 11:27:09', 'finance/finance_1787804985_6523.jpeg', NULL, 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-23' AND `amount` = 22990.00 AND COALESCE(`description`, '') = 'Kuota Zoom Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 240000.00, 'Dana untuk pergantian MCB 6A ke 10A Ruko B2', '2026-08-24', 4, '2026-08-26 09:46:14', 'finance/finance_1787712374_2026.png', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-24' AND `amount` = 240000.00 AND COALESCE(`description`, '') = 'Dana untuk pergantian MCB 6A ke 10A Ruko B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'TB. Hanjaya', 90000.00, 'Pembelian MCB Schneider 10A', '2026-08-24', 4, '2026-08-26 09:51:36', 'finance/finance_1787712696_2403.jpeg', NULL, 'Cash', 'TB. Hanjaya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-24' AND `amount` = 90000.00 AND COALESCE(`description`, '') = 'Pembelian MCB Schneider 10A'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'Ayi Bydiel', 100000.00, 'Jasa Teknisi Penggantian MCB Ruko B2', '2026-08-25', 4, '2026-08-26 09:53:02', 'finance/finance_1787712778_3176.jpeg', NULL, 'Cash', 'Ayi Bydiel', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-25' AND `amount` = 100000.00 AND COALESCE(`description`, '') = 'Jasa Teknisi Penggantian MCB Ruko B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 11500.00, 'Pembelian Materai 10.000', '2026-08-26', 4, '2026-08-27 11:31:57', 'finance/finance_1787805117_3478.jpeg', NULL, 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-26' AND `amount` = 11500.00 AND COALESCE(`description`, '') = 'Pembelian Materai 10.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'SAKURA MITRA INTERNATIONAL', 50000.00, 'Refund kelebihan dana penggantian MCB Ruko B2', '2026-08-26', 4, '2026-08-27 16:38:48', 'finance/finance_1787823528_3274.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-26' AND `amount` = 50000.00 AND COALESCE(`description`, '') = 'Refund kelebihan dana penggantian MCB Ruko B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 383500.00, 'Modal Saham\nCatatan: Dikurangi Sebagian Kebutuhan Pribadi Bu Tiffa', '2026-08-27', 4, '2026-08-27 09:43:26', 'finance/finance_1787798606_9451.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-27' AND `amount` = 383500.00 AND COALESCE(`description`, '') = 'Modal Saham\nCatatan: Dikurangi Sebagian Kebutuhan Pribadi Bu Tiffa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Kp. Panembong', 150000.00, 'Partisipasi Acara Maulid Nabi', '2026-08-27', 4, '2026-08-27 09:45:35', 'finance/finance_1787798735_7839.jpeg', NULL, 'Transfer', 'Kp. Panembong', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-27' AND `amount` = 150000.00 AND COALESCE(`description`, '') = 'Partisipasi Acara Maulid Nabi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'SAKURA MITRA INTERNATIONAL', 103000.00, 'Pengisian Token B1', '2026-08-27', 2, '2026-08-28 10:07:15', 'finance/finance_1787886435_9182.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-27' AND `amount` = 103000.00 AND COALESCE(`description`, '') = 'Pengisian Token B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 115000.00, 'Dana untuk Pembelian Materai x 10', '2026-08-28', 2, '2026-08-28 17:26:40', 'finance/finance_1787912800_6487.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-28' AND `amount` = 115000.00 AND COALESCE(`description`, '') = 'Dana untuk Pembelian Materai x 10'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 115000.00, 'Pembelian Materai x 10', '2026-08-28', 2, '2026-08-28 17:28:04', 'finance/finance_1787912954_9844.jpeg', NULL, 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-28' AND `amount` = 115000.00 AND COALESCE(`description`, '') = 'Pembelian Materai x 10'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'J&T', 13000.00, 'Pembelian map untuk dokumen matching job Fitri', '2026-08-29', 7, '2026-09-02 13:48:49', NULL, NULL, 'Cash', 'J&T', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-29' AND `amount` = 13000.00 AND COALESCE(`description`, '') = 'Pembelian map untuk dokumen matching job Fitri'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'SAKURA MITRA INTERNATIONAL', 503000.00, 'Pengisian Token Kantor dan Kelas B1', '2026-09-01', NULL, '2026-09-02 09:26:28', 'finance/finance_1788315988_1777.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-01' AND `amount` = 503000.00 AND COALESCE(`description`, '') = 'Pengisian Token Kantor dan Kelas B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 503000.00, 'Pengisian Token Kantor dan Kelas B1', '2026-09-01', 7, '2026-09-02 09:29:03', 'finance/finance_1788316143_3655.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-01' AND `amount` = 503000.00 AND COALESCE(`description`, '') = 'Pengisian Token Kantor dan Kelas B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 50000.00, 'Pembelian Aqua untuk tamu', '2026-09-01', 7, '2026-09-02 09:31:37', 'finance/finance_1788316297_3515.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-01' AND `amount` = 50000.00 AND COALESCE(`description`, '') = 'Pembelian Aqua untuk tamu'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Indomart', 24500.00, 'Pembelian Air minum untuk tamu', '2026-09-01', 7, '2026-09-02 09:33:50', 'finance/finance_1788316430_4482.jpeg', NULL, 'Transfer', 'Indomart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-01' AND `amount` = 24500.00 AND COALESCE(`description`, '') = 'Pembelian Air minum untuk tamu'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 222000.00, 'Dana pembayaran Wi-Fi Ruko B1 bulan September', '2026-09-07', 2, '2026-09-09 11:12:36', 'finance/finance_1788927156_1906.png', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-07' AND `amount` = 222000.00 AND COALESCE(`description`, '') = 'Dana pembayaran Wi-Fi Ruko B1 bulan September'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'LPK SAKURA MITRA INTERNASIONAL', 222000.00, 'Pembayaran Wi-Fi Ruko B1 Bulan September 2026', '2026-09-07', 2, '2026-09-09 11:14:25', 'finance/finance_1788927265_2834.png', NULL, 'Transfer', 'LPK SAKURA MITRA INTERNASIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-07' AND `amount` = 222000.00 AND COALESCE(`description`, '') = 'Pembayaran Wi-Fi Ruko B1 Bulan September 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah - CREATIVA BRIDGING INTERNATIONAL', 792000.00, 'Dana untuk BPJS dan Keperluan kantor', '2026-09-09', 2, '2026-09-09 13:58:13', 'finance/finance_1788937093_4983.png', NULL, 'Transfer', 'Siti Nurhatifah - CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-09' AND `amount` = 792000.00 AND COALESCE(`description`, '') = 'Dana untuk BPJS dan Keperluan kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Ketenagakerjaan', 413859.00, 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan September', '2026-09-09', 4, '2026-09-12 11:47:11', 'finance/finance_1789188431_6900.jpeg', NULL, 'Transfer', 'BPJS Ketenagakerjaan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 413859.00 AND COALESCE(`description`, '') = 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan September'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Kesehatan', 334120.00, 'Pembayaran BPJS Kesehatan CREATIVA Bulan September', '2026-09-09', 4, '2026-09-12 11:48:31', 'finance/finance_1789188511_5419.jpeg', NULL, 'Transfer', 'BPJS Kesehatan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 334120.00 AND COALESCE(`description`, '') = 'Pembayaran BPJS Kesehatan CREATIVA Bulan September'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 25220.00, 'Pembelian Blue Clean isi 20pcs', '2026-09-09', 4, '2026-09-12 11:55:21', 'finance/finance_1789188921_1884.jpeg', NULL, 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 25220.00 AND COALESCE(`description`, '') = 'Pembelian Blue Clean isi 20pcs'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'alfamart', 16900.00, 'Batrei ABC AA isi 4', '2026-09-09', 4, '2026-09-12 11:56:24', 'finance/finance_1789188984_9713.jpeg', NULL, 'Transfer', 'alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 16900.00 AND COALESCE(`description`, '') = 'Batrei ABC AA isi 4'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 16500.00, 'Pembelian Tisue Wajah', '2026-09-11', 4, '2026-09-12 12:02:30', 'finance/finance_1789189350_4740.jpeg', NULL, 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-11' AND `amount` = 16500.00 AND COALESCE(`description`, '') = 'Pembelian Tisue Wajah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah - Creativa Bridging International', 3500000.00, 'DP untuk Media Promosi Namedia', '2026-09-12', 4, '2026-09-12 14:36:12', 'finance/finance_1789198572_4182.jpeg', NULL, 'Transfer', 'Siti Nurhatifah - Creativa Bridging International', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-12' AND `amount` = 3500000.00 AND COALESCE(`description`, '') = 'DP untuk Media Promosi Namedia'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Firdhan - Namedia', 3500000.00, 'DP pembayaran media promosi Namedia', '2026-09-12', 4, '2026-09-12 14:39:14', 'finance/finance_1789198754_3513.jpeg', NULL, 'Transfer', 'Firdhan - Namedia', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-12' AND `amount` = 3500000.00 AND COALESCE(`description`, '') = 'DP pembayaran media promosi Namedia'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 4121500.00, 'Keperluan Kantor Creativa September 2026', '2026-09-23', 7, '2026-09-24 11:55:27', 'finance/finance_1790225727_9652.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-23' AND `amount` = 4121500.00 AND COALESCE(`description`, '') = 'Keperluan Kantor Creativa September 2026'
);

-- Lampiran Pembayaran Invoice Client (Agustus 2026)
INSERT IGNORE INTO `invoice_clients` (`id`, `name`, `phone`, `email`, `program_type`, `total_biaya`, `keterangan`, `created_by`, `created_at`) VALUES (2, 'Farah Fauziah', '+62 83195880146 ', 'fauziahfarah77@gmail.com', 'matching_job', 36000000.00, 'Biaya Matching Job Bidang Kerja : Kaigo ', 7, '2026-08-19 07:44:44');
INSERT IGNORE INTO `invoice_records` (`id`, `client_id`, `keterangan`, `jumlah`, `file_path`, `created_by`, `created_at`, `drive_link`) VALUES (2, 2, 'Cicilan 1', 20000000.00, 'invoice/inv_1787125484_5486.pdf', 7, '2026-08-25 12:00:00', NULL);

