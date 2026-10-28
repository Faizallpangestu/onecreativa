import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  Trophy, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Award,
  Mic,
  GraduationCap,
  Sparkles,
  Info,
  Check,
  BarChart3,
  Users,
  Eye,
  Plus
} from 'lucide-react';
import Swal from 'sweetalert2';
import animeGirlCheerImg from '../../assets/anime_girl_cheer.jpg';
import {
  getStoredStudents,
  getStoredTasks,
  getStoredGrades,
  getAllStudentsWithGradeSummary
} from '../../services/lmsStudentData';

export default function LmsNilai() {
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedSemester, setSelectedSemester] = useState('Semester Ganjil 2026');
  const [activeTab, setActiveTab] = useState('rekap'); // 'rekap' | 'rincian' | 'grafik' | 'perbandingan'
  const [students, setStudents] = useState(() => getStoredStudents());
  const [tasks, setTasks] = useState(() => getStoredTasks());
  const [grades, setGrades] = useState(() => getStoredGrades());
  const [selectedStudentId, setSelectedStudentId] = useState('ALL');

  useEffect(() => {
    const refreshData = () => {
      setStudents(getStoredStudents());
      setTasks(getStoredTasks());
      setGrades(getStoredGrades());
    };
    refreshData();
    window.addEventListener('lms_data_sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('lms_data_sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  // Rekap ringkas seluruh siswa
  const studentSummaries = useMemo(() => {
    return getAllStudentsWithGradeSummary(selectedClass);
  }, [students, tasks, grades, selectedClass]);

  // Siswa aktif yang sedang dilihat lembar nilainya
  const activeStudent = useMemo(() => {
    if (selectedStudentId === 'ALL') {
      return students[0] || null;
    }
    return students.find(s => s.id === selectedStudentId || s.studentId === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Kelompok rincian nilai terhubung dengan tugas & nilai riil
  const gradeGroups = useMemo(() => {
    const taskItems = tasks.map((t, idx) => {
      const g = activeStudent ? (grades[t.id]?.[activeStudent.id] || grades[t.id]?.[activeStudent.studentId]) : null;
      const score = g && g.score !== '' && g.score !== null ? Number(g.score) : 85;
      const finalScore = Math.round(score * 0.2);
      return {
        no: idx + 1,
        title: t.title,
        date: t.createdDate || '12 Okt 2026',
        score,
        weight: '20%',
        finalScore,
        status: g && g.status ? g.status : 'Selesai'
      };
    });

    const avgTasks = taskItems.length > 0
      ? Math.round(taskItems.reduce((acc, curr) => acc + curr.score, 0) / taskItems.length)
      : 85;

    return [
      {
        id: 'tugas',
        title: 'Tugas',
        average: avgTasks,
        weight: '20%',
        color: 'blue',
        badgeClass: 'bg-blue-50 text-blue-600 border-blue-200',
        iconBg: 'bg-blue-500',
        icon: BookOpen,
        items: taskItems.length > 0 ? taskItems : [
          {
            no: 1,
            title: 'Latihan Menulis Hiragana',
            date: '5 Okt 2026',
            score: 90,
            weight: '20%',
            finalScore: 18,
            status: 'Selesai'
          }
        ]
      },
      {
        id: 'quiz',
        title: 'Quiz',
        average: 82,
        weight: '20%',
        color: 'purple',
        badgeClass: 'bg-purple-50 text-purple-600 border-purple-200',
        iconBg: 'bg-purple-500',
        icon: FileText,
        items: [
          {
            no: 1,
            title: 'Quiz Kosakata Bab 1',
            date: '8 Okt 2026',
            score: 80,
            weight: '20%',
            finalScore: 16,
            status: 'Selesai'
          },
          {
            no: 2,
            title: 'Quiz Tata Bahasa',
            date: '15 Okt 2026',
            score: 85,
            weight: '20%',
            finalScore: 17,
            status: 'Selesai'
          }
        ]
      },
      {
        id: 'ujian',
        title: 'Ujian',
        average: 78,
        weight: '30%',
        color: 'rose',
        badgeClass: 'bg-rose-50 text-rose-600 border-rose-200',
        iconBg: 'bg-rose-500',
        icon: GraduationCap,
        items: [
          {
            no: 1,
            title: 'Ujian Kompetensi N5 - Bab 1',
            date: '20 Okt 2026',
            score: 78,
            weight: '30%',
            finalScore: 23.4,
            status: 'Selesai'
          }
        ]
      },
      {
        id: 'praktik',
        title: 'Praktik',
        average: 88,
        weight: '30%',
        color: 'amber',
        badgeClass: 'bg-amber-50 text-amber-600 border-amber-200',
        iconBg: 'bg-amber-500',
        icon: Mic,
        items: [
          {
            no: 1,
            title: 'Percakapan Sehari-hari',
            date: '25 Okt 2026',
            score: 85,
            weight: '15%',
            finalScore: 12.8,
            status: 'Selesai'
          }
        ]
      }
    ];
  }, [tasks, grades, activeStudent]);

  const handleShowDetail = (item, groupTitle) => {
    Swal.fire({
      title: `${item.title}`,
      html: `
        <div class="text-left text-xs space-y-2 mt-3 text-slate-600">
          <div class="p-3 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-200">
            <div class="flex justify-between"><span>Kategori:</span> <b>${groupTitle}</b></div>
            <div class="flex justify-between"><span>Tanggal Dinilai:</span> <b>${item.date}</b></div>
            <div class="flex justify-between"><span>Bobot Penilaian:</span> <b>${item.weight}</b></div>
            <div class="flex justify-between text-blue-600 font-bold"><span>Nilai Murni:</span> <b>${item.score} / 100</b></div>
            <div class="flex justify-between text-emerald-600 font-bold"><span>Kontribusi Nilai Akhir:</span> <b>+${item.finalScore} poin</b></div>
          </div>
          <p class="text-[11px] text-slate-400 text-center mt-2">Diverifikasi oleh Sensei Pengajar LMS Creativa</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#2563eb',
      customClass: { popup: 'rounded-3xl' }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans">
        
        {/* ============================================================ */}
        {/* HEADER SECTION (EXACT 1:1 WITH REFERENCE) */}
        {/* ============================================================ */}
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-5">
          <div className="max-w-[1450px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">Nilai</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Nilai Saya
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Lihat hasil belajar dan perkembangan nilai Anda.
              </p>
            </div>

            {/* Top Right Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Student Picker if students exist */}
              {students.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="bg-white border border-blue-200 text-blue-700 rounded-xl px-3.5 py-2 text-xs font-bold outline-none cursor-pointer pr-7 appearance-none shadow-xs hover:border-blue-400 transition-all"
                  >
                    <option value="ALL">Semua Siswa Terdaftar</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.classRoom})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Class Dropdown */}
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer pr-7 appearance-none shadow-xs hover:border-blue-400 transition-all"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  <option value="N5">Kelas N5</option>
                  <option value="N4">Kelas N4</option>
                  <option value="N3">Kelas N3</option>
                  <option value="N2">Kelas N2</option>
                  <option value="N1">Kelas N1</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Semester Dropdown */}
              <div className="relative">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer pr-7 appearance-none shadow-xs hover:border-blue-400 transition-all"
                >
                  <option value="Semester Ganjil 2026">Semester Ganjil 2026</option>
                  <option value="Semester Genap 2026">Semester Genap 2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY AREA */}
        {/* ============================================================ */}
        <div className="max-w-[1450px] mx-auto px-4 md:px-8 mt-6 space-y-6">
          
          {/* TOP CARD: RATA-RATA NILAI SAYA & 4 KOMPONEN */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Side: Circular Gauge (83 dari 100) */}
              <div className="lg:col-span-4 xl:col-span-3 flex items-center justify-center lg:border-r lg:border-slate-100 lg:pr-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    {/* Background Track */}
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      className="text-slate-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Value Progress (83%) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke="url(#grade-gradient)"
                      strokeWidth="10"
                      strokeDasharray="301.6"
                      strokeDashoffset={301.6 * (1 - 0.83)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="grade-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Inside Text */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-black text-slate-900 tracking-tight block">
                      83
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 block -mt-0.5">
                      dari 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Header + 4 Components Cards */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                
                {/* Title badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Rata-rata Nilai Saya
                      </h2>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        Kategori: Baik
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Components Mini Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {/* Tugas */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 leading-none">
                        85
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">
                        Tugas
                      </div>
                    </div>
                  </div>

                  {/* Quiz */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 leading-none">
                        82
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">
                        Quiz
                      </div>
                    </div>
                  </div>

                  {/* Ujian */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 leading-none">
                        78
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">
                        Ujian
                      </div>
                    </div>
                  </div>

                  {/* Praktik */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 leading-none">
                        88
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">
                        Praktik
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* TABS BAR (Rekap Siswa, Rincian Nilai, Grafik, Perbandingan) */}
          {/* ============================================================ */}
          <div className="flex items-center gap-6 border-b border-slate-200 px-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('rekap')}
              className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'rekap'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Rekap Nilai Siswa</span>
            </button>
            <button
              onClick={() => setActiveTab('rincian')}
              className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'rincian'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Lembar Nilai Rinci {activeStudent ? `(${activeStudent.name})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('grafik')}
              className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'grafik'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Grafik Perkembangan
            </button>
            <button
              onClick={() => setActiveTab('perbandingan')}
              className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'perbandingan'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Perbandingan Kelas
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB: REKAP NILAI SISWA (DAFTAR SELURUH SISWA)                */}
          {/* ============================================================ */}
          {activeTab === 'rekap' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Rekapitulasi Nilai Siswa Terdaftar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar akumulasi nilai siswa yang terhubung langsung dengan modul Tugas & Quiz.</p>
                </div>
                <Link
                  to="/lpk-intensif"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Siswa</span>
                </Link>
              </div>

              {studentSummaries.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Siswa Terdaftar</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
                    Data siswa yang Anda daftarkan di menu Siswa (LPK Intensif) akan otomatis muncul pada lembar rekap nilai ini.
                  </p>
                  <Link
                    to="/lpk-intensif"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Daftarkan Siswa</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4">Siswa</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4">Program</th>
                        <th className="py-3 px-4 text-center">Tugas Selesai</th>
                        <th className="py-3 px-4 text-center">Rata-rata Nilai</th>
                        <th className="py-3 px-4 text-center">Predikat</th>
                        <th className="py-3 px-4 text-center">Kehadiran</th>
                        <th className="py-3 px-4 text-right pr-6">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {studentSummaries.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-400">{s.no}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <div className="font-extrabold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-400">{s.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">{s.classRoom}</td>
                          <td className="py-3 px-4 text-slate-500">{s.program}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">{s.completedTasks}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900">{s.avgScore} / 100</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              s.letterGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                              s.letterGrade === 'B+' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {s.letterGrade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 font-bold">{s.attendance}</td>
                          <td className="py-3 px-4 text-right pr-6">
                            <button
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setActiveTab('rincian');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200/80 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Lembar Nilai</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 1: RINCIAN NILAI (TABLE VIEW - 1:1 WITH REFERENCE) */}
          {/* ============================================================ */}
          {activeTab === 'rincian' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  {/* Table Headers */}
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Jenis Penilaian</th>
                      <th className="py-3 px-4">Judul</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4 text-center">Nilai</th>
                      <th className="py-3 px-4 text-center">Bobot</th>
                      <th className="py-3 px-4 text-center">Nilai Akhir</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {gradeGroups.map((group) => (
                      <tbody key={group.id} className="contents">
                        {/* Group Category Header Row */}
                        <tr className="bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
                          <td className="py-3 px-4 text-center">
                            <div className={`w-7 h-7 rounded-lg ${group.iconBg} text-white flex items-center justify-center mx-auto shadow-xs`}>
                              <group.icon className="w-3.5 h-3.5" />
                            </div>
                          </td>
                          <td colSpan={2} className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {group.title}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                Rata-rata: <b className="text-slate-800">{group.average}</b>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800"></td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800 text-[11px]">
                            {group.weight}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          </td>
                          <td className="py-3 px-4"></td>
                        </tr>

                        {/* Child Rows for this Category */}
                        {group.items.map((item) => (
                          <tr 
                            key={item.no} 
                            onClick={() => handleShowDetail(item, group.title)}
                            className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4 text-center text-slate-400 font-semibold text-[11px]">
                              {item.no}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-xs">
                              {/* Empty placeholder aligning with layout */}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                              {item.title}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                              {item.date}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-xs">
                              {item.score}
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                              {item.weight}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-xs">
                              {item.finalScore}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: GRAFIK PERKEMBANGAN */}
          {/* ============================================================ */}
          {activeTab === 'grafik' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Trend Perkembangan Nilai Siswa</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Grafik pergerakan nilai dari pertemuan pertama hingga evaluasi terakhir.</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                  ↑ Rata-rata meningkat +4.2 poin
                </span>
              </div>

              {/* Progress Chart Visual */}
              <div className="h-64 flex items-end justify-between gap-4 pt-8 border-b border-slate-100">
                {[
                  { name: 'Tugas 1', val: 90, color: 'bg-blue-500' },
                  { name: 'Quiz 1', val: 80, color: 'bg-purple-500' },
                  { name: 'Tugas 2', val: 80, color: 'bg-blue-500' },
                  { name: 'Quiz 2', val: 85, color: 'bg-purple-500' },
                  { name: 'Tugas 3', val: 85, color: 'bg-blue-500' },
                  { name: 'Ujian N5', val: 78, color: 'bg-rose-500' },
                  { name: 'Quiz 3', val: 80, color: 'bg-purple-500' },
                  { name: 'Praktik 1', val: 85, color: 'bg-amber-500' },
                  { name: 'Praktik 2', val: 90, color: 'bg-amber-500' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bar.val}
                    </span>
                    <div 
                      className={`w-full max-w-[42px] ${bar.color} rounded-t-xl group-hover:brightness-110 transition-all shadow-xs`}
                      style={{ height: `${(bar.val / 100) * 180}px` }}
                    />
                    <span className="text-[10px] font-bold text-slate-500 text-center truncate w-full mt-1">
                      {bar.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: PERBANDINGAN KELAS */}
          {/* ============================================================ */}
          {activeTab === 'perbandingan' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Perbandingan dengan Rata-rata Kelas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Membandingkan capaian nilai Anda terhadap rata-rata dan nilai tertinggi kelas.</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Tugas Harian', student: 85, classAvg: 80, highest: 95 },
                  { title: 'Quiz Evaluasi', student: 82, classAvg: 78, highest: 96 },
                  { title: 'Ujian Kompetensi', student: 78, classAvg: 75, highest: 92 },
                  { title: 'Praktik & Kaiwa', student: 88, classAvg: 82, highest: 94 },
                ].map((row, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{row.title}</span>
                      <span className="text-blue-600">Nilai Anda: <b>{row.student}</b> / Rata-rata: {row.classAvg}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${row.student}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* BOTTOM CARD: ANIME GIRL MOTIVATION (1:1 WITH REFERENCE) */}
          {/* ============================================================ */}
          <div className="relative bg-gradient-to-r from-pink-50 via-rose-50/60 to-pink-50/30 border border-pink-100/90 rounded-3xl p-6 md:p-8 shadow-xs overflow-hidden flex flex-col sm:flex-row items-center gap-6">
            
            {/* Anime Girl Cheering Illustration */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 rounded-2xl overflow-hidden border border-pink-200 shadow-sm bg-white">
              <img
                src={animeGirlCheerImg}
                alt="Anime Schoolgirl Cheering"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Motivational Quotes */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <span>Terus Semangat!</span>
                <Sparkles className="w-5 h-5 text-pink-500 fill-pink-400" />
              </h3>

              <div className="text-sm md:text-base font-extrabold text-pink-600 mt-1 font-sans">
                継続は力なり
              </div>

              <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Setiap usaha hari ini adalah langkah menuju masa depan yang lebih baik.
              </p>

              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-pink-700 bg-pink-100/60 px-3 py-1 rounded-xl w-fit">
                <span>🌸 Gambatte kudasai! Raih impianmu ke Jepang!</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
