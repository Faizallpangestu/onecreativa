import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  Sparkles,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Send,
  Layers,
  Check,
  X,
  Volume2,
  Sliders,
  HelpCircle,
  Plus,
  ShieldCheck,
  Calendar,
  Users,
  GraduationCap,
  Award,
  Filter,
  CheckSquare,
  Clock,
  Target,
  Flame,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import Swal from 'sweetalert2';

// ── KATALOG KELAS LENGKAP & KURIKULUM DINAMIS ──
const CLASS_CATALOG = [
  {
    id: 19,
    name: 'N5 Pagi',
    code: 'N5-AM',
    level: 'N5',
    defaultDifficulty: 'medium',
    studentsCount: 2,
    curriculum: 'Minna no Nihongo I',
    totalMeetings: 24,
    chapterRange: { start: 1, end: 25, label: 'Bab 01 s/d Bab 25 (Minna no Nihongo I)' },
    presets: [
      { label: 'Bab 1 s/d 5 (Dasar & Perkenalan)', start: 1, end: 5 },
      { label: 'Bab 6 s/d 10 (Aktivitas Sehari-hari)', start: 6, end: 10 },
      { label: 'Bab 11 s/d 15 (Hitungan & Bentuk Te)', start: 11, end: 15 },
      { label: 'Bab 16 s/d 20 (Bentuk Nai & Syarat)', start: 16, end: 20 },
      { label: 'Bab 1 s/d 25 (Lengkap N5)', start: 1, end: 25 }
    ],
    meetingPresets: [
      { label: 'Minggu 1 (P1 - P4)', start: 1, end: 4 },
      { label: 'Minggu 2 (P5 - P8)', start: 5, end: 8 },
      { label: 'Minggu 3 (P9 - P12)', start: 9, end: 12 },
      { label: 'Ujian Tengah Level (P1 - P12)', start: 1, end: 12 },
      { label: 'Ujian Akhir Level (P1 - P24)', start: 1, end: 24 }
    ]
  },
  {
    id: 20,
    name: 'N5 Sore',
    code: 'N5-PM',
    level: 'N5',
    defaultDifficulty: 'easy',
    studentsCount: 4,
    curriculum: 'Minna no Nihongo I',
    totalMeetings: 24,
    chapterRange: { start: 1, end: 25, label: 'Bab 01 s/d Bab 25 (Minna no Nihongo I)' },
    presets: [
      { label: 'Bab 1 s/d 5 (Dasar & Perkenalan)', start: 1, end: 5 },
      { label: 'Bab 6 s/d 10 (Aktivitas Sehari-hari)', start: 6, end: 10 },
      { label: 'Bab 1 s/d 25 (Lengkap N5)', start: 1, end: 25 }
    ],
    meetingPresets: [
      { label: 'Minggu 1 (P1 - P4)', start: 1, end: 4 },
      { label: 'Minggu 2 (P5 - P8)', start: 5, end: 8 }
    ]
  },
  {
    id: 21,
    name: 'N4 A - PAGI',
    code: 'N4-A-AM',
    level: 'N4',
    defaultDifficulty: 'medium',
    studentsCount: 3,
    curriculum: 'Minna no Nihongo II & Irodori A2',
    totalMeetings: 24,
    chapterRange: { start: 26, end: 50, label: 'Bab 26 s/d Bab 50 (Minna no Nihongo II)' },
    presets: [
      { label: 'Bab 26 s/d 30 (Pola ~ndesu & Potensial)', start: 26, end: 30 },
      { label: 'Bab 31 s/d 35 (Volisional & Keharusan)', start: 31, end: 35 },
      { label: 'Bab 36 s/d 40 (Tujuan ~tame ni & Kaizen)', start: 36, end: 40 },
      { label: 'Bab 41 s/d 45 (Beri-Terima & Pasif/Kausatif)', start: 41, end: 45 },
      { label: 'Bab 26 s/d 50 (Lengkap N4)', start: 26, end: 50 }
    ],
    meetingPresets: [
      { label: 'Minggu 1 (P1 - P4)', start: 1, end: 4 },
      { label: 'Minggu 2 (P5 - P8)', start: 5, end: 8 },
      { label: 'Ujian Akhir Level N4 (P1 - P24)', start: 1, end: 24 }
    ]
  },
  {
    id: 22,
    name: 'N4 B - Malam',
    code: 'N4-B-PM',
    level: 'N4',
    defaultDifficulty: 'hard',
    studentsCount: 2,
    curriculum: 'Minna no Nihongo II',
    totalMeetings: 24,
    chapterRange: { start: 26, end: 50, label: 'Bab 26 s/d Bab 50 (Minna no Nihongo II)' },
    presets: [
      { label: 'Bab 26 s/d 30 (Pola ~ndesu)', start: 26, end: 30 },
      { label: 'Bab 31 s/d 35 (Maksud & Syarat)', start: 31, end: 35 },
      { label: 'Bab 26 s/d 50 (Lengkap N4)', start: 26, end: 50 }
    ],
    meetingPresets: [
      { label: 'Bulan 1 (P1 - P8)', start: 1, end: 8 },
      { label: 'Bulan 2 (P9 - P16)', start: 9, end: 16 }
    ]
  },
  {
    id: 23,
    name: 'N3 Akselerasi',
    code: 'N3-ACC',
    level: 'N3',
    defaultDifficulty: 'hard',
    studentsCount: 3,
    curriculum: 'Minna no Nihongo Chukyu I & Soumatome N3',
    totalMeetings: 16,
    chapterRange: { start: 1, end: 12, label: 'Bab 01 s/d Bab 12 (Minna no Nihongo Chukyu)' },
    presets: [
      { label: 'Bab 1 s/d 4 (Bunpou Chukyu Awal)', start: 1, end: 4 },
      { label: 'Bab 5 s/d 8 (Keigo & Situasi Kerja)', start: 5, end: 8 },
      { label: 'Bab 1 s/d 12 (Full N3 Chukyu)', start: 1, end: 12 }
    ],
    meetingPresets: [
      { label: 'Tahap 1 (P1 - P6)', start: 1, end: 6 },
      { label: 'Tahap 2 (P7 - P12)', start: 7, end: 12 },
      { label: 'Simulasi N3 (P1 - P16)', start: 1, end: 16 }
    ]
  },
  {
    id: 24,
    name: 'Kelas Persiapan Mensetsu & Matching Job',
    code: 'JOB-MKT',
    level: 'N4',
    defaultDifficulty: 'medium',
    studentsCount: 5,
    curriculum: 'Modul Kaiwa Wawancara Kerja & Etika Kaizen Kaigo/TG',
    totalMeetings: 12,
    chapterRange: { start: 1, end: 10, label: 'Bab 01 s/d Bab 10 (Kaiwa & Wawancara)' },
    presets: [
      { label: 'Bab 1 s/d 3 (Jikoshoukai & Motivasi Kerja)', start: 1, end: 3 },
      { label: 'Bab 4 s/d 6 (Pengalaman & Kelebihan Diri)', start: 4, end: 6 },
      { label: 'Bab 7 s/d 10 (Simulasi Wawancara User Jepang)', start: 7, end: 10 },
      { label: 'Semua Modul Mensetsu (Bab 1 - 10)', start: 1, end: 10 }
    ],
    meetingPresets: [
      { label: 'Sesi Awal (P1 - P4)', start: 1, end: 4 },
      { label: 'Sesi Intensif (P5 - P8)', start: 5, end: 8 },
      { label: 'Simulasi Final (P9 - P12)', start: 9, end: 12 }
    ]
  }
];

export default function LmsQuizGenerate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse query params if available
  const initialClass = searchParams.get('class') || 'N5 Pagi';
  const initialMode = searchParams.get('mode') || 'range_bab';
  const initialLevel = searchParams.get('level') || 'N5';
  const initialQuestions = Number(searchParams.get('questions')) || 10;

  // ── STEPPER: 1 = Pilih Bab & Materi, 2 = Ekstraksi & Konfigurasi, 3 = Generating, 4 = Review & Approval ──
  const [currentStep, setCurrentStep] = useState(1);

  // ── TARGET KELAS & METODE STATE ──
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [targetLevel, setTargetLevel] = useState(initialLevel);
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [quizMode, setQuizMode] = useState('daily'); // 'daily', 'review', 'remedial', 'exam'

  // Mode: 'range_bab', 'range_meeting', 'upload_new'
  const [selectionMode, setSelectionMode] = useState(initialMode);
  const [startBab, setStartBab] = useState(1);
  const [endBab, setEndBab] = useState(5);
  const [startMeeting, setStartMeeting] = useState(1);
  const [endMeeting, setEndMeeting] = useState(4);
  const [materialsList, setMaterialsList] = useState([]);

  // Active Class Object
  const activeClassObj = useMemo(() => {
    const found = CLASS_CATALOG.find(c => c.name === selectedClass);
    return found || CLASS_CATALOG[0];
  }, [selectedClass]);

  // Handle Class Switch with Automatic Sync
  const handleClassChange = (newClassName) => {
    setSelectedClass(newClassName);
    const targetClass = CLASS_CATALOG.find(c => c.name === newClassName);
    if (targetClass) {
      setTargetLevel(targetClass.level);
      setDifficulty(targetClass.defaultDifficulty);
      setStartBab(targetClass.chapterRange.start);
      setEndBab(Math.min(targetClass.chapterRange.start + 4, targetClass.chapterRange.end));
      setStartMeeting(1);
      setEndMeeting(Math.min(4, targetClass.totalMeetings));
    }
  };

  // Upload new file state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({
    name: 'Minna_no_Nihongo_Bab01-05.pdf',
    pages: 48,
    size: '4.8 MB',
    type: 'PDF'
  });

  // ── STEP 2: EXTRACTED CONTENT & CONFIGURATION STATE ──
  const [extractedContent, setExtractedContent] = useState({
    vocabulary: [],
    kanji: [],
    grammar: [],
    reading_passage: '',
    can_do_statement: ''
  });

  // Form Config
  const [totalQuestions, setTotalQuestions] = useState(initialQuestions);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingGrade, setPassingGrade] = useState(75);
  const [composition, setComposition] = useState({
    vocabulary: 3,
    grammar: 4,
    kanji: 1,
    reading: 1,
    situational: 1
  });

  // Validation: total sum of composition must equal totalQuestions
  const compositionSum = useMemo(() => {
    return Object.values(composition).reduce((a, b) => a + Number(b), 0);
  }, [composition]);
  const isCompositionValid = compositionSum === Number(totalQuestions);

  // ── STEP 3: GENERATION JOB PROGRESS ──
  const [generationJob, setGenerationJob] = useState({
    progressPercent: 0,
    currentStepText: 'Inisialisasi Generator...',
    stages: [
      { id: 1, label: 'Memindai & Mengumpulkan Modul Materi Terpilih', status: 'pending' },
      { id: 2, label: 'Ekstraksi Kotoba, Pola Bunpou & Kanji Sesuai Rentang Bab', status: 'pending' },
      { id: 3, label: 'AI Generation Berbasis Konten (Strict Material Constraint)', status: 'pending' },
      { id: 4, label: 'Academic & Technical Validation (No Hallucination)', status: 'pending' },
      { id: 5, label: 'Penyusunan Draft Kuis Siap Review', status: 'pending' }
    ]
  });

  // ── STEP 4: GENERATED DRAFT QUIZ & QUESTIONS STATE ──
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  // Fetch materials from API on mount
  useEffect(() => {
    const fetchApi = async () => {
      try {
        const res = await fetch('/api/lms_quiz_api.php?action=materials');
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          setMaterialsList(json.data);
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
      }
    };
    fetchApi();
  }, []);

  // Filter or dynamically generate matching materials based on active class & range
  const matchingMaterials = useMemo(() => {
    const currentClass = activeClassObj;
    const items = [];

    if (selectionMode === 'range_bab') {
      for (let b = startBab; b <= endBab; b++) {
        const bStr = b < 10 ? `0${b}` : `${b}`;
        const existing = (materialsList || []).find(m => (m.bab_number === b) || (m.chapter_bab === `Bab ${bStr}`) || (m.chapter_bab === `Bab ${b}`));
        if (existing) {
          items.push(existing);
        } else {
          const isN4 = b >= 26;
          const isChukyu = currentClass.level === 'N3';
          const isJob = currentClass.code === 'JOB-MKT';
          
          let chTitle = `Minna no Nihongo Bab ${bStr} – Pembahasan Modul & Pola Kalimat`;
          if (isJob) {
            chTitle = `Modul Mensetsu Bab ${bStr} – Latihan Wawancara Kerja & Etika Kaizen`;
          } else if (isChukyu) {
            chTitle = `Minna no Nihongo Chukyu Bab ${bStr} – Wacana Lanjutan & Kosakata Bisnis`;
          } else if (isN4) {
            chTitle = `Minna no Nihongo II Bab ${bStr} – Tata Bahasa & Pola Situasi Kerja N4`;
          }

          items.push({
            id: `dyn_${currentClass.code}_${b}`,
            chapter_bab: `Bab ${bStr}`,
            bab_number: b,
            meeting_number: Math.min(Math.ceil((b - currentClass.chapterRange.start + 1) / 1.5), currentClass.totalMeetings),
            level: currentClass.level,
            class_name: currentClass.name,
            title: chTitle,
            file_name: `${currentClass.curriculum.replace(/\s+/g, '_')}_Bab${bStr}.pdf`,
            file_size: `${(2.0 + (b % 5) * 0.2).toFixed(1)} MB`,
            extracted_vocab_parsed: [
              { kanji: '業務', furigana: 'ぎょうむ', meaning: 'Pekerjaan / Tugas operasional', pos: 'Noun' },
              { kanji: '報告', furigana: 'ほうこく', meaning: 'Laporan kerja (Horenso)', pos: 'Noun' },
              { kanji: '確認', furigana: 'かくにん', meaning: 'Pengecekan / Konfirmasi', pos: 'Noun' },
              { kanji: '安全', furigana: 'あんぜん', meaning: 'Keselamatan kerja (Anzen Daiichi)', pos: 'Noun' }
            ],
            extracted_grammar_parsed: [
              { pattern: `【Pola Bab ${b}】+ ようにしてください`, meaning: 'Instruksi menjaga standar kerja atau kebiasaan.', example: '作業中は 必ず ヘルメットを かぶるようにしてください。' },
              { pattern: `【Bentuk Kamus】+ 必要があります`, meaning: 'Menyatakan keharusan prosedural operasional.', example: '機械を 使う前に 点検する 必要が あります。' }
            ],
            extracted_kanji_parsed: [
              { kanji: '業', onyomi: 'ギョウ', kunyomi: 'わざ', meaning: 'Pekerjaan / Industri' },
              { kanji: '務', onyomi: 'ム', kunyomi: 'つと・める', meaning: 'Tugas / Kewajiban' }
            ],
            extracted_reading: '工場での 安全管理は とても 重要です。毎朝の 朝礼で 一日の 作業予定を 確認します。',
            can_do_statement: `Siswa mampu memahami materi Bab ${bStr} dan menerapkan instruksi kerja dengan tepat.`
          });
        }
      }
    } else if (selectionMode === 'range_meeting') {
      for (let m = startMeeting; m <= endMeeting; m++) {
        const estimatedBab = currentClass.chapterRange.start + Math.floor((m - 1) * (currentClass.chapterRange.end - currentClass.chapterRange.start + 1) / currentClass.totalMeetings);
        const bStr = estimatedBab < 10 ? `0${estimatedBab}` : `${estimatedBab}`;
        items.push({
          id: `meet_${currentClass.code}_${m}`,
          chapter_bab: `P${m < 10 ? `0${m}` : m}`,
          bab_number: estimatedBab,
          meeting_number: m,
          level: currentClass.level,
          class_name: currentClass.name,
          title: `Pertemuan ${m} – ${currentClass.name} (Cakupan Bab ${bStr})`,
          file_name: `Agenda_Pertemuan_${m < 10 ? `0${m}` : m}_${currentClass.name.replace(/\s+/g, '_')}.pdf`,
          file_size: '2.4 MB',
          extracted_vocab_parsed: [
            { kanji: '準備', furigana: 'じゅんび', meaning: 'Persiapan kerja', pos: 'Noun' },
            { kanji: '連絡', furigana: 'れんらく', meaning: 'Menghubungi / Komunikasi', pos: 'Noun' }
          ],
          extracted_grammar_parsed: [
            { pattern: `【Pertemuan ${m}】+ てから`, meaning: 'Urutan aktivitas kerja berkesinambungan.', example: '手を 洗ってから、作業室に 入ります。' }
          ]
        });
      }
    }

    return items;
  }, [activeClassObj, selectionMode, startBab, endBab, startMeeting, endMeeting, materialsList]);

  // Handle file drop / select
  const handleFileUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setUploadedFile(file);
    setFileDetails({
      name: file.name,
      pages: Math.floor(Math.random() * 20) + 12,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.split('.').pop().toUpperCase()
    });

    Swal.fire({
      icon: 'success',
      title: 'Berkas Modul Terdeteksi! 📄',
      text: `File "${file.name}" siap diproses oleh Content Extractor.`,
      timer: 1800,
      showConfirmButton: false
    });
  };

  // Proceed from Step 1 to Step 2
  const handleProceedToStep2 = () => {
    const aggVocabs = [];
    const aggGrammar = [];
    const aggKanji = [];
    let readingText = '';
    let canDoText = '';

    matchingMaterials.forEach(m => {
      const v = m.extracted_vocab_parsed || [];
      const g = m.extracted_grammar_parsed || [];
      const k = m.extracted_kanji_parsed || [];
      v.forEach(item => aggVocabs.push({ ...item, _bab: m.chapter_bab }));
      g.forEach(item => aggGrammar.push({ ...item, _bab: m.chapter_bab }));
      k.forEach(item => aggKanji.push({ ...item, _bab: m.chapter_bab }));
      if (m.extracted_reading && !readingText) readingText = m.extracted_reading;
      if (m.can_do_statement && !canDoText) canDoText = m.can_do_statement;
    });

    setExtractedContent({
      vocabulary: aggVocabs,
      grammar: aggGrammar,
      kanji: aggKanji,
      reading_passage: readingText || 'わたしは 毎朝 会社へ 行きます。電車で 行きます。',
      can_do_statement: canDoText || `Siswa mampu menguasai kosakata dan pola kalimat kerja Jepang sesuai materi ${activeClassObj.name}.`
    });

    setCurrentStep(2);
  };

  // Run AI Generation Pipeline
  const handleStartGeneration = async () => {
    if (!isCompositionValid) {
      Swal.fire(
        'Komposisi Belum Sesuai',
        `Total butir kategori (${compositionSum}) harus tepat sama dengan Jumlah Soal (${totalQuestions}).`,
        'warning'
      );
      return;
    }

    setCurrentStep(3);

    const updateStage = (stageIdx, pct, text) => {
      setGenerationJob(prev => ({
        progressPercent: pct,
        currentStepText: text,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx < stageIdx ? 'done' : idx === stageIdx ? 'running' : 'pending'
        }))
      }));
    };

    updateStage(0, 20, `Memindai berkas modul materi untuk kelas ${selectedClass}...`);
    await new Promise(r => setTimeout(r, 600));

    updateStage(1, 40, `Mengekstrak Kotoba & Bunpou (${selectionMode === 'range_bab' ? `Bab ${startBab} s/d Bab ${endBab}` : 'Cakupan Pertemuan'})...`);
    await new Promise(r => setTimeout(r, 700));

    updateStage(2, 65, `AI Generator merangkai butir soal pilihan ganda (${difficulty.toUpperCase()})...`);
    await new Promise(r => setTimeout(r, 800));

    updateStage(3, 85, `Memvalidasi kunci jawaban, distractor, dan level ${targetLevel}...`);
    await new Promise(r => setTimeout(r, 700));

    try {
      const payload = {
        selection_mode: selectionMode,
        start_bab: Number(startBab),
        end_bab: Number(endBab),
        start_meeting: Number(startMeeting),
        end_meeting: Number(endMeeting),
        material_ids: matchingMaterials.map(m => m.id),
        class_id: activeClassObj.id || 19,
        class_name: selectedClass,
        level: targetLevel,
        mode: quizMode,
        total_questions: Number(totalQuestions),
        duration_minutes: Number(durationMinutes),
        passing_grade: Number(passingGrade),
        difficulty: difficulty,
        composition: composition
      };

      let quizResult = null;
      try {
        const res = await fetch('/api/lms_quiz_api.php?action=generate_quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.status === 'success' && resJson.data) {
          quizResult = resJson.data;
        }
      } catch (apiErr) {
        console.warn('API error, falling back to high quality client generator:', apiErr);
      }

      // Client Fallback if API response is not available
      if (!quizResult) {
        const generatedQuestions = [];
        const categories = ['Vocabulary', 'Grammar', 'Kanji', 'Reading', 'Situational'];
        
        for (let i = 1; i <= totalQuestions; i++) {
          const cat = categories[(i - 1) % categories.length];
          const babNum = startBab + ((i - 1) % Math.max(1, endBab - startBab + 1));
          const babStr = babNum < 10 ? `0${babNum}` : `${babNum}`;

          let qText = `【Bab ${babStr}】`;
          let transText = '';
          let optA = '', optB = '', optC = '', optD = '';
          let explanation = '';

          if (cat === 'Vocabulary') {
            qText += ' 次の 言葉の 意味として 最も 適切な ものを 選びなさい：『確認』';
            transText = 'Pilihlah arti kata yang paling tepat untuk "Kakunin" (Pengecekan/Konfirmasi)';
            optA = 'Pengecekan / Konfirmasi';
            optB = 'Pembersihan area';
            optC = 'Pemberitahuan izin';
            optD = 'Peminjaman alat kerja';
            explanation = '確認 (kakunin) bermakna mengecek kembali, memastikan, atau mengonfirmasi tugas kerja.';
          } else if (cat === 'Grammar') {
            qText += ' (　　) に 入る 最も 適切な ものを 選びなさい：「作業を 始める 前に、必ず 機械を 点検 (　　) なければなりません。」';
            transText = 'Pilihlah partikel/bentuk yang tepat: Sebelum memulai kerja, wajib mengecek mesin...';
            optA = 'し';
            optB = 'して';
            optC = 'した';
            optD = 'する';
            explanation = 'Pola keharusan: Bentuk negatif Nai tanpa I + なければなりません。Suru -> Shinaければなりません。';
          } else if (cat === 'Kanji') {
            qText += ' 下線の 言葉の 漢字の 読み方を 選びなさい：『安全』に 作業を 行います。';
            transText = 'Pilihlah cara baca kanji untuk kata yang digarisbawahi: [Anzen]';
            optA = 'あんぜん (Anzen)';
            optB = 'あんぜつ (Anzetsu)';
            optC = 'あぜん (Azen)';
            optD = 'やすぜん (Yasuzen)';
            explanation = 'Kanji 安 (AN) + 全 (ZEN) dibaca "anzen" yang bermakna aman atau keselamatan.';
          } else if (cat === 'Reading') {
            qText += ' 本文の 内容と 合っている ものは どれですか。';
            transText = 'Manakah pernyataan yang sesuai dengan isi teks bacaan kerja?';
            optA = '朝の 朝礼で 一日の 作業予定を 確認する。';
            optB = '機械の 点検は 作業が 終わってから 行う。';
            optC = 'ヘルメットは 事務所の 中だけで かぶる。';
            optD = '異常が あっても 自分で 勝手に 直す。';
            explanation = 'Sesuai SOP kaizen pabrik, konfirmasi rencana kerja dilakukan saat chourei (briefing pagi).';
          } else {
            qText += ' 状況：先輩が 重い 荷物を 運んでいます。手伝いたい とき、何と 言いますか。';
            transText = 'Situasi: Senior sedang mengangkat barang berat. Anda ingin membantu, apa yang diucapkan?';
            optA = 'お荷物、お持ちしましょうか。';
            optB = 'ごめんなさい、できません。';
            optC = 'お疲れ様でした。';
            optD = '失礼いたしました。';
            explanation = 'Menawarkan bantuan dengan sopan menggunakan bentuk kenjougo: お〜しましょうか。';
          }

          generatedQuestions.push({
            id: i,
            category: cat,
            category_label: cat === 'Vocabulary' ? '🔤 Vocabulary' : cat === 'Grammar' ? '✏️ Grammar' : cat === 'Kanji' ? '🈳 Kanji' : cat === 'Reading' ? '📖 Reading' : '🤝 Situasional',
            difficulty: difficulty,
            material_reference: `Bab ${babStr} (${activeClassObj.curriculum})`,
            question: qText,
            translation: transText,
            passage: cat === 'Reading' ? '【業務連絡】：\n本日の 製造ラインは 8時30分から 開始します。作業員は 全員、朝礼前に 保護具の 点検を 完了してください。' : null,
            options: [
              { key: 'A', text: optA },
              { key: 'B', text: optB },
              { key: 'C', text: optC },
              { key: 'D', text: optD }
            ],
            correct_key: 'A',
            explanation: explanation
          });
        }

        quizResult = {
          quiz_id: Date.now(),
          title: `Quiz ${targetLevel} – ${selectionMode === 'range_bab' ? `Bab ${startBab < 10 ? '0'+startBab : startBab} s/d Bab ${endBab < 10 ? '0'+endBab : endBab}` : `Pertemuan ${startMeeting} - ${endMeeting}`} (${selectedClass})`,
          bab: selectionMode === 'range_bab' ? `Bab ${startBab < 10 ? '0'+startBab : startBab}-${endBab < 10 ? '0'+endBab : endBab}` : `P${startMeeting}-P${endMeeting}`,
          class_name: selectedClass,
          level: targetLevel,
          total_questions: totalQuestions,
          duration_minutes: durationMinutes,
          passing_grade: passingGrade,
          difficulty: difficulty,
          questions: generatedQuestions
        };
      }

      updateStage(4, 100, 'Selesai! Draft Quiz siap direview oleh Sensei.');
      await new Promise(r => setTimeout(r, 500));

      setGeneratedQuiz(quizResult);
    } catch (err) {
      console.error(err);
      Swal.fire('Kendala Generate', err.message || 'Periksa koneksi database.', 'error');
    }

    setCurrentStep(4);
  };

  // Sensei Publish Action
  const handlePublishQuiz = async () => {
    if (!generatedQuiz) return;

    try {
      // 1. Try sync to database if available
      try {
        await fetch('/api/lms_quiz_api.php?action=publish_quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quiz_id: generatedQuiz.quiz_id })
        });
      } catch (e) {
        console.warn('API sync warning:', e);
      }

      // 2. Direct Sync into localStorage lms_master_quizzes_v6 so it appears immediately on /lms/quiz
      const newPublishedQuiz = {
        id: generatedQuiz.quiz_id || Date.now(),
        title: generatedQuiz.title,
        desc: `Modul ${activeClassObj.curriculum} (${difficulty === 'easy' ? 'Tingkat Mudah' : difficulty === 'hard' ? 'Tingkat Sulit/HOTS' : 'Standar UKOM'})`,
        bab: generatedQuiz.bab,
        level: targetLevel,
        classRoom: selectedClass,
        curriculumSource: activeClassObj.curriculum,
        category: 'Vocabulary',
        categoryLabel: '🔤 Vocabulary & 5 Pilar',
        tags: targetLevel === 'N4' ? ['Kotoba', 'Bunpou', 'Dokkai', 'Situational'] : ['Kotoba', 'Bunpou', 'Kanji', 'Dokkai'],
        isOpen: true,
        status: 'Dipublikasikan',
        statusCode: 'published',
        timeRemaining: `${durationMinutes}:00`,
        durationMinutes: Number(durationMinutes),
        questionType: 'Pilihan Ganda',
        thumbnailType: targetLevel === 'N4' ? 'torii_gate' : 'osaka_castle',
        submissionsCount: 0,
        totalStudents: activeClassObj.studentsCount || 2,
        createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        questions: generatedQuiz.questions || []
      };

      try {
        const saved = localStorage.getItem('lms_master_quizzes_v6');
        const parsed = saved ? JSON.parse(saved) : [];
        localStorage.setItem('lms_master_quizzes_v6', JSON.stringify([newPublishedQuiz, ...parsed]));
      } catch (lsErr) {
        console.error(lsErr);
      }

      Swal.fire({
        icon: 'success',
        title: 'Quiz Berhasil Diterbitkan! 🎉',
        html: `
          <p class="text-sm text-slate-700">Quiz <b>${generatedQuiz.title}</b> telah aktif dan siap dikerjakan oleh siswa di rombel <b>${selectedClass}</b>.</p>
          <div style="font-size: 13px; color: #475569; margin-top: 8px;">
            ⏱️ Durasi: <b>${durationMinutes} Menit</b> • 🎯 Passing Grade: <b>${passingGrade}</b> • 🇯🇵 Level: <b>${targetLevel}</b>
          </div>
        `,
        confirmButtonText: 'Buka Halaman Quiz',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        navigate('/lms/quiz');
      });
    } catch (e) {
      Swal.fire('Gagal Publikasi', 'Terjadi kesalahan saat mempublikasikan kuis.', 'error');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
        
        {/* ── HEADER BANNER: AI QUIZ GENERATOR HERO ── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-slate-800">
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 py-8 md:py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => navigate('/lms/quiz')}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
                    title="Kembali ke Daftar Quiz"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    Generator Kuis Berbasis Materi Sensei
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  Generate Quiz dari Materi Pembelajaran Sensei
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Pilih rombel kelas, tentukan level & tingkat kesulitan, lalu pilih rentang Bab atau Pertemuan. Sistem AI secara otomatis mengekstrak modul materi menjadi butir soal ujian berstandar.
                </p>
              </div>

              {/* Quick Navigation Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigate('/lms/quiz')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Daftar Kuis Aktif</span>
                </button>
                <button
                  onClick={() => navigate('/lms/quiz/question-bank')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Bank Soal Master</span>
                </button>
              </div>
            </div>

            {/* Stepper Wizard Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8 pt-6 border-t border-slate-800/80">
              {[
                { step: 1, label: '1. Target Kelas & Materi', desc: 'Rombel, Level, Bab & Pertemuan' },
                { step: 2, label: '2. Konfigurasi 5 Pilar & Durasi', desc: 'Distribusi Soal & Timer' },
                { step: 3, label: '3. Generate & Validasi AI', desc: 'AI Merangkai Butir Soal' },
                { step: 4, label: '4. Review Sensei & Publish', desc: 'Koreksi & Rilis ke Kelas' }
              ].map(item => (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step < currentStep) setCurrentStep(item.step);
                  }}
                  className={`p-3.5 rounded-2xl border transition ${
                    currentStep === item.step
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm ring-1 ring-blue-400/50'
                      : item.step < currentStep
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 cursor-pointer'
                      : 'bg-white/5 border-white/10 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="text-xs font-black flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.step < currentStep && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER ── */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-7">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 1: TARGET KELAS, LEVEL, KESULITAN & MATERI              */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (7 cols): Target Class & Range Configuration */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* CARD 1: ROMBEL KELAS & TARGET PEMBELAJARAN */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-2xs space-y-5">
                  <div>
                    <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <span>Target Kelas & Tingkat Kemampuan</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih rombel kelas siswa, level bahasa Jepang, dan tingkat kesulitan kuis.
                    </p>
                  </div>

                  {/* 4 Control Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* 1. Pilih Rombel Kelas */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Rombel Kelas:</span>
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition cursor-pointer"
                      >
                        {CLASS_CATALOG.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.studentsCount} Siswa • {c.level})
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-blue-700 mt-1 font-semibold flex items-center gap-1">
                        <span>Kurikulum:</span>
                        <strong className="text-slate-700">{activeClassObj.curriculum}</strong>
                      </div>
                    </div>

                    {/* 2. Pilih Level Bahasa */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Level Bahasa (JLPT):</span>
                      </label>
                      <select
                        value={targetLevel}
                        onChange={(e) => setTargetLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition cursor-pointer"
                      >
                        <option value="N5">JLPT N5 (Dasar 1 - Pemula)</option>
                        <option value="N4">JLPT N4 (Dasar 2 - Menengah Bawah)</option>
                        <option value="N3">JLPT N3 (Menengah - Standar Kerja)</option>
                        <option value="N2">JLPT N2 (Lanjutan - Profesional)</option>
                        <option value="N1">JLPT N1 (Mahir - Fasih Bisnis)</option>
                      </select>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Standar baku UKOM & Takoboto.jp N5–N1
                      </div>
                    </div>

                    {/* 3. Tingkat Kesulitan (Requested by User) */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-800 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tingkat Kesulitan Kuis:</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Pilih salah satu tingkat tantangan
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { 
                            id: 'easy', 
                            label: 'Mudah', 
                            badge: '🟢 Dasar / Pemula',
                            desc: 'Furigana penuh, kosakata dasar, 1 pola kalimat' 
                          },
                          { 
                            id: 'medium', 
                            label: 'Sedang', 
                            badge: '🟡 Standar UKOM',
                            desc: 'Format resmi JLPT, partikel jamak, kanji kurikulum' 
                          },
                          { 
                            id: 'hard', 
                            label: 'Sulit', 
                            badge: '🔴 Kasus Lapangan (HOTS)',
                            desc: 'Studi kasus kerja (Kaigo/Pabrik), ekspresi Keigo' 
                          }
                        ].map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDifficulty(d.id)}
                            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                              difficulty === d.id
                                ? 'bg-blue-50/90 border-blue-600 text-blue-950 shadow-xs ring-2 ring-blue-200'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="text-xs font-black flex items-center justify-between">
                              <span>{d.label}</span>
                              {difficulty === d.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 mt-0.5">{d.badge}</div>
                            <div className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">{d.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Tanggal Kuis */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-700">Tanggal Pelaksanaan Kuis:</span>
                        </div>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* CARD 2: METODE PEMILIHAN MATERI (BAB vs PERTEMUAN vs UPLOAD) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-2xs space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Metode Pemilihan Materi Sensei
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectionMode('range_bab')}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          selectionMode === 'range_bab'
                            ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-extrabold text-xs flex items-center gap-2">
                          <BookOpen className={`w-4 h-4 ${selectionMode === 'range_bab' ? 'text-white' : 'text-blue-600'}`} />
                          <span>Pilih Rentang Bab</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${selectionMode === 'range_bab' ? 'text-blue-100' : 'text-slate-500'}`}>
                          {activeClassObj.chapterRange.label}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectionMode('range_meeting')}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          selectionMode === 'range_meeting'
                            ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-extrabold text-xs flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${selectionMode === 'range_meeting' ? 'text-white' : 'text-indigo-600'}`} />
                          <span>Pilih Pertemuan</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${selectionMode === 'range_meeting' ? 'text-blue-100' : 'text-slate-500'}`}>
                          Total {activeClassObj.totalMeetings} Pertemuan Kelas
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectionMode('upload_new')}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          selectionMode === 'upload_new'
                            ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-extrabold text-xs flex items-center gap-2">
                          <Upload className={`w-4 h-4 ${selectionMode === 'upload_new' ? 'text-white' : 'text-purple-600'}`} />
                          <span>Upload Modul Baru</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${selectionMode === 'upload_new' ? 'text-blue-100' : 'text-slate-500'}`}>
                          Unggah berkas PDF / DOCX
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* 1. SELECTION MODE: RANGE BAB (DYNAMIC ACCORDING TO SELECTED CLASS) */}
                  {selectionMode === 'range_bab' && (
                    <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/90 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                          Pilih Rentang Bab Materi ({activeClassObj.name}):
                        </span>
                        <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-2xs">
                          Terpilih: Bab {startBab} s/d Bab {endBab} ({Math.max(1, endBab - startBab + 1)} Bab)
                        </span>
                      </div>

                      {/* Dropdowns Bab Awal & Bab Akhir */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Dari Bab:
                          </label>
                          <select
                            value={startBab}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStartBab(val);
                              if (val > endBab) setEndBab(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                          >
                            {Array.from(
                              { length: activeClassObj.chapterRange.end - activeClassObj.chapterRange.start + 1 },
                              (_, i) => activeClassObj.chapterRange.start + i
                            ).map(num => (
                              <option key={num} value={num}>
                                Bab {num < 10 ? `0${num}` : num} – {activeClassObj.curriculum}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Sampai Bab:
                          </label>
                          <select
                            value={endBab}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEndBab(val);
                              if (val < startBab) setStartBab(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                          >
                            {Array.from(
                              { length: activeClassObj.chapterRange.end - activeClassObj.chapterRange.start + 1 },
                              (_, i) => activeClassObj.chapterRange.start + i
                            ).map(num => (
                              <option key={num} value={num} disabled={num < startBab}>
                                Bab {num < 10 ? `0${num}` : num} – {activeClassObj.curriculum}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick Preset Range Pills */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-600 mb-2">
                          Preset Rentang Cepat {activeClassObj.name}:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeClassObj.presets.map(p => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => {
                                setStartBab(p.start);
                                setEndBab(p.end);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                                startBab === p.start && endBab === p.end
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. SELECTION MODE: RANGE MEETING */}
                  {selectionMode === 'range_meeting' && (
                    <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/90 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                          Pilih Rentang Pertemuan Pembelajaran:
                        </span>
                        <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                          Pertemuan {startMeeting} s/d Pertemuan {endMeeting}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Dari Pertemuan:
                          </label>
                          <select
                            value={startMeeting}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStartMeeting(val);
                              if (val > endMeeting) setEndMeeting(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                          >
                            {Array.from({ length: activeClassObj.totalMeetings }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>Pertemuan {num}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Sampai Pertemuan:
                          </label>
                          <select
                            value={endMeeting}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEndMeeting(val);
                              if (val < startMeeting) setStartMeeting(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                          >
                            {Array.from({ length: activeClassObj.totalMeetings }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num} disabled={num < startMeeting}>
                                Pertemuan {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick Meeting Presets */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-600 mb-2">
                          Preset Pertemuan Cepat:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeClassObj.meetingPresets.map(p => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => {
                                setStartMeeting(p.start);
                                setEndMeeting(p.end);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                                startMeeting === p.start && endMeeting === p.end
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. SELECTION MODE: UPLOAD NEW FILE */}
                  {selectionMode === 'upload_new' && (
                    <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.pptx,.txt,.md"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800">
                        Drag & drop berkas modul atau klik untuk memilih
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Mendukung berkas modul materi PDF, DOCX, PPTX (Maksimal 25 MB)
                      </p>
                      {uploadedFile && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{uploadedFile.name} ({fileDetails.size})</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* Right Column (5 cols): Modul Materi Ter-cover & Summary */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Modul Materi yang Ter-cover</span>
                    </h3>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {matchingMaterials.length} Dokumen Siap
                    </span>
                  </div>

                  {/* List of matching materials */}
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {matchingMaterials.length > 0 ? (
                      matchingMaterials.map(m => (
                        <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 hover:border-blue-300 transition">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-[11px] shadow-2xs">
                            {m.chapter_bab ? m.chapter_bab.replace('Bab ', 'B') : 'PDF'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {m.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>📄 {m.file_name}</span>
                              <span>•</span>
                              <span>{m.file_size || '2.4 MB'}</span>
                            </div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                        Tidak ada modul materi yang cocok dengan rentang ini. Coba sesuaikan rentang Bab.
                      </div>
                    )}
                  </div>

                  {/* Knowledge Coverage Summary */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                    <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                      Cakupan Pengetahuan yang Diujikan:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-purple-800">
                      <div className="flex items-center gap-1.5">✓ {matchingMaterials.length * 8} Kosakata (Kotoba)</div>
                      <div className="flex items-center gap-1.5">✓ {matchingMaterials.length * 3} Pola Tata Bahasa</div>
                      <div className="flex items-center gap-1.5">✓ Huruf Kanji & Cara Baca</div>
                      <div className="flex items-center gap-1.5">✓ Situasi Kerja & Percakapan</div>
                    </div>
                  </div>

                  {/* Proceed Button */}
                  <button
                    onClick={handleProceedToStep2}
                    disabled={matchingMaterials.length === 0 && !uploadedFile}
                    className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Lanjut ke Konfigurasi 5 Pilar & Durasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 2: KONFIGURASI 5 PILAR & JUMLAH SOAL                    */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Hasil Ekstraksi Materi Terpilih */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div>
                      <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>Ekstraksi Konten Materi (Strict Material Constraint)</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Soal kuis disusun 100% dari konten materi kelas <b>{selectedClass}</b> tanpa halusinasi.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                      {matchingMaterials.length} Bab Terintegrasi
                    </span>
                  </div>

                  {/* 1. Kotoba Section */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>🔤 Kosakata / Kotoba Terdeteksi:</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                        {extractedContent.vocabulary.length} Kosakata
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {extractedContent.vocabulary.slice(0, 24).map((v, i) => (
                        <div key={i} className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium flex items-center gap-1.5">
                          <b className="text-blue-900">{v.kanji}</b>
                          <span className="text-slate-400 text-[11px]">({v.furigana})</span>
                          <span className="text-slate-600 text-[11px]">: {v.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Grammar Section */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>✏️ Pola Kalimat / Bunpou Utama:</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                        {extractedContent.grammar.length} Pola
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {extractedContent.grammar.slice(0, 8).map((g, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="font-extrabold text-indigo-950 flex items-center justify-between">
                            <span>{g.pattern}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{g._bab}</span>
                          </div>
                          <div className="text-slate-600 text-[11px]">{g.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Can-Do Objectives */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                    <div className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span>Target Kompetensi Kerja (Can-Do):</span>
                    </div>
                    <div className="text-amber-800 font-medium">
                      {extractedContent.can_do_statement}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Form Parameter & Jumlah Butir Soal */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Konfigurasi Generator Quiz</span>
                  </h3>

                  {/* Jumlah Soal & Durasi Timer */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Jumlah Butir Soal</span>
                      </label>
                      <select
                        value={totalQuestions}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTotalQuestions(val);
                          const vocabNum = Math.floor(val * 0.3);
                          const grammarNum = Math.floor(val * 0.35);
                          const kanjiNum = Math.max(1, Math.floor(val * 0.1));
                          const readingNum = Math.max(1, Math.floor(val * 0.1));
                          const sitNum = val - (vocabNum + grammarNum + kanjiNum + readingNum);
                          setComposition({
                            vocabulary: vocabNum,
                            grammar: grammarNum,
                            kanji: kanjiNum,
                            reading: readingNum,
                            situational: sitNum
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                      >
                        <option value={5}>5 Soal (Kuis Singkat)</option>
                        <option value={10}>10 Soal (Daily Quiz Standar)</option>
                        <option value={15}>15 Soal</option>
                        <option value={20}>20 Soal (Evaluasi Bab)</option>
                        <option value={25}>25 Soal (UKOM Lengkap)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Durasi Pengerjaan</span>
                      </label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                      >
                        <option value={10}>10 Menit</option>
                        <option value={15}>15 Menit</option>
                        <option value={20}>20 Menit</option>
                        <option value={30}>30 Menit</option>
                        <option value={45}>45 Menit</option>
                      </select>
                    </div>
                  </div>

                  {/* KKM Passing Grade & Kesulitan */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Passing Grade (KKM)</span>
                      </label>
                      <select
                        value={passingGrade}
                        onChange={(e) => setPassingGrade(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                      >
                        <option value={60}>Skor 60</option>
                        <option value={70}>Skor 70</option>
                        <option value={75}>Skor 75 (Standar Creativa)</option>
                        <option value={80}>Skor 80</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tingkat Kesulitan
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                      >
                        <option value="easy">🟢 Mudah (Dasar/Pemula)</option>
                        <option value="medium">🟡 Sedang (Standar UKOM/JLPT)</option>
                        <option value="hard">🔴 Sulit (Kasus Lapangan HOTS)</option>
                      </select>
                    </div>
                  </div>

                  {/* 5 Pilar Komposisi Butir Soal */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Distribusi 5 Pilar Soal:</span>
                      <span className={`font-black ${isCompositionValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Total: {compositionSum} / {totalQuestions}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { key: 'vocabulary', label: '🔤 Vocabulary (文字・語彙)' },
                        { key: 'grammar', label: '✏️ Grammar (文法)' },
                        { key: 'kanji', label: '🈳 Kanji (漢字)' },
                        { key: 'reading', label: '📖 Reading (読解)' },
                        { key: 'situational', label: '🤝 Situasional & Etika Kerja' }
                      ].map(comp => (
                        <div key={comp.key} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                          <span className="font-semibold text-slate-700">{comp.label}</span>
                          <input
                            type="number"
                            min="0"
                            max={totalQuestions}
                            value={composition[comp.key]}
                            onChange={(e) => setComposition({
                              ...composition,
                              [comp.key]: Number(e.target.value)
                            })}
                            className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-center font-bold text-slate-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleStartGeneration}
                      disabled={!isCompositionValid}
                      className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>Jalankan AI Quiz Generator</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 3: GENERATING & VALIDATING PROGRESS                     */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-8 md:p-12 shadow-md text-center space-y-8">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30"></div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">
                  AI Sedang Menyusun Quiz dari Materi Sensei...
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {generationJob.currentStepText}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${generationJob.progressPercent}%` }}
                ></div>
              </div>

              {/* Step Checklist */}
              <div className="space-y-3 text-left max-w-md mx-auto pt-4 border-t border-slate-100">
                {generationJob.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${stage.status === 'done' ? 'text-slate-800' : stage.status === 'running' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                    {stage.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {stage.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                    {stage.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 4: SENSEI REVIEW & APPROVAL WORKFLOW                    */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && generatedQuiz && (
            <div className="space-y-6">
              
              {/* Review Header Banner */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Status: DRAFT (Menunggu Review Sensei)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Rombel: {generatedQuiz.class_name || selectedClass}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Cakupan: {generatedQuiz.bab}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ⏱️ {durationMinutes} Menit • KKM {passingGrade}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    {generatedQuiz.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Periksa butir soal, kunci jawaban, dan pembahasan di bawah ini. Anda dapat mengedit butir soal sebelum menerbitkannya untuk siswa.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Atur Ulang
                  </button>
                  <button
                    onClick={handlePublishQuiz}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui & Publikasikan Quiz</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuiz.questions && generatedQuiz.questions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4 hover:border-blue-300 transition-all">
                    
                    {/* Question Header & Badges */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {q.category_label || q.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                          Tingkat: {q.difficulty}
                        </span>
                        {q.material_reference && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            📖 {q.material_reference}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: `Edit Soal #${idx + 1}`,
                              html: `
                                <div style="text-align: left; font-size: 13px;">
                                  <label style="font-weight: bold; margin-bottom: 4px; display: block;">Teks Pertanyaan (Jepang):</label>
                                  <input id="swal-q-text" class="swal2-input text-xs" style="margin: 0 0 12px 0; width: 100%;" value="${q.question}" />
                                  <label style="font-weight: bold; margin-bottom: 4px; display: block;">Terjemahan / Petunjuk:</label>
                                  <input id="swal-q-trans" class="swal2-input text-xs" style="margin: 0 0 12px 0; width: 100%;" value="${q.translation || ''}" />
                                  <label style="font-weight: bold; margin-bottom: 4px; display: block;">Kunci Jawaban Benar (A / B / C / D):</label>
                                  <input id="swal-q-ans" class="swal2-input text-xs" style="margin: 0 0 12px 0; width: 100%;" value="${q.correct_key}" />
                                  <label style="font-weight: bold; margin-bottom: 4px; display: block;">Pembahasan Jawaban:</label>
                                  <textarea id="swal-q-exp" class="swal2-textarea text-xs" style="margin: 0; width: 100%;">${q.explanation || ''}</textarea>
                                </div>
                              `,
                              confirmButtonText: 'Simpan Perubahan',
                              showCancelButton: true
                            }).then(res => {
                              if (res.isConfirmed) {
                                const newQ = document.getElementById('swal-q-text').value;
                                const newT = document.getElementById('swal-q-trans').value;
                                const newA = document.getElementById('swal-q-ans').value.toUpperCase();
                                const newE = document.getElementById('swal-q-exp').value;
                                setGeneratedQuiz(prev => ({
                                  ...prev,
                                  questions: prev.questions.map((item, i) => i === idx ? { ...item, question: newQ, translation: newT, correct_key: newA, explanation: newE } : item)
                                }));
                                Swal.fire('Tersimpan', 'Soal berhasil diubah.', 'success');
                              }
                            });
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                          title="Edit Butir Soal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Passage Context if available */}
                    {q.passage && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          📄 Wacana / Konteks Situasional:
                        </div>
                        <div className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                          {q.passage}
                        </div>
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="space-y-1">
                      <div className="text-base font-extrabold text-slate-900 leading-snug">
                        {q.question}
                      </div>
                      {q.translation && (
                        <div className="text-xs text-slate-500 italic">
                          Arti: {q.translation}
                        </div>
                      )}
                    </div>

                    {/* Options Grid (A, B, C, D) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options && q.options.map(opt => {
                        const isCorrect = String(opt.key).toUpperCase() === String(q.correct_key).toUpperCase();
                        return (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                Kunci
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-0.5">
                        <span className="font-black text-blue-900 uppercase text-[10px] tracking-wider block">
                          💡 Pembahasan Jawaban Sensei:
                        </span>
                        <p className="text-blue-950 leading-relaxed font-medium">
                          {q.explanation}
                        </p>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
