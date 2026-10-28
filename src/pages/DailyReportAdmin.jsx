import React, { useState, useEffect } from "react";

import { 
  Search, Download, Calendar, Filter, FileText, CheckCircle, 
  X, Eye, Clock, RotateCcw, Edit, MoreVertical, CheckCircle2, XCircle
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import * as XLSX from "xlsx-js-style";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";

function getInitials(name) {
  const n = name || "";
  return n.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function getAvatarClass(name) {
  const n = name || "";
  const palettes = [
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-purple-100 text-purple-700",
    "bg-rose-100 text-rose-700",
  ];
  const index = n.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export default function DailyReportAdmin() {
  
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterEmployee, setFilterEmployee] = useState("ALL");
  const [filterDept, setFilterDept] = useState("Semua Departemen");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filterMonth, filterEmployee]);

  const fetchEmployees = async () => {
    try {
      const resp = await api.get('/employees.php');
      if (resp.data.status === 'success') {
        const list = resp.data.data || [];
        const companyEmployees = list.filter(emp => {
          const role = (emp.role_name || 'karyawan').toString().toLowerCase();
          return role === 'karyawan' || role === 'employee';
        });
        setEmployees(companyEmployees);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `/daily_reports.php?role=admin&month=${filterMonth}`;
      if (filterEmployee !== "ALL") {
        url += `&employee_id=${filterEmployee}`;
      }
      const resp = await api.get(url);
      if (resp.data.status === 'success') {
        const raw = resp.data.data || [];
        // Inject mock status and type for demo
        const mapped = raw.map(r => {
           const hash = r.id ? parseInt(r.id) : Math.floor(Math.random() * 100);
           return {
             ...r,
             jenis_laporan: hash % 3 === 0 ? "Laporan Mingguan" : hash % 5 === 0 ? "Laporan Bulanan" : "Laporan Harian",
             status_laporan: hash % 4 === 0 ? "Menunggu" : hash % 7 === 0 ? "Ditolak" : "Disetujui"
           };
        });
        setReports(mapped);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (reports.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const exportData = reports.map((row, idx) => {
      let tasksText = '';
      if (Array.isArray(row.tasks) && row.tasks.length > 0) {
        tasksText = row.tasks.map(t => {
          const statusLabel = t.status === 'done' ? 'Selesai' : t.status === 'progress' ? 'Sedang Proses' : 'Baru Mulai';
          return `- ${t.text} [${statusLabel}]`;
        }).join('\n');
      } else if (typeof row.tasks === 'string') {
        tasksText = row.tasks;
      } else {
        tasksText = 'Tidak ada catatan';
      }

      return {
        No: idx + 1,
        Tanggal: row.report_date,
        'Jam Submit': row.submit_time ? new Date(row.submit_time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-',
        NIK: row.nik,
        Nama: row.name,
        Jabatan: row.position || '-',
        'Jenis Laporan': row.jenis_laporan,
        Status: row.status_laporan,
        Laporan: tasksText
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kerja');
    XLSX.writeFile(workbook, `Rekap_Laporan_Kerja_${filterMonth}.xlsx`);
  };

  const depts = ["Semua Departemen", ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredReports = reports.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) || r.nik?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "Semua Departemen" ? true : r.department === filterDept;
    const matchStatus = filterStatus === "Semua Status" ? true : r.status_laporan === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const getStatusBadge = (st) => {
    if (st === 'Disetujui') return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold">Disetujui</span>;
    if (st === 'Ditolak') return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold">Ditolak</span>;
    return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md text-[11px] font-bold">Menunggu</span>;
  };

  // Stats
  const totalReports = reports.length;
  const approved = reports.filter(r => r.status_laporan === 'Disetujui').length;
  const pending = reports.filter(r => r.status_laporan === 'Menunggu').length;
  const rejected = reports.filter(r => r.status_laporan === 'Ditolak').length;

  // Pie chart data
  const types = reports.reduce((acc, r) => {
    acc[r.jenis_laporan] = (acc[r.jenis_laporan] || 0) + 1;
    return acc;
  }, {});
  const pieData = [
    { name: 'Laporan Harian', value: types['Laporan Harian'] || 0, color: '#3b82f6' },
    { name: 'Laporan Mingguan', value: types['Laporan Mingguan'] || 0, color: '#a855f7' },
    { name: 'Laporan Bulanan', value: types['Laporan Bulanan'] || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Bar chart data (mock months)
  const barData = [
    { name: 'Jan', Disetujui: 5, Menunggu: 2, Ditolak: 1 },
    { name: 'Feb', Disetujui: 8, Menunggu: 3, Ditolak: 0 },
    { name: 'Mar', Disetujui: 10, Menunggu: 1, Ditolak: 2 },
    { name: 'Apr', Disetujui: 12, Menunggu: 4, Ditolak: 1 },
    { name: 'Mei', Disetujui: 15, Menunggu: 2, Ditolak: 0 },
    { name: 'Jun', Disetujui: 11, Menunggu: 3, Ditolak: 1 },
    { name: 'Jul', Disetujui: 9, Menunggu: 5, Ditolak: 0 },
    { name: 'Agu', Disetujui: 14, Menunggu: 2, Ditolak: 1 },
    { name: 'Sep', Disetujui: approved, Menunggu: pending, Ditolak: rejected },
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={false}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-800">Work Reports</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; HRD &gt; Work Reports</p>
          </div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-blue-500 bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center"><RotateCcw className="w-4 h-4"/></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Laporan Kerja</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{totalReports}</h3>
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
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Laporan Disetujui</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{approved}</h3>
                  <span className="text-[10px] font-bold text-emerald-500 mb-0.5">↑ +8% dari bulan lalu</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-amber-500 bg-amber-50 w-8 h-8 rounded-full flex items-center justify-center"><RotateCcw className="w-4 h-4"/></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Laporan Menunggu</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{pending}</h3>
                  <span className="text-[10px] font-bold text-rose-500 mb-0.5">↓ -2% dari bulan lalu</span>
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
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Laporan Ditolak</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{rejected}</h3>
                  <span className="text-[10px] font-bold text-rose-500 mb-0.5">↓ -1% dari bulan lalu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar / Filters */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
             <div className="flex items-center gap-2 mb-4">
               <Filter className="w-4 h-4 text-blue-600" />
               <h3 className="text-sm font-black text-slate-800">Filter Laporan Kerja</h3>
             </div>
             
             <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Bulan</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full h-10 pl-10 pr-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Karyawan</label>
                  <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="ALL">Semua Karyawan</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Departemen</label>
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option>Semua Status</option>
                    <option>Disetujui</option>
                    <option>Menunggu</option>
                    <option>Ditolak</option>
                  </select>
                </div>
                <div className="flex-none flex items-center gap-2">
                  <button className="h-10 px-5 rounded-xl bg-[#0f2c59] text-white text-sm font-bold shadow-md hover:bg-blue-900 transition flex items-center gap-2">
                    <Search className="w-4 h-4" /> Cari
                  </button>
                  <button className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
             </div>

             <div className="absolute top-5 right-5">
               <button onClick={handleExport} className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition flex items-center gap-2">
                 <Download className="w-4 h-4" /> Export Laporan
               </button>
             </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-[15px] font-black text-slate-800">Hasil Rekap Laporan Kerja</h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   Show <select className="border border-slate-200 rounded p-1"><option>10</option></select> entries
                 </div>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Cari nama, NIK..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-9 pr-3 w-64 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                 </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-16">#</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Jam Submit</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Karyawan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jabatan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departemen</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Laporan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="9" className="text-center py-10 text-sm font-bold text-slate-400">Memuat laporan...</td></tr>
                  ) : filteredReports.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-10 text-sm font-bold text-slate-400">Tidak ada data.</td></tr>
                  ) : (
                    filteredReports.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 text-xs font-black text-slate-800 whitespace-nowrap">
                          {new Date(row.report_date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {row.submit_time ? new Date(row.submit_time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${getAvatarClass(row.name)}`}>
                              {getInitials(row.name)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">{row.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.position || '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.department || '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.jenis_laporan}</td>
                        <td className="px-6 py-4">{getStatusBadge(row.status_laporan)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex items-center justify-between">
               <p className="text-xs font-bold text-slate-500">Showing 1 to {filteredReports.length} of {filteredReports.length} entries</p>
               <div className="flex items-center gap-1">
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">Previous</button>
                 <button className="w-8 h-8 rounded-lg text-xs font-bold text-white bg-blue-600 flex items-center justify-center shadow">1</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">Next</button>
               </div>
            </div>
          </div>

          {/* Bottom Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Statistik Laporan Kerja */}
             <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col h-[350px]">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                   <h3 className="text-[15px] font-black text-slate-800">Statistik Laporan Kerja</h3>
                 </div>
                 <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"><option>2026</option></select>
               </div>
               <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                     <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                     <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                     <Bar dataKey="Disetujui" stackId="a" fill="#10b981" barSize={12} radius={[0, 0, 4, 4]} />
                     <Bar dataKey="Menunggu" stackId="a" fill="#f59e0b" />
                     <Bar dataKey="Ditolak" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Distribusi Jenis Laporan */}
             <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col h-[350px]">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
                   <h3 className="text-[15px] font-black text-slate-800">Distribusi Jenis Laporan</h3>
                 </div>
               </div>
               <div className="flex-1 w-full flex items-center justify-between relative">
                 <div className="w-1/2 h-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                         {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Pie>
                     </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                     <span className="text-[11px] font-bold text-slate-400">Total</span>
                     <span className="text-xl font-black text-slate-800">{totalReports}</span>
                   </div>
                 </div>
                 <div className="w-1/2 flex flex-col gap-4 pl-4 border-l border-slate-50">
                    {pieData.map((item, i) => {
                       const percent = totalReports ? Math.round((item.value / totalReports) * 100) : 0;
                       return (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                            <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                          </div>
                          <div className="flex justify-between items-end pl-4.5 text-xs font-black">
                            <span className="text-slate-800">{item.value}</span>
                            <span className="text-slate-400">({percent}%)</span>
                          </div>
                        </div>
                       )
                    })}
                 </div>
               </div>
             </div>

             {/* Aktivitas Terbaru */}
             <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col h-[350px]">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   <Clock className="w-5 h-5 text-blue-600" />
                   <h3 className="text-[15px] font-black text-slate-800">Aktivitas Terbaru</h3>
                 </div>
                 <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</button>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 relative border-l-2 border-slate-100 ml-2 space-y-6 pb-4">
                  {reports.slice(0, 5).map((r, i) => {
                     let colorClass = "bg-emerald-500";
                     let label = "mengirim laporan harian";
                     if (r.status_laporan === 'Ditolak') {
                       colorClass = "bg-rose-500";
                       label = "laporan ditolak";
                     } else if (r.status_laporan === 'Menunggu') {
                       colorClass = "bg-amber-500";
                     } else if (r.jenis_laporan === 'Laporan Mingguan') {
                       colorClass = "bg-amber-500";
                       label = "mengirim laporan mingguan";
                     } else if (r.jenis_laporan === 'Laporan Bulanan') {
                       colorClass = "bg-purple-500";
                       label = "mengirim laporan bulanan";
                     }
                     return (
                       <div key={i} className="relative pl-6">
                         <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${colorClass}`}></div>
                         <p className="text-sm font-bold text-slate-800">
                           {r.name} <span className="font-semibold text-slate-500">{label}</span>
                         </p>
                         <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                           {new Date(r.report_date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})} • {r.submit_time ? new Date(r.submit_time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'}
                         </p>
                       </div>
                     )
                  })}
               </div>
             </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
