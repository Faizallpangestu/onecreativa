import { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Layout from "../components/Layout";
import creativaLogo from "../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "/api/login.php",
        { email, password }
      );

      if (res.data.status === "success") {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        const redirectPath = searchParams.get("redirect") || "/home";
        navigate(redirectPath);
      } else {
        setError(res.data.message || "Email atau password salah");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="flex flex-col h-full bg-[#fdfbf7] relative overflow-hidden px-8 pt-16 pb-12">
        
        {/* Soft Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-300/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-purple-300/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Logo / Notch Spacer */}
          <div className="flex justify-center mb-8 mt-4">
             <img src={creativaLogo} alt="Creativa Logo" className="h-16 w-auto object-contain drop-shadow-md" />
          </div>

        {/* Header Text */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Creativa Bridging<br />International
          </h1>
          <p className="mt-3 text-[14px] font-medium text-slate-500">
            Silakan masuk untuk melanjutkan
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5 flex-1">
          {/* Email */}
          <div>
            <label className="block mb-2 text-[14px] font-bold text-slate-900 ml-2">
              Email atau NIK
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Email / NIK"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[60px] bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] pl-12 pr-4 text-[15px] font-bold text-slate-700 outline-none transition-all focus:border-blue-200 focus:bg-white focus:shadow-[0_12px_40px_rgba(37,99,235,0.08)]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-[14px] font-bold text-slate-900 ml-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-[60px] bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] pl-12 pr-12 text-[15px] font-bold text-slate-700 outline-none transition-all focus:border-blue-200 focus:bg-white focus:shadow-[0_12px_40px_rgba(37,99,235,0.08)]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-5 flex items-center p-2">
                {showPassword
                  ? <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-700 transition" strokeWidth={2} />
                  : <Eye className="w-5 h-5 text-slate-400 hover:text-slate-700 transition" strokeWidth={2} />}
              </button>
            </div>
          </div>

          {/* Spacer to push button to bottom or keep it tight */}
          <div className="mt-8 mb-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[60px] bg-slate-900 text-white rounded-full text-[16px] font-black tracking-wide shadow-[0_10px_30px_rgba(15,23,42,0.2)] hover:bg-slate-800 transition-all disabled:opacity-70 disabled:scale-100 active:scale-[0.97]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </div>
        </form>

        </div>
      </div>
    </Layout>
  );
}
