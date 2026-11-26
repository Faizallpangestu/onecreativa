<?php
require_once __DIR__ . '/config/database.php';

// Check if material exists
$check = $conn->query("SELECT id FROM lms_materials WHERE title LIKE '%Bab 05%' LIMIT 1");
if (!$check || $check->num_rows == 0) {
    echo "Seeding initial material Bab 05..." . PHP_EOL;
    $vocab = json_encode([
        ['kanji' => '行きます', 'furigana' => 'いきます', 'meaning' => 'Pergi (To go)', 'pos' => 'Verb'],
        ['kanji' => '来ます', 'furigana' => 'きます', 'meaning' => 'Datang (To come)', 'pos' => 'Verb'],
        ['kanji' => '帰ります', 'furigana' => 'かえります', 'meaning' => 'Pulang (To return home)', 'pos' => 'Verb'],
        ['kanji' => '学校', 'furigana' => 'がっこう', 'meaning' => 'Sekolah (School)', 'pos' => 'Noun'],
        ['kanji' => '駅', 'furigana' => 'えき', 'meaning' => 'Stasiun kereta api (Station)', 'pos' => 'Noun'],
        ['kanji' => '電車', 'furigana' => 'でんしゃ', 'meaning' => 'Kereta listrik (Electric train)', 'pos' => 'Noun'],
        ['kanji' => '会社', 'furigana' => 'かいしゃ', 'meaning' => 'Perusahaan / Tempat kerja', 'pos' => 'Noun']
    ], JSON_UNESCAPED_UNICODE);

    $grammar = json_encode([
        ['pattern' => '【Tempat】+ へ + 行きます / 来ます / 帰ります', 'meaning' => 'Menyatakan arah tujuan pergerakan.', 'example' => 'わたしは 毎朝 会社へ 行きます。'],
        ['pattern' => 'どこ［へ］も 行きません', 'meaning' => 'Penyangkalan total terhadap arah tujuan.', 'example' => '日曜日は どこへも 行きませんでした。'],
        ['pattern' => '【Sarana】+ で + 行きます', 'meaning' => 'Menyatakan sarana transportasi.', 'example' => '電車で 会社へ 行きます。']
    ], JSON_UNESCAPED_UNICODE);

    $kanji = json_encode([
        ['kanji' => '行', 'onyomi' => 'コウ', 'kunyomi' => 'い・く', 'meaning' => 'Pergi', 'words' => ['行く', '旅行']],
        ['kanji' => '来', 'onyomi' => 'ライ', 'kunyomi' => 'く・る', 'meaning' => 'Datang', 'words' => ['来る', '来週']],
        ['kanji' => '駅', 'onyomi' => 'エキ', 'kunyomi' => '-', 'meaning' => 'Stasiun', 'words' => ['駅', '駅員']]
    ], JSON_UNESCAPED_UNICODE);

    $reading = "【週末の予定：ファイザルさんの日記】\nわたしは 来週の 月曜日に 東京へ 行きます。新幹線で 行きます。東京駅で 田中さんと 会います。一緒に 会社へ 行きます。夕方 6時に 寮へ 帰ります。とても 楽しみに しています。";
    $canDo = "Siswa mampu menyatakan dan menanyakan tujuan arah perjalanan, sarana transportasi, serta rekan bepergian dalam kehidupan kerja di Jepang secara akurat.";

    $stmt = $conn->prepare("INSERT INTO lms_materials (class_id, sensei_id, meeting_id, title, chapter_bab, level, file_name, file_path, file_type, file_size, page_count, extracted_vocab, extracted_grammar, extracted_kanji, extracted_reading, can_do_statement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $cid = 19; $sid = 1; $mid = 12; $title = "Minna no Nihongo Bab 05 (Arah & Transportasi)"; $bab = "Bab 05"; $lvl = "N5"; $fname = "Minna_no_Nihongo_Bab05.pdf"; $fpath = "uploads/materials/Minna_no_Nihongo_Bab05.pdf"; $ftype = "pdf"; $fsize = "2.4 MB"; $pages = 24;
    $stmt->bind_param("iiisssssssisssss", $cid, $sid, $mid, $title, $bab, $lvl, $fname, $fpath, $ftype, $fsize, $pages, $vocab, $grammar, $kanji, $reading, $canDo);
    $stmt->execute();
    $matId = $conn->insert_id;
    echo "Material seeded with ID: $matId" . PHP_EOL;

    // Seed Quiz
    $quizTitle = "Daily Quiz N5 – Minna no Nihongo Bab 05 (N5 Pagi)";
    $sched = date('Y-m-d');
    $qStmt = $conn->prepare("INSERT INTO lms_quizzes (class_id, class_name, material_id, meeting_id, title, bab, level, curriculum_source, quiz_type, total_questions, duration_minutes, status, scheduled_date, created_by, published_at) VALUES (?, 'N5 Pagi', ?, 12, ?, 'Bab 05', 'N5', 'Japan Foundation / Minna no Nihongo', 'daily', 10, 15, 'published', ?, 1, NOW())");
    $qStmt->bind_param("iiss", $cid, $matId, $quizTitle, $sched);
    $qStmt->execute();
    $quizId = $conn->insert_id;
    echo "Quiz seeded with ID: $quizId" . PHP_EOL;

    // Seed Questions
    $questions = [
        ['category' => 'Vocabulary', 'diff' => 'easy', 'q' => '「駅」の意味は何ですか。', 'w' => '駅', 'f' => 'えき', 't' => 'Apakah arti dari kosakata "eki"?', 'opts' => [['key'=>'A','text'=>'Stasiun kereta api (Station)'],['key'=>'B','text'=>'Sekolah'],['key'=>'C','text'=>'Kantor'],['key'=>'D','text'=>'Rumah sakit']], 'ans' => 'A', 'exp' => '「駅」(えき) bermakna stasiun.'],
        ['category' => 'Vocabulary', 'diff' => 'medium', 'q' => '「でんしゃ」のかんじは どれですか。', 'w' => '電車', 'f' => 'でんしゃ', 't' => 'Pilihlah kanji untuk densha.', 'opts' => [['key'=>'A','text'=>'電車 (Densha - Kereta Listrik)'],['key'=>'B','text'=>'自転車'],['key'=>'C','text'=>'自動車'],['key'=>'D','text'=>'新幹線']], 'ans' => 'A', 'exp' => 'Kanji 「電車」 terdiri dari 電 dan 車.'],
        ['category' => 'Grammar', 'diff' => 'medium', 'q' => 'わたしは 毎朝 8時に 会社（　）行きます。', 'w' => 'へ', 'f' => 'へ', 't' => 'Pilihlah partikel arah tujuan pergerakan.', 'opts' => [['key'=>'A','text'=>'へ (he/e - Arah tujuan)'],['key'=>'B','text'=>'を'],['key'=>'C','text'=>'で'],['key'=>'D','text'=>'と']], 'ans' => 'A', 'exp' => 'Tempat + へ + 行きます.'],
        ['category' => 'Grammar', 'diff' => 'medium', 'q' => '電車（　）会社へ 行きます。', 'w' => 'で', 'f' => 'で', 't' => 'Pilihlah partikel penanda sarana transportasi.', 'opts' => [['key'=>'A','text'=>'で (de - Sarana transportasi)'],['key'=>'B','text'=>'に'],['key'=>'C','text'=>'へ'],['key'=>'D','text'=>'から']], 'ans' => 'A', 'exp' => 'Sarana + で + 行きます.'],
        ['category' => 'Grammar', 'diff' => 'hard', 'q' => '日曜日は どこ（　）行きませんでした。', 'w' => 'へも', 'f' => 'へも', 't' => 'Pola penyangkalan total tidak pergi ke mana pun.', 'opts' => [['key'=>'A','text'=>'へも (he mo - Tidak ke mana pun)'],['key'=>'B','text'=>'にも'],['key'=>'C','text'=>'でも'],['key'=>'D','text'=>'を']], 'ans' => 'A', 'exp' => 'どこへも + Negatif.'],
        ['category' => 'Kanji', 'diff' => 'easy', 'q' => '「行きます」の かんじの 正しい 読み方は どれですか。', 'w' => '行きます', 'f' => 'いきます', 't' => 'Cara baca kanji 行きます?', 'opts' => [['key'=>'A','text'=>'いきます (i-kimasu)'],['key'=>'B','text'=>'きます'],['key'=>'C','text'=>'かえります'],['key'=>'D','text'=>'はたらきます']], 'ans' => 'A', 'exp' => 'Kanji 「行」 dibaca い・く.'],
        ['category' => 'Reading', 'diff' => 'medium', 'q' => 'ファイザルさんは 何で 東京へ 行きますか。', 'w' => '新幹線', 'f' => 'しんかんせん', 't' => 'Dengan apa Faizal pergi ke Tokyo sesuai teks bacaan?', 'opts' => [['key'=>'A','text'=>'新幹線 (Shinkansen)'],['key'=>'B','text'=>'飛行機'],['key'=>'C','text'=>'バス'],['key'=>'D','text'=>'徒歩']], 'ans' => 'A', 'exp' => 'Teks bacaan: 新幹線で行きます。'],
        ['category' => 'Situasional', 'diff' => 'medium', 'q' => '田中先輩の「これから どこへ 行きますか」に 対する 適切な 返答は？', 'w' => '会社へ行きます', 'f' => 'かいしゃへいきます', 't' => 'Jawaban sopan saat ditanya arah tujuan oleh senior?', 'opts' => [['key'=>'A','text'=>'会社へ 行きます (Saya hendak ke kantor)'],['key'=>'B','text'=>'きのう 行きました'],['key'=>'C','text'=>'電車です'],['key'=>'D','text'=>'お疲れ様でした']], 'ans' => 'A', 'exp' => 'Dijawab dengan: [Tempat] + へ行きます.'],
        ['category' => 'Situasional', 'diff' => 'hard', 'q' => '同僚の「日曜日は どこかへ 行きましたか」に 対し、どこにも行かなかった 返答は？', 'w' => 'いいえ、どこへも行きませんでした', 'f' => 'いいえ、どこへもいきませんでした', 't' => 'Menyatakan tidak pergi ke mana pun?', 'opts' => [['key'=>'A','text'=>'いいえ、どこへも 行きませんでした'],['key'=>'B','text'=>'はい、行きました'],['key'=>'C','text'=>'行きたくないです'],['key'=>'D','text'=>'学校です']], 'ans' => 'A', 'exp' => 'Pola penolakan santun masa lampau.'],
        ['category' => 'Vocabulary', 'diff' => 'easy', 'q' => '「がっこう」のかんじ表記は どれですか。', 'w' => '学校', 'f' => 'がっこう', 't' => 'Kanji untuk gakkou?', 'opts' => [['key'=>'A','text'=>'学校 (Gakkou)'],['key'=>'B','text'=>'学会'],['key'=>'C','text'=>'学生'],['key'=>'D','text'=>'学者']], 'ans' => 'A', 'exp' => 'Kanji 「学校」.']
    ];

    $qs = $conn->prepare("INSERT INTO lms_quiz_questions (quiz_id, material_id, category, difficulty, passage, question, word_jp, furigana, translation, options, correct_key, explanation, material_reference, validation_status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)");
    $pas = "【ファイザルさんの日記】\nわたしは 来週の 月曜日に 東京へ 行きます。新幹線で 行きます。東京駅で 田中さんと 会います。一緒に 会社へ 行きます。夕方 6時に 寮へ 帰ります。";
    $order = 1;
    foreach ($questions as $q) {
        $optJson = json_encode($q['opts'], JSON_UNESCAPED_UNICODE);
        $mRef = "Bab 05: " . $q['category'];
        $passageText = ($q['category'] === 'Reading' || $q['category'] === 'Situasional') ? $pas : null;
        $qs->bind_param("iisssssssssssi", $quizId, $matId, $q['category'], $q['diff'], $passageText, $q['q'], $q['w'], $q['f'], $q['t'], $optJson, $q['ans'], $q['exp'], $mRef, $order);
        $qs->execute();
        $order++;
    }
    echo "10 Questions seeded successfully!" . PHP_EOL;
} else {
    echo "Material Bab 05 already exists." . PHP_EOL;
}
