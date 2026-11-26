import { useState } from "react";
import Layout from "../../components/Layout";
import { 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Award
} from "lucide-react";
import Swal from "sweetalert2";
import kyotoStreet from "../../assets/kyoto_street.jpg";

export default function LmsSkillsHub({ initialTab = "listening" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isPlaying, setIsPlaying] = useState(false);
  const [submittedWriting, setSubmittedWriting] = useState(false);
  const [writingText, setWritingText] = useState("");

  const handleWritingSubmit = () => {
    if (!writingText.trim()) {
      Swal.fire("Peringatan", "Silakan tulis sakubun sebelum mengumpulkan.", "warning");
      return;
    }
    setSubmittedWriting(true);
    Swal.fire("Terkumpul!", "Naskah Sakubun berhasil dikirimkan ke Sensei untuk dikoreksi.", "success");
  };

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${kyotoStreet})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              Minato & Marugoto 4 Macro-Skills Framework
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Pusat Pelatihan Keterampilan Bahasa
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Integrasi 4 Keterampilan Bahasa Jepang: Listening (Choukai 聴解), Reading (Dokkai 読解), Writing (Sakubun 作文), dan Speaking (Hanashikata 話し方).
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

        {/* 4 Skill Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "listening", name: "Listening (Choukai)", icon: Headphones, badge: "聴解" },
            { id: "reading", name: "Reading (Dokkai)", icon: BookOpen, badge: "読解" },
            { id: "writing", name: "Writing (Sakubun)", icon: PenTool, badge: "作文" },
            { id: "speaking", name: "Speaking (Hanashikata)", icon: Mic, badge: "話し方" },
          ].map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{item.badge}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        {activeTab === "listening" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Latihan Choukai • Bab 1</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Percakapan Perkenalan Sensei Hiroshi & Tanaka-san</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-700">Level N5</span>
            </div>

            {/* Audio Player Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Audio Track 01 - Jikoshoukai.mp3</h4>
                  <p className="text-[11px] text-slate-500">Durasi: 01:24 • Native Japanese Speaker</p>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-600" />
                <span>Kecepatan Normal (1.0x)</span>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Pertanyaan Pemahaman:</h4>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                <p className="text-xs font-semibold text-slate-800">1. Dari negara manakah Tanaka-san berasal menurut rekaman audio?</p>
                <div className="space-y-1.5 pl-2 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q1" className="text-purple-600" />
                    <span>A. Nihon (Jepang)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q1" className="text-purple-600" />
                    <span>B. Indonesia</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q1" className="text-purple-600" />
                    <span>C. Kankoku (Korea)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reading" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Latihan Dokkai • Bab 1</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Membaca Kartu Nama (Meishi) & Profil Singkat</h3>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 font-sans text-slate-800 leading-relaxed space-y-2">
              <p className="font-bold text-base">はじめまして。</p>
              <p>わたしは　アリです。インドネシアの　ジャカルタから　きました。</p>
              <p>いま、LPK Creativaの　がくせいです。にほんごを　べんきょうして　います。</p>
              <p>どうぞ　よろしく　おねがいします。</p>
            </div>
          </div>
        )}

        {activeTab === "writing" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Latihan Sakubun • Naskah Menulis</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Tuliskan Naskah Perkenalan Dirimu (Minimal 4 Kalimat)</h3>
            </div>
            <textarea
              rows={5}
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Tuliskan naskah dalam huruf Hiragana/Romaji di sini... (contoh: はじめまして。わたしは...)"
              className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
            />
            <div className="flex justify-end">
              <button
                onClick={handleWritingSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition cursor-pointer"
              >
                Kirim ke Sensei
              </button>
            </div>
          </div>
        )}

        {activeTab === "speaking" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Latihan Hanashikata • Pelafalan</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Latihan Pelafalan Kalimat Sapaan (Aisatsu)</h3>
            </div>
            <p className="text-xs text-slate-600">
              Ucapkan kalimat berikut dengan intonasi yang jelas. Anda juga dapat menggunakan modul <strong>Kaiwa AI ⭐</strong> untuk latihan percakapan real-time interaktif.
            </p>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-slate-900 text-sm">おはようございます。今日もよろしくお願いします。</h5>
                <p className="text-xs text-purple-700 font-medium">Ohayou gozaimasu. Kyou mo yoroshiku onegaishimasu.</p>
              </div>
              <a
                href="/lms/kaiwa"
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
              >
                Latihan di Kaiwa AI &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
