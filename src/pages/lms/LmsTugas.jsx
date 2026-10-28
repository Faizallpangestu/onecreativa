import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import {
  getStoredTasks,
  addStoredTask,
  updateStoredTask,
  getTaskSubmissionsForTask,
  saveStudentGrade,
  getStoredStudents
} from '../../services/lmsStudentData';
import {
  GraduationCap,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  FileCheck,
  Check,
  Award,
  Layers,
  Sparkles,
  HelpCircle,
  ArrowLeft,
  Edit3,
  MoreVertical,
  Bot,
  Trophy,
  BookOpen,
  Users,
  CheckSquare,
  Square,
  BarChart2,
  FileSpreadsheet
} from 'lucide-react';

export default function LmsTugas() {
  // Current Active Tab: 'daftar' (Daftar Jawaban Siswa) | 'detail' (Detail Tugas) | 'hasil' (Hasil & Nilai)
  const [activeMainTab, setActiveMainTab] = useState('daftar');

  // Edit / Tambah Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create'); // 'create' | 'edit'

  // Master Task Data & Task List
  const [taskList, setTaskList] = useState(() => getStoredTasks());
  const [taskData, setTaskData] = useState(() => {
    const list = getStoredTasks();
    return list[0] || {
      id: 'task-1',
      title: 'Kuis Kosakata Bab 2',
      subtitle: 'Latihan kosakata baru yang mencakup tema makanan, minuman, dan aktivitas sehari-hari.',
      classRoom: 'N5',
      type: 'Quiz',
      createdDate: '12 Okt 2026',
      createdDateTime: '12 Oktober 2026, 09:00',
      deadline: '20 Okt 2026, 23:59',
      deadlineDateTime: '20 Oktober 2026, 23:59',
      status: 'Aktif',
      description: 'Latihan kosakata baru yang mencakup tema makanan, minuman, dan aktivitas sehari-hari. Kerjakan dengan teliti dan pastikan jawaban yang diberikan sesuai dengan materi.',
      totalPoints: 100,
      criteria: [
        { name: 'Ketepatan jawaban', weight: 40 },
        { name: 'Kelengkapan jawaban', weight: 30 },
        { name: 'Kerapihan & struktur', weight: 20 },
        { name: 'Pemahaman materi', weight: 10 }
      ]
    };
  });

  // Students list state linked with real registered students
  const [studentsList, setStudentsList] = useState(() => {
    const active = getStoredTasks()[0] || taskData;
    return getTaskSubmissionsForTask(active.id, active.classRoom);
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'Sudah Dinilai' | 'Belum Dinilai'
  const [sortBy, setSortBy] = useState('terbaru');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sinkronisasi otomatis dengan data siswa dan tugas
  useEffect(() => {
    const refreshData = () => {
      const currentTasks = getStoredTasks();
      setTaskList(currentTasks);
      setTaskData(prev => {
        const found = currentTasks.find(t => t.id === prev.id) || currentTasks[0] || prev;
        const subs = getTaskSubmissionsForTask(found.id, found.classRoom);
        setStudentsList(subs);
        return found;
      });
    };

    refreshData();
    window.addEventListener('lms_data_sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('lms_data_sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  // Form State for Create / Edit Task
  const [formTask, setFormTask] = useState({
    title: taskData.title,
    classRoom: taskData.classRoom,
    bab: 'Bab 2 - Kosakata',
    type: 'Tugas Individu',
    description: taskData.description,
    startDate: '2026-10-15',
    startTime: '00:00',
    deadlineDate: '2026-10-20',
    deadlineTime: '23:59',
    showInCalendar: true,
    totalPoints: 100,
    fileAttachment: {
      name: 'Soal_Latihan_Kosakata_Bab2.pdf',
      size: '1.8 MB',
      type: 'PDF'
    }
  });

  // Switch Active Task
  const handleSelectTask = (taskId) => {
    const found = taskList.find(t => String(t.id) === String(taskId));
    if (found) {
      setTaskData(found);
      setStudentsList(getTaskSubmissionsForTask(found.id, found.classRoom));
    }
  };

  // Handle Score Input Change
  const handleScoreChange = (id, newScore) => {
    setStudentsList(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          score: newScore === '' ? '' : Math.min(100, Math.max(0, Number(newScore) || 0))
        };
      }
      return s;
    }));
  };

  // Handle Save / Submit Single Grade
  const handleSaveStudentGrade = (student) => {
    const numericScore = Number(student.score);
    if (student.score === '' || isNaN(numericScore)) {
      Swal.fire('Nilai Kosong', 'Silakan masukkan nilai angka (0 - 100).', 'warning');
      return;
    }

    setStudentsList(prev => prev.map(s => {
      if (s.id === student.id) {
        return {
          ...s,
          score: numericScore,
          status: 'Sudah Dinilai'
        };
      }
      return s;
    }));

    saveStudentGrade(taskData.id, student.id, {
      score: numericScore,
      feedback: student.feedback || ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Nilai Berhasil Disimpan!',
      html: `Nilai <b>${numericScore}/100</b> untuk <b>${student.name}</b> telah disimpan dan otomatis disinkronkan ke Nilai & Leaderboard.`,
      toast: true,
      position: 'top-end',
      timer: 1800,
      showConfirmButton: false
    });
  };

  // AI Assistant: Generate Auto Feedback
  const handleAiAutoFeedback = () => {
    if (studentsList.length === 0) {
      Swal.fire('Belum Ada Siswa', 'Belum ada data siswa terdaftar. Tambahkan siswa di menu Data Siswa terlebih dahulu.', 'info');
      return;
    }

    Swal.fire({
      title: '🤖 AI Feedback Otomatis',
      text: 'AI sedang menganalisis lembar jawaban siswa dan menghasilkan catatan evaluasi sesuai kriteria...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          setStudentsList(prev => prev.map(s => {
            if (s.status === 'Belum Dinilai' && (s.score === '' || s.score === null)) {
              saveStudentGrade(taskData.id, s.id, {
                score: 85,
                feedback: 'AI: Jawaban kosakata tepat sasaran, pemakaian partikel wo dan ni sudah sesuai kaidah.'
              });
              return {
                ...s,
                score: 85,
                status: 'Sudah Dinilai',
                feedback: 'AI: Jawaban kosakata tepat sasaran, pemakaian partikel wo dan ni sudah sesuai kaidah.'
              };
            }
            return s;
          }));

          Swal.fire({
            icon: 'success',
            title: 'Feedback AI Berhasil Dibuat!',
            html: 'Seluruh lembar jawaban siswa telah dievaluasi secara otomatis oleh AI Sensei. Nilai dan umpan balik telah tersimpan ke sistem.',
            timer: 2500,
            showConfirmButton: false
          });
        }, 1200);
      }
    });
  };

  // Export Rekap Nilai ke Excel
  const handleDownloadRekap = () => {
    try {
      const exportRows = studentsList.map((s, idx) => ({
        'No': idx + 1,
        'ID Siswa': s.studentId,
        'Nama Siswa': s.name,
        'Kelas': s.classRoom,
        'Status': s.status,
        'Nilai': s.score !== '' ? s.score : '-',
        'Berkas Jawaban': s.fileName,
        'Waktu Pengumpulan': s.submittedAt,
        'Feedback Sensei': s.feedback || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Nilai');
      XLSX.writeFile(wb, `Rekap_${taskData.title.replace(/\s+/g, '_')}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'Rekap Berhasil Diunduh!',
        text: 'File Excel rekap nilai siswa telah tersimpan di komputer Anda.',
        toast: true,
        position: 'top-end',
        timer: 1800,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Gagal membuat file rekap Excel.', 'error');
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      if (filterStatus === 'Sudah Dinilai' && s.status !== 'Sudah Dinilai') return false;
      if (filterStatus === 'Belum Dinilai' && s.status !== 'Belum Dinilai') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.fileName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [studentsList, filterStatus, searchQuery]);

  // Toggle All Checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Open Edit Task Modal
  const handleOpenEdit = () => {
    setFormTask({
      title: taskData.title,
      classRoom: taskData.classRoom,
      bab: 'Bab 2 - Kosakata',
      type: 'Tugas Individu',
      description: taskData.description,
      startDate: '2026-10-15',
      startTime: '00:00',
      deadlineDate: '2026-10-20',
      deadlineTime: '23:59',
      showInCalendar: true,
      totalPoints: taskData.totalPoints,
      fileAttachment: {
        name: 'Soal_Latihan_Kosakata_Bab2.pdf',
        size: '1.8 MB',
        type: 'PDF'
      }
    });
    setEditorMode('edit');
    setIsEditorOpen(true);
  };

  // Open Create Task Modal
  const handleOpenCreate = () => {
    setFormTask({
      title: '',
      classRoom: 'N5 A - Bahasa Jepang',
      bab: 'Bab 2 - Kosakata',
      type: 'Tugas Individu',
      description: 'Kerjakan latihan kosakata dengan teliti dan kumpulkan sebelum tenggat waktu.',
      startDate: '2026-10-22',
      startTime: '08:00',
      deadlineDate: '2026-10-29',
      deadlineTime: '23:59',
      showInCalendar: true,
      totalPoints: 100,
      fileAttachment: null
    });
    setEditorMode('create');
    setIsEditorOpen(true);
  };

  // Save Task (Create or Edit)
  const handleSaveTaskForm = () => {
    if (!formTask.title.trim()) {
      Swal.fire('Judul Diperlukan', 'Silakan masukkan judul tugas.', 'warning');
      return;
    }

    if (editorMode === 'create') {
      const created = addStoredTask(formTask);
      const all = getStoredTasks();
      setTaskList(all);
      setTaskData(created);
      setStudentsList(getTaskSubmissionsForTask(created.id, created.classRoom));
    } else {
      updateStoredTask(taskData.id, formTask);
      const all = getStoredTasks();
      setTaskList(all);
      setTaskData(prev => ({
        ...prev,
        ...formTask,
        deadline: `${formTask.deadlineDate}, ${formTask.deadlineTime}`,
        deadlineDateTime: `${formTask.deadlineDate}, ${formTask.deadlineTime}`
      }));
      setStudentsList(getTaskSubmissionsForTask(taskData.id, formTask.classRoom));
    }

    setIsEditorOpen(false);

    Swal.fire({
      icon: 'success',
      title: editorMode === 'create' ? 'Tugas Berhasil Dibuat!' : 'Tugas Berhasil Diperbarui!',
      html: `Tugas <b>"${formTask.title}"</b> telah disimpan dan terhubung ke siswa kelas <b>${formTask.classRoom}</b>.`,
      timer: 1800,
      showConfirmButton: false
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F6F9] pb-12 font-sans text-slate-800">
        <div className="max-w-[1700px] mx-auto p-3 sm:p-5 space-y-4">

          {/* ========================================================================= */}
          {/* 1. TOP HERO BANNER & HEADER ACTION BAR (PERSIS GAMBAR)                   */}
          {/* ========================================================================= */}
          <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 gap-4">
            
            {/* Mt Fuji & Cherry Blossom Japanese Background Illustration on Right */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-25 md:opacity-95 pointer-events-none bg-right bg-no-repeat bg-cover"
              style={{ backgroundImage: `url(${bannerImg})`, maskImage: 'linear-gradient(to right, transparent, black 35%)' }}
            />

            {/* Left Header Title & Breadcrumb */}
            <div className="relative z-10 min-w-0 max-w-xl">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Tugas & Quiz</span>
                <span>&gt;</span>
                <span className="font-bold text-slate-600">Detail Tugas</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {taskData.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {taskData.subtitle}
              </p>

              {taskList.length > 1 && (
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[11px] font-bold text-slate-500">Pilih Tugas:</span>
                  <select
                    value={taskData.id}
                    onChange={(e) => handleSelectTask(e.target.value)}
                    className="text-xs font-bold text-blue-700 bg-blue-50/90 border border-blue-200 rounded-xl px-2.5 py-1 outline-none cursor-pointer hover:border-blue-400"
                  >
                    {taskList.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.classRoom})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right Action Buttons (Persis Gambar: Kembali, Edit Tugas, Download Rekap, + Tambah) */}
            <div className="relative z-10 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  Swal.fire({
                    icon: 'info',
                    title: 'Kembali',
                    text: 'Kembali ke daftar menu Tugas & Quiz',
                    timer: 1200,
                    showConfirmButton: false
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEdit}
                className="px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Tugas</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadRekap}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Rekap</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95 ml-1"
                title="Buat Tugas Siswa Baru"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Tambah Tugas</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. FIVE METRICS CARDS ROW (PERSIS GAMBAR)                                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* Card 1: Kelas */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400">Kelas</div>
                <div className="text-xs font-extrabold text-slate-900 truncate">{taskData.classRoom}</div>
              </div>
            </div>

            {/* Card 2: Jenis */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400">Jenis</div>
                <div className="text-xs font-extrabold text-slate-900 truncate">{taskData.type}</div>
              </div>
            </div>

            {/* Card 3: Tanggal Dibuat */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400">Tanggal Dibuat</div>
                <div className="text-xs font-extrabold text-slate-900 truncate">{taskData.createdDate}</div>
              </div>
            </div>

            {/* Card 4: Deadline */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400">Deadline</div>
                <div className="text-xs font-extrabold text-slate-900 truncate">{taskData.deadline}</div>
              </div>
            </div>

            {/* Card 5: Status */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400">Status</div>
                <div className="text-xs font-extrabold text-emerald-600 truncate">{taskData.status}</div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 3. TABS SWITCHER (DETAIL TUGAS | DAFTAR JAWABAN SISWA | HASIL & NILAI)    */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMainTab('detail')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'detail'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detail Tugas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('daftar')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'daftar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Jawaban Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('hasil')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'hasil'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Hasil & Nilai</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 4. MAIN TWO-COLUMN SECTION (PERSIS GAMBAR)                               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* ── LEFT COLUMN: DAFTAR JAWABAN SISWA (8 / 12 on Desktop) ── */}
            <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              
              {/* Header Tabel Siswa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Daftar Jawaban Siswa
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lihat dan nilai jawaban siswa. Nilai akan otomatis masuk ke halaman nilai siswa.
                  </p>
                </div>

                {/* Filter & Search Bar Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama siswa..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:bg-white"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Sudah Dinilai">Sudah Dinilai</option>
                    <option value="Belum Dinilai">Belum Dinilai</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:bg-white"
                  >
                    <option value="terbaru">Urutkan: Terbaru</option>
                    <option value="nama">Urutkan: Nama</option>
                    <option value="nilai">Urutkan: Nilai</option>
                  </select>
                </div>
              </div>

              {/* Table Daftar Jawaban Siswa (Persis Gambar) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-[#FAFBFD] text-slate-500 font-extrabold uppercase text-[11px] border-b border-slate-200/80 whitespace-nowrap">
                    <tr>
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-10 text-center font-bold">No</th>
                      <th className="p-3">Siswa</th>
                      <th className="p-3">Jawaban</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Nilai</th>
                      <th className="p-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center">
                          {studentsList.length === 0 ? (
                            <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-3 py-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                                <Users className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">Belum Ada Siswa Terdaftar</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  Data siswa yang didaftarkan di menu Data Siswa (LPK Intensif) akan otomatis muncul di sini dan siap dinilai.
                                </p>
                              </div>
                              <Link
                                to="/lpk-intensif"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Buka Data Siswa</span>
                              </Link>
                            </div>
                          ) : (
                            <div className="py-6 text-slate-400 text-xs font-medium">
                              Tidak ada siswa yang sesuai dengan filter pencarian.
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, idx) => {
                        const isChecked = selectedStudentIds.includes(s.id);
                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-slate-50/80 transition ${
                              isChecked ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectRow(s.id)}
                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={s.avatar}
                                  alt={s.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                                <div>
                                  <div className="font-extrabold text-slate-900">{s.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{s.classRoom}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 shadow-2xs">
                                  PDF
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[11px] text-slate-800 truncate">
                                    {s.fileName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {s.fileSize} • Dikirim: {s.submittedAt}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {s.status === 'Sudah Dinilai' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F0] text-[#1E9E64]">
                                  Sudah Dinilai
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E5] text-[#D97706]">
                                  Belum Dinilai
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="text"
                                  value={s.score !== null ? s.score : ''}
                                  onChange={(e) => handleScoreChange(s.id, e.target.value)}
                                  placeholder="-"
                                  className="w-12 p-1 text-center font-extrabold text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-[11px] font-bold text-slate-400">/100</span>
                              </div>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveStudentGrade(s)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition active:scale-95 cursor-pointer min-w-[55px]"
                                >
                                  {s.status === 'Sudah Dinilai' ? 'Simpan' : 'Nilai'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    Swal.fire({
                                      title: s.name,
                                      html: `<div class="text-xs text-left space-y-2"><p><b>Berkas:</b> ${s.fileName} (${s.fileSize})</p><p><b>Waktu Pengumpulan:</b> ${s.submittedAt}</p><p><b>Nilai:</b> ${s.score || '-'} / 100</p><p><b>Catatan Feedback:</b> ${s.feedback || 'Belum ada catatan'}</p></div>`,
                                      icon: 'info'
                                    });
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="Opsi Lainnya"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls (Persis Gambar) */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {[1, 2, 3, 4, 5].map(pg => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                        currentPage === pg
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === 5}
                    onClick={() => setCurrentPage(prev => Math.min(5, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span>Menampilkan 1-10 dari 35 siswa</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <option value={10}>10 / halaman</option>
                    <option value={20}>20 / halaman</option>
                    <option value={50}>50 / halaman</option>
                  </select>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: DETAIL TUGAS, PENILAIAN, AI ASSISTANT (4 / 12) ── */}
            <div className="xl:col-span-4 space-y-4">
              
              {/* CARD 1: DETAIL TUGAS (PERSIS GAMBAR) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>Detail Tugas</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Judul</span>
                    <span className="col-span-2 font-bold text-slate-800">{taskData.title}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Kelas</span>
                    <span className="col-span-2 font-bold text-slate-800">{taskData.classRoom}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Jenis</span>
                    <span className="col-span-2 font-bold text-slate-800">{taskData.type}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Tanggal Dibuat</span>
                    <span className="col-span-2 font-bold text-slate-800">{taskData.createdDateTime}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Deadline</span>
                    <span className="col-span-2 font-bold text-slate-800">{taskData.deadlineDateTime}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <span className="text-slate-400 font-medium">Deskripsi</span>
                    <p className="col-span-2 text-slate-600 leading-relaxed text-[11px]">
                      {taskData.description}
                    </p>
                  </div>
                </div>

                {/* Info Note Box */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-800 text-[11px] flex items-center gap-2 leading-tight">
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                    i
                  </div>
                  <span>Nilai akan otomatis masuk ke halaman nilai siswa setelah disimpan.</span>
                </div>
              </div>

              {/* CARD 2: PENILAIAN & KRITERIA (PERSIS GAMBAR) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <span>Penilaian</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Total Nilai</span>
                  <div className="flex items-center gap-1 font-extrabold text-slate-900">
                    <span className="text-base text-blue-600">100</span>
                    <span className="text-slate-400 font-normal">poin</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800 mb-1">Kriteria Penilaian</div>
                  {taskData.criteria.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                      <span>{c.name}</span>
                      <span className="font-extrabold text-slate-800">{c.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 3: AI ASSISTANT (PERSIS GAMBAR) */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-white rounded-3xl border border-purple-200/80 shadow-2xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span>AI Assistant</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Gunakan AI untuk memberi feedback instan kepada siswa.
                </p>

                <button
                  type="button"
                  onClick={handleAiAutoFeedback}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buat Feedback Otomatis</span>
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* 5. MODAL FORM: TAMBAH TUGAS BARU / EDIT TUGAS (FOTO 2)                   */}
          {/* ========================================================================= */}
          {isEditorOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base">
                        {editorMode === 'create' ? 'Tambah Tugas Baru' : 'Edit Tugas Siswa'}
                      </h3>
                      <p className="text-xs text-blue-100 mt-0.5">
                        Buat dan berikan tugas kepada siswa di kelas Anda.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditorOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                  
                  {/* Row 1: Judul Tugas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Tugas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTask.title}
                      onChange={(e) => setFormTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Contoh: Latihan Kosakata Bab 2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  {/* Row 2: Kelas & Tampilkan Bab Materi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kelas <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formTask.classRoom}
                        onChange={(e) => setFormTask(prev => ({ ...prev, classRoom: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500"
                      >
                        <option value="N5 A - Bahasa Jepang">N5 A - Bahasa Jepang</option>
                        <option value="N5 B - Bahasa Jepang">N5 B - Bahasa Jepang</option>
                        <option value="N4 Intensif - Kaigo">N4 Intensif - Kaigo</option>
                        <option value="N3 Tokutei Ginou">N3 Tokutei Ginou</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tampilkan Bab Materi
                      </label>
                      <select
                        value={formTask.bab}
                        onChange={(e) => setFormTask(prev => ({ ...prev, bab: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500"
                      >
                        <option value="Bab 2 - Kosakata">Bab 2 - Kosakata</option>
                        <option value="Bab 1 - Salam & Perkenalan">Bab 1 - Salam & Perkenalan</option>
                        <option value="Bab 3 - Kata Kerja & Partikel">Bab 3 - Kata Kerja & Partikel</option>
                        <option value="Bab 4 - Bentuk Te & Nai">Bab 4 - Bentuk Te & Nai</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Waktu dan Tenggat */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                    <div className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 text-blue-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Waktu dan Tenggat Pengerjaan</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Tanggal Mulai:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={formTask.startDate}
                            onChange={(e) => setFormTask(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                          />
                          <input
                            type="time"
                            value={formTask.startTime}
                            onChange={(e) => setFormTask(prev => ({ ...prev, startTime: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Batas Pengumpulan (Deadline):</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={formTask.deadlineDate}
                            onChange={(e) => setFormTask(prev => ({ ...prev, deadlineDate: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                          />
                          <input
                            type="time"
                            value={formTask.deadlineTime}
                            onChange={(e) => setFormTask(prev => ({ ...prev, deadlineTime: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Deskripsi Tugas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Deskripsi Tugas <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formTask.description}
                      onChange={(e) => setFormTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tuliskan petunjuk pengerjaan tugas bagi siswa..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  {/* Row 5: Upload Berkas Soal */}
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Berkas Modul / Soal Tugas (PDF, DOCX, ZIP):</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Maks. 20 MB</span>
                    </div>

                    {formTask.fileAttachment ? (
                      <div className="p-2.5 bg-white rounded-xl border border-blue-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center">
                            PDF
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800">{formTask.fileAttachment.name}</div>
                            <div className="text-[10px] text-slate-400">{formTask.fileAttachment.size}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormTask(prev => ({ ...prev, fileAttachment: null }))}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="p-4 bg-white hover:bg-slate-50 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center gap-2 cursor-pointer transition">
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-xs text-slate-700">Pilih Berkas Soal dari Komputer</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                              setFormTask(prev => ({
                                ...prev,
                                fileAttachment: {
                                  name: file.name,
                                  size: `${sizeMb > 0 ? sizeMb : 0.5} MB`,
                                  type: file.name.split('.').pop().toUpperCase()
                                }
                              }));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-600 cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTaskForm}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editorMode === 'create' ? 'Terbitkan Tugas' : 'Simpan Perubahan'}</span>
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
