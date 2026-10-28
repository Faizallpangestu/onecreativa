-- Additive server-issued QR sessions; no change to historical attendance.
CREATE TABLE lms_attendance_sessions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 meeting_id INT NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 issued_by INT UNSIGNED NOT NULL,
 issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at DATETIME NOT NULL,
 revoked TINYINT NOT NULL DEFAULT 0,
 FOREIGN KEY(meeting_id) REFERENCES lms_meetings(id) ON DELETE RESTRICT,
 FOREIGN KEY(issued_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK(revoked IN (0,1)),
 CHECK(expires_at>issued_at),
 INDEX(meeting_id,expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
