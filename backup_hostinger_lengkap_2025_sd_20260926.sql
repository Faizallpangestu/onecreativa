-- ==============================================================================
-- ONE CREATIVA - ARSIP LENGKAP DATABASE LAMA HOSTINGER (2025 s/d 26 SEP 2026)
-- Sumber Resmi : u260890310_one.20260926065728.sql.gz (327 transaksi finance_records)
-- Dikonversi   : 100% cocok dengan skema terbaru tabel finance_records (u260890310_one)
-- Aman Impor   : Memakai auto-increment baru + WHERE NOT EXISTS (tidak menimpa id 58..66)
-- ==============================================================================

SET NAMES utf8mb4;

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Karya Malik', 50000.00, 'Stempel', '2025-11-29', 2, '2026-08-19 14:37:45', NULL, NULL, 'Transfer', 'Karya Malik', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-11-29' AND `amount` = 50000.00 AND `created_at` = '2026-08-19 14:37:45' AND COALESCE(`description`, '') = 'Stempel'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alverse Tech', 2065000.00, 'Logo CBI', '2025-12-02', 8, '2026-08-21 14:23:26', NULL, 'https://drive.google.com/file/d/1e_NnnxwoNCy7vUcW85WqD8DN-G9CT-TK/view?usp=sharing', 'Transfer', 'Alverse Tech', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-02' AND `amount` = 2065000.00 AND `created_at` = '2026-08-21 14:23:26' AND COALESCE(`description`, '') = 'Logo CBI'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 155500.00, 'Pembelian Keperluan Kantor dan Kelas ( ATK )', '2025-12-03', 2, '2026-08-18 16:29:33', NULL, 'https://drive.google.com/file/d/1K9gbemb_qwL2WZsYaFZThYfYpqwgEXD6/view', 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 155500.00 AND `created_at` = '2026-08-18 16:29:33' AND COALESCE(`description`, '') = 'Pembelian Keperluan Kantor dan Kelas ( ATK )'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Jaya Meubeul', 2600000.00, 'Pembelian Keperluan Kantor dan Asrama DP Kursi Lipat, Kursi Tamu dan Kasur', '2025-12-03', 2, '2026-08-19 09:28:32', NULL, 'https://drive.google.com/file/d/1fcIAC6xVQ1PClWVGIZ10vrO0GuGpXYof/view?usp=drive_link', 'Cash', 'Toko Jaya Meubeul', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 2600000.00 AND `created_at` = '2026-08-19 09:28:32' AND COALESCE(`description`, '') = 'Pembelian Keperluan Kantor dan Asrama DP Kursi Lipat, Kursi Tamu dan Kasur'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Digicom', 2795000.00, 'Printer Epson L3250 dan USB Hub Type C', '2025-12-03', 8, '2026-08-21 14:14:33', NULL, 'https://drive.google.com/file/d/1-5ktMJgfRNA-NzHco-jiPwCHllWV2NS4/view?usp=drive_link', 'Cash', 'Digicom', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 2795000.00 AND `created_at` = '2026-08-21 14:14:33' AND COALESCE(`description`, '') = 'Printer Epson L3250 dan USB Hub Type C'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Digicom', 360000.00, 'Tinta Refill Epson x4\nCatatan: Harga Satuan 90.000 x 4 = 360.000', '2025-12-03', 8, '2026-08-21 14:25:42', NULL, 'https://drive.google.com/file/d/1lvDEclnzr66R8jNkIzU9YcONgWfYshsc/view?usp=drive_link', 'Cash', 'Digicom', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 360000.00 AND `created_at` = '2026-08-21 14:25:42' AND COALESCE(`description`, '') = 'Tinta Refill Epson x4\nCatatan: Harga Satuan 90.000 x 4 = 360.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Digicom', 38000.00, 'Mouse Voxy E24 Wireless', '2025-12-03', 8, '2026-08-21 14:27:35', NULL, 'https://drive.google.com/file/d/1clgonE3qpANsE3xOuJDQiHicGvgSfdaR/view?usp=drive_link', 'Cash', 'Digicom', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 38000.00 AND `created_at` = '2026-08-21 14:27:35' AND COALESCE(`description`, '') = 'Mouse Voxy E24 Wireless'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Nasional', 295000.00, 'Stand Kipas dan wall kipas', '2025-12-03', 8, '2026-08-21 14:31:37', NULL, 'https://drive.google.com/file/d/1vAu0jR2BOsWw3VYGxac_KjHYFEfD07uc/view?usp=drive_link', 'Cash', 'Toko Nasional', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 295000.00 AND `created_at` = '2026-08-21 14:31:37' AND COALESCE(`description`, '') = 'Stand Kipas dan wall kipas'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Sanya', 99000.00, 'Pembelian Keperluan Kantor dan Alat Kebersihan Asrama Rumah\nCatatan: Rincian :\r\n- wall sticker\r\n- sapu injuk\r\n- poster president\r\n- mousepad', '2025-12-03', 8, '2026-08-21 14:42:23', NULL, 'https://drive.google.com/file/d/1NWmGKcUsNKXyCiED3PO6yofN-AzW8mlj/view?usp=drive_link', 'Cash', 'Toko Sanya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-03' AND `amount` = 99000.00 AND `created_at` = '2026-08-21 14:42:23' AND COALESCE(`description`, '') = 'Pembelian Keperluan Kantor dan Alat Kebersihan Asrama Rumah\nCatatan: Rincian :\r\n- wall sticker\r\n- sapu injuk\r\n- poster president\r\n- mousepad'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Canva', 62500.00, 'Biaya Canva Pro Bulanan', '2025-12-04', 2, '2026-08-19 11:58:57', NULL, NULL, 'Transfer', 'Canva', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-04' AND `amount` = 62500.00 AND `created_at` = '2026-08-19 11:58:57' AND COALESCE(`description`, '') = 'Biaya Canva Pro Bulanan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 2065000.00, 'Modal Saham', '2025-12-05', 2, '2026-08-18 11:56:03', NULL, 'https://drive.google.com/file/d/1e_NnnxwoNCy7vUcW85WqD8DN-G9CT-TK/view?usp=sharing', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2025-12-05' AND `amount` = 2065000.00 AND `created_at` = '2026-08-18 11:56:03' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 19950000.00, 'Modal Saham', '2025-12-05', 2, '2026-08-18 11:57:10', 'finance/finance_1787029030_1411.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2025-12-05' AND `amount` = 19950000.00 AND `created_at` = '2026-08-18 11:57:10' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', NULL, 6000.00, 'Pembelian Nota Kecil', '2025-12-05', 2, '2026-08-18 16:44:14', NULL, NULL, 'Cash', NULL, 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-05' AND `amount` = 6000.00 AND `created_at` = '2026-08-18 16:44:14' AND COALESCE(`description`, '') = 'Pembelian Nota Kecil'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', NULL, 20000.00, 'BBM Staff Administrasi Ramsya', '2025-12-08', 2, '2026-08-18 16:53:43', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-08' AND `amount` = 20000.00 AND `created_at` = '2026-08-18 16:53:43' AND COALESCE(`description`, '') = 'BBM Staff Administrasi Ramsya'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 449000.00, 'Pembelian Mesin Laminating dan Plastik Laminating\nCatatan: Rincian : \r\n- Mesin Laminating\r\n- Plastik Laminating', '2025-12-08', 2, '2026-08-19 11:43:06', NULL, 'https://drive.google.com/file/d/11LBMuueZ4ZgrAJtFXU7ypmAU8xjhO9ma/view?usp=drive_link', 'Transfer', 'Toko AA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-08' AND `amount` = 449000.00 AND `created_at` = '2026-08-19 11:43:06' AND COALESCE(`description`, '') = 'Pembelian Mesin Laminating dan Plastik Laminating\nCatatan: Rincian : \r\n- Mesin Laminating\r\n- Plastik Laminating'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Karya  Malik', 55000.00, 'Stempel CBI', '2025-12-09', 2, '2026-08-18 16:55:28', NULL, 'https://drive.google.com/file/d/1oySsdb7Rqf7f7mGw9ogQ6BMEtCs9x1vK/view?usp=drive_link', 'Cash', 'Karya  Malik', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-09' AND `amount` = 55000.00 AND `created_at` = '2026-08-18 16:55:28' AND COALESCE(`description`, '') = 'Stempel CBI'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', NULL, 30000.00, 'Kertas A4 Art Paper Cetak Brosur', '2025-12-10', 2, '2026-08-19 09:57:39', NULL, 'https://drive.google.com/file/d/1ohLe4teK1BA80HqEeEcPW7cAcC4EvQvg/view?usp=drive_link', 'Cash', NULL, 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-10' AND `amount` = 30000.00 AND `created_at` = '2026-08-19 09:57:39' AND COALESCE(`description`, '') = 'Kertas A4 Art Paper Cetak Brosur'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 150000.00, 'Voucher Kuota 100gb', '2025-12-11', 2, '2026-08-18 14:29:45', NULL, NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2025-12-11' AND `amount` = 150000.00 AND `created_at` = '2026-08-18 14:29:45' AND COALESCE(`description`, '') = 'Voucher Kuota 100gb'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', NULL, 150000.00, 'Voucher Kuota 100gb', '2025-12-11', 2, '2026-08-19 09:59:04', NULL, NULL, 'Cash', NULL, 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-11' AND `amount` = 150000.00 AND `created_at` = '2026-08-19 09:59:04' AND COALESCE(`description`, '') = 'Voucher Kuota 100gb'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Rumah Kuota', 12000.00, 'Perpanjang masa aktif kartu LPK IM3\nCatatan: Kartu LPK', '2025-12-12', 2, '2026-08-19 10:02:13', NULL, NULL, 'Cash', 'Rumah Kuota', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-12' AND `amount` = 12000.00 AND `created_at` = '2026-08-19 10:02:13' AND COALESCE(`description`, '') = 'Perpanjang masa aktif kartu LPK IM3\nCatatan: Kartu LPK'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', NULL, 23000.00, 'BBM + Makan Staff', '2025-12-12', 2, '2026-08-19 12:01:21', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-12' AND `amount` = 23000.00 AND `created_at` = '2026-08-19 12:01:21' AND COALESCE(`description`, '') = 'BBM + Makan Staff'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 3000000.00, 'Web dan Sistem', '2025-12-15', 2, '2026-08-18 13:33:53', NULL, NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2025-12-15' AND `amount` = 3000000.00 AND `created_at` = '2026-08-18 13:33:53' AND COALESCE(`description`, '') = 'Web dan Sistem'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', NULL, 3000000.00, 'Web dan Sistem', '2025-12-15', 2, '2026-08-19 12:02:54', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-15' AND `amount` = 3000000.00 AND `created_at` = '2026-08-19 12:02:54' AND COALESCE(`description`, '') = 'Web dan Sistem'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 650000.00, 'Brosur 1 Rim (500 pcs)', '2025-12-16', 2, '2026-08-18 14:31:17', NULL, NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2025-12-16' AND `amount` = 650000.00 AND `created_at` = '2026-08-18 14:31:17' AND COALESCE(`description`, '') = 'Brosur 1 Rim (500 pcs)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', NULL, 650000.00, 'Brosur 1 Rim ( 500 pcs )', '2025-12-16', 2, '2026-08-19 14:09:42', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-16' AND `amount` = 650000.00 AND `created_at` = '2026-08-19 14:09:42' AND COALESCE(`description`, '') = 'Brosur 1 Rim ( 500 pcs )'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Pembelian Buku Minna No Nihongo edisi 1 dan 2 ( 4 pcs )', '2025-12-22', 2, '2026-08-18 14:35:59', NULL, NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2025-12-22' AND `amount` = 200000.00 AND `created_at` = '2026-08-18 14:35:59' AND COALESCE(`description`, '') = 'Pembelian Buku Minna No Nihongo edisi 1 dan 2 ( 4 pcs )'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', NULL, 200000.00, 'Buku Miinna No Nihongo Edisi 1 dan 2', '2025-12-22', 2, '2026-08-19 14:10:28', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-22' AND `amount` = 200000.00 AND `created_at` = '2026-08-19 14:10:28' AND COALESCE(`description`, '') = 'Buku Miinna No Nihongo Edisi 1 dan 2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 2700000.00, 'Gaji Staff Administrasi Desember 2025', '2025-12-23', 2, '2026-08-19 14:16:00', NULL, 'https://drive.google.com/file/d/1klcJ8fTL8Nb7yqfCprGhEVWsK-vVJ0hx/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2025-12-23' AND `amount` = 2700000.00 AND `created_at` = '2026-08-19 14:16:00' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi Desember 2025'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', NULL, 1590087.00, 'Pengadaan Toren Air beserta bahan pipa, lem, sambungan', '2026-01-08', 2, '2026-08-19 14:39:44', NULL, 'https://drive.google.com/file/d/1FoVV9b7Kw0Xe0VG_eSCtP7dbpAdRvKoa/view?usp=sharing', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-08' AND `amount` = 1590087.00 AND `created_at` = '2026-08-19 14:39:44' AND COALESCE(`description`, '') = 'Pengadaan Toren Air beserta bahan pipa, lem, sambungan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', NULL, 126500.00, 'Tambahan Pipa Untuk Toren Air', '2026-01-08', 2, '2026-08-19 14:40:59', NULL, 'https://drive.google.com/file/d/1yiicCyKn8-tbTSO_Pxx1MXqXmJF1wNAM/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-08' AND `amount` = 126500.00 AND `created_at` = '2026-08-19 14:40:59' AND COALESCE(`description`, '') = 'Tambahan Pipa Untuk Toren Air'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', NULL, 64286.00, 'Jasa Transport Toren Cianjur - Mekarsari', '2026-01-08', 2, '2026-08-19 14:49:12', NULL, 'https://drive.google.com/file/d/1AJyYmgKrChpY6TeEuQMx7yRWkJAkbxYO/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-08' AND `amount` = 64286.00 AND `created_at` = '2026-08-19 14:49:12' AND COALESCE(`description`, '') = 'Jasa Transport Toren Cianjur - Mekarsari'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 2300000.00, 'Deposit untuk  Pembelian Torren Air Asrama dan Jasa Tukang', '2026-01-17', 2, '2026-08-18 13:45:12', NULL, 'https://drive.google.com/file/d/1sHBzXGMeKFsp9B0Pt5kMIygXgCJx2zSk/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-17' AND `amount` = 2300000.00 AND `created_at` = '2026-08-18 13:45:12' AND COALESCE(`description`, '') = 'Deposit untuk  Pembelian Torren Air Asrama dan Jasa Tukang'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 1790000.00, 'Deposit untuk Pembelian Peralatan Dapur Asrama', '2026-01-18', 2, '2026-08-18 13:48:26', NULL, 'https://drive.google.com/file/d/1tnIFe1qoSyuVSO3iQRQmij7ugLG5WzrT/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-18' AND `amount` = 1790000.00 AND `created_at` = '2026-08-18 13:48:26' AND COALESCE(`description`, '') = 'Deposit untuk Pembelian Peralatan Dapur Asrama'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 280999.00, 'Transport Kapal Laut Sensei Fitri', '2026-01-18', 2, '2026-08-18 14:37:17', NULL, 'https://drive.google.com/file/d/1pPpP2ZgSYr1hZEEN6H1wAk-XRuJ6R2ff/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-18' AND `amount` = 280999.00 AND `created_at` = '2026-08-18 14:37:17' AND COALESCE(`description`, '') = 'Transport Kapal Laut Sensei Fitri'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', NULL, 1368000.00, 'Pembelian keperluan asrama rumah memuat  magicom, kompor, sendok', '2026-01-18', 2, '2026-08-19 15:14:48', NULL, 'https://drive.google.com/file/d/1AQP461Ch0B_m1C0CuNIgEwn5RLyjJoAb/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-18' AND `amount` = 1368000.00 AND `created_at` = '2026-08-19 15:14:48' AND COALESCE(`description`, '') = 'Pembelian keperluan asrama rumah memuat  magicom, kompor, sendok'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', NULL, 271654.00, 'Transport Travel Pulang Pergi CJR-BKS Pak Alfin', '2026-01-21', 2, '2026-08-19 15:17:25', NULL, 'https://drive.google.com/file/d/193mpTWxgpcnQyVPxnYf9SSB0V81SaYN_/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-21' AND `amount` = 271654.00 AND `created_at` = '2026-08-19 15:17:25' AND COALESCE(`description`, '') = 'Transport Travel Pulang Pergi CJR-BKS Pak Alfin'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', NULL, 607706.00, 'Penginapan Hotel untuk Pak Alfin', '2026-01-21', 2, '2026-08-19 15:19:49', NULL, 'https://drive.google.com/file/d/1uU7mMVAxEW7mSiW7GKJsiM8K2QMlLa-z/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-21' AND `amount` = 607706.00 AND `created_at` = '2026-08-19 15:19:49' AND COALESCE(`description`, '') = 'Penginapan Hotel untuk Pak Alfin'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', NULL, 270000.00, 'Transport Kapal Laut Staff Fitri', '2026-01-22', 2, '2026-08-19 15:21:03', NULL, 'https://drive.google.com/file/d/1mo6URMguv2mCOxqIXUN8tBB8-AH6EApQ/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-22' AND `amount` = 270000.00 AND `created_at` = '2026-08-19 15:21:03' AND COALESCE(`description`, '') = 'Transport Kapal Laut Staff Fitri'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 2540000.00, 'Gaji Staff Administrasi Januari 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 2 Jam', '2026-01-25', 2, '2026-08-19 15:35:34', NULL, 'https://drive.google.com/file/d/1KjxDsm8UEWhqtE7YhC_kPPBsoGEFQey7/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-25' AND `amount` = 2540000.00 AND `created_at` = '2026-08-19 15:35:34' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi Januari 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 2 Jam'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 1056000.00, 'Deposit Pembelian Jemuran dan Keperluan Kantor Lainnya', '2026-01-26', 2, '2026-08-18 13:52:38', NULL, 'https://drive.google.com/file/d/10x3CXUy-H6WkVlNrPo6MOD8D803MeACM/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-26' AND `amount` = 1056000.00 AND `created_at` = '2026-08-18 13:52:38' AND COALESCE(`description`, '') = 'Deposit Pembelian Jemuran dan Keperluan Kantor Lainnya'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', NULL, 150265.00, 'Paket Kotak P3K', '2026-01-27', 2, '2026-08-19 15:44:58', NULL, 'https://drive.google.com/file/d/1-1NzObOP4RNo0zZ2OKWwcu1UaOyfpPnW/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-27' AND `amount` = 150265.00 AND `created_at` = '2026-08-19 15:44:58' AND COALESCE(`description`, '') = 'Paket Kotak P3K'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', NULL, 106697.00, 'Jemuran', '2026-01-27', 2, '2026-08-19 16:43:38', NULL, 'https://drive.google.com/file/d/18Bc3-9dv-FfCQGi5kBhUY-c276bbzove/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-27' AND `amount` = 106697.00 AND `created_at` = '2026-08-19 16:43:38' AND COALESCE(`description`, '') = 'Jemuran'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 64867.00, 'Box File Jumbo', '2026-01-27', 2, '2026-08-19 16:44:46', NULL, 'https://drive.google.com/file/d/1dVlpb38MT03V3uTgLevGdMwefs7a1X4c/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-27' AND `amount` = 64867.00 AND `created_at` = '2026-08-19 16:44:46' AND COALESCE(`description`, '') = 'Box File Jumbo'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 67091.00, 'Map Siswa', '2026-01-27', 2, '2026-08-19 16:45:30', NULL, 'https://drive.google.com/file/d/1fJVOPFTrgf_Tzfx92Bpe1maUssXUgAi3/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-27' AND `amount` = 67091.00 AND `created_at` = '2026-08-19 16:45:30' AND COALESCE(`description`, '') = 'Map Siswa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', NULL, 200000.00, 'Listrik Air Kantor dan Asrama', '2026-01-27', 2, '2026-08-19 16:46:22', NULL, 'https://drive.google.com/file/d/122QtgpPHNZKj6xjjnTnBDdCG3eKfobHF/view?usp=drive_link', 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-27' AND `amount` = 200000.00 AND `created_at` = '2026-08-19 16:46:22' AND COALESCE(`description`, '') = 'Listrik Air Kantor dan Asrama'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Prometric', 450000.00, 'Ujian Test SSW Bowo', '2026-01-27', 2, '2026-08-19 16:47:39', NULL, 'https://drive.google.com/file/d/1rmBhhT6Gz62Aa4lBcGsPKrAZOzY0RpH2/view?usp=drive_link', 'Transfer', 'Prometric', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-27' AND `amount` = 450000.00 AND `created_at` = '2026-08-19 16:47:39' AND COALESCE(`description`, '') = 'Ujian Test SSW Bowo'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siiti Nurhatifah', 4800000.00, 'Deposit Pembelian Laptop untuk Staff', '2026-01-30', 2, '2026-08-18 13:54:52', NULL, 'https://drive.google.com/file/d/1gpNcMeA3SrWV_24T9Y49mtLHdwi_2e6g/view?usp=drive_link', 'Transfer', 'Siiti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-30' AND `amount` = 4800000.00 AND `created_at` = '2026-08-18 13:54:52' AND COALESCE(`description`, '') = 'Deposit Pembelian Laptop untuk Staff'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 879500.00, 'Reimburstment Tiket Travel dan Booking Hotel Pak Alfin', '2026-01-30', 2, '2026-08-18 14:40:13', NULL, 'https://drive.google.com/file/d/1z1UJDK9sDVdk3Eoqd4y9Bubgb3ZSs_T5/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-30' AND `amount` = 879500.00 AND `created_at` = '2026-08-18 14:40:13' AND COALESCE(`description`, '') = 'Reimburstment Tiket Travel dan Booking Hotel Pak Alfin'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 1200000.00, 'Deposit Pengadaan Instalasi Wi-Fi Bizznet untuk kantor', '2026-01-31', 2, '2026-08-18 14:02:11', NULL, 'https://drive.google.com/file/d/1yX81yZZGKK35OiXIU7hlE6OoCivlNSfi/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-01-31' AND `amount` = 1200000.00 AND `created_at` = '2026-08-18 14:02:11' AND COALESCE(`description`, '') = 'Deposit Pengadaan Instalasi Wi-Fi Bizznet untuk kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Bizznet', 1054500.00, 'Pengadaan Instalasi Wifi di Kantor', '2026-01-31', 2, '2026-08-19 16:48:33', NULL, 'https://drive.google.com/file/d/1wC1docFCdREOumdXN4M5vlZpamXr_wv5/view?usp=drive_link', 'Transfer', 'Bizznet', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-01-31' AND `amount` = 1054500.00 AND `created_at` = '2026-08-19 16:48:33' AND COALESCE(`description`, '') = 'Pengadaan Instalasi Wifi di Kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 200000.00, 'Kekurangan Transfer Pembelian Laptop Staff', '2026-02-02', 2, '2026-08-18 14:41:41', NULL, 'https://drive.google.com/file/d/14fLumPKn_kVlToR-g4efpKNVUP9jXH48/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-02-02' AND `amount` = 200000.00 AND `created_at` = '2026-08-18 14:41:41' AND COALESCE(`description`, '') = 'Kekurangan Transfer Pembelian Laptop Staff'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Digicom', 4890000.00, 'Pengadaan laptop Lenovo IdeaPad Slim3 untuk staff', '2026-02-02', 2, '2026-08-19 16:55:50', NULL, 'https://drive.google.com/file/d/1cp04Yz0ZJBoiRybZ2NPH7AerlQ8hjCnc/view?usp=drive_link', 'Cash', 'Digicom', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-02' AND `amount` = 4890000.00 AND `created_at` = '2026-08-19 16:55:50' AND COALESCE(`description`, '') = 'Pengadaan laptop Lenovo IdeaPad Slim3 untuk staff'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', NULL, 100000.00, 'Fee/Tip Instalasi Wi-Fi', '2026-02-02', 2, '2026-08-19 16:56:55', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-02' AND `amount` = 100000.00 AND `created_at` = '2026-08-19 16:56:55' AND COALESCE(`description`, '') = 'Fee/Tip Instalasi Wi-Fi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Canva', 62500.00, 'Biaya langganan canva bulan februari', '2026-02-02', 2, '2026-08-19 16:58:18', NULL, 'https://drive.google.com/file/d/1tBqtCzB9bSwB_OJnbHSdS7Sg1Ulx2TOv/view?usp=drive_link', 'Transfer', 'Canva', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-02' AND `amount` = 62500.00 AND `created_at` = '2026-08-19 16:58:18' AND COALESCE(`description`, '') = 'Biaya langganan canva bulan februari'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 500000.00, 'Modal Pembelian Kertas BC untuk Tangocho', '2026-02-09', 2, '2026-08-18 14:43:39', NULL, 'https://drive.google.com/file/d/1hZKBVcg54kmNrLzRKsoAwrYp5L_3Xo0M/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-02-09' AND `amount` = 500000.00 AND `created_at` = '2026-08-18 14:43:39' AND COALESCE(`description`, '') = 'Modal Pembelian Kertas BC untuk Tangocho'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 80500.00, 'Pembelian ATK Keperluan Kantor\nCatatan: kertas bc a4, cutter, pensil, penghapus, serutan, double tape 2, karton putih 10', '2026-02-11', 2, '2026-08-19 16:59:47', NULL, 'https://drive.google.com/file/d/18oyIpjdakQHsJBHu5hCNe36p5g4o_Sys/view?usp=drive_link', 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-11' AND `amount` = 80500.00 AND `created_at` = '2026-08-19 16:59:47' AND COALESCE(`description`, '') = 'Pembelian ATK Keperluan Kantor\nCatatan: kertas bc a4, cutter, pensil, penghapus, serutan, double tape 2, karton putih 10'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 49500.00, 'Kertas Buffalo 100 lembar F4 untuk tangocho', '2026-02-12', 2, '2026-08-20 09:12:14', NULL, 'https://drive.google.com/file/d/1-PqlzUpcMbjgCs3anGNNcWhmQyBvhJna/view?usp=drive_link', 'Transfer', 'Toko AA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-12' AND `amount` = 49500.00 AND `created_at` = '2026-08-20 09:12:14' AND COALESCE(`description`, '') = 'Kertas Buffalo 100 lembar F4 untuk tangocho'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Panembong Baja', 40000.00, 'Renovasi Asrama, Pembelian Ruff Baja', '2026-02-20', 2, '2026-08-20 09:23:05', NULL, 'https://drive.google.com/file/d/1-AXvPIEMQW8koipEe08V19qX-EFeP2X7/view?usp=drive_link', 'Transfer', 'Panembong Baja', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-20' AND `amount` = 40000.00 AND `created_at` = '2026-08-20 09:23:05' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Ruff Baja'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indo Super Grosir', 2301049.00, 'Renovasi Asrama, Pembelian cat, karpet talang, dan fiber', '2026-02-22', 2, '2026-08-20 09:27:25', NULL, 'https://drive.google.com/file/d/1II_c1_7j7UPOWh2CFHrnhykCwBA10_x7/view?usp=drive_link', 'Transfer', 'Indo Super Grosir', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-22' AND `amount` = 2301049.00 AND `created_at` = '2026-08-20 09:27:25' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian cat, karpet talang, dan fiber'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 41000.00, 'Renovasi Asrama, Pembelian Papan dan Paku', '2026-02-23', 2, '2026-08-20 09:28:54', NULL, 'https://drive.google.com/file/d/14JBvyqbs2fu7BAxn7tU4KVfP7-Cv_s46/view?usp=drive_link', 'Transfer', 'TB Faqih Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-23' AND `amount` = 41000.00 AND `created_at` = '2026-08-20 09:28:54' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Papan dan Paku'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 4970000.00, 'Renovasi Asrama', '2026-02-24', 2, '2026-08-18 14:48:10', NULL, 'https://drive.google.com/file/d/10G4ze_eMExAgIiRm-FO948Qqe0ybfawh/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-02-24' AND `amount` = 4970000.00 AND `created_at` = '2026-08-18 14:48:10' AND COALESCE(`description`, '') = 'Renovasi Asrama'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 6385000.00, 'Gaji dan Insentif Karyawan', '2026-02-25', 2, '2026-08-18 14:49:28', NULL, 'https://drive.google.com/file/d/1p-7mP-Y_nn1FhDP1VbYMndKWvoY3-9vr/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-02-25' AND `amount` = 6385000.00 AND `created_at` = '2026-08-18 14:49:28' AND COALESCE(`description`, '') = 'Gaji dan Insentif Karyawan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indo Super Grosir', 344025.00, 'Renovasi Asrama, GRC Board', '2026-02-25', 2, '2026-08-20 09:31:18', NULL, 'https://drive.google.com/file/d/1vada66tLwqqSqVojsIjCw7bP7m6BqYEU/view?usp=drive_link', 'Transfer', 'Indo Super Grosir', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-25' AND `amount` = 344025.00 AND `created_at` = '2026-08-20 09:31:18' AND COALESCE(`description`, '') = 'Renovasi Asrama, GRC Board'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'Indo Super Grosir', 64286.00, 'Ongkos Kirim GRC Ke Asrama', '2026-02-25', 2, '2026-08-20 09:33:06', NULL, 'https://drive.google.com/file/d/1UdTOpybMxSJGVrxChleacwVPF74Fp9vm/view?usp=drive_link', 'Transfer', 'Indo Super Grosir', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-25' AND `amount` = 64286.00 AND `created_at` = '2026-08-20 09:33:06' AND COALESCE(`description`, '') = 'Ongkos Kirim GRC Ke Asrama'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indo Super Grosir', 949983.00, 'Renovasi Asrama, Pembelian Bahan Untuk Listrik\nCatatan: Bahan Lampu, Fiber, Kawat stop kontak, saklar.\r\nada retur barang asbes diganti dengan grc sehingga pengurangan total pembelian', '2026-02-25', 2, '2026-08-20 09:36:22', NULL, 'https://drive.google.com/file/d/1es4JE_u2Eb3zQqGTrPbZaycE38sHSZdr/view?usp=drive_link', 'Transfer', 'Indo Super Grosir', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-25' AND `amount` = 949983.00 AND `created_at` = '2026-08-20 09:36:22' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Untuk Listrik\nCatatan: Bahan Lampu, Fiber, Kawat stop kontak, saklar.\r\nada retur barang asbes diganti dengan grc sehingga pengurangan total pembelian'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Fitri', 2360000.00, 'Gaji Staff Pengajar (sensei) Februari 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 2 Jam\r\nIntensif : 150.000\r\nTHR : 170.000\r\nTotal gaji diterima Rp. 2.360.000', '2026-02-25', 7, '2026-08-20 09:45:24', NULL, 'https://drive.google.com/file/d/15PJGUTQDyCOSgQnEOwqc8c-y2NPbBDwd/view?usp=drive_link', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-25' AND `amount` = 2360000.00 AND `created_at` = '2026-08-20 09:45:24' AND COALESCE(`description`, '') = 'Gaji Staff Pengajar (sensei) Februari 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 2 Jam\r\nIntensif : 150.000\r\nTHR : 170.000\r\nTotal gaji diterima Rp. 2.360.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 3525000.00, 'Gaji Staff  Administrasi Februari 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 5 Jam\r\nInsentif : Rp. 300.000\r\nTHR : Rp. 625.000', '2026-02-25', 7, '2026-08-20 09:48:33', NULL, 'https://drive.google.com/file/d/10toMFht7d_7Lpxb8g5WBCrSKpBe4hx1S/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-25' AND `amount` = 3525000.00 AND `created_at` = '2026-08-20 09:48:33' AND COALESCE(`description`, '') = 'Gaji Staff  Administrasi Februari 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 5 Jam\r\nInsentif : Rp. 300.000\r\nTHR : Rp. 625.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 1400000.00, 'Jasa Renovasi Asrama Grasi', '2026-02-26', 2, '2026-08-18 14:51:10', NULL, 'https://drive.google.com/file/d/1y25-qdWdceu4-75bTSOeoft7YNXM_LHj/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-02-26' AND `amount` = 1400000.00 AND `created_at` = '2026-08-18 14:51:10' AND COALESCE(`description`, '') = 'Jasa Renovasi Asrama Grasi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 213000.00, 'Renovasi Asrama, Pembelian paku 7 (1kg), Kaso 3m(15)', '2026-02-26', 7, '2026-08-20 09:58:17', NULL, 'https://drive.google.com/file/d/1_qNQA0UVva2B0Gluvn0EkSsAgK4i2z96/view?usp=drive_link', 'Transfer', 'TB Faqih Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-02-26' AND `amount` = 213000.00 AND `created_at` = '2026-08-20 09:58:17' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian paku 7 (1kg), Kaso 3m(15)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Canva', 125000.00, 'Biaya Langganan Canva Bulan Maret', '2026-03-02', 7, '2026-08-20 10:02:28', NULL, 'https://drive.google.com/file/d/1RTIbkHM2tVn9Q0oVoiyFnC7L89q4W7PO/view?usp=drive_link', 'Transfer', 'Canva', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-02' AND `amount` = 125000.00 AND `created_at` = '2026-08-20 10:02:28' AND COALESCE(`description`, '') = 'Biaya Langganan Canva Bulan Maret'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 187000.00, 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian GRC(3), Kaso 3m(2), Paku GRC 1dus, Benang 1', '2026-03-03', 7, '2026-08-20 10:04:14', NULL, 'https://drive.google.com/file/d/1YmEIHyVLp65gmjr_CRSfQkqnMv23cWJE/view?usp=drive_link', 'Transfer', 'TB Faqih Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-03' AND `amount` = 187000.00 AND `created_at` = '2026-08-20 10:04:14' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian GRC(3), Kaso 3m(2), Paku GRC 1dus, Benang 1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 494000.00, 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian wapin 1/2 (3), T 1/2 (2), Knee 1/2 (6), Saringan (4), Kdd 1/2 (3), T drat 1/2 (1), Knee 3 (3), Glass Block (1dus), megalon 3 (2)', '2026-03-03', 7, '2026-08-20 10:05:53', NULL, 'https://drive.google.com/file/d/1doHkA8LSPUgphzXOhnl85Z87obdL-1Z8/view?usp=drive_link', 'Transfer', 'TB Faqih Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-03' AND `amount` = 494000.00 AND `created_at` = '2026-08-20 10:05:53' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian wapin 1/2 (3), T 1/2 (2), Knee 1/2 (6), Saringan (4), Kdd 1/2 (3), T drat 1/2 (1), Knee 3 (3), Glass Block (1dus), megalon 3 (2)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Aira Percetakan', 13000.00, 'Tes Print Cover Tangocho + Laminasi', '2026-03-03', 7, '2026-08-20 10:07:50', NULL, NULL, 'Transfer', 'Aira Percetakan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-03' AND `amount` = 13000.00 AND `created_at` = '2026-08-20 10:07:50' AND COALESCE(`description`, '') = 'Tes Print Cover Tangocho + Laminasi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Aira Percetakan', 13000.00, 'Pembeliann Art Paper + Glossy', '2026-03-03', 7, '2026-08-20 10:08:50', NULL, 'https://drive.google.com/file/d/1CGqNu9qjyLJvFTNzM0BSAreNbeHho4Ud/view?usp=sharing', 'Cash', 'Aira Percetakan', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-03' AND `amount` = 13000.00 AND `created_at` = '2026-08-20 10:08:50' AND COALESCE(`description`, '') = 'Pembeliann Art Paper + Glossy'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 1000000.00, 'Tambahan untuk kekurangan renovasi asrama', '2026-03-05', 2, '2026-08-18 14:52:53', NULL, 'https://drive.google.com/file/d/1BVomPiyiNd-0UNBgXyt899XJ2eSxIEhj/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-03-05' AND `amount` = 1000000.00 AND `created_at` = '2026-08-18 14:52:53' AND COALESCE(`description`, '') = 'Tambahan untuk kekurangan renovasi asrama'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Fotocopy Sinar M', 121000.00, 'Jilid Spiral Tangocho 20 Buku', '2026-03-05', 7, '2026-08-20 10:10:05', NULL, NULL, 'Cash', 'Fotocopy Sinar M', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-05' AND `amount` = 121000.00 AND `created_at` = '2026-08-20 10:10:05' AND COALESCE(`description`, '') = 'Jilid Spiral Tangocho 20 Buku'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Aira Percetakan', 52000.00, 'Art paper + Laminasi Cover Tangocho', '2026-03-05', 7, '2026-08-20 10:11:08', NULL, 'https://drive.google.com/file/d/1Sn4ouZk2cxsrihu6Za0YdU_chwokS1HQ/view?usp=drive_link', 'Transfer', 'Aira Percetakan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-05' AND `amount` = 52000.00 AND `created_at` = '2026-08-20 10:11:08' AND COALESCE(`description`, '') = 'Art paper + Laminasi Cover Tangocho'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 69000.00, 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian Loster (4), Plug 1/2 (4), Sealtape (1)', '2026-03-07', 7, '2026-08-20 10:14:53', NULL, 'https://drive.google.com/file/d/1e0RiiBoGON93us08OMvpljIbtMWVwTQ8/view?usp=sharing', 'Cash', 'TB Faqih Jaya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-07' AND `amount` = 69000.00 AND `created_at` = '2026-08-20 10:14:53' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian Loster (4), Plug 1/2 (4), Sealtape (1)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'Indo Trans', 64286.00, 'Transport Pengiriman Bahan Bangunan', '2026-03-08', 7, '2026-08-20 10:16:45', NULL, 'https://drive.google.com/file/d/1rf9aNNj9cFDgnFmUkwTpKSEo7bUJoD4g/view?usp=sharing', 'Transfer', 'Indo Trans', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-08' AND `amount` = 64286.00 AND `created_at` = '2026-08-20 10:16:45' AND COALESCE(`description`, '') = 'Transport Pengiriman Bahan Bangunan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 17000.00, 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian Bahan Renovasi T3 (1), Knee Drat 1/2 (1)', '2026-03-09', 7, '2026-08-20 10:18:22', NULL, 'https://drive.google.com/file/d/1DYY_zxxmpl2qcL-39al9sQUKhIFb5_OQ/view?usp=drive_link', 'Cash', 'TB Faqih Jaya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-09' AND `amount` = 17000.00 AND `created_at` = '2026-08-20 10:18:22' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Pembelian Bahan Renovasi T3 (1), Knee Drat 1/2 (1)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Yoez Desain & Printing', 15000.00, 'Art Paper (260gr) + Laminasi Cover tangaocho', '2026-03-09', 7, '2026-08-20 10:20:21', NULL, 'https://drive.google.com/file/d/1QxsxWjb9bmDXti1i5tbHJ1GOXOL3GxZB/view?usp=sharing', 'Cash', 'Yoez Desain & Printing', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-09' AND `amount` = 15000.00 AND `created_at` = '2026-08-20 10:20:21' AND COALESCE(`description`, '') = 'Art Paper (260gr) + Laminasi Cover tangaocho'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 95840.00, 'Pembelian Buku Soal Minna No Nihongo', '2026-03-10', 2, '2026-08-18 14:53:59', NULL, 'https://drive.google.com/file/d/12f9iqlepRueIkPKEH7RV0vXxpDgEPMV6/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-03-10' AND `amount` = 95840.00 AND `created_at` = '2026-08-18 14:53:59' AND COALESCE(`description`, '') = 'Pembelian Buku Soal Minna No Nihongo'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Fotocopy', 22000.00, 'Pembelian Cutter dan isi cutter', '2026-03-10', 7, '2026-08-20 10:21:45', NULL, NULL, 'Cash', 'Fotocopy', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-10' AND `amount` = 22000.00 AND `created_at` = '2026-08-20 10:21:45' AND COALESCE(`description`, '') = 'Pembelian Cutter dan isi cutter'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Shopee', 95840.00, 'Pembelian Buku Soal Minna No Nihongo', '2026-03-10', 7, '2026-08-20 10:22:58', NULL, 'https://drive.google.com/file/d/12f9iqlepRueIkPKEH7RV0vXxpDgEPMV6/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-10' AND `amount` = 95840.00 AND `created_at` = '2026-08-20 10:22:58' AND COALESCE(`description`, '') = 'Pembelian Buku Soal Minna No Nihongo'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 300000.00, 'Biaya Langganan Canva Bulan Februari dan Maret', '2026-03-11', 2, '2026-08-18 14:56:21', NULL, 'https://drive.google.com/file/d/1RqNEE9bJih5jI1MHkflepDBK5MfNksOQ/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-03-11' AND `amount` = 300000.00 AND `created_at` = '2026-08-18 14:56:21' AND COALESCE(`description`, '') = 'Biaya Langganan Canva Bulan Februari dan Maret'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Yoez Desain & Printing', 60000.00, 'Print A3+ Laminasi Cover Tangocho 4 lembar', '2026-03-11', 7, '2026-08-20 10:24:37', NULL, 'https://drive.google.com/file/d/1VnecCj_bDgJD1fYAW901hTUB54mSPWh-/view?usp=sharing', 'Transfer', 'Yoez Desain & Printing', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-11' AND `amount` = 60000.00 AND `created_at` = '2026-08-20 10:24:37' AND COALESCE(`description`, '') = 'Print A3+ Laminasi Cover Tangocho 4 lembar'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Toko AA', 90000.00, 'Pembelian Kertas Jilid F4\nCatatan: Buffalo 1 pak x 3', '2026-03-11', 7, '2026-08-20 10:46:40', NULL, 'https://drive.google.com/file/d/1UN23IRA63HTSaMaLOJ5vglwUD98btpRp/view?usp=sharing', 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-11' AND `amount` = 90000.00 AND `created_at` = '2026-08-20 10:46:40' AND COALESCE(`description`, '') = 'Pembelian Kertas Jilid F4\nCatatan: Buffalo 1 pak x 3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Jilid Spiral Tangocho Minna Vol 2 20 Buku', '2026-03-12', 2, '2026-08-18 14:58:23', NULL, 'https://drive.google.com/file/d/1l-4OdeS9E19FoR6qE_BTqU4Duu9BP9_l/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-03-12' AND `amount` = 200000.00 AND `created_at` = '2026-08-18 14:58:23' AND COALESCE(`description`, '') = 'Jilid Spiral Tangocho Minna Vol 2 20 Buku'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Sauda Copy Service', 160000.00, 'Jilid Spiral 20 Buku', '2026-03-12', 7, '2026-08-20 10:39:02', NULL, 'https://drive.google.com/file/d/1NSVJOVxg-gTUd8oWSnEIEcLZjrfMF36i/view?usp=sharing', 'Cash', 'Sauda Copy Service', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-12' AND `amount` = 160000.00 AND `created_at` = '2026-08-20 10:39:02' AND COALESCE(`description`, '') = 'Jilid Spiral 20 Buku'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indo Super Grosir', 71000.00, 'Renovasi Asrama, Pembelian Bahan Matrial', '2026-03-13', 7, '2026-08-20 10:40:53', NULL, 'https://drive.google.com/file/d/13ptSJR1ji8pjUcfqImMgoeU0LIUGKsi7/view?usp=sharing', 'Cash', 'Indo Super Grosir', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-13' AND `amount` = 71000.00 AND `created_at` = '2026-08-20 10:40:53' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Matrial'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 500000.00, 'Pembelian Kertas Tangocho dan Token Listrik', '2026-03-17', 2, '2026-08-18 14:59:15', NULL, 'https://drive.google.com/file/d/1huX8Gg2d_gaBDDuQ-ZzjDR4NSZibVoX7/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-03-17' AND `amount` = 500000.00 AND `created_at` = '2026-08-18 14:59:15' AND COALESCE(`description`, '') = 'Pembelian Kertas Tangocho dan Token Listrik'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 3080000.00, 'Gaji Staff Administrasi Maret 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 4 Jam', '2026-03-26', 7, '2026-08-20 10:42:00', NULL, 'https://drive.google.com/file/d/1TjWiERu2IMjdzOpT3r27jRUp9jNrIz79/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-26' AND `amount` = 3080000.00 AND `created_at` = '2026-08-20 10:42:00' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi Maret 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 4 Jam'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Fitri', 2000000.00, 'Gaji Staff Pengajar Sensei Maret 2026', '2026-03-26', 7, '2026-08-20 10:43:19', NULL, 'https://drive.google.com/file/d/1ega6KaciBrl8h3mFtA7fcc57TgZZxIhn/view?usp=drive_link', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-26' AND `amount` = 2000000.00 AND `created_at` = '2026-08-20 10:43:19' AND COALESCE(`description`, '') = 'Gaji Staff Pengajar Sensei Maret 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'TB Faqih Jaya', 63600.00, 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Holo 2x4 (23), Triplek 3m (8)', '2026-03-28', 7, '2026-08-20 10:45:00', NULL, 'https://drive.google.com/file/d/1JZzoLrPtxg2aYzcks7y_liyZ-tzsWIx8/view?usp=sharing', 'Transfer', 'TB Faqih Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-03-28' AND `amount` = 63600.00 AND `created_at` = '2026-08-20 10:45:00' AND COALESCE(`description`, '') = 'Renovasi Asrama, Pembelian Bahan Matrial\nCatatan: Holo 2x4 (23), Triplek 3m (8)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Pembelian Token Asrama 1 dan Token Asrama 2', '2026-04-01', 2, '2026-08-18 15:02:58', NULL, 'https://drive.google.com/file/d/1wdY2x7JyjGW_JMC1r1L7Angc0VqgYyCh/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-01' AND `amount` = 200000.00 AND `created_at` = '2026-08-18 15:02:58' AND COALESCE(`description`, '') = 'Pembelian Token Asrama 1 dan Token Asrama 2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Lilis Sumarsih', 7427777.00, 'Biaya Renovasi Asrama Gerasi', '2026-04-01', 7, '2026-08-20 10:55:08', NULL, NULL, 'Cash', 'Lilis Sumarsih', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-01' AND `amount` = 7427777.00 AND `created_at` = '2026-08-20 10:55:08' AND COALESCE(`description`, '') = 'Biaya Renovasi Asrama Gerasi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Shopee', 104000.00, 'Pembelian Token Kantor Bu Lilis', '2026-04-02', 7, '2026-08-20 10:58:27', NULL, 'https://drive.google.com/file/d/1rRyg1OBmYg-6Ovvkh6eiUIqFWBvHNCzK/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-02' AND `amount` = 104000.00 AND `created_at` = '2026-08-20 10:58:27' AND COALESCE(`description`, '') = 'Pembelian Token Kantor Bu Lilis'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Shopee', 51500.00, 'Pembelian Token Asrama Rumah', '2026-04-02', 7, '2026-08-20 11:01:52', NULL, 'https://drive.google.com/file/d/1uISe76XICvvG_yAZTE-76R7alBrt74FP/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-02' AND `amount` = 51500.00 AND `created_at` = '2026-08-20 11:01:52' AND COALESCE(`description`, '') = 'Pembelian Token Asrama Rumah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 55000.00, 'Pembelian Alat Kebersihan Toilet', '2026-04-04', 2, '2026-08-18 15:03:56', NULL, 'https://drive.google.com/file/d/1bj9AIwRJwNDsKuwOC9kj2_b6GVu8jhmf/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-04' AND `amount` = 55000.00 AND `created_at` = '2026-08-18 15:03:56' AND COALESCE(`description`, '') = 'Pembelian Alat Kebersihan Toilet'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 53800.00, 'Pembelian Alat kebersihan', '2026-04-04', 7, '2026-08-20 11:05:53', NULL, 'https://drive.google.com/file/d/1mMzAIwlKsPw2kfDQhTZ9iIau5yPcmB4F/view?usp=drive_link', 'Cash', 'Alfamart', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-04' AND `amount` = 53800.00 AND `created_at` = '2026-08-20 11:05:53' AND COALESCE(`description`, '') = 'Pembelian Alat kebersihan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 2000000.00, 'Modal Saham', '2026-04-08', 2, '2026-08-18 15:05:25', NULL, 'https://drive.google.com/file/d/1sSZlqhoCb_iDvv2W5uxrF3oAQePg6Ebq/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-08' AND `amount` = 2000000.00 AND `created_at` = '2026-08-18 15:05:25' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 15000000.00, 'Modal Saham', '2026-04-08', 2, '2026-08-18 15:08:42', NULL, 'https://drive.google.com/file/d/12UCnyGDxWkfPkxI0m-mi4DwJGroEFO-t/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-08' AND `amount` = 15000000.00 AND `created_at` = '2026-08-18 15:08:42' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'Indosat', 115000.00, 'Pembelian Masa Aktif No LPK 360 Hari', '2026-04-09', 7, '2026-08-20 11:09:20', NULL, 'https://drive.google.com/file/d/10hexOeWW6rhB7ckht_bNLKXpKopsYtxv/view?usp=drive_link', 'Transfer', 'Indosat', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-09' AND `amount` = 115000.00 AND `created_at` = '2026-08-20 11:09:20' AND COALESCE(`description`, '') = 'Pembelian Masa Aktif No LPK 360 Hari'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'A Alfin', 1085000.00, 'Biaya Insentif Pak Alfin', '2026-04-13', 7, '2026-08-20 10:49:00', NULL, 'https://drive.google.com/file/d/1KFkuNGLJcYvW_UUzVoinDCje9JPVv0F9/view?usp=drive_link', 'Transfer', 'A Alfin', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-13' AND `amount` = 1085000.00 AND `created_at` = '2026-08-20 10:49:00' AND COALESCE(`description`, '') = 'Biaya Insentif Pak Alfin'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Canva', 125000.00, 'Biaya Langganan Canva April', '2026-04-13', 7, '2026-08-20 10:51:33', NULL, 'https://drive.google.com/file/d/1vS7-Nrdm1IYK2FbwOqqNtqq5ICtjjG5k/view?usp=drive_link', 'Transfer', 'Canva', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-13' AND `amount` = 125000.00 AND `created_at` = '2026-08-20 10:51:33' AND COALESCE(`description`, '') = 'Biaya Langganan Canva April'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Kori Suripno', 200000.00, 'Pembayaran Iuran Pengelolaan Lingkungan ( IPL ) April', '2026-04-16', 7, '2026-08-20 10:53:26', NULL, 'https://drive.google.com/file/d/12InOSQXHDq0fuMsi-4gywNvmRXNySPmW/view?usp=drive_link', 'Transfer', 'Kori Suripno', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-16' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 10:53:26' AND COALESCE(`description`, '') = 'Pembayaran Iuran Pengelolaan Lingkungan ( IPL ) April'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 21000000.00, 'Modal Saham', '2026-04-17', 2, '2026-08-18 15:07:23', NULL, 'https://drive.google.com/file/d/1UPrO_Iu2cRsCNkvnRatLa9I1NsllXxPU/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-17' AND `amount` = 21000000.00 AND `created_at` = '2026-08-18 15:07:23' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Shopee', 52500.00, 'Pembelian Token Asrama Rumah', '2026-04-17', 7, '2026-08-20 11:15:05', NULL, 'https://drive.google.com/file/d/1NvJCyrjwlhBYNcguskFH5JO6cPd7n5W_/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-17' AND `amount` = 52500.00 AND `created_at` = '2026-08-20 11:15:05' AND COALESCE(`description`, '') = 'Pembelian Token Asrama Rumah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin ( LPK SAMIT )', 22840000.00, 'Pembelian Sandblast, Gorden dan Ac Daikin 2 PK', '2026-04-17', 7, '2026-08-20 11:16:46', NULL, 'https://drive.google.com/file/d/1tPtPcUm0IrSiZbpdwYQ-uVM4Qxmg6v_X/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin ( LPK SAMIT )', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-17' AND `amount` = 22840000.00 AND `created_at` = '2026-08-20 11:16:46' AND COALESCE(`description`, '') = 'Pembelian Sandblast, Gorden dan Ac Daikin 2 PK'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah ( Rekening Koran )', 1000000.00, 'Modal Saham', '2026-04-17', 8, '2026-08-21 16:04:51', NULL, NULL, 'Transfer', 'Siti Nurhatifah ( Rekening Koran )', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-17' AND `amount` = 1000000.00 AND `created_at` = '2026-08-21 16:04:51' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 6024550.00, 'Penambahan daya Listrik 10.600 watt untuk kantor B1\nCatatan: Biaya pembelian : 6.022.800\r\nTambahan biaya admin : Rp. 1.750', '2026-04-18', 7, '2026-08-20 11:20:03', NULL, 'https://drive.google.com/file/d/1GYyJT1YT-TvDSXxwH1IjVICZjT9tL7sD/view?usp=drive_link', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-18' AND `amount` = 6024550.00 AND `created_at` = '2026-08-20 11:20:03' AND COALESCE(`description`, '') = 'Penambahan daya Listrik 10.600 watt untuk kantor B1\nCatatan: Biaya pembelian : 6.022.800\r\nTambahan biaya admin : Rp. 1.750'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'BCA', 15000.00, 'Biaya Admin Bank BCA April', '2026-04-18', 7, '2026-08-20 11:23:58', NULL, NULL, 'Transfer', 'BCA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-18' AND `amount` = 15000.00 AND `created_at` = '2026-08-20 11:23:58' AND COALESCE(`description`, '') = 'Biaya Admin Bank BCA April'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'Faizal', 500000.00, 'BIaya Transport Faizal dan Raihan ke Cianjur', '2026-04-21', 7, '2026-08-20 11:25:13', NULL, 'https://drive.google.com/file/d/1BeP9vnqWdfA8JWxz_T5sFKdok7uk8Spv/view?usp=drive_link', 'Transfer', 'Faizal', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-21' AND `amount` = 500000.00 AND `created_at` = '2026-08-20 11:25:13' AND COALESCE(`description`, '') = 'BIaya Transport Faizal dan Raihan ke Cianjur'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 45000.00, 'Pembelian Materai dan Alat pembersih Kloset', '2026-04-22', 7, '2026-08-20 11:29:11', NULL, 'https://drive.google.com/file/d/1xPzchWys1mokURo_x3xuxl5-K_tx8N7Y/view?usp=drive_link', 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 45000.00 AND `created_at` = '2026-08-20 11:29:11' AND COALESCE(`description`, '') = 'Pembelian Materai dan Alat pembersih Kloset'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'TB Hanjaya', 425000.00, 'Pembelian Kabel Panel HItam 4 x6 ml ( 5 Meter )', '2026-04-22', 7, '2026-08-20 11:30:54', NULL, 'https://drive.google.com/file/d/1oMs9WWx9ViwdarX3l6oX_r4ClgHhmGS9/view?usp=drive_link', 'Transfer', 'TB Hanjaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 425000.00 AND `created_at` = '2026-08-20 11:30:54' AND COALESCE(`description`, '') = 'Pembelian Kabel Panel HItam 4 x6 ml ( 5 Meter )'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Surya Plastik', 25000.00, 'Pembelian Trashbag 60 x 100 ( 1 pak )', '2026-04-22', 7, '2026-08-20 11:37:50', NULL, 'https://drive.google.com/file/d/10ckWBuEHXpaMeOFcijPbBobJGQPK1QW1/view?usp=drive_link', 'Cash', 'Toko Surya Plastik', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 25000.00 AND `created_at` = '2026-08-20 11:37:50' AND COALESCE(`description`, '') = 'Pembelian Trashbag 60 x 100 ( 1 pak )'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'M. Anwar Roziqin (LPK SAMIT)', 600000.00, 'Pemasangan Sandblast & Gorden', '2026-04-22', 7, '2026-08-20 11:42:18', NULL, 'https://drive.google.com/file/d/1yYwdxQWJKIISR_vEMlJB4prP1FbnalAn/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 600000.00 AND `created_at` = '2026-08-20 11:42:18' AND COALESCE(`description`, '') = 'Pemasangan Sandblast & Gorden'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Faizal', 46000.00, 'Pembelian Kopi Cup Indomaret untuk seluruh tim', '2026-04-22', 7, '2026-08-20 11:46:31', NULL, 'https://drive.google.com/file/d/1MRA9wHjSkca2Kwkv2CAXRg_zGlcI2R8C/view?usp=drive_link', 'Transfer', 'Faizal', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 46000.00 AND `created_at` = '2026-08-20 11:46:31' AND COALESCE(`description`, '') = 'Pembelian Kopi Cup Indomaret untuk seluruh tim'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 11500.00, 'Pembelian Materai 10000 x1', '2026-04-22', 7, '2026-08-20 11:49:13', NULL, 'https://drive.google.com/file/d/1DNdwSk8C7p3LIHk7D1sf2IIJLA99NYof/view?usp=drive_link', 'Cash', 'Alfamart', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 11500.00 AND `created_at` = '2026-08-20 11:49:13' AND COALESCE(`description`, '') = 'Pembelian Materai 10000 x1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Siti Nurhatifah', 1000000.00, 'Peminjaman dari Bu Tiffa', '2026-04-22', 7, '2026-08-20 11:52:10', NULL, 'https://drive.google.com/file/d/1BcO64L8_-egITvAsv7qIGyMkSNjalsiD/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-22' AND `amount` = 1000000.00 AND `created_at` = '2026-08-20 11:52:10' AND COALESCE(`description`, '') = 'Peminjaman dari Bu Tiffa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 24000.00, 'Pembelian Kuota Zoom April - Mei', '2026-04-24', 7, '2026-08-20 11:56:13', NULL, NULL, 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-24' AND `amount` = 24000.00 AND `created_at` = '2026-08-20 11:56:13' AND COALESCE(`description`, '') = 'Pembelian Kuota Zoom April - Mei'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 6000000.00, 'Modal Saham', '2026-04-25', 2, '2026-08-18 15:09:42', NULL, 'https://drive.google.com/file/d/1yMnJHSyH4yuUDeG1qG6wIuc1EScaBDBZ/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-25' AND `amount` = 6000000.00 AND `created_at` = '2026-08-18 15:09:42' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 3160000.00, 'Gaji Staff Administrasi April 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 8 Jam', '2026-04-25', 7, '2026-08-20 11:57:33', NULL, 'https://drive.google.com/file/d/1LpqiKUwnc9tkW8q882QJIlBVq4cLrE2z/view?usp=drivesdk', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-25' AND `amount` = 3160000.00 AND `created_at` = '2026-08-20 11:57:33' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi April 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 8 Jam'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Fitri', 2062500.00, 'Gaji Staff Pengajar Sensei Maret 2026\nCatatan: Hari Kerja : 25 Hari Jam Lembur : 3 Jam Tambahan biaya admin : 2.500', '2026-04-25', 7, '2026-08-20 11:59:26', NULL, 'https://drive.google.com/file/d/1JmuPm5dTXjyYEuz1yfaIK8oEybBe_yLM/view?usp=drivesdk', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-25' AND `amount` = 2062500.00 AND `created_at` = '2026-08-20 11:59:26' AND COALESCE(`description`, '') = 'Gaji Staff Pengajar Sensei Maret 2026\nCatatan: Hari Kerja : 25 Hari Jam Lembur : 3 Jam Tambahan biaya admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'A Alfin', 1002500.00, 'BIaya Intensif Pak Alfin\nCatatan: Tambahan biaya admin : 2.500', '2026-04-25', 7, '2026-08-20 12:01:00', NULL, 'https://drive.google.com/file/d/1_mRaUEMqSWKzeGQn5pvU1MONT4oekVW9/view?usp=drivesdk', 'Transfer', 'A Alfin', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-25' AND `amount` = 1002500.00 AND `created_at` = '2026-08-20 12:01:00' AND COALESCE(`description`, '') = 'BIaya Intensif Pak Alfin\nCatatan: Tambahan biaya admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ahmad Kodir ( PLN )', 502500.00, 'Biaya Jasa Instalasi MCB Ruko B1\nCatatan: admin 2.500', '2026-04-27', 7, '2026-08-20 12:02:55', NULL, 'https://drive.google.com/file/d/1JLz3VFnfQ4wP70fPafiZRDdExHzSpa_P/view?usp=drivesdk', 'Transfer', 'Ahmad Kodir ( PLN )', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-27' AND `amount` = 502500.00 AND `created_at` = '2026-08-20 12:02:55' AND COALESCE(`description`, '') = 'Biaya Jasa Instalasi MCB Ruko B1\nCatatan: admin 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'TB Hanjaya', 630000.00, 'Pembelian MCB Merk Schneider 16A x2 dan 10A x5 untuk Ruko B1', '2026-04-27', 7, '2026-08-20 12:04:40', NULL, 'https://drive.google.com/file/d/1T1HVJt3NcfWb0wG5sVori73W6wEKtiVn/view?usp=drivesdk', 'Transfer', 'TB Hanjaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-27' AND `amount` = 630000.00 AND `created_at` = '2026-08-20 12:04:40' AND COALESCE(`description`, '') = 'Pembelian MCB Merk Schneider 16A x2 dan 10A x5 untuk Ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'STRIZ (Risky Eka Tama)', 127500.00, 'Pembuatan Baju Sample Creativa untuk Staff\nCatatan: Tambahan biaya admin : 2.500', '2026-04-29', 7, '2026-08-20 12:06:03', NULL, 'https://drive.google.com/file/d/17WXYCfmLvGI64iUutOyAqiX3KxoOij50/view?usp=drive_link', 'Transfer', 'STRIZ (Risky Eka Tama)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-29' AND `amount` = 127500.00 AND `created_at` = '2026-08-20 12:06:03' AND COALESCE(`description`, '') = 'Pembuatan Baju Sample Creativa untuk Staff\nCatatan: Tambahan biaya admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 22500000.00, 'Modal Saham', '2026-04-30', 2, '2026-08-18 15:10:30', NULL, 'https://drive.google.com/file/d/12vPH_pRnyZCKEvw8lTpgNQwe0-_X-W1f/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-30' AND `amount` = 22500000.00 AND `created_at` = '2026-08-18 15:10:30' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'BCA', 67.00, 'Bunga dari ATM BCA', '2026-04-30', 2, '2026-08-18 15:11:19', NULL, NULL, 'Transfer', 'BCA', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-04-30' AND `amount` = 67.00 AND `created_at` = '2026-08-18 15:11:19' AND COALESCE(`description`, '') = 'Bunga dari ATM BCA'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Gopay', 53500.00, 'Pembelian Token Asrama Rumah\nCatatan: Tambahan biaya admin : 1.000', '2026-04-30', 7, '2026-08-20 12:09:08', NULL, 'https://drive.google.com/file/d/1iWINMja0twDGV0WciTqlKkkqH4RXPmde/view?usp=drive_link', 'Transfer', 'Gopay', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-30' AND `amount` = 53500.00 AND `created_at` = '2026-08-20 12:09:08' AND COALESCE(`description`, '') = 'Pembelian Token Asrama Rumah\nCatatan: Tambahan biaya admin : 1.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin (LPK SAMIT)', 5108000.00, 'Pembelian Bahan untuk Instalasi AC Ruko B1 dan B2\nCatatan: Pembelian Pipa AC hoda 1/4 1.2 (26m), Kabel eterna 3 x 1,5 / roll (50m), Pipa pembuangan air (28m), Braket AC 2pk (2 set), Dinabol (2set), Ductip lem (8pcs), Ductip biasa (4pcs)', '2026-04-30', 7, '2026-08-20 12:11:04', NULL, 'https://drive.google.com/file/d/19P9Q01LPyeNO4ULf3SzYqCJBYA6ryqhX/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-30' AND `amount` = 5108000.00 AND `created_at` = '2026-08-20 12:11:04' AND COALESCE(`description`, '') = 'Pembelian Bahan untuk Instalasi AC Ruko B1 dan B2\nCatatan: Pembelian Pipa AC hoda 1/4 1.2 (26m), Kabel eterna 3 x 1,5 / roll (50m), Pipa pembuangan air (28m), Braket AC 2pk (2 set), Dinabol (2set), Ductip lem (8pcs), Ductip biasa (4pcs)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'BCA', 13.00, 'Pajak Bunga dari BCA', '2026-04-30', 7, '2026-08-20 12:12:50', NULL, NULL, 'Transfer', 'BCA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-04-30' AND `amount` = 13.00 AND `created_at` = '2026-08-20 12:12:50' AND COALESCE(`description`, '') = 'Pajak Bunga dari BCA'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Wijaya Material / Anwar', 1200000.00, 'Pembelian Ducting Pipa AC (12m)', '2026-05-02', 7, '2026-08-20 14:10:45', NULL, 'https://drive.google.com/file/d/16MUGmKvtvZb11I49JX4Y3yRGqKDG1wbg/view?usp=drive_link', 'Transfer', 'Wijaya Material / Anwar', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-02' AND `amount` = 1200000.00 AND `created_at` = '2026-08-20 14:10:45' AND COALESCE(`description`, '') = 'Pembelian Ducting Pipa AC (12m)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 30000.00, 'Pembuatan Sample Nafuda dan Lanyard Creativa', '2026-05-02', 7, '2026-08-20 14:11:48', NULL, 'https://drive.google.com/file/d/1bwWEsY7FbL62zhXre9YuhjuqZtXvTIxy/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-02' AND `amount` = 30000.00 AND `created_at` = '2026-08-20 14:11:48' AND COALESCE(`description`, '') = 'Pembuatan Sample Nafuda dan Lanyard Creativa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Faizal', 100000.00, 'Pembelian Nomor Bisnis untuk Akuntansi', '2026-05-03', 7, '2026-08-20 14:13:08', NULL, 'https://drive.google.com/file/d/18CPyi5_VL29qQoxdCdqj3Bj_arVOUcAz/view?usp=drive_link', 'Transfer', 'Faizal', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-03' AND `amount` = 100000.00 AND `created_at` = '2026-08-20 14:13:08' AND COALESCE(`description`, '') = 'Pembelian Nomor Bisnis untuk Akuntansi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'M. Anwar Roziqin (LPK SAMIT)', 880000.00, 'Biaya Transportasi Kebutuhan AC ke Cianjur\nCatatan: Tambahan biaya tol : 200.000\r\nTotal pembulatan biaya ongkir : 880.000', '2026-05-03', 7, '2026-08-20 14:14:36', NULL, 'https://drive.google.com/file/d/1zUMZMhMOci_Fd7udt0AQGd_FMlINcCHH/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-03' AND `amount` = 880000.00 AND `created_at` = '2026-08-20 14:14:36' AND COALESCE(`description`, '') = 'Biaya Transportasi Kebutuhan AC ke Cianjur\nCatatan: Tambahan biaya tol : 200.000\r\nTotal pembulatan biaya ongkir : 880.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'Faizal', 200000.00, 'BIaya Transportasi Faizal Ke LPK SAMIT', '2026-05-04', 7, '2026-08-20 14:16:00', NULL, 'https://drive.google.com/file/d/1Zz42L-dx7ZRJ4xLeRmHTxSy5E_2geLfL/view?usp=drive_link', 'Transfer', 'Faizal', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-04' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 14:16:00' AND COALESCE(`description`, '') = 'BIaya Transportasi Faizal Ke LPK SAMIT'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'Raihan', 200000.00, 'Biaya Transportasi Raihan ke LPK SAMIT', '2026-05-04', 7, '2026-08-20 14:16:43', NULL, 'https://drive.google.com/file/d/1gqPrEQcqwBN5XgHfbqzDwfbWWOshT3_T/view?usp=drive_link', 'Transfer', 'Raihan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-04' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 14:16:43' AND COALESCE(`description`, '') = 'Biaya Transportasi Raihan ke LPK SAMIT'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Transportasi', 'Ramsya', 250000.00, 'Biaya Transportasi Ramsya ke LPK SAMIT', '2026-05-04', 7, '2026-08-20 14:18:51', NULL, 'https://drive.google.com/file/d/10l0FaYywmdOO5jfN2F5YWVBivHgQRJHh/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-04' AND `amount` = 250000.00 AND `created_at` = '2026-08-20 14:18:51' AND COALESCE(`description`, '') = 'Biaya Transportasi Ramsya ke LPK SAMIT'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Fitri', 202500.00, 'Kasbon ke kas Creativa untuk Transportasi ke Cianjur\nCatatan: Tambahan biaya admin : 2.500', '2026-05-04', 7, '2026-08-20 14:23:49', NULL, 'https://drive.google.com/file/d/1BgMUwCuIaFzk7OZntWNktGaHnkhRzkt_/view?usp=drive_link', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-04' AND `amount` = 202500.00 AND `created_at` = '2026-08-20 14:23:49' AND COALESCE(`description`, '') = 'Kasbon ke kas Creativa untuk Transportasi ke Cianjur\nCatatan: Tambahan biaya admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Nando Digital Textile (Deni I.)', 100000.00, 'Pembuatan Baju Sample Creativa untuk Siswa', '2026-05-04', 7, '2026-08-20 14:25:01', NULL, 'https://drive.google.com/file/d/1EBFHPD6sqJCnXIhiSQ_w8CVt9UWXZnlu/view?usp=drive_link', 'Transfer', 'Nando Digital Textile (Deni I.)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-04' AND `amount` = 100000.00 AND `created_at` = '2026-08-20 14:25:01' AND COALESCE(`description`, '') = 'Pembuatan Baju Sample Creativa untuk Siswa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'BCA', 12500.00, 'Pencetakan Rekening Koran untuk Akuntansi', '2026-05-05', 7, '2026-08-20 14:26:25', NULL, 'https://drive.google.com/file/d/1okAvb9Zj9-TFRh92LQi_aIr1VNxJ9QKH/view?usp=drive_link', 'Transfer', 'BCA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-05' AND `amount` = 12500.00 AND `created_at` = '2026-08-20 14:26:25' AND COALESCE(`description`, '') = 'Pencetakan Rekening Koran untuk Akuntansi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 50000.00, 'Membuat surat keterangan domisili dari desa untuk persyaratan legalitas', '2026-05-08', 7, '2026-08-20 14:27:19', NULL, 'https://drive.google.com/file/d/16MlckvDYqGQqusy1jYPY9iZx95JPLXDj/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-08' AND `amount` = 50000.00 AND `created_at` = '2026-08-20 14:27:19' AND COALESCE(`description`, '') = 'Membuat surat keterangan domisili dari desa untuk persyaratan legalitas'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Anwar Sensei', 2440000.00, 'Pemasangan AC', '2026-05-09', 7, '2026-08-20 14:27:50', NULL, 'https://drive.google.com/file/d/1B15asG8koG1rhWKOtwkWE7qGf5TkjJiN/view?usp=drive_link', 'Cash', 'Anwar Sensei', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-09' AND `amount` = 2440000.00 AND `created_at` = '2026-08-20 14:27:50' AND COALESCE(`description`, '') = 'Pemasangan AC'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'LPK SAMIT', 10000000.00, 'DP Partisi Kantor dan Kelas Ruko B1 dan B2', '2026-05-09', 7, '2026-08-20 14:45:23', NULL, 'https://drive.google.com/file/d/1r2yxSS-dCgEwU8WFF-0KYBH200XBDPyw/view?usp=drive_link', 'Transfer', 'LPK SAMIT', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-09' AND `amount` = 10000000.00 AND `created_at` = '2026-08-20 14:45:23' AND COALESCE(`description`, '') = 'DP Partisi Kantor dan Kelas Ruko B1 dan B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 103000.00, 'Pembelian Token Ruko/Kantor', '2026-05-10', 2, '2026-08-18 15:12:49', NULL, 'https://drive.google.com/file/d/14gDRjnbdzmWFW0F75nwPHC69v1wgnzwk/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-10' AND `amount` = 103000.00 AND `created_at` = '2026-08-18 15:12:49' AND COALESCE(`description`, '') = 'Pembelian Token Ruko/Kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin (LPK SAMIT)', 45000.00, 'Pembelian Skrup(50pcs) dan Fischer(50pcs)\nCatatan: Sudah sempat dibayar 1.200.000 ditanggal 02 Mei 2026, \r\nDan ini ada biaya tambahan sebesar 45.000', '2026-05-10', 7, '2026-08-20 14:46:41', NULL, 'https://drive.google.com/file/d/16MUGmKvtvZb11I49JX4Y3yRGqKDG1wbg/view?usp=drivesdk', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-10' AND `amount` = 45000.00 AND `created_at` = '2026-08-20 14:46:41' AND COALESCE(`description`, '') = 'Pembelian Skrup(50pcs) dan Fischer(50pcs)\nCatatan: Sudah sempat dibayar 1.200.000 ditanggal 02 Mei 2026, \r\nDan ini ada biaya tambahan sebesar 45.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'M. Anwar Roziqin (LPK SAMIT)', 103000.00, 'Pembelian Token Ruko B1 / Kantor\nCatatan: Bukti TF pembelian Token dan Skrup dan fischer AC', '2026-05-10', 7, '2026-08-20 14:48:42', NULL, 'https://drive.google.com/file/d/1nn4_kJigIySkXatU_vLOowNyyxrObUwX/view?usp=drivesdk', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-10' AND `amount` = 103000.00 AND `created_at` = '2026-08-20 14:48:42' AND COALESCE(`description`, '') = 'Pembelian Token Ruko B1 / Kantor\nCatatan: Bukti TF pembelian Token dan Skrup dan fischer AC'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 60000000.00, 'Modal Saham', '2026-05-11', 2, '2026-08-18 15:14:05', NULL, 'https://drive.google.com/file/d/1_ME3P_Dt2C3-rnMUxuGlxu0p9beVDxu8/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-11' AND `amount` = 60000000.00 AND `created_at` = '2026-08-18 15:14:05' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kelas', 'Shopee', 672526.00, 'Pembelian Papan Tulis Tempel (Keiko) 120 × 180', '2026-05-12', 7, '2026-08-20 15:02:33', NULL, 'https://drive.google.com/file/d/1lPfP0vABgH08wE-VmD_2ac6oljd8fCuw/view?usp=drivesdk', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-12' AND `amount` = 672526.00 AND `created_at` = '2026-08-20 15:02:33' AND COALESCE(`description`, '') = 'Pembelian Papan Tulis Tempel (Keiko) 120 × 180'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Karya Malik', 110000.00, 'Pembuatan 2 Stempel Creativa', '2026-05-12', 7, '2026-08-20 15:04:03', NULL, 'https://drive.google.com/file/d/1dXfmHY3T2d-3_vDO1L93BwZH1lJ_Av1O/view?usp=drivesdk', 'Transfer', 'Karya Malik', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-12' AND `amount` = 110000.00 AND `created_at` = '2026-08-20 15:04:03' AND COALESCE(`description`, '') = 'Pembuatan 2 Stempel Creativa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Gopay', 101000.00, 'Pembelian Token Asrama Rumah\nCatatan: Biaya admin 1000', '2026-05-13', 7, '2026-08-20 15:07:48', NULL, 'https://drive.google.com/file/d/1xPARKEIw6NNrjfsyIfaNPKdDs_qGbex4/view?usp=drivesdk', 'Transfer', 'Gopay', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-13' AND `amount` = 101000.00 AND `created_at` = '2026-08-20 15:07:48' AND COALESCE(`description`, '') = 'Pembelian Token Asrama Rumah\nCatatan: Biaya admin 1000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'LPK SAMIT', 36000000.00, 'Pelunasan Renovasi Ruko B1 Kantor Creativa', '2026-05-13', 7, '2026-08-20 15:09:04', NULL, 'https://drive.google.com/file/d/130v26wHcOlxj4apLuafv-cXjmr4FTh_4/view?usp=drivesdk', 'Transfer', 'LPK SAMIT', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-13' AND `amount` = 36000000.00 AND `created_at` = '2026-08-20 15:09:04' AND COALESCE(`description`, '') = 'Pelunasan Renovasi Ruko B1 Kantor Creativa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kelas', 'LPK SAMIT', 26800000.00, 'DP Pembelian Set Kursi dan Meja', '2026-05-13', 7, '2026-08-20 15:12:33', NULL, 'https://drive.google.com/file/d/1cCBivpmfFrfH_l42FDh9y43QrV_XCMCf/view?usp=drivesdk', 'Transfer', 'LPK SAMIT', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-13' AND `amount` = 26800000.00 AND `created_at` = '2026-08-20 15:12:33' AND COALESCE(`description`, '') = 'DP Pembelian Set Kursi dan Meja'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 501750.00, 'Tambahan token kantor ruko B1', '2026-05-13', 7, '2026-08-20 15:14:56', NULL, 'https://drive.google.com/file/d/15QE_Dh0r5niEY-B4vGMF-xLLxmpwBX5m/view?usp=drivesdk', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-13' AND `amount` = 501750.00 AND `created_at` = '2026-08-20 15:14:56' AND COALESCE(`description`, '') = 'Tambahan token kantor ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Canva', 125000.00, 'Pembelian Canva Pro Mei 2026', '2026-05-14', 7, '2026-08-20 15:16:10', NULL, 'https://drive.google.com/file/d/1BWPAUSofVnaZLft2XZ7RAX6bmSz9NU1_/view?usp=drivesdk', 'Transfer', 'Canva', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-14' AND `amount` = 125000.00 AND `created_at` = '2026-08-20 15:16:10' AND COALESCE(`description`, '') = 'Pembelian Canva Pro Mei 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', NULL, 15000.00, 'Biaya Admin Bank BCA Mei', '2026-05-16', 7, '2026-08-20 15:19:28', NULL, NULL, 'Transfer', NULL, 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-16' AND `amount` = 15000.00 AND `created_at` = '2026-08-20 15:19:28' AND COALESCE(`description`, '') = 'Biaya Admin Bank BCA Mei'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 100000.00, 'Modal Saham', '2026-05-18', 2, '2026-08-18 15:17:00', NULL, 'https://drive.google.com/file/d/1sq-myxr0eZS-gLPMbvI-GAH32JWL3u5V/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-18' AND `amount` = 100000.00 AND `created_at` = '2026-08-18 15:17:00' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Bizznet', 721500.00, 'Instalasi Wi-Fi Kantor Ruko B1', '2026-05-18', 7, '2026-08-20 15:21:11', NULL, 'https://drive.google.com/file/d/1UODTs2ACfqeipc3qN8W-PzfD9_KNSvxO/view?usp=drivesdk', 'Transfer', 'Bizznet', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-18' AND `amount` = 721500.00 AND `created_at` = '2026-08-20 15:21:11' AND COALESCE(`description`, '') = 'Instalasi Wi-Fi Kantor Ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Ramsya', 121000.00, 'Biaya Tip Teknisi Wifi dan pembelian galon untuk tukang partisi\nCatatan: Tip Teknisi Wifi : 100.000\r\nBeli 1 Galon : 21.000', '2026-05-18', 7, '2026-08-20 15:22:25', NULL, 'https://drive.google.com/file/d/1IZ4W6EgU2clHmsi-Q1qmOlv5b5xtKc0a/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-18' AND `amount` = 121000.00 AND `created_at` = '2026-08-20 15:22:25' AND COALESCE(`description`, '') = 'Biaya Tip Teknisi Wifi dan pembelian galon untuk tukang partisi\nCatatan: Tip Teknisi Wifi : 100.000\r\nBeli 1 Galon : 21.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 300000.00, 'Modal Saham', '2026-05-19', 2, '2026-08-18 15:18:39', NULL, 'https://drive.google.com/file/d/1DStXY-0pWG3DebPMTU4Fq3NCXCpxvxsP/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-19' AND `amount` = 300000.00 AND `created_at` = '2026-08-18 15:18:39' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kelas', 'M. Anwar Roziqin (LPK SAMIT)', 1066900.00, 'Pemasangan Router untuk kelas lt 2\nCatatan: Pemasangan Router, Router Xiaomi + Kabel LAN cat6 (25m) + Ducting TC (5)\r\nKarna tidak ada di nota, tambahan :\r\nDucting TC (5) = 15.000 x 5 = 75.000', '2026-05-21', 7, '2026-08-20 15:25:20', NULL, 'https://drive.google.com/file/d/1Pq8nOEm0pqa8S2T1eAZy2wjDl80eschE/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-21' AND `amount` = 1066900.00 AND `created_at` = '2026-08-20 15:25:20' AND COALESCE(`description`, '') = 'Pemasangan Router untuk kelas lt 2\nCatatan: Pemasangan Router, Router Xiaomi + Kabel LAN cat6 (25m) + Ducting TC (5)\r\nKarna tidak ada di nota, tambahan :\r\nDucting TC (5) = 15.000 x 5 = 75.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin (LPK SAMIT)', 766000.00, 'Pembelian Lampu Sorot untuk B1 dan B2\nCatatan: Pembelian Hannocs Sorot 100W (2) + Kabel HYO Hitam 2 x 1,5 (10m) +Klem Paku Beton 8mm (2) + Dinabolt (4)', '2026-05-21', 7, '2026-08-20 15:26:58', NULL, 'https://drive.google.com/file/d/113c37yjDAs3a39TIN7T7b1uaNrnnSa5J/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-21' AND `amount` = 766000.00 AND `created_at` = '2026-08-20 15:26:58' AND COALESCE(`description`, '') = 'Pembelian Lampu Sorot untuk B1 dan B2\nCatatan: Pembelian Hannocs Sorot 100W (2) + Kabel HYO Hitam 2 x 1,5 (10m) +Klem Paku Beton 8mm (2) + Dinabolt (4)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin (LPK SAMIT)', 98000.00, 'Pembelian Kabel Eterna 2 x 1,5 (7m)', '2026-05-21', 7, '2026-08-20 15:31:18', NULL, 'https://drive.google.com/file/d/119o8FDlQj7vegx_tzrE4WOn7Ety7oHEk/view?usp=drive_link', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-21' AND `amount` = 98000.00 AND `created_at` = '2026-08-20 15:31:18' AND COALESCE(`description`, '') = 'Pembelian Kabel Eterna 2 x 1,5 (7m)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 2000000.00, 'Modal Saham', '2026-05-22', 2, '2026-08-18 15:19:14', NULL, 'https://drive.google.com/file/d/1hm81m2ALSMTC_hKi9TqyAs6u21Xc3gC9/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-22' AND `amount` = 2000000.00 AND `created_at` = '2026-08-18 15:19:14' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Anggi Alfin', 5780000.00, 'Modal Saham', '2026-05-25', 2, '2026-08-18 15:22:11', NULL, 'https://drive.google.com/file/d/1VdK67CO_k0Og9tQQqXflIKJ1atjE7Y0C/view?usp=drive_link', 'Transfer', 'Anggi Alfin', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-25' AND `amount` = 5780000.00 AND `created_at` = '2026-08-18 15:22:11' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 3180000.00, 'Gaji Staff Administrasi Mei 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 4 Jam\r\nInsentif : 100.000', '2026-05-25', 7, '2026-08-20 15:32:39', NULL, 'https://drive.google.com/file/d/1kydggENXo3lYZ_B189vn5Zu-FjuRElTY/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-25' AND `amount` = 3180000.00 AND `created_at` = '2026-08-20 15:32:39' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi Mei 2026\nCatatan: Hari Kerja : 25 Hari\r\nJam Lembur : 4 Jam\r\nInsentif : 100.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Fitri', 2005000.00, 'Gaji Pengajar (Sensei) Mei 2026\nCatatan: Tambahan biaya admin : 5.000', '2026-05-25', 7, '2026-08-20 15:33:56', NULL, 'https://drive.google.com/file/d/12Wg_qCsMM6MWCrx3ReaPsOWlKRsl43_H/view?usp=drive_link', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-25' AND `amount` = 2005000.00 AND `created_at` = '2026-08-20 15:33:56' AND COALESCE(`description`, '') = 'Gaji Pengajar (Sensei) Mei 2026\nCatatan: Tambahan biaya admin : 5.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Faizal', 200000.00, 'Uang Saku dari Creativa untuk Faizal', '2026-05-25', 7, '2026-08-20 15:35:19', NULL, 'https://drive.google.com/file/d/1sbAQhTmO56QihnlXRwOZFu1JOX-k39X7/view?usp=drive_link', 'Transfer', 'Faizal', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-25' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 15:35:19' AND COALESCE(`description`, '') = 'Uang Saku dari Creativa untuk Faizal'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Raihan', 200000.00, 'Uang saku dari Creativa untuk Raihan', '2026-05-25', 7, '2026-08-20 15:38:56', NULL, 'https://drive.google.com/file/d/159fAjB3Lw5u283hvYLYU-WzbQHZRnO1K/view?usp=drive_link', 'Transfer', 'Raihan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-25' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 15:38:56' AND COALESCE(`description`, '') = 'Uang saku dari Creativa untuk Raihan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Navrida', 202500.00, 'Uang saku dari Creativa Navrida\nCatatan: Tambahan biaya admin : 2.500', '2026-05-25', 7, '2026-08-20 15:40:22', NULL, 'https://drive.google.com/file/d/1ueywlmg2KpgLmjxrzoY3OcDedfCbAs8r/view?usp=drive_link', 'Transfer', 'Navrida', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-25' AND `amount` = 202500.00 AND `created_at` = '2026-08-20 15:40:22' AND COALESCE(`description`, '') = 'Uang saku dari Creativa Navrida\nCatatan: Tambahan biaya admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 11500.00, 'Pembelian Materai 10000 untuk keperluan MOU', '2026-05-26', 7, '2026-08-20 15:41:21', NULL, 'https://drive.google.com/file/d/1Q9XwZRT_EKfGxx18aadVjhqHxpYSGeso/view?usp=drivesdk', 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-05-26' AND `amount` = 11500.00 AND `created_at` = '2026-08-20 15:41:21' AND COALESCE(`description`, '') = 'Pembelian Materai 10000 untuk keperluan MOU'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 12000000.00, 'Modal Saham', '2026-05-30', 2, '2026-08-18 15:23:02', NULL, 'https://drive.google.com/file/d/1ByWXupmtwhrEkMLsSXWk5XAdrvND1jUq/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-05-30' AND `amount` = 12000000.00 AND `created_at` = '2026-08-18 15:23:02' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee Zoom', 23000.00, 'Pembelian Kuota Zoom Meeting Pro', '2026-06-01', 7, '2026-08-20 15:43:37', NULL, 'https://drive.google.com/file/d/1VT2uCmIQPrpY0rh4Obi9_rzyIxvTAxmh/view?usp=drive_link', 'Transfer', 'Shopee Zoom', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-01' AND `amount` = 23000.00 AND `created_at` = '2026-08-20 15:43:37' AND COALESCE(`description`, '') = 'Pembelian Kuota Zoom Meeting Pro'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 100000.00, 'Pengisian Token Kantor / Ruko B1  bulan Juni', '2026-06-02', 7, '2026-08-20 15:44:40', NULL, 'https://drive.google.com/file/d/1HrRCnKDY1rTn-KHdOEkasXcR3sKJqXif/view?usp=drive_link', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-02' AND `amount` = 100000.00 AND `created_at` = '2026-08-20 15:44:40' AND COALESCE(`description`, '') = 'Pengisian Token Kantor / Ruko B1  bulan Juni'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Shopee', 100000.00, 'Pengisian Token Asrama bulan Juni', '2026-06-02', 7, '2026-08-20 15:46:08', NULL, 'https://drive.google.com/file/d/1T0B46Qc0Ngc27Yy5Xi6m1H2lIwDTclDK/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-02' AND `amount` = 100000.00 AND `created_at` = '2026-08-20 15:46:08' AND COALESCE(`description`, '') = 'Pengisian Token Asrama bulan Juni'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'BCA', 15000.00, 'BIaya admin Bank BCA Juni', '2026-06-02', 7, '2026-08-20 15:47:49', NULL, NULL, 'Transfer', 'BCA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-02' AND `amount` = 15000.00 AND `created_at` = '2026-08-20 15:47:49' AND COALESCE(`description`, '') = 'BIaya admin Bank BCA Juni'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Faizal', 30000.00, 'Pembelian Slot Pintu  Toilet (2)\nCatatan: Harga satuan slot pintu = 15.000\r\n15.000 x 2 = 30.000', '2026-06-05', 7, '2026-08-20 15:49:14', NULL, 'https://drive.google.com/file/d/1ZMGtgrY5sIjgKL-bw51Y5zQlStE45I8M/view?usp=drivesdk', 'Transfer', 'Faizal', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 30000.00 AND `created_at` = '2026-08-20 15:49:14' AND COALESCE(`description`, '') = 'Pembelian Slot Pintu  Toilet (2)\nCatatan: Harga satuan slot pintu = 15.000\r\n15.000 x 2 = 30.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Yul Toko 2', 467500.00, 'Pembelian alat kebersihan untuk kantor dan kelas\nCatatan: Pembelian Pengki (2), Ember (2), Ember (2), Kapstok, Rak Gantung (1), Sikat Bebek (2), Gayung (2), Wefer Kaca (2), Sapu Lidi, Pel Karet, Sapu Ijuk (3), Mop Pel (3), Sikat Tongkat Panjang', '2026-06-05', 7, '2026-08-20 15:51:06', NULL, 'https://drive.google.com/file/d/1Qr7INLaMBKNv9hxRIFyRI7WwbnX7FE5r/view?usp=drivesdk', 'Transfer', 'Yul Toko 2', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 467500.00 AND `created_at` = '2026-08-20 15:51:06' AND COALESCE(`description`, '') = 'Pembelian alat kebersihan untuk kantor dan kelas\nCatatan: Pembelian Pengki (2), Ember (2), Ember (2), Kapstok, Rak Gantung (1), Sikat Bebek (2), Gayung (2), Wefer Kaca (2), Sapu Lidi, Pel Karet, Sapu Ijuk (3), Mop Pel (3), Sikat Tongkat Panjang'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 153700.00, 'Pembelian alat kebersihan toilet\nCatatan: Pembelian Paperbag Alfamart, Vixal (2), Pengharum Toilet Bola (2), Wipol, Soklin Apel, Soklin Lemon, Glade Escape', '2026-06-05', 7, '2026-08-20 15:53:11', NULL, 'https://drive.google.com/file/d/1bnIbqPLVMdHgVzbJHZKeMAWQ9mlCBTQ8/view?usp=drivesdk', 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 153700.00 AND `created_at` = '2026-08-20 15:53:11' AND COALESCE(`description`, '') = 'Pembelian alat kebersihan toilet\nCatatan: Pembelian Paperbag Alfamart, Vixal (2), Pengharum Toilet Bola (2), Wipol, Soklin Apel, Soklin Lemon, Glade Escape'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'alfamart', 168400.00, 'Pembelian Sabun Cuci Tangan (2), Stella Alat + Refill, WLS, Stella', '2026-06-05', 7, '2026-08-20 15:56:31', NULL, 'https://drive.google.com/file/d/1Z3iH9ii8-nSvcEw7RxggMMGoSLECzoLr/view?usp=drivesdk', 'Transfer', 'alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 168400.00 AND `created_at` = '2026-08-20 15:56:31' AND COALESCE(`description`, '') = 'Pembelian Sabun Cuci Tangan (2), Stella Alat + Refill, WLS, Stella'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'alfamart', 33000.00, 'Pembelian Alfamart Totebag, Aqua 600ml (6), Tisu\nCatatan: Pembelian ini untuk Kebutuhan Disnaker', '2026-06-05', 7, '2026-08-20 15:57:48', NULL, 'https://drive.google.com/file/d/1fsHD-PQBOtrOw-GVqR7LGU9Hx-XVwtrT/view?usp=drivesdk', 'Transfer', 'alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 33000.00 AND `created_at` = '2026-08-20 15:57:48' AND COALESCE(`description`, '') = 'Pembelian Alfamart Totebag, Aqua 600ml (6), Tisu\nCatatan: Pembelian ini untuk Kebutuhan Disnaker'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indomaret', 148700.00, 'Pembelian Rokok dan Parfum untuk disnaker\nCatatan: Pembelian ini untuk Kebutuhan Disnaker', '2026-06-05', 7, '2026-08-20 16:25:10', NULL, 'https://drive.google.com/file/d/1DIqEcT-zpL1V9rUNZMWUzMVyjCQULKse/view?usp=drivesdk', 'Transfer', 'Indomaret', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 148700.00 AND `created_at` = '2026-08-20 16:25:10' AND COALESCE(`description`, '') = 'Pembelian Rokok dan Parfum untuk disnaker\nCatatan: Pembelian ini untuk Kebutuhan Disnaker'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Kori Suripno', 400000.00, 'Pembayaran IPL dibulan Mei dan Juni\nCatatan: Harga perbulannya = 200.000\r\n200.000 x 2 = 400.000', '2026-06-05', 7, '2026-08-20 16:27:02', NULL, 'https://drive.google.com/file/d/1qQ2rc7bIO9TII0LL4qihmSL2-TLRDtPK/view?usp=drivesdk', 'Transfer', 'Kori Suripno', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-05' AND `amount` = 400000.00 AND `created_at` = '2026-08-20 16:27:02' AND COALESCE(`description`, '') = 'Pembayaran IPL dibulan Mei dan Juni\nCatatan: Harga perbulannya = 200.000\r\n200.000 x 2 = 400.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Nesya Reload', 45000.00, 'Pembelian Kepala Charger untuk Handphone Kantor', '2026-06-06', 7, '2026-08-20 16:29:04', NULL, 'https://drive.google.com/file/d/1hdMvUbjPs_0pru03pUGRg0b3R4kQSQIi/view?usp=drivesdk', 'Transfer', 'Nesya Reload', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-06' AND `amount` = 45000.00 AND `created_at` = '2026-08-20 16:29:04' AND COALESCE(`description`, '') = 'Pembelian Kepala Charger untuk Handphone Kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Fotocopy Saudara Nindira 1', 25000.00, 'Pembelian Map Kertas (5)\nCatatan: Harga satuan Map = 5.000\r\n5.000 x 5 = 25.000', '2026-06-08', 7, '2026-08-20 16:31:29', NULL, 'https://drive.google.com/file/d/19taS_fON1RojzdC-TWznNeGMYaWh5oTL/view?usp=drivesdk', 'Transfer', 'Fotocopy Saudara Nindira 1', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-08' AND `amount` = 25000.00 AND `created_at` = '2026-08-20 16:31:29' AND COALESCE(`description`, '') = 'Pembelian Map Kertas (5)\nCatatan: Harga satuan Map = 5.000\r\n5.000 x 5 = 25.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Mr. D.I.Y', 161700.00, 'Pembelian Alat Kantor dan Alat Kebersihan\nCatatan: Pembelian Keset Anyam (4), Stick Pad (2), Sticky Hook, Wall Clock, Baterai, Duster (2), Paperbag', '2026-06-08', 7, '2026-08-20 16:34:17', NULL, 'https://drive.google.com/file/d/1hGuEa9Z-8bn4U8vBBTlhImDsADzC6YXZ/view?usp=drivesdk', 'Transfer', 'Mr. D.I.Y', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-08' AND `amount` = 161700.00 AND `created_at` = '2026-08-20 16:34:17' AND COALESCE(`description`, '') = 'Pembelian Alat Kantor dan Alat Kebersihan\nCatatan: Pembelian Keset Anyam (4), Stick Pad (2), Sticky Hook, Wall Clock, Baterai, Duster (2), Paperbag'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Indomaret', 29000.00, 'Pembelian Kebutuhan Toilet Blue Clean\nCatatan: Pembelian Blue Clean (2)', '2026-06-08', 7, '2026-08-20 16:36:08', NULL, 'https://drive.google.com/file/d/1QsxS0zq5dY1z5Fyz0wIknaRZf_adIpmW/view?usp=drivesdk', 'Transfer', 'Indomaret', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-08' AND `amount` = 29000.00 AND `created_at` = '2026-08-20 16:36:08' AND COALESCE(`description`, '') = 'Pembelian Kebutuhan Toilet Blue Clean\nCatatan: Pembelian Blue Clean (2)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 551497.00, 'Pembelian Kotak sampah dan blue clean kantor dan kelas\nCatatan: Pembelian Kotak Sampah Warna - Warni (4), Kotak Sampah Biasa 15 liter, Blue Clean (4)', '2026-06-08', 7, '2026-08-20 16:37:32', NULL, 'https://drive.google.com/file/d/1CBqTCb0SL0xNqKemkkGxrhIpQYBwgppS/view?usp=drivesdk', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-08' AND `amount` = 551497.00 AND `created_at` = '2026-08-20 16:37:32' AND COALESCE(`description`, '') = 'Pembelian Kotak sampah dan blue clean kantor dan kelas\nCatatan: Pembelian Kotak Sampah Warna - Warni (4), Kotak Sampah Biasa 15 liter, Blue Clean (4)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 23600.00, 'Pembelian galon untuk kantor', '2026-06-09', 7, '2026-08-20 16:39:10', NULL, 'https://drive.google.com/file/d/1gfKP8W5h-w3yXYWu8VAfnnHPcf9pCGmL/view?usp=drivesdk', 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-09' AND `amount` = 23600.00 AND `created_at` = '2026-08-20 16:39:10' AND COALESCE(`description`, '') = 'Pembelian galon untuk kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Besi Panembong Baja', 40000.00, 'Pembelian Mata Bor dan Skrup', '2026-06-09', 7, '2026-08-20 16:40:07', NULL, 'https://drive.google.com/file/d/1k8NU2GPKnM_lP-JXGcUFD08ZZTFbvxel/view?usp=drivesdk', 'Transfer', 'Toko Besi Panembong Baja', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-09' AND `amount` = 40000.00 AND `created_at` = '2026-08-20 16:40:07' AND COALESCE(`description`, '') = 'Pembelian Mata Bor dan Skrup'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 31000.00, 'Pembelian Kabel Ties dan Pembasmi Serangga HIT\nCatatan: Harga pembelian Kabel Ties dan HIT = 25.700\r\n30.000 - 24.700 = 5.300. Sisanya ada di Gopay Fitri\r\nTambahan Biaya admin 1.000', '2026-06-09', 7, '2026-08-20 16:43:00', NULL, 'https://drive.google.com/file/d/1awOR8DyngfqKRXtaXb1QXOthQLLMYptu/view?usp=drivesdk', 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-09' AND `amount` = 31000.00 AND `created_at` = '2026-08-20 16:43:00' AND COALESCE(`description`, '') = 'Pembelian Kabel Ties dan Pembasmi Serangga HIT\nCatatan: Harga pembelian Kabel Ties dan HIT = 25.700\r\n30.000 - 24.700 = 5.300. Sisanya ada di Gopay Fitri\r\nTambahan Biaya admin 1.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Pak Kori', 120000.00, 'Biaya Jasa Pembersihan Toren ruko B1 (Kantor)', '2026-06-09', 7, '2026-08-20 16:44:05', NULL, 'https://drive.google.com/file/d/1i4mfKOkkJNTTfGh7zmVpc3LBtwHytyvu/view?usp=drivesdk', 'Transfer', 'Pak Kori', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-09' AND `amount` = 120000.00 AND `created_at` = '2026-08-20 16:44:05' AND COALESCE(`description`, '') = 'Biaya Jasa Pembersihan Toren ruko B1 (Kantor)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M Nuh Iskandar D', 1400000.00, 'Pembelian Apar 2 Tabung\nCatatan: Harga Satuan Apar = 680.000\r\n680.000 x 2 = 1.360.000\r\nDibulatkan menjadi 1.400.000', '2026-06-12', 7, '2026-08-20 16:47:16', NULL, 'https://drive.google.com/file/d/1E6Zh2kAwjYLixBQbQrgadRK9BWemZ8tS/view?usp=drivesdk', 'Transfer', 'M Nuh Iskandar D', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-12' AND `amount` = 1400000.00 AND `created_at` = '2026-08-20 16:47:16' AND COALESCE(`description`, '') = 'Pembelian Apar 2 Tabung\nCatatan: Harga Satuan Apar = 680.000\r\n680.000 x 2 = 1.360.000\r\nDibulatkan menjadi 1.400.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'STRIZ (Risky Eka Tama)', 912500.00, 'Pembayaran DP untuk Seragam Staff & Lanyard + ID Card\nCatatan: Harga Total Keseluruhannya : 1.820.000\r\nBayar DP 50% : 910.000\r\nTambahan Biaya Admin : 2.500', '2026-06-12', 7, '2026-08-20 16:49:35', NULL, 'https://drive.google.com/file/d/1F432mY1Kl0GN4B9zg4EU1zGaxMXn8Lnr/view?usp=drivesdk', 'Transfer', 'STRIZ (Risky Eka Tama)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-12' AND `amount` = 912500.00 AND `created_at` = '2026-08-20 16:49:35' AND COALESCE(`description`, '') = 'Pembayaran DP untuk Seragam Staff & Lanyard + ID Card\nCatatan: Harga Total Keseluruhannya : 1.820.000\r\nBayar DP 50% : 910.000\r\nTambahan Biaya Admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 20400.00, 'Pembelian Solatip untuk Packing Ulang Lemari yang diretur', '2026-06-13', 7, '2026-08-20 16:51:18', NULL, 'https://drive.google.com/file/d/1pF48CMqAor-M19K3_pS18l1fY8BWABKi/view?usp=drivesdk', 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-13' AND `amount` = 20400.00 AND `created_at` = '2026-08-20 16:51:18' AND COALESCE(`description`, '') = 'Pembelian Solatip untuk Packing Ulang Lemari yang diretur'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Siti Nurhatifah', 3000000.00, 'Kebutuhan Pribadi Bu Tiffa', '2026-06-15', 7, '2026-08-20 16:52:47', NULL, 'https://drive.google.com/file/d/1Bwa7M5aHq_z9JQzAdlHz-IrUk0UqAjNL/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-15' AND `amount` = 3000000.00 AND `created_at` = '2026-08-20 16:52:47' AND COALESCE(`description`, '') = 'Kebutuhan Pribadi Bu Tiffa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'STRIZ (Risky Eka Tama)', 1940000.00, 'DP Seragam Siswa Creativa\nCatatan: Total Keseluruhan : 3.875.000\r\nBayar DP 50 % : 1.937.500\r\nTambahan Biaya Admin : 2.500', '2026-06-17', 7, '2026-08-20 16:54:44', NULL, 'https://drive.google.com/file/d/1onXZ8ilMlAPH7y3R6nPUeLLSfZYGJUyK/view?usp=drivesdk', 'Transfer', 'STRIZ (Risky Eka Tama)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-17' AND `amount` = 1940000.00 AND `created_at` = '2026-08-20 16:54:44' AND COALESCE(`description`, '') = 'DP Seragam Siswa Creativa\nCatatan: Total Keseluruhan : 3.875.000\r\nBayar DP 50 % : 1.937.500\r\nTambahan Biaya Admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 855965.00, 'Modal Saham', '2026-06-19', 2, '2026-08-18 15:26:12', NULL, NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-06-19' AND `amount` = 855965.00 AND `created_at` = '2026-08-18 15:26:12' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Serba Murah 1', 255500.00, 'Pembelian Ember (3), Gayung (3), Pel, Sikat, Tempat Sampah (2), Plastik Sampah', '2026-06-19', 7, '2026-08-20 16:55:58', NULL, 'https://drive.google.com/file/d/1EzGY0Xjg4HXqDLUi_mZJui07AWrkywMm/view?usp=drivesdk', 'Transfer', 'Toko Serba Murah 1', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-19' AND `amount` = 255500.00 AND `created_at` = '2026-08-20 16:55:58' AND COALESCE(`description`, '') = 'Pembelian Ember (3), Gayung (3), Pel, Sikat, Tempat Sampah (2), Plastik Sampah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Cahaya Lampu', 180000.00, 'Lampu Philips 15 W (2) dan Lampu Philips 11 W', '2026-06-19', 7, '2026-08-20 16:56:59', NULL, 'https://drive.google.com/file/d/1jBRKLd4B_ChBZQsICBJAxVOv4pq92Q4P/view?usp=drivesdk', 'Transfer', 'Cahaya Lampu', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-19' AND `amount` = 180000.00 AND `created_at` = '2026-08-20 16:56:59' AND COALESCE(`description`, '') = 'Lampu Philips 15 W (2) dan Lampu Philips 11 W'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Bocah Marga Jaya', 60000.00, 'Pencetakan Kartu Nama Creativa (2 box), AC 260 gr BB', '2026-06-19', 7, '2026-08-20 16:58:04', NULL, 'https://drive.google.com/file/d/1ma97MMXogxy7pOs28lc0lvgvMfOpCEST/view?usp=drivesdk', 'Transfer', 'Bocah Marga Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-19' AND `amount` = 60000.00 AND `created_at` = '2026-08-20 16:58:04' AND COALESCE(`description`, '') = 'Pencetakan Kartu Nama Creativa (2 box), AC 260 gr BB'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Nuhun Elektronik', 480000.00, 'Stand Kipas Cosmos Hitam x 2\nCatatan: Harga Satuan 250.000 Diskon 20.000 Total 480.000', '2026-06-19', 7, '2026-08-20 16:59:15', NULL, 'https://drive.google.com/file/d/1FQ1EHHs28nvfcRMDd6QT5FR3JoXjIWPt/view?usp=drive_link', 'Transfer', 'Toko Nuhun Elektronik', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-19' AND `amount` = 480000.00 AND `created_at` = '2026-08-20 16:59:15' AND COALESCE(`description`, '') = 'Stand Kipas Cosmos Hitam x 2\nCatatan: Harga Satuan 250.000 Diskon 20.000 Total 480.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'MR D.I.Y', 30000.00, 'Glass Wiper 92 cm', '2026-06-21', 7, '2026-08-20 17:00:01', NULL, 'https://drive.google.com/file/d/1hmY5-R6BzPIdst-bRvATtsJKKDQIa9XD/view?usp=drivesdk', 'Transfer', 'MR D.I.Y', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-21' AND `amount` = 30000.00 AND `created_at` = '2026-08-20 17:00:01' AND COALESCE(`description`, '') = 'Glass Wiper 92 cm'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Fitri', 39000.00, 'Plastik Sampah 90 x 120 & Plastik Sampah 40 x 60', '2026-06-21', 7, '2026-08-20 17:04:59', NULL, 'https://drive.google.com/file/d/1_0hlz9K6XQPuGHJe9088yRf5O51XKL0w/view?usp=drivesdk', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-21' AND `amount` = 39000.00 AND `created_at` = '2026-08-20 17:04:59' AND COALESCE(`description`, '') = 'Plastik Sampah 90 x 120 & Plastik Sampah 40 x 60'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Yul 2', 19500.00, 'Serbet Microfiber', '2026-06-21', 7, '2026-08-20 17:06:05', NULL, 'https://drive.google.com/file/d/1GqyoFXgiEaMweKRSuKegH4GonYjdIuiA/view?usp=drivesdk', 'Transfer', 'Toko Yul 2', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-21' AND `amount` = 19500.00 AND `created_at` = '2026-08-20 17:06:05' AND COALESCE(`description`, '') = 'Serbet Microfiber'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Yul 2', 319000.00, 'Pembelian Kebutuhan Alat Kebersihan Kantor dan Asrama B2\nCatatan: Rak Sepatu (2), Tempat Sampah TS-10 (2), Tempat Sampah TS-15 (2), Tempat Sampah TS-42 (2)', '2026-06-21', 7, '2026-08-20 17:07:31', NULL, 'https://drive.google.com/file/d/1BqH1K4TmnP785wP3FxTDEhZPbALyv66n/view?usp=drivesdk', 'Transfer', 'Toko Yul 2', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-21' AND `amount` = 319000.00 AND `created_at` = '2026-08-20 17:07:31' AND COALESCE(`description`, '') = 'Pembelian Kebutuhan Alat Kebersihan Kantor dan Asrama B2\nCatatan: Rak Sepatu (2), Tempat Sampah TS-10 (2), Tempat Sampah TS-15 (2), Tempat Sampah TS-42 (2)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Yul 2', 60000.00, 'Pembelian Alat Kebersihan Toilet\nCatatan: Sikat Cuci Coklat, Sikat Cuci Biasa, Sodet, Saringan Jeruk, Irus Tanggung, Sikat Orlando (3)', '2026-06-21', 7, '2026-08-20 17:08:55', NULL, 'https://drive.google.com/file/d/1orJtc3oQZSOhudylQYGEHn0KL6Bl4o9R/view?usp=drivesdk', 'Transfer', 'Toko Yul 2', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-21' AND `amount` = 60000.00 AND `created_at` = '2026-08-20 17:08:55' AND COALESCE(`description`, '') = 'Pembelian Alat Kebersihan Toilet\nCatatan: Sikat Cuci Coklat, Sikat Cuci Biasa, Sodet, Saringan Jeruk, Irus Tanggung, Sikat Orlando (3)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 10000000.00, 'Modal Saham', '2026-06-23', 2, '2026-08-18 15:25:32', NULL, 'https://drive.google.com/file/d/1M3tuuygTO1MoYGZIy7KH1KOswSs33VBY/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-06-23' AND `amount` = 10000000.00 AND `created_at` = '2026-08-18 15:25:32' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 3000000.00, 'Modal Saham', '2026-06-23', 2, '2026-08-18 15:26:39', NULL, 'https://drive.google.com/file/d/1nCSPeHzDwgDy1AdVT0ZNubTJkFapdAFH/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-06-23' AND `amount` = 3000000.00 AND `created_at` = '2026-08-18 15:26:39' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Bocah Marga Jaya', 107200.00, 'Pencetakan Katalog (AC 260 gr / 230 gr BB (12), AC 260 gr BB, OP)', '2026-06-23', 7, '2026-08-20 17:10:35', NULL, 'https://drive.google.com/file/d/1LEg16ABZlO6h08VUADk3MyO7GQyqkISr/view?usp=drivesdk', 'Transfer', 'Bocah Marga Jaya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-23' AND `amount` = 107200.00 AND `created_at` = '2026-08-20 17:10:35' AND COALESCE(`description`, '') = 'Pencetakan Katalog (AC 260 gr / 230 gr BB (12), AC 260 gr BB, OP)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'STRIZ (Risky Eka Tama)', 836250.00, 'Pelunasan Seragam Staff Creativa + ID Card + Lanyard Staff\nCatatan: Biaya Pelunasan : 835.000\r\nTambahan Biaya Admin : 1.250', '2026-06-23', 7, '2026-08-20 17:12:07', NULL, 'https://drive.google.com/file/d/1yCknFcSzfd4BFFjHhroR35YwBfnwtI80/view?usp=drivesdk', 'Transfer', 'STRIZ (Risky Eka Tama)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-23' AND `amount` = 836250.00 AND `created_at` = '2026-08-20 17:12:07' AND COALESCE(`description`, '') = 'Pelunasan Seragam Staff Creativa + ID Card + Lanyard Staff\nCatatan: Biaya Pelunasan : 835.000\r\nTambahan Biaya Admin : 1.250'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'STRIZ (Risky Eka Tama)', 2064250.00, 'Pelunasan Seragam Siswa Creativa\nCatatan: Biaya pelunasan : 2.063.000\r\nTambahan biaya admin : 1.250', '2026-06-23', 7, '2026-08-20 17:13:20', NULL, 'https://drive.google.com/file/d/1dGQi6b1rX6yBGBJMUezkRjNLccRjH05i/view?usp=drivesdk', 'Transfer', 'STRIZ (Risky Eka Tama)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-23' AND `amount` = 2064250.00 AND `created_at` = '2026-08-20 17:13:20' AND COALESCE(`description`, '') = 'Pelunasan Seragam Siswa Creativa\nCatatan: Biaya pelunasan : 2.063.000\r\nTambahan biaya admin : 1.250'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin (LPK SAMIT)', 5990000.00, 'Pembelian Kulkas\nCatatan: Untuk di bukti pembayaran, itu digabung dengan pembelian Speaker JBL', '2026-06-23', 7, '2026-08-20 17:14:50', NULL, 'https://drive.google.com/file/d/1wLHedVVOSUblzw9cIoojAuRwq_I_pzdz/view?usp=drivesdk', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-23' AND `amount` = 5990000.00 AND `created_at` = '2026-08-20 17:14:50' AND COALESCE(`description`, '') = 'Pembelian Kulkas\nCatatan: Untuk di bukti pembayaran, itu digabung dengan pembelian Speaker JBL'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'M. Anwar Roziqin (LPK SAMIT)', 6135100.00, 'Pembelian Speaker JBL\nCatatan: Untuk di bukti pembayaran, itu digabung dengan pembelian Kulkas', '2026-06-23', 7, '2026-08-20 17:16:14', NULL, 'https://drive.google.com/file/d/1wLHedVVOSUblzw9cIoojAuRwq_I_pzdz/view?usp=drivesdk', 'Transfer', 'M. Anwar Roziqin (LPK SAMIT)', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-23' AND `amount` = 6135100.00 AND `created_at` = '2026-08-20 17:16:14' AND COALESCE(`description`, '') = 'Pembelian Speaker JBL\nCatatan: Untuk di bukti pembayaran, itu digabung dengan pembelian Kulkas'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 120000.00, 'Pembelian  ⁠Hekter, isi Hekter, ⁠Steker broco, ⁠Engsel toilet, Alat Kebersihan, makan untuk staff dan pak anwar\nCatatan: Rincian Pembelian\r\n\r\n•⁠  ⁠Hekter + isi = 18.500\r\n•⁠  ⁠Steker broco = 14.000\r\n•⁠  ⁠Engsel toilet = 10.000\r\n•⁠  Keperluan kantor dan kelas = 47.000\r\n•⁠  ⁠makan pecel untuk staff dan pak anwar = 30.000\r\n\r\nTotal 119.500', '2026-06-23', 7, '2026-08-20 17:17:20', NULL, 'https://drive.google.com/file/d/1AOFC3hmsvo5YokStXeCdxYnRap8NcETI/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-23' AND `amount` = 120000.00 AND `created_at` = '2026-08-20 17:17:20' AND COALESCE(`description`, '') = 'Pembelian  ⁠Hekter, isi Hekter, ⁠Steker broco, ⁠Engsel toilet, Alat Kebersihan, makan untuk staff dan pak anwar\nCatatan: Rincian Pembelian\r\n\r\n•⁠  ⁠Hekter + isi = 18.500\r\n•⁠  ⁠Steker broco = 14.000\r\n•⁠  ⁠Engsel toilet = 10.000\r\n•⁠  Keperluan kantor dan kelas = 47.000\r\n•⁠  ⁠makan pecel untuk staff dan pak anwar = 30.000\r\n\r\nTotal 119.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 50000.00, 'Modal Saham', '2026-06-24', 2, '2026-08-18 15:27:13', NULL, 'https://drive.google.com/file/d/1-aOmoRrl6-yYU2uu3DIXarFubXSntOfT/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-06-24' AND `amount` = 50000.00 AND `created_at` = '2026-08-18 15:27:13' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 73500.00, 'Pembelian Kertas HVS A4', '2026-06-24', 7, '2026-08-20 17:18:49', NULL, 'https://drive.google.com/file/d/1hG8u7N-K1wabJz1iy4i1OR6QavTDqbRC/view?usp=drivesdk', 'Transfer', 'Toko AA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-24' AND `amount` = 73500.00 AND `created_at` = '2026-08-20 17:18:49' AND COALESCE(`description`, '') = 'Pembelian Kertas HVS A4'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 101750.00, 'Pembelian Token Listrik Kantor Ruko B1\nCatatan: Tambahan Biaya Admin : 1.750', '2026-06-24', 7, '2026-08-20 17:20:09', NULL, 'https://drive.google.com/file/d/1iXoNtwDWITvNaZ6zASoAEeRf0vMpI-KO/view?usp=drivesdk', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-24' AND `amount` = 101750.00 AND `created_at` = '2026-08-20 17:20:09' AND COALESCE(`description`, '') = 'Pembelian Token Listrik Kantor Ruko B1\nCatatan: Tambahan Biaya Admin : 1.750'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 5000000.00, 'Modal Saham', '2026-06-25', 2, '2026-08-18 15:27:57', NULL, 'https://drive.google.com/file/d/1zNcDfuUQ-lJ8O98dWl5g0o_TyZ0V5w6F/view?usp=drivesdk', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-06-25' AND `amount` = 5000000.00 AND `created_at` = '2026-08-18 15:27:57' AND COALESCE(`description`, '') = 'Modal Saham'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Ramsya', 3000000.00, 'Gaji Staff Administrasi bulan Juni', '2026-06-25', 7, '2026-08-20 17:21:34', NULL, 'https://drive.google.com/file/d/1HxpT3lg6xBFU6EArYC8nZClvQb3NiPos/view?usp=drivesdk', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-25' AND `amount` = 3000000.00 AND `created_at` = '2026-08-20 17:21:34' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi bulan Juni'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'Fitri', 2002500.00, 'Gaji Sensei bulan Juni\nCatatan: Tambahan biaya admin : 2.500', '2026-06-25', 7, '2026-08-20 17:23:18', NULL, 'https://drive.google.com/file/d/1Sw46a67VR5h0jrAB1DYigrEDqk83uMqS/view?usp=drivesdk', 'Transfer', 'Fitri', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-25' AND `amount` = 2002500.00 AND `created_at` = '2026-08-20 17:23:18' AND COALESCE(`description`, '') = 'Gaji Sensei bulan Juni\nCatatan: Tambahan biaya admin : 2.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Ramsya', 400000.00, 'Belanja untuk kedatangan TSK ke Creativa ( Rincian Ada Di Catatan )\nCatatan: Rincian belanja kedatangan tsk :\r\n\r\n•⁠  ⁠Sendal suripa 35.000 x 4 = 140.000\r\n•⁠  ⁠Biaya Tol pengiriman baju staff & siswa via lalamove = 45.000\r\n•⁠  ⁠Kopi kapal api 150g x2 = 45.000\r\n•⁠  ⁠Kopi kapal api 350g x2 = 99.800\r\n•⁠  ⁠Kantong Batik x2 = 11.000\r\n•⁠  ⁠Aqua dingin x6 = 17.700\r\n•⁠  ⁠Transport Ramsya = 41.500', '2026-06-26', 7, '2026-08-20 17:24:12', NULL, 'https://drive.google.com/file/d/1IVPquF0N4SECmc6_ieigmEnkaO_aOUUn/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-26' AND `amount` = 400000.00 AND `created_at` = '2026-08-20 17:24:12' AND COALESCE(`description`, '') = 'Belanja untuk kedatangan TSK ke Creativa ( Rincian Ada Di Catatan )\nCatatan: Rincian belanja kedatangan tsk :\r\n\r\n•⁠  ⁠Sendal suripa 35.000 x 4 = 140.000\r\n•⁠  ⁠Biaya Tol pengiriman baju staff & siswa via lalamove = 45.000\r\n•⁠  ⁠Kopi kapal api 150g x2 = 45.000\r\n•⁠  ⁠Kopi kapal api 350g x2 = 99.800\r\n•⁠  ⁠Kantong Batik x2 = 11.000\r\n•⁠  ⁠Aqua dingin x6 = 17.700\r\n•⁠  ⁠Transport Ramsya = 41.500'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'Ramsya', 1100000.00, 'Pembelian Jemuran 2 unit untuk Asrama B2 dan Dispenser untuk Asrama Rumah\nCatatan: Jemuran 1 = 375.000\r\nJemuran 2 = 375.000 \r\nDispenser = 290.000\r\nTransport Grab = 60.000', '2026-06-26', 7, '2026-08-20 17:25:47', NULL, 'https://drive.google.com/file/d/1d6NLpeXQdAHopxgpfP3QmLD3FfVhmHhD/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-26' AND `amount` = 1100000.00 AND `created_at` = '2026-08-20 17:25:47' AND COALESCE(`description`, '') = 'Pembelian Jemuran 2 unit untuk Asrama B2 dan Dispenser untuk Asrama Rumah\nCatatan: Jemuran 1 = 375.000\r\nJemuran 2 = 375.000 \r\nDispenser = 290.000\r\nTransport Grab = 60.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko Karya Mulya', 26500.00, 'Pembelian selang mesin cuci asrama rumah dan kleman', '2026-06-26', 7, '2026-08-20 17:27:27', NULL, 'https://drive.google.com/file/d/18-oeUDSP41rRCLtvHee5WB8iHD140xzr/view?usp=drive_link', 'Cash', 'Toko Karya Mulya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-26' AND `amount` = 26500.00 AND `created_at` = '2026-08-20 17:27:27' AND COALESCE(`description`, '') = 'Pembelian selang mesin cuci asrama rumah dan kleman'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee / Ramsya', 23000.00, 'Voucher Zoom 1 Bulan', '2026-06-26', 7, '2026-08-20 17:29:06', NULL, 'https://drive.google.com/file/d/1tkk0CxfqIZNHGTVfFxgHdAj5eYe5WH1T/view?usp=drive_link', 'Transfer', 'Shopee / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-26' AND `amount` = 23000.00 AND `created_at` = '2026-08-20 17:29:06' AND COALESCE(`description`, '') = 'Voucher Zoom 1 Bulan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 1100000.00, 'Dana untuk pembelian jemuran asrama rumah 2 unit dan dispenser  di asrama rumah\nCatatan: Jemuran 1 = 375.000\r\nJemuran 2 = 375.000 \r\nDispenser = 290.000\r\nTransport Grab = 60.000', '2026-06-26', 8, '2026-08-22 10:23:51', NULL, 'https://drive.google.com/file/d/1d6NLpeXQdAHopxgpfP3QmLD3FfVhmHhD/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-06-26' AND `amount` = 1100000.00 AND `created_at` = '2026-08-22 10:23:51' AND COALESCE(`description`, '') = 'Dana untuk pembelian jemuran asrama rumah 2 unit dan dispenser  di asrama rumah\nCatatan: Jemuran 1 = 375.000\r\nJemuran 2 = 375.000 \r\nDispenser = 290.000\r\nTransport Grab = 60.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 200000.00, 'Pembelian Dudukan Toilet 2 pcs, Kran Seal Tape', '2026-06-29', 7, '2026-08-20 17:30:06', NULL, NULL, 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-06-29' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 17:30:06' AND COALESCE(`description`, '') = 'Pembelian Dudukan Toilet 2 pcs, Kran Seal Tape'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Ramsya', 156000.00, 'Token Kantor Kelas Tgl 29 Juni 2026 dan Pembelian Terminal Listrik\nCatatan: - Token Kantor Kelas Tgl 29 Juni 2026 = 100.000\r\n- Terminal Colokan 3 = 23.000\r\n- Terminal Colokan 4 = 28.000\r\n- Kleman Kabel 8mm = 5.000', '2026-07-01', 7, '2026-08-20 17:32:05', NULL, 'https://drive.google.com/file/d/1llrdfFQPNB2TLBif_1rhksjbHzXA0Pp9/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-01' AND `amount` = 156000.00 AND `created_at` = '2026-08-20 17:32:05' AND COALESCE(`description`, '') = 'Token Kantor Kelas Tgl 29 Juni 2026 dan Pembelian Terminal Listrik\nCatatan: - Token Kantor Kelas Tgl 29 Juni 2026 = 100.000\r\n- Terminal Colokan 3 = 23.000\r\n- Terminal Colokan 4 = 28.000\r\n- Kleman Kabel 8mm = 5.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile / Ramsya', 200000.00, 'Token Kantor dan Kelas Ruko B1', '2026-07-01', 7, '2026-08-20 17:34:31', NULL, 'https://drive.google.com/file/d/10nR9kcEPffAsmWr9mr-xtBNDlL5Uz8oM/view?usp=drive_link', 'Transfer', 'PLN Mobile / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-01' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 17:34:31' AND COALESCE(`description`, '') = 'Token Kantor dan Kelas Ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Dana untuk pembelian token kantor B1\nCatatan: - Token Kantor Kelas Tgl 29 Juni 2026 = 100.000\r\n- Terminal Colokan 3 = 23.000\r\n- Terminal Colokan 4 = 28.000\r\n- Kleman Kabel 8mm = 5.000', '2026-07-01', 8, '2026-08-22 10:25:35', NULL, 'https://drive.google.com/file/d/10nR9kcEPffAsmWr9mr-xtBNDlL5Uz8oM/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-01' AND `amount` = 200000.00 AND `created_at` = '2026-08-22 10:25:35' AND COALESCE(`description`, '') = 'Dana untuk pembelian token kantor B1\nCatatan: - Token Kantor Kelas Tgl 29 Juni 2026 = 100.000\r\n- Terminal Colokan 3 = 23.000\r\n- Terminal Colokan 4 = 28.000\r\n- Kleman Kabel 8mm = 5.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 156000.00, 'Reimburstment pembelian token kantor B1 di tanggal 29 Juni dan pembelian terminal listrik', '2026-07-01', 8, '2026-08-22 10:28:01', NULL, 'https://drive.google.com/file/d/1llrdfFQPNB2TLBif_1rhksjbHzXA0Pp9/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-01' AND `amount` = 156000.00 AND `created_at` = '2026-08-22 10:28:01' AND COALESCE(`description`, '') = 'Reimburstment pembelian token kantor B1 di tanggal 29 Juni dan pembelian terminal listrik'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Shopee / Ramsya', 102000.00, 'Token Asrama rumah', '2026-07-02', 7, '2026-08-20 17:35:52', NULL, 'https://drive.google.com/file/d/1RQlJ_W-J41OllD5-bVO3RPma3EacDkjG/view?usp=drive_link', 'Transfer', 'Shopee / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-02' AND `amount` = 102000.00 AND `created_at` = '2026-08-20 17:35:52' AND COALESCE(`description`, '') = 'Token Asrama rumah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 102000.00, 'Dana untuk pembelian token asrama rumah', '2026-07-02', 8, '2026-08-22 10:21:34', NULL, 'https://drive.google.com/file/d/1RQlJ_W-J41OllD5-bVO3RPma3EacDkjG/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-02' AND `amount` = 102000.00 AND `created_at` = '2026-08-22 10:21:34' AND COALESCE(`description`, '') = 'Dana untuk pembelian token asrama rumah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Ketenagakerjaan / Ramsya', 413859.00, 'Aktivasi BPJS Ketenagakerjaan CREATIVA', '2026-07-03', 7, '2026-08-20 17:37:27', NULL, 'https://drive.google.com/file/d/1LWbLJ1hy9qPKqcMkUZIFJM8MW9nhYYaM/view?usp=drive_link', 'Transfer', 'BPJS Ketenagakerjaan / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-03' AND `amount` = 413859.00 AND `created_at` = '2026-08-20 17:37:27' AND COALESCE(`description`, '') = 'Aktivasi BPJS Ketenagakerjaan CREATIVA'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 413859.00, 'Aktivasi BPJS Ketenagakerjaan Creativa Bulan Juli', '2026-07-03', 8, '2026-08-22 10:18:38', NULL, 'https://drive.google.com/file/d/1LWbLJ1hy9qPKqcMkUZIFJM8MW9nhYYaM/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-03' AND `amount` = 413859.00 AND `created_at` = '2026-08-22 10:18:38' AND COALESCE(`description`, '') = 'Aktivasi BPJS Ketenagakerjaan Creativa Bulan Juli'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Kori Suripno', 200000.00, 'Pembayaran IPL Ruko Bulan Juli', '2026-07-04', 7, '2026-08-20 17:38:15', NULL, 'https://drive.google.com/file/d/1m9v5yzdpGZEqvriGtej4dToC9TIKRdLw/view?usp=drive_link', 'Transfer', 'Kori Suripno', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-04' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 17:38:15' AND COALESCE(`description`, '') = 'Pembayaran IPL Ruko Bulan Juli'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Pembayaran IPL Ruko B1 Bulan Juli', '2026-07-04', 8, '2026-08-22 10:19:55', NULL, 'https://drive.google.com/file/d/1m9v5yzdpGZEqvriGtej4dToC9TIKRdLw/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-04' AND `amount` = 200000.00 AND `created_at` = '2026-08-22 10:19:55' AND COALESCE(`description`, '') = 'Pembayaran IPL Ruko B1 Bulan Juli'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Toko AA / Ramsya', 110000.00, 'Pembelian Whiteboard Kecil untuk pra pelatihan siswa', '2026-07-08', 7, '2026-08-20 17:39:27', NULL, 'https://drive.google.com/file/d/1MujhZqSykGl08xGMawJj-fN36wFVz6qS/view?usp=drive_link', 'Transfer', 'Toko AA / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-08' AND `amount` = 110000.00 AND `created_at` = '2026-08-20 17:39:27' AND COALESCE(`description`, '') = 'Pembelian Whiteboard Kecil untuk pra pelatihan siswa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 110000.00, 'Dana untuk pembelian Whiteboard Kecil untuk pra pelatihan siswa', '2026-07-08', 8, '2026-08-22 10:29:47', NULL, 'https://drive.google.com/file/d/1MujhZqSykGl08xGMawJj-fN36wFVz6qS/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-08' AND `amount` = 110000.00 AND `created_at` = '2026-08-22 10:29:47' AND COALESCE(`description`, '') = 'Dana untuk pembelian Whiteboard Kecil untuk pra pelatihan siswa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee / Ramsya', 243132.00, 'Pembelian schedule board x2, ⁠meteran 5m x1, ⁠gantungan baju pintu x2, list air pintu toilet x2', '2026-07-10', 7, '2026-08-20 17:40:17', NULL, 'https://drive.google.com/file/d/15PxzPyeD3sXjqUDrxqYJReHQtRUb33Y_/view?usp=drive_link', 'Transfer', 'Shopee / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-10' AND `amount` = 243132.00 AND `created_at` = '2026-08-20 17:40:17' AND COALESCE(`description`, '') = 'Pembelian schedule board x2, ⁠meteran 5m x1, ⁠gantungan baju pintu x2, list air pintu toilet x2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Galeri Kencana / Ramsya', 40000.00, 'Pembelian Pigura untuk Sertifikat BPJS Ketenagakerjaan', '2026-07-11', 7, '2026-08-20 17:40:58', NULL, 'https://drive.google.com/file/d/1HlYwHziz8xkYTVsk0FpuQLZsVVjj8wi3/view?usp=drive_link', 'Cash', 'Galeri Kencana / Ramsya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-11' AND `amount` = 40000.00 AND `created_at` = '2026-08-20 17:40:58' AND COALESCE(`description`, '') = 'Pembelian Pigura untuk Sertifikat BPJS Ketenagakerjaan'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Aira Percetakan', 90000.00, 'Pembelian Banner LPK, Visi Misi, Struktur Organisasi', '2026-07-13', 7, '2026-08-20 17:41:56', NULL, 'https://drive.google.com/file/d/1JT9Zc4_PVeNhwDELgtDfy_C61ZGpdKB9/view?usp=drive_link', 'Transfer', 'Aira Percetakan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-13' AND `amount` = 90000.00 AND `created_at` = '2026-08-20 17:41:56' AND COALESCE(`description`, '') = 'Pembelian Banner LPK, Visi Misi, Struktur Organisasi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 90000.00, 'Pembelian mata bor 6ml, skrup fischer, aqua botol, rokok untuk pa rifqi dan pa fajar\nCatatan: •⁠  ⁠mata bor 6m + skrup fishcer = 25.000\r\n•⁠  ⁠aqua x3 = 11.000\r\n•⁠  ⁠roko x2 = 54.000', '2026-07-13', 7, '2026-08-20 17:44:02', NULL, 'https://drive.google.com/file/d/1hCUR2pfgfvNG00loP6elkdkhIKXgKaKc/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-13' AND `amount` = 90000.00 AND `created_at` = '2026-08-20 17:44:02' AND COALESCE(`description`, '') = 'Pembelian mata bor 6ml, skrup fischer, aqua botol, rokok untuk pa rifqi dan pa fajar\nCatatan: •⁠  ⁠mata bor 6m + skrup fishcer = 25.000\r\n•⁠  ⁠aqua x3 = 11.000\r\n•⁠  ⁠roko x2 = 54.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 90000.00, 'Dana untuk keperluan kunjungan dinas ke LPK\nCatatan: List pembelian \r\n•⁠  ⁠mata bor 6m + skrup fishcer = 25.000\r\n•⁠  ⁠aqua x3 = 11.000\r\n•⁠  ⁠roko x2 = 54.000', '2026-07-13', 8, '2026-08-22 10:43:16', 'finance/finance_1787370196_1549.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-13' AND `amount` = 90000.00 AND `created_at` = '2026-08-22 10:43:16' AND COALESCE(`description`, '') = 'Dana untuk keperluan kunjungan dinas ke LPK\nCatatan: List pembelian \r\n•⁠  ⁠mata bor 6m + skrup fishcer = 25.000\r\n•⁠  ⁠aqua x3 = 11.000\r\n•⁠  ⁠roko x2 = 54.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Bizznet / Ramsya', 721500.00, 'Pemasangan Wifi untuk Asrama Rumah', '2026-07-14', 7, '2026-08-20 17:42:59', NULL, 'https://drive.google.com/file/d/1LpgVWuTR0YQJNsKba-04nd2fJ-cSRB8l/view?usp=drive_link', 'Transfer', 'Bizznet / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-14' AND `amount` = 721500.00 AND `created_at` = '2026-08-20 17:42:59' AND COALESCE(`description`, '') = 'Pemasangan Wifi untuk Asrama Rumah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Bizznet / Ramsya', 120000.00, 'Tip untuk Teknisi Wi-Fi', '2026-07-14', 7, '2026-08-20 17:45:40', NULL, 'https://drive.google.com/file/d/121g6Vx7iSU4SKHQuANFMnLC_9le1sHhf/view?usp=drive_link', 'Transfer', 'Bizznet / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-14' AND `amount` = 120000.00 AND `created_at` = '2026-08-20 17:45:40' AND COALESCE(`description`, '') = 'Tip untuk Teknisi Wi-Fi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 721500.00, 'Dana untuk instalasi Wi-Fi Asrama Rumah', '2026-07-14', 8, '2026-08-22 09:57:34', NULL, 'https://drive.google.com/file/d/1LpgVWuTR0YQJNsKba-04nd2fJ-cSRB8l/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-14' AND `amount` = 721500.00 AND `created_at` = '2026-08-22 09:57:34' AND COALESCE(`description`, '') = 'Dana untuk instalasi Wi-Fi Asrama Rumah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 120000.00, 'Tip untuk teknisi Wi-Fi', '2026-07-14', 8, '2026-08-22 09:59:01', NULL, 'https://drive.google.com/file/d/121g6Vx7iSU4SKHQuANFMnLC_9le1sHhf/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-14' AND `amount` = 120000.00 AND `created_at` = '2026-08-22 09:59:01' AND COALESCE(`description`, '') = 'Tip untuk teknisi Wi-Fi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'Shopee', 64191.00, 'Pembelian List penahan air untuk toilet asrama b2 lantai 2', '2026-07-15', 7, '2026-08-20 17:59:10', NULL, 'https://drive.google.com/file/d/1fedGRp7XASDtE_-tjnjf-cBWqbAo-N1a/view?usp=drive_link', 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-15' AND `amount` = 64191.00 AND `created_at` = '2026-08-20 17:59:10' AND COALESCE(`description`, '') = 'Pembelian List penahan air untuk toilet asrama b2 lantai 2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 64191.00, 'Dana untuk keperluan toilet asrama B2 lantai 2', '2026-07-15', 8, '2026-08-22 10:39:08', NULL, 'https://drive.google.com/file/d/1fedGRp7XASDtE_-tjnjf-cBWqbAo-N1a/view?usp=drive_link', 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-15' AND `amount` = 64191.00 AND `created_at` = '2026-08-22 10:39:08' AND COALESCE(`description`, '') = 'Dana untuk keperluan toilet asrama B2 lantai 2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 200000.00, 'Pembelian Selang shower toilet, Rak serbaguna, ⁠lem sealent, lem fox, ⁠map\nCatatan: Belanja tanggal 15 Juli 2026 :\r\n\r\n•⁠  ⁠Selang shower toilet x2 = 90.000\r\n•⁠  ⁠Rak serbaguna = 57.000\r\n•⁠  ⁠lem sealent = 25.000\r\n•⁠  ⁠lem fox = 18.000\r\n•⁠  ⁠map = 8.000', '2026-07-16', 7, '2026-08-20 17:46:48', NULL, 'https://drive.google.com/file/d/1QNnBdwai-4jsbkE6eoehlxLUNfYcNMO-/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-16' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 17:46:48' AND COALESCE(`description`, '') = 'Pembelian Selang shower toilet, Rak serbaguna, ⁠lem sealent, lem fox, ⁠map\nCatatan: Belanja tanggal 15 Juli 2026 :\r\n\r\n•⁠  ⁠Selang shower toilet x2 = 90.000\r\n•⁠  ⁠Rak serbaguna = 57.000\r\n•⁠  ⁠lem sealent = 25.000\r\n•⁠  ⁠lem fox = 18.000\r\n•⁠  ⁠map = 8.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 200000.00, 'Dana untuk keperluan tangocho untuk siswa', '2026-07-16', 8, '2026-08-22 10:16:31', 'finance/finance_1787368591_5429.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-16' AND `amount` = 200000.00 AND `created_at` = '2026-08-22 10:16:31' AND COALESCE(`description`, '') = 'Dana untuk keperluan tangocho untuk siswa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Ramsya', 120000.00, 'Pembelian Aqua untuk dinas dan Obat untuk siswa\nCatatan: Belanja tanggal 16 Juli 2026 :\r\n\r\n•⁠  ⁠Aqua gelas x2 dus = 38.000\r\n•⁠  ⁠Obat Dexamethasone = 4000\r\n•⁠  ⁠Tera F = 13.000\r\n•⁠  ⁠Guafenesin = 3000\r\n•⁠  ⁠Aqua botol 1 dus = 60.000', '2026-07-17', 7, '2026-08-20 17:47:32', NULL, 'https://drive.google.com/file/d/1kYfzzHt173gzIUQfvezJdqIFCIH-swIE/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-17' AND `amount` = 120000.00 AND `created_at` = '2026-08-20 17:47:32' AND COALESCE(`description`, '') = 'Pembelian Aqua untuk dinas dan Obat untuk siswa\nCatatan: Belanja tanggal 16 Juli 2026 :\r\n\r\n•⁠  ⁠Aqua gelas x2 dus = 38.000\r\n•⁠  ⁠Obat Dexamethasone = 4000\r\n•⁠  ⁠Tera F = 13.000\r\n•⁠  ⁠Guafenesin = 3000\r\n•⁠  ⁠Aqua botol 1 dus = 60.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 120000.00, 'Dana untuk keperluan Verifikasi kunjungan dinas ke LPK tanggal 16 Juli', '2026-07-17', 8, '2026-08-22 10:33:59', 'finance/finance_1787369639_7545.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-17' AND `amount` = 120000.00 AND `created_at` = '2026-08-22 10:33:59' AND COALESCE(`description`, '') = 'Dana untuk keperluan Verifikasi kunjungan dinas ke LPK tanggal 16 Juli'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 205000.00, 'Pembelian Token Kantor B1', '2026-07-19', 7, '2026-08-20 17:49:20', NULL, 'https://drive.google.com/file/d/1wqBfNVh7vHhkiLayhXNgYknOdF0N-byk/view?usp=drive_link', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-19' AND `amount` = 205000.00 AND `created_at` = '2026-08-20 17:49:20' AND COALESCE(`description`, '') = 'Pembelian Token Kantor B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 205000.00, 'Dana untuk pembelian token kantor B1', '2026-07-19', 8, '2026-08-22 10:14:33', 'finance/finance_1787368473_5060.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-19' AND `amount` = 205000.00 AND `created_at` = '2026-08-22 10:14:33' AND COALESCE(`description`, '') = 'Dana untuk pembelian token kantor B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Ramsya', 45000.00, 'Print Ac Laminasi untuk cover tangocho', '2026-07-21', 7, '2026-08-20 17:50:18', NULL, 'https://drive.google.com/file/d/1HmyAy16KnwlWSUXAI5EU8wiD4IhAi_8m/view?usp=drive_link', 'Transfer', 'Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-21' AND `amount` = 45000.00 AND `created_at` = '2026-08-20 17:50:18' AND COALESCE(`description`, '') = 'Print Ac Laminasi untuk cover tangocho'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 126500.00, 'Pembelian Kertas HVS A4 1 rim dan Kertas BC F4 3 pcs', '2026-07-22', 7, '2026-08-20 17:51:39', NULL, 'https://drive.google.com/file/d/1UC4Ki7QZ6OKLev6XBQtsLRckWfXkSHPz/view?usp=drive_link', 'Transfer', 'Toko AA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-22' AND `amount` = 126500.00 AND `created_at` = '2026-08-20 17:51:39' AND COALESCE(`description`, '') = 'Pembelian Kertas HVS A4 1 rim dan Kertas BC F4 3 pcs'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Sinar M', 60000.00, 'Jilid Spiral 10 Buku Tangocho', '2026-07-22', 7, '2026-08-20 17:53:43', NULL, 'https://drive.google.com/file/d/16bdms_xF7zkuiYbaTfDtwGTs45BCW8o_/view?usp=drive_link', 'Transfer', 'Sinar M', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-22' AND `amount` = 60000.00 AND `created_at` = '2026-08-20 17:53:43' AND COALESCE(`description`, '') = 'Jilid Spiral 10 Buku Tangocho'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko AA', 12500.00, 'Pembelian Sticker Label dan Nano Double Tape', '2026-07-22', 7, '2026-08-20 17:54:55', NULL, 'https://drive.google.com/file/d/1yzBZ6HPFnmqoi_0kjdrhpd_OGDhlc6z9/view?usp=drive_link', 'Transfer', 'Toko AA', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-22' AND `amount` = 12500.00 AND `created_at` = '2026-08-20 17:54:55' AND COALESCE(`description`, '') = 'Pembelian Sticker Label dan Nano Double Tape'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Siswa', 'Jaya Makmur', 110000.00, 'Karpet Warrior 120 x 150\nCatatan: Karpet Warrior 120 x 150 22.000 x 5 = 110.000', '2026-07-25', 7, '2026-08-20 17:55:57', NULL, 'https://drive.google.com/file/d/1khSJp_gJzxacI6sLOlKp-o3uNl4OCaZW/view?usp=drive_link', 'Cash', 'Jaya Makmur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-25' AND `amount` = 110000.00 AND `created_at` = '2026-08-20 17:55:57' AND COALESCE(`description`, '') = 'Karpet Warrior 120 x 150\nCatatan: Karpet Warrior 120 x 150 22.000 x 5 = 110.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile / Ramsya', 151750.00, 'Token Ruko B1', '2026-07-27', 7, '2026-08-20 17:57:03', NULL, 'https://drive.google.com/file/d/1M1vstsCaW5YbU_PcDBH0k8ohxWvrGggF/view?usp=drive_link', 'Transfer', 'PLN Mobile / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-27' AND `amount` = 151750.00 AND `created_at` = '2026-08-20 17:57:03' AND COALESCE(`description`, '') = 'Token Ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee / Ramsya', 47798.00, 'Pembelian Kuota Voucher Zoom dan List Penghalang Air untuk pintu toilet Asrama B2', '2026-07-28', 7, '2026-08-20 17:57:51', NULL, 'https://drive.google.com/file/d/1OEjmHuedlOi994-4kMyCbkJ7Ne98B9Id/view?usp=drive_link', 'Transfer', 'Shopee / Ramsya', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-07-28' AND `amount` = 47798.00 AND `created_at` = '2026-08-20 17:57:51' AND COALESCE(`description`, '') = 'Pembelian Kuota Voucher Zoom dan List Penghalang Air untuk pintu toilet Asrama B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 150000.00, 'Reimburstmen pembelian token kantor B1 di tanggal 27', '2026-07-29', 8, '2026-08-22 10:10:20', 'finance/finance_1787368220_8313.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-07-29' AND `amount` = 150000.00 AND `created_at` = '2026-08-22 10:10:20' AND COALESCE(`description`, '') = 'Reimburstmen pembelian token kantor B1 di tanggal 27'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'PLN Mobile', 102000.00, 'Token Kantor Ruko B1', '2026-08-03', 7, '2026-08-20 18:00:43', NULL, 'https://drive.google.com/file/d/178h0jyom4aEt9UF6F7OSJXa6aYNyX2NS/view?usp=drive_link', 'Transfer', 'PLN Mobile', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-03' AND `amount` = 102000.00 AND `created_at` = '2026-08-20 18:00:43' AND COALESCE(`description`, '') = 'Token Kantor Ruko B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'Kori Suripno', 200000.00, 'Pembayaran IPL Ruko Bulan Agustus Dibayar oleh Yuni Sensei (SAMIT)', '2026-08-05', 7, '2026-08-20 18:01:48', NULL, 'https://drive.google.com/file/d/1sOpgUygPfzZp9kcjyx2xDOp7nrvDmdYP/view?usp=drive_link', 'Transfer', 'Kori Suripno', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-05' AND `amount` = 200000.00 AND `created_at` = '2026-08-20 18:01:48' AND COALESCE(`description`, '') = 'Pembayaran IPL Ruko Bulan Agustus Dibayar oleh Yuni Sensei (SAMIT)'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 200000.00, 'Pembayaran IPL Ruko B1 Bulan Agustus', '2026-08-05', 8, '2026-08-22 09:54:13', 'finance/finance_1787367253_7328.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-05' AND `amount` = 200000.00 AND `created_at` = '2026-08-22 09:54:13' AND COALESCE(`description`, '') = 'Pembayaran IPL Ruko B1 Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 100000.00, 'Reimburstment untuk pembelian token kantor B1 di tanggal 3', '2026-08-05', 8, '2026-08-22 10:06:12', 'finance/finance_1787367972_1900.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-05' AND `amount` = 100000.00 AND `created_at` = '2026-08-22 10:06:12' AND COALESCE(`description`, '') = 'Reimburstment untuk pembelian token kantor B1 di tanggal 3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Apotek Bunda Medika', 15000.00, 'Pembelian  Tera F dan Omeprazole untuk Staff', '2026-08-07', 4, '2026-08-27 11:13:50', 'finance/finance_1787804030_3052.jpeg', NULL, 'Cash', 'Apotek Bunda Medika', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-07' AND `amount` = 15000.00 AND `created_at` = '2026-08-27 11:13:50' AND COALESCE(`description`, '') = 'Pembelian  Tera F dan Omeprazole untuk Staff'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Toko Purnama Indah', 10000.00, 'Lakban Bening', '2026-08-08', 4, '2026-08-27 11:15:38', 'finance/finance_1787804138_4916.jpeg', NULL, 'Cash', 'Toko Purnama Indah', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-08' AND `amount` = 10000.00 AND `created_at` = '2026-08-27 11:15:38' AND COALESCE(`description`, '') = 'Lakban Bening'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'J&T', 13000.00, 'Ongkos Kirim Lanyar dan buku ke Tangerang', '2026-08-08', 4, '2026-08-27 11:17:54', 'finance/finance_1787804274_2231.jpeg', NULL, 'Cash', 'J&T', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-08' AND `amount` = 13000.00 AND `created_at` = '2026-08-27 11:17:54' AND COALESCE(`description`, '') = 'Ongkos Kirim Lanyar dan buku ke Tangerang'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'SAKURA MITRA INTERNATIONAL', 21800000.00, 'Refund Dp Partisi Kursi Meja', '2026-08-10', 2, '2026-08-18 15:31:16', NULL, 'https://drive.google.com/file/d/1tGyLHDBjGfh7ayvOLHH46M7UTJDqLziS/view?usp=drive_link', 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-10' AND `amount` = 21800000.00 AND `created_at` = '2026-08-18 15:31:16' AND COALESCE(`description`, '') = 'Refund Dp Partisi Kursi Meja'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'CREATIVA BRIDGING INTERNATIONAL', 3500000.00, 'Gaji Staff Administrasi dan Marketing Juli Dibayarkan 4 Agustus 2026', '2026-08-10', 7, '2026-08-21 10:08:06', NULL, NULL, 'Transfer', 'CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 3500000.00 AND `created_at` = '2026-08-21 10:08:06' AND COALESCE(`description`, '') = 'Gaji Staff Administrasi dan Marketing Juli Dibayarkan 4 Agustus 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'CREATIVA BRIDGING INTERNATIONAL', 3500000.00, 'Gaji Manager Juli Dibayarkan 4 Agustus 2026', '2026-08-10', 7, '2026-08-21 10:22:35', NULL, NULL, 'Transfer', 'CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 3500000.00 AND `created_at` = '2026-08-21 10:22:35' AND COALESCE(`description`, '') = 'Gaji Manager Juli Dibayarkan 4 Agustus 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Gaji', 'CREATIVA BRIDGING INTERNATIONAL', 3468838.00, 'Gaji General Affair Juli Dibayarkan 4 Agustus 2026', '2026-08-10', 7, '2026-08-21 10:23:31', NULL, NULL, 'Transfer', 'CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 3468838.00 AND `created_at` = '2026-08-21 10:23:31' AND COALESCE(`description`, '') = 'Gaji General Affair Juli Dibayarkan 4 Agustus 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 745500.00, 'Pembayaran BPJS Ketenagakerjaan dan Kesehetan Bulan Agustus', '2026-08-10', 7, '2026-08-24 15:35:51', 'finance/finance_1787560551_4471.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-10' AND `amount` = 745500.00 AND `created_at` = '2026-08-24 15:35:51' AND COALESCE(`description`, '') = 'Pembayaran BPJS Ketenagakerjaan dan Kesehetan Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Ketenagakerjaan', 413859.00, 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan Agustus', '2026-08-10', 7, '2026-08-24 15:45:20', 'finance/finance_1787561120_2887.jpeg', NULL, 'Transfer', 'BPJS Ketenagakerjaan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 413859.00 AND `created_at` = '2026-08-24 15:45:20' AND COALESCE(`description`, '') = 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPSJ Kesehatan', 334120.00, 'Pembayaran BPJS Kesehatan CREATIVA Bulan Agustus', '2026-08-10', 7, '2026-08-24 15:46:51', 'finance/finance_1787561211_9748.jpeg', NULL, 'Transfer', 'BPSJ Kesehatan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-10' AND `amount` = 334120.00 AND `created_at` = '2026-08-24 15:46:51' AND COALESCE(`description`, '') = 'Pembayaran BPJS Kesehatan CREATIVA Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 1000000.00, 'Dana untuk lomba 17 Agustus', '2026-08-12', 4, '2026-08-24 13:33:16', 'finance/finance_1787553196_1417.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-12' AND `amount` = 1000000.00 AND `created_at` = '2026-08-24 13:33:16' AND COALESCE(`description`, '') = 'Dana untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko AA', 173500.00, 'Bahan Kebutuhan Lomba 17 Agustus seperti pita, kertas kado, slinger bendera, dll', '2026-08-12', 7, '2026-08-24 14:12:26', 'finance/finance_1787555572_4941.jpeg', NULL, 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 173500.00 AND `created_at` = '2026-08-24 14:12:26' AND COALESCE(`description`, '') = 'Bahan Kebutuhan Lomba 17 Agustus seperti pita, kertas kado, slinger bendera, dll'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko AA', 1000.00, 'Parkir Toko AA ke 1', '2026-08-12', 7, '2026-08-24 14:13:33', NULL, NULL, 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 1000.00 AND `created_at` = '2026-08-24 14:13:33' AND COALESCE(`description`, '') = 'Parkir Toko AA ke 1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Niceso', 167000.00, 'Pembelian bahan hadiah untuk Juara 1,2,3', '2026-08-12', 7, '2026-08-24 14:15:05', 'finance/finance_1787555705_8858.jpeg', NULL, 'Cash', 'Niceso', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 167000.00 AND `created_at` = '2026-08-24 14:15:05' AND COALESCE(`description`, '') = 'Pembelian bahan hadiah untuk Juara 1,2,3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Niceso', 2000.00, 'Parkir Niceso ke 2', '2026-08-12', 7, '2026-08-24 14:15:56', NULL, NULL, 'Cash', 'Niceso', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 2000.00 AND `created_at` = '2026-08-24 14:15:56' AND COALESCE(`description`, '') = 'Parkir Niceso ke 2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'PD Sumber Mekar', 28000.00, 'Pembelian Karung untuk lomba 17 Agustus', '2026-08-12', 7, '2026-08-24 14:19:23', 'finance/finance_1787555963_6041.jpeg', NULL, 'Transfer', 'PD Sumber Mekar', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-12' AND `amount` = 28000.00 AND `created_at` = '2026-08-24 14:19:23' AND COALESCE(`description`, '') = 'Pembelian Karung untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'TB Faqih Jaya', 16000.00, 'Pembelian Kuas dan Serat glasswool', '2026-08-13', 4, '2026-08-27 11:21:59', 'finance/finance_1787804519_9473.jpeg', NULL, 'Cash', 'TB Faqih Jaya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-13' AND `amount` = 16000.00 AND `created_at` = '2026-08-27 11:21:59' AND COALESCE(`description`, '') = 'Pembelian Kuas dan Serat glasswool'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 200000.00, 'Tambahan dana untuk 17 Agustus', '2026-08-14', 4, '2026-08-24 13:35:27', 'finance/finance_1787553327_6599.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-14' AND `amount` = 200000.00 AND `created_at` = '2026-08-24 13:35:27' AND COALESCE(`description`, '') = 'Tambahan dana untuk 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 50000.00, 'Pembelian Terigu, Bola, Tali Rapia', '2026-08-14', 7, '2026-08-24 14:29:41', 'finance/finance_1787556581_6446.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 50000.00 AND `created_at` = '2026-08-24 14:29:41' AND COALESCE(`description`, '') = 'Pembelian Terigu, Bola, Tali Rapia'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 45000.00, 'Baskom untuk perlombaan 17 Agustus', '2026-08-14', 7, '2026-08-24 14:31:29', 'finance/finance_1787556689_2435.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 45000.00 AND `created_at` = '2026-08-24 14:31:29' AND COALESCE(`description`, '') = 'Baskom untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 25000.00, 'Coklat koin untuk perlombaan 17 Agustus', '2026-08-14', 7, '2026-08-24 14:32:53', 'finance/finance_1787556773_3703.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 25000.00 AND `created_at` = '2026-08-24 14:32:53' AND COALESCE(`description`, '') = 'Coklat koin untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Indomarett', 32700.00, 'Piring Kertas untuk lomba 17 Agustus', '2026-08-14', 7, '2026-08-24 14:54:59', 'finance/finance_1787558099_2137.jpeg', NULL, 'Cash', 'Indomarett', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 32700.00 AND `created_at` = '2026-08-24 14:54:59' AND COALESCE(`description`, '') = 'Piring Kertas untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Pasar Boomero Cianjur', 24000.00, 'Kardus bekas dan bendera 1 pak', '2026-08-14', 7, '2026-08-24 14:56:25', 'finance/finance_1787558185_4600.jpeg', NULL, 'Cash', 'Pasar Boomero Cianjur', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 24000.00 AND `created_at` = '2026-08-24 14:56:25' AND COALESCE(`description`, '') = 'Kardus bekas dan bendera 1 pak'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko Sembako', 522000.00, 'Makanan ringan dan lain lain untuk hadiah perlombaan\nCatatan: 163000 + 359000 = 522000', '2026-08-14', 7, '2026-08-24 14:58:42', 'finance/finance_1787558322_1517.jpeg', NULL, 'Cash', 'Toko Sembako', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 522000.00 AND `created_at` = '2026-08-24 14:58:42' AND COALESCE(`description`, '') = 'Makanan ringan dan lain lain untuk hadiah perlombaan\nCatatan: 163000 + 359000 = 522000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Samudra', 45000.00, 'Bola Warna Warni untuk perlombaan 17 Agustus', '2026-08-14', 7, '2026-08-24 15:10:08', 'finance/finance_1787559008_1854.jpeg', NULL, 'Cash', 'Samudra', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 45000.00 AND `created_at` = '2026-08-24 15:10:08' AND COALESCE(`description`, '') = 'Bola Warna Warni untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Samudra', 2000.00, 'Parkir toko samudra ke 3', '2026-08-14', 7, '2026-08-24 15:10:52', NULL, NULL, 'Cash', 'Samudra', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 2000.00 AND `created_at` = '2026-08-24 15:10:52' AND COALESCE(`description`, '') = 'Parkir toko samudra ke 3'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Toko AA', 20000.00, 'Tambahan Kertas Kado x4, kapur dan parkir\nCatatan: kertas kado x4 8000\r\nkapur 10000\r\nparkir 2000', '2026-08-14', 7, '2026-08-24 15:17:50', NULL, NULL, 'Cash', 'Toko AA', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-14' AND `amount` = 20000.00 AND `created_at` = '2026-08-24 15:17:50' AND COALESCE(`description`, '') = 'Tambahan Kertas Kado x4, kapur dan parkir\nCatatan: kertas kado x4 8000\r\nkapur 10000\r\nparkir 2000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'D.I.Y', 45000.00, 'Tambahan Slinger Bendera x 3\nCatatan: satuan 15000', '2026-08-15', 7, '2026-08-24 15:19:44', NULL, NULL, 'Cash', 'D.I.Y', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-15' AND `amount` = 45000.00 AND `created_at` = '2026-08-24 15:19:44' AND COALESCE(`description`, '') = 'Tambahan Slinger Bendera x 3\nCatatan: satuan 15000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Warung Madura', 17000.00, 'Kerupuk  x3 dan es batu untuk lomba 17 Agustus', '2026-08-15', 7, '2026-08-24 15:22:42', NULL, NULL, 'Cash', 'Warung Madura', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-15' AND `amount` = 17000.00 AND `created_at` = '2026-08-24 15:22:42' AND COALESCE(`description`, '') = 'Kerupuk  x3 dan es batu untuk lomba 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Warung Madura', 37000.00, 'Aqua gelas 2 dus untuk perlombaan 17 Agustus', '2026-08-16', 4, '2026-08-27 11:24:54', 'finance/finance_1787804694_8733.jpeg', NULL, 'Transfer', 'Warung Madura', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-16' AND `amount` = 37000.00 AND `created_at` = '2026-08-27 11:24:54' AND COALESCE(`description`, '') = 'Aqua gelas 2 dus untuk perlombaan 17 Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 22990.00, 'Kuota Zoom Bulan Agustus', '2026-08-23', 4, '2026-08-27 11:27:09', 'finance/finance_1787804985_6523.jpeg', NULL, 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-23' AND `amount` = 22990.00 AND `created_at` = '2026-08-27 11:27:09' AND COALESCE(`description`, '') = 'Kuota Zoom Bulan Agustus'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 240000.00, 'Dana untuk pergantian MCB 6A ke 10A Ruko B2', '2026-08-24', 4, '2026-08-26 09:46:14', 'finance/finance_1787712374_2026.png', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-24' AND `amount` = 240000.00 AND `created_at` = '2026-08-26 09:46:14' AND COALESCE(`description`, '') = 'Dana untuk pergantian MCB 6A ke 10A Ruko B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'TB. Hanjaya', 90000.00, 'Pembelian MCB Schneider 10A', '2026-08-24', 4, '2026-08-26 09:51:36', 'finance/finance_1787712696_2403.jpeg', NULL, 'Cash', 'TB. Hanjaya', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-24' AND `amount` = 90000.00 AND `created_at` = '2026-08-26 09:51:36' AND COALESCE(`description`, '') = 'Pembelian MCB Schneider 10A'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'Ayi Bydiel', 100000.00, 'Jasa Teknisi Penggantian MCB Ruko B2', '2026-08-25', 4, '2026-08-26 09:53:02', 'finance/finance_1787712778_3176.jpeg', NULL, 'Cash', 'Ayi Bydiel', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-25' AND `amount` = 100000.00 AND `created_at` = '2026-08-26 09:53:02' AND COALESCE(`description`, '') = 'Jasa Teknisi Penggantian MCB Ruko B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 11500.00, 'Pembelian Materai 10.000', '2026-08-26', 4, '2026-08-27 11:31:57', 'finance/finance_1787805117_3478.jpeg', NULL, 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-26' AND `amount` = 11500.00 AND `created_at` = '2026-08-27 11:31:57' AND COALESCE(`description`, '') = 'Pembelian Materai 10.000'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Asrama B2', 'SAKURA MITRA INTERNATIONAL', 50000.00, 'Refund kelebihan dana penggantian MCB Ruko B2', '2026-08-26', 4, '2026-08-27 16:38:48', 'finance/finance_1787823528_3274.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-26' AND `amount` = 50000.00 AND `created_at` = '2026-08-27 16:38:48' AND COALESCE(`description`, '') = 'Refund kelebihan dana penggantian MCB Ruko B2'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah', 383500.00, 'Modal Saham\nCatatan: Dikurangi Sebagian Kebutuhan Pribadi Bu Tiffa', '2026-08-27', 4, '2026-08-27 09:43:26', 'finance/finance_1787798606_9451.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-27' AND `amount` = 383500.00 AND `created_at` = '2026-08-27 09:43:26' AND COALESCE(`description`, '') = 'Modal Saham\nCatatan: Dikurangi Sebagian Kebutuhan Pribadi Bu Tiffa'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Lainnya', 'Kp. Panembong', 150000.00, 'Partisipasi Acara Maulid Nabi', '2026-08-27', 4, '2026-08-27 09:45:35', 'finance/finance_1787798735_7839.jpeg', NULL, 'Transfer', 'Kp. Panembong', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-27' AND `amount` = 150000.00 AND `created_at` = '2026-08-27 09:45:35' AND COALESCE(`description`, '') = 'Partisipasi Acara Maulid Nabi'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'SAKURA MITRA INTERNATIONAL', 103000.00, 'Pengisian Token B1', '2026-08-27', 2, '2026-08-28 10:07:15', 'finance/finance_1787886435_9182.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-27' AND `amount` = 103000.00 AND `created_at` = '2026-08-28 10:07:15' AND COALESCE(`description`, '') = 'Pengisian Token B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 115000.00, 'Dana untuk Pembelian Materai x 10', '2026-08-28', 2, '2026-08-28 17:26:40', 'finance/finance_1787912800_6487.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-08-28' AND `amount` = 115000.00 AND `created_at` = '2026-08-28 17:26:40' AND COALESCE(`description`, '') = 'Dana untuk Pembelian Materai x 10'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 115000.00, 'Pembelian Materai x 10', '2026-08-28', 2, '2026-08-28 17:28:04', 'finance/finance_1787912954_9844.jpeg', NULL, 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-28' AND `amount` = 115000.00 AND `created_at` = '2026-08-28 17:28:04' AND COALESCE(`description`, '') = 'Pembelian Materai x 10'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'J&T', 13000.00, 'Pembelian map untuk dokumen matching job Fitri', '2026-08-29', 7, '2026-09-02 13:48:49', NULL, NULL, 'Cash', 'J&T', 'Kas Tunai', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-08-29' AND `amount` = 13000.00 AND `created_at` = '2026-09-02 13:48:49' AND COALESCE(`description`, '') = 'Pembelian map untuk dokumen matching job Fitri'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'SAKURA MITRA INTERNATIONAL', 503000.00, 'Pengisian Token Kantor dan Kelas B1', '2026-09-01', NULL, '2026-09-02 09:26:28', 'finance/finance_1788315988_1777.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-01' AND `amount` = 503000.00 AND `created_at` = '2026-09-02 09:26:28' AND COALESCE(`description`, '') = 'Pengisian Token Kantor dan Kelas B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 503000.00, 'Pengisian Token Kantor dan Kelas B1', '2026-09-01', 7, '2026-09-02 09:29:03', 'finance/finance_1788316143_3655.jpeg', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-01' AND `amount` = 503000.00 AND `created_at` = '2026-09-02 09:29:03' AND COALESCE(`description`, '') = 'Pengisian Token Kantor dan Kelas B1'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 50000.00, 'Pembelian Aqua untuk tamu', '2026-09-01', 7, '2026-09-02 09:31:37', 'finance/finance_1788316297_3515.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-01' AND `amount` = 50000.00 AND `created_at` = '2026-09-02 09:31:37' AND COALESCE(`description`, '') = 'Pembelian Aqua untuk tamu'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Indomart', 24500.00, 'Pembelian Air minum untuk tamu', '2026-09-01', 7, '2026-09-02 09:33:50', 'finance/finance_1788316430_4482.jpeg', NULL, 'Transfer', 'Indomart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-01' AND `amount` = 24500.00 AND `created_at` = '2026-09-02 09:33:50' AND COALESCE(`description`, '') = 'Pembelian Air minum untuk tamu'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'SAKURA MITRA INTERNATIONAL', 222000.00, 'Dana pembayaran Wi-Fi Ruko B1 bulan September', '2026-09-07', 2, '2026-09-09 11:12:36', 'finance/finance_1788927156_1906.png', NULL, 'Transfer', 'SAKURA MITRA INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-07' AND `amount` = 222000.00 AND `created_at` = '2026-09-09 11:12:36' AND COALESCE(`description`, '') = 'Dana pembayaran Wi-Fi Ruko B1 bulan September'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Utilitas', 'LPK SAKURA MITRA INTERNASIONAL', 222000.00, 'Pembayaran Wi-Fi Ruko B1 Bulan September 2026', '2026-09-07', 2, '2026-09-09 11:14:25', 'finance/finance_1788927265_2834.png', NULL, 'Transfer', 'LPK SAKURA MITRA INTERNASIONAL', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-07' AND `amount` = 222000.00 AND `created_at` = '2026-09-09 11:14:25' AND COALESCE(`description`, '') = 'Pembayaran Wi-Fi Ruko B1 Bulan September 2026'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah - CREATIVA BRIDGING INTERNATIONAL', 792000.00, 'Dana untuk BPJS dan Keperluan kantor', '2026-09-09', 2, '2026-09-09 13:58:13', 'finance/finance_1788937093_4983.png', NULL, 'Transfer', 'Siti Nurhatifah - CREATIVA BRIDGING INTERNATIONAL', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-09' AND `amount` = 792000.00 AND `created_at` = '2026-09-09 13:58:13' AND COALESCE(`description`, '') = 'Dana untuk BPJS dan Keperluan kantor'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Ketenagakerjaan', 413859.00, 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan September', '2026-09-09', 4, '2026-09-12 11:47:11', 'finance/finance_1789188431_6900.jpeg', NULL, 'Transfer', 'BPJS Ketenagakerjaan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 413859.00 AND `created_at` = '2026-09-12 11:47:11' AND COALESCE(`description`, '') = 'Pembayaran BPJS Ketenagakerjaan CREATIVA Bulan September'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Operasional', 'BPJS Kesehatan', 334120.00, 'Pembayaran BPJS Kesehatan CREATIVA Bulan September', '2026-09-09', 4, '2026-09-12 11:48:31', 'finance/finance_1789188511_5419.jpeg', NULL, 'Transfer', 'BPJS Kesehatan', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 334120.00 AND `created_at` = '2026-09-12 11:48:31' AND COALESCE(`description`, '') = 'Pembayaran BPJS Kesehatan CREATIVA Bulan September'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Shopee', 25220.00, 'Pembelian Blue Clean isi 20pcs', '2026-09-09', 4, '2026-09-12 11:55:21', 'finance/finance_1789188921_1884.jpeg', NULL, 'Transfer', 'Shopee', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 25220.00 AND `created_at` = '2026-09-12 11:55:21' AND COALESCE(`description`, '') = 'Pembelian Blue Clean isi 20pcs'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'alfamart', 16900.00, 'Batrei ABC AA isi 4', '2026-09-09', 4, '2026-09-12 11:56:24', 'finance/finance_1789188984_9713.jpeg', NULL, 'Transfer', 'alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-09' AND `amount` = 16900.00 AND `created_at` = '2026-09-12 11:56:24' AND COALESCE(`description`, '') = 'Batrei ABC AA isi 4'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Alfamart', 16500.00, 'Pembelian Tisue Wajah', '2026-09-11', 4, '2026-09-12 12:02:30', 'finance/finance_1789189350_4740.jpeg', NULL, 'Transfer', 'Alfamart', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-11' AND `amount` = 16500.00 AND `created_at` = '2026-09-12 12:02:30' AND COALESCE(`description`, '') = 'Pembelian Tisue Wajah'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Modal', 'Siti Nurhatifah - Creativa Bridging International', 3500000.00, 'DP untuk Media Promosi Namedia', '2026-09-12', 4, '2026-09-12 14:36:12', 'finance/finance_1789198572_4182.jpeg', NULL, 'Transfer', 'Siti Nurhatifah - Creativa Bridging International', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-12' AND `amount` = 3500000.00 AND `created_at` = '2026-09-12 14:36:12' AND COALESCE(`description`, '') = 'DP untuk Media Promosi Namedia'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'expense', 'Keperluan Kantor', 'Firdhan - Namedia', 3500000.00, 'DP pembayaran media promosi Namedia', '2026-09-12', 4, '2026-09-12 14:39:14', 'finance/finance_1789198754_3513.jpeg', NULL, 'Transfer', 'Firdhan - Namedia', 'Kas/Bank (Transfer)', 'Paid'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'expense' AND `transaction_date` = '2026-09-12' AND `amount` = 3500000.00 AND `created_at` = '2026-09-12 14:39:14' AND COALESCE(`description`, '') = 'DP pembayaran media promosi Namedia'
);

INSERT INTO `finance_records` (`type`, `category`, `party_name`, `amount`, `description`, `transaction_date`, `created_by`, `created_at`, `photo_path`, `drive_link`, `metode`, `source`, `bank_name`, `status`)
SELECT 'income', 'Lainnya', 'Siti Nurhatifah', 4121500.00, 'Keperluan Kantor Creativa September 2026', '2026-09-23', 7, '2026-09-24 11:55:27', 'finance/finance_1790225727_9652.jpeg', NULL, 'Transfer', 'Siti Nurhatifah', 'Kas/Bank (Transfer)', 'Lunas'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM `finance_records` WHERE `type` = 'income' AND `transaction_date` = '2026-09-23' AND `amount` = 4121500.00 AND `created_at` = '2026-09-24 11:55:27' AND COALESCE(`description`, '') = 'Keperluan Kantor Creativa September 2026'
);

INSERT IGNORE INTO `invoice_clients` (`id`, `name`, `phone`, `email`, `program_type`, `total_biaya`, `keterangan`, `created_by`, `created_at`) VALUES (2, 'Farah Fauziah', '+62 83195880146 ', 'fauziahfarah77@gmail.com', 'matching_job', 36000000.00, 'Biaya Matching Job Bidang Kerja : Kaigo ', 7, '2026-08-19 07:44:44');
INSERT IGNORE INTO `invoice_records` (`id`, `client_id`, `keterangan`, `jumlah`, `file_path`, `created_by`, `created_at`, `drive_link`) VALUES (2, 2, 'Cicilan 1', 20000000.00, 'invoice/inv_1787125484_5486.pdf', 7, '2026-08-25 12:00:00', NULL);
