<?php
require_once __DIR__ . '/../config/database.php';

echo "=== MIGRATION: LMS DAILY MATERIAL & AI QUIZ GENERATOR ===" . PHP_EOL;

// 1. Table lms_materials
$sql1 = "CREATE TABLE IF NOT EXISTS `lms_materials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int(10) unsigned DEFAULT NULL,
  `sensei_id` int(10) unsigned DEFAULT NULL,
  `meeting_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `chapter_bab` varchar(100) DEFAULT NULL,
  `level` varchar(20) DEFAULT 'N5',
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT 'pdf',
  `file_size` varchar(50) DEFAULT NULL,
  `page_count` int(11) DEFAULT 1,
  `extracted_vocab` longtext DEFAULT NULL,
  `extracted_grammar` longtext DEFAULT NULL,
  `extracted_kanji` longtext DEFAULT NULL,
  `extracted_reading` longtext DEFAULT NULL,
  `can_do_statement` text DEFAULT NULL,
  `learning_objectives` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mat_class` (`class_id`),
  KEY `idx_mat_sensei` (`sensei_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$conn->query($sql1) or die("Error sql1: " . $conn->error);
echo "✅ Table lms_materials ready." . PHP_EOL;

// 2. Table lms_quizzes
$sql2 = "CREATE TABLE IF NOT EXISTS `lms_quizzes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int(10) unsigned DEFAULT NULL,
  `class_name` varchar(150) DEFAULT 'N5 Pagi',
  `material_id` int(10) unsigned DEFAULT NULL,
  `meeting_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `bab` varchar(100) DEFAULT 'Bab 05',
  `level` varchar(20) DEFAULT 'N5',
  `curriculum_source` varchar(100) DEFAULT 'Japan Foundation / Minna no Nihongo',
  `quiz_type` enum('daily','review','remedial','general') NOT NULL DEFAULT 'daily',
  `total_questions` int(11) NOT NULL DEFAULT 10,
  `duration_minutes` int(11) NOT NULL DEFAULT 20,
  `status` enum('draft','ai_validated','sensei_review','published','archived') NOT NULL DEFAULT 'draft',
  `scheduled_date` date DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qz_class` (`class_id`),
  KEY `idx_qz_mat` (`material_id`),
  KEY `idx_qz_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$conn->query($sql2) or die("Error sql2: " . $conn->error);
echo "✅ Table lms_quizzes ready." . PHP_EOL;

// 3. Table lms_quiz_questions
$sql3 = "CREATE TABLE IF NOT EXISTS `lms_quiz_questions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quiz_id` int(10) unsigned NOT NULL,
  `material_id` int(10) unsigned DEFAULT NULL,
  `category` enum('Vocabulary','Grammar','Kanji','Reading','Listening','Situasional') NOT NULL DEFAULT 'Vocabulary',
  `category_label` varchar(100) DEFAULT '🔤 Vocabulary',
  `difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `passage` text DEFAULT NULL,
  `question` text NOT NULL,
  `word_jp` varchar(255) DEFAULT NULL,
  `furigana` varchar(255) DEFAULT NULL,
  `translation` text DEFAULT NULL,
  `options` longtext NOT NULL, -- JSON string of [{key: 'A', text: '...'}, ...]
  `correct_key` varchar(5) NOT NULL,
  `explanation` text DEFAULT NULL,
  `material_reference` text DEFAULT NULL,
  `validation_status` enum('valid','needs_review','rejected') NOT NULL DEFAULT 'valid',
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qq_quiz` (`quiz_id`),
  KEY `idx_qq_mat` (`material_id`),
  KEY `idx_qq_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$conn->query($sql3) or die("Error sql3: " . $conn->error);
echo "✅ Table lms_quiz_questions ready." . PHP_EOL;

// 4. Table lms_quiz_attempts
$sql4 = "CREATE TABLE IF NOT EXISTS `lms_quiz_attempts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quiz_id` int(10) unsigned NOT NULL,
  `student_id` int(11) NOT NULL,
  `student_name` varchar(150) DEFAULT NULL,
  `total_score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `score_vocab` decimal(5,2) DEFAULT NULL,
  `score_grammar` decimal(5,2) DEFAULT NULL,
  `score_kanji` decimal(5,2) DEFAULT NULL,
  `score_reading` decimal(5,2) DEFAULT NULL,
  `score_listening` decimal(5,2) DEFAULT NULL,
  `score_situational` decimal(5,2) DEFAULT NULL,
  `time_spent_seconds` int(11) NOT NULL DEFAULT 0,
  `status` enum('in_progress','submitted','graded') NOT NULL DEFAULT 'graded',
  `feedback` text DEFAULT NULL,
  `weakness_detected` text DEFAULT NULL,
  `remedial_quiz_id` int(10) unsigned DEFAULT NULL,
  `kaiwa_recommendation` varchar(255) DEFAULT NULL,
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_qa_quiz` (`quiz_id`),
  KEY `idx_qa_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$conn->query($sql4) or die("Error sql4: " . $conn->error);
echo "✅ Table lms_quiz_attempts ready." . PHP_EOL;

// 5. Table lms_quiz_answers
$sql5 = "CREATE TABLE IF NOT EXISTS `lms_quiz_answers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `attempt_id` int(10) unsigned NOT NULL,
  `question_id` int(10) unsigned NOT NULL,
  `selected_key` varchar(5) DEFAULT NULL,
  `correct_key` varchar(5) NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `response_time_seconds` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qans_attempt` (`attempt_id`),
  KEY `idx_qans_q` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$conn->query($sql5) or die("Error sql5: " . $conn->error);
echo "✅ Table lms_quiz_answers ready." . PHP_EOL;

// 6. Table lms_quiz_generation_jobs
$sql6 = "CREATE TABLE IF NOT EXISTS `lms_quiz_generation_jobs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `material_id` int(10) unsigned DEFAULT NULL,
  `class_id` int(10) unsigned DEFAULT NULL,
  `sensei_id` int(10) unsigned DEFAULT NULL,
  `config_json` longtext NOT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `progress_step` varchar(100) DEFAULT 'Waiting...',
  `progress_percent` int(11) DEFAULT 0,
  `result_quiz_id` int(10) unsigned DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$conn->query($sql6) or die("Error sql6: " . $conn->error);
echo "✅ Table lms_quiz_generation_jobs ready." . PHP_EOL;

echo "🎉 ALL 6 QUIZ GENERATOR TABLES CREATED SUCCESSFULLY!" . PHP_EOL;
