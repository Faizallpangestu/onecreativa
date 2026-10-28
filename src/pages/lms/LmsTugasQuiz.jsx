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
  FileCheck
} from 'lucide-react';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlImg from '../../assets/anime_girl.jpg';
import quizChecklistImg from '../../assets/quiz_exam_checklist.jpg';
import toriiGateImg from '../../assets/torii_gate_sunset.jpg';
import kyotoStreetImg from '../../assets/kyoto_street.jpg';
import examAppleImg from '../../assets/exam_apple.jpg';
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
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_QUIZZES = [
  // ── QUIZ 1: N5 KOSAKATA & KANJI ──
  {
    id: 1,
    title: 'Quiz N5 – Kata Kerja & Kosakata Dasar (Takoboto)',
    bab: 'Bab 1 – Dasar N5',
    level: 'N5',
    isOpen: true, // Akses dibuka oleh Sensei
    status: 'Sedang Aktif',
    statusCode: 'running',
    timeRemaining: '20:00',
    durationMinutes: 20,
    questionType: 'Pilihan Ganda',
    thumbnailType: 'quiz_sheet',
    badgeColor: 'bg-blue-50 text-blue-600',
    submissionsCount: 18,
    totalStudents: 24,
    questions: [
      {
        id: 1,
        question: '「あさ」の かんじは どれですか。',
        translation: 'Manakah kanji yang tepat untuk kosakata "asa" (pagi)?',
        wordJp: '朝',
        furigana: 'あさ',
        options: [
          { key: 'A', text: '朝 (Asa - Pagi)' },
          { key: 'B', text: '昼 (Hiru - Siang)' },
          { key: 'C', text: '夜 (Yoru - Malam)' },
          { key: 'D', text: '夕 (Yuu - Sore)' }
        ],
        correctKey: 'A',
        explanation: 'Kanji 「朝」 dibaca 「あさ」(asa) yang berarti pagi hari.'
      },
      {
        id: 2,
        question: 'わたし（　）がくせいです。',
        translation: 'Pilihlah partikel yang tepat untuk melengkapi kalimat subjek.',
        wordJp: '学生',
        furigana: 'がくせい',
        options: [
          { key: 'A', text: 'を (wo)' },
          { key: 'B', text: 'は (wa)' },
          { key: 'C', text: 'に (ni)' },
          { key: 'D', text: 'で (de)' }
        ],
        correctKey: 'B',
        explanation: 'Partikel 「は」(wa) berfungsi sebagai penanda topik utama kalimat.'
      },
      {
        id: 3,
        question: 'Apakah arti dari kata kerja 「食べる」(たべる)?',
        translation: 'Pilihlah arti yang tepat dari kamus Takoboto.',
        wordJp: '食べる',
        furigana: 'たべる',
        options: [
          { key: 'A', text: 'Minum (Nomu)' },
          { key: 'B', text: 'Makan (To eat)' },
          { key: 'C', text: 'Tidur (Neru)' },
          { key: 'D', text: 'Membaca (Yomu)' }
        ],
        correctKey: 'B',
        explanation: 'Menurut Takoboto.jp, 「食べる」(taberu) adalah kata kerja makan.'
      },
      {
        id: 4,
        question: 'きょうは なんようび（　）ですか。',
        translation: 'Hari ini hari apa? (Pilih partikel yang tepat)',
        wordJp: '何曜日',
        furigana: 'なんようび',
        options: [
          { key: 'A', text: 'Tanpa partikel (langsung ですか)' },
          { key: 'B', text: 'は (wa)' },
          { key: 'C', text: 'の (no)' },
          { key: 'D', text: 'に (ni)' }
        ],
        correctKey: 'A',
        explanation: 'Pertanyaan nama hari langsung diikuti predikat 「ですか」 tanpa partikel.'
      },
      {
        id: 5,
        question: 'Lawan kata dari 「大きい」(ookii / besar) adalah:',
        translation: 'Pilihlah pasangan lawan kata sifat N5 yang tepat.',
        wordJp: '大きい',
        furigana: 'おおきい',
        options: [
          { key: 'A', text: '新しい (Atarashii)' },
          { key: 'B', text: '小さい (Chiisai - Kecil)' },
          { key: 'C', text: '高い (Takai)' },
          { key: 'D', text: '長い (Nagai)' }
        ],
        correctKey: 'B',
        explanation: 'Lawan kata dari 「大きい」(ookii, besar) adalah 「小さい」(chiisai, kecil).'
      },
      {
        id: 6,
        question: 'いま なんじ（　）ですか。',
        translation: 'Sekarang jam berapa?',
        wordJp: '何時',
        furigana: 'なんじ',
        options: [
          { key: 'A', text: 'でした' },
          { key: 'B', text: 'ます' },
          { key: 'C', text: 'です' },
          { key: 'D', text: 'ません' }
        ],
        correctKey: 'C',
        explanation: 'Kalimat tanya nominal waktu menggunakan kopula 「です」+「か」.'
      },
      {
        id: 7,
        question: '「ほん」の いみは どれですか。',
        translation: 'Apakah arti dari kosakata "hon"?',
        wordJp: '本',
        furigana: 'ほん',
        options: [
          { key: 'A', text: 'Pensil' },
          { key: 'B', text: 'Tas' },
          { key: 'C', text: 'Buku (Hon)' },
          { key: 'D', text: 'Kamus' }
        ],
        correctKey: 'C',
        explanation: 'Kanji 「本」(hon) berarti buku.'
      },
      {
        id: 8,
        question: 'きのう えいが（　）みました。',
        translation: 'Kemarin saya menonton film.',
        wordJp: '映画',
        furigana: 'えいが',
        options: [
          { key: 'A', text: 'を (wo)' },
          { key: 'B', text: 'に (ni)' },
          { key: 'C', text: 'で (de)' },
          { key: 'D', text: 'は (wa)' }
        ],
        correctKey: 'A',
        explanation: 'Partikel 「を」(wo) menandai objek langsung dari kata kerja transitif (melihat film).'
      },
      {
        id: 9,
        question: 'にほんご（　）べんきょうします。',
        translation: 'Belajar bahasa Jepang.',
        wordJp: '日本語',
        furigana: 'にほんご',
        options: [
          { key: 'A', text: 'を (wo)' },
          { key: 'B', text: 'が (ga)' },
          { key: 'C', text: 'に (ni)' },
          { key: 'D', text: 'と (to)' }
        ],
        correctKey: 'A',
        explanation: 'Objek yang dipelajari ditandai partikel 「を」.'
      },
      {
        id: 10,
        question: 'あした ともだち（　）あいます。',
        translation: 'Besok bertemu dengan teman.',
        wordJp: '友達',
        furigana: 'ともだち',
        options: [
          { key: 'A', text: 'を (wo)' },
          { key: 'B', text: 'に (ni)' },
          { key: 'C', text: 'で (de)' },
          { key: 'D', text: 'へ (e)' }
        ],
        correctKey: 'B',
        explanation: 'Bertemu seseorang menggunakan pola: [Orang] + に + 会います.'
      }
    ],
    studentSubmissions: [
      {
        studentId: 1,
        studentName: 'Rina Aulia',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        score: 90,
        totalWrong: 1,
        submittedAt: '20 Okt 2026, 14:32',
        answers: { 1: 'A', 2: 'B', 3: 'B', 4: 'A', 5: 'B', 6: 'C', 7: 'C', 8: 'A', 9: 'A', 10: 'A' }, // Salah no 10 (pilih A harusnya B)
        senseiNotes: 'Sangat bagus Rina! Ingat kembali pola kata kerja bertemu orang selalu menggunakan partikel ni (友達に会います), bukan wo.'
      },
      {
        studentId: 2,
        studentName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        score: 70,
        totalWrong: 3,
        submittedAt: '20 Okt 2026, 15:10',
        answers: { 1: 'A', 2: 'A', 3: 'B', 4: 'B', 5: 'B', 6: 'C', 7: 'C', 8: 'B', 9: 'A', 10: 'B' }, // Salah 2, 4, 8
        senseiNotes: 'Perlu diperhatikan penggunaan partikel wa dan wo ya Budi. Pelajari kembali materi Bab 2.'
      },
      {
        studentId: 3,
        studentName: 'Kenji Pratama',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        score: 100,
        totalWrong: 0,
        submittedAt: '20 Okt 2026, 16:05',
        answers: { 1: 'A', 2: 'B', 3: 'B', 4: 'A', 5: 'B', 6: 'C', 7: 'C', 8: 'A', 9: 'A', 10: 'B' },
        senseiNotes: 'Sempurna! Semua pemahaman partikel dan kanji N5 sudah sangat kuat.'
      }
    ]
  },

  // ── QUIZ 2: N4 TATA BAHASA & DOKKAI ──
  {
    id: 2,
    title: 'Quiz N4 – Tata Bahasa Bentuk ~Te & Pasangan Verba',
    bab: 'Bab 5 – Verba N4',
    level: 'N4',
    isOpen: true,
    status: 'Sedang Aktif',
    statusCode: 'running',
    timeRemaining: '25:00',
    durationMinutes: 25,
    questionType: 'Pilihan Ganda',
    thumbnailType: 'torii_gate',
    badgeColor: 'bg-purple-50 text-purple-600',
    submissionsCount: 15,
    totalStudents: 24,
    questions: [
      {
        id: 1,
        question: 'ドアが（　）います。',
        translation: 'Pintu sedang dalam keadaan terbuka (Intransitif).',
        wordJp: '開く',
        furigana: 'あく',
        options: [
          { key: 'A', text: 'あけて (akete)' },
          { key: 'B', text: 'あいて (aite)' },
          { key: 'C', text: 'しめて (shimete)' },
          { key: 'D', text: 'しまって (shimatte)' }
        ],
        correctKey: 'B',
        explanation: 'Bentuk keadaan intransitif menggunakan ~te imasu: ドアが開いています (Pintu terbuka).'
      },
      {
        id: 2,
        question: 'りょこうのまえに ホテルを（　）おきます。',
        translation: 'Melakukan persiapan sebelum bepergian (~te oku).',
        wordJp: '予約',
        furigana: 'よやく',
        options: [
          { key: 'A', text: 'よやくして (yoyaku shite)' },
          { key: 'B', text: 'よやくした (yoyaku shita)' },
          { key: 'C', text: 'よやくする (yoyaku suru)' },
          { key: 'D', text: 'よやくしない (yoyaku shinai)' }
        ],
        correctKey: 'A',
        explanation: 'Pola ~te oku menyatakan tindakan persiapan: 予約しておきます.'
      }
    ],
    studentSubmissions: [
      {
        studentId: 1,
        studentName: 'Rina Aulia',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        score: 100,
        totalWrong: 0,
        submittedAt: '21 Okt 2026, 09:12',
        answers: { 1: 'B', 2: 'A' },
        senseiNotes: 'Mantap, pemahaman bentuk te oku dan jidoushi sangat baik.'
      }
    ]
  },

  // ── QUIZ 3: N3 POLA KALIMAT TINGKAT MENENGAH ──
  {
    id: 3,
    title: 'Quiz N3 – Pola Kalimat ~Wake Ni Wa Ikanai & ~Ni Taishite',
    bab: 'Bab 8 – Tata Bahasa N3',
    level: 'N3',
    isOpen: true,
    status: 'Sedang Aktif',
    statusCode: 'running',
    timeRemaining: '30:00',
    durationMinutes: 30,
    questionType: 'Pilihan Ganda',
    thumbnailType: 'pagoda_night',
    badgeColor: 'bg-emerald-50 text-emerald-600',
    submissionsCount: 12,
    totalStudents: 24,
    questions: [
      {
        id: 1,
        question: 'あしたは たいせつな しけんだから、やすむ（　）。',
        translation: 'Karena besok ujian penting, saya tidak mungkin bisa absen.',
        wordJp: 'わけにはいかない',
        furigana: 'わけにはいかない',
        options: [
          { key: 'A', text: 'わけにはいかない (Tidak mungkin bisa)' },
          { key: 'B', text: 'かもしれない (Mungkin saja)' },
          { key: 'C', text: 'ほうがいい (Sebaiknya)' },
          { key: 'D', text: 'はずがない (Pasti tidak)' }
        ],
        correctKey: 'A',
        explanation: 'Pola ~wake ni wa ikanai menyatakan tidak dapat melakukan sesuatu karena alasan moral/sosial.'
      }
    ],
    studentSubmissions: []
  },

  // ── QUIZ 4: N2 KOSAKATA & TATA BAHASA BISNIS ──
  {
    id: 4,
    title: 'Quiz N2 – Keigo & Tata Bahasa Mahir (~Zaru Wo Enai)',
    bab: 'Bab 11 – Tata Bahasa N2',
    level: 'N2',
    isOpen: false, // Terkunci oleh Sensei
    status: 'Akan Datang',
    statusCode: 'upcoming',
    timeRemaining: '40:00',
    durationMinutes: 40,
    questionType: 'Pilihan Ganda',
    thumbnailType: 'kyoto_street',
    badgeColor: 'bg-amber-50 text-amber-600',
    submissionsCount: 0,
    totalStudents: 24,
    questions: [
      {
        id: 1,
        question: '台風のため、試合は中止せ（　）。',
        translation: 'Karena angin topan, pertandingan terpaksa harus dibatalkan.',
        wordJp: 'ざるを得ない',
        furigana: 'ざるをえない',
        options: [
          { key: 'A', text: 'ざるを得ない (Terpaksa harus)' },
          { key: 'B', text: 'っこない (Pasti tidak bisa)' },
          { key: 'C', text: 'きれない (Tidak bisa habis)' },
          { key: 'D', text: 'かねない (Bisa berakibat buruk)' }
        ],
        correctKey: 'A',
        explanation: 'Pola ~ざるを得ない bermakna terpaksa tidak ada pilihan lain.'
      }
    ],
    studentSubmissions: []
  },

  // ── QUIZ 5: N1 TINGKAT LANJUT PROFESIONAL ──
  {
    id: 5,
    title: 'Quiz N1 – Kanji & Bunpou Tingkat Lanjut (~Kiwamarinai)',
    bab: 'Bab 14 – Evaluasi N1',
    level: 'N1',
    isOpen: false, // Terkunci oleh Sensei
    status: 'Akan Datang',
    statusCode: 'upcoming',
    timeRemaining: '50:00',
    durationMinutes: 50,
    questionType: 'Pilihan Ganda',
    thumbnailType: 'daruma',
    badgeColor: 'bg-rose-50 text-rose-600',
    questions: [
      {
        id: 1,
        question: '失礼（　）態度をとってしまい、大変申し訳ありませんでした。',
        translation: 'Saya sangat meminta maaf karena telah bersikap luar biasa tidak sopan.',
        wordJp: '極まりない',
        furigana: 'きわまりない',
        options: [
          { key: 'A', text: '極まりない (Sangat/luar biasa)' },
          { key: 'B', text: 'まじき (Tidak pantas)' },
          { key: 'C', text: 'ならでは (Hanya khas)' },
          { key: 'D', text: 'きわめて (Sangat biasa)' }
        ],
        correctKey: 'A',
        explanation: 'Pola ~極まりない (kiwamarinai) menyatakan tingkat ketidaksopanan atau emosi yang sangat ekstrem.'
      }
    ],
    studentSubmissions: []
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
  }, [activeForcedMode]);

  // JLPT Level Filter: 'ALL' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  const [selectedLevel, setSelectedLevel] = useState('ALL');

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
      const saved = localStorage.getItem('lms_master_quizzes_v2');
      if (saved) return JSON.parse(saved);
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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lms_master_tasks_v3', JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_master_quizzes_v2', JSON.stringify(quizzes));
    } catch (e) {
      console.error(e);
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
  const handleToggleAccess = (type, itemId, e) => {
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
  const handleStartExam = (quiz) => {
    if (!isSensei && !quiz.isOpen) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Belum Dibuka 🔒',
        text: 'Sensei belum membuka akses pengerjaan kuis ini. Silakan tunggu informasi dari Sensei.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setActiveExamModal(quiz);
    setCurrentQIndex(0);
    setStudentAnswers({});
    setFlaggedQuestions({});
    setExamTimer((quiz.durationMinutes || 20) * 60);
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
      if (studentAnswers[q.id] === q.correctKey) {
        correct++;
      }
    });

    const score = Math.round((correct / totalQ) * 100);
    const newSubmission = {
      studentId: Date.now(),
      studentName: currentUser.name || 'Rina Aulia (Siswa)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      score,
      totalWrong: totalQ - correct,
      submittedAt: 'Baru saja',
      answers: studentAnswers,
      senseiNotes: score >= 80 ? 'Pemahaman materi sangat baik, pertahankan!' : 'Perlu memperbanyak latihan kanji dan tata bahasa.'
    };

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
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
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
  }, [tasks, selectedLevel, statusFilter, searchQuery, isSensei]);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      // Level filter
      if (selectedLevel !== 'ALL' && q.level !== selectedLevel) return false;

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
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesBab = q.bab?.toLowerCase().includes(query);
        const matchesLevel = q.level?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBab && !matchesLevel) return false;
      }

      return true;
    });
  }, [quizzes, selectedLevel, statusFilter, searchQuery, isSensei]);

  // Statistics calculation for KPI cards
  const stats = useMemo(() => {
    const totalItems = mainTab === 'tugas' ? tasks.length : quizzes.length;
    const openItems = (mainTab === 'tugas' ? tasks : quizzes).filter(x => x.isOpen).length;
    const closedItems = totalItems - openItems;
    const totalSubmissions = (mainTab === 'tugas' ? tasks : quizzes).reduce((acc, curr) => {
      const subs = curr.submissions || curr.studentSubmissions || [];
      return acc + subs.length;
    }, 0);

    return { totalItems, openItems, closedItems, totalSubmissions };
  }, [mainTab, tasks, quizzes]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
        
        {/* ============================================================ */}
        {/* 1. HERO HEADER BANNER                                        */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white border-b border-slate-200 px-4 md:px-8 py-6 overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-[550px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 25%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 25%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">
                  {mainTab === 'tugas' ? 'Tugas' : 'Quiz'}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <span>{mainTab === 'tugas' ? 'Tugas Siswa' : 'Quiz Interaktif'}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-2xs ${
                  isSensei 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {isSensei ? 'Mode Sensei' : 'Mode Siswa'}
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {mainTab === 'tugas'
                  ? (isSensei
                      ? 'Unggah tugas materi dari bab berapa sampai bab berapa, tentukan batas tenggat waktu, cek pengumpulan lembar jawaban siswa, dan berikan evaluasi nilai.'
                      : 'Pelajari modul materi yang diunggah Sensei, kerjakan lembar soal atau instruksi tugas, dan kumpulkan sebelum batas tenggat waktu berakhir.')
                  : (isSensei
                      ? 'Pilih & atur butir soal Takoboto.jp N5–N1 format UKOM, tentukan durasi pengerjaan, dan pantau lembar jawaban siswa.'
                      : 'Kerjakan kuis interaktif format UKOM dari bank soal Takoboto.jp dengan sistem timer dan evaluasi instan.')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <a
                href="https://takoboto.jp/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white/95 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 px-3.5 py-2.5 rounded-xl shadow-2xs text-xs font-bold transition cursor-pointer"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Kamus Takoboto.jp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>

              {isSensei && (
                <button
                  onClick={() => handleOpenCreateModal(mainTab)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{mainTab === 'tugas' ? 'Tambah Tugas' : 'Buat Quiz Baru'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. MAIN TABS (TUGAS vs QUIZ)                                 */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            
            {/* Tab Switches (Screenshot 1 Style) */}
            <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 w-fit">
              <button
                onClick={() => {
                  setMainTab('tugas');
                  setStatusFilter('ALL');
                  if (location.pathname !== '/lms/tugas' && location.pathname !== '/lms/tugas-quiz') {
                    navigate('/lms/tugas');
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  mainTab === 'tugas'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Tugas Siswa ({tasks.length})</span>
              </button>

              <button
                onClick={() => {
                  setMainTab('quiz');
                  setStatusFilter('ALL');
                  if (location.pathname !== '/lms/quiz' && location.pathname !== '/lms/tugas-quiz') {
                    navigate('/lms/quiz');
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  mainTab === 'quiz'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Quiz Interaktif ({quizzes.length})</span>
              </button>
            </div>

            {/* Quick KPI stats mini pill */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-500 bg-white border border-slate-200/80 rounded-2xl px-4 py-2 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Akses Terbuka: <b className="text-slate-800">{stats.openItems}</b></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Akses Ditutup: <b className="text-slate-800">{stats.closedItems}</b></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Pengumpulan: <b className="text-slate-800">{stats.totalSubmissions} Siswa</b></span>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. TOOLBAR: STATUS FILTER, JLPT DROPDOWN, SEARCH & VIEW MODE */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Status Filter Pills (No Overflow, Wraps Cleanly) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isSensei ? (
                <>
                  {[
                    { id: 'ALL', label: mainTab === 'tugas' ? 'Semua Tugas' : 'Semua Quiz' },
                    { id: 'OPEN', label: 'Akses Dibuka' },
                    { id: 'CLOSED', label: 'Akses Ditutup' },
                    { id: 'NEED_REVIEW', label: 'Ada Pengumpulan' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        statusFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { id: 'ALL', label: mainTab === 'tugas' ? 'Semua Tugas' : 'Semua Quiz' },
                    { id: 'UNSUBMITTED', label: 'Belum Selesai' },
                    { id: 'SUBMITTED', label: 'Sudah Dikumpulkan' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        statusFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Right Tools: JLPT Dropdown + Search + View Mode */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              
              {/* JLPT Dropdown Select (Clean & Space-Saving) */}
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200/90 hover:border-blue-400 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition"
                >
                  <option value="ALL">Semua JLPT</option>
                  <option value="N5">JLPT N5</option>
                  <option value="N4">JLPT N4</option>
                  <option value="N3">JLPT N3</option>
                  <option value="N2">JLPT N2</option>
                  <option value="N1">JLPT N1</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari materi / kata..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/90 hover:border-blue-400 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100/80 border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Tampilan List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Tampilan Grid"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. LIST TUGAS SISWA                                          */}
        {/* ============================================================ */}
        {mainTab === 'tugas' && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada tugas ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter level JLPT.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'space-y-4'}>
                {filteredTasks.map((tugas) => (
                  <div
                    key={tugas.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all p-5 md:p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Utility Line: Badges + Access Toggle / Status */}
                      <div className="flex items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-2xs flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-200" />
                            <span>{tugas.bab || (tugas.startBab && tugas.endBab ? `Bab ${tugas.startBab} s/d Bab ${tugas.endBab}` : 'Bab 1 s/d Bab 3')}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            JLPT {tugas.level}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Upload: {tugas.uploadDate || tugas.materialFile?.uploadedAt || '20 Okt 2026'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Tenggat: {tugas.deadlineDate ? `${tugas.deadlineDate} (${tugas.deadlineDuration || '3 Hari'})` : (tugas.deadlineText || '30 Okt 2026')}</span>
                          </span>
                        </div>

                        {/* Top Right Access Switch */}
                        {isSensei ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                              Akses Siswa:
                            </span>
                            <button
                              onClick={(e) => handleToggleAccess('task', tugas.id, e)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                tugas.isOpen
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {tugas.isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              <span>{tugas.isOpen ? 'Dibuka' : 'Ditutup'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                            tugas.statusCode === 'submitted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            {tugas.statusCode === 'submitted' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                            <span>{tugas.status}</span>
                            {tugas.score !== undefined && tugas.score !== null && (
                              <b className="text-emerald-800 font-extrabold">({tugas.score}/100)</b>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Main Title & Description (Full Width!) */}
                      <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-xl ${tugas.iconBg} border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                          <FileText className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {tugas.title}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed">
                            {tugas.desc}
                          </p>
                        </div>
                      </div>

                      {/* Berkas Materi Sensei Box (Bab Berapa s/d Bab Berapa) */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-slate-50 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-slate-900 truncate">
                                {tugas.materialFile?.name || `Modul_Materi_${tugas.bab || 'Bab'}.pdf`}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                                {tugas.materialFile?.type || 'PDF'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Modul Materi {tugas.bab} • {tugas.materialFile?.size || '2.4 MB'} • Diunggah Sensei
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActiveViewMaterialModal(tugas)}
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs transition cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Lihat Materi & Soal</span>
                          </button>
                          <button
                            onClick={() => handleDownloadMaterial(tugas.materialFile?.name)}
                            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
                            title="Unduh Berkas Materi Modul"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </div>

                      {/* Takoboto Reference Words Box */}
                      {tugas.takobotoWords && tugas.takobotoWords.length > 0 && (
                        <div className="mt-3.5 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-700 mb-2">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Referensi Kosakata Takoboto.jp:</span>
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                              Klik audio untuk mendengar pelafalan
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {tugas.takobotoWords.map((word, idx) => (
                              <div 
                                key={idx} 
                                className="inline-flex items-center gap-2 bg-white border border-slate-200/90 hover:border-blue-300 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs transition"
                              >
                                <span className="font-extrabold text-slate-900">{word.kanji}</span>
                                <span className="text-[11px] text-slate-400">({word.kana})</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 font-medium">{word.meaning}</span>
                                <button 
                                  onClick={() => speakJapanese(word.kanji)} 
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
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

                    {/* Actions Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-5 border-t border-slate-100">
                      <div className="text-xs text-slate-500 flex items-center gap-2 font-medium flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>Rilis: {tugas.uploadDate || '20 Okt 2026'}{tugas.uploadTime ? ` (${tugas.uploadTime} WIB)` : ''}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{tugas.deadlineText || (tugas.deadlineDate ? `Tenggat: ${tugas.deadlineDate}` : tugas.submittedDate)}</span>
                        </span>
                        {tugas.tags && (
                          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400">
                            • {tugas.tags.join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isSensei ? (
                          <>
                            <button
                              onClick={() => {
                                setEvaluatingItem(tugas);
                                setSelectedSubmission(null);
                              }}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Review Siswa ({tugas.submissions?.length || 0})</span>
                            </button>

                            <button
                              onClick={() => setActiveViewMaterialModal(tugas)}
                              className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                              title="Pratinjau Materi & Soal Tugas"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal('tugas', tugas)}
                              className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                              title="Edit Tugas & Materi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem('task', tugas.id, tugas.title)}
                              className="p-2 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                              title="Hapus Tugas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setActiveViewMaterialModal(tugas)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lihat Materi</span>
                            </button>

                            {tugas.statusCode === 'submitted' ? (
                              <button
                                onClick={() => setActiveSubmissionDetailModal(tugas)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lihat Pengumpulan Saya</span>
                              </button>
                            ) : tugas.isOpen ? (
                              <button
                                onClick={() => setActiveTaskSubmitModal(tugas)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Kerjakan / Kumpul Tugas</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  Swal.fire('Akses Ditutup', 'Tugas ini sedang ditutup aksesnya oleh Sensei.', 'info');
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Akses Ditutup Sensei</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. LIST QUIZ INTERAKTIF                                      */}
        {/* ============================================================ */}
        {mainTab === 'quiz' && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
            {filteredQuizzes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada kuis ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter level JLPT.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'space-y-4'}>
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all p-5 md:p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Utility Line: Badges + Access Toggle / Status */}
                      <div className="flex items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${quiz.badgeColor} border border-slate-200/60`}>
                            {quiz.bab}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Takoboto {quiz.level}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Format UKOM
                          </span>
                        </div>

                        {/* Top Right: Access Toggle / Status */}
                        {isSensei ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                              Akses Kuis:
                            </span>
                            <button
                              onClick={(e) => handleToggleAccess('quiz', quiz.id, e)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                quiz.isOpen
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {quiz.isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              <span>{quiz.isOpen ? 'Dibuka' : 'Ditutup'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            quiz.statusCode === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            {quiz.status || 'Belum Dikerjakan'}
                          </span>
                        )}
                      </div>

                      {/* Main Title & Cover Image */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden">
                          <img 
                            src={quiz.thumbnailType === 'quiz_sheet' ? quizChecklistImg : quiz.thumbnailType === 'torii_gate' ? toriiGateImg : kyotoStreetImg} 
                            alt="Quiz Cover"
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-blue-950/40 flex items-center justify-center">
                            <span className="text-[10px] font-black tracking-widest text-white">QUIZ</span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {quiz.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                            <span>📝 {quiz.questions?.length || 10} Butir Soal</span>
                            <span>•</span>
                            <span>⏱ {quiz.durationMinutes} Menit</span>
                            <span>•</span>
                            <span>👥 {quiz.studentSubmissions?.length || 0} Siswa Selesai</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Right */}
                    <div className="flex items-center justify-end gap-2 pt-4 mt-5 border-t border-slate-100">
                      {isSensei ? (
                        <>
                          <button
                            onClick={() => handleStartExam(quiz)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-3 py-2 rounded-xl shadow-2xs transition cursor-pointer"
                            title="Uji Tampilan Soal UKOM"
                          >
                            Uji Soal
                          </button>

                          <button
                            onClick={() => {
                              setEvaluatingItem(quiz);
                              setSelectedSubmission(null);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Evaluasi ({quiz.studentSubmissions?.length || 0})</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal('quiz', quiz)}
                            className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                            title="Edit Quiz & Soal Takoboto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem('quiz', quiz.id, quiz.title)}
                            className="p-2 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                            title="Hapus Quiz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {quiz.isOpen ? (
                            <button
                              onClick={() => handleStartExam(quiz)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Kerjakan Quiz</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => Swal.fire('Akses Ditutup', 'Kuis ini belum dibuka aksesnya oleh Sensei.', 'info')}
                              className="bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs px-4 py-2 rounded-xl cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Akses Ditutup Sensei</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
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
