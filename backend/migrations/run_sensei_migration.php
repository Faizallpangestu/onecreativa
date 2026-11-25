<?php
require_once __DIR__ . '/../config/database.php';

$conn->query("CREATE TABLE IF NOT EXISTS lms_sensei (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    nip VARCHAR(50) NOT NULL UNIQUE,
    name_romaji VARCHAR(150) NOT NULL,
    name_kanji VARCHAR(100) NULL,
    teacher_type ENUM('local', 'native') NOT NULL DEFAULT 'local',
    jlpt_cert VARCHAR(50) NOT NULL DEFAULT 'N2',
    specialization VARCHAR(255) NOT NULL,
    assigned_classes VARCHAR(255) NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NULL,
    total_teaching_hours INT NOT NULL DEFAULT 120,
    rating DECIMAL(2,1) NOT NULL DEFAULT 4.8,
    status ENUM('active', 'leave', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

// Check if seeded
$check = $conn->query("SELECT COUNT(*) as c FROM lms_sensei")->fetch_assoc()['c'];
if ($check == 0) {
    $conn->query("INSERT INTO lms_sensei (nip, name_romaji, name_kanji, teacher_type, jlpt_cert, specialization, assigned_classes, email, phone, total_teaching_hours, rating, status) VALUES
    ('SN-2026-001', 'Tanaka Kenji, B.A.', '田中 健二', 'native', 'Native', 'Kaiwa Lanjutan & Persiapan Wawancara (Mensetsu)', 'Kelas Sakura A (N5), Kelas Kaigo Khusus', 'sensei.tanaka@creativa.ac.id', '+81 80 1234 5678', 340, 4.9, 'active'),
    ('SN-2026-002', 'Muhammad Faizal, S.Pd.', 'ムハンマド ファイザル', 'local', 'JLPT N1', 'Tata Bahasa (Bunpou Minna I-II) & JLPT Prep', 'Kelas Sakura A (N5), Kelas Fuji B (N4)', 'faizal.sensei@creativa.ac.id', '081234567890', 280, 4.8, 'active'),
    ('SN-2026-003', 'Siti Rahmawati, S.S.', 'ラフマワティ', 'local', 'JLPT N2', 'Bahasa Jepang Kaigo (Careworker) & Budaya Kerja', 'Kelas Kaigo Khusus', 'rahma.sensei@creativa.ac.id', '081298765432', 210, 4.9, 'active'),
    ('SN-2026-004', 'Nakamura Yoko, M.Ed.', '中村 陽子', 'native', 'Native', 'Choukai (Listening) & Praktikum Kaiwa Lapangan', 'Kelas Fuji B (N4)', 'yoko.nakamura@creativa.ac.id', '+81 90 8765 4321', 195, 4.9, 'active')
    ;");
    echo "lms_sensei table created and seeded successfully!\n";
} else {
    echo "lms_sensei already seeded with $check sensei.\n";
}
