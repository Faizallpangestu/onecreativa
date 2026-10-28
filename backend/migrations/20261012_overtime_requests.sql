-- Approved overtime is separate from attendance evidence; no historical requests are fabricated.
CREATE TABLE overtime_requests (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 employee_id INT UNSIGNED NOT NULL,
 attendance_id INT UNSIGNED NULL,
 date DATE NOT NULL,
 overtime_minutes INT UNSIGNED NOT NULL,
 reason TEXT NOT NULL,
 status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 approved_by INT UNSIGNED NULL,
 approved_at DATETIME NULL,
 reject_reason TEXT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
 FOREIGN KEY(attendance_id) REFERENCES attendance_logs(id) ON DELETE RESTRICT,
 FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE RESTRICT,
 INDEX(employee_id,date,status),
 CHECK(overtime_minutes BETWEEN 1 AND 1440),
 CHECK((status='pending' AND approved_by IS NULL AND approved_at IS NULL) OR (status<>'pending' AND approved_by IS NOT NULL AND approved_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
