import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  BookOpen,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Award,
  ChevronDown,
  Sparkles,
  FileCheck,
  Users,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlImg from '../../assets/anime_girl.jpg';
import { moduleApi } from '../../utils/moduleApi';

export default function LmsKelasSaya() {
  const navigate = useNavigate();

  // Current User Session
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdminOrSensei = useMemo(() => {
    const roleName = (currentUser?.role_name || currentUser?.role || '').toLowerCase();
    return roleName.includes('admin') || roleName.includes('sensei') || roleName.includes('pengajar') || roleName.includes('lpk');
  }, [currentUser]);

  // Tab State: 'Sedang Berjalan' | 'Akan Datang' | 'Selesai'
  const [siswaTab, setSiswaTab] = useState('Sedang Berjalan');

  // Semester Filter
  const [selectedSemester, setSelectedSemester] = useState('Semester Ganjil 2026');

  // Real Data State from Database
  const [rawClasses, setRawClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load Real Classes from relationships API
  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await moduleApi('relationships');
      if (res) {
        setRawClasses(Array.isArray(res.classes) ? res.classes : []);
        setAssignments(Array.isArray(res.assignments) ? res.assignments : []);
      }
    } catch (err) {
      console.error('Gagal memuat kelas:', err);
      setError(err.message || 'Gagal menyinkronkan data kelas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Transform raw database classes into display-ready objects
  const siswaClasses = useMemo(() => {
    if (!rawClasses || rawClasses.length === 0) return [];

    return rawClasses.map((cls, idx) => {
      // Find assigned Sensei
      const assignment = assignments.find(
        (a) => Number(a.class_id) === Number(cls.id) && (!a.ends_on || new Date(a.ends_on) >= new Date())
      ) || assignments.find((a) => Number(a.class_id) === Number(cls.id));

      const senseiName = assignment?.sensei_name || 'Muhammad Faizal, S.Pd.';
      const level = cls.level || 'N5';

      let badgeBg = 'from-rose-500 to-pink-600';
      if (level === 'N4') badgeBg = 'from-purple-600 to-indigo-700';
      else if (level === 'N3') badgeBg = 'from-emerald-500 to-teal-600';
      else if (level.toLowerCase().includes('kaigo')) badgeBg = 'from-blue-600 to-cyan-600';

      const isCompleted = cls.status === 'completed';
      const isUpcoming = cls.status === 'upcoming' || cls.status === 'draft';
      const isRunning = cls.status === 'active' || (!isCompleted && !isUpcoming);

      const statusCode = isCompleted ? 'completed' : isUpcoming ? 'upcoming' : 'running';
      const statusLabel = isCompleted ? 'Selesai' : isUpcoming ? 'Akan Dimulai' : 'Sedang Berjalan';

      const totalMeetings = Number(cls.total_meetings) > 0 ? Number(cls.total_meetings) : 32;
      const completedMeetings = cls.completed_meetings !== null && cls.completed_meetings !== undefined && cls.completed_meetings !== ''
        ? Number(cls.completed_meetings)
        : (Number(cls.meeting_logs_count) || 1);

      const progress = isCompleted ? 100 : Math.min(100, Math.round((completedMeetings / totalMeetings) * 100));

      return {
        id: cls.id,
        code: cls.code || `CLS-${cls.id}`,
        title: cls.name || 'Kelas Bahasa Jepang',
        batch: cls.batch || 'Batch 1 2026',
        badgeText: level,
        badgeBg,
        status: statusLabel,
        statusCode,
        sensei: senseiName,
        senseiAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senseiName)}&background=0284c7&color=fff&bold=true`,
        days: cls.schedule_days || (idx % 2 === 0 ? 'Senin & Rabu' : 'Selasa & Kamis'),
        time: cls.schedule_time || (idx % 2 === 0 ? '08:00 - 09:30' : '10:00 - 11:30'),
        progress,
        studentCount: Number(cls.enrolled_students_count) || 1
      };
    });
  }, [rawClasses, assignments]);

  // Filtered Siswa Classes based on active Tab
  const filteredSiswaClasses = useMemo(() => {
    if (siswaTab === 'Akan Datang') {
      return siswaClasses.filter(c => c.statusCode === 'upcoming');
    }
    if (siswaTab === 'Selesai') {
      return siswaClasses.filter(c => c.statusCode === 'completed');
    }
    return siswaClasses.filter(c => c.statusCode === 'running');
  }, [siswaClasses, siswaTab]);

  const runningCount = useMemo(() => siswaClasses.filter(c => c.statusCode === 'running').length, [siswaClasses]);
  const upcomingCount = useMemo(() => siswaClasses.filter(c => c.statusCode === 'upcoming').length, [siswaClasses]);
  const completedCount = useMemo(() => siswaClasses.filter(c => c.statusCode === 'completed').length, [siswaClasses]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16">

        {/* ========================================================================= */}
        {/* ==================== HERO HEADER: KELAS SAYA SISWA ====================== */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-6 lg:px-8 py-6 relative overflow-hidden">
          {/* Subtle Japanese Aesthetic Background Overlay */}
          <div
            className="absolute top-0 right-0 w-80 md:w-96 h-full bg-cover bg-no-repeat bg-right opacity-15 pointer-events-none"
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
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">Kelas Saya</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kelas Saya
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Daftar kelas pembelajaran resmi terdaftar dari database.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={loadClasses}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 transition shadow-2xs cursor-pointer disabled:opacity-50"
                title="Muat ulang data kelas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                <span>Sinkron</span>
              </button>

              {isAdminOrSensei && (
                <button
                  onClick={() => navigate('/lms/classes')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 transition shadow-sm shadow-blue-600/20 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Kelola Kelas & Rombel</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ============================== SISWA VIEW =============================== */}
        {/* ========================================================================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6 space-y-6">

          {/* Admin / Sensei Info Notice */}
          {isAdminOrSensei && (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  i
                </div>
                <div>
                  <span className="font-bold">Mode Pengajar / Admin LMS:</span> Menampilkan kelas aktif resmi dari database sistem. Untuk mengelola rombel siswa, presensi, dan pengajar, buka menu <strong>Kelas & Rombel</strong>.
                </div>
              </div>
              <button
                onClick={() => navigate('/lms/classes')}
                className="whitespace-nowrap font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1 ml-auto sm:ml-0"
              >
                <span>Buka Kelola Kelas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
              <button onClick={loadClasses} className="ml-auto underline font-bold">Coba lagi</button>
            </div>
          )}

          {/* Filter Tabs & Semester Header */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button
                onClick={() => setSiswaTab('Sedang Berjalan')}
                className={`pb-1 transition-all relative cursor-pointer ${siswaTab === 'Sedang Berjalan'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                Sedang Berjalan ({runningCount})
              </button>
              <button
                onClick={() => setSiswaTab('Akan Datang')}
                className={`pb-1 transition-all relative cursor-pointer ${siswaTab === 'Akan Datang'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                Akan Datang ({upcomingCount})
              </button>
              <button
                onClick={() => setSiswaTab('Selesai')}
                className={`pb-1 transition-all relative cursor-pointer ${siswaTab === 'Selesai'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                Selesai ({completedCount})
              </button>
            </div>

            {/* Semester Dropdown */}
            <div className="relative self-end sm:self-auto">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-7 appearance-none shadow-xs"
              >
                <option value="Semester Ganjil 2026">Semester Ganjil 2026</option>
                <option value="Semester Genap 2026">Semester Genap 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl"></div>
                    <div className="space-y-2">
                      <div className="w-48 h-5 bg-slate-200 rounded"></div>
                      <div className="w-32 h-3.5 bg-slate-100 rounded"></div>
                      <div className="w-64 h-8 bg-slate-100 rounded-xl mt-3"></div>
                    </div>
                  </div>
                  <div className="w-48 h-10 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* List of Student Class Cards */}
          {!loading && (
            <div className="space-y-4">
              {filteredSiswaClasses.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    {/* Left & Middle Info */}
                    <div className="flex items-start gap-4">
                      {/* Japanese Artwork Badge */}
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${item.badgeBg} text-white flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group`}>
                        <img
                          src={bannerImg}
                          alt="Japan"
                          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
                        />
                        <span className="relative z-10 text-xl md:text-2xl font-black tracking-wider font-sans drop-shadow-md">
                          {item.badgeText}
                        </span>
                      </div>

                      {/* Content Details */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base md:text-lg font-bold text-slate-800">
                            {item.title}
                          </h3>
                          <span className="text-xs font-semibold text-slate-400">
                            ({item.batch})
                          </span>
                          <span className={`px-2.5 py-0.5 text-[10px] md:text-xs font-bold rounded-full ${item.statusCode === 'running'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                              : item.statusCode === 'completed'
                                ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
                                : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                            }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Sensei Profile & Schedule */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={item.senseiAvatar}
                              alt={item.sensei}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Sensei+Faizal'; }}
                            />
                            <span className="font-semibold text-slate-700">{item.sensei}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.days}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.time}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.studentCount} Siswa</span>
                          </div>
                        </div>

                        {/* 4 Action Buttons for Siswa (Lihat Materi, Tugas & Quiz, Nilai Saya, Diskusi) */}
                        <div className="flex flex-wrap items-center gap-2.5 mt-4">
                          <button
                            onClick={() => navigate('/lms/materi')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Lihat Materi</span>
                          </button>

                          <button
                            onClick={() => navigate('/lms/tugas-quiz')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Tugas & Quiz</span>
                          </button>

                          <button
                            onClick={() => navigate('/lms/nilai')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50/70 hover:bg-purple-100 border border-purple-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Nilai Saya</span>
                          </button>

                          <button
                            onClick={() => navigate('/lms/diskusi')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Diskusi</span>
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Right: Progres Belajar */}
                    <div className="lg:w-56 flex flex-col justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Progres Belajar</span>
                        <span className="text-slate-800">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${item.statusCode === 'completed' ? 'bg-blue-600' :
                              item.progress > 70 ? 'bg-blue-600' :
                                item.progress > 50 ? 'bg-purple-600' :
                                  'bg-amber-500'
                            }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })}

              {filteredSiswaClasses.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-700">
                    Tidak ada kelas pada kategori "{siswaTab}"
                  </h4>
                  {runningCount > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400">
                        Saat ini terdapat {runningCount} kelas resmi yang sedang aktif.
                      </p>
                      <button
                        onClick={() => setSiswaTab('Sedang Berjalan')}
                        className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        <span>Lihat Kelas Sedang Berjalan ({runningCount})</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">
                      Silakan hubungi Sensei atau Administrator LMS untuk informasi enrollment kelas.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Encouragement Card for Students */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg mt-8">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none overflow-hidden">
              <img
                src={animeGirlImg}
                alt="Anime Motivation"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold mb-3 border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Tips Sukses Belajar</span>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Semangat Belajar, Masa Depan Cerah Menantimu di Jepang! 🌸
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
                Konsisten ikuti setiap pertemuan, kerjakan kuis tepat waktu, dan kuasai materi JLPT bersama para Sensei terbaik. Setiap langkah kecil membawamu lebih dekat ke impian berkarier di Jepang.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <button
                  onClick={() => navigate('/lms/kalender')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Jadwal Kalender
                </button>
                <button
                  onClick={() => navigate('/lms/latihan-kaiwa')}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all border border-white/20 cursor-pointer"
                >
                  Latihan Kaiwa
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
