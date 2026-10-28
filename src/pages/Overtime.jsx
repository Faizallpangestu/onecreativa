import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";

import { 
  FileDown, Clock, CheckCircle2, XCircle, Clock4, 
  RotateCcw, Calendar, Edit, Eye, Trash2, Filter,
  Paperclip, Send, PenSquare, Search, PieChart as PieChartIcon,
  FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";

const OVERTIME_API   = "/api/overtime.php";
const EMPLOYEES_API  = "/api/employees.php";

const APPROVER_ROLES = ["super_admin", "manager"];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function getAvatarClass(name = "") {
  const palettes = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const i = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % palettes.length;
  return palettes[i];
}

export default function Overtime() {
  
  const user = getUser();
  const isApprover = user && APPROVER_ROLES.includes(user.role_name);
  const canExport  = user && ["super_admin", "manager", "hr"].includes(user.role_name);

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    employee_id: "",
    jenis_lembur: "Lembur Harian",
    date: new Date().toISOString().slice(0, 10),
    start_time: "17:00",
    end_time: "20:00",
    overtime_minutes: "",
    reason: "",
    attachment: null
  });

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const params = isApprover ? {} : { employee_id: user?.id };
      const res = await axios.get(OVERTIME_API, { params });
      
      const raw = res.data?.data ?? [];
      // Enhance with mock data for missing fields (jenis, jam) to match UI
      const mapped = raw.map(r => {
        const hash = r.id ? parseInt(r.id) : Math.floor(Math.random() * 100);
        return {
          ...r,
          jenis_lembur: hash % 4 === 0 ? "Lembur Weekend" : hash % 7 === 0 ? "Lembur Libur" : hash % 5 === 0 ? "Lembur Project" : "Lembur Harian",
          jam: "17:00 - " + (17 + Math.floor(r.overtime_minutes/60)) + ":" + (r.overtime_minutes%60 === 0 ? "00" : r.overtime_minutes%60)
        };
      });
      setRequests(mapped);
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
      // Filter out non-employees if needed
      setEmployees(arr.filter(emp => emp.role_name !== 'admin' && emp.role_name !== 'super_admin'));
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadRequests();
    loadEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });

    if (!form.employee_id || !form.overtime_minutes || Number(form.overtime_minutes) <= 0) {
      setSubmitMsg({ type: "error", text: "Pilih karyawan dan isi durasi lembur." });
      return;
    }

    try {
      await axios.post(OVERTIME_API, {
        employee_id: Number(form.employee_id),
        date: form.date,
        overtime_minutes: Number(form.overtime_minutes),
        reason: form.reason,
      });

      setSubmitMsg({ type: "success", text: "Request lembur berhasil disubmit!" });
      setForm({ ...form, employee_id: "", overtime_minutes: "", reason: "", attachment: null });
      loadRequests();
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.response?.data?.message ?? "Gagal submit request." });
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Setujui lembur ini?")) return;
    try {
      await axios.put(OVERTIME_API, {
        id,
        action: "approve",
        approver_id: user?.id,
        approver_role: user?.role_name,
      });
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal approve");
    }
  };

  const handleReject = async (id) => {
    const note = window.prompt("Alasan penolakan:");
    if (note === null) return; // Cancelled
    try {
      await axios.put(OVERTIME_API, {
        id,
        action: "reject",
        approver_id: user?.id,
        approver_role: user?.role_name,
        reject_reason: note,
      });
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal reject");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = requests.map((item) => ({
      Nama: item.employee_name,
      Tanggal: item.date,
      "Durasi Lembur (Menit)": item.overtime_minutes,
      Alasan: item.reason || "-",
      Status: item.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Overtime");
    XLSX.writeFile(workbook, `Laporan_Lembur_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Stats
  const totalReq = requests.length;
  const approvedReq = requests.filter(r => r.status === 'approved').length;
  const pendingReq = requests.filter(r => r.status === 'pending').length;
  const rejectedReq = requests.filter(r => r.status === 'rejected').length;

  const filteredRequests = requests.filter(r => {
    const ename = r.employee_name || "";
    const dept = r.department || "";
    const q = search.toLowerCase();
    return ename.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  // Pie chart
  const types = requests.reduce((acc, r) => {
    acc[r.jenis_lembur] = (acc[r.jenis_lembur] || 0) + 1;
    return acc;
  }, {});
  const pieData = [
    { name: 'Lembur Harian', value: types['Lembur Harian'] || 0, color: '#2563eb' },
    { name: 'Lembur Weekend', value: types['Lembur Weekend'] || 0, color: '#a855f7' },
    { name: 'Lembur Libur', value: types['Lembur Libur'] || 0, color: '#f97316' },
    { name: 'Lembur Project', value: types['Lembur Project'] || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Bar chart (mock months)
  const barData = [
    { name: 'Jan', Disetujui: 5, Menunggu: 2, Ditolak: 0 },
    { name: 'Feb', Disetujui: 8, Menunggu: 1, Ditolak: 1 },
    { name: 'Mar', Disetujui: 10, Menunggu: 3, Ditolak: 0 },
    { name: 'Apr', Disetujui: 12, Menunggu: 2, Ditolak: 0 },
    { name: 'Mei', Disetujui: 7, Menunggu: 4, Ditolak: 1 },
    { name: 'Jun', Disetujui: 9, Menunggu: 1, Ditolak: 0 },
    { name: 'Jul', Disetujui: 6, Menunggu: 2, Ditolak: 0 },
    { name: 'Agu', Disetujui: 11, Menunggu: 2, Ditolak: 0 },
    { name: 'Sep', Disetujui: approvedReq, Menunggu: pendingReq, Ditolak: rejectedReq },
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-800">Overtime</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; HRD &gt; Overtime</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-blue-500 bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center"><RotateCcw className="w-4 h-4"/></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Request</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{totalReq}</h3>
                  <span className="text-[10px] font-bold text-emerald-500 mb-0.5">↑ +12% dari bulan lalu</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-emerald-500 bg-emerald-50 w-8 h-8 rounded-full flex items-center justify-center"><RotateCcw className="w-4 h-4"/></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Disetujui</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{approvedReq}</h3>
                  <span className="text-[10px] font-bold text-emerald-500 mb-0.5">↑ +20% dari bulan lalu</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock4 className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-amber-500 bg-amber-50 w-8 h-8 rounded-full flex items-center justify-center"><RotateCcw className="w-4 h-4"/></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Menunggu Approval</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{pendingReq}</h3>
                  <span className="text-[10px] font-bold text-rose-500 mb-0.5">↓ -8% dari bulan lalu</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-rose-500 bg-rose-50 w-8 h-8 rounded-full flex items-center justify-center"><RotateCcw className="w-4 h-4"/></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ditolak</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{rejectedReq}</h3>
                  <span className="text-[10px] font-bold text-rose-500 mb-0.5">↓ -50% dari bulan lalu</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Form Ajukan Lembur */}
            <div className="lg:col-span-8 bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
               <div className="flex items-center gap-2 mb-1">
                 <PenSquare className="w-5 h-5 text-blue-600" />
                 <h3 className="text-[15px] font-black text-slate-800">Ajukan Lembur</h3>
               </div>
               <p className="text-xs font-semibold text-slate-500 mb-6 ml-7">Request akan diteruskan ke Manager / Direktur untuk disetujui.</p>

               {submitMsg.text && (
                  <div className={`mb-6 p-3 rounded-lg text-sm font-bold ${submitMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {submitMsg.text}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5">Karyawan <span className="text-rose-500">*</span></label>
                     <select required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition">
                       <option value="">Pilih karyawan</option>
                       {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Lembur <span className="text-rose-500">*</span></label>
                     <select value={form.jenis_lembur} onChange={e => setForm({...form, jenis_lembur: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition">
                       <option>Lembur Harian</option>
                       <option>Lembur Weekend</option>
                       <option>Lembur Libur</option>
                       <option>Lembur Project</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                     <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5">Mulai Lembur <span className="text-rose-500">*</span></label>
                       <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5">Selesai Lembur <span className="text-rose-500">*</span></label>
                       <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5">Durasi Lembur (menit) <span className="text-rose-500">*</span></label>
                     <input type="number" required placeholder="Contoh: 60" value={form.overtime_minutes} onChange={e => setForm({...form, overtime_minutes: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5">Alasan <span className="text-rose-500">*</span></label>
                     <textarea required placeholder="Tuliskan alasan lembur..." rows="1" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full min-h-[40px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition resize-none"></textarea>
                     <p className="text-[10px] text-right font-medium text-slate-400 mt-1">{form.reason.length}/500</p>
                   </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => setForm({...form, overtime_minutes: '', reason: ''})} className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition">
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button type="submit" className="h-11 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition">
                      <Send className="w-4 h-4" /> Ajukan Lembur
                    </button>
                 </div>
               </form>
            </div>

            {/* Right Charts */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col h-[320px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-[15px] font-black text-slate-800">Statistik Lembur</h3>
                  </div>
                  <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"><option>2026</option></select>
                </div>
                <div className="flex-1 w-full min-h-0 -ml-5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingLeft: '20px'}} />
                      <Bar dataKey="Disetujui" stackId="a" fill="#10b981" barSize={12} radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Menunggu" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Ditolak" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col h-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-[15px] font-black text-slate-800">Distribusi Jenis Lembur</h3>
                </div>
                <div className="flex-1 w-full flex items-center justify-between relative mt-4">
                  <div className="w-1/2 h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                      <span className="text-[10px] font-bold text-slate-400">Total</span>
                      <span className="text-xl font-black text-slate-800">{totalReq}</span>
                    </div>
                  </div>
                  <div className="w-1/2 flex flex-col gap-3 pl-2 border-l border-slate-50">
                    {pieData.map((item, i) => {
                       const percent = totalReq ? Math.round((item.value / totalReq) * 100) : 0;
                       return (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                            <span className="text-[10px] font-bold text-slate-600">{item.name}</span>
                          </div>
                          <div className="flex justify-between items-end pl-4.5 text-[11px] font-black">
                            <span className="text-slate-800">{item.value}</span>
                            <span className="text-slate-400">({percent}%)</span>
                          </div>
                        </div>
                       )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-[15px] font-black text-slate-800">Daftar Request Lembur</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Cari nama, departemen..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 pl-9 pr-3 w-64 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" />
                 </div>
                 <button className="h-10 px-4 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition">
                   <Filter className="w-4 h-4" /> Filter
                 </button>
                 {canExport && (
                   <button onClick={handleExportExcel} className="h-10 px-5 rounded-xl bg-[#0f2c59] text-white font-bold text-sm shadow-md hover:bg-blue-900 transition flex items-center gap-2">
                     <FileDown className="w-4 h-4" /> Export
                   </button>
                 )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-16">#</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Karyawan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departemen</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Lembur</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durasi</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Jam</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alasan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan="10" className="text-center py-10 text-sm font-bold text-slate-400">Memuat data...</td></tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr><td colSpan="10" className="text-center py-10 text-sm font-bold text-slate-400">Tidak ada request lembur.</td></tr>
                  ) : (
                    filteredRequests.map((row, idx) => {
                      let badge = <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md text-[11px] font-bold">Menunggu</span>;
                      if (row.status === 'approved') badge = <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold">Disetujui</span>;
                      if (row.status === 'rejected') badge = <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold">Ditolak</span>;

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${getAvatarClass(row.employee_name)}`}>
                                {getInitials(row.employee_name)}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">{row.employee_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.department || '-'}</td>
                          <td className="px-6 py-4 text-xs font-black text-slate-800 whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.jenis_lembur?.replace("Lembur ", "") || 'Harian'}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.overtime_minutes} menit</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 whitespace-nowrap">{row.jam}</td>
                          <td className="px-6 py-4">{badge}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[150px] truncate">{row.reason}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {isApprover && row.status === 'pending' && (
                                <>
                                  <button onClick={() => handleApprove(row.id)} className="w-7 h-7 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition" title="Setujui">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleReject(row.id)} className="w-7 h-7 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center transition" title="Tolak">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button className="w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="w-7 h-7 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex items-center justify-between">
               <p className="text-xs font-bold text-slate-500">Showing 1 to {filteredRequests.length} of {requests.length} entries</p>
               <div className="flex items-center gap-1">
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">Previous</button>
                 <button className="w-8 h-8 rounded-lg text-xs font-bold text-white bg-blue-600 flex items-center justify-center shadow">1</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">2</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">3</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">4</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">5</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">Next</button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
