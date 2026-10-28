-- Version 20261012: approved local additive relationships migration.
-- User authorized continuation toward production readiness. Execute through release-relationships.cjs.
-- Additive empty relationship tables only: no INSERT, UPDATE, DELETE, ALTER or DROP.
-- Parent key signedness/collation is based on the audited local schema.
-- Recheck the actual target schema and backup/restore before applying.

CREATE TABLE employee_employment (
 employee_id INT UNSIGNED PRIMARY KEY,
 manager_employee_id INT UNSIGNED NULL,
 employment_type VARCHAR(50) NULL,
 employment_status VARCHAR(50) NULL,
 resignation_date DATE NULL,
 updated_by INT UNSIGNED NOT NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
 FOREIGN KEY(manager_employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
 FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK(manager_employee_id IS NULL OR manager_employee_id<>employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE lms_classes (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(50) NOT NULL UNIQUE,
 name VARCHAR(150) NOT NULL,
 program_code VARCHAR(100) NOT NULL,
 batch VARCHAR(100) NOT NULL,
 level VARCHAR(50) NULL,
 timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
 status ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
 created_by INT UNSIGNED NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE lms_teaching_assignments (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 class_id INT UNSIGNED NOT NULL,
 sensei_user_id INT UNSIGNED NOT NULL,
 starts_on DATE NOT NULL,
 ends_on DATE NULL,
 is_active TINYINT NOT NULL DEFAULT 1,
 assigned_by INT UNSIGNED NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(class_id,sensei_user_id,starts_on),
 FOREIGN KEY(class_id) REFERENCES lms_classes(id) ON DELETE RESTRICT,
 FOREIGN KEY(sensei_user_id) REFERENCES users(id) ON DELETE RESTRICT,
 FOREIGN KEY(assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK(ends_on IS NULL OR ends_on>=starts_on),
 CHECK(is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE lms_class_enrollments (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 class_id INT UNSIGNED NOT NULL,
 student_id INT NOT NULL,
 joined_on DATE NOT NULL,
 left_on DATE NULL,
 status ENUM('active','completed','withdrawn') NOT NULL DEFAULT 'active',
 enrolled_by INT UNSIGNED NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(class_id,student_id),
 FOREIGN KEY(class_id) REFERENCES lms_classes(id) ON DELETE RESTRICT,
 FOREIGN KEY(student_id) REFERENCES peserta_intensif(id) ON DELETE RESTRICT,
 FOREIGN KEY(enrolled_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK(left_on IS NULL OR left_on>=joined_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE lms_meeting_assignments (
 meeting_id INT PRIMARY KEY,
 assignment_id INT UNSIGNED NOT NULL,
 linked_by INT UNSIGNED NOT NULL,
 linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(meeting_id) REFERENCES lms_meetings(id) ON DELETE RESTRICT,
 FOREIGN KEY(assignment_id) REFERENCES lms_teaching_assignments(id) ON DELETE RESTRICT,
 FOREIGN KEY(linked_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE lms_grade_publications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 class_id INT UNSIGNED NOT NULL,
 submission_id INT NULL UNIQUE,
 grade_record_id INT NULL UNIQUE,
 published_by INT UNSIGNED NULL,
 published_at DATETIME NULL,
 FOREIGN KEY(class_id) REFERENCES lms_classes(id) ON DELETE RESTRICT,
 FOREIGN KEY(submission_id) REFERENCES lms_submissions(id) ON DELETE RESTRICT,
 FOREIGN KEY(grade_record_id) REFERENCES lms_grades(id) ON DELETE RESTRICT,
 FOREIGN KEY(published_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK((submission_id IS NOT NULL)+(grade_record_id IS NOT NULL)=1),
 CHECK((published_by IS NULL AND published_at IS NULL) OR (published_by IS NOT NULL AND published_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE student_invoice_links (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 student_id INT NOT NULL,
 billing_invoice_id VARCHAR(50) NULL UNIQUE,
 invoice_client_id INT NULL UNIQUE,
 linked_by INT UNSIGNED NOT NULL,
 linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(student_id) REFERENCES peserta_intensif(id) ON DELETE RESTRICT,
 FOREIGN KEY(billing_invoice_id) REFERENCES billing_invoices(id) ON DELETE RESTRICT,
 FOREIGN KEY(invoice_client_id) REFERENCES invoice_clients(id) ON DELETE RESTRICT,
 FOREIGN KEY(linked_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK((billing_invoice_id IS NOT NULL)+(invoice_client_id IS NOT NULL)=1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE matching_student_links (
 candidate_id INT PRIMARY KEY,
 student_id INT NOT NULL UNIQUE,
 linked_by INT UNSIGNED NOT NULL,
 linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(candidate_id) REFERENCES lpk_matching_job(id) ON DELETE RESTRICT,
 FOREIGN KEY(student_id) REFERENCES peserta_intensif(id) ON DELETE RESTRICT,
 FOREIGN KEY(linked_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- External candidates remain valid without an internal student link.

CREATE TABLE matching_candidate_history (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 candidate_id INT NOT NULL,
 action VARCHAR(50) NOT NULL,
 previous_status VARCHAR(100) NULL,
 next_status VARCHAR(100) NULL,
 notes TEXT NULL,
 actor_id INT UNSIGNED NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(candidate_id) REFERENCES lpk_matching_job(id) ON DELETE RESTRICT,
 FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE RESTRICT,
 INDEX(candidate_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
