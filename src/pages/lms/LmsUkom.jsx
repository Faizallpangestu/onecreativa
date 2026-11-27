import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  BookOpen, 
  Check, 
  CheckCircle,
  CheckCircle2,
  XCircle,
  Flag, 
  Eraser, 
  ChevronLeft, 
  Sparkles,
  Award,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  RefreshCw,
  Play,
  X,
  Printer,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  GraduationCap
} from 'lucide-react';
import Swal from 'sweetalert2';
import { moduleApi } from '../../utils/moduleApi';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import examAppleImg from '../../assets/exam_apple.jpg';
import examStudentStudyImg from '../../assets/exam_student_study.jpg';
import quizExamChecklistImg from '../../assets/quiz_exam_checklist.jpg';


// ── REAL RUNNING CLASSES FROM DATABASE (SYNCHRONIZED WITH LMS_CLASSES) ──
const FALLBACK_REAL_CLASSES = [
  {
    id: 19,
    code: 'CJ-B2',
    name: 'N5 Pagi',
    batch: 'Batch 1 2026',
    level: 'N5',
    studentCount: 2,
    status: 'active'
  },
  {
    id: 20,
    code: 'CLS-5551',
    name: 'N4 A - PAGI',
    batch: 'Batch 2 2026',
    level: 'N4',
    studentCount: 18,
    status: 'active'
  },
  {
    id: 21,
    code: 'CJ-N3AK',
    name: 'N3 Akselerasi Tokutei Ginou',
    batch: 'Batch 1 2026',
    level: 'N3',
    studentCount: 6,
    status: 'active'
  },
  {
    id: 22,
    code: 'CJ-MENS',
    name: 'Kelas Persiapan Mensetsu & Matching Job',
    batch: 'Job Matching',
    level: 'Mensetsu',
    studentCount: 14,
    status: 'active'
  }
];

export default function LmsUkom() {
  // ─────────────────────────────────────────────────────────────────────────────
  // ── VIEW MODE & ROLE MANAGEMENT ──
  // ─────────────────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('portal'); // 'portal' | 'cbt_exam'
  
  // Role switcher: detects admin / sensei from localStorage or default to sensei
  const [activeRole, setActiveRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'siswa' || user.role === 'student') return 'siswa';
      return 'sensei';
    } catch {
      return 'sensei';
    }
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRombel, setSelectedRombel] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // ── REAL RUNNING CLASSES STATE (SINKRON DENGAN KELAS AKTIF DATABASE LMS) ──
  const [realClasses, setRealClasses] = useState(FALLBACK_REAL_CLASSES);

  useEffect(() => {
    let isMounted = true;
    moduleApi('relationships')
      .then(res => {
        if (!isMounted) return;
        if (res && res.classes && res.classes.length > 0) {
          const enriched = res.classes.map(c => {
            const count = (res.enrollments || []).filter(e => Number(e.class_id) === Number(c.id) && e.status === 'active').length
              || Number(c.enrolled_students_count)
              || (c.level === 'N5' ? 2 : 18);
            return {
              ...c,
              studentCount: count
            };
          });
          setRealClasses(enriched);
        }
      })
      .catch(err => {
        console.warn('Using active real classes fallback', err);
      });
    return () => { isMounted = false; };
  }, []);


  // Gradebook Modal state
  const [showGradebookModal, setShowGradebookModal] = useState(false);
  const [selectedGradebookExam, setSelectedGradebookExam] = useState(null);

  // Jadwalkan UKOM Baru Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUkomData, setNewUkomData] = useState({
    title: '',
    rombel: 'N5 Pagi',
    level: 'N5',
    date: '2026-11-30',
    timeStart: '09:00',
    duration: 90,
    kkm: 75,
    totalSoal: 40
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ── CBT EXAM ENGINE STATES ──
  // ─────────────────────────────────────────────────────────────────────────────
  const [activeExam, setActiveExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScoreResult, setExamScoreResult] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── EXAM PACKETS REPOSITORY (STANDAR LMS CREATIVA) ──
  // ─────────────────────────────────────────────────────────────────────────────
  const [examPackets, setExamPackets] = useState([
    {
      id: 'UKOM-N5-01',
      title: 'Ujian Kompetensi N5 Tahap 1 – Moji, Goi & Bunpou Dasar',
      description: 'Evaluasi resmi bab 01 s/d bab 12 Minna no Nihongo I untuk kelas berjalan N5 Pagi (Batch 1 2026).',
      rombel: 'N5 Pagi',
      rombelBadge: 'N5 Pagi (Batch 1 2026)',
      level: 'N5',
      date: '28 Nov 2026',
      time: '08:00 - 09:30 WIB',
      durationMinutes: 90,
      totalSoal: 40,
      kkm: 75,
      status: 'active',
      totalStudents: 2,
      completedStudents: 2,
      passedStudents: 2,
      avgScore: 88.5,
      isRegisteredForStudent: true,
      studentScore: null
    },
    {
      id: 'UKOM-N4-01',
      title: 'Ujian Kompetensi N4 Standar JFT-Basic A2 (Intensif Kerja)',
      description: 'Evaluasi kompetensi resmi untuk kelas berjalan N4 A - PAGI (Batch 2 2026). Standar kerja SSW Jepang.',
      rombel: 'N4 A - PAGI',
      rombelBadge: 'N4 A - PAGI (Batch 2 2026)',
      level: 'N4',
      date: '27 Nov 2026',
      time: '08:00 - 09:30 WIB',
      durationMinutes: 90,
      totalSoal: 40,
      kkm: 75,
      status: 'active',
      totalStudents: 18,
      completedStudents: 17,
      passedStudents: 16,
      avgScore: 87.2,
      isRegisteredForStudent: false,
      studentScore: null
    },
    {
      id: 'UKOM-N3-01',
      title: 'Ujian Kompetensi N3 Akselerasi Tokutei Ginou (Caregiver/Kaigo)',
      description: 'Penguasaan tata bahasa tingkat menengah N3 dan istilah teknis keperawatan lansia untuk kelas berjalan N3.',
      rombel: 'N3 Akselerasi Tokutei Ginou',
      rombelBadge: 'N3 Akselerasi (Batch 1 2026)',
      level: 'N3',
      date: '26 Nov 2026',
      time: '13:00 - 14:30 WIB',
      durationMinutes: 90,
      totalSoal: 40,
      kkm: 75,
      status: 'completed',
      totalStudents: 6,
      completedStudents: 6,
      passedStudents: 6,
      avgScore: 91.0,
      isRegisteredForStudent: false,
      studentScore: null
    },
    {
      id: 'UKOM-MENS-01',
      title: 'Ujian Kompetensi Kesiapan Wawancara Kerja (Mensetsu & Kaiwa)',
      description: 'Evaluasi pemahaman etika wawancara, keigo (bahasa sopan bisnis), dan respon pertanyaan user Jepang.',
      rombel: 'Kelas Persiapan Mensetsu & Matching Job',
      rombelBadge: 'Persiapan Mensetsu & Job Matching',
      level: 'Mensetsu',
      date: '30 Nov 2026',
      time: '10:00 - 11:30 WIB',
      durationMinutes: 60,
      totalSoal: 30,
      kkm: 80,
      status: 'scheduled',
      totalStudents: 14,
      completedStudents: 0,
      passedStudents: 0,
      avgScore: 0,
      isRegisteredForStudent: false,
      studentScore: null
    }
  ]);

  // Mock Students Gradebook per Rombel
  const mockStudentsGradebook = useMemo(() => [
    { id: 'STU-001', name: 'Ahmad Fauzi', nik: '3215012903980001', mojiScore: 25, bunpouScore: 22.5, kanjiScore: 25, dokkaiScore: 20, totalScore: 92.5, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-002', name: 'Budi Santoso', nik: '3215012903980002', mojiScore: 22.5, bunpouScore: 20, kanjiScore: 22.5, dokkaiScore: 20, totalScore: 85.0, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-003', name: 'Citra Dewi', nik: '3215012903980003', mojiScore: 25, bunpouScore: 25, kanjiScore: 25, dokkaiScore: 22.5, totalScore: 97.5, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-004', name: 'Dimas Prasetyo', nik: '3215012903980004', mojiScore: 17.5, bunpouScore: 17.5, kanjiScore: 15, dokkaiScore: 15, totalScore: 65.0, status: 'REMEDIAL', date: '28 Nov 2026' },
    { id: 'STU-005', name: 'Eka Lestari', nik: '3215012903980005', mojiScore: 22.5, bunpouScore: 22.5, kanjiScore: 20, dokkaiScore: 22.5, totalScore: 87.5, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-006', name: 'Fajar Nugraha', nik: '3215012903980006', mojiScore: 20, bunpouScore: 22.5, kanjiScore: 22.5, dokkaiScore: 20, totalScore: 85.0, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-007', name: 'Gita Maharani', nik: '3215012903980007', mojiScore: 25, bunpouScore: 22.5, kanjiScore: 22.5, dokkaiScore: 20, totalScore: 90.0, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-008', name: 'Hadi Kurniawan', nik: '3215012903980008', mojiScore: 15, bunpouScore: 17.5, kanjiScore: 15, dokkaiScore: 17.5, totalScore: 65.0, status: 'REMEDIAL', date: '28 Nov 2026' },
    { id: 'STU-009', name: 'Indah Permata', nik: '3215012903980009', mojiScore: 22.5, bunpouScore: 25, kanjiScore: 22.5, dokkaiScore: 22.5, totalScore: 92.5, status: 'LULUS', date: '28 Nov 2026' },
    { id: 'STU-010', name: 'Joko Prabowo', nik: '3215012903980010', mojiScore: 20, bunpouScore: 20, kanjiScore: 20, dokkaiScore: 20, totalScore: 80.0, status: 'LULUS', date: '28 Nov 2026' }
  ], []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── 40 AUTHENTIC JAPANESE QUESTIONS DATABASE (JLPT N5 STANDARD) ──
  // ─────────────────────────────────────────────────────────────────────────────
  const questionsData = useMemo(() => [
    {
      id: 1,
      category: 'Moji & Goi',
      question: '「あさ」の かんじは どれですか。',
      translation: 'Manakah kanji yang tepat untuk kosakata "asa" (pagi)?',
      options: [
        { key: 'A', text: '朝' },
        { key: 'B', text: '昼' },
        { key: 'C', text: '夜' },
        { key: 'D', text: '夕' }
      ],
      correct: 'A'
    },
    {
      id: 2,
      category: 'Bunpou',
      question: 'わたし（　）がくせいです。',
      translation: 'Pilihlah partikel penanda topik yang tepat.',
      options: [
        { key: 'A', text: 'を' },
        { key: 'B', text: 'は' },
        { key: 'C', text: 'に' },
        { key: 'D', text: 'で' }
      ],
      correct: 'B'
    },
    {
      id: 3,
      category: 'Goi (Arti)',
      question: '「ほん」の いみは どれですか。',
      translation: 'Apakah arti dari kosakata "hon" dalam bahasa Indonesia?',
      options: [
        { key: 'A', text: 'Pensil' },
        { key: 'B', text: 'Tas' },
        { key: 'C', text: 'Buku' },
        { key: 'D', text: 'Kamus' }
      ],
      correct: 'C'
    },
    {
      id: 4,
      category: 'Bunpou',
      question: 'きょうは なんようび（　）ですか。',
      translation: 'Hari ini hari apa? (Lengkapi kalimat dengan benar)',
      options: [
        { key: 'A', text: '（なし）' },
        { key: 'B', text: 'は' },
        { key: 'C', text: 'の' },
        { key: 'D', text: 'に' }
      ],
      correct: 'A'
    },
    {
      id: 5,
      category: 'Bunpou',
      question: 'いま なんじ（　）ですか。',
      translation: 'Sekarang jam berapa? (Bentuk sopan)',
      options: [
        { key: 'A', text: 'でした' },
        { key: 'B', text: 'ます' },
        { key: 'C', text: 'でしたか' },
        { key: 'D', text: 'です' }
      ],
      correct: 'D'
    },
    {
      id: 6,
      category: 'Bunpou',
      question: 'ともだち（　）にほんへ いきます。',
      translation: 'Pergi ke Jepang bersama teman.',
      options: [
        { key: 'A', text: 'を' },
        { key: 'B', text: 'と' },
        { key: 'C', text: 'へ' },
        { key: 'D', text: 'から' }
      ],
      correct: 'B'
    },
    {
      id: 7,
      category: 'Goi',
      question: 'これは わたしの（　）です。',
      translation: 'Ini adalah payung milik saya.',
      options: [
        { key: 'A', text: 'みず' },
        { key: 'B', text: 'ごはん' },
        { key: 'C', text: 'かさ' },
        { key: 'D', text: 'そら' }
      ],
      correct: 'C'
    },
    {
      id: 8,
      category: 'Bunpou',
      question: 'せんせいは きょうしつ（　）います。',
      translation: 'Guru berada di dalam ruang kelas.',
      options: [
        { key: 'A', text: 'に' },
        { key: 'B', text: 'で' },
        { key: 'C', text: 'を' },
        { key: 'D', text: 'へ' }
      ],
      correct: 'A'
    },
    {
      id: 9,
      category: 'Bunpou',
      question: 'きのう テレビを（　）。',
      translation: 'Kemarin saya sudah menonton televisi.',
      options: [
        { key: 'A', text: 'みました' },
        { key: 'B', text: 'みます' },
        { key: 'C', text: 'みません' },
        { key: 'D', text: 'みませんでした' }
      ],
      correct: 'A'
    },
    {
      id: 10,
      category: 'Aisatsu',
      question: '「ありがとう」の へんじは どれですか。',
      translation: 'Respon sopan untuk ungkapan terima kasih "Arigatou".',
      options: [
        { key: 'A', text: 'おはようございます' },
        { key: 'B', text: 'どういたしまして' },
        { key: 'C', text: 'さようなら' },
        { key: 'D', text: 'いただきます' }
      ],
      correct: 'B'
    },
    {
      id: 11,
      category: 'Bunpou',
      question: 'あした とうきょう（　）いきます。',
      translation: 'Besok akan pergi ke Tokyo.',
      options: [
        { key: 'A', text: 'を' },
        { key: 'B', text: 'が' },
        { key: 'C', text: 'で' },
        { key: 'D', text: 'へ' }
      ],
      correct: 'D'
    },
    {
      id: 12,
      category: 'Keiyoushi',
      question: 'この りょうりは とても（　）です。',
      translation: 'Masakan ini sangat lezat/enak.',
      options: [
        { key: 'A', text: 'たかい' },
        { key: 'B', text: 'おもい' },
        { key: 'C', text: 'おいしい' },
        { key: 'D', text: 'あかい' }
      ],
      correct: 'C'
    },
    {
      id: 13,
      category: 'Goi (Gambar)',
      question: 'これは なんですか。',
      translation: 'Benda apakah ini sesuai gambar?',
      hasImage: true,
      image: examAppleImg,
      options: [
        { key: 'A', text: 'みかんです。' },
        { key: 'B', text: 'りんごです。' },
        { key: 'C', text: 'いちごです。' },
        { key: 'D', text: 'ぶどうです。' }
      ],
      correct: 'B'
    },
    {
      id: 14,
      category: 'Bunpou',
      question: 'えきまで バス（　）いきます。',
      translation: 'Pergi sampai stasiun naik bus.',
      options: [
        { key: 'A', text: 'で' },
        { key: 'B', text: 'に' },
        { key: 'C', text: 'を' },
        { key: 'D', text: 'と' }
      ],
      correct: 'A'
    },
    {
      id: 15,
      category: 'Kanji',
      question: '「みず」の かんじは どれですか。',
      translation: 'Manakah kanji yang berarti "mizu" (air)?',
      options: [
        { key: 'A', text: '木' },
        { key: 'B', text: '水' },
        { key: 'C', text: '火' },
        { key: 'D', text: '金' }
      ],
      correct: 'B'
    },
    {
      id: 16,
      category: 'Youbi',
      question: 'やすみは （　）ようびと にちようびです。',
      translation: 'Hari libur adalah hari Sabtu dan Minggu.',
      options: [
        { key: 'A', text: 'ど' },
        { key: 'B', text: 'げつ' },
        { key: 'C', text: 'か' },
        { key: 'D', text: 'すい' }
      ],
      correct: 'A'
    },
    {
      id: 17,
      category: 'Ichi',
      question: 'つくえの （　）に ほんが あります。',
      translation: 'Di atas meja terdapat buku.',
      options: [
        { key: 'A', text: 'した' },
        { key: 'B', text: 'うえ' },
        { key: 'C', text: 'なか' },
        { key: 'D', text: 'うしろ' }
      ],
      correct: 'B'
    },
    {
      id: 18,
      category: 'Doushi',
      question: 'パンを （　）ました。',
      translation: 'Saya telah makan roti.',
      options: [
        { key: 'A', text: 'たべ' },
        { key: 'B', text: 'のみ' },
        { key: 'C', text: 'かき' },
        { key: 'D', text: 'きき' }
      ],
      correct: 'A'
    },
    {
      id: 19,
      category: 'Gimonshi',
      question: 'にほんごの べんきょうは （　）ですか。',
      translation: 'Bagaimana pelajaran bahasa Jepang?',
      options: [
        { key: 'A', text: 'どう' },
        { key: 'B', text: 'だれ' },
        { key: 'C', text: 'どこ' },
        { key: 'D', text: 'いつ' }
      ],
      correct: 'A'
    },
    {
      id: 20,
      category: 'Doushi',
      question: 'コーヒーを （　）ます。',
      translation: 'Saya meminum kopi.',
      options: [
        { key: 'A', text: 'たべ' },
        { key: 'B', text: 'のみ' },
        { key: 'C', text: 'かい' },
        { key: 'D', text: 'み' }
      ],
      correct: 'B'
    },
    {
      id: 21,
      category: 'Kanji',
      question: '「やま」の かんじは どれですか。',
      translation: 'Manakah kanji untuk kosakata "yama" (gunung)?',
      options: [
        { key: 'A', text: '山' },
        { key: 'B', text: '川' },
        { key: 'C', text: '田' },
        { key: 'D', text: '木' }
      ],
      correct: 'A'
    },
    {
      id: 22,
      category: 'Bunpou',
      question: 'スーパー（　）りんごを かいました。',
      translation: 'Membeli apel di supermarket.',
      options: [
        { key: 'A', text: 'で' },
        { key: 'B', text: 'に' },
        { key: 'C', text: 'へ' },
        { key: 'D', text: 'と' }
      ],
      correct: 'A'
    },
    {
      id: 23,
      category: 'Gimonshi',
      question: 'あの ひとは （　）ですか。',
      translation: 'Siapakah orang itu?',
      options: [
        { key: 'A', text: 'だれ' },
        { key: 'B', text: 'なに' },
        { key: 'C', text: 'どこ' },
        { key: 'D', text: 'いくら' }
      ],
      correct: 'A'
    },
    {
      id: 24,
      category: 'Bunpou',
      question: 'へやの なかに だれ（　）いません。',
      translation: 'Di dalam ruangan tidak ada siapapun.',
      options: [
        { key: 'A', text: 'も' },
        { key: 'B', text: 'は' },
        { key: 'C', text: 'が' },
        { key: 'D', text: 'を' }
      ],
      correct: 'A'
    },
    {
      id: 25,
      category: 'Jikan',
      question: 'まいあさ しちじに （　）ます。',
      translation: 'Setiap pagi bangun pada jam 7.',
      options: [
        { key: 'A', text: 'おき' },
        { key: 'B', text: 'ね' },
        { key: 'C', text: 'たべ' },
        { key: 'D', text: 'いき' }
      ],
      correct: 'A'
    },
    {
      id: 26,
      category: 'Goi (Arti)',
      question: '「くるま」の いみは どれですか。',
      translation: 'Apakah arti dari kosakata "kuruma" dalam bahasa Indonesia?',
      options: [
        { key: 'A', text: 'Sepeda' },
        { key: 'B', text: 'Mobil' },
        { key: 'C', text: 'Kereta Api' },
        { key: 'D', text: 'Pesawat' }
      ],
      correct: 'B'
    },
    {
      id: 27,
      category: 'Jikan',
      question: 'ぎんこうは （　）じから ごじまでです。',
      translation: 'Bank buka dari jam 9 sampai jam 5.',
      options: [
        { key: 'A', text: 'く' },
        { key: 'B', text: 'しち' },
        { key: 'C', text: 'ご' },
        { key: 'D', text: 'じゅう' }
      ],
      correct: 'A'
    },
    {
      id: 28,
      category: 'Keiyoushi',
      question: 'きょうは てんきが （　）です。',
      translation: 'Hari ini cuacanya bagus/cerah.',
      options: [
        { key: 'A', text: 'いい' },
        { key: 'B', text: 'よく' },
        { key: 'C', text: 'よかった' },
        { key: 'D', text: 'よくない' }
      ],
      correct: 'A'
    },
    {
      id: 29,
      category: 'Josuushi',
      question: 'えんぴつが （　）あります。',
      translation: 'Ada 3 batang pensil.',
      options: [
        { key: 'A', text: 'さんぼん' },
        { key: 'B', text: 'さんまい' },
        { key: 'C', text: 'さんさつ' },
        { key: 'D', text: 'さんこ' }
      ],
      correct: 'A'
    },
    {
      id: 30,
      category: 'Kanji',
      question: '「かわ」の かんじは どれですか。',
      translation: 'Manakah kanji untuk kosakata "kawa" (sungai)?',
      options: [
        { key: 'A', text: '川' },
        { key: 'B', text: '山' },
        { key: 'C', text: '木' },
        { key: 'D', text: '月' }
      ],
      correct: 'A'
    },
    {
      id: 31,
      category: 'Kaiwa',
      question: '「おなまえは？」と きかれました。（　）と こたえます。',
      translation: 'Ditanya "Siapa nama Anda?", bagaimana menjawabnya?',
      options: [
        { key: 'A', text: 'たなかです。' },
        { key: 'B', text: 'はい、そうです。' },
        { key: 'C', text: 'いいえ、ちがいます。' },
        { key: 'D', text: 'わかりました。' }
      ],
      correct: 'A'
    },
    {
      id: 32,
      category: 'Basho',
      question: 'しょくどうで ひるごはんを （　）ました。',
      translation: 'Telah makan siang di kantin.',
      options: [
        { key: 'A', text: 'たべ' },
        { key: 'B', text: 'のみ' },
        { key: 'C', text: 'み' },
        { key: 'D', text: 'かい' }
      ],
      correct: 'A'
    },
    {
      id: 33,
      category: 'Nedan',
      question: 'すみません、この とけいは （　）ですか。',
      translation: 'Permisi, jam tangan ini harganya berapa?',
      options: [
        { key: 'A', text: 'いくら' },
        { key: 'B', text: 'だれ' },
        { key: 'C', text: 'どこ' },
        { key: 'D', text: 'なに' }
      ],
      correct: 'A'
    },
    {
      id: 34,
      category: 'Shigoto',
      question: 'こうじょうでは ヘルメットを （　）ます。',
      translation: 'Di pabrik, kita mengenakan/memakai helm.',
      options: [
        { key: 'A', text: 'かぶり' },
        { key: 'B', text: 'き' },
        { key: 'C', text: 'はき' },
        { key: 'D', text: 'かけ' }
      ],
      correct: 'A'
    },
    {
      id: 35,
      category: 'Bunpou',
      question: 'にちようびは どこ（　）いきませんでした。',
      translation: 'Hari Minggu kemarin tidak pergi ke mana pun.',
      options: [
        { key: 'A', text: 'へも' },
        { key: 'B', text: 'にも' },
        { key: 'C', text: 'でも' },
        { key: 'D', text: 'とも' }
      ],
      correct: 'A'
    },
    {
      id: 36,
      category: 'Keiyoushi Hitei',
      question: 'この へやは （　）ないです。',
      translation: 'Kamar ini tidak panas.',
      options: [
        { key: 'A', text: 'あつく' },
        { key: 'B', text: 'あつい' },
        { key: 'C', text: 'あつかった' },
        { key: 'D', text: 'あつくて' }
      ],
      correct: 'A'
    },
    {
      id: 37,
      category: 'Tegami',
      question: 'せんせいに てがみを （　）ました。',
      translation: 'Telah menulis surat kepada guru.',
      options: [
        { key: 'A', text: 'かき' },
        { key: 'B', text: 'きき' },
        { key: 'C', text: 'よみ' },
        { key: 'D', text: 'あい' }
      ],
      correct: 'A'
    },
    {
      id: 38,
      category: 'Shigoto',
      question: 'しごとは なんじ（　）おわりますか。',
      translation: 'Pekerjaan selesai pada jam berapa?',
      options: [
        { key: 'A', text: 'に' },
        { key: 'B', text: 'で' },
        { key: 'C', text: 'を' },
        { key: 'D', text: 'へ' }
      ],
      correct: 'A'
    },
    {
      id: 39,
      category: 'Aisatsu',
      question: '「どうぞ よろしく おねがいします」の あいさつは いつ しますか。',
      translation: 'Ungkapan salam "Douzo yoroshiku onegaishimasu" diucapkan kapan?',
      options: [
        { key: 'A', text: 'じこしょうかいの とき' },
        { key: 'B', text: 'ねる とき' },
        { key: 'C', text: 'ごはんを たべた とき' },
        { key: 'D', text: 'うちへ かえる とき' }
      ],
      correct: 'A'
    },
    {
      id: 40,
      category: 'Dokkai',
      question: '【どっかい】「わたしは まいあさ ろくじに おきます。あさごはんを たべてから、はちじに かいしゃへ いきます。」\nしつもん：わたしは なんじに かいしゃへ いきますか。',
      translation: 'Baca wacana singkat: Pada jam berapakah saya pergi ke kantor?',
      options: [
        { key: 'A', text: 'ろくじ' },
        { key: 'B', text: 'しちじ' },
        { key: 'C', text: 'はちじ' },
        { key: 'D', text: 'くじ' }
      ],
      correct: 'C'
    }
  ], []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── CBT TIMER COUNTDOWN EFFECT ──
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'cbt_exam' || examSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewMode, examSubmitted]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAutoSubmitTimeUp = () => {
    Swal.fire({
      title: '⏰ Waktu Ujian Telah Habis!',
      text: 'Sistem otomatis mengumpulkan lembar jawaban Anda.',
      icon: 'info',
      confirmButtonText: 'Lihat Hasil Nilai',
      confirmButtonColor: '#2563eb',
      customClass: { popup: 'rounded-3xl' }
    }).then(() => {
      calculateAndFinishExam();
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ── FILTERED EXAM PACKETS ──
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredPackets = useMemo(() => {
    return examPackets.filter(pkt => {
      const matchSearch = pkt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkt.rombel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRombel = selectedRombel === 'all' || pkt.rombel.toLowerCase().includes(selectedRombel.toLowerCase());
      const matchLevel = selectedLevel === 'all' || pkt.level === selectedLevel;
      const matchStatus = selectedStatus === 'all' || pkt.status === selectedStatus;
      return matchSearch && matchRombel && matchLevel && matchStatus;
    });
  }, [examPackets, searchQuery, selectedRombel, selectedLevel, selectedStatus]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── STATS KPI ──
  // ─────────────────────────────────────────────────────────────────────────────
  const statsKPI = useMemo(() => {
    const total = examPackets.length;
    const active = examPackets.filter(p => p.status === 'active').length;
    const scheduled = examPackets.filter(p => p.status === 'scheduled').length;
    const completed = examPackets.filter(p => p.status === 'completed').length;
    const totalStudents = examPackets.reduce((acc, curr) => acc + curr.totalStudents, 0);
    const totalPassed = examPackets.reduce((acc, curr) => acc + curr.passedStudents, 0);
    const totalFinished = examPackets.reduce((acc, curr) => acc + curr.completedStudents, 0);
    const passRate = totalFinished > 0 ? Math.round((totalPassed / totalFinished) * 100) : 88;

    return {
      total,
      active,
      scheduled,
      completed,
      totalStudents,
      passRate
    };
  }, [examPackets]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── CBT ACTIONS ──
  // ─────────────────────────────────────────────────────────────────────────────
  const handleStartExam = (pkt) => {
    setActiveExam(pkt);
    setCurrentQuestion(1);
    setAnswers({});
    setFlagged({});
    setTimeLeft(pkt.durationMinutes * 60);
    setExamSubmitted(false);
    setExamScoreResult(null);
    setViewMode('cbt_exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAnswer = (optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionKey
    }));
  };

  const handleToggleFlag = () => {
    setFlagged(prev => ({
      ...prev,
      [currentQuestion]: !prev[currentQuestion]
    }));
  };

  const handleClearAnswer = () => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQuestion];
      return copy;
    });
  };

  const calculateAndFinishExam = () => {
    let score = 0;
    questionsData.forEach(q => {
      if (answers[q.id] === q.correct) score += 2.5; // 40 x 2.5 = 100
    });
    const finalScore = Math.round(score);
    const isPassed = finalScore >= (activeExam?.kkm || 75);

    setExamSubmitted(true);
    setExamScoreResult({
      score: finalScore,
      isPassed,
      kkm: activeExam?.kkm || 75,
      answeredCount: Object.keys(answers).length,
      totalSoal: 40
    });

    Swal.fire({
      title: isPassed ? '🎉 Selamat, Anda LULUS!' : '⚠️ Hasil Ujian: Perlu Remedial',
      html: `
        <div class="text-center py-2">
          <div class="text-6xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'} my-3 font-mono">
            ${finalScore}
          </div>
          <p class="text-xs uppercase font-extrabold tracking-widest text-slate-400">STANDAR KKM: ${activeExam?.kkm || 75}</p>
          <p class="text-sm font-bold text-slate-700 mt-2">${activeExam?.title || 'Uji Kompetensi'}</p>
          <div class="mt-4 p-3.5 rounded-2xl text-xs ${isPassed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
            ${isPassed 
              ? 'Selamat! Skor Anda telah memenuhi kriteria kelulusan resmi LMS Creativa Bridging International.' 
              : 'Skor belum memenuhi standar kelulusan KKM. Silakan hubungi Sensei pembimbing untuk jadwal remedial.'}
          </div>
        </div>
      `,
      icon: isPassed ? 'success' : 'warning',
      confirmButtonText: 'Kembali ke Portal UKOM',
      confirmButtonColor: '#2563eb',
      customClass: { popup: 'rounded-3xl' }
    }).then(() => {
      setViewMode('portal');
    });
  };

  const handleConfirmSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const unAnsweredCount = 40 - answeredCount;
    const flaggedCount = Object.values(flagged).filter(Boolean).length;

    Swal.fire({
      title: 'Kumpulkan Ujian Sekarang?',
      html: `
        <div class="text-left text-sm space-y-2 mt-2">
          <p class="text-slate-600">Pastikan seluruh butir soal telah diperiksa sebelum lembar jawaban dikunci:</p>
          <div class="p-3.5 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-200">
            <div class="flex justify-between text-slate-700"><span>Total Butir Soal:</span> <b>40 Soal</b></div>
            <div class="flex justify-between text-emerald-600"><span>Sudah Dijawab:</span> <b>${answeredCount} Soal</b></div>
            <div class="flex justify-between text-amber-600"><span>Ditandai Ragu-ragu:</span> <b>${flaggedCount} Soal</b></div>
            <div class="flex justify-between text-rose-600"><span>Belum Dijawab:</span> <b>${unAnsweredCount} Soal</b></div>
          </div>
        </div>
      `,
      icon: unAnsweredCount > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kumpulkan Sekarang',
      cancelButtonText: 'Periksa Kembali',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      customClass: { popup: 'rounded-3xl' }
    }).then((res) => {
      if (res.isConfirmed) {
        calculateAndFinishExam();
      }
    });
  };

  const handleBackToPortalConfirm = () => {
    Swal.fire({
      title: 'Keluar dari Sesi Ujian?',
      text: 'Jawaban yang sudah Anda pilih akan tetap tersimpan di sesi lokal ini.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kembali ke Portal',
      cancelButtonText: 'Lanjutkan Ujian',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      customClass: { popup: 'rounded-3xl' }
    }).then((res) => {
      if (res.isConfirmed) {
        setViewMode('portal');
      }
    });
  };

  const handleOpenGradebook = (pkt) => {
    setSelectedGradebookExam(pkt);
    setShowGradebookModal(true);
  };

  const handleCreateUkomSubmit = (e) => {
    e.preventDefault();
    if (!newUkomData.title.trim()) {
      Swal.fire('Form Belum Lengkap', 'Silakan masukkan judul ujian kompetensi.', 'warning');
      return;
    }

    const newPkt = {
      id: 'UKOM-' + Date.now().toString().slice(-4),
      title: newUkomData.title,
      description: `Paket Uji Kompetensi baru untuk rombel ${newUkomData.rombel} (Level ${newUkomData.level}).`,
      rombel: newUkomData.rombel,
      rombelBadge: newUkomData.rombel,
      level: newUkomData.level,
      date: newUkomData.date,
      time: `${newUkomData.timeStart} WIB`,
      durationMinutes: Number(newUkomData.duration) || 90,
      totalSoal: Number(newUkomData.totalSoal) || 40,
      kkm: Number(newUkomData.kkm) || 75,
      status: 'scheduled',
      totalStudents: 20,
      completedStudents: 0,
      passedStudents: 0,
      avgScore: 0,
      isRegisteredForStudent: true,
      studentScore: null
    };

    setExamPackets(prev => [newPkt, ...prev]);
    setShowCreateModal(false);
    setNewUkomData({
      title: '',
      rombel: 'N5 Pagi',
      level: 'N5',
      date: '2026-11-30',
      timeStart: '09:00',
      duration: 90,
      kkm: 75,
      totalSoal: 40
    });

    Swal.fire({
      title: '✨ Jadwal UKOM Berhasil Diterbitkan!',
      text: 'Paket ujian kompetensi telah tersinkronisasi ke jadwal rombel kelas.',
      icon: 'success',
      confirmButtonColor: '#2563eb',
      customClass: { popup: 'rounded-3xl' }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ── CBT CURRENT QUESTION COMPUTED ──
  // ─────────────────────────────────────────────────────────────────────────────
  const currentQData = questionsData.find(q => q.id === currentQuestion) || questionsData[0];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / 40) * 100);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── RENDER COMPONENT ──
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
        
        {/* ========================================================================= */}
        {/* VIEW 1: PORTAL UJI KOMPETENSI (MODE SENSEI & MODE SISWA)                 */}
        {/* ========================================================================= */}
        {viewMode === 'portal' && (
          <div className="space-y-6">
            
            {/* ── TOP HERO BANNER (SLIM COMPACT, 3D CHARACTER TOP-ANCHORED) ── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-sm border-b border-blue-900/40">
              {/* 3D Character Background - Anchored right top, min-h-[185px] md:min-h-[200px] without clipping */}
              <div 
                className="absolute right-0 top-0 w-full sm:w-[460px] md:w-[540px] h-full pointer-events-none opacity-40 md:opacity-85"
                style={{
                  backgroundImage: `url(${quizExamChecklistImg})`,
                  backgroundPosition: 'right top',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'contain',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 55%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 55%, transparent 100%)'
                }}
              />

              <div className="relative z-10 max-w-[1550px] mx-auto px-4 md:px-8 py-6 md:py-7 min-h-[185px] md:min-h-[200px] flex flex-col justify-between">
                
                {/* Top Row: Breadcrumb & Role Switcher Pill */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs text-blue-200/80 font-medium">
                    <span>LMS Creativa</span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-300/50" />
                    <span>Evaluasi & Kelulusan</span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-300/50" />
                    <span className="text-white font-semibold">Ujian Kompetensi (UKOM)</span>
                  </div>

                  {/* Dual Mode Switcher Toggle Pill */}
                  <div className="bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-blue-400/30 flex items-center shadow-inner">
                    <button
                      onClick={() => setActiveRole('sensei')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeRole === 'sensei'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Mode Sensei</span>
                    </button>
                    <button
                      onClick={() => setActiveRole('siswa')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeRole === 'siswa'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Mode Siswa</span>
                    </button>
                  </div>
                </div>

                {/* Banner Content & Actions */}
                <div className="max-w-2xl mt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                    <span>Standardisasi Kelulusan JLPT N5–N3 & JFT-Basic A2</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span>Portal Uji Kompetensi (UKOM)</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      activeRole === 'sensei' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                    }`}>
                      {activeRole === 'sensei' ? 'Dashboard Penguji' : 'Portal Peserta Ujian'}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 leading-relaxed font-normal">
                    {activeRole === 'sensei' 
                      ? 'Kelola jadwal ujian, validasi standar kelulusan KKM, dan evaluasi hasil kompetensi bahasa Jepang siswa per rombel kelas.'
                      : 'Akses resmi ruang ujian CBT, kartu verifikasi peserta, dan riwayat nilai kelulusan kompetensi bahasa Jepang Anda.'}
                  </p>
                </div>

                {/* Quick Actions (Sensei Mode Only) */}
                {activeRole === 'sensei' && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-blue-800/40">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Jadwalkan UKOM Baru</span>
                    </button>
                    <button
                      onClick={() => {
                        Swal.fire({
                          title: 'Export Rekap Nilai UKOM',
                          text: 'Format laporan nilai lengkap (.xlsx / PDF) sedang disiapkan...',
                          icon: 'info',
                          timer: 1800,
                          showConfirmButton: false,
                          customClass: { popup: 'rounded-3xl' }
                        });
                      }}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Rekap Nilai (Excel/PDF)</span>
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* ── MAIN CONTENT CONTAINER ── */}
            <div className="max-w-[1550px] mx-auto px-4 md:px-8 space-y-6">
              
              {/* ─────────────────────────────────────────────────────────── */}
              {/* SENSEI MODE VIEW: 5 KPI CARDS & MANAGEMENT COCKPIT         */}
              {/* ─────────────────────────────────────────────────────────── */}
              {activeRole === 'sensei' ? (
                <>
                  {/* 5 KPI Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    
                    {/* Card 1: Total Paket */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Paket UKOM</div>
                        <div className="text-2xl font-black text-slate-800 mt-1">{statsKPI.total}</div>
                        <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Semua Rombel</div>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Card 2: Ujian Aktif Hari Ini */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sesi Berlangsung</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">{statsKPI.active}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Ruang Ujian Buka</div>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>

                    {/* Card 3: Terjadwal Mendatang */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Terjadwal</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">{statsKPI.scheduled}</div>
                        <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Sesi Mendatang</div>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Card 4: Total Peserta */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Peserta</div>
                        <div className="text-2xl font-black text-indigo-600 mt-1">{statsKPI.totalStudents}</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Siswa Terdaftar</div>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Card 5: Tingkat Kelulusan */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kelulusan KKM</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">{statsKPI.passRate}%</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Skor &ge; 75 Standar</div>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>

                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari ujian, rombel, materi..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Dropdown Filters */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                      
                      {/* Filter Rombel */}
                      <select
                        value={selectedRombel}
                        onChange={(e) => setSelectedRombel(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="all">Semua Rombel Kelas Sedang Berjalan ({realClasses.length})</option>
                        {realClasses.map((cls) => (
                          <option key={cls.id} value={cls.name}>
                            {cls.name} ({cls.batch ? `${cls.batch} • ` : ''}{cls.studentCount || cls.enrolled_students_count || 0} Siswa)
                          </option>
                        ))}
                      </select>

                      {/* Filter Level */}
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="all">Semua Level</option>
                        <option value="N5">Level JLPT N5</option>
                        <option value="N4">Level JLPT N4</option>
                        <option value="N3">Level JLPT N3</option>
                        <option value="Mensetsu">Level Mensetsu</option>
                      </select>

                      {/* Filter Status */}
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="all">Semua Status</option>
                        <option value="active">Sedang Berlangsung</option>
                        <option value="scheduled">Terjadwal</option>
                        <option value="completed">Selesai</option>
                      </select>

                      {/* Reset filter */}
                      {(selectedRombel !== 'all' || selectedLevel !== 'all' || selectedStatus !== 'all' || searchQuery) && (
                        <button
                          onClick={() => {
                            setSelectedRombel('all');
                            setSelectedLevel('all');
                            setSelectedStatus('all');
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          Reset
                        </button>
                      )}

                    </div>

                  </div>

                  {/* ── KATALOG PAKET UKOM LIST CARDS ── */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-extrabold text-slate-800">
                        Daftar Paket Uji Kompetensi ({filteredPackets.length})
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        Standar KKM 75/100 • 40 Butir Soal Terstandar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredPackets.map((pkt) => {
                        const statusColors = {
                          active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
                          completed: 'bg-slate-100 text-slate-700 border-slate-200'
                        };
                        const statusLabels = {
                          active: 'Sedang Berlangsung',
                          scheduled: 'Terjadwal',
                          completed: 'Selesai / Evaluasi'
                        };

                        return (
                          <div 
                            key={pkt.id}
                            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                          >
                            <div>
                              {/* Card Header Badges */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-600 text-white shadow-xs">
                                    {pkt.level}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                                    {pkt.rombel}
                                  </span>
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColors[pkt.status]}`}>
                                  {statusLabels[pkt.status]}
                                </span>
                              </div>

                              {/* Title & Description */}
                              <h3 className="text-base font-extrabold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                                {pkt.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                {pkt.description}
                              </p>

                              {/* Info Matrix */}
                              <div className="mt-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Waktu:
                                  </span>
                                  <span className="font-semibold text-slate-700">{pkt.date}, {pkt.time}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Durasi:
                                  </span>
                                  <span className="font-semibold text-slate-700">{pkt.durationMinutes} Menit ({pkt.totalSoal} Soal)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Passing Grade:
                                  </span>
                                  <span className="font-bold text-blue-600">KKM {pkt.kkm}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <Users className="w-3.5 h-3.5 text-slate-400" /> Rasio Kelulusan:
                                  </span>
                                  <span className="font-bold text-emerald-600">
                                    {pkt.completedStudents > 0 
                                      ? `${pkt.passedStudents}/${pkt.completedStudents} Lulus (${Math.round((pkt.passedStudents/pkt.completedStudents)*100)}%)`
                                      : `Belum Selesai (${pkt.totalStudents} Terdaftar)`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                onClick={() => handleOpenGradebook(pkt)}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Nilai Siswa</span>
                              </button>

                              <button
                                onClick={() => handleStartExam(pkt)}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Simulasi CBT</span>
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* ─────────────────────────────────────────────────────────── */
                /* SISWA MODE VIEW: KARTU PESERTA & UJIAN TERDAFTAR           */
                /* ─────────────────────────────────────────────────────────── */
                <div className="space-y-6">
                  
                  {/* Digital Exam Identity Card */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Status: Peserta Terverifikasi Mengikuti Ujian</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                          Kartu Peserta Ujian Kompetensi Digital
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs text-blue-100">
                          <div>
                            <span className="block text-[10px] text-blue-200 uppercase font-bold">Nama Lengkap</span>
                            <span className="font-extrabold text-white text-sm">Ahmad Fauzi</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-blue-200 uppercase font-bold">ID Siswa (NIK)</span>
                            <span className="font-mono font-bold text-white text-sm">STU-2026-N5-042</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-blue-200 uppercase font-bold">Rombel Kelas</span>
                            <span className="font-extrabold text-white text-sm">N5 Pagi (Angkatan 24)</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-blue-200 uppercase font-bold">Passing Grade KKM</span>
                            <span className="font-black text-amber-300 text-sm">75 / 100</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center flex flex-col items-center justify-center min-w-[180px]">
                        <Award className="w-10 h-10 text-amber-300 mb-1" />
                        <span className="text-xs font-extrabold text-white">Standar Ujian Resmi</span>
                        <span className="text-[10px] text-blue-100">LPK Creativa Bridging</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Exam Section for Student */}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600 fill-current" />
                      <span>Ujian Kompetensi yang Sedang Dibuka</span>
                    </h3>

                    <div className="bg-white rounded-3xl border-2 border-emerald-500/30 shadow-md p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-600 text-white">JLPT N5</span>
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse">Sesi Sedang Dibuka</span>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-slate-900">
                          Ujian Kompetensi N5 Tahap 1 – Moji, Goi & Bunpou Dasar
                        </h4>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                          Ujian terdiri dari 40 butir soal pilihan ganda bahasa Jepang otentik (Moji, Goi, Bunpou, Kanji, dan Dokkai). Waktu pengerjaan 90 menit. Jawaban tersimpan otomatis.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> 90 Menit</span>
                          <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> 40 Butir Soal</span>
                          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400" /> KKM 75</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleStartExam(examPackets[0])}
                          className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm md:text-base font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          <span>Mulai Kerjakan Ujian Sekarang</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Previous Results & Certificates */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-3">
                      Riwayat Kelulusan & Nilai UKOM Sebelumnya
                    </h3>
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="p-3.5">Nama Ujian</th>
                            <th className="p-3.5">Level</th>
                            <th className="p-3.5">Tanggal</th>
                            <th className="p-3.5">Skor Akhir</th>
                            <th className="p-3.5">Status KKM</th>
                            <th className="p-3.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3.5 font-bold text-slate-800">Evaluasi Kosakata & Tata Bahasa Bab 1-5</td>
                            <td className="p-3.5"><span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold">N5</span></td>
                            <td className="p-3.5">15 Nov 2026</td>
                            <td className="p-3.5 font-black text-emerald-600 text-sm">92.5</td>
                            <td className="p-3.5"><span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">LULUS</span></td>
                            <td className="p-3.5 text-right">
                              <button 
                                onClick={() => Swal.fire('E-Sertifikat', 'Mengunduh sertifikat bukti kelulusan nilai 92.5...', 'info')}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-all inline-flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" /> Sertifikat
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CBT EXAM SIMULATOR / RUANG UJIAN KOMPETENSI                      */}
        {/* ========================================================================= */}
        {viewMode === 'cbt_exam' && (
          <div className="space-y-6">
            
            {/* ── CBT EXAM HEADER BANNER ── */}
            <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-800/50 px-4 md:px-8 py-4 shadow-sm">
              <div className="max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-200/80 mb-1">
                    <button 
                      onClick={handleBackToPortalConfirm}
                      className="hover:text-white transition-colors flex items-center gap-1 font-semibold"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Portal
                    </button>
                    <span>/</span>
                    <span>Ruang Ujian CBT</span>
                    <span>/</span>
                    <span className="text-white font-bold">{activeExam?.rombel || 'N5 Pagi'}</span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>{activeExam?.title || 'Ujian Kompetensi N5 – Bab 2'}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/30 border border-blue-400/40 text-blue-200">
                      KKM {activeExam?.kkm || 75}
                    </span>
                  </h1>
                </div>

                {/* Sisa Waktu Countdown Timer Pill */}
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-md border backdrop-blur-md ${
                    timeLeft <= 300 
                      ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse' 
                      : 'bg-slate-900/80 border-blue-400/30 text-white'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      timeLeft <= 300 ? 'bg-rose-800/80 text-rose-200' : 'bg-blue-600/60 text-blue-200'
                    }`}>
                      <Clock className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                        Sisa Waktu
                      </div>
                      <div className="text-xl font-black tracking-wider font-mono text-white">
                        {formatTimer(timeLeft)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmSubmit}
                    className="px-5 py-3 rounded-2xl text-xs md:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                  >
                    Selesaikan Ujian
                  </button>
                </div>

              </div>
            </div>

            {/* ── CBT BODY CONTAINER ── */}
            <div className="max-w-[1550px] mx-auto px-4 md:px-8 space-y-6">
              
              {/* Progress Pengerjaan Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>Progress Lembar Jawaban:</span>
                    <span className="text-blue-600 font-black">{answeredCount} dari 40 Soal Terjawab</span>
                  </span>
                  <span className="text-emerald-600 font-mono font-black">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 2-Column CBT Exam Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── LEFT COLUMN: DAFTAR NOMOR SOAL (4 COLS) ── */}
                <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-extrabold text-slate-800">
                      Navigasi Soal (40)
                    </h2>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Standar JLPT
                    </span>
                  </div>

                  {/* Legend Warna */}
                  <div className="space-y-1.5 mb-5 pb-4 border-b border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span>Sudah Dijawab ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                      <span>Sedang Aktif (#{currentQuestion})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span>Ditandai Ragu-ragu ({Object.values(flagged).filter(Boolean).length})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white"></span>
                      <span>Belum Dijawab ({40 - answeredCount})</span>
                    </div>
                  </div>

                  {/* 40 Numbers Grid (5 cols x 8 rows) */}
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 40 }, (_, idx) => {
                      const num = idx + 1;
                      const isCurrent = currentQuestion === num;
                      const isAnswered = !!answers[num];
                      const isFlagged = !!flagged[num];

                      let btnStyle = 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
                      if (isCurrent) {
                        btnStyle = 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300 font-black';
                      } else if (isFlagged) {
                        btnStyle = 'bg-amber-500 text-white font-bold';
                      } else if (isAnswered) {
                        btnStyle = 'bg-emerald-500 text-white hover:bg-emerald-600 font-bold';
                      }

                      return (
                        <button
                          key={num}
                          onClick={() => setCurrentQuestion(num)}
                          className={`relative h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${btnStyle}`}
                        >
                          <span>{num}</span>
                          {/* Flag pin indicator */}
                          {isFlagged && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions below number grid */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                    <button
                      onClick={handleToggleFlag}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        flagged[currentQuestion]
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-amber-50/70 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 fill-current" />
                      <span>{flagged[currentQuestion] ? 'Batalkan Ragu-ragu' : 'Tandai Ragu-ragu'}</span>
                    </button>

                    <button
                      onClick={handleClearAnswer}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-50/70 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Hapus Pilihan Jawaban</span>
                    </button>
                  </div>

                </div>

                {/* ── RIGHT COLUMN: ACTIVE QUESTION CARD (8 COLS) ── */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                  
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8">
                    
                    {/* Question Header Bar */}
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-800">
                          Soal Nomor {currentQuestion} dari 40
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {currentQData.category}
                        </span>
                      </div>

                      <button
                        onClick={handleToggleFlag}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          flagged[currentQuestion]
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5 fill-current" />
                        <span>Ragu-ragu</span>
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="mb-6">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed font-sans whitespace-pre-line">
                        {currentQData.question}
                      </h3>
                      {currentQData.translation && (
                        <p className="text-xs md:text-sm text-slate-400 mt-2 italic font-normal">
                          {currentQData.translation}
                        </p>
                      )}
                    </div>

                    {/* Optional Image */}
                    {currentQData.hasImage && (
                      <div className="mb-8 flex justify-center">
                        <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 max-w-sm w-full flex items-center justify-center shadow-xs">
                          <img
                            src={currentQData.image}
                            alt="Question illustration"
                            className="max-h-52 w-auto object-contain rounded-2xl drop-shadow-sm transition-transform hover:scale-105 duration-300"
                          />
                        </div>
                      </div>
                    )}

                    {/* Options (A, B, C, D) - Pure Japanese without Translation */}
                    <div className="space-y-3">
                      {currentQData.options.map((option) => {
                        const isSelected = answers[currentQuestion] === option.key;

                        return (
                          <div
                            key={option.key}
                            onClick={() => handleSelectAnswer(option.key)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-600 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {option.key}
                            </div>

                            <div className="flex-1">
                              <span className="text-base font-semibold text-slate-800">
                                {option.text}
                              </span>
                            </div>

                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                      <button
                        onClick={() => setCurrentQuestion(prev => Math.max(1, prev - 1))}
                        disabled={currentQuestion === 1}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold border border-slate-300 transition-all ${
                          currentQuestion === 1
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleConfirmSubmit}
                          className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        >
                          Kumpulkan Ujian
                        </button>

                        <button
                          onClick={() => setCurrentQuestion(prev => Math.min(40, prev + 1))}
                          disabled={currentQuestion === 40}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                            currentQuestion === 40
                              ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                          }`}
                        >
                          <span>Selanjutnya</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Instruksi & Autosave Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-amber-50/30">
                      <img
                        src={examStudentStudyImg}
                        alt="Exam Guidelines"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span>Tata Tertib Ujian Kompetensi</span>
                      </h4>
                      <ol className="space-y-1 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
                        <li>Pilihlah satu jawaban yang paling tepat dari pilihan A, B, C, atau D.</li>
                        <li>Gunakan fitur <b>Ragu-ragu</b> jika masih belum yakin dengan jawaban yang dipilih.</li>
                        <li>Pastikan seluruh 40 butir soal telah dijawab sebelum waktu hitung mundur berakhir.</li>
                        <li>Skor kelulusan resmi minimal (KKM) adalah 75/100.</li>
                      </ol>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                        <Check className="w-3.5 h-3.5" /> Autosave Aktif: Jawaban tersimpan otomatis secara real-time.
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: REKAP HASIL NILAI SISWA (GRADEBOOK MODAL)                       */}
        {/* ========================================================================= */}
        {showGradebookModal && selectedGradebookExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-300 font-semibold flex items-center gap-1.5">
                    <span>Gradebook & Rekap Kelulusan</span>
                    <span>•</span>
                    <span>Rombel {selectedGradebookExam.rombel}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black mt-1 text-white">
                    {selectedGradebookExam.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowGradebookModal(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Summary KPI */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Total Peserta:</span>
                  <span className="text-sm font-extrabold text-slate-800">{mockStudentsGradebook.length} Siswa</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Lulus KKM (&ge;75):</span>
                  <span className="text-sm font-extrabold text-emerald-600">8 Siswa (80%)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Perlu Remedial:</span>
                  <span className="text-sm font-extrabold text-rose-600">2 Siswa (20%)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Rata-rata Skor:</span>
                  <span className="text-sm font-extrabold text-blue-600">84.0 / 100</span>
                </div>
              </div>

              {/* Modal Table Content */}
              <div className="p-4 md:p-6 overflow-y-auto flex-1">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Moji (/25)</th>
                      <th className="p-3">Bunpou (/25)</th>
                      <th className="p-3">Kanji (/25)</th>
                      <th className="p-3">Dokkai (/25)</th>
                      <th className="p-3">Total Skor</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockStudentsGradebook.map((st, i) => (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-semibold text-slate-400">{i + 1}</td>
                        <td className="p-3 font-extrabold text-slate-800">
                          {st.name}
                          <span className="block text-[10px] text-slate-400 font-normal">{st.nik}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{st.mojiScore}</td>
                        <td className="p-3 font-medium text-slate-700">{st.bunpouScore}</td>
                        <td className="p-3 font-medium text-slate-700">{st.kanjiScore}</td>
                        <td className="p-3 font-medium text-slate-700">{st.dokkaiScore}</td>
                        <td className="p-3 font-black text-sm text-slate-900">{st.totalScore}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            st.status === 'LULUS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    Swal.fire('Cetak Berita Acara', 'Mencetak dokumen berita acara resmi kelulusan...', 'info');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Cetak Berita Acara</span>
                </button>

                <button
                  onClick={() => setShowGradebookModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                >
                  Tutup Rekap
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: JADWALKAN UKOM BARU                                             */}
        {/* ========================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
              
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Jadwalkan Paket UKOM Baru</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Buat sesi ujian kompetensi resmi untuk rombel siswa.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUkomSubmit} className="p-5 space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Ujian Kompetensi
                  </label>
                  <input
                    type="text"
                    required
                    value={newUkomData.title}
                    onChange={(e) => setNewUkomData({ ...newUkomData, title: e.target.value })}
                    placeholder="Contoh: Ujian Kompetensi N5 Tahap 2 – Bab 13 s/d 25"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Target Rombel Kelas Sedang Berjalan
                      </label>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Data Real Terkoneksi
                      </span>
                    </div>
                    <select
                      value={newUkomData.rombel}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const matchedClass = realClasses.find(c => c.name === selectedName);
                        const autoLevel = matchedClass?.level || (selectedName.includes('N5') ? 'N5' : selectedName.includes('N4') ? 'N4' : selectedName.includes('N3') ? 'N3' : 'Mensetsu');
                        setNewUkomData(prev => ({
                          ...prev,
                          rombel: selectedName,
                          level: autoLevel,
                          title: prev.title ? prev.title : `Ujian Kompetensi ${autoLevel} – ${selectedName}`
                        }));
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {realClasses.map((cls) => (
                        <option key={cls.id} value={cls.name}>
                          {cls.name} ({cls.batch ? `${cls.batch} • ` : ''}{cls.studentCount || cls.enrolled_students_count || 0} Siswa Aktif)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tingkat Level (Otomatis Sesuai Rombel)
                    </label>
                    <select
                      value={newUkomData.level}
                      onChange={(e) => setNewUkomData({ ...newUkomData, level: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="N5">JLPT N5 (Dasar 1)</option>
                      <option value="N4">JLPT N4 (Dasar 2 / Kerja)</option>
                      <option value="N3">JLPT N3 (Menengah / Kaigo)</option>
                      <option value="Mensetsu">Persiapan Wawancara / Mensetsu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={newUkomData.date}
                      onChange={(e) => setNewUkomData({ ...newUkomData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      value={newUkomData.timeStart}
                      onChange={(e) => setNewUkomData({ ...newUkomData, timeStart: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Durasi (Menit)
                    </label>
                    <input
                      type="number"
                      value={newUkomData.duration}
                      onChange={(e) => setNewUkomData({ ...newUkomData, duration: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Passing Grade KKM
                    </label>
                    <input
                      type="number"
                      value={newUkomData.kkm}
                      onChange={(e) => setNewUkomData({ ...newUkomData, kkm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jumlah Butir Soal
                    </label>
                    <input
                      type="number"
                      value={newUkomData.totalSoal}
                      onChange={(e) => setNewUkomData({ ...newUkomData, totalSoal: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                  >
                    Simpan & Terbitkan Jadwal
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
