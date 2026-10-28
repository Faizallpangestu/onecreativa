import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import {
  Calendar, CheckCircle, Clock, XCircle, FileText, Search, User, UserX,
  ChevronDown, Paperclip, Check, X, ShieldAlert, Briefcase, Send, Heart
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const LEAVES_API = "/api/leaves.php";
const EMPLOYEES_API = "/api/employees.php";

const APPROVER_ROLES = ["super_admin", "manager"];

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

function getInitials(name) {
  return (name || "").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
}

function getAvatarColor(name) {
  const colors = ["bg-blue-100 text-blue-600", "bg-emerald-100 text-emerald-600", "bg-amber-100 text-amber-600", "bg-purple-100 text-purple-600", "bg-rose-100 text-rose-600"];
  const i = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[i % colors.length];
}

export default function Leaves() {
  const user = getUser();
  const isApprover = user && APPROVER_ROLES.includes(user.role_name);
  const isEmployee = user && (user.role_name === "employee" || user.role_name === "karyawan");

  const [activeTab, setActiveTab] = useState("cuti");
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [, setIsLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    employee_id: isEmployee ? (user.employee_id || user.id) : "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: "",
    attachment: null,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, empRes] = await Promise.all([
        axios.get(LEAVES_API, { params: isApprover ? {} : { employee_id: user?.employee_id || user?.id } }),
        axios.get(EMPLOYEES_API)
      ]);
      const allReqs = reqRes.data?.data || [];
      setRequests(allReqs.filter(r => r.category !== 'dinas'));
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });
    if (!form.employee_id || !form.start_date || !form.end_date) {
      setSubmitMsg({ type: "error", text: "Lengkapi semua field." });
      return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setSubmitMsg({ type: "error", text: "Tanggal selesai tidak valid." });
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
      await axios.post(LEAVES_API, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSubmitMsg({ type: "success", text: "Pengajuan berhasil dikirim!" });
      setForm({ ...form, reason: "", attachment: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData();
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.response?.data?.message || "Gagal submit." });
    }
  };

  const handleAction = async (id, action) => {
    if (!window.confirm(`Yakin ingin men-${action} pengajuan ini?`)) return;
    try {
      await axios.put(LEAVES_API, { id, action, approver_role: user?.role_name });
      loadData();
    } catch {
      alert("Gagal melakukan aksi.");
    }
  };

  // Stats Logic
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;
  const thisMonthRequests = requests.filter(r => new Date(r.start_date).getMonth() === new Date().getMonth()).length;

  const pendingRequests = requests.filter(r => r.status === "pending").slice(0, 5);
  const recentActivities = requests.slice(0, 5);

  const statsByMonth = useMemo(() => {
    const data = [
      { name: 'Jan', cuti: 0, izin: 0, sakit: 0 }, { name: 'Feb', cuti: 0, izin: 0, sakit: 0 },
      { name: 'Mar', cuti: 0, izin: 0, sakit: 0 }, { name: 'Apr', cuti: 0, izin: 0, sakit: 0 },
      { name: 'Mei', cuti: 0, izin: 0, sakit: 0 }, { name: 'Jun', cuti: 0, izin: 0, sakit: 0 },
      { name: 'Jul', cuti: 0, izin: 0, sakit: 0 }, { name: 'Ags', cuti: 0, izin: 0, sakit: 0 },
      { name: 'Sep', cuti: 0, izin: 0, sakit: 0 }, { name: 'Okt', cuti: 0, izin: 0, sakit: 0 },
      { name: 'Nov', cuti: 0, izin: 0, sakit: 0 }, { name: 'Des', cuti: 0, izin: 0, sakit: 0 },
    ];
    requests.forEach(r => {
      const d = new Date(r.start_date);
      if (d.getFullYear() === new Date().getFullYear() && r.status === 'approved') {
        data[d.getMonth()][r.category]++;
      }
    });
    return data;
  }, [requests]);

  const pieData = useMemo(() => {
    let c = 0, i = 0, s = 0;
    requests.forEach(r => {
      if (r.status === 'approved') {
        if (r.category === 'cuti') c++;
        else if (r.category === 'izin') i++;
        else if (r.category === 'sakit') s++;
      }
    });
    return [
      { name: 'Cuti Tahunan', value: c, color: '#2563eb' },
      { name: 'Izin', value: i, color: '#a855f7' },
      { name: 'Sakit', value: s, color: '#f43f5e' },
    ];
  }, [requests]);

  const totalPie = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const deptStats = useMemo(() => {
    const depts = {};
    employees.forEach(e => {
      const d = e.department || 'Lainnya';
      if (!depts[d]) depts[d] = { cuti: 0, izin: 0, sakit: 0, total: 0 };
    });
    requests.forEach(r => {
      if (r.status === 'approved') {
        const emp = employees.find(e => e.id === r.employee_id);
        const d = emp?.department || 'Lainnya';
        if (depts[d]) {
          depts[d][r.category]++;
          depts[d].total++;
        }
      }
    });
    return Object.entries(depts).map(([dept, counts]) => ({ dept, ...counts })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [requests, employees]);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-slate-50 font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Hero Banner */}
          <div className="relative w-full h-[180px] md:h-[220px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e293b] border border-slate-700/50 shadow-2xl flex items-center mb-6">
            <div className="absolute right-0 top-0 bottom-0 w-[200px] md:w-[280px]" style={{
              backgroundImage: "url('/images/leaves_hero_dark.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              maskImage: 'linear-gradient(to right, transparent, black 40%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)'
            }}></div>
            <div className="p-6 md:p-10 relative z-10 w-full md:w-[65%] lg:w-[55%] flex flex-col justify-center">
              <h1 className="text-[24px] md:text-[32px] font-black text-white tracking-tight leading-[1.2]">
                Leave Requests
              </h1>
              <p className="text-slate-300 text-[13px] md:text-[14px] font-medium mt-1 md:mt-2 leading-relaxed max-w-md">
                Kelola permintaan cuti, izin, dan sakit dengan mudah.
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="w-[3.25rem] h-[3.25rem] rounded-[1rem] bg-amber-50 flex items-center justify-center shrink-0">
                <Calendar className="w-[22px] h-[22px] text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Pending Requests</p>
                <h2 className="text-[28px] font-black text-slate-800 leading-tight">{pendingCount}</h2>
                <p className="text-[10px] font-medium text-slate-500">Menunggu persetujuan</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="w-[3.25rem] h-[3.25rem] rounded-[1rem] bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-[22px] h-[22px] text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Approved Requests</p>
                <h2 className="text-[28px] font-black text-slate-800 leading-tight">{approvedCount}</h2>
                <p className="text-[10px] font-medium text-slate-500">Disetujui</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="w-[3.25rem] h-[3.25rem] rounded-[1rem] bg-rose-50 flex items-center justify-center shrink-0">
                <XCircle className="w-[22px] h-[22px] text-rose-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Rejected Requests</p>
                <h2 className="text-[28px] font-black text-slate-800 leading-tight">{rejectedCount}</h2>
                <p className="text-[10px] font-medium text-slate-500">Ditolak</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="w-[3.25rem] h-[3.25rem] rounded-[1rem] bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-[22px] h-[22px] text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Total Leave This Month</p>
                <h2 className="text-[28px] font-black text-slate-800 leading-tight">{thisMonthRequests}</h2>
                <p className="text-[10px] font-medium text-slate-500">Bulan Ini</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (Form & History) */}
            <div className={`flex flex-col gap-6 ${isEmployee ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
              
              {/* Form (Hanya untuk Karyawan) */}
              {isEmployee && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" /> Ajukan Permintaan Cuti / Izin
                    </h2>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100 gap-1">
                    {[
                      { id: 'cuti', label: 'Cuti', icon: Calendar },
                      { id: 'izin', label: 'Izin', icon: Send },
                      { id: 'sakit', label: 'Sakit', icon: Heart }
                    ].map(tab => (
                      <button
                        key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold rounded-lg transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                      >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                      </button>
                    ))}
                  </div>

                  {submitMsg.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm font-bold ${submitMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {submitMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></span>
                        <input required type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-sm" />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai <span className="text-red-500">*</span></span>
                        <input required type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-sm" />
                      </label>
                    </div>
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Alasan <span className="text-red-500">*</span></span>
                      <textarea required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows="4" placeholder="Tuliskan keterangan detail pengajuan..." className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:border-blue-500 resize-none transition shadow-sm"></textarea>
                    </label>
                    
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-700 mb-1">Lampiran (Opsional)</span>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition cursor-pointer relative shadow-sm">
                        <input type="file" ref={fileInputRef} onChange={e => setForm({...form, attachment: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                          <Paperclip className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-600">Drag & drop file di sini atau <span className="text-blue-600">klik untuk memilih</span></p>
                        <p className="text-xs font-medium text-slate-400 mt-1">Format: PDF, JPG, PNG (Maks. 5 MB)</p>
                        {form.attachment && <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 px-3 py-1 rounded-full">{form.attachment.name}</p>}
                      </div>
                    </label>

                    <div className="flex items-center gap-3 mt-2">
                      <button type="button" onClick={() => setForm({...form, reason: "", attachment: null})} className="w-1/3 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition shadow-sm">
                        Reset
                      </button>
                      <button type="submit" className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        Kirim Pengajuan
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Riwayat Aktivitas Terbaru */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" /> Riwayat Aktivitas Terbaru
                  </h2>
                  <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
                </div>
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                  {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                    <div key={i} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${act.category === 'cuti' ? 'bg-blue-500' : (act.category === 'izin' ? 'bg-purple-500' : 'bg-rose-500')}`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800"><span className="text-slate-900">{act.employee_name}</span> mengajukan {act.category}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {new Date(act.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {act.attachment_url && (
                          <a href={act.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-[10px] font-bold text-blue-600 underline hover:text-blue-700">
                            Lihat Lampiran (SKD)
                          </a>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="pl-6 text-sm font-medium text-slate-500">Belum ada aktivitas terbaru.</div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className={`flex flex-col gap-6 ${isEmployee ? 'lg:col-span-7' : 'lg:col-span-8'}`}>
              
              {/* Menunggu Approval */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" /> Menunggu Approval
                  </h2>
                  <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">#</th>
                        <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Karyawan</th>
                        <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Jenis</th>
                        <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Periode</th>
                        <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                        {isApprover && <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.length > 0 ? pendingRequests.map((req, i) => (
                        <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition last:border-0">
                          <td className="py-3 text-sm font-semibold text-slate-500">{i+1}</td>
                          <td className="py-3 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${getAvatarColor(req.employee_name)}`}>
                              {getInitials(req.employee_name)}
                            </div>
                            <span className="text-[13px] font-bold text-slate-800">{req.employee_name}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide ${req.category==='cuti'?'bg-blue-50 text-blue-600':(req.category==='izin'?'bg-purple-50 text-purple-600':'bg-rose-50 text-rose-600')}`}>
                              {req.category.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-[12px] font-bold text-slate-500">
                            <div>
                              {new Date(req.start_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - {new Date(req.end_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                            </div>
                            {req.attachment_url && (
                              <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-0.5 text-[10px] font-bold text-blue-600 underline hover:text-blue-700">
                                Lihat SKD
                              </a>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 tracking-wide">Menunggu</span>
                          </td>
                          {isApprover && (
                            <td className="py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleAction(req.id, 'approve')} className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition shadow-sm"><Check className="w-4 h-4" /></button>
                                <button onClick={() => handleAction(req.id, 'reject')} className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition shadow-sm"><X className="w-4 h-4" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )) : (
                        <tr><td colSpan="6" className="py-8 text-center text-sm font-semibold text-slate-500">Tidak ada pengajuan yang menunggu persetujuan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart & Donut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-blue-600" /> Statistik Cuti per Bulan
                    </h2>
                  </div>
                  <div className="h-48 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsByMonth}>
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="cuti" stackId="a" fill="#2563eb" radius={[0,0,4,4]} barSize={12} />
                        <Bar dataKey="izin" stackId="a" fill="#a855f7" />
                        <Bar dataKey="sakit" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-5 mt-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></div> Cuti</div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></div> Izin</div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div> Sakit</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-blue-600" /> Distribusi Jenis Cuti
                    </h2>
                  </div>
                  <div className="flex items-center flex-1">
                    <div className="h-32 w-1/2 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                        <span className="text-[10px] font-bold text-slate-400 leading-none">Total</span>
                        <span className="text-xl font-black text-slate-800 leading-tight">{totalPie}</span>
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col gap-4 pl-6 border-l border-slate-100">
                      {pieData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: item.color}}></div>
                            <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rekapitulasi Cuti / Riwayat */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
                    {isApprover ? (
                      <><User className="w-4 h-4 text-blue-600" /> Rekapitulasi Cuti Karyawan</>
                    ) : (
                      <><Clock className="w-4 h-4 text-blue-600" /> Riwayat Pengajuan Anda</>
                    )}
                  </h2>
                  {isApprover && <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Lihat Detail</span>}
                </div>
                <div className="overflow-x-auto">
                  {isApprover ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Departemen</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Cuti</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Izin</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Sakit</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptStats.length > 0 ? deptStats.map((d, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                            <td className="py-3 text-[13px] font-bold text-slate-800">{d.dept}</td>
                            <td className="py-3 text-sm font-semibold text-slate-500 text-center">{d.cuti}</td>
                            <td className="py-3 text-sm font-semibold text-slate-500 text-center">{d.izin}</td>
                            <td className="py-3 text-sm font-semibold text-slate-500 text-center">{d.sakit}</td>
                            <td className="py-3 text-sm font-black text-slate-800 text-center">{d.total}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" className="py-6 text-center text-sm font-semibold text-slate-500">Belum ada data.</td></tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Jenis</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Periode</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Keterangan</th>
                          <th className="pb-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.length > 0 ? requests.map((req, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                            <td className="py-3">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide ${req.category==='cuti'?'bg-blue-50 text-blue-600':(req.category==='izin'?'bg-purple-50 text-purple-600':'bg-rose-50 text-rose-600')}`}>
                                {req.category.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-[12px] font-bold text-slate-500">
                              {new Date(req.start_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - {new Date(req.end_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                            </td>
                            <td className="py-3 text-[12px] text-slate-600 font-medium max-w-[200px] truncate">{req.reason || '-'}</td>
                            <td className="py-3 text-center">
                              {req.status === 'pending' ? (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 tracking-wide">Menunggu</span>
                              ) : req.status === 'approved' ? (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 tracking-wide">Disetujui</span>
                              ) : (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 tracking-wide">Ditolak</span>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="py-6 text-center text-sm font-semibold text-slate-500">Belum ada riwayat pengajuan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
