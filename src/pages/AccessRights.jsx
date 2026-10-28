import { useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Plus, X, Search, Edit2, Trash2, ShieldCheck, Mail, KeyRound, Eye, EyeOff, RefreshCw, ExternalLink, ArrowRight } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { SYSTEM_ROLES, getSystemRole, isSystemLoginRole, normalizeRole, getRoleLandingPath } from "../utils/roleAccess";
import useAccessAccounts from "../hooks/useAccessAccounts";
import AccessRightsNav from "../components/AccessRightsNav";

const EMPLOYEES_API_URL = "/api/employees.php?scope=system";

function getInitials(name) {
  if (!name) return "SYS";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function AccessRights({ defaultRole = "" }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentRole = defaultRole || searchParams.get("role") || "";

  const { accounts, isLoading, loadError, updatedAt, refresh: fetchUsers } = useAccessAccounts("system");
  const users = accounts.filter(u => isSystemLoginRole(u.role_name));
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role_name: currentRole === "hr" ? "hr" : currentRole || "admin",
  });

  const activeFilter = roleFilter || currentRole;

  const filteredUsers = users.filter((u) => {
    const keyword = searchQuery.toLowerCase();
    const systemRole = getSystemRole(u.role_name);
    const searchableText = [u.name, u.email, u.role_name, systemRole?.label].filter(Boolean).join(" ").toLowerCase();
    if (!searchableText.includes(keyword)) return false;

    if (!activeFilter) return true;

    const normRole = normalizeRole(u.role_name);
    if (activeFilter === "ga") return normRole === "ga";
    if (activeFilter === "finance") return ["finance", "finance_admin"].includes(normRole);
    if (activeFilter === "hr") return ["hr", "hrd", "hr_admin", "manager", "admin", "super_admin"].includes(normRole);
    if (activeFilter === "admin") return ["admin", "super_admin"].includes(normRole);

    return systemRole?.value === activeFilter || normRole === activeFilter;
  });

  const displayedRoleCards = currentRole === "ga" 
    ? SYSTEM_ROLES.filter(r => r.value === "ga")
    : currentRole === "finance"
    ? SYSTEM_ROLES.filter(r => r.value === "finance")
    : currentRole === "hr"
    ? SYSTEM_ROLES.filter(r => r.value === "hr" || r.value === "admin")
    : SYSTEM_ROLES;

  const getPageInfo = () => {
    if (currentRole === "ga") {
      return {
        title: "Hak Akses GA (General Affairs)",
        desc: "Kelola akun login General Affairs untuk operasional fasilitas, inventaris, dan aset kantor. Akun dapat login ke Menu GA.",
        landingPath: "/menu-ga",
        landingLabel: "Buka Menu GA",
        createDefault: "ga",
        activeNav: "ga"
      };
    }
    if (currentRole === "finance") {
      return {
        title: "Hak Akses Finance (Keuangan)",
        desc: "Kelola akun login divisi Finance & Akuntansi untuk pencatatan transaksi, faktur invoice, slip gaji, dan anggaran kas.",
        landingPath: "/dashboard-finance",
        landingLabel: "Buka Dashboard Finance",
        createDefault: "finance",
        activeNav: "finance"
      };
    }
    if (currentRole === "hr") {
      return {
        title: "Hak Akses HRD & Administrator",
        desc: "Kelola akun login HRD dan Administrator untuk pengelolaan data karyawan, absensi, cuti, serta pengaturan sistem kantor.",
        landingPath: "/dashboard",
        landingLabel: "Buka Dashboard Admin",
        createDefault: "hr",
        activeNav: "hr"
      };
    }
    return {
      title: "Hak Akses Login Kantor & Sistem",
      desc: "Kelola seluruh akun login pengguna kantor (HRD, GA, Finance, dan Admin) terpisah dari Manajemen Karyawan reguler dan modul LPK Creativa.",
      landingPath: "/dashboard",
      landingLabel: "Buka Dashboard",
      createDefault: "admin",
      activeNav: "all"
    };
  };

  const pageInfo = getPageInfo();

  const openCreateForm = (role = pageInfo.createDefault) => {
    setForm({ id: null, name: "", email: "", password: "", role_name: role });
    setErrorMessage("");
    setSuccessMessage("");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!isSystemLoginRole(form.role_name)) {
      setErrorMessage("Akun siswa dan sensei dikelola melalui LPK CREATIVA → Hak Akses LMS.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setErrorMessage("Nama dan Email wajib diisi.");
      return;
    }
    if (!form.id && !form.password.trim()) {
      setErrorMessage("Password wajib diisi untuk akun baru.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        nik: form.id ? form.nik : `SYS-${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
        role_name: normalizeRole(form.role_name),
        position_name: form.id ? form.position_name : form.role_name.toUpperCase(),
        gender: form.gender || "Laki-laki",
      };

      if (form.id) {
        await axios.put(EMPLOYEES_API_URL, payload);
      } else {
        await axios.post(EMPLOYEES_API_URL, payload);
      }

      setSuccessMessage(`Akun ${form.name.trim()} berhasil ${form.id ? 'diperbarui' : 'dibuat'}. Pengguna dapat login menggunakan email dan password akun.`);
      
      setForm({ id: null, name: "", email: "", password: "", role_name: pageInfo.createDefault });
      setIsFormOpen(false);
      setErrorMessage("");
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? "Gagal menyimpan akun.");
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
      role_name: normalizeRole(u.role_name) || "admin",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (deletingId !== null) return;
    if (!window.confirm("Yakin ingin menghapus akses akun ini?")) return;
    setDeletingId(id);
    setSuccessMessage("");
    try {
      await axios.delete(EMPLOYEES_API_URL, { params: { id } });
      setSuccessMessage("Akun berhasil dihapus.");
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal menghapus akun.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-28 relative overflow-hidden max-w-6xl mx-auto">
        <div className="px-5 pt-6">
          
          {/* Universal Hak Akses Top Navigation Tabs */}
          <AccessRightsNav activeTab={pageInfo.activeNav} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{pageInfo.title}</h1>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">{pageInfo.desc}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                onClick={() => navigate(pageInfo.landingPath)} 
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs md:text-sm font-bold text-slate-700 transition"
              >
                <ExternalLink className="h-4 w-4" /> {pageInfo.landingLabel}
              </button>
              <button 
                type="button" 
                onClick={() => openCreateForm()} 
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs md:text-sm font-bold text-white transition shadow-sm"
              >
                <Plus className="h-4 w-4" /> Tambah Akun
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>{updatedAt ? `Terakhir diperbarui ${updatedAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Bangkok" })} · ${filteredUsers.length} akun ditampilkan` : "Memuat data akun terbaru..."}</span>
            <button type="button" onClick={fetchUsers} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Perbarui Data</button>
          </div>

          {/* Role Summary Cards */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {displayedRoleCards.map(roleItem => {
              const count = users.filter(u => {
                const norm = normalizeRole(u.role_name);
                if (roleItem.value === "ga") return norm === "ga";
                if (roleItem.value === "finance") return ["finance", "finance_admin"].includes(norm);
                if (roleItem.value === "hr") return ["hr", "hrd", "hr_admin", "manager"].includes(norm);
                if (roleItem.value === "admin") return ["admin", "super_admin"].includes(norm);
                return norm === roleItem.value;
              }).length;

              return (
                <div key={roleItem.value} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold text-slate-900">{roleItem.label}</h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{count} akun</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{roleItem.description}</p>
                    <p className="mt-3 text-[11px] font-semibold text-indigo-600">Masuk ke: {roleItem.menu}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => openCreateForm(roleItem.value)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition">
                      <Plus className="h-3.5 w-3.5" /> Buat Akun
                    </button>
                    {roleItem.path && (
                      <Link to={roleItem.path} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition">
                        <span>Dashboard</span> <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {successMessage && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>}
          {(loadError || (!isFormOpen && errorMessage)) && (
            <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <span>{loadError || errorMessage}</span>
              <button type="button" onClick={fetchUsers} disabled={isLoading} className="font-bold underline disabled:opacity-50">Coba lagi</button>
            </div>
          )}
        </div>
        
        {/* Search & Filter */}
        <div className="px-5 pt-6 pb-2 flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                aria-label="Cari akun"
                placeholder="Cari nama, email, atau role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white border border-slate-200 shadow-sm rounded-2xl pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all"
              />
           </div>
           {!currentRole && (
             <select aria-label="Filter role akun" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
               <option value="">Semua Role</option>
               {SYSTEM_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
             </select>
           )}
        </div>

        {/* ── List Users ── */}
        <div className="relative z-10 px-5 py-4 flex flex-col gap-4 mt-2">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              </div>
            ) : loadError && users.length === 0 ? null : filteredUsers.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <ShieldCheck className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-[15px] font-bold text-slate-600">{searchQuery || activeFilter ? "Akun tidak ditemukan" : "Belum Ada Akun Sistem"}</p>
                 <p className="text-sm text-slate-400 mt-1">{searchQuery || activeFilter ? "Ubah pencarian atau filter role akun." : `Buat akun untuk ${pageInfo.title}.`}</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const landing = getRoleLandingPath(u.role_name);
                return (
                  <div key={u.user_id} className="bg-white rounded-3xl p-5 shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-300 transition">
                    
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-black shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                        {getInitials(u.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-bold text-slate-900 truncate">{u.name}</h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-slate-500" />
                            {u.role_name}
                          </span>
                        </div>
                        <p className="text-[12px] font-semibold text-slate-500 truncate flex items-center gap-1.5 mt-1">
                          <Mail className="w-3.5 h-3.5" /> {u.email}
                        </p>
                        {getSystemRole(u.role_name) && (
                          <p className="text-[11px] text-slate-400 mt-0.5">Tujuan login: <strong className="text-slate-600">{getSystemRole(u.role_name).menu}</strong></p>
                        )}
                        {!u.id && <p className="mt-1 text-xs text-amber-600">Akun login tanpa profil employee.</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link 
                        to={landing}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3 py-2 text-xs font-bold text-slate-600 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka Dashboard
                      </Link>

                      <button 
                        aria-label={`Edit akun ${u.name}`}
                        disabled={!u.id}
                        onClick={() => handleEdit(u)}
                        className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition active:scale-95 disabled:opacity-40"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        aria-label={`Hapus akun ${u.name}`}
                        disabled={!u.id || deletingId !== null}
                        onClick={() => handleDelete(u.id)}
                        className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
        </div>

        {/* ── Floating Action Button ── */}
        <div className="fixed bottom-6 right-0 left-0 pointer-events-none z-20 flex justify-center px-5">
          <button
            onClick={() => openCreateForm()}
            className="w-full max-w-md h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[15px] font-bold tracking-wide shadow-[0_8px_25px_rgba(79,70,229,0.4)] transition-transform hover:bg-indigo-700 active:scale-[0.98] pointer-events-auto gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Buat Akun {pageInfo.title.replace("Hak Akses ", "")}
          </button>
        </div>

        {/* ── Bottom Sheet Form ── */}
        {isFormOpen && (
          <div role="dialog" aria-modal="true" aria-labelledby="account-form-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { if (!isSaving) setIsFormOpen(false); }}></div>
             
             <div className="bg-white w-full sm:w-[450px] max-h-[90dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-3xl shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out]">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                   <h2 id="account-form-title" className="text-[18px] font-black text-slate-900">
                     {form.id ? "Edit Hak Akses" : `Buat Akun ${pageInfo.title.replace("Hak Akses ", "")}`}
                   </h2>
                   <button aria-label="Tutup form akun" disabled={isSaving} onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full disabled:opacity-50">
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

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Pilih Hak Akses</span>
                    <select
                      value={form.role_name}
                      onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                      className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] text-slate-900 font-bold outline-none transition focus:bg-white focus:border-indigo-400"
                    >
                      <option value="ga">GA (General Affairs - Menu GA)</option>
                      <option value="hr">HRD (Human Resources - Menu HRD)</option>
                      <option value="finance">Finance (Keuangan - Dashboard Finance)</option>
                      <option value="admin">Administrator (IT/Sistem - Dashboard Admin)</option>
                      <option value="super_admin">Super Admin (Akses Penuh)</option>
                    </select>
                  </label>
                  {getSystemRole(form.role_name) && (
                    <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">Setelah login, akun ini masuk ke <strong>{getSystemRole(form.role_name).menu}</strong>. {getSystemRole(form.role_name).description}</p>
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
                      placeholder="contoh: ga@perusahaan.com"
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
                        type={showPassword ? "text" : "password"}
                        required={!form.id}
                        autoComplete="new-password"
                        placeholder={form.id ? "Kosongkan jika tidak diubah" : "Password rahasia"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 pl-11 pr-12 text-[14px] font-mono font-bold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                      />
                      <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-4 text-slate-500">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

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
