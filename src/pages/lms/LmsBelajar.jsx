import { useEffect } from "react";
import { PlayCircle, MonitorPlay } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import belajarBg from "../../assets/lms_belajar_bg.png";

export default function LmsBelajar() {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
    }
  }, [navigate]);

  // Static video data
  const videos = [
    {
      id: 1,
      title: "Tata Bahasa Jepang Dasar - Part 1",
      description: "Pengenalan partikel dasar (wa, ga, o, ni, de) untuk pemula.",
      thumbnail: "https://img.youtube.com/vi/bOUqVC4XkOY/hqdefault.jpg",
      link: "https://www.youtube.com/watch?v=bOUqVC4XkOY"
    },
    {
      id: 2,
      title: "Belajar Huruf Hiragana & Katakana",
      description: "Cara cepat menghafal huruf Hiragana dan Katakana dalam 1 jam.",
      thumbnail: "https://img.youtube.com/vi/6p9Il_j0zjc/hqdefault.jpg",
      link: "https://www.youtube.com/watch?v=6p9Il_j0zjc"
    },
    {
      id: 3,
      title: "Percakapan Sehari-hari (Jikoshoukai)",
      description: "Tips dan trik perkenalan diri dalam bahasa Jepang yang natural.",
      thumbnail: "https://img.youtube.com/vi/sXp3Jj28W_8/hqdefault.jpg",
      link: "https://www.youtube.com/watch?v=sXp3Jj28W_8"
    }
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true} hideSidebar={true}>
      <div className="min-h-full bg-slate-100 pb-24 relative overflow-hidden flex flex-col">
        {/* Dot grid bg */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-60 z-0 pointer-events-none"></div>

        {/* Header Background with 3D Student Illustration */}
        <div className="absolute top-0 left-0 right-0 h-[250px] bg-[#1a1060] overflow-hidden z-0 pointer-events-none">
          {/* 3D Student Background */}
          <div className="absolute inset-0 w-full h-full">
            <img src={belajarBg} alt="Students Studying" className="w-full h-full object-cover object-center opacity-60 mix-blend-luminosity" />
          </div>
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1060] via-indigo-900/85 to-blue-800/50 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1060]/95 via-transparent to-transparent z-10"></div>
          {/* Glowing orbs */}
          <div className="absolute top-[-10%] left-[-5%] w-[280px] h-[280px] bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse z-10"></div>
          <div className="absolute top-[10%] right-[-5%] w-[220px] h-[220px] bg-indigo-400 rounded-full mix-blend-screen filter blur-[70px] opacity-30 z-10"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,white,transparent)] z-20"></div>
        </div>

        <div className="relative z-10 px-3 sm:px-10 pt-8 flex-1 flex flex-col w-full max-w-5xl mx-auto">
          {/* Header Content */}
          <div className="mb-4">
            <button onClick={() => navigate(-1)} className="mb-6 text-white/70 hover:text-white flex items-center gap-1.5 text-sm font-bold transition group w-fit bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10">
              Kembali
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
                <PlayCircle className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-[26px] font-black tracking-wide text-white leading-tight">
                  Belajar Mandiri
                </h1>
                <p className="text-[14px] font-medium text-white/70 mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Video tutorial tambahan untuk belajar di luar jam kelas
                </p>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, idx) => (
              <a
                key={video.id}
                href={video.link}
                target="_blank"
                rel="noreferrer"
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition group block animate-[fadeUp_0.5s_ease-out_forwards]"
                style={{ animationDelay: `${idx * 0.08}s`, opacity: 0 }}
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                      <MonitorPlay className="w-5 h-5 text-red-600 ml-0.5" />
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition leading-snug">{video.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{video.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 text-xs font-bold">
                    <PlayCircle className="w-4 h-4" />
                    Tonton di YouTube
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Footer Banner */}
          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">
              🎓 Video tutorial lainnya akan ditambahkan secara berkala. Selamat belajar!
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}

