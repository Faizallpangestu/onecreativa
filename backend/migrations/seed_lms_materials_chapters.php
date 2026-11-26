<?php
require_once __DIR__ . '/../config/database.php';

$chapters = [
    [
        'chapter' => 'Bab 01',
        'meeting' => 1,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 01 – Perkenalan Diri (Jikoshoukai) & Partikel WA, DESU',
        'file_name' => 'Minna_no_Nihongo_Bab01_Jikoshoukai.pdf',
        'file_size' => '2.1 MB',
        'vocab' => [
            ['kanji' => '私', 'furigana' => 'わたし', 'meaning' => 'Saya / Aku', 'pos' => 'Pronoun'],
            ['kanji' => '学生', 'furigana' => 'がくせい', 'meaning' => 'Siswa / Mahasiswa', 'pos' => 'Noun'],
            ['kanji' => '先生', 'furigana' => 'せんせい', 'meaning' => 'Guru / Pengajar / Sensei', 'pos' => 'Noun'],
            ['kanji' => '会社員', 'furigana' => 'かいしゃいん', 'meaning' => 'Karyawan perusahaan', 'pos' => 'Noun'],
            ['kanji' => 'エンジニア', 'furigana' => 'えんじにあ', 'meaning' => 'Insinyur / Teknisi IT', 'pos' => 'Noun'],
            ['kanji' => '介護士', 'furigana' => 'かいごし', 'meaning' => 'Perawat lansia / Caregiver', 'pos' => 'Noun'],
            ['kanji' => '日本人', 'furigana' => 'にほんじん', 'meaning' => 'Orang Jepang', 'pos' => 'Noun'],
            ['kanji' => 'インドネシア人', 'furigana' => 'いんどねしあじん', 'meaning' => 'Orang Indonesia', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '【Subjek】+ は + 【Predikat】+ です', 'meaning' => 'Menyatakan identitas/status subjek.', 'example' => 'わたしは ファイザルです。(Saya adalah Faizal).'],
            ['pattern' => '【Subjek】+ は + 【Predikat】+ じゃありません / ではありません', 'meaning' => 'Bentuk negatif menyangkal identitas/status.', 'example' => 'サントスさんは 先生じゃありません。(Tuan Santos bukan seorang guru).'],
            ['pattern' => '【Subjek】+ は + 【Predikat】+ ですか', 'meaning' => 'Kalimat tanya konfirmasi.', 'example' => 'ミラさんは アメリカ人ですか。(Apakah Tuan Miller orang Amerika?).']
        ],
        'kanji' => [
            ['kanji' => '一', 'onyomi' => 'イチ (ICHI)', 'kunyomi' => 'ひと・つ', 'meaning' => 'Satu'],
            ['kanji' => '二', 'onyomi' => 'ニ (NI)', 'kunyomi' => 'ふた・つ', 'meaning' => 'Dua'],
            ['kanji' => '人', 'onyomi' => 'ジン、ニン', 'kunyomi' => 'ひと', 'meaning' => 'Orang'],
            ['kanji' => '日', 'onyomi' => 'ニチ、ジツ', 'kunyomi' => 'ひ、か', 'meaning' => 'Matahari / Hari']
        ],
        'reading' => "初めまして。わたしは ファイザルです。インドネシアから 来ました。ITの エンジニアです。日本の 会社で 働きます。どうぞ よろしく お願いします。",
        'can_do' => 'Siswa mampu memperkenalkan diri, menyebutkan asal negara, profesi kerja di Jepang, dan menyapa lawan bicara dengan sopan.'
    ],
    [
        'chapter' => 'Bab 02',
        'meeting' => 2,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 02 – Benda di Sekitar (Kore, Sore, Are) & Kepemilikan NO',
        'file_name' => 'Minna_no_Nihongo_Bab02_Benda_Sekitar.pdf',
        'file_size' => '2.3 MB',
        'vocab' => [
            ['kanji' => '本', 'furigana' => 'ほん', 'meaning' => 'Buku', 'pos' => 'Noun'],
            ['kanji' => '辞書', 'furigana' => 'じしょ', 'meaning' => 'Kamus', 'pos' => 'Noun'],
            ['kanji' => '手帳', 'furigana' => 'てちょう', 'meaning' => 'Buku catatan saku / Agenda', 'pos' => 'Noun'],
            ['kanji' => '時計', 'furigana' => 'とけい', 'meaning' => 'Jam dinding / Arloji tangan', 'pos' => 'Noun'],
            ['kanji' => '傘', 'furigana' => 'かさ', 'meaning' => 'Payung', 'pos' => 'Noun'],
            ['kanji' => '鍵', 'furigana' => 'かぎ', 'meaning' => 'Kunci', 'pos' => 'Noun'],
            ['kanji' => 'パソコン', 'furigana' => 'ぱそこん', 'meaning' => 'Laptop / Komputer pribadi', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => 'これ / それ / あれ + は + 【Benda】+ です', 'meaning' => 'Menunjuk benda berdasarkan posisi pembicara & lawan bicara.', 'example' => 'これは 日本語の 本です。(Ini adalah buku bahasa Jepang).'],
            ['pattern' => 'この / その / あの + 【Benda】+ は + 【Keterangan】+ です', 'meaning' => 'Menunjuk benda secara spesifik melekat pada kata benda.', 'example' => 'この傘は わたしのです。(Payung ini adalah milik saya).'],
            ['pattern' => '【Pemilik】+ の + 【Benda】', 'meaning' => 'Menyatakan kepemilikan atau kategori benda.', 'example' => 'これは 田中さんの 鍵です。(Ini adalah kunci milik Tuan Tanaka).']
        ],
        'kanji' => [
            ['kanji' => '本', 'onyomi' => 'ホン', 'kunyomi' => 'もと', 'meaning' => 'Buku / Asal'],
            ['kanji' => '中', 'onyomi' => 'チュウ', 'kunyomi' => 'なか', 'meaning' => 'Tengah / Dalam'],
            ['kanji' => '大', 'onyomi' => 'ダイ、タイ', 'kunyomi' => 'おお・きい', 'meaning' => 'Besar']
        ],
        'reading' => "これは わたしの 会社の パソコンです。あの 手帳は 田中さんのです。机の 上に 日本語の 辞書が あります。",
        'can_do' => 'Siswa mampu menunjuk barang bawaan, mengidentifikasi kepemilikan dokumen kantor, dan bertanya benda dalam lingkungan kerja.'
    ],
    [
        'chapter' => 'Bab 03',
        'meeting' => 3,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 03 – Tempat, Ruangan (Koko, Soko, Asoko) & Harga',
        'file_name' => 'Minna_no_Nihongo_Bab03_Tempat_Harga.pdf',
        'file_size' => '2.5 MB',
        'vocab' => [
            ['kanji' => '教室', 'furigana' => 'きょうしつ', 'meaning' => 'Ruang kelas', 'pos' => 'Noun'],
            ['kanji' => '食堂', 'furigana' => 'しょくどう', 'meaning' => 'Kantin / Ruang makan', 'pos' => 'Noun'],
            ['kanji' => '事務所', 'furigana' => 'じむしょ', 'meaning' => 'Kantor kerja', 'pos' => 'Noun'],
            ['kanji' => '会議室', 'furigana' => 'かいぎしつ', 'meaning' => 'Ruang rapat', 'pos' => 'Noun'],
            ['kanji' => '受付', 'furigana' => 'うけつけ', 'meaning' => 'Resepsionis / Meja informasi', 'pos' => 'Noun'],
            ['kanji' => '部屋', 'furigana' => 'へや', 'meaning' => 'Kamar / Ruangan', 'pos' => 'Noun'],
            ['kanji' => 'トイレ', 'furigana' => 'といれ', 'meaning' => 'Toilet / Kamar kecil', 'pos' => 'Noun'],
            ['kanji' => 'エレベーター', 'furigana' => 'えれべーたー', 'meaning' => 'Lift / Elevator', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => 'ここ / そこ / あそこ + は + 【Tempat】+ です', 'meaning' => 'Menunjukkan lokasi ruangan.', 'example' => 'ここは 会議室です。(Di sini adalah ruang rapat).'],
            ['pattern' => '【Benda / Orang】+ は + 【Lokasi / Tempat】+ です', 'meaning' => 'Menanyakan atau menyatakan keberadaan orang/benda di tempat.', 'example' => '佐藤さんは 事務所です。(Ibu Sato berada di kantor).'],
            ['pattern' => '【Tempat】+ は + どこ / どちら ですか', 'meaning' => 'Menanyakan arah atau letak suatu tempat secara sopan.', 'example' => 'お手洗いは どちらですか。(Di manakah toilet?).']
        ],
        'kanji' => [
            ['kanji' => '室', 'onyomi' => 'シツ', 'kunyomi' => 'むろ', 'meaning' => 'Ruangan'],
            ['kanji' => '校', 'onyomi' => 'コウ', 'kunyomi' => '-', 'meaning' => 'Sekolah'],
            ['kanji' => '上', 'onyomi' => 'ジョウ', 'kunyomi' => 'うえ、あ・がる', 'meaning' => 'Atas'],
            ['kanji' => '下', 'onyomi' => 'カ、ゲ', 'kunyomi' => 'した、さ・がる', 'meaning' => 'Bawah']
        ],
        'reading' => "この ビルの 2階に 事務所と 会議室が あります。食堂は 地下 1階です。エレベーターは あちらです。",
        'can_do' => 'Siswa mampu menunjukkan letak ruangan kerja di pabrik/kantor/panti werda dan menanyakan arah secara formal.'
    ],
    [
        'chapter' => 'Bab 04',
        'meeting' => 4,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 04 – Waktu, Jam, Jadwal Harian & Kata Kerja MASU',
        'file_name' => 'Minna_no_Nihongo_Bab04_Jam_Jadwal.pdf',
        'file_size' => '2.6 MB',
        'vocab' => [
            ['kanji' => '起きます', 'furigana' => 'おきます', 'meaning' => 'Bangun tidur', 'pos' => 'Verb'],
            ['kanji' => '寝ます', 'furigana' => 'ねます', 'meaning' => 'Tidur / Beristirahat', 'pos' => 'Verb'],
            ['kanji' => '働きます', 'furigana' => 'はたらきます', 'meaning' => 'Bekerja', 'pos' => 'Verb'],
            ['kanji' => '休みます', 'furigana' => 'やすみます', 'meaning' => 'Berlibur / Beristirahat', 'pos' => 'Verb'],
            ['kanji' => '勉強します', 'furigana' => 'べんきょうします', 'meaning' => 'Belajar', 'pos' => 'Verb'],
            ['kanji' => '終わります', 'furigana' => 'おわります', 'meaning' => 'Selesai / Berakhir', 'pos' => 'Verb'],
            ['kanji' => '今', 'furigana' => 'いま', 'meaning' => 'Sekarang', 'pos' => 'Noun'],
            ['kanji' => '午前', 'furigana' => 'ごぜん', 'meaning' => 'AM / Pagi hari', 'pos' => 'Noun'],
            ['kanji' => '午後', 'furigana' => 'ごご', 'meaning' => 'PM / Sore hari', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '今 + 【Jam】時 + 【Menit】分 + です', 'meaning' => 'Menyatakan waktu sekarang secara presisi.', 'example' => '今は 午前 9時半です。(Sekarang jam 9 lewat 30 pagi).'],
            ['pattern' => '【Waktu】+ に + 【Kata Kerja MASU】', 'meaning' => 'Menyatakan waktu terlaksananya suatu aktivitas rutin.', 'example' => '毎朝 6時に 起きます。(Setiap pagi saya bangun jam 6).'],
            ['pattern' => '【Waktu Mulai】+ から + 【Waktu Selesai】+ まで', 'meaning' => 'Menyatakan rentang waktu dari jam sekian sampai jam sekian.', 'example' => '仕事は 8時半から 5時半までです。(Pekerjaan dari jam 8:30 sampai 17:30).']
        ],
        'kanji' => [
            ['kanji' => '今', 'onyomi' => 'コン', 'kunyomi' => 'いま', 'meaning' => 'Sekarang'],
            ['kanji' => '時', 'onyomi' => 'ジ', 'kunyomi' => 'とき', 'meaning' => 'Waktu / Jam'],
            ['kanji' => '分', 'onyomi' => 'フン、プン、ブン', 'kunyomi' => 'わ・かる', 'meaning' => 'Menit / Membagi'],
            ['kanji' => '半', 'onyomi' => 'ハン', 'kunyomi' => 'なか・ば', 'meaning' => 'Setengah']
        ],
        'reading' => "わたしは 毎朝 6時に 起きます。朝ご飯を 食べて、8時半から 会社で 働きます。昼休みは 12時から 1時までです。午後 5時半に 仕事が 終わります。",
        'can_do' => 'Siswa mampu menyebutkan jadwal shift kerja, jam kerja pabrik/kaigo, dan waktu istirahat secara tepat.'
    ],
    [
        'chapter' => 'Bab 05',
        'meeting' => 5,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 05 – Arah, Transportasi (Partikel HE, DE, TO)',
        'file_name' => 'Minna_no_Nihongo_Bab05_Arah_Transportasi.pdf',
        'file_size' => '2.4 MB',
        'vocab' => [
            ['kanji' => '行きます', 'furigana' => 'いきます', 'meaning' => 'Pergi (To go)', 'pos' => 'Verb'],
            ['kanji' => '来ます', 'furigana' => 'きます', 'meaning' => 'Datang (To come)', 'pos' => 'Verb'],
            ['kanji' => '帰ります', 'furigana' => 'かえります', 'meaning' => 'Pulang ke rumah/asrama', 'pos' => 'Verb'],
            ['kanji' => '学校', 'furigana' => 'がっこう', 'meaning' => 'Sekolah', 'pos' => 'Noun'],
            ['kanji' => '駅', 'furigana' => 'えき', 'meaning' => 'Stasiun kereta', 'pos' => 'Noun'],
            ['kanji' => '電車', 'furigana' => 'でんしゃ', 'meaning' => 'Kereta listrik', 'pos' => 'Noun'],
            ['kanji' => '会社', 'furigana' => 'かいしゃ', 'meaning' => 'Perusahaan / Pabrik', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '【Tempat】+ へ + 行きます / 来ます / 帰ります', 'meaning' => 'Menyatakan arah tujuan pergerakan.', 'example' => 'わたしは 会社へ 行きます。(Saya pergi ke perusahaan).'],
            ['pattern' => '【Sarana Transportasi】+ で + 行きます', 'meaning' => 'Menyatakan sarana transportasi yang dipakai.', 'example' => '電車で 駅へ 行きます。(Saya pergi ke stasiun naik kereta).'],
            ['pattern' => '【Orang】+ と + 行きます', 'meaning' => 'Menyatakan rekan bepergian.', 'example' => '友達と スーパーへ 行きました。(Saya pergi ke supermarket bersama teman).']
        ],
        'kanji' => [
            ['kanji' => '行', 'onyomi' => 'コウ', 'kunyomi' => 'い・く', 'meaning' => 'Pergi'],
            ['kanji' => '来', 'onyomi' => 'ライ', 'kunyomi' => 'く・る', 'meaning' => 'Datang'],
            ['kanji' => '校', 'onyomi' => 'コウ', 'kunyomi' => '-', 'meaning' => 'Sekolah'],
            ['kanji' => '駅', 'onyomi' => 'エキ', 'kunyomi' => '-', 'meaning' => 'Stasiun']
        ],
        'reading' => "わたしは 来週の 月曜日に 東京へ 行きます。新幹線で 行きます。東京駅で 田中さんと 会います。夕方 6時に 寮へ 帰ります。",
        'can_do' => 'Siswa mampu menyatakan rute keberangkatan kerja, penggunaan moda transportasi kereta/bus Jepang, dan teman bepergian.'
    ],
    [
        'chapter' => 'Bab 06',
        'meeting' => 6,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 06 – Objek Aktivitas (Partikel WO) & Ajakan (MASEN KA, MASHOU)',
        'file_name' => 'Minna_no_Nihongo_Bab06_Objek_Ajakan.pdf',
        'file_size' => '2.2 MB',
        'vocab' => [
            ['kanji' => '食べます', 'furigana' => 'たべます', 'meaning' => 'Makan', 'pos' => 'Verb'],
            ['kanji' => '飲みます', 'furigana' => 'のみます', 'meaning' => 'Minum', 'pos' => 'Verb'],
            ['kanji' => '吸います', 'furigana' => 'すいます', 'meaning' => 'Menghisap (merokok)', 'pos' => 'Verb'],
            ['kanji' => '見ます', 'furigana' => 'みます', 'meaning' => 'Melihat / Menonton', 'pos' => 'Verb'],
            ['kanji' => '聞きます', 'furigana' => 'ききます', 'meaning' => 'Mendengar', 'pos' => 'Verb'],
            ['kanji' => '読みます', 'furigana' => 'よみます', 'meaning' => 'Membaca', 'pos' => 'Verb'],
            ['kanji' => '書きます', 'furigana' => 'かきます', 'meaning' => 'Menulis', 'pos' => 'Verb'],
            ['kanji' => '買います', 'furigana' => 'かいます', 'meaning' => 'Membeli', 'pos' => 'Verb'],
            ['kanji' => 'ご飯', 'furigana' => 'ごはん', 'meaning' => 'Nasi / Makanan', 'pos' => 'Noun'],
            ['kanji' => 'お茶', 'furigana' => 'おちゃ', 'meaning' => 'Teh hijau Jepang', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '【Objek】+ を + 【Kata Kerja Transitif】', 'meaning' => 'Menyatakan objek penderita aktivitas.', 'example' => 'ご飯を 食べます。(Makan nasi).'],
            ['pattern' => '【Tempat】+ で + 【Aktivitas】を します', 'meaning' => 'Menyatakan tempat terjadinya suatu kegiatan fisik.', 'example' => '食堂で 昼ご飯を 食べます。(Makan siang di kantin).'],
            ['pattern' => '一緒に + 【Kata Kerja】+ ませんか / ましょう', 'meaning' => 'Bentuk ajakan santun kepada rekan kerja.', 'example' => '一緒に お茶を 飲みませんか。(Maukah minum teh bersama?).']
        ],
        'kanji' => [
            ['kanji' => '食', 'onyomi' => 'ショク', 'kunyomi' => 'た・べる', 'meaning' => 'Makan'],
            ['kanji' => '飲', 'onyomi' => 'イン', 'kunyomi' => 'の・む', 'meaning' => 'Minum'],
            ['kanji' => '見', 'onyomi' => 'ケン', 'kunyomi' => 'み・る', 'meaning' => 'Melihat']
        ],
        'reading' => "昼休みに 同僚と 食堂で 定食を 食べました。それから 自動販売機で コーヒーを 買いました。一緒に 飲みました。",
        'can_do' => 'Siswa mampu memesan makanan di kantin, menyatakan aktivitas kerja harian, dan mengajak rekan kerja secara santun.'
    ],
    [
        'chapter' => 'Bab 07',
        'meeting' => 7,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 07 – Alat, Sarana & Memberi/Menerima (AGEMASU, MORAIMASU)',
        'file_name' => 'Minna_no_Nihongo_Bab07_Alat_Pemberian.pdf',
        'file_size' => '2.4 MB',
        'vocab' => [
            ['kanji' => '切ります', 'furigana' => 'きります', 'meaning' => 'Memotong', 'pos' => 'Verb'],
            ['kanji' => '送ります', 'furigana' => 'おくります', 'meaning' => 'Mengirim (paket/email)', 'pos' => 'Verb'],
            ['kanji' => 'あげます', 'furigana' => 'あげます', 'meaning' => 'Memberikan kepada orang lain', 'pos' => 'Verb'],
            ['kanji' => 'もらいます', 'furigana' => 'もらいます', 'meaning' => 'Menerima dari orang lain', 'pos' => 'Verb'],
            ['kanji' => '貸します', 'furigana' => 'かします', 'meaning' => 'Meminjamkan', 'pos' => 'Verb'],
            ['kanji' => '借ります', 'furigana' => 'かります', 'meaning' => 'Meminjam', 'pos' => 'Verb'],
            ['kanji' => '教えます', 'furigana' => 'おしえます', 'meaning' => 'Mengajarkan', 'pos' => 'Verb'],
            ['kanji' => '習います', 'furigana' => 'ならいます', 'meaning' => 'Mempelajari / Belajar dari', 'pos' => 'Verb'],
            ['kanji' => 'はさみ', 'furigana' => 'はさみ', 'meaning' => 'Gunting', 'pos' => 'Noun'],
            ['kanji' => '荷物', 'furigana' => 'にもつ', 'meaning' => 'Barang bawaan / Paket', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '【Alat / Bahasa】+ で + 【Aktivitas】', 'meaning' => 'Menyatakan alat perkakas atau bahasa yang digunakan.', 'example' => '日本語で レポートを 書きます。(Menulis laporan dalam bahasa Jepang).'],
            ['pattern' => '【Penerima】+ に + 【Barang】を あげます', 'meaning' => 'Memberikan barang kepada penerima.', 'example' => 'わたしは 田中さんに プレゼントを あげました。(Saya memberi hadiah kepada Tanaka).'],
            ['pattern' => '【Pemberi】+ に / から + 【Barang】を もらいます', 'meaning' => 'Menerima barang dari seseorang.', 'example' => '先輩に ノートを もらいました。(Menerima catatan dari senior).'],
            ['pattern' => 'もう + 【Kata Kerja Mashita】', 'meaning' => 'Menyatakan aktivitas yang sudah selesai dilakukan.', 'example' => 'もう 荷物を 送りました。(Sudah mengirim paket/barang).']
        ],
        'kanji' => [
            ['kanji' => '語', 'onyomi' => 'ゴ', 'kunyomi' => 'かた・る', 'meaning' => 'Bahasa / Kata'],
            ['kanji' => '手', 'onyomi' => 'シュ', 'kunyomi' => 'て', 'meaning' => 'Tangan'],
            ['kanji' => '紙', 'onyomi' => 'シ', 'kunyomi' => 'かみ', 'meaning' => 'Kertas']
        ],
        'reading' => "きのう 田中先輩に 仕事の マニュアルを もらいました。日本語で 書いて あります。ハサミで 箱を 開けました。",
        'can_do' => 'Siswa mampu menggunakan peralatan kerja, memahami instruksi alat, dan mengonfirmasi penyelesaian tugas (Mou shimashita).'
    ],
    [
        'chapter' => 'Bab 08',
        'meeting' => 8,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 08 – Kata Sifat (I-Keiyoushi & Na-Keiyoushi)',
        'file_name' => 'Minna_no_Nihongo_Bab08_Kata_Sifat.pdf',
        'file_size' => '2.5 MB',
        'vocab' => [
            ['kanji' => '新しい', 'furigana' => 'あたらしい', 'meaning' => 'Baru', 'pos' => 'I-Adj'],
            ['kanji' => '古い', 'furigana' => 'ふるい', 'meaning' => 'Lama / Kuno', 'pos' => 'I-Adj'],
            ['kanji' => '良い', 'furigana' => 'いい / よい', 'meaning' => 'Bagus / Baik', 'pos' => 'I-Adj'],
            ['kanji' => '暑い', 'furigana' => 'あつい', 'meaning' => 'Panas (cuaca)', 'pos' => 'I-Adj'],
            ['kanji' => '寒い', 'furigana' => 'さむい', 'meaning' => 'Dingin (cuaca)', 'pos' => 'I-Adj'],
            ['kanji' => '静か［な］', 'furigana' => 'しずか', 'meaning' => 'Tenang / Sunyi', 'pos' => 'Na-Adj'],
            ['kanji' => '親切［な］', 'furigana' => 'しんせつ', 'meaning' => 'Ramah / Baik hati', 'pos' => 'Na-Adj'],
            ['kanji' => '便利［な］', 'furigana' => 'べんり', 'meaning' => 'Praktis / Memudahkan', 'pos' => 'Na-Adj'],
            ['kanji' => '元気［な］', 'furigana' => 'げんき', 'meaning' => 'Sehat / Bersemangat', 'pos' => 'Na-Adj']
        ],
        'grammar' => [
            ['pattern' => '【Benda】+ は + 【Kata Sifat】+ です', 'meaning' => 'Mendeskripsikan sifat atau kondisi benda/tempat.', 'example' => 'この寮は とても 静かです。(Asrama ini sangat tenang).'],
            ['pattern' => '【I-Adj tanpa い】+ くないです (Negatif)', 'meaning' => 'Bentuk penyangkalan kata sifat I.', 'example' => '今日は 寒くないです。(Hari ini tidak dingin).'],
            ['pattern' => '【Na-Adj】+ じゃありません (Negatif)', 'meaning' => 'Bentuk penyangkalan kata sifat Na.', 'example' => 'この町は にぎやかじゃありません。(Kota ini tidak ramai).'],
            ['pattern' => '【I-Adj】+ 【Noun】 / 【Na-Adj】+ な + 【Noun】', 'meaning' => 'Modifikasi langsung menerangkan kata benda.', 'example' => '親切な 先輩 (Senior yang ramah) / 新しい 機械 (Mesin baru).']
        ],
        'kanji' => [
            ['kanji' => '新', 'onyomi' => 'シン', 'kunyomi' => 'あたら・しい', 'meaning' => 'Baru'],
            ['kanji' => '古', 'onyomi' => 'コ', 'kunyomi' => 'ふる・い', 'meaning' => 'Lama / Kuno'],
            ['kanji' => '白', 'onyomi' => 'ハク', 'kunyomi' => 'しろ・い', 'meaning' => 'Putih'],
            ['kanji' => '黒', 'onyomi' => 'コク', 'kunyomi' => 'くろ・い', 'meaning' => 'Hitam']
        ],
        'reading' => "日本の 会社は とても きれいです。先輩たちは みんな 親切です。寮の 部屋は 新しいですが、少し 狭いです。",
        'can_do' => 'Siswa mampu mendeskripsikan kondisi lingkungan kerja pabrik/asrama serta menyampaikan kesan terhadap fasilitas.'
    ],
    [
        'chapter' => 'Bab 09',
        'meeting' => 9,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 09 – Kesukaan, Kemampuan & Alasan (~KARA)',
        'file_name' => 'Minna_no_Nihongo_Bab09_Kesukaan_Kemampuan.pdf',
        'file_size' => '2.4 MB',
        'vocab' => [
            ['kanji' => '分かります', 'furigana' => 'わかります', 'meaning' => 'Mengerti / Paham', 'pos' => 'Verb'],
            ['kanji' => 'あります', 'furigana' => 'あります', 'meaning' => 'Punya / Ada (benda mati)', 'pos' => 'Verb'],
            ['kanji' => '好き［な］', 'furigana' => 'すき', 'meaning' => 'Suka / Gemar', 'pos' => 'Na-Adj'],
            ['kanji' => '嫌い［な］', 'furigana' => 'きらい', 'meaning' => 'Benci / Tidak suka', 'pos' => 'Na-Adj'],
            ['kanji' => '上手［な］', 'furigana' => 'じょうず', 'meaning' => 'Pintar / Mahir', 'pos' => 'Na-Adj'],
            ['kanji' => '下手［な］', 'furigana' => 'へた', 'meaning' => 'Kurang mahir / Payah', 'pos' => 'Na-Adj'],
            ['kanji' => '料理', 'furigana' => 'りょうり', 'meaning' => 'Masakan / Memasak', 'pos' => 'Noun'],
            ['kanji' => '時間', 'furigana' => 'じかん', 'meaning' => 'Waktu', 'pos' => 'Noun'],
            ['kanji' => '用事', 'furigana' => 'ようじ', 'meaning' => 'Urusan / Keperluan penting', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '【Benda】+ が + 好きです / 嫌いです', 'meaning' => 'Menyatakan rasa suka atau tidak suka terhadap suatu hal.', 'example' => 'わたしは 日本料理が 好きです。(Saya suka masakan Jepang).'],
            ['pattern' => '【Kemampuan】+ が + 上手です / 下手です / 分かります', 'meaning' => 'Menyatakan tingkat kemahiran atau pemahaman.', 'example' => '日本語が 少し 分かります。(Saya mengerti bahasa Jepang sedikit).'],
            ['pattern' => '【Alasan】+ から、〜', 'meaning' => 'Menyatakan sebab-akibat.', 'example' => '時間が ありませんから、タクシーで 行きます。(Karena tidak ada waktu, saya pergi naik taksi).']
        ],
        'kanji' => [
            ['kanji' => '好', 'onyomi' => 'コウ', 'kunyomi' => 'す・き', 'meaning' => 'Suka'],
            ['kanji' => '上', 'onyomi' => 'ジョウ', 'kunyomi' => 'うえ', 'meaning' => 'Atas (Jozu)'],
            ['kanji' => '下', 'onyomi' => 'カ、ゲ', 'kunyomi' => 'した', 'meaning' => 'Bawah (Heta)'],
            ['kanji' => '間', 'onyomi' => 'カン', 'kunyomi' => 'あいだ', 'meaning' => 'Waktu / Antara']
        ],
        'reading' => "わたしは 漢字が あまり 分かりませんから、辞書で 調べます。料理が 好きですから、寮で 自分で 作ります。",
        'can_do' => 'Siswa mampu menjelaskan alasan keterlambatan/keperluan, mengutarakan kemampuan kerja, dan berkomunikasi dengan atasan.'
    ],
    [
        'chapter' => 'Bab 10',
        'meeting' => 10,
        'level' => 'N5',
        'title' => 'Minna no Nihongo Bab 10 – Keberadaan Makhluk Hidup & Benda Mati (IMASU & ARIMASU)',
        'file_name' => 'Minna_no_Nihongo_Bab10_Keberadaan_Posisi.pdf',
        'file_size' => '2.6 MB',
        'vocab' => [
            ['kanji' => 'います', 'furigana' => 'います', 'meaning' => 'Ada (untuk manusia dan hewan)', 'pos' => 'Verb'],
            ['kanji' => 'あります', 'furigana' => 'あります', 'meaning' => 'Ada (untuk benda mati dan tumbuhan)', 'pos' => 'Verb'],
            ['kanji' => '上', 'furigana' => 'うえ', 'meaning' => 'Atas', 'pos' => 'Noun'],
            ['kanji' => '下', 'furigana' => 'した', 'meaning' => 'Bawah', 'pos' => 'Noun'],
            ['kanji' => '前', 'furigana' => 'まえ', 'meaning' => 'Depan', 'pos' => 'Noun'],
            ['kanji' => '後ろ', 'furigana' => 'うしろ', 'meaning' => 'Belakang', 'pos' => 'Noun'],
            ['kanji' => '右', 'furigana' => 'みぎ', 'meaning' => 'Kanan', 'pos' => 'Noun'],
            ['kanji' => '左', 'furigana' => 'ひだり', 'meaning' => 'Kiri', 'pos' => 'Noun'],
            ['kanji' => '中', 'furigana' => 'なか', 'meaning' => 'Dalam', 'pos' => 'Noun'],
            ['kanji' => '隣', 'furigana' => 'となり', 'meaning' => 'Sebelah / Samping pas', 'pos' => 'Noun']
        ],
        'grammar' => [
            ['pattern' => '【Tempat】+ に + 【Benda Mati】+ が あります', 'meaning' => 'Menyatakan keberadaan benda mati di suatu lokasi.', 'example' => '机の 上に パソコンが あります。(Di atas meja ada laptop).'],
            ['pattern' => '【Tempat】+ に + 【Orang / Hewan】+ が います', 'meaning' => 'Menyatakan keberadaan makhluk hidup di suatu lokasi.', 'example' => '事務所に 田中さんが います。(Di kantor ada Tuan Tanaka).'],
            ['pattern' => '【Benda A】+ の + 【Posisi (上/下/前/中)】+ に + 【Benda B】', 'meaning' => 'Menyatakan posisi relatif barang.', 'example' => '棚の 中に 工具が あります。(Di dalam rak ada perkakas/alat).']
        ],
        'kanji' => [
            ['kanji' => '前', 'onyomi' => 'ゼン', 'kunyomi' => 'まえ', 'meaning' => 'Depan / Sebelum'],
            ['kanji' => '後', 'onyomi' => 'ゴ、コウ', 'kunyomi' => 'うし・ろ、あと', 'meaning' => 'Belakang / Sesudah'],
            ['kanji' => '右', 'onyomi' => 'ウ、ユウ', 'kunyomi' => 'みぎ', 'meaning' => 'Kanan'],
            ['kanji' => '左', 'onyomi' => 'サ', 'kunyomi' => 'ひだり', 'meaning' => 'Kiri']
        ],
        'reading' => "工場の 倉庫の 中に 新しい 部品が あります。棚の 2段目に 工具箱が あります。田中さんは 今 会議室に います。",
        'can_do' => 'Siswa mampu menunjukkan dan mencari letak peralatan, perkakas bengkel, maupun mencari orang di area kerja.'
    ]
];

$count = 0;
foreach ($chapters as $ch) {
    // Check if exists
    $chTitle = $ch['title'];
    $bab = $ch['chapter'];
    $check = $conn->query("SELECT id FROM lms_materials WHERE chapter_bab = '$bab' LIMIT 1");
    if ($check && $check->num_rows > 0) {
        $existingId = $check->fetch_assoc()['id'];
        $stmt = $conn->prepare("UPDATE lms_materials SET title=?, meeting_id=?, level=?, file_name=?, file_size=?, extracted_vocab=?, extracted_grammar=?, extracted_kanji=?, extracted_reading=?, can_do_statement=? WHERE id=?");
        $vJson = json_encode($ch['vocab'], JSON_UNESCAPED_UNICODE);
        $gJson = json_encode($ch['grammar'], JSON_UNESCAPED_UNICODE);
        $kJson = json_encode($ch['kanji'], JSON_UNESCAPED_UNICODE);
        $stmt->bind_param("sissssssssi", $chTitle, $ch['meeting'], $ch['level'], $ch['file_name'], $ch['file_size'], $vJson, $gJson, $kJson, $ch['reading'], $ch['can_do'], $existingId);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("INSERT INTO lms_materials (class_id, sensei_id, meeting_id, title, chapter_bab, level, file_name, file_path, file_type, file_size, page_count, extracted_vocab, extracted_grammar, extracted_kanji, extracted_reading, can_do_statement, learning_objectives) VALUES (19, 1, ?, ?, ?, ?, ?, ?, 'pdf', ?, 24, ?, ?, ?, ?, ?, 'Standar JF Standard & Minna no Nihongo')");
        $filePath = 'uploads/materials/' . $ch['file_name'];
        $vJson = json_encode($ch['vocab'], JSON_UNESCAPED_UNICODE);
        $gJson = json_encode($ch['grammar'], JSON_UNESCAPED_UNICODE);
        $kJson = json_encode($ch['kanji'], JSON_UNESCAPED_UNICODE);
        $stmt->bind_param("isssssssssss", $ch['meeting'], $chTitle, $bab, $ch['level'], $ch['file_name'], $filePath, $ch['file_size'], $vJson, $gJson, $kJson, $ch['reading'], $ch['can_do']);
        $stmt->execute();
    }
    $count++;
}

echo "Berhasil memverifikasi & menyelaraskan $count Bab materi Minna no Nihongo ke lms_materials.\n";
