-- ============================================================
-- Migration: Face Attendance Feature
-- Database: hris_creativa
-- Tanggal: 2026-06-17
-- Cara jalankan: mysql -u root hris_creativa < face_attendance_migration.sql
-- ============================================================

-- 1. Tambah kolom face di tabel attendance (check_in_method, confidence, snapshot)
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS check_in_method  ENUM('rfid','face','manual','admin') DEFAULT 'manual' AFTER status,
  ADD COLUMN IF NOT EXISTS check_out_method ENUM('rfid','face','manual','admin') DEFAULT 'manual' AFTER check_in_method,
  ADD COLUMN IF NOT EXISTS face_confidence  FLOAT DEFAULT NULL AFTER check_out_method,
  ADD COLUMN IF NOT EXISTS face_snapshot    VARCHAR(255) DEFAULT NULL AFTER face_confidence,
  ADD COLUMN IF NOT EXISTS latitude         DECIMAL(10,8) DEFAULT NULL AFTER face_snapshot,
  ADD COLUMN IF NOT EXISTS longitude        DECIMAL(11,8) DEFAULT NULL AFTER latitude;

-- 2. Tabel face_enrollments (menyimpan descriptor wajah setiap karyawan)
CREATE TABLE IF NOT EXISTS face_enrollments (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  employee_id    INT NOT NULL,
  descriptors    LONGTEXT NOT NULL COMMENT 'JSON array of Float32Array (128-dim face vectors)',
  sample_count   INT DEFAULT 5,
  quality_score  FLOAT DEFAULT NULL,
  is_active      TINYINT(1) DEFAULT 1,
  enrolled_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  enrolled_by    INT DEFAULT NULL COMMENT 'user id yang melakukan enrollment',
  updated_at     DATETIME ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employee (employee_id),
  CONSTRAINT fk_fe_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel face_attendance_logs (log setiap attempt, berhasil maupun gagal)
CREATE TABLE IF NOT EXISTS face_attendance_logs (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  employee_id    INT DEFAULT NULL COMMENT 'NULL jika wajah tidak dikenali',
  attempt_type   ENUM('clock_in','clock_out') NOT NULL,
  confidence     FLOAT DEFAULT NULL,
  result         ENUM('success','no_face','no_match','duplicate','error') NOT NULL,
  message        VARCHAR(255) DEFAULT NULL,
  snapshot_path  VARCHAR(255) DEFAULT NULL,
  ip_address     VARCHAR(45) DEFAULT NULL,
  user_agent     TEXT DEFAULT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_employee (employee_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel work_schedules (jam masuk, toleransi terlambat)
CREATE TABLE IF NOT EXISTS work_schedules (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL DEFAULT 'Default',
  shift_start     TIME NOT NULL DEFAULT '08:00:00',
  shift_end       TIME NOT NULL DEFAULT '17:00:00',
  late_tolerance  INT NOT NULL DEFAULT 15 COMMENT 'menit toleransi terlambat',
  is_default      TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default schedule
INSERT IGNORE INTO work_schedules (id, name, shift_start, shift_end, late_tolerance, is_default)
VALUES (1, 'Shift Reguler (08:00-17:00)', '08:00:00', '17:00:00', 15, 1);

-- 5. Tambah kolom schedule ke employees (opsional, untuk multi-shift)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS schedule_id INT DEFAULT 1 AFTER department_id;

-- ============================================================
-- Verifikasi hasil migration
-- ============================================================
SELECT 'face_enrollments' AS tabel, COUNT(*) AS rows FROM face_enrollments
UNION ALL
SELECT 'face_attendance_logs', COUNT(*) FROM face_attendance_logs
UNION ALL
SELECT 'work_schedules', COUNT(*) FROM work_schedules;
