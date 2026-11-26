import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  FileSpreadsheet,
  Award,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Mic,
  Users,
  TrendingUp,
  Download,
  Filter
} from "lucide-react";
import quizChecklist from "../../assets/quiz_exam_checklist.jpg";

export default function LmsGradebook() {
  const [data, setData] = useState({ items: [], student_grades: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gradebook");

  useEffect(() => {
    fetchGradebook();
  }, []);

  const fetchGradebook = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms_academic.php?action=gradebook&course_id=1");
      const json = await res.json();
      if (json.status === "success") {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner with 3D Graphic */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${quizChecklist})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-300" />
              Moodle Gradebook & Assessment Benchmark
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Buku Nilai (Gradebook) & Completion
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Sistem penilaian terbobot standar internasional: Tugas (20%), Quiz (20%), Percakapan Kaiwa (25%), Presensi (10%), dan Ujian Kompetensi Akhir (25%).
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

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("gradebook")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "gradebook"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
            >
              📊 Gradebook Terbobot
            </button>
            <button
              onClick={() => setActiveTab("completion")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "completion"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
            >
              🎓 Course Completion Status
            </button>
          </div>

          <button
            onClick={() => alert("Mengunduh rekap nilai Excel...")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor Excel</span>
          </button>
        </div>

        {/* Assessment Weight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {data.items?.map((item) => (
            <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                {item.item_name}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-slate-900">{parseFloat(item.weight_percent)}%</span>
                <span className="text-[10px] font-medium text-slate-500">Bobot</span>
              </div>
            </div>
          ))}
        </div>

        {/* Gradebook Table */}
        {activeTab === "gradebook" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rekap Nilai Siswa Per Kategori</h3>
                <p className="text-xs text-slate-500">Menghitung nilai akhir secara otomatis berdasarkan pembobotan.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Nama Siswa</th>
                    <th className="px-4 py-3.5 text-center">Tugas (20%)</th>
                    <th className="px-4 py-3.5 text-center">Quiz (20%)</th>
                    <th className="px-4 py-3.5 text-center">Percakapan Kaiwa (25%)</th>
                    <th className="px-4 py-3.5 text-center">Presensi (10%)</th>
                    <th className="px-4 py-3.5 text-center">UKOM (25%)</th>
                    <th className="px-4 py-3.5 text-center">Nilai Akhir</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">Memuat data nilai...</td>
                    </tr>
                  ) : (
                    data.student_grades?.map((st) => (
                      <tr key={st.student_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{st.student_name}</td>
                        <td className="px-4 py-4 text-center font-medium">{st.scores.tugas}</td>
                        <td className="px-4 py-4 text-center font-medium">{st.scores.quiz}</td>
                        <td className="px-4 py-4 text-center font-bold text-rose-600">{st.scores.kaiwa}</td>
                        <td className="px-4 py-4 text-center font-medium">{st.scores.kehadiran}</td>
                        <td className="px-4 py-4 text-center font-medium">{st.scores.ukom}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-black text-blue-700">{st.final_grade}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Completion */}
        {activeTab === "completion" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Kriteria Kelulusan Course (Course Completion Criteria)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Syarat Kelulusan Akademik:</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Menyelesaikan 100% aktivitas wajib (Materi, Listening, Reading, Speaking, Writing).</li>
                  <li>Mencapai rata-rata skor Kaiwa AI minimal 3.8 / 5.0 bintang.</li>
                  <li>Lulus Ujian Kompetensi Akhir (UKOM N5) dengan skor minimal 70.</li>
                  <li>Kehadiran minimal 85% dari total pertemuan.</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Sertifikat Digital LPK Creativa:</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Siswa yang memenuhi kriteria di atas akan otomatis mendapatkan Sertifikat Kelulusan Program Intensif dengan kode verifikasi QR dan transkrip capaian Can-do JF Standard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
