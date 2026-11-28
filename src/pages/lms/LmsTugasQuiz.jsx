import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  Check, 
  X, 
  Play, 
  Eye, 
  Edit3, 
  Award, 
  HelpCircle, 
  MoreVertical, 
  List, 
  Grid, 
  Trophy, 
  Sparkles,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Volume2,
  Bookmark,
  Share2,
  Layers,
  Globe,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle,
  Flag,
  Eraser,
  MessageSquare,
  Users,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  Save,
  CheckSquare,
  Square,
  Sliders,
  Filter,
  Download,
  Paperclip,
  FileCheck,
  GraduationCap,
  LayoutGrid,
  TrendingUp,
  BarChart2,
  Copy,
  ChevronUp
} from 'lucide-react';
import {
  isClassMatching
} from '../../services/lmsStudentData';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import quizHeroBannerImg from '../../assets/quiz_hero_banner.jpg';
import toriiGateImg from '../../assets/torii_gate_sunset.jpg';
import osakaCastleImg from '../../assets/osaka_castle.jpg';
import Swal from 'sweetalert2';

// ─────────────────────────────────────────────────────────────────────────────
// ── MASTER DATA: TUGAS SISWA N5 S/D N1 DENGAN AKSES SENSEI ──
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_TASKS = [
  // ── LEVEL N5 ──
  {
    id: 1,
    title: 'Tugas N5 – Latihan Kata Kerja Dasar & Pola Kalimat',
    startBab: 1,
    endBab: 3,
    bab: 'Bab 1 s/d Bab 3',
    level: 'N5',
    isOpen: true, // Akses buka/tutup oleh Sensei
    status: 'Belum Dikumpulkan',
    statusCode: 'unsubmitted',
    uploadDate: '2026-10-18',
    uploadTime: '08:00',
    deadlineDate: '2026-10-25',
    deadlineTime: '23:59',
    deadlineDuration: '5 Hari',
    deadlineText: 'Tenggat: 25 Okt 2026, 23:59 WIB (5 Hari)',
    desc: 'Pelajari dokumen modul materi Bab 1 s/d Bab 3 yang diunggah Sensei. Buatlah 5 kalimat lengkap menggunakan kata kerja transitif & intransitif dasar dari kamus Takoboto.jp.',
    materialFile: {
      name: 'Modul_Materi_Bab1-3_Kata_Kerja_Dasar.pdf',
      size: '2.4 MB',
      type: 'PDF',
      pages: 12,
      uploadedAt: '18 Okt 2026'
    },
    takobotoWords: [
      { kanji: '食べる', kana: 'たべる', romaji: 'taberu', pos: 'Ichidan verb', meaning: 'Makan', takobotoUrl: 'https://takoboto.jp/?q=taberu' },
      { kanji: '飲む', kana: 'のむ', romaji: 'nomu', pos: 'Godan verb', meaning: 'Minum', takobotoUrl: 'https://takoboto.jp/?q=nomu' },
      { kanji: '行く', kana: 'いく', romaji: 'iku', pos: 'Godan verb', meaning: 'Pergi', takobotoUrl: 'https://takoboto.jp/?q=iku' },
      { kanji: '見る', kana: 'みる', romaji: 'miru', pos: 'Ichidan verb', meaning: 'Melihat / Menonton', takobotoUrl: 'https://takoboto.jp/?q=miru' },
      { kanji: '話す', kana: 'はなす', romaji: 'hanasu', pos: 'Godan verb', meaning: 'Berbicara', takobotoUrl: 'https://takoboto.jp/?q=hanasu' }
    ],
    iconBg: 'bg-rose-50 text-rose-500 border-rose-100',
    tags: ['Modul Sensei', 'Bab 1-3', 'Takoboto Verbs'],
    submissions: [
      { 
        studentName: 'Budi Santoso', 
        score: 75, 
        submittedAt: '19 Okt 2026, 14:10 WIB', 
        status: 'Perlu Koreksi', 
        fileName: 'Tugas_Bab1-3_BudiSantoso.pdf',
        fileSize: '1.2 MB',
        notes: 'Sensei, mohon periksa apakah penggunaan partikel wo sudah tepat.',
        feedback: 'Perhatikan partikel untuk iku harus menggunakan ni/e, bukan wo.', 
        mistakes: ['Salah partikel pada kalimat no 3'] 
      },
      { 
        studentName: 'Dewi Lestari', 
        score: 85, 
        submittedAt: '20 Okt 2026, 16:35 WIB', 
        status: 'Dinilai', 
        fileName: 'Lembar_Jawaban_Bab1-3_Dewi.docx',
        fileSize: '890 KB',
        notes: 'Tugas sudah selesai dikerjakan sesuai modul.',
        feedback: 'Penulisan kanji taberu dan nomu sangat rapi.', 
        mistakes: [] 
      }
    ]
  },
  {
    id: 2,
    title: 'Tugas N5 – Menulis Huruf Kanji Angka & Waktu (KANJIDIC)',
    startBab: 1,
    endBab: 2,
    bab: 'Bab 1 s/d Bab 2',
    level: 'N5',
    isOpen: true,
    status: 'Sudah Dikumpulkan',
    statusCode: 'submitted',
    submittedDate: 'Kumpul: 18 Okt 2026, 11:20 WIB',
    uploadDate: '2026-10-16',
    uploadTime: '09:00',
    deadlineDate: '2026-10-22',
    deadlineTime: '23:59',
    deadlineDuration: '3 Hari',
    deadlineText: 'Tenggat: 22 Okt 2026, 23:59 WIB (3 Hari)',
    desc: 'Pelajari berkas lembar kerja kanji Bab 1-2. Tuliskan goresan kanji angka dan hari beserta onyomi & kunyomi sesuai panduan radikal Takoboto.jp.',
    materialFile: {
      name: 'Lembar_Kerja_Kanji_Dasar_Bab1-2.pdf',
      size: '1.8 MB',
      type: 'PDF',
      pages: 8,
      uploadedAt: '16 Okt 2026'
    },
    takobotoWords: [
      { kanji: '日', kana: 'ひ / にち', romaji: 'hi / nichi', pos: 'Kanji Radikal', meaning: 'Hari / Matahari', takobotoUrl: 'https://takoboto.jp/?q=日' },
      { kanji: '月', kana: 'つき / げつ', romaji: 'tsuki / getsu', pos: 'Kanji Radikal', meaning: 'Bulan', takobotoUrl: 'https://takoboto.jp/?q=月' },
      { kanji: '年', kana: 'とし / ねん', romaji: 'toshi / nen', pos: 'Kanji N5', meaning: 'Tahun', takobotoUrl: 'https://takoboto.jp/?q=年' },
      { kanji: '時', kana: 'とき / じ', romaji: 'toki / ji', pos: 'Kanji N5', meaning: 'Jam / Waktu', takobotoUrl: 'https://takoboto.jp/?q=時' }
    ],
    iconBg: 'bg-blue-50 text-blue-500 border-blue-100',
    tags: ['Modul Kanji', 'Bab 1-2', 'Stroke Order'],
    score: 96,
    feedback: 'Proporsi kanji sangat rapi! Penulisan radikal matahari (日) dan bulan (月) sudah sesuai urutan goresan Takoboto.',
    studentSubmission: {
      fileName: 'Jawaban_Kanji_Bab1-2_RinaAulia.pdf',
      fileSize: '1.5 MB',
      submittedAt: '18 Okt 2026, 11:20 WIB',
      notes: 'Sensei, goresan kanji sudah disesuaikan dengan stroke order Takoboto.',
      score: 96,
      status: 'Dinilai',
      feedback: 'Proporsi kanji sangat rapi! Penulisan radikal matahari (日) dan bulan (月) sudah sesuai urutan goresan Takoboto.'
    },
    submissions: [
      { 
        studentName: 'Rina Aulia', 
        score: 96, 
        submittedAt: '18 Okt 2026, 11:20 WIB', 
        status: 'Dinilai', 
        fileName: 'Jawaban_Kanji_Bab1-2_RinaAulia.pdf',
        fileSize: '1.5 MB',
        notes: 'Sensei, goresan kanji sudah disesuaikan dengan stroke order Takoboto.',
        feedback: 'Goresan kanji rapi sekali.', 
        mistakes: [] 
      },
      { 
        studentName: 'Kenji Pratama', 
        score: 90, 
        submittedAt: '18 Okt 2026, 13:45 WIB', 
        status: 'Dinilai', 
        fileName: 'Tugas_Kanji_Kenji.pdf',
        fileSize: '1.1 MB',
        notes: 'Sudah selesai menulis kanji sampai halaman 8.',
        feedback: 'Perhatikan lekukan kanji getsu.', 
        mistakes: [] 
      }
    ]
  },
  // ── LEVEL N4 ──
  {
    id: 3,
    title: 'Tugas N4 – Pasangan Kata Kerja Jidoushi & Tadoushi',
    startBab: 4,
    endBab: 6,
    bab: 'Bab 4 s/d Bab 6',
    level: 'N4',
    isOpen: true,
    status: 'Belum Dikumpulkan',
    statusCode: 'unsubmitted',
    uploadDate: '2026-10-21',
    uploadTime: '10:00',
    deadlineDate: '2026-10-30',
    deadlineTime: '23:59',
    deadlineDuration: '7 Hari',
    deadlineText: 'Tenggat: 30 Okt 2026, 23:59 WIB (7 Hari)',
    desc: 'Unduh dokumen modul Bab 4 s/d Bab 6. Lengkapi tabel pasangan kata kerja otomatis dan yang membutuhkan objek serta buat kalimat situasinya.',
    materialFile: {
      name: 'Modul_Materi_Bab4-6_Jidoushi_Tadoushi.pdf',
      size: '3.1 MB',
      type: 'PDF',
      pages: 15,
      uploadedAt: '21 Okt 2026'
    },
    takobotoWords: [
      { kanji: '開ける', kana: 'あける', romaji: 'akeru', pos: 'Transitive', meaning: 'Membuka (sesuatu)', takobotoUrl: 'https://takoboto.jp/?q=akeru' },
      { kanji: '開く', kana: 'あく', romaji: 'aku', pos: 'Intransitive', meaning: 'Terbuka (sendiri)', takobotoUrl: 'https://takoboto.jp/?q=aku' },
      { kanji: '閉める', kana: 'しめる', romaji: 'shimeru', pos: 'Transitive', meaning: 'Menutup (sesuatu)', takobotoUrl: 'https://takoboto.jp/?q=shimeru' },
      { kanji: '閉まる', kana: 'しまる', romaji: 'shimaru', pos: 'Intransitive', meaning: 'Tertutup (sendiri)', takobotoUrl: 'https://takoboto.jp/?q=shimaru' }
    ],
    iconBg: 'bg-purple-50 text-purple-500 border-purple-100',
    tags: ['Modul Bab 4-6', 'Takoboto N4 Drill'],
    submissions: []
  },
  // ── LEVEL N3 ──
  {
    id: 4,
    title: 'Tugas N3 – Karangan Esai Motivasi Kerja di Jepang (Shibou Douki)',
    startBab: 7,
    endBab: 9,
    bab: 'Bab 7 s/d Bab 9',
    level: 'N3',
    isOpen: false, // Ditutup sementara oleh Sensei
    status: 'Belum Dikumpulkan',
    statusCode: 'unsubmitted',
    uploadDate: '2026-10-22',
    uploadTime: '11:00',
    deadlineDate: '2026-11-05',
    deadlineTime: '23:59',
    deadlineDuration: '10 Hari',
    deadlineText: 'Tenggat: 5 Nov 2026, 23:59 WIB (10 Hari)',
    desc: 'Pelajari materi tata bahasa Bab 7 s/d Bab 9. Tulis karangan singkat minimal 400 karakter kanji menggunakan pola kalimat tata bahasa N3 resmi.',
    materialFile: {
      name: 'Panduan_Penulisan_Esai_Bab7-9.docx',
      size: '1.4 MB',
      type: 'DOCX',
      pages: 6,
      uploadedAt: '22 Okt 2026'
    },
    takobotoWords: [
      { kanji: '経験', kana: 'けいけん', romaji: 'keiken', pos: 'Noun', meaning: 'Pengalaman', takobotoUrl: 'https://takoboto.jp/?q=keiken' },
      { kanji: '準備', kana: 'じゅんび', romaji: 'junbi', pos: 'Noun', meaning: 'Persiapan', takobotoUrl: 'https://takoboto.jp/?q=junbi' },
      { kanji: '複雑', kana: 'ふくざつ', romaji: 'fukuzatsu', pos: 'na-adj', meaning: 'Rumit / Kompleks', takobotoUrl: 'https://takoboto.jp/?q=fukuzatsu' }
    ],
    iconBg: 'bg-amber-50 text-amber-500 border-amber-100',
    tags: ['Modul Bab 7-9', 'Karangan 400 Kanji'],
    submissions: []
  },
  // ── LEVEL N2 ──
  {
    id: 5,
    title: 'Tugas N2 – Analisis Teks Berita & Etika Kaizen di Pabrik',
    startBab: 10,
    endBab: 12,
    bab: 'Bab 10 s/d Bab 12',
    level: 'N2',
    isOpen: false,
    status: 'Belum Dikumpulkan',
    statusCode: 'unsubmitted',
    deadlineDate: '2026-11-12',
    deadlineTime: '23:59',
    deadlineDuration: '14 Hari',
    deadlineText: 'Tenggat: 12 Nov 2026, 23:59 WIB (14 Hari)',
    desc: 'Bedah artikel bisnis berbahasa Jepang dari berkas materi Bab 10 s/d Bab 12 mengenai efisiensi kerja Kaizen dan terjemahkan istilah kunci.',
    materialFile: {
      name: 'Modul_Kaizen_Etika_Kerja_Bab10-12.pdf',
      size: '4.5 MB',
      type: 'PDF',
      pages: 20,
      uploadedAt: '22 Okt 2026'
    },
    takobotoWords: [
      { kanji: '担当', kana: 'たんとう', romaji: 'tantou', pos: 'Noun', meaning: 'Penanggung Jawab', takobotoUrl: 'https://takoboto.jp/?q=tantou' },
      { kanji: '承知', kana: 'しょうち', romaji: 'shouchi', pos: 'Noun', meaning: 'Paham / Setuju', takobotoUrl: 'https://takoboto.jp/?q=shouchi' }
    ],
    iconBg: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    tags: ['Modul Bab 10-12', 'N2 Advanced'],
    submissions: []
  },
  // ── LEVEL N1 ──
  {
    id: 6,
    title: 'Tugas N1 – Penerjemahan Kontrak Perjanjian Kerja Formal',
    startBab: 13,
    endBab: 15,
    bab: 'Bab 13 s/d Bab 15',
    level: 'N1',
    isOpen: false,
    status: 'Belum Dikumpulkan',
    statusCode: 'unsubmitted',
    deadlineDate: '2026-11-20',
    deadlineTime: '23:59',
    deadlineDuration: '14 Hari',
    deadlineText: 'Tenggat: 20 Nov 2026, 23:59 WIB (14 Hari)',
    desc: 'Terjemahkan 3 klausul perjanjian kerja standar industri Jepang dari berkas kontrak Bab 13 s/d Bab 15 ke dalam bahasa Indonesia formal.',
    materialFile: {
      name: 'Dokumen_Hukum_Kontrak_Bab13-15.pdf',
      size: '5.2 MB',
      type: 'PDF',
      pages: 24,
      uploadedAt: '22 Okt 2026'
    },
    takobotoWords: [
      { kanji: '躊躇', kana: 'ちゅうちょ', romaji: 'chuucho', pos: 'Noun', meaning: 'Ragu-ragu / Bimbang', takobotoUrl: 'https://takoboto.jp/?q=chuucho' },
      { kanji: '齟齬', kana: 'そご', romaji: 'sogo', pos: 'Noun', meaning: 'Ketidaksesuaian', takobotoUrl: 'https://takoboto.jp/?q=sogo' }
    ],
    iconBg: 'bg-indigo-50 text-indigo-500 border-indigo-100',
    tags: ['Modul Bab 13-15', 'N1 Professional'],
    submissions: []
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// ── MASTER DATA: BANK QUIZ N5 S/D N1 LENGKAP DENGAN SOAL INTERAKTIF UKOM ──
const INITIAL_QUIZZES = [
  {
    "id": 1,
    "title": "Quiz N5 – Situasional & Etika Salam Kerja (Japan Foundation Can-Do A1)",
    "bab": "Bab 1 – Etika & Salam Kerja",
    "level": "N5",
    "classRoom": "N5 Pagi",
    "curriculumSource": "Japan Foundation (JF Standard)",
    "category": "Situasional",
    "categoryLabel": "🤝 Situasional & Komunikasi",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "25:00",
    "durationMinutes": 25,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "torii_gate",
    "badgeColor": "bg-purple-50 text-purple-700",
    "submissionsCount": 2,
    "totalStudents": 2,
    "questions": [
      {
        "id": 1,
        "category": "Situasional",
        "passage": "状況：朝、会社の事務所に入るときに、上司や同僚に挨拶をします。\n(Situasi: Pagi hari saat memasuki kantor tempat kerja, memberi salam kepada atasan dan rekan kerja).",
        "question": "朝、会社の 事務所に 入ったとき、最初に 言う 適切な 挨拶は どれですか。",
        "translation": "Ucapan salam pembuka apa yang paling tepat saat Anda baru tiba di kantor pada pagi hari?",
        "wordJp": "おはようございます",
        "furigana": "おはようございます",
        "options": [
          {
            "key": "A",
            "text": "おはようございます (Ohayou gozaimasu - Selamat pagi sopan)"
          },
          {
            "key": "B",
            "text": "おやすみなさい (Oyasuminasai - Selamat tidur)"
          },
          {
            "key": "C",
            "text": "さようなら (Sayounara - Selamat tinggal)"
          },
          {
            "key": "D",
            "text": "いただきます (Itadakimasu - Selamat makan)"
          }
        ],
        "correctKey": "A",
        "explanation": "Menurut standar Japan Foundation Can-Do A1, salam resmi saat tiba di tempat kerja pada pagi hari adalah 「おはようございます」."
      },
      {
        "id": 2,
        "category": "Situasional",
        "passage": "状況：仕事が終わって、まだ仕事をしている同僚より先に帰ります。\n(Situasi: Pekerjaan Anda telah selesai hari ini, dan Anda akan pulang lebih awal mendahului rekan kerja yang masih bekerja).",
        "question": "同僚より 先に 帰るときに 言う 日本の ビジネスマナーの 言葉は どれですか。",
        "translation": "Ungkapan etika kerja apa yang diucapkan saat Anda pamit pulang mendahului rekan kerja yang masih bertugas?",
        "wordJp": "お先に失礼します",
        "furigana": "おさきにしつれいします",
        "options": [
          {
            "key": "A",
            "text": "お先に失礼します (Osaki ni shitsurei shimasu - Permisi pulang duluan)"
          },
          {
            "key": "B",
            "text": "ごめんなさい (Gomennasai - Minta maaf santai)"
          },
          {
            "key": "C",
            "text": "いってきます (Ittekimasu - Saya berangkat)"
          },
          {
            "key": "D",
            "text": "またあしたね (Mata ashita ne - Sampai jumpa besok non-formal)"
          }
        ],
        "correctKey": "A",
        "explanation": "Standar etika kerja Jepang (Aisatsu) mewajibkan karyawan mengucapkan 「お先に失礼します」(Osaki ni shitsurei shimasu) ketika pulang lebih awal."
      },
      {
        "id": 3,
        "category": "Situasional",
        "passage": "状況：同僚の田中さんが「お先に失礼します」と言って帰ります。あなたはどう答えますか。\n(Situasi: Rekan kerja Anda Tanaka-san pamit dengan berkata \"Osaki ni shitsurei shimasu\". Bagaimana Anda menjawabnya?)",
        "question": "「お先に失礼します」と 言われたときの 正しい 返答は どれですか。",
        "translation": "Manakah respon balasan yang tepat saat rekan kerja berpamitan pulang?",
        "wordJp": "お疲れ様でした",
        "furigana": "おつかれさまでした",
        "options": [
          {
            "key": "A",
            "text": "お疲れ様でした (Otsukaresama deshita - Terima kasih atas kerja keras Anda)"
          },
          {
            "key": "B",
            "text": "どういたしまして (Douitashimashite - Sama-sama)"
          },
          {
            "key": "C",
            "text": "おかえりなさい (Okaerinasai - Selamat kembali)"
          },
          {
            "key": "D",
            "text": "ごちそうさまでした (Gochisousama deshita - Terima kasih atas hidangannya)"
          }
        ],
        "correctKey": "A",
        "explanation": "Respon standar bagi rekan kerja yang pamit pulang adalah 「お疲れ様でした」(Otsukaresama deshita)."
      },
      {
        "id": 4,
        "category": "Situasional",
        "passage": "状況：新しく配属された職場で、初めてチームメンバーに自己紹介をします。\n(Situasi: Baru pertama kali ditempatkan di tempat kerja baru, memperkenalkan diri ke anggota tim).",
        "question": "自己紹介の 最初に 言う 決まり文句は どれですか。",
        "translation": "Frasa pembuka resmi apa yang pertama kali diucapkan saat memulai perkenalan diri (Jikoshoukai)?",
        "wordJp": "初めまして",
        "furigana": "はじめまして",
        "options": [
          {
            "key": "A",
            "text": "初めまして (Hajimemashite - Senang berkenalan dengan Anda untuk pertama kali)"
          },
          {
            "key": "B",
            "text": "お元気ですか (Ogenki desu ka - Apa kabar)"
          },
          {
            "key": "C",
            "text": "久しぶりです (Hisashiburi desu - Sudah lama tidak bertemu)"
          },
          {
            "key": "D",
            "text": "いらっしゃいませ (Irasshaimase - Selamat datang)"
          }
        ],
        "correctKey": "A",
        "explanation": "Dalam perkenalan resmi Jepang (JF Standard), kalimat pertama wajib diawali dengan 「初めまして」(Hajimemashite)."
      },
      {
        "id": 5,
        "category": "Situasional",
        "passage": "状況：自己紹介を終えて、最後にチームへの協力を丁寧にお願いします。\n(Situasi: Menyelesaikan perkenalan diri dan memohon kerja sama yang baik dengan rekan kerja).",
        "question": "自己紹介の 最後に 結びとして 言う 適切な 表現は？",
        "translation": "Kalimat penutup etika apa yang digunakan di akhir perkenalan untuk memohon kerja sama tim?",
        "wordJp": "よろしくお願いいたします",
        "furigana": "よろしくおねがいいたします",
        "options": [
          {
            "key": "A",
            "text": "どうぞ よろしく お願いいたします (Mohon bimbingan dan kerja samanya)"
          },
          {
            "key": "B",
            "text": "じゃあ、またね (Kalau begitu sampai jumpa ya)"
          },
          {
            "key": "C",
            "text": "ごめんなさい (Maafkan saya)"
          },
          {
            "key": "D",
            "text": "いいえ、けっこうです (Tidak, terima kasih)"
          }
        ],
        "correctKey": "A",
        "explanation": "Standar etika tempat kerja ditutup dengan permohonan bimbingan: 「どうぞよろしくお願いいたします」。"
      },
      {
        "id": 6,
        "category": "Situasional",
        "passage": "状況：上司の部屋に入るとき、ドアを3回ノックしました。ドアを開けるときに何と言いますか。\n(Situasi: Hendak masuk ruang atasan, mengetuk pintu 3 kali. Apa yang diucapkan saat membuka pintu?)",
        "question": "上司の 部屋に 入るときに 言う 言葉は どれですか。",
        "translation": "Ucapan apa yang diucapkan saat membuka pintu untuk memasuki ruangan pimpinan?",
        "wordJp": "失礼いたします",
        "furigana": "しつれいいたします",
        "options": [
          {
            "key": "A",
            "text": "失礼いたします (Shitsurei itashimasu - Permisi / Maaf mengganggu)"
          },
          {
            "key": "B",
            "text": "ごめんください (Permisi rumah orang)"
          },
          {
            "key": "C",
            "text": "こんにちは (Halo siang santai)"
          },
          {
            "key": "D",
            "text": "入りますよ (Saya mau masuk nih)"
          }
        ],
        "correctKey": "A",
        "explanation": "Etika bisnis Jepang mewajibkan mengucapkan 「失礼いたします」 saat memasuki ruangan atasan atau klien."
      },
      {
        "id": 7,
        "category": "Situasional",
        "passage": "状況：上司との面談が終わり、部屋を退出します。一礼して何と言いますか。\n(Situasi: Percakapan dengan atasan selesai, hendak keluar ruangan sambil membungkuk hormat).",
        "question": "部屋を 退出する ときに 言う 適切な 表現は どれですか。",
        "translation": "Ucapan apa yang diucapkan saat berpamitan keluar dari ruangan atasan setelah urusan selesai?",
        "wordJp": "失礼いたしました",
        "furigana": "しつれいいたしました",
        "options": [
          {
            "key": "A",
            "text": "失礼いたしました (Shitsurei itashimashita - Terima kasih atas waktunya, saya permisi)"
          },
          {
            "key": "B",
            "text": "バイバイ (Daa-dah)"
          },
          {
            "key": "C",
            "text": "さようなら (Selamat tinggal selamanya)"
          },
          {
            "key": "D",
            "text": "また今度 (Lain kali saja ya)"
          }
        ],
        "correctKey": "A",
        "explanation": "Bentuk lampau sopan 「失礼いたしました」 diucapkan saat undur diri setelah selesai berbicara dengan atasan."
      },
      {
        "id": 8,
        "category": "Situasional",
        "passage": "状況：重い荷物を運んでいるとき、同僚が手伝ってくれました。\n(Situasi: Saat Anda membawa barang muatan berat, rekan kerja datang membantu Anda).",
        "question": "手伝って くれた 同僚に 対して 言う 感謝の 言葉は？",
        "translation": "Ucapan terima kasih apa yang tepat disampaikan kepada rekan kerja yang baru saja membantu Anda?",
        "wordJp": "ありがとうございます",
        "furigana": "ありがとうございます",
        "options": [
          {
            "key": "A",
            "text": "手伝ってくれて ありがとうございます (Terima kasih banyak atas bantuannya)"
          },
          {
            "key": "B",
            "text": "どういたしまして"
          },
          {
            "key": "C",
            "text": "ごめんなさい"
          },
          {
            "key": "D",
            "text": "お粗末様でした"
          }
        ],
        "correctKey": "A",
        "explanation": "Ucapan terima kasih tulus di tempat kerja adalah 「手伝ってくれてありがとうございます」 atau 「助かりました」."
      },
      {
        "id": 9,
        "category": "Situasional",
        "passage": "状況：通路を歩いていて、書類を持っている同僚の前を横切らなければなりません。\n(Situasi: Berjalan di lorong kantor dan harus lewat memotong di depan rekan kerja yang membawa berkas).",
        "question": "人の 前を 通る ときに かける 適切な 言葉は どれですか。",
        "translation": "Kata apa yang diucapkan saat permisi melintas tepat di depan seseorang?",
        "wordJp": "失礼します / 前を通ります",
        "furigana": "しつれいします / まえをとおリます",
        "options": [
          {
            "key": "A",
            "text": "前を失礼します (Maaf permisi lewat di depan Anda)"
          },
          {
            "key": "B",
            "text": "邪魔です (Anda menghalangi)"
          },
          {
            "key": "C",
            "text": "どいてください (Minggir tolong)"
          },
          {
            "key": "D",
            "text": "何ですか (Ada apa)"
          }
        ],
        "correctKey": "A",
        "explanation": "Ucapkan 「前を失礼します」 atau 「すみません」 sambil sedikit membungkukkan badan saat melintas."
      },
      {
        "id": 10,
        "category": "Situasional",
        "passage": "状況：同僚の机のペンを落としてしまいました。すぐに何と言いますか。\n(Situasi: Tidak sengaja menyenggol pulpen milik rekan kerja hingga terjatuh ke lantai).",
        "question": "物を 落として しまったとき、最初に 言う 謝罪の 言葉は？",
        "translation": "Kata maaf spontan apa yang pertama kali diucapkan saat melakukan kekeliruan kecil?",
        "wordJp": "すみません",
        "furigana": "すみません",
        "options": [
          {
            "key": "A",
            "text": "すみません！すぐに 拾います (Maaf! Segera saya ambilkan)"
          },
          {
            "key": "B",
            "text": "あなたの せいです (Salah Anda)"
          },
          {
            "key": "C",
            "text": "気に しないで ください (Tidak usah dipikirkan)"
          },
          {
            "key": "D",
            "text": "大丈夫でした (Saya baik-baik saja)"
          }
        ],
        "correctKey": "A",
        "explanation": "Permintaan maaf sopan langsung 「すみません」 diiringi tindakan bertanggung jawab (すぐに拾います)."
      },
      {
        "id": 11,
        "category": "Situasional",
        "passage": "状況：先輩がたくさんの書類を抱えて大変そうです。\n(Situasi: Senior terlihat kewalahan membawa tumpukan dokumen banyak).",
        "question": "手助けを 申し出るときに 言う 適切な 表現は どれですか。",
        "translation": "Ungkapan inisiatif apa yang diucapkan saat menawarkan bantuan kepada senior?",
        "wordJp": "手伝いましょうか",
        "furigana": "てつだいましょうか",
        "options": [
          {
            "key": "A",
            "text": "先輩、何か お手伝いしましょうか (Senior, boleh saya bantu?)"
          },
          {
            "key": "B",
            "text": "重いですね、頑張って (Berat ya, semangat)"
          },
          {
            "key": "C",
            "text": "私には 関係ありません (Bukan urusan saya)"
          },
          {
            "key": "D",
            "text": "落とさないでね (Jangan dijatuhkan ya)"
          }
        ],
        "correctKey": "A",
        "explanation": "Menawarkan bantuan dengan sopan menggunakan pola [Kata Kerja masyu] + か: 「お手伝いしましょうか」。"
      },
      {
        "id": 12,
        "category": "Situasional",
        "passage": "状況：上司から「この資料をコピーしておいてください」と指示されました。\n(Situasi: Atasan memberikan instruksi: \"Tolong fotokopikan dokumen ini\").",
        "question": "上司の 指示を 引き受ける ときの 正しい 返事は どれですか。",
        "translation": "Jawaban sigap dan formal apa yang diucapkan saat menerima instruksi kerja dari pimpinan?",
        "wordJp": "かしこまりました",
        "furigana": "かしこまりました",
        "options": [
          {
            "key": "A",
            "text": "かしこまりました (Baik, segera saya laksanakan)"
          },
          {
            "key": "B",
            "text": "オッケーです (Oke deh)"
          },
          {
            "key": "C",
            "text": "たぶん できます (Mungkin bisa)"
          },
          {
            "key": "D",
            "text": "うん、わかった (Ya, ngerti)"
          }
        ],
        "correctKey": "A",
        "explanation": "Standar etika bisnis Jepang menggunakan 「かしこまりました」 atau 「承知いたしました」 (bukan ungkapan santai)."
      },
      {
        "id": 13,
        "category": "Situasional",
        "passage": "状況：12時になり、昼休みに出かけます。事務所の同僚に声をかけます。\n(Situasi: Jam 12:00 siang tiba, hendak keluar kantor untuk istirahat makan siang).",
        "question": "昼休みに 出かける ときに 言う 挨拶は どれですか。",
        "translation": "Ucapan pamit apa yang disampaikan kepada rekan kerja sebelum keluar untuk istirahat siang?",
        "wordJp": "お昼休憩に行ってきます",
        "furigana": "おひるきゅうけいにいってきます",
        "options": [
          {
            "key": "A",
            "text": "お昼休憩に 行ってきます (Saya izin keluar istirahat makan siang dulu)"
          },
          {
            "key": "B",
            "text": "さようなら、バイバイ"
          },
          {
            "key": "C",
            "text": "いただきます"
          },
          {
            "key": "D",
            "text": "ただいま"
          }
        ],
        "correctKey": "A",
        "explanation": "Saat meninggalkan meja kerja untuk istirahat: 「お昼休憩に行ってきます」."
      },
      {
        "id": 14,
        "category": "Situasional",
        "passage": "状況：昼休みが終わって、事務所の自分のデスクに戻ってきました。\n(Situasi: Selesai istirahat siang dan kembali masuk ke ruangan kerja kantor).",
        "question": "休憩から 戻った ときに 言う 挨拶は どれですか。",
        "translation": "Salam apa yang diucapkan saat kembali ke meja kantor setelah jam istirahat selesai?",
        "wordJp": "戻りました",
        "furigana": "もどリました",
        "options": [
          {
            "key": "A",
            "text": "ただいま 戻りました (Saya sudah kembali di tempat)"
          },
          {
            "key": "B",
            "text": "おかえりなさい"
          },
          {
            "key": "C",
            "text": "ごちそうさまでした"
          },
          {
            "key": "D",
            "text": "おやすみなさい"
          }
        ],
        "correctKey": "A",
        "explanation": "Karyawan yang baru kembali dari luar/istirahat mengabarkan: 「ただいま戻りました」."
      },
      {
        "id": 15,
        "category": "Situasional",
        "passage": "状況：オフィスの電話が鳴ったので受話器を取りました。\n(Situasi: Telepon kantor berdering dan Anda mengangkat gagang telepon).",
        "question": "会社の 電話を 取ったとき、最初に 言う 決まり文句は？",
        "translation": "Kalimat standar apa yang pertama kali diucapkan saat menerima telepon kantor?",
        "wordJp": "お電話ありがとうございます",
        "furigana": "おでんわありがとうございます",
        "options": [
          {
            "key": "A",
            "text": "はい、〇〇会社で ございます (Ya, dengan Perusahaan XX di sini)"
          },
          {
            "key": "B",
            "text": "もしもし、誰ですか (Halo, siapa ini?)"
          },
          {
            "key": "C",
            "text": "要件を どうぞ (Silakan sebut perlunya)"
          },
          {
            "key": "D",
            "text": "今 忙しいです (Sekarang lagi sibuk)"
          }
        ],
        "correctKey": "A",
        "explanation": "Menerima telepon bisnis di Jepang tidak boleh memakai 「もしもし」, wajib menyebut identitas perusahaan: 「はい、〇〇会社でございます」。"
      },
      {
        "id": 16,
        "category": "Situasional",
        "passage": "状況：上司に業務の相談をしたいですが、上司はパソコン作業をしています。\n(Situasi: Ingin berkonsultasi mengenai tugas, namun atasan sedang menatap layar komputer).",
        "question": "話しかける 前に 確認する 丁寧な 前置きの 言葉は？",
        "translation": "Kalimat permisi apa yang digunakan untuk memastikan apakah atasan sedang memiliki waktu luang?",
        "wordJp": "今、少しお時間よろしいでしょうか",
        "furigana": "いま、すこしおじかんよろしいでしょうか",
        "options": [
          {
            "key": "A",
            "text": "部長、今 少し お時間 よろしいでしょうか (Apakah Anda punya waktu sebentar?)"
          },
          {
            "key": "B",
            "text": "ねえ、ちょっと 聞いて (Hei, coba dengar sebentar)"
          },
          {
            "key": "C",
            "text": "手をとめて ください (Hentikan tangan Anda)"
          },
          {
            "key": "D",
            "text": "暇ですか (Lagi nganggur ya?)"
          }
        ],
        "correctKey": "A",
        "explanation": "Etika konsultasi (Hou-Ren-So): selalu meminta izin ketersediaan waktu: 「今、少しお時間よろしいでしょうか」。"
      },
      {
        "id": 17,
        "category": "Situasional",
        "passage": "状況：お客様から質問を受けましたが、担当者が席を外しているため確認が必要です。\n(Situasi: Klien bertanya mengenai rincian berkas, namun penanggung jawab sedang di luar ruangan).",
        "question": "相手に 少し 待って もらう ときに 言う 正しい 表現は？",
        "translation": "Ungkapan sopan bisnis apa yang diucapkan saat meminta tamu atau klien menunggu sejenak?",
        "wordJp": "少々お待ちください",
        "furigana": "しょうしょうおまちください",
        "options": [
          {
            "key": "A",
            "text": "少々 お待ち ください (Mohon ditunggu sebentar)"
          },
          {
            "key": "B",
            "text": "ちょっと 待って (Tunggu bentar ya)"
          },
          {
            "key": "C",
            "text": "待て (Tunggu - kasar)"
          },
          {
            "key": "D",
            "text": "あとで 来て (Nanti saja datang lagi)"
          }
        ],
        "correctKey": "A",
        "explanation": "Bentuk keigo permohonan menunggu kepada klien/rekan: 「少々お待ちください」."
      },
      {
        "id": 18,
        "category": "Situasional",
        "passage": "状況：確認に5分ほどかかり、待たせていたお客様のところへ戻りました。\n(Situasi: Pengecekan butuh waktu 5 menit, dan Anda kembali menemui klien yang tadi menunggu).",
        "question": "待たせた 相手に 対して 最初に 言う 丁寧な 言葉は？",
        "translation": "Kata pembuka sopan apa yang diucapkan saat kembali menghampiri klien setelah membuatnya menunggu?",
        "wordJp": "大変お待たせいたしました",
        "furigana": "たいへんおまたせいたしました",
        "options": [
          {
            "key": "A",
            "text": "大変 お待たせ いたしました (Mohon maaf telah membuat Anda menunggu lama)"
          },
          {
            "key": "B",
            "text": "待ったかいがありましたね (Penantian Anda tidak sia-sia kan)"
          },
          {
            "key": "C",
            "text": "遅くなりましたが 何か (Saya telat, ada masalah?)"
          },
          {
            "key": "D",
            "text": "どういたしまして"
          }
        ],
        "correctKey": "A",
        "explanation": "Selalu awali dengan permintaan maaf atas waktu menunggu: 「大変お待たせいたしました」."
      },
      {
        "id": 19,
        "category": "Situasional",
        "passage": "状況：金曜日の夕方、今日の業務と今週の勤務がすべて終了しました。\n(Situasi: Jumat sore, seluruh jam kerja hari ini dan minggu ini telah selesai).",
        "question": "週末に 入る 前に 同僚同士で 交わす 挨拶は どれですか。",
        "translation": "Salam etika apa yang diucapkan bersama rekan kerja menjelang libur akhir pekan pada Jumat sore?",
        "wordJp": "よい週末を / 今週もお疲れ様でした",
        "furigana": "よいしゅうまつを / こんしゅうもおつかれさまでした",
        "options": [
          {
            "key": "A",
            "text": "今週も お疲れ様でした。良い 週末を！ (Terima kasih atas kerja keras minggu ini, selamat berakhir pekan!)"
          },
          {
            "key": "B",
            "text": "あけましておめでとうございます (Selamat tahun baru)"
          },
          {
            "key": "C",
            "text": "さようなら、もう 会いません"
          },
          {
            "key": "D",
            "text": "ごちそうさまでした"
          }
        ],
        "correctKey": "A",
        "explanation": "Di akhir pekan kerja: 「今週もお疲れ様でした。良い週末をお過ごしください」."
      },
      {
        "id": 20,
        "category": "Situasional",
        "passage": "状況：体調が悪く、熱があります。朝、会社に休みの連絡を電話で入れます。\n(Situasi: Badan kurang sehat dan demam. Pagi hari menelepon kantor untuk izin tidak masuk kerja).",
        "question": "体調不良で 会社を 休む 旨を 伝える 適切な 言葉は？",
        "translation": "Bagaimanakah kalimat izin sakit yang sopan saat menelepon pimpinan kantor pada pagi hari?",
        "wordJp": "本日はお休みをいただいてもよろしいでしょうか",
        "furigana": "ほんじつはおやすみをいただいてもよろしいでしょうか",
        "options": [
          {
            "key": "A",
            "text": "熱が ありますので、本日は お休みを いただいても よろしいでしょうか (Karena demam, apakah boleh saya izin beristirahat hari ini?)"
          },
          {
            "key": "B",
            "text": "今日 休むから よろしく (Hari ini saya libur ya, bereskan)"
          },
          {
            "key": "C",
            "text": "会社に 行きたく ありません (Saya malas ke kantor)"
          },
          {
            "key": "D",
            "text": "病気だから 電話 切りまーす (Sakit nih, tutup telepon ya)"
          }
        ],
        "correctKey": "A",
        "explanation": "Menyampaikan izin sakit secara profesional dengan menjelaskan kondisi singkat dan memohon izin: 「お休みをいただいてもよろしいでしょうか」。"
      }
    ],
    "studentSubmissions": [
      {
        "studentId": 101,
        "studentName": "Khalis Soffi",
        "email": "khalis.soffi@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        "score": 95,
        "submittedAt": "21 Nov 2026, 10:15 WIB",
        "status": "graded",
        "feedback": "Penguasaan 20 situasi aisatsu dan etika kerja Jepang sangat luar biasa dan memuaskan!"
      },
      {
        "studentId": 102,
        "studentName": "Dimas Aditya",
        "email": "dimas.aditya@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face",
        "score": 90,
        "submittedAt": "21 Nov 2026, 11:30 WIB",
        "status": "graded",
        "feedback": "Sangat baik! Tingkatkan pemahaman pada respon saat menerima telepon kantor."
      }
    ]
  },
  {
    "id": 2,
    "title": "Quiz N5 – Kosakata & Kanji Tempat Kerja (Takoboto & JLPT N5)",
    "bab": "Bab 2 – Moji/Goi Tempat Kerja",
    "level": "N5",
    "classRoom": "N5 Pagi",
    "curriculumSource": "JLPT Official N5",
    "category": "Vocabulary",
    "categoryLabel": "🔤 Vocabulary (文字・語彙)",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "25:00",
    "durationMinutes": 25,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "quiz_sheet",
    "badgeColor": "bg-blue-50 text-blue-700",
    "submissionsCount": 2,
    "totalStudents": 2,
    "questions": [
      {
        "id": 1,
        "category": "Vocabulary",
        "question": "「あさ」の かんじは どれですか。",
        "translation": "Manakah kanji yang tepat untuk kosakata \"asa\" (pagi)?",
        "wordJp": "朝",
        "furigana": "あさ",
        "options": [
          {
            "key": "A",
            "text": "朝 (Asa - Pagi)"
          },
          {
            "key": "B",
            "text": "昼 (Hiru - Siang)"
          },
          {
            "key": "C",
            "text": "夜 (Yoru - Malam)"
          },
          {
            "key": "D",
            "text": "夕 (Yuu - Sore)"
          }
        ],
        "correctKey": "A",
        "explanation": "Kanji 「朝」 dibaca 「あさ」(asa) yang berarti pagi hari."
      },
      {
        "id": 2,
        "category": "Vocabulary",
        "question": "「かいしゃ」の かんじの 正しい 書き方は どれですか。",
        "translation": "Manakah penulisan kanji yang benar untuk \"kaisha\" (perusahaan)?",
        "wordJp": "会社",
        "furigana": "かいしゃ",
        "options": [
          {
            "key": "A",
            "text": "会社 (Kaisha - Perusahaan)"
          },
          {
            "key": "B",
            "text": "社会 (Shakai - Masyarakat)"
          },
          {
            "key": "C",
            "text": "教会 (Kyoukai - Gereja)"
          },
          {
            "key": "D",
            "text": "会合 (Kaigou - Pertemuan)"
          }
        ],
        "correctKey": "A",
        "explanation": "Menurut kamus Takoboto.jp, 「会社」 terdiri dari 会 (bertemu) dan 社 (tempat kerja/perusahaan)."
      },
      {
        "id": 3,
        "category": "Vocabulary",
        "question": "「はたらきます」の 意味は どれですか。",
        "translation": "Apakah arti dari kata kerja \"hatarakimasu\"?",
        "wordJp": "働きます",
        "furigana": "はたらきます",
        "options": [
          {
            "key": "A",
            "text": "Bekerja (To work)"
          },
          {
            "key": "B",
            "text": "Belajar (To study)"
          },
          {
            "key": "C",
            "text": "Istirahat (To rest)"
          },
          {
            "key": "D",
            "text": "Tidur (To sleep)"
          }
        ],
        "correctKey": "A",
        "explanation": "Kata kerja 「働きます」(hatarakimasu) bermakna bekerja atau menjalankan profesi."
      },
      {
        "id": 4,
        "category": "Vocabulary",
        "question": "「じむしょ」の 意味として 最も 適切な 場所は？",
        "translation": "Pilihlah makna tempat yang tepat untuk kosakata \"jimusho\".",
        "wordJp": "事務所",
        "furigana": "じむしょ",
        "options": [
          {
            "key": "A",
            "text": "Kantor / Ruang administrasi kerja"
          },
          {
            "key": "B",
            "text": "Kamar mandi"
          },
          {
            "key": "C",
            "text": "Gudang barang luar"
          },
          {
            "key": "D",
            "text": "Stasiun kereta api"
          }
        ],
        "correctKey": "A",
        "explanation": "事務所 (jimusho) merujuk pada ruang kantor administrasi tempat staf bekerja."
      },
      {
        "id": 5,
        "category": "Vocabulary",
        "question": "Lawan kata dari 「大きい」(ookii / besar) adalah:",
        "translation": "Pilihlah pasangan lawan kata sifat N5 yang tepat.",
        "wordJp": "小さい",
        "furigana": "ちいさい",
        "options": [
          {
            "key": "A",
            "text": "小さい (Chiisai - Kecil)"
          },
          {
            "key": "B",
            "text": "高い (Takai - Tinggi/Mahal)"
          },
          {
            "key": "C",
            "text": "新しい (Atarashii - Baru)"
          },
          {
            "key": "D",
            "text": "安い (Yasui - Murah)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pasangan antonim standar JLPT N5: 大きい (Besar) >< 小さい (Kecil)."
      },
      {
        "id": 6,
        "category": "Vocabulary",
        "question": "「ひる」の かんじは どれですか。",
        "translation": "Manakah kanji yang tepat untuk kosakata \"hiru\" (siang)?",
        "wordJp": "昼",
        "furigana": "ひる",
        "options": [
          {
            "key": "A",
            "text": "昼 (Hiru - Siang)"
          },
          {
            "key": "B",
            "text": "朝 (Asa)"
          },
          {
            "key": "C",
            "text": "晩 (Ban)"
          },
          {
            "key": "D",
            "text": "夜 (Yoru)"
          }
        ],
        "correctKey": "A",
        "explanation": "Kanji 「昼」 bermakna waktu siang hari (pukul 11.00-14.00)."
      },
      {
        "id": 7,
        "category": "Vocabulary",
        "question": "「よる」の かんじは どれですか。",
        "translation": "Manakah kanji yang tepat untuk kosakata \"yoru\" (malam)?",
        "wordJp": "夜",
        "furigana": "よる",
        "options": [
          {
            "key": "A",
            "text": "夜 (Yoru - Malam)"
          },
          {
            "key": "B",
            "text": "昼 (Hiru)"
          },
          {
            "key": "C",
            "text": "夕 (Yuu)"
          },
          {
            "key": "D",
            "text": "明 (Aki)"
          }
        ],
        "correctKey": "A",
        "explanation": "Kanji 「夜」 dibaca 「よる」(yoru) yang berarti malam hari."
      },
      {
        "id": 8,
        "category": "Vocabulary",
        "question": "「こうじょう」の かんじ表記として 正しい ものは？",
        "translation": "Pilihlah penulisan kanji yang benar untuk \"koujou\" (pabrik).",
        "wordJp": "工場",
        "furigana": "こうじょう",
        "options": [
          {
            "key": "A",
            "text": "工場 (Koujou - Pabrik/Manufaktur)"
          },
          {
            "key": "B",
            "text": "広場 (Hiroba - Alun-alun)"
          },
          {
            "key": "C",
            "text": "市場 (Ichiba - Pasar)"
          },
          {
            "key": "D",
            "text": "会場 (Kaijou - Tempat acara)"
          }
        ],
        "correctKey": "A",
        "explanation": "工場 (koujou) terdiri dari 工 (kerajinan/teknik) dan 場 (tempat)."
      },
      {
        "id": 9,
        "category": "Vocabulary",
        "question": "「かいぎしつ」は 何を する 場所ですか。",
        "translation": "Tempat apakah yang dimaksud dengan \"kaigishitsu\"?",
        "wordJp": "会議室",
        "furigana": "かいぎしつ",
        "options": [
          {
            "key": "A",
            "text": "Ruang Rapat / Ruang Pertemuan Kerja"
          },
          {
            "key": "B",
            "text": "Ruang Makan Siang"
          },
          {
            "key": "C",
            "text": "Tempat Parkir Kendaraan"
          },
          {
            "key": "D",
            "text": "Ruang Istirahat Tidur"
          }
        ],
        "correctKey": "A",
        "explanation": "会議室 (kaigishitsu) adalah ruangan tempat berlangsungnya rapat/diskusi resmi."
      },
      {
        "id": 10,
        "category": "Vocabulary",
        "question": "「しゃちょう」は 会社で どんな 役職ですか。",
        "translation": "Apakah jabatan yang dimaksud dengan \"shachou\"?",
        "wordJp": "社長",
        "furigana": "しゃちょう",
        "options": [
          {
            "key": "A",
            "text": "Direktur Utama / Pimpinan Perusahaan"
          },
          {
            "key": "B",
            "text": "Karyawan Baru Magang"
          },
          {
            "key": "C",
            "text": "Sopir Kantor"
          },
          {
            "key": "D",
            "text": "Petugas Keamanan"
          }
        ],
        "correctKey": "A",
        "explanation": "社長 (shachou) adalah pimpinan tertinggi atau presiden direktur perusahaan."
      },
      {
        "id": 11,
        "category": "Vocabulary",
        "question": "「ざんぎょう」の 意味は どれですか。",
        "translation": "Apakah makna dari kosakata \"zangyou\" di dunia kerja Jepang?",
        "wordJp": "残業",
        "furigana": "ざんぎょう",
        "options": [
          {
            "key": "A",
            "text": "Kerja Lembur (Overtime work)"
          },
          {
            "key": "B",
            "text": "Cuti Libur Tahunan"
          },
          {
            "key": "C",
            "text": "Makan Bersama Kantor"
          },
          {
            "key": "D",
            "text": "Perjalanan Bisnis Dinas"
          }
        ],
        "correctKey": "A",
        "explanation": "残業 (zangyou) adalah bekerja melebihi jam kerja normal (lembur)."
      },
      {
        "id": 12,
        "category": "Vocabulary",
        "question": "「しゅっきん」の 意味は どれですか。",
        "translation": "Apakah arti dari kosakata \"shukkin\"?",
        "wordJp": "出勤",
        "furigana": "しゅっきん",
        "options": [
          {
            "key": "A",
            "text": "Masuk Bekerja / Kehadiran Kerja"
          },
          {
            "key": "B",
            "text": "Pulang dari Kantor"
          },
          {
            "key": "C",
            "text": "Mengambil Uang di Bank"
          },
          {
            "key": "D",
            "text": "Mengundurkan Diri"
          }
        ],
        "correctKey": "A",
        "explanation": "出勤 (shukkin) bermakna hadir dan mulai bekerja di tempat tugas."
      },
      {
        "id": 13,
        "category": "Vocabulary",
        "question": "「たいきん」の 意味は どれですか。",
        "translation": "Apakah arti dari lawan kata shukkin yaitu \"taikin\"?",
        "wordJp": "退勤",
        "furigana": "たいきん",
        "options": [
          {
            "key": "A",
            "text": "Selesai Bekerja / Pulang Kerja"
          },
          {
            "key": "B",
            "text": "Istirahat Makan Siang"
          },
          {
            "key": "C",
            "text": "Mulai Masuk Pagi"
          },
          {
            "key": "D",
            "text": "Pindah Cabang Perusahaan"
          }
        ],
        "correctKey": "A",
        "explanation": "退勤 (taikin) adalah meninggalkan tempat kerja setelah jam dinas selesai."
      },
      {
        "id": 14,
        "category": "Vocabulary",
        "question": "「きゅうりょう」の 意味は どれですか。",
        "translation": "Apakah arti dari istilah \"kyuuryou\"?",
        "wordJp": "給料",
        "furigana": "きゅうりょう",
        "options": [
          {
            "key": "A",
            "text": "Gaji / Upah Kerja (Salary)"
          },
          {
            "key": "B",
            "text": "Uang Makan Harian"
          },
          {
            "key": "C",
            "text": "Biaya Sewa Apartemen"
          },
          {
            "key": "D",
            "text": "Pajak Kendaraan"
          }
        ],
        "correctKey": "A",
        "explanation": "給料 (kyuuryou) berarti gaji atau imbalan uang atas pekerjaan yang dilakukan."
      },
      {
        "id": 15,
        "category": "Vocabulary",
        "question": "「やすみます」の 意味として 適切な ものは？",
        "translation": "Apakah arti dari kata kerja \"yasumimasu\"?",
        "wordJp": "休みます",
        "furigana": "やすみます",
        "options": [
          {
            "key": "A",
            "text": "Beristirahat / Mengambil Libur"
          },
          {
            "key": "B",
            "text": "Mulai Bekerja Keras"
          },
          {
            "key": "C",
            "text": "Berlari Cepat"
          },
          {
            "key": "D",
            "text": "Membeli Barang"
          }
        ],
        "correctKey": "A",
        "explanation": "休みます (yasumimasu) berarti beristirahat atau tidak masuk kerja/sekolah."
      },
      {
        "id": 16,
        "category": "Vocabulary",
        "question": "「でんしゃ」の かんじは どれですか。",
        "translation": "Manakah penulisan kanji untuk \"densha\" (kereta listrik)?",
        "wordJp": "電車",
        "furigana": "でんしゃ",
        "options": [
          {
            "key": "A",
            "text": "電車 (Densha - Kereta listrik)"
          },
          {
            "key": "B",
            "text": "自転車 (Jitensha - Sepeda)"
          },
          {
            "key": "C",
            "text": "自動車 (Jidousha - Mobil)"
          },
          {
            "key": "D",
            "text": "飛行機 (Hikouki - Pesawat)"
          }
        ],
        "correctKey": "A",
        "explanation": "電車 (densha) terdiri dari 電 (listrik) dan 車 (kendaraan/kereta)."
      },
      {
        "id": 17,
        "category": "Vocabulary",
        "question": "「じかん」の かんじ表記は どれですか。",
        "translation": "Manakah kanji yang tepat untuk kata \"jikan\" (waktu / durasi jam)?",
        "wordJp": "時間",
        "furigana": "じかん",
        "options": [
          {
            "key": "A",
            "text": "時間 (Jikan - Waktu)"
          },
          {
            "key": "B",
            "text": "時限 (Jigen)"
          },
          {
            "key": "C",
            "text": "時刻 (Jikoku)"
          },
          {
            "key": "D",
            "text": "時代 (Jidai)"
          }
        ],
        "correctKey": "A",
        "explanation": "時間 (jikan) menyatakan durasi atau waktu secara umum."
      },
      {
        "id": 18,
        "category": "Vocabulary",
        "question": "「しょるい」の 意味は どれですか。",
        "translation": "Apakah arti dari kosakata kantor \"shorui\"?",
        "wordJp": "書類",
        "furigana": "しょるい",
        "options": [
          {
            "key": "A",
            "text": "Berkas Dokumen / Arsip Kertas"
          },
          {
            "key": "B",
            "text": "Alat Tulis Kantor"
          },
          {
            "key": "C",
            "text": "Meja dan Kursi Kerja"
          },
          {
            "key": "D",
            "text": "Peralatan Listrik"
          }
        ],
        "correctKey": "A",
        "explanation": "書類 (shorui) berarti dokumen atau surat-surat resmi perkantoran."
      },
      {
        "id": 19,
        "category": "Vocabulary",
        "question": "「でんわ」の かんじ表記は どれですか。",
        "translation": "Manakah kanji yang tepat untuk \"denwa\" (telepon)?",
        "wordJp": "電話",
        "furigana": "でんわ",
        "options": [
          {
            "key": "A",
            "text": "電話 (Denwa - Telepon)"
          },
          {
            "key": "B",
            "text": "電力 (Denryoku)"
          },
          {
            "key": "C",
            "text": "会話 (Kaiwa)"
          },
          {
            "key": "D",
            "text": "世話 (Sewa)"
          }
        ],
        "correctKey": "A",
        "explanation": "電話 (denwa) terdiri dari 電 (listrik) dan 話 (bicara)."
      },
      {
        "id": 20,
        "category": "Vocabulary",
        "question": "「せんぱい」と 対になる、後から 入社した 人を 指す 言葉は？",
        "translation": "Apakah istilah untuk lawan kata dari Senpai (junior yang masuk belakangan)?",
        "wordJp": "後輩",
        "furigana": "こうはい",
        "options": [
          {
            "key": "A",
            "text": "後輩 (Kouhai - Junior)"
          },
          {
            "key": "B",
            "text": "同僚 (Douryou - Rekan sejawat)"
          },
          {
            "key": "C",
            "text": "上司 (Joushi - Atasan)"
          },
          {
            "key": "D",
            "text": "部下 (Buka - Bawahan)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pasangan hirarki kerja di Jepang: 先輩 (Senpai - Senior) >< 後輩 (Kouhai - Junior)."
      }
    ],
    "studentSubmissions": [
      {
        "studentId": 101,
        "studentName": "Khalis Soffi",
        "email": "khalis.soffi@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        "score": 90,
        "submittedAt": "21 Nov 2026, 13:10 WIB",
        "status": "graded",
        "feedback": "Penguasaan 20 kosakata kanji tempat kerja sangat baik!"
      },
      {
        "studentId": 102,
        "studentName": "Dimas Aditya",
        "email": "dimas.aditya@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face",
        "score": 85,
        "submittedAt": "21 Nov 2026, 14:00 WIB",
        "status": "graded",
        "feedback": "Bagus, perhatikan perbedaan kanji 出勤 (shukkin) dan 退勤 (taikin)."
      }
    ]
  },
  {
    "id": 3,
    "title": "Quiz N5 – Pola Partikel & Jadwal Harian (JLPT Official N5)",
    "bab": "Bab 3 – Bunpou & Partikel",
    "level": "N5",
    "classRoom": "N5 Pagi",
    "curriculumSource": "JLPT Official N5",
    "category": "Grammar",
    "categoryLabel": "✏️ Grammar (文法)",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "25:00",
    "durationMinutes": 25,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "kyoto_street",
    "badgeColor": "bg-emerald-50 text-emerald-700",
    "submissionsCount": 2,
    "totalStudents": 2,
    "questions": [
      {
        "id": 1,
        "category": "Grammar",
        "question": "わたしは 毎朝 8時（　）会社へ 行きます。",
        "translation": "Pilihlah partikel penunjuk titik waktu yang tepat.",
        "wordJp": "に",
        "furigana": "に",
        "options": [
          {
            "key": "A",
            "text": "に (ni - Partikel penanda waktu pasti)"
          },
          {
            "key": "B",
            "text": "で (de)"
          },
          {
            "key": "C",
            "text": "を (wo)"
          },
          {
            "key": "D",
            "text": "と (to)"
          }
        ],
        "correctKey": "A",
        "explanation": "Waktu spesifik yang memiliki angka (8時) wajib disertai partikel penanda waktu 「に」(ni)."
      },
      {
        "id": 2,
        "category": "Grammar",
        "question": "電車（　）会社へ 行きます。",
        "translation": "Pilihlah partikel penanda sarana transportasi yang tepat.",
        "wordJp": "で",
        "furigana": "で",
        "options": [
          {
            "key": "A",
            "text": "で (de - Menggunakan sarana kereta)"
          },
          {
            "key": "B",
            "text": "に (ni)"
          },
          {
            "key": "C",
            "text": "へ (he)"
          },
          {
            "key": "D",
            "text": "から (kara)"
          }
        ],
        "correctKey": "A",
        "explanation": "Partikel 「で」(de) digunakan untuk menandai sarana transportasi atau alat yang dipakai."
      },
      {
        "id": 3,
        "category": "Grammar",
        "question": "事務所で 今日の 作業報告（　）書きます。",
        "translation": "Pilihlah partikel penanda objek kerja yang sedang ditulis.",
        "wordJp": "を",
        "furigana": "を",
        "options": [
          {
            "key": "A",
            "text": "を (wo - Penanda objek penderita)"
          },
          {
            "key": "B",
            "text": "が (ga)"
          },
          {
            "key": "C",
            "text": "に (ni)"
          },
          {
            "key": "D",
            "text": "も (mo)"
          }
        ],
        "correctKey": "A",
        "explanation": "Objek langsung dari kata kerja transitif (書きます) ditandai dengan partikel 「を」(wo)."
      },
      {
        "id": 4,
        "category": "Grammar",
        "question": "会議は 10時から 11時（　）行われます。",
        "translation": "Pilihlah partikel penunjuk batas akhir rentang waktu (sampai).",
        "wordJp": "まで",
        "furigana": "まで",
        "options": [
          {
            "key": "A",
            "text": "まで (made - Sampai)"
          },
          {
            "key": "B",
            "text": "から (kara - Dari)"
          },
          {
            "key": "C",
            "text": "より (yori)"
          },
          {
            "key": "D",
            "text": "ごろ (goro)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pasangan pola rentang waktu: [Waktu Mulai] + から + [Waktu Selesai] + まで."
      },
      {
        "id": 5,
        "category": "Grammar",
        "question": "きのう、同僚の 田中さん（　）相談しました。",
        "translation": "Pilihlah partikel penanda lawan bicara / mitra konsultasi.",
        "wordJp": "と",
        "furigana": "と",
        "options": [
          {
            "key": "A",
            "text": "と (to - Bersama / Dengan)"
          },
          {
            "key": "B",
            "text": "へ (he)"
          },
          {
            "key": "C",
            "text": "を (wo)"
          },
          {
            "key": "D",
            "text": "で (de)"
          }
        ],
        "correctKey": "A",
        "explanation": "Berkonsultasi bersama seseorang menggunakan partikel 「と」(to) atau 「に」(ni)."
      },
      {
        "id": 6,
        "category": "Grammar",
        "question": "わたし（　）インドネシアから 来ました。",
        "translation": "Pilihlah partikel penanda subjek / topik pembicaraan diri sendiri.",
        "wordJp": "は",
        "furigana": "は",
        "options": [
          {
            "key": "A",
            "text": "は (wa - Penanda topik)"
          },
          {
            "key": "B",
            "text": "を (wo)"
          },
          {
            "key": "C",
            "text": "に (ni)"
          },
          {
            "key": "D",
            "text": "で (de)"
          }
        ],
        "correctKey": "A",
        "explanation": "Topik utama kalimat ditandai dengan partikel 「は」(dibaca wa)."
      },
      {
        "id": 7,
        "category": "Grammar",
        "question": "午後から 第2工場（　）行きます。",
        "translation": "Pilihlah partikel penunjuk arah tujuan pergi.",
        "wordJp": "へ",
        "furigana": "へ",
        "options": [
          {
            "key": "A",
            "text": "へ (he/e - Menuju ke)"
          },
          {
            "key": "B",
            "text": "を (wo)"
          },
          {
            "key": "C",
            "text": "で (de)"
          },
          {
            "key": "D",
            "text": "から (kara)"
          }
        ],
        "correctKey": "A",
        "explanation": "Arah pergerakan tujuan kata kerja 行きます ditandai dengan partikel 「へ」(dibaca e)."
      },
      {
        "id": 8,
        "category": "Grammar",
        "question": "休憩室（　）お弁当を 食べます。",
        "translation": "Pilihlah partikel penanda tempat dilakukannya suatu aktivitas.",
        "wordJp": "で",
        "furigana": "で",
        "options": [
          {
            "key": "A",
            "text": "で (de - Tempat aktivitas berlangsung)"
          },
          {
            "key": "B",
            "text": "に (ni)"
          },
          {
            "key": "C",
            "text": "へ (he)"
          },
          {
            "key": "D",
            "text": "を (wo)"
          }
        ],
        "correctKey": "A",
        "explanation": "Tempat terjadinya suatu aksi aktif (makan bento) memakai partikel 「で」(de)."
      },
      {
        "id": 9,
        "category": "Grammar",
        "question": "山田さんも 会議に 出席しますか。はい、田中さん（　）出席します。",
        "translation": "Pilihlah partikel penanda kesamaan makna (juga).",
        "wordJp": "も",
        "furigana": "も",
        "options": [
          {
            "key": "A",
            "text": "も (mo - Juga)"
          },
          {
            "key": "B",
            "text": "は (wa)"
          },
          {
            "key": "C",
            "text": "の (no)"
          },
          {
            "key": "D",
            "text": "が (ga)"
          }
        ],
        "correctKey": "A",
        "explanation": "Partikel 「も」(mo) menggantikan partikel topik bila maknanya adalah 'juga/pun'."
      },
      {
        "id": 10,
        "category": "Grammar",
        "question": "これは 社長（　）パソコンです。",
        "translation": "Pilihlah partikel penghubung kepemilikan dua kata benda.",
        "wordJp": "の",
        "furigana": "の",
        "options": [
          {
            "key": "A",
            "text": "の (no - Kepemilikan)"
          },
          {
            "key": "B",
            "text": "に (ni)"
          },
          {
            "key": "C",
            "text": "と (to)"
          },
          {
            "key": "D",
            "text": "で (de)"
          }
        ],
        "correctKey": "A",
        "explanation": "Partikel 「の」(no) menghubungkan pemilik dengan benda yang dimiliki (laptop milik Direktur)."
      },
      {
        "id": 11,
        "category": "Grammar",
        "question": "一緒に 社員食堂で 昼ご飯を 食べ（　）。",
        "translation": "Pilihlah bentuk kalimat ajakan sopan (~maukah makan bersama?).",
        "wordJp": "ませんか",
        "furigana": "ませんか",
        "options": [
          {
            "key": "A",
            "text": "ませんか (masen ka - Bentuk ajakan sopan)"
          },
          {
            "key": "B",
            "text": "ました (sudah makan)"
          },
          {
            "key": "C",
            "text": "ません (tidak makan)"
          },
          {
            "key": "D",
            "text": "ますか (apakah kamu makan)"
          }
        ],
        "correctKey": "A",
        "explanation": "Bentuk [Kata Kerja masen] + か (食べませんか) digunakan untuk mengajak lawan bicara secara sopan."
      },
      {
        "id": 12,
        "category": "Grammar",
        "question": "A:「10時に 休憩しましょう。」 B:「ええ、（　）。」",
        "translation": "Pilihlah respon penerimaan ajakan yang tepat.",
        "wordJp": "そうしましょう",
        "furigana": "そうしましょう",
        "options": [
          {
            "key": "A",
            "text": "そうしましょう (Mari kita lakukan begitu)"
          },
          {
            "key": "B",
            "text": "しませんでした (Tidak melakukan)"
          },
          {
            "key": "C",
            "text": "だめです (Tidak boleh)"
          },
          {
            "key": "D",
            "text": "ごちそうさまでした"
          }
        ],
        "correctKey": "A",
        "explanation": "Menyetujui ajakan lawan bicara direspon dengan 「ええ、そうしましょう」."
      },
      {
        "id": 13,
        "category": "Grammar",
        "question": "ここに お名前を 書い（　）ください。",
        "translation": "Pilihlah bentuk konjugasi kata kerja yang tepat untuk memohon (tolong tuliskan).",
        "wordJp": "て",
        "furigana": "て",
        "options": [
          {
            "key": "A",
            "text": "て (te - Pola ~te kudasai)"
          },
          {
            "key": "B",
            "text": "た (ta)"
          },
          {
            "key": "C",
            "text": "ない (nai)"
          },
          {
            "key": "D",
            "text": "ば (ba)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola permohonan sopan: [Bentuk te] + ください (書いてください)."
      },
      {
        "id": 14,
        "category": "Grammar",
        "question": "この ペンを 使っ（　）も いいですか。",
        "translation": "Pilihlah bentuk kata kerja untuk memohon izin (bolehkah memakai pulpen ini?).",
        "wordJp": "て",
        "furigana": "て",
        "options": [
          {
            "key": "A",
            "text": "て (te - Pola ~te mo ii desu ka)"
          },
          {
            "key": "B",
            "text": "た (ta)"
          },
          {
            "key": "C",
            "text": "る (ru)"
          },
          {
            "key": "D",
            "text": "ない (nai)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola memohon izin: [Bentuk te] + もいいですか (使ってもいいですか)."
      },
      {
        "id": 15,
        "category": "Grammar",
        "question": "作業エリアで タバコを 吸っ（　）はいけません。",
        "translation": "Pilihlah bentuk larangan tegas (dilarang merokok di area kerja).",
        "wordJp": "て",
        "furigana": "て",
        "options": [
          {
            "key": "A",
            "text": "て (te - Pola ~te wa ikemasen larangan)"
          },
          {
            "key": "B",
            "text": "た (ta)"
          },
          {
            "key": "C",
            "text": "ない (nai)"
          },
          {
            "key": "D",
            "text": "る (ru)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola larangan mutlak: [Bentuk te] + はいけません (吸ってはいけません)."
      },
      {
        "id": 16,
        "category": "Grammar",
        "question": "山田さんは 今、電話で 話し（　）います。",
        "translation": "Pilihlah bentuk progresif sedang berlangsung (sedang berbicara telepon).",
        "wordJp": "て",
        "furigana": "て",
        "options": [
          {
            "key": "A",
            "text": "て (te - Pola ~te imasu sedang)"
          },
          {
            "key": "B",
            "text": "た (ta)"
          },
          {
            "key": "C",
            "text": "ない (nai)"
          },
          {
            "key": "D",
            "text": "ます (masu)"
          }
        ],
        "correctKey": "A",
        "explanation": "Aksi yang sedang berlangsung saat ini memakai: [Bentuk te] + います (話しています)."
      },
      {
        "id": 17,
        "category": "Grammar",
        "question": "わたしは 将来、日本で 働き（　）です。",
        "translation": "Pilihlah bentuk ungkapan keinginan pribadi (ingin bekerja di Jepang).",
        "wordJp": "たい",
        "furigana": "たい",
        "options": [
          {
            "key": "A",
            "text": "たい (tai - Ingin)"
          },
          {
            "key": "B",
            "text": "たくない (tidak ingin)"
          },
          {
            "key": "C",
            "text": "たかった (dulu ingin)"
          },
          {
            "key": "D",
            "text": "て (te)"
          }
        ],
        "correctKey": "A",
        "explanation": "Keinginan orang pertama memakai bentuk: [Batang Kata Kerja masu] + たいです (働きたいです)."
      },
      {
        "id": 18,
        "category": "Grammar",
        "question": "作業を 始める（　）に、機械の 点検を します。",
        "translation": "Pilihlah pola kalimat urutan sebelum melakukan sesuatu.",
        "wordJp": "前",
        "furigana": "まえ",
        "options": [
          {
            "key": "A",
            "text": "前 (Mae - Sebelum: [Kamus] + 前に)"
          },
          {
            "key": "B",
            "text": "後 (Ato)"
          },
          {
            "key": "C",
            "text": "中 (Chuu)"
          },
          {
            "key": "D",
            "text": "時 (Toki)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola sebelum melakukan aksi: [Bentuk Kamus] + 前に (始める前に)."
      },
      {
        "id": 19,
        "category": "Grammar",
        "question": "会議が 終わった（　）で、議事録を 送ります。",
        "translation": "Pilihlah pola kalimat urutan setelah melakukan sesuatu.",
        "wordJp": "後",
        "furigana": "あと",
        "options": [
          {
            "key": "A",
            "text": "後 (Ato - Setelah: [Bentuk Ta] + 後で)"
          },
          {
            "key": "B",
            "text": "前 (Mae)"
          },
          {
            "key": "C",
            "text": "間 (Aida)"
          },
          {
            "key": "D",
            "text": "頃 (Koro)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola setelah menyelesaikan aksi: [Bentuk Lampau ta] + 後で (終わった後で)."
      },
      {
        "id": 20,
        "category": "Grammar",
        "question": "お茶（　）コーヒーの どちらが いいですか。",
        "translation": "Pilihlah partikel penunjuk pilihan alternatif kata benda (atau).",
        "wordJp": "か",
        "furigana": "か",
        "options": [
          {
            "key": "A",
            "text": "か (ka - Atau)"
          },
          {
            "key": "B",
            "text": "と (to - Dan)"
          },
          {
            "key": "C",
            "text": "も (mo - Juga)"
          },
          {
            "key": "D",
            "text": "の (no)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pilihan antara dua opsi nomina menggunakan partikel 「か」(ka)."
      }
    ],
    "studentSubmissions": [
      {
        "studentId": 101,
        "studentName": "Khalis Soffi",
        "email": "khalis.soffi@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        "score": 95,
        "submittedAt": "22 Nov 2026, 09:15 WIB",
        "status": "graded",
        "feedback": "Penguasaan 20 pola partikel dan bentuk konjugasi kalimat sangat memuaskan!"
      },
      {
        "studentId": 102,
        "studentName": "Dimas Aditya",
        "email": "dimas.aditya@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face",
        "score": 85,
        "submittedAt": "22 Nov 2026, 10:45 WIB",
        "status": "graded",
        "feedback": "Bagus, teliti pada perbedaan bentuk ~te kudasai dan ~te wa ikemasen."
      }
    ]
  },
  {
    "id": 4,
    "title": "Quiz N5 – Listening Percakapan Kerja & Panggilan (Irodori Starter A1)",
    "bab": "Bab 4 – Choukai Kerja",
    "level": "N5",
    "classRoom": "N5 Pagi",
    "curriculumSource": "Irodori (Starter A1)",
    "category": "Listening",
    "categoryLabel": "🎧 Listening (聴解)",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "30:00",
    "durationMinutes": 30,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "quiz_sheet",
    "badgeColor": "bg-indigo-50 text-indigo-700",
    "submissionsCount": 2,
    "totalStudents": 2,
    "questions": [
      {
        "id": 1,
        "category": "Listening",
        "passage": "リーダー:「みなさん、お疲れ様です。今日の 昼休みは 12時から 13時までです。13時5分前に この 部屋に 集まってください。」\n(Pemimpin: Rekan-rekan sekalian, jam istirahat siang hari ini jam 12:00 sampai 13:00. Kumpul kembali di ruangan ini 5 menit sebelum jam 13:00).",
        "question": "【音声を聞いて答えなさい】午後の 仕事の 前に、何時に 部屋に 集まらなければなりませんか。",
        "translation": "Dengarkan arahan audio dan tentukan jam berapa pekerja harus berkumpul kembali di ruangan?",
        "wordJp": "12時55分",
        "furigana": "じゅうにじごじゅうごふん",
        "options": [
          {
            "key": "A",
            "text": "12時55分 (13時5分前 / 5 menit sebelum jam 13:00)"
          },
          {
            "key": "B",
            "text": "12時00分"
          },
          {
            "key": "C",
            "text": "13時15分"
          },
          {
            "key": "D",
            "text": "13時30分"
          }
        ],
        "correctKey": "A",
        "explanation": "Instruksi menyatakan 「13時5分前に集まってください」 yang berarti pukul 12:55."
      },
      {
        "id": 2,
        "category": "Listening",
        "passage": "先輩:「ファイズさん、その 青い 箱を 2階の 倉庫に 持って行ってください。」\n後輩:「はい、かしこまりました。青い箱ですね。」",
        "question": "【音声を聞いて答えなさい】後輩は 何色の 箱を どこへ 持って行きますか。",
        "translation": "Kotak warna apa dan ke mana barang tersebut harus dibawa?",
        "wordJp": "青い箱、2階の倉庫",
        "furigana": "あおいはこ、にかいのそうこ",
        "options": [
          {
            "key": "A",
            "text": "青い箱を 2階の倉庫へ (Kotak biru ke gudang lantai 2)"
          },
          {
            "key": "B",
            "text": "赤い箱を 1階の事務所へ"
          },
          {
            "key": "C",
            "text": "黄色い箱を 工場の外へ"
          },
          {
            "key": "D",
            "text": "白い箱を ゴミ箱へ"
          }
        ],
        "correctKey": "A",
        "explanation": "Senior meminta membawa kotak biru (青い箱) ke gudang lantai 2 (2階の倉庫)."
      },
      {
        "id": 3,
        "category": "Listening",
        "passage": "受付:「 creative bridgingの ファイザル様、お電話です。3番の ボタンを 押してください。」",
        "question": "【音声を聞いて答えなさい】内線電話を 取るために、何番の ボタンを 押しますか。",
        "translation": "Tombol nomor berapakah yang harus ditekan untuk menerima panggilan telepon masuk?",
        "wordJp": "3番",
        "furigana": "さんばん",
        "options": [
          {
            "key": "A",
            "text": "3番 (San-ban / Nomor 3)"
          },
          {
            "key": "B",
            "text": "1番 (Ichi-ban)"
          },
          {
            "key": "C",
            "text": "5番 (Go-ban)"
          },
          {
            "key": "D",
            "text": "8番 (Hachi-ban)"
          }
        ],
        "correctKey": "A",
        "explanation": "Instruksi suara dengan jelas menyebutkan 「3番のボタンを押してください」."
      },
      {
        "id": 4,
        "category": "Listening",
        "passage": "上司:「明日の 朝礼は いつもより 15分早く 始まります。7時45分に 朝礼広場に 来てください。」",
        "question": "【音声を聞いて答えなさい】明日の 朝礼は何時に始まりますか。",
        "translation": "Pukul berapakah apel pagi (Chourei) besok dimulai?",
        "wordJp": "7時45分",
        "furigana": "しちじよんじゅうごふん",
        "options": [
          {
            "key": "A",
            "text": "7時45分 (Shichiji yonjuugofun)"
          },
          {
            "key": "B",
            "text": "8時00分"
          },
          {
            "key": "C",
            "text": "8時15分"
          },
          {
            "key": "D",
            "text": "7時15分"
          }
        ],
        "correctKey": "A",
        "explanation": "Atasan mengumumkan apel pagi dimulai pukul 07:45."
      },
      {
        "id": 5,
        "category": "Listening",
        "passage": "同僚:「ディマスさん、作業の 前に 必ず 安全靴を 履いてくださいね。」\nディマス:「はい、分かりました。すぐ 履きます。」",
        "question": "【音声を聞いて答えなさい】ディマスさんは 作業の 前に 何を 履かなければなりませんか。",
        "translation": "Perlengkapan keselamatan apa yang wajib dikenakan Dimas sebelum bekerja?",
        "wordJp": "安全靴",
        "furigana": "あんぜんぐつ",
        "options": [
          {
            "key": "A",
            "text": "安全靴 (Anzengutsu - Sepatu safety pelindung)"
          },
          {
            "key": "B",
            "text": "サンダル (Sandal)"
          },
          {
            "key": "C",
            "text": "運動靴 (Sepatu lari olahraga)"
          },
          {
            "key": "D",
            "text": "長靴 (Sepatu boot biasa)"
          }
        ],
        "correctKey": "A",
        "explanation": "Rekan kerja mengingatkan memakai sepatu safety pelindung (安全靴 - Anzengutsu)."
      },
      {
        "id": 6,
        "category": "Listening",
        "passage": "先輩:「ヘルメットは 更衣室の ロッカーCに 入っています。黄色の ヘルメットを 取ってきてください。」",
        "question": "【音声を聞いて答えなさい】ヘルメットは どこに ありますか。",
        "translation": "Di manakah helm keselamatan disimpan?",
        "wordJp": "ロッカーC",
        "furigana": "ろっかーしー",
        "options": [
          {
            "key": "A",
            "text": "更衣室の ロッカーC (Loker C ruang ganti)"
          },
          {
            "key": "B",
            "text": "事務所の 机の上"
          },
          {
            "key": "C",
            "text": "トラックの 中"
          },
          {
            "key": "D",
            "text": "食堂の テーブル"
          }
        ],
        "correctKey": "A",
        "explanation": "Petunjuk audio menyebutkan 「更衣室のロッカーCに入っています」。"
      },
      {
        "id": 7,
        "category": "Listening",
        "passage": "リーダー:「段ボール箱を 数えてください。全部で 15箱 あれば 合格です。」",
        "question": "【音声を聞いて答えなさい】段ボール箱は 全部で 何箱 必要ですか。",
        "translation": "Berapakah jumlah total kardus karton yang dibutuhkan sesuai arahan?",
        "wordJp": "15箱",
        "furigana": "じゅうごはんこ",
        "options": [
          {
            "key": "A",
            "text": "15箱 (Juu-go hako / 15 kardus)"
          },
          {
            "key": "B",
            "text": "5箱 (Go hako)"
          },
          {
            "key": "C",
            "text": "20箱 (Ni-juu hako)"
          },
          {
            "key": "D",
            "text": "50箱 (Go-juu hako)"
          }
        ],
        "correctKey": "A",
        "explanation": "Audio menyebutkan angka 15 (全部で15箱)."
      },
      {
        "id": 8,
        "category": "Listening",
        "passage": "同僚:「倉庫の 鍵は、鈴木主任の 机の 引き出しの 中に ありますよ。」",
        "question": "【音声を聞いて答えなさい】倉庫の 鍵は どこに ありますか。",
        "translation": "Di manakah kunci gudang disimpan?",
        "wordJp": "机の引き出しの中",
        "furigana": "つくえのひきだしのなか",
        "options": [
          {
            "key": "A",
            "text": "鈴木主任の 机の 引き出しの 中 (Di dalam laci meja Pak Suzuki)"
          },
          {
            "key": "B",
            "text": "倉庫の ドアに 刺さっている"
          },
          {
            "key": "C",
            "text": "ゴミ箱の 横"
          },
          {
            "key": "D",
            "text": "車の 中"
          }
        ],
        "correctKey": "A",
        "explanation": "Informasi audio: 「鈴木主任の机の引き出しの中にあります」。"
      },
      {
        "id": 9,
        "category": "Listening",
        "passage": "ドライバー:「こんにちは！部品を 届けに 来ました。トラックは どこに 止めれば いいですか。」\n社員:「裏の 第2搬入口に お願いします。」",
        "question": "【音声を聞いて答えなさい】トラックは どこに 止めますか。",
        "translation": "Di manakah sopir truk diminta memarkirkan kendaraannya?",
        "wordJp": "第2搬入口",
        "furigana": "だいにはんにあるぐち",
        "options": [
          {
            "key": "A",
            "text": "裏の 第2搬入口 (Pintu bongkar muat nomor 2 di belakang)"
          },
          {
            "key": "B",
            "text": "正面玄関の 前"
          },
          {
            "key": "C",
            "text": "駅の ロータリー"
          },
          {
            "key": "D",
            "text": "社長の 駐車スペース"
          }
        ],
        "correctKey": "A",
        "explanation": "Staf mengarahkan truk menuju pintu bongkar muat belakang: 「裏の第2搬入口にお願いします」。"
      },
      {
        "id": 10,
        "category": "Listening",
        "passage": "先輩:「ペンキを 塗る 前に、必ず 換気扇を 回してください。窓も 2つ 開けてくださいね。」",
        "question": "【音声を聞いて答えなさい】作業を 始める 前に、何を しなければなりませんか。",
        "translation": "Sebelum mulai mengecat, instruksi apakah yang wajib dijalankan?",
        "wordJp": "換気扇を回し、窓を開ける",
        "furigana": "かんきせんをまわし、まどをあける",
        "options": [
          {
            "key": "A",
            "text": "換気扇を 回し、窓を 2つ 開ける (Menyalakan exhaust fan & membuka 2 jendela)"
          },
          {
            "key": "B",
            "text": "ドアと 窓を 全部 閉め切る"
          },
          {
            "key": "C",
            "text": "エアコンを つける"
          },
          {
            "key": "D",
            "text": "電気を 消す"
          }
        ],
        "correctKey": "A",
        "explanation": "Standar keselamatan sirkulasi udara: nyalakan kipas ventilasi dan buka 2 jendela."
      },
      {
        "id": 11,
        "category": "Listening",
        "passage": "館内放送:「訓練、訓練。ただいま 地震が 発生しました。作業を 直ちに 中断し、頭を 保護して 机の 下に 入ってください。」",
        "question": "【音声を聞いて答えなさい】放送が 流れたら、まず 何を しますか。",
        "translation": "Apa yang harus segera dilakukan saat pengumuman latihan gempa terdengar?",
        "wordJp": "頭を保護して机の下に入る",
        "furigana": "あたまをほごしてつくえのしたにはいる",
        "options": [
          {
            "key": "A",
            "text": "作業を 止めて、頭を 保護し 机の 下に 入る (Hentikan kerja & lindungi kepala di bawah meja)"
          },
          {
            "key": "B",
            "text": "大声で 叫びながら 外へ 走る"
          },
          {
            "key": "C",
            "text": "エレベーターで 1階へ 降りる"
          },
          {
            "key": "D",
            "text": "そのまま 作業を 続ける"
          }
        ],
        "correctKey": "A",
        "explanation": "SOP gempa: lindungi kepala dan berlindung di bawah meja kokoh."
      },
      {
        "id": 12,
        "category": "Listening",
        "passage": "同僚:「すみません、ハサミを 1本 貸して もらえませんか。段ボールを 開けたいんです。」",
        "question": "【音声を聞いて答えなさい】同僚は 何を 借りたがっていますか。",
        "translation": "Alat apakah yang ingin dipinjam oleh rekan kerja tersebut?",
        "wordJp": "ハサミ",
        "furigana": "はさみ",
        "options": [
          {
            "key": "A",
            "text": "ハサミ (Hasami - Gunting)"
          },
          {
            "key": "B",
            "text": "ホッチキス (Hekter / Stapler)"
          },
          {
            "key": "C",
            "text": "定規 (Penggaris)"
          },
          {
            "key": "D",
            "text": "消しゴム (Penghapus)"
          }
        ],
        "correctKey": "A",
        "explanation": "Rekan kerja memohon: 「ハサミを1本貸してもらえませんか」。"
      },
      {
        "id": 13,
        "category": "Listening",
        "passage": "上司:「この 会議資料を 10部 コピーして、ホッチキスで 左上を 留めてください。」",
        "question": "【音声を聞いて答えなさい】資料は 何部 コピーしますか。",
        "translation": "Berapa rangkap dokumen rapat yang harus difotokopi?",
        "wordJp": "10部",
        "furigana": "じゅうぶ",
        "options": [
          {
            "key": "A",
            "text": "10部 (Juu-bu / 10 rangkap)"
          },
          {
            "key": "B",
            "text": "5部 (Go-bu)"
          },
          {
            "key": "C",
            "text": "20部 (Ni-juu-bu)"
          },
          {
            "key": "D",
            "text": "1部だけ"
          }
        ],
        "correctKey": "A",
        "explanation": "Instruksi: 「10部コピーして」 (10 rangkap)."
      },
      {
        "id": 14,
        "category": "Listening",
        "passage": "案内係:「お手洗いは、この 通路を まっすぐ 行って、突き当たりの 右側に ございます。」",
        "question": "【音声を聞いて答えなさい】お手洗いは どこに ありますか。",
        "translation": "Di manakah letak toilet sesuai petunjuk arah suara?",
        "wordJp": "突き当たりの右側",
        "furigana": "つきあたりのみぎがわ",
        "options": [
          {
            "key": "A",
            "text": "通路の 突き当たりの 右側 (Ujung lorong sebelah kanan)"
          },
          {
            "key": "B",
            "text": "階段を 降りて すぐ 左"
          },
          {
            "key": "C",
            "text": "玄関の 外"
          },
          {
            "key": "D",
            "text": "2階の 角"
          }
        ],
        "correctKey": "A",
        "explanation": "Petunjuk: 「突き当たりの右側」 (ujung jalan sebelah kanan)."
      },
      {
        "id": 15,
        "category": "Listening",
        "passage": "食堂スタッフ:「今日の 日替わり 定食は、焼き魚定食と チキンカレーです。どちらに なさいますか。」",
        "question": "【音声を聞いて答えなさい】今日の 定食の メニューは 何と 何ですか。",
        "translation": "Menu apakah yang disajikan sebagai paket makan siang hari ini?",
        "wordJp": "焼き魚定食とチキンカレー",
        "furigana": "やきざかなていしょくとちきんかれー",
        "options": [
          {
            "key": "A",
            "text": "焼き魚定食と チキンカレー (Paket Ikan Panggang & Kari Ayam)"
          },
          {
            "key": "B",
            "text": "ラーメンと 餃子"
          },
          {
            "key": "C",
            "text": "牛丼と うどん"
          },
          {
            "key": "D",
            "text": "ハンバーガーと ポテト"
          }
        ],
        "correctKey": "A",
        "explanation": "Audio menyebutkan dua menu: 焼き魚定食 (ikan panggang) dan チキンカレー (kari ayam)."
      },
      {
        "id": 16,
        "category": "Listening",
        "passage": "衛生管理者:「クリーンルームに 入る 前には、石鹸で 30秒 手を 洗い、アルコール消毒を してください。」",
        "question": "【音声を聞いて答えなさい】部屋に 入る 前の 手洗いは 何秒間 行いますか。",
        "translation": "Berapa detik tangan harus dicuci dengan sabun sebelum memasuki ruangan bersih?",
        "wordJp": "30秒",
        "furigana": "さんじゅうびょう",
        "options": [
          {
            "key": "A",
            "text": "30秒間 (San-juu byou / 30 detik)"
          },
          {
            "key": "B",
            "text": "10秒間"
          },
          {
            "key": "C",
            "text": "1分間"
          },
          {
            "key": "D",
            "text": "洗わなくて よい"
          }
        ],
        "correctKey": "A",
        "explanation": "SOP higienitas: 「石鹸で30秒手を洗い」 (cuci tangan selama 30 detik)."
      },
      {
        "id": 17,
        "category": "Listening",
        "passage": "先輩:「新しい 実習生の 名前は ファイザルさんですね。みんな ファイズさんと 呼んでいますよ。」",
        "question": "【音声を聞いて答えなさい】実習生は 普段 みんなから 何と 呼ばれていますか。",
        "translation": "Apakah nama panggilan akrab peserta magang tersebut di tempat kerja?",
        "wordJp": "ファイズさん",
        "furigana": "ふぁいずさん",
        "options": [
          {
            "key": "A",
            "text": "ファイズさん (Faiz-san)"
          },
          {
            "key": "B",
            "text": "ケンジさん"
          },
          {
            "key": "C",
            "text": "タナカさん"
          },
          {
            "key": "D",
            "text": "サトウさん"
          }
        ],
        "correctKey": "A",
        "explanation": "Audio: 「みんなファイズさんと呼んでいますよ」。"
      },
      {
        "id": 18,
        "category": "Listening",
        "passage": "総務:「ファイズさんの ロッカーは、24番です。鍵は こちらです。無くさないように 気をつけてください。」",
        "question": "【音声を聞いて答えなさい】ファイズさんの ロッカーの 番号は 何番ですか。",
        "translation": "Nomor berapakah loker yang diberikan untuk Faizal?",
        "wordJp": "24番",
        "furigana": "にじゅうよんばん",
        "options": [
          {
            "key": "A",
            "text": "24番 (Ni-juu-yon ban / Nomor 24)"
          },
          {
            "key": "B",
            "text": "42番 (Yon-juu-ni ban)"
          },
          {
            "key": "C",
            "text": "14番 (Juu-yon ban)"
          },
          {
            "key": "D",
            "text": "4番 (Yon ban)"
          }
        ],
        "correctKey": "A",
        "explanation": "Bagian umum menyebutkan: 「ロッカーは、24番です」。"
      },
      {
        "id": 19,
        "category": "Listening",
        "passage": "リーダー:「午後の シフトは 16時で 交代です。交代の 10分前に 次の グループへ 引き継ぎを してください。」",
        "question": "【音声を聞いて答えなさい】引き継ぎは 何時に 始めますか。",
        "translation": "Jam berapakah serah terima pekerjaan (Hikitsugi) harus dimulai?",
        "wordJp": "15時50分",
        "furigana": "じゅうごじごじゅっぷん",
        "options": [
          {
            "key": "A",
            "text": "15時50分 (16時の10分前)"
          },
          {
            "key": "B",
            "text": "16時00分"
          },
          {
            "key": "C",
            "text": "16時10分"
          },
          {
            "key": "D",
            "text": "15時30分"
          }
        ],
        "correctKey": "A",
        "explanation": "Serah terima 10 menit sebelum jam 16:00 berarti pukul 15:50."
      },
      {
        "id": 20,
        "category": "Listening",
        "passage": "事務所アナウンス:「退勤の 際は、パソコンの 電源を 落とし、部屋の 照明と エアコンを 切って 退出してください。」",
        "question": "【音声を聞いて答えなさい】最後に 事務所を 出るとき、切らなければならない ものは？",
        "translation": "Apa saja yang wajib dipadamkan sebelum pulang meninggalkan ruangan kantor?",
        "wordJp": "パソコンの電源、照明、エアコン",
        "furigana": "ぱそこんのでんげん、しょうめい、えあこん",
        "options": [
          {
            "key": "A",
            "text": "パソコン、照明（電気）、エアコン (PC, lampu ruangan, dan AC)"
          },
          {
            "key": "B",
            "text": "冷蔵庫"
          },
          {
            "key": "C",
            "text": "防犯カメラ"
          },
          {
            "key": "D",
            "text": "Wi-Fiルーター"
          }
        ],
        "correctKey": "A",
        "explanation": "Pemberitahuan: matikan daya PC, lampu penerangan, dan pendingin ruangan (AC)."
      }
    ],
    "studentSubmissions": [
      {
        "studentId": 101,
        "studentName": "Khalis Soffi",
        "email": "khalis.soffi@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        "score": 95,
        "submittedAt": "22 Nov 2026, 13:20 WIB",
        "status": "graded",
        "feedback": "Daya tangkap menyimak 20 percakapan audio Jepang sangat tajam dan akurat!"
      },
      {
        "studentId": 102,
        "studentName": "Dimas Aditya",
        "email": "dimas.aditya@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face",
        "score": 85,
        "submittedAt": "22 Nov 2026, 14:15 WIB",
        "status": "graded",
        "feedback": "Bagus, latih kembali ketelitian menangkap rincian jam dan nomor instruksi."
      }
    ]
  },
  {
    "id": 5,
    "title": "Quiz N5 – Reading Memo Kerja & Jam Istirahat (Irodori Starter A1)",
    "bab": "Bab 5 – Dokkai Seikatsu",
    "level": "N5",
    "classRoom": "N5 Pagi",
    "curriculumSource": "Irodori (Starter A1)",
    "category": "Reading",
    "categoryLabel": "📖 Reading (読解)",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "30:00",
    "durationMinutes": 30,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "torii_gate",
    "badgeColor": "bg-amber-50 text-amber-700",
    "submissionsCount": 2,
    "totalStudents": 2,
    "questions": [
      {
        "id": 1,
        "category": "Reading",
        "passage": "【社内メモ：食堂の 利用時間について】\n社員食堂の 昼食時間は、混雑を 避けるため、2交代制に なります。\n第1グループ（製造部）：11:30 ～ 12:15\n第2グループ（管理部・検査部）：12:15 ～ 13:00\n※ 食事の後は、テーブルを 拭いてください。",
        "question": "製造部の 社員は、何時から 昼食を 食べることが できますか。",
        "translation": "Berdasarkan memo kantin di atas, kapan karyawan divisi manufaktur (Seizoubu) dapat makan siang?",
        "wordJp": "11:30",
        "furigana": "じゅういちじさんじゅっぷん",
        "options": [
          {
            "key": "A",
            "text": "11:30 ～ 12:15"
          },
          {
            "key": "B",
            "text": "12:15 ～ 13:00"
          },
          {
            "key": "C",
            "text": "13:00 ～ 13:30"
          },
          {
            "key": "D",
            "text": "いつでも 自由"
          }
        ],
        "correctKey": "A",
        "explanation": "Sesuai jadwal memo, 第1グループ（製造部） adalah 11:30 ～ 12:15."
      },
      {
        "id": 2,
        "category": "Reading",
        "passage": "【掲示板：休業の お知らせ】\n来週の 月曜日（11月24日）は 祝日のため、工場と 事務所は すべて お休みです。\n火曜日（11月25日）の 朝 8時から 通常通り 営業します。",
        "question": "工場が 再び 始まる 日時は いつですか。",
        "translation": "Kapan pabrik mulai beroperasi kembali setelah libur nasional?",
        "wordJp": "火曜日の朝8時",
        "furigana": "かようびのあさはちじ",
        "options": [
          {
            "key": "A",
            "text": "火曜日（11月25日）の 朝 8時"
          },
          {
            "key": "B",
            "text": "月曜日（11月24日）の 朝 8時"
          },
          {
            "key": "C",
            "text": "水曜日の 朝 9時"
          },
          {
            "key": "D",
            "text": "日曜日"
          }
        ],
        "correctKey": "A",
        "explanation": "Teks pengumuman tertulis: 火曜日（11月25日）の 朝 8時から 通常通り 営業します."
      },
      {
        "id": 3,
        "category": "Reading",
        "passage": "【貼り紙：更衣室の ルール】\n・ロッカーには 必ず 鍵を かけてください。\n・靴は 下駄箱に 入れてください。床に 置いては いけません。\n・ゴミは 持ち帰るか、分別して ゴミ箱に 捨ててください。",
        "question": "更衣室で やっては いけない ことは どれですか。",
        "translation": "Hal apakah yang DILARANG dilakukan di ruang ganti sesuai peraturan di atas?",
        "wordJp": "靴を床に置くこと",
        "furigana": "くつをゆかにおくこと",
        "options": [
          {
            "key": "A",
            "text": "靴を 床に 置くこと (Meletakkan sepatu di lantai)"
          },
          {
            "key": "B",
            "text": "ロッカーに 鍵を かけること"
          },
          {
            "key": "C",
            "text": "靴を 下駄箱に 入れること"
          },
          {
            "key": "D",
            "text": "ゴミを 分別すること"
          }
        ],
        "correctKey": "A",
        "explanation": "Aturan dengan jelas menyatakan: 床に置いてはいけません (Dilarang meletakkan di lantai)."
      },
      {
        "id": 4,
        "category": "Reading",
        "passage": "【お知らせ：健康診断について】\n日時：12月5日（金） 午前 9:00 ～ 11:30\n場所：2階 第1会議室\n持ち物：健康保険証、問診票\n※ 当日の 朝は ご飯を 食べないで 来てください。水は 飲んでも いいです。",
        "question": "健康診断の 当日の 朝について、正しい 注意事項は どれですか。",
        "translation": "Manakah instruksi persiapan yang benar pada pagi hari saat pemeriksaan kesehatan?",
        "wordJp": "ご飯を食べない",
        "furigana": "ごはんをたべない",
        "options": [
          {
            "key": "A",
            "text": "朝ご飯を 食べないで 来ること (Tidak sarapan makan nasi)"
          },
          {
            "key": "B",
            "text": "水を 飲んでは いけないこと"
          },
          {
            "key": "C",
            "text": "午後から 参加すること"
          },
          {
            "key": "D",
            "text": "保険証を 持ってこないこと"
          }
        ],
        "correctKey": "A",
        "explanation": "Catatan bertuliskan: 当日の朝はご飯を食べないで来てください."
      },
      {
        "id": 5,
        "category": "Reading",
        "passage": "【注意書き：ゴミの 分別】\n青い箱：燃えるゴミ（紙くず、お弁当の殻）\n黄色い箱：プラスチック類（ペットボトルのキャップ、ビニール袋）\n緑の箱：ビン・カン・ペットボトル本体",
        "question": "ペットボトルの キャップ（蓋）は どの 箱に 捨てますか。",
        "translation": "Di kotak warna apakah tutup botol plastik harus dibuang?",
        "wordJp": "黄色い箱",
        "furigana": "きいろいはこ",
        "options": [
          {
            "key": "A",
            "text": "黄色い箱 (Kiiroi hako / Kotak kuning)"
          },
          {
            "key": "B",
            "text": "青い箱"
          },
          {
            "key": "C",
            "text": "緑の箱"
          },
          {
            "key": "D",
            "text": "赤い箱"
          }
        ],
        "correctKey": "A",
        "explanation": "Keterangan kotak kuning: 黄色い箱：プラスチック類（ペットボトルのキャップ）."
      },
      {
        "id": 6,
        "category": "Reading",
        "passage": "【当番表：掃除の 担当】\n月曜：山田、佐藤\n火曜：田中、高橋\n水曜：ファイザル、ディマス\n木曜：渡辺、伊藤\n金曜：全員で大掃除",
        "question": "ファイザルさんと ディマスさんの 掃除当番は 何曜日ですか。",
        "translation": "Hari apakah jadwal giliran piket kebersihan Faizal dan Dimas?",
        "wordJp": "水曜日",
        "furigana": "すいようび",
        "options": [
          {
            "key": "A",
            "text": "水曜日 (Suiyoubi / Hari Rabu)"
          },
          {
            "key": "B",
            "text": "月曜日"
          },
          {
            "key": "C",
            "text": "木曜日"
          },
          {
            "key": "D",
            "text": "金曜日"
          }
        ],
        "correctKey": "A",
        "explanation": "Berdasarkan tabel: 水曜：ファイザル、ディマス (Hari Rabu)."
      },
      {
        "id": 7,
        "category": "Reading",
        "passage": "【社内案内：有給休暇の 申請手続き】\n有給休暇を 取る 場合は、希望日の 3日前までに「休暇届」を 事務所の 上司へ 提出してください。",
        "question": "有給休暇を 取るには、いつまでに 申請書を 出しますか。",
        "translation": "Kapan batas pengajuan surat cuti tahunan harus diserahkan ke atasan?",
        "wordJp": "希望日の3日前まで",
        "furigana": "きぼうびのみっかまえまで",
        "options": [
          {
            "key": "A",
            "text": "希望日の 3日前までに (Paling lambat 3 hari sebelum hari yang diinginkan)"
          },
          {
            "key": "B",
            "text": "休んだ 当日に"
          },
          {
            "key": "C",
            "text": "休んだ 次の 週に"
          },
          {
            "key": "D",
            "text": "1か月 前に"
          }
        ],
        "correctKey": "A",
        "explanation": "Teks instruksi: 希望日の3日前までに「休暇届」を提出してください."
      },
      {
        "id": 8,
        "category": "Reading",
        "passage": "【節電の お願い】\n事務所の エアコンの 設定温度は、夏は「28度」、冬は「20度」に 設定してください。無駄な 電力消費を 抑えましょう。",
        "question": "夏の エアコンの 設定温度は 何度ですか。",
        "translation": "Berapakah suhu standar pendingin udara (AC) yang ditetapkan pada musim panas?",
        "wordJp": "28度",
        "furigana": "にじゅうはちど",
        "options": [
          {
            "key": "A",
            "text": "28度 (Ni-juu-hachi do)"
          },
          {
            "key": "B",
            "text": "18度"
          },
          {
            "key": "C",
            "text": "20度"
          },
          {
            "key": "D",
            "text": "25度"
          }
        ],
        "correctKey": "A",
        "explanation": "Teks tertulis: 夏は「28度」."
      },
      {
        "id": 9,
        "category": "Reading",
        "passage": "【非常口の 案内】\n火災や 地震の ときは、エレベーターを 絶対に 使わないでください。緑色の「非常口」マークの 非常階段を 使って 避難してください。",
        "question": "火災の ときに 使っては いけない 移動手段は？",
        "translation": "Sarana mobilitas apakah yang DILARANG KERAS digunakan saat evakuasi kebakaran?",
        "wordJp": "エレベーター",
        "furigana": "えれべーたー",
        "options": [
          {
            "key": "A",
            "text": "エレベーター (Elevator / Lift)"
          },
          {
            "key": "B",
            "text": "非常階段"
          },
          {
            "key": "C",
            "text": "裏口の ドア"
          },
          {
            "key": "D",
            "text": "スロープ"
          }
        ],
        "correctKey": "A",
        "explanation": "Peringatan: エレベーターを絶対に使わないでください."
      },
      {
        "id": 10,
        "category": "Reading",
        "passage": "【郵便物・宅配便の 受取について】\n個人宛ての 荷物は、1階の 総合受付に 届きます。夕方 17時までに 印鑑を 持って 受け取りに 来てください。",
        "question": "荷物を 受け取る ときに 持参する ものは 何ですか。",
        "translation": "Benda apakah yang harus dibawa saat mengambil paket kiriman di bagian resepsionis?",
        "wordJp": "印鑑",
        "furigana": "いんかん",
        "options": [
          {
            "key": "A",
            "text": "印鑑（はんこ）(Stempel Hanko segel)"
          },
          {
            "key": "B",
            "text": "お金"
          },
          {
            "key": "C",
            "text": "パスポート"
          },
          {
            "key": "D",
            "text": "ハサミ"
          }
        ],
        "correctKey": "A",
        "explanation": "Teks: 印鑑を持って受け取りに来てください."
      },
      {
        "id": 11,
        "category": "Reading",
        "passage": "【コピー機の 利用マナー】\n・紙詰まりが 起きたら、無理に 引っ張らず、総務課の 担当者を 呼んでください。\n・カラー印刷は 承認が 必要です。",
        "question": "コピー機で 紙が 詰まったら、どうしますか。",
        "translation": "Apa yang harus dilakukan jika kertas tersangkut di dalam mesin fotokopi?",
        "wordJp": "総務課の担当者を呼ぶ",
        "furigana": "そうむかのたんとうしゃをよぶ",
        "options": [
          {
            "key": "A",
            "text": "無理に 引っ張らず、総務課の 担当者を 呼ぶ (Panggil staf umum, jangan ditarik paksa)"
          },
          {
            "key": "B",
            "text": "力任せに 紙を 引きちぎる"
          },
          {
            "key": "C",
            "text": "そのまま 放置して 立ち去る"
          },
          {
            "key": "D",
            "text": "機械を 叩く"
          }
        ],
        "correctKey": "A",
        "explanation": "Aturan: 無理に引っ張らず、総務課の担当者を呼んでください."
      },
      {
        "id": 12,
        "category": "Reading",
        "passage": "【機械メンテナンスの お知らせ】\n第1ラインの コンプレッサー点検のため、毎週 土曜日の 午後は 機械が 停止します。作業は 行えません。",
        "question": "第1ラインで 作業が できない 時間帯は いつですか。",
        "translation": "Kapan jalur perakitan lini 1 tidak dapat digunakan untuk bekerja?",
        "wordJp": "毎週土曜日の午後",
        "furigana": "まいしゅうどようびのごご",
        "options": [
          {
            "key": "A",
            "text": "毎週 土曜日の 午後 (Setiap Sabtu siang)"
          },
          {
            "key": "B",
            "text": "月曜日の 朝"
          },
          {
            "key": "C",
            "text": "毎日 終日"
          },
          {
            "key": "D",
            "text": "日曜日の 夜"
          }
        ],
        "correctKey": "A",
        "explanation": "Teks pengumuman: 毎週土曜日の午後は機械が停止します."
      },
      {
        "id": 13,
        "category": "Reading",
        "passage": "【防災訓練の 実施】\n日時：11月30日（木） 14:00 ～ 15:00\n集合場所：南側 第2駐車場\n※ 雨天の 場合は、体育館で 行います。",
        "question": "もし 防災訓練の 当日に 雨が 降ったら、どこに 集まりますか。",
        "translation": "Di manakah lokasi berkumpul latihan mitigasi bencana jika hari hujan?",
        "wordJp": "体育館",
        "furigana": "たいいくかん",
        "options": [
          {
            "key": "A",
            "text": "体育館 (Gymnasium / Gedung olahraga)"
          },
          {
            "key": "B",
            "text": "南側 第2駐車場"
          },
          {
            "key": "C",
            "text": "自分の 部屋"
          },
          {
            "key": "D",
            "text": "最寄り駅"
          }
        ],
        "correctKey": "A",
        "explanation": "Catatan kondisi cuaca hujan: 雨天の場合は、体育館で行います."
      },
      {
        "id": 14,
        "category": "Reading",
        "passage": "【来客受付時間】\n取引先の ご来社は、午前 10:00 ～ 12:00、午後 13:30 ～ 16:30 と させていただきます。",
        "question": "午後の 来客受付時間は 何時までですか。",
        "translation": "Hingga jam berapakah penerimaan tamu eksternal pada sesi sore?",
        "wordJp": "16:30まで",
        "furigana": "じゅうろくじさんじゅっぷんまで",
        "options": [
          {
            "key": "A",
            "text": "16:30まで (Pukul 16:30)"
          },
          {
            "key": "B",
            "text": "12:00まで"
          },
          {
            "key": "C",
            "text": "18:00まで"
          },
          {
            "key": "D",
            "text": "20:00まで"
          }
        ],
        "correctKey": "A",
        "explanation": "Jadwal sesi sore: 午後13:30 ～ 16:30."
      },
      {
        "id": 15,
        "category": "Reading",
        "passage": "【衣替えの お知らせ】\n10月1日より、冬用 作業着（長袖・ジャンパー）を 着用してください。夏用 作業着は クリーニングして 返却してください。",
        "question": "10月1日から 着用する 作業着は どれですか。",
        "translation": "Seragam kerja model apakah yang wajib dikenakan mulai tanggal 1 Oktober?",
        "wordJp": "冬用作業着（長袖・ジャンパー）",
        "furigana": "ふゆようさぎょうぎ",
        "options": [
          {
            "key": "A",
            "text": "冬用 作業着（長袖・ジャンパー）(Seragam kerja musim dingin lengan panjang)"
          },
          {
            "key": "B",
            "text": "夏用 半袖シャツ"
          },
          {
            "key": "C",
            "text": "私服の Tシャツ"
          },
          {
            "key": "D",
            "text": "スーツ"
          }
        ],
        "correctKey": "A",
        "explanation": "Instruksi pergantian seragam: 10月1日より、冬用作業着を着用してください."
      },
      {
        "id": 16,
        "category": "Reading",
        "passage": "【タイムカードの 提出】\n今月分の タイムカードは、毎月 25日の 終業時までに、各自 事務所の 提出ボックスへ 投函してください。",
        "question": "タイムカードは 毎月 何日までに 提出しますか。",
        "translation": "Paling lambat tanggal berapa kartu absensi (Time Card) harus dimasukkan ke kotak pengumpulan?",
        "wordJp": "25日",
        "furigana": "にじゅうごにち",
        "options": [
          {
            "key": "A",
            "text": "25日の 終業時までに (Paling lambat tanggal 25 akhir jam kerja)"
          },
          {
            "key": "B",
            "text": "1日"
          },
          {
            "key": "C",
            "text": "末日"
          },
          {
            "key": "D",
            "text": "15日"
          }
        ],
        "correctKey": "A",
        "explanation": "Jadwal batas pengumpulan absensi: 毎月25日の終業時までに."
      },
      {
        "id": 17,
        "category": "Reading",
        "passage": "【廃油の 処理ルール】\n機械から 抜いた 使用済み 油は、絶対に 排水溝に 流しては いけません。必ず 黒い ドラム缶に 入れてください。",
        "question": "使用済み 油は どこに 入れますか。",
        "translation": "Di manakah limbah oli bekas mesin harus dibuang?",
        "wordJp": "黒いドラム缶",
        "furigana": "くろいどらむかん",
        "options": [
          {
            "key": "A",
            "text": "黒い ドラム缶 (Drum besi warna hitam)"
          },
          {
            "key": "B",
            "text": "排水溝（下水）"
          },
          {
            "key": "C",
            "text": "洗面所"
          },
          {
            "key": "D",
            "text": "ゴミ箱"
          }
        ],
        "correctKey": "A",
        "explanation": "SOP lingkungan pabrik: 必ず黒いドラム缶に入れてください."
      },
      {
        "id": 18,
        "category": "Reading",
        "passage": "【エレベーター点検中】\n本日 13:00 ～ 15:00 の間、定期点検のため エレベーターは 停止します。階段を ご利用ください。",
        "question": "エレベーターが 停止する 時間は 何時間ですか。",
        "translation": "Berapa jam lift gedung berhenti beroperasi selama proses pemeriksaan?",
        "wordJp": "2時間",
        "furigana": "にじかん",
        "options": [
          {
            "key": "A",
            "text": "2時間 (Pukul 13:00 - 15:00 / 2 Jam)"
          },
          {
            "key": "B",
            "text": "1時間"
          },
          {
            "key": "C",
            "text": "終日"
          },
          {
            "key": "D",
            "text": "30分"
          }
        ],
        "correctKey": "A",
        "explanation": "Rentang waktu 13:00 hingga 15:00 adalah 2 jam."
      },
      {
        "id": 19,
        "category": "Reading",
        "passage": "【社員証の 着用義務】\n会社内では、防犯上、常に「社員証」を 首から 下げて 見える位置に 携帯してください。",
        "question": "会社内で 常に 首から 下げなければならない ものは？",
        "translation": "Benda apakah yang wajib selalu dikalungkan di leher selama berada di area perusahaan?",
        "wordJp": "社員証",
        "furigana": "しゃいんしょう",
        "options": [
          {
            "key": "A",
            "text": "社員証（IDカード）(Kartu identitas karyawan)"
          },
          {
            "key": "B",
            "text": "鍵"
          },
          {
            "key": "C",
            "text": "スマートフォン"
          },
          {
            "key": "D",
            "text": "財布"
          }
        ],
        "correctKey": "A",
        "explanation": "Aturan keamanan perusahaan: 常に「社員証」を首から下げて."
      },
      {
        "id": 20,
        "category": "Reading",
        "passage": "【敷地内 禁煙の お知らせ】\n当工場は、全面禁煙です。タバコは、屋外の 指定喫煙所（第3倉庫の裏）以外では 一切 吸えません。",
        "question": "タバコを 吸うことが できる 場所は どこですか。",
        "translation": "Di manakah satu-satunya lokasi yang diizinkan untuk merokok?",
        "wordJp": "屋外の指定喫煙所（第3倉庫の裏）",
        "furigana": "おくがいのしていきつえんじょ",
        "options": [
          {
            "key": "A",
            "text": "屋外の 指定喫煙所（第3倉庫の裏）(Area merokok khusus luar ruang di belakang gudang 3)"
          },
          {
            "key": "B",
            "text": "工場の トイレ"
          },
          {
            "key": "C",
            "text": "更衣室"
          },
          {
            "key": "D",
            "text": "食堂の テラス"
          }
        ],
        "correctKey": "A",
        "explanation": "Aturan tertulis: 屋外の指定喫煙所（第3倉庫の裏）以外では一切吸えません."
      }
    ],
    "studentSubmissions": [
      {
        "studentId": 101,
        "studentName": "Khalis Soffi",
        "email": "khalis.soffi@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        "score": 90,
        "submittedAt": "22 Nov 2026, 15:40 WIB",
        "status": "graded",
        "feedback": "Pemahaman membaca 20 teks memo dan SOP perusahaan sangat baik!"
      },
      {
        "studentId": 102,
        "studentName": "Dimas Aditya",
        "email": "dimas.aditya@creativabridging.com",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face",
        "score": 85,
        "submittedAt": "22 Nov 2026, 16:10 WIB",
        "status": "graded",
        "feedback": "Bagus, teliti kembali dalam membaca syarat waktu dan catatan kaki."
      }
    ]
  },
  {
    "id": 6,
    "title": "Quiz N4 – Grammar Instruksi & Peraturan Kerja (JLPT Official N4)",
    "bab": "Bab 1 – Bunpou N4",
    "level": "N4",
    "classRoom": "N4 A - PAGI",
    "curriculumSource": "JLPT Official N4",
    "category": "Grammar",
    "categoryLabel": "✏️ Grammar (文法)",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "35:00",
    "durationMinutes": 35,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "kyoto_street",
    "badgeColor": "bg-teal-50 text-teal-700",
    "submissionsCount": 0,
    "totalStudents": 1,
    "questions": [
      {
        "id": 1,
        "category": "Grammar",
        "question": "工場内では 安全のために、ヘルメットを かぶら（　）。",
        "translation": "Pilihlah bentuk ungkapan kewajiban yang tepat (~harus memakai helm).",
        "wordJp": "なければなりません",
        "furigana": "なければなりません",
        "options": [
          {
            "key": "A",
            "text": "なければなりません (Nakereba narimasen - Wajib/harus)"
          },
          {
            "key": "B",
            "text": "てもいいです (Te mo ii desu - Boleh)"
          },
          {
            "key": "C",
            "text": "ないでください (Nai de kudasai - Tolong jangan)"
          },
          {
            "key": "D",
            "text": "たことがあります (Ta koto ga arimasu - Pernah)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola kewajiban mutlak di tempat kerja memakai bentuk ~なければなりません."
      },
      {
        "id": 2,
        "category": "Grammar",
        "question": "この 機械は 危険ですから、触っ（　）。",
        "translation": "Mesin ini berbahaya, jadi Anda DILARANG menyentuhnya.",
        "wordJp": "てはいけません",
        "furigana": "てはいけません",
        "options": [
          {
            "key": "A",
            "text": "てはいけません (Te wa ikemasen - Dilarang keras)"
          },
          {
            "key": "B",
            "text": "てもかまいません (Boleh saja)"
          },
          {
            "key": "C",
            "text": "てください (Tolong lakukan)"
          },
          {
            "key": "D",
            "text": "たほうがいいです (Sebaiknya)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola larangan keselamatan kerja memakai bentuk [Kata Kerja te] + はいけません."
      },
      {
        "id": 3,
        "category": "Grammar",
        "question": "仕事が 終わったら、必ず パソコンの 電源を 切っ（　）おいてください。",
        "translation": "Jika pekerjaan selesai, pastikan mematikan daya komputer sebagai persiapan.",
        "wordJp": "ておく",
        "furigana": "ておく",
        "options": [
          {
            "key": "A",
            "text": "て (Te - Pola ~te oku tindakan persiapan)"
          },
          {
            "key": "B",
            "text": "た (Ta)"
          },
          {
            "key": "C",
            "text": "ない (Nai)"
          },
          {
            "key": "D",
            "text": "ば (Ba)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola ~ておく (~te oku) menyatakan tindakan persiapan."
      },
      {
        "id": 4,
        "category": "Grammar",
        "question": "日本で 働い（　）ことが ありますか。",
        "translation": "Apakah Anda pernah memiliki pengalaman bekerja di Jepang?",
        "wordJp": "た",
        "furigana": "た",
        "options": [
          {
            "key": "A",
            "text": "た (Ta - Pola ~ta koto ga arimasu pengalaman)"
          },
          {
            "key": "B",
            "text": "て (Te)"
          },
          {
            "key": "C",
            "text": "る (Ru)"
          },
          {
            "key": "D",
            "text": "ない (Nai)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola riwayat/pengalaman masa lalu memakai bentuk lampau: [Bentuk Lampau ta] + ことがあります."
      },
      {
        "id": 5,
        "category": "Grammar",
        "question": "熱が 38度も あるので、今日は 病院へ 行く（　）に します。",
        "translation": "Pilihlah ungkapan keputusan pribadi (~memutuskan untuk pergi ke klinik).",
        "wordJp": "こと",
        "furigana": "こと",
        "options": [
          {
            "key": "A",
            "text": "こと (Koto - Pola ~koto ni suru memutuskan)"
          },
          {
            "key": "B",
            "text": "もの (Mono)"
          },
          {
            "key": "C",
            "text": "よう (You)"
          },
          {
            "key": "D",
            "text": "わけ (Wake)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola [Bentuk Kamus] + ことにする (koto ni suru) bermakna mengambil keputusan pribadi."
      },
      {
        "id": 6,
        "category": "Grammar",
        "question": "油が 漏れているので、ここを 走ら（　）ください。",
        "translation": "Karena ada tumpahan minyak, tolong JANGAN berlari di area ini.",
        "wordJp": "ないで",
        "furigana": "ないで",
        "options": [
          {
            "key": "A",
            "text": "ないで (naide - Pola ~naide kudasai tolong jangan)"
          },
          {
            "key": "B",
            "text": "なくて (nakute)"
          },
          {
            "key": "C",
            "text": "ずに (zuni)"
          },
          {
            "key": "D",
            "text": "ぬ (nu)"
          }
        ],
        "correctKey": "A",
        "explanation": "Permintaan larangan halus: [Bentuk Negatif nai] + でください (走らないでください)."
      },
      {
        "id": 7,
        "category": "Grammar",
        "question": "熱が 下がらないなら、今日は 無理を し（　）ほうが いいですよ。",
        "translation": "Jika demam belum turun, sebaiknya Anda TIDAK memaksakan diri bekerja hari ini.",
        "wordJp": "ない",
        "furigana": "ない",
        "options": [
          {
            "key": "A",
            "text": "ない (nai - Pola ~nai hou ga ii)"
          },
          {
            "key": "B",
            "text": "た (ta)"
          },
          {
            "key": "C",
            "text": "る (ru)"
          },
          {
            "key": "D",
            "text": "て (te)"
          }
        ],
        "correctKey": "A",
        "explanation": "Saran untuk tidak melakukan sesuatu: [Bentuk Negatif nai] + ほうがいい (しないほうがいい)."
      },
      {
        "id": 8,
        "category": "Grammar",
        "question": "来年、JLPT N3に 合格し（　）と 思っています。",
        "translation": "Pilihlah bentuk ajakan batin volitional (saya berniat lulus JLPT N3 tahun depan).",
        "wordJp": "よう",
        "furigana": "よう",
        "options": [
          {
            "key": "A",
            "text": "よう (you - Bentuk Volitional + と思っています)"
          },
          {
            "key": "B",
            "text": "たい (tai)"
          },
          {
            "key": "C",
            "text": "ます (masu)"
          },
          {
            "key": "D",
            "text": "る (ru)"
          }
        ],
        "correctKey": "A",
        "explanation": "Niat pribadi yang sudah dipertimbangkan: [Bentuk Maksud / Volitional] + と思っています (合格しようと思っています)."
      },
      {
        "id": 9,
        "category": "Grammar",
        "question": "日本に 3年間 滞在する（　）です。",
        "translation": "Pilihlah ungkapan rencana pasti (~berencana tinggal selama 3 tahun).",
        "wordJp": "つもり",
        "furigana": "つもり",
        "options": [
          {
            "key": "A",
            "text": "つもり (Tsumori - Berencana pasti)"
          },
          {
            "key": "B",
            "text": "はず (Hazu)"
          },
          {
            "key": "C",
            "text": "わけ (Wake)"
          },
          {
            "key": "D",
            "text": "こと (Koto)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola rencana terarah: [Bentuk Kamus] + つもりです (滞在するつもりです)."
      },
      {
        "id": 10,
        "category": "Grammar",
        "question": "わたしは フォークリフトを 運転する ことが（　）。",
        "translation": "Pilihlah ungkapan kemampuan (saya BISA mengemudikan forklift).",
        "wordJp": "できます",
        "furigana": "できます",
        "options": [
          {
            "key": "A",
            "text": "できます (Dekimasu - Bisa / Mampu)"
          },
          {
            "key": "B",
            "text": "あります (Arimasu)"
          },
          {
            "key": "C",
            "text": "します (Shimasu)"
          },
          {
            "key": "D",
            "text": "なります (Narimasu)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola kompetensi/kemampuan: [Bentuk Kamus] + ことができます (運転することができます)."
      },
      {
        "id": 11,
        "category": "Grammar",
        "question": "先輩の 指示を 聞き（　）、メモを 取りました。",
        "translation": "Pilihlah pola dua aktivitas simultan (mencatat SAMBIL mendengarkan instruksi).",
        "wordJp": "ながら",
        "furigana": "ながら",
        "options": [
          {
            "key": "A",
            "text": "ながら (Nagara - Sambil)"
          },
          {
            "key": "B",
            "text": "つつも (Tsutsumo)"
          },
          {
            "key": "C",
            "text": "間に (Aida ni)"
          },
          {
            "key": "D",
            "text": "までに (Made ni)"
          }
        ],
        "correctKey": "A",
        "explanation": "Melakukan dua aktivitas sekaligus: [Batang Kata Kerja masu] + ながら (聞きながら)."
      },
      {
        "id": 12,
        "category": "Grammar",
        "question": "この 工場は 給料も いい（　）、社員も 親切です。",
        "translation": "Pilihlah partikel pemaparan alasan jamak paralel (~selain gaji bagus, karyawannya juga ramah).",
        "wordJp": "し",
        "furigana": "し",
        "options": [
          {
            "key": "A",
            "text": "し (shi - Selain itu / dan juga)"
          },
          {
            "key": "B",
            "text": "から (kara)"
          },
          {
            "key": "C",
            "text": "ので (node)"
          },
          {
            "key": "D",
            "text": "のに (noni)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola menjabarkan beberapa alasan sejajar: [Bentuk Biasa] + し (給料もいいし、社員も親切です)."
      },
      {
        "id": 13,
        "category": "Grammar",
        "question": "機械の 異常音が 聞こえ（　）、すぐに 非常停止ボタンを 押してください。",
        "translation": "Pilihlah bentuk kondisional pengandaian (~JIKA terdengar suara aneh).",
        "wordJp": "たら",
        "furigana": "たら",
        "options": [
          {
            "key": "A",
            "text": "たら (tara - Jika / Apabila terjadi)"
          },
          {
            "key": "B",
            "text": "ても (temo)"
          },
          {
            "key": "C",
            "text": "のに (noni)"
          },
          {
            "key": "D",
            "text": "から (kara)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pengandaian kondisi darurat: [Bentuk Lampau ta] + ら (聞こえたら)."
      },
      {
        "id": 14,
        "category": "Grammar",
        "question": "雨が 降っ（　）、屋外の 作業を 続けます。",
        "translation": "Pilihlah pola pertentangan kontradiksi (~MESKIPUN hujan turun, pekerjaan tetap berlanjut).",
        "wordJp": "ても",
        "furigana": "ても",
        "options": [
          {
            "key": "A",
            "text": "ても (temo - Meskipun / Walaupun)"
          },
          {
            "key": "B",
            "text": "たら (tara)"
          },
          {
            "key": "C",
            "text": "ので (node)"
          },
          {
            "key": "D",
            "text": "なら (nara)"
          }
        ],
        "correctKey": "A",
        "explanation": "Pola konsesif: [Bentuk te] + も (降っても)."
      },
      {
        "id": 15,
        "category": "Grammar",
        "question": "荷物が 重（　）て、一人では 運べません。",
        "translation": "Pilihlah bentuk derajat berlebihan (~terlalu berat).",
        "wordJp": "すぎ",
        "furigana": "すぎ",
        "options": [
          {
            "key": "A",
            "text": "すぎ (sugi - Terlalu berlebihan)"
          },
          {
            "key": "B",
            "text": "たい (tai)"
          },
          {
            "key": "C",
            "text": "やすい (yasui)"
          },
          {
            "key": "D",
            "text": "にくい (nikui)"
          }
        ],
        "correctKey": "A",
        "explanation": "Menyatakan kadar melampaui batas: [Batang Kata Sifat] + すぎる (重すぎて)."
      },
      {
        "id": 16,
        "category": "Grammar",
        "question": "この 工具は とても 使い（　）です。",
        "translation": "Pilihlah pola yang menyatakan suatu alat mudah digunakan.",
        "wordJp": "やすい",
        "furigana": "やすい",
        "options": [
          {
            "key": "A",
            "text": "やすい (yasui - Mudah dilakukan)"
          },
          {
            "key": "B",
            "text": "にくい (nikui - Sulit)"
          },
          {
            "key": "C",
            "text": "づらい (zurai)"
          },
          {
            "key": "D",
            "text": "がたい (gatai)"
          }
        ],
        "correctKey": "A",
        "explanation": "Kemudahan penggunaan: [Batang Kata Kerja masu] + やすい (使いやすい)."
      },
      {
        "id": 17,
        "category": "Grammar",
        "question": "空が 暗く なって、今にも 雨が 降り（　）です。",
        "translation": "Pilihlah pola perkiraan visual (~kelihatannya akan segera turun hujan).",
        "wordJp": "そう",
        "furigana": "そう",
        "options": [
          {
            "key": "A",
            "text": "そう (sou - Kelihatannya akan terjadi)"
          },
          {
            "key": "B",
            "text": "よう (you)"
          },
          {
            "key": "C",
            "text": "らしい (rashii)"
          },
          {
            "key": "D",
            "text": "はず (hazu)"
          }
        ],
        "correctKey": "A",
        "explanation": "Tanda visual sesuatu akan segera terjadi: [Batang masu] + そうです (降りそうです)."
      },
      {
        "id": 18,
        "category": "Grammar",
        "question": "もう 一度、ネジが 締まっているか 確かめ（　）みます。",
        "translation": "Pilihlah pola mencoba melakukan suatu tindakan (~mencoba memastikan).",
        "wordJp": "て",
        "furigana": "て",
        "options": [
          {
            "key": "A",
            "text": "て (te - Pola ~te miru mencoba)"
          },
          {
            "key": "B",
            "text": "た (ta)"
          },
          {
            "key": "C",
            "text": "ない (nai)"
          },
          {
            "key": "D",
            "text": "ば (ba)"
          }
        ],
        "correctKey": "A",
        "explanation": "Mencoba melakukan tindakan untuk melihat hasilnya: [Bentuk te] + みる (確かめてみます)."
      },
      {
        "id": 19,
        "category": "Grammar",
        "question": "課長は もう お帰りに（　）ました。",
        "translation": "Pilihlah kata kerja bantu penghormatan Sonkeigo (~Bapak Kacho sudah berkenan pulang).",
        "wordJp": "なり",
        "furigana": "なり",
        "options": [
          {
            "key": "A",
            "text": "なり (nari - Pola penghormatan: お + [Batang] + になる)"
          },
          {
            "key": "B",
            "text": "し (shi)"
          },
          {
            "key": "C",
            "text": "いたし (itashi)"
          },
          {
            "key": "D",
            "text": "まいり (mairi)"
          }
        ],
        "correctKey": "A",
        "explanation": "Bentuk sopan penghormatan aktivitas atasan (Sonkeigo): お + [Batang masu] + になる (お帰りになりました)."
      },
      {
        "id": 20,
        "category": "Grammar",
        "question": "社長、わたしが その 荷物を お持ち（　）ます。",
        "translation": "Pilihlah kata kerja bantu merendahkan diri Kenjougo (~izinkan saya yang membawakan barang tersebut).",
        "wordJp": "し",
        "furigana": "し",
        "options": [
          {
            "key": "A",
            "text": "し (shi - Pola Kenjougo: お + [Batang] + する)"
          },
          {
            "key": "B",
            "text": "なり (nari)"
          },
          {
            "key": "C",
            "text": "くださり (kudasari)"
          },
          {
            "key": "D",
            "text": "なさい (nasai)"
          }
        ],
        "correctKey": "A",
        "explanation": "Merendahkan diri saat melayani atasan (Kenjougo): お + [Batang masu] + します (お持ちします)."
      }
    ],
    "studentSubmissions": []
  },
  {
    "id": 7,
    "title": "Quiz N4 – Komunikasi Kerja Hou-Ren-So & Izin Terlambat (Irodori A2)",
    "bab": "Bab 2 – Hou-Ren-So di Tempat Kerja",
    "level": "N4",
    "classRoom": "N4 A - PAGI",
    "curriculumSource": "Irodori (SSW Tokutei Ginou A2)",
    "category": "Situasional",
    "categoryLabel": "🤝 Situasional & Komunikasi",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "35:00",
    "durationMinutes": 35,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "torii_gate",
    "badgeColor": "bg-sky-50 text-sky-700",
    "submissionsCount": 0,
    "totalStudents": 1,
    "questions": [
      {
        "id": 1,
        "category": "Situasional",
        "passage": "状況：作業中、突然機械から異音がして停止しました。あなたはどうしますか。\n(Situasi: Saat bekerja, tiba-tiba mesin mengeluarkan suara aneh dan berhenti beroperasi).",
        "question": "機械に トラブルが 起きたとき、最初に すべき 最も 適切な 行動（報連相）は？",
        "translation": "Menurut prinsip Hou-Ren-So, tindakan apa yang harus pertama kali dilakukan saat terjadi kendala mesin?",
        "wordJp": "リーダーに報告する",
        "furigana": "りーだーにほうこくする",
        "options": [
          {
            "key": "A",
            "text": "すぐに 作業を 止めて、リーダーに 報告する (Segera hentikan dan laporkan ke pemimpin)"
          },
          {
            "key": "B",
            "text": "自分で 機械を 分解して 直そうとする"
          },
          {
            "key": "C",
            "text": "何も 言わずに 帰る"
          },
          {
            "key": "D",
            "text": "誰にも 気づかれないように 隠す"
          }
        ],
        "correctKey": "A",
        "explanation": "Prinsip keselamatan Hou-Ren-So (報告): segera matikan mesin dan laporkan ke atasan sebelum mengambil tindakan mandiri yang berbahaya."
      },
      {
        "id": 2,
        "category": "Situasional",
        "passage": "状況：電車が事故で遅延し、始業時間の8時30分に間に合いそうにありません。\n(Situasi: Kereta terlambat karena insiden kecelakaan rel, Anda memperkirakan tidak sempat masuk tepat jam 08:30).",
        "question": "会社に 電話で 連絡する際、伝えるべき 最も 適切な 内容は？",
        "translation": "Apa saja informasi esensial yang harus disampaikan saat menelepon kantor karena kereta tertunda?",
        "wordJp": "理由と到着予定時刻",
        "furigana": "りゆうととうちゃくよていじこく",
        "options": [
          {
            "key": "A",
            "text": "電車の遅延の理由と、到着予定時刻を 連絡する (Alasan keterlambatan & perkiraan jam tiba)"
          },
          {
            "key": "B",
            "text": "今日一日 無断欠勤すると 伝える"
          },
          {
            "key": "C",
            "text": "JR会社に 文句を 言う"
          },
          {
            "key": "D",
            "text": "到着してから 理由を 言えば 電話は 不要"
          }
        ],
        "correctKey": "A",
        "explanation": "Dalam etika kerja Jepang (連絡), karyawan wajib menelepon sebelum jam kerja dimulai, menjelaskan penyebab dan perkiraan waktu tiba di lokasi."
      },
      {
        "id": 3,
        "category": "Situasional",
        "passage": "状況：駅で遅延証明書をもらいました。会社に着いたらどうしますか。\n(Situasi: Anda menerima Chien Shoumeisho / Surat Bukti Keterlambatan di loket stasiun).",
        "question": "駅で もらった「遅延証明書」は どうしますか。",
        "translation": "Bagaimanakah penanganan surat bukti keterlambatan stasiun kereta setelah Anda tiba di kantor?",
        "wordJp": "事務所の上司や人事へ提出する",
        "furigana": "じむしょのじょうしやじんじへていしゅつする",
        "options": [
          {
            "key": "A",
            "text": "事務所の 上司や 人事担当者に 提出する (Serahkan ke atasan/HRD)"
          },
          {
            "key": "B",
            "text": "ゴミ箱に 捨てる"
          },
          {
            "key": "C",
            "text": "鞄に 入れたまま 忘れる"
          },
          {
            "key": "D",
            "text": "駅に 返しに 行く"
          }
        ],
        "correctKey": "A",
        "explanation": "Chien Shoumeisho wajib diserahkan ke bagian HRD/atasan agar keterlambatan tidak memotong absensi kehadiran."
      },
      {
        "id": 4,
        "category": "Situasional",
        "passage": "状況：上司から指示を受けましたが、専門用語が聞き取れませんでした。\n(Situasi: Atasan memberikan instruksi kerja, namun ada istilah teknis yang belum Anda pahami dengan jelas).",
        "question": "指示の 内容が よく 分からなかったとき、何と 言いますか。",
        "translation": "Ungkapan sopan apa yang diucapkan saat Anda belum jelas menangkap instruksi atasan?",
        "wordJp": "もう一度確認してもよろしいでしょうか",
        "furigana": "もういちどかくにんしてもよろしいでしょうか",
        "options": [
          {
            "key": "A",
            "text": "恐れ入りますが、もう一度 確認させていただけますか (Boleh mohon dikonfirmasi sekali lagi)"
          },
          {
            "key": "B",
            "text": "分かりました（実は 分かっていない）"
          },
          {
            "key": "C",
            "text": "もっと ゆっくり 喋ってください"
          },
          {
            "key": "D",
            "text": "聞き取れませんでしたので 無視します"
          }
        ],
        "correctKey": "A",
        "explanation": "Prinsip 相談/確認: Jangan pernah berpura-pura paham. Gunakan ungkapan sopan: 「恐れ入りますが、もう一度確認させていただけますか」。"
      },
      {
        "id": 5,
        "category": "Situasional",
        "passage": "状況：指示された作業がすべて完了しました。\n(Situasi: Seluruh pekerjaan yang ditugaskan telah berhasil Anda selesaikan).",
        "question": "作業が 完了したときの 上司への 報告の 言葉として 適切なものは？",
        "translation": "Kalimat laporan apa yang diucapkan ke atasan saat pekerjaan telah tuntas?",
        "wordJp": "指示された作業が完了いたしました",
        "furigana": "しじされたさぎょうがかんりょういたしました",
        "options": [
          {
            "key": "A",
            "text": "指示された 作業が 完了いたしました。ご確認 お願いします (Telah tuntas, mohon diperiksa)"
          },
          {
            "key": "B",
            "text": "終わったから 休憩します"
          },
          {
            "key": "C",
            "text": "何も 言わずに スマホを 見る"
          },
          {
            "key": "D",
            "text": "もう 帰っても いいですか"
          }
        ],
        "correctKey": "A",
        "explanation": "Setelah tugas selesai, wajib melapor dan meminta pemeriksaan hasil kerja: 「作業が完了いたしました。ご確認お願いします」。"
      },
      {
        "id": 6,
        "category": "Situasional",
        "passage": "状況：段ボールの角で指を切ってしまい、少し血が出ました。\n(Situasi: Jari tergores sudut tajam kardus dan mengeluarkan sedikit darah).",
        "question": "作業中に 怪我を したとき、どうしますか。",
        "translation": "Bagaimanakah tindakan yang benar saat mengalami luka kerja ringan?",
        "wordJp": "リーダーに報告し、救急箱で手当する",
        "furigana": "りーだーにほうこくし、きゅうきゅうばこでてあてする",
        "options": [
          {
            "key": "A",
            "text": "リーダーに 報告し、救急箱で 消毒して 絆創膏を 貼る (Lapor pemimpin & obati luka di P3K)"
          },
          {
            "key": "B",
            "text": "血を 作業着で 拭いて 黙っている"
          },
          {
            "key": "C",
            "text": "痛いけど 我慢して 放置する"
          },
          {
            "key": "D",
            "text": "製品に 血が ついても 気にしない"
          }
        ],
        "correctKey": "A",
        "explanation": "Semua kecelakaan kerja sekecil apapun wajib dilaporkan demi higienitas produk dan keselamatan: lapor dan lakukan penanganan medis P3K."
      },
      {
        "id": 7,
        "category": "Situasional",
        "passage": "状況：通路の床に油が垂れていて、滑りそうになりました。\n(Situasi: Anda hampir terpeleset karena ada tetesan oli licin di lantai lorong).",
        "question": "「ヒヤリ・ハット（危ない体験）」が あったとき、どう行動しますか。",
        "translation": "Bagaimanakah sikap yang tepat saat mengalami kejadian nyaris celaka (Hiyari Hatto)?",
        "wordJp": "リーダーに報告し、油を拭き取る",
        "furigana": "りーだーにほうこくし、あぶらをふきとる",
        "options": [
          {
            "key": "A",
            "text": "リーダーに 報告し、注意表示を 立てて 油を 拭き取る (Lapor, pasang tanda awas & bersihkan oli)"
          },
          {
            "key": "B",
            "text": "自分は 転ばなかったから 無視する"
          },
          {
            "key": "C",
            "text": "次の 人が 転ぶのを 見て笑う"
          },
          {
            "key": "D",
            "text": "写真を 撮って SNSに 上げる"
          }
        ],
        "correctKey": "A",
        "explanation": "Prinsip pencegahan Hiyari Hatto: laporkan dan segera bersihkan agar tidak mencelakai pekerja berikutnya."
      },
      {
        "id": 8,
        "category": "Situasional",
        "passage": "状況：出荷する製品のラベルを貼り間違えてしまいました。\n(Situasi: Salah menempelkan label kode pada produk yang akan dikirim).",
        "question": "作業ミスを してしまったとき、どうしますか。",
        "translation": "Apa yang harus dilakukan saat menyadari diri sendiri telah membuat kesalahan penempelan label?",
        "wordJp": "すぐに正直に上司に報告する",
        "furigana": "すぐにしょうじきにじょうしにほうこくする",
        "options": [
          {
            "key": "A",
            "text": "すぐに 正直に 上司に 報告し、指示を 仰ぐ (Segera lapor jujur ke atasan & ikuti arahan)"
          },
          {
            "key": "B",
            "text": "間違えた ラベルを 隠して 出荷する"
          },
          {
            "key": "C",
            "text": "他の 人の せいに する"
          },
          {
            "key": "D",
            "text": "知らん顔を して 逃げる"
          }
        ],
        "correctKey": "A",
        "explanation": "Kejujuran adalah pondasi utama Hou-Ren-So: segera lapor agar dapat segera diatasi sebelum barang terlanjur sampai ke konsumen."
      },
      {
        "id": 9,
        "category": "Situasional",
        "passage": "状況：外出中の先輩宛てにお客様から電話がありました。「折り返し電話をください」とのことです。\n(Situasi: Ada telepon untuk senior yang sedang bertugas di luar: klien memohon ditelepon balik).",
        "question": "先輩が 戻ってきたとき、どのように 伝えますか。",
        "translation": "Bagaimanakah cara menyampaikan pesan telepon kepada senior saat beliau tiba di kantor?",
        "wordJp": "伝言メモを机に置き、口頭でも伝える",
        "furigana": "でんごんめもをつくえにおき、こうとうでもつたえる",
        "options": [
          {
            "key": "A",
            "text": "相手の名前・日時・要件を 書いた メモを 机に 置き、口頭でも 報告する (Tulis memo pesan & lapor lisan)"
          },
          {
            "key": "B",
            "text": "電話が あったことを 忘れる"
          },
          {
            "key": "C",
            "text": "先輩が 聞いてくるまで 言わない"
          },
          {
            "key": "D",
            "text": "関係ないから 放置する"
          }
        ],
        "correctKey": "A",
        "explanation": "SOP pesan telepon: catat nama penelepon, jam, isi pesan, tempel di meja dan sampaikan secara lisan saat senior kembali."
      },
      {
        "id": 10,
        "category": "Situasional",
        "passage": "状況：14時から会議が始まります。何時に会議室に入りますか。\n(Situasi: Rapat internal akan dimulai tepat pukul 14:00).",
        "question": "日本の ビジネス習慣として、会議室に 入る 適切な タイミングは？",
        "translation": "Kapan waktu yang paling tepat dan sopan untuk memasuki ruang rapat?",
        "wordJp": "5分〜10分前",
        "furigana": "ごふんからじゅっぷんまえ",
        "options": [
          {
            "key": "A",
            "text": "5分〜10分前には 着席して 準備する (Sudah duduk dan bersiap 5-10 menit sebelum jam mulai)"
          },
          {
            "key": "B",
            "text": "14時ちょうどに ドアを 開ける"
          },
          {
            "key": "C",
            "text": "10分 遅れて 入る"
          },
          {
            "key": "D",
            "text": "開始後に 慌てて 駆け込む"
          }
        ],
        "correctKey": "A",
        "explanation": "Aturan 5 menit sebelumnya (5-fun mae koudou): sudah siap di tempat duduk sebelum waktu mulai."
      },
      {
        "id": 11,
        "category": "Situasional",
        "passage": "状況：先輩から「作業の手順が間違っているよ」と注意を受けました。\n(Situasi: Senior menegur: \"Langkah urutan kerjamu keliru lho\").",
        "question": "注意や 指導を 受けたとき、どう 答えますか。",
        "translation": "Respon profesional apa yang diucapkan saat menerima koreksi arahan dari senior?",
        "wordJp": "ご指導ありがとうございます。すぐに修正します",
        "furigana": "ごしどうありがとうございます。すぐにしゅうせいします",
        "options": [
          {
            "key": "A",
            "text": "教えていただき ありがとうございます。すぐに 修正します (Terima kasih atas masukannya, segera saya perbaiki)"
          },
          {
            "key": "B",
            "text": "うるさいですね (Berisik sekali)"
          },
          {
            "key": "C",
            "text": "私の 勝手です (Terserah saya dong)"
          },
          {
            "key": "D",
            "text": "怒られたから もう やりません (Ngambek / mogok kerja)"
          }
        ],
        "correctKey": "A",
        "explanation": "Sikap profesional Jepang: berterima kasih atas bimbingan dan segera membetulkan kesalahan."
      },
      {
        "id": 12,
        "category": "Situasional",
        "passage": "状況：定時（17時30分）になりましたが、今日中に終わらせるべき検品がまだ残っています。\n(Situasi: Waktu pulang tiba jam 17:30, namun inspeksi barang yang harus selesai hari ini masih tersisa).",
        "question": "このような 状況のとき、上司に どう 相談しますか。",
        "translation": "Bagaimanakah kalimat konsultasi yang benar ke atasan terkait pekerjaan mendesak yang belum tuntas?",
        "wordJp": "残業して終わらせるべきか相談する",
        "furigana": "ざんぎょうしておわらせるべきかそうだんする",
        "options": [
          {
            "key": "A",
            "text": "残業して 今日中に 終わらせるべきか、上司に 判断を 仰ぐ (Konsultasi ke atasan apakah diselesaikan lembur)"
          },
          {
            "key": "B",
            "text": "勝手に 途中で 放置して 帰る"
          },
          {
            "key": "C",
            "text": "誰にも 言わずに 徹夜する"
          },
          {
            "key": "D",
            "text": "明日の 人に 押し付ける"
          }
        ],
        "correctKey": "A",
        "explanation": "Prinsip 相談 (Soudan): jangan mengambil keputusan sepihak apakah lembur atau lanjut esok hari, konsultasikan ke atasan."
      },
      {
        "id": 13,
        "category": "Situasional",
        "passage": "状況：廊下で取引先のお客様が迷っている様子です。\n(Situasi: Seorang tamu eksternal terlihat bingung di lorong lantai kantor).",
        "question": "困っている お客様を 見かけたとき、何と 声を かけますか。",
        "translation": "Sapaan pelayanan apa yang diucapkan saat melihat tamu yang tampak kebingungan?",
        "wordJp": "いかがなさいましたか / どちらをお探しですか",
        "furigana": "いかがなさいましたか / どちらをおさがしですか",
        "options": [
          {
            "key": "A",
            "text": "恐れ入ります、どちらを お探しでしょうか (Permisi, apakah ada ruangan yang sedang Anda cari?)"
          },
          {
            "key": "B",
            "text": "誰ですか、関係者以外 立ち入り禁止です (Siapa Anda? Dilarang masuk)"
          },
          {
            "key": "C",
            "text": "迷子ですか、恥ずかしいですね"
          },
          {
            "key": "D",
            "text": "無視して 通り過ぎる"
          }
        ],
        "correctKey": "A",
        "explanation": "Etika menerima tamu perusahaan: sapa dengan ramah: 「恐れ入ります、どちらをお探しでしょうか」。"
      },
      {
        "id": 14,
        "category": "Situasional",
        "passage": "状況：製造ラインで作業中、どうしてもトイレに行きたくなりました。\n(Situasi: Sedang bertugas di ban berjalan perakitan, mendesak ingin ke kamar kecil).",
        "question": "ベルトコンベアの 作業中に トイレへ 行く 正しい 手順は？",
        "translation": "Prosedur keselamatan apa yang harus dilakukan sebelum meninggalkan jalur ban berjalan?",
        "wordJp": "交代の人を呼んでもらい許可を得る",
        "furigana": "こうたいのひとをよんでもらいきょかをえる",
        "options": [
          {
            "key": "A",
            "text": "リーダーに 合図し、交代要員に 入って もらってから 行く (Beri sinyal ke pemimpin, tunggu pengganti)"
          },
          {
            "key": "B",
            "text": "何も 言わずに 持ち場を 走って 離れる"
          },
          {
            "key": "C",
            "text": "ライン全体の 電源を 勝手に 切る"
          },
          {
            "key": "D",
            "text": "我慢して 倒れる"
          }
        ],
        "correctKey": "A",
        "explanation": "Jangan pernah meninggalkan lini produksi tanpa ada pengganti: beri sinyal agar rekan pengganti masuk terlebih dahulu."
      },
      {
        "id": 15,
        "category": "Situasional",
        "passage": "状況：エレベーターを待っていたら、社長が来られました。\n(Situasi: Sedang menunggu pintu lift terbuka, pimpinan utama perusahaan datang).",
        "question": "エレベーターに 乗るときの マナーとして 正しい ものは？",
        "translation": "Etika apa yang benar saat menggunakan lift bersama direktur pimpinan?",
        "wordJp": "「開」ボタンを押して社長を先に通す",
        "furigana": "ひらくぼたんをおしてしゃちょうをさきにとおす",
        "options": [
          {
            "key": "A",
            "text": "ドアの「開」ボタンを 押して、社長を 先に 案内する (Tahan tombol \"Open\" & persilakan beliau masuk lebih dulu)"
          },
          {
            "key": "B",
            "text": "社長を 押しのけて 一番奥に 座る"
          },
          {
            "key": "C",
            "text": "社長と 目を 合わせず スマホに 集中する"
          },
          {
            "key": "D",
            "text": "社長を 残して 自分だけ ドアを 閉める"
          }
        ],
        "correctKey": "A",
        "explanation": "Etika lift bisnis: junior menahan tombol buka pintu dan mempersilakan pimpinan masuk terlebih dahulu."
      },
      {
        "id": 16,
        "category": "Situasional",
        "passage": "状況：同僚から仕事帰りの飲みに誘われましたが、今日は日本語の試験勉強があります。\n(Situasi: Rekan kerja mengajak minum santai setelah kerja, namun malam ini Anda harus belajar ujian).",
        "question": "角を 立てずに 丁寧に 断る 適切な 言い方は？",
        "translation": "Cara menolak ajakan kumpul dengan sopan tanpa menyinggung perasaan rekan kerja?",
        "wordJp": "あいにく先約がございまして、またぜひ誘ってください",
        "furigana": "あいにくせんやくがございまして、またぜひさそってください",
        "options": [
          {
            "key": "A",
            "text": "お誘い ありがとうございます。今日は 予定が ありまして、また ぜひ 誘ってください (Terima kasih ajakannya, malam ini ada jadwal, lain kali ajak lagi ya)"
          },
          {
            "key": "B",
            "text": "お酒は 嫌いですから 行きません (Gak suka minuman)"
          },
          {
            "key": "C",
            "text": "あなたと 飲むのは 迷惑です"
          },
          {
            "key": "D",
            "text": "無視して 帰る"
          }
        ],
        "correctKey": "A",
        "explanation": "Menolak ajakan: apresiasi ajakannya, sampaikan permohonan maaf karena ada agenda, dan buka kesempatan lain kali."
      },
      {
        "id": 17,
        "category": "Situasional",
        "passage": "状況：上司から「明日の資料、頼むね」と言われましたが、締め切り時刻が分かりません。\n(Situasi: Atasan meminta: \"Tolong berkas besok ya\", namun belum jelas jam berapa harus diserahkan).",
        "question": "締め切りを 確認する 正しい 聞き方は どれですか。",
        "translation": "Kalimat konfirmasi tenggat waktu yang paling tepat kepada pimpinan?",
        "wordJp": "明日の何時までに提出すればよろしいでしょうか",
        "furigana": "あしたのなんじまでにていしゅつすればよろしいでしょうか",
        "options": [
          {
            "key": "A",
            "text": "明日の 何時までに 提出すれば よろしいでしょうか (Paling lambat jam berapa besok harus saya serahkan?)"
          },
          {
            "key": "B",
            "text": "いつ 出せば いいの？"
          },
          {
            "key": "C",
            "text": "明日の 夕方で いいよね"
          },
          {
            "key": "D",
            "text": "期限が ないなら 来週にします"
          }
        ],
        "correctKey": "A",
        "explanation": "Pastikan tenggat waktu spesifik agar tidak terlambat: 「何時までに提出すればよろしいでしょうか」。"
      },
      {
        "id": 18,
        "category": "Situasional",
        "passage": "状況：倉庫のネジの在庫が残り1箱になりました。発注には3日かかります。\n(Situasi: Stok baut di gudang tersisa 1 kotak lagi, proses pemesanan butuh waktu 3 hari).",
        "question": "このときの 適切な 報連相は どれですか。",
        "translation": "Langkah Hou-Ren-So yang tepat mengenai stok bahan baku yang menipis?",
        "wordJp": "在庫が切れる前に速やかに発注担当者に報告する",
        "furigana": "ざいこがきれるまえにすみやかにはっちゅうたんとうしゃにほうこくする",
        "options": [
          {
            "key": "A",
            "text": "在庫が 切れる 前に、速やかに 発注担当の 先輩へ 報告する (Lapor ke penanggung jawab sebelum stok habis)"
          },
          {
            "key": "B",
            "text": "最後の ネジが 完全に なくなるまで 黙っている"
          },
          {
            "key": "C",
            "text": "自分で ホームセンターへ 買いに 走る"
          },
          {
            "key": "D",
            "text": "在庫が なくなったら 仕事を 休む"
          }
        ],
        "correctKey": "A",
        "explanation": "Prinsip manajemen persediaan: lapor sebelum stok benar-benar kosong agar proses produksi tidak terhenti total."
      },
      {
        "id": 19,
        "category": "Situasional",
        "passage": "状況：会議で自分の意見を述べたいとき。\n(Situasi: Ingin mengutarakan pendapat pribadi dalam sesi diskusi rapat).",
        "question": "発言する 前に 使う 適切な 前置きは どれですか。",
        "translation": "Frasa pembuka etika apa yang digunakan sebelum menyampaikan pendapat di rapat?",
        "wordJp": "私の意見を述べさせていただいてもよろしいでしょうか",
        "furigana": "わたしのいけんをのべさせていただいてもよろしいでしょうか",
        "options": [
          {
            "key": "A",
            "text": "私の 意見を 述べさせて いただいても よろしいでしょうか (Bolehkah saya menyampaikan pandangan saya?)"
          },
          {
            "key": "B",
            "text": "みんな 間違っているから 聞いて (Kalian semua salah)"
          },
          {
            "key": "C",
            "text": "私の 言う通りに してください"
          },
          {
            "key": "D",
            "text": "黙って 手を 挙げるだけ"
          }
        ],
        "correctKey": "A",
        "explanation": "Meminta izin berbicara dalam rapat resmi: 「意見を述べさせていただいてもよろしいでしょうか」。"
      },
      {
        "id": 20,
        "category": "Situasional",
        "passage": "状況：1年間の日本実習が修了し、明日帰国することになりました。\n(Situasi: Masa magang 1 tahun di Jepang telah selesai, dan besok akan pulang ke tanah air).",
        "question": "最後の 朝礼で 職場の人たちに 伝える 感謝の 挨拶は？",
        "translation": "Kalimat perpisahan dan terima kasih atas bimbingan selama 1 tahun di hadapan seluruh staf?",
        "wordJp": "1年間大変お世話になり、心より感謝申し上げます",
        "furigana": "いちねんかんたいへんおせわになり、こころよりかんしゃもうしあげます",
        "options": [
          {
            "key": "A",
            "text": "1年間 大変 お世話になり、心より 感謝申し上げます (Terima kasih sedalam-dalamnya atas bimbingan selama 1 tahun ini)"
          },
          {
            "key": "B",
            "text": "やっと 帰れるから 嬉しいです"
          },
          {
            "key": "C",
            "text": "仕事が 辛かったので 忘れました"
          },
          {
            "key": "D",
            "text": "じゃあね、バイバイ"
          }
        ],
        "correctKey": "A",
        "explanation": "Standar etika perpisahan kerja: mengucapkan terima kasih tulus atas bimbingan dan kesempatan belajar yang diberikan."
      }
    ],
    "studentSubmissions": []
  },
  {
    "id": 8,
    "title": "Quiz N4 – Keselamatan Kerja & Rambu Pabrik (Irodori Anzen A2)",
    "bab": "Bab 3 – Keselamatan Kerja",
    "level": "N4",
    "classRoom": "N4 A - PAGI",
    "curriculumSource": "Irodori (SSW Tokutei Ginou A2)",
    "category": "Reading",
    "categoryLabel": "📖 Reading (読解)",
    "isOpen": true,
    "status": "Sedang Aktif",
    "statusCode": "running",
    "timeRemaining": "35:00",
    "durationMinutes": 35,
    "questionType": "Pilihan Ganda",
    "thumbnailType": "quiz_sheet",
    "badgeColor": "bg-rose-50 text-rose-700",
    "submissionsCount": 0,
    "totalStudents": 1,
    "questions": [
      {
        "id": 1,
        "category": "Reading",
        "passage": "【安全標識：立入禁止】\n「関係者以外 立入禁止。作業中は 落下物の 危険が あります。」",
        "question": "この 標識の「立入禁止（たちいりきんし）」は どういう 意味ですか。",
        "translation": "Apakah arti rambu keselamatan kerja \"Tachiiri Kinshi\"?",
        "wordJp": "入ってはいけない",
        "furigana": "はいってはいけない",
        "options": [
          {
            "key": "A",
            "text": "中へ 入っては いけない (Dilarang Masuk)"
          },
          {
            "key": "B",
            "text": "走っては いけない"
          },
          {
            "key": "C",
            "text": "静かに しなければ いけない"
          },
          {
            "key": "D",
            "text": "写真を 撮っては いけない"
          }
        ],
        "correctKey": "A",
        "explanation": "「立入禁止」(tachiiri kinshi) adalah rambu larangan keras memasuki area tertentu demi keamanan."
      },
      {
        "id": 2,
        "category": "Reading",
        "passage": "【スローガン：安全第一】\n「整理・整頓・清掃・清潔・躾（5S）を 徹底し、ゼロ災害を 目指しましょう。」",
        "question": "日本の 工場で 最も 重要視される「安全第一（あんぜんだいいち）」の 考え方は？",
        "translation": "Apakah filosofi utama dari semboyan \"Anzen Dai-ichi\" di lingkungan industri Jepang?",
        "wordJp": "安全が何よりも最優先",
        "furigana": "あんぜんがなによりもさいゆうせん",
        "options": [
          {
            "key": "A",
            "text": "生産の スピードよりも、作業員の 安全が 最も 優先される (Keselamatan kerja nomor satu)"
          },
          {
            "key": "B",
            "text": "早く 終わらせる ことが 一番 大切"
          },
          {
            "key": "C",
            "text": "お金を 稼ぐ ことが 一番 大切"
          },
          {
            "key": "D",
            "text": "機械を 壊さない ことが 唯一の 目的"
          }
        ],
        "correctKey": "A",
        "explanation": "安全第一 (Anzen Dai-ichi) bermakna keselamatan jiwa dan fisik pekerja berada di atas target kuantitas produksi."
      },
      {
        "id": 3,
        "category": "Reading",
        "passage": "【着用義務表示】\n「高所作業エリア：保護帽（ヘルメット）・安全帯（墜落制止用器具）着用義務」",
        "question": "高い 場所で 作業するとき、絶対に 装着しなければならない 器具は どれですか。",
        "translation": "Perlengkapan apa yang wajib dipasang saat bekerja di ketinggian (Kousho sagyou)?",
        "wordJp": "ヘルメットと安全帯",
        "furigana": "へるめっととあんぜんたい",
        "options": [
          {
            "key": "A",
            "text": "ヘルメットと 安全帯（墜落制止用器具）(Helm dan safety harness)"
          },
          {
            "key": "B",
            "text": "エプロンと スリッパ"
          },
          {
            "key": "C",
            "text": "サングラスと 帽子"
          },
          {
            "key": "D",
            "text": "腕時計"
          }
        ],
        "correctKey": "A",
        "explanation": "Bekerja di area tinggi wajib menggunakan Helm (保護帽) dan Safety Belt/Harness pencegah jatuh (安全帯)."
      },
      {
        "id": 4,
        "category": "Reading",
        "passage": "【火災報知器について】\n「火災を発見したときは、非常ベルを 強く 押し、大きな声で『火事だ！』と 周囲に 知らせてください。」",
        "question": "火事を 見つけたとき、最初に すべき 行動は？",
        "translation": "Tindakan darurat pertama saat mendeteksi kebakaran di pabrik?",
        "wordJp": "非常ベルを押し周囲に知らせる",
        "furigana": "ひじょうべるをおししゅういにしらせる",
        "options": [
          {
            "key": "A",
            "text": "非常ベルを 押し、大声で 周囲に 知らせる (Tekan bel darurat & teriak peringatan)"
          },
          {
            "key": "B",
            "text": "動画を 撮影して SNSに 投稿する"
          },
          {
            "key": "C",
            "text": "一人で 逃げて 黙っている"
          },
          {
            "key": "D",
            "text": "家に 帰る"
          }
        ],
        "correctKey": "A",
        "explanation": "SOP tanggap darurat: bunyikan alarm darurat dan beri tahu seluruh rekan kerja sekitar secepat mungkin."
      },
      {
        "id": 5,
        "category": "Reading",
        "passage": "【指差呼称（しさこしょう）】\n「作業前・スイッチ操作前には、指を 指して『〇〇、ヨシ！』と 声に出して 確認しましょう。」",
        "question": "「指差呼称（ゆびさしこしょう）」を 行う 目的は 何ですか。",
        "translation": "Apakah tujuan metode \"Pointing and Calling\" (Shisa Koshou) dalam SOP kerja di Jepang?",
        "wordJp": "ミスや事故を防ぐため",
        "furigana": "みすやじこをふせぐため",
        "options": [
          {
            "key": "A",
            "text": "確認の 精度を 上げ、ヒューマンエラーや 事故を 防ぐため (Mencegah kelalaian & insiden)"
          },
          {
            "key": "B",
            "text": "声が 大きい ことを 自慢するため"
          },
          {
            "key": "C",
            "text": "体操の 代わりとして 行うため"
          },
          {
            "key": "D",
            "text": "時間を 潰すため"
          }
        ],
        "correctKey": "A",
        "explanation": "Shisa Koshou (指差呼称) adalah metode khas Jepang dengan menunjuk dan menyebut status aman untuk mencegah kecelakaan fatal."
      },
      {
        "id": 6,
        "category": "Reading",
        "passage": "【緑色の標識：非常口】\n「人が走っている緑色のピクトグラムは、火災・地震時の脱出ドア（非常口）を示しています。」",
        "question": "「非常口（ひじょうぐち）」とは どんな 場所ですか。",
        "translation": "Apakah fungsi dari pintu darurat (Hijouguchi)?",
        "wordJp": "緊急時に外へ脱出するための出口",
        "furigana": "きんきゅうじにそとへだっしゅつするためのしゅつぐち",
        "options": [
          {
            "key": "A",
            "text": "緊急時に 安全な 外へ 脱出するための 出口 (Pintu keluar darurat)"
          },
          {
            "key": "B",
            "text": "普段の 社員の 出勤専用ドア"
          },
          {
            "key": "C",
            "text": "荷物の 搬入ドア"
          },
          {
            "key": "D",
            "text": "タバコを 吸う 場所"
          }
        ],
        "correctKey": "A",
        "explanation": "非常口 (hijouguchi) adalah pintu evakuasi darurat menuju area aman di luar gedung."
      },
      {
        "id": 7,
        "category": "Reading",
        "passage": "【赤色の標識：火気厳禁】\n「シンナー・ガソリン・塗料の 保管庫付近：火気厳禁（かきげんきん）」",
        "question": "「火気厳禁（かきげんきん）」の エリアで 絶対に やっては いけない ことは？",
        "translation": "Perbuatan apa yang DILARANG KERAS di area bertanda Kaki Genkin?",
        "wordJp": "タバコやライターなど火を使うこと",
        "furigana": "たばこやらいたーなどひをつかうこと",
        "options": [
          {
            "key": "A",
            "text": "タバコや ライターなど、火を 使うこと (Menggunakan api, pemantik, atau merokok)"
          },
          {
            "key": "B",
            "text": "水を 飲むこと"
          },
          {
            "key": "C",
            "text": "靴を 履くこと"
          },
          {
            "key": "D",
            "text": "日本語を 話すこと"
          }
        ],
        "correctKey": "A",
        "explanation": "火気厳禁 (kaki genkin) bermakna dilarang keras menyalakan sumber api karena ada material mudah meledak/terbakar."
      },
      {
        "id": 8,
        "category": "Reading",
        "passage": "【黄色の標識：頭上注意】\n「クレーン稼働エリア：頭上注意（ずじょうちゅうい）」",
        "question": "「頭上注意（ずじょうちゅうい）」の 表示が あるとき、何に 気をつけますか。",
        "translation": "Potensi bahaya apakah yang harus diwaspadai di area bertanda Zujou Chuui?",
        "wordJp": "上からの落下物やクレーン",
        "furigana": "うえからのらっかぶつやくれーん",
        "options": [
          {
            "key": "A",
            "text": "上からの 落下物や、頭を ぶつける 危険 (Benda jatuh dari atas atau kepala terbentur)"
          },
          {
            "key": "B",
            "text": "足元の 水たまり"
          },
          {
            "key": "C",
            "text": "足首の 捻挫"
          },
          {
            "key": "D",
            "text": "雨の 降る 音"
          }
        ],
        "correctKey": "A",
        "explanation": "頭上注意 (zujou chuui) adalah peringatan waspada terhadap area atas kepala (bahaya benturan / barang jatuh)."
      },
      {
        "id": 9,
        "category": "Reading",
        "passage": "【黄色の標識：足元注意】\n「段差・配線・濡れた床：足元注意（あしもとちゅうい）」",
        "question": "「足元注意（あしもとちゅうい）」の 場所での 正しい 歩き方は？",
        "translation": "Bagaimanakah sikap melangkah yang benar di area bertanda Ashimoto Chuui?",
        "wordJp": "足元をよく見て走らずゆっくり歩く",
        "furigana": "あしもとをよくみてはしらずゆっくりあるく",
        "options": [
          {
            "key": "A",
            "text": "足元を よく 確認し、走らずに 慎重に 歩く (Perhatikan langkah & jangan berlari)"
          },
          {
            "key": "B",
            "text": "スマホを 見ながら 急いで 走る"
          },
          {
            "key": "C",
            "text": "目を 閉じて 飛び跳ねる"
          },
          {
            "key": "D",
            "text": "サンダルで 滑りながら 歩く"
          }
        ],
        "correctKey": "A",
        "explanation": "足元注意 (ashimoto chuui) memperingatkan adanya bahaya tersandung pipa kabel atau terpeleset lantai licin."
      },
      {
        "id": 10,
        "category": "Reading",
        "passage": "【黄色の標識：感電注意】\n「高圧配電盤：高電圧につき 感電注意（かんでんちゅうい）」",
        "question": "「感電（かんでん）」とは どんな 事故ですか。",
        "translation": "Apakah jenis kecelakaan yang dimaksud dengan Kanden?",
        "wordJp": "体に電気が流れてショックを受けること",
        "furigana": "からだにでんきがながれてしょっくをうけること",
        "options": [
          {
            "key": "A",
            "text": "体に 電気が 流れて ショックを 受ける 事故 (Tersengat aliran listrik bertegangan tinggi)"
          },
          {
            "key": "B",
            "text": "車に ぶつかる 事故"
          },
          {
            "key": "C",
            "text": "指を ドアに 挟む 事故"
          },
          {
            "key": "D",
            "text": "風邪を ひくこと"
          }
        ],
        "correctKey": "A",
        "explanation": "感電 (kanden) berarti tersengat aliran listrik yang dapat mengakibatkan luka bakar atau kematian."
      },
      {
        "id": 11,
        "category": "Reading",
        "passage": "【着用標識：保護めがね着用】\n「金属加工・グラインダー作業：火花や 切り粉が 飛ぶため、保護めがね（ゴーグル）着用義務」",
        "question": "保護めがねを かける 理由は 何ですか。",
        "translation": "Apakah tujuan utama pemakaian kacamata pelindung (Bougo Megane)?",
        "wordJp": "目を火花や異物から守るため",
        "furigana": "めをひばなやいぶつからまもるため",
        "options": [
          {
            "key": "A",
            "text": "目を 飛んでくる 火花や 金属粉から 守るため (Melindungi mata dari percikan api & serpihan logam)"
          },
          {
            "key": "B",
            "text": "かっこよく 見せるため"
          },
          {
            "key": "C",
            "text": "眠気を 覚ますため"
          },
          {
            "key": "D",
            "text": "老眼を 治すため"
          }
        ],
        "correctKey": "A",
        "explanation": "Kacamata pelindung (保護めがね) wajib dipakai untuk mencegah cedera kebutaan akibat percikan gram/gerinda."
      },
      {
        "id": 12,
        "category": "Reading",
        "passage": "【着用標識：耳栓着用】\n「プレス機械エリア：騒音レベル 90dB以上、耳栓（みみせん）着用義務」",
        "question": "「耳栓（みみせん）」を 装着する 目的は？",
        "translation": "Apakah tujuan pemasangan penutup/sumbat telinga (Mimisen)?",
        "wordJp": "大きな騒音から聴覚を守るため",
        "furigana": "おおきなそうおんからちょうかくをまもるため",
        "options": [
          {
            "key": "A",
            "text": "大きな 騒音から 耳（聴覚）を 守るため (Melindungi pendengaran dari paparan bising)"
          },
          {
            "key": "B",
            "text": "音楽を 聴くため"
          },
          {
            "key": "C",
            "text": "上司の 声を 無視するため"
          },
          {
            "key": "D",
            "text": "寒さを 防ぐため"
          }
        ],
        "correctKey": "A",
        "explanation": "耳栓 (mimisen) melindungi indra pendengaran dari kerusakan akibat kebisingan mesin press di atas 90dB."
      },
      {
        "id": 13,
        "category": "Reading",
        "passage": "【安全の基本：5S活動】\n「整理（Seiri）：要るものと 要らないものを 分け、要らないものを 捨てること」",
        "question": "5Sの「整理（せいり）」の 定義として 正しい ものは どれですか。",
        "translation": "Manakah definisi yang benar dari pilar \"Seiri\" dalam budaya industri Jepang 5S?",
        "wordJp": "要るものと要らないものを分け、不要品を捨てる",
        "furigana": "いるものといらないものをわけ、ふようひんをすてる",
        "options": [
          {
            "key": "A",
            "text": "要るものと 要らないものを 分け、不要なものを 処分する (Memilah barang perlu dan membuang yang tidak perlu)"
          },
          {
            "key": "B",
            "text": "全部の 物を 綺麗に 並べる"
          },
          {
            "key": "C",
            "text": "床を 水拭きする"
          },
          {
            "key": "D",
            "text": "挨拶を 元気よくする"
          }
        ],
        "correctKey": "A",
        "explanation": "Seiri (整理) adalah memilah antara barang yang diperlukan dan membuang barang yang tidak terpakai dari area kerja."
      },
      {
        "id": 14,
        "category": "Reading",
        "passage": "【安全の基本：5S活動】\n「整頓（Seiton）：要るものを いつでも 誰でも すぐ 取り出せるように 定位置に 決めて 置くこと」",
        "question": "5Sの「整頓（せいとん）」で 最も 大切な 考え方は？",
        "translation": "Konsep terpenting apakah yang menjadi inti dari pilar \"Seiton\"?",
        "wordJp": "物の置き場を決めて、すぐ取り出せるようにする",
        "furigana": "もののおきばをきめて、すぐとりだせるようにする",
        "options": [
          {
            "key": "A",
            "text": "物の 定位置と 名前を 決め、誰でも 30秒以内に 取り出せるようにする (Menentukan posisi baku barang agar siap ambil)"
          },
          {
            "key": "B",
            "text": "要らないものを 隠す"
          },
          {
            "key": "C",
            "text": "ペンキを 塗り直す"
          },
          {
            "key": "D",
            "text": "毎日 新しい 道具を 買う"
          }
        ],
        "correctKey": "A",
        "explanation": "Seiton (整頓) adalah penataan barang pada lokasi tetap (定位置) dengan tanda jelas agar mudah diakses siapa saja."
      },
      {
        "id": 15,
        "category": "Reading",
        "passage": "【警告標識：回転物注意】\n「巻き込まれ危険：回転している ローラーや ドリルには 絶対に 手を 近づけるな。手袋の 着用禁止！」",
        "question": "回転する 機械を 扱うとき、「手袋の着用が禁止」される 理由は？",
        "translation": "Mengapa pada mesin dengan poros berputar pekerja DILARANG mengenakan sarung tangan kain?",
        "wordJp": "手袋の繊維が巻き込まれて大怪我をする危険があるため",
        "furigana": "てぶくろのせんいがまきこまれておおけがをするきけんがあるため",
        "options": [
          {
            "key": "A",
            "text": "手袋の 繊維が 回転部に 巻き込まれ、手が 引き込まれる 危険が あるため (Serat kain sarung tangan bisa terlilit & menarik tangan)"
          },
          {
            "key": "B",
            "text": "手袋が 汚れて もったいないため"
          },
          {
            "key": "C",
            "text": "手が 汗を かいて 暑いため"
          },
          {
            "key": "D",
            "text": "手袋の 色が 派手なため"
          }
        ],
        "correctKey": "A",
        "explanation": "Pada mesin berputar (bor, bubut, roll), sarung tangan kain dapat terlilit mesin dan menarik jari/lengan pekerja ke dalam poros."
      },
      {
        "id": 16,
        "category": "Reading",
        "passage": "【緑十字標識：救急箱】\n「医務室および 各フロアの 給湯室横に 救急箱（消毒液・ガーゼ・絆創膏）を 設置しています。」",
        "question": "「救急箱（きゅうきゅうばこ）」には どんな ものが 入っていますか。",
        "translation": "Perlengkapan apakah yang tersimpan di dalam kotak P3K (Kyuukyuubako)?",
        "wordJp": "消毒液、包帯、絆創膏などの医療手当用品",
        "furigana": "しょうどくえき、ほうたい、ばんそうこうなどのいりょうてあてようひん",
        "options": [
          {
            "key": "A",
            "text": "消毒液、ガーゼ、包帯、絆創膏などの 応急手当用品 (Obat luka, perban, kain kasa, plester steril)"
          },
          {
            "key": "B",
            "text": "お菓子と ジュース"
          },
          {
            "key": "C",
            "text": "ドライバーと レンチ"
          },
          {
            "key": "D",
            "text": "お金と 通帳"
          }
        ],
        "correctKey": "A",
        "explanation": "救急箱 (kyuukyuubako) berisi perlengkapan medis darurat untuk pertolongan pertama pada kecelakaan."
      },
      {
        "id": 17,
        "category": "Reading",
        "passage": "【地震発生時の初動対応マニュアル】\n1. まず身の安全の確保（机の下へ）\n2. 揺れが収まったら、火の元の確認とガスの遮断\n3. ドアを開けて避難経路の確保",
        "question": "地震の 揺れが 収まったら、2番目に すべき 行動は どれですか。",
        "translation": "Langkah kedua apakah yang wajib dilakukan begitu guncangan gempa mereda?",
        "wordJp": "火の元の確認と元栓の遮断",
        "furigana": "ひのもとのかくにんともとせんのしゃだん",
        "options": [
          {
            "key": "A",
            "text": "火の元の 確認と、ガスや 電源の 遮断 (Periksa sumber api & matikan kran gas)"
          },
          {
            "key": "B",
            "text": "すぐに エレベーターに 乗る"
          },
          {
            "key": "C",
            "text": "家族に 電話を かけ続ける"
          },
          {
            "key": "D",
            "text": "窓から 飛び降りる"
          }
        ],
        "correctKey": "A",
        "explanation": "SOP gempa: setelah guncangan reda, segera matikan sumber api/gas untuk mencegah terjadinya kebakaran sekunder."
      },
      {
        "id": 18,
        "category": "Reading",
        "passage": "【工事標識：通行止】\n「配管工事中につき、この 通路は 通行止（つうこうどめ）です。迂回路（階段B）を ご利用ください。」",
        "question": "「通行止（つうこうどめ）」の 看板が ある 道は どうしますか。",
        "translation": "Apa yang harus dilakukan saat melihat plang Tsuukoudome di lorong?",
        "wordJp": "通らずに別の道へ迂回する",
        "furigana": "とおらずにべつのみちへうかいする",
        "options": [
          {
            "key": "A",
            "text": "その 道は 通らずに、指定された 迂回路（階段B）を 通る (Jangan melintas, gunakan jalur putar alternatif)"
          },
          {
            "key": "B",
            "text": "工事の 柵を 乗り越えて 無理やり 通る"
          },
          {
            "key": "C",
            "text": "工事中の 作業員に 怒鳴る"
          },
          {
            "key": "D",
            "text": "看板を 壊して 進む"
          }
        ],
        "correctKey": "A",
        "explanation": "通行止 (tsuukoudome) berarti jalan ditutup total untuk umum, wajib melalui jalur pengalihan (迂回路)."
      },
      {
        "id": 19,
        "category": "Reading",
        "passage": "【機械操作マニュアル：非常停止ボタン】\n「緊急時（人が巻き込まれそうになったとき）は、赤くて丸い『非常停止ボタン（E-STOP）』を 力強く 押し込んでください。」",
        "question": "非常停止ボタンは どんな 色と 形を していますか。",
        "translation": "Bagaimanakah ciri warna dan bentuk tombol darurat E-Stop pada mesin industri?",
        "wordJp": "赤くて丸い大きなボタン",
        "furigana": "あかくてまるいおおきなぼたん",
        "options": [
          {
            "key": "A",
            "text": "赤くて 丸い 大きな ボタン (Tombol besar berwarna merah dan bulat)"
          },
          {
            "key": "B",
            "text": "青くて 四角い 小さな スイッチ"
          },
          {
            "key": "C",
            "text": "黄色い レバー"
          },
          {
            "key": "D",
            "text": "黒い つまみ"
          }
        ],
        "correctKey": "A",
        "explanation": "Tombol berhenti darurat standar internasional (E-Stop): berbentuk jamur bulat besar berwarna merah menyala."
      },
      {
        "id": 20,
        "category": "Reading",
        "passage": "【終業時の安全確認：ゼロ災でいこう、ヨシ！】\n「退勤前には、エアーの元栓閉止・電源OFF・清掃完了を 指差呼称で 確認し、無事故で 一日を 終えましょう。」",
        "question": "一日の 業務を 終えるときの 日本の 現場の 合言葉は？",
        "translation": "Semboyan keselamatan penutup hari kerja di industri Jepang untuk memastikan nihil kecelakaan?",
        "wordJp": "ゼロ災でいこう、ヨシ！",
        "furigana": "ぜろさいでいこう、よし！",
        "options": [
          {
            "key": "A",
            "text": "ゼロ災で いこう、ヨシ！ (Nihil insiden kecelakaan kerja, OK!)"
          },
          {
            "key": "B",
            "text": "早く 帰ろう、ヨシ！"
          },
          {
            "key": "C",
            "text": "お腹が すいた、ヨシ！"
          },
          {
            "key": "D",
            "text": "もう 疲れた、ヨシ！"
          }
        ],
        "correctKey": "A",
        "explanation": "Semboyan penutup keselamatan kerja Jepang: 「ゼロ災でいこう、ヨシ！」 (Zero-Sai de ikou, Yoshi!)."
      }
    ],
    "studentSubmissions": []
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// ── MASTER POOL SOAL TAKOBOTO.JP UNTUK DIPILIH SENSEI (N5 – N1) ──
// ─────────────────────────────────────────────────────────────────────────────
const TAKOBOTO_QUESTION_BANK = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ── JLPT N5 (10 SOAL LENGKAP: CHOUKAI, DOKKAI, KAIWA, BUNPOU, MOJI/GOI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 101,
    level: 'N5',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「あさ」の かんじは どれですか。',
    wordJp: '朝',
    furigana: 'あさ',
    translation: 'Manakah kanji yang tepat untuk kosakata "asa" (pagi)?',
    options: [
      { key: 'A', text: '朝 (Asa - Pagi)' },
      { key: 'B', text: '昼 (Hiru - Siang)' },
      { key: 'C', text: '夜 (Yoru - Malam)' },
      { key: 'D', text: '夕 (Yuu - Sore)' }
    ],
    correctKey: 'A',
    explanation: 'Menurut Takoboto.jp, kanji 「朝」 dibaca 「あさ」(asa) yang berarti pagi hari.'
  },
  {
    id: 102,
    level: 'N5',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: 'わたし（　）がくせいです。',
    wordJp: '学生',
    furigana: 'がくせい',
    translation: 'Pilihlah partikel yang tepat untuk melengkapi subjek kalimat.',
    options: [
      { key: 'A', text: 'を (wo)' },
      { key: 'B', text: 'は (wa)' },
      { key: 'C', text: 'に (ni)' },
      { key: 'D', text: 'で (de)' }
    ],
    correctKey: 'B',
    explanation: 'Partikel 「は」(wa) berfungsi sebagai penanda topik atau subjek utama kalimat.'
  },
  {
    id: 103,
    level: 'N5',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「食べる」（たべる）の いみは どれですか。',
    wordJp: '食べる',
    furigana: 'たべる',
    translation: 'Pilihlah arti kata kerja Takoboto yang tepat.',
    options: [
      { key: 'A', text: 'Minum (Nomu)' },
      { key: 'B', text: 'Makan (Taberu - To eat)' },
      { key: 'C', text: 'Tidur (Neru)' },
      { key: 'D', text: 'Membaca (Yomu)' }
    ],
    correctKey: 'B',
    explanation: 'Menurut Takoboto.jp, 「食べる」(taberu) adalah kata kerja golongan 1 (Ichidan) yang berarti makan.'
  },
  {
    id: 104,
    level: 'N5',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: 'きょうは なんようび（　）ですか。',
    wordJp: '何曜日',
    furigana: 'なんようび',
    translation: 'Hari ini hari apa? (Pilih partikel yang tepat)',
    options: [
      { key: 'A', text: 'が (ga)' },
      { key: 'B', text: 'は (wa)' },
      { key: 'C', text: 'の (no)' },
      { key: 'D', text: 'に (ni)' }
    ],
    correctKey: 'A',
    explanation: 'Kata tanya penentu subjek seperti なんようび dipadankan dengan partikel 「が」(ga).'
  },
  {
    id: 105,
    level: 'N5',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: 'きのう えいが（　）みました。',
    wordJp: '映画',
    furigana: 'えいが',
    translation: 'Kemarin saya menonton film. (Pilih partikel objek penderita)',
    options: [
      { key: 'A', text: 'を (wo)' },
      { key: 'B', text: 'に (ni)' },
      { key: 'C', text: 'で (de)' },
      { key: 'D', text: 'へ (e)' }
    ],
    correctKey: 'A',
    explanation: 'Partikel 「を」(wo) digunakan untuk menandai objek penderita langsung dari kata kerja transitif (映画を見る).'
  },
  {
    id: 106,
    level: 'N5',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: 'A:「山田さん、おはようございます。」\nB:「あ、佐藤さん、（　）。今日もいい天気ですね。」',
    question: '空欄（　）に 入る 最も自然な 挨拶は どれですか。',
    wordJp: '挨拶',
    furigana: 'あいさつ',
    translation: 'Pilihlah salam balas percakapan pagi hari yang paling tepat.',
    options: [
      { key: 'A', text: 'おはようございます (Selamat pagi)' },
      { key: 'B', text: 'さようなら (Selamat tinggal)' },
      { key: 'C', text: 'いただきます (Selamat makan)' },
      { key: 'D', text: 'ごちそうさまでした (Terima kasih atas hidangannya)' }
    ],
    correctKey: 'A',
    explanation: 'Balasan sapaan formal pagi hari adalah 「おはようございます」.'
  },
  {
    id: 107,
    level: 'N5',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: 'スミス:「田中さん、これは だれの 傘（かさ）ですか。」\n田中:「あ、それは（　）傘です。ありがとう。」',
    question: '空欄（　）に 入る 最も適切な 言葉は どれですか。',
    wordJp: '傘',
    furigana: 'かさ',
    translation: 'Pilihlah kepemilikan kata ganti "milik saya" dalam percakapan.',
    options: [
      { key: 'A', text: 'わたし (watashi)' },
      { key: 'B', text: 'わたしの (watashi no - milik saya)' },
      { key: 'C', text: 'わたしは (watashi wa)' },
      { key: 'D', text: 'わたしに (watashi ni)' }
    ],
    correctKey: 'B',
    explanation: 'Partikel kepemilikan kata ganti milik orang menggunakan [Orang] + の (watashi no).'
  },
  {
    id: 108,
    level: 'N5',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '男の人:「すみません、駅は どこですか。」\n女の人:「駅ですか。あそこの 白い 建物の 隣ですよ。」',
    question: '【音声を聞いて答えなさい】駅は どこに ありますか。',
    wordJp: '駅',
    furigana: 'えき',
    translation: 'Dengarkan percakapan dan tentukan letak stasiun kereta.',
    options: [
      { key: 'A', text: 'あそこの 白い 建物の 隣 (Di sebelah gedung putih di sana)' },
      { key: 'B', text: 'この 青い ビルの 中 (Di dalam gedung biru ini)' },
      { key: 'C', text: '学校の 前 (Di depan sekolah)' },
      { key: 'D', text: '病院の 後ろ (Di belakang rumah sakit)' }
    ],
    correctKey: 'A',
    explanation: 'Berdasarkan audio, wanita memberitahu bahwa stasiun berada di sebelah gedung putih di sana.'
  },
  {
    id: 109,
    level: 'N5',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '店員:「いらっしゃいませ！」\n客:「りんごを ３つと、みかんを ２つ ください。」\n店員:「かしこまりました。全部で ５つですね。」',
    question: '【音声を聞いて答えなさい】客は 果物を 全部で いくつ 買いましたか。',
    wordJp: '果物',
    furigana: 'くだもの',
    translation: 'Dengarkan percakapan di toko buah dan hitung total buah yang dibeli.',
    options: [
      { key: 'A', text: '３つ (3 buah)' },
      { key: 'B', text: '２つ (2 buah)' },
      { key: 'C', text: '５つ (5 buah - 3 apel + 2 jeruk)' },
      { key: 'D', text: '４つ (4 buah)' }
    ],
    correctKey: 'C',
    explanation: '3 buah apel (りんごを3つ) + 2 buah jeruk (みかんを2つ) = total 5 buah (5つ).'
  },
  {
    id: 110,
    level: 'N5',
    category: 'Dokkai',
    categoryLabel: '📖 読解',
    passage: '田中さんは 毎朝 6時半に 起きます。シャワーを 浴びて、パンと コーヒーの 朝ごはんを 食べます。7時半に うちを 出て、8時15分に 会社の 駅に 着きます。仕事は 8時半から 始まります。',
    question: '【文章を読んで答えなさい】田中さんは 毎朝 何時に うちを 出ますか。',
    wordJp: '毎朝',
    furigana: 'まいあさ',
    translation: 'Bacalah teks rutinitas pagi Tanaka dan tentukan jam berapa ia berangkat dari rumah.',
    options: [
      { key: 'A', text: '6時半 (06:30)' },
      { key: 'B', text: '7時半 (07:30 - Berangkat keluar rumah)' },
      { key: 'C', text: '8時15分 (08:15)' },
      { key: 'D', text: '8時半 (08:30)' }
    ],
    correctKey: 'B',
    explanation: 'Teks menyatakan jelas: 「7時半に うちを 出て」(Keluar rumah pada pukul 07:30).'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── JLPT N4 (10 SOAL LENGKAP: CHOUKAI, DOKKAI, KAIWA, BUNPOU, MOJI/GOI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 201,
    level: 'N4',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '部屋の ドアが（　）います。',
    wordJp: '開く',
    furigana: 'あく',
    translation: 'Pintu kamar sedang dalam keadaan terbuka (Intransitif).',
    options: [
      { key: 'A', text: 'あけて (akete - Transitif)' },
      { key: 'B', text: 'あいて (aite - Intransitif terbukanya pintu)' },
      { key: 'C', text: 'しめて (shimete)' },
      { key: 'D', text: 'しまって (shimatte)' }
    ],
    correctKey: 'B',
    explanation: 'Kata kerja intransitif 「開く」(aku) berpasangan dengan partikel が dan bentuk ~ています untuk menyatakan kondisi terbukanya pintu.'
  },
  {
    id: 202,
    level: 'N4',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '旅行の 前に、新幹線の チケットを（　）おきます。',
    wordJp: '予約',
    furigana: 'よやく',
    translation: 'Sebelum bepergian, memesan tiket shinkansen terlebih dahulu sebagai persiapan.',
    options: [
      { key: 'A', text: 'よやくして (yoyaku shite - Bentuk te oku)' },
      { key: 'B', text: 'よやくした (yoyaku shita)' },
      { key: 'C', text: 'よやくする (yoyaku suru)' },
      { key: 'D', text: 'よやくしない (yoyaku shinai)' }
    ],
    correctKey: 'A',
    explanation: 'Pola ~ておく (~te oku) menyatakan tindakan persiapan sebelum suatu aktivitas dimulai.'
  },
  {
    id: 203,
    level: 'N4',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '明日 雨が 降ったら、出かけ（　）。',
    wordJp: '出かける',
    furigana: 'でかける',
    translation: 'Kalau besok hujan turun, saya tidak akan pergi keluar rumah.',
    options: [
      { key: 'A', text: 'ません (masen - Tidak akan pergi)' },
      { key: 'B', text: 'ました (mashita)' },
      { key: 'C', text: 'たいです (tai desu)' },
      { key: 'D', text: 'る (ru)' }
    ],
    correctKey: 'A',
    explanation: 'Pola pengandaian ~たら diikuti bentuk negatif masen menyatakan konsekuensi tidak bepergian jika hujan.'
  },
  {
    id: 204,
    level: 'N4',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「宿題を 忘れないように メモします」の「ように」の 意味は？',
    wordJp: '宿題',
    furigana: 'しゅくだい',
    translation: 'Apakah arti dari fungsi pola kalimat ~you ni pada kalimat ini?',
    options: [
      { key: 'A', text: 'Supaya / Agar tidak lupa PR' },
      { key: 'B', text: 'Karena lupa PR' },
      { key: 'C', text: 'Meskipun tidak lupa PR' },
      { key: 'D', text: 'Setelah selesai PR' }
    ],
    correctKey: 'A',
    explanation: 'Verba bentuk kamus/negatif + ように bermakna "agar / supaya terwujud tujuan tersebut".'
  },
  {
    id: 205,
    level: 'N4',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '先生が 駅に（　）。（尊敬語）',
    wordJp: 'いらっしゃる',
    furigana: 'いらっしゃる',
    translation: 'Sensei tiba di stasiun (Bentuk hormat / Sonkeigo).',
    options: [
      { key: 'A', text: 'まいりました (Kenjougo - Merendahkan diri)' },
      { key: 'B', text: 'いらっしゃいました (Sonkeigo - Bentuk hormat)' },
      { key: 'C', text: 'いたしました (Kenjougo)' },
      { key: 'D', text: 'いただきました (Kenjougo)' }
    ],
    correctKey: 'B',
    explanation: 'いらっしゃる adalah bentuk Sonkeigo (hormat) untuk kata kerja 行く、来る、いる.'
  },
  {
    id: 206,
    level: 'N4',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: '同僚A:「すみません、この 資料の コピーを 手伝って くれませんか。」\n同僚B:「あ、（　）。何部 コピーしましょうか。」',
    question: '空欄（　）に 入る 最も自然な 同僚の 返答は どれですか。',
    wordJp: '手伝う',
    furigana: 'てつだう',
    translation: 'Pilihlah respon menyanggupi bantuan secara ramah antarrekan kerja.',
    options: [
      { key: 'A', text: 'ええ、いいですよ (Tentu, boleh sekali)' },
      { key: 'B', text: 'わかりません (Saya tidak tahu)' },
      { key: 'C', text: 'ごめんなさい、できませんでした (Maaf kemarin tidak bisa)' },
      { key: 'D', text: 'どういたしまして (Sama-sama)' }
    ],
    correctKey: 'A',
    explanation: 'Respon menerima permintaan tolong rekan kerja dengan santun adalah 「ええ、いいですよ」.'
  },
  {
    id: 207,
    level: 'N4',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: 'A:「熱が 38度も あって、頭が ズキズキ 痛いんです。」\nB:「それは 大変ですね。無理をしないで、今日は 早く（　）ほうが いいですよ。」',
    question: '空欄（　）に 入る 動詞の 正しい 活用形は どれですか。',
    wordJp: '帰る',
    furigana: 'かえる',
    translation: 'Pilihlah bentuk kata kerja saran kesehatan (~ta hou ga ii).',
    options: [
      { key: 'A', text: '帰った (kaetta - Bentuk lampau ta)' },
      { key: 'B', text: '帰る (kaeru)' },
      { key: 'C', text: '帰らない (kaeranai)' },
      { key: 'D', text: '帰って (kaette)' }
    ],
    correctKey: 'A',
    explanation: 'Pola memberi saran anjuran menggunakan: [Kata Kerja Bentuk ~た] + ほうがいい (帰ったほうがいい).'
  },
  {
    id: 208,
    level: 'N4',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '課長:「皆さん、お疲れ様です。明日の 朝の 会議ですが、時間が 変更になりました。9時半からではなく、10時15分から 会議室Aで 行います。遅れないように 集まってください。」',
    question: '【音声を聞いて答えなさい】明日の 会議は 何時から 始まりますか。',
    wordJp: '会議',
    furigana: 'かいぎ',
    translation: 'Dengarkan pengumuman pimpinan mengenai perubahan waktu rapat pagi besok.',
    options: [
      { key: 'A', text: '9時半から (09:30)' },
      { key: 'B', text: '10時15分から (10:15)' },
      { key: 'C', text: '10時半から (10:30)' },
      { key: 'D', text: '午後1時から (13:00)' }
    ],
    correctKey: 'B',
    explanation: 'Berdasarkan audio naskah: 「9時半からではなく、10時15分から」 (bukan jam 09:30, melainkan 10:15).'
  },
  {
    id: 209,
    level: 'N4',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '女の人:「あれ、玄関に 黒い 傘と 青い 傘が ありますね。山田さんの 傘は どちらですか。」\n山田:「僕の 傘は 青い 方ですよ。黒いのは 鈴木さんのです。」',
    question: '【音声を聞いて答えなさい】山田さんの 傘は 何色ですか。',
    wordJp: '青い',
    furigana: 'あおい',
    translation: 'Dengarkan percakapan dan pastikan warna payung milik Yamada.',
    options: [
      { key: 'A', text: '青い 傘 (Payung biru)' },
      { key: 'B', text: '黒い 傘 (Payung hitam)' },
      { key: 'C', text: '赤い 傘 (Payung merah)' },
      { key: 'D', text: '黄色い 傘 (Payung kuning)' }
    ],
    correctKey: 'A',
    explanation: 'Yamada menjawab tegas: 「僕の 傘は 青い 方ですよ」(Payung milik saya yang berwarna biru).'
  },
  {
    id: 210,
    level: 'N4',
    category: 'Dokkai',
    categoryLabel: '📖 読解',
    passage: '【市立図書館の ご利用案内】\n本や 雑誌は 一人 5冊まで、2週間 借りることが できます。ただし、「新着雑誌の 最新号」と「語学辞典などの 参考図書」は、館内での 閲覧のみ可能です。外へ 持ち出して 借りることは できませんので、ご注意ください。',
    question: '【お知らせを読んで答えなさい】図書館の 外へ 持ち出して 借りることが できないものは どれですか。',
    wordJp: '辞書',
    furigana: 'じしょ',
    translation: 'Bacalah peraturan perpustakaan kota dan pilih item yang dilarang dipinjam keluar.',
    options: [
      { key: 'A', text: '小説や 一般の本' },
      { key: 'B', text: '新着雑誌の最新号と語学辞典などの参考図書' },
      { key: 'C', text: '子ども向けの 絵本' },
      { key: 'D', text: '歴史の 単行本' }
    ],
    correctKey: 'B',
    explanation: 'Teks tertulis: 「新着雑誌の 最新号」と「語学辞典などの 参考図書」は 持ち出して借りることは できません.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── JLPT N3 (10 SOAL LENGKAP: CHOUKAI, DOKKAI, KAIWA, BUNPOU, MOJI/GOI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 301,
    level: 'N3',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '明日は 大切な 採用試験ですから、熱が 出ても 休む（　）。',
    wordJp: 'わけにはいかない',
    furigana: 'わけにはいかない',
    translation: 'Karena besok adalah ujian rekrutmen penting, tidak mungkin bagi saya untuk libur.',
    options: [
      { key: 'A', text: 'わけにはいかない (Tidak mungkin bisa karena tuntutan moral)' },
      { key: 'B', text: 'かもしれない (Mungkin saja)' },
      { key: 'C', text: 'ほうがいい (Sebaiknya)' },
      { key: 'D', text: 'はずがない (Pasti tidak)' }
    ],
    correctKey: 'A',
    explanation: 'Pola ~わけにはいかない menyatakan tidak bisa/tidak boleh melakukan sesuatu karena tanggung jawab moral atau situasi.'
  },
  {
    id: 302,
    level: 'N3',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '兄は まじめで 勉強好きなの（　）、弟は 遊んでばかりいる。',
    wordJp: 'に対して',
    furigana: 'にたいして',
    translation: 'Berbanding terbalik dengan kakak yang rajin belajar, adik hanya bermain terus.',
    options: [
      { key: 'A', text: 'に対して (ni taishite - Berbanding terbalik / kontras)' },
      { key: 'B', text: 'にとって (ni totte - Bagi)' },
      { key: 'C', text: 'によって (ni yotte - Oleh / Tergantung)' },
      { key: 'D', text: 'について (ni tsuite - Mengenai)' }
    ],
    correctKey: 'A',
    explanation: 'Pola ~に対して (ni taishite) digunakan untuk membandingkan dua subjek yang sifatnya sangat kontras.'
  },
  {
    id: 303,
    level: 'N3',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '家を 出（　）とした 瞬間に、激しい 雨が 降り出した。',
    wordJp: 'ようとする',
    furigana: 'ようとする',
    translation: 'Tepat di momen saat baru hendak keluar rumah, hujan deras mulai turun.',
    options: [
      { key: 'A', text: 'よう (you - Bentuk ajakan volitional + とした)' },
      { key: 'B', text: 'そう (sou)' },
      { key: 'C', text: 'ため (tame)' },
      { key: 'D', text: 'ばかり (bakari)' }
    ],
    correctKey: 'A',
    explanation: 'Bentuk Volitional + とする (出ようとする) bermakna "tepat saat baru berkehendak/hendak melakukan sesuatu".'
  },
  {
    id: 304,
    level: 'N3',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「この 機械の 操作は とても 複雑だ」の「複雑」の 正しい 読み方は？',
    wordJp: '複雑',
    furigana: 'ふくざつ',
    translation: 'Bagaimanakah cara baca kanji fukuzatsu (rumit/kompleks)?',
    options: [
      { key: 'A', text: 'ふくざつ (Fukuzatsu - Rumit / Kompleks)' },
      { key: 'B', text: 'ふくそう (Fukusou)' },
      { key: 'C', text: 'ふくぜつ (Fukuzetsu)' },
      { key: 'D', text: 'ふくしょう (Fukushou)' }
    ],
    correctKey: 'A',
    explanation: 'Menurut kamus Takoboto.jp, 「複雑」 dibaca 「ふくざつ」(fukuzatsu) yang bermakna rumit atau memiliki banyak komponen.'
  },
  {
    id: 305,
    level: 'N3',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「旅行の 準備を する」の「準備」と ほぼ同じ 意味の 言葉は どれですか。',
    wordJp: '準備',
    furigana: 'じゅんび',
    translation: 'Pilihlah sinonim kata Takoboto yang paling sepadan dengan junbi (persiapan).',
    options: [
      { key: 'A', text: '用意 (ようい - Youi / Persiapan)' },
      { key: 'B', text: '整理 (せいり - Menata)' },
      { key: 'C', text: '掃除 (そうじ - Membersihkan)' },
      { key: 'D', text: '練習 (れんしゅう - Latihan)' }
    ],
    correctKey: 'A',
    explanation: 'Kata 「用意」(ようい) bersinonim langsung dengan 「準備」(じゅんび) yang berarti persiapan tindakan/barang.'
  },
  {
    id: 306,
    level: 'N3',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: '客:「すみません、この 白い シャツの Mサイズを 試着したいのですが、在庫は ありますか。」\n店員:「かしこまりました。ただいま バックヤードの 在庫を（　）。少々お待ちください。」',
    question: '空欄（　）に 入る 最も丁寧な 接客の 言葉は どれですか。',
    wordJp: '確認',
    furigana: 'かくにん',
    translation: 'Pilihlah ungkapan pelayanan toko sopan (Kenjougo) untuk memeriksa stok.',
    options: [
      { key: 'A', text: '確認してまいります (Saya akan pergi memeriksanya)' },
      { key: 'B', text: '確認してください (Silakan Anda cek)' },
      { key: 'C', text: '確認しませんでした (Saya tidak mengecek)' },
      { key: 'D', text: 'ご覧になります (Silakan melihat)' }
    ],
    correctKey: 'A',
    explanation: 'Pelayan toko menggunakan bentuk Kenjougo sopan: [Bentuk te] + まいる (確認してまいります).'
  },
  {
    id: 307,
    level: 'N3',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: '先輩:「来週の 社内プレゼンの 準備は 順調に 進んでいるかい？」\n後輩:「はい、スライドの 構成は ほぼ 固まりまして、現在は 発表原稿の 修正を（　）。」',
    question: '空欄（　）に 入る ビジネス会話として 適切な 表現は？',
    wordJp: '進める',
    furigana: 'すすめる',
    translation: 'Pilihlah ungkapan sopan di hadapan senior kantor yang menyatakan pekerjaan sedang dijalankan.',
    options: [
      { key: 'A', text: '進めております (Sedang kami laksanakan/proses)' },
      { key: 'B', text: '進ませてください (Tolong izinkan)' },
      { key: 'C', text: '終わりましたっけ (Sudah selesai belum ya)' },
      { key: 'D', text: 'わかりかねます (Saya tidak tahu)' }
    ],
    correctKey: 'A',
    explanation: 'Bentuk te orimasu (進めております) adalah bentuk sopan Kenjougo dari te imasu.'
  },
  {
    id: 308,
    level: 'N3',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '駅内アナウンス:「お客様に 運行情報に関する お知らせです。台風15号の 接近に伴い、本日 午後3時以降、東海道線の 上下列車におきまして 運転を 見合わせる可能性が ございます。ご利用の お客様は、スマートフォン等の 公式アプリより 最新の 運行状況を ご確認の上、お早めの ご移動を お願いいたします。」',
    question: '【音声を聞いて答えなさい】アナウンスでは、乗客に 何をするよう 促していますか。',
    wordJp: '運行',
    furigana: 'うんこう',
    translation: 'Dengarkan pengumuman stasiun dan tentukan tindakan yang diminta dari penumpang.',
    options: [
      { key: 'A', text: '最新の 運行情報を 確認し、早めに 移動すること' },
      { key: 'B', text: '午後3時まで 駅の ホームで 待機すること' },
      { key: 'C', text: 'すべての 切符を 払い戻すこと' },
      { key: 'D', text: '明朝まで 移動を 中止すること' }
    ],
    correctKey: 'A',
    explanation: 'Petugas meminta penumpang memeriksa situasi via aplikasi resmi dan berpindah lebih awal (お早めの ご移動).'
  },
  {
    id: 309,
    level: 'N3',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '事務局:「資格試験対策ウェビナーに お申し込みの 皆様へ ご案内です。事前質問の 受付期限は、今週 金曜日の 夕方 17時ジャストまでとなっております。以降に いただいた 質問には 当日 回答できませんので ご了承ください。」',
    question: '【音声を聞いて答えなさい】事前質問の 締め切り日時は いつですか。',
    wordJp: '締切',
    furigana: 'しめきり',
    translation: 'Dengarkan batas waktu pengiriman pertanyaan webinar.',
    options: [
      { key: 'A', text: '金曜日の 17時 (Jumat jam 17:00 sore)' },
      { key: 'B', text: '木曜日の 12時' },
      { key: 'C', text: '土曜日の 正午' },
      { key: 'D', text: 'ウェビナー当日の 朝' }
    ],
    correctKey: 'A',
    explanation: 'Audio menyebutkan batas akhir pengumpulan pertanyaan: 「今週 金曜日の 夕方 17時ジャストまで」.'
  },
  {
    id: 310,
    level: 'N3',
    category: 'Dokkai',
    categoryLabel: '📖 読解',
    passage: '近年、日本企業において「テレワーク（在宅勤務）」を 恒常化する 動きが 広がっている。満員電車の ストレスから 解放され、育児や 介護と 仕事を 両立しやすくなったという 声が多い。しかしその 一方で、対面での 雑談が 減ったことによる コミュニケーション不足や、仕事と プライベートの メリハリが つきにくく、結果として「隠れ残業」が 増加してしまうという 深刻な 弊害も 指摘されている。',
    question: '【文章を読んで答えなさい】この文章で 指摘されている テレワークの「弊害（デメリット）」として 最も適切なものは どれですか。',
    wordJp: '弊害',
    furigana: 'へいがい',
    translation: 'Bacalah artikel dampak telework di Jepang dan pilih permasalahan negatif yang dialami karyawan.',
    options: [
      { key: 'A', text: '満員電車の ストレスが 増加したこと' },
      { key: 'B', text: '育児や 介護の 時間が 取れなくなったこと' },
      { key: 'C', text: 'コミュニケーション不足や 隠れ残業が 増加してしまうこと' },
      { key: 'D', text: '会社の 電気代が 跳ね上がったこと' }
    ],
    correctKey: 'C',
    explanation: 'Paragraf kedua menyebutkan jelas: 「コミュニケーション不足」 dan 「隠れ残業が増加してしまう弊害」.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── JLPT N2 (10 SOAL LENGKAP: CHOUKAI, DOKKAI, KAIWA, BUNPOU, MOJI/GOI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 401,
    level: 'N2',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '大型台風の 直撃により、本日の サッカー決勝戦は 延期せ（　）。',
    wordJp: 'ざるを得ない',
    furigana: 'ざるをえない',
    translation: 'Akibat hantaman topan dahsyat, pertandingan final sepak bola terpaksa harus ditunda.',
    options: [
      { key: 'A', text: 'ざるを得ない (Terpaksa harus karena tidak ada opsi lain)' },
      { key: 'B', text: 'っこない (Pasti tidak bisa)' },
      { key: 'C', text: 'きれない (Tidak sanggup menyelesaikan)' },
      { key: 'D', text: 'かねない (Bisa berdampak buruk)' }
    ],
    correctKey: 'A',
    explanation: 'Pola ~ざるを得ない bermakna terpaksa tidak ada jalan lain selain melakukan tindakan tersebut (延期せざるを得ない).'
  },
  {
    id: 402,
    level: 'N2',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '地方都市における 人口減少と 少子高齢化が、年々（　）ある。',
    wordJp: 'つつある',
    furigana: 'つつある',
    translation: 'Penurunan populasi di daerah pedesaan sedang terus berlangsung dari tahun ke tahun.',
    options: [
      { key: 'A', text: '進みつつ (susumi-tsutsu - Sedang terus berlangsung bertahap)' },
      { key: 'B', text: '進みっぱなし (susumi-ppanashi)' },
      { key: 'C', text: '進みきって (susumi-kitte)' },
      { key: 'D', text: '進みがちに (susumi-gachi ni)' }
    ],
    correctKey: 'A',
    explanation: 'Pola verba stem + つつある menyatakan perubahan jangka panjang yang sedang terjadi secara bertahap.'
  },
  {
    id: 403,
    level: 'N2',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: 'どんなに 困難な 状況に 陥ろうとも、全力を 尽くして 目標を 達成する（　）。',
    wordJp: 'べきだ',
    furigana: 'べきだ',
    translation: 'Betapapun sulit kondisinya, kita harus/sepatutnya berusaha sekuat tenaga mencapai target.',
    options: [
      { key: 'A', text: 'べきだ (Sepatutnya / Harus berdasarkan kewajiban)' },
      { key: 'B', text: 'わけがない (Tidak masuk akal)' },
      { key: 'C', text: 'にすぎない (Hanya sekadar)' },
      { key: 'D', text: 'からには (Berhubung sudah)' }
    ],
    correctKey: 'A',
    explanation: 'Pola verba bentuk kamus + べきだ menyatakan keharusan moral atau kewajaran tugas yang patut dilakukan.'
  },
  {
    id: 404,
    level: 'N2',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: 'ビジネスメールにおける「承知いたしました」の 適切な ニュアンスは？',
    wordJp: '承知',
    furigana: 'しょうち',
    translation: 'Apakah makna dan penggunaan tepat dari frasa kenjougo shouchi itashimashita?',
    options: [
      { key: 'A', text: '相手の依頼や指示を確かに引き受け、了解したことを表す最も丁寧な謙譲表現' },
      { key: 'B', text: '相手の申し出を丁重に辞退する返答' },
      { key: 'C', text: '質問内容の回答を保留にする旨の返答' },
      { key: 'D', text: '自社の過失を謝罪する表現' }
    ],
    correctKey: 'A',
    explanation: '承知いたしました (atau かしこまりました) adalah bentuk Kenjougo paling formal untuk "Saya memahami dan siap melaksanakan".'
  },
  {
    id: 405,
    level: 'N2',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「新プロジェクトの 担当に 任命された」の「担当」の 意味は？',
    wordJp: '担当',
    furigana: 'たんとう',
    translation: 'Apakah arti dari kosakata tantou dalam konteks penugasan kerja industri?',
    options: [
      { key: 'A', text: 'ある特定の任務や職務を引き受けて受け持つこと (Penanggung jawab)' },
      { key: 'B', text: '急な欠員により一時的に代行すること' },
      { key: 'C', text: '第三者の業務を監査・評価すること' },
      { key: 'D', text: '組織から離脱すること' }
    ],
    correctKey: 'A',
    explanation: 'Menurut Takoboto.jp, 「担当」(たんとう) bermakna bertanggung jawab atas tugas atau bidang tertentu.'
  },
  {
    id: 406,
    level: 'N2',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: '取引先:「急な 仕様変更で 大変恐縮ですが、明日朝の 役員会までに 修正サンプルを ご用意いただくことは 可能でしょうか。」\n営業担当:「非常に タイトな 日程では ございますが、（　）。」',
    question: '空欄（　）に 入る 最も信頼性の高い ビジネスとしての 返答は？',
    wordJp: '善処',
    furigana: 'ぜんしょ',
    translation: 'Pilihlah respon komitmen profesional seorang account representative kepada klien.',
    options: [
      { key: 'A', text: '現場と 緊急調整を行い、なんとか 間に合わせるよう 善処いたします' },
      { key: 'B', text: '無理なものは 無理ですので、来週に してください' },
      { key: 'C', text: 'どうなるか わかりませんので 保証できません' },
      { key: 'D', text: '私の一存では 決められません' }
    ],
    correctKey: 'A',
    explanation: 'Jawaban yang menunjukkan etos kerja Jepang standar adalah koordinasi darurat dan ikhtiar maksimal (善処いたします).'
  },
  {
    id: 407,
    level: 'N2',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: '部長:「佐藤くん、先週 依頼した クライアントへの 調査報告書の 提出は 完了したかい？」\n部下:「はい、先ほど 部長から いただいた 修正指示を 反映し、（　）。」',
    question: '空欄（　）に 入る 正しい 敬語（謙譲語）表現は？',
    wordJp: '提出',
    furigana: 'ていしゅつ',
    translation: 'Pilihlah bentuk lapor selesai penyerahan dokumen kepada atasan dengan kenjougo tepat.',
    options: [
      { key: 'A', text: '先方に メールにて ご提出申し上げました (Sudah kami serahkan ke pihak sana)' },
      { key: 'B', text: '先方に 提出なさられました' },
      { key: 'C', text: '先方に 送ってあげました' },
      { key: 'D', text: '先方に ご提出になられました' }
    ],
    correctKey: 'A',
    explanation: 'Penyerahan dokumen oleh pihak kita kepada pihak ketiga dilaporkan dengan Kenjougo: ご提出申し上げました.'
  },
  {
    id: 408,
    level: 'N2',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '取締役:「第3四半期の 決算報告です。営業利益が 前年同期比 18％の 増益となった 要因は、従来の 若年層向け プロモーションから、購買力の高い シニア層へと 訴求軸を 転換した マーケティング戦略が 見事に 功を奏したことに あります。」',
    question: '【音声を聞いて答えなさい】営業利益が 大幅に 増加した 最大の 要因は 何ですか。',
    wordJp: '戦略',
    furigana: 'せんりゃく',
    translation: 'Dengarkan laporan keuangan direksi dan pilih faktor kunci pendorong peningkatan laba operasional.',
    options: [
      { key: 'A', text: 'ターゲット層を 購買力の高い シニア層へ シフトさせた マーケティング戦略' },
      { key: 'B', text: '全社規模での 大幅な 人件費カット' },
      { key: 'C', text: '主力製品の 単価を 半額に 値下げしたこと' },
      { key: 'D', text: '海外工場の 操業停止による 経費削減' }
    ],
    correctKey: 'A',
    explanation: 'Pernyataan jelas menyebutkan: 「シニア層へと 訴求軸を 転換した マーケティング戦略が 功を奏した」.'
  },
  {
    id: 409,
    level: 'N2',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '安全衛生委員長:「製造工場における ヒューマンエラーを 根絶するため、来月1日より、すべての 作業工程において『指差し呼称（ゆびさしこしょう）』を 徹底することを 義務付けます。確認作業を 省略した 者には 厳重な 再教育を 行います。」',
    question: '【音声を聞いて答えなさい】安全衛生委員会が 来月から 義務付けたことは 何ですか。',
    wordJp: '義務',
    furigana: 'ぎむ',
    translation: 'Dengarkan pengumuman komite keselamatan kerja pabrik dan pilih kewajiban baru para operator.',
    options: [
      { key: 'A', text: '全工程における「指差し呼称」の 徹底実施' },
      { key: 'B', text: '勤務時間外の 残業の 完全禁止' },
      { key: 'C', text: '作業着の 毎週買い替え' },
      { key: 'D', text: '工場内での スマートフォン携帯の 許可' }
    ],
    correctKey: 'A',
    explanation: 'Komite mewajibkan: 「すべての 作業工程において『指差し呼称』を 徹底することを 義務付けます」.'
  },
  {
    id: 410,
    level: 'N2',
    category: 'Dokkai',
    categoryLabel: '📖 読解',
    passage: '日本の ものづくり現場で 発展した「カイゼン（改善）」の本質は、経営陣が 上から 一方的に 指示する コスト削減運動ではない。日々 現場の 機械や 部品に 触れている 作業員一人ひとりが、「もっと 安全に、もっと 無駄なく 作業できないか」という 当事者意識を持ち、微細な 違和感や 問題点を 自発的に 改善していく『ボトムアップの 企業文化』にこそある。この 小さな 創意工夫の 蓄積が、結果として 世界最高水準の 品質と 競争力を 生み出しているのである。',
    question: '【文章を読んで答えなさい】筆者が 主張する「カイゼン」の 本質として 最も適切なものは どれですか。',
    wordJp: '改善',
    furigana: 'かいぜん',
    translation: 'Bacalah artikel filosofi Kaizen di industri Jepang dan tentukan hakikat utamanya menurut penulis.',
    options: [
      { key: 'A', text: '現場作業員が 当事者意識を持って 自発的に 無駄や 問題を 見直す ボトムアップの 文化' },
      { key: 'B', text: '経営陣からの 一方的な 経費削減命令を 忠実に 実行すること' },
      { key: 'C', text: 'すべての 熟練作業員を AIロボットに 置き換えること' },
      { key: 'D', text: '短期間で 巨額の 利益を 上げるための 投機的戦略' }
    ],
    correctKey: 'A',
    explanation: 'Penulis menekankan: 「作業員一人ひとりが 当事者意識を持ち 自発的に 改善していくボトムアップの 企業文化」.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── JLPT N1 (8 SOAL LENGKAP: CHOUKAI, DOKKAI, KAIWA, BUNPOU, MOJI/GOI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 501,
    level: 'N1',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '公職にある 人物の かかる 軽率な 発言は、誠に 遺憾（　）。',
    wordJp: '極まりない',
    furigana: 'きわまりない',
    translation: 'Pernyataan ceroboh dari seorang pejabat publik sungguh luar biasa sangat disayangkan.',
    options: [
      { key: 'A', text: '極まりない (Sangat amat / Luar biasa tingkat ekstremnya)' },
      { key: 'B', text: 'まじき (Tidak pantas)' },
      { key: 'C', text: 'ずくめ (Penuh dengan)' },
      { key: 'D', text: 'ならでは (Hanya khas)' }
    ],
    correctKey: 'A',
    explanation: 'Pola ~極まりない (kiwamarinai) menyatakan tingkatan perasaan emosi negatif atau penilaian yang sangat ekstrem (遺憾極まりない).'
  },
  {
    id: 502,
    level: 'N1',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '彼（　）、この 未曾有の 経営危機を 乗り切れる 指導者は 他に いない。',
    wordJp: 'をおいて',
    furigana: 'をおいて',
    translation: 'Selain beliau, tidak ada pemimpin lain yang sanggup melewati krisis manajemen yang belum pernah terjadi ini.',
    options: [
      { key: 'A', text: 'をおいて (Selain orang tersebut tidak ada yang lain)' },
      { key: 'B', text: 'をかわきりに (Diawali dengan)' },
      { key: 'C', text: 'をよそに (Tanpa memedulikan)' },
      { key: 'D', text: 'をものともせず (Tanpa gentar sedikitpun)' }
    ],
    correctKey: 'A',
    explanation: 'Pola [Sosok] + をおいて...ない menyatakan tidak ada sosok lain selain figur tersebut yang pantas atau mampu.'
  },
  {
    id: 503,
    level: 'N1',
    category: 'Bunpou',
    categoryLabel: '✏️ 文法',
    question: '半世紀に わたり 技を 磨き続けた 名工（　）創り得ない、至高の 芸術品だ。',
    wordJp: 'ならでは',
    furigana: 'ならでは',
    translation: 'Mahakarya tertinggi yang hanya bisa diciptakan khas oleh maestro pengrajin tempaan setengah abad.',
    options: [
      { key: 'A', text: 'ならでは (Khas hanya sosok tersebut)' },
      { key: 'B', text: 'まみれの (Penuh berlumuran)' },
      { key: 'C', text: 'がてらの (Sambil menyelam minum air)' },
      { key: 'D', text: 'っぱなしの (Dibiarkan terus)' }
    ],
    correctKey: 'A',
    explanation: 'Pola ~ならでは (naradewa) menyatakan keistimewaan yang hanya dimiliki secara eksklusif oleh subjek tersebut.'
  },
  {
    id: 504,
    level: 'N1',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「一瞬の 躊躇が 命取りと なる」の「躊躇」の 読み方と 意味は？',
    wordJp: '躊躇',
    furigana: 'ちゅうちょ',
    translation: 'Pilihlah bacaan kanji dan makna tepat untuk kanji tingkat N1 chuucho.',
    options: [
      { key: 'A', text: 'ちゅうちょ (Chuucho) - Ragu-ragu / Bimbang dalam mengambil keputusan' },
      { key: 'B', text: 'とうちょ (Toucho) - Keras kepala memaksakan kehendak' },
      { key: 'C', text: 'ちゅうしょ (Chuusho) - Berani menerjang risiko' },
      { key: 'D', text: 'ちゅうすう (Chuusuu) - Titik pusat persoalan' }
    ],
    correctKey: 'A',
    explanation: 'Menurut Takoboto.jp, 「躊躇」(ちゅうちょ) bermakna bimbang, ragu-ragu, atau lambat mengambil sikap.'
  },
  {
    id: 505,
    level: 'N1',
    category: 'Moji/Goi',
    categoryLabel: '🔤 文字・語彙',
    question: '「双方の 主張に 齟齬が 生じている」の「齟齬」の 意味は？',
    wordJp: '齟齬',
    furigana: 'そご',
    translation: 'Apakah arti dari kanji N1 sogo dalam konteks negosiasi resmi bilateral?',
    options: [
      { key: 'A', text: '意見や事実が食い違い、噛み合わないこと (Ketidaksesuaian / Disharmoni)' },
      { key: 'B', text: '双方が合意に達して契約を締結すること' },
      { key: 'C', text: '予期せぬ多額の利益が発生すること' },
      { key: 'D', text: '計画が予定より大幅に前倒しになること' }
    ],
    correctKey: 'A',
    explanation: 'Menurut Takoboto.jp, 「齟齬」(そご) bermakna ketidaksinkronan, ketidaksesuaian, atau perselisihan fakta/opini.'
  },
  {
    id: 506,
    level: 'N1',
    category: 'Kaiwa',
    categoryLabel: '💬 会話',
    passage: '取締役会長:「広報部長、今回の 個人情報流出事案に関する 緊急記者会見の 準備は 遺漏なく 進んでおるかね。」\n広報部長:「はっ。外部の 危機管理弁護士と 緊密に 協議を 重ね、本日16時より 事実関係の 経緯説明および 謝罪会見を 行う（　）。」',
    question: '空欄（　）に 入る 最高格式の ビジネス報告表現は どれですか。',
    wordJp: '手筈',
    furigana: 'てはず',
    translation: 'Pilihlah ungkapan tingkat tinggi kematangan persiapan di hadapan dewan komisaris.',
    options: [
      { key: 'A', text: '手筈を 整えております (Segala tata cara persiapan telah kami atur rapi)' },
      { key: 'B', text: 'つもりで ございます' },
      { key: 'C', text: '予定に しておきました' },
      { key: 'D', text: 'わけで ございます' }
    ],
    correctKey: 'A',
    explanation: '手筈を整える (tehazu wo totonoeru) adalah ungkapan resmi N1 yang bermakna mempersiapkan seluruh tahapan operasional secara matang.'
  },
  {
    id: 507,
    level: 'N1',
    category: 'Choukai',
    categoryLabel: '🎧 聴解',
    passage: '経済アナリスト:「地政学的緊張の 高まりと 資源価格の 高騰を受け、特定国への 一極集中型 サプライチェーンに 依存する リスクが 浮き彫りとなっています。製造業各社にとっては、調達拠点の 多国間分散と 国内生産回帰を 視野に入れた、強靭な サプライチェーンの 再構築こそが、今 最も喫緊の 経営命題と 言えます。」',
    question: '【音声を聞いて答えなさい】アナリストが 指摘する、製造業各社の「最も喫緊の 経営命題」とは 何ですか。',
    wordJp: '強靭',
    furigana: 'きょうじん',
    translation: 'Dengarkan analisis ekonomi dan tentukan isu kepemimpinan paling mendesak bagi industri manufaktur.',
    options: [
      { key: 'A', text: '調達拠点の分散や国内回帰による強靭なサプライチェーンの再構築' },
      { key: 'B', text: '特定国からの 調達比率を 100％に 引き上げること' },
      { key: 'C', text: '新規の研究開発投資を 全面凍結すること' },
      { key: 'D', text: '製品価格を 競合他社に合わせて 一律値下げすること' }
    ],
    correctKey: 'A',
    explanation: 'Audio menegaskan: 「強靭な サプライチェーンの 再構築こそが、今 最も喫緊の 経営命題」.'
  },
  {
    id: 508,
    level: 'N1',
    category: 'Dokkai',
    categoryLabel: '📖 読解',
    passage: '伝統文化や 職人技の「継承」とは、過去の 形式や 手法を そのまま 標本のように 凍結保存することではない。それは むしろ、時代の 激しい 潮流や 新たな テクノロジーを 恐れずに 貪欲に 取り込みながらも、その 根底に 脈打つ 精神性や 美意識の 核心を、次代の 息吹とともに 再解釈し 伝達していくという「創造的 破壊と 革新の 連続」に他ならない。革新を 恐れて 形式に 固執した 瞬間に、伝統は 生きた 文化としての 命を 失い、単なる 化石へと 堕するのである。',
    question: '【文章を読んで答えなさい】筆者が 考える 伝統の「真の継承」とは どのような 営みですか。',
    wordJp: '継承',
    furigana: 'けいしょう',
    translation: 'Bacalah esai refleksi filosofis kebudayaan Jepang dan pilih esensi dari "pewarisan sejati" menurut penulis.',
    options: [
      { key: 'A', text: '時代の変化や新技術を取り入れながら核心の精神を再解釈し伝える創造と革新の連続' },
      { key: 'B', text: '過去の形式を一言一句変えることなくそのまま厳格に保存すること' },
      { key: 'C', text: '古い慣習をすべて打ち捨てて最新のデジタル技術に完全移行すること' },
      { key: 'D', text: '商業的収益性のみを追求して観光資源として大衆化すること' }
    ],
    correctKey: 'A',
    explanation: 'Penulis menekankan: Pewarisan sejati bukanlah membekukan bentuk masa lalu, melainkan 「創造的 破壊と 革新の 連続」 yang menyerap zaman baru sambil menjaga inti ruh budayanya.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// ── MASTER KOSAKATA TAKOBOTO.JP UNTUK DIPILIH SENSEI (TUGAS & KUIS) ──
// ─────────────────────────────────────────────────────────────────────────────
const TAKOBOTO_VOCAB_BANK = [
  // N5
  { kanji: '食べる', kana: 'たべる', romaji: 'taberu', pos: 'Ichidan verb', meaning: 'Makan', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=taberu' },
  { kanji: '飲む', kana: 'のむ', romaji: 'nomu', pos: 'Godan verb', meaning: 'Minum', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=nomu' },
  { kanji: '行く', kana: 'いく', romaji: 'iku', pos: 'Godan verb', meaning: 'Pergi', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=iku' },
  { kanji: '見る', kana: 'みる', romaji: 'miru', pos: 'Ichidan verb', meaning: 'Melihat / Menonton', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=miru' },
  { kanji: '話す', kana: 'はなす', romaji: 'hanasu', pos: 'Godan verb', meaning: 'Berbicara', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=hanasu' },
  { kanji: '日', kana: 'ひ / にち', romaji: 'hi / nichi', pos: 'Kanji N5', meaning: 'Hari / Matahari', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=日' },
  { kanji: '月', kana: 'つき / げつ', romaji: 'tsuki / getsu', pos: 'Kanji N5', meaning: 'Bulan', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=月' },
  { kanji: '友達', kana: 'ともだち', romaji: 'tomodachi', pos: 'Noun', meaning: 'Teman', level: 'N5', takobotoUrl: 'https://takoboto.jp/?q=tomodachi' },
  // N4
  { kanji: '開ける', kana: 'あける', romaji: 'akeru', pos: 'Transitive verb', meaning: 'Membuka (sesuatu)', level: 'N4', takobotoUrl: 'https://takoboto.jp/?q=akeru' },
  { kanji: '開く', kana: 'あく', romaji: 'aku', pos: 'Intransitive verb', meaning: 'Terbuka (sendiri)', level: 'N4', takobotoUrl: 'https://takoboto.jp/?q=aku' },
  { kanji: '閉める', kana: 'しめる', romaji: 'shimeru', pos: 'Transitive verb', meaning: 'Menutup (sesuatu)', level: 'N4', takobotoUrl: 'https://takoboto.jp/?q=shimeru' },
  { kanji: '閉まる', kana: 'しまる', romaji: 'shimaru', pos: 'Intransitive verb', meaning: 'Tertutup (sendiri)', level: 'N4', takobotoUrl: 'https://takoboto.jp/?q=shimaru' },
  { kanji: '予約', kana: 'よやく', romaji: 'yoyaku', pos: 'Noun / Suru verb', meaning: 'Reservasi / Pemesanan', level: 'N4', takobotoUrl: 'https://takoboto.jp/?q=yoyaku' },
  // N3
  { kanji: '経験', kana: 'けいけん', romaji: 'keiken', pos: 'Noun', meaning: 'Pengalaman', level: 'N3', takobotoUrl: 'https://takoboto.jp/?q=keiken' },
  { kanji: '準備', kana: 'じゅんび', romaji: 'junbi', pos: 'Noun', meaning: 'Persiapan', level: 'N3', takobotoUrl: 'https://takoboto.jp/?q=junbi' },
  { kanji: '複雑', kana: 'ふくざつ', romaji: 'fukuzatsu', pos: 'na-adj', meaning: 'Rumit / Kompleks', level: 'N3', takobotoUrl: 'https://takoboto.jp/?q=fukuzatsu' },
  // N2
  { kanji: '担当', kana: 'たんとう', romaji: 'tantou', pos: 'Noun', meaning: 'Penanggung Jawab', level: 'N2', takobotoUrl: 'https://takoboto.jp/?q=tantou' },
  { kanji: '承知', kana: 'しょうち', romaji: 'shouchi', pos: 'Noun', meaning: 'Paham / Setuju', level: 'N2', takobotoUrl: 'https://takoboto.jp/?q=shouchi' },
  { kanji: '改善', kana: 'かいぜん', romaji: 'kaizen', pos: 'Noun', meaning: 'Perbaikan Berkelanjutan', level: 'N2', takobotoUrl: 'https://takoboto.jp/?q=kaizen' },
  // N1
  { kanji: '躊躇', kana: 'ちゅうちょ', romaji: 'chuucho', pos: 'Noun', meaning: 'Ragu-ragu / Bimbang', level: 'N1', takobotoUrl: 'https://takoboto.jp/?q=chuucho' },
  { kanji: '齟齬', kana: 'そご', romaji: 'sogo', pos: 'Noun', meaning: 'Ketidaksesuaian', level: 'N1', takobotoUrl: 'https://takoboto.jp/?q=sogo' },
  { kanji: '遺憾', kana: 'いかん', romaji: 'ikan', pos: 'Noun / na-adj', meaning: 'Sangat Disesalkan', level: 'N1', takobotoUrl: 'https://takoboto.jp/?q=ikan' }
];

export default function LmsTugasQuiz({ initialTab, forcedMode } = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode detection from props or pathname
  const routeMode = location.pathname.includes('/quiz') ? 'quiz' : (location.pathname.includes('/tugas') ? 'tugas' : null);
  const activeForcedMode = forcedMode || routeMode;

  // Role detection: Check user or default to Sensei
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const isSensei = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qRole = urlParams.get('role');
    if (qRole === 'siswa') return false;
    if (qRole === 'sensei') return true;

    const roleName = (currentUser?.role_name || currentUser?.role || '').toLowerCase();
    if (roleName.includes('peserta') || roleName.includes('siswa')) return false;
    return true; // Default to Sensei
  }, [currentUser]);

  // Main Toggle: 'tugas' | 'quiz'
  const [mainTab, setMainTab] = useState(() => initialTab || activeForcedMode || 'tugas');

  useEffect(() => {
    if (activeForcedMode && activeForcedMode !== mainTab) {
      setMainTab(activeForcedMode);
    }
  }, [activeForcedMode, mainTab]);

  // Class Rombel Filter: 'Semua Kelas' | 'N5 Pagi' | 'N4 A - PAGI'
  const [selectedClassFilter, setSelectedClassFilter] = useState('Semua Kelas');

  // JLPT Level Filter: 'ALL' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  const [selectedLevel] = useState('ALL');

  // Redesign States matching mockup:
  const [selectedLevels, setSelectedLevels] = useState(['N5']); // Default matching mockup
  const [selectedCategories, setSelectedCategories] = useState(['Vocabulary']); // Default matching mockup
  const [isLevelFilterOpen, setIsLevelFilterOpen] = useState(true);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(true);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('overview'); // 'overview' | 'quiz_saya' | 'question_bank' | 'daily_quiz' | 'analytics'
  const [sortBy, setSortBy] = useState('terbaru');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const createDropdownRef = useRef(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  // Master State
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_master_tasks_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  const [quizzes, setQuizzes] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_master_quizzes_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_QUIZZES;
  });

  // ── UKOM DAFTAR SOAL SIMULATOR MODAL STATE ──
  const [activeExamModal, setActiveExamModal] = useState(null); // active quiz/task object
  const [currentQIndex, setCurrentQIndex] = useState(0); // 0-indexed
  const [studentAnswers, setStudentAnswers] = useState({}); // { [qId]: 'A' }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [qId]: true }
  const [examTimer, setExamTimer] = useState(20 * 60);

  // ── SENSEI EVALUATION & FEEDBACK MODAL STATE ──
  const [evaluatingItem, setEvaluatingItem] = useState(null); // quiz or task being evaluated
  const [selectedSubmission, setSelectedSubmission] = useState(null); // active student submission detail
  const [senseiFeedbackText, setSenseiFeedbackText] = useState('');
  const [senseiScoreInput, setSenseiScoreInput] = useState('');

  // ── SISWA & SENSEI LIHAT MATERI MODAL ──
  const [activeViewMaterialModal, setActiveViewMaterialModal] = useState(null);

  // ── SISWA LIHAT PENGUMPULAN SAYA MODAL ──
  const [activeSubmissionDetailModal, setActiveSubmissionDetailModal] = useState(null);

  // ── SISWA SUBMISSION MODAL ──
  const [activeTaskSubmitModal, setActiveTaskSubmitModal] = useState(null);
  const [uploadedSubmissionFile, setUploadedSubmissionFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Close create dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setIsCreateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLevel = (lvl) => {
    setSelectedLevels(prev => 
      prev.includes(lvl) ? prev.filter(x => x !== lvl) : [...prev, lvl]
    );
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(x => x !== cat) : [...prev, cat]
    );
  };

  const handleResetFilters = () => {
    setSelectedLevels([]);
    setSelectedCategories([]);
    setSearchQuery('');
    setSelectedClassFilter('Semua Kelas');
    setStatusFilter('ALL');
  };

  const handleDuplicateQuiz = (quiz) => {
    const duplicated = {
      ...quiz,
      id: Date.now(),
      title: `${quiz.title} (Salinan)`,
      status: 'Draft',
      isOpen: false,
      submissionsCount: 0,
      createdAt: 'Hari ini'
    };
    setQuizzes(prev => [duplicated, ...prev]);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Quiz berhasil diduplikasi ke Draft! 📋',
      showConfirmButton: false,
      timer: 1600
    });
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lms_master_tasks_v3', JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  // ── LOAD REAL QUIZZES FROM MYSQL DATABASE (NO DUMMY) ──
  const fetchQuizzesFromApi = async () => {
    try {
      let res = await fetch('/api/lms_quiz_api.php?action=daily_quizzes');
      if (!res.ok) {
        res = await fetch('/backend/api/lms_quiz_api.php?action=daily_quizzes');
      }
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        const mapped = json.data.map((q) => {
          const isPub = q.status === 'published';
          const isReview = q.status === 'sensei_review';
          return {
            id: Number(q.id),
            title: q.title,
            bab: q.bab || 'Bab 01 s/d Bab 05',
            level: q.level || 'N5',
            classRoom: q.class_name || 'N5 Pagi',
            curriculumSource: q.curriculum_source || 'Minna no Nihongo / Japan Foundation',
            category: q.category || 'Vocabulary',
            categoryLabel: q.category_label || '🔤 Vocabulary',
            isOpen: isPub,
            status: isPub ? 'Sedang Aktif' : (isReview ? 'Perlu Review Sensei' : 'Akses Ditutup'),
            statusCode: isPub ? 'running' : 'draft',
            durationMinutes: Number(q.duration_minutes) || 20,
            timeRemaining: `${q.duration_minutes || 20}:00`,
            questionType: 'Pilihan Ganda',
            thumbnailType: q.level === 'N4' ? 'osaka_castle' : 'torii_gate',
            badgeColor: q.level === 'N4' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700',
            submissionsCount: Number(q.total_attempts) || (q.student_submissions ? q.student_submissions.length : 0),
            totalStudents: q.class_name === 'N5 Pagi' ? 2 : 1,
            questions: q.questions || [],
            totalQuestions: Number(q.total_questions) || (q.questions ? q.questions.length : 10),
            materialTitle: q.material_title,
            materialFile: q.material_file,
            totalAttempts: Number(q.total_attempts) || 0,
            avgScore: q.avg_score ? Number(q.avg_score) : null
          };
        });
        setQuizzes(mapped);
      }
    } catch (e) {
      console.warn('Gagal memuat kuis dari backend:', e);
    }
  };

  useEffect(() => {
    fetchQuizzesFromApi();
  }, []);

  useEffect(() => {
    if (quizzes.length > 0) {
      try {
        localStorage.setItem('lms_master_quizzes_v6', JSON.stringify(quizzes));
      } catch (e) {
        console.error(e);
      }
    }
  }, [quizzes]);

  // Countdown timer for exam simulator
  useEffect(() => {
    if (!activeExamModal) return;
    const interval = setInterval(() => {
      setExamTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExamModal]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Speak Japanese audio helper
  const speakJapanese = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Unduh materi simulasi helper
  const handleDownloadMaterial = (fileName = 'Modul_Materi_Bab.pdf') => {
    Swal.fire({
      icon: 'success',
      title: 'Mengunduh Berkas Materi 📥',
      html: `
        <div class="text-xs text-slate-600 mt-1">
          Berkas <b class="text-blue-600">${fileName}</b> berhasil diunduh.<br/>
          Silakan buka modul dan pelajari pembahasannya sebelum mengerjakan tugas.
        </div>
      `,
      timer: 2200,
      showConfirmButton: false
    });
  };

  // ── SENSEI ACTIONS: BUKA / TUTUP AKSES ──
  const _handleToggleAccess = (type, itemId, e) => {
    e?.stopPropagation();
    if (type === 'task') {
      setTasks(prev => prev.map(t => {
        if (t.id === itemId) {
          const nextState = !t.isOpen;
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: nextState ? 'success' : 'info',
            title: nextState ? 'Akses tugas DIBUKA untuk siswa! 🔓' : 'Akses tugas DITUTUP (Terkunci) 🔒',
            showConfirmButton: false,
            timer: 1600
          });
          return { ...t, isOpen: nextState };
        }
        return t;
      }));
    } else {
      setQuizzes(prev => prev.map(q => {
        if (q.id === itemId) {
          const nextState = !q.isOpen;
          // Sync with database
          fetch('/api/lms_quiz_api.php?action=toggle_quiz_access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: itemId, is_open: nextState })
          }).catch(() => {
            fetch('/backend/api/lms_quiz_api.php?action=toggle_quiz_access', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quiz_id: itemId, is_open: nextState })
            }).catch(console.error);
          });

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: nextState ? 'success' : 'info',
            title: nextState ? 'Akses quiz DIBUKA untuk siswa! 🔓' : 'Akses quiz DITUTUP (Terkunci) 🔒',
            showConfirmButton: false,
            timer: 1600
          });
          return { ...q, isOpen: nextState };
        }
        return q;
      }));
    }
  };

  // ── START EXAM SIMULATOR (UKOM DAFTAR SOAL STYLE) ──
  const handleStartExam = async (quiz) => {
    if (!isSensei && !quiz.isOpen) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Belum Dibuka 🔒',
        text: 'Sensei belum membuka akses pengerjaan kuis ini. Silakan tunggu informasi dari Sensei.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    let loadedQuiz = { ...quiz };
    if (!loadedQuiz.questions || loadedQuiz.questions.length === 0) {
      try {
        let res = await fetch(`/api/lms_quiz_api.php?action=quiz_detail&id=${quiz.id}`);
        if (!res.ok) {
          res = await fetch(`/backend/api/lms_quiz_api.php?action=quiz_detail&id=${quiz.id}`);
        }
        const json = await res.json();
        if (json.status === 'success' && json.data.questions && json.data.questions.length > 0) {
          loadedQuiz.questions = json.data.questions.map(q => ({
            id: Number(q.id),
            category: q.category,
            categoryLabel: q.category_label || q.category,
            text: q.question,
            word_jp: q.word_jp,
            furigana: q.furigana,
            romaji: q.translation,
            kana: q.word_jp,
            meaning: q.translation,
            passage: q.passage,
            correctKey: q.correct_key,
            correct: q.correct_key,
            explanation: q.explanation,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          }));
        }
      } catch (e) {
        console.warn('Gagal memuat detail pertanyaan:', e);
      }
    }

    setActiveExamModal(loadedQuiz);
    setCurrentQIndex(0);
    setStudentAnswers({});
    setFlaggedQuestions({});
    setExamTimer((loadedQuiz.durationMinutes || 20) * 60);
  };

  // Select Option
  const handleAnswerOption = (qId, key) => {
    setStudentAnswers(prev => ({ ...prev, [qId]: key }));
  };

  // Toggle Flag (Ragu-ragu)
  const handleToggleFlag = (qId) => {
    setFlaggedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Finish Exam Simulator Submit
  const handleFinishExam = () => {
    if (!activeExamModal || !activeExamModal.questions) return;

    let correct = 0;
    const totalQ = activeExamModal.questions.length;

    activeExamModal.questions.forEach(q => {
      const correctAns = q.correctKey || q.correct || q.correct_key;
      if (studentAnswers[q.id] === correctAns) {
        correct++;
      }
    });

    const score = Math.round((correct / totalQ) * 100);
    const newSubmission = {
      studentId: currentUser.id || Date.now(),
      studentName: currentUser.name || 'Muhammad Faizal (Siswa)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      score,
      totalWrong: totalQ - correct,
      submittedAt: 'Baru saja',
      answers: studentAnswers,
      senseiNotes: score >= 80 ? 'Pemahaman materi sangat baik, pertahankan!' : 'Perlu memperbanyak latihan kanji dan tata bahasa.'
    };

    // Auto-sync attempt to MySQL
    const attemptPayload = {
      quiz_id: activeExamModal.id,
      student_id: currentUser.id || 1,
      student_name: currentUser.name || 'Muhammad Faizal',
      answers: studentAnswers,
      time_spent_seconds: ((activeExamModal.durationMinutes || 20) * 60) - examTimer
    };
    fetch('/api/lms_quiz_api.php?action=submit_attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attemptPayload)
    }).catch(() => {
      fetch('/backend/api/lms_quiz_api.php?action=submit_attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptPayload)
      }).catch(() => {});
    });

    setQuizzes(prev => prev.map(q => {
      if (q.id === activeExamModal.id) {
        const subs = q.studentSubmissions ? [newSubmission, ...q.studentSubmissions] : [newSubmission];
        return {
          ...q,
          studentSubmissions: subs,
          submissionsCount: subs.length,
          status: 'Selesai',
          statusCode: 'completed'
        };
      }
      return q;
    }));

    setActiveExamModal(null);

    Swal.fire({
      icon: score >= 75 ? 'success' : 'info',
      title: `Pengerjaan Selesai! 🎉`,
      html: `
        <div class="text-left text-xs space-y-2 mt-2">
          <p>Skor Anda: <b class="text-base text-blue-600">${score} / 100</b></p>
          <p>Benar: <b>${correct}</b> dari <b>${totalQ}</b> soal</p>
          <p class="text-slate-500">Hasil dan lembar jawaban Anda telah dikirimkan ke Sensei Ayu untuk evaluasi.</p>
        </div>
      `,
      confirmButtonColor: '#2563eb'
    });
  };

  // ── SENSEI SAVES EVALUATION & FEEDBACK TO STUDENT (QUIZ & TUGAS) ──
  const handleSaveSenseiFeedback = () => {
    if (!evaluatingItem || !selectedSubmission) return;

    const newScore = Number(senseiScoreInput) || selectedSubmission.score;

    // 1. Update Quizzes jika mengevaluasi kuis
    setQuizzes(prev => prev.map(q => {
      if (q.id === evaluatingItem.id && q.studentSubmissions) {
        return {
          ...q,
          studentSubmissions: q.studentSubmissions.map(s => {
            if (s.studentName === selectedSubmission.studentName) {
              return {
                ...s,
                score: newScore,
                senseiNotes: senseiFeedbackText.trim()
              };
            }
            return s;
          })
        };
      }
      return q;
    }));

    // 2. Update Tasks jika mengevaluasi tugas
    setTasks(prev => prev.map(t => {
      if (t.id === evaluatingItem.id) {
        const updatedSubs = (t.submissions || []).map(s => {
          if (s.studentName === selectedSubmission.studentName) {
            return {
              ...s,
              score: newScore,
              status: 'Dinilai',
              feedback: senseiFeedbackText.trim() || s.feedback,
              senseiNotes: senseiFeedbackText.trim()
            };
          }
          return s;
        });

        const isCurrentStudent = selectedSubmission.studentName.includes(currentUser?.name || 'Rina Aulia');

        return {
          ...t,
          submissions: updatedSubs,
          score: isCurrentStudent ? newScore : t.score,
          feedback: isCurrentStudent ? senseiFeedbackText.trim() : t.feedback,
          status: isCurrentStudent ? 'Dinilai' : t.status,
          statusCode: isCurrentStudent ? 'submitted' : t.statusCode,
          studentSubmission: t.studentSubmission && t.studentSubmission.studentName === selectedSubmission.studentName
            ? { ...t.studentSubmission, score: newScore, status: 'Dinilai', feedback: senseiFeedbackText.trim() }
            : t.studentSubmission
        };
      }
      return t;
    }));

    // Perbarui evaluatingItem lokal agar modal langsung ter-refresh
    setEvaluatingItem(prev => {
      if (!prev) return null;
      const key = prev.studentSubmissions ? 'studentSubmissions' : 'submissions';
      return {
        ...prev,
        [key]: (prev[key] || []).map(s => {
          if (s.studentName === selectedSubmission.studentName) {
            return {
              ...s,
              score: newScore,
              status: 'Dinilai',
              feedback: senseiFeedbackText.trim(),
              senseiNotes: senseiFeedbackText.trim()
            };
          }
          return s;
        })
      };
    });

    Swal.fire({
      icon: 'success',
      title: 'Catatan & Nilai Terkirim!',
      text: `Evaluasi untuk ${selectedSubmission.studentName} berhasil diperbarui.`,
      confirmButtonColor: '#2563eb'
    });

    setSelectedSubmission(null);
  };

  // ── SISWA KUMPUL TUGAS HANDLER ──
  const handleStudentSubmitTask = (e) => {
    e.preventDefault();
    if (!activeTaskSubmitModal) return;

    const file = uploadedSubmissionFile || {
      name: `Jawaban_${(activeTaskSubmitModal.bab || 'Tugas').replace(/\s+/g, '_')}_${(currentUser?.name || 'Rina_Aulia').replace(/\s+/g, '')}.pdf`,
      size: '1.6 MB'
    };

    const nowFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newSub = {
      studentName: currentUser?.name || 'Rina Aulia (Siswa)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      fileName: file.name,
      fileSize: file.size,
      notes: submissionNotes.trim() || 'Tugas telah selesai dikerjakan sesuai modul materi yang diunggah Sensei.',
      submittedAt: nowFormatted,
      status: 'Menunggu Penilaian Sensei',
      score: null,
      feedback: 'Tugas telah diterima oleh Sensei dan sedang menunggu giliran pemeriksaan nilai.'
    };

    setTasks(prev => prev.map(t => {
      if (t.id === activeTaskSubmitModal.id) {
        return {
          ...t,
          status: 'Sudah Dikumpulkan',
          statusCode: 'submitted',
          submittedDate: `Kumpul: ${nowFormatted}`,
          studentSubmission: newSub,
          submissions: t.submissions ? [newSub, ...t.submissions] : [newSub]
        };
      }
      return t;
    }));

    Swal.fire({
      icon: 'success',
      title: 'Tugas Berhasil Dikumpulkan! 🎉',
      html: `
        <div class="text-left text-xs space-y-2 mt-2">
          <p>Berkas Jawaban: <b class="text-blue-600">${newSub.fileName}</b> (${newSub.fileSize})</p>
          <p>Waktu Pengumpulan: <b>${newSub.submittedAt}</b></p>
          <p class="text-slate-500">Lembar tugas Anda telah diserahkan ke Sensei untuk diperiksa dan dinilai.</p>
        </div>
      `,
      confirmButtonColor: '#2563eb'
    });

    setActiveTaskSubmitModal(null);
    setUploadedSubmissionFile(null);
    setSubmissionNotes('');
  };

  // ── SENSEI TAKOBOTO QUESTION BUILDER & EDITOR STATE ──
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingTargetType, setEditingTargetType] = useState('quiz'); // 'quiz' | 'tugas'
  const [editingItem, setEditingItem] = useState(null); // null if creating new, or item object if editing
  const [builderForm, setBuilderForm] = useState({
    title: '',
    startBab: 1,
    endBab: 3,
    bab: 'Bab 1 s/d Bab 3',
    level: 'N5',
    durationMinutes: 20,
    isOpen: true,
    desc: '',
    uploadDate: '2026-10-22',
    uploadTime: '08:00',
    deadlineDate: '2026-10-29',
    deadlineTime: '23:59',
    deadlineDuration: '7 Hari',
    deadlineText: 'Tenggat: 29 Okt 2026, 23:59 WIB (7 Hari)',
    materialFile: null,
    selectedQuestionIds: [101, 102, 103, 104, 105],
    selectedWordIds: ['食べる', '飲む', '行く', '見る', '話す']
  });
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankLevelFilter, setBankLevelFilter] = useState('ALL');
  const [bankCategoryFilter, setBankCategoryFilter] = useState('ALL');
  const [builderTab, setBuilderTab] = useState('questions'); // 'questions' (Soal ABCD) | 'vocab' (Kamus Kosakata)
  const [showTakobotoAttach, setShowTakobotoAttach] = useState(false); // Collapsible attachment for Tugas
  const [isQuizMethodModalOpen, setIsQuizMethodModalOpen] = useState(false); // Modal flow "+ Buat Quiz Baru" (Manual, AI Generate, Bank Soal)

  // Open Create Modal
  const handleOpenCreateModal = (type = mainTab) => {
    setEditingTargetType(type);
    setEditingItem(null);
    setBuilderTab('questions');
    setShowTakobotoAttach(type === 'quiz');
    const initialLvl = selectedLevel === 'ALL' ? 'N5' : selectedLevel;
    const initialQ = TAKOBOTO_QUESTION_BANK.filter(q => q.level === initialLvl).map(q => q.id);
    const initialW = TAKOBOTO_VOCAB_BANK.filter(w => w.level === initialLvl).slice(0, 5).map(w => w.kanji);

    if (type === 'quiz') {
      setBuilderForm({
        title: `Quiz Takoboto ${initialLvl} – Pilihan Ganda Sensei`,
        startBab: 1,
        endBab: 2,
        bab: `Bab 1 – Materi Pilihan`,
        level: initialLvl,
        durationMinutes: 30,
        isOpen: true,
        desc: 'Uji pemahaman materi Chokai, Dokkai, Kaiwa, dan Bunpou dari kamus Takoboto.jp.',
        uploadDate: '2026-10-22',
        uploadTime: '08:00',
        deadlineDate: '2026-10-30',
        deadlineTime: '23:59',
        deadlineDuration: '30 Menit',
        deadlineText: 'Tenggat: 30 Okt 2026, 23:59 WIB',
        materialFile: null,
        selectedQuestionIds: initialQ.length > 0 ? initialQ : [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
        selectedWordIds: initialW.length > 0 ? initialW : ['食べる', '飲む', '行く']
      });
    } else {
      setBuilderForm({
        title: `Tugas ${initialLvl} – Latihan Materi Bab 1 s/d Bab 3`,
        startBab: 1,
        endBab: 3,
        bab: `Bab 1 s/d Bab 3`,
        level: initialLvl,
        durationMinutes: 45,
        isOpen: true,
        desc: 'Pelajari berkas modul materi Bab 1 s/d Bab 3 yang diunggah Sensei. Kerjakan lembar latihan pada berkas modul dan kumpulkan tugas sebelum batas tenggat waktu.',
        uploadDate: '2026-10-22',
        uploadTime: '08:00',
        deadlineDate: '2026-10-29',
        deadlineTime: '23:59',
        deadlineDuration: '7 Hari',
        deadlineText: 'Tenggat: 29 Okt 2026, 23:59 WIB (7 Hari)',
        materialFile: {
          name: `Modul_Materi_Bab1-3_${initialLvl}.pdf`,
          size: '2.8 MB',
          type: 'PDF',
          uploadedAt: '22 Okt 2026'
        },
        selectedQuestionIds: initialQ.slice(0, 5),
        selectedWordIds: initialW.length > 0 ? initialW : ['食べる', '飲む', '行く']
      });
    }
    setBankLevelFilter(initialLvl);
    setBankCategoryFilter('ALL');
    setBankSearchQuery('');
    setEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (type, item) => {
    setEditingTargetType(type);
    setEditingItem(item);
    const qIds = item.questions?.map(q => q.id) || [];
    const wIds = item.takobotoWords?.map(w => w.kanji) || [];

    setBuilderTab(qIds.length > 0 || type === 'quiz' ? 'questions' : 'vocab');
    setShowTakobotoAttach(type === 'quiz' || (item.questions && item.questions.length > 0));

    setBuilderForm({
      title: item.title || '',
      startBab: item.startBab || 1,
      endBab: item.endBab || 3,
      bab: item.bab || `Bab ${item.startBab || 1} s/d Bab ${item.endBab || 3}`,
      level: item.level || 'N5',
      durationMinutes: item.durationMinutes || 20,
      isOpen: item.isOpen !== undefined ? item.isOpen : true,
      desc: item.desc || '',
      uploadDate: item.uploadDate || '2026-10-22',
      uploadTime: item.uploadTime || '08:00',
      deadlineDate: item.deadlineDate || '2026-10-30',
      deadlineTime: item.deadlineTime || '23:59',
      deadlineDuration: item.deadlineDuration || '3 Hari',
      deadlineText: item.deadlineText || 'Tenggat: 30 Okt 2026, 23:59 WIB',
      materialFile: item.materialFile || null,
      selectedQuestionIds: qIds.length > 0 ? qIds : [101, 102, 103, 104, 105],
      selectedWordIds: wIds
    });
    setBankLevelFilter(item.level || 'ALL');
    setBankCategoryFilter('ALL');
    setBankSearchQuery('');
    setEditorModalOpen(true);
  };

  // Delete Item
  const handleDeleteItem = (type, id, title) => {
    Swal.fire({
      title: `Hapus ${type === 'quiz' ? 'Quiz' : 'Tugas'}?`,
      html: `Apakah Sensei yakin ingin menghapus <b>"${title}"</b>?<br/><span class="text-xs text-slate-400">Data butir soal dan riwayat nilai siswa terkait akan dihapus.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Sekarang',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        if (type === 'quiz') {
          setQuizzes(prev => prev.filter(q => q.id !== id));
          fetch('/api/lms_quiz_api.php?action=delete_quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: id })
          }).catch(() => {
            fetch('/backend/api/lms_quiz_api.php?action=delete_quiz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quiz_id: id })
            }).catch(console.error);
          });
        } else {
          setTasks(prev => prev.filter(t => t.id !== id));
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `${type === 'quiz' ? 'Quiz' : 'Tugas'} berhasil dihapus! 🗑️`,
          showConfirmButton: false,
          timer: 1800
        });
      }
    });
  };

  // Toggle selection for Takoboto questions
  const handleToggleQuestionSelection = (qId) => {
    setBuilderForm(prev => {
      const exists = prev.selectedQuestionIds.includes(qId);
      const nextIds = exists 
        ? prev.selectedQuestionIds.filter(id => id !== qId)
        : [...prev.selectedQuestionIds, qId];
      return { ...prev, selectedQuestionIds: nextIds };
    });
  };

  // Toggle selection for Takoboto words
  const handleToggleWordSelection = (wKanji) => {
    setBuilderForm(prev => {
      const exists = prev.selectedWordIds.includes(wKanji);
      const nextWords = exists
        ? prev.selectedWordIds.filter(k => k !== wKanji)
        : [...prev.selectedWordIds, wKanji];
      return { ...prev, selectedWordIds: nextWords };
    });
  };

  // Quick Preset Selection for count of questions
  const handleQuickSelectQuestions = (count) => {
    const pool = TAKOBOTO_QUESTION_BANK.filter(q => {
      if (bankLevelFilter !== 'ALL' && q.level !== bankLevelFilter) return false;
      if (bankCategoryFilter !== 'ALL' && q.category !== bankCategoryFilter) return false;
      return true;
    });
    const selected = pool.slice(0, count).map(q => q.id);
    setBuilderForm(prev => ({
      ...prev,
      selectedQuestionIds: selected
    }));
  };

  // Quick Preset Selection for count of words
  const handleQuickSelectWords = (count) => {
    const pool = TAKOBOTO_VOCAB_BANK.filter(w => {
      if (bankLevelFilter !== 'ALL' && w.level !== bankLevelFilter) return false;
      return true;
    });
    const selected = pool.slice(0, count).map(w => w.kanji);
    setBuilderForm(prev => ({
      ...prev,
      selectedWordIds: selected
    }));
  };

  // Save Builder
  const handleSaveBuilder = () => {
    if (!builderForm.title.trim()) {
      Swal.fire('Judul Diperlukan', 'Silakan masukkan judul soal / tugas.', 'warning');
      return;
    }

    // Map selected IDs to question objects
    const finalQuestions = builderForm.selectedQuestionIds.map((qId, idx) => {
      const template = TAKOBOTO_QUESTION_BANK.find(q => q.id === qId);
      if (template) {
        return { ...template, id: idx + 1 };
      }
      if (editingItem && editingItem.questions) {
        const existingQ = editingItem.questions.find(q => q.id === qId);
        if (existingQ) return existingQ;
      }
      return null;
    }).filter(Boolean);

    // Also extract vocabulary from questions if needed
    const finalWords = builderForm.selectedWordIds.map(k => {
      return TAKOBOTO_VOCAB_BANK.find(w => w.kanji === k) || {
        kanji: k, kana: k, romaji: k, pos: 'Kosakata', meaning: k, takobotoUrl: `https://takoboto.jp/?q=${k}`
      };
    });

    if (editingTargetType === 'quiz') {
      if (finalQuestions.length === 0) {
        Swal.fire('Pilih Butir Soal', 'Silakan centang minimal 1 butir soal ABCD dari bank Takoboto.', 'warning');
        return;
      }

      if (editingItem) {
        setQuizzes(prev => prev.map(q => {
          if (q.id === editingItem.id) {
            return {
              ...q,
              title: builderForm.title,
              bab: builderForm.bab,
              level: builderForm.level,
              durationMinutes: Number(builderForm.durationMinutes) || 20,
              isOpen: builderForm.isOpen,
              questions: finalQuestions
            };
          }
          return q;
        }));
        Swal.fire('Quiz Berhasil Diperbarui!', `Quiz "${builderForm.title}" dengan ${finalQuestions.length} butir soal ABCD telah disimpan.`, 'success');
      } else {
        const newQuiz = {
          id: Date.now(),
          title: builderForm.title,
          bab: builderForm.bab,
          level: builderForm.level,
          durationMinutes: Number(builderForm.durationMinutes) || 20,
          isOpen: builderForm.isOpen,
          status: 'Sedang Aktif',
          statusCode: 'running',
          badgeColor: 'bg-blue-50 text-blue-600',
          thumbnailType: 'quiz_sheet',
          submissionsCount: 0,
          questions: finalQuestions,
          studentSubmissions: []
        };
        setQuizzes(prev => [newQuiz, ...prev]);
        Swal.fire('Quiz Berhasil Dibuat!', `Quiz baru dengan ${finalQuestions.length} butir soal ABCD Takoboto siap dikerjakan siswa.`, 'success');
      }
    } else {
      // ── TUGAS SISWA & UPLOAD MATERI BAB SENSEI ──
      const computedBab = builderForm.startBab && builderForm.endBab 
        ? `Bab ${builderForm.startBab} s/d Bab ${builderForm.endBab}` 
        : (builderForm.bab || 'Bab 1 s/d Bab 3');

      const computedDeadline = builderForm.deadlineDate 
        ? `Tenggat: ${builderForm.deadlineDate}${builderForm.deadlineTime ? ', ' + builderForm.deadlineTime + ' WIB' : ''}${builderForm.deadlineDuration ? ' (' + builderForm.deadlineDuration + ')' : ''}`
        : builderForm.deadlineText;

      const fallbackMaterial = builderForm.materialFile || {
        name: `Modul_${computedBab.replace(/\s+/g, '_')}_${builderForm.level}.pdf`,
        size: '2.5 MB',
        type: 'PDF',
        pages: 12,
        uploadedAt: builderForm.uploadDate || '22 Okt 2026'
      };

      if (editingItem) {
        setTasks(prev => prev.map(t => {
          if (t.id === editingItem.id) {
            return {
              ...t,
              title: builderForm.title,
              startBab: builderForm.startBab,
              endBab: builderForm.endBab,
              bab: computedBab,
              level: builderForm.level,
              desc: builderForm.desc,
              uploadDate: builderForm.uploadDate || '2026-10-22',
              uploadTime: builderForm.uploadTime || '08:00',
              deadlineDate: builderForm.deadlineDate,
              deadlineTime: builderForm.deadlineTime,
              deadlineDuration: builderForm.deadlineDuration,
              deadlineText: computedDeadline,
              isOpen: builderForm.isOpen,
              materialFile: builderForm.materialFile || t.materialFile || fallbackMaterial,
              questions: finalQuestions.length > 0 ? finalQuestions : (t.questions || []),
              takobotoWords: finalWords.length > 0 ? finalWords : (t.takobotoWords || [])
            };
          }
          return t;
        }));
        Swal.fire('Tugas & Materi Diperbarui!', `Tugas "${builderForm.title}" materi ${computedBab} telah diperbarui.`, 'success');
      } else {
        const newTask = {
          id: Date.now(),
          title: builderForm.title,
          startBab: builderForm.startBab,
          endBab: builderForm.endBab,
          bab: computedBab,
          level: builderForm.level,
          desc: builderForm.desc || 'Pelajari berkas modul materi yang diunggah Sensei dan kerjakan tugas yang tertera.',
          uploadDate: builderForm.uploadDate || '2026-10-22',
          uploadTime: builderForm.uploadTime || '08:00',
          deadlineDate: builderForm.deadlineDate,
          deadlineTime: builderForm.deadlineTime,
          deadlineDuration: builderForm.deadlineDuration,
          deadlineText: computedDeadline,
          isOpen: builderForm.isOpen,
          status: 'Belum Dikumpulkan',
          statusCode: 'unsubmitted',
          iconBg: 'bg-blue-50 text-blue-500 border-blue-100',
          tags: ['Materi Sensei', computedBab, `JLPT ${builderForm.level}`],
          materialFile: fallbackMaterial,
          questions: finalQuestions,
          takobotoWords: finalWords.length > 0 ? finalWords : finalQuestions.slice(0, 5).map(q => ({
            kanji: q.wordJp || q.question.slice(0, 4),
            kana: q.furigana || '',
            romaji: '',
            pos: q.category,
            meaning: q.translation || q.question,
            takobotoUrl: `https://takoboto.jp/?q=${encodeURIComponent(q.wordJp || '')}`
          })),
          submissions: []
        };
        setTasks(prev => [newTask, ...prev]);
        Swal.fire('Tugas & Materi Berhasil Diunggah!', `Tugas ${computedBab} dengan tenggat waktu ${builderForm.deadlineDuration || '3 Hari'} telah diterbitkan untuk siswa.`, 'success');
      }
    }

    setEditorModalOpen(false);
  };

  // Filtered master bank for modal picker
  const filteredBankQuestions = useMemo(() => {
    return TAKOBOTO_QUESTION_BANK.filter(q => {
      if (bankLevelFilter !== 'ALL' && q.level !== bankLevelFilter) return false;
      if (bankCategoryFilter !== 'ALL' && q.category !== bankCategoryFilter) return false;
      if (bankSearchQuery.trim()) {
        const query = bankSearchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(query) ||
          q.wordJp?.toLowerCase().includes(query) ||
          q.translation?.toLowerCase().includes(query) ||
          q.explanation?.toLowerCase().includes(query) ||
          (q.passage && q.passage.toLowerCase().includes(query)) ||
          (q.furigana && q.furigana.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [bankLevelFilter, bankCategoryFilter, bankSearchQuery]);

  const filteredBankVocab = useMemo(() => {
    return TAKOBOTO_VOCAB_BANK.filter(w => {
      if (bankLevelFilter !== 'ALL' && w.level !== bankLevelFilter) return false;
      if (bankSearchQuery.trim()) {
        const query = bankSearchQuery.toLowerCase();
        return (
          w.kanji.toLowerCase().includes(query) ||
          w.kana.toLowerCase().includes(query) ||
          w.meaning.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [bankLevelFilter, bankSearchQuery]);

  // Status filter: 'ALL' | 'OPEN' | 'CLOSED' (for Sensei) or 'ALL' | 'UNSUBMITTED' | 'SUBMITTED' (for Siswa)
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered Tugas
  const _filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Class Rombel Filter
      if (selectedClassFilter !== 'Semua Kelas' && t.classRoom && !isClassMatching(t.classRoom, selectedClassFilter)) {
        return false;
      }

      // Level filter
      if (selectedLevel !== 'ALL' && t.level !== selectedLevel) return false;
      
      // Status filter
      if (isSensei) {
        if (statusFilter === 'OPEN' && !t.isOpen) return false;
        if (statusFilter === 'CLOSED' && t.isOpen) return false;
        if (statusFilter === 'NEED_REVIEW' && (!t.submissions || t.submissions.length === 0)) return false;
      } else {
        if (statusFilter === 'UNSUBMITTED' && t.statusCode === 'submitted') return false;
        if (statusFilter === 'SUBMITTED' && t.statusCode !== 'submitted') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesBab = t.bab?.toLowerCase().includes(q);
        const matchesDesc = t.desc?.toLowerCase().includes(q);
        const matchesWords = t.takobotoWords?.some(w => 
          w.kanji.toLowerCase().includes(q) || 
          w.kana.toLowerCase().includes(q) || 
          w.meaning.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesBab && !matchesDesc && !matchesWords) return false;
      }

      return true;
    });
  }, [tasks, selectedClassFilter, selectedLevel, statusFilter, searchQuery, isSensei]);

  // Filtered Quizzes with Multi-Select Filters and Sorting
  const filteredQuizzes = useMemo(() => {
    let result = quizzes.map((q, idx) => ({
      ...q,
      desc: q.desc || q.materialTitle || (q.level === 'N5' ? 'Modul Minna no Nihongo Bab 01 – Perkenalan Diri (Jikoshoukai & Partikel Wa, Desu)' : 'Modul Minna no Nihongo Bab 26 (Pola ～んです & Penjelasan Situasi)'),
      tags: q.tags || (q.level === 'N5' ? ['Kotoba', 'Bunpou', 'Kanji', 'Dokkai'] : ['Kotoba', 'Bunpou', 'Dokkai', 'Situational']),
      curriculumSource: q.curriculumSource || (q.level === 'N5' ? 'Minna no Nihongo' : 'Japan Foundation / Irodori'),
      createdAt: q.createdAt || (idx === 0 ? '23 Nov 2026' : idx === 1 ? '22 Nov 2026' : '20 Nov 2026'),
      submissionsCount: q.submissionsCount !== undefined ? q.submissionsCount : (idx === 0 ? 25 : idx === 1 ? 18 : 12),
      status: q.status || (idx === 1 ? 'Draft' : 'Dipublikasikan'),
      thumbnailType: q.thumbnailType || (idx % 2 === 0 ? 'osaka_castle' : 'torii_gate')
    })).filter(q => {
      // Class Rombel Filter
      if (selectedClassFilter !== 'Semua Kelas' && q.classRoom && !isClassMatching(q.classRoom, selectedClassFilter)) {
        return false;
      }

      // Sidebar Level Filter (Multi-select)
      if (selectedLevels.length > 0 && !selectedLevels.includes(q.level)) {
        return false;
      }

      // Sidebar Category Filter (Multi-select)
      if (selectedCategories.length > 0) {
        const hasMatch = selectedCategories.some(cat => {
          if (q.category === cat) return true;
          if (cat === 'Vocabulary' && (q.category === 'Vocabulary' || q.tags?.includes('Kotoba') || q.title.toLowerCase().includes('kosakata') || q.desc?.toLowerCase().includes('kosakata'))) return true;
          if (cat === 'Grammar' && (q.category === 'Grammar' || q.tags?.includes('Bunpou') || q.title.toLowerCase().includes('grammar') || q.title.toLowerCase().includes('pola kalimat'))) return true;
          if (cat === 'Kanji' && (q.category === 'Kanji' || q.tags?.includes('Kanji') || q.title.toLowerCase().includes('kanji'))) return true;
          if (cat === 'Reading' && (q.category === 'Reading' || q.tags?.includes('Dokkai') || q.title.toLowerCase().includes('reading') || q.title.toLowerCase().includes('bacaan'))) return true;
          if (cat === 'Listening' && (q.category === 'Listening' || q.tags?.includes('Choukai') || q.title.toLowerCase().includes('listening'))) return true;
          if (cat === 'Situational' && (q.category === 'Situational' || q.tags?.includes('Situational') || q.title.toLowerCase().includes('situasi') || q.title.toLowerCase().includes('etika'))) return true;
          return false;
        });
        if (!hasMatch) return false;
      }

      // Status filter
      if (isSensei) {
        if (statusFilter === 'OPEN' && !q.isOpen) return false;
        if (statusFilter === 'CLOSED' && q.isOpen) return false;
        if (statusFilter === 'NEED_REVIEW' && (!q.studentSubmissions || q.studentSubmissions.length === 0)) return false;
      } else {
        if (statusFilter === 'UNSUBMITTED' && q.statusCode === 'completed') return false;
        if (statusFilter === 'SUBMITTED' && q.statusCode !== 'completed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title?.toLowerCase().includes(query);
        const matchesBab = q.bab?.toLowerCase().includes(query);
        const matchesDesc = q.desc?.toLowerCase().includes(query);
        const matchesLevel = q.level?.toLowerCase().includes(query);
        const matchesCat = q.category?.toLowerCase().includes(query) || q.categoryLabel?.toLowerCase().includes(query);
        const matchesCur = q.curriculumSource?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBab && !matchesDesc && !matchesLevel && !matchesCat && !matchesCur) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'terbaru') {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (sortBy === 'terlama') {
      result.sort((a, b) => (a.id || 0) - (b.id || 0));
    } else if (sortBy === 'durasi') {
      result.sort((a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0));
    } else if (sortBy === 'soal') {
      result.sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
    }

    return result;
  }, [quizzes, selectedClassFilter, selectedLevels, selectedCategories, statusFilter, searchQuery, sortBy, isSensei]);

  // Dynamic statistics calculation for KPI cards (100% real-time and synchronized with quizzes)
  const stats = useMemo(() => {
    // Target scope based on selected class filter if active
    const target = (selectedClassFilter && selectedClassFilter !== 'Semua Kelas' && selectedClassFilter !== 'all')
      ? quizzes.filter(q => !q.classRoom || q.classRoom === 'Semua Kelas' || isClassMatching(q.classRoom, selectedClassFilter))
      : quizzes;

    // 1. Total Kuis
    const totalItems = target.length;

    // 2. Kuis Aktif (Kuis yang sedang dibuka untuk dikerjakan siswa)
    const activeItems = target.filter(x => {
      const st = (x.status || '').toLowerCase();
      return (x.isOpen === true && st !== 'draft' && st !== 'akses ditutup' && st !== 'tutup') 
        || st === 'sedang aktif' 
        || st === 'published';
    }).length;

    // 3. Draft (Kuis yang belum dirilis atau masih dalam tahap penyusunan/review)
    const draftItems = target.filter(x => {
      const st = (x.status || '').toLowerCase();
      return st === 'draft' 
        || st === 'perlu review sensei' 
        || x.isDraft === true
        || (!x.isOpen && st !== 'sedang aktif' && st !== 'published' && st !== 'selesai');
    }).length;

    // 4. Terjadwal (Kuis yang sudah dijadwalkan tanggal mulainya di masa depan)
    const now = new Date();
    const scheduledItems = target.filter(x => {
      const st = (x.status || '').toLowerCase();
      if (st === 'terjadwal' || st === 'scheduled') return true;
      if (x.startDate && new Date(x.startDate) > now) return true;
      return false;
    }).length;

    // 5. Selesai (Total akumulasi submission siswa yang telah mengerjakan/submit kuis)
    const completedItems = target.reduce((acc, curr) => {
      const subs = curr.submissions || curr.studentSubmissions || [];
      const subCount = subs.filter(s => {
        const sStatus = (s.status || '').toLowerCase();
        return sStatus === 'dinilai' || sStatus === 'selesai' || sStatus === 'sudah dikumpulkan' || s.isCompleted === true;
      }).length || subs.length;
      return acc + (Number(curr.totalAttempts) || Number(curr.completedCount) || subCount);
    }, 0);

    return { totalItems, activeItems, draftItems, scheduledItems, completedItems };
  }, [quizzes, selectedClassFilter]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
        
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* 1. HERO HEADER BANNER (MOCKUP EXACT DESIGN)                   */}
        {/* ============================================================ */}
        <div className="relative bg-white border-b border-slate-200/90 px-4 md:px-8 py-5 overflow-hidden">
          {/* Subtle Banner Artwork in Background */}
          <div 
            className="absolute top-0 right-0 w-[550px] md:w-[750px] h-full pointer-events-none bg-right bg-cover transition-all duration-300"
            style={{ 
              backgroundImage: `url(${mainTab === 'quiz' ? quizHeroBannerImg : bannerImg})`,
              opacity: mainTab === 'quiz' ? 0.40 : 0.15,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 35%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 35%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {/* Title & Badge */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <span>Quiz Interaktif</span>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#1d4ed8] text-white shadow-2xs">
                  {isSensei ? 'Mode Sensei' : 'Mode Siswa'}
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                Buat, kelola, dan evaluasi kuis pembelajaran Bahasa Jepang berdasarkan materi, bab, level, dan kebutuhan kelas.
              </p>
            </div>

            {/* Quick Actions (Right) */}
            <div className="flex items-center gap-3">
              <a
                href="https://takoboto.jp/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-slate-200/90 hover:border-blue-400 text-slate-700 hover:text-blue-600 px-4 py-2.5 rounded-xl shadow-2xs text-xs font-bold transition cursor-pointer"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Kamus Takoboto.jp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              {isSensei && (
                <div className="relative" ref={createDropdownRef}>
                  <button
                    onClick={() => setIsCreateDropdownOpen(prev => !prev)}
                    className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Quiz Baru</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCreateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu (Exact Mockup Match) */}
                  {isCreateDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* Option 1: Buat Manual */}
                      <button
                        onClick={() => {
                          setIsCreateDropdownOpen(false);
                          handleOpenCreateModal('quiz');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-3 transition cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Buat Manual</div>
                          <div className="text-[11px] text-slate-400">Buat soal secara manual</div>
                        </div>
                      </button>

                      {/* Option 2: Generate dari Materi (Highlighted in Mockup) */}
                      <button
                        onClick={() => {
                          setIsCreateDropdownOpen(false);
                          navigate('/lms/quiz/generate');
                        }}
                        className="w-full text-left px-4 py-2.5 bg-blue-50/80 hover:bg-blue-100/80 border-l-4 border-blue-600 flex items-start gap-3 transition cursor-pointer my-1"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-blue-900">Generate dari Materi</div>
                          <div className="text-[11px] text-blue-700/80 font-medium">Buat butir soal otomatis dari modul kelas</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SUB-NAVIGATION TABS (Overview, Quiz Saya, Question Bank, Daily, Analytics) */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
          <div className="flex items-center gap-2 border-b border-slate-200/90 pb-3 flex-wrap">
            <button
              onClick={() => setActiveNavTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeNavTab === 'overview'
                  ? 'bg-[#0F2D59] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 font-bold'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveNavTab('quiz_saya')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'quiz_saya'
                  ? 'bg-[#0F2D59] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Quiz Saya</span>
            </button>

            <button
              onClick={() => navigate('/lms/quiz/generate')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Generate dari Materi</span>
            </button>

            <button
              onClick={() => navigate('/lms/quiz/daily')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Daily Quiz</span>
            </button>

            <button
              onClick={() => setActiveNavTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'analytics'
                  ? 'bg-[#0F2D59] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. 5 KPI STATS CARDS (Exact Match to Mockup)                 */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Total Quiz */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500">Total Quiz</div>
                <div className="text-xl font-black text-slate-800 tracking-tight">{stats.totalItems}</div>
                <div className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>{selectedClassFilter && selectedClassFilter !== 'Semua Kelas' ? `Kelas ${selectedClassFilter}` : 'Semua Rombel'}</span>
                </div>
              </div>
            </div>

            {/* 2. Quiz Aktif */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Play className="w-5 h-5 fill-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500">Quiz Aktif</div>
                <div className="text-xl font-black text-slate-800 tracking-tight">{stats.activeItems}</div>
                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">Sesi Dibuka</div>
              </div>
            </div>

            {/* 3. Draft */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500">Draft</div>
                <div className="text-xl font-black text-slate-800 tracking-tight">{stats.draftItems}</div>
                <div className="text-[10px] font-bold text-purple-600 mt-0.5">Belum Dipublikasi</div>
              </div>
            </div>

            {/* 4. Terjadwal */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500">Terjadwal</div>
                <div className="text-xl font-black text-slate-800 tracking-tight">{stats.scheduledItems}</div>
                <div className="text-[10px] font-bold text-indigo-600 mt-0.5">Sesi Mendatang</div>
              </div>
            </div>

            {/* 5. Selesai */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500">Selesai</div>
                <div className="text-xl font-black text-slate-800 tracking-tight">{stats.completedItems}</div>
                <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Jawaban Masuk</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. HERO GENERATOR & ALUR PEMBUATAN WORKFLOW (Two Cards)      */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Left Card: Generate Quiz dari Materi Pembelajaran */}
            <div className="lg:col-span-7 rounded-2xl bg-gradient-to-r from-[#173B75] via-[#1B4B96] to-[#2563EB] text-white p-6 md:p-7 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
                    Generate Quiz dari Materi Pembelajaran
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-blue-100 max-w-xl leading-relaxed mb-6">
                  Upload materi (PDF/PPT/DOCX) atau pilih materi yang sudah ada, sistem akan membuat soal otomatis (Kosakata, Grammar, Kanji, Reading, Listening, Situational).
                </p>
                <button
                  onClick={() => navigate('/lms/quiz/generate')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition active:scale-95 cursor-pointer border border-blue-400/40"
                >
                  <span>Generate Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Floating Document Graphic Right */}
              <div className="absolute right-4 bottom-2 pointer-events-none hidden sm:block">
                <div className="relative w-44 h-36">
                  <div className="absolute bottom-2 right-2 w-36 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-inner flex items-center justify-center">
                    <Layers className="w-12 h-12 text-white/30" />
                  </div>
                  <div className="absolute top-1 left-2 bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md border border-rose-300 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>PDF</span>
                  </div>
                  <div className="absolute top-5 right-8 bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md border border-amber-300 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>PPT</span>
                  </div>
                  <div className="absolute top-14 left-14 bg-blue-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md border border-blue-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>DOCX</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Alur Pembuatan Quiz */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 p-5 md:p-6 shadow-xs flex flex-col justify-between">
              <h3 className="text-sm md:text-base font-bold text-slate-800 mb-4">
                Alur Pembuatan Quiz
              </h3>
              
              <div className="flex items-center justify-between gap-1 text-center py-2">
                {/* 1. Upload */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs mb-1.5">
                    <Upload className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">
                    Upload / Pilih Materi
                  </span>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mb-4" />

                {/* 2. Ekstrak */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs mb-1.5">
                    <Layers className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">
                    Ekstrak Materi
                  </span>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mb-4" />

                {/* 3. Generate */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-2xs mb-1.5">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">
                    Generate Soal (AI)
                  </span>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mb-4" />

                {/* 4. Review */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-2xs mb-1.5">
                    <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">
                    Review oleh Sensei
                  </span>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mb-4" />

                {/* 5. Publish */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-2xs mb-1.5">
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">
                    Publish ke Kelas
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. MAIN CONTENT: FILTER SIDEBAR (LEFT) + QUIZ LIST (RIGHT)   */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT COLUMN: FILTER QUIZ SIDEBAR ── */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">
                Filter Quiz
              </h3>

              {/* Section 1: Level Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsLevelFilterOpen(prev => !prev)}
                  className="flex items-center justify-between w-full font-bold text-xs text-slate-800 py-1.5 cursor-pointer"
                >
                  <span>Level</span>
                  {isLevelFilterOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {isLevelFilterOpen && (
                  <div className="space-y-2 mt-2 pt-1">
                    {['N5', 'N4', 'N3'].map(lvl => {
                      const isChecked = selectedLevels.includes(lvl);
                      return (
                        <label key={lvl} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLevel(lvl)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>{lvl}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Kategori Accordion */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryFilterOpen(prev => !prev)}
                  className="flex items-center justify-between w-full font-bold text-xs text-slate-800 py-1.5 cursor-pointer"
                >
                  <span>Kategori</span>
                  {isCategoryFilterOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {isCategoryFilterOpen && (
                  <div className="space-y-2 mt-2 pt-1">
                    {[
                      { id: 'Vocabulary', label: 'Vocabulary (文字・語彙)' },
                      { id: 'Grammar', label: 'Grammar (文法)' },
                      { id: 'Kanji', label: 'Kanji (漢字)' },
                      { id: 'Reading', label: 'Reading (読解)' },
                      { id: 'Listening', label: 'Listening (聴解)' },
                      { id: 'Situational', label: 'Situational (会話)' }
                    ].map(cat => {
                      const isChecked = selectedCategories.includes(cat.id);
                      return (
                        <label key={cat.id} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.id)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>{cat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reset Link */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: QUIZ LIST & CONTROLS ── */}
            <div className="lg:col-span-9 space-y-4">
              
              {/* Controls Bar: Search, View Mode, Sort, Per Page */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 md:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                
                {/* Title & Search */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm md:text-base text-slate-900 shrink-0">
                    Daftar Quiz ({filteredQuizzes.length})
                  </h3>
                  
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari judul quiz, bab, atau materi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: View Toggle, Sort, Per Page */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Tampilan List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Tampilan Grid"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-slate-50 border border-slate-200/80 hover:border-blue-400 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition shadow-2xs"
                    >
                      <option value="terbaru">Terbaru</option>
                      <option value="terlama">Terlama</option>
                      <option value="durasi">Durasi Terlama</option>
                      <option value="soal">Soal Terbanyak</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Per Page Dropdown */}
                  <div className="relative hidden md:block">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="appearance-none bg-slate-50 border border-slate-200/80 hover:border-blue-400 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition shadow-2xs"
                    >
                      <option value={10}>10 / halaman</option>
                      <option value={20}>20 / halaman</option>
                      <option value={50}>50 / halaman</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Quiz Cards List or Empty State */}
              {filteredQuizzes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Tidak ada quiz yang sesuai filter
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Silakan ubah filter Level, Kategori, atau kata kunci pencarian Anda.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {filteredQuizzes.slice(0, itemsPerPage).map((quiz, index) => {
                    const thumbImg = quiz.thumbnailType === 'osaka_castle' || index === 0 ? osakaCastleImg : toriiGateImg;
                    const isDraft = quiz.status === 'Draft' || !quiz.isOpen;

                    return (
                      <div
                        key={quiz.id}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                      >
                        {/* Left: Thumbnail Image */}
                        <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden shrink-0 shadow-2xs relative bg-slate-900">
                          <img
                            src={thumbImg}
                            alt={quiz.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                          />
                          <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            🇯🇵 JLPT {quiz.level || 'N5'}
                          </div>
                        </div>

                        {/* Middle: Details */}
                        <div className="flex-1 min-w-0">
                          {/* Badges Row + Status */}
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-[#2563EB] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                {quiz.level || 'N5'}
                              </span>
                              <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                Daily Quiz
                              </span>
                              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {quiz.bab || 'Bab 01-05'}
                              </span>
                              {quiz.curriculumSource && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                                  ✨ {quiz.curriculumSource}
                                </span>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div>
                              {!isDraft ? (
                                <span className="bg-[#16a34a] text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-2xs flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  <span>Dipublikasikan</span>
                                </span>
                              ) : (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
                                  <span>Draft</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                            {quiz.title}
                          </h3>

                          {/* Subtitle / Description */}
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                            {quiz.desc || 'Modul Minna no Nihongo Bab 01 – Perkenalan Diri (Jikoshoukai & Partikel Wa, Desu)'}
                          </p>

                          {/* Tags Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            {(quiz.tags || ['Kotoba', 'Bunpou', 'Kanji', 'Dokkai']).map((tag, tIdx) => (
                              <span key={tIdx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Metadata row */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-2.5 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>{quiz.questions?.length || 10} Butir Soal</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{quiz.durationMinutes || 15} Menit</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{quiz.submissionsCount || 25} Siswa</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{quiz.createdAt || '23 Nov 2026'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center mt-3 md:mt-0 flex-wrap">
                          {!isDraft ? (
                            <>
                              <button
                                onClick={() => handleStartExam(quiz)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 shadow-2xs transition cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-blue-600" />
                                <span>Simulasi</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEvaluatingItem(quiz);
                                  setSelectedSubmission(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 shadow-2xs transition cursor-pointer"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                                <span>Hasil</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal('quiz', quiz)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                                title="Edit Quiz"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDuplicateQuiz(quiz)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                                title="Duplikasi Quiz"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteItem('quiz', quiz.id, quiz.title)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                                title="Hapus Quiz"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartExam(quiz)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 shadow-2xs transition cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Review Soal</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal('quiz', quiz)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 shadow-2xs transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteItem('quiz', quiz.id, quiz.title)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                                title="Hapus Quiz"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

{/* MODAL 1: EXAM SIMULATOR PERSIS UKOM DENGAN DAFTAR SOAL LENGKAP           */}
        {/* ========================================================================= */}
        {activeExamModal && activeExamModal.questions && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col max-h-[92vh]">
              
              {/* Exam Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {activeExamModal.level}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base">{activeExamModal.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-blue-100 mt-1">
                    <span>Format Ujian Kompetensi Siswa</span>
                    <span>•</span>
                    <span className="font-bold text-amber-300">⏱ Sisa Waktu: {formatTimer(examTimer)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    Swal.fire({
                      title: 'Keluar dari Pengerjaan?',
                      text: 'Progres jawaban Anda saat ini akan ditutup.',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Ya, Keluar',
                      cancelButtonText: 'Lanjutkan',
                      confirmButtonColor: '#ef4444'
                    }).then(r => {
                      if (r.isConfirmed) setActiveExamModal(null);
                    });
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Exam Body (2 Columns like UKOM) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 overflow-y-auto flex-1">
                
                {/* ── LEFT/SIDE PANEL: DAFTAR SOAL (PERSIS SCREENSHOT UKOM) ── */}
                <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200/90 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">Daftar Soal</h4>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {Object.keys(studentAnswers).length} dari {activeExamModal.questions.length} terjawab
                    </span>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-[11px] text-slate-600 border-y border-slate-200/80 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span>Sudah Dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                      <span>Sedang Dikerjakan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                      <span>Belum Dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                      <span>Ragu-ragu (Ditandai)</span>
                    </div>
                  </div>

                  {/* Grid of Numbers */}
                  <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {activeExamModal.questions.map((q, idx) => {
                      const isCurrent = currentQIndex === idx;
                      const hasAnswer = studentAnswers[q.id] !== undefined;
                      const isFlagged = flaggedQuestions[q.id];

                      let btnBg = 'bg-white text-slate-700 border-slate-200';
                      if (isCurrent) {
                        btnBg = 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 border-blue-600';
                      } else if (isFlagged) {
                        btnBg = 'bg-amber-400 text-slate-900 font-bold border-amber-500';
                      } else if (hasAnswer) {
                        btnBg = 'bg-emerald-500 text-white font-bold border-emerald-600';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQIndex(idx)}
                          className={`h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition shadow-2xs cursor-pointer ${btnBg}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── RIGHT/MAIN PANEL: SOAL & PILIHAN GANDA (PERSIS SCREENSHOT UKOM) ── */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 flex flex-col justify-between">
                  {(() => {
                    const q = activeExamModal.questions[currentQIndex];
                    const chosen = studentAnswers[q.id];
                    const isFlagged = flaggedQuestions[q.id];

                    return (
                      <>
                        <div className="space-y-4">
                          {/* Question Header & Tandai Soal */}
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <span className="text-sm font-extrabold text-slate-900">
                              Soal {currentQIndex + 1} dari {activeExamModal.questions.length}
                            </span>
                            
                            <button
                              onClick={() => handleToggleFlag(q.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isFlagged
                                  ? 'bg-amber-400 text-slate-900 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-amber-100 text-slate-600'
                              }`}
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>{isFlagged ? 'Ditandai (Ragu)' : 'Tandai Soal'}</span>
                            </button>
                          </div>

                          {/* Passage / Listening Script / Situation Dialog */}
                          {q.passage && (
                            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>📄 Wacana / Percakapan Kerja:</span>
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                                    {q.category === 'Listening' ? '🎧 Audio Listening' : q.category === 'Reading' ? '📖 Teks Bacaan (Dokkai)' : '🤝 Konteks Situasi Kerja'}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => speakJapanese(q.passage)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Putar Suara Percakapan</span>
                                </button>
                              </div>
                              <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                                {q.passage}
                              </div>
                            </div>
                          )}

                          {/* Question Text in Japanese */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                                {q.question}
                              </h3>
                              <button
                                onClick={() => speakJapanese(q.wordJp || q.question)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg shrink-0 cursor-pointer"
                                title="Dengarkan Suara"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                            {q.translation && (
                              <p className="text-xs text-slate-500 font-medium">
                                {q.translation}
                              </p>
                            )}
                          </div>

                          {/* Options Grid (A, B, C, D) */}
                          <div className="space-y-2.5 pt-2">
                            {q.options.map((opt) => {
                              const isSelected = chosen === opt.key;

                              return (
                                <div
                                  key={opt.key}
                                  onClick={() => handleAnswerOption(q.id, opt.key)}
                                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                                    isSelected
                                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-2xs'
                                      : 'bg-white hover:bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {opt.key}
                                  </span>
                                  <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                    {opt.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                          <button
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            Sebelumnya
                          </button>

                          <div className="flex items-center gap-2">
                            {chosen && (
                              <button
                                onClick={() => {
                                  const nextAnswers = { ...studentAnswers };
                                  delete nextAnswers[q.id];
                                  setStudentAnswers(nextAnswers);
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 cursor-pointer"
                              >
                                Hapus Pilihan
                              </button>
                            )}

                            {currentQIndex < activeExamModal.questions.length - 1 ? (
                              <button
                                onClick={() => setCurrentQIndex(prev => prev + 1)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <span>Selanjutnya</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={handleFinishExam}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <Check className="w-4 h-4" />
                                <span>Selesai & Kumpulkan</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: SENSEI EVALUATION & CEK KESALAHAN SISWA                          */}
        {/* ========================================================================= */}
        {evaluatingItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col max-h-[92vh]">
              
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Evaluasi & Cek Lembar Jawaban Siswa
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">{evaluatingItem.title}</p>
                </div>
                <button
                  onClick={() => {
                    setEvaluatingItem(null);
                    setSelectedSubmission(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                
                {/* If no specific student is selected yet: Show Student Submissions Table */}
                {!selectedSubmission ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daftar Pengumpulan Siswa
                      </h4>
                      <span className="text-xs text-slate-500 font-semibold">
                        {(evaluatingItem.studentSubmissions || evaluatingItem.submissions || []).length} Siswa Terdaftar
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="p-3.5">Nama Siswa</th>
                            <th className="p-3.5">Waktu Kumpul</th>
                            <th className="p-3.5">Berkas Jawaban</th>
                            <th className="p-3.5">Nilai Skor</th>
                            <th className="p-3.5">Status Koreksi</th>
                            <th className="p-3.5 text-right">Aksi Sensei</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(evaluatingItem.studentSubmissions || evaluatingItem.submissions || []).map((sub, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition">
                              <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                                <img 
                                  src={sub.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'} 
                                  alt={sub.studentName} 
                                  className="w-8 h-8 rounded-full object-cover border"
                                />
                                <span>{sub.studentName}</span>
                              </td>
                              <td className="p-3.5 text-slate-500">{sub.submittedAt}</td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="truncate max-w-[140px]">{sub.fileName || 'Jawaban_Tugas.pdf'}</span>
                                </div>
                              </td>
                              <td className="p-3.5 font-extrabold text-blue-600 text-sm">
                                {sub.score !== null && sub.score !== undefined ? `${sub.score} / 100` : 'Belum Dinilai'}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  sub.status === 'Dinilai'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {sub.status || 'Terkumpul'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(sub);
                                    setSenseiScoreInput(sub.score || '');
                                    setSenseiFeedbackText(sub.senseiNotes || sub.feedback || '');
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition cursor-pointer"
                                >
                                  Periksa & Beri Nilai
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* ── DETAIL LEMBAR JAWABAN & CEK KESALAHAN SISWA TERPILIH ── */
                  <div className="space-y-5">
                    {/* Top Student Banner */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedSubmission.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'} 
                          alt={selectedSubmission.studentName} 
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{selectedSubmission.studentName}</div>
                          <div className="text-xs text-slate-400">Waktu Pengumpulan: {selectedSubmission.submittedAt}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
                          <span className="text-[10px] font-bold text-blue-600 uppercase">Nilai Saat Ini</span>
                          <div className="text-xl font-black text-blue-800">
                            {selectedSubmission.score !== null && selectedSubmission.score !== undefined ? `${selectedSubmission.score} / 100` : '— / 100'}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSubmission(null)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          Kembali ke Daftar
                        </button>
                      </div>
                    </div>

                    {/* Berkas Tugas Jawaban Siswa Box */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span>Berkas Jawaban yang Dikumpulkan Siswa:</span>
                      </h4>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 text-xs truncate">
                              {selectedSubmission.fileName || 'Jawaban_Tugas_Bab.pdf'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {selectedSubmission.fileSize || '1.5 MB'} • Dikumpulkan {selectedSubmission.submittedAt}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadMaterial(selectedSubmission.fileName || 'Jawaban_Tugas_Bab.pdf')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 font-bold text-xs shadow-2xs transition cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Lembar Siswa</span>
                        </button>
                      </div>

                      {selectedSubmission.notes && (
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                          <span className="font-bold text-blue-900">Catatan dari Siswa:</span>
                          <p className="text-slate-700 mt-1 italic leading-relaxed">"{selectedSubmission.notes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Question Breakdown with Red/Green Highlights (Cek Kesalahan jika ada soal ABCD) */}
                    {evaluatingItem.questions && evaluatingItem.questions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Pemeriksaan Lembar Jawaban & Cek Kesalahan:
                        </h4>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {evaluatingItem.questions.map((q, idx) => {
                            const studentKey = selectedSubmission.answers?.[q.id];
                            const isCorrect = studentKey === q.correctKey;

                            return (
                              <div
                                key={q.id}
                                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-50/50 border-emerald-200' 
                                    : 'bg-rose-50/60 border-rose-200'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-slate-900">Soal #{idx + 1}: {q.question}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isCorrect ? '✓ Benar' : '✗ Salah (Perlu Diperbaiki)'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-semibold">
                                  <div className={`p-2 rounded-xl border ${
                                    isCorrect ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-rose-200 text-rose-800'
                                  }`}>
                                    Jawaban Siswa: <b>{studentKey || 'Tidak Dijawab'}</b>
                                  </div>
                                  <div className="p-2 rounded-xl border bg-white border-slate-200 text-slate-700">
                                    Kunci Jawaban Benar: <b className="text-blue-600">{q.correctKey}</b> ({q.options.find(o => o.key === q.correctKey)?.text})
                                  </div>
                                </div>

                                <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                                  💡 <b>Penjelasan:</b> {q.explanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sensei Feedback & Score Adjustment Form */}
                    <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 text-xs">
                      <h4 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-blue-600" />
                        <span>Form Catatan & Penyesuaian Nilai oleh Sensei:</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Skor Akhir Siswa (0–100):</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={senseiScoreInput}
                            onChange={(e) => setSenseiScoreInput(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black text-blue-700 text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Catatan & Masukan Sensei untuk Siswa:</label>
                          <textarea 
                            rows={3}
                            value={senseiFeedbackText}
                            onChange={(e) => setSenseiFeedbackText(e.target.value)}
                            placeholder="Tuliskan catatan evaluasi dan saran perbaikan untuk siswa..."
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveSenseiFeedback}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Simpan & Kirim Evaluasi ke Siswa</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: PENGUMPULAN TUGAS SISWA                                          */}
        {/* ========================================================================= */}
        {activeTaskSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
              <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-200" />
                    <span>Kumpul Tugas Siswa</span>
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">{activeTaskSubmitModal.title}</p>
                </div>
                <button 
                  onClick={() => {
                    setActiveTaskSubmitModal(null);
                    setUploadedSubmissionFile(null);
                    setSubmissionNotes('');
                  }} 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Info banner */}
              <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 flex-wrap gap-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeTaskSubmitModal.bab}</span>
                </span>
                <span className="text-slate-500 font-medium">{activeTaskSubmitModal.deadlineText}</span>
              </div>

              <form onSubmit={handleStudentSubmitTask} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Unggah Berkas Lembar Jawaban (PDF, DOCX, JPG):
                  </label>
                  <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-4 text-center bg-blue-50/30 transition cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setUploadedSubmissionFile({
                            name: f.name,
                            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                          });
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      {uploadedSubmissionFile ? (
                        <div className="text-xs">
                          <p className="font-extrabold text-blue-700">{uploadedSubmissionFile.name}</p>
                          <p className="text-[11px] text-slate-400">Ukuran: {uploadedSubmissionFile.size}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          <p className="font-bold text-slate-700">Klik atau geser file jawaban ke sini</p>
                          <p className="text-[11px] text-slate-400">Mendukung format PDF, Word (DOCX), atau Gambar (Maks 25 MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan / Jawaban Tambahan untuk Sensei:
                  </label>
                  <textarea 
                    rows={3} 
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Contoh: Sensei, tugas bab ini sudah saya selesaikan sesuai berkas materi yang diunggah..." 
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 bg-white" 
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => {
                      setActiveTaskSubmitModal(null);
                      setUploadedSubmissionFile(null);
                      setSubmissionNotes('');
                    }} 
                    className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Tugas ke Sensei</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3B: SISWA / SENSEI LIHAT MATERI & SOAL TUGAS                        */}
        {/* ========================================================================= */}
        {activeViewMaterialModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col max-h-[92vh]">
              
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">Materi & Soal Tugas</h3>
                    <p className="text-xs text-blue-100 mt-0.5">{activeViewMaterialModal.title}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveViewMaterialModal(null)} 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Utility Badges Bar */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-2xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{activeViewMaterialModal.bab}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    JLPT {activeViewMaterialModal.level}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeViewMaterialModal.deadlineText}</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
                
                {/* 1. Berkas Materi Modul yang Diunggah Sensei */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-white border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Berkas Materi Modul dari Sensei:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Tersedia Diunduh
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {activeViewMaterialModal.materialFile?.name || `Modul_Materi_${activeViewMaterialModal.bab}.pdf`}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ukuran: {activeViewMaterialModal.materialFile?.size || '2.4 MB'} • Diunggah {activeViewMaterialModal.materialFile?.uploadedAt || 'oleh Sensei'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadMaterial(activeViewMaterialModal.materialFile?.name)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Modul Materi</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 Pelajari berkas modul di atas yang mencakup pembahasan <b>{activeViewMaterialModal.bab}</b> secara menyeluruh sebelum mengisi lembar pengerjaan tugas.
                  </p>
                </div>

                {/* 2. Petunjuk & Instruksi Tugas */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span>Instruksi & Tugas Pengerjaan dari Sensei:</span>
                  </h4>
                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    {activeViewMaterialModal.desc}
                  </p>
                </div>

                {/* 3. Kosakata Takoboto Acuan (Jika Ada) */}
                {activeViewMaterialModal.takobotoWords && activeViewMaterialModal.takobotoWords.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Kamus Kosakata Takoboto.jp Terkait:</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">Klik audio untuk pelafalan</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeViewMaterialModal.takobotoWords.map((word, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{word.kanji}</span>
                            <span className="text-[11px] text-slate-400">({word.kana})</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-700 font-medium text-[11px]">{word.meaning}</span>
                          </div>
                          <button 
                            onClick={() => speakJapanese(word.kanji)} 
                            className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                            title="Dengarkan Audio"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveViewMaterialModal(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer text-xs"
                >
                  Tutup
                </button>

                {!isSensei && activeViewMaterialModal.statusCode !== 'submitted' && activeViewMaterialModal.isOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      const taskToSubmit = activeViewMaterialModal;
                      setActiveViewMaterialModal(null);
                      setActiveTaskSubmitModal(taskToSubmit);
                    }}
                    className="px-5 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Lanjut Kerjakan / Kumpul Tugas</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3C: SISWA LIHAT PENGUMPULAN SAYA                                     */}
        {/* ========================================================================= */}
        {activeSubmissionDetailModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col">
              
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">Pengumpulan Tugas Saya</h3>
                    <p className="text-xs text-emerald-100 mt-0.5">{activeSubmissionDetailModal.title}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveSubmissionDetailModal(null)} 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {/* Nilai Status Banner */}
                {activeSubmissionDetailModal.score !== undefined && activeSubmissionDetailModal.score !== null ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Status Evaluasi Sensei:</span>
                      <div className="text-sm font-extrabold text-emerald-900 mt-0.5">Sudah Dinilai</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Nilai Skor:</span>
                      <div className="text-2xl font-black text-emerald-800">{activeSubmissionDetailModal.score} / 100</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Status Evaluasi:</span>
                      <div className="text-sm font-extrabold text-amber-900 mt-0.5">Menunggu Pemeriksaan Sensei</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                      Terkirim
                    </span>
                  </div>
                )}

                {/* Catatan Feedback Sensei (Jika ada) */}
                {(activeSubmissionDetailModal.feedback || activeSubmissionDetailModal.studentSubmission?.feedback) && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Catatan & Evaluasi dari Sensei Ayu:</span>
                    </span>
                    <p className="text-slate-700 text-xs italic bg-white p-3 rounded-xl border border-blue-100">
                      "{activeSubmissionDetailModal.feedback || activeSubmissionDetailModal.studentSubmission?.feedback}"
                    </p>
                  </div>
                )}

                {/* Berkas yang dikirim */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>Berkas Jawaban yang Dikumpulkan:</span>
                  </h4>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {activeSubmissionDetailModal.studentSubmission?.fileName || 'Jawaban_Tugas_Siswa.pdf'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {activeSubmissionDetailModal.studentSubmission?.fileSize || '1.5 MB'} • {activeSubmissionDetailModal.submittedDate || 'Baru saja'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadMaterial(activeSubmissionDetailModal.studentSubmission?.fileName || 'Jawaban_Tugas_Siswa.pdf')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh</span>
                    </button>
                  </div>

                  {activeSubmissionDetailModal.studentSubmission?.notes && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      <span className="font-bold text-slate-700">Catatan Pengiriman Anda:</span>
                      <p className="italic text-slate-500 mt-0.5">"{activeSubmissionDetailModal.studentSubmission.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const taskToSubmit = activeSubmissionDetailModal;
                      setActiveSubmissionDetailModal(null);
                      setActiveTaskSubmitModal(taskToSubmit);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Ulang / Revisi Tugas</span>
                  </button>

                  <button
                    onClick={() => setActiveSubmissionDetailModal(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: PILIH METODE BUAT QUIZ (MANUAL / AI GENERATE / BANK SOAL)         */}
        {/* ========================================================================= */}
        {isQuizMethodModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-4 p-6 sm:p-7 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-3xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    + Buat Quiz Baru
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1.5 tracking-tight">
                    Pilih Metode Pembuatan Quiz
                  </h3>
                </div>
                <button
                  onClick={() => setIsQuizMethodModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3 Options */}
              <div className="space-y-3">
                {/* A. Buat Manual */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuizMethodModalOpen(false);
                    handleOpenCreateModal('quiz');
                  }}
                  className="w-full p-4 rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/40 transition-all text-left flex items-start gap-4 group cursor-pointer"
                >
                  <div className="p-3 rounded-2xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 transition shrink-0">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                      A. Buat Manual
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Susun butir soal pilihan ganda secara mandiri, tentukan kunci jawaban, serta durasi pengerjaan.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0 mt-2" />
                </button>

                {/* B. Generate dari Materi Sensei (Pilih Bab / Pertemuan) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuizMethodModalOpen(false);
                    navigate('/lms/quiz/generate?mode=range_bab&start=1&end=5&class=N5%20Pagi&questions=10');
                  }}
                  className="w-full p-4.5 rounded-2xl border-2 border-blue-600 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 hover:from-blue-100 hover:to-indigo-100 transition-all text-left flex items-start gap-4 group cursor-pointer relative shadow-sm"
                >
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-blue-950">
                        B. Generate dari Materi Sensei (Bab & Pertemuan)
                      </h4>
                      <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-3xs font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                        FITUR UTAMA • 5 PILAR
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Pilih modul materi dari <b>Bab berapa sampai bab berapa</b> atau rentang <b>pertemuan</b>. Sistem mengekstrak Kotoba, Bunpou, Kanji, dan Dokkai menjadi paket kuis tervalidasi tanpa input manual.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-600 transition shrink-0 mt-3 group-hover:translate-x-1" />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuizMethodModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: SENSEI TAKOBOTO QUESTION BUILDER & EDITOR                        */}
        {/* ========================================================================= */}
        {editorModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    {editingTargetType === 'tugas' ? <FileText className="w-5 h-5 text-amber-300" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">
                      {editingTargetType === 'tugas' 
                        ? (editingItem ? 'Edit Tugas & Modul Materi Siswa' : 'Tambah Tugas Siswa Baru')
                        : (editingItem ? 'Edit Quiz & Soal Takoboto.jp' : 'Pilih & Buat Soal Quiz Takoboto.jp')}
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {editingTargetType === 'tugas'
                        ? 'Tentukan judul tugas, rentang bab materi, jadwal tanggal upload & batas tenggat waktu, dan unggah berkas tugas.'
                        : 'Pilih butir soal dari bank kamus Takoboto, tentukan sendiri jumlah butir soal, dan atur durasi pengerjaan.'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setEditorModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                
                {/* Header Mode Banner */}
                {editingTargetType === 'tugas' ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/90 text-blue-900 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-blue-950">Formulir Tugas Siswa (Rentang Bab, Jadwal & Modul Materi)</div>
                        <div className="text-[11px] text-blue-700/80">Lengkapi judul, rentang bab, jadwal upload & tenggat waktu, dan unggah berkas modul untuk siswa.</div>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-[11px] font-bold px-3 py-1 rounded-full bg-white text-blue-700 border border-blue-200 shadow-2xs">
                      Mode Sensei
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50/60 border border-indigo-200/90 text-indigo-900 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-indigo-950">Formulir Quiz Interaktif (Bank Soal Takoboto.jp)</div>
                        <div className="text-[11px] text-indigo-700/80">Pilih butir soal pilihan ganda ABCD dan atur durasi pengerjaan.</div>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-[11px] font-bold px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                      Mode Sensei
                    </span>
                  </div>
                )}

                {/* 2. Pengaturan Dasar Soal / Tugas */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                  <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                    <Sliders className="w-4 h-4" />
                    <span>1. Detail Informasi Tugas Siswa</span>
                  </div>

                  {editingTargetType === 'tugas' ? (
                    <>
                      {/* FIELD 1: Judul Tugas & Tingkat JLPT */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3">
                          <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Judul Tugas <span className="text-rose-500">*</span>:</span>
                          </label>
                          <input
                            type="text"
                            value={builderForm.title}
                            onChange={(e) => setBuilderForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Contoh: Tugas N5 – Latihan Pola Kalimat & Tata Bahasa Bab 1 s/d Bab 3"
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 text-xs mb-1.5">Tingkat JLPT:</label>
                          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 h-[37px] shadow-2xs">
                            {['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  setBuilderForm(prev => ({ ...prev, level: lvl }));
                                  setBankLevelFilter(lvl);
                                }}
                                className={`flex-1 h-full rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                                  builderForm.level === lvl ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* FIELD 2: BAB berapa sampai bab berapa */}
                      <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/90 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-blue-900 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>Rentang Bab Materi (BAB Mulai s/d BAB Akhir) <span className="text-rose-500">*</span>:</span>
                          </label>
                          <span className="text-xs font-extrabold px-3 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                            Bab {builderForm.startBab || 1} sampai Bab {builderForm.endBab || 3}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                              Dari BAB :
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={builderForm.startBab || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setBuilderForm(prev => ({
                                  ...prev,
                                  startBab: val,
                                  bab: `Bab ${val} s/d Bab ${prev.endBab || val}`
                                }));
                              }}
                              className="w-full pl-24 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-right shadow-2xs"
                            />
                          </div>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                              Sampai BAB :
                            </span>
                            <input
                              type="number"
                              min={builderForm.startBab || 1}
                              max="100"
                              value={builderForm.endBab || 3}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setBuilderForm(prev => ({
                                  ...prev,
                                  endBab: val,
                                  bab: `Bab ${prev.startBab || 1} s/d Bab ${val}`
                                }));
                              }}
                              className="w-full pl-28 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-right shadow-2xs"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-blue-700/80 leading-relaxed">
                          💡 Siswa akan mempelajari modul tugas yang mencakup materi dari <b>Bab {builderForm.startBab || 1}</b> hingga <b>Bab {builderForm.endBab || 3}</b>.
                        </p>
                      </div>

                      {/* FIELD 3: Tanggal Upload dan Tenggat Waktu Tugas (Side-by-side) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        
                        {/* Tanggal Upload */}
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                              <span>Tanggal & Jam Upload <span className="text-rose-500">*</span>:</span>
                            </label>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Mulai Dibuka
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">Tanggal Upload:</span>
                              <input
                                type="date"
                                value={builderForm.uploadDate || '2026-10-22'}
                                onChange={(e) => setBuilderForm(prev => ({ ...prev, uploadDate: e.target.value }))}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500"
                                title="Tanggal Upload Tugas"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">Jam Upload:</span>
                              <input
                                type="time"
                                value={builderForm.uploadTime || '08:00'}
                                onChange={(e) => setBuilderForm(prev => ({ ...prev, uploadTime: e.target.value }))}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500"
                                title="Jam Tugas Dirilis / Dibuka"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Tugas dan berkas modul materi mulai dapat diakses siswa pada jadwal ini.
                          </p>
                        </div>

                        {/* Tenggat Waktu Tugas */}
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Tenggat Waktu Tugas (Deadline) <span className="text-rose-500">*</span>:</span>
                            </label>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Durasi: {builderForm.deadlineDuration || '3 Hari'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">Batas Tanggal:</span>
                              <input
                                type="date"
                                value={builderForm.deadlineDate || '2026-10-30'}
                                onChange={(e) => setBuilderForm(prev => ({ ...prev, deadlineDate: e.target.value }))}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500"
                                title="Batas Tanggal Pengumpulan"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">Batas Jam:</span>
                              <input
                                type="time"
                                value={builderForm.deadlineTime || '23:59'}
                                onChange={(e) => setBuilderForm(prev => ({ ...prev, deadlineTime: e.target.value }))}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500"
                                title="Batas Jam Pengumpulan"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">Pilihan Cepat:</span>
                              <select
                                value={builderForm.deadlineDuration || '3 Hari'}
                                onChange={(e) => {
                                  const dur = e.target.value;
                                  let daysToAdd = 3;
                                  if (dur.includes('1 Hari')) daysToAdd = 1;
                                  else if (dur.includes('2 Hari')) daysToAdd = 2;
                                  else if (dur.includes('3 Hari')) daysToAdd = 3;
                                  else if (dur.includes('5 Hari')) daysToAdd = 5;
                                  else if (dur.includes('7 Hari')) daysToAdd = 7;
                                  else if (dur.includes('14 Hari')) daysToAdd = 14;

                                  try {
                                    const base = new Date(builderForm.uploadDate || '2026-10-22');
                                    base.setDate(base.getDate() + daysToAdd);
                                    const nextDateStr = base.toISOString().split('T')[0];
                                    setBuilderForm(prev => ({ 
                                      ...prev, 
                                      deadlineDuration: dur,
                                      deadlineDate: nextDateStr
                                    }));
                                  } catch (err) {
                                    void err;
                                    setBuilderForm(prev => ({ ...prev, deadlineDuration: dur }));
                                  }
                                }}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:bg-white focus:border-blue-500 cursor-pointer"
                                title="Preset Durasi Pengerjaan"
                              >
                                <option value="1 Hari">1 Hari</option>
                                <option value="2 Hari">2 Hari</option>
                                <option value="3 Hari">3 Hari (Rekomendasi)</option>
                                <option value="5 Hari">5 Hari</option>
                                <option value="7 Hari">7 Hari (1 Mgg)</option>
                                <option value="14 Hari">14 Hari (2 Mgg)</option>
                              </select>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Batas akhir pengumpulan lembar jawaban tugas oleh siswa.
                          </p>
                        </div>

                      </div>

                      {/* FIELD 4: Upload File Berkas Modul / Soal Tugas */}
                      <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-blue-600" />
                            <span>Upload File Berkas Modul / Soal Tugas <span className="text-rose-500">*</span>:</span>
                          </label>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Format: PDF, Word (.docx), PPT, Excel, Gambar, ZIP (Maks 25 MB)
                          </span>
                        </div>

                        {builderForm.materialFile ? (
                          <div className="p-3.5 bg-white rounded-xl border border-blue-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 text-xs truncate">
                                  {builderForm.materialFile.name}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                                    {builderForm.materialFile.type || 'PDF'}
                                  </span>
                                  <span>{builderForm.materialFile.size || '2.5 MB'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Berkas Siap Diunduh Siswa
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDownloadMaterial(builderForm.materialFile.name)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Cek File</span>
                              </button>
                              <label className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Ganti File</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                                      setBuilderForm(prev => ({
                                        ...prev,
                                        materialFile: {
                                          name: file.name,
                                          size: `${sizeMb > 0 ? sizeMb : 0.5} MB`,
                                          type: file.name.split('.').pop().toUpperCase(),
                                          pages: 12,
                                          uploadedAt: 'Hari ini'
                                        }
                                      }));
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setBuilderForm(prev => ({ ...prev, materialFile: null }))}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="p-6 bg-white hover:bg-blue-50/40 rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition text-center group shadow-2xs">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs">
                                Klik untuk Unggah Berkas Modul / Lembar Soal Tugas
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Mendukung format PDF, Word (.docx), PowerPoint, Excel, Gambar, atau ZIP (Maksimal 25 MB)
                              </p>
                            </div>
                            <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs group-hover:bg-blue-700 transition">
                              Pilih Berkas Tugas
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                                  setBuilderForm(prev => ({
                                    ...prev,
                                    materialFile: {
                                      name: file.name,
                                      size: `${sizeMb > 0 ? sizeMb : 0.5} MB`,
                                      type: file.name.split('.').pop().toUpperCase(),
                                      pages: 12,
                                      uploadedAt: 'Hari ini'
                                    }
                                  }));
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* FIELD 5: Petunjuk Pengerjaan & Akses Siswa */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3">
                          <label className="block font-bold text-slate-800 text-xs mb-1">
                            Petunjuk / Instruksi Pengerjaan Tugas:
                          </label>
                          <textarea
                            rows={2}
                            value={builderForm.desc}
                            onChange={(e) => setBuilderForm(prev => ({ ...prev, desc: e.target.value }))}
                            placeholder="Contoh: Pelajari modul materi Bab 1 s/d Bab 3, lalu kerjakan lembar latihan pada berkas modul dan kumpulkan dalam format PDF sebelum batas tenggat waktu."
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 text-xs mb-1">Status Akses Siswa:</label>
                          <button
                            type="button"
                            onClick={() => setBuilderForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                            className={`w-full p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border h-[37px] ${
                              builderForm.isOpen
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {builderForm.isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{builderForm.isOpen ? 'Akses Buka' : 'Terkunci'}</span>
                          </button>
                          <span className="text-[10px] text-slate-400 block mt-1 text-center">
                            {builderForm.isOpen ? 'Siswa dapat melihat materi' : 'Terkunci sementara'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Judul Quiz:</label>
                          <input
                            type="text"
                            value={builderForm.title}
                            onChange={(e) => setBuilderForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Contoh: Quiz N5 – Kosakata Dasar Takoboto"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Bab / Topik Materi:</label>
                          <input
                            type="text"
                            value={builderForm.bab}
                            onChange={(e) => setBuilderForm(prev => ({ ...prev, bab: e.target.value }))}
                            placeholder="Contoh: Bab 1 – Kata Kerja Dasar"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tingkat JLPT:</label>
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 h-[37px]">
                            {['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  setBuilderForm(prev => ({ ...prev, level: lvl }));
                                  setBankLevelFilter(lvl);
                                }}
                                className={`flex-1 h-full rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                                  builderForm.level === lvl ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Durasi Pengerjaan (Menit):</label>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            value={builderForm.durationMinutes}
                            onChange={(e) => setBuilderForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs h-[37px]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Akses Pengerjaan Siswa:</label>
                          <button
                            type="button"
                            onClick={() => setBuilderForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                            className={`w-full p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs border h-[37px] ${
                              builderForm.isOpen
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {builderForm.isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{builderForm.isOpen ? 'Akses Dibuka' : 'Akses Ditutup'}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 3. Pemilih Butir Soal Takoboto.jp (Tentukan Sendiri Jumlah Soal & Kategori) */}
                <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
                  {editingTargetType === 'tugas' ? (
                    <button
                      type="button"
                      onClick={() => setShowTakobotoAttach(prev => !prev)}
                      className="w-full p-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>2. Lampiran Referensi Soal & Kosakata Takoboto.jp</span>
                            <span className="px-2 py-0.2 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-bold">
                              Opsional
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {builderForm.selectedQuestionIds.length > 0
                              ? `${builderForm.selectedQuestionIds.length} butir soal ABCD terpilih (${builderForm.selectedWordIds.length} kosakata)`
                              : 'Klik untuk melampirkan butir soal latihan acuan atau daftar kosakata jika diperlukan'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 shrink-0">
                        <span>{showTakobotoAttach ? 'Tutup Pilihan' : 'Pilih Soal'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTakobotoAttach ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span>2. Bank Soal Takoboto.jp (Pilihan Ganda ABCD)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Pilih soal dari 48 butir soal terkurasi Takoboto.jp: 🎧 聴解 Chokai, 📖 読解 Dokkai, 💬 会話 Kaiwa, ✏️ 文法 Bunpou, dan 🔤 文字・語彙.
                        </p>
                      </div>

                      {/* Mode Tabs (Soal ABCD vs Kosakata) */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setBuilderTab('questions')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            builderTab === 'questions' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Soal ABCD ({builderForm.selectedQuestionIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuilderTab('vocab')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            builderTab === 'vocab' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Kamus Kosakata ({builderForm.selectedWordIds.length})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {(editingTargetType === 'quiz' || showTakobotoAttach) && (
                    <div className="p-4 space-y-4">
                      {/* If Tugas and expanded, show Mode Switcher */}
                      {editingTargetType === 'tugas' && (
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 flex-wrap">
                          <span className="text-xs font-bold text-slate-600">Pilih Tipe Lampiran Takoboto:</span>
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setBuilderTab('questions')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                builderTab === 'questions' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Soal ABCD ({builderForm.selectedQuestionIds.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBuilderTab('vocab')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                builderTab === 'vocab' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Kamus Kosakata ({builderForm.selectedWordIds.length})</span>
                            </button>
                          </div>
                        </div>
                      )}

                  {/* Kategori Soal Tabs (Hanya jika di tab Soal ABCD) */}
                  {builderTab === 'questions' && (
                    <div className="flex items-center gap-1.5 flex-wrap pb-1">
                      {[
                        { key: 'ALL', label: 'Semua Kategori (48)', icon: '🌟' },
                        { key: 'Choukai', label: '🎧 聴解 Chokai (9)', icon: '🎧' },
                        { key: 'Dokkai', label: '📖 読解 Dokkai (9)', icon: '📖' },
                        { key: 'Kaiwa', label: '💬 会話 Kaiwa (9)', icon: '💬' },
                        { key: 'Bunpou', label: '✏️ 文法 Bunpou (11)', icon: '✏️' },
                        { key: 'Moji/Goi', label: '🔤 文字・語彙 (10)', icon: '🔤' }
                      ].map(cat => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setBankCategoryFilter(cat.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                            bankCategoryFilter === cat.key
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Preset Quick Selectors & Filter Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">Pilih Otomatis:</span>
                      {builderTab === 'questions' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickSelectQuestions(5)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition cursor-pointer"
                          >
                            + 5 Soal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSelectQuestions(10)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition cursor-pointer"
                          >
                            + 10 Soal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSelectQuestions(20)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition cursor-pointer"
                          >
                            + 20 Soal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSelectQuestions(40)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                          >
                            + 40 Soal (Lengkap)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = filteredBankQuestions.map(q => q.id);
                              setBuilderForm(prev => ({ ...prev, selectedQuestionIds: allIds }));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
                          >
                            Pilih Semua ({filteredBankQuestions.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderForm(prev => ({ ...prev, selectedQuestionIds: [] }))}
                            className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickSelectWords(5)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition cursor-pointer"
                          >
                            + 5 Kata
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSelectWords(10)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition cursor-pointer"
                          >
                            + 10 Kata
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const allWords = filteredBankVocab.map(w => w.kanji);
                              setBuilderForm(prev => ({ ...prev, selectedWordIds: allWords }));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
                          >
                            Pilih Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderForm(prev => ({ ...prev, selectedWordIds: [] }))}
                            className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </>
                      )}
                    </div>

                    {/* Filter Level & Live Search */}
                    <div className="flex items-center gap-2">
                      <select
                        value={bankLevelFilter}
                        onChange={(e) => setBankLevelFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="ALL">Semua Level</option>
                        <option value="N5">Level N5</option>
                        <option value="N4">Level N4</option>
                        <option value="N3">Level N3</option>
                        <option value="N2">Level N2</option>
                        <option value="N1">Level N1</option>
                      </select>

                      <div className="relative w-44 sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari kanji / pola / arti..."
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Realtime Selection Breakdown Banner */}
                  {builderTab === 'questions' && (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs font-bold text-blue-900 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        <span>Total <b>{builderForm.selectedQuestionIds.length}</b> Soal ABCD Terpilih</span>
                      </div>
                      <div className="text-[11px] text-blue-800 font-semibold flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                          🎧 {TAKOBOTO_QUESTION_BANK.filter(q => q.category === 'Choukai' && builderForm.selectedQuestionIds.includes(q.id)).length} Chokai
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          📖 {TAKOBOTO_QUESTION_BANK.filter(q => q.category === 'Dokkai' && builderForm.selectedQuestionIds.includes(q.id)).length} Dokkai
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          💬 {TAKOBOTO_QUESTION_BANK.filter(q => q.category === 'Kaiwa' && builderForm.selectedQuestionIds.includes(q.id)).length} Kaiwa
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          ✏️ {TAKOBOTO_QUESTION_BANK.filter(q => q.category === 'Bunpou' && builderForm.selectedQuestionIds.includes(q.id)).length} Bunpou
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          🔤 {TAKOBOTO_QUESTION_BANK.filter(q => q.category === 'Moji/Goi' && builderForm.selectedQuestionIds.includes(q.id)).length} Moji/Goi
                        </span>
                      </div>
                    </div>
                  )}

                  {/* List Butir Soal Takoboto (Untuk Quiz & Tugas Soal ABCD) */}
                  {builderTab === 'questions' && (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {filteredBankQuestions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                          Tidak ada soal yang cocok dengan filter kategori ({bankCategoryFilter}) atau level ({bankLevelFilter}).
                        </div>
                      ) : (
                        filteredBankQuestions.map((q, idx) => {
                          const isSelected = builderForm.selectedQuestionIds.includes(q.id);

                          // Category Badge Styling
                          let catBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                          if (q.category === 'Choukai') catBadgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                          if (q.category === 'Dokkai') catBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                          if (q.category === 'Kaiwa') catBadgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          if (q.category === 'Bunpou') catBadgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                          if (q.category === 'Moji/Goi') catBadgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';

                          return (
                            <div
                              key={q.id}
                              onClick={() => handleToggleQuestionSelection(q.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                                isSelected
                                  ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 shadow-2xs'
                                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                              }`}
                            >
                              <div className="pt-0.5 shrink-0">
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Badges & Header */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px] flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {q.level}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadgeStyle}`}>
                                    {q.categoryLabel || q.category}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-900">
                                    {q.wordJp} {q.furigana && <span className="text-slate-400 font-normal">({q.furigana})</span>}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speakJapanese(q.passage || q.wordJp || q.question);
                                    }}
                                    className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
                                    title="Dengar Audio Pelafalan Bahasa Jepang (Web Speech API)"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">Audio</span>
                                  </button>
                                </div>

                                {/* Passage Display (Dokkai / Choukai / Kaiwa) */}
                                {q.passage && (
                                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-japanese whitespace-pre-line">
                                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                      {q.category === 'Dokkai' && <span>📖 Wacana Bacaan:</span>}
                                      {q.category === 'Choukai' && <span>🎧 Naskah Percakapan Audio (Dengarkan):</span>}
                                      {q.category === 'Kaiwa' && <span>💬 Situasi Percakapan:</span>}
                                    </div>
                                    <p className="font-medium text-slate-800">{q.passage}</p>
                                  </div>
                                )}

                                {/* Question Statement */}
                                <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                                  {q.question}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {q.translation}
                                </p>

                                {/* Options Preview A, B, C, D */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5 text-xs">
                                  {q.options.map(opt => (
                                    <div
                                      key={opt.key}
                                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                                        opt.key === q.correctKey
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                          : 'bg-slate-50 border-slate-200 text-slate-600'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                                        opt.key === q.correctKey
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : 'bg-white text-slate-700 border-slate-300'
                                      }`}>
                                        {opt.key}
                                      </span>
                                      <span className="truncate">{opt.text}</span>
                                      {opt.key === q.correctKey && (
                                        <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">Kunci</span>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Takoboto Explanation */}
                                {q.explanation && (
                                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                                    <span className="font-bold text-slate-700">💡 Penjelasan Takoboto.jp:</span> {q.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* List Kosakata Takoboto (Jika di tab Kamus Kosakata) */}
                  {builderTab === 'vocab' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {filteredBankVocab.map((w) => {
                        const isSelected = builderForm.selectedWordIds.includes(w.kanji);

                        return (
                          <div
                            key={w.kanji}
                            onClick={() => handleToggleWordSelection(w.kanji)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-xs">{w.kanji}</span>
                                <span className="text-[10px] text-slate-400">({w.kana})</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">{w.level}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 truncate">{w.meaning}</div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakJapanese(w.kanji);
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1 shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-600 font-medium">
                  {editingTargetType === 'tugas' ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Bab {builderForm.startBab || 1} s/d Bab {builderForm.endBab || 3}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-semibold">
                        📅 Upload: {builderForm.uploadDate || '2026-10-22'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-semibold">
                        ⏰ Tenggat: {builderForm.deadlineDate} ({builderForm.deadlineDuration || '3 Hari'})
                      </span>
                      {builderForm.materialFile && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 truncate max-w-[200px]" title={builderForm.materialFile.name}>
                            📎 {builderForm.materialFile.name}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span>
                      Total <b>{builderForm.selectedQuestionIds.length}</b> butir soal ABCD terpilih ({builderForm.selectedWordIds.length} kosakata).
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-600 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBuilder}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {editingItem 
                        ? 'Simpan Perubahan' 
                        : (editingTargetType === 'tugas' ? 'Terbitkan Tugas Siswa' : 'Publikasikan Quiz')}
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
