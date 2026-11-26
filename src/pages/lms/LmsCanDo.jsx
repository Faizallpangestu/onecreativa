import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Swal from "sweetalert2";
import toriiSunset from "../../assets/torii_gate_sunset.jpg";
import {
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  Layers,
  ChevronRight
} from "lucide-react";

export default function LmsCanDo() {
  const [competencies, setCompetencies] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanDos();
  }, []);

  const fetchCanDos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms_academic.php?action=can_do");
      const data = await res.json();
      if (data.status === "success") {
        setCompetencies(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = competencies.filter(c => {
    if (selectedLevel === "ALL") return true;
    return c.jf_level === selectedLevel || c.jlpt_level === selectedLevel;
  });

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${toriiSunset})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <Award className="w-3.5 h-3.5 text-slate-300" />
              Japan Foundation Standard for Japanese Language Education
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Matriks Capaian Can-do & Kompetensi
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Standar JF berbasis CEFR (A1-C2): Menilai kecakapan komunikasi praktis dan kemampuan tugas komunikatif nyata siswa dalam kehidupan sehari-hari dan dunia kerja di Jepang.
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            {["ALL", "A1", "A2", "N5", "N4"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedLevel === lvl
                  ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
              >
                {lvl === "ALL" ? "Semua Level" : `Level ${lvl}`}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Menampilkan {filtered.length} Standar Can-do
          </div>
        </div>

        {/* Can-do Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Memuat matriks kompetensi...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-teal-50 text-teal-700 border border-teal-100">
                      {item.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                        JF: {item.jf_level}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700">
                        JLPT: {item.jlpt_level}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {item.category || "Interpersonal"}
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {item.can_do_text}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi JF
                  </span>
                  <a
                    href="/lms/courses"
                    className="font-bold text-teal-600 hover:text-teal-800"
                  >
                    Pelajari Modul &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
