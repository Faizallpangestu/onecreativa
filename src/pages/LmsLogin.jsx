import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  Globe,
  ChevronDown,
  Mail,
  Lock,
  HelpCircle,
  X,
  Check,
  Building2,
  ArrowRight
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import creativaLogo from "../assets/logo.png";
import bgBanner from "../assets/fuji_pagoda_banner.jpg";
import { getRoleLandingPath } from "../utils/roleAccess";
import { clearLoginCache, sessionUser } from "../utils/loginSession";
import { waitForLogout } from "../utils/logoutUser";

export default function LmsLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Indonesia");
  const [toastMessage, setToastMessage] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useSEO({
    title: "Masuk Portal LMS",
    description: "Portal Khusus Pembelajaran Siswa, Pengajar Sensei, dan Admin LMS LPK Creativa Bridging International."
  });

  // Load remembered LMS email
  useEffect(() => {
    const saved = localStorage.getItem("creativa_remember_lms_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Check active session
  useEffect(() => {
    if (!localStorage.getItem("user")) return;
    const request = new AbortController();
    waitForLogout()
      .then(() => axios.get("/api/session.php", { signal: request.signal }))
      .then(({ data }) => {
        if (!request.signal.aborted) {
          window.location.href = getRoleLandingPath(sessionUser(data).role_name);
        }
      })
      .catch((error) => {
        if (!request.signal.aborted && error.response?.status === 401) {
          clearLoginCache();
        }
      });
    return () => request.abort();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/login.php", { email, password });

      if (res.data.status === "success") {
        if (rememberMe) {
          localStorage.setItem("creativa_remember_lms_email", email);
        } else {
          localStorage.removeItem("creativa_remember_lms_email");
        }

        localStorage.setItem("user", JSON.stringify(res.data.user));
        let redirectPath = searchParams.get("redirect");
        if (
          !redirectPath ||
          redirectPath === "/home" ||
          !redirectPath.startsWith("/") ||
          redirectPath.startsWith("//") ||
          redirectPath.startsWith("/login") ||
          redirectPath.startsWith("/lms/login") ||
          redirectPath.startsWith("/lms-login")
        ) {
          redirectPath = getRoleLandingPath(res.data.user.role_name);
        }
        window.location.href = redirectPath;
      } else {
        setError(res.data.message || "Email atau password salah");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Terjadi kesalahan. Pastikan server backend aktif.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between font-sans select-none bg-slate-950">
      {/* Background Japanese Theme */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40 mix-blend-luminosity"
        style={{
          backgroundImage: `url(${bgBanner})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-indigo-950/80" />
      </div>

      {/* Floating Ambient Lights */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-30 w-full px-5 sm:px-10 pt-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={creativaLogo}
            alt="Logo Creativa"
            width="40"
            height="40"
            className="w-9 h-9 object-contain drop-shadow-md rounded-full bg-white p-0.5"
          />
          <div>
            <div className="text-sm font-black tracking-wider text-white leading-tight">
              LPK CREATIVA
            </div>
            <div className="text-[9px] font-bold tracking-[0.2em] text-indigo-300 leading-tight">
              LEARNING MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        {/* Link back to HRIS Portal */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all shadow-sm backdrop-blur-md"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Portal HRIS Kantor</span>
          </Link>

          {/* Language selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Pilih Bahasa"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-300" />
              <span>{selectedLang}</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/15 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { code: "id", name: "Indonesia" },
                  { code: "ja", name: "日本語 (JP)" },
                  { code: "en", name: "English (US)" }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.name);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${selectedLang === lang.name ? "text-indigo-400 bg-white/5" : "text-slate-300"
                      }`}
                  >
                    <span>{lang.name}</span>
                    {selectedLang === lang.name && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-5 sm:px-10 py-6 sm:py-10 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-14">
        {/* Left Side: LMS Highlights */}
        <div className="hidden lg:flex w-full lg:w-[50%] flex-col justify-center text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md w-fit">
            <GraduationCap className="w-4 h-4" />
            <span>Portal Khusus LMS & Akademik</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Pusat Pembelajaran &amp; Manajemen LPK
          </h1>

          <p className="text-slate-300 font-medium text-sm lg:text-base leading-relaxed max-w-lg">
            Platform terpadu untuk Siswa Intensif, Sensei Pengajar, dan Administrator LMS LPK Creativa Bridging International menuju karir profesional di Jepang.
          </p>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-2 gap-3.5 max-w-lg pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Materi &amp; Silabus</div>
                <div className="text-[10px] text-slate-400">Jadwal &amp; Modul N5-N3</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Latihan Kaiwa AI</div>
                <div className="text-[10px] text-slate-400">Percakapan Interaktif</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Tugas &amp; Kuis</div>
                <div className="text-[10px] text-slate-400">Tryout Ukom &amp; Ujian</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Rekap Nilai</div>
                <div className="text-[10px] text-slate-400">Leaderboard Siswa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: LMS Login Card */}
        <main
          id="lms-login-content"
          className="w-full lg:w-[420px] flex items-center justify-center shrink-0"
        >
          <div className="w-full max-w-[420px] bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/15 p-6 sm:p-8 flex flex-col relative z-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3 text-white">
                <GraduationCap className="w-7 h-7" />
              </div>

              <div className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                PORTAL LMS &amp; AKADEMIK
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight leading-snug mt-1">
                Masuk ke LMS
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px] mt-1">
                Akses khusus Siswa, Sensei Pengajar, &amp; Admin LMS LPK Creativa.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-4 bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl p-3 flex items-start gap-2.5"
              >
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  !
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email / NIK */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Akun LMS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="username"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@creativabridging.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi LMS"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span>Ingat saya di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Portal LMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Switch to HRIS link */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400 mb-2">Bukan akun LMS? Untuk HRD, GA &amp; Finance:</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Masuk ke Portal HRIS Kantor &rarr;</span>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-20 w-full text-center py-3 text-[11px] font-medium text-slate-500 shrink-0 border-t border-white/5">
        &copy; {new Date().getFullYear()} LPK Creativa Bridging International • LMS &amp; Academic System
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/15 relative text-white">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-400/20">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-1.5">Lupa Password LMS?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Untuk siswa intensif dan sensei, silakan hubungi <strong>Admin Akademik / Sensei Koordinator</strong> LPK Creativa untuk melakukan reset kata sandi.
            </p>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-slate-300 space-y-1 mb-5">
              <div>
                <strong>Email Akademik:</strong> lms@creativabridging.com
              </div>
              <div>
                <strong>Helpdesk Siswa:</strong> +62 812-3456-7890
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
