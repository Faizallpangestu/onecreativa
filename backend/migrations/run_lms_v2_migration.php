<?php
// Runner for LMS Re-architecture v2
require_once __DIR__ . '/../config/database.php';

echo "=== Running LMS Creativa Re-Architecture v2 Migration ===\n";

$sql = file_get_contents(__DIR__ . '/20261120_lms_rearchitecture_v2.sql');

if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    echo "[OK] All 14 LMS Core Tables created/verified.\n";
} else {
    echo "[ERR] Error creating tables: " . $conn->error . "\n";
}

// Check if classes table needs additional foreign keys / columns
$res = $conn->query("SHOW COLUMNS FROM lms_classes LIKE 'program_id'");
if ($res && $res->num_rows === 0) {
    $conn->query("ALTER TABLE lms_classes ADD COLUMN program_id INT UNSIGNED NULL AFTER name");
    $conn->query("ALTER TABLE lms_classes ADD COLUMN batch_id INT UNSIGNED NULL AFTER program_id");
    $conn->query("ALTER TABLE lms_classes ADD COLUMN course_id INT UNSIGNED NULL AFTER batch_id");
    echo "[OK] Added program_id, batch_id, course_id columns to lms_classes.\n";
}

// ================= SEEDING DATA =================
// 1. Program
$conn->query("INSERT IGNORE INTO lms_programs (id, code, name, target_level, description) VALUES
(1, 'INTENSIF_REGULER', 'Program Bahasa Jepang Intensif Reguler', 'N5-N4', 'Pelatihan intensif bahasa Jepang dasar untuk persiapan kerja di Jepang (SSW & Tokutei Ginou).'),
(2, 'KAIGO_SPECIALIST', 'Program Bahasa Jepang Khusus Careworker (Kaigo)', 'N4-N3', 'Pelatihan khusus istilah medis, etika lansia, dan percakapan panti werdha di Jepang.'),
(3, 'MANUFACTURING', 'Program Bahasa Jepang Manufaktur & Pabrik', 'N5-N4', 'Pelatihan bahasa kerja dan K3 industri untuk calon pekerja pabrik dan konstruksi.')");
echo "[OK] Seeded Programs.\n";

// 2. Batches
$conn->query("INSERT IGNORE INTO lms_batches (id, program_id, batch_code, batch_name, start_date, end_date, status) VALUES
(1, 1, 'BATCH-2026-A', 'Angkatan 2026-A (Spring)', '2026-01-10', '2026-06-30', 'active'),
(2, 1, 'BATCH-2026-B', 'Angkatan 2026-B (Autumn)', '2026-07-01', '2026-12-31', 'planning')");
echo "[OK] Seeded Batches.\n";

// 3. Courses
$conn->query("INSERT IGNORE INTO lms_courses (id, program_id, course_code, title, jf_standard_level, jlpt_level, description, total_hours) VALUES
(1, 1, 'JPN-N5-A1', 'Bahasa Jepang Dasar (JF Standard A1 / JLPT N5)', 'A1', 'N5', 'Fondasi tata bahasa dasar, huruf Hiragana, Katakana, 100 Kanji, sapaan, dan percakapan harian.', 120),
(2, 1, 'JPN-N4-A2', 'Bahasa Jepang Lanjutan (JF Standard A2 / JLPT N4)', 'A2', 'N4', 'Tata bahasa menengah, 300 Kanji, komunikasi situasional di tempat kerja dan lingkungan umum.', 140),
(3, 2, 'KAIGO-A2-B1', 'Bahasa Jepang Kaigo & Keperawatan (JF A2/B1)', 'A2', 'N4', 'Kosakata medis, instruksi perawatan fisik, dan komunikasi empati dengan lansia.', 100)");
echo "[OK] Seeded Courses.\n";

// 4. Modules (Bab)
$conn->query("INSERT IGNORE INTO lms_modules (id, course_id, sort_order, module_code, title, description) VALUES
(1, 1, 1, 'BAB-01', 'Bab 1: Perkenalan Diri (Jikoshoukai)', 'Kosakata dasar, pola kalimat ~wa ~desu, kewarganegaraan, dan salam pertemuan.'),
(2, 1, 2, 'BAB-02', 'Bab 2: Benda & Kepemilikan (Kore, Sore, Are)', 'Menunjuk benda, kepemilikan benda, dan kosakata barang-barang sehari-hari.'),
(3, 1, 3, 'BAB-03', 'Bab 3: Tempat & Lokasi (Koko, Soko, Asoko)', 'Menanyakan dan menunjukkan ruangan kantor, fasilitas umum, dan harga barang.'),
(4, 1, 4, 'BAB-04', 'Bab 4: Waktu & Aktivitas Harian (Jikan to Seikatsu)', 'Jam, menit, hari, jam kerja kantor LPK, dan kata kerja bentuk masu.'),
(5, 1, 5, 'BAB-05', 'Bab 5: Perpindahan & Transportasi (Ikimasu, Kimasu)', 'Menyatakan pergi, datang, pulang menggunakan kendaraan dan tujuan.')");
echo "[OK] Seeded Modules.\n";

// 5. Lessons with JF Can-Do Statements
$conn->query("INSERT IGNORE INTO lms_lessons (id, module_id, sort_order, lesson_code, title, can_do_statement, grammar_points, vocabulary_target) VALUES
(1, 1, 1, 'LES-1.1', 'Salam & Aisatsu Sehari-hari', 'Mampu mengucapkan dan merespons salam harian dengan tepat waktu (pagi, siang, malam).', 'Ohayou gozaimasu, Konnichiwa, Konbanwa, Sayounara', 'Aisatsu, Ojigi, Sensei, Tomodachi'),
(2, 1, 2, 'LES-1.2', 'Perkenalan Diri Sederhana (Jikoshoukai)', 'Mampu memperkenalkan diri dengan menyebutkan nama, asal negara, dan status dalam bahasa Jepang.', 'Watashi wa [Nama] desu. [Negara] kara kimashita. Douzo yoroshiku.', 'Watashi, Anata, Gakusei, Indonesia-jin'),
(3, 2, 1, 'LES-2.1', 'Menunjuk Barang di Meja Belajar', 'Mampu menanyakan nama benda di sekitar dan kepemilikannya.', 'Kore / Sore / Are wa [Benda] desu. Dare no [Benda] desu ka?', 'Hon, Jisho, Nooto, Enpitsu, Keitai denwa'),
(4, 3, 1, 'LES-3.1', 'Lokasi & Arah di Gedung Kantor', 'Mampu menanyakan lokasi ruangan kantor dan fasilitas umum.', 'Koko wa [Tempat] desu. [Tempat] wa doko desu ka?', 'Uketsuke, Jimusho, Kaigishitsu, Toire, Shokudou')");
echo "[OK] Seeded Lessons with Can-Do Statements.\n";

// 6. Activities for Lesson 1.2
$conn->query("INSERT IGNORE INTO lms_activities (id, lesson_id, sort_order, activity_type, title, description, content_body, is_mandatory) VALUES
(1, 2, 1, 'materi', 'Materi Bacaan: Pola Kalimat Jikoshoukai', 'Penjelasan tata bahasa ~wa ~desu dan etika membungkuk (ojigi).', 'Tata bahasa dasar perkenalan diri dalam bahasa Jepang...', 1),
(2, 2, 2, 'listening', 'Choukai: Rekaman Audio Perkenalan Sensei Hiroshi', 'Dengarkan percakapan perkenalan diri dan tangkap informasinya.', 'https://assets.onecreativa.com/audio/choukai-bab1.mp3', 1),
(3, 2, 3, 'reading', 'Dokkai: Membaca Kartu Nama (Meishi)', 'Latihan membaca meishi dalam aksara Hiragana dan Katakana.', 'Bacalah kartu nama berikut dan jawab pertanyaannya.', 1),
(4, 2, 4, 'writing', 'Sakubun: Menulis Naskah Jikoshoukai', 'Tuliskan naskah perkenalan dirimu menggunakan huruf Hiragana.', 'Tulis minimal 4 baris perkenalan diri.', 1),
(5, 2, 5, 'speaking', 'Hanashikata: Latihan Pelafalan & Intonasi', 'Rekam suaramu saat memperkenalkan diri di depan kelas.', 'Upload rekaman audio perkenalan dirimu.', 1),
(6, 2, 6, 'kotoba', 'Bank Kosakata: Bab 1 Minna no Nihongo', 'Daftar kosakata penting beserta Kanji dan artinya.', 'Kosakata: Watashi, Jin, Sensei, Gakusei, Kaishain...', 1),
(7, 2, 7, 'kaiwa_ai', 'Latihan Percakapan Real-Time dengan AI Sensei', 'Latihan percakapan langsung dengan AI untuk simulasi perkenalan diri.', 'scenario:jikoshoukai', 1),
(8, 2, 8, 'quiz', 'Kuis Pemahaman Bab 1', 'Kuis 10 soal pilihan ganda menguji tata bahasa dan kosakata.', '10 Soal Pilihan Ganda', 1),
(9, 2, 9, 'tugas', 'Tugas Rumah: Naskah Perkenalan Lengkap', 'Tugas tertulis untuk dinilai oleh Sensei.', 'Kumpulkan file naskah tulisan tangan.', 1)");
echo "[OK] Seeded Activities (Materi, Listening, Reading, Writing, Speaking, Kotoba, Kaiwa AI, Quiz, Tugas).\n";

// 7. Kaiwa AI Scenarios (8 Situasi Nyata Bahasa Jepang)
$scenarios = [
    [
        'scenario_key' => 'jikoshoukai',
        'title' => 'Perkenalan Diri (Jikoshoukai)',
        'japanese_title' => '自己紹介 – First Meeting',
        'level' => 'N5 / A1',
        'category' => 'Dasar',
        'system_prompt' => 'Kamu adalah Sensei ramah dari LPK Creativa di Jepang. Bicaralah dalam bahasa Jepang N5 (A1) sederhana. Berikan sapaan ramah dan tanyakan nama, asal negara, dan cita-cita siswa. Gunakan furigana/romaji jika diperlukan untuk pemula.',
        'initial_greeting' => '初めまして！LPK Creativaへようこそ。お名前は何ですか？ (Hajimemashite! LPK Creativa e youkoso. Onamae wa nan desu ka?)',
        'target_can_do' => 'Mampu memperkenalkan diri dengan menyebutkan nama, asal negara, hobi, dan motivasi belajar bahasa Jepang.'
    ],
    [
        'scenario_key' => 'restaurant',
        'title' => 'Memesan Makanan di Restoran',
        'japanese_title' => 'レストランでの注文 – Ordering Food',
        'level' => 'N5 / A1',
        'category' => 'Kehidupan Sehari-hari',
        'system_prompt' => 'Kamu adalah pelayan restoran ramen di Tokyo (Ten-in). Sambut pelanggan dengan ramah (Irasshaimase), tanyakan pesanannya, berikan rekomendasi menu, dan konfirmasi jumlah pesanan.',
        'initial_greeting' => 'いらっしゃいませ！何名様ですか？ご注文はお決まりですか？ (Irasshaimase! Nan-mei sama desu ka? Gochuumon wa okimari desu ka?)',
        'target_can_do' => 'Mampu memesan makanan dan minuman, menanyakan menu rekomendasi, dan meminta struk pembayaran.'
    ],
    [
        'scenario_key' => 'shopping',
        'title' => 'Berbelanja di Konbini / Supermarket',
        'japanese_title' => 'コンビニでの買い物 – Shopping at Konbini',
        'level' => 'N5 / A1',
        'category' => 'Kehidupan Sehari-hari',
        'system_prompt' => 'Kamu adalah kasir konbini (7-Eleven/Lawson) di Jepang. Tanyakan apakah butuh plastik (Fukuro), mau dihangatkan (Atatame), dan sebutkan total uang belanjaan.',
        'initial_greeting' => 'いらっしゃいませ。レジ袋はご利用になりますか？お弁当は温めますか？ (Irasshaimase. Rejibukuro wa go-riyou ni narimasu ka? Obentou wa atatamemasu ka?)',
        'target_can_do' => 'Mampu berkomunikasi dengan kasir swalayan dalam transaksi belanja sehari-hari.'
    ],
    [
        'scenario_key' => 'workplace',
        'title' => 'Komunikasi & Aisatsu di Tempat Kerja',
        'japanese_title' => '職場での挨拶と報告 – Workplace Communication',
        'level' => 'N4 / A2',
        'category' => 'Dunia Kerja',
        'system_prompt' => 'Kamu adalah supervisor (Shunin/Buchou) di perusahaan Jepang. Lakukan morning briefing (Chourei), minta laporan pekerjaan harian (Hou-Ren-So), dan berikan arahan keselamatan.',
        'initial_greeting' => 'おはようございます！今日の作業予定はどうなっていますか？安全第一でいきましょう。 (Ohayou gozaimasu! Kyou no sagyou yotei wa dou natte imasu ka?)',
        'target_can_do' => 'Mampu melakukan salam kerja (Otsukaresama desu) dan memberikan laporan singkat (Hou-Ren-So) kepada atasan.'
    ],
    [
        'scenario_key' => 'kaigo',
        'title' => 'Perawatan Lansia & Empati (Kaigo)',
        'japanese_title' => '介護の現場会話 – Elderly Care Conversation',
        'level' => 'N4-N3 / A2-B1',
        'category' => 'Spesialis Kaigo',
        'system_prompt' => 'Kamu adalah seorang kakek/nenek lansia (Tanaka-san, 78 tahun) di panti jompo (Roujin Houmu) Jepang. Kamu butuh bantuan untuk minum obat dan jalan santai. Siswa adalah staf perawat (Kaigoshi) yang membantumu.',
        'initial_greeting' => 'おはよう、介護士さん。今日は少し足が痛いんじゃが、散歩を手伝ってくれるかい？ (Ohayou, kaigoshi-san. Kyou wa sukoshi ashi ga itai n ja ga, sanpo o tetsudatte kureru kai?)',
        'target_can_do' => 'Mampu berkomunikasi dengan bahasa sopan dan penuh empati kepada lansia dalam situasi perawatan fisik.'
    ],
    [
        'scenario_key' => 'factory',
        'title' => 'Kerja di Pabrik & Instruksi K3 (Koujou)',
        'japanese_title' => '工場での作業と安全指示 – Factory & Safety Operations',
        'level' => 'N5-N4 / A1-A2',
        'category' => 'Spesialis Manufaktur',
        'system_prompt' => 'Kamu adalah kepala regu (Hanchou) di pabrik otomotif Jepang. Jelaskan instruksi keselamatan kerja (5S / Yubi-sashi Koshou), tanyakan kesiapan APD (helm, sarung tangan), dan beri perintah mesin.',
        'initial_greeting' => 'よし、作業前に指差し呼称をするぞ！ヘルメットと保護メガネは着用したか？ (Yoshi, sagyou mae ni yubisashi koshou o suru zo! Herumetto to hogo megane wa chakuyou shita ka?)',
        'target_can_do' => 'Mampu memahami perintah keselamatan kerja dan merespons instruksi teknis di lantai pabrik.'
    ],
    [
        'scenario_key' => 'interview',
        'title' => 'Simulasi Wawancara Kerja (Mensetsu)',
        'japanese_title' => '面接練習 – Job Interview Simulation',
        'level' => 'N4-N3 / A2-B1',
        'category' => 'Wawancara Kerja',
        'system_prompt' => 'Kamu adalah pewawancara kerja (Mensetsukan) di perusahaan Jepang yang sedang merekrut tenaga kerja Tokutei Ginou dari Indonesia. Ajukan pertanyaan seputar pengalaman, alasan ingin bekerja di Jepang, kelebihan dan kekurangan diri, serta motivasi.',
        'initial_greeting' => 'それでは、面接を始めます。まず、自己紹介と志望動機をお願いします。 (Soredewa, mensetsu o hajimemasu. Mazu, jikoshoukai to shibou douki o onegai shimasu.)',
        'target_can_do' => 'Mampu menjawab pertanyaan wawancara kerja Jepang dengan etika sopan (Keigo/Teineigo) dan percaya diri.'
    ],
    [
        'scenario_key' => 'daily',
        'title' => 'Obrolan Santai dengan Teman Jepang',
        'japanese_title' => '日常会話 – Casual Chat with Japanese Friend',
        'level' => 'N5-N4 / A1-A2',
        'category' => 'Komunikasi Sehari-hari',
        'system_prompt' => 'Kamu adalah teman sekelas Jepang seusia (Ken-kun). Bicaralah dengan gaya ramah dan semi-santai (Tameguchi/Teineigo). Bicarakan hobi, anime, makanan favorit, dan rencana akhir pekan.',
        'initial_greeting' => 'やあ！今週末は何をする予定？どこか遊びに行かない？ (Yaa! Konshuukatsu wa nani o suru yotei? Dokoka asobi ni ikanai?)',
        'target_can_do' => 'Mampu menjalin obrolan santai mengenai hobi, cuaca, makanan, dan kegiatan liburan.'
    ]
];

$stmt = $conn->prepare("INSERT INTO lms_kaiwa_scenarios (scenario_key, title, japanese_title, level, category, system_prompt, initial_greeting, target_can_do) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), japanese_title=VALUES(japanese_title), level=VALUES(level), category=VALUES(category), system_prompt=VALUES(system_prompt), initial_greeting=VALUES(initial_greeting), target_can_do=VALUES(target_can_do)");

foreach ($scenarios as $sc) {
    $stmt->bind_param('ssssssss', $sc['scenario_key'], $sc['title'], $sc['japanese_title'], $sc['level'], $sc['category'], $sc['system_prompt'], $sc['initial_greeting'], $sc['target_can_do']);
    $stmt->execute();
}
echo "[OK] Seeded 8 Standard Kaiwa AI Scenarios.\n";

// 8. Competencies (JF Standard Can-do)
$competencies = [
    ['CD-A1-001', 'A1', 'N5', 'Mampu memperkenalkan diri secara singkat dengan menyebutkan nama, asal negara, dan pekerjaan.', 'Interpersonal'],
    ['CD-A1-002', 'A1', 'N5', 'Mampu menanyakan harga barang dan memesan makanan di kasir/restoran.', 'Interpersonal'],
    ['CD-A1-003', 'A1', 'N5', 'Mampu membaca kata-kata sederhana yang ditulis dalam Hiragana dan Katakana.', 'Interpretive Reading'],
    ['CD-A1-004', 'A1', 'N5', 'Mampu memahami pengumuman sederhana di stasiun kereta atau swalayan.', 'Interpretive Listening'],
    ['CD-A2-001', 'A2', 'N4', 'Mampu melakukan percakapan santai dengan teman mengenai liburan dan hobi.', 'Interpersonal'],
    ['CD-A2-002', 'A2', 'N4', 'Mampu memahami instruksi kerja dan keselamatan dasar di tempat kerja atau pabrik.', 'Workplace Communication'],
    ['CD-A2-003', 'A2', 'N4', 'Mampu menjawab pertanyaan mendasar dalam wawancara kerja (Mensetsu).', 'Presentational Speaking']
];

$stmtComp = $conn->prepare("INSERT INTO lms_competencies (code, jf_level, jlpt_level, can_do_text, category) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE can_do_text=VALUES(can_do_text), category=VALUES(category)");
foreach ($competencies as $cp) {
    $stmtComp->bind_param('sssss', $cp[0], $cp[1], $cp[2], $cp[3], $cp[4]);
    $stmtComp->execute();
}
echo "[OK] Seeded JF Standard Can-do Competencies.\n";

// 9. Gradebook items for Course 1
$conn->query("INSERT IGNORE INTO lms_gradebook_items (id, course_id, item_name, item_type, max_score, weight_percent) VALUES
(1, 1, 'Tugas Harian & Sakubun', 'tugas', 100.00, 20.00),
(2, 1, 'Kuis Mingguan Bab 1-5', 'quiz', 100.00, 20.00),
(3, 1, 'Evaluasi Percakapan Kaiwa AI', 'kaiwa', 100.00, 25.00),
(4, 1, 'Presensi & Kehadiran Kelas', 'kehadiran', 100.00, 10.00),
(5, 1, 'Ujian Kompetensi Akhir (UKOM N5)', 'ukom', 100.00, 25.00)");
echo "[OK] Seeded Gradebook Items.\n";

echo "=== LMS Re-Architecture v2 Migration COMPLETED SUCCESSFULLY! ===\n";
