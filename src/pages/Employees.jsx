import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import { Plus, X, Search, Edit2, Trash2, Shield, Mail, Briefcase, FileDown, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const EMPLOYEES_API_URL   = "/api/employees.php";
const DEPARTMENTS_API_URL = "/api/departments.php";
const POSITIONS_API_URL   = "/api/positions.php";
const PHOTO_UPLOAD_URL    = "/api/upload_photo.php";
const PHOTO_BASE_URL      = "/uploads/photos/";
const ITEMS_PER_PAGE = 10;

function normalizeEmployeesResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getInitials(name) {
  if (!name) return "HR";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function getAvatarClass(name) {
  const palettes = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-purple-100 text-purple-700 border-purple-200",
  ];
  const index = (name ?? "").split("").reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export default function Employees() {
  const navigate = useNavigate();
  const user = getUser();
  const canExport = user && ["super_admin", "manager", "hr", "admin"].includes(user.role_name);

  const [employees,   setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions,   setPositions]   = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm] = useState({
    id: null, nik: "", name: "", email: "", password: "",
    role_name: "karyawan", phone: "", department_id: "",
    position_name: "", gender: "Laki-laki", join_date: "", base_salary: 0
  });

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEES_API_URL);
      setEmployees(normalizeEmployeesResponse(res.data));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Data employee gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [deptRes, posRes] = await Promise.all([
        axios.get(DEPARTMENTS_API_URL),
        axios.get(POSITIONS_API_URL),
      ]);
      setDepartments(deptRes.data?.data ?? []);
      setPositions(posRes.data?.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchMeta();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const role = (emp.role_name || "karyawan").toLowerCase();
    if (role !== "karyawan" && role !== "employee") return false;

    const keyword = searchQuery.toLowerCase();
    const searchableText = [
      emp.nik, emp.name, emp.email, emp.department, emp.position,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchableText.includes(keyword);
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSubmit = async () => {
    if (!form.nik || !form.name || !form.email) {
      setErrorMessage("NIK, nama, dan email wajib diisi.");
      return;
    }

    try {
      let employeeId = form.id;
      if (form.id) {
        await axios.put(EMPLOYEES_API_URL, form);
      } else {
        await axios.post(EMPLOYEES_API_URL, form);
        const empRes = await axios.get(EMPLOYEES_API_URL);
        const allEmps = empRes.data?.data || empRes.data || [];
        const newEmp = allEmps.find((e) => e.nik === form.nik);
        if (newEmp) employeeId = newEmp.id;
      }

      let photoUploaded = false;
      if (photoFile && employeeId) {
        const formData = new FormData();
        formData.append("employee_id", employeeId);
        formData.append("photo", photoFile);
        await axios.post(PHOTO_UPLOAD_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photoUploaded = true;
      }

      alert(`Data berhasil ${form.id ? 'diupdate' : 'ditambahkan'}!`);
      setForm({
        id: null, nik: "", name: "", email: "", password: "",
        role_name: "karyawan", phone: "", department_id: "",
        position_name: "", gender: "Laki-laki", join_date: "", base_salary: 0
      });
      setPhotoFile(null);
      setIsFormOpen(false);
      setErrorMessage("");
      setCurrentPage(1);
      fetchEmployees();
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? "Data employee gagal disimpan.");
    }
  };

  const openEdit = (emp) => {
    setForm({
      id: emp.id,
      nik: emp.nik || "",
      name: emp.name || "",
      email: emp.email || "",
      password: "", // edit pass opsional
      role_name: emp.role_name || "karyawan",
      department_id: emp.department_id || "",
      position_name: emp.position_name || "",
      gender: emp.gender || "Laki-laki",
      phone: emp.phone || "",
      base_salary: emp.base_salary || 0
    });setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data karyawan ini?")) return;
    try {
      await axios.delete(`${EMPLOYEES_API_URL}?id=${id}`);
      fetchEmployees();
    } catch (error) {
      alert("Gagal menghapus employee.");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredEmployees.map((emp) => ({
      NIK: emp.nik, Nama: emp.name, Email: emp.email, 
      Phone: emp.phone || "-", Department: emp.department || "-", 
      Posisi: emp.position || "-", "Join Date": emp.join_date || "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, `Data_Karyawan.xlsx`);
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">
        
        {/* ── Background Gradient Hero ── */}
        <div className="absolute top-0 left-0 right-0 h-[260px] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-b-[2.5rem] shadow-lg">
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-b-[2.5rem]">
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* ── Top Navigation ── */}
        <div className="relative z-10 px-5 pt-8 pb-2 flex justify-between items-center">
           <button 
             onClick={() => navigate(-1)}
             className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition active:scale-95"
           >
             <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
           </button>
           <h1 className="text-white text-[17px] font-black tracking-wide">Data Master</h1>
           
           {canExport ? (
             <button
                onClick={handleExportExcel}
                className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition active:scale-95"
             >
                <FileDown className="w-5 h-5" strokeWidth={2.5} />
             </button>
           ) : <div className="w-10 h-10"></div>}
        </div>

        {/* ── Hero Title ── */}
        <div className="relative z-10 px-6 pt-4 pb-8">
           <p className="text-white/80 text-[12px] font-bold uppercase tracking-[0.2em] mb-1">Direktori Staf</p>
           <h2 className="text-[26px] font-black text-white leading-tight">
             Kelola Karyawan<br/>Perusahaan
           </h2>

           {/* Search Bar */}
           <div className="relative mt-6">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-blue-900/40" />
              </div>
              <input
                type="text"
                placeholder="Cari NIK, Nama, atau Email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[3.25rem] bg-white/95 backdrop-blur-md shadow-lg rounded-[1.25rem] pl-12 pr-4 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-400/30 transition-all border-0"
              />
           </div>
        </div>

        {/* ── Directory List ── */}
        <div className="relative z-10 px-5 pt-2 flex flex-col gap-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              </div>
            ) : paginatedEmployees.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Search className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-[15px] font-bold text-slate-600">Karyawan tidak ditemukan</p>
              </div>
            ) : (
              paginatedEmployees.map((emp) => (
                <div key={emp.id} className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {emp.photo ? (
                      <img
                        src={`${PHOTO_BASE_URL}${emp.photo}`}
                        alt={emp.name}
                        className="w-16 h-16 rounded-[1rem] object-cover shadow-sm border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-[1rem] flex items-center justify-center text-[18px] font-black shrink-0 border ${getAvatarClass(emp.name)} shadow-sm`}>
                        {getInitials(emp.name)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-black text-slate-800 truncate">{emp.name}</h3>
                      <p className="text-[13px] font-bold text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5" /> {emp.position || "Staff"}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 font-mono mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded-md">
                        ID: {emp.nik}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => openEdit(emp)}
                        className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition active:scale-95"
                      >
                        <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                     <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl max-w-[60%] border border-slate-100">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-500 truncate">{emp.email}</span>
                     </div>
                     <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{emp.role_name || "karyawan"}</span>
                     </div>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Pill */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-2 mb-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 disabled:opacity-40 active:bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-6 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-[13px] font-black shadow-lg">
                  {safeCurrentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 disabled:opacity-40 active:bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            )}
        </div>

        {/* ── Floating Action Button (FAB) ── */}
        <div className="fixed bottom-6 right-0 left-0 pointer-events-none z-40 flex justify-center px-5">
          <button
            onClick={() => {
              setForm({
                id: null, nik: "", name: "", email: "", password: "",
                role_name: "karyawan", phone: "", department_id: "",
                position_name: "", gender: "Laki-laki", join_date: "",
              });
              setIsFormOpen(true);
            }}
            className="w-full max-w-md h-[3.5rem] bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-[15px] font-black tracking-wide shadow-[0_8px_25px_rgba(37,99,235,0.4)] transition-transform hover:bg-blue-700 active:scale-[0.98] pointer-events-auto gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Tambah Karyawan
          </button>
        </div>

        {/* ── Bottom Sheet Form ── */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
             
             <div className="bg-white w-full sm:w-[500px] max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out]">
                <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-5 border-b border-slate-100 flex items-center justify-between z-20 rounded-t-[2.5rem]">
                   <h2 className="text-[18px] font-black text-slate-900">
                     {form.id ? "Edit Data Karyawan" : "Karyawan Baru"}
                   </h2>
                   <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 flex flex-col gap-5">
                  {errorMessage && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600 text-center">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">NIK Staf</span>
                      <input required placeholder="Ketik NIK..." value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</span>
                      <input required placeholder="Nama lengkap..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Email Utama</span>
                      <input required type="email" placeholder="email@perusahaan.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Password</span>
                      <input type="text" placeholder={form.id ? "(Kosongkan jika tetap)" : "Password login"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Jenis Kelamin</span>
                      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Jabatan</span>
                      <select required value={form.position_name} onChange={(e) => setForm({ ...form, position_name: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        <option value="">-- Pilih Jabatan --</option>
                        {positions.map((pos) => (
                          <option key={pos.id} value={pos.name}>{pos.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block col-span-2">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Gaji Pokok Individu (Opsional)</span>
                      <input type="number" placeholder="Contoh: 5000000" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Biarkan kosong (0) untuk menggunakan standar gaji jabatan: <span className="font-bold text-blue-600">Rp {Number(positions.find(p => p.name === form.position_name)?.base_salary || 0).toLocaleString("id-ID")}</span>.
                      </span>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Foto Profil</span>
                    <div className="h-14 w-full rounded-2xl bg-slate-50 border border-slate-200 flex items-center px-2 overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition">
                      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full text-[13px] text-slate-500 file:mr-3 file:h-10 file:border-0 file:rounded-xl file:bg-blue-100 file:px-4 file:text-[13px] file:font-black file:text-blue-600 hover:file:bg-blue-200 cursor-pointer" />
                    </div>
                  </label>

                  <button type="submit" className="mt-2 w-full h-14 bg-blue-600 text-white rounded-[1.5rem] text-[15px] font-black tracking-wide shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition active:scale-[0.98]">
                    {form.id ? "Simpan Perubahan" : "Simpan Karyawan Baru"}
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
