import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Plus, X, Search, Edit2, Trash2, ShieldCheck, Mail, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EMPLOYEES_API_URL = "/api/employees.php";

function getInitials(name) {
  if (!name) return "SYS";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function AccessRights() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role_name: "admin",
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get(EMPLOYEES_API_URL);
      const allData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Filter out 'karyawan' and 'employee'
      const systemUsers = allData.filter(u => {
        const r = (u.role_name || "").toLowerCase();
        return r && r !== "karyawan" && r !== "employee";
      });
      setUsers(systemUsers);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Gagal memuat data hak akses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const keyword = searchQuery.toLowerCase();
    const searchableText = [u.name, u.email, u.role_name].filter(Boolean).join(" ").toLowerCase();
    return searchableText.includes(keyword);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setErrorMessage("Nama dan Email wajib diisi.");
      return;
    }

    try {
      // Auto generate missing fields to satisfy the backend employees.php requirements
      const payload = {
        ...form,
        nik: form.id ? form.nik : `SYS-${Math.floor(Math.random() * 10000)}`,
        position_name: form.role_name.toUpperCase(),
        gender: "Laki-laki",
      };

      if (form.id) {
        await axios.put(EMPLOYEES_API_URL, payload);
      } else {
        await axios.post(EMPLOYEES_API_URL, payload);
      }

      alert(`Akun ${form.role_name.toUpperCase()} berhasil ${form.id ? 'diupdate' : 'dibuat'}!`);
      
      setForm({ id: null, name: "", email: "", password: "", role_name: "admin" });
      setIsFormOpen(false);
      setErrorMessage("");
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? "Gagal menyimpan akun.");
    }
  };

  const handleEdit = (u) => {
    setForm({
      id: u.id,
      nik: u.nik,
      name: u.name,
      email: u.email,
      password: "", 
      role_name: u.role_name || "admin",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus akses akun ini?")) return;
    
    try {
      await axios.delete(`${EMPLOYEES_API_URL}?id=${id}`);
      fetchUsers();
    } catch (error) {
      alert("Gagal menghapus akun.");
    }
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">
        
        {/* ── Background Gradient Hero ── */}
        <div className="absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 rounded-b-[2.5rem] shadow-lg">
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-b-[2.5rem]">
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* ── Top Navigation ── */}
        <div className="relative z-10 px-5 pt-8 pb-4">
           <div className="flex items-center justify-between mb-6">
             <button 
               onClick={() => navigate("/menu-admin")}
               className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition active:scale-95"
             >
               <X className="w-6 h-6" strokeWidth={2.5} />
             </button>
             <h1 className="text-[17px] font-black text-white tracking-wide">Hak Akses</h1>
             <div className="w-10 h-10"></div>
           </div>

           {/* Search Bar */}
           <div className="relative mt-2">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-white/50" />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl pl-11 pr-4 text-sm font-medium text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all"
              />
           </div>
        </div>

        {/* ── List Users ── */}
        <div className="relative z-10 px-5 py-4 flex flex-col gap-4 mt-2">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <ShieldCheck className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-[15px] font-bold text-slate-600">Belum Ada Akun Sistem</p>
                 <p className="text-sm text-slate-400 mt-1">Buat akun untuk HRD, Finance, atau Admin baru.</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="bg-white rounded-3xl p-5 shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 group">
                  
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-black shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                    {getInitials(u.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-900 truncate">{u.name}</h3>
                    <p className="text-[12px] font-semibold text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {u.email}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg mt-2">
                       <ShieldCheck className="w-3 h-3 text-slate-500" />
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{u.role_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => handleEdit(u)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition active:scale-95"
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
              setForm({ id: null, name: "", email: "", password: "", role_name: "admin" });
              setIsFormOpen(true);
            }}
            className="w-full max-w-md h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[15px] font-bold tracking-wide shadow-[0_8px_25px_rgba(79,70,229,0.4)] transition-transform hover:bg-indigo-700 active:scale-[0.98] pointer-events-auto gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Buat Akun Baru
          </button>
        </div>

        {/* ── Bottom Sheet Form ── */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
             
             <div className="bg-white w-full sm:w-[450px] rounded-t-[2rem] sm:rounded-3xl shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out]">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                   <h2 className="text-[18px] font-black text-slate-900">
                     {form.id ? "Edit Hak Akses" : "Buat Akun Sistem"}
                   </h2>
                   <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
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
                      <option value="admin">Administrator (IT/Sistem)</option>
                      <option value="hr">HRD (Human Resources)</option>
                      <option value="finance">Finance (Keuangan)</option>
                      <option value="ga">Gen. Affair</option>
                      <option value="super_admin">Super Admin (Akses Penuh)</option>
                    </select>
                  </label>

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
                      placeholder="hrd@perusahaan.com"
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
                        type="text"
                        placeholder={form.id ? "Kosongkan jika tidak diubah" : "Password rahasia"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 pl-11 pr-4 text-[14px] font-mono font-bold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-[15px] font-black tracking-wide shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition active:scale-[0.98]"
                  >
                    Simpan Akun
                  </button>
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
