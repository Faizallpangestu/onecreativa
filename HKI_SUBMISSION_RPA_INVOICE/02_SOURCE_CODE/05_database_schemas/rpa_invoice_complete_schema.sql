-- =====================================================================
-- SKEMA BASIS DATA SISTEM RPA INVOICE & REKONSILIASI KEUANGAN OTOMATIS
-- Hak Cipta (c) LPK Creativa Bridging International
-- =====================================================================

CREATE TABLE IF NOT EXISTS `billing_invoices` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `tanggal` VARCHAR(50) DEFAULT NULL,
  `customer` VARCHAR(255) DEFAULT NULL,
  `nominal` DECIMAL(15,2) DEFAULT 0.00,
  `sisa` DECIMAL(15,2) DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'Belum Lunas',
  `keterangan` TEXT DEFAULT NULL,
  `public_token` VARCHAR(64) DEFAULT NULL,
  `meta_json` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cust` (`customer`),
  INDEX `idx_token` (`public_token`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `billing_pembayaran` (
  `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `noInv` VARCHAR(50) NOT NULL,
  `tglBayar` VARCHAR(50) DEFAULT NULL,
  `nominal` DECIMAL(15,2) DEFAULT 0.00,
  `metode` VARCHAR(50) DEFAULT 'Transfer Bank',
  `bankTujuan` VARCHAR(100) DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `proof_path` VARCHAR(255) DEFAULT NULL,
  `external_ref` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inv` (`noInv`),
  INDEX `idx_ext_ref` (`external_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `automation_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` VARCHAR(64) NOT NULL,
  `stage` VARCHAR(64) NOT NULL DEFAULT 'phase1_delivery',
  `channel` VARCHAR(32) NOT NULL DEFAULT 'n8n',
  `status` VARCHAR(32) NOT NULL DEFAULT 'success',
  `recipient` VARCHAR(255) NULL,
  `detail_json` LONGTEXT NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_invoice` (`invoice_id`),
  INDEX `idx_stage_status` (`stage`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rpa_processed_registrations` (
  `web_id` INT NOT NULL PRIMARY KEY,
  `invoice_id` VARCHAR(64) NOT NULL,
  `customer` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  INDEX `idx_rpa_proc_inv` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
