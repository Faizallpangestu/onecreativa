import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  RefreshCw,
  Layers,
  ArrowRight,
  Filter,
  Check,
  X,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Flag,
  Globe,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Flame,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function LmsQuizDaily() {
  const navigate = useNavigate();

  // Current user info from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {
        id: 1,
        nama_lengkap: 'Muhammad Faizal',
        role: 'admin',
        level: 'N5'
      };
    } catch {
      return { id: 1, nama_lengkap: 'Muhammad Faizal', role: 'admin', level: 'N5' };
    }
  }, []);

  const isSenseiOrAdmin = user.role === 'admin' || user.role === 'sensei' || user.role === 'pengajar';

  // ── FILTER STATES ──
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('2026-11-23');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, NOT_ATTEMPTED, COMPLETED

  // ── DATA STATES ──
  const [dailyQuizzes, setDailyQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── EXAM RUNNER STATE ──
  const [activeQuiz, setActiveQuiz] = useState(null); // Quiz object if running
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: 'A' }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [qId]: true }
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(1200); // 20 mins
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── RESULT & WEAKNESS STATE ──
  const [resultModalData, setResultModalData] = useState(null);

  // Load Daily Quizzes
  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/backend/api/lms_quiz_api.php?action=daily_quizzes&student_id=${user.id}`);
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        setDailyQuizzes(json.data);
      } else {
        setDailyQuizzes([]);
      }
    } catch (err) {
      console.warn('Gagal memuat daily quiz:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [user.id]);

  // Timer countdown when exam is active
  useEffect(() => {
    if (!activeQuiz) return;
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAttempt(true); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Text to Speech for Japanese pronunciation
  const speakJapanese = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/【.*?】/g, '').replace(/（.*?）/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return dailyQuizzes.filter((q) => {
      const matchClass = selectedClass === 'ALL' || q.class_name === selectedClass || q.class_name === 'Semua Kelas';
      const matchSearch = !searchQuery ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.material_title && q.material_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.bab && q.bab.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompleted = !!q.student_attempt;
      const matchStatus = statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && isCompleted) ||
        (statusFilter === 'NOT_ATTEMPTED' && !isCompleted);

      return matchClass && matchSearch && matchStatus;
    });
  }, [dailyQuizzes, selectedClass, searchQuery, statusFilter]);

  // Start Quiz
  const handleStartQuiz = async (quiz) => {
    try {
      const res = await fetch(`/backend/api/lms_quiz_api.php?action=quiz_detail&id=${quiz.id}`);
      const json = await res.json();
      if (json.status === 'success' && json.data.questions.length > 0) {
        setActiveQuiz(json.data.quiz);
        setQuizQuestions(json.data.questions);
        setCurrentQIndex(0);
        setSelectedAnswers({});
        setFlaggedQuestions({});
        setTimeRemainingSeconds(json.data.quiz.duration_minutes * 60 || 1200);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Soal Belum Tersedia',
          text: 'Quiz ini belum memiliki butir soal yang dipublikasikan.'
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuka Quiz',
        text: 'Terjadi gangguan jaringan saat memuat soal.'
      });
    }
  };

  // Submit Attempt
  const handleSubmitAttempt = async (isTimeout = false) => {
    if (!isTimeout) {
      const unanswered = quizQuestions.filter((q) => !selectedAnswers[q.id]).length;
      const confirm = await Swal.fire({
        title: unanswered > 0 ? `Ada ${unanswered} Soal Belum Dijawab!` : 'Kumpulkan Lembar Jawaban?',
        text: unanswered > 0
          ? 'Apakah Anda yakin ingin menyelesaikan quiz sekarang? Soal kosong akan dinilai salah.'
          : 'Semua soal telah terjawab. Nilai dan analisis kelemahan akan langsung dihitung.',
        icon: unanswered > 0 ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Kumpulkan Sekarang',
        cancelButtonText: 'Periksa Kembali'
      });
      if (!confirm.isConfirmed) return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        quiz_id: activeQuiz.id,
        student_id: user.id,
        student_name: user.nama_lengkap,
        answers: selectedAnswers,
        time_spent_seconds: (activeQuiz.duration_minutes * 60) - timeRemainingSeconds
      };

      const res = await fetch('/backend/api/lms_quiz_api.php?action=submit_attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.status === 'success') {
        setActiveQuiz(null); // Close runner
        setResultModalData({
          ...json.data,
          quizTitle: activeQuiz.title,
          bab: activeQuiz.bab,
          level: activeQuiz.level
        });
        fetchQuizzes(); // Refresh list to show score
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan Jawaban',
          text: json.message || 'Terjadi kesalahan sistem.'
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: 'Gagal mengirim lembar jawaban ke server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/70 pb-20">

        {/* ── HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white shadow-md">
          <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 backdrop-blur-xs text-blue-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    LMS Creativa Daily Learning System
                  </span>
                  <span className="bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Live System
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Daily Quiz Siswa & Rombel
                </h1>
                <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                  Evaluasi pemahaman harian berbasis materi pembelajaran hari ini. Dilengkapi auto-grading,
                  analisis 5 pilar bahasa Jepang, dan deteksi kelemahan otomatis menuju Kaiwa AI.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://takoboto.jp/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold backdrop-blur-xs transition border border-white/20"
                >
                  <Globe className="w-4 h-4 text-cyan-300" />
                  <span>Kamus Takoboto.jp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>

                {isSenseiOrAdmin && (
                  <button
                    onClick={() => navigate('/lms/quiz/generate')}
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-slate-900" />
                    <span>+ Generate Quiz dari Materi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER & STATS BAR ── */}
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Kelas</option>
                  <option value="N5 Pagi">N5 Pagi</option>
                  <option value="N4 A - PAGI">N4 A - PAGI</option>
                  <option value="Kelas Persiapan Mensetsu & Matching Job">Kelas Persiapan Mensetsu</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="NOT_ATTEMPTED">Belum Dikerjakan</option>
                  <option value="COMPLETED">Sudah Dikerjakan</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Tanggal: <strong>23 November 2026</strong></span>
              </div>
            </div>

            {/* Quick Summary Counter */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span>Total Quiz: <strong className="text-blue-600">{dailyQuizzes.length}</strong></span>
              <span className="h-3 w-px bg-slate-300"></span>
              <span>Siap Dikerjakan: <strong className="text-emerald-600">{dailyQuizzes.filter(q => !q.student_attempt).length}</strong></span>
              <span className="h-3 w-px bg-slate-300"></span>
              <span>Selesai: <strong className="text-indigo-600">{dailyQuizzes.filter(q => !!q.student_attempt).length}</strong></span>
            </div>
          </div>
        </div>

        {/* ── QUIZ CARDS GRID ── */}
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Memuat data kuis harian...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Tidak Ada Kuis untuk Kriteria Ini</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Sensei belum mempublikasikan quiz untuk kelas atau filter yang dipilih. Silakan ubah filter atau generate quiz baru dari materi pembelajaran.
              </p>
              {isSenseiOrAdmin && (
                <button
                  onClick={() => navigate('/lms/quiz/generate')}
                  className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Generate Quiz Baru Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => {
                const attempt = quiz.student_attempt;
                const isCompleted = !!attempt;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Header Top */}
                    <div className="p-5 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-blue-100 text-blue-700 font-extrabold text-2xs px-2.5 py-0.5 rounded-full uppercase">
                            {quiz.level || 'N5'}
                          </span>
                          <span className="bg-slate-100 text-slate-700 font-bold text-2xs px-2.5 py-0.5 rounded-full">
                            {quiz.class_name || 'N5 Pagi'}
                          </span>
                          <span className="bg-amber-100 text-amber-800 font-bold text-2xs px-2 py-0.5 rounded-full">
                            {quiz.bab || 'Bab 05'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-bold px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Selesai ({attempt.total_score} Poin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-2xs font-bold px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Belum Dikerjakan
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {quiz.title}
                      </h3>

                      {/* Material Link */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">
                          Materi: <strong>{quiz.material_title || 'Minna no Nihongo Bab 05'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Card Body Specs */}
                    <div className="p-5 bg-slate-50/50 space-y-3 text-xs text-slate-600">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                          <span className="text-2xs text-slate-400 font-semibold uppercase block">Jumlah Soal</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                            {quiz.total_questions || 10} Butir Soal
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                          <span className="text-2xs text-slate-400 font-semibold uppercase block">Durasi Ujian</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                            {quiz.duration_minutes || 20} Menit
                          </span>
                        </div>
                      </div>

                      {/* 5 Pillars Indicators */}
                      <div>
                        <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                          Komposisi 5 Pilar Uji:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-blue-50 text-blue-700 text-3xs font-bold px-2 py-0.5 rounded-md border border-blue-100">
                            🔤 Vocab
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 text-3xs font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                            🧩 Grammar
                          </span>
                          <span className="bg-rose-50 text-rose-700 text-3xs font-bold px-2 py-0.5 rounded-md border border-rose-100">
                            ⛩️ Kanji
                          </span>
                          <span className="bg-teal-50 text-teal-700 text-3xs font-bold px-2 py-0.5 rounded-md border border-teal-100">
                            📖 Reading
                          </span>
                          <span className="bg-amber-50 text-amber-700 text-3xs font-bold px-2 py-0.5 rounded-md border border-amber-100">
                            🎌 Situasional
                          </span>
                        </div>
                      </div>

                      {/* If completed, show mini breakdown */}
                      {isCompleted && (
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                            <span>Skor Akhir: {attempt.total_score} / 100</span>
                            <span className="text-2xs bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-md">
                              {attempt.correct_count} Benar dari {attempt.total_questions}
                            </span>
                          </div>
                          {attempt.weakness_detected && (
                            <p className="text-3xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              Kelemahan terdeteksi: Perlu penguatan pada {attempt.weakness_detected}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-2xs text-slate-400">
                        Jadwal: <strong>23 Nov 2026</strong>
                      </div>

                      {isCompleted ? (
                        <button
                          onClick={() => {
                            // View result analysis modal
                            setResultModalData({
                              quizTitle: quiz.title,
                              bab: quiz.bab,
                              level: quiz.level,
                              total_score: attempt.total_score,
                              correct_count: attempt.correct_count,
                              total_questions: attempt.total_questions,
                              breakdown: JSON.parse(attempt.category_breakdown_json || '{}'),
                              weakness_detected: attempt.weakness_detected,
                              kaiwa_recommendation: attempt.weakness_detected
                                ? 'Siswa disarankan untuk melatih dialog percakapan kerja di modul Percakapan Kaiwa AI agar pemahaman lebih fleksibel.'
                                : null
                            });
                          }}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lihat Analisis</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Mulai Quiz</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ── EXAM RUNNER MODAL / INTERFACE ── */}
        {/* ========================================================================= */}
        {activeQuiz && quizQuestions.length > 0 && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

              {/* Modal Topbar */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                    {activeQuiz.level}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold line-clamp-1">
                      {activeQuiz.title}
                    </h2>
                    <p className="text-2xs text-blue-200">
                      Materi: {activeQuiz.material_title || activeQuiz.bab} • {activeQuiz.curriculum_source}
                    </p>
                  </div>
                </div>

                {/* Timer Counter */}
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-extrabold text-amber-300">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Sisa Waktu: {formatTime(timeRemainingSeconds)}</span>
                </div>
              </div>

              {/* Modal Body: Left Palette + Right Question */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">

                {/* Left: Question Palette (3 cols) */}
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-slate-800">Daftar Butir Soal</span>
                      <span className="text-2xs font-bold text-blue-600">
                        {Object.keys(selectedAnswers).length} dari {quizQuestions.length} Terjawab
                      </span>
                    </div>

                    {/* Status Legend */}
                    <div className="grid grid-cols-2 gap-2 text-3xs font-semibold text-slate-500 mb-4 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Sudah Dijawab
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        Sedang Aktif
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        Ragu-ragu
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                        Belum Dijawab
                      </span>
                    </div>

                    {/* Palette Numbers */}
                    <div className="grid grid-cols-5 gap-2">
                      {quizQuestions.map((q, idx) => {
                        const isCurrent = idx === currentQIndex;
                        const isAnswered = !!selectedAnswers[q.id];
                        const isFlagged = !!flaggedQuestions[q.id];

                        let btnBg = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                        if (isFlagged) {
                          btnBg = 'bg-amber-400 border-amber-500 text-white font-bold';
                        } else if (isCurrent) {
                          btnBg = 'bg-blue-600 border-blue-700 text-white font-extrabold shadow-sm';
                        } else if (isAnswered) {
                          btnBg = 'bg-emerald-500 border-emerald-600 text-white font-bold';
                        }

                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQIndex(idx)}
                            className={`h-9 rounded-xl text-xs border font-bold transition flex items-center justify-center cursor-pointer ${btnBg}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complete Button in Palette */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleSubmitAttempt(false)}
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Mengirim Lembar...' : 'Kumpulkan Jawaban'}</span>
                    </button>
                  </div>
                </div>

                {/* Right: Active Question Display (8 cols) */}
                <div className="lg:col-span-8 flex flex-col justify-between">
                  {quizQuestions[currentQIndex] && (() => {
                    const q = quizQuestions[currentQIndex];
                    const qOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                    const isFlagged = !!flaggedQuestions[q.id];

                    return (
                      <div className="space-y-4">

                        {/* Header Question bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">
                              Soal {currentQIndex + 1} dari {quizQuestions.length}
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-2xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-100">
                              {q.category_label || q.category}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setFlaggedQuestions((prev) => ({
                                ...prev,
                                [q.id]: !prev[q.id]
                              }));
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${isFlagged
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>{isFlagged ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}</span>
                          </button>
                        </div>

                        {/* Reading / Situational Passage Box */}
                        {q.passage && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xs font-extrabold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md">
                                📖 Konteks / Wacana
                              </span>
                              <button
                                onClick={() => speakJapanese(q.passage)}
                                className="inline-flex items-center gap-1 text-2xs text-blue-600 font-bold hover:underline"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                Putar Suara
                              </button>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-japanese whitespace-pre-line">
                              {q.passage}
                            </p>
                          </div>
                        )}

                        {/* Japanese Question Text */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-japanese">
                                {q.question}
                              </h3>
                              {q.translation && (
                                <p className="text-xs text-slate-500 mt-1 italic">
                                  {q.translation}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => speakJapanese(q.question)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                              title="Dengarkan Pengucapan"
                            >
                              <Volume2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="space-y-2.5">
                          {qOptions.map((opt) => {
                            const isChosen = selectedAnswers[q.id] === opt.key;

                            return (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: opt.key
                                  }));
                                }}
                                className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer ${isChosen
                                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                  }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${isChosen
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                  {opt.key}
                                </span>
                                <span className="text-xs sm:text-sm font-japanese leading-relaxed">
                                  {opt.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navigation Prev / Next */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQIndex === 0}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <button
                      onClick={() => setCurrentQIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1))}
                      disabled={currentQIndex === quizQuestions.length - 1}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:pointer-events-none px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ── RESULT & WEAKNESS DETECTION MODAL ── */}
        {/* ========================================================================= */}
        {resultModalData && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 space-y-6">

              {/* Score Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 border-2 border-blue-200 mb-3 shadow-inner">
                  <Award className="w-9 h-9 text-blue-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Hasil Daily Quiz Siswa
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {resultModalData.quizTitle} • {resultModalData.bab} ({resultModalData.level})
                </p>

                {/* Score Number */}
                <div className="mt-4 inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl shadow-md">
                  <span className="text-3xs uppercase font-extrabold tracking-widest text-blue-200 block">
                    Total Nilai Akhir
                  </span>
                  <span className="text-4xl font-black">
                    {resultModalData.total_score}
                  </span>
                  <span className="text-sm font-semibold text-blue-200"> / 100</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold mt-2">
                  Berhasil menjawab <strong>{resultModalData.correct_count}</strong> dari{' '}
                  <strong>{resultModalData.total_questions}</strong> butir soal dengan benar.
                </p>
              </div>

              {/* 5 Pillars Breakdown Progress */}
              {resultModalData.breakdown && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    📊 Analisis Capaian 5 Pilar Pembelajaran:
                  </span>
                  <div className="space-y-2">
                    {Object.entries(resultModalData.breakdown).map(([cat, stat]) => {
                      const pct = stat.percent || 0;
                      const isLow = pct < 70;

                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              {cat}
                              {isLow && (
                                <span className="bg-rose-100 text-rose-700 text-3xs font-extrabold px-1.5 py-0.2 rounded">
                                  Kelemahan (&lt;70%)
                                </span>
                              )}
                            </span>
                            <span>{stat.correct}/{stat.total} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weakness Detection & Kaiwa AI Recommendation */}
              {resultModalData.weakness_detected ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-900">
                        Peringatan Deteksi Kelemahan Otomatis!
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Terdeteksi nilai di bawah 70% pada pilar <strong>{resultModalData.weakness_detected}</strong>.
                        Siswa disarankan untuk segera memperkuat percakapan pola kalimat di Kaiwa AI.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-200/70">
                    <button
                      onClick={() => {
                        setResultModalData(null);
                        navigate('/lms/kaiwa');
                      }}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      <span>Latihan di Percakapan Kaiwa AI</span>
                    </button>

                    <button
                      onClick={() => {
                        setResultModalData(null);
                        navigate('/lms/quiz/generate?mode=remedial');
                      }}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Buat Remedial Quiz</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-900">
                      Pemahaman Materi Sangat Baik! 🎉
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Seluruh pilar kompetensi harian melampaui standar kelulusan (&ge;70%). Nilai telah tercatat di Gradebook.
                    </p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setResultModalData(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Tutup Hasil
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
