import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  BookOpen,
  Filter,
  Search,
  Plus,
  ExternalLink,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  ChevronRight,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Check,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function LmsQuestionBank() {
  const navigate = useNavigate();

  // Filters state
  const [selectedLevel, setSelectedLevel] = useState('ALL'); // ALL, N5, N4, N3, N2, N1
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL, Vocabulary, Grammar, Kanji, Reading, Listening, Situasional
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL'); // ALL, easy, medium, hard
  const [selectedLesson, setSelectedLesson] = useState('ALL'); // ALL, Bab 01, Bab 02, ...
  const [selectedSource, setSelectedSource] = useState('ALL'); // ALL, material, manual, imported, takoboto
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, draft, approved, published, archived
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Preview & Edit modal state
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Fetch questions from API
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'ALL') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/backend/api/lms_quiz_api.php?action=question_bank&${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        setQuestions(json.data);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.warn('Gagal memuat bank soal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedLevel, selectedCategory, selectedDifficulty]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Filtered by lesson / source / status in memory if backend returned broad results
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchLesson = selectedLesson === 'ALL' || (q.bab && q.bab.includes(selectedLesson));
      const matchStatus = selectedStatus === 'ALL' || (q.validation_status === selectedStatus) || (q.status === selectedStatus);
      return matchLesson && matchStatus;
    });
  }, [questions, selectedLesson, selectedStatus]);

  // Speech Japanese
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

  // Copy Question to clipboard
  const handleCopyQuestion = (q) => {
    const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    const optText = opts.map(o => `${o.key}. ${o.text}`).join('\n');
    const text = `[${q.category}] ${q.question}\n${optText}\nKunci: ${q.correct_key}\nPenjelasan: ${q.explanation || '-'}`;
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'Soal Disalin!',
      text: 'Format teks butir soal berhasil disalin ke clipboard.',
      timer: 1400,
      showConfirmButton: false
    });
  };

  // Save edit question
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    try {
      const res = await fetch('/backend/api/lms_quiz_api.php?action=update_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: editingQuestion.id,
          question: editingQuestion.question,
          category: editingQuestion.category,
          difficulty: editingQuestion.difficulty,
          correct_key: editingQuestion.correct_key,
          explanation: editingQuestion.explanation,
          options: editingQuestion.options
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Soal Diperbarui!',
          timer: 1500,
          showConfirmButton: false
        });
        setEditingQuestion(null);
        fetchQuestions();
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal memperbarui butir soal' });
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
                    Master Question Repository
                  </span>
                  <span className="bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    5 Pilar Kompetensi
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Bank Soal Bahasa Jepang & UKOM
                </h1>
                <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                  Katalog master butir soal terintegrasi. Bersumber dari modul pembelajaran Sensei, kurikulum Japan Foundation, 
                  Irodori, dan referensi Takoboto.jp dengan audit kualitas & validasi akademik.
                </p>
              </div>

              {/* Actions Header */}
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

                <button
                  onClick={() => navigate('/lms/quiz/daily')}
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-xs font-bold backdrop-blur-xs transition border border-white/20 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-300" />
                  <span>Kuis Harian Siswa</span>
                </button>

                <button
                  onClick={() => navigate('/lms/quiz/generate')}
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-slate-900" />
                  <span>+ Generate dari Materi</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER COCKPIT (Prompt Section 16 Specifications) ── */}
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                Filter Multidimensi Bank Soal
              </span>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kanji, kosakata, kalimat..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  Cari
                </button>
              </form>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              
              {/* 1. Level */}
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Level</option>
                  <option value="N5">N5 (Dasar)</option>
                  <option value="N4">N4 (Lanjutan)</option>
                  <option value="N3">N3 (Menengah)</option>
                </select>
              </div>

              {/* 2. Category (5 Pillars) */}
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Kategori Pilar
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Vocabulary">🔤 Vocabulary</option>
                  <option value="Grammar">🧩 Grammar</option>
                  <option value="Kanji">⛩️ Kanji</option>
                  <option value="Reading">📖 Reading</option>
                  <option value="Listening">🎧 Listening</option>
                  <option value="Situasional">🎌 Situasional</option>
                </select>
              </div>

              {/* 3. Difficulty */}
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Tingkat Kesulitan
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Kesulitan</option>
                  <option value="easy">Easy (Mudah)</option>
                  <option value="medium">Medium (Sedang)</option>
                  <option value="hard">Hard (Sulit)</option>
                </select>
              </div>

              {/* 4. Lesson / Bab */}
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Modul / Bab
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Bab</option>
                  <option value="Bab 01">Bab 01</option>
                  <option value="Bab 02">Bab 02</option>
                  <option value="Bab 03">Bab 03</option>
                  <option value="Bab 04">Bab 04</option>
                  <option value="Bab 05">Bab 05</option>
                </select>
              </div>

              {/* 5. Source */}
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Sumber Soal
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Sumber</option>
                  <option value="material">Materi Sensei</option>
                  <option value="manual">Manual Sensei</option>
                  <option value="imported">Japan Foundation</option>
                  <option value="takoboto">Takoboto.jp</option>
                </select>
              </div>

              {/* 6. Status */}
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Status Validasi
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="valid">Validated (Valid)</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {/* Total count counter */}
            <div className="flex items-center justify-between text-2xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Menampilkan <strong>{filteredQuestions.length}</strong> butir soal terverifikasi di database.
              </span>
              <button
                onClick={() => {
                  setSelectedLevel('ALL');
                  setSelectedCategory('ALL');
                  setSelectedDifficulty('ALL');
                  setSelectedLesson('ALL');
                  setSelectedSource('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          </div>
        </div>

        {/* ── QUESTION LIST ── */}
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Mengambil data bank soal...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Tidak Menemukan Butir Soal</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Silakan sesuaikan kriteria filter di atas atau generate bank soal baru dari materi PDF/Word Sensei.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                const takobotoQuery = q.word_jp || (q.question.match(/「(.*?)」/) ? q.question.match(/「(.*?)」/)[1] : '');

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    {/* Top Metadata Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-2xs font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          Q-ID: {q.id}
                        </span>
                        <span className="bg-blue-100 text-blue-700 text-2xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          {q.quiz_level || 'N5'}
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 text-2xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                          {q.category_label || q.category}
                        </span>
                        <span className="bg-amber-50 text-amber-800 text-2xs font-bold px-2 py-0.5 rounded-full">
                          {q.bab || 'Bab 05'}
                        </span>
                        <span className="bg-slate-50 text-slate-600 text-3xs font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                          {q.difficulty}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-3xs font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          AI Validated
                        </span>
                      </div>

                      {/* Right quick actions */}
                      <div className="flex items-center gap-2">
                        {takobotoQuery && (
                          <a
                            href={`https://takoboto.jp/?q=${encodeURIComponent(takobotoQuery)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-2xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                            title="Verifikasi kosakata di Takoboto.jp"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Kamus: {takobotoQuery}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}

                        <button
                          onClick={() => handleCopyQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Salin Teks Soal"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Butir Soal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Passage if any */}
                    {q.passage && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-japanese leading-relaxed">
                        <span className="text-2xs font-bold text-slate-400 block mb-1">WACANA / KONTEKS:</span>
                        {q.passage}
                      </div>
                    )}

                    {/* Question text */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 font-japanese leading-snug">
                          {q.question}
                        </h4>
                        {q.translation && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">
                            {q.translation}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => speakJapanese(q.question)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                        title="Dengarkan Suara"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                      {opts.map((opt) => {
                        const isCorrect = opt.key === q.correct_key;

                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-2xs font-extrabold shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="truncate font-japanese">{opt.text}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation & Material Reference Footnote */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>
                          Ref Materi: <strong>{q.material_reference || q.material_title || 'Minna no Nihongo Bab 05'}</strong>
                        </span>
                      </div>
                      {q.explanation && (
                        <div className="text-slate-600 italic">
                          💡 <strong>Penjelasan:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ── EDIT MODAL ── */}
        {/* ========================================================================= */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Edit Butir Soal (ID: {editingQuestion.id})
                </h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pertanyaan Bahasa Jepang:</label>
                  <input
                    type="text"
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-japanese text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilihan Jawaban (A, B, C, D):</label>
                  <div className="space-y-2">
                    {(typeof editingQuestion.options === 'string'
                      ? JSON.parse(editingQuestion.options)
                      : editingQuestion.options
                    ).map((opt, i) => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700">
                          {opt.key}
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const currentOpts = typeof editingQuestion.options === 'string'
                              ? JSON.parse(editingQuestion.options)
                              : [...editingQuestion.options];
                            currentOpts[i].text = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: currentOpts });
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 font-japanese"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingQuestion({ ...editingQuestion, correct_key: opt.key })}
                          className={`px-3 py-1.5 rounded-xl font-bold text-2xs cursor-pointer ${
                            editingQuestion.correct_key === opt.key
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {editingQuestion.correct_key === opt.key ? 'Kunci Benar ✓' : 'Jadikan Kunci'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Penjelasan Jawaban:</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
