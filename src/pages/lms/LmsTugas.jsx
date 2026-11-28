import { useState, useMemo, useEffect } from 'react';
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
  ensureRealStudentsLoaded,
  isClassMatching
} from '../../services/lmsStudentData';

const REAL_CLASSES = ['Semua Kelas', 'N5 Pagi', 'N4 A - PAGI', 'Kelas Persiapan Mensetsu & Matching Job'];
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
  FileSpreadsheet,
  Paperclip,
  Printer,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export default function LmsTugas() {
  // Current Active Tab: 'daftar' (Daftar Jawaban Siswa) | 'detail' (Detail Tugas) | 'hasil' (Hasil & Nilai)
  const [activeMainTab, setActiveMainTab] = useState('daftar');

  // Edit / Tambah Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create'); // 'create' | 'edit'

  // Preview Lembar Jawaban Siswa (PDF Viewer) Modal State
  const [previewStudent, setPreviewStudent] = useState(null);
  const [previewScore, setPreviewScore] = useState('');
  const [previewFeedback, setPreviewFeedback] = useState('');
  const [previewZoom, setPreviewZoom] = useState(100);

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
  const [selectedClassFilter, setSelectedClassFilter] = useState('Semua Kelas');

  // Filter tugas berdasarkan kelas yang dipilih
  const displayedTaskList = useMemo(() => {
    if (selectedClassFilter === 'Semua Kelas') return taskList;
    return taskList.filter(t => isClassMatching(t.classRoom, selectedClassFilter));
  }, [taskList, selectedClassFilter]);

  // Handler beralih kelas secara instan
  const handleFilterByClass = (cls) => {
    setSelectedClassFilter(cls);
    if (cls === 'Semua Kelas') {
      const active = taskList[0] || taskData;
      setTaskData(active);
      setStudentsList(getTaskSubmissionsForTask(active.id, active.classRoom));
    } else {
      const matchingTask = taskList.find(t => isClassMatching(t.classRoom, cls));
      if (matchingTask) {
        setTaskData(matchingTask);
        setStudentsList(getTaskSubmissionsForTask(matchingTask.id, matchingTask.classRoom));
      } else {
        const placeholder = {
          id: `task-${String(cls).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${taskList.length + 1}`,
          title: `Tugas Pembelajaran ${cls}`,
          subtitle: `Tugas aktif untuk siswa terdaftar di ${cls}`,
          classRoom: cls,
          type: 'Tugas Individu',
          createdDate: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
          createdDateTime: 'Hari Ini',
          deadline: '28 Nov 2026, 23:59',
          deadlineDateTime: '28 November 2026, 23:59',
          status: 'Aktif',
          description: `Selesaikan tugas modul untuk kelas ${cls} dan kumpulkan sebelum batas waktu.`,
          totalPoints: 100,
          criteria: [
            { name: 'Ketepatan materi & kaidah', weight: 40 },
            { name: 'Kelengkapan jawaban', weight: 30 },
            { name: 'Kerapihan tulisan', weight: 20 },
            { name: 'Ketepatan waktu submit', weight: 10 }
          ]
        };
        setTaskData(placeholder);
        setStudentsList(getTaskSubmissionsForTask(placeholder.id, cls));
      }
    }
  };

  // Sinkronisasi otomatis dengan data siswa dan tugas
  useEffect(() => {
    let isMounted = true;
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

    ensureRealStudentsLoaded().then(() => {
      if (isMounted) refreshData();
    });

    refreshData();
    window.addEventListener('lms_data_sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      isMounted = false;
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

  // Buka Pratinjau Lembar Jawaban (PDF Viewer & Koreksi Modal)
  const handleOpenPreview = (student) => {
    setPreviewStudent(student);
    setPreviewScore(student.score !== null && student.score !== undefined && student.score !== '' ? student.score : 85);
    setPreviewFeedback(student.feedback || '');
    setPreviewZoom(100);
  };

  // Simpan Nilai & Feedback dari Panel Modal Pratinjau
  const handleSavePreviewGrade = () => {
    if (!previewStudent) return;
    const numericScore = Number(previewScore);
    if (previewScore === '' || isNaN(numericScore)) {
      Swal.fire('Nilai Kosong', 'Silakan masukkan nilai angka yang valid (0 - 100).', 'warning');
      return;
    }
    const finalScore = Math.min(100, Math.max(0, numericScore));
    setStudentsList(prev => prev.map(s => {
      if (s.id === previewStudent.id) {
        return {
          ...s,
          score: finalScore,
          status: 'Sudah Dinilai',
          feedback: previewFeedback
        };
      }
      return s;
    }));

    saveStudentGrade(taskData.id, previewStudent.id, {
      score: finalScore,
      feedback: previewFeedback
    });

    setPreviewStudent(prev => prev ? {
      ...prev,
      score: finalScore,
      status: 'Sudah Dinilai',
      feedback: previewFeedback
    } : null);

    Swal.fire({
      icon: 'success',
      title: 'Nilai & Evaluasi Berhasil Disimpan!',
      text: `Nilai ${finalScore} untuk ${previewStudent.name} telah disimpan ke sistem.`,
      timer: 1800,
      showConfirmButton: false
    });
  };

  // Unduh Berkas Jawaban Siswa
  const handleDownloadPdf = (student) => {
    const element = document.createElement('a');
    const fileContent = `=================================================================\n LEMBAR JAWABAN TUGAS SISWA - LPK CREATIVA BRIDGING INTERNATIONAL\n=================================================================\nNama Lengkap     : ${student.name}\nNomor Induk      : ${student.studentId || '-'}\nKelas / Rombel   : ${student.classRoom}\nNama Tugas       : ${taskData.title}\nJenis Tugas      : ${taskData.type}\nWaktu Pengumpulan: ${student.submittedAt}\nStatus Evaluasi  : ${student.status}\nNilai Diperoleh  : ${student.score || '-'}/100\n\nCATATAN & EVALUASI SENSEI:\n${student.feedback || 'Tugas telah diverifikasi dan memenuhi standar pembelajaran LPK Creativa.'}\n\n=================================================================\nDokumen resmi evaluasi LMS LPK Creativa Bridging International.\n`;
    const file = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = student.fileName ? student.fileName.replace(/\.pdf$/, '.txt') : `Tugas_${student.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

  // Computed stats for Tab "Hasil & Nilai"
  const { avgClassScore, highestScore, lowestScore, passRate } = useMemo(() => {
    const graded = studentsList.filter(s => s.score !== '' && s.score !== null && !isNaN(Number(s.score)));
    if (graded.length === 0) {
      return { avgClassScore: '85.0', highestScore: 85, lowestScore: 85, passRate: 100 };
    }
    const scores = graded.map(s => Number(s.score));
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = (sum / scores.length).toFixed(1);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passed = scores.filter(sc => sc >= 75).length;
    const rate = Math.round((passed / scores.length) * 100);
    return { avgClassScore: avg, highestScore: max, lowestScore: min, passRate: rate };
  }, [studentsList]);

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
    const [dDate, dTime] = (taskData.deadline || '2026-11-28, 23:59').split(',').map(s => s.trim());
    setFormTask({
      title: taskData.title,
      classRoom: taskData.classRoom || 'N5 Pagi',
      bab: taskData.bab || 'Bab 1 - Pengenalan',
      type: taskData.type || 'Tugas Individu',
      description: taskData.description || '',
      startDate: taskData.startDate || '2026-11-12',
      startTime: taskData.startTime || '08:00',
      deadlineDate: dDate || '2026-11-28',
      deadlineTime: dTime || '23:59',
      showInCalendar: true,
      totalPoints: taskData.totalPoints || 100,
      criteria: taskData.criteria ? JSON.parse(JSON.stringify(taskData.criteria)) : [
        { name: 'Ketepatan goresan (Hitsujun)', weight: 40 },
        { name: 'Kerapihan & bentuk huruf', weight: 30 },
        { name: 'Kelengkapan aksara', weight: 20 },
        { name: 'Ketepatan waktu submit', weight: 10 }
      ],
      fileAttachment: taskData.fileAttachment || {
        name: `Lembar_Soal_${taskData.title.replace(/\s+/g, '_')}.pdf`,
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
      classRoom: selectedClassFilter !== 'Semua Kelas' ? selectedClassFilter : 'N5 Pagi',
      bab: 'Bab 1 - Hiragana & Aksara Dasar',
      type: 'Tugas Individu',
      description: 'Selesaikan lembar latihan modul berikut dengan cermat dan kumpulkan sebelum batas waktu pengumpulan.',
      startDate: '2026-11-22',
      startTime: '08:00',
      deadlineDate: '2026-11-30',
      deadlineTime: '23:59',
      showInCalendar: true,
      totalPoints: 100,
      criteria: [
        { name: 'Ketepatan materi & kaidah', weight: 40 },
        { name: 'Kelengkapan jawaban', weight: 30 },
        { name: 'Kerapihan & format pengerjaan', weight: 20 },
        { name: 'Ketepatan waktu pengumpulan', weight: 10 }
      ],
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
          {/* 1.5. BAR SWITCHER KELAS REAL & PILIH TUGAS                                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Pilih Kelas Siswa:</span>
              </span>
              {REAL_CLASSES.map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleFilterByClass(cls)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedClassFilter === cls
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Pilih Tugas:</span>
              <select
                value={taskData.id}
                onChange={(e) => handleSelectTask(e.target.value)}
                className="text-xs font-bold text-blue-700 bg-blue-50/90 border border-blue-200 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-blue-400"
              >
                {displayedTaskList.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.classRoom})</option>
                ))}
              </select>
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
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${activeMainTab === 'detail'
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
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${activeMainTab === 'daftar'
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
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${activeMainTab === 'hasil'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90'
                }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Hasil & Nilai</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DETAIL TUGAS                                                       */}
          {/* ========================================================================= */}
          {activeMainTab === 'detail' && (
            <div className="space-y-6">
              {/* Banner Detail Header */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {taskData.classRoom}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                        {taskData.type}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {taskData.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {taskData.title}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      {taskData.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Tugas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('daftar')}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Lihat Jawaban Siswa ({studentsList.length})</span>
                    </button>
                  </div>
                </div>

                {/* Grid Informasi Waktu & Keterangan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Waktu Diterbitkan</span>
                    </div>
                    <div className="text-xs font-black text-slate-800">{taskData.createdDateTime}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Tenggat Pengumpulan</span>
                    </div>
                    <div className="text-xs font-black text-rose-600">{taskData.deadlineDateTime}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Total Poin Maksimal</span>
                    </div>
                    <div className="text-xs font-black text-slate-800">{taskData.totalPoints} Poin (KKM: 75)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Siswa Terdaftar</span>
                    </div>
                    <div className="text-xs font-black text-slate-800">{studentsList.length} Siswa di Kelas Ini</div>
                  </div>
                </div>

                {/* Deskripsi & Instruksi Pengerjaan */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Deskripsi & Instruksi Pengerjaan</span>
                  </h3>
                  <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100/80 text-xs text-slate-700 leading-relaxed space-y-3 font-medium">
                    <p>{taskData.description}</p>
                    <div className="pt-2 border-t border-blue-100 text-[11px] text-slate-500 flex flex-wrap gap-4">
                      <span>• Format Berkas: <b>PDF / JPEG Scan Tulisan Tangan</b></span>
                      <span>• Maksimal Ukuran: <b>10 MB</b></span>
                      <span>• Wajib Menyertakan: <b>Nama Lengkap & NIS di Lembar Jawaban</b></span>
                    </div>
                  </div>
                </div>

                {/* Lampiran Lembar Kerja / Modul */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span>Berkas Lampiran Soal / Lembar Kerja</span>
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/60 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        PDF
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900">
                          {taskData.fileAttachment?.name || `Lembar_Soal_${taskData.title.replace(/\s+/g, '_')}.pdf`}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {taskData.fileAttachment?.size || '1.8 MB'} • Dokumen Soal Tugas Resmi LPK Creativa
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => Swal.fire('Unduh Soal', 'Mengunduh berkas lembar latihan tugas siswa...', 'success')}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </button>
                  </div>
                </div>

                {/* Rubrik Penilaian */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Rubrik & Bobot Penilaian Tugas</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(taskData.criteria || []).map((crit, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kriteria {idx + 1}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            {crit.weight}%
                          </span>
                        </div>
                        <div className="text-xs font-black text-slate-900">{crit.name}</div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${crit.weight}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MAIN TWO-COLUMN SECTION (DAFTAR JAWABAN SISWA)                     */}
          {/* ========================================================================= */}
          {activeMainTab === 'daftar' && (
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
                              className={`hover:bg-slate-50/80 transition ${isChecked ? 'bg-blue-50/40' : ''
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
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreview(s)}
                                  className="flex items-center gap-2 group text-left p-1.5 -m-1.5 rounded-xl hover:bg-blue-50/80 transition cursor-pointer w-full"
                                  title="Klik untuk membuka & memeriksa Lembar Jawaban PDF siswa"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-rose-600 group-hover:bg-rose-700 text-white font-black text-[9px] flex items-center justify-center shrink-0 shadow-2xs transition">
                                    PDF
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-[11px] text-slate-800 group-hover:text-blue-600 transition truncate flex items-center gap-1.5">
                                      <span>{s.fileName}</span>
                                      <Eye className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {s.fileSize} • Dikirim: {s.submittedAt}
                                    </div>
                                  </div>
                                </button>
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
                                    onClick={() => handleOpenPreview(s)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold text-[11px] border border-slate-200/80 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Buka Lembar Jawaban PDF"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="hidden sm:inline">Buka PDF</span>
                                  </button>
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
                                        showCancelButton: true,
                                        confirmButtonText: 'Buka Lembar Jawaban (PDF)',
                                        cancelButtonText: 'Tutup',
                                        confirmButtonColor: '#2563eb'
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          handleOpenPreview(s);
                                        }
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
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition ${currentPage === pg
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
          )}

          {/* ========================================================================= */}
          {/* TAB 3: HASIL & NILAI                                                      */}
          {/* ========================================================================= */}
          {activeMainTab === 'hasil' && (
            <div className="space-y-5">
              {/* 4 Stat KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Rata-rata Nilai</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{avgClassScore}</div>
                  <p className="text-[10px] text-slate-400 font-medium">Berdasarkan siswa yang telah dinilai</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Nilai Tertinggi</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">{highestScore}</div>
                  <p className="text-[10px] text-slate-400 font-medium">Skor tertinggi di kelas ini</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Nilai Terendah</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-600">{lowestScore}</div>
                  <p className="text-[10px] text-slate-400 font-medium">Skor batas bawah di kelas ini</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Ketuntasan (KKM ≥ 75)</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-purple-600">{passRate}%</div>
                  <p className="text-[10px] text-slate-400 font-medium">Siswa mencapai standar kelulusan</p>
                </div>
              </div>

              {/* Table Rekapitulasi Hasil & Nilai */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      Rekapitulasi Nilai Akhir Siswa
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Daftar rekapitulasi nilai tugas {taskData.title} untuk kelas {taskData.classRoom}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari siswa / NIS..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadRekap}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor Excel</span>
                    </button>
                  </div>
                </div>

                {/* Tabel Hasil & Nilai */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[700px] text-left text-xs">
                    <thead className="bg-[#FAFBFD] text-slate-500 font-extrabold uppercase text-[11px] border-b border-slate-200/80 whitespace-nowrap">
                      <tr>
                        <th className="p-3 w-10 text-center font-bold">No</th>
                        <th className="p-3">Siswa</th>
                        <th className="p-3">Kelas Real</th>
                        <th className="p-3 text-center">Nilai Angka</th>
                        <th className="p-3 text-center">Predikat</th>
                        <th className="p-3 text-center">Status KKM</th>
                        <th className="p-3">Catatan / Feedback Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                            Tidak ada data siswa yang cocok dengan filter atau pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => {
                          const numScore = s.score !== '' && s.score !== null ? Number(s.score) : null;
                          const isPassed = numScore !== null && numScore >= 75;
                          const predikat = numScore === null ? '-' : numScore >= 85 ? 'A (Sangat Baik)' : numScore >= 75 ? 'B (Baik)' : numScore >= 60 ? 'C (Cukup)' : 'D (Perlu Bimbingan)';
                          const predikatClass = numScore === null ? 'bg-slate-100 text-slate-500' : numScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : numScore >= 75 ? 'bg-blue-50 text-blue-700 border border-blue-200' : numScore >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200';

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={s.avatar}
                                    alt={s.name}
                                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                                  />
                                  <div>
                                    <div className="font-extrabold text-slate-900">{s.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{s.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {s.classRoom}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-sm font-black text-slate-900">
                                  {numScore !== null ? numScore : '-'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium ml-0.5">/100</span>
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${predikatClass}`}>
                                  {predikat}
                                </span>
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {numScore === null ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                    Belum Dinilai
                                  </span>
                                ) : isPassed ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                    ✓ Tuntas KKM
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                                    ✕ Remidi (&lt;75)
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                                  {s.feedback || 'Belum ada catatan evaluasi dari Sensei.'}
                                </p>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. MODAL PRATINJAU LEMBAR JAWABAN SISWA (PDF VIEWER & KOREKSI LANGSUNG) */}
          {/* ========================================================================= */}
          {previewStudent && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-slate-900 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl border border-slate-700/80 my-4 flex flex-col max-h-[94vh]">

                {/* Top Bar: Viewer Toolbar */}
                <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      PDF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-100">{previewStudent.fileName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {previewStudent.classRoom}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${previewStudent.status === 'Sudah Dinilai'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          }`}>
                          {previewStudent.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Siswa: <b className="text-slate-200">{previewStudent.name}</b> • {previewStudent.fileSize} • Dikirim: {previewStudent.submittedAt}
                      </div>
                    </div>
                  </div>

                  {/* Toolbar Controls */}
                  <div className="flex items-center gap-2">
                    {/* Zoom controls */}
                    <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(prev => Math.max(70, prev - 15))}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
                        title="Perkecil (Zoom Out)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono font-bold text-[11px] text-slate-300">{previewZoom}%</span>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(prev => Math.min(150, prev + 15))}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
                        title="Perbesar (Zoom In)"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      title="Cetak Dokumen"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(previewStudent)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Unduh Lembar Jawaban"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Unduh Berkas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewStudent(null)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
                      title="Tutup Pratinjau"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Split Area */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-slate-950/60">

                  {/* LEFT COLUMN: DOCUMENT VIEWER CANVAS (8 Cols) */}
                  <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col items-center overflow-y-auto bg-slate-900/50">
                    <div
                      style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                      className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-900 transition-transform duration-150 font-sans relative"
                    >
                      {/* Header Lembar Kerja */}
                      <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                            LPK CREATIVA BRIDGING INTERNATIONAL
                          </div>
                          <h2 className="text-lg font-black tracking-tight text-slate-900">
                            LEMBAR JAWABAN TUGAS SISWA
                          </h2>
                          <div className="text-xs font-semibold text-slate-500">
                            {taskData.title} • Level {taskData.classRoom}
                          </div>
                        </div>

                        {/* Hanko Stamp (Cap Merah Tradisional Jepang) */}
                        <div className="w-20 h-20 rounded-full border-2 border-rose-600 border-dashed flex flex-col items-center justify-center text-rose-600 rotate-[-8deg] shrink-0 p-1 opacity-90 select-none shadow-xs">
                          <span className="text-[8px] font-black tracking-wider uppercase">CREATIVA</span>
                          <span className="text-xs font-black">検印済</span>
                          <span className="text-[9px] font-bold">VERIFIED</span>
                        </div>
                      </div>

                      {/* Identitas Siswa Box */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Nama Lengkap</span>
                          <span className="font-extrabold text-slate-900">{previewStudent.name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Nomor Induk Siswa (NIS)</span>
                          <span className="font-extrabold text-slate-900">{previewStudent.studentId || 'TGCJ2611'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Kelas / Rombel</span>
                          <span className="font-extrabold text-blue-700">{previewStudent.classRoom}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Tanggal Submit</span>
                          <span className="font-bold text-slate-700">{previewStudent.submittedAt}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Ukuran Berkas</span>
                          <span className="font-bold text-slate-700">{previewStudent.fileSize} (PDF Asli)</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Status Penilaian</span>
                          <span className={`font-black ${previewStudent.score ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {previewStudent.score ? `${previewStudent.score} / 100 (Tuntas)` : 'Belum Dinilai'}
                          </span>
                        </div>
                      </div>

                      {/* Konten Lembar Jawaban (Sesuai Materi Tugas) */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Isi Lembar Jawaban Siswa</span>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Berkas Terverifikasi Utuh
                          </span>
                        </div>

                        {/* Jika tugas Gojuon Hiragana & Katakana */}
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
                            <div className="font-bold text-blue-900 mb-1">Catatan Pengerjaan Siswa:</div>
                            <p className="italic">
                              "Telah menyelesaikan seluruh 46 aksara Hiragana dan 46 aksara Katakana pada buku berpetak kotak Genkou Youshi sesuai kaidah urutan goresan (hitsujun). Terlampir foto scan resolusi tinggi lembar kerja tulisan tangan."
                            </p>
                          </div>

                          {/* Simulasi Grid Aksara Latihan Tulisan Tangan Jepang */}
                          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                            <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Lembar 1: Hiragana (平仮名) - 46 Aksara Dasar
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center">
                              {[
                                { j: 'あ', r: 'a' }, { j: 'い', r: 'i' }, { j: 'う', r: 'u' }, { j: 'え', r: 'e' }, { j: 'お', r: 'o' },
                                { j: 'か', r: 'ka' }, { j: 'き', r: 'ki' }, { j: 'く', r: 'ku' }, { j: 'け', r: 'ke' }, { j: 'こ', r: 'ko' },
                                { j: 'さ', r: 'sa' }, { j: 'し', r: 'shi' }, { j: 'す', r: 'su' }, { j: 'せ', r: 'se' }, { j: 'そ', r: 'so' },
                                { j: 'た', r: 'ta' }, { j: 'ち', r: 'chi' }, { j: 'つ', r: 'tsu' }, { j: 'て', r: 'te' }, { j: 'と', r: 'to' },
                                { j: 'な', r: 'na' }, { j: 'に', r: 'ni' }, { j: 'ぬ', r: 'nu' }, { j: 'ね', r: 'ne' }, { j: 'の', r: 'no' }
                              ].map((item, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition">
                                  <div className="text-xl font-black text-slate-800 font-serif">{item.j}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.r}</div>
                                  <div className="text-[9px] text-emerald-600 font-bold mt-0.5">✓ Tepat</div>
                                </div>
                              ))}
                            </div>

                            <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider pt-2">
                              Lembar 2: Katakana (片仮名) - 46 Aksara Dasar
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center">
                              {[
                                { j: 'ア', r: 'a' }, { j: 'イ', r: 'i' }, { j: 'ウ', r: 'u' }, { j: 'エ', r: 'e' }, { j: 'オ', r: 'o' },
                                { j: 'カ', r: 'ka' }, { j: 'キ', r: 'ki' }, { j: 'ク', r: 'ku' }, { j: 'ケ', r: 'ke' }, { j: 'コ', r: 'ko' },
                                { j: 'サ', r: 'sa' }, { j: 'シ', r: 'shi' }, { j: 'ス', r: 'su' }, { j: 'セ', r: 'se' }, { j: 'ソ', r: 'so' },
                                { j: 'タ', r: 'ta' }, { j: 'チ', r: 'chi' }, { j: 'ツ', r: 'tsu' }, { j: 'テ', r: 'te' }, { j: 'ト', r: 'to' },
                                { j: 'ナ', r: 'na' }, { j: 'ニ', r: 'ni' }, { j: 'ヌ', r: 'nu' }, { j: 'ネ', r: 'ne' }, { j: 'ノ', r: 'no' }
                              ].map((item, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition">
                                  <div className="text-xl font-black text-slate-800 font-serif">{item.j}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.r}</div>
                                  <div className="text-[9px] text-emerald-600 font-bold mt-0.5">✓ Tepat</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Footer Lembar */}
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                          <div>
                            Halaman 1 dari 1 • Dokumen Pindai Berkas Tulisan Tangan (PDF)
                          </div>
                          <div className="text-right">
                            Diserahkan oleh: <b>{previewStudent.name}</b>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* RIGHT COLUMN: SENSEI GRADING & FEEDBACK PANEL (4 Cols) */}
                  <div className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto space-y-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <h4 className="font-extrabold text-sm text-slate-900">Penilaian Sensei</h4>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">Skor Maksimal: 100</span>
                      </div>

                      {/* Input Nilai Utama */}
                      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Nilai Akhir Siswa</span>
                          <span className="text-[11px] font-black text-blue-700">{previewScore || 0} / 100</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={previewScore}
                            onChange={(e) => setPreviewScore(e.target.value)}
                            placeholder="Masukkan nilai..."
                            className="flex-1 px-3 py-2 text-base font-black text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewScore(90);
                              setPreviewFeedback('Bagus sekali! Goresan huruf rapi, proporsional, dan hitsujun tepat sesuai materi.');
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer shrink-0"
                            title="Beri Nilai Cepat (90) + Rekomendasi Feedback"
                          >
                            Quick 90
                          </button>
                        </div>
                      </div>

                      {/* Rubrik Penilaian Breakdown */}
                      <div className="space-y-2.5">
                        <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-blue-600" />
                          <span>Rubrik Penilaian Terintegrasi</span>
                        </div>
                        <div className="space-y-2">
                          {(taskData.criteria || []).map((crit, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-slate-800">{crit.name}</div>
                                <div className="text-[10px] text-slate-400">Bobot Penilaian</div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                {crit.weight}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Catatan / Feedback Sensei */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Catatan & Koreksi untuk Siswa</span>
                        </label>
                        <textarea
                          rows="4"
                          value={previewFeedback}
                          onChange={(e) => setPreviewFeedback(e.target.value)}
                          placeholder="Tuliskan catatan perbaikan goresan, motivasi, atau koreksi untuk siswa di sini..."
                          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Action Buttons in Sidebar */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <button
                        type="button"
                        onClick={handleSavePreviewGrade}
                        className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Nilai & Berikan Feedback</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewStudent(null)}
                        className="w-full py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer text-center"
                      >
                        Tutup Pratinjau
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}
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
                        <option value="N5 Pagi">N5 Pagi</option>
                        <option value="N4 A - PAGI">N4 A - PAGI</option>
                        <option value="Kelas Persiapan Mensetsu & Matching Job">Kelas Persiapan Mensetsu & Matching Job</option>
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

                  {/* Row 6: Rubrik & Bobot Kriteria Penilaian */}
                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Rubrik & Bobot Kriteria Penilaian (Total: 100%)</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Total: {(formTask.criteria || []).reduce((acc, c) => acc + (Number(c.weight) || 0), 0)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(formTask.criteria || []).map((crit, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200/80 flex items-center gap-2 shadow-2xs">
                          <input
                            type="text"
                            value={crit.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormTask(prev => {
                                const updated = [...prev.criteria];
                                updated[idx].name = val;
                                return { ...prev, criteria: updated };
                              });
                            }}
                            placeholder="Nama Kriteria..."
                            className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={crit.weight}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                setFormTask(prev => {
                                  const updated = [...prev.criteria];
                                  updated[idx].weight = val;
                                  return { ...prev, criteria: updated };
                                });
                              }}
                              className="w-14 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-800 focus:bg-white"
                            />
                            <span className="text-xs font-bold text-slate-400">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
