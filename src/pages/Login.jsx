import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Users,
  Calendar,
  FileText,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Globe,
  ChevronDown,
  Mail,
  Lock,
  HelpCircle,
  X,
  Check
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import creativaLogo from "../assets/logo.png";
import bgFuji from "../assets/login_bg_fuji.jpg";
import { getRoleLandingPath } from "../utils/roleAccess";
import { clearLoginCache, sessionUser } from "../utils/loginSession";
import { waitForLogout } from "../utils/logoutUser";

export default function Login() {
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
    title: "Masuk",
    description: "Silakan masuk ke sistem ONE Creativa menggunakan email atau NIK Anda."
  });

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem("creativa_remember_email");
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
          navigate(getRoleLandingPath(sessionUser(data).role_name), { replace: true });
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
          localStorage.setItem("creativa_remember_email", email);
        } else {
          localStorage.removeItem("creativa_remember_email");
        }

        localStorage.setItem("user", JSON.stringify(res.data.user));
        let redirectPath = searchParams.get("redirect");
        if (
          !redirectPath ||
          redirectPath === "/home" ||
          !redirectPath.startsWith("/") ||
          redirectPath.startsWith("//") ||
          redirectPath.startsWith("/login")
        ) {
          redirectPath = getRoleLandingPath(res.data.user.role_name);
        }
        navigate(redirectPath);
      } else {
        setError(res.data.message || "Email atau password salah");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Terjadi kesalahan. Pastikan server backend aktif.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSsoClick = (provider) => {
    setToastMessage(`Login SSO ${provider} sedang disinkronisasi dengan portal perusahaan.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="relative h-screen h-dvh w-full overflow-hidden flex flex-col justify-between font-sans select-none bg-slate-900">
      {/* Background with scenic Fuji wallpaper */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${bgFuji})`
        }}
      >
        {/* Soft atmospheric radial gradient to guarantee contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent lg:block hidden" />
        <div className="absolute inset-0 bg-white/90 lg:hidden block" />
      </div>

      <a href="#login-content" className="skip-link">
        Langsung ke formulir login
      </a>

      {/* CSS Animations & Custom Styling */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
          
          .font-handwriting {
            font-family: 'Caveat', 'Segoe Script', cursive;
          }

          @keyframes floatSakura {
            0% {
              transform: translate(0, -10px) rotate(0deg);
              opacity: 0;
            }
            15% {
              opacity: 0.8;
            }
            85% {
              opacity: 0.8;
            }
            100% {
              transform: translate(120px, 360px) rotate(360deg);
              opacity: 0;
            }
          }

          .sakura-petal {
            position: absolute;
            background: radial-gradient(circle, #fbcfe8 0%, #f472b6 100%);
            border-radius: 50% 0 50% 50%;
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(244, 114, 182, 0.3));
          }
        `}
      </style>

      {/* Floating Sakura Petals Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10" aria-hidden="true">
        <div
          className="sakura-petal w-3 h-3 top-8 left-[18%]"
          style={{ animation: "floatSakura 11s infinite linear", animationDelay: "0s" }}
        />
        <div
          className="sakura-petal w-3.5 h-3.5 top-16 left-[45%]"
          style={{ animation: "floatSakura 13s infinite linear", animationDelay: "2.5s" }}
        />
        <div
          className="sakura-petal w-2.5 h-2.5 top-4 left-[65%]"
          style={{ animation: "floatSakura 12s infinite linear", animationDelay: "5s" }}
        />
        <div
          className="sakura-petal w-3 h-3 top-12 left-[82%]"
          style={{ animation: "floatSakura 10s infinite linear", animationDelay: "7s" }}
        />
      </div>

      {/* Top Bar with Language Selector */}
      <header className="relative z-30 w-full px-5 sm:px-10 pt-3 sm:pt-4 flex justify-between items-center shrink-0">
        {/* Mobile Header Brand (visible on small screens) */}
        <div className="flex lg:hidden items-center gap-2.5">
          <img
            src={creativaLogo}
            alt="Logo Creativa"
            width="36"
            height="36"
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
          <div>
            <div className="text-xs font-black tracking-wider text-slate-800 leading-none">CREATIVA</div>
            <div className="text-[8px] font-bold tracking-[0.2em] text-slate-500 leading-tight">
              BRIDGING INTERNATIONAL
            </div>
          </div>
        </div>

        {/* Empty placeholder on desktop to push language to top-right */}
        <div className="hidden lg:block" />

        {/* Language selector dropdown */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Pilih Bahasa"
            className="flex items-center gap-1.5 bg-white/85 hover:bg-white backdrop-blur-md px-3 py-1 rounded-full border border-white/90 shadow-sm text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            <span>{selectedLang}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                  className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                    selectedLang === lang.name ? "text-blue-600 bg-blue-50/50" : "text-slate-700"
                  }`}
                >
                  <span>{lang.name}</span>
                  {selectedLang === lang.name && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area - Locked into Viewport Height */}
      <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-5 sm:px-10 py-1 sm:py-2 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 lg:gap-10 min-h-0">
        {/* Left Side: Brand Overview & Integrated Features */}
        <aside
          aria-label="Tentang ONE Creativa"
          className="hidden lg:flex w-full lg:w-[50%] flex-col justify-between py-1 text-slate-800"
        >
          {/* Top Logo & Title */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={creativaLogo}
                alt="Logo Creativa Bridging International"
                width="42"
                height="42"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
              <div>
                <div className="text-base font-black tracking-wider text-slate-900 leading-tight">
                  CREATIVA
                </div>
                <div className="text-[10px] font-bold tracking-[0.22em] text-slate-500 leading-tight">
                  BRIDGING INTERNATIONAL
                </div>
              </div>
            </div>

            {/* Accent dash */}
            <div className="w-7 h-1 bg-blue-600 rounded-full mb-3" />

            <h2 className="text-blue-600 font-extrabold text-xs sm:text-sm tracking-[0.2em] uppercase mb-0.5">
              ONE CREATIVA
            </h2>

            <h1 className="text-3xl lg:text-[40px] font-black text-slate-900 tracking-tight leading-none mb-2.5">
              Integrated System
            </h1>

            <p className="text-slate-600 font-medium text-xs sm:text-[13px] leading-relaxed max-w-md mb-5">
              Akses HRIS dan LMS dalam satu platform untuk mendukung manajemen dan pengembangan sumber
              daya manusia secara lebih efisien.
            </p>

            {/* 6 Grid Feature Badges (Compact) */}
            <div className="grid grid-cols-2 gap-2.5 max-w-md mb-4">
              {/* Feature 1: HRIS */}
              <div className="bg-white/85 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-xs leading-tight">HRIS</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Manajemen Karyawan
                  </div>
                </div>
              </div>

              {/* Feature 2: Absensi & Cuti */}
              <div className="bg-white/85 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-xs leading-tight">Absensi</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight">&amp; Cuti</div>
                </div>
              </div>

              {/* Feature 3: Payroll */}
              <div className="bg-white/85 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-xs leading-tight">Payroll</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                    &amp; Administrasi
                  </div>
                </div>
              </div>

              {/* Feature 4: LMS */}
              <div className="bg-white/85 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-xs leading-tight">LMS</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Pembelajaran Terintegrasi
                  </div>
                </div>
              </div>

              {/* Feature 5: Materi Interaktif */}
              <div className="bg-white/85 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-xs leading-tight">Materi</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Interaktif
                  </div>
                </div>
              </div>

              {/* Feature 6: Pantau Progress */}
              <div className="bg-white/85 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-xs leading-tight">Pantau</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight">Progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cursive Commitment */}
          <div className="pt-1">
            <span className="font-handwriting text-2xl sm:text-3xl font-bold text-slate-800/90 tracking-wide drop-shadow-sm select-none">
              Your Future Our Commitment
            </span>
          </div>
        </aside>

        {/* Center / Middle Background Japanese Kanji & Tagline */}
        <div
          className="hidden xl:flex flex-col items-center select-none text-slate-700/80 pointer-events-none self-center"
          aria-hidden="true"
        >
          <div
            className="text-xl font-black tracking-[0.35em] text-slate-700/75 drop-shadow-sm"
            style={{ writingMode: "vertical-rl" }}
          >
            学び、働き、未来へ
          </div>
          <div className="flex flex-col text-[9px] font-bold tracking-[0.25em] text-slate-500/80 text-center mt-3 leading-relaxed">
            <span>LEARN</span>
            <span>WORK</span>
            <span>GROW</span>
            <span>TOGETHER</span>
          </div>
        </div>

        {/* Right Side: Clean Single Unified Login Card */}
        <main
          id="login-content"
          tabIndex={-1}
          className="w-full lg:w-[420px] flex items-center justify-center focus:outline-none shrink-0"
        >
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_45px_-12px_rgba(15,23,42,0.18)] border border-white/90 p-5 sm:p-7 flex flex-col relative z-20">
            {/* Card Logo & Header */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-slate-100 mb-2">
                <img
                  src={creativaLogo}
                  alt="Logo ONE Creativa"
                  width="40"
                  height="40"
                  decoding="async"
                  fetchPriority="high"
                  className="w-8 h-8 object-contain drop-shadow-sm"
                />
              </div>

              <div className="text-[10px] font-black tracking-wider text-slate-800 uppercase">
                CREATIVA
              </div>
              <div className="text-[8px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">
                BRIDGING INTERNATIONAL
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mb-1">
                Login to ONE Creativa
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed max-w-[290px]">
                Akses seluruh layanan portal dengan satu akun terpadu Anda.
              </p>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
              <div
                role="status"
                className="mb-3 p-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl animate-in fade-in duration-200 flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                id="login-error"
                className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl p-3 flex items-start gap-2"
              >
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Single Unified Login Form */}
            <form
              method="post"
              onSubmit={handleLogin}
              aria-label="Masuk ke ONE Creativa"
              aria-busy={isLoading}
              className="space-y-3.5"
            >
              {/* Email / NIK */}
              <div>
                <label htmlFor="email" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email atau NIK
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby={error ? "login-error" : undefined}
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f4f7fb] border border-slate-200/70 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/15 transition-all"
                    placeholder="Masukkan email atau NIK Anda"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    aria-describedby={error ? "login-error" : undefined}
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#f4f7fb] border border-slate-200/70 rounded-xl py-2.5 pl-9 pr-9 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/15 transition-all"
                    placeholder="Masukkan password Anda"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 accent-blue-600 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-600 text-[11px]">Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer text-[11px]"
                >
                  Lupa password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label={isLoading ? "Sedang masuk" : "Masuk Sekarang"}
                  className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 group cursor-pointer"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    "Masuk Sekarang"
                  )}
                </button>
              </div>
            </form>

            {/* SSO Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                atau masuk dengan
              </span>
            </div>

            {/* Social SSO Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSsoClick("Google")}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 font-bold text-xs text-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSsoClick("Microsoft")}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 font-bold text-xs text-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Footer subtle note (Compact) */}
      <footer className="relative z-20 w-full text-center py-2 text-[10px] font-medium text-slate-500/80 shrink-0">
        &copy; {new Date().getFullYear()} PT. Creativa Bridging International. All rights reserved.
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-1.5">Lupa Password?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Untuk keamanan akun Anda, silakan hubungi bagian <strong>HRD</strong> atau{" "}
              <strong>IT Administrator</strong> PT. Creativa Bridging International untuk melakukan reset
              kata sandi.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1 mb-5">
              <div>
                <strong>Email Dukungan:</strong> support@creativabridging.com
              </div>
              <div>
                <strong>Helpdesk:</strong> +62 812-3456-7890
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
