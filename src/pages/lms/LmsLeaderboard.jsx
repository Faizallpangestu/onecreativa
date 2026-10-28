import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  Trophy, 
  Crown, 
  Target, 
  Star, 
  ChevronRight, 
  Users, 
  ChevronDown, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Award, 
  Eye, 
  X, 
  GraduationCap, 
  Sparkles, 
  Flame, 
  Medal,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import { getLeaderboardData } from '../../services/lmsStudentData';

export default function LmsLeaderboard() {
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2026');
  const [filterStudentScope, setFilterStudentScope] = useState('Semua Siswa'); // 'Semua Siswa' | 'Top 3' | 'Top 10'
  const [sortBy, setSortBy] = useState('Total Poin'); // 'Total Poin' | 'Nilai Rata-rata' | 'Kehadiran' | 'Tugas'
  
  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Master Students Data dynamically fetched from real registered students & grades
  const [students, setStudents] = useState(() => getLeaderboardData(selectedClass));

  useEffect(() => {
    const refreshData = () => {
      setStudents(getLeaderboardData(selectedClass));
    };
    refreshData();
    window.addEventListener('lms_data_sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('lms_data_sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [selectedClass]);

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Filter scope
    if (filterStudentScope === 'Top 3') {
      result = result.slice(0, 3);
    } else if (filterStudentScope === 'Top 10') {
      result = result.slice(0, 10);
    }

    // Sort
    if (sortBy === 'Total Poin') {
      result.sort((a, b) => b.totalPoints - a.totalPoints);
    } else if (sortBy === 'Nilai Rata-rata') {
      result.sort((a, b) => b.avgGrade - a.avgGrade);
    } else if (sortBy === 'Kehadiran') {
      result.sort((a, b) => parseInt(b.attendance) - parseInt(a.attendance));
    } else if (sortBy === 'Tugas') {
      result.sort((a, b) => parseInt(b.tasksScore) - parseInt(a.tasksScore));
    }

    return result;
  }, [students, filterStudentScope, sortBy]);

  // Top 3 Podium
  const rank1 = students.find(s => s.rank === 1) || students[0] || null;
  const rank2 = students.find(s => s.rank === 2) || students[1] || null;
  const rank3 = students.find(s => s.rank === 3) || students[2] || null;

  // Point Categories list
  const pointCategories = [
    {
      id: 1,
      title: 'Tugas',
      subtitle: 'Tugas harian & latihan',
      weight: '20%',
      icon: BookOpen,
      iconBg: 'bg-blue-600'
    },
    {
      id: 2,
      title: 'Quiz',
      subtitle: 'Quiz per pertemuan',
      weight: '20%',
      icon: CheckSquare,
      iconBg: 'bg-purple-600'
    },
    {
      id: 3,
      title: 'Ujian Kompetensi',
      subtitle: 'UTS & UAS',
      weight: '30%',
      icon: FileText,
      iconBg: 'bg-rose-500'
    },
    {
      id: 4,
      title: 'Partisipasi',
      subtitle: 'Diskusi & keaktifan',
      weight: '10%',
      icon: MessageSquare,
      iconBg: 'bg-emerald-500'
    },
    {
      id: 5,
      title: 'Kehadiran',
      subtitle: 'Presensi kelas',
      weight: '20%',
      icon: Crown,
      iconBg: 'bg-amber-500'
    }
  ];

  // Achievement Badges
  const achievementBadges = [
    { name: 'Top 3 Kelas', icon: Crown, bg: 'bg-amber-500 text-white' },
    { name: 'Kehadiran Sempurna', icon: CalendarIcon, bg: 'bg-blue-600 text-white' },
    { name: 'Tugas Terbaik', icon: BookOpen, bg: 'bg-purple-600 text-white' },
    { name: 'Nilai Tertinggi', icon: Star, bg: 'bg-rose-500 text-white' },
    { name: 'Aktif Diskusi', icon: MessageSquare, bg: 'bg-emerald-500 text-white' },
    { name: 'Peningkatan Nilai', icon: TrendingUp, bg: 'bg-amber-500 text-white' },
    { name: 'Konsisten', icon: Target, bg: 'bg-cyan-500 text-white' },
    { name: 'Lulus Ujian', icon: GraduationCap, bg: 'bg-indigo-600 text-white' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        
        {/* ================= TOP HEADER WITH SAKURA & MT FUJI ARTWORK ================= */}
        <div className="relative overflow-hidden bg-white border-b border-slate-100 shadow-sm px-6 py-6 md:px-8">
          <div 
            className="absolute top-0 right-0 w-[420px] h-full opacity-15 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)'
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1550px] mx-auto">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Kelas Saya</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-600 font-semibold">{selectedClass.replace('Kelas ', '')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">Papan Peringkat</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Papan Peringkat
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Lihat peringkat siswa berdasarkan total poin dan prestasi kelas ini.
              </p>
            </div>

            {/* Right: Class Selector Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-sm hover:border-blue-400 transition-all cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer pr-2 appearance-none"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  <option value="N5">Kelas N5</option>
                  <option value="N4">Kelas N4</option>
                  <option value="N3">Kelas N3</option>
                  <option value="N2">Kelas N2</option>
                  <option value="N1">Kelas N1</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= TOP PODIUM & MONTHLY LEADERBOARD GRID ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* 3 PODIUM CARDS (9 COLS) */}
            {!rank1 ? (
              <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 shadow-xs">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">Belum Ada Peringkat Siswa</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1 mb-5 leading-relaxed">
                  Peringkat siswa akan otomatis dihitung secara real-time berdasarkan akumulasi nilai tugas, quiz, dan presensi siswa yang terdaftar.
                </p>
                <Link
                  to="/lpk-intensif"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>+ Tambah Data Siswa</span>
                </Link>
              </div>
            ) : (
              <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* PODIUM 2 (SILVER - LEFT) */}
                <div className={`bg-gradient-to-b from-blue-50/80 via-white to-white border border-blue-100 rounded-3xl p-5 text-center relative shadow-sm hover:shadow-md transition-shadow ${!rank2 ? 'opacity-40' : ''}`}>
                  <div className="relative inline-block mt-2">
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-slate-300 via-blue-200 to-slate-100 shadow-sm mx-auto">
                      <img 
                        src={rank2?.avatar || 'https://ui-avatars.com/api/?name=Peringkat+2&background=3b82f6&color=fff'} 
                        alt={rank2?.name || 'Peringkat 2'} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-sm">
                      2
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mt-2.5">
                    {rank2?.name || 'Belum Ada'}
                  </h3>
                  
                  <div className="mt-1">
                    <span className="inline-block font-extrabold text-blue-600 bg-blue-50/90 border border-blue-200/60 rounded-full px-3 py-0.5 text-xs">
                      {rank2 ? `${rank2.totalPoints.toLocaleString()} poin` : '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Nilai</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {rank2?.avgGrade ?? '-'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        <span>Kehadiran</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {rank2?.attendance ?? '-'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Star className="w-3.5 h-3.5 text-blue-500" />
                        <span>Tugas</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {rank2?.tasksScore ?? '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PODIUM 1 (GOLD - CENTER) */}
                <div className="bg-gradient-to-b from-amber-50 via-amber-50/40 to-white border-2 border-amber-300/90 rounded-3xl p-6 text-center relative shadow-md md:-translate-y-2 hover:shadow-lg transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Crown className="w-8 h-8 text-amber-500 fill-amber-400 drop-shadow-md animate-bounce duration-1000" />
                  </div>

                  <div className="relative inline-block mt-3">
                    <div className="w-24 h-24 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-100 shadow-md ring-4 ring-amber-200/50 mx-auto">
                      <img 
                        src={rank1.avatar} 
                        alt={rank1.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                      1
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg mt-3">
                    {rank1.name}
                  </h3>
                  
                  <div className="mt-1">
                    <span className="inline-block font-black text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-4 py-1 text-sm shadow-xs">
                      {rank1.totalPoints.toLocaleString()} poin
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-amber-200/60 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Nilai</span>
                      </div>
                      <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {rank1.avgGrade}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                        <Target className="w-3.5 h-3.5 text-rose-500" />
                        <span>Kehadiran</span>
                      </div>
                      <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {rank1.attendance}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tugas</span>
                      </div>
                      <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {rank1.tasksScore}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PODIUM 3 (BRONZE - RIGHT) */}
                <div className={`bg-gradient-to-b from-orange-50/80 via-white to-white border border-orange-100 rounded-3xl p-5 text-center relative shadow-sm hover:shadow-md transition-shadow ${!rank3 ? 'opacity-40' : ''}`}>
                  <div className="relative inline-block mt-2">
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-orange-300 to-amber-100 shadow-sm mx-auto">
                      <img 
                        src={rank3?.avatar || 'https://ui-avatars.com/api/?name=Peringkat+3&background=ea580c&color=fff'} 
                        alt={rank3?.name || 'Peringkat 3'} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-sm">
                      3
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mt-2.5">
                    {rank3?.name || 'Belum Ada'}
                  </h3>
                  
                  <div className="mt-1">
                    <span className="inline-block font-extrabold text-purple-600 bg-purple-50/90 border border-purple-200/60 rounded-full px-3 py-0.5 text-xs">
                      {rank3 ? `${rank3.totalPoints.toLocaleString()} poin` : '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Nilai</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {rank3?.avgGrade ?? '-'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Target className="w-3.5 h-3.5 text-rose-500" />
                        <span>Kehadiran</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {rank3?.attendance ?? '-'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tugas</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {rank3?.tasksScore ?? '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TOP RIGHT: PERINGKAT BULAN INI (3 COLS) */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    Peringkat Bulan Ini
                  </h3>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 outline-none cursor-pointer pr-5 appearance-none"
                    >
                      <option value="Oktober 2026">Oktober 2026</option>
                      <option value="September 2026">September 2026</option>
                      <option value="Agustus 2026">Agustus 2026</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* 3 Top List Items */}
                <div className="space-y-3">
                  
                  {/* Rank 1 */}
                  <div 
                    onClick={() => setSelectedStudent(rank1)}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        1
                      </div>
                      <img 
                        src={rank1.avatar} 
                        alt={rank1.name} 
                        className="w-9 h-9 rounded-full object-cover border border-amber-300"
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Sakura+Tanaka'; }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {rank1.name}
                        </div>
                        <div className="text-[11px] font-bold text-amber-600">
                          {rank1.totalPoints.toLocaleString()} poin
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>

                  {/* Rank 2 */}
                  <div 
                    onClick={() => setSelectedStudent(rank2)}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        2
                      </div>
                      <img 
                        src={rank2.avatar} 
                        alt={rank2.name} 
                        className="w-9 h-9 rounded-full object-cover border border-blue-300"
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Arif+Rahman'; }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {rank2.name}
                        </div>
                        <div className="text-[11px] font-bold text-blue-600">
                          {rank2.totalPoints.toLocaleString()} poin
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>

                  {/* Rank 3 */}
                  <div 
                    onClick={() => setSelectedStudent(rank3)}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        3
                      </div>
                      <img 
                        src={rank3.avatar} 
                        alt={rank3.name} 
                        className="w-9 h-9 rounded-full object-cover border border-orange-300"
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Mika+Sato'; }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {rank3.name}
                        </div>
                        <div className="text-[11px] font-bold text-purple-600">
                          {rank3.totalPoints.toLocaleString()} poin
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>

                </div>
              </div>

              {/* Sub-note */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                Poin diperbarui otomatis setiap sesi berakhir
              </div>
            </div>

          </div>
        </div>

        {/* ================= BOTTOM SECTION: DAFTAR PERINGKAT & CATEGORIES ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ----------------- LEFT: DAFTAR PERINGKAT KELAS TABLE (8-9 COLS) ----------------- */}
            <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6">
              
              {/* Header with 3 Dropdown Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-slate-100 gap-3">
                <h2 className="text-base font-bold text-slate-800">
                  Daftar Peringkat Kelas
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter 1: Semua Siswa */}
                  <div className="relative">
                    <select
                      value={filterStudentScope}
                      onChange={(e) => setFilterStudentScope(e.target.value)}
                      className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer pr-6 appearance-none"
                    >
                      <option value="Semua Siswa">Semua Siswa</option>
                      <option value="Top 3">Top 3 Siswa</option>
                      <option value="Top 10">Top 10 Siswa</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>

                  {/* Filter 2: Urutkan Total Poin */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer pr-6 appearance-none"
                    >
                      <option value="Total Poin">Urutkan: Total Poin</option>
                      <option value="Nilai Rata-rata">Urutkan: Nilai</option>
                      <option value="Kehadiran">Urutkan: Kehadiran</option>
                      <option value="Tugas">Urutkan: Tugas</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>

                  {/* Filter 3: Bulan */}
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl pl-6 pr-6 py-1.5 outline-none cursor-pointer appearance-none"
                    >
                      <option value="Oktober 2026">Oktober 2026</option>
                      <option value="September 2026">September 2026</option>
                      <option value="Agustus 2026">Agustus 2026</option>
                    </select>
                    <CalendarIcon className="w-3 h-3 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
                      <th className="pb-3 pl-2 w-8">#</th>
                      <th className="pb-3">Nama Siswa</th>
                      <th className="pb-3 text-center">Total Poin</th>
                      <th className="pb-3 text-center">Nilai Rata-rata</th>
                      <th className="pb-3 text-center">Kehadiran</th>
                      <th className="pb-3 text-center">Tugas</th>
                      <th className="pb-3 text-center">Quiz</th>
                      <th className="pb-3 text-center">Ujian</th>
                      <th className="pb-3 text-center">Badge</th>
                      <th className="pb-3 text-right pr-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="py-12 text-center">
                          <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2.5">
                            <Users className="w-8 h-8 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700">Belum Ada Data Siswa pada Papan Peringkat</p>
                            <p className="text-xs text-slate-400">Silakan tambahkan data siswa melalui menu Siswa (LPK Intensif).</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors group">
                          
                          {/* Rank Icon or Number */}
                          <td className="py-3 pl-2">
                            {s.rank === 1 && (
                              <div className="w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                1
                              </div>
                            )}
                            {s.rank === 2 && (
                              <div className="w-6 h-6 rounded-full bg-blue-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                2
                              </div>
                            )}
                            {s.rank === 3 && (
                              <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                3
                              </div>
                            )}
                            {s.rank > 3 && (
                              <span className="font-bold text-slate-500 pl-1">
                                {s.rank}
                              </span>
                            )}
                          </td>

                          {/* Nama Siswa */}
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={s.avatar} 
                                alt={s.name} 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3b82f6&color=fff`;
                                }}
                              />
                              <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                {s.name}
                              </span>
                            </div>
                          </td>

                          {/* Total Poin */}
                          <td className="py-3 text-center font-extrabold">
                            <span className={
                              s.rank === 1 ? 'text-amber-600' :
                              s.rank === 2 ? 'text-rose-600' :
                              s.rank === 3 ? 'text-purple-600' :
                              'text-slate-800'
                            }>
                              {s.totalPoints.toLocaleString()}
                            </span>
                          </td>

                          {/* Nilai Rata-rata */}
                          <td className="py-3 text-center text-slate-600">
                            {s.avgGrade}
                          </td>

                          {/* Kehadiran */}
                          <td className="py-3 text-center text-slate-600">
                            {s.attendance}
                          </td>

                          {/* Tugas */}
                          <td className="py-3 text-center text-slate-600">
                            {s.tasksScore}
                          </td>

                          {/* Quiz */}
                          <td className="py-3 text-center text-slate-600">
                            {s.quizScore}
                          </td>

                          {/* Ujian */}
                          <td className="py-3 text-center text-slate-600">
                            {s.examScore}
                          </td>

                          {/* Badge */}
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {s.badges.includes('crown') && (
                                <div className="w-5 h-5 rounded-md bg-amber-400 text-white flex items-center justify-center" title="Top 3">
                                  <Crown className="w-3 h-3 fill-white" />
                                </div>
                              )}
                              {s.badges.includes('calendar') && (
                                <div className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center" title="Kehadiran Sempurna">
                                  <CalendarIcon className="w-3 h-3" />
                                </div>
                              )}
                              {s.badges.includes('book') && (
                                <div className="w-5 h-5 rounded-md bg-purple-500 text-white flex items-center justify-center" title="Tugas Terbaik">
                                  <BookOpen className="w-3 h-3" />
                                </div>
                              )}
                              {s.badges.includes('check') && (
                                <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center" title="Konsisten">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                              {s.badges.includes('blue') && (
                                <div className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center" title="Pencapaian">
                                  <Award className="w-3 h-3" />
                                </div>
                              )}
                              {s.badges.includes('purple') && (
                                <div className="w-5 h-5 rounded-md bg-purple-500 text-white flex items-center justify-center" title="Aktif">
                                  <Star className="w-3 h-3 fill-white" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 text-right pr-2">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 rounded-xl px-2.5 py-1 transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>
                          </td>

                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* ----------------- RIGHT: 2 CARDS (POIN KATEGORI & BADGE) ----------------- */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-6">
              
              {/* Card 1: Poin & Kategori */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    Poin & Kategori
                  </h3>
                  <button 
                    onClick={() => {
                      Swal.fire({
                        title: 'Bobot Penilaian Poin',
                        html: '<div style="text-align:left; font-size:13px; line-height:1.8;">Perhitungan skor leaderboard dihitung dari:<br/>• Tugas Harian (20%)<br/>• Quiz per Pertemuan (20%)<br/>• Ujian Kompetensi UTS/UAS (30%)<br/>• Keaktifan Diskusi & Partisipasi (10%)<br/>• Presensi Kehadiran Kelas (20%)</div>',
                        icon: 'info',
                        confirmButtonColor: '#2563eb'
                      });
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Detail
                  </button>
                </div>

                <div className="space-y-3">
                  {pointCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${cat.iconBg} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {cat.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {cat.subtitle}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                          {cat.weight}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Badge Pencapaian */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    Badge Pencapaian
                  </h3>
                  <button 
                    onClick={() => {
                      Swal.fire({
                        title: 'Seluruh Badge Prestasi',
                        html: '<div style="font-size:13px; line-height:1.8;">Kumpulkan seluruh 8 badge pencapaian dengan aktif mengerjakan latihan, kuis, dan hadir tepat waktu di setiap sesi LPK Creativa!</div>',
                        icon: 'success',
                        confirmButtonColor: '#2563eb'
                      });
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua
                  </button>
                </div>

                {/* 4x2 Grid of Badges */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  {achievementBadges.map((badge, idx) => {
                    const BadgeIcon = badge.icon;
                    return (
                      <div key={idx} className="flex flex-col items-center group cursor-pointer">
                        <div className={`w-11 h-11 rounded-2xl ${badge.bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                          <BadgeIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 mt-1.5 leading-tight line-clamp-2">
                          {badge.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ================= MODAL DETAIL SISWA ================= */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                    #{selectedStudent.rank}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold leading-tight">{selectedStudent.name}</h3>
                    <p className="text-xs text-blue-100">{selectedStudent.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                
                {/* Points Card */}
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Total Akumulasi Poin</div>
                    <div className="text-2xl font-black text-blue-600 tracking-tight">
                      {selectedStudent.totalPoints.toLocaleString()} <span className="text-xs text-slate-400 font-bold">Poin</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Nilai Rata-rata</div>
                    <div className="text-xl font-extrabold text-slate-800">
                      {selectedStudent.avgGrade} <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Kehadiran</div>
                    <div className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedStudent.attendance}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Tugas</div>
                    <div className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedStudent.tasksScore}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Quiz</div>
                    <div className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedStudent.quizScore}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Ujian</div>
                    <div className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedStudent.examScore}</div>
                  </div>
                </div>

                {/* Badges Earned */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Badge Prestasi yang Diraih:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.badgeNames.map((bn, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-semibold">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{bn}</span>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
