import { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileDown, CheckCircle, Clock, XCircle, FileText, Briefcase, Paperclip, Search, UserX, Calendar, ShieldAlert } from "lucide-react";

const DinasLuarKota_API     = "/api/leaves.php";
const EMPLOYEES_API  = "/api/employees.php";

const APPROVER_ROLES = ["super_admin", "manager"];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getInitials(name) {
  const n = name || "";
  return n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function getAvatarClass(name) {
  const n = name || "";
  const palettes = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700"
  ];
  const i = n.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % palettes.length;
  return palettes[i];
}

const statusMap = {
  pending:  { label: "Menunggu",  cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  rejected: { label: "Ditolak",   cls: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
};

function formatDateFull(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DinasLuarKota() {
  const navigate = useNavigate();
  const user       = getUser();
  const isApprover = user && APPROVER_ROLES.includes(user.role_name);
  
  const isEmployee = user && (user.role_name === "employee" || user.role_name === "karyawan");
  const canExport  = user && ["super_admin", "manager", "hr"].includes(user.role_name);

  const activeTab = "dinas";
  const [requests,   setRequests]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [submitMsg,  setSubmitMsg]  = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    employee_id:   isEmployee ? (user.employee_id || user.id) : "",
    start_date:    new Date().toISOString().slice(0, 10),
    end_date:      new Date().toISOString().slice(0, 10),
    reason:        "",
    attachment:    null,
  });

  // ── Fetch data ─────────────────────────────────────────────────────────
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const params = isApprover ? { category: 'dinas' } : { employee_id: user?.employee_id || user?.id, category: 'dinas' };
      const res    = await axios.get(DinasLuarKota_API, { params });
      setRequests(res.data?.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEES_API);
      const arr = res.data?.data ?? res.data ?? [];
      setEmployees(arr);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadRequests();
    loadEmployees();
    // eslint-disable-next-line
  }, []);

  

  // ── Submit request Dinas ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });

    if (!form.employee_id || !form.start_date || !form.end_date) {
      setSubmitMsg({ type: "error", text: "Mohon lengkapi semua field yang wajib." });
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setSubmitMsg({ type: "error", text: "Tanggal Selesai tidak boleh mendahului Tanggal Mulai." });
      return;
    }

    const formData = new FormData();
    formData.append("employee_id", form.employee_id);
    formData.append("category", activeTab);
    formData.append("start_date", form.start_date);
    formData.append("end_date", form.end_date);
    formData.append("reason", form.reason);
    
    if (activeTab === 'sakit' && form.attachment) {
      formData.append("attachment", form.attachment);
    }

    try {
      await axios.post(DinasLuarKota_API, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSubmitMsg({ type: "success", text: "Pengajuan berhasil dikirim! Menunggu persetujuan." });
      setForm({
        employee_id: isEmployee ? (user.employee_id || user.id) : "",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        reason: "",
        attachment: null
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      loadRequests();
      loadEmployees(); // Reload to get updated leave_balance if Dinas was approved instantly (though it's pending)
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.response?.data?.message ?? "Gagal submit pengajuan." });
    }
  };

  // ── Approve & Reject ───────────────────────────────────────────────────
  const handleAction = async (id, action) => {
    if (!window.confirm(`Yakin ingin men-${action} pengajuan ini?`)) return;

    try {
      await axios.put(DinasLuarKota_API, {
        id,
        action,
        approver_role: user?.role_name,
      });
      loadRequests();
      loadEmployees(); // Update balances
    } catch (err) {
      alert(err.response?.data?.message ?? `Gagal ${action}`);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = requests.map((item) => ({
      Nama: item.employee_name,
      Kategori: item.category,
      "Tgl Mulai": item.start_date,
      "Tgl Selesai": item.end_date,
      Alasan: item.reason || "-",
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DinasLuarKota");
    XLSX.writeFile(workbook, `Laporan_Dinas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };



  // ── UI UNTUK KARYAWAN & ADMIN (Form Pengajuan & Persetujuan) ───────────────────────────────────────────────────

  const pendingCount  = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">
        
        {/* ── Mobile App Header & Background ── */}
        <div className="absolute top-0 left-0 right-0 h-[240px] bg-gradient-to-b from-blue-700 to-indigo-700 rounded-b-[2.5rem] shadow-md z-0">
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="relative z-10 px-5 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-black text-white tracking-wide">Dinas Luar Kota</h1>
            {canExport ? (
              <button
                onClick={handleExportExcel}
                className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition active:scale-95"
              >
                <FileDown className="w-5 h-5" strokeWidth={2.5} />
              </button>
            ) : <div className="w-10 h-10"></div>}
          </div>

          {/* ── Floating Stats ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-[1.5rem] p-4 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Menunggu</p>
              <p className="text-[24px] font-black text-slate-800 leading-none">{pendingCount}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-[1.5rem] p-4 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
               <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disetujui</p>
              <p className="text-[24px] font-black text-slate-800 leading-none">{approvedCount}</p>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="relative z-10 px-5 mt-4 flex flex-col gap-6">
          
          {/* Form Pengajuan Baru */}
          <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden">
            


            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-black text-slate-900 leading-tight">
                    Ajukan Dinas Luar Kota
                  </h2>
                  <p className="text-[12px] font-semibold text-slate-400 mt-1">
                    Ajukan perjalanan dinas. Kehadiran akan otomatis tercatat.
                  </p>
                </div>
              </div>

              {submitMsg.text && (
               <div className={`mb-5 p-4 rounded-2xl text-[13px] font-bold border ${
                    submitMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {submitMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Karyawan (Jika Admin/Manager) */}
                {!isEmployee && (
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-bold text-slate-700">Karyawan</span>
                    <select
                      value={form.employee_id}
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                    >
                      <option value="">Pilih karyawan</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Tanggal (Grid 2 Kolom) */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-bold text-slate-700">Mulai</span>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-mono font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-bold text-slate-700">Selesai</span>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-mono font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                </div>

                {/* Alasan */}
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Keterangan / Alasan</span>
                  <textarea
                    placeholder="Tuliskan keterangan detail..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[14px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white resize-none"
                  />
                </label>



                {/* Submit Button */}
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="sm:w-auto sm:min-w-[200px] w-[200px] h-12 px-8 rounded-2xl bg-blue-600 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Riwayat Pengajuan ── */}
          <div className="flex justify-between items-end mb-2 px-1">
             <h3 className="text-[16px] font-black text-slate-800">
               {isApprover ? "Menunggu Approval" : "Riwayat Saya"}
             </h3>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            {isLoading ? (
              <div className="py-10 flex justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <FileText className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-[15px] font-bold text-slate-600">Belum Ada Pengajuan</p>
                 <p className="text-sm text-slate-400 mt-1">Daftar riwayat Dinas dan izin akan muncul di sini.</p>
              </div>
            ) : (
              requests.map((r) => {
                const st = statusMap[r.status] ?? statusMap.pending;
                const StatusIcon = st.icon;
                const dateText = r.start_date === r.end_date ? formatDateFull(r.start_date) : `${formatDateFull(r.start_date)} - ${formatDateFull(r.end_date)}`;
                
                return (
                  <div key={r.id} className="bg-white p-5 rounded-[1.5rem] shadow-[0_8px_25px_rgb(0,0,0,0.03)] border border-slate-100 relative">
                    
                    <div className="flex items-start justify-between mb-4 border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] text-[15px] font-black ${getAvatarClass(r.employee_name)}`}>
                          {getInitials(r.employee_name)}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-900 leading-tight">{r.employee_name}</p>
                          <p className="text-[12px] font-black text-slate-400 mt-1 uppercase tracking-wider">{r.category}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${st.cls}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {st.label}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Tanggal Pelaksanaan</p>
                        <p className="text-[13px] font-bold text-slate-700">{dateText}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Keterangan</p>
                        <p className="text-[13px] font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{r.reason || "Tidak ada keterangan"}"</p>
                      </div>
                      
                      {r.attachment_url && (
                        <div>
                          <a href={r.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition text-[12px] font-bold border border-blue-100">
                            <Paperclip className="w-4 h-4" /> Lihat Lampiran Surat
                          </a>
                        </div>
                      )}
                    </div>

                    {isApprover && r.status === "pending" && (
                      <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
                        <button
                          onClick={() => handleAction(r.id, "reject")}
                          className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-rose-50 text-[13px] font-bold text-rose-600 transition hover:bg-rose-100 active:scale-95"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "approve")}
                          className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-emerald-500 text-[13px] font-bold text-white transition hover:bg-emerald-600 shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95"
                        >
                          Setujui
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
