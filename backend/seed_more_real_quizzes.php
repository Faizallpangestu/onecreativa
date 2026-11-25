<?php
require_once __DIR__ . '/config/database.php';

echo "=== SEEDING REAL LMS QUIZZES & QUESTIONS (NO DUMMY) ===" . PHP_EOL;

// 1. Get class IDs
$c19 = 19; // N5 Pagi
$c20 = 20; // N4 A - PAGI

// Ensure classes exist
$conn->query("INSERT IGNORE INTO lms_classes (id, name, level, status) VALUES (19, 'N5 Pagi', 'N5', 'active'), (20, 'N4 A - PAGI', 'N4', 'active')");

// Material 2: Minna no Nihongo Bab 01
$checkMat2 = $conn->query("SELECT id FROM lms_materials WHERE id = 2");
if (!$checkMat2 || $checkMat2->num_rows === 0) {
    $conn->query("INSERT INTO lms_materials (id, class_id, sensei_id, meeting_id, title, chapter_bab, level, file_name, file_size, page_count, created_at)
    VALUES (2, 19, 1, 1, 'Minna no Nihongo Bab 01 (Perkenalan & Kata Benda)', 'Bab 01', 'N5', 'Minna_no_Nihongo_Bab01.pdf', '3.1 MB', 18, NOW())");
}

// Material 3: Minna no Nihongo Bab 26 (N4)
$checkMat3 = $conn->query("SELECT id FROM lms_materials WHERE id = 3");
if (!$checkMat3 || $checkMat3->num_rows === 0) {
    $conn->query("INSERT INTO lms_materials (id, class_id, sensei_id, meeting_id, title, chapter_bab, level, file_name, file_size, page_count, created_at)
    VALUES (3, 20, 1, 1, 'Minna no Nihongo Bab 26 (Pola ~んです & Penjelasan Situasi)', 'Bab 26', 'N4', 'Minna_no_Nihongo_Bab26.pdf', '2.8 MB', 22, NOW())");
}

// Quiz 2: Quiz N5 – Kata Kerja & Kosakata Dasar (N5 Pagi)
$checkQ2 = $conn->query("SELECT id FROM lms_quizzes WHERE id = 2");
if (!$checkQ2 || $checkQ2->num_rows === 0) {
    $conn->query("INSERT INTO lms_quizzes (id, class_id, class_name, material_id, meeting_id, title, bab, level, curriculum_source, quiz_type, total_questions, duration_minutes, status, scheduled_date, created_by, published_at, created_at)
    VALUES (2, 19, 'N5 Pagi', 2, 1, 'Quiz N5 – Kata Kerja & Kosakata Dasar (Takoboto)', 'Bab 01', 'N5', 'Japan Foundation / Minna no Nihongo', 'general', 10, 20, 'published', '2026-11-23', 1, NOW(), NOW())");

    // Add 10 real questions for Quiz 2
    $q2Questions = [
        ['Vocabulary', '🔤 Vocabulary', 'easy', '「たべます」のかんじは どれですか。', '食べます', 'たべます', 'Pilihlah kanji untuk tabemasu (makan).', 
         json_encode([['key'=>'A','text'=>'食べます (Tabemasu)'],['key'=>'B','text'=>'飲みます (Nomimasu)'],['key'=>'C','text'=>'行きます (Ikimasu)'],['key'=>'D','text'=>'見ます (Mimasu)']]), 'A', 'Kanji 「食」 berarti makan.', 'Bab 01: Vocabulary'],
        ['Vocabulary', '🔤 Vocabulary', 'easy', '「本」の読み方は どれですか。', '本', 'ほん', 'Cara baca kanji buku?',
         json_encode([['key'=>'A','text'=>'ほん (Hon)'],['key'=>'B','text'=>'ペン (Pen)'],['key'=>'C','text'=>'かさ (Kasa)'],['key'=>'D','text'=>'とけい (Tokei)']]), 'A', 'Kanji 本 dibaca ほん (hon).', 'Bab 01: Kanji Dasar'],
        ['Grammar', '✏️ Grammar', 'medium', 'わたしは ファイザル（　）。', 'です', 'です', 'Lengkapilah kalimat perkenalan diri.',
         json_encode([['key'=>'A','text'=>'です (Desu)'],['key'=>'B','text'=>'でした (Deshita)'],['key'=>'C','text'=>'ます (Masu)'],['key'=>'D','text'=>'ました (Mashita)']]), 'A', 'Pola kalimat deklaratif identitas: [KB] + です.', 'Bab 01: Grammar'],
        ['Grammar', '✏️ Grammar', 'medium', 'あの 方は どなた（　）か。', 'です', 'です', 'Bentuk tanya sopan untuk menanyakan orang.',
         json_encode([['key'=>'A','text'=>'です (Desu)'],['key'=>'B','text'=>'だ (Da)'],['key'=>'C','text'=>'ます (Masu)'],['key'=>'D','text'=>'では (Dewa)']]), 'A', 'Bentuk sopan formal: どなたですか。', 'Bab 01: Grammar'],
        ['Kanji', '⛩️ Kanji', 'easy', '「私」の訓読みは 何ですか。', '私', 'わたし', 'Kunyomi dari kanji 私?',
         json_encode([['key'=>'A','text'=>'わたし (Watashi)'],['key'=>'B','text'=>'あなた (Anata)'],['key'=>'C','text'=>'かれ (Kare)'],['key'=>'D','text'=>'ひと (Hito)']]), 'A', 'Kanji 「私」 dibaca わたし (watashi).', 'Bab 01: Kanji Dasar'],
        ['Reading', '📖 Reading', 'medium', '【自己紹介】\nはじめまして。わたしは ファイザルです。インドネシアから 来ました。どうぞ よろしく お願いします。\n\n質問：ファイザルさんは どこから 来ましたか。', 'インドネシア', 'インドネシア', 'Berdasarkan teks, dari mana Faizal berasal?',
         json_encode([['key'=>'A','text'=>'インドネシア (Indonesia)'],['key'=>'B','text'=>'日本 (Jepang)'],['key'=>'C','text'=>'マレーシア (Malaysia)'],['key'=>'D','text'=>'韓国 (Korea)']]), 'A', 'Teks menyebutkan: インドネシアから 来ました。', 'Bab 01: Dokkai'],
        ['Situasional', '🤝 Situasional & Komunikasi', 'medium', '初めて 会った 人に 最初に 言う 挨拶は どれですか。', 'はじめまして', 'はじめまして', 'Ungkapan pertama kali bertemu seseorang dalam etika bisnis Jepang?',
         json_encode([['key'=>'A','text'=>'はじめまして (Hajimemashite)'],['key'=>'B','text'=>'さようなら (Sayounara)'],['key'=>'C','text'=>'おやすみなさい (Oyasuminasai)'],['key'=>'D','text'=>'いただきます (Itadakimasu)']]), 'A', 'Salam pembuka pertemuan pertama adalah はじめまして。', 'Bab 01: Etika & Situasional'],
        ['Situasional', '🤝 Situasional & Komunikasi', 'easy', '自己紹介の 最後に 言う 礼儀正しい 言葉は どれですか。', 'どうぞよろしくお願いします', 'どうぞよろしくおねがいします', 'Kalimat penutup perkenalan diri yang sopan?',
         json_encode([['key'=>'A','text'=>'どうぞ よろしく お願いします'],['key'=>'B','text'=>'お疲れ様でした'],['key'=>'C','text'=>'失礼しました'],['key'=>'D','text'=>'ごちそうさまでした']]), 'A', 'Penutup perkenalan diri adalah どうぞ よろしく お願いします。', 'Bab 01: Etika & Situasional'],
        ['Vocabulary', '🔤 Vocabulary', 'medium', '「せんせい」のかんじ表記は どれですか。', '先生', 'せんせい', 'Pilihlah kanji untuk guru (sensei).',
         json_encode([['key'=>'A','text'=>'先生 (Sensei)'],['key'=>'B','text'=>'学生 (Gakusei)'],['key'=>'C','text'=>'会社員 (Kaishain)'],['key'=>'D','text'=>'医者 (Isha)']]), 'A', 'Kanji 先生 berarti guru/pengajar.', 'Bab 01: Vocabulary'],
        ['Grammar', '✏️ Grammar', 'medium', 'サントスさんは 会社員です。田中さん（　）会社員です。', 'も', 'も', 'Partikel yang bermakna \"juga\"?',
         json_encode([['key'=>'A','text'=>'も (Mo - Juga)'],['key'=>'B','text'=>'は (Wa)'],['key'=>'C','text'=>'の (No)'],['key'=>'D','text'=>'か (Ka)']]), 'A', 'Partikel も menyatakan kesamaan predikat (juga).', 'Bab 01: Grammar']
    ];

    foreach ($q2Questions as $idx => $qData) {
        $sort = $idx + 1;
        $stmt = $conn->prepare("INSERT INTO lms_quiz_questions (quiz_id, material_id, category, category_label, difficulty, question, word_jp, furigana, translation, options, correct_key, explanation, material_reference, validation_status, sort_order) VALUES (2, 2, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)");
        $stmt->bind_param("sssssssssssi", $qData[0], $qData[1], $qData[2], $qData[3], $qData[4], $qData[5], $qData[6], $qData[7], $qData[8], $qData[9], $qData[10], $sort);
        $stmt->execute();
    }
}

// Quiz 3: Daily Quiz N4 – Minna no Nihongo Bab 26 (N4 A - PAGI)
$checkQ3 = $conn->query("SELECT id FROM lms_quizzes WHERE id = 3");
if (!$checkQ3 || $checkQ3->num_rows === 0) {
    $conn->query("INSERT INTO lms_quizzes (id, class_id, class_name, material_id, meeting_id, title, bab, level, curriculum_source, quiz_type, total_questions, duration_minutes, status, scheduled_date, created_by, published_at, created_at)
    VALUES (3, 20, 'N4 A - PAGI', 3, 1, 'Daily Quiz N4 – Pola Kalimat ~んです (N4 A - PAGI)', 'Bab 26', 'N4', 'Japan Foundation / Minna no Nihongo', 'daily', 10, 20, 'published', '2026-11-23', 1, NOW(), NOW())");

    $q3Questions = [
        ['Grammar', '✏️ Grammar', 'medium', 'どうして 遅れた（　）ですか。バスが 来なかったんです。', 'ん', 'ん', 'Pola kalimat penjelasan alasan ~んです.',
         json_encode([['key'=>'A','text'=>'ん (N)'],['key'=>'B','text'=>'の (No)'],['key'=>'C','text'=>'か (Ka)'],['key'=>'D','text'=>'よ (Yo)']]), 'A', 'Kata kerja bentuk biasa + んですか.', 'Bab 26: Grammar'],
        ['Vocabulary', '🔤 Vocabulary', 'medium', '「都合」の読み方は どれですか。', '都合', 'つごう', 'Cara baca kanji kondisi / situasi?',
         json_encode([['key'=>'A','text'=>'つごう (Tsugou)'],['key'=>'B','text'=>'きぶん (Kibun)'],['key'=>'C','text'=>'ようじ (Youji)'],['key'=>'D','text'=>'へんじ (Henji)']]), 'A', '都合 dibaca つごう.', 'Bab 26: Vocabulary'],
        ['Situasional', '🤝 Situasional & Komunikasi', 'medium', '頭が 痛いので 早く 帰りたい時、上司への 適切な 申し出は？', '頭が痛いんですが、早く帰ってもいいですか', 'あたまがいたいんですが、はやくかえってもいいですか', 'Menjelaskan situasi dan memohon izin pulang lebih awal kepada atasan?',
         json_encode([['key'=>'A','text'=>'頭が 痛いんですが、早く 帰っても いいですか。'],['key'=>'B','text'=>'頭が 痛いから 帰ります。'],['key'=>'C','text'=>'早く 帰りたいです。'],['key'=>'D','text'=>'帰らなければなりません。']]), 'A', 'Menggunakan pola ~んですが untuk membuka permohonan secara santun kepada atasan.', 'Bab 26: Percakapan Kerja']
    ];

    foreach ($q3Questions as $idx => $qData) {
        $sort = $idx + 1;
        $stmt = $conn->prepare("INSERT INTO lms_quiz_questions (quiz_id, material_id, category, category_label, difficulty, question, word_jp, furigana, translation, options, correct_key, explanation, material_reference, validation_status, sort_order) VALUES (3, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)");
        $stmt->bind_param("sssssssssssi", $qData[0], $qData[1], $qData[2], $qData[3], $qData[4], $qData[5], $qData[6], $qData[7], $qData[8], $qData[9], $qData[10], $sort);
        $stmt->execute();
    }
}

echo "✅ Real LMS Quizzes & Questions successfully synced into MySQL database!" . PHP_EOL;
