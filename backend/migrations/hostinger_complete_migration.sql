-- ============================================================================
-- ONE CREATIVA - MASTER MIGRATION LENGKAP UNTUK PRODUCTION (HOSTINGER)
-- Tanggal Pembaruan: 31 Oktober 2026
-- Aman dijalankan berulang kali (Idempotent: menggunakan IF NOT EXISTS & INSERT IGNORE)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. TABEL AUDIT LOG & KEAMANAN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `accounting_audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `entity_type` VARCHAR(40) NOT NULL,
  `entity_id` VARCHAR(100) NOT NULL,
  `action` VARCHAR(40) NOT NULL,
  `actor_id` INT UNSIGNED NOT NULL,
  `actor_name` VARCHAR(255) NOT NULL,
  `details_json` LONGTEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `hash_prev` VARCHAR(64) NULL,
  `hash_self` VARCHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_entity` (`entity_type`, `entity_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `accounting_audit_logs` 
  ADD COLUMN IF NOT EXISTS `ip_address` VARCHAR(45) NULL AFTER `details_json`,
  ADD COLUMN IF NOT EXISTS `hash_prev`  VARCHAR(64) NULL AFTER `ip_address`,
  ADD COLUMN IF NOT EXISTS `hash_self`  VARCHAR(64) NULL AFTER `hash_prev`;

-- Trigger Audit Log Anti-Tampering (Izinkan inisialisasi hash_self sekali saat baru dibuat)
DROP TRIGGER IF EXISTS `ac_audit_update`;
DELIMITER $$
CREATE TRIGGER `ac_audit_update` BEFORE UPDATE ON `accounting_audit_logs` FOR EACH ROW 
BEGIN 
  IF (OLD.hash_self IS NOT NULL AND OLD.hash_self <> '') 
     OR (NEW.actor_name <> OLD.actor_name) 
     OR (NEW.entity_type <> OLD.entity_type) 
     OR (NEW.entity_id <> OLD.entity_id) 
     OR (NEW.action <> OLD.action) THEN 
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Audit logs are immutable'; 
  END IF; 
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS `ac_audit_delete`;
DELIMITER $$
CREATE TRIGGER `ac_audit_delete` BEFORE DELETE ON `accounting_audit_logs` FOR EACH ROW 
BEGIN 
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Audit logs are immutable'; 
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. KOLOM TAMBAHAN PADA TABEL UTAMA (EMPLOYEES, USERS, ROLES, POSITIONS)
-- ----------------------------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`,
  ADD COLUMN IF NOT EXISTS `pin_hash` VARCHAR(255) NULL AFTER `password_hash`;

ALTER TABLE `roles`
  ADD COLUMN IF NOT EXISTS `label` VARCHAR(100) NULL AFTER `name`;

ALTER TABLE `positions`
  ADD COLUMN IF NOT EXISTS `base_salary` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `department_id` INT NULL,
  ADD COLUMN IF NOT EXISTS `level` VARCHAR(50) DEFAULT 'Staff',
  ADD COLUMN IF NOT EXISTS `tunjangan` DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `description` TEXT NULL;

ALTER TABLE `employees`
  MODIFY COLUMN `work_type` VARCHAR(20) NOT NULL DEFAULT 'WFO',
  ADD COLUMN IF NOT EXISTS `photo_url` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `face_descriptor` LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS `leave_balance` INT DEFAULT 12,
  ADD COLUMN IF NOT EXISTS `birth_place` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `birth_date` DATE NULL,
  ADD COLUMN IF NOT EXISTS `religion` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `marital_status` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `blood_type` VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS `city` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `emergency_name` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `emergency_relation` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `emergency_phone` VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS `npwp` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `bank_name` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `bank_account` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `bpjs_tk` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `bpjs_kes` VARCHAR(50) NULL;

-- ----------------------------------------------------------------------------
-- 3. TABEL RELASI MODUL (EMPLOYEE, LMS, SISWA, CANDIDATE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_employment` (
  `employee_id` INT UNSIGNED PRIMARY KEY,
  `manager_employee_id` INT UNSIGNED NULL,
  `employment_type` VARCHAR(50) NULL,
  `employment_status` VARCHAR(50) NULL,
  `resignation_date` DATE NULL,
  `updated_by` INT UNSIGNED NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ee_manager` (`manager_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_classes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `program_code` VARCHAR(100) NOT NULL,
  `batch` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NULL,
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
  `status` ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_teaching_assignments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT UNSIGNED NOT NULL,
  `sensei_user_id` INT UNSIGNED NOT NULL,
  `starts_on` DATE NOT NULL,
  `ends_on` DATE NULL,
  `is_active` TINYINT NOT NULL DEFAULT 1,
  `assigned_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_class_sensei` (`class_id`, `sensei_user_id`, `starts_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_class_enrollments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT UNSIGNED NOT NULL,
  `student_id` INT NOT NULL,
  `joined_on` DATE NOT NULL,
  `left_on` DATE NULL,
  `status` ENUM('active','completed','withdrawn') NOT NULL DEFAULT 'active',
  `enrolled_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_class_student` (`class_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_meeting_assignments` (
  `meeting_id` INT PRIMARY KEY,
  `assignment_id` INT UNSIGNED NOT NULL,
  `linked_by` INT UNSIGNED NOT NULL,
  `linked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `lms_grade_publications` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT UNSIGNED NOT NULL,
  `submission_id` INT NULL UNIQUE,
  `grade_record_id` INT NULL UNIQUE,
  `published_by` INT UNSIGNED NULL,
  `published_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `student_invoice_links` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `billing_invoice_id` VARCHAR(50) NULL UNIQUE,
  `invoice_client_id` INT NULL UNIQUE,
  `linked_by` INT UNSIGNED NOT NULL,
  `linked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `matching_student_links` (
  `candidate_id` INT PRIMARY KEY,
  `student_id` INT NOT NULL UNIQUE,
  `linked_by` INT UNSIGNED NOT NULL,
  `linked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `matching_candidate_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `previous_status` VARCHAR(100) NULL,
  `next_status` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `actor_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cand_hist` (`candidate_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `overtime_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT UNSIGNED NOT NULL,
  `attendance_id` INT UNSIGNED NULL,
  `date` DATE NOT NULL,
  `overtime_minutes` INT UNSIGNED NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` INT UNSIGNED NULL,
  `approved_at` DATETIME NULL,
  `reject_reason` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ot_emp` (`employee_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `matching_jobs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_title` VARCHAR(255) NOT NULL,
  `bidang` VARCHAR(150) NOT NULL,
  `source_type` VARCHAR(50) NOT NULL DEFAULT 'TSK',
  `source_name` VARCHAR(255) NOT NULL,
  `source_pic` VARCHAR(255) DEFAULT NULL,
  `source_contact` VARCHAR(100) DEFAULT NULL,
  `lokasi_jepang` VARCHAR(255) NOT NULL,
  `kuota` INT NOT NULL DEFAULT 1,
  `total_biaya` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
  `include_items` TEXT DEFAULT NULL,
  `include_custom` TEXT DEFAULT NULL,
  `exclude_items` TEXT DEFAULT NULL,
  `estimasi_gaji` VARCHAR(255) DEFAULT NULL,
  `persyaratan` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `deskripsi` TEXT DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mj_bidang` (`bidang`),
  INDEX `idx_mj_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 4. TABEL ANGGARAN (BUDGET REQUESTS & ITEMS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `budget_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `request_key` CHAR(36) NOT NULL UNIQUE,
  `title` VARCHAR(180) NOT NULL,
  `period` DATE NOT NULL,
  `notes` TEXT NULL,
  `status` ENUM('draft','submitted','under_review','approved','rejected','cancelled','partially_realized','fully_realized','closed') NOT NULL DEFAULT 'draft',
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `approved_amount` DECIMAL(15,2) NULL,
  `department_id` INT UNSIGNED NULL,
  `attachment_key` CHAR(32) NULL,
  `attachment_name` VARCHAR(255) NULL,
  `attachment_link` VARCHAR(2048) NULL,
  `created_by` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_by_name` VARCHAR(255) NOT NULL DEFAULT 'System',
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_by_name` VARCHAR(255) NULL,
  `review_note` TEXT NULL,
  `submitted_at` DATETIME NULL,
  `reviewed_at` DATETIME NULL,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_budget_period_status` (`period`, `status`),
  INDEX `idx_budget_submitted` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `budget_requests`
  ADD COLUMN IF NOT EXISTS `department_id` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `approved_amount` DECIMAL(15,2) NULL,
  ADD COLUMN IF NOT EXISTS `attachment_key` CHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS `attachment_name` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `attachment_link` VARCHAR(2048) NULL;

CREATE TABLE IF NOT EXISTS `budget_request_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `budget_request_id` INT UNSIGNED NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit` VARCHAR(40) NOT NULL DEFAULT 'paket',
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `approved_amount` DECIMAL(15,2) NULL,
  INDEX `idx_bri_req` (`budget_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `budget_request_items`
  ADD COLUMN IF NOT EXISTS `approved_amount` DECIMAL(15,2) NULL;

CREATE TABLE IF NOT EXISTS `budget_request_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `budget_request_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(30) NOT NULL,
  `from_status` VARCHAR(20) NULL,
  `to_status` VARCHAR(20) NOT NULL,
  `actor_id` INT UNSIGNED NOT NULL,
  `actor_name` VARCHAR(255) NOT NULL,
  `actor_role` VARCHAR(50) NOT NULL,
  `note` TEXT NULL,
  `snapshot_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_brh_req` (`budget_request_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 5. TABEL MODUL KEUANGAN & AKUNTANSI LENGKAP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` VARCHAR(100) PRIMARY KEY,
  `checksum` CHAR(64) NOT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `finance_role_permissions` (
  `role_name` VARCHAR(50) NOT NULL,
  `permission` VARCHAR(30) NOT NULL,
  `allowed` TINYINT NOT NULL,
  PRIMARY KEY (`role_name`, `permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `account_group` TINYINT NOT NULL,
  `normal_balance` ENUM('debit','credit') NOT NULL,
  `parent_id` INT UNSIGNED NULL,
  `is_detail` TINYINT NOT NULL DEFAULT 1,
  `is_active` TINYINT NOT NULL DEFAULT 1,
  `report_class` VARCHAR(40) NOT NULL,
  INDEX `idx_acc_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cash_bank_accounts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `account_id` INT UNSIGNED NOT NULL UNIQUE,
  `bank_name` VARCHAR(100) NULL,
  `account_number` VARCHAR(100) NULL,
  `is_active` TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_periods` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `month` CHAR(7) NOT NULL UNIQUE,
  `status` ENUM('open','closed') NOT NULL DEFAULT 'open',
  `closed_by` INT UNSIGNED NULL,
  `closed_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `number` VARCHAR(40) NULL UNIQUE,
  `entry_date` DATE NOT NULL,
  `period_id` INT UNSIGNED NOT NULL,
  `source_type` VARCHAR(40) NOT NULL,
  `source_id` VARCHAR(100) NOT NULL,
  `event` VARCHAR(40) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('draft','posted') NOT NULL DEFAULT 'draft',
  `created_by` INT UNSIGNED NOT NULL,
  `posted_at` DATETIME NULL,
  `reversal_of` BIGINT UNSIGNED NULL UNIQUE,
  UNIQUE KEY `uq_journal_source` (`source_type`, `source_id`, `event`),
  INDEX `idx_je_date` (`entry_date`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `journal_lines` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `journal_entry_id` BIGINT UNSIGNED NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `debit` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `credit` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `department_id` INT UNSIGNED NULL,
  `batch` VARCHAR(100) NULL,
  `student_id` INT NULL,
  `vendor_id` INT UNSIGNED NULL,
  `party_name` VARCHAR(255) NULL,
  `document_type` VARCHAR(40) NULL,
  `document_id` VARCHAR(100) NULL,
  `cash_flow_class` ENUM('operating','investing','financing','transfer','noncash') NOT NULL DEFAULT 'noncash',
  INDEX `idx_jl_acc` (`account_id`, `journal_entry_id`),
  INDEX `idx_jl_doc` (`document_type`, `document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_idempotency` (
  `request_key` VARCHAR(100) PRIMARY KEY,
  `actor_id` INT UNSIGNED NOT NULL,
  `operation` VARCHAR(50) NOT NULL,
  `payload_hash` CHAR(64) NOT NULL,
  `result_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `is_active` TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vendor_bills` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `number` VARCHAR(50) NOT NULL UNIQUE,
  `vendor_id` INT UNSIGNED NOT NULL,
  `bill_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `liability_account_id` INT UNSIGNED NOT NULL,
  `status` ENUM('draft','approved','cancelled') NOT NULL DEFAULT 'draft',
  `created_by` INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_transactions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `number` VARCHAR(40) NULL UNIQUE,
  `request_key` VARCHAR(100) NOT NULL UNIQUE,
  `transaction_date` DATE NOT NULL,
  `type` ENUM('income','expense','transfer') NOT NULL,
  `classification` VARCHAR(50) NOT NULL,
  `source_type` VARCHAR(40) NOT NULL,
  `source_id` VARCHAR(100) NOT NULL,
  `source_number` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'IDR',
  `cash_account_id` INT UNSIGNED NOT NULL,
  `destination_cash_account_id` INT UNSIGNED NULL,
  `counter_account_id` INT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED NULL,
  `batch` VARCHAR(100) NULL,
  `student_id` INT NULL,
  `vendor_id` INT UNSIGNED NULL,
  `party_name` VARCHAR(255) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `reference` VARCHAR(180) NOT NULL,
  `approval_status` ENUM('draft','submitted','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
  `payment_status` ENUM('unpaid','paid','verified','reversed') NOT NULL DEFAULT 'unpaid',
  `journal_status` ENUM('unposted','posted','reversed') NOT NULL DEFAULT 'unposted',
  `created_by` INT UNSIGNED NOT NULL,
  `created_by_name` VARCHAR(255) NOT NULL,
  `approved_by` INT UNSIGNED NULL,
  `approved_by_name` VARCHAR(255) NULL,
  `approved_at` DATETIME NULL,
  `approval_note` TEXT NULL,
  `paid_at` DATETIME NULL,
  `verified_by` INT UNSIGNED NULL,
  `verified_at` DATETIME NULL,
  `journal_entry_id` BIGINT UNSIGNED NULL UNIQUE,
  `attachment_key` CHAR(32) NULL,
  `attachment_name` VARCHAR(255) NULL,
  `attachment_link` VARCHAR(2048) NULL,
  `legacy_finance_id` INT NULL UNIQUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_at_date` (`transaction_date`, `source_type`),
  INDEX `idx_at_source` (`source_type`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `budget_commitments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `budget_item_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `status` ENUM('open','consumed','cancelled') NOT NULL DEFAULT 'open',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `budget_realizations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `request_key` VARCHAR(100) NOT NULL UNIQUE,
  `budget_request_id` INT UNSIGNED NOT NULL,
  `budget_item_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `classification` ENUM('expense','asset','prepayment','vendor_bill') NOT NULL,
  `vendor_id` INT UNSIGNED NULL,
  `vendor_bill_id` INT UNSIGNED NULL,
  `commitment_id` BIGINT UNSIGNED NULL UNIQUE,
  `transaction_id` BIGINT UNSIGNED NULL UNIQUE,
  `journal_entry_id` BIGINT UNSIGNED NULL UNIQUE,
  `status` ENUM('recorded','cancelled') NOT NULL DEFAULT 'recorded',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `accounting_source_documents` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `source_type` VARCHAR(40) NOT NULL,
  `source_id` VARCHAR(100) NOT NULL,
  `number` VARCHAR(100) NOT NULL,
  `document_date` DATE NOT NULL,
  `due_date` DATE NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `control_account_id` INT UNSIGNED NOT NULL,
  `recognition_account_id` INT UNSIGNED NOT NULL,
  `journal_entry_id` BIGINT UNSIGNED NOT NULL UNIQUE,
  UNIQUE KEY `uq_source_doc` (`source_type`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payment_allocations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` BIGINT UNSIGNED NOT NULL UNIQUE,
  `source_document_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `is_reversed` TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `student_payment_submissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_link_id` BIGINT UNSIGNED NOT NULL,
  `student_id` INT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `transfer_date` DATE NOT NULL,
  `reference` VARCHAR(180) NOT NULL,
  `proof_file` VARCHAR(255) NOT NULL,
  `request_key` VARCHAR(100) NOT NULL UNIQUE,
  `status` ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `transaction_id` BIGINT UNSIGNED NULL UNIQUE,
  `review_notes` TEXT NULL,
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_at` DATETIME NULL,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 5. MASTER SEED DATA (PERIODE, COA, KAS/BANK, PERMISSION)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `accounting_periods` (`month`, `status`) VALUES
('2026-01', 'open'), ('2026-02', 'open'), ('2026-03', 'open'), ('2026-04', 'open'),
('2026-05', 'open'), ('2026-06', 'open'), ('2026-07', 'open'), ('2026-08', 'open'),
('2026-09', 'open'), ('2026-10', 'open'), ('2026-11', 'open'), ('2026-12', 'open'),
('2027-01', 'open'), ('2027-02', 'open'), ('2027-03', 'open'), ('2027-04', 'open'),
('2027-05', 'open'), ('2027-06', 'open'), ('2027-07', 'open'), ('2027-08', 'open'),
('2027-09', 'open'), ('2027-10', 'open'), ('2027-11', 'open'), ('2027-12', 'open');

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

INSERT INTO `cash_bank_accounts` (`name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 'Rekening BCA Creativa Bridging Intern', id, 'Bank BCA', '1832-918-428', 1 FROM `accounts` WHERE `code`='1120' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT INTO `cash_bank_accounts` (`name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 'Petty Cash (Kas Kecil Tunai)', id, 'Kas Tunai Kasir', 'CASH-01', 1 FROM `accounts` WHERE `code`='1110' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT INTO `cash_bank_accounts` (`name`, `account_id`, `bank_name`, `account_number`, `is_active`)
SELECT 'Rekening Cadangan Mandiri', id, 'Bank Mandiri', '130-0019283', 1 FROM `accounts` WHERE `code`='1130' LIMIT 1
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `bank_name`=VALUES(`bank_name`), `account_number`=VALUES(`account_number`), `is_active`=1;

INSERT IGNORE INTO `finance_role_permissions` (`role_name`, `permission`, `allowed`) VALUES
('finance', 'read', 1), ('finance', 'prepare', 1), ('finance', 'post', 1), ('finance', 'approve', 0), ('finance', 'configure', 0),
('admin', 'read', 1), ('admin', 'prepare', 0), ('admin', 'post', 0), ('admin', 'approve', 1), ('admin', 'configure', 1),
('super_admin', 'read', 1), ('super_admin', 'prepare', 0), ('super_admin', 'post', 0), ('super_admin', 'approve', 1), ('super_admin', 'configure', 1),
('director', 'read', 1), ('director', 'prepare', 0), ('director', 'post', 0), ('director', 'approve', 1), ('director', 'configure', 0),
('direktur', 'read', 1), ('direktur', 'prepare', 0), ('direktur', 'post', 0), ('direktur', 'approve', 1), ('direktur', 'configure', 0);

SET FOREIGN_KEY_CHECKS = 1;
