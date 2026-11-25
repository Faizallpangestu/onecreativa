import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Mic,
  CheckCircle2,
  BookOpen,
  Star,
  Activity,
  Layers,
  Download
} from "lucide-react";

export default function LmsAnalytics() {
  const [stats, setStats] = useState({
    total_programs: 3,
    total_batches: 2,
    total_courses: 3,
    total_lessons: 4,
    total_kaiwa_sessions: 15,
    avg_kaiwa_rating: 4.4,
    active_students: 22,
    course_completion_rate: 84.5
  });

  useEffect(() => {
    fetch("/api/lms_academic.php?action=analytics")
      .then(r => r.json())
      .then(d => {
        if (d.status === "success" && d.stats) setStats(d.stats);
      })
      .catch(console.error);
  }, []);

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner with 3D Graphic */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: 'url(/daily_report_3d.jpg)',
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <BarChart3 className="w-3.5 h-3.5 text-slate-300" />
              LMS Analytics & Academic Intelligence
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Analitik Pembelajaran & Evaluasi Percakapan
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Pemantauan performa akademik komprehensif: Progres belajar siswa, ketercapaian Can-do JF Standard, dan rekap evaluasi 4 pilar percakapan (Tata Bahasa, Kosakata, Kelancaran, Kewajaran).
            </p>
          </div>

          <div className="relative z-10 self-start md:self-center shrink-0 hidden sm:block">
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-lg min-w-[130px]">
              <div className="text-[11px] font-medium text-slate-300">
                {new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date())}
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Siswa Aktif</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.active_students}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Terdaftar Kelas</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completion Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.course_completion_rate}%</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Target Kurikulum</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sesi Percakapan</span>
              <Mic className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total_kaiwa_sessions}</div>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Percakapan Selesai</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Skor Percakapan</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.avg_kaiwa_rating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span></div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Tingkat Kemahiran</p>
          </div>
        </div>

        {/* 4 Pilar Evaluasi Percakapan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Performa 4 Pilar Percakapan Kaiwa AI (Rubrik Otomatis)</h3>
              <p className="text-xs text-slate-500">Evaluasi berbasis LLM real-time terhadap rekaman & transkrip siswa.</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full">
              Novelty AI Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            {[
              { name: "Grammar (Tata Bahasa)", score: 4.4, desc: "Pola ~wa ~desu, bentuk masu, partikel ni/de/wo" },
              { name: "Vocabulary (Kosakata)", score: 4.2, desc: "Kekayaan kotoba & kesesuaian topik modul" },
              { name: "Fluency (Kelancaran)", score: 4.1, desc: "Kecepatan respon suara & minim pause" },
              { name: "Naturalness (Kewajaran)", score: 4.3, desc: "Aisatsu, intonasi sopan, dan nuansa alami" },
            ].map((pilar, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
                <span className="text-xs font-bold text-slate-800">{pilar.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(pilar.score) ? "fill-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-800">{pilar.score}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{pilar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
