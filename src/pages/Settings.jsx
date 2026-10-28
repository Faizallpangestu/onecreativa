import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Building2, 
  Wallet, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  GraduationCap 
} from "lucide-react";
import useAccessAccounts from "../hooks/useAccessAccounts";
import { normalizeRole } from "../utils/roleAccess";

const SETTINGS_API = "/api/settings.php";

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "access" ? "access" : "general";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [form, setForm] = useState({
    company_name: "",
    check_in_time: "",
    tolerance_minutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });

  const { accounts } = useAccessAccounts("system");

  const gaCount = accounts.filter(u => normalizeRole(u.role_name) === "ga").length;
  const hrCount = accounts.filter(u => ["hr", "hrd", "hr_admin", "manager", "admin", "super_admin"].includes(normalizeRole(u.role_name))).length;
  const financeCount = accounts.filter(u => ["finance", "finance_admin"].includes(normalizeRole(u.role_name))).length;

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "access" ? { tab: "access" } : {});
  };

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
      <div className="min-h-full bg-slate-50 pb-16 relative overflow-hidden max-w-5xl mx-auto px-4 md:px-6 pt-6">
        
        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Sistem & Pengaturan</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi operasional perusahaan serta kontrol hak akses login kantor (GA, HRD, Finance).
          </p>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-4">
          <button
            type="button"
            onClick={() => handleTabChange("general")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold transition shadow-sm ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-slate-200 ring-2 ring-slate-900/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Pengaturan Umum</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("access")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold transition shadow-sm ${
              activeTab === "access"
                ? "bg-indigo-600 text-white shadow-indigo-100 ring-2 ring-indigo-600/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Hak Akses GA, HRD & Finance</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-black ${activeTab === "access" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"}`}>
              {accounts.length}
            </span>
          </button>
        </div>

        {/* ── TAB 1: General Settings ── */}
        {activeTab === "general" && (
          <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-black text-slate-900">General Settings</h2>
                <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Konfigurasi dasar aplikasi dan aturan jam kerja kantor.</p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            {submitMsg.text && (
              <div
                className={`mx-6 mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
                  submitMsg.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitMsg.text}</span>
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
                  placeholder="Contoh: PT. Creativa Bridging International"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white font-medium"
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
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white font-medium"
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
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white font-medium"
                />
                <p className="mt-2 text-xs text-slate-400 font-medium">
                  Contoh: Jam Masuk 07:00, Toleransi 10 menit → keterlambatan dihitung mulai pukul 07:11.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[14px] font-black tracking-wide shadow-lg transition hover:bg-black active:scale-[0.98]"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 2: Office Access Rights (GA, HRD, Finance) ── */}
        {activeTab === "access" && (
          <div className="space-y-6">
            
            {/* Banner Info */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  Pengaturan Hak Akses Kantor & Sistem
                </span>
                <h2 className="text-xl md:text-2xl font-black mb-2">
                  Pengaturan Akses GA, HRD & Finance
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Kelola akun login staf operasional kantor (HRD, GA, dan Finance). Karyawan reguler dikelola melalui HRD, sedangkan akun Siswa dan Sensei dikelola secara terpisah di menu LPK Creativa.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/access-rights"
                    className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition"
                  >
                    <span>Buka Semua Akun Login Kantor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* HRD Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="rounded-full bg-amber-100/70 px-3 py-1 text-xs font-black text-amber-800">
                      {hrCount} Akun
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">HRD & Administrator</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Mengelola karyawan kantor, presensi, persetujuan cuti, lembur, dan slip gaji karyawan.
                  </p>
                  <div className="text-[11px] font-semibold text-slate-400 bg-slate-50 rounded-xl p-2.5 mb-4">
                    Login landing: <span className="font-bold text-slate-700">Menu HRD (/menu-hrd)</span>
                  </div>
                </div>
                <Link
                  to="/access-rights-hr"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-black transition"
                >
                  <span>Atur Akses HRD</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* GA Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <span className="rounded-full bg-blue-100/70 px-3 py-1 text-xs font-black text-blue-800">
                      {gaCount} Akun
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">GA (General Affairs)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Mengelola inventaris aset perusahaan, pemeliharaan, audit aset kantor, dan persetujuan barang.
                  </p>
                  <div className="text-[11px] font-semibold text-slate-400 bg-slate-50 rounded-xl p-2.5 mb-4">
                    Login landing: <span className="font-bold text-slate-700">Menu GA (/menu-ga)</span>
                  </div>
                </div>
                <Link
                  to="/access-rights-ga"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-black transition"
                >
                  <span>Atur Akses GA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Finance Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <span className="rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-black text-emerald-800">
                      {financeCount} Akun
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">Finance (Keuangan)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Mengelola transaksi pemasukan & pengeluaran, faktur invoice, reimbursements, dan kas perusahaan.
                  </p>
                  <div className="text-[11px] font-semibold text-slate-400 bg-slate-50 rounded-xl p-2.5 mb-4">
                    Login landing: <span className="font-bold text-slate-700">Dashboard Finance</span>
                  </div>
                </div>
                <Link
                  to="/access-rights-finance"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-black transition"
                >
                  <span>Atur Akses Finance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Separation Notice */}
            <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <strong className="text-slate-800">Hak Akses Siswa & Sensei:</strong> Akun akademik LMS (Sensei dan Siswa Intensif) dikelola di menu <strong className="text-indigo-600">LPK CREATIVA → Hak Akses</strong>, sedangkan data karyawan umum dikelola di <strong className="text-slate-800">HRD → Manajemen Karyawan</strong>.
              </div>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}
