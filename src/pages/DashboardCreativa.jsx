import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Sparkles,
  Mic,
  Award,
  Layers,
  CheckCircle2,
  TrendingUp,
  FileText,
  Volume2,
  Headphones,
  Edit3,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import Layout from '../components/Layout';
import { useSEO } from '../hooks/useSEO';
import bannerStudents from '../assets/banner_students_intensif.jpg';

export default function DashboardCreativa() {
  useSEO({
    title: "Dashboard LMS & Akademik",
    description: "Pusat monitoring pembelajaran bahasa Jepang LPK Creativa berbasis Moodle, JF Standard, Minato-Marugoto & Kaiwa AI."
  });

  const [timeNow, setTimeNow] = useState(new Date());
  const [response, setResponse] = useState(null);
  const [lmsStats, setLmsStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setInterval(() => setTimeNow(new Date()), 60000);

    // Fetch operational stats & LMS academic stats
    Promise.all([
      axios.get('/api/dashboard_stats.php').catch(() => ({ data: { status: 'error' } })),
      fetch('/api/lms_academic.php?action=analytics').then(r => r.json()).catch(() => ({ status: 'error' }))
    ]).then(([dashRes, lmsRes]) => {
      if (!active) return;
      if (dashRes.data?.status === 'success') {
        setResponse(dashRes.data);
      }
      if (lmsRes?.status === 'success') {
        setLmsStats(lmsRes.stats);
      }
    }).catch(e => {
      if (active) setError('Gagal memuat data akademik.');
    });

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const greet = () => {
    const h = timeNow.getHours();
    return h < 12 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
  };

  const data = response?.operational;

  return (
    <Layout appearance={{}}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

          {/* HERO BANNER - LMS CREATIVA (SLATE/NAVY MATCHING LPK INTENSIF) */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[170px]">

            {/* Student Uniform Classroom Background Photo on the Right with Mask */}
            <div
              className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
              style={{
                backgroundImage: `url(${bannerStudents})`,
                maskImage: 'linear-gradient(to right, transparent, black 30%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
              }}
            />

            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
                <Sparkles className="w-3.5 h-3.5" />
                LMS Bahasa Jepang • Moodle + JF Standard + Minato & Latihan Percakapan
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {greet()}, <span className="text-amber-300">Admin LMS!</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
                Selamat datang di pusat komando akademik dan pembelajaran LPK Creativa Bridging International. Pantau hirarki kursus, pencapaian Can-do, latihan percakapan, dan kelulusan siswa.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-4 self-start md:self-center shrink-0">
              <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-lg min-w-[130px]">
                <p className="text-[11px] font-medium text-slate-300 mb-0.5">
                  {timeNow.toLocaleDateString('id-ID', { weekday: 'long' })}
                </p>
                <p className="text-sm font-extrabold text-white">
                  {timeNow.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <Link
                to="/lms/program"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>Kelola Program</span>
              </Link>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm">
              {error}
            </div>
          )}

          {/* 4 PRIMARY METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Siswa Intensif</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {lmsStats?.active_students ?? data?.students ?? 22}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Terdaftar di batch aktif</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Program & Batch</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                {lmsStats?.total_programs ?? 3} / {lmsStats?.total_batches ?? 2}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">3 Program • 2 Batch berjalan</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rating Percakapan (Kaiwa)</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Mic className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">
                ⭐ {lmsStats?.avg_kaiwa_rating ?? 4.8} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
              </div>
              <p className="text-[11px] text-purple-600 mt-1 font-medium">Evaluasi 4 pilar objektif</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Course Completion</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
                {lmsStats?.course_completion_rate ?? 84.5}%
              </div>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">Kriteria kehadiran & UKOM</p>
            </div>
          </div>

          {/* 4 CORE BENCHMARK PILLARS (Moodle, JF Standard, Minato-Marugoto, Kaiwa AI) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  4 Pilar Arsitektur & Pedagogi LMS LPK Creativa
                </h2>
                <p className="text-xs text-slate-500">
                  Harmonisasi standar internasional pembelajaran Bahasa Jepang dan integrasi AI generatif context-aware.
                </p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 self-start">
                Arsitektur v2.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Pillar 1: Moodle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black">
                    M
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">Moodle LMS Hierarchy</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Hirarki 7 tingkat: Program &rarr; Batch &rarr; Kelas &rarr; Course &rarr; Module &rarr; Lesson &rarr; Activity, Gradebook terbobot, & Activity Completion.
                </p>
                <Link to="/lms/courses" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  Buka Hirarki <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Pillar 2: JF Standard */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-black">
                    JF
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">Japan Foundation Can-Do</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Deskriptor Can-do A1-C2 / N5-N1. Penguasaan bahasa Jepang komunikatif untuk kehidupan dan dunia kerja di Jepang.
                </p>
                <Link to="/lms/can-do" className="text-xs font-bold text-pink-600 hover:text-pink-700 inline-flex items-center gap-1">
                  Matriks Can-do <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Pillar 3: Minato + Marugoto */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                    MM
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">Minato & Marugoto 4 Skills</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Pembelajaran berbasis topik dengan 4 keterampilan makro: Choukai (Listening), Dokkai (Reading), Sakubun (Writing), & Hanashikata.
                </p>
                <Link to="/lms/listening" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1">
                  Hub 4 Makro-Skill <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Pillar 4: Kaiwa AI */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                    AI
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">Kaiwa AI Novelty</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Latihan percakapan voice & text interaktif dengan 8 skenario (Jikoshoukai, Restoran, Kaigo, Wawancara Kerja) + rubrik otomatis 4 pilar.
                </p>
                <Link to="/lms/kaiwa" className="text-xs font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1">
                  Simulasi Percakapan <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* QUICK SHORTCUT MATRIX TO SIDEBAR GROUPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Group 1: Akademik & Pendaftaran */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-sm">Akademik & Rombel</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link to="/lms/program" className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 font-semibold transition-all">
                  • Program Pelatihan
                </Link>
                <Link to="/lms/batch" className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 font-semibold transition-all">
                  • Batch / Angkatan
                </Link>
                <Link to="/lms/siswa" className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 font-semibold transition-all">
                  • Data Siswa
                </Link>
                <Link to="/access-rights-sensei" className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 font-semibold transition-all">
                  • Sensei (Pengajar)
                </Link>
                <Link to="/lms/classes" className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 font-semibold transition-all">
                  • Kelas & Rombel
                </Link>
                <Link to="/lms/enrollment" className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 font-semibold transition-all">
                  • Enrollment Siswa
                </Link>
              </div>
            </div>

            {/* Group 2: Kurikulum & Pembelajaran */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-sm">Kurikulum & Aktivitas</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link to="/lms/courses" className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
                  • Course (N5/N4)
                </Link>
                <Link to="/lms/modules" className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
                  • Module (Bab Minna)
                </Link>
                <Link to="/lms/lessons" className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
                  • Lesson (Topik)
                </Link>
                <Link to="/lms/materi" className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
                  • Materi Belajar
                </Link>
                <Link to="/lms/can-do" className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
                  • Can-do / Kompetensi
                </Link>
                <Link to="/lms/kotoba" className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
                  • Kotoba (Kosakata)
                </Link>
              </div>
            </div>

            {/* Group 3: Penilaian & Analytics */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm">Penilaian & Analytics</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link to="/lms/gradebook" className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all">
                  • Gradebook Moodle
                </Link>
                <Link to="/lms/nilai" className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all">
                  • Nilai Siswa
                </Link>
                <Link to="/lms/activity-completion" className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all">
                  • Activity Completion
                </Link>
                <Link to="/lms/course-completion" className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all">
                  • Course Completion
                </Link>
                <Link to="/lms/analytics-kaiwa" className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all">
                  • Kaiwa Analytics
                </Link>
                <Link to="/lms/laporan-akademik" className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all">
                  • Laporan Akademik
                </Link>
              </div>
            </div>
          </div>

          {/* PESERTA INTENSIF TERDAFTAR (STUDENTS TABLE) */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-black text-slate-900 text-base">Peserta Intensif Terdaftar di LMS</h2>
                <p className="text-xs text-slate-500">Daftar siswa yang saat ini sedang menempuh kurikulum bahasa Jepang di LPK Creativa.</p>
              </div>
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl bg-blue-50"
                to="/lms/siswa"
              >
                Buka Master Siswa <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">ID Siswa</th>
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3">Target Level</th>
                    <th className="py-3 px-3">Batch / Angkatan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {response?.students && response.students.length > 0 ? (
                    response.students.slice(0, 8).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">#{s.id}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                            {s.level || 'JLPT N5 (A1)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {s.batch || 'Batch 2026-A'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Aktif
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to="/lms/enrollment"
                            className="text-blue-600 hover:text-blue-700 font-bold text-[11px]"
                          >
                            Lihat Rombel
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada peserta tersimpan atau data sedang dimuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
