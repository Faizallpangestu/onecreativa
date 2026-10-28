import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Plus, X, Search, Edit2, Trash2, ShieldCheck, Mail, KeyRound, RefreshCw, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { cacheLpkStudents } from "../utils/lpkStudents";
import { matchesLmsAccountRole, normalizeRole } from "../utils/roleAccess";
import useAccessAccounts from "../hooks/useAccessAccounts";
import { useSEO } from "../hooks/useSEO";
import { employeeError } from "../utils/employeeApi";

const EMPLOYEES_API_URL = "/api/employees.php?scope=lms";

function getInitials(name) {
  if (!name) return "SYS";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function AccessRightsLPK({ role }) {
  const selectedRole = normalizeRole(role);
  const isSenseiPage = selectedRole === "sensei";

  useSEO({
    title: isSenseiPage ? "Hak Akses Sensei LMS" : "Hak Akses Siswa LMS",
    description: isSenseiPage
      ? "Kelola akun pengajar dan hak akses Sensei LMS ONE Creativa."
      : "Kelola akun peserta, kelas, dan batch Siswa Intensif LPK ONE Creativa."
  });

  const { accounts, isLoading, loadError, updatedAt, refresh: fetchUsers, removeAccount } = useAccessAccounts("lms");
  const users = accounts.filter(u => matchesLmsAccountRole(u.role_name, selectedRole));
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role_name: selectedRole || "peserta_intensif",
    level: "",
    batch: "",
  });

  useEffect(() => {
    if (updatedAt) cacheLpkStudents(accounts);
  }, [accounts, updatedAt]);

  const filteredUsers = users.filter((u) => {
    const keyword = searchQuery.toLowerCase();
    const searchableText = [u.name, u.email, u.role_name].filter(Boolean).join(" ").toLowerCase();
    return searchableText.includes(keyword);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!matchesLmsAccountRole(form.role_name, selectedRole)) {
      setErrorMessage("Pilih role sensei atau siswa yang sesuai dengan halaman LMS ini.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setErrorMessage("Nama dan Email wajib diisi.");
      return;
    }
    if (!form.id && !form.password.trim()) {
      setErrorMessage("Password wajib diisi untuk akun LMS baru.");
      return;
    }
    if (form.password && (form.password.length < 8 || form.password.length > 72)) {
      setErrorMessage("Password harus 8–72 karakter.");
      return;
    }
    if (normalizeRole(form.role_name) === "peserta_intensif" && (!form.level || !form.batch.trim())) {
      setErrorMessage("Level dan Batch wajib diisi untuk akun siswa LMS.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      // Auto generate missing fields to satisfy the backend employees.php requirements
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        role_name: normalizeRole(form.role_name),
        nik: form.id ? form.nik : `SYS-${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
        position_name: form.id ? form.position_name : (isSenseiPage ? "SENSEI" : "PESERTA_INTENSIF"),
        gender: form.gender || "Laki-laki",
        level: form.level ? form.level.trim() : "",
        batch: form.batch ? form.batch.trim() : "",
      };

      const response = form.id
        ? await axios.put(EMPLOYEES_API_URL, payload)
        : await axios.post(EMPLOYEES_API_URL, payload);
      if (response.data?.status !== "success") throw new Error(response.data?.message || "Gagal menyimpan akun.");

      setSuccessMessage(`Akun ${form.name.trim()} berhasil ${form.id ? 'diperbarui' : 'dibuat'}.`);
      
      setForm({ id: null, name: "", email: "", password: "", role_name: selectedRole || "peserta_intensif", level: "", batch: "" });
      setIsFormOpen(false);
      setErrorMessage("");
      await fetchUsers();
    } catch (error) {
      setErrorMessage(employeeError(error, "Gagal menyimpan akun."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (u) => {
    if (!u.id) return;
    setForm({
      ...u,
      name: u.name || "",
      email: u.email || "",
      password: "", 
      role_name: normalizeRole(u.role_name) || "peserta_intensif",
      level: u.level || "",
      batch: u.batch || "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
  };

  const handleDelete = async (account) => {
    if (!account.user_id) return;
    if (deletingId !== null) return;
    if (!window.confirm(`Hapus akses login ${account.name}? Akun akan hilang dari daftar dan tidak dapat login. Riwayat yang sudah terkait tetap disimpan.`)) return;
    
    setDeletingId(account.user_id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await axios.delete(EMPLOYEES_API_URL, { params: { user_id: account.user_id, ...(account.id ? { id: account.id } : {}) } });
      if (response.data?.status !== "success" || !["deleted", "archived"].includes(response.data.data?.status)) {
        throw new Error(response.data?.message || "Penghapusan akun belum berhasil.");
      }
      removeAccount(account.user_id);
      setSuccessMessage(response.data.message);
      await fetchUsers();
    } catch (error) {
      setErrorMessage(employeeError(error, "Gagal menghapus akun LMS."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-28 relative overflow-hidden max-w-6xl mx-auto">
        
        {/* ── Top Navigation & LPK Context ── */}
        <div className="px-5 pt-6 pb-2 max-w-5xl mx-auto">
           <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
             <GraduationCap className="w-3.5 h-3.5" />
             <span>LPK CREATIVA · Hak Akses Akademik LMS</span>
           </div>
           <h2 className="text-[20px] font-black text-slate-800 mb-1">
             {isSenseiPage ? "Hak Akses Sensei LMS" : selectedRole === "peserta_intensif" ? "Hak Akses Siswa LMS" : "Hak Akses LMS"}
           </h2>
           <p className="mb-4 text-sm text-slate-500">
             Kelola akun login {isSenseiPage ? "Sensei / Pengajar" : "Siswa / Peserta Intensif"} LPK Creativa terpisah dari akun kantor.
           </p>

           {/* ── LPK Only Access Tabs ── */}
           <nav aria-label="Navigasi Hak Akses LPK" className="mb-6 flex flex-wrap items-center gap-2">
             <Link
               to="/access-rights-sensei"
               className={`rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition shadow-sm ${
                 isSenseiPage
                   ? "bg-indigo-600 text-white shadow-indigo-100 ring-2 ring-indigo-600/20"
                   : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
               }`}
             >
               Akses Sensei
             </Link>
             <Link
               to="/access-rights-siswa"
               className={`rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition shadow-sm ${
                 !isSenseiPage
                   ? "bg-indigo-600 text-white shadow-indigo-100 ring-2 ring-indigo-600/20"
                   : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
               }`}
             >
               Akses Siswa
             </Link>
           </nav>
           <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
             <span>{updatedAt ? `${users.length} akun · Terakhir diperbarui ${updatedAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Bangkok" })}` : `${users.length} akun terdaftar`}</span>
             <button type="button" onClick={fetchUsers} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Perbarui Data</button>
           </div>
           {successMessage && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>}
           {loadError && users.length > 0 && (
             <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
               <span>Peringatan server: {loadError} (Menampilkan daftar terakhir yang berhasil dimuat).</span>
               <button type="button" onClick={fetchUsers} className="underline hover:text-amber-900 ml-2">Coba Lagi</button>
             </div>
           )}
           {(!isFormOpen && errorMessage) && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
           {/* Search Bar */}
           <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                aria-label="Cari akun LMS"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white border border-slate-200 shadow-sm rounded-2xl pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all"
              />
           </div>
        </div>

        {/* ── List Users ── */}
        <div className="relative z-10 px-5 py-4 flex flex-col gap-4 mt-2">
            {isLoading && users.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                 <p className="text-sm font-semibold text-slate-400">Memuat data akun {isSenseiPage ? "Sensei" : "Siswa"}...</p>
              </div>
            ) : loadError && users.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-red-100 shadow-sm p-6">
                 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                   <ShieldCheck className="w-8 h-8" />
                 </div>
                 <p className="text-[15px] font-bold text-red-700">{loadError}</p>
                 <p className="text-sm text-slate-400 mt-1">Gagal memuat akun dari server. Periksa database atau koneksi server.</p>
                 <button
                   type="button"
                   onClick={fetchUsers}
                   className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-md hover:bg-indigo-700 transition active:scale-95"
                 >
                   Coba Muat Ulang
                 </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <ShieldCheck className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-[15px] font-bold text-slate-600">{searchQuery ? "Akun tidak ditemukan" : `Belum Ada Akun ${isSenseiPage ? "Sensei" : "Siswa"}`}</p>
                 <p className="text-sm text-slate-400 mt-1">{searchQuery ? "Ubah pencarian nama atau email." : `Buat akun ${isSenseiPage ? "sensei" : "siswa"} untuk mengakses LMS.`}</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.user_id} className="bg-white rounded-3xl p-5 shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 group">
                  
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-black shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                    {getInitials(u.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-900 truncate">{u.name}</h3>
                    <p className="text-[12px] font-semibold text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {u.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                         <ShieldCheck className="w-3 h-3 text-slate-500" />
                         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{u.role_name}</span>
                      </div>
                      {(u.role_name || "").toLowerCase() === "peserta_intensif" && (
                        <>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">{u.level ? `Level ${u.level}` : "Level belum diatur"}</span>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">{u.batch || "Batch belum diatur"}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{Number(u.is_active) === 1 ? "Akun aktif" : "Akun nonaktif"} · {normalizeRole(u.role_name) === "peserta_intensif" ? "Portal Siswa LMS" : "Dashboard Sensei LMS"}</p>
                    {!u.id && <p className="mt-2 text-xs text-slate-500">Akun login tanpa profil. Edit tersedia setelah profil akun dilengkapi.</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link 
                      to={isSenseiPage ? "/dashboard-sensei" : "/dashboard-siswa-intensif"}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Dashboard
                    </Link>
                    <button 
                      aria-label={`Edit akun ${u.name}`}
                      disabled={!u.id}
                      onClick={() => handleEdit(u)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition active:scale-95 disabled:opacity-40"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      aria-label={`Hapus akun ${u.name}`}
                      disabled={!u.user_id || deletingId !== null}
                      onClick={() => handleDelete(u)}
                      className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
        </div>

        {/* ── Floating Action Button ── */}
        <div className="fixed bottom-6 right-0 left-0 pointer-events-none z-20 flex justify-center px-5">
          <button
            onClick={() => {
              setForm({ id: null, name: "", email: "", password: "", role_name: selectedRole || "peserta_intensif", level: "", batch: "" });
              setErrorMessage("");
              setSuccessMessage("");
              setIsFormOpen(true);
            }}
            className="w-full max-w-md h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[15px] font-bold tracking-wide shadow-[0_8px_25px_rgba(79,70,229,0.4)] transition-transform hover:bg-indigo-700 active:scale-[0.98] pointer-events-auto gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Buat Akun {isSenseiPage ? "Sensei" : "Siswa"}
          </button>
        </div>

        {/* ── Bottom Sheet Form ── */}
        {isFormOpen && (
          <div role="dialog" aria-modal="true" aria-labelledby="lms-account-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { if (!isSaving) setIsFormOpen(false); }}></div>
             
             <div className="bg-white w-full sm:w-[450px] max-h-[90dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-3xl shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out]">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                   <h2 id="lms-account-title" className="text-[18px] font-black text-slate-900">
                     {form.id ? "Edit Akun LMS" : `Buat Akun ${isSenseiPage ? "Sensei" : "Siswa"}`}
                   </h2>
                   <button aria-label="Tutup form akun LMS" disabled={isSaving} onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full disabled:opacity-50">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                 <fieldset disabled={isSaving} className="flex min-w-0 flex-col gap-4 disabled:opacity-70">
                  {errorMessage && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600 text-center">
                      {errorMessage}
                    </div>
                  )}

                  {!role && (
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Pilih Hak Akses</span>
                      <select
                        value={form.role_name}
                        onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                        className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] text-slate-900 font-bold outline-none transition focus:bg-white focus:border-indigo-400"
                      >
                        <option value="peserta_intensif">Peserta Siswa Intensif (Portal)</option>
                        <option value="sensei">Sensei (Pengajar Intensif)</option>
                        <option value="sensei_intensif">Sensei Intensif</option>
                      </select>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Nama Pemegang Akun</span>
                    <input
                      required
                      placeholder="Misal: Budi Santoso"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Email Login</span>
                    <input
                      required
                      type="email"
                      placeholder="nama@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                    />
                  </label>

                  <label className="block mb-2">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Password</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required={!form.id}
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        placeholder={form.id ? "Kosongkan jika tidak diubah" : "Password rahasia"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 pl-11 pr-4 text-[14px] font-mono font-bold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Status Login</span>
                    <select value={form.is_active ?? 1} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-sm font-semibold text-slate-900">
                      <option value={1}>Aktif — dapat login</option>
                      <option value={0}>Nonaktif — tidak dapat login</option>
                    </select>
                  </label>

                  {form.role_name.toLowerCase() === 'peserta_intensif' && (
                    <div className="flex gap-4">
                      <label className="block flex-1">
                        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Level</span>
                        <select
                          value={form.level}
                          required
                          onChange={(e) => setForm({ ...form, level: e.target.value })}
                          className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                        >
                          <option value="">Pilih level</option>
                          {form.level && !["N5", "N4", "N3"].includes(form.level) && <option value={form.level}>{form.level}</option>}
                          <option value="N5">N5</option>
                          <option value="N4">N4</option>
                          <option value="N3">N3</option>
                        </select>
                      </label>
                      <label className="block flex-1">
                        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Batch</span>
                        <input
                          type="text"
                          value={form.batch}
                          required
                          placeholder="Misal: BATCH 2"
                          onChange={(e) => setForm({ ...form, batch: e.target.value })}
                          className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                        />
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-[15px] font-black tracking-wide shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition active:scale-[0.98]"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Akun"}
                  </button>
                 </fieldset>
                </form>
             </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </Layout>
  );
}
