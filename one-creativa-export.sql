SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS asset_histories;


CREATE TABLE `asset_histories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `action_type` enum('tambah','pindah','update_kondisi','maintenance','stock_opname','hapus','pinjam','kembali') NOT NULL DEFAULT 'update_kondisi',
  `from_location` varchar(255) DEFAULT '',
  `to_location` varchar(255) DEFAULT '',
  `condition_before` varchar(50) DEFAULT NULL,
  `condition_after` varchar(50) DEFAULT NULL,
  `status_before` varchar(50) DEFAULT '',
  `status_after` varchar(50) DEFAULT '',
  `notes` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `performed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO asset_histories VALUES("1","1","tambah","","Kantor Pusat","","Baik","","Aktif","Aset baru ditambahkan ke sistem","8","2026-08-15 02:55:00");



DROP TABLE IF EXISTS asset_transfer_requests;


CREATE TABLE `asset_transfer_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `request_type` enum('pindah','pinjam','maintenance') NOT NULL DEFAULT 'pindah',
  `from_location` varchar(255) DEFAULT '',
  `to_location` varchar(255) DEFAULT '',
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS assets;


CREATE TABLE `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Elektronik',
  `brand` varchar(100) DEFAULT '',
  `model` varchar(100) DEFAULT '',
  `serial_number` varchar(150) DEFAULT '',
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(15,2) DEFAULT 0.00,
  `location` varchar(255) NOT NULL DEFAULT 'Kantor Pusat',
  `condition` enum('Baik','Rusak Ringan','Rusak Berat','Tidak Layak') NOT NULL DEFAULT 'Baik',
  `status` enum('Aktif','Maintenance','Tidak Aktif','Dipinjam') NOT NULL DEFAULT 'Aktif',
  `description` text DEFAULT NULL,
  `photo_path` varchar(500) DEFAULT NULL,
  `qr_code` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_code` (`asset_code`),
  UNIQUE KEY `qr_code` (`qr_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO assets VALUES("1","AST-2026-0001","hp","Elektronik","iphone","xr","IPHONe 202020","2026-08-19","4999985.00","Kantor Pusat","Baik","Aktif","iphpne","","AST-2026-0001","8","2026-08-15 02:55:00","2026-08-15 02:55:00");



DROP TABLE IF EXISTS attendance_logs;


CREATE TABLE `attendance_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `date` date NOT NULL,
  `check_in_at` timestamp NULL DEFAULT NULL,
  `check_out_at` timestamp NULL DEFAULT NULL,
  `check_in_lat` decimal(10,8) DEFAULT NULL,
  `check_in_lng` decimal(11,8) DEFAULT NULL,
  `check_out_lat` decimal(10,8) DEFAULT NULL,
  `check_out_lng` decimal(11,8) DEFAULT NULL,
  `face_verified` tinyint(1) DEFAULT 0,
  `geo_verified` tinyint(1) DEFAULT 0,
  `status` varchar(50) DEFAULT 'present',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`employee_id`,`date`),
  CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO attendance_logs VALUES("1","1","2026-06-19","2026-06-19 20:08:45","2026-06-19 20:08:50","","","","","1","0","late","Face Snapshot: uploads/face_snapshots/face_1_clock_in_20260619_200845.jpg, Face Snapshot Out: uploads/face_snapshots/face_1_clock_out_20260619_200850.jpg","2026-06-20 01:08:45");
INSERT INTO attendance_logs VALUES("2","1","2026-06-23","2026-06-23 08:00:00","2026-06-23 17:00:00","","","","","0","0","dinas","","2026-06-21 01:15:55");
INSERT INTO attendance_logs VALUES("3","1","2026-06-24","2026-06-24 08:00:00","2026-06-24 17:00:00","","","","","0","0","dinas","","2026-06-21 01:15:55");
INSERT INTO attendance_logs VALUES("4","1","2026-06-25","2026-06-25 08:00:00","2026-06-25 17:00:00","","","","","0","0","dinas","","2026-06-21 01:15:55");
INSERT INTO attendance_logs VALUES("5","1","2026-06-26","2026-06-26 08:00:00","2026-06-26 17:00:00","","","","","0","0","dinas","","2026-06-21 01:15:55");
INSERT INTO attendance_logs VALUES("7","7","2026-06-26","2026-06-26 02:16:05","","-6.24521450","107.02288625","","","1","0","present","Face Snapshot: uploads/face_snapshots/face_7_clock_in_20260626_021605.jpg","2026-06-26 02:16:05");
INSERT INTO attendance_logs VALUES("8","7","2026-06-27","2026-06-27 07:35:09","2026-06-27 07:35:28","-6.24531148","107.02291170","-6.24531148","107.02291170","1","0","late","","2026-06-27 07:35:09");
INSERT INTO attendance_logs VALUES("9","1","2026-07-01","2026-07-01 08:00:00","2026-07-01 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("10","1","2026-07-02","2026-07-02 08:00:00","2026-07-02 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("11","1","2026-07-03","2026-07-03 08:00:00","2026-07-03 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("12","1","2026-07-04","2026-07-04 08:00:00","2026-07-04 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("13","1","2026-07-05","2026-07-05 08:00:00","2026-07-05 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("14","1","2026-07-06","2026-07-06 08:00:00","2026-07-06 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("15","1","2026-07-07","2026-07-07 08:00:00","2026-07-07 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("16","1","2026-07-08","2026-07-08 08:00:00","2026-07-08 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("17","1","2026-07-09","2026-07-09 08:00:00","2026-07-09 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("18","1","2026-07-10","2026-07-10 08:00:00","2026-07-10 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("19","1","2026-07-11","2026-07-11 08:00:00","2026-07-11 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("20","1","2026-07-12","2026-07-12 08:00:00","2026-07-12 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("21","1","2026-07-13","2026-07-13 08:00:00","2026-07-13 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("22","1","2026-07-14","2026-07-14 08:00:00","2026-07-14 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("23","1","2026-07-15","2026-07-15 08:00:00","2026-07-15 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("24","1","2026-07-16","2026-07-16 08:00:00","2026-07-16 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("25","1","2026-07-17","2026-07-17 08:00:00","2026-07-17 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("26","1","2026-07-18","2026-07-18 08:00:00","2026-07-18 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("27","1","2026-07-19","2026-07-19 08:00:00","2026-07-19 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("28","1","2026-07-20","2026-07-20 08:00:00","2026-07-20 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("29","1","2026-07-21","2026-07-21 08:00:00","2026-07-21 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("30","1","2026-07-22","2026-07-22 08:00:00","2026-07-22 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("31","1","2026-07-23","2026-07-23 08:00:00","2026-07-23 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("32","1","2026-07-24","2026-07-24 08:00:00","2026-07-24 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("33","1","2026-07-25","2026-07-25 08:00:00","2026-07-25 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("34","1","2026-07-26","2026-07-26 08:00:00","2026-07-26 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("35","1","2026-07-27","2026-07-27 08:00:00","2026-07-27 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("36","1","2026-07-28","2026-07-28 08:00:00","2026-07-28 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("37","1","2026-07-29","2026-07-29 08:00:00","2026-07-29 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("38","1","2026-07-30","2026-07-30 08:00:00","2026-07-30 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("39","1","2026-07-31","2026-07-31 08:00:00","2026-07-31 17:00:00","","","","","0","0","dinas","","2026-07-02 00:15:47");
INSERT INTO attendance_logs VALUES("40","7","2026-10-05","2026-10-05 10:32:53","","-6.81082100","107.12559233","","","1","0","late","Face Snapshot: uploads/face_snapshots/face_7_clock_in_20261005_103253.jpg","2026-10-05 10:32:53");



DROP TABLE IF EXISTS auth_tokens;


CREATE TABLE `auth_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS billing_invoices;


CREATE TABLE `billing_invoices` (
  `id` varchar(50) NOT NULL,
  `tanggal` varchar(50) DEFAULT NULL,
  `customer` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `total` decimal(15,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'Belum Lunas',
  `jatuhTempo` varchar(50) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS billing_pembayaran;


CREATE TABLE `billing_pembayaran` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `noInv` varchar(50) DEFAULT NULL,
  `tglBayar` varchar(50) DEFAULT NULL,
  `customer` varchar(255) DEFAULT NULL,
  `metode` varchar(50) DEFAULT NULL,
  `jumlah` decimal(15,2) DEFAULT 0.00,
  `sisa` decimal(15,2) DEFAULT 0.00,
  `statusVerif` varchar(50) DEFAULT 'Menunggu',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS billing_siswa;


CREATE TABLE `billing_siswa` (
  `id` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `pic` varchar(255) DEFAULT NULL,
  `telp` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Baru',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS billing_terkirim;


CREATE TABLE `billing_terkirim` (
  `id` varchar(50) NOT NULL,
  `tglKirim` varchar(50) DEFAULT NULL,
  `customer` varchar(255) DEFAULT NULL,
  `kanal` varchar(50) DEFAULT NULL,
  `penerima` varchar(255) DEFAULT NULL,
  `statusKirim` varchar(50) DEFAULT NULL,
  `statusBaca` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS daily_reports;


CREATE TABLE `daily_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `report_date` date NOT NULL,
  `tasks` text NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_date` (`employee_id`,`report_date`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO daily_reports VALUES("1","1","2026-07-01","[{\"text\":\"membuat sistem absensi karyawan\",\"is_completed\":false},{\"text\":\"membuat nenkin \",\"is_completed\":true}]","","2026-07-02 02:18:35","2026-07-02 02:19:06");
INSERT INTO daily_reports VALUES("3","1","2026-08-03","[{\"text\":\"muhammad faizal\",\"status\":\"new\",\"finished_at\":null}]","","2026-08-03 11:06:21","2026-08-03 11:06:21");
INSERT INTO daily_reports VALUES("4","1","2026-08-17","[{\"text\":\"SJLkslksL\",\"status\":\"new\",\"finished_at\":null},{\"text\":\"NJSKDJLSK\",\"status\":\"new\",\"finished_at\":null},{\"text\":\"NDJSDKJLKD\",\"status\":\"new\",\"finished_at\":null}]","","2026-08-17 14:06:06","2026-08-17 14:06:06");
INSERT INTO daily_reports VALUES("5","7","2026-10-05","[{\"text\":\"Brifing Manager\",\"category\":\"Meeting\",\"description\":\"meeting pagi\",\"status\":\"done\",\"time\":\"12.04\",\"finished_at\":\"2026-10-05T05:04:14.875Z\"}]","","2026-10-05 12:04:14","2026-10-05 12:04:14");



DROP TABLE IF EXISTS departments;


CREATE TABLE `departments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO departments VALUES("1","IT","2026-06-20 03:28:33");
INSERT INTO departments VALUES("2","General Affair","2026-09-27 18:32:15");
INSERT INTO departments VALUES("3","HRD","2026-09-27 18:32:15");
INSERT INTO departments VALUES("4","General Manager","2026-09-27 18:32:15");
INSERT INTO departments VALUES("5","MANAGER","2026-09-27 18:32:15");
INSERT INTO departments VALUES("6","Finance","2026-09-27 18:32:15");
INSERT INTO departments VALUES("7","IT Developer","2026-09-27 18:32:15");



DROP TABLE IF EXISTS employees;


CREATE TABLE `employees` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `employee_code` varchar(20) NOT NULL COMMENT 'Nomor Induk Karyawan',
  `full_name` varchar(150) NOT NULL,
  `gender` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `position` varchar(100) NOT NULL,
  `department_id` int(10) unsigned DEFAULT NULL,
  `join_date` date NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `face_descriptor` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Vektor wajah terenkripsi untuk Face Match' CHECK (json_valid(`face_descriptor`)),
  `annual_leave_quota` int(10) unsigned DEFAULT 12 COMMENT 'Kuota cuti tahunan (hari)',
  `base_salary` decimal(15,2) NOT NULL DEFAULT 0.00,
  `work_type` enum('WFO','WFH') DEFAULT 'WFO',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `leave_balance` int(11) DEFAULT 12,
  `birth_place` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `emergency_name` varchar(100) DEFAULT NULL,
  `emergency_relation` varchar(50) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `npwp` varchar(50) DEFAULT NULL,
  `bank_name` varchar(50) DEFAULT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `bpjs_tk` varchar(50) DEFAULT NULL,
  `bpjs_kes` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO employees VALUES("1","3","2260005","Muhammad Faizal","Laki-laki","IT DEVELOPER","","2026-06-18","","","emp_1_1781723500.jpg","","12","7000000.00","WFO","2026-06-18 01:45:22","2026-07-02 00:43:45","12","","","","","","","","","","","","","","");
INSERT INTO employees VALUES("2","4","2260003","R.M Ramsyawaly Arief Syaifaraj Lazizkhan","Laki-laki","General Affair","","2026-06-18","","","emp_2_1781726793.jpg","","12","3000000.00","WFO","2026-06-18 03:06:32","2026-07-02 00:43:24","12","","","","","","","","","","","","","","");
INSERT INTO employees VALUES("3","5","2260004","Fitriani Laelaturrobikha","Perempuan","Staff Admin","","2026-06-18","","","emp_3_1781726965.jpg","","12","2500000.00","WFO","2026-06-18 03:09:25","2026-07-02 01:09:09","12","","","","","","","","","","","","","","");
INSERT INTO employees VALUES("7","10","2260002","Anggi Alfin S.Kom., M.Sc.","Laki-laki","General Manager","4","2026-06-25","08152222672","cikarang","1791175309_10.jpg","","12","10000000.00","WFH","2026-06-25 00:00:00","2026-10-05 11:49:04","12","Jakarta Selatan","1995-06-11","Islam","Single","O","Cikarang","mukidi","","085765456765","18628183729843938493","BCA","4600304807","82739874093809","73814872364987198");



DROP TABLE IF EXISTS finance_records;


CREATE TABLE `finance_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(100) DEFAULT 'Lainnya',
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `photo_path` varchar(500) DEFAULT NULL,
  `drive_link` text DEFAULT NULL,
  `metode` varchar(50) DEFAULT 'Transfer',
  `source` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO finance_records VALUES("2","income","Modal","2000000.00","hp","2026-10-01","2","2026-10-01 16:06:20","finance/finance_1790845580_2385.png","","Transfer","creativa","BCA","BCA","4600304807");
INSERT INTO finance_records VALUES("3","expense","Keperluan Kantor","2000000.00","hp","2026-10-01","2","2026-10-01 16:16:57","finance/finance_1790846217_9050.png","","Transfer","","BCA","yuns","4600304807");



DROP TABLE IF EXISTS invoice_clients;


CREATE TABLE `invoice_clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `program_type` enum('intensif_offline','matching_job') NOT NULL DEFAULT 'intensif_offline',
  `total_biaya` decimal(15,2) DEFAULT 0.00,
  `keterangan` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS invoice_records;


CREATE TABLE `invoice_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `jumlah` decimal(15,2) DEFAULT 0.00,
  `file_path` varchar(500) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `drive_link` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `invoice_records_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `invoice_clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS leave_requests;


CREATE TABLE `leave_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `leave_type_id` int(10) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(10) unsigned NOT NULL,
  `reason` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(10) unsigned DEFAULT NULL COMMENT 'user_id dari HR Admin',
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS leave_types;


CREATE TABLE `leave_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `max_days` int(10) unsigned NOT NULL DEFAULT 3,
  `is_paid` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO leave_types VALUES("1","Cuti Tahunan","12","1","2026-06-09 00:23:20");
INSERT INTO leave_types VALUES("2","Cuti Sakit","14","1","2026-06-09 00:23:20");
INSERT INTO leave_types VALUES("3","Cuti Melahirkan","90","1","2026-06-09 00:23:20");
INSERT INTO leave_types VALUES("4","Cuti Tanpa Gaji","30","0","2026-06-09 00:23:20");



DROP TABLE IF EXISTS leaves;


CREATE TABLE `leaves` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approver_role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO leaves VALUES("2","1","dinas","2026-06-23","2026-06-26","Dinas Luar Kota Untuk Meeting TSK di cianjur","","approved","2026-06-21 01:10:35","");
INSERT INTO leaves VALUES("3","1","dinas","2026-07-01","2026-07-31","Training sistem ke Tangerang","","approved","2026-07-02 00:15:14","");



DROP TABLE IF EXISTS lms_announcements;


CREATE TABLE `lms_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS lms_attendance;


CREATE TABLE `lms_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'hadir',
  `attended_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`meeting_id`,`siswa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS lms_grades;


CREATE TABLE `lms_grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `quiz` int(11) DEFAULT 0,
  `latihan1` int(11) DEFAULT 0,
  `latihan2` int(11) DEFAULT 0,
  `kaiwa` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_siswa` (`siswa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS lms_meetings;


CREATE TABLE `lms_meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `meeting_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `sensei_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` varchar(50) DEFAULT 'Masuk',
  `duration_hours` decimal(4,1) DEFAULT NULL,
  `material_file` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO lms_meetings VALUES("2","Pertemuan 1","Cara Menulis Gojuon table of Hiragana","2026-07-08","19:57:00","20:00:00","14","2026-07-12 13:59:59","Masuk","1.0","1783839599_gojuon.PNG");
INSERT INTO lms_meetings VALUES("3","yoon","Menulis Yoon","2026-07-13","14:37:00","16:36:00","14","2026-07-12 14:37:07","Masuk","1.0","1783841827_gojuon.PNG");



DROP TABLE IF EXISTS lms_submissions;


CREATE TABLE `lms_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `submission_file` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'submitted',
  `grade` varchar(10) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `lms_submissions_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `lms_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO lms_submissions VALUES("1","2","16","soal","1784702900_697_gojuon.PNG","graded","100","Sudah Bagus","2026-07-22 14:19:31");



DROP TABLE IF EXISTS lms_tasks;


CREATE TABLE `lms_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `file_attachment` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category` varchar(50) DEFAULT 'tugas',
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `lms_tasks_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `lms_meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO lms_tasks VALUES("2","2","Menulis Gojuon ","Tulis Gojuon di buku masing masing","2026-07-13 19:00:00","1783839599_969_gojuon.PNG","2026-07-12 13:59:59","tugas");



DROP TABLE IF EXISTS lpk_matching_job;


CREATE TABLE `lpk_matching_job` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(255) NOT NULL,
  `no_wa` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `file_cv` varchar(255) DEFAULT NULL,
  `file_ssw` varchar(255) DEFAULT NULL,
  `file_jft` varchar(255) DEFAULT NULL,
  `file_jlpt` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS lpk_nenkin;


CREATE TABLE `lpk_nenkin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kiso_nenkin_bango` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `no_wa` varchar(50) DEFAULT NULL,
  `tanggal_lahir` date NOT NULL,
  `alamat_indonesia` text NOT NULL,
  `nama_rekening` varchar(255) NOT NULL,
  `nama_bank` varchar(255) NOT NULL,
  `tanggal_pulang` date NOT NULL,
  `nama_perusahaan` varchar(255) NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `file_nenkin_techo` varchar(255) DEFAULT NULL,
  `file_formulir` varchar(255) DEFAULT NULL,
  `file_paspor` varchar(255) DEFAULT NULL,
  `file_rekening` varchar(255) DEFAULT NULL,
  `file_zairyu` varchar(255) DEFAULT NULL,
  `status_pengajuan` varchar(50) DEFAULT 'Menunggu Review',
  `dokumen_hasil` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS maintenance_schedules;


CREATE TABLE `maintenance_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `completed_date` date DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `cost` decimal(15,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_status` (`status`),
  KEY `idx_scheduled_date` (`scheduled_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS office_locations;


CREATE TABLE `office_locations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius_meters` int(10) unsigned NOT NULL DEFAULT 100 COMMENT 'Toleransi radius GPS dalam meter',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS payroll;


CREATE TABLE `payroll` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `period_month` tinyint(3) unsigned NOT NULL COMMENT '1-12',
  `period_year` smallint(5) unsigned NOT NULL,
  `base_salary` decimal(15,2) NOT NULL,
  `allowances` decimal(15,2) DEFAULT 0.00 COMMENT 'Tunjangan',
  `deductions` decimal(15,2) DEFAULT 0.00 COMMENT 'Potongan',
  `tax_deduction` decimal(15,2) DEFAULT 0.00 COMMENT 'Pajak PPh21',
  `net_salary` decimal(15,2) NOT NULL COMMENT 'Take Home Pay',
  `attendance_days` int(10) unsigned DEFAULT 0,
  `absent_days` int(10) unsigned DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 0 COMMENT 'Slip gaji sudah rilis ke karyawan',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payroll` (`employee_id`,`period_month`,`period_year`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS payslips;


CREATE TABLE `payslips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `month` varchar(10) NOT NULL,
  `base_salary` decimal(15,2) DEFAULT 0.00,
  `late_minutes` int(11) DEFAULT 0,
  `overtime_minutes` int(11) DEFAULT 0,
  `late_penalty` decimal(15,2) DEFAULT 0.00,
  `overtime_pay` decimal(15,2) DEFAULT 0.00,
  `bpjs_tk` decimal(15,2) DEFAULT 0.00,
  `bpjs_kes` decimal(15,2) DEFAULT 0.00,
  `bpjs_jp` decimal(15,2) DEFAULT 0.00,
  `pph21` decimal(15,2) DEFAULT 0.00,
  `total_potongan` decimal(15,2) DEFAULT 0.00,
  `total_salary` decimal(15,2) DEFAULT 0.00,
  `published_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('draft','published') DEFAULT 'draft',
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_month` (`employee_id`,`month`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO payslips VALUES("1","1","2026-07","7000000.00","0","0","0.00","0.00","0.00","0.00","0.00","0.00","0.00","7000000.00","2026-07-02 01:24:52","published");
INSERT INTO payslips VALUES("2","2","2026-07","3000000.00","0","0","0.00","0.00","0.00","0.00","0.00","0.00","0.00","3000000.00","2026-07-02 01:24:52","published");
INSERT INTO payslips VALUES("3","3","2026-07","2500000.00","0","0","0.00","0.00","0.00","0.00","0.00","0.00","0.00","2500000.00","2026-07-02 01:24:52","published");
INSERT INTO payslips VALUES("4","7","2026-07","10000000.00","0","0","0.00","0.00","0.00","0.00","0.00","0.00","0.00","10000000.00","2026-07-02 01:24:52","published");



DROP TABLE IF EXISTS peserta_intensif;


CREATE TABLE `peserta_intensif` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(255) NOT NULL,
  `no_wa` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `foto_ktp` varchar(255) DEFAULT NULL,
  `sertifikat` varchar(255) DEFAULT NULL,
  `dokumen` varchar(255) DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `no_ktp` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `batch` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO peserta_intensif VALUES("2","MUHAMMAD FAIZAL","-","dummy_1790753638106@test.com","","","","","2026-09-30 14:33:58","-","18","N5","BATCH 2");
INSERT INTO peserta_intensif VALUES("3","RAMSYAWALLY","-","dummy_1790753652721@test.com","","","","","2026-09-30 14:34:12","-","19","N5","BATCH 2");
INSERT INTO peserta_intensif VALUES("4","APRIANTO","-","dummy_1790753668477@test.com","","","","","2026-09-30 14:34:28","-","20","N5","BATCH 2");



DROP TABLE IF EXISTS positions;


CREATE TABLE `positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `base_salary` decimal(15,2) DEFAULT 0.00,
  `department_id` int(11) DEFAULT NULL,
  `level` varchar(50) DEFAULT 'Staff',
  `tunjangan` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO positions VALUES("1","Head General Affair","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("2","General Affair","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("3","General Manager","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("4","Project Manager","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("5","Manager","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("6","Advokat","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("7","FullStack Developer","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("8","Manager Finance","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("9","Finance","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("10","Manager HRD","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("11","HRD","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("12","Admin","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("13","Head Marketing","0.00","","Staff","0.00","1","");
INSERT INTO positions VALUES("14","Marketing","0.00","","Staff","0.00","1","");



DROP TABLE IF EXISTS reimbursements;


CREATE TABLE `reimbursements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text NOT NULL,
  `receipt_path` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `finance_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS roles;


CREATE TABLE `roles` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'employee | hr_admin | finance_admin | super_admin',
  `label` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO roles VALUES("1","employee","Karyawan","2026-06-09 00:23:19");
INSERT INTO roles VALUES("2","hr_admin","HR Admin","2026-06-09 00:23:19");
INSERT INTO roles VALUES("3","finance_admin","Finance Admin","2026-06-09 00:23:19");
INSERT INTO roles VALUES("4","super_admin","Super Admin / Owner","2026-06-09 00:23:19");
INSERT INTO roles VALUES("5","admin","","2026-06-18 00:25:27");
INSERT INTO roles VALUES("6","karyawan","karyawan","2026-06-18 01:45:22");
INSERT INTO roles VALUES("7","hr","hr","2026-06-18 03:19:34");
INSERT INTO roles VALUES("8","finance","finance","2026-06-18 03:20:26");
INSERT INTO roles VALUES("9","ga","ga","2026-06-18 03:21:04");
INSERT INTO roles VALUES("13","lpk","lpk","2026-07-01 20:27:36");
INSERT INTO roles VALUES("14","peserta_nenkin","peserta_nenkin","2026-07-01 23:39:11");
INSERT INTO roles VALUES("15","sensei","sensei","2026-07-10 16:52:27");
INSERT INTO roles VALUES("16","peserta_intensif","peserta_intensif","2026-07-10 17:00:54");



DROP TABLE IF EXISTS settings;


CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL DEFAULT 'PT. Creativa Bridging International',
  `check_in_time` varchar(20) NOT NULL DEFAULT '08:00:00',
  `tolerance_minutes` int(11) NOT NULL DEFAULT 10,
  `office_latitude` varchar(50) DEFAULT '-6.2088',
  `office_longitude` varchar(50) DEFAULT '106.8456',
  `office_radius` int(11) DEFAULT 50,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO settings VALUES("1","PT. Creativa Bridging International","09:00:00","5","-6.2088","106.8456","50","2026-06-25 22:03:36","2026-08-01 12:48:36");



DROP TABLE IF EXISTS transactions;


CREATE TABLE `transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `receipt_url` varchar(255) DEFAULT NULL COMMENT 'Foto struk/nota',
  `ocr_raw_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Data mentah hasil OCR' CHECK (json_valid(`ocr_raw_data`)),
  `status` enum('pending_review','verified','rejected') DEFAULT 'verified',
  `created_by` int(10) unsigned NOT NULL COMMENT 'user_id',
  `verified_by` int(10) unsigned DEFAULT NULL COMMENT 'user_id Finance Admin',
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




DROP TABLE IF EXISTS users;


CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `pin_hash` varchar(255) DEFAULT NULL COMMENT 'PIN terenkripsi untuk akses Slip Gaji',
  `role_id` tinyint(3) unsigned NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO users VALUES("2","admin@onecreativa.com","$2y$10$kitiof00EdlCL53oIYelhOW35.PKSi8BKqT6GPm/5nNwG4rchoSIy","","4","1","","2026-06-18 00:31:01","2026-06-27 07:15:42");
INSERT INTO users VALUES("4","ramlazizkhan77@gmail.com","$2y$10$3/3MBfJAF2KENXQ9MinDdeGnPxP6AT99DfSzlfygcPgFWBXwhPJAa","","6","1","","2026-06-18 03:06:32","2026-07-02 00:43:24");
INSERT INTO users VALUES("5","flaelaturrobikha@gmail.com","$2y$10$0RjIO0j9Zmz7a3bkJePJ9.r8Jw4GnNP8TIUaCfohP4alLXtI17Z0W","","6","1","","2026-06-18 03:09:25","2026-07-02 01:09:09");
INSERT INTO users VALUES("9","andi@creativa.com","$2y$10$wgpLf/o7Gtdo.vHC/zSjHe8K7asSjK9PZna8NT44/HX1/YqFibLJq","","6","1","","2026-06-20 03:28:33","2026-06-20 03:28:33");
INSERT INTO users VALUES("10","aalfinarrahman@gmail.com","$2y$10$HngDq/gs1IF4C1craKooj.vvR.APoakKfAfsZjn4WlXH8H4Koc0vS","","6","1","","2026-06-25 23:10:53","2026-09-27 18:43:35");



SET FOREIGN_KEY_CHECKS = 1;
