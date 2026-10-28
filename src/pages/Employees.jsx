import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import { Plus, X, Search, Edit2, Trash2, Shield, Mail, Briefcase, FileDown, ChevronLeft, ChevronRight, Users, UserCheck, UserPlus, Calendar, ChevronDown, Filter, ArrowUpDown, Eye, Phone, MapPin, CreditCard, Heart, User as UserIcon, Loader2, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeData, employeeError, employeeForm } from "../utils/employeeApi";
import { canManageLoginAccess, normalizeRole } from "../utils/roleAccess";
import { useSEO } from "../hooks/useSEO";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

import { PHOTO_BASE_URL } from "../services/api";

const EMPLOYEES_API_URL   = "/api/employees.php";
const PHOTO_UPLOAD_URL    = "/api/upload_photo.php";
const PAGE_SIZE_OPTIONS = [8, 10, 20, 50];

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
  const canExport = user && ["super_admin", "manager", "hr", "hrd", "hr_admin", "admin"].includes(user.role_name);

  useSEO({
    title: "Direktori & Data Karyawan",
    description: "Kelola data master karyawan, jabatan, divisi, dan status kepegawaian ONE Creativa."
  });

  const [employees,   setEmployees]   = useState([]);
  const [positions,   setPositions]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [errorMessage,setErrorMessage]=useState('');
 const [listError,setListError]=useState('');const [metaError,setMetaError]=useState('');const [statsError,setStatsError]=useState('');const [viewError,setViewError]=useState('');const [successMessage,setSuccessMessage]=useState('');const [isSaving,setIsSaving]=useState(false);const [roles,setRoles]=useState([]);const [permissions,setPermissions]=useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stats,setStats]=useState(null);
  const [viewEmp, setViewEmp] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Ambil data lengkap My Profile (profile.php) setiap kali modal detail dibuka
  useEffect(() => {
    if (!viewEmp) { setViewDetail(null); return; }
    if (!viewEmp.user_id) { setViewDetail(viewEmp); return; }
    let cancelled = false;
    setViewLoading(true);setViewError('');
    axios.get("/api/profile.php", { params: { user_id: viewEmp.user_id, _t: Date.now() } })
      .then((res) => {
        if (cancelled) return;
        if(res.data?.status!=='success'||!res.data.data)throw new Error('Detail profil tidak valid.');const d=res.data.data;
        setViewDetail({ ...viewEmp, ...d, photo: d.photo_url || viewEmp.photo, position_name: d.position || viewEmp.position_name });
      })
      .catch(e=>{if(!cancelled){setViewDetail(viewEmp);setViewError(employeeError(e,'Detail gagal dimuat.'));}})
      .finally(() => { if (!cancelled) setViewLoading(false); });
    return () => { cancelled = true; };
  }, [viewEmp]);
  const [photoFile, setPhotoFile] = useState(null);
  const [form,setForm]=useState(employeeForm);
  const [managers,setManagers]=useState([]);
 const fetchEmployees=async()=>{setIsLoading(true);try{const r=await axios.get(EMPLOYEES_API_URL);setEmployees(employeeData(r.data));setListError('');}catch(e){setListError(employeeError(e,'Data employee gagal dimuat.'));}finally{setIsLoading(false);}};
 const fetchMeta=async()=>{const [m,t]=await Promise.allSettled([axios.get(EMPLOYEES_API_URL,{params:{view:'meta'}}),axios.get('/api/employee_stats.php')]);try{if(m.status==='rejected')throw m.reason;if(m.value.data?.status!=='success')throw new Error('Master gagal dimuat.');const d=m.value.data.data;setDepartments(employeeData({status:'success',data:d.departments}));setPositions(employeeData({status:'success',data:d.positions}));setManagers(d.managers||[]);setRoles(employeeData({status:'success',data:d.roles}));setPermissions(d.permissions);setMetaError('');}catch(e){setMetaError(employeeError(e,'Master employee gagal dimuat.'));}if(t.status==='fulfilled'&&t.value.data?.status==='success'){setStats(t.value.data.data);setStatsError('');}else{setStats(null);setStatsError(employeeError(t.reason||new Error('Statistik tidak tersedia.'),'Statistik gagal dimuat.'));}};
  useEffect(() => {
    fetchEmployees();
    fetchMeta();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept && (emp.department_name || emp.department) !== selectedDept) return false;
    if (selectedWorkType && (emp.work_type || "WFO") !== selectedWorkType) return false;
    if (selectedRole) {
      const roleStr = normalizeRole(emp.role_name);
      if (selectedRole === "karyawan") {
        if (!["karyawan", "employee", "staff"].includes(roleStr)) return false;
      } else if (selectedRole === "super_admin") {
        if (!["super_admin", "admin"].includes(roleStr)) return false;
      } else if (selectedRole === "hr") {
        if (!["hr", "hrd", "hr_admin", "manager"].includes(roleStr)) return false;
      } else if (selectedRole === "ga") {
        if (roleStr !== "ga") return false;
      } else if (selectedRole === "finance") {
        if (!["finance", "finance_admin"].includes(roleStr)) return false;
      } else if (selectedRole === "sensei") {
        if (!["sensei", "sensei_intensif"].includes(roleStr)) return false;
      } else if (selectedRole === "peserta_intensif") {
        if (!roleStr.startsWith("peserta_")) return false;
      } else if (roleStr !== selectedRole) {
        return false;
      }
    }

    const keyword = searchQuery.toLowerCase();
    const searchableText = [
      emp.nik, emp.name, emp.email, emp.department, emp.position,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchableText.includes(keyword);
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(pageStart, pageStart + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSubmit=async()=>{if(isSaving||metaError)return;if(!form.nik||!form.name||!form.email){setErrorMessage('NIK, nama, dan email wajib diisi.');return;}setIsSaving(true);setErrorMessage('');let persisted=false;try{const r=await axios[form.id?'put':'post'](EMPLOYEES_API_URL,form);if(r.data?.status!=='success'||!r.data.data?.id)throw new Error(r.data?.message||'Employee gagal disimpan.');const id=r.data.data.id;persisted=true;setForm(current=>({...current,id,password:''}));if(photoFile){const body=new FormData();body.append('employee_id',id);body.append('photo',photoFile);const photo=await axios.post(PHOTO_UPLOAD_URL,body);if(photo.data?.status!=='success')throw new Error('Foto gagal diunggah.');}setSuccessMessage('Employee berhasil disimpan.');setForm(employeeForm());setPhotoFile(null);setIsFormOpen(false);setCurrentPage(1);void fetchEmployees();void fetchMeta();}catch(e){setErrorMessage((persisted?'Employee tersimpan; foto belum berhasil. Retry memakai employee yang sama. ':'')+employeeError(e,'Data employee gagal disimpan.'));if(persisted)void fetchEmployees();}finally{setIsSaving(false);}};
  const handleRelink = async (emp) => {
    const isFaizal = (emp.nik === '2260005' || (emp.name && emp.name.toLowerCase().includes('faizal')));
    const defaultEmail = isFaizal ? 'muhammadfaizal.mf10@gmail.com' : (emp.email || '');
    let targetEmail = (prompt(`Masukkan email akun login (Role Karyawan) untuk "${emp.name}":`, defaultEmail) || '').trim();
    if (!targetEmail) return;

    if (!window.confirm(`Hubungkan karyawan "${emp.name}" (${emp.nik}) ke akun login:\nEmail: ${targetEmail}\nRole: Karyawan?`)) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      const res = await axios.post(`${EMPLOYEES_API_URL}?action=relink`, {
        employee_id: emp.id,
        email: targetEmail
      });
      setSuccessMessage(res.data?.message || 'Relasi akun karyawan berhasil dipulihkan!');
      void fetchEmployees();
      void fetchMeta();
    } catch (err) {
      setErrorMessage(employeeError(err, 'Gagal memulihkan relasi akun.'));
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = emp => {
    setForm(employeeForm(emp));
    setErrorMessage('');
    setPhotoFile(null);
    setIsFormOpen(true);
  };
  const handleDelete=async(id)=>{
    const emp=employees.find(e=>e.id===id);
    if(!emp)return;
    if(!window.confirm(`HAPUS PERMANEN Karyawan "${emp.name}"?\n\nPERINGATAN: Seluruh data karyawan dan akun login akan dihapus total dari database secara permanen.`))return;
    try{
      setIsSaving(true);
      setErrorMessage('');
      const res=await axios.delete(EMPLOYEES_API_URL,{params:{id,action:'delete'}});
      setSuccessMessage(res.data?.message||`Karyawan "${emp.name}" berhasil dihapus permanen.`);
      void fetchEmployees();
      void fetchMeta();
    }catch(e){
      setErrorMessage(employeeError(e,'Gagal menghapus karyawan.'));
    }finally{
      setIsSaving(false);
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
    <Layout hideMobileHeader={true} hideBottomNav={false}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-12">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
{(listError||metaError||statsError)&&<div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">{[listError,metaError,statsError].filter(Boolean).map(m=><p key={m}>{m}</p>)}<button type="button" onClick={()=>{void fetchEmployees();void fetchMeta();}} className="mt-2 font-bold underline">Coba lagi</button></div>}{successMessage&&<p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{successMessage}</p>}

          {/* HERO BANNER dengan Efek "3D" */}
          <div className="relative w-full h-[160px] sm:h-[200px] rounded-[2rem] overflow-hidden shadow-lg bg-[#eef2ff] flex items-center border border-blue-100">
            {/* Latar Belakang Gambar */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'right 30%',
              }}
            />
            {/* Gradient Overlay dari biru ke transparan */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8]/95 to-transparent"></div>

            <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center px-8 md:px-12">
              <div className="max-w-xl text-white">
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight drop-shadow-md">Manage Employees</h1>
                <p className="text-blue-100 text-[14px] md:text-[15px] font-medium leading-relaxed drop-shadow-sm">Kelola data karyawan, status kerja, dan informasi kontak.</p>
                {canManageLoginAccess(user?.role_name) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => navigate("/access-rights-ga")} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs md:text-sm font-bold text-white hover:bg-white/25 transition backdrop-blur-sm">
                      <Shield className="h-4 w-4" /> Hak Akses GA
                    </button>
                    <button type="button" onClick={() => navigate("/access-rights-hr")} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs md:text-sm font-bold text-white hover:bg-white/25 transition backdrop-blur-sm">
                      <Shield className="h-4 w-4" /> Hak Akses HRD & Admin
                    </button>
                    <button type="button" onClick={() => navigate("/access-rights-finance")} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs md:text-sm font-bold text-white hover:bg-white/25 transition backdrop-blur-sm">
                      <Shield className="h-4 w-4" /> Hak Akses Finance
                    </button>
                    <button type="button" onClick={() => navigate("/access-rights-sensei")} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs md:text-sm font-bold text-white hover:bg-white/25 transition backdrop-blur-sm">
                      <Shield className="h-4 w-4" /> Hak Akses Sensei
                    </button>
                    <button type="button" onClick={() => navigate("/access-rights-siswa")} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs md:text-sm font-bold text-white hover:bg-white/25 transition backdrop-blur-sm">
                      <Shield className="h-4 w-4" /> Hak Akses Siswa
                    </button>
                  </div>
                )}
              </div>
              <div className="hidden lg:block text-right italic text-blue-100 text-sm max-w-xs border-r border-blue-400/30 pr-6 drop-shadow-sm">
                "SDM unggul untuk masa depan yang lebih baik"
              </div>
            </div>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Total Karyawan", val: stats?.total, inc: "Seluruh data", icon: Users, color: "blue", statColor: "text-blue-500" },
              { label: "Aktif Hari Ini", val: stats?.active_today, inc: "Absensi hari ini", icon: UserCheck, color: "emerald", statColor: "text-emerald-500" },
              { label: "Karyawan Baru", val: stats?.new_employees, inc: "Bulan ini", icon: UserPlus, color: "purple", statColor: "text-purple-500" },
              { label: "Sedang Cuti", val: stats?.on_leave, inc: "Saat ini", icon: Calendar, color: "orange", statColor: "text-orange-500" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-800 mb-2">{stat.val ?? '?'}</h3>
                  <p className={`text-[11px] font-bold ${stat.statColor}`}>{stat.inc}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500`}>
                  <stat.icon className="w-7 h-7" strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIK, email, atau posisi..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <button className="h-11 px-4 flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-100 transition whitespace-nowrap">
                <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button className="h-11 px-4 flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-100 transition whitespace-nowrap">
                <ArrowUpDown className="w-4 h-4" /> Urutkan <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="h-11 px-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[13px] outline-none"
              >
                <option value="">Semua Departemen</option>
                {departments.map((d, i) => (
                  <option key={i} value={d.name}>{d.name}</option>
                ))}
              </select>
              <select
                value={selectedWorkType}
                onChange={(e) => { setSelectedWorkType(e.target.value); setCurrentPage(1); }}
                className="h-11 px-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[13px] outline-none"
              >
                <option value="">Semua Tipe Kerja</option>
                <option value="WFO">WFO</option>
                <option value="WFH">WFH</option>

              </select>
              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                className="h-11 px-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[13px] outline-none"
              >
                <option value="">Semua Role / Akses</option>
                <option value="karyawan">Karyawan Saja</option>
                <option value="ga">GA (General Affairs)</option>
                <option value="hr">HRD & Admin</option>
                <option value="finance">Finance</option>
                <option value="sensei">Sensei</option>
                <option value="peserta_intensif">Siswa LMS</option>
              </select>

              {canExport && (
                <button onClick={handleExportExcel} className="h-11 px-4 flex items-center gap-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-[13px] hover:bg-blue-100 transition whitespace-nowrap">
                  <FileDown className="w-4 h-4" /> Export
                </button>
              )}
              <button onClick={() => {
                  setForm(employeeForm());setPhotoFile(null);setErrorMessage('');
                  setIsFormOpen(true);
                }}
                disabled={!permissions.can_write||!!metaError||isLoading} className="disabled:opacity-50 h-11 px-5 flex items-center gap-2 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 transition shadow-sm whitespace-nowrap">
                <Plus className="w-4 h-4" strokeWidth={3} /> Tambah Karyawan
              </button>
            </div>
          </div>

          {/* TABLE & MOBILE CARDS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {/* MOBILE CARDS (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-12 text-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div></div>
              ) : paginatedEmployees.length === 0 ? (
                <div className="py-12 text-center font-bold text-slate-500">{listError ? 'Daftar gagal dimuat. Gunakan Coba lagi.' : 'Tidak ada data karyawan sesuai filter'}</div>
              ) : (
                paginatedEmployees.map(emp => (
                  <div key={emp.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0 w-12 h-12">
                          <div className={`absolute inset-0 rounded-xl flex items-center justify-center text-[14px] font-black border ${getAvatarClass(emp.name)}`}>
                            {getInitials(emp.name)}
                          </div>
                          {emp.photo && <img src={`${PHOTO_BASE_URL}${emp.photo}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="" className="absolute inset-0 w-full h-full rounded-xl object-cover bg-transparent" />}
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-slate-800">{emp.name}</p>
                          <p className="text-[12px] font-semibold text-slate-400">{emp.nik}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(emp)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"><Edit2 className="w-4 h-4" /></button>
                        <button title="Hapus karyawan permanen" aria-label="Hapus karyawan permanen" onClick={() => handleDelete(emp.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Jabatan & Dept</p>
                        <p className="text-[12px] font-bold text-slate-700">{emp.position_name || emp.position || "Staff"}</p>
                        <p className="text-[11px] font-semibold text-slate-500">{emp.department_name || emp.department || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Kontak</p>
                        <p className="text-[11px] font-bold text-slate-700 truncate">{emp.phone || "-"}</p>
                        <p className="text-[11px] font-semibold text-slate-500 truncate">{emp.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          emp.role_name === 'Kontrak' ? 'bg-blue-100 text-blue-700' :
                          emp.role_name === 'Magang' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {emp.role_name || 'Role belum terhubung'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Kerja</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          emp.work_type === 'WFH' ? 'bg-purple-100 text-purple-700' :
                          emp.work_type === 'Hybrid' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {emp.work_type || 'WFO'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Jabatan</th>
                    <th className="px-6 py-4">Departemen</th>
                    <th className="px-6 py-4">ID Karyawan</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4 text-center">Role Akun</th>
                    <th className="px-6 py-4 text-center">Tipe Kerja</th>
                    <th className="px-6 py-4">Status Aktif</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr><td colSpan="9" className="py-12 text-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div></td></tr>
                  ) : paginatedEmployees.length === 0 ? (
                    <tr><td colSpan="9" className="py-12 text-center font-bold text-slate-500">{listError ? 'Daftar gagal dimuat. Gunakan Coba lagi.' : 'Tidak ada data karyawan sesuai filter'}</td></tr>
                  ) : (
                    paginatedEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0 w-10 h-10">
                              <div className={`absolute inset-0 rounded-xl flex items-center justify-center text-[12px] font-black border ${getAvatarClass(emp.name)}`}>
                                {getInitials(emp.name)}
                              </div>
                              {emp.photo && <img src={`${PHOTO_BASE_URL}${emp.photo}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="" className="absolute inset-0 w-full h-full rounded-xl object-cover bg-transparent" />}
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-slate-800">{emp.name}</p>
                              <p className="text-[11px] font-semibold text-slate-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] font-bold text-slate-600">{emp.position_name || emp.position || "Staff"}</td>
                        <td className="px-6 py-4 text-[13px] font-bold text-slate-600">{emp.department_name || emp.department || "-"}</td>
                        <td className="px-6 py-4 text-[12px] font-bold text-slate-500">{emp.nik}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {emp.phone || "-"}</span>
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {emp.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            emp.role_name === 'Kontrak' ? 'bg-blue-50 text-blue-600' :
                            emp.role_name === 'Magang' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {emp.role_name || 'Role belum terhubung'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            emp.work_type === 'WFH' ? 'bg-purple-50 text-purple-600' :
                            emp.work_type === 'Hybrid' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {emp.work_type || 'WFO'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {Number(emp.account_missing) ? (
                            <button
                              type="button"
                              onClick={() => handleRelink(emp)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition shadow-sm"
                              title="Klik untuk memulihkan relasi akun karyawan ini"
                            >
                              <Link2 className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                              <span>Relasi akun putus (Pulihkan)</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${emp.is_active == 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              <span className={`text-[12px] font-bold ${emp.is_active == 1 ? 'text-slate-700' : 'text-rose-600'}`}>{emp.is_active == 1 ? 'Aktif' : 'Inaktif'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewEmp(emp)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openEdit(emp)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button title="Hapus karyawan permanen" aria-label="Hapus karyawan permanen" onClick={() => handleDelete(emp.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 md:px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-[11px] md:text-[12px] font-bold text-slate-500 text-center md:text-left w-full md:w-auto">
                Menampilkan {filteredEmployees.length === 0 ? 0 : ((safeCurrentPage - 1) * itemsPerPage) + 1} - {Math.min(safeCurrentPage * itemsPerPage, filteredEmployees.length)} dari {filteredEmployees.length} karyawan
              </span>

              <div className="flex flex-wrap justify-center items-center gap-3">
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-[11px] font-bold outline-none">
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size} per halaman</option>
                  ))}
                </select>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1) {
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] font-black ${safeCurrentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {page}
                          </button>
                        );
                      }
                      if (Math.abs(page - safeCurrentPage) === 2) return <span key={page} className="px-1 text-slate-400">...</span>;
                      return null;
                    })}
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  {(errorMessage||metaError) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600 text-center">
                      {errorMessage||metaError}
                    </div>
                  )}

                  {/* 1. NIK Staf & Nama Lengkap */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">NIK Staf</span>
                      <input required maxLength={20} placeholder="Contoh: 2260005" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</span>
                      <input required placeholder="Nama lengkap..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                  </div>

                  {/* 2. Email Utama & Password Login */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Email Utama (Login Dashboard Karyawan)</span>
                      <input required type="email" placeholder="karyawan@onecreativa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Password (Untuk Login)</span>
                      <input type="password" autoComplete="new-password" minLength={8} maxLength={72} required={!form.id} placeholder={form.id ? "(Kosongkan jika tetap)" : "Minimal 8 karakter"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                      {form.id && <span className="text-[10px] text-slate-400 mt-1 block">Kosongkan bila tidak ingin mengubah password</span>}
                    </label>
                  </div>

                  {/* 3. Jenis Kelamin & Sistem Kerja */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Jenis Kelamin</span>
                      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Sistem Kerja</span>
                      <select value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        <option value="WFO">WFO (Work From Office)</option>
                        <option value="WFH">WFH (Work From Home)</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </label>
                  </div>

                  {/* 4. Status Karyawan & Role Akun */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Status Karyawan</span>
                      <select value={form.is_active} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        <option value={1}>Aktif</option>
                        <option value={0}>Inaktif</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Role Akun</span>
                      <select value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        {!roles.some(r => r.name === form.role_name) && form.role_name && (
                          <option value={form.role_name}>{form.role_name}</option>
                        )}
                        {roles.map((r) => (
                          <option key={r.name} value={r.name}>{r.label || r.name} ({r.name})</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* 5. Departemen & Jabatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Departemen</span>
                      <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400">
                        <option value="">-- Pilih Departemen --</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
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
                  </div>

                  {/* 6. Gaji Pokok */}
                  <div className="grid grid-cols-1 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Gaji Pokok Individu</span>
                      <input type="number" min="0" step="0.01" placeholder="Contoh: 5000000" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-blue-400" />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Biarkan kosong (0) untuk menggunakan standar gaji jabatan: <span className="font-bold text-blue-600">Rp {Number(positions.find(p => p.name === form.position_name)?.base_salary || 0).toLocaleString("id-ID")}</span>.
                      </span>
                    </label>
                  </div>

                  {/* 7. Foto Profil */}
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Foto Profil</span>
                    <div className="h-14 w-full rounded-2xl bg-slate-50 border border-slate-200 flex items-center px-2 overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition">
                      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full text-[13px] text-slate-500 file:mr-3 file:h-10 file:border-0 file:rounded-xl file:bg-blue-100 file:px-4 file:text-[13px] file:font-black file:text-blue-600 hover:file:bg-blue-200 cursor-pointer" />
                    </div>
                  </label>

                  {/* Informasi Tambahan (Opsional) */}
                  <details className="group border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                    <summary className="text-[12px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer flex items-center justify-between">
                      <span>Informasi Tambahan (Telepon, Tanggal, Manager)</span>
                      <ChevronDown className="w-4 h-4 transition group-open:rotate-180" />
                    </summary>
                    <div className="pt-4 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-bold uppercase text-slate-400">Telepon</span>
                          <input value={form.phone} maxLength={20} placeholder="08xxxxxxxxxx" onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm bg-white" />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-bold uppercase text-slate-400">Manager</span>
                          <select value={form.manager_employee_id} onChange={e => setForm({ ...form, manager_employee_id: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                            <option value="">Belum ditentukan</option>
                            {managers.filter(m => Number(m.id) !== Number(form.id)).map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-bold uppercase text-slate-400">Tanggal Bergabung</span>
                          <input type="date" value={form.join_date} onChange={e => setForm({ ...form, join_date: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm bg-white" />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-bold uppercase text-slate-400">Tanggal Lahir</span>
                          <input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm bg-white" />
                        </label>
                      </div>
                    </div>
                  </details>

                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={isSaving||!!metaError||!permissions.can_write} className="disabled:opacity-50 w-full sm:w-auto sm:min-w-[200px] h-14 bg-blue-600 text-white rounded-[1.5rem] text-[15px] font-black tracking-wide shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition active:scale-[0.98]">
                    {isSaving ? "Menyimpan?" : form.id ? "Simpan Perubahan" : "Simpan Karyawan Baru"}
                  </button>
                </div>
                </form>
             </div>
          </div>
        )}
        {/* ✨ View Detail Modal (data lengkap dari My Profile) ✨ */}
        {viewEmp && (() => {
          const d = viewDetail || viewEmp;
          const fmtDate = (v) => {
            if (!v) return "-";
            const dt = new Date(String(v).replace(" ", "T"));
            return isNaN(dt) ? v : dt.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
          };
          const genderLabel = (g) => ({ male: "Laki-laki", female: "Perempuan", "laki-laki": "Laki-laki", perempuan: "Perempuan" }[String(g || "").toLowerCase()] || g || "-");
          const sections = [
            { title: "Personal Info", icon: UserIcon, color: "bg-blue-100 text-blue-600", items: [
              ["Nama Lengkap", d.name], ["NIK / ID", d.nik], ["Tempat Lahir", d.birth_place], ["Tanggal Lahir", fmtDate(d.birth_date)],
              ["Jenis Kelamin", genderLabel(d.gender)], ["Agama", d.religion], ["Status Pernikahan", d.marital_status], ["Golongan Darah", d.blood_type],
            ]},
            { title: "Employment Info", icon: Briefcase, color: "bg-emerald-100 text-emerald-600", items: [
              ["Jabatan", d.position_name || d.position], ["Departemen", d.department], ["Tipe Kerja", d.work_type],
              ["Status", d.is_active == 1 ? "Aktif" : "Inaktif"], ["Tanggal Bergabung", fmtDate(d.join_date)], ["Role", d.role_name],
            ]},
            { title: "Contact & Address", icon: MapPin, color: "bg-amber-100 text-amber-600", items: [
              ["Email", d.email], ["No. Telepon", d.phone], ["Kota", d.city], ["Alamat", d.address, true],
            ]},
            { title: "Kontak Darurat", icon: Heart, color: "bg-rose-100 text-rose-600", items: [
              ["Nama", d.emergency_name], ["Hubungan", d.emergency_relation], ["No. Telepon", d.emergency_phone],
            ]},
            { title: "Documents & Bank", icon: CreditCard, color: "bg-purple-100 text-purple-600", items: [
              ["NPWP", d.npwp], ["BPJS Ketenagakerjaan", d.bpjs_tk], ["BPJS Kesehatan", d.bpjs_kes], ["Bank", d.bank_name], ["No. Rekening", d.bank_account],
            ]},
          ];
          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewEmp(null)}></div>
             <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl relative z-10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
               <button onClick={() => setViewEmp(null)} className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white/80 text-slate-500 rounded-full hover:bg-white shadow">
                 <X className="w-4 h-4" />
               </button>

               {/* Header */}
               <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white px-6 pt-8 pb-6 flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100">
                 {d.photo ? (
                   <img src={PHOTO_BASE_URL + d.photo} alt={d.name} className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-4 ring-white" />
                 ) : (
                   <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white ${getAvatarClass(d.name)}`}>
                     {getInitials(d.name)}
                   </div>
                 )}
                 <div className="text-center sm:text-left min-w-0">
                   <h2 className="text-2xl font-black text-slate-800 leading-tight">{d.name}</h2>
                   <p className="text-sm font-semibold text-blue-600 mt-1">{d.position_name || d.position || "-"}</p>
                   <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                     <span className="text-xs font-bold px-3 py-1 bg-white text-slate-600 rounded-full border border-slate-200">{d.nik || "Tidak ada NIK"}</span>
                     <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100">{d.work_type || "WFO"}</span>
                     <span className={`text-xs font-bold px-3 py-1 rounded-full border ${d.is_active == 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                       {d.is_active == 1 ? "Aktif" : "Inaktif"}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Body */}
               <div className="overflow-y-auto p-6 space-y-5">
                 {viewError&&<p role="alert" className="p-4 text-red-700">{viewError}</p>}
{viewLoading && (
                   <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                     <Loader2 className="w-4 h-4 animate-spin" /> Memuat data profil terbaru...
                   </div>
                 )}
                 {sections.map((sec) => (
                   <div key={sec.title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                     <div className="flex items-center gap-2.5 mb-4">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sec.color}`}>
                         <sec.icon className="w-4 h-4" />
                       </div>
                       <h3 className="text-sm font-black text-slate-800">{sec.title}</h3>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                       {sec.items.map(([label, value, full]) => (
                         <div key={label} className={full ? "sm:col-span-2" : ""}>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                           <p className="text-sm font-semibold text-slate-700 break-words">{value || "-"}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
          );
        })()}

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
