-- ============================================
-- Migration: Buat tabel overtime_requests
-- Database: hris_creativa
-- ============================================
--
-- CARA via phpMyAdmin:
-- 1. Buka http://localhost/phpmyadmin
-- 2. Klik database "hris_creativa"
-- 3. Klik tab "SQL"
-- 4. Paste semua query di bawah ini, klik "Go"
-- ============================================

CREATE TABLE IF NOT EXISTS overtime_requests (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    employee_id     INT NOT NULL,
    attendance_id   INT DEFAULT NULL,
    date            DATE NOT NULL,
    overtime_minutes INT NOT NULL DEFAULT 0,
    reason          TEXT,
    status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by     INT DEFAULT NULL,
    approved_at     DATETIME DEFAULT NULL,
    reject_reason   TEXT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
