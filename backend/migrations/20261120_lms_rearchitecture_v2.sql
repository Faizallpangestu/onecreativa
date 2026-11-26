-- LMS Creativa Re-Architecture v2
-- Benchmark: Moodle + Japan Foundation JF Standard + Minato + Marugoto + Context-Aware Kaiwa AI

-- 1. PROGRAMS
CREATE TABLE IF NOT EXISTS `lms_programs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `target_level` VARCHAR(50) DEFAULT 'N5-N4',
  `description` TEXT,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BATCHES (Angkatan)
CREATE TABLE IF NOT EXISTS `lms_batches` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `program_id` INT UNSIGNED NOT NULL,
  `batch_code` VARCHAR(50) NOT NULL UNIQUE,
  `batch_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` ENUM('planning', 'active', 'completed') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_program` (`program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. COURSES (Mata Pelajaran / Tingkat Belajar)
CREATE TABLE IF NOT EXISTS `lms_courses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `program_id` INT UNSIGNED NULL,
  `course_code` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `jf_standard_level` ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'A1',
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') DEFAULT 'N5',
  `description` TEXT,
  `thumbnail` VARCHAR(255) NULL,
  `total_hours` INT DEFAULT 120,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_program` (`program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MODULES (Bab Pembelajaran: Bab 1-50 Minna no Nihongo / Marugoto)
CREATE TABLE IF NOT EXISTS `lms_modules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 1,
  `module_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. LESSONS (Topik / Can-do Learning Unit)
CREATE TABLE IF NOT EXISTS `lms_lessons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `module_id` INT UNSIGNED NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 1,
  `lesson_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `can_do_statement` TEXT NOT NULL,
  `grammar_points` TEXT,
  `vocabulary_target` TEXT,
  `estimated_minutes` INT DEFAULT 45,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_module` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ACTIVITIES (Materi, Listening, Reading, Writing, Speaking, Tugas, Quiz, Ukom, Kotoba, Kaiwa AI)
CREATE TABLE IF NOT EXISTS `lms_activities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `lesson_id` INT UNSIGNED NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 1,
  `activity_type` ENUM('materi', 'listening', 'reading', 'writing', 'speaking', 'tugas', 'quiz', 'ukom', 'kotoba', 'kaiwa_ai') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `content_url` VARCHAR(255) NULL,
  `content_body` LONGTEXT NULL,
  `config_json` LONGTEXT NULL,
  `is_mandatory` TINYINT(1) DEFAULT 1,
  `passing_score` DECIMAL(5,2) DEFAULT 70.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_lesson` (`lesson_id`),
  INDEX `idx_type` (`activity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ENROLLMENTS (Pendaftaran Siswa ke Kelas / Course)
CREATE TABLE IF NOT EXISTS `lms_enrollments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `class_id` INT UNSIGNED NULL,
  `course_id` INT UNSIGNED NULL,
  `status` ENUM('active', 'completed', 'dropped', 'suspended') DEFAULT 'active',
  `progress_percent` DECIMAL(5,2) DEFAULT 0.00,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_class` (`class_id`),
  INDEX `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. KAIWA AI SCENARIOS
CREATE TABLE IF NOT EXISTS `lms_kaiwa_scenarios` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `scenario_key` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(150) NOT NULL,
  `japanese_title` VARCHAR(150) NOT NULL,
  `level` VARCHAR(20) DEFAULT 'N5',
  `category` VARCHAR(50) NOT NULL,
  `system_prompt` TEXT NOT NULL,
  `initial_greeting` TEXT NOT NULL,
  `suggested_replies` JSON NULL,
  `target_can_do` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. KAIWA AI SESSIONS & EVALUATION (Rubrik 4 Pilar: Grammar, Vocabulary, Fluency, Naturalness)
CREATE TABLE IF NOT EXISTS `lms_kaiwa_sessions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `activity_id` INT UNSIGNED NULL,
  `lesson_id` INT UNSIGNED NULL,
  `course_id` INT UNSIGNED NULL,
  `scenario_id` INT UNSIGNED NOT NULL,
  `mode` ENUM('voice', 'text') DEFAULT 'voice',
  `conversation_transcript` LONGTEXT NULL,
  `score_grammar` DECIMAL(3,1) DEFAULT 0.0,
  `score_vocabulary` DECIMAL(3,1) DEFAULT 0.0,
  `score_fluency` DECIMAL(3,1) DEFAULT 0.0,
  `score_naturalness` DECIMAL(3,1) DEFAULT 0.0,
  `score_overall` DECIMAL(3,1) DEFAULT 0.0,
  `ai_feedback_summary` TEXT,
  `ai_feedback_corrections` LONGTEXT NULL,
  `status` ENUM('in_progress', 'completed', 'evaluated') DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_activity` (`activity_id`),
  INDEX `idx_scenario` (`scenario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. COMPETENCIES (JF Standard Can-do)
CREATE TABLE IF NOT EXISTS `lms_competencies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `jf_level` ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'A1',
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') DEFAULT 'N5',
  `can_do_text` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Interpersonal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. STUDENT COMPETENCIES (Pencapaian Siswa)
CREATE TABLE IF NOT EXISTS `lms_student_competencies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `competency_id` INT UNSIGNED NOT NULL,
  `status` ENUM('not_started', 'in_progress', 'achieved', 'mastered') DEFAULT 'in_progress',
  `achieved_at` TIMESTAMP NULL,
  `verified_by` INT UNSIGNED NULL,
  `evidence_session_id` INT UNSIGNED NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_comp` (`competency_id`),
  UNIQUE KEY `uniq_user_comp` (`user_id`, `competency_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. ACTIVITY COMPLETIONS
CREATE TABLE IF NOT EXISTS `lms_activity_completions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `activity_id` INT UNSIGNED NOT NULL,
  `status` ENUM('not_attempted', 'in_progress', 'completed', 'passed', 'failed') DEFAULT 'completed',
  `score` DECIMAL(5,2) NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_act` (`user_id`, `activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. COURSE COMPLETIONS
CREATE TABLE IF NOT EXISTS `lms_course_completions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `progress_percent` DECIMAL(5,2) DEFAULT 0.00,
  `final_grade` DECIMAL(5,2) NULL,
  `is_certified` TINYINT(1) DEFAULT 0,
  `certificate_code` VARCHAR(100) NULL,
  `completed_at` TIMESTAMP NULL,
  UNIQUE KEY `uniq_user_course` (`user_id`, `course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. GRADEBOOK ITEMS & GRADES
CREATE TABLE IF NOT EXISTS `lms_gradebook_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `item_type` ENUM('tugas', 'quiz', 'ukom', 'kaiwa', 'kehadiran') NOT NULL,
  `max_score` DECIMAL(5,2) DEFAULT 100.00,
  `weight_percent` DECIMAL(5,2) DEFAULT 20.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lms_gradebook_grades` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `item_id` INT UNSIGNED NOT NULL,
  `score` DECIMAL(5,2) DEFAULT 0.00,
  `feedback` TEXT NULL,
  `graded_by` INT UNSIGNED NULL,
  `graded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_item` (`user_id`, `item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
