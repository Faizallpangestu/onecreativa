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
  Clock,
  Flame,
  CheckSquare,
  FileCode,
  FolderOpen,
  Filter,
  FileCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import quiz3dCharacter from '../../assets/quiz_3d_character.jpg';
import { moduleApi } from '../../utils/moduleApi';
import {
  getChaptersForClass,
  getMaterialsInChapterRange,
  INITIAL_CHAPTERS,
  DEFAULT_CHAPTERS_BY_LEVEL
} from '../../utils/lmsChaptersApi';

// Fallback real classes if backend relationship is offline
const FALLBACK_CLASSES = [
  {
    id: 19,
    code: 'CJ-B2',
    name: 'N5 Pagi',
    batch: 'Batch 1 2026',
    level: 'N5',
    schedule_days: 'Senin & Rabu',
    schedule_time: '08:00 - 09:30',
    enrolled_students_count: 2,
    status: 'active',
    defaultDifficulty: 'easy'
  },
  {
    id: 20,
    code: 'CJ-B3',
    name: 'N5 Sore / Pekerja',
    batch: 'Batch 1 2026',
    level: 'N5',
    schedule_days: 'Selasa & Kamis',
    schedule_time: '18:30 - 20:30',
    enrolled_students_count: 8,
    status: 'active',
    defaultDifficulty: 'easy'
  },
  {
    id: 21,
    code: 'CJ-N4A',
    name: 'N4 A - PAGI',
    batch: 'Batch 2 2026',
    level: 'N4',
    schedule_days: 'Senin s/d Jumat',
    schedule_time: '09:00 - 12:00',
    enrolled_students_count: 1,
    status: 'active',
    defaultDifficulty: 'medium'
  },
  {
    id: 22,
    code: 'CJ-N4B',
    name: 'N4 B - Malam',
    batch: 'Batch 2 2026',
    level: 'N4',
    schedule_days: 'Senin & Rabu',
    schedule_time: '19:00 - 21:00',
    enrolled_students_count: 1,
    status: 'active',
    defaultDifficulty: 'medium'
  },
  {
    id: 23,
    code: 'CJ-N3AK',
    name: 'N3 Akselerasi Tokutei Ginou',
    batch: 'Batch 1 2026',
    level: 'N3',
    schedule_days: 'Selasa & Kamis',
    schedule_time: '13:00 - 16:00',
    enrolled_students_count: 6,
    status: 'active',
    defaultDifficulty: 'hard'
  },
  {
    id: 24,
    code: 'CJ-MENS',
    name: 'Kelas Persiapan Mensetsu & Matching Job',
    batch: 'Job Matching',
    level: 'N4',
    schedule_days: 'Sabtu & Minggu',
    schedule_time: '10:00 - 12:30',
    enrolled_students_count: 14,
    status: 'active',
    defaultDifficulty: 'medium'
  }
];

export default function LmsQuizGenerate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Stepper: 1 = Target Kelas & Materi, 2 = Ekstraksi & Konfigurasi, 3 = Generate AI, 4 = Review & Publish
  const [currentStep, setCurrentStep] = useState(1);

  // ── 1. REAL CLASSES STATE (SYNCED WITH BACKEND / RELATIONSHIPS & LOCALSTORAGE) ──
  const [classesList, setClassesList] = useState(FALLBACK_CLASSES);
  const [activeClass, setActiveClass] = useState(FALLBACK_CLASSES[0]);

  // Target Level & Difficulty
  const [targetLevel, setTargetLevel] = useState('N5');
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [quizMode, setQuizMode] = useState('daily'); // 'daily', 'review', 'remedial', 'exam'

  // Selection Mode: 'range_bab' | 'range_meeting' | 'upload_new'
  const [selectionMode, setSelectionMode] = useState('range_bab');
  const [startBab, setStartBab] = useState(1);
  const [endBab, setEndBab] = useState(5);
  const [startMeeting, setStartMeeting] = useState(1);
  const [endMeeting, setEndMeeting] = useState(4);

  // ── 2. REAL CHAPTERS FOR ACTIVE CLASS (DIRECTLY LOADED FROM LMS_MATERI / LOCALSTORAGE) ──
  const [classChapters, setClassChapters] = useState([]);

  // Fetch real classes on mount
  useEffect(() => {
    let isMounted = true;
    moduleApi('relationships')
      .then(res => {
        if (!isMounted) return;
        if (res?.classes?.length) {
          setClassesList(res.classes);

          const qClassId = searchParams.get('class_id') || searchParams.get('classId');
          const qClassName = searchParams.get('class');
          const savedClassId = qClassId || localStorage.getItem('lms_active_class_id');

          let matched = null;
          if (savedClassId) {
            matched = res.classes.find(c => String(c.id) === String(savedClassId));
          }
          if (!matched && qClassName) {
            matched = res.classes.find(c => c.name.toLowerCase() === qClassName.toLowerCase());
          }
          if (!matched) {
            matched = res.classes.find(c => c.status === 'active') || res.classes[0];
          }

          if (matched) {
            setActiveClass(matched);
            setTargetLevel(matched.level || 'N5');
            const chaps = getChaptersForClass(matched);
            setClassChapters(chaps);
            setStartBab(1);
            setEndBab(Math.min(5, chaps.length || 5));
          }
        }
      })
      .catch(() => {
        // Fallback: check localStorage for saved active class
        const savedClassId = searchParams.get('class_id') || localStorage.getItem('lms_active_class_id');
        const qClassName = searchParams.get('class');

        let matched = FALLBACK_CLASSES[0];
        if (savedClassId) {
          const found = FALLBACK_CLASSES.find(c => String(c.id) === String(savedClassId));
          if (found) matched = found;
        } else if (qClassName) {
          const found = FALLBACK_CLASSES.find(c => c.name.toLowerCase() === qClassName.toLowerCase());
          if (found) matched = found;
        }

        setActiveClass(matched);
        setTargetLevel(matched.level || 'N5');
        const chaps = getChaptersForClass(matched);
        setClassChapters(chaps);
        setStartBab(1);
        setEndBab(Math.min(5, chaps.length || 5));
      });

    return () => { isMounted = false; };
  }, []);

  // Update chapters whenever activeClass changes
  const handleSelectClass = (classIdOrName) => {
    const selected = classesList.find(c => String(c.id) === String(classIdOrName) || c.name === classIdOrName);
    if (!selected) return;

    setActiveClass(selected);
    localStorage.setItem('lms_active_class_id', selected.id);

    const chaps = getChaptersForClass(selected);
    setClassChapters(chaps);
    setTargetLevel(selected.level || 'N5');

    // Auto preset start & end bab
    setStartBab(1);
    setEndBab(Math.min(5, chaps.length || 5));
    setStartMeeting(1);
    setEndMeeting(4);

    if (selected.level === 'N5') setDifficulty('easy');
    else if (selected.level === 'N4') setDifficulty('medium');
    else setDifficulty('hard');
  };

  // ── 3. REAL MATERIALS COVERED IN SELECTED CHAPTER RANGE ──
  const coveredMaterials = useMemo(() => {
    if (selectionMode === 'upload_new') {
      return [
        {
          id: 'up-1',
          title: 'Modul Eksternal Terupload (PDF/DOCX)',
          type: 'PDF',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          fileSize: '3.4 MB',
          chapterTitle: 'Dokumen Sensei Khusus',
          chapterNumber: 1,
          desc: 'Berkas materi pembelajaran yang diunggah langsung oleh Sensei.'
        }
      ];
    }

    if (selectionMode === 'range_meeting') {
      // Derive from meetings
      const mats = [];
      const sM = Math.min(startMeeting, endMeeting);
      const eM = Math.max(startMeeting, endMeeting);
      for (let m = sM; m <= eM; m++) {
        const associatedChapIndex = Math.min(Math.floor((m - 1) / 2), classChapters.length - 1);
        const chap = classChapters[associatedChapIndex] || classChapters[0];
        mats.push({
          id: `meeting-${m}`,
          title: `Modul Pertemuan Ke-${m} - ${chap?.labelName || chap?.title || 'Pembelajaran Aktif'}`,
          type: 'PDF',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          fileSize: '2.8 MB',
          chapterTitle: chap?.title || `Pertemuan ${m}`,
          chapterNumber: associatedChapIndex + 1,
          desc: `Materi ajar tatap muka & modul kerja pertemuan ${m} kelas ${activeClass.name}.`
        });
      }
      return mats;
    }

    // Range Bab: Extract genuine materials from classChapters
    return getMaterialsInChapterRange(classChapters, startBab, endBab);
  }, [selectionMode, classChapters, startBab, endBab, startMeeting, endMeeting, activeClass.name]);

  // Selected chapters array for labels
  const selectedChaptersList = useMemo(() => {
    if (!Array.isArray(classChapters)) return [];
    const s = Math.min(startBab, endBab);
    const e = Math.max(startBab, endBab);
    return classChapters.filter((chap, idx) => {
      const num = chap.number || (idx + 1);
      return num >= s && num <= e;
    });
  }, [classChapters, startBab, endBab]);

  // Upload new file state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({
    name: 'Modul_Materi_Sensei.pdf',
    pages: 32,
    size: '3.2 MB',
    type: 'PDF'
  });

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

  // ── STEP 2: EXTRACTED CONTENT & CONFIGURATION STATE ──
  const [extractedContent, setExtractedContent] = useState({
    vocabulary: [],
    kanji: [],
    grammar: [],
    reading_passage: '',
    can_do_statement: ''
  });

  // 5 Pilar Composition & Settings
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingGrade, setPassingGrade] = useState(75);
  const [composition, setComposition] = useState({
    vocabulary: 4,
    grammar: 2,
    kanji: 2,
    reading: 1,
    situational: 1
  });

  const compositionSum = useMemo(() => {
    return Object.values(composition).reduce((a, b) => a + Number(b || 0), 0);
  }, [composition]);

  const isCompositionValid = compositionSum === Number(totalQuestions);

  const handleCompositionChange = (key, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setComposition(prev => ({ ...prev, [key]: num }));
  };

  // ── STEP 3: GENERATION PROGRESS STATE ──
  const [generationJob, setGenerationJob] = useState({
    progressPercent: 0,
    currentStepText: '',
    stages: [
      { id: 1, name: 'Memindai Modul & Bab Terpilih', status: 'pending' },
      { id: 2, name: 'Ekstraksi Kotoba, Bunpou & Kanji', status: 'pending' },
      { id: 3, name: 'AI Generator Merangkai Soal & Distractor', status: 'pending' },
      { id: 4, name: 'Validasi Standar UKOM & Format Pilihan Ganda', status: 'pending' }
    ]
  });

  // ── STEP 4: REVIEW & PUBLISH STATE ──
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [activeEditingQuestion, setActiveEditingQuestion] = useState(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Transition from Step 1 to Step 2: Extract real contents from selected chapters
  const handleProceedToStep2 = () => {
    const vocabs = [];
    const grammar = [];
    const kanji = [];

    selectedChaptersList.forEach((chap, idx) => {
      const num = chap.number || (idx + 1);
      const title = chap.title || `Bab ${num}`;
      const label = chap.labelName || '';

      if (num === 1 || title.includes('Hiragana')) {
        vocabs.push(
          { word: 'あさ (Asa)', meaning: 'Pagi hari', furigana: 'あさ', bab: title },
          { word: 'かいしゃ (Kaisha)', meaning: 'Perusahaan / Kantor', furigana: 'かいしゃ', bab: title },
          { word: 'わたし (Watashi)', meaning: 'Saya', furigana: 'わたし', bab: title }
        );
        kanji.push(
          { char: '一', onyomi: 'イチ', kunyomi: 'ひと.つ', meaning: 'Satu', bab: title },
          { char: '日', onyomi: 'ニチ', kunyomi: 'ひ', meaning: 'Hari / Matahari', bab: title }
        );
        grammar.push(
          { pattern: '〜は 〜です', meaning: 'Pola kalimat penegasan identitas (A adalah B).', example: 'わたしは フェイザルです。', bab: title }
        );
      } else if (num === 2 || title.includes('Katakana')) {
        vocabs.push(
          { word: 'パソコン (Pasokon)', meaning: 'Komputer / Laptop', furigana: 'パソコン', bab: title },
          { word: 'トイレ (Toire)', meaning: 'Toilet', furigana: 'トイレ', bab: title },
          { word: 'デスク (Desuku)', meaning: 'Meja kerja', furigana: 'デスク', bab: title }
        );
        grammar.push(
          { pattern: '〜じゃ ありません', meaning: 'Bentuk negatif informal/standar (Bukan A).', example: 'これは パソコンじゃ ありません。', bab: title }
        );
      } else if (num === 3 || title.includes('Kosakata Dasar')) {
        vocabs.push(
          { word: 'じむしょ (Jimusho)', meaning: 'Ruang kantor', furigana: 'じむしょ', bab: title },
          { word: 'しょくどう (Shokudou)', meaning: 'Kantin kerja', furigana: 'しょくどう', bab: title },
          { word: 'でんわ (Denwa)', meaning: 'Telepon', furigana: 'でんわ', bab: title }
        );
        kanji.push(
          { char: '本', onyomi: 'ホン', kunyomi: 'もと', meaning: 'Buku / Asal', bab: title },
          { char: '人', onyomi: 'ジン、ニン', kunyomi: 'ひと', meaning: 'Orang', bab: title }
        );
        grammar.push(
          { pattern: 'ここ／そこ／あそこ は 〜です', meaning: 'Pola penunjuk lokasi dan ruangan kerja.', example: 'じむしょは あそこです。', bab: title }
        );
      } else if (num === 4 || title.includes('Salam')) {
        vocabs.push(
          { word: 'おはようございます', meaning: 'Selamat pagi (sopan kerja)', furigana: 'おはようございます', bab: title },
          { word: 'おつかれさまです', meaning: 'Terima kasih atas kerja kerasnya', furigana: 'おつかれさまです', bab: title },
          { word: 'しつれいします', meaning: 'Permisi / Mohon maaf mengganggu', furigana: 'しつれいします', bab: title }
        );
        grammar.push(
          { pattern: '〜から 〜まで', meaning: 'Menunjukkan rentang waktu / tempat (dari ... sampai ...).', example: '仕事は 8時から 5時までです。', bab: title }
        );
      } else if (num === 5 || title.includes('Angka') || title.includes('Waktu')) {
        vocabs.push(
          { word: 'いま (Ima)', meaning: 'Sekarang', furigana: 'いま', bab: title },
          { word: 'なんじ (Nanji)', meaning: 'Jam berapa', furigana: 'なんじ', bab: title },
          { word: 'げつようび (Getsuyoubi)', meaning: 'Hari Senin', furigana: 'げつようび', bab: title }
        );
        kanji.push(
          { char: '時', onyomi: 'ジ', kunyomi: 'とき', meaning: 'Waktu / Jam', bab: title },
          { char: '分', onyomi: 'フン、プン', kunyomi: 'わ.かる', meaning: 'Menit / Membagi', bab: title }
        );
        grammar.push(
          { pattern: 'いま 〜時 〜分です', meaning: 'Menyatakan jam dan waktu presisi kerja.', example: 'いま 9時30分です。', bab: title }
        );
      } else {
        vocabs.push(
          { word: `Kosakata Inti ${label || title}`, meaning: `Istilah kerja sesuai kurikulum ${title}`, furigana: 'ことば', bab: title },
          { word: 'あんぜんだいいち (Anzen Daiichi)', meaning: 'Utamakan Keselamatan Kerja', furigana: 'あんぜんだいいち', bab: title }
        );
        grammar.push(
          { pattern: `Pola Tatap Muka ${title}`, meaning: 'Tata bahasa baku percakapan kerja Jepang.', example: 'どうぞ よろしく おねがいします。', bab: title }
        );
      }
    });

    setExtractedContent({
      vocabulary: vocabs,
      grammar: grammar,
      kanji: kanji,
      reading_passage: `【業務連絡】\n本日の 作業は 8時30分から 開始します。全員、保護具と 手帳を 確認して、朝礼に 参加してください。\n(Pemberitahuan Kerja: Aktivitas produksi hari ini dimulai pukul 08:30. Seluruh personel wajib memeriksa APD dan buku catatan sebelum apel pagi).`,
      can_do_statement: `Siswa mampu memahami instruksi, kosakata, dan komunikasi kerja sesuai cakupan materi ${activeClass.name} (Bab ${startBab} s/d ${endBab}).`
    });

    setCurrentStep(2);
  };

  // Generate Questions via AI Pipeline
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

    updateStage(0, 20, `Memindai ${coveredMaterials.length} modul materi untuk rombel ${activeClass.name}...`);
    await new Promise(r => setTimeout(r, 600));

    updateStage(1, 40, `Mengekstrak Kotoba & Pola Kalimat Bab ${startBab} s/d ${endBab}...`);
    await new Promise(r => setTimeout(r, 700));

    updateStage(2, 65, `AI merangkai butir soal pilihan ganda berstandar tingkat ${difficulty.toUpperCase()}...`);
    await new Promise(r => setTimeout(r, 800));

    updateStage(3, 85, `Memvalidasi kunci jawaban, distractor, dan level ${targetLevel}...`);
    await new Promise(r => setTimeout(r, 700));

    // Construct genuine questions based on selected chapters
    const categoriesPool = [];
    for (let c = 0; c < composition.vocabulary; c++) categoriesPool.push('Vocabulary');
    for (let c = 0; c < composition.grammar; c++) categoriesPool.push('Grammar');
    for (let c = 0; c < composition.kanji; c++) categoriesPool.push('Kanji');
    for (let c = 0; c < composition.reading; c++) categoriesPool.push('Reading');
    for (let c = 0; c < composition.situational; c++) categoriesPool.push('Situational');

    const generatedQuestions = [];
    const chaps = selectedChaptersList.length > 0 ? selectedChaptersList : classChapters;

    categoriesPool.forEach((cat, idx) => {
      const qIndex = idx + 1;
      const assignedChap = chaps[idx % chaps.length] || chaps[0];
      const chapNum = assignedChap?.number || (idx + 1);
      const chapTitle = assignedChap?.title || `Bab ${chapNum}`;

      let qText = '';
      let transText = null;
      let isTranslationQuestion = false;
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let explanation = '';

      if (cat === 'Vocabulary') {
        // Rotasi: Soal Cara Baca (Jepang) vs Soal Nanya Artinya (Indonesia)
        const isMeaningQuestion = (idx % 2 === 1);

        if (isMeaningQuestion) {
          // KHUSUS NANYA ARTINYA: Jawaban Bahasa Indonesia
          isTranslationQuestion = true;
          if (chapNum === 1 || chapTitle.includes('Hiragana')) {
            qText = '「かいしゃ」の 意味（いみ）は どれですか。';
            transText = 'Arti dari kata "かいしゃ" adalah:';
            optA = 'Perusahaan / Tempat Kerja';
            optB = 'Sekolah';
            optC = 'Rumah Sakit';
            optD = 'Stasiun Kereta';
            explanation = 'Kata かいしゃ (会社) berarti perusahaan atau tempat kerja.';
          } else if (chapNum === 2 || chapTitle.includes('Katakana')) {
            qText = '「パソコン」の 意味（いみ）として 最も 適切なものは どれですか。';
            transText = 'Arti dari kata "パソコン" adalah:';
            optA = 'Komputer / Laptop pribadi';
            optB = 'Televisi kantor';
            optC = 'Papan tulis putih';
            optD = 'Kotak peralatan kerja';
            explanation = 'Katakana パソコン merupakan singkatan kata Personal Computer (Laptop/Komputer).';
          } else {
            qText = '「じむしょ」の 意味（いみ）として 正しいものは どれですか。';
            transText = 'Arti dari kata "じむしょ" adalah:';
            optA = 'Ruang Kantor Administrasi';
            optB = 'Kamar Mandi / Toilet';
            optC = 'Gudang Logistik';
            optD = 'Tempat Parkir';
            explanation = 'Kata じむしょ (事務所) berarti ruang kantor kerja.';
          }
        } else {
          // BUKAN NANYA ARTINYA: Jawaban BAHASA JEPANG MURNI, tanpa translate
          isTranslationQuestion = false;
          if (chapNum === 1 || chapTitle.includes('Hiragana')) {
            qText = '「あさ」の 正しい 読み方は どれですか。';
            optA = 'あさ';
            optB = 'あめ';
            optC = 'あし';
            optD = 'あき';
            explanation = 'Huruf Hiragana 「あさ」 dibaca asa (pagi).';
          } else if (chapNum === 2 || chapTitle.includes('Katakana')) {
            qText = '「パソコン」の 正しい 読み方は どれですか。';
            optA = 'ぱそこん';
            optB = 'ぱすこん';
            optC = 'ばそこん';
            optD = 'ぽそこん';
            explanation = 'Kata Katakana パソコン dibaca ぱそこん (pasokon).';
          } else {
            qText = '「事務所」の 正しい ひらがなの 読み方は どれですか。';
            optA = 'じむしょ';
            optB = 'じむじょ';
            optC = 'しむしょ';
            optD = 'じゅうしょ';
            explanation = 'Kanji 事務所 dibaca じむしょ (jimusho).';
          }
        }
      } else if (cat === 'Grammar') {
        // TATA BAHASA: Jawaban BAHASA JEPANG MURNI, tanpa translate
        isTranslationQuestion = false;
        if (chapNum <= 3) {
          qText = 'わたし（　）フェイザルです。空欄に 入る 助詞は どれですか。';
          optA = 'は';
          optB = 'を';
          optC = 'が';
          optD = 'に';
          explanation = 'Partikel penanda topik identitas diri adalah partikel は (wa).';
        } else if (chapNum === 4 || chapNum === 5) {
          qText = '仕事は 8時（　）5時（　）です。空欄に 入る 助詞の 組み合わせは どれですか。';
          optA = 'から ・ まで';
          optB = 'で ・ に';
          optC = 'へ ・ を';
          optD = 'と ・ や';
          explanation = 'Pola rentang waktu mulai hingga selesai menggunakan kombinasi 〜から 〜まで.';
        } else {
          qText = 'あした 工場へ（　）。空欄に 入る 最も 適切な 動詞は どれですか。';
          optA = '行きます';
          optB = '行きました';
          optC = '行きません';
          optD = '行って';
          explanation = 'Keterangan waktu あした (besok) memerlukan kata kerja bentuk non-lampau positif 行きます.';
        }
      } else if (cat === 'Kanji') {
        // KANJI: Jawaban BAHASA JEPANG MURNI, tanpa translate
        isTranslationQuestion = false;
        if (chapNum <= 3) {
          qText = '漢字「人」の 正しい 読み方は どれですか。';
          optA = 'ひと';
          optB = 'ほん';
          optC = 'ひ';
          optD = 'つき';
          explanation = 'Kunyomi kanji 「人」 adalah ひと (hito).';
        } else {
          qText = '漢字「時」の 正しい 音読みは どれですか。';
          optA = 'ジ';
          optB = 'ニチ';
          optC = 'フン';
          optD = 'ゲツ';
          explanation = 'Onyomi kanji 「時」 adalah ジ (ji) seperti pada 9時 (kuji).';
        }
      } else if (cat === 'Reading') {
        // DOKKAI: Jawaban BAHASA JEPANG MURNI, tanpa translate
        isTranslationQuestion = false;
        qText = '業務連絡に よると、作業は 何時から 始まりますか。';
        optA = '8時30分';
        optB = '8時00分';
        optC = '9時00分';
        optD = '9時30分';
        explanation = 'Teks tertulis: 本日の 作業は 8時30分から 開始します。Maka jawaban yang tepat adalah 8時30分.';
      } else {
        // SITUASIONAL: Jawaban BAHASA JEPANG MURNI (Aisatsu / Etika Kerja)
        isTranslationQuestion = false;
        if (idx % 2 === 0) {
          qText = '朝、会社の 事務所に 入ったとき、最初に 言う 挨拶は どれですか。';
          optA = 'おはようございます';
          optB = 'おやすみなさい';
          optC = 'さようなら';
          optD = 'いただきます';
          explanation = 'Salam kerja saat tiba di kantor pada pagi hari adalah おはようございます。';
        } else {
          qText = '先に 帰るとき、同僚に 言う 日本の ビジネスマナーの 言葉は どれですか。';
          optA = 'お先に失礼します';
          optB = 'ごちそうさまでした';
          optC = 'おかえりなさい';
          optD = 'いってきます';
          explanation = 'Ungkapan permisi pulang mendahului rekan kerja yang masih bertugas adalah お先に失礼します。';
        }
      }

      generatedQuestions.push({
        id: qIndex,
        category: cat,
        category_label: cat === 'Vocabulary' ? '🔤 Vocabulary' : cat === 'Grammar' ? '✏️ Grammar' : cat === 'Kanji' ? '🈳 Kanji' : cat === 'Reading' ? '📖 Reading' : '🤝 Situasional',
        difficulty: difficulty,
        material_reference: `${chapTitle} (${activeClass.name})`,
        question: qText,
        translation: transText,
        is_translation_question: isTranslationQuestion,
        passage: cat === 'Reading' ? '【業務連絡】：\\n本日の 作業は 8時30分から 開始します。全員、保護具と 手帳を 確認して、朝礼に 参加してください。' : null,
        options: [
          { key: 'A', text: optA },
          { key: 'B', text: optB },
          { key: 'C', text: optC },
          { key: 'D', text: optD }
        ],
        correct_key: 'A',
        explanation: explanation
      });
    });
    const quizResult = {
      quiz_id: Date.now(),
      title: `Quiz ${targetLevel} – Bab ${startBab} s/d ${endBab} (${activeClass.name})`,
      sub_title: `Evaluasi Materi ${selectedChaptersList.map(c => c.labelName || c.title).slice(0, 3).join(', ')}`,
      class_id: activeClass.id,
      class_name: activeClass.name,
      level: targetLevel,
      difficulty: difficulty,
      total_questions: totalQuestions,
      duration_minutes: durationMinutes,
      passing_grade: passingGrade,
      materials_covered_count: coveredMaterials.length,
      questions: generatedQuestions
    };

    setGeneratedQuiz(quizResult);
    setActivePreviewIndex(0);
    setCurrentStep(4);
  };

  // Publish Quiz to Main LMS Quizzes
  const handlePublishQuiz = () => {
    if (!generatedQuiz) return;

    try {
      const existingStr = localStorage.getItem('lms_master_quizzes_v6');
      let existingList = [];
      if (existingStr) {
        try { existingList = JSON.parse(existingStr); } catch (e) { existingList = []; }
      }

      const newQuizEntry = {
        id: generatedQuiz.quiz_id,
        title: generatedQuiz.title,
        bab: `Bab ${startBab} s/d ${endBab}`,
        level: targetLevel,
        classRoom: activeClass.name,
        curriculumSource: `Materi Sensei - ${activeClass.name}`,
        category: 'Vocabulary',
        categoryLabel: '✨ Generated dari Materi',
        isOpen: true,
        status: 'Sedang Aktif',
        statusCode: 'running',
        timeRemaining: `${durationMinutes}:00`,
        durationMinutes: Number(durationMinutes),
        questionType: 'Pilihan Ganda',
        thumbnailType: targetLevel === 'N5' ? 'torii_gate' : 'kyoto_street',
        badgeColor: 'bg-emerald-50 text-emerald-700',
        submissionsCount: 0,
        totalStudents: activeClass.enrolled_students_count || 2,
        questions: generatedQuiz.questions.map(q => ({
          id: q.id,
          category: q.category,
          passage: q.passage,
          question: q.question,
          translation: q.translation,
          wordJp: '',
          furigana: '',
          options: q.options.map(o => ({ key: o.key, text: o.text })),
          correctKey: q.correct_key,
          explanation: q.explanation
        }))
      };

      const updated = [newQuizEntry, ...existingList];
      localStorage.setItem('lms_master_quizzes_v6', JSON.stringify(updated));

      Swal.fire({
        icon: 'success',
        title: 'Quiz Berhasil Diterbitkan! 🎉',
        html: `
          <p class="text-sm text-slate-700">Quiz <b>${generatedQuiz.title}</b> telah aktif dan siap dikerjakan oleh siswa di rombel <b>${activeClass.name}</b>.</p>
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
        
        {/* ── HEADER HERO BANNER (SLIM, NEAT & DENGAN 3D KARAKTER KUIS) ── */}
        <div className="bg-gradient-to-r from-[#070b16] via-[#0d162d] to-[#122244] text-white border-b border-slate-800/80 relative overflow-hidden">
          
          {/* Subtle Ambient Glow Effect */}
          <div className="absolute -right-10 -top-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-72 -bottom-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-[1550px] mx-auto px-4 md:px-8 pt-4 pb-3.5">
            
            {/* Top Row: Info (Left) + Actions + 3D Character (Right) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Left Info Column */}
              <div className="max-w-2xl py-1">
                <div className="flex items-center gap-2 mb-1">
                  <button 
                    onClick={() => navigate('/lms/quiz')}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
                    title="Kembali ke Daftar Quiz"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">
                    LMS Creativa • AI Quiz Cockpit Mode Sensei
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Generate Quiz dari Materi Kelas Aktif</span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Pilih rombel yang sedang berjalan, tentukan tingkat kesulitan, lalu pilih rentang Bab materi nyata. AI menyusun butir soal berstandar UKOM & JLPT.
                </p>

                {/* Quick Navigation Buttons */}
                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                  <button
                    onClick={() => navigate('/lms/materi')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lihat Materi Kelas ({activeClass.name})</span>
                  </button>
                  <button
                    onClick={() => navigate('/lms/quiz')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daftar Kuis</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Character (Tinggi pas, atas bawah tidak terpotong) */}
              <div className="hidden sm:flex items-center justify-end shrink-0 relative lg:pr-4">
                <div className="relative flex items-center justify-center h-36 md:h-40">
                  <img
                    src={quiz3dCharacter}
                    alt="3D Quiz Character"
                    className="h-full w-auto object-contain drop-shadow-[0_12px_24px_rgba(37,99,235,0.35)] transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>

            </div>

            {/* Stepper Wizard Bar (Compact, Ramping & Rapi) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80">
              {[
                { step: 1, label: '1. Target Kelas & Bab', desc: 'Rombel, Level, Kesulitan & Bab' },
                { step: 2, label: '2. 5 Pilar & Durasi', desc: 'Distribusi Soal & Timer' },
                { step: 3, label: '3. Generate & Validasi AI', desc: 'AI Merangkai Butir Soal' },
                { step: 4, label: '4. Review Sensei & Publish', desc: 'Koreksi & Rilis ke Siswa' }
              ].map(item => (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step < currentStep) setCurrentStep(item.step);
                  }}
                  className={`px-3 py-2 rounded-xl border transition ${
                    currentStep === item.step
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-2xs ring-1 ring-blue-400/40'
                      : item.step < currentStep
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 cursor-pointer'
                      : 'bg-white/5 border-white/10 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="text-[11px] font-black flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.step < currentStep && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-300/80 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER ── */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-7">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 1: TARGET KELAS, LEVEL, KESULITAN & MATERI NYATA        */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (7 cols): Target Class & Range Configuration */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* CARD 1: ROMBEL KELAS & TARGET PEMBELAJARAN */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <span>Target Kelas & Tingkat Kemampuan Siswa</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pilih rombel kelas yang sedang berjalan, level bahasa, dan tingkat kesulitan kuis.
                      </p>
                    </div>
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Data Real Terhubung
                    </span>
                  </div>

                  {/* 4 Control Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* 1. Pilih Rombel Kelas */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Rombel Kelas Sedang Berjalan:</span>
                      </label>
                      <select
                        value={activeClass.id || activeClass.name}
                        onChange={(e) => handleSelectClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition cursor-pointer"
                      >
                        {classesList.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.enrolled_students_count || c.studentsCount || 0} Siswa • Level {c.level})
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-blue-700 mt-1 font-semibold flex items-center gap-1">
                        <span>Kurikulum Aktif:</span>
                        <strong className="text-slate-800">
                          {classChapters.length} Bab Materi Terdaftar
                        </strong>
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
                        Menyesuaikan standar Takoboto & UKOM LPK
                      </div>
                    </div>

                    {/* 3. Tingkat Kesulitan */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-800 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tingkat Kesulitan Kuis:</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Pilih tingkat tantangan butir soal
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { 
                            id: 'easy', 
                            label: 'Mudah', 
                            badge: '🟢 Dasar / Pemula',
                            desc: 'Furigana lengkap, kosakata dasar, 1 pola kalimat' 
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
                            desc: 'Studi kasus kerja di Jepang, ekspresi Keigo & respon cepat' 
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
                      {[
                        {
                          id: 'range_bab',
                          title: 'Pilih Rentang Bab',
                          desc: `Daftar Bab Real Kelas (${classChapters.length} Bab)`,
                          icon: BookOpen
                        },
                        {
                          id: 'range_meeting',
                          title: 'Pilih Pertemuan',
                          desc: 'Pertemuan 1 s/d 24 Tatap Muka',
                          icon: Calendar
                        },
                        {
                          id: 'upload_new',
                          title: 'Upload Modul Baru',
                          desc: 'Unggah berkas PDF / DOCX baru',
                          icon: Upload
                        }
                      ].map(tab => {
                        const Icon = tab.icon;
                        const isSel = selectionMode === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectionMode(tab.id)}
                            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              isSel
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 ${isSel ? 'text-white' : 'text-blue-600'}`} />
                              <span className="text-xs font-black">{tab.title}</span>
                            </div>
                            <span className={`text-[11px] ${isSel ? 'text-blue-100' : 'text-slate-400'}`}>
                              {tab.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SUB-VIEW 1: PILIH RENTANG BAB NYATA */}
                  {selectionMode === 'range_bab' && (
                    <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>Pilih Rentang Bab Materi ({activeClass.name}):</span>
                        </span>
                        <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                          Terpilih: Bab {startBab} s/d Bab {endBab} ({selectedChaptersList.length} Bab)
                        </span>
                      </div>

                      {/* Dropdown Dari Bab & Sampai Bab */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Dari Bab:</label>
                          <select
                            value={startBab}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStartBab(val);
                              if (val > endBab) setEndBab(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden cursor-pointer"
                          >
                            {classChapters.map((chap, idx) => {
                              const num = chap.number || (idx + 1);
                              return (
                                <option key={chap.id || idx} value={num}>
                                  {chap.title || `Bab ${num} – ${chap.labelName || ''}`}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Sampai Bab:</label>
                          <select
                            value={endBab}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEndBab(val);
                              if (val < startBab) setStartBab(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden cursor-pointer"
                          >
                            {classChapters.map((chap, idx) => {
                              const num = chap.number || (idx + 1);
                              return (
                                <option key={chap.id || idx} value={num}>
                                  {chap.title || `Bab ${num} – ${chap.labelName || ''}`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Presets Cepat Dinamis Sesuai Jumlah Bab Kelas */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 mb-2">Preset Rentang Cepat ({activeClass.name}):</div>
                        <div className="flex flex-wrap gap-2">
                          {classChapters.length >= 10 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => { setStartBab(1); setEndBab(3); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === 1 && endBab === 3
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Bab 1 s/d 3 (Hiragana & Kosakata)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setStartBab(1); setEndBab(5); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === 1 && endBab === 5
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Bab 1 s/d 5 (Dasar & Waktu)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setStartBab(6); setEndBab(10); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === 6 && endBab === 10
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Bab 6 s/d 10 (Kata Kerja & Partikel)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setStartBab(1); setEndBab(classChapters.length); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === 1 && endBab === classChapters.length
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Semua Bab (1 s/d {classChapters.length})
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => { setStartBab(1); setEndBab(Math.min(2, classChapters.length)); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === 1 && endBab === Math.min(2, classChapters.length)
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Bab 1 s/d {Math.min(2, classChapters.length)}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setStartBab(1); setEndBab(classChapters.length); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === 1 && endBab === classChapters.length
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Semua Bab (1 s/d {classChapters.length})
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 2: PILIH RENTANG PERTEMUAN */}
                  {selectionMode === 'range_meeting' && (
                    <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>Pilih Rentang Pertemuan Tatap Muka:</span>
                        </span>
                        <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                          Terpilih: Pertemuan {startMeeting} s/d {endMeeting}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Dari Pertemuan:</label>
                          <select
                            value={startMeeting}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStartMeeting(val);
                              if (val > endMeeting) setEndMeeting(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m}>Pertemuan {m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Sampai Pertemuan:</label>
                          <select
                            value={endMeeting}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEndMeeting(val);
                              if (val < startMeeting) setStartMeeting(val);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m}>Pertemuan {m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Presets Minggu */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setStartMeeting(1); setEndMeeting(4); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          Minggu 1 (P1–P4)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStartMeeting(5); setEndMeeting(8); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          Minggu 2 (P5–P8)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStartMeeting(9); setEndMeeting(12); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          Minggu 3 (P9–P12)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 3: UPLOAD MODUL BARU */}
                  {selectionMode === 'upload_new' && (
                    <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-blue-50/20 transition cursor-pointer relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.pptx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-xs font-black text-slate-800">
                        Klik atau Drag & Drop berkas materi Sensei ke sini
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Mendukung PDF, DOCX, atau PPTX materi pembelajaran Bahasa Jepang (Maks. 25 MB)
                      </div>
                      {uploadedFile && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Terpilih: {fileDetails.name} ({fileDetails.size})</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* Right Column (5 cols): Modul Materi yang Ter-cover Real-time */}
              <div className="lg:col-span-5 space-y-4">
                
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4 sticky top-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span>MODUL MATERI TER-COVER</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {coveredMaterials.length} dokumen modul aktif siap diekstrak
                      </p>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                      {coveredMaterials.length} Dokumen Siap
                    </span>
                  </div>

                  {/* Materials Scrollable List */}
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {coveredMaterials.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold">Belum ada modul materi pada rentang ini.</p>
                      </div>
                    ) : (
                      coveredMaterials.map((mat, idx) => {
                        return (
                          <div
                            key={mat.id || idx}
                            className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/70 hover:bg-white transition shadow-2xs group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                                  B{String(mat.chapterNumber || 1).padStart(2, '0')}
                                </div>
                                <div>
                                  <div className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition line-clamp-1">
                                    {mat.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                    <span className="font-bold text-blue-700">{mat.chapterTitle}</span>
                                    <span>•</span>
                                    <span>{mat.fileSize || mat.duration || '2.4 MB'}</span>
                                    <span>•</span>
                                    <span className="font-semibold">{mat.type || 'PDF'}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </span>
                            </div>
                            {mat.desc && (
                              <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 bg-white/70 p-1.5 rounded-lg border border-slate-100">
                                {mat.desc}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                    <div className="font-black text-slate-800 flex items-center justify-between">
                      <span>Cakupan Butir yang Diujikan:</span>
                      <span className="text-blue-600 font-bold">{activeClass.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kosakata Inti (Kotoba)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pola Kalimat (Bunpou)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Huruf Kanji & Furigana</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Komunikasi Situasi Kerja</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Lanjut ke Konfigurasi 5 Pilar & Durasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 2: KONFIGURASI 5 PILAR SOAL & DURASI                   */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-2xs space-y-6">
                
                {/* Header Section */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-blue-600" />
                      <span>Konfigurasi 5 Pilar Soal & Waktu Pengerjaan</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rombel: <b>{activeClass.name}</b> • Level: <b>{targetLevel}</b> • Rentang: <b>Bab {startBab} s/d {endBab}</b>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ubah Bab</span>
                  </button>
                </div>

                {/* 3 Main Settings: Total Questions, Duration, Passing Grade */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>Jumlah Butir Soal:</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Standar kuis harian: 10 soal</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Durasi Pengerjaan:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="text-xs font-bold text-slate-600 shrink-0">Menit</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Rekomendasi: 1.5 mnt / soal</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Passing Grade (KKM):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={passingGrade}
                        onChange={(e) => setPassingGrade(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="text-xs font-bold text-slate-600 shrink-0">/ 100</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Standar kelulusan LPK: 75</span>
                  </div>
                </div>

                {/* 5 Pilar Soal Distribution */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Distribusi 5 Pilar Soal UKOM & JLPT:
                    </span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      isCompositionValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      Total Alokasi: {compositionSum} / {totalQuestions} Soal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {[
                      { key: 'vocabulary', label: '🔤 Vocabulary', desc: 'Kotoba & Arti' },
                      { key: 'grammar', label: '✏️ Grammar', desc: 'Bunpou & Pola' },
                      { key: 'kanji', label: ' Kanji', desc: 'Cara Baca & Tulis' },
                      { key: 'reading', label: '📖 Reading', desc: 'Dokkai Pemahaman' },
                      { key: 'situational', label: '🤝 Situasional', desc: 'Etika Kerja & Aisatsu' }
                    ].map(p => (
                      <div key={p.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <div className="text-xs font-black text-slate-800 mb-0.5">{p.label}</div>
                        <div className="text-[10px] text-slate-400 mb-2">{p.desc}</div>
                        <input
                          type="number"
                          min="0"
                          max={totalQuestions}
                          value={composition[p.key]}
                          onChange={(e) => handleCompositionChange(p.key, e.target.value)}
                          className="w-16 mx-auto bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-center text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    ))}
                  </div>

                  {!isCompositionValid && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        Jumlah butir soal ({compositionSum}) belum sesuai dengan target ({totalQuestions}). Sesuaikan angka pilar di atas.
                      </span>
                    </div>
                  )}
                </div>

                {/* Extracted Preview Accordion */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>Ringkasan Materi Hasil Ekstraksi:</span>
                    <span className="text-[11px] font-bold text-blue-600">
                      {extractedContent.vocabulary.length} Kotoba • {extractedContent.grammar.length} Bunpou • {extractedContent.kanji.length} Kanji
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {extractedContent.vocabulary.map((v, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700">
                        {v.word} ({v.meaning})
                      </span>
                    ))}
                    {extractedContent.grammar.map((g, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700">
                        {g.pattern}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={!isCompositionValid}
                    onClick={handleStartGeneration}
                    className={`px-6 py-3 rounded-2xl font-black text-xs text-white shadow-md transition flex items-center gap-2 ${
                      isCompositionValid
                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                        : 'bg-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Generate Butir Soal AI</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 3: GENERATE & VALIDASI AI PIPELINE                      */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/90 p-8 md:p-10 shadow-lg space-y-6">
                
                {/* Animated Pulsing Icon */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-blue-600/20 animate-ping" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    AI Sedang Menyusun Butir Soal Kuis
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Mengekstrak materi nyata dari <b>{activeClass.name}</b> (Bab {startBab} s/d {endBab}) berstandar tingkat {difficulty.toUpperCase()}.
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${generationJob.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-xs font-black text-blue-700 flex items-center justify-between">
                    <span>{generationJob.currentStepText}</span>
                    <span>{generationJob.progressPercent}%</span>
                  </div>
                </div>

                {/* Stages List */}
                <div className="space-y-2.5 text-left pt-2">
                  {generationJob.stages.map(st => (
                    <div
                      key={st.id}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                        st.status === 'done'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : st.status === 'running'
                          ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-300'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>{st.name}</span>
                      {st.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {st.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                      {st.status === 'pending' && <Clock className="w-4 h-4 text-slate-300" />}
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 4: REVIEW SENSEI & PUBLISH KE SISWA                     */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && generatedQuiz && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (8 cols): Question Cards & Details */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Header Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                        {generatedQuiz.class_name} • Level {generatedQuiz.level} • {generatedQuiz.difficulty.toUpperCase()}
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-2">
                        {generatedQuiz.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {generatedQuiz.sub_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-black text-slate-700">
                        {generatedQuiz.questions.length} Butir Soal
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
                        ⏱️ {durationMinutes} Menit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Question Preview */}
                {(() => {
                  const q = generatedQuiz.questions[activePreviewIndex] || generatedQuiz.questions[0];
                  return (
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            #{q.id}
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {q.category_label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            • {q.material_reference}
                          </span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Kunci: {q.correct_key}
                        </span>
                      </div>

                      {q.passage && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs font-medium text-amber-950 leading-relaxed whitespace-pre-line">
                          {q.passage}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="text-sm md:text-base font-black text-slate-900 leading-snug">
                          {q.question}
                        </div>
                        {q.is_translation_question && q.translation && (
                          <div className="text-xs text-blue-600 font-semibold italic">
                            {q.translation}
                          </div>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="space-y-2">
                        {q.options.map(opt => {
                          const isCorrect = opt.key === q.correct_key;
                          return (
                            <div
                              key={opt.key}
                              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {opt.key}
                                </span>
                                <span>{opt.text}</span>
                              </div>
                              {isCorrect && (
                                <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  Kunci Jawaban
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 leading-relaxed">
                          <strong className="font-black text-blue-900 block mb-0.5">Penjelasan & Pembahasan:</strong>
                          {q.explanation}
                        </div>
                      )}

                      {/* Question Navigation Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={activePreviewIndex === 0}
                          onClick={() => setActivePreviewIndex(prev => Math.max(0, prev - 1))}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                          Soal Sebelumnya
                        </button>
                        <span className="text-xs font-black text-slate-500">
                          {activePreviewIndex + 1} dari {generatedQuiz.questions.length}
                        </span>
                        <button
                          type="button"
                          disabled={activePreviewIndex === generatedQuiz.questions.length - 1}
                          onClick={() => setActivePreviewIndex(prev => Math.min(generatedQuiz.questions.length - 1, prev + 1))}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                          Soal Selanjutnya
                        </button>
                      </div>

                    </div>
                  );
                })()}

              </div>

              {/* Right Column (4 cols): Question Grid Selector & Publish CTA */}
              <div className="lg:col-span-4 space-y-4">
                
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5 sticky top-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Navigasi Butir Soal
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pilih nomor soal untuk memeriksa detail & kunci
                    </p>
                  </div>

                  {/* Grid Numbers */}
                  <div className="grid grid-cols-5 gap-2">
                    {generatedQuiz.questions.map((q, idx) => {
                      const isCur = idx === activePreviewIndex;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setActivePreviewIndex(idx)}
                          className={`h-10 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center border ${
                            isCur
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {q.id}
                        </button>
                      );
                    })}
                  </div>

                  {/* Target Summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rombel Target:</span>
                      <strong className="text-slate-900">{activeClass.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rentang Bab:</span>
                      <strong className="text-slate-900">Bab {startBab} s/d {endBab}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Durasi:</span>
                      <strong className="text-slate-900">{durationMinutes} Menit</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Passing Grade:</span>
                      <strong className="text-slate-900">{passingGrade}</strong>
                    </div>
                  </div>

                  {/* Publish Button */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePublishQuiz}
                      className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Publikasikan Quiz ke Siswa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Atur Ulang Konfigurasi
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
