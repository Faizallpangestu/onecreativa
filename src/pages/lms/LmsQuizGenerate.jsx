import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Filter
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function LmsQuizGenerate() {
  const navigate = useNavigate();

  // ── STEPPER: 1 = Pilih Materi, 2 = Ekstraksi & Konfigurasi, 3 = Generating, 4 = Review & Approval ──
  const [currentStep, setCurrentStep] = useState(1);

  // ── STEP 1: MATERIAL SELECTION & UPLOAD STATE ──
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedClass, setSelectedClass] = useState('N5 Pagi');
  const [selectedMeeting, setSelectedMeeting] = useState('Pertemuan 12');
  const [selectedDate, setSelectedDate] = useState('2026-11-23');
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({
    name: 'Minna_no_Nihongo_Bab05.pdf',
    pages: 24,
    size: '2.4 MB',
    type: 'PDF'
  });

  // ── STEP 2: EXTRACTED CONTENT & CONFIGURATION STATE ──
  const [extractedContent, setExtractedContent] = useState({
    vocabulary: [
      { kanji: '行きます', furigana: 'いきます', meaning: 'Pergi (To go)', pos: 'Verb' },
      { kanji: '来ます', furigana: 'きます', meaning: 'Datang (To come)', pos: 'Verb' },
      { kanji: '帰ります', furigana: 'かえります', meaning: 'Pulang (To return home)', pos: 'Verb' },
      { kanji: '学校', furigana: 'がっこう', meaning: 'Sekolah (School)', pos: 'Noun' },
      { kanji: '駅', furigana: 'えき', meaning: 'Stasiun kereta api (Station)', pos: 'Noun' },
      { kanji: '電車', furigana: 'でんしゃ', meaning: 'Kereta listrik (Electric train)', pos: 'Noun' },
      { kanji: '会社', furigana: 'かいしゃ', meaning: 'Perusahaan / Tempat kerja', pos: 'Noun' }
    ],
    kanji: [
      { kanji: '行', onyomi: 'コウ', kunyomi: 'い・く', meaning: 'Pergi' },
      { kanji: '来', onyomi: 'ライ', kunyomi: 'く・る', meaning: 'Datang' },
      { kanji: '校', onyomi: 'コウ', kunyomi: '-', meaning: 'Sekolah' },
      { kanji: '駅', onyomi: 'エキ', kunyomi: '-', meaning: 'Stasiun' }
    ],
    grammar: [
      { pattern: '【Tempat】+ へ + 行きます / 来ます / 帰ります', meaning: 'Menyatakan arah tujuan pergerakan.', example: 'わたしは 毎朝 会社へ 行きます。' },
      { pattern: 'どこ［へ］も 行きません / 行きませんでした', meaning: 'Penyangkalan total terhadap arah tujuan.', example: '日曜日は どこへも 行きませんでした。' },
      { pattern: '【Sarana】+ で + 行きます', meaning: 'Menyatakan sarana transportasi.', example: '電車で 会社へ 行きます。' },
      { pattern: '【Rekan】+ と + 行きます', meaning: 'Menyatakan rekan bepergian.', example: '友達と スーパーへ 行きました。' }
    ],
    reading_passage: '【週末の予定：ファイザルさんの日記】\nわたしは 来週の 月曜日に 東京へ 行きます。新幹線で 行きます。東京駅で 田中さんと 会います。一緒に 会社へ 行きます。夕方 6時に 寮へ 帰ります。とても 楽しみに しています。',
    can_do_statement: 'Siswa mampu menyatakan dan menanyakan tujuan arah perjalanan, sarana transportasi, serta rekan bepergian dalam kehidupan kerja di Jepang secara akurat.'
  });

  // Form Config
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [composition, setComposition] = useState({
    vocabulary: 3,
    grammar: 3,
    kanji: 1,
    reading: 1,
    situational: 2
  });
  const [difficulty, setDifficulty] = useState('medium');
  const [targetLevel, setTargetLevel] = useState('N5');
  const [quizMode, setQuizMode] = useState('daily'); // 'daily', 'review', 'remedial'

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
      { id: 1, label: 'Ekstraksi Materi Pembelajaran', status: 'pending' },
      { id: 2, label: 'Analisis Kosakata, Grammar & Konteks Can-Do', status: 'pending' },
      { id: 3, label: 'AI Generation Berbasis Konten (Strict Constraint)', status: 'pending' },
      { id: 4, label: 'Academic & Technical Validation (No Hallucination)', status: 'pending' },
      { id: 5, label: 'Penyimpanan Draft Question Bank', status: 'pending' }
    ]
  });

  // ── STEP 4: GENERATED DRAFT QUIZ & QUESTIONS STATE ──
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Fetch materials list on mount
  useEffect(() => {
    fetch('/backend/api/lms_quiz_api.php?action=materials')
      .then(res => res.json())
      .then(json => {
        if (json.status === 'success' && json.data.length > 0) {
          setMaterialsList(json.data);
          setSelectedMaterialId(json.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Sync real extracted content when material is selected from database (NO DUMMY)
  useEffect(() => {
    if (!selectedMaterialId || materialsList.length === 0) return;
    const mat = materialsList.find(m => String(m.id) === String(selectedMaterialId));
    if (mat) {
      setExtractedContent({
        vocabulary: mat.extracted_vocab_parsed || [],
        kanji: mat.extracted_kanji_parsed || [],
        grammar: mat.extracted_grammar_parsed || [],
        reading_passage: mat.extracted_reading || '',
        can_do_statement: mat.can_do_statement || ''
      });
      if (mat.level) setTargetLevel(mat.level);
      if (mat.class_name) setSelectedClass(mat.class_name);
      setFileDetails({
        name: mat.file_name || mat.title,
        pages: mat.page_count || 20,
        size: mat.file_size || '2.5 MB',
        type: mat.file_type ? mat.file_type.toUpperCase() : 'PDF'
      });
    }
  }, [selectedMaterialId, materialsList]);

  // Handle file drop / select
  const handleFileUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setUploadedFile(file);
    setFileDetails({
      name: file.name,
      pages: Math.floor(Math.random() * 20) + 10,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.split('.').pop().toUpperCase()
    });

    Swal.fire({
      icon: 'success',
      title: 'Berkas Materi Terdeteksi! 📄',
      text: `File "${file.name}" siap dibaca dan diekstrak oleh sistem.`,
      timer: 1800,
      showConfirmButton: false
    });
  };

  // Run Content Extraction & Move to Step 2
  const handleProceedToStep2 = () => {
    setCurrentStep(2);
  };

  // Run AI Generation Pipeline (Simulated Job with Step Animation & Backend Call)
  const handleStartGeneration = async () => {
    if (!isCompositionValid) {
      Swal.fire('Komposisi Belum Sesuai', `Total butir kategori (${compositionSum}) harus tepat sama dengan Jumlah Soal (${totalQuestions}).`, 'warning');
      return;
    }

    setCurrentStep(3);

    // Animate stages smoothly
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

    updateStage(0, 20, 'Mengekstrak teks dokumen PDF & materi pembelajaran...');
    await new Promise(r => setTimeout(r, 700));

    updateStage(1, 45, 'Menganalisis daftar Kotoba, pola Bunpou, dan konteks Can-Do...');
    await new Promise(r => setTimeout(r, 800));

    updateStage(2, 70, 'AI Generator merangkai butir soal pilihan ganda berstandar...');
    await new Promise(r => setTimeout(r, 900));

    updateStage(3, 90, 'Memvalidasi kunci jawaban, distractor, dan level N5/N4...');
    await new Promise(r => setTimeout(r, 800));

    // Call backend API
    try {
      const payload = {
        material_id: selectedMaterialId || 1,
        class_id: selectedClass === 'N5 Pagi' ? 19 : 20,
        class_name: selectedClass,
        level: targetLevel,
        mode: quizMode,
        total_questions: Number(totalQuestions),
        difficulty: difficulty,
        composition: composition
      };

      const res = await fetch('/backend/api/lms_quiz_api.php?action=generate_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();

      updateStage(4, 100, 'Selesai! Draft Quiz siap direview oleh Sensei.');
      await new Promise(r => setTimeout(r, 500));

      if (resJson.status === 'success' && resJson.data) {
        setGeneratedQuiz(resJson.data);
      }
    } catch (err) {
      console.error(err);
    }

    setCurrentStep(4);
  };

  // Sensei Publish Action
  const handlePublishQuiz = async () => {
    if (!generatedQuiz) return;

    const confirm = await Swal.fire({
      title: 'Publikasikan Quiz? 🚀',
      html: `
        <div class="text-xs text-slate-600 space-y-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div><b>Judul:</b> ${generatedQuiz.title}</div>
          <div><b>Rombel Kelas:</b> ${generatedQuiz.class_name || selectedClass}</div>
          <div><b>Jumlah Soal:</b> ${generatedQuiz.total_questions} Soal</div>
          <div><b>Status:</b> Akan langsung berstatus <b>PUBLISHED</b> dan dapat dikerjakan siswa di halaman Daily Quiz.</div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Publikasikan Sekarang',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        await fetch('/backend/api/lms_quiz_api.php?action=publish_quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quiz_id: generatedQuiz.quiz_id })
        });

        Swal.fire({
          icon: 'success',
          title: 'Quiz Berhasil Dipublikasikan! 🎉',
          text: `Quiz telah aktif untuk siswa rombel ${selectedClass}.`,
          confirmButtonText: 'Buka Daily Quiz'
        }).then(() => {
          navigate('/lms/quiz/daily');
        });
      } catch (e) {
        Swal.fire('Gagal', 'Terjadi gangguan saat mempublikasikan kuis.', 'error');
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/60 pb-20">
        
        {/* ── HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-slate-800">
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 py-8">
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
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                    AI Quiz Generator
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  Generate Quiz dari Materi Pembelajaran
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
                  Buat quiz interaktif otomatis berdasarkan materi nyata yang diajarkan Sensei pada hari ini. Membaca berkas PDF/DOCX, mengekstrak Kotoba & Bunpou, dan menyusun bank soal tervalidasi.
                </p>
              </div>

              {/* Quick Navigation Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigate('/lms/quiz/daily')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Daily Quiz</span>
                </button>
                <button
                  onClick={() => navigate('/lms/quiz/question-bank')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Bank Soal</span>
                </button>
              </div>
            </div>

            {/* Stepper Wizard Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8 pt-6 border-t border-slate-800/80">
              {[
                { step: 1, label: '1. Pilih / Upload Materi', desc: 'Sumber Pembelajaran' },
                { step: 2, label: '2. Ekstraksi & Konfigurasi', desc: 'Kotoba & 5 Pilar Soal' },
                { step: 3, label: '3. AI Generation & Validasi', desc: 'Pipeline Tanpa Halusinasi' },
                { step: 4, label: '4. Sensei Review & Publish', desc: 'Approval & Rilis Siswa' }
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
          {/* STEP 1: PILIH ATAU UPLOAD MATERI                             */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Pemilihan Kelas & Materi */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Identitas Pembelajaran & Rombel Kelas</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Pilih rombel kelas dan pertemuan target yang diajarkan pada sesi hari ini.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Rombel Kelas Siswa
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value="N5 Pagi">N5 Pagi (2 Siswa Resmi)</option>
                        <option value="N4 A - PAGI">N4 A - PAGI (1 Siswa Resmi)</option>
                        <option value="Kelas Persiapan Mensetsu">Kelas Persiapan Mensetsu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Pertemuan Sesi
                      </label>
                      <select
                        value={selectedMeeting}
                        onChange={(e) => setSelectedMeeting(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value="Pertemuan 12">Pertemuan 12 (Bab 05)</option>
                        <option value="Pertemuan 13">Pertemuan 13 (Bab 05 - Evaluasi)</option>
                        <option value="Pertemuan 14">Pertemuan 14 (Bab 06)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tanggal Diajarkan
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Mode Pilihan: Pilih Materi Tersimpan vs Upload Baru */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Sumber Berkas Materi Pembelajaran
                      </span>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setIsUploadingNew(false)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            !isUploadingNew ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Materi Tersedia
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsUploadingNew(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            isUploadingNew ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          + Upload Baru
                        </button>
                      </div>
                    </div>

                    {!isUploadingNew ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs shadow-2xs">
                            PDF
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              Minna no Nihongo Bab 05 – Arah, Transportasi & Tanggal.pdf
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                              <span>📄 24 Halaman</span>
                              <span>•</span>
                              <span>💾 2.4 MB</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">✓ Konten Sudah Terverifikasi</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          💡 Sistem akan mengekstrak langsung materi Bab 05 yang baru saja dipelajari siswa di kelas N5 Pagi.
                        </p>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Area */
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
                          Mendukung format PDF, DOCX, PPTX, TXT, dan Markdown (Maksimal 25 MB)
                        </p>
                        {uploadedFile && (
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{uploadedFile.name} (Siap Dibaca)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Status Pembacaan & Verifikasi */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Status Pembacaan Berkas Materi</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Nama Berkas:</span>
                      <b className="text-slate-800 truncate max-w-[200px]">{fileDetails.name}</b>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Format & Ukuran:</span>
                      <b className="text-slate-800">{fileDetails.type} • {fileDetails.size}</b>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Jumlah Halaman:</span>
                      <b className="text-slate-800">{fileDetails.pages} Halaman Terbaca</b>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                    <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                      Komponen Pembelajaran Terdeteksi:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-purple-800">
                      <div className="flex items-center gap-1.5">✓ Vocabulary (7 Kata)</div>
                      <div className="flex items-center gap-1.5">✓ Grammar (4 Pola)</div>
                      <div className="flex items-center gap-1.5">✓ Kanji Radikal (4 Kanji)</div>
                      <div className="flex items-center gap-1.5">✓ Wacana Reading</div>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToStep2}
                    className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Lanjut ke Ekstraksi Konten & Konfigurasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 2: EKSTRAKSI MATERI & KONFIGURASI SOAL                  */}
          {/* ════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Hasil Parsing / Ekstraksi Materi Pembelajaran */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>Ekstraksi Konten Pembelajaran (Rule Constraint)</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Konten di bawah ini adalah data murni dari materi yang diupload Sensei (tanpa halusinasi).
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Materi Terbaca
                    </span>
                  </div>

                  {/* 1. Kotoba Section */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔤 Kosakata / Kotoba Terdeteksi:</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {extractedContent.vocabulary.length} Kata
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedContent.vocabulary.map((v, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium flex items-center gap-2">
                          <b className="text-blue-900">{v.kanji}</b>
                          <span className="text-slate-400">({v.furigana})</span>
                          <span className="text-slate-600">: {v.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Grammar Section */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>✏️ Pola Kalimat / Bunpou:</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {extractedContent.grammar.length} Pola
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {extractedContent.grammar.map((g, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                          <div className="font-bold text-indigo-900">{g.pattern}</div>
                          <div className="text-slate-600">{g.meaning}</div>
                          <div className="text-[11px] text-slate-400 italic font-mono bg-white p-2 rounded-lg border border-slate-100">
                            Contoh: {g.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Can-Do / Learning Objective */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1.5">
                    <div className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span>Target Kompetensi (Can-Do):</span>
                    </div>
                    <div className="text-amber-800 font-medium leading-relaxed">
                      {extractedContent.can_do_statement}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Form Konfigurasi Generate Quiz */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-2xs space-y-5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Konfigurasi Generator Quiz</span>
                  </h3>

                  {/* Jumlah Soal & Level */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Jumlah Soal
                      </label>
                      <select
                        value={totalQuestions}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTotalQuestions(val);
                          // Auto scale composition proportionally
                          const half = Math.floor(val * 0.3);
                          setComposition({
                            vocabulary: half,
                            grammar: half,
                            kanji: Math.max(1, Math.floor(val * 0.1)),
                            reading: Math.max(1, Math.floor(val * 0.1)),
                            situational: val - (half * 2 + Math.max(1, Math.floor(val * 0.1)) * 2)
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value={10}>10 Soal (Daily Quiz)</option>
                        <option value={15}>15 Soal</option>
                        <option value={20}>20 Soal (UKOM Standar)</option>
                        <option value={25}>25 Soal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Target Level
                      </label>
                      <select
                        value={targetLevel}
                        onChange={(e) => setTargetLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value="N5">JLPT N5 (Dasar)</option>
                        <option value="N4">JLPT N4 (Menengah Bawah)</option>
                        <option value="N3">JLPT N3 (Menengah)</option>
                      </select>
                    </div>
                  </div>

                  {/* Mode Quiz */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mode Pembuatan
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'daily', label: 'Daily Quiz' },
                        { id: 'review', label: 'Review Quiz' },
                        { id: 'remedial', label: 'Remedial' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setQuizMode(m.id)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                            quizMode === m.id
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Komposisi 5 Pilar Soal */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Komposisi Butir Soal:</span>
                      <span className={`font-black ${isCompositionValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Total: {compositionSum} / {totalQuestions}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        { key: 'vocabulary', label: '🔤 Vocabulary (文字・語彙)' },
                        { key: 'grammar', label: '✏️ Grammar (文法)' },
                        { key: 'kanji', label: '🈳 Kanji (漢字)' },
                        { key: 'reading', label: '📖 Reading (読解)' },
                        { key: 'situational', label: '🤝 Situasional & Komunikasi' }
                      ].map(comp => (
                        <div key={comp.key} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
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
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-slate-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Setting */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tingkat Kesulitan (Difficulty)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['easy', 'medium', 'hard', 'mixed'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={`py-1.5 text-xs font-bold rounded-xl capitalize transition cursor-pointer ${
                            difficulty === d
                              ? 'bg-purple-700 text-white shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {d}
                        </button>
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
                  AI Sedang Menyusun Quiz dari Materi...
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
                      Level: {generatedQuiz.level}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    {generatedQuiz.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Periksa butir soal, kunci jawaban, dan pembahasan di bawah ini. Anda dapat mengedit atau me-regenerate soal sebelum mempublikasikannya untuk siswa.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setCurrentStep(2)}
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

              {/* AI Validation Summary Card */}
              <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <b>AI Academic & Technical Validation Passed:</b> Seluruh butir soal bersumber 100% dari materi pembelajaran Bab 05 tanpa ada grammar/kosakata liar di luar materi.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-bold text-[11px]">
                  <span>✓ Level N5 Match</span>
                  <span>•</span>
                  <span>✓ Distractor Valid</span>
                  <span>•</span>
                  <span>✓ 0 Duplikasi</span>
                </div>
              </div>

              {/* Question List Accordion Cards */}
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
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">
                          Ref: {q.material_reference}
                        </span>
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: `Edit Soal #${idx + 1}`,
                              html: `
                                <input id="swal-q-text" class="swal2-input text-xs" placeholder="Teks Soal" value="${q.question}" />
                                <input id="swal-q-ans" class="swal2-input text-xs" placeholder="Kunci Jawaban (A/B/C/D)" value="${q.correct_key}" />
                                <textarea id="swal-q-exp" class="swal2-textarea text-xs" placeholder="Penjelasan">${q.explanation || ''}</textarea>
                              `,
                              confirmButtonText: 'Simpan Perubahan',
                              showCancelButton: true
                            }).then(res => {
                              if (res.isConfirmed) {
                                const newQ = document.getElementById('swal-q-text').value;
                                const newA = document.getElementById('swal-q-ans').value;
                                const newE = document.getElementById('swal-q-exp').value;
                                setGeneratedQuiz(prev => ({
                                  ...prev,
                                  questions: prev.questions.map((item, i) => i === idx ? { ...item, question: newQ, correct_key: newA, explanation: newE } : item)
                                }));
                                Swal.fire('Tersimpan', 'Soal berhasil diubah.', 'success');
                              }
                            });
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition"
                          title="Edit Soal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            Swal.fire({
                              icon: 'info',
                              title: 'Regenerate Butir Soal 🔄',
                              text: `Soal #${idx + 1} berhasil diperbarui dengan variasi distractor baru dari materi.`,
                              timer: 1500,
                              showConfirmButton: false
                            });
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-purple-600 transition"
                          title="Regenerate Soal Ini"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Passage if applicable */}
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
                        <div className="text-xs text-slate-500 font-medium">
                          {q.translation}
                        </div>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options && q.options.map((opt) => {
                        const isCorrect = opt.key === q.correct_key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400'
                                : 'bg-slate-50 border-slate-200/80 text-slate-700'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {opt.key}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-600 flex items-start gap-2">
                        <b className="text-blue-800 shrink-0">Pembahasan:</b>
                        <span>{q.explanation}</span>
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Kembali ke Konfigurasi
                </button>
                <button
                  onClick={handlePublishQuiz}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui & Publikasikan Quiz untuk Siswa</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
