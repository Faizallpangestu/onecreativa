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
  Target
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function LmsQuizGenerate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse query params if available
  const initialMode = searchParams.get('mode') || 'range_bab';
  const initialStart = Number(searchParams.get('start')) || 1;
  const initialEnd = Number(searchParams.get('end')) || (initialMode === 'range_meeting' ? 4 : 5);
  const initialClass = searchParams.get('class') || 'N5 Pagi';
  const initialQuestions = Number(searchParams.get('questions')) || 10;
  const initialLevel = searchParams.get('level') || 'N5';

  // ── STEPPER: 1 = Pilih Materi, 2 = Ekstraksi & Konfigurasi, 3 = Generating, 4 = Review & Approval ──
  const [currentStep, setCurrentStep] = useState(1);

  // ── STEP 1: MATERIAL SELECTION & RANGE STATE ──
  // Mode: 'range_bab', 'range_meeting', 'specific_materials', 'upload_new'
  const [selectionMode, setSelectionMode] = useState(initialMode);
  const [startBab, setStartBab] = useState(initialMode === 'range_bab' ? initialStart : 1);
  const [endBab, setEndBab] = useState(initialMode === 'range_bab' ? initialEnd : 5);
  const [startMeeting, setStartMeeting] = useState(initialMode === 'range_meeting' ? initialStart : 1);
  const [endMeeting, setEndMeeting] = useState(initialMode === 'range_meeting' ? initialEnd : 4);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);

  const [materialsList, setMaterialsList] = useState([]);
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetLevel, setTargetLevel] = useState(initialLevel);
  const [quizMode, setQuizMode] = useState('daily'); // 'daily', 'review', 'remedial', 'exam'

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
  const [difficulty, setDifficulty] = useState('medium');
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

  // Fetch materials on mount
  useEffect(() => {
    const fetchApi = async () => {
      try {
        const res = await fetch('/api/lms_quiz_api.php?action=materials');
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          setMaterialsList(json.data);
          setSelectedMaterialIds([json.data[0].id]);
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
      }
    };
    fetchApi();
  }, []);

  // Filter matching materials based on active selection mode
  const matchingMaterials = useMemo(() => {
    if (!materialsList || materialsList.length === 0) return [];
    if (selectionMode === 'range_bab') {
      return materialsList.filter(m => {
        const b = m.bab_number || 0;
        return b >= startBab && b <= endBab;
      });
    } else if (selectionMode === 'range_meeting') {
      return materialsList.filter(m => {
        const mt = m.meeting_number || (m.meeting_id ? Number(m.meeting_id) : 0);
        return mt >= startMeeting && mt <= endMeeting;
      });
    } else if (selectionMode === 'specific_materials') {
      return materialsList.filter(m => selectedMaterialIds.includes(m.id));
    }
    return materialsList;
  }, [materialsList, selectionMode, startBab, endBab, startMeeting, endMeeting, selectedMaterialIds]);

  // Handle Preset Bab Range click
  const handleApplyBabPreset = (start, end) => {
    setStartBab(start);
    setEndBab(end);
  };

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

  // Proceed from Step 1 to Step 2 (Aggregate extracted content)
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
      can_do_statement: canDoText || 'Siswa mampu menguasai kosakata dan pola kalimat kerja Jepang sesuai cakupan materi.'
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

    updateStage(0, 20, 'Memindai berkas modul materi Sensei...');
    await new Promise(r => setTimeout(r, 600));

    updateStage(1, 40, `Mengekstrak Kotoba & Bunpou untuk ${selectionMode === 'range_bab' ? `Bab ${startBab} s/d Bab ${endBab}` : 'cakupan pertemuan'}...`);
    await new Promise(r => setTimeout(r, 700));

    updateStage(2, 65, 'AI Generator merangkai butir soal pilihan ganda 4 opsi...');
    await new Promise(r => setTimeout(r, 800));

    updateStage(3, 85, 'Memvalidasi kunci jawaban, distractor, dan level N5/N4...');
    await new Promise(r => setTimeout(r, 700));

    try {
      const payload = {
        selection_mode: selectionMode,
        start_bab: Number(startBab),
        end_bab: Number(endBab),
        start_meeting: Number(startMeeting),
        end_meeting: Number(endMeeting),
        material_ids: matchingMaterials.map(m => m.id),
        class_id: selectedClass === 'N5 Pagi' ? 19 : 20,
        class_name: selectedClass,
        level: targetLevel,
        mode: quizMode,
        total_questions: Number(totalQuestions),
        duration_minutes: Number(durationMinutes),
        passing_grade: Number(passingGrade),
        difficulty: difficulty,
        composition: composition
      };

      const res = await fetch('/api/lms_quiz_api.php?action=generate_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();

      updateStage(4, 100, 'Selesai! Draft Quiz siap direview oleh Sensei.');
      await new Promise(r => setTimeout(r, 500));

      if (resJson.status === 'success' && resJson.data) {
        setGeneratedQuiz(resJson.data);
      } else {
        throw new Error(resJson.message || 'Gagal generate quiz');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Kendala Generate', err.message || 'Periksa koneksi database.', 'error');
    }

    setCurrentStep(4);
  };

  // Sensei Publish Action
  const handlePublishQuiz = async () => {
    if (!generatedQuiz || !generatedQuiz.quiz_id) return;

    try {
      const res = await fetch('/api/lms_quiz_api.php?action=publish_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: generatedQuiz.quiz_id })
      });
      const json = await res.json();

      if (json.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Quiz Berhasil Diterbitkan! 🎉',
          html: `
            <p>Quiz <b>${generatedQuiz.title}</b> telah aktif dan siap dikerjakan oleh siswa di rombel <b>${selectedClass}</b>.</p>
            <div style="font-size: 13px; color: #475569; margin-top: 8px;">
              ⏱️ Durasi: <b>${durationMinutes} Menit</b> • 🎯 Passing Grade: <b>${passingGrade}</b>
            </div>
          `,
          confirmButtonText: 'Buka Halaman Quiz',
          confirmButtonColor: '#2563eb'
        }).then(() => {
          navigate('/lms/quiz');
        });
      }
    } catch (e) {
      Swal.fire('Gagal Publikasi', 'Terjadi kesalahan saat mempublikasikan kuis.', 'error');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/60 pb-16">
        
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
                  Generate Quiz dari Materi yang Diunggah Sensei
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
                  Pilih rentang Bab (misal <strong>Bab 1 s/d Bab 5</strong>) atau <strong>Pertemuan</strong> dari materi yang diunggah. Sistem otomatis mengekstrak Kotoba, Bunpou, dan Kanji untuk menyusun kuis interaktif berstandar.
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
                { step: 1, label: '1. Pilih Bab & Materi', desc: 'Rentang Bab / Pertemuan' },
                { step: 2, label: '2. Ekstraksi & Konfigurasi', desc: '5 Pilar Soal & Durasi' },
                { step: 3, label: '3. Generate & Validasi', desc: 'AI Merangkai Butir Soal' },
                { step: 4, label: '4. Sensei Review & Publish', desc: 'Koreksi & Rilis ke Siswa' }
              ].map(item => (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step < currentStep) setCurrentStep(item.step);
                  }}
                  className={`p-3 rounded-2xl border transition ${
                    currentStep === item.step
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm'
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
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-8">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 1: PILIH RENTANG BAB / PERTEMUAN / UPLOAD MATERI        */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Pemilihan Rentang Bab & Rombel */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-6">
                  
                  {/* Class & Date Header */}
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <span>Rombel Kelas & Target Pembelajaran</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Tentukan rombel kelas siswa yang akan menerima quiz ini.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Rombel Kelas
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value="N5 Pagi">N5 Pagi (2 Siswa Resmi)</option>
                        <option value="N4 A - PAGI">N4 A - PAGI (1 Siswa Resmi)</option>
                        <option value="Semua Kelas">Semua Kelas Terdaftar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tingkat Level
                      </label>
                      <select
                        value={targetLevel}
                        onChange={(e) => setTargetLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value="N5">JLPT N5 (Dasar 1)</option>
                        <option value="N4">JLPT N4 (Menengah Bawah)</option>
                        <option value="N3">JLPT N3 (Menengah)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tanggal Kuis
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Mode Selector Tabs: Rentang Bab vs Rentang Pertemuan vs Upload Baru */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Metode Pemilihan Materi Sensei
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectionMode('range_bab')}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                            selectionMode === 'range_bab'
                              ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>Pilih Rentang Bab</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Contoh: Bab 1 s/d Bab 5
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectionMode('range_meeting')}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                            selectionMode === 'range_meeting'
                              ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>Pilih Pertemuan</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Contoh: Pertemuan 1 - 4
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectionMode('upload_new')}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                            selectionMode === 'upload_new'
                              ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-purple-600" />
                            <span>Upload Modul Baru</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Upload berkas PDF/DOCX
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* 1. SELECTION MODE: RANGE BAB */}
                    {selectionMode === 'range_bab' && (
                      <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                            Pilih Rentang Bab Materi:
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                            Terpilih: Bab {startBab} s/d Bab {endBab} ({endBab - startBab + 1} Bab)
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
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                            >
                              {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>
                                  Bab {num < 10 ? `0${num}` : num} – Minna no Nihongo
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
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                            >
                              {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num} disabled={num < startBab}>
                                  Bab {num < 10 ? `0${num}` : num} – Minna no Nihongo
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Preset Range Pills */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                            Preset Rentang Cepat:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Bab 1 s/d 5 (Dasar)', start: 1, end: 5 },
                              { label: 'Bab 6 s/d 10 (Aktivitas & Sifat)', start: 6, end: 10 },
                              { label: 'Bab 1 s/d 10 (Semester 1)', start: 1, end: 10 },
                              { label: 'Bab 11 s/d 15 (Hitungan & Te-form)', start: 1, end: 15 },
                              { label: 'Bab 1 s/d 25 (N5 Lengkap)', start: 1, end: 25 }
                            ].map(p => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => handleApplyBabPreset(p.start, p.end)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  startBab === p.start && endBab === p.end
                                    ? 'bg-blue-600 text-white shadow-2xs'
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
                      <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                            Pilih Rentang Pertemuan Pembelajaran:
                          </span>
                          <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
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
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                            >
                              {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
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
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                            >
                              {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num} disabled={num < startMeeting}>
                                  Pertemuan {num}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            { label: 'Minggu 1 (P1 - P4)', start: 1, end: 4 },
                            { label: 'Minggu 2 (P5 - P8)', start: 5, end: 8 },
                            { label: 'Minggu 3 (P9 - P12)', start: 9, end: 12 },
                            { label: 'Mid-Term (P1 - P16)', start: 1, end: 16 }
                          ].map(p => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => { setStartMeeting(p.start); setEndMeeting(p.end); }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                startMeeting === p.start && endMeeting === p.end
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
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
              </div>

              {/* Right Column: Matched Materials & Extracted Content Overview */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Modul Materi yang Ter-cover</span>
                    </h3>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {matchingMaterials.length} Dokumen Siap
                    </span>
                  </div>

                  {/* List of matching materials */}
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {matchingMaterials.length > 0 ? (
                      matchingMaterials.map(m => (
                        <div key={m.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 hover:border-blue-300 transition">
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
                        Tidak ada modul materi yang cocok dengan rentang ini. Coba ubah rentang Bab.
                      </div>
                    )}
                  </div>

                  {/* Estimated Content Summary */}
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
                    className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Lanjut ke Konfigurasi Butir Soal</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Hasil Ekstraksi Materi Terpilih */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>Ekstraksi Konten Materi (Strict Material Constraint)</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Soal kuis akan disusun 100% dari konten materi di bawah ini tanpa halusinasi.
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
                        <option value="easy">Mudah (Pemula)</option>
                        <option value="medium">Sedang (Standar JLPT/JFT)</option>
                        <option value="hard">Tantangan (UKOM LPK)</option>
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
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition"
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
                      <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-0.5">
                        <div className="font-bold text-[10px] uppercase tracking-wider text-amber-700">
                          💡 Pembahasan & Referensi Guru:
                        </div>
                        <div className="leading-relaxed">
                          {q.explanation}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {/* Bottom Action Footer */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  onClick={() => {
                    const newQ = {
                      id: Date.now(),
                      category: 'Grammar',
                      category_label: '✏️ Grammar (文法)',
                      difficulty: 'medium',
                      question: '質問を入力してください (Ketik soal baru di sini)',
                      translation: 'Terjemahan soal',
                      options: [
                        { key: 'A', text: 'Pilihan A' },
                        { key: 'B', text: 'Pilihan B' },
                        { key: 'C', text: 'Pilihan C' },
                        { key: 'D', text: 'Pilihan D' }
                      ],
                      correct_key: 'A',
                      explanation: 'Pembahasan kunci jawaban',
                      material_reference: generatedQuiz.bab,
                      sort_order: (generatedQuiz.questions?.length || 0) + 1
                    };
                    setGeneratedQuiz(prev => ({
                      ...prev,
                      questions: [...(prev.questions || []), newQ]
                    }));
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>+ Tambah Butir Soal Manual</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/lms/quiz')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePublishQuiz}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui & Publikasikan Quiz Sekarang</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
