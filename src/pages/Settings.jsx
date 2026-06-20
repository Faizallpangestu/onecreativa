import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings as SettingsIcon } from "lucide-react";

const SETTINGS_API = "/api/settings.php";

export default function Settings() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: "",
    check_in_time: "",
    tolerance_minutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(SETTINGS_API);
      if (res.data?.data) {
        setForm({
          company_name: res.data.data.company_name || "",
          check_in_time: res.data.data.check_in_time || "07:00:00",
          tolerance_minutes: res.data.data.tolerance_minutes || 0,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });

    try {
      await axios.put(SETTINGS_API, form);
      setSubmitMsg({ type: "success", text: "Pengaturan berhasil disimpan!" });
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.response?.data?.message || "Gagal menyimpan pengaturan" });
    }
  };

  if (isLoading) {
    return (
      <Layout hideMobileHeader={true} hideBottomNav={true}>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">

        {/* Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 rounded-b-[2.5rem] shadow-md z-0">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-5 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-black text-white tracking-wide">Pengaturan Sistem</h1>
            <div className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-white/80 text-[13px] font-semibold">Konfigurasi dasar absensi dan perusahaan</p>
        </div>

        {/* Form Content */}
        <div className="relative z-10 px-5 mt-2">
          <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-[16px] font-black text-slate-900">General Settings</h2>
              <p className="text-[12px] font-semibold text-slate-400 mt-1">Konfigurasi dasar aplikasi dan aturan absensi.</p>
            </div>

            {submitMsg.text && (
              <div
                className={`mx-6 mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  submitMsg.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {submitMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Company Name */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                />
              </div>

              {/* Check In Time */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  Jam Masuk Standar
                </label>
                <input
                  type="time"
                  step="1"
                  value={form.check_in_time}
                  onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                />
              </div>

              {/* Tolerance */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.tolerance_minutes}
                  onChange={(e) => setForm({ ...form, tolerance_minutes: e.target.value })}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                />
                <p className="mt-2 text-xs text-slate-400 font-medium">
                  Contoh: Jam Masuk 07:00, Toleransi 10 menit → terlambat mulai 07:11.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-slate-800 text-white rounded-2xl text-[14px] font-black tracking-wide shadow-lg transition hover:bg-slate-900 active:scale-[0.98]"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
