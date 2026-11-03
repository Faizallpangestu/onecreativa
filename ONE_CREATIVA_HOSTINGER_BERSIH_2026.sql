-- ============================================================================
-- ONE CREATIVA - MASTER DATABASE INSTALLATION PRODUKSI (HOSTINGER)
-- Clean Slate: Memulai dari 0, Tanpa Data Transaksi Dummy/Test Lama
-- Tanggal Pembuatan: 02 November 2026
-- Target Hostinger DB: u260890310_one
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. STRUKTUR SELURUH TABEL SISTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS `accounting_audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(40) NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `action` varchar(40) NOT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `actor_name` varchar(255) NOT NULL,
  `details_json` longtext NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `hash_prev` varchar(64) DEFAULT NULL,
  `hash_self` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `entity_type` (`entity_type`,`entity_id`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_idempotency` (
  `request_key` varchar(100) NOT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `operation` varchar(50) NOT NULL,
  `payload_hash` char(64) NOT NULL,
  `result_json` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`request_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_periods` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `month` char(7) NOT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `closed_by` int(10) unsigned DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `month` (`month`)
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_source_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `source_type` varchar(40) NOT NULL,
  `source_id` varchar(100) NOT NULL,
  `number` varchar(100) NOT NULL,
  `document_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `control_account_id` int(10) unsigned NOT NULL,
  `recognition_account_id` int(10) unsigned NOT NULL,
  `journal_entry_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `journal_entry_id` (`journal_entry_id`),
  UNIQUE KEY `source_type` (`source_type`,`source_id`),
  KEY `control_account_id` (`control_account_id`),
  KEY `recognition_account_id` (`recognition_account_id`),
  CONSTRAINT `accounting_source_documents_ibfk_1` FOREIGN KEY (`control_account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `accounting_source_documents_ibfk_2` FOREIGN KEY (`recognition_account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `accounting_source_documents_ibfk_3` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(40) DEFAULT NULL,
  `request_key` varchar(100) NOT NULL,
  `transaction_date` date NOT NULL,
  `type` enum('income','expense','transfer') NOT NULL,
  `classification` varchar(50) NOT NULL,
  `source_type` varchar(40) NOT NULL,
  `source_id` varchar(100) NOT NULL,
  `source_number` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'IDR',
  `cash_account_id` int(10) unsigned NOT NULL,
  `destination_cash_account_id` int(10) unsigned DEFAULT NULL,
  `counter_account_id` int(10) unsigned NOT NULL,
  `department_id` int(10) unsigned DEFAULT NULL,
  `batch` varchar(100) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `vendor_id` int(10) unsigned DEFAULT NULL,
  `party_name` varchar(255) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `reference` varchar(180) NOT NULL,
  `approval_status` enum('draft','submitted','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
  `payment_status` enum('unpaid','paid','verified','reversed') NOT NULL DEFAULT 'unpaid',
  `journal_status` enum('unposted','posted','reversed') NOT NULL DEFAULT 'unposted',
  `created_by` int(10) unsigned NOT NULL,
  `created_by_name` varchar(255) NOT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `approved_by_name` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_note` text DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `verified_by` int(10) unsigned DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `journal_entry_id` bigint(20) unsigned DEFAULT NULL,
  `attachment_key` char(32) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_link` varchar(2048) DEFAULT NULL,
  `legacy_finance_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_key` (`request_key`),
  UNIQUE KEY `number` (`number`),
  UNIQUE KEY `journal_entry_id` (`journal_entry_id`),
  UNIQUE KEY `legacy_finance_id` (`legacy_finance_id`),
  KEY `cash_account_id` (`cash_account_id`),
  KEY `destination_cash_account_id` (`destination_cash_account_id`),
  KEY `counter_account_id` (`counter_account_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `transaction_date` (`transaction_date`,`source_type`),
  KEY `source_type` (`source_type`,`source_id`),
  KEY `approval_status` (`approval_status`,`payment_status`,`journal_status`),
  CONSTRAINT `accounting_transactions_ibfk_1` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_bank_accounts` (`id`),
  CONSTRAINT `accounting_transactions_ibfk_2` FOREIGN KEY (`destination_cash_account_id`) REFERENCES `cash_bank_accounts` (`id`),
  CONSTRAINT `accounting_transactions_ibfk_3` FOREIGN KEY (`counter_account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `accounting_transactions_ibfk_4` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`),
  CONSTRAINT `accounting_transactions_ibfk_5` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `account_group` tinyint(4) NOT NULL,
  `normal_balance` enum('debit','credit') NOT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `is_detail` tinyint(4) NOT NULL DEFAULT 1,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `report_class` varchar(40) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`account_group` between 1 and 5)
) ENGINE=InnoDB AUTO_INCREMENT=187 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `asset_histories` (
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

CREATE TABLE IF NOT EXISTS `asset_transfer_requests` (
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

CREATE TABLE IF NOT EXISTS `assets` (
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

CREATE TABLE IF NOT EXISTS `attendance_logs` (
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
) ENGINE=InnoDB AUTO_INCREMENT=424 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `auth_tokens` (
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

CREATE TABLE IF NOT EXISTS `billing_invoices` (
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

CREATE TABLE IF NOT EXISTS `billing_pembayaran` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `billing_siswa` (
  `id` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `pic` varchar(255) DEFAULT NULL,
  `telp` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Baru',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `billing_terkirim` (
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

CREATE TABLE IF NOT EXISTS `budget_commitments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `budget_item_id` int(10) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('open','consumed','cancelled') NOT NULL DEFAULT 'open',
  `created_by` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `budget_item_id` (`budget_item_id`),
  CONSTRAINT `budget_commitments_ibfk_1` FOREIGN KEY (`budget_item_id`) REFERENCES `budget_request_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `budget_realizations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_key` varchar(100) NOT NULL,
  `budget_request_id` int(10) unsigned NOT NULL,
  `budget_item_id` int(10) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `classification` enum('expense','asset','prepayment','vendor_bill') NOT NULL,
  `vendor_id` int(10) unsigned DEFAULT NULL,
  `vendor_bill_id` int(10) unsigned DEFAULT NULL,
  `commitment_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `journal_entry_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('recorded','cancelled') NOT NULL DEFAULT 'recorded',
  `created_by` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_key` (`request_key`),
  UNIQUE KEY `commitment_id` (`commitment_id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  UNIQUE KEY `journal_entry_id` (`journal_entry_id`),
  KEY `budget_request_id` (`budget_request_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `vendor_bill_id` (`vendor_bill_id`),
  KEY `budget_item_id` (`budget_item_id`,`status`),
  CONSTRAINT `budget_realizations_ibfk_1` FOREIGN KEY (`budget_request_id`) REFERENCES `budget_requests` (`id`),
  CONSTRAINT `budget_realizations_ibfk_2` FOREIGN KEY (`budget_item_id`) REFERENCES `budget_request_items` (`id`),
  CONSTRAINT `budget_realizations_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `budget_realizations_ibfk_4` FOREIGN KEY (`vendor_bill_id`) REFERENCES `vendor_bills` (`id`),
  CONSTRAINT `budget_realizations_ibfk_5` FOREIGN KEY (`commitment_id`) REFERENCES `budget_commitments` (`id`),
  CONSTRAINT `budget_realizations_ibfk_6` FOREIGN KEY (`transaction_id`) REFERENCES `accounting_transactions` (`id`),
  CONSTRAINT `budget_realizations_ibfk_7` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `budget_request_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `budget_request_id` int(10) unsigned NOT NULL,
  `action` varchar(30) NOT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) NOT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `actor_name` varchar(255) NOT NULL,
  `actor_role` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `snapshot_json` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_budget_history_request` (`budget_request_id`,`id`),
  CONSTRAINT `fk_budget_history_request` FOREIGN KEY (`budget_request_id`) REFERENCES `budget_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `budget_request_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `budget_request_id` int(10) unsigned NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` varchar(500) NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `unit` varchar(40) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_budget_items_request` (`budget_request_id`),
  CONSTRAINT `fk_budget_items_request` FOREIGN KEY (`budget_request_id`) REFERENCES `budget_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `budget_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_key` char(36) NOT NULL,
  `title` varchar(180) NOT NULL,
  `period` date NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','submitted','under_review','approved','rejected','cancelled','partially_realized','fully_realized','closed') NOT NULL DEFAULT 'draft',
  `total_amount` decimal(15,2) NOT NULL,
  `created_by` int(10) unsigned NOT NULL,
  `created_by_name` varchar(255) NOT NULL,
  `reviewed_by` int(10) unsigned DEFAULT NULL,
  `reviewed_by_name` varchar(255) DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `attachment_key` char(32) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_link` varchar(2048) DEFAULT NULL,
  `department_id` int(10) unsigned DEFAULT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_key` (`request_key`),
  KEY `idx_budget_period_status` (`period`,`status`),
  KEY `idx_budget_submitted` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cash_bank_accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_id` (`account_id`),
  CONSTRAINT `cash_bank_accounts_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `daily_reports` (
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

CREATE TABLE IF NOT EXISTS `departments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `employee_employment` (
  `employee_id` int(10) unsigned NOT NULL,
  `manager_employee_id` int(10) unsigned DEFAULT NULL,
  `employment_type` varchar(50) DEFAULT NULL,
  `employment_status` varchar(50) DEFAULT NULL,
  `resignation_date` date DEFAULT NULL,
  `updated_by` int(10) unsigned NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`employee_id`),
  KEY `manager_employee_id` (`manager_employee_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `employee_employment_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `employee_employment_ibfk_2` FOREIGN KEY (`manager_employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `employee_employment_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`manager_employee_id` is null or `manager_employee_id` <> `employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `employees` (
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
  `face_descriptor` longtext DEFAULT NULL COMMENT 'Vektor wajah terenkripsi untuk Face Match' CHECK (json_valid(`face_descriptor`)),
  `annual_leave_quota` int(10) unsigned DEFAULT 12 COMMENT 'Kuota cuti tahunan (hari)',
  `base_salary` decimal(15,2) NOT NULL DEFAULT 0.00,
  `work_type` varchar(20) NOT NULL DEFAULT 'WFO',
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
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `finance_records` (
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
  `budget_request_id` int(10) unsigned DEFAULT NULL,
  `salary_request_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_finance_budget_request` (`budget_request_id`),
  UNIQUE KEY `uq_finance_salary_request` (`salary_request_id`),
  CONSTRAINT `fk_finance_budget_request` FOREIGN KEY (`budget_request_id`) REFERENCES `budget_requests` (`id`),
  CONSTRAINT `fk_finance_salary_request` FOREIGN KEY (`salary_request_id`) REFERENCES `salary_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `finance_role_permissions` (
  `role_name` varchar(50) NOT NULL,
  `permission` varchar(30) NOT NULL,
  `allowed` tinyint(4) NOT NULL,
  PRIMARY KEY (`role_name`,`permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `financial_report_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` enum('revenue','cogs','expense','asset','liability','equity') NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `type` enum('debit','credit','inflow','outflow') NOT NULL DEFAULT 'debit',
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `adjustment_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `invoice_clients` (
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

CREATE TABLE IF NOT EXISTS `invoice_records` (
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

CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(40) DEFAULT NULL,
  `entry_date` date NOT NULL,
  `period_id` int(10) unsigned NOT NULL,
  `source_type` varchar(40) NOT NULL,
  `source_id` varchar(100) NOT NULL,
  `event` varchar(40) NOT NULL,
  `description` text NOT NULL,
  `status` enum('draft','posted') NOT NULL DEFAULT 'draft',
  `created_by` int(10) unsigned NOT NULL,
  `posted_at` datetime DEFAULT NULL,
  `reversal_of` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_journal_source` (`source_type`,`source_id`,`event`),
  UNIQUE KEY `number` (`number`),
  UNIQUE KEY `reversal_of` (`reversal_of`),
  KEY `period_id` (`period_id`),
  KEY `entry_date` (`entry_date`,`status`),
  CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`period_id`) REFERENCES `accounting_periods` (`id`),
  CONSTRAINT `journal_entries_ibfk_2` FOREIGN KEY (`reversal_of`) REFERENCES `journal_entries` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `journal_lines` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `journal_entry_id` bigint(20) unsigned NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `debit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `department_id` int(10) unsigned DEFAULT NULL,
  `batch` varchar(100) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `vendor_id` int(10) unsigned DEFAULT NULL,
  `party_name` varchar(255) DEFAULT NULL,
  `document_type` varchar(40) DEFAULT NULL,
  `document_id` varchar(100) DEFAULT NULL,
  `cash_flow_class` enum('operating','investing','financing','transfer','noncash') NOT NULL DEFAULT 'noncash',
  PRIMARY KEY (`id`),
  KEY `journal_entry_id` (`journal_entry_id`),
  KEY `account_id` (`account_id`,`journal_entry_id`),
  KEY `document_type` (`document_type`,`document_id`),
  CONSTRAINT `journal_lines_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`),
  CONSTRAINT `journal_lines_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`debit` > 0 and `credit` = 0 or `credit` > 0 and `debit` = 0)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `leave_requests` (
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

CREATE TABLE IF NOT EXISTS `leave_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `max_days` int(10) unsigned NOT NULL DEFAULT 3,
  `is_paid` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `leaves` (
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

CREATE TABLE IF NOT EXISTS `lms_agenda_pendidikan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cabang` varchar(100) NOT NULL,
  `batch` varchar(150) NOT NULL,
  `program` varchar(150) DEFAULT 'Program Intensif',
  `tahun` int(11) DEFAULT 2026,
  `kapasitas_p` int(11) DEFAULT 0,
  `kapasitas_l` int(11) DEFAULT 0,
  `kapasitas_total` int(11) DEFAULT 0,
  `kuota_p` int(11) DEFAULT 0,
  `kuota_l` int(11) DEFAULT 0,
  `kuota_total` int(11) DEFAULT 0,
  `kuota_keterangan` varchar(255) DEFAULT '',
  `est_pra_pendidikan` date DEFAULT NULL,
  `est_kedatangan_asrama` date DEFAULT NULL,
  `est_mulai_offline` date DEFAULT NULL,
  `act_pra_pendidikan` date DEFAULT NULL,
  `act_kedatangan_asrama` date DEFAULT NULL,
  `act_mulai_offline` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Aktif',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_attendance` (
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

CREATE TABLE IF NOT EXISTS `lms_attendance_sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `issued_by` int(10) unsigned NOT NULL,
  `issued_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `issued_by` (`issued_by`),
  KEY `meeting_id` (`meeting_id`,`expires_at`),
  CONSTRAINT `lms_attendance_sessions_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `lms_meetings` (`id`),
  CONSTRAINT `lms_attendance_sessions_ibfk_2` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`revoked` in (0,1)),
  CONSTRAINT `CONSTRAINT_2` CHECK (`expires_at` > `issued_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_class_enrollments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int(10) unsigned NOT NULL,
  `student_id` int(11) NOT NULL,
  `joined_on` date NOT NULL,
  `left_on` date DEFAULT NULL,
  `status` enum('active','completed','withdrawn') NOT NULL DEFAULT 'active',
  `enrolled_by` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_id` (`class_id`,`student_id`),
  KEY `student_id` (`student_id`),
  KEY `enrolled_by` (`enrolled_by`),
  CONSTRAINT `lms_class_enrollments_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `lms_classes` (`id`),
  CONSTRAINT `lms_class_enrollments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `peserta_intensif` (`id`),
  CONSTRAINT `lms_class_enrollments_ibfk_3` FOREIGN KEY (`enrolled_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`left_on` is null or `left_on` >= `joined_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_classes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `program_code` varchar(100) NOT NULL,
  `batch` varchar(100) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `schedule_days` varchar(100) DEFAULT 'Senin & Rabu',
  `schedule_time` varchar(100) DEFAULT '08:00 - 09:30',
  `total_meetings` int(11) DEFAULT 32,
  `completed_meetings` int(11) DEFAULT 0,
  `timezone` varchar(64) NOT NULL DEFAULT 'Asia/Jakarta',
  `status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
  `created_by` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `lms_classes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_grade_publications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int(10) unsigned NOT NULL,
  `submission_id` int(11) DEFAULT NULL,
  `grade_record_id` int(11) DEFAULT NULL,
  `published_by` int(10) unsigned DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `submission_id` (`submission_id`),
  UNIQUE KEY `grade_record_id` (`grade_record_id`),
  KEY `class_id` (`class_id`),
  KEY `published_by` (`published_by`),
  CONSTRAINT `lms_grade_publications_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `lms_classes` (`id`),
  CONSTRAINT `lms_grade_publications_ibfk_2` FOREIGN KEY (`submission_id`) REFERENCES `lms_submissions` (`id`),
  CONSTRAINT `lms_grade_publications_ibfk_3` FOREIGN KEY (`grade_record_id`) REFERENCES `lms_grades` (`id`),
  CONSTRAINT `lms_grade_publications_ibfk_4` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK ((`submission_id` is not null) + (`grade_record_id` is not null) = 1),
  CONSTRAINT `CONSTRAINT_2` CHECK (`published_by` is null and `published_at` is null or `published_by` is not null and `published_at` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `quiz` int(11) DEFAULT 0,
  `latihan1` int(11) DEFAULT 0,
  `latihan2` int(11) DEFAULT 0,
  `kaiwa` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_siswa` (`siswa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_meeting_assignments` (
  `meeting_id` int(11) NOT NULL,
  `assignment_id` int(10) unsigned NOT NULL,
  `linked_by` int(10) unsigned NOT NULL,
  `linked_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`meeting_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `linked_by` (`linked_by`),
  CONSTRAINT `lms_meeting_assignments_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `lms_meetings` (`id`),
  CONSTRAINT `lms_meeting_assignments_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `lms_teaching_assignments` (`id`),
  CONSTRAINT `lms_meeting_assignments_ibfk_3` FOREIGN KEY (`linked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_meetings` (
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

CREATE TABLE IF NOT EXISTS `lms_submissions` (
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

CREATE TABLE IF NOT EXISTS `lms_tasks` (
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

CREATE TABLE IF NOT EXISTS `lms_teaching_assignments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int(10) unsigned NOT NULL,
  `sensei_user_id` int(10) unsigned NOT NULL,
  `starts_on` date NOT NULL,
  `ends_on` date DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `assigned_by` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_id` (`class_id`,`sensei_user_id`,`starts_on`),
  KEY `sensei_user_id` (`sensei_user_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `lms_teaching_assignments_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `lms_classes` (`id`),
  CONSTRAINT `lms_teaching_assignments_ibfk_2` FOREIGN KEY (`sensei_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `lms_teaching_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`ends_on` is null or `ends_on` >= `starts_on`),
  CONSTRAINT `CONSTRAINT_2` CHECK (`is_active` in (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `login_audit_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 0,
  `user_name` varchar(150) NOT NULL DEFAULT '',
  `user_role` varchar(60) NOT NULL DEFAULT '',
  `action` enum('login','logout','login_failed') NOT NULL DEFAULT 'login',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(300) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_ts` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lpk_matching_job` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(255) NOT NULL,
  `no_wa` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `file_cv` varchar(255) DEFAULT NULL,
  `file_ssw` varchar(255) DEFAULT NULL,
  `file_jft` varchar(255) DEFAULT NULL,
  `file_jlpt` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto` varchar(255) DEFAULT NULL,
  `usia` int(11) DEFAULT NULL,
  `lpk_pengirim` varchar(255) DEFAULT NULL,
  `tsk_name` varchar(255) DEFAULT NULL,
  `bidang` varchar(255) DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  `biaya_matching` decimal(15,2) DEFAULT NULL,
  `include_fasilitas` text DEFAULT NULL,
  `progress` varchar(100) NOT NULL DEFAULT 'Pendaftaran',
  `catatan` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_candidate_job` (`job_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lpk_nenkin` (
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

CREATE TABLE IF NOT EXISTS `maintenance_schedules` (
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

CREATE TABLE IF NOT EXISTS `matching_candidate_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `candidate_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `previous_status` varchar(100) DEFAULT NULL,
  `next_status` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `actor_id` (`actor_id`),
  KEY `candidate_id` (`candidate_id`,`id`),
  CONSTRAINT `matching_candidate_history_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `lpk_matching_job` (`id`),
  CONSTRAINT `matching_candidate_history_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `matching_jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_title` varchar(255) NOT NULL,
  `bidang` varchar(150) NOT NULL,
  `source_type` varchar(50) NOT NULL DEFAULT 'TSK',
  `source_name` varchar(255) NOT NULL,
  `source_pic` varchar(255) DEFAULT NULL,
  `source_contact` varchar(100) DEFAULT NULL,
  `lokasi_jepang` varchar(255) NOT NULL,
  `kuota` int(11) NOT NULL DEFAULT 1,
  `total_biaya` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'IDR',
  `include_items` text DEFAULT NULL,
  `include_custom` text DEFAULT NULL,
  `exclude_items` text DEFAULT NULL,
  `estimasi_gaji` varchar(255) DEFAULT NULL,
  `persyaratan` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'open',
  `deskripsi` text DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mj_bidang` (`bidang`),
  KEY `idx_mj_source` (`source_type`,`source_name`),
  KEY `idx_mj_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `matching_student_links` (
  `candidate_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `linked_by` int(10) unsigned NOT NULL,
  `linked_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`candidate_id`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `linked_by` (`linked_by`),
  CONSTRAINT `matching_student_links_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `lpk_matching_job` (`id`),
  CONSTRAINT `matching_student_links_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `peserta_intensif` (`id`),
  CONSTRAINT `matching_student_links_ibfk_3` FOREIGN KEY (`linked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `office_locations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius_meters` int(10) unsigned NOT NULL DEFAULT 100 COMMENT 'Toleransi radius GPS dalam meter',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `overtime_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `attendance_id` int(10) unsigned DEFAULT NULL,
  `date` date NOT NULL,
  `overtime_minutes` int(10) unsigned NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` int(10) unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reject_reason` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `attendance_id` (`attendance_id`),
  KEY `approved_by` (`approved_by`),
  KEY `employee_id` (`employee_id`,`date`,`status`),
  CONSTRAINT `overtime_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `overtime_requests_ibfk_2` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_logs` (`id`),
  CONSTRAINT `overtime_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`overtime_minutes` between 1 and 1440),
  CONSTRAINT `CONSTRAINT_2` CHECK (`status` = 'pending' and `approved_by` is null and `approved_at` is null or `status` <> 'pending' and `approved_by` is not null and `approved_at` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payment_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint(20) unsigned NOT NULL,
  `source_document_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `is_reversed` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `source_document_id` (`source_document_id`),
  CONSTRAINT `payment_allocations_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `accounting_transactions` (`id`),
  CONSTRAINT `payment_allocations_ibfk_2` FOREIGN KEY (`source_document_id`) REFERENCES `accounting_source_documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payroll` (
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

CREATE TABLE IF NOT EXISTS `payslips` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `peserta_intensif` (
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
  `nis` varchar(50) DEFAULT NULL,
  `affiliator` varchar(100) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT NULL,
  `kode_pos` varchar(20) DEFAULT NULL,
  `negara` varchar(50) DEFAULT 'Indonesia',
  `program` varchar(150) DEFAULT 'Program Pelatihan Jepang',
  `status` varchar(50) DEFAULT 'Aktif',
  `web_id` int(11) DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `positions` (
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

CREATE TABLE IF NOT EXISTS `reimbursements` (
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

CREATE TABLE IF NOT EXISTS `roles` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'employee | hr_admin | finance_admin | super_admin',
  `label` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `salary_base_rates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `effective_month` char(7) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `actor_name` varchar(255) NOT NULL,
  `actor_role` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `bpjs_tk_deduction` decimal(15,2) DEFAULT NULL,
  `bpjs_kes_deduction` decimal(15,2) DEFAULT NULL,
  `pph21_deduction` decimal(15,2) DEFAULT NULL,
  `kasbon_deduction` decimal(15,2) NOT NULL DEFAULT 0.00,
  `ptkp_status` varchar(20) NOT NULL DEFAULT 'TK/0',
  `bpjs_tk_number` varchar(50) NOT NULL DEFAULT '',
  `bpjs_kes_number` varchar(50) NOT NULL DEFAULT '',
  `npwp` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_salary_base_effective` (`employee_id`,`effective_month`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `salary_request_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `salary_request_id` int(10) unsigned NOT NULL,
  `action` varchar(30) NOT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `actor_name` varchar(255) NOT NULL,
  `actor_role` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `snapshot_json` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_salary_history` (`salary_request_id`,`id`),
  CONSTRAINT `fk_salary_history` FOREIGN KEY (`salary_request_id`) REFERENCES `salary_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `salary_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `month` char(7) NOT NULL,
  `employee_code` varchar(20) NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `position_name` varchar(100) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `payday` date NOT NULL,
  `base_salary` decimal(15,2) NOT NULL,
  `salary_source` varchar(20) NOT NULL,
  `work_days` int(10) unsigned NOT NULL,
  `meal_rate` decimal(15,2) NOT NULL,
  `transport_rate` decimal(15,2) NOT NULL,
  `meal_allowance` decimal(15,2) NOT NULL,
  `transport_allowance` decimal(15,2) NOT NULL,
  `total_salary` decimal(15,2) NOT NULL,
  `attendance_json` longtext NOT NULL,
  `bank_name` varchar(100) NOT NULL DEFAULT '',
  `account_name` varchar(150) NOT NULL DEFAULT '',
  `account_number` varchar(100) NOT NULL DEFAULT '',
  `status` enum('draft','submitted','approved','rejected','paid') NOT NULL DEFAULT 'draft',
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  `created_by` int(10) unsigned NOT NULL,
  `created_by_name` varchar(255) NOT NULL,
  `submitted_by` int(10) unsigned DEFAULT NULL,
  `submitted_by_name` varchar(255) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_by` int(10) unsigned DEFAULT NULL,
  `reviewed_by_name` varchar(255) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `paid_by` int(10) unsigned DEFAULT NULL,
  `paid_by_name` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `transfer_reference` varchar(180) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `base_salary_rate_id` int(10) unsigned DEFAULT NULL,
  `base_salary_effective_month` char(7) DEFAULT NULL,
  `employee_join_date` date DEFAULT NULL,
  `thr_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `kasbon_deduction` decimal(15,2) NOT NULL DEFAULT 0.00,
  `bpjs_tk_deduction` decimal(15,2) NOT NULL DEFAULT 0.00,
  `bpjs_kes_deduction` decimal(15,2) NOT NULL DEFAULT 0.00,
  `pph21_deduction` decimal(15,2) NOT NULL DEFAULT 0.00,
  `leave_deduction` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gross_salary` decimal(15,2) DEFAULT NULL,
  `total_deductions` decimal(15,2) NOT NULL DEFAULT 0.00,
  `adjustment_note` varchar(2000) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_salary_employee_month` (`employee_id`,`month`),
  KEY `idx_salary_month_status` (`month`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `salary_slip_events` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `salary_slip_id` int(10) unsigned NOT NULL,
  `action` varchar(30) NOT NULL,
  `actor_id` int(10) unsigned NOT NULL,
  `actor_name` varchar(255) NOT NULL,
  `note` varchar(500) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_salary_slip_events` (`salary_slip_id`,`id`),
  CONSTRAINT `fk_salary_slip_event` FOREIGN KEY (`salary_slip_id`) REFERENCES `salary_slips` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `salary_slips` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `salary_request_id` int(10) unsigned NOT NULL,
  `employee_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `recipient_email` varchar(191) NOT NULL,
  `snapshot_json` longtext NOT NULL,
  `published_by` int(10) unsigned NOT NULL,
  `published_by_name` varchar(255) NOT NULL,
  `published_at` datetime NOT NULL DEFAULT current_timestamp(),
  `email_status` enum('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
  `email_attempts` int(10) unsigned NOT NULL DEFAULT 0,
  `email_sent_at` datetime DEFAULT NULL,
  `email_error` varchar(500) DEFAULT NULL,
  `email_message_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_salary_slip_request` (`salary_request_id`),
  KEY `idx_salary_slip_owner` (`user_id`,`employee_id`),
  CONSTRAINT `fk_salary_slip_request` FOREIGN KEY (`salary_request_id`) REFERENCES `salary_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` varchar(100) NOT NULL,
  `checksum` char(64) NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `settings` (
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

CREATE TABLE IF NOT EXISTS `student_invoice_links` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `billing_invoice_id` varchar(50) DEFAULT NULL,
  `invoice_client_id` int(11) DEFAULT NULL,
  `linked_by` int(10) unsigned NOT NULL,
  `linked_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `billing_invoice_id` (`billing_invoice_id`),
  UNIQUE KEY `invoice_client_id` (`invoice_client_id`),
  KEY `student_id` (`student_id`),
  KEY `linked_by` (`linked_by`),
  CONSTRAINT `student_invoice_links_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `peserta_intensif` (`id`),
  CONSTRAINT `student_invoice_links_ibfk_2` FOREIGN KEY (`billing_invoice_id`) REFERENCES `billing_invoices` (`id`),
  CONSTRAINT `student_invoice_links_ibfk_3` FOREIGN KEY (`invoice_client_id`) REFERENCES `invoice_clients` (`id`),
  CONSTRAINT `student_invoice_links_ibfk_4` FOREIGN KEY (`linked_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK ((`billing_invoice_id` is not null) + (`invoice_client_id` is not null) = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `student_payment_submissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_link_id` bigint(20) unsigned NOT NULL,
  `student_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `transfer_date` date NOT NULL,
  `reference` varchar(180) NOT NULL,
  `proof_file` varchar(255) NOT NULL,
  `request_key` varchar(100) NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `reviewed_by` int(10) unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_key` (`request_key`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `invoice_link_id` (`invoice_link_id`),
  KEY `student_id` (`student_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `student_payment_submissions_ibfk_1` FOREIGN KEY (`invoice_link_id`) REFERENCES `student_invoice_links` (`id`),
  CONSTRAINT `student_payment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `peserta_intensif` (`id`),
  CONSTRAINT `student_payment_submissions_ibfk_3` FOREIGN KEY (`transaction_id`) REFERENCES `accounting_transactions` (`id`),
  CONSTRAINT `student_payment_submissions_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`amount` > 0),
  CONSTRAINT `CONSTRAINT_2` CHECK (`status` = 'pending' and `reviewed_by` is null and `reviewed_at` is null and `transaction_id` is null or `status` = 'accepted' and `reviewed_by` is not null and `reviewed_at` is not null and `transaction_id` is not null or `status` = 'rejected' and `reviewed_by` is not null and `reviewed_at` is not null and `transaction_id` is null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `receipt_url` varchar(255) DEFAULT NULL COMMENT 'Foto struk/nota',
  `ocr_raw_data` longtext DEFAULT NULL COMMENT 'Data mentah hasil OCR' CHECK (json_valid(`ocr_raw_data`)),
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

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `pin_hash` varchar(255) DEFAULT NULL COMMENT 'PIN terenkripsi untuk akses Slip Gaji',
  `role_id` tinyint(3) unsigned NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vendor_bills` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(50) NOT NULL,
  `vendor_id` int(10) unsigned NOT NULL,
  `bill_date` date NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `liability_account_id` int(10) unsigned NOT NULL,
  `status` enum('draft','approved','cancelled') NOT NULL DEFAULT 'draft',
  `created_by` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`),
  KEY `vendor_id` (`vendor_id`),
  KEY `account_id` (`account_id`),
  KEY `liability_account_id` (`liability_account_id`),
  CONSTRAINT `vendor_bills_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `vendor_bills_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `vendor_bills_ibfk_3` FOREIGN KEY (`liability_account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Penyesuaian kolom tabel yang sudah ada sebelumnya
ALTER TABLE `peserta_intensif`
  ADD COLUMN IF NOT EXISTS `no_ktp` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `user_id` INT(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `level` VARCHAR(50) DEFAULT 'N5',
  ADD COLUMN IF NOT EXISTS `batch` VARCHAR(100) DEFAULT 'Batch 2',
  ADD COLUMN IF NOT EXISTS `nis` VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `affiliator` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `alamat` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `kota` VARCHAR(100) DEFAULT 'Kab. Cianjur',
  ADD COLUMN IF NOT EXISTS `provinsi` VARCHAR(100) DEFAULT 'Jawa Barat',
  ADD COLUMN IF NOT EXISTS `kode_pos` VARCHAR(20) DEFAULT '43211',
  ADD COLUMN IF NOT EXISTS `negara` VARCHAR(50) DEFAULT 'Indonesia',
  ADD COLUMN IF NOT EXISTS `program` VARCHAR(150) DEFAULT 'Program Pelatihan Jepang',
  ADD COLUMN IF NOT EXISTS `status` VARCHAR(50) DEFAULT 'Aktif',
  ADD COLUMN IF NOT EXISTS `web_id` INT(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `source` VARCHAR(50) DEFAULT NULL;

-- ============================================================================
-- 2. BERSIHKAN DATA TRANSAKSI LAMA (START DARI 0 UNTUK SISTEM BARU)
-- ============================================================================

TRUNCATE TABLE `accounting_transactions`;
TRUNCATE TABLE `journal_entries`;
TRUNCATE TABLE `journal_lines`;
TRUNCATE TABLE `accounting_source_documents`;
TRUNCATE TABLE `payment_allocations`;
TRUNCATE TABLE `student_payment_submissions`;
TRUNCATE TABLE `student_invoice_links`;
TRUNCATE TABLE `billing_invoices`;
TRUNCATE TABLE `billing_pembayaran`;
TRUNCATE TABLE `billing_terkirim`;
TRUNCATE TABLE `billing_siswa`;
TRUNCATE TABLE `budget_commitments`;
TRUNCATE TABLE `budget_realizations`;
TRUNCATE TABLE `budget_request_items`;
TRUNCATE TABLE `budget_request_history`;
TRUNCATE TABLE `budget_requests`;
TRUNCATE TABLE `salary_slips`;
TRUNCATE TABLE `salary_slip_events`;
TRUNCATE TABLE `salary_requests`;
TRUNCATE TABLE `salary_request_history`;
TRUNCATE TABLE `payroll`;
TRUNCATE TABLE `payslips`;
TRUNCATE TABLE `reimbursements`;
TRUNCATE TABLE `vendor_bills`;
TRUNCATE TABLE `finance_records`;
TRUNCATE TABLE `invoice_records`;
TRUNCATE TABLE `invoice_clients`;
TRUNCATE TABLE `financial_report_adjustments`;
TRUNCATE TABLE `accounting_audit_logs`;
TRUNCATE TABLE `accounting_idempotency`;

-- ============================================================================
-- 3. MASTER DATA INTI (ROLES, USERS, AKUN COA, BANK, PERMISSIONS)
-- ============================================================================

INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (1, 'employee', 'Karyawan');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (2, 'hr_admin', 'HR Admin');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (3, 'finance_admin', 'Finance Admin');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (4, 'super_admin', 'Super Admin / Owner');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (5, 'admin', '');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (6, 'karyawan', 'karyawan');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (7, 'hr', 'hr');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (8, 'finance', 'finance');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (9, 'ga', 'ga');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (13, 'lpk', 'lpk');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (14, 'peserta_nenkin', 'peserta_nenkin');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (15, 'sensei', 'sensei');
INSERT IGNORE INTO `roles` (`id`, `name`, `label`) VALUES (16, 'peserta_intensif', 'peserta_intensif');

INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES (2, 'admin@onecreativa.com', '$2y$10$kitiof00EdlCL53oIYelhOW35.PKSi8BKqT6GPm/5nNwG4rchoSIy', 4, 1) ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role_id`=VALUES(`role_id`), `is_active`=1;
INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES (4, 'ramlazizkhan77@gmail.com', '$2y$10$3/3MBfJAF2KENXQ9MinDdeGnPxP6AT99DfSzlfygcPgFWBXwhPJAa', 6, 1) ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role_id`=VALUES(`role_id`), `is_active`=1;
INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES (5, 'flaelaturrobikha@gmail.com', '$2y$10$0RjIO0j9Zmz7a3bkJePJ9.r8Jw4GnNP8TIUaCfohP4alLXtI17Z0W', 6, 1) ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role_id`=VALUES(`role_id`), `is_active`=1;
INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES (10, 'aalfinarrahman@gmail.com', '$2y$10$9xVkY2olm9dzc.XhV6QFcOssg7RFw26S33boqp8/EZXozDGaZWT7a', 6, 1) ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role_id`=VALUES(`role_id`), `is_active`=1;
INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES (33, 'muhammadfaizal.mf10@gmail.com', '$2y$10$TFCG7NKKbgVVJQiSWkpCU.zFUSe.KcNCBdkrImt9yQrFjvaRb3jRO', 6, 1) ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role_id`=VALUES(`role_id`), `is_active`=1;
INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES (37, 'Financelpk@gmail.com', '$2y$10$1laBwPZCNGlbTvzj/LxnBeMPX3BVBGrv3ap3hIDu9NyECYmAKzROO', 8, 1) ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role_id`=VALUES(`role_id`), `is_active`=1;

INSERT INTO `employees` (`id`, `user_id`, `employee_code`, `full_name`, `position`, `department_id`, `base_salary`, `join_date`) VALUES (1, 33, '2260005', 'Muhammad Faizal', 'FullStack Developer', 7, 7000000.00, '2026-06-17') ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `position`=VALUES(`position`), `base_salary`=VALUES(`base_salary`), `join_date`=VALUES(`join_date`);
INSERT INTO `employees` (`id`, `user_id`, `employee_code`, `full_name`, `position`, `department_id`, `base_salary`, `join_date`) VALUES (2, 4, '2260003', 'R.M Ramsyawaly Arief Syaifaraj Lazizkhan', 'General Affair', NULL, 3000000.00, '2026-06-17') ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `position`=VALUES(`position`), `base_salary`=VALUES(`base_salary`), `join_date`=VALUES(`join_date`);
INSERT INTO `employees` (`id`, `user_id`, `employee_code`, `full_name`, `position`, `department_id`, `base_salary`, `join_date`) VALUES (3, 5, '2260004', 'Fitriani Laelaturrobikha', 'Staff Admin', NULL, 2500000.00, '2026-06-17') ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `position`=VALUES(`position`), `base_salary`=VALUES(`base_salary`), `join_date`=VALUES(`join_date`);
INSERT INTO `employees` (`id`, `user_id`, `employee_code`, `full_name`, `position`, `department_id`, `base_salary`, `join_date`) VALUES (7, 10, '2260002', 'Anggi Alfin S.Kom., M.Sc.', 'General Manager', 4, 10000000.00, '2026-06-24') ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `position`=VALUES(`position`), `base_salary`=VALUES(`base_salary`), `join_date`=VALUES(`join_date`);
INSERT INTO `employees` (`id`, `user_id`, `employee_code`, `full_name`, `position`, `department_id`, `base_salary`, `join_date`) VALUES (77, 2, 'SYS-ADMIN', 'Administrator', 'Super Admin', NULL, 0.00, '2026-10-14') ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `position`=VALUES(`position`), `base_salary`=VALUES(`base_salary`), `join_date`=VALUES(`join_date`);
INSERT INTO `employees` (`id`, `user_id`, `employee_code`, `full_name`, `position`, `department_id`, `base_salary`, `join_date`) VALUES (81, 37, 'SYS-d25fb311f99f450d', 'FINANCE LPK CREATIVA', 'FINANCE', NULL, 0.00, '2026-10-24') ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `position`=VALUES(`position`), `base_salary`=VALUES(`base_salary`), `join_date`=VALUES(`join_date`);

INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-01', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-02', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-03', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-04', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-05', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-06', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-07', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-08', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-09', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-10', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-11', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2026-12', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-01', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-02', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-03', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-04', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-05', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-06', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-07', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-08', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-09', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-10', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-11', 'open');
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES ('2027-12', 'open');

-- Master Chart of Accounts (COA) Standar PSAK Indonesia
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

INSERT INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `parent_id`, `is_detail`, `is_active`)
SELECT '1110', 'Petty Cash / Kas Tunai', 1, 'debit', 'cash', id, 1, 1 FROM `accounts` WHERE `code`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `is_active`=1;

INSERT INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `parent_id`, `is_detail`, `is_active`)
SELECT '1120', 'Bank BCA (1832-918-428)', 1, 'debit', 'cash', id, 1, 1 FROM `accounts` WHERE `code`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `is_active`=1;

INSERT INTO `accounts` (`code`, `name`, `account_group`, `normal_balance`, `report_class`, `parent_id`, `is_detail`, `is_active`)
SELECT '1130', 'Bank Mandiri Cadangan', 1, 'debit', 'cash', id, 1, 1 FROM `accounts` WHERE `code`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `is_active`=1;

-- Master Rekening Kas & Bank Operasional (BCA, Kas Tunai, Mandiri)
INSERT INTO `cash_bank_accounts` (`id`, `name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 13, 'CREATIVA BRIDGING INTERN', id, 'Bank BCA', '1832-918-428', 1 FROM `accounts` WHERE `code`='1120' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT INTO `cash_bank_accounts` (`id`, `name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 14, 'Petty Cash (Kas Kecil Tunai)', id, 'Kas Tunai Kasir', 'CASH-01', 1 FROM `accounts` WHERE `code`='1110' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT INTO `cash_bank_accounts` (`id`, `name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 18, 'Rekening Cadangan Mandiri', id, 'Bank Mandiri', '130-0019283', 1 FROM `accounts` WHERE `code`='1130' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

-- Saldo Awal Kas & Bank (CREATIVA BRIDGING INTERN Rp 40.000.000)
INSERT INTO `journal_entries` (`id`, `number`, `entry_date`, `period_id`, `source_type`, `source_id`, `event`, `description`, `status`, `created_by`, `posted_at`)
SELECT 1, 'JRN-2026-INIT000013', '2026-06-17', (SELECT id FROM `accounting_periods` WHERE `month`='2026-06' LIMIT 1), 'bank_opening', '13', 'opening_balance', 'Saldo Awal Pembukaan Rekening CREATIVA BRIDGING INTERN', 'draft', 2, NULL
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

INSERT INTO `journal_lines` (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `cash_flow_class`)
SELECT 1, 1, (SELECT id FROM `accounts` WHERE `code`='1120' LIMIT 1), 40000000.00, 0.00, 'financing'
ON DUPLICATE KEY UPDATE `debit`=40000000.00, `credit`=0.00;

INSERT INTO `journal_lines` (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `cash_flow_class`)
SELECT 2, 1, (SELECT id FROM `accounts` WHERE `code`='3100' LIMIT 1), 0.00, 40000000.00, 'noncash'
ON DUPLICATE KEY UPDATE `debit`=0.00, `credit`=40000000.00;

UPDATE `journal_entries` SET `status`='posted', `posted_at`=NOW() WHERE `id`=1;
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('admin', 'approve', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('admin', 'configure', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('admin', 'post', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('admin', 'prepare', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('admin', 'read', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('director', 'approve', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('director', 'configure', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('director', 'post', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('director', 'prepare', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('director', 'read', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('direktur', 'approve', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('direktur', 'configure', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('direktur', 'post', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('direktur', 'prepare', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('direktur', 'read', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('finance', 'approve', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('finance', 'configure', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('finance', 'post', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('finance', 'prepare', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('finance', 'read', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('super_admin', 'approve', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('super_admin', 'configure', 1);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('super_admin', 'post', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('super_admin', 'prepare', 0);
INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES ('super_admin', 'read', 1);

INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (1, 'IT');
INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (2, 'General Affair');
INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (3, 'HRD');
INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (4, 'General Manager');
INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (5, 'MANAGER');
INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (6, 'Finance');
INSERT IGNORE INTO `departments` (`id`, `name`) VALUES (7, 'IT Developer');

INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (1, 'Head General Affair', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (2, 'General Affair', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (3, 'General Manager', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (4, 'Project Manager', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (5, 'Manager', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (6, 'Advokat', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (7, 'FullStack Developer', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (8, 'Manager Finance', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (9, 'Finance', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (10, 'Manager HRD', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (11, 'HRD', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (12, 'Admin', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (13, 'Head Marketing', NULL, 0.00, 'Staff');
INSERT IGNORE INTO `positions` (`id`, `name`, `department_id`, `base_salary`, `level`) VALUES (14, 'Marketing', NULL, 0.00, 'Staff');

-- ============================================================================
-- 4. RIWAYAT ABSENSI & LAPORAN KERJA OPERASIONAL KARYAWAN
-- ============================================================================

INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (41,1,'2026-06-17','2026-06-18 00:57:36','2026-06-18 10:26:43','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-18 00:57:36');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (138,2,'2026-06-17','2026-06-18 01:13:53','2026-06-18 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-06-18 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (235,3,'2026-06-17','2026-06-18 00:49:10','2026-06-18 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-18 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (1,1,'2026-06-18','2026-06-19 13:08:45','2026-06-19 13:08:50',NULL,NULL,NULL,NULL,1,0,'late','Face Snapshot: uploads/face_snapshots/face_1_clock_in_20260619_200845.jpg, Face Snapshot Out: uploads/face_snapshots/face_1_clock_out_20260619_200850.jpg','2026-06-19 18:08:45');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (139,2,'2026-06-18','2026-06-19 00:47:54','2026-06-19 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-19 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (236,3,'2026-06-18','2026-06-19 01:00:00','2026-06-19 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-06-19 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (43,1,'2026-06-21','2026-06-22 00:52:31','2026-06-22 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-22 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (140,2,'2026-06-21','2026-06-22 00:55:48','2026-06-22 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-22 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (237,3,'2026-06-21','2026-06-22 00:58:05','2026-06-22 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-22 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (2,1,'2026-06-22','2026-06-23 01:00:00','2026-06-23 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-20 18:15:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (141,2,'2026-06-22','2026-06-23 00:56:49','2026-06-23 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-23 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (238,3,'2026-06-22','2026-06-23 01:11:06','2026-06-23 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-06-23 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (3,1,'2026-06-23','2026-06-24 01:00:00','2026-06-24 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-20 18:15:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (142,2,'2026-06-23','2026-06-24 00:57:50','2026-06-24 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-24 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (239,3,'2026-06-23','2026-06-24 00:46:07','2026-06-24 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-24 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (4,1,'2026-06-24','2026-06-25 01:00:00','2026-06-25 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-20 18:15:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (143,2,'2026-06-24','2026-06-25 00:58:51','2026-06-25 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-25 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (240,3,'2026-06-24','2026-06-25 00:47:08','2026-06-25 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-25 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (332,7,'2026-06-24','2026-06-25 00:45:16','2026-06-25 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-25 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (5,1,'2026-06-25','2026-06-26 01:00:00','2026-06-26 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-20 18:15:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (7,7,'2026-06-25','2026-06-25 19:16:05',NULL,'-6.24521450','107.02288625',NULL,NULL,1,0,'present','Face Snapshot: uploads/face_snapshots/face_7_clock_in_20260626_021605.jpg','2026-06-25 19:16:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (144,2,'2026-06-25','2026-06-26 00:45:52','2026-06-26 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-26 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (241,3,'2026-06-25','2026-06-26 00:48:09','2026-06-26 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-26 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (8,7,'2026-06-26','2026-06-27 00:35:09','2026-06-27 00:35:28','-6.24531148','107.02291170','-6.24531148','107.02291170',1,0,'late',NULL,'2026-06-27 00:35:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (48,1,'2026-06-28','2026-06-29 00:45:38','2026-06-29 10:28:45','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-29 00:45:38');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (145,2,'2026-06-28','2026-06-29 00:48:55','2026-06-29 10:20:02','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-29 00:48:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (242,3,'2026-06-28','2026-06-29 00:51:12','2026-06-29 10:12:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-29 00:51:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (334,7,'2026-06-28','2026-06-29 00:49:20','2026-06-29 10:30:27','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-29 00:49:20');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (49,1,'2026-06-29','2026-06-30 00:51:30','2026-06-30 10:20:37','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-30 00:51:30');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (146,2,'2026-06-29','2026-06-30 00:54:47','2026-06-30 10:12:54','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-30 00:54:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (243,3,'2026-06-29','2026-06-30 00:57:04','2026-06-30 10:29:11','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-30 00:57:04');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (335,7,'2026-06-29','2026-06-30 00:55:12','2026-06-30 10:22:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-06-30 00:55:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (9,1,'2026-06-30','2026-07-01 01:00:00','2026-07-01 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (147,2,'2026-06-30','2026-07-01 00:53:46','2026-07-01 10:11:53','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-01 00:53:46');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (244,3,'2026-06-30','2026-07-01 00:56:03','2026-07-01 10:28:10','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-01 00:56:03');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (336,7,'2026-06-30','2026-07-01 01:16:11','2026-07-01 10:21:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-01 01:16:11');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (10,1,'2026-07-01','2026-07-02 01:00:00','2026-07-02 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (148,2,'2026-07-01','2026-07-02 00:54:47','2026-07-02 10:12:54','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-02 00:54:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (245,3,'2026-07-01','2026-07-02 00:57:04','2026-07-02 10:29:11','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-02 00:57:04');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (337,7,'2026-07-01','2026-07-02 00:55:12','2026-07-02 10:22:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-02 00:55:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (11,1,'2026-07-02','2026-07-03 01:00:00','2026-07-03 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (149,2,'2026-07-02','2026-07-03 00:55:48','2026-07-03 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-03 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (246,3,'2026-07-02','2026-07-03 00:58:05','2026-07-03 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-03 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (338,7,'2026-07-02','2026-07-03 00:56:13','2026-07-03 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-03 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (12,1,'2026-07-03','2026-07-04 01:00:00','2026-07-04 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (13,1,'2026-07-04','2026-07-05 01:00:00','2026-07-05 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (14,1,'2026-07-05','2026-07-06 01:00:00','2026-07-06 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (150,2,'2026-07-05','2026-07-06 00:58:51','2026-07-06 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-06 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (247,3,'2026-07-05','2026-07-06 00:47:08','2026-07-06 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-06 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (339,7,'2026-07-05','2026-07-06 00:45:16','2026-07-06 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-06 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (15,1,'2026-07-06','2026-07-07 01:00:00','2026-07-07 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (151,2,'2026-07-06','2026-07-07 00:45:52','2026-07-07 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-07 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (248,3,'2026-07-06','2026-07-07 00:48:09','2026-07-07 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-07 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (340,7,'2026-07-06','2026-07-07 00:46:17','2026-07-07 10:27:24','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-07 00:46:17');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (16,1,'2026-07-07','2026-07-08 01:00:00','2026-07-08 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (152,2,'2026-07-07','2026-07-08 01:13:53','2026-07-08 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-08 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (249,3,'2026-07-07','2026-07-08 00:49:10','2026-07-08 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-08 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (341,7,'2026-07-07','2026-07-08 00:47:18','2026-07-08 10:28:25','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-08 00:47:18');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (17,1,'2026-07-08','2026-07-09 01:00:00','2026-07-09 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (153,2,'2026-07-08','2026-07-09 00:47:54','2026-07-09 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-09 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (250,3,'2026-07-08','2026-07-09 01:00:00','2026-07-09 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-07-09 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (342,7,'2026-07-08','2026-07-09 00:48:19','2026-07-09 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-09 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (18,1,'2026-07-09','2026-07-10 01:00:00','2026-07-10 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (154,2,'2026-07-09','2026-07-10 00:53:46','2026-07-10 10:11:53','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-10 00:53:46');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (251,3,'2026-07-09','2026-07-10 00:56:03','2026-07-10 10:28:10','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-10 00:56:03');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (343,7,'2026-07-09','2026-07-10 01:16:11','2026-07-10 10:21:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-10 01:16:11');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (19,1,'2026-07-10','2026-07-11 01:00:00','2026-07-11 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (20,1,'2026-07-11','2026-07-12 01:00:00','2026-07-12 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (21,1,'2026-07-12','2026-07-13 01:00:00','2026-07-13 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (155,2,'2026-07-12','2026-07-13 00:56:49','2026-07-13 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-13 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (252,3,'2026-07-12','2026-07-13 01:11:06','2026-07-13 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-13 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (344,7,'2026-07-12','2026-07-13 00:57:14','2026-07-13 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-13 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (22,1,'2026-07-13','2026-07-14 01:00:00','2026-07-14 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (156,2,'2026-07-13','2026-07-14 00:57:50','2026-07-14 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-14 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (253,3,'2026-07-13','2026-07-14 00:46:07','2026-07-14 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-14 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (345,7,'2026-07-13','2026-07-14 00:58:15','2026-07-14 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-14 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (23,1,'2026-07-14','2026-07-15 01:00:00','2026-07-15 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (157,2,'2026-07-14','2026-07-15 00:58:51','2026-07-15 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-15 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (254,3,'2026-07-14','2026-07-15 00:47:08','2026-07-15 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-15 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (346,7,'2026-07-14','2026-07-15 00:45:16','2026-07-15 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-15 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (24,1,'2026-07-15','2026-07-16 01:00:00','2026-07-16 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (158,2,'2026-07-15','2026-07-16 00:45:52','2026-07-16 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-16 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (255,3,'2026-07-15','2026-07-16 00:48:09','2026-07-16 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-16 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (347,7,'2026-07-15','2026-07-16 00:46:17','2026-07-16 10:27:24','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-16 00:46:17');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (25,1,'2026-07-16','2026-07-17 01:00:00','2026-07-17 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (159,2,'2026-07-16','2026-07-17 01:13:53','2026-07-17 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-17 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (256,3,'2026-07-16','2026-07-17 00:49:10','2026-07-17 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-17 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (348,7,'2026-07-16','2026-07-17 00:47:18','2026-07-17 10:28:25','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-17 00:47:18');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (26,1,'2026-07-17','2026-07-18 01:00:00','2026-07-18 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (27,1,'2026-07-18','2026-07-19 01:00:00','2026-07-19 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (28,1,'2026-07-19','2026-07-20 01:00:00','2026-07-20 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (160,2,'2026-07-19','2026-07-20 00:54:47','2026-07-20 10:12:54','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-20 00:54:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (257,3,'2026-07-19','2026-07-20 00:57:04','2026-07-20 10:29:11','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-20 00:57:04');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (349,7,'2026-07-19','2026-07-20 00:55:12','2026-07-20 10:22:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-20 00:55:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (29,1,'2026-07-20','2026-07-21 01:00:00','2026-07-21 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (161,2,'2026-07-20','2026-07-21 00:55:48','2026-07-21 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-21 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (258,3,'2026-07-20','2026-07-21 00:58:05','2026-07-21 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-21 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (350,7,'2026-07-20','2026-07-21 00:56:13','2026-07-21 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-21 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (30,1,'2026-07-21','2026-07-22 01:00:00','2026-07-22 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (162,2,'2026-07-21','2026-07-22 00:56:49','2026-07-22 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-22 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (259,3,'2026-07-21','2026-07-22 01:11:06','2026-07-22 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-22 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (351,7,'2026-07-21','2026-07-22 00:57:14','2026-07-22 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-22 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (31,1,'2026-07-22','2026-07-23 01:00:00','2026-07-23 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (163,2,'2026-07-22','2026-07-23 00:57:50','2026-07-23 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-23 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (260,3,'2026-07-22','2026-07-23 00:46:07','2026-07-23 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-23 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (352,7,'2026-07-22','2026-07-23 00:58:15','2026-07-23 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-23 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (32,1,'2026-07-23','2026-07-24 01:00:00','2026-07-24 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (164,2,'2026-07-23','2026-07-24 00:58:51','2026-07-24 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-24 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (261,3,'2026-07-23','2026-07-24 00:47:08','2026-07-24 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-24 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (353,7,'2026-07-23','2026-07-24 00:45:16','2026-07-24 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-24 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (33,1,'2026-07-24','2026-07-25 01:00:00','2026-07-25 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (34,1,'2026-07-25','2026-07-26 01:00:00','2026-07-26 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (35,1,'2026-07-26','2026-07-27 01:00:00','2026-07-27 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (165,2,'2026-07-26','2026-07-27 00:47:54','2026-07-27 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-27 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (262,3,'2026-07-26','2026-07-27 01:00:00','2026-07-27 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-07-27 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (354,7,'2026-07-26','2026-07-27 00:48:19','2026-07-27 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-27 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (36,1,'2026-07-27','2026-07-28 01:00:00','2026-07-28 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (166,2,'2026-07-27','2026-07-28 00:48:55','2026-07-28 10:20:02','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-28 00:48:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (263,3,'2026-07-27','2026-07-28 00:51:12','2026-07-28 10:12:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-28 00:51:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (355,7,'2026-07-27','2026-07-28 00:49:20','2026-07-28 10:30:27','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-28 00:49:20');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (37,1,'2026-07-28','2026-07-29 01:00:00','2026-07-29 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (167,2,'2026-07-28','2026-07-29 00:49:56','2026-07-29 10:21:03','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-29 00:49:56');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (264,3,'2026-07-28','2026-07-29 00:52:13','2026-07-29 10:13:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-29 00:52:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (356,7,'2026-07-28','2026-07-29 00:50:21','2026-07-29 10:31:28','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-29 00:50:21');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (38,1,'2026-07-29','2026-07-30 01:00:00','2026-07-30 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (168,2,'2026-07-29','2026-07-30 00:55:48','2026-07-30 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-30 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (265,3,'2026-07-29','2026-07-30 00:58:05','2026-07-30 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-30 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (357,7,'2026-07-29','2026-07-30 00:56:13','2026-07-30 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-30 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (39,1,'2026-07-30','2026-07-31 01:00:00','2026-07-31 10:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-01 17:15:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (169,2,'2026-07-30','2026-07-31 00:56:49','2026-07-31 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-31 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (266,3,'2026-07-30','2026-07-31 01:11:06','2026-07-31 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-07-31 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (358,7,'2026-07-30','2026-07-31 00:57:14','2026-07-31 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-07-31 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (73,1,'2026-08-02','2026-08-03 00:53:32','2026-08-03 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-03 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (170,2,'2026-08-02','2026-08-03 00:56:49','2026-08-03 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-03 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (267,3,'2026-08-02','2026-08-03 01:11:06','2026-08-03 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-08-03 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (359,7,'2026-08-02','2026-08-03 00:57:14','2026-08-03 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-03 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (74,1,'2026-08-03','2026-08-04 00:54:33','2026-08-04 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-04 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (171,2,'2026-08-03','2026-08-04 00:57:50','2026-08-04 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-04 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (268,3,'2026-08-03','2026-08-04 00:46:07','2026-08-04 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-04 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (360,7,'2026-08-03','2026-08-04 00:58:15','2026-08-04 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-04 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (75,1,'2026-08-04','2026-08-05 00:55:34','2026-08-05 10:24:41','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-05 00:55:34');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (172,2,'2026-08-04','2026-08-05 00:58:51','2026-08-05 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-05 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (269,3,'2026-08-04','2026-08-05 00:47:08','2026-08-05 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-05 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (361,7,'2026-08-04','2026-08-05 00:45:16','2026-08-05 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-05 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (76,1,'2026-08-05','2026-08-06 00:56:35','2026-08-06 10:25:42','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-06 00:56:35');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (173,2,'2026-08-05','2026-08-06 00:45:52','2026-08-06 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-06 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (270,3,'2026-08-05','2026-08-06 00:48:09','2026-08-06 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-06 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (362,7,'2026-08-05','2026-08-06 00:46:17','2026-08-06 10:27:24','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-06 00:46:17');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (77,1,'2026-08-06','2026-08-07 00:57:36','2026-08-07 10:26:43','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-07 00:57:36');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (174,2,'2026-08-06','2026-08-07 01:13:53','2026-08-07 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-08-07 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (271,3,'2026-08-06','2026-08-07 00:49:10','2026-08-07 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-07 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (363,7,'2026-08-06','2026-08-07 00:47:18','2026-08-07 10:28:25','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-07 00:47:18');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (78,1,'2026-08-09','2026-08-10 00:51:30','2026-08-10 10:20:37','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-10 00:51:30');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (175,2,'2026-08-09','2026-08-10 00:54:47','2026-08-10 10:12:54','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-10 00:54:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (272,3,'2026-08-09','2026-08-10 00:57:04','2026-08-10 10:29:11','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-10 00:57:04');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (364,7,'2026-08-09','2026-08-10 00:55:12','2026-08-10 10:22:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-10 00:55:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (79,1,'2026-08-10','2026-08-11 00:52:31','2026-08-11 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-11 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (176,2,'2026-08-10','2026-08-11 00:55:48','2026-08-11 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-11 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (273,3,'2026-08-10','2026-08-11 00:58:05','2026-08-11 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-11 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (365,7,'2026-08-10','2026-08-11 00:56:13','2026-08-11 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-11 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (80,1,'2026-08-11','2026-08-12 00:53:32','2026-08-12 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-12 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (177,2,'2026-08-11','2026-08-12 00:56:49','2026-08-12 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-12 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (274,3,'2026-08-11','2026-08-12 01:11:06','2026-08-12 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-08-12 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (366,7,'2026-08-11','2026-08-12 00:57:14','2026-08-12 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-12 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (81,1,'2026-08-12','2026-08-13 00:54:33','2026-08-13 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-13 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (178,2,'2026-08-12','2026-08-13 00:57:50','2026-08-13 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-13 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (275,3,'2026-08-12','2026-08-13 00:46:07','2026-08-13 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-13 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (367,7,'2026-08-12','2026-08-13 00:58:15','2026-08-13 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-13 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (82,1,'2026-08-13','2026-08-14 00:55:34','2026-08-14 10:24:41','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-14 00:55:34');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (179,2,'2026-08-13','2026-08-14 00:58:51','2026-08-14 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-14 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (276,3,'2026-08-13','2026-08-14 00:47:08','2026-08-14 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-14 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (368,7,'2026-08-13','2026-08-14 00:45:16','2026-08-14 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-14 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (83,1,'2026-08-16','2026-08-17 00:58:37','2026-08-17 10:27:44','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-17 00:58:37');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (180,2,'2026-08-16','2026-08-17 00:47:54','2026-08-17 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-17 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (277,3,'2026-08-16','2026-08-17 01:00:00','2026-08-17 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-08-17 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (369,7,'2026-08-16','2026-08-17 00:48:19','2026-08-17 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-17 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (84,1,'2026-08-17','2026-08-18 00:45:38','2026-08-18 10:28:45','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-18 00:45:38');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (181,2,'2026-08-17','2026-08-18 00:48:55','2026-08-18 10:20:02','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-18 00:48:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (278,3,'2026-08-17','2026-08-18 00:51:12','2026-08-18 10:12:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-18 00:51:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (370,7,'2026-08-17','2026-08-18 00:49:20','2026-08-18 10:30:27','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-18 00:49:20');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (85,1,'2026-08-18','2026-08-19 00:46:39','2026-08-19 10:29:46','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-19 00:46:39');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (182,2,'2026-08-18','2026-08-19 00:49:56','2026-08-19 10:21:03','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-19 00:49:56');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (279,3,'2026-08-18','2026-08-19 00:52:13','2026-08-19 10:13:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-19 00:52:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (371,7,'2026-08-18','2026-08-19 00:50:21','2026-08-19 10:31:28','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-19 00:50:21');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (86,1,'2026-08-19','2026-08-20 00:52:31','2026-08-20 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-20 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (183,2,'2026-08-19','2026-08-20 00:55:48','2026-08-20 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-20 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (280,3,'2026-08-19','2026-08-20 00:58:05','2026-08-20 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-20 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (372,7,'2026-08-19','2026-08-20 00:56:13','2026-08-20 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-20 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (87,1,'2026-08-20','2026-08-21 00:53:32','2026-08-21 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-21 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (184,2,'2026-08-20','2026-08-21 00:56:49','2026-08-21 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-21 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (281,3,'2026-08-20','2026-08-21 01:11:06','2026-08-21 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-08-21 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (373,7,'2026-08-20','2026-08-21 00:57:14','2026-08-21 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-21 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (88,1,'2026-08-23','2026-08-24 00:56:35','2026-08-24 10:25:42','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-24 00:56:35');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (185,2,'2026-08-23','2026-08-24 00:45:52','2026-08-24 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-24 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (282,3,'2026-08-23','2026-08-24 00:48:09','2026-08-24 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-24 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (374,7,'2026-08-23','2026-08-24 00:46:17','2026-08-24 10:27:24','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-24 00:46:17');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (89,1,'2026-08-24','2026-08-25 00:57:36','2026-08-25 10:26:43','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-25 00:57:36');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (186,2,'2026-08-24','2026-08-25 01:13:53','2026-08-25 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-08-25 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (283,3,'2026-08-24','2026-08-25 00:49:10','2026-08-25 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-25 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (375,7,'2026-08-24','2026-08-25 00:47:18','2026-08-25 10:28:25','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-25 00:47:18');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (90,1,'2026-08-25','2026-08-26 00:58:37','2026-08-26 10:27:44','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-26 00:58:37');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (187,2,'2026-08-25','2026-08-26 00:47:54','2026-08-26 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-26 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (284,3,'2026-08-25','2026-08-26 01:00:00','2026-08-26 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-08-26 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (376,7,'2026-08-25','2026-08-26 00:48:19','2026-08-26 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-26 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (91,1,'2026-08-26','2026-08-27 00:45:38','2026-08-27 10:28:45','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-27 00:45:38');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (188,2,'2026-08-26','2026-08-27 00:48:55','2026-08-27 10:20:02','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-27 00:48:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (285,3,'2026-08-26','2026-08-27 00:51:12','2026-08-27 10:12:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-27 00:51:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (377,7,'2026-08-26','2026-08-27 00:49:20','2026-08-27 10:30:27','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-27 00:49:20');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (92,1,'2026-08-27','2026-08-28 00:46:39','2026-08-28 10:29:46','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-28 00:46:39');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (189,2,'2026-08-27','2026-08-28 00:49:56','2026-08-28 10:21:03','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-28 00:49:56');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (286,3,'2026-08-27','2026-08-28 00:52:13','2026-08-28 10:13:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-28 00:52:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (378,7,'2026-08-27','2026-08-28 00:50:21','2026-08-28 10:31:28','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-28 00:50:21');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (93,1,'2026-08-30','2026-08-31 00:54:33','2026-08-31 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-31 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (190,2,'2026-08-30','2026-08-31 00:57:50','2026-08-31 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-31 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (287,3,'2026-08-30','2026-08-31 00:46:07','2026-08-31 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-31 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (379,7,'2026-08-30','2026-08-31 00:58:15','2026-08-31 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-08-31 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (94,1,'2026-08-31','2026-09-01 00:52:31','2026-09-01 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-01 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (191,2,'2026-08-31','2026-09-01 00:55:48','2026-09-01 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-01 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (288,3,'2026-08-31','2026-09-01 00:58:05','2026-09-01 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-01 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (380,7,'2026-08-31','2026-09-01 00:56:13','2026-09-01 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-01 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (95,1,'2026-09-01','2026-09-02 00:53:32','2026-09-02 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-02 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (192,2,'2026-09-01','2026-09-02 00:56:49','2026-09-02 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-02 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (289,3,'2026-09-01','2026-09-02 01:11:06','2026-09-02 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-09-02 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (381,7,'2026-09-01','2026-09-02 00:57:14','2026-09-02 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-02 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (96,1,'2026-09-02','2026-09-03 00:54:33','2026-09-03 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-03 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (193,2,'2026-09-02','2026-09-03 00:57:50','2026-09-03 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-03 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (290,3,'2026-09-02','2026-09-03 00:46:07','2026-09-03 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-03 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (382,7,'2026-09-02','2026-09-03 00:58:15','2026-09-03 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-03 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (97,1,'2026-09-03','2026-09-04 00:55:34','2026-09-04 10:24:41','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-04 00:55:34');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (194,2,'2026-09-03','2026-09-04 00:58:51','2026-09-04 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-04 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (291,3,'2026-09-03','2026-09-04 00:47:08','2026-09-04 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-04 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (383,7,'2026-09-03','2026-09-04 00:45:16','2026-09-04 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-04 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (98,1,'2026-09-06','2026-09-07 00:58:37','2026-09-07 10:27:44','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-07 00:58:37');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (195,2,'2026-09-06','2026-09-07 00:47:54','2026-09-07 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-07 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (292,3,'2026-09-06','2026-09-07 01:00:00','2026-09-07 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-09-07 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (384,7,'2026-09-06','2026-09-07 00:48:19','2026-09-07 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-07 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (99,1,'2026-09-07','2026-09-08 00:45:38','2026-09-08 10:28:45','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-08 00:45:38');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (196,2,'2026-09-07','2026-09-08 00:48:55','2026-09-08 10:20:02','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-08 00:48:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (293,3,'2026-09-07','2026-09-08 00:51:12','2026-09-08 10:12:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-08 00:51:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (385,7,'2026-09-07','2026-09-08 00:49:20','2026-09-08 10:30:27','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-08 00:49:20');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (100,1,'2026-09-08','2026-09-09 00:46:39','2026-09-09 10:29:46','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-09 00:46:39');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (197,2,'2026-09-08','2026-09-09 00:49:56','2026-09-09 10:21:03','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-09 00:49:56');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (294,3,'2026-09-08','2026-09-09 00:52:13','2026-09-09 10:13:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-09 00:52:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (386,7,'2026-09-08','2026-09-09 00:50:21','2026-09-09 10:31:28','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-09 00:50:21');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (101,1,'2026-09-09','2026-09-10 00:52:31','2026-09-10 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-10 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (198,2,'2026-09-09','2026-09-10 00:55:48','2026-09-10 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-10 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (295,3,'2026-09-09','2026-09-10 00:58:05','2026-09-10 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-10 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (387,7,'2026-09-09','2026-09-10 00:56:13','2026-09-10 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-10 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (102,1,'2026-09-10','2026-09-11 00:53:32','2026-09-11 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-11 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (199,2,'2026-09-10','2026-09-11 00:56:49','2026-09-11 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-11 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (296,3,'2026-09-10','2026-09-11 01:11:06','2026-09-11 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-09-11 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (388,7,'2026-09-10','2026-09-11 00:57:14','2026-09-11 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-11 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (103,1,'2026-09-13','2026-09-14 00:56:35','2026-09-14 10:25:42','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-14 00:56:35');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (200,2,'2026-09-13','2026-09-14 00:45:52','2026-09-14 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-14 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (297,3,'2026-09-13','2026-09-14 00:48:09','2026-09-14 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-14 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (389,7,'2026-09-13','2026-09-14 00:46:17','2026-09-14 10:27:24','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-14 00:46:17');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (104,1,'2026-09-14','2026-09-15 00:57:36','2026-09-15 10:26:43','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-15 00:57:36');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (201,2,'2026-09-14','2026-09-15 01:13:53','2026-09-15 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-09-15 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (298,3,'2026-09-14','2026-09-15 00:49:10','2026-09-15 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-15 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (390,7,'2026-09-14','2026-09-15 00:47:18','2026-09-15 10:28:25','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-15 00:47:18');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (105,1,'2026-09-15','2026-09-16 00:58:37','2026-09-16 10:27:44','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-16 00:58:37');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (202,2,'2026-09-15','2026-09-16 00:47:54','2026-09-16 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-16 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (299,3,'2026-09-15','2026-09-16 01:00:00','2026-09-16 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-09-16 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (391,7,'2026-09-15','2026-09-16 00:48:19','2026-09-16 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-16 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (106,1,'2026-09-16','2026-09-17 00:45:38','2026-09-17 10:28:45','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-17 00:45:38');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (203,2,'2026-09-16','2026-09-17 00:48:55','2026-09-17 10:20:02','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-17 00:48:55');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (300,3,'2026-09-16','2026-09-17 00:51:12','2026-09-17 10:12:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-17 00:51:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (392,7,'2026-09-16','2026-09-17 00:49:20','2026-09-17 10:30:27','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-17 00:49:20');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (107,1,'2026-09-17','2026-09-18 00:46:39','2026-09-18 10:29:46','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-18 00:46:39');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (204,2,'2026-09-17','2026-09-18 00:49:56','2026-09-18 10:21:03','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-18 00:49:56');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (301,3,'2026-09-17','2026-09-18 00:52:13','2026-09-18 10:13:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-18 00:52:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (393,7,'2026-09-17','2026-09-18 00:50:21','2026-09-18 10:31:28','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-18 00:50:21');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (108,1,'2026-09-20','2026-09-21 00:54:33','2026-09-21 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-21 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (205,2,'2026-09-20','2026-09-21 00:57:50','2026-09-21 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-21 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (302,3,'2026-09-20','2026-09-21 00:46:07','2026-09-21 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-21 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (394,7,'2026-09-20','2026-09-21 00:58:15','2026-09-21 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-21 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (109,1,'2026-09-21','2026-09-22 00:55:34','2026-09-22 10:24:41','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-22 00:55:34');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (206,2,'2026-09-21','2026-09-22 00:58:51','2026-09-22 10:16:58','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-22 00:58:51');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (303,3,'2026-09-21','2026-09-22 00:47:08','2026-09-22 10:33:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-22 00:47:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (395,7,'2026-09-21','2026-09-22 00:45:16','2026-09-22 10:26:23','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-22 00:45:16');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (110,1,'2026-09-22','2026-09-23 00:56:35','2026-09-23 10:25:42','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-23 00:56:35');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (207,2,'2026-09-22','2026-09-23 00:45:52','2026-09-23 10:17:59','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-23 00:45:52');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (304,3,'2026-09-22','2026-09-23 00:48:09','2026-09-23 10:34:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-23 00:48:09');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (396,7,'2026-09-22','2026-09-23 00:46:17','2026-09-23 10:27:24','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-23 00:46:17');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (111,1,'2026-09-23','2026-09-24 00:57:36','2026-09-24 10:26:43','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-24 00:57:36');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (208,2,'2026-09-23','2026-09-24 01:13:53','2026-09-24 10:18:00','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-09-24 01:13:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (305,3,'2026-09-23','2026-09-24 00:49:10','2026-09-24 10:10:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-24 00:49:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (397,7,'2026-09-23','2026-09-24 00:47:18','2026-09-24 10:28:25','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-24 00:47:18');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (112,1,'2026-09-24','2026-09-25 00:58:37','2026-09-25 10:27:44','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-25 00:58:37');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (209,2,'2026-09-24','2026-09-25 00:47:54','2026-09-25 10:19:01','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-25 00:47:54');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (306,3,'2026-09-24','2026-09-25 01:00:00','2026-09-25 10:11:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-09-25 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (398,7,'2026-09-24','2026-09-25 00:48:19','2026-09-25 10:29:26','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-25 00:48:19');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (113,1,'2026-09-27','2026-09-28 01:15:40','2026-09-28 10:30:47','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-09-28 01:15:40');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (210,2,'2026-09-27','2026-09-28 00:50:57','2026-09-28 10:22:04','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-28 00:50:57');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (307,3,'2026-09-27','2026-09-28 00:53:14','2026-09-28 10:14:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-28 00:53:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (399,7,'2026-09-27','2026-09-28 00:51:22','2026-09-28 10:32:29','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-28 00:51:22');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (114,1,'2026-09-28','2026-09-29 00:48:41','2026-09-29 10:31:48','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-29 00:48:41');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (211,2,'2026-09-28','2026-09-29 00:51:58','2026-09-29 10:23:05','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-29 00:51:58');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (308,3,'2026-09-28','2026-09-29 00:54:15','2026-09-29 10:15:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-29 00:54:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (400,7,'2026-09-28','2026-09-29 00:52:23','2026-09-29 10:33:30','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-29 00:52:23');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (115,1,'2026-09-29','2026-09-30 00:54:33','2026-09-30 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-30 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (212,2,'2026-09-29','2026-09-30 00:57:50','2026-09-30 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-30 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (309,3,'2026-09-29','2026-09-30 00:46:07','2026-09-30 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-30 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (401,7,'2026-09-29','2026-09-30 00:58:15','2026-09-30 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-09-30 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (116,1,'2026-09-30','2026-10-01 00:58:23','2026-10-01 10:13:30','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-01 00:58:23');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (213,2,'2026-09-30','2026-10-01 01:15:40','2026-10-01 10:30:47','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-01 01:15:40');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (310,3,'2026-09-30','2026-10-01 00:50:57','2026-10-01 10:22:04','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-01 00:50:57');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (402,7,'2026-09-30','2026-10-01 00:48:05','2026-10-01 10:15:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-01 00:48:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (117,1,'2026-10-01','2026-10-02 00:45:24','2026-10-02 10:14:31','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-02 00:45:24');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (214,2,'2026-10-01','2026-10-02 00:48:41','2026-10-02 10:31:48','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-02 00:48:41');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (311,3,'2026-10-01','2026-10-02 00:51:58','2026-10-02 10:23:05','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-02 00:51:58');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (403,7,'2026-10-01','2026-10-02 00:49:06','2026-10-02 10:16:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-02 00:49:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (40,7,'2026-10-04','2026-10-05 03:32:53',NULL,'-6.81082100','107.12559233',NULL,NULL,1,0,'late','Face Snapshot: uploads/face_snapshots/face_7_clock_in_20261005_103253.jpg','2026-10-05 03:32:53');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (118,1,'2026-10-04','2026-10-05 01:17:27','2026-10-05 10:17:34','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-05 01:17:27');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (215,2,'2026-10-04','2026-10-05 00:51:44','2026-10-05 10:34:51','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-05 00:51:44');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (312,3,'2026-10-04','2026-10-05 00:54:01','2026-10-05 10:26:08','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-05 00:54:01');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (119,1,'2026-10-05','2026-10-06 00:49:28','2026-10-06 10:18:35','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-06 00:49:28');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (216,2,'2026-10-05','2026-10-06 00:52:45','2026-10-06 10:10:52','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-06 00:52:45');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (313,3,'2026-10-05','2026-10-06 00:55:02','2026-10-06 10:27:09','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-06 00:55:02');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (405,7,'2026-10-05','2026-10-06 00:53:10','2026-10-06 10:20:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-06 00:53:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (120,1,'2026-10-06','2026-10-07 00:50:29','2026-10-07 10:19:36','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-07 00:50:29');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (217,2,'2026-10-06','2026-10-07 00:53:46','2026-10-07 10:11:53','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-07 00:53:46');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (314,3,'2026-10-06','2026-10-07 00:56:03','2026-10-07 10:28:10','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-07 00:56:03');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (406,7,'2026-10-06','2026-10-07 01:16:11','2026-10-07 10:21:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-07 01:16:11');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (121,1,'2026-10-07','2026-10-08 00:51:30','2026-10-08 10:20:37','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-08 00:51:30');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (218,2,'2026-10-07','2026-10-08 00:54:47','2026-10-08 10:12:54','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-08 00:54:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (315,3,'2026-10-07','2026-10-08 00:57:04','2026-10-08 10:29:11','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-08 00:57:04');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (407,7,'2026-10-07','2026-10-08 00:55:12','2026-10-08 10:22:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-08 00:55:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (122,1,'2026-10-08','2026-10-09 00:52:31','2026-10-09 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-09 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (219,2,'2026-10-08','2026-10-09 00:55:48','2026-10-09 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-09 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (316,3,'2026-10-08','2026-10-09 00:58:05','2026-10-09 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-09 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (408,7,'2026-10-08','2026-10-09 00:56:13','2026-10-09 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-09 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (123,1,'2026-10-11','2026-10-12 00:46:25','2026-10-12 10:15:32','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-12 00:46:25');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (220,2,'2026-10-11','2026-10-12 01:00:00','2026-10-12 10:32:49','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-10-12 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (317,3,'2026-10-11','2026-10-12 00:52:59','2026-10-12 10:24:06','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-12 00:52:59');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (409,7,'2026-10-11','2026-10-12 00:50:07','2026-10-12 10:17:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-12 00:50:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (124,1,'2026-10-12','2026-10-13 00:47:26','2026-10-13 10:16:33','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-13 00:47:26');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (221,2,'2026-10-12','2026-10-13 00:50:43','2026-10-13 10:33:50','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-13 00:50:43');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (318,3,'2026-10-12','2026-10-13 00:53:00','2026-10-13 10:25:07','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-13 00:53:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (410,7,'2026-10-12','2026-10-13 00:51:08','2026-10-13 10:18:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-13 00:51:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (125,1,'2026-10-13','2026-10-14 01:17:27','2026-10-14 10:17:34','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-14 01:17:27');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (222,2,'2026-10-13','2026-10-14 00:51:44','2026-10-14 10:34:51','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-14 00:51:44');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (319,3,'2026-10-13','2026-10-14 00:54:01','2026-10-14 10:26:08','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-14 00:54:01');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (411,7,'2026-10-13','2026-10-14 01:00:00','2026-10-14 10:19:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-10-14 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (126,1,'2026-10-14','2026-10-15 00:49:28','2026-10-15 10:18:35','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-15 00:49:28');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (223,2,'2026-10-14','2026-10-15 00:52:45','2026-10-15 10:10:52','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-15 00:52:45');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (320,3,'2026-10-14','2026-10-15 00:55:02','2026-10-15 10:27:09','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-15 00:55:02');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (412,7,'2026-10-14','2026-10-15 00:53:10','2026-10-15 10:20:17','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-15 00:53:10');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (127,1,'2026-10-15','2026-10-16 00:50:29','2026-10-16 10:19:36','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-16 00:50:29');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (224,2,'2026-10-15','2026-10-16 00:53:46','2026-10-16 10:11:53','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-16 00:53:46');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (321,3,'2026-10-15','2026-10-16 00:56:03','2026-10-16 10:28:10','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-16 00:56:03');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (413,7,'2026-10-15','2026-10-16 01:16:11','2026-10-16 10:21:18','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-16 01:16:11');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (128,1,'2026-10-18','2026-10-19 00:53:32','2026-10-19 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-19 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (225,2,'2026-10-18','2026-10-19 00:56:49','2026-10-19 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-19 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (322,3,'2026-10-18','2026-10-19 01:11:06','2026-10-19 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-19 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (414,7,'2026-10-18','2026-10-19 00:57:14','2026-10-19 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-19 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (129,1,'2026-10-19','2026-10-20 00:45:24','2026-10-20 10:14:31','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-20 00:45:24');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (226,2,'2026-10-19','2026-10-20 00:48:41','2026-10-20 10:31:48','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-20 00:48:41');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (323,3,'2026-10-19','2026-10-20 00:51:58','2026-10-20 10:23:05','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-20 00:51:58');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (415,7,'2026-10-19','2026-10-20 00:49:06','2026-10-20 10:16:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-20 00:49:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (130,1,'2026-10-20','2026-10-21 00:46:25','2026-10-21 10:15:32','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-21 00:46:25');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (227,2,'2026-10-20','2026-10-21 01:00:00','2026-10-21 10:32:49','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-10-21 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (324,3,'2026-10-20','2026-10-21 00:52:59','2026-10-21 10:24:06','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-21 00:52:59');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (416,7,'2026-10-20','2026-10-21 00:50:07','2026-10-21 10:17:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-21 00:50:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (131,1,'2026-10-21','2026-10-22 00:47:26','2026-10-22 10:16:33','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-22 00:47:26');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (228,2,'2026-10-21','2026-10-22 00:50:43','2026-10-22 10:33:50','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-22 00:50:43');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (325,3,'2026-10-21','2026-10-22 00:53:00','2026-10-22 10:25:07','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-22 00:53:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (417,7,'2026-10-21','2026-10-22 00:51:08','2026-10-22 10:18:15','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-22 00:51:08');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (132,1,'2026-10-22','2026-10-23 01:17:27','2026-10-23 10:17:34','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-23 01:17:27');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (229,2,'2026-10-22','2026-10-23 00:51:44','2026-10-23 10:34:51','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-23 00:51:44');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (326,3,'2026-10-22','2026-10-23 00:54:01','2026-10-23 10:26:08','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-23 00:54:01');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (418,7,'2026-10-22','2026-10-23 01:00:00','2026-10-23 10:19:16','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-10-23 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (133,1,'2026-10-25','2026-10-26 00:51:30','2026-10-26 10:20:37','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-26 00:51:30');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (230,2,'2026-10-25','2026-10-26 00:54:47','2026-10-26 10:12:54','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-26 00:54:47');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (327,3,'2026-10-25','2026-10-26 00:57:04','2026-10-26 10:29:11','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-26 00:57:04');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (419,7,'2026-10-25','2026-10-26 00:55:12','2026-10-26 10:22:19','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-26 00:55:12');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (134,1,'2026-10-26','2026-10-27 00:52:31','2026-10-27 10:21:38','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-27 00:52:31');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (231,2,'2026-10-26','2026-10-27 00:55:48','2026-10-27 10:13:55','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-27 00:55:48');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (328,3,'2026-10-26','2026-10-27 00:58:05','2026-10-27 10:30:12','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-27 00:58:05');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (420,7,'2026-10-26','2026-10-27 00:56:13','2026-10-27 10:23:20','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-27 00:56:13');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (135,1,'2026-10-27','2026-10-28 00:53:32','2026-10-28 10:22:39','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-28 00:53:32');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (232,2,'2026-10-27','2026-10-28 00:56:49','2026-10-28 10:14:56','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-28 00:56:49');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (329,3,'2026-10-27','2026-10-28 01:11:06','2026-10-28 10:31:13','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'late',NULL,'2026-10-28 01:11:06');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (421,7,'2026-10-27','2026-10-28 00:57:14','2026-10-28 10:24:21','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-28 00:57:14');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (136,1,'2026-10-28','2026-10-29 00:54:33','2026-10-29 10:23:40','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-29 00:54:33');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (233,2,'2026-10-28','2026-10-29 00:57:50','2026-10-29 10:15:57','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-29 00:57:50');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (330,3,'2026-10-28','2026-10-29 00:46:07','2026-10-29 10:32:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-29 00:46:07');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (422,7,'2026-10-28','2026-10-29 00:58:15','2026-10-29 10:25:22','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-29 00:58:15');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (137,1,'2026-10-29','2026-10-30 00:46:25','2026-10-30 10:15:32','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-30 00:46:25');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (234,2,'2026-10-29','2026-10-30 01:00:00','2026-10-30 10:32:49','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'dinas','Dinas Luar Kantor','2026-10-30 01:00:00');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (331,3,'2026-10-29','2026-10-30 00:52:59','2026-10-30 10:24:06','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-30 00:52:59');
INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (423,7,'2026-10-29','2026-10-30 00:50:07','2026-10-30 10:17:14','-6.81082100','107.12559233','-6.81082100','107.12559233',1,1,'present',NULL,'2026-10-30 00:50:07');

INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (1,1,'2026-06-30','[{"text":"membuat sistem absensi karyawan","is_completed":false},{"text":"membuat nenkin ","is_completed":true}]',NULL,'2026-07-01 19:18:35','2026-07-01 19:19:06');
INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (3,1,'2026-08-02','[{"text":"muhammad faizal","status":"new","finished_at":null}]',NULL,'2026-08-03 04:06:21','2026-08-03 04:06:21');
INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (4,1,'2026-08-16','[{"text":"SJLkslksL","status":"new","finished_at":null},{"text":"NJSKDJLSK","status":"new","finished_at":null},{"text":"NDJSDKJLKD","status":"new","finished_at":null}]',NULL,'2026-08-17 07:06:06','2026-08-17 07:06:06');
INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (5,7,'2026-10-04','[{"text":"Brifing Manager","category":"Meeting","description":"meeting pagi","status":"done","time":"12.04","finished_at":"2026-10-05T05:04:14.875Z"}]',NULL,'2026-10-05 05:04:14','2026-10-05 05:04:14');

SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================================
-- SETUP SELESAI. SISTEM SIAP DIGUNAKAN DI PRODUKSI DENGAN STATUS BERSIH.
-- ============================================================================
