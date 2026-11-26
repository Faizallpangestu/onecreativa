import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { 
  Settings, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  Save,
  Key,
  Mic,
  FileSpreadsheet,
  Clock,
  Building2,
  BookOpen,
  Award,
  Layers,
  Sparkles
} from "lucide-react";
import Swal from "sweetalert2";
import admin3dBg from "../../assets/admin_3d_bg.webp";

export default function LmsSettings() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial active tab from route path
  const getInitialTab = () => {
    if (location.pathname.includes("rubrik")) return "rubrik";
    if (location.pathname.includes("ai-settings")) return "ai";
    if (location.pathname.includes("audit-log")) return "audit";
    return "general";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Real Form State from DB
  const [formData, setFormData] = useState({
    institution_name: "LPK Creativa Bridging International",
    curriculum_standard: "Japan Foundation Standard (JF Standard) + Minna no Nihongo",
    passing_grade: "75",
    academic_year: "2026/2027",
    primary_language: "Japanese (N5 - N2)",
    model_engine: "gemini-1.5-flash",
    tts_speed: "1.0",
    gemini_api_key: ""
  });

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  useEffect(() => {
    fetchRealSettings();
    fetchRealAuditLogs();
  }, []);

  const fetchRealSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms_academic.php?action=settings");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setFormData(prev => ({ ...prev, ...json.data }));
      }
    } catch (e) {
      console.error("Gagal mengambil pengaturan:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealAuditLogs = async () => {
    try {
      const res = await fetch("/api/lms_academic.php?action=audit_logs");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setAuditLogs(json.data);
      }
    } catch (e) {
      console.error("Gagal mengambil audit log:", e);
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "general") navigate("/lms/settings");
    else if (tabId === "ai") navigate("/lms/ai-settings");
    else if (tabId === "rubrik") navigate("/lms/rubrik");
    else if (tabId === "audit") navigate("/lms/audit-log");
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/lms_academic.php?action=settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.status === "success") {
        Swal.fire("Tersimpan!", "Pengaturan parameter sistem & kurikulum berhasil disimpan secara permanen di database.", "success");
        fetchRealAuditLogs();
      } else {
        Swal.fire("Gagal", json.message || "Gagal menyimpan", "error");
      }
    } catch (e) {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    }
  };

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* HERO BANNER */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${admin3dBg})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <Settings className="w-3.5 h-3.5 text-slate-300" />
              Sistem & Konfigurasi LMS Creativa
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Pengaturan & Konfigurasi LMS
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Atur parameter operasional akademik, rubrik penilaian 4 pilar JF Standard, konfigurasi mesin percakapan (voice & text), serta audit log aktivitas pengguna secara real-time.
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

        {/* TAB SWITCHER */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "general", label: "Konfigurasi Umum", icon: Settings },
            { id: "ai", label: "Konfigurasi Percakapan (Kaiwa)", icon: Mic },
            { id: "rubrik", label: "Rubrik & Skala 1-5", icon: FileSpreadsheet },
            { id: "audit", label: "Audit Log Aktivitas", icon: ShieldCheck },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 max-w-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pengaturan Akademik LPK Creativa</h3>
                <p className="text-xs text-slate-500 mt-0.5">Konfigurasi institusi resmi dan patokan kelulusan siswa.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Data Tersinkron
              </span>
            </div>

            <div className="space-y-4 text-xs pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Institusi</label>
                <input
                  type="text"
                  value={formData.institution_name || ""}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standar Kurikulum Utama</label>
                  <input
                    type="text"
                    value={formData.curriculum_standard || ""}
                    onChange={(e) => setFormData({ ...formData, curriculum_standard: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahun Akademik</label>
                  <input
                    type="text"
                    value={formData.academic_year || "2026/2027"}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Passing Grade Kelulusan (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.passing_grade || "75"}
                    onChange={(e) => setFormData({ ...formData, passing_grade: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nilai akhir minimal untuk sertifikat lulus.</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fokus Level Kemahiran</label>
                  <input
                    type="text"
                    value={formData.primary_language || "Japanese (N5 - N2)"}
                    onChange={(e) => setFormData({ ...formData, primary_language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        )}

        {/* KAIWA CONVERSATION CONFIGURATION TAB (ZERO ROBOT ICONS) */}
        {activeTab === "ai" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm pb-2 border-b border-slate-100">
              <Mic className="w-4 h-4" />
              <span>Konfigurasi Mesin Latihan Percakapan (Voice & Text)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mengatur model percakapan interaktif multimodal untuk latihan simulasi wawancara kerja (Mensetsu), komunikasi pabrik, dan percakapan harian bahasa Jepang sesuai standar kurikulum JF Standard.
            </p>

            <div className="space-y-4 text-xs pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mesin Model Percakapan</label>
                <select
                  value={formData.model_engine || "gemini-1.5-flash"}
                  onChange={(e) => setFormData({ ...formData, model_engine: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Respons Cepat & Akurasi Multimodal)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Audio Suara Natural Jepang)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kecepatan Suara Pengajar (TTS Speed)</label>
                <select
                  value={formData.tts_speed || "1.0"}
                  onChange={(e) => setFormData({ ...formData, tts_speed: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                >
                  <option value="0.85">0.85x — Lambat (Cocok untuk Pemula N5)</option>
                  <option value="1.0">1.0x — Kecepatan Natural Standar Jepang</option>
                  <option value="1.15">1.15x — Cepat (Simulasi Kecepatan Penutur Asli)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">API Key Gateway</label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Tersimpan aman di environment server)"
                  value={formData.gemini_api_key || ""}
                  onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Tersimpan aman di backend server Creativa (tidak terlihat publik).</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Mesin Percakapan</span>
            </button>
          </div>
        )}

        {/* RUBRIK TAB (REAL 4 PILAR CRITERIA) */}
        {activeTab === "rubrik" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rubrik 4 Pilar Penilaian Kemahiran Berbicara (Skala 1.0 - 5.0)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sesuai Kerangka Japan Foundation Standard & CEFR (Common European Framework of Reference).</p>
              </div>
              <span className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 self-start sm:self-auto">
                Bobot Total: 100%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-blue-900 text-sm">1. Grammar (文法 - Bunpou)</h5>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">Bobot 25%</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Evaluasi ketepatan partikel (は, が, に, で, を), konjugasi kata kerja bentuk Masu/Te/Nai, serta struktur kalimat sopan (Teineigo) sesuai level modul bab Minna no Nihongo.
                </p>
                <div className="pt-1 text-[11px] text-slate-500 font-mono">
                  • 5.0: Sempurna tanpa kekeliruan partikel<br />
                  • 3.0: Partikel dasar benar namun ragu pada bentuk sambung<br />
                  • 1.0: Tata bahasa tidak teratur
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-emerald-900 text-sm">2. Vocabulary (語彙 - Goi)</h5>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">Bobot 25%</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Kekayaan kosakata dan ketepatan istilah situasional: Istilah panti jompo (Kaigo), istilah industri & K3 (Pabrik), angka & uang, serta kosakata wawancara kerja (Mensetsu).
                </p>
                <div className="pt-1 text-[11px] text-slate-500 font-mono">
                  • 5.0: Menggunakan kosakata tematik kaya & tepat<br />
                  • 3.0: Kosakata cukup untuk menyampaikan inti maksud<br />
                  • 1.0: Kosakata sangat minim
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-amber-900 text-sm">3. Fluency (流暢さ - Ryuuchousa)</h5>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">Bobot 25%</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Kecepatan respons tanpa jeda berlebihan, kelancaran pelafalan suku kata, intonasi tinggi-rendah (Pitch Accent), dan minimnya pengulangan kata terbata-bata.
                </p>
                <div className="pt-1 text-[11px] text-slate-500 font-mono">
                  • 5.0: Bicara lancar dengan jeda yang wajar<br />
                  • 3.0: Sedikit jeda berpikir namun alur tetap berjalan<br />
                  • 1.0: Terbata-bata dengan jeda sangat panjang
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-purple-900 text-sm">4. Naturalness (自然さ - Shizensa)</h5>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800">Bobot 25%</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Kewajaran ungkapan budaya Jepang: Salam pembuka/penutup (Aisatsu), ungkapan konfirmasi (Aizuchi: Sou desu ne, Naruhodo), etika sopan santun, dan nuansa kesopanan.
                </p>
                <div className="pt-1 text-[11px] text-slate-500 font-mono">
                  • 5.0: Respons spontan dengan aisatsu dan aizuchi tepat<br />
                  • 3.0: Sopan namun terdengar agak kaku/terjemahan harfiah<br />
                  • 1.0: Mengabaikan etika komunikasi Jepang
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB (REAL DATABASE RECORDS) */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Log Aktivitas Sistem & Pengguna Real-Time</h3>
                <p className="text-xs text-slate-500 mt-0.5">Catatan riwayat audit trail setiap perubahan data di LMS.</p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {auditLogs.length} Catatan Terdata
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Pengguna</th>
                    <th className="px-4 py-3">Aktivitas</th>
                    <th className="px-4 py-3">Rincian Perubahan</th>
                    <th className="px-4 py-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">Belum ada riwayat aktivitas tercatat.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {log.created_at || "Hari ini"}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {log.user_name || "Administrator LMS"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-700">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {log.ip_address || "127.0.0.1"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
