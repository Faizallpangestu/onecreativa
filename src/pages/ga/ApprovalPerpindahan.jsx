import React, { useState, useEffect } from "react";

import * as XLSX from "xlsx";
import {
  CheckCircle2, XCircle, FileText, Search, Download, Filter, RefreshCw, 
  Hourglass, ArrowRight, PackageOpen
} from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useSEO } from "../../hooks/useSEO";

function statusBadge(s) {
  if (s === "pending" || s === "Menunggu") return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-[10px] font-bold uppercase">Menunggu</span>;
  if (s === "approved" || s === "Disetujui") return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[10px] font-bold uppercase">Disetujui</span>;
  if (s === "rejected" || s === "Ditolak") return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[10px] font-bold uppercase">Ditolak</span>;
  return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold uppercase">{s}</span>;
}

export default function AssetApproval() {
  useSEO({ title: "Asset Approval", description: "Persetujuan permintaan aset" });

  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("Menunggu");
  const [search, setSearch] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("Semua Jenis");
  const [filterDept, setFilterDept] = useState("Semua Departemen");
  const [filterStatus, setFilterStatus] = useState("Menunggu");

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/asset_histories.php?requests=1");
      let data = res.data?.data || [];
      // Map to dummy data if empty to show UI
      if (data.length === 0) {
        // Leaving empty to show the exact empty state from the image
        data = []; 
      }
      setRequests(data);
    } catch (e) {
      console.error(e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilterDate("");
    setFilterType("Semua Jenis");
    setFilterDept("Semua Departemen");
    setFilterStatus("Menunggu");
  };

  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      filteredRequests.map((r, i) => ({
        "No": i + 1,
        "Tanggal": r.request_date || "-",
        "Nama Aset": r.asset_name || "-",
        "Kode Aset": r.asset_code || "-",
        "Karyawan": r.employee_name || "-",
        "Departemen": r.department || "-",
        "Tujuan Lokasi": r.target_location || "-",
        "Status": r.status || "-",
        "Tipe": r.request_type || "Permintaan Aset",
        "Keterangan": r.notes || "-"
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asset_Approval");
    XLSX.writeFile(wb, "Data_Asset_Approval.xlsx");
  };

  // Mock stats
  const stats = {
    menunggu: requests.filter(r => r.status === 'pending' || r.status === 'Menunggu').length,
    disetujui: requests.filter(r => r.status === 'approved' || r.status === 'Disetujui').length,
    ditolak: requests.filter(r => r.status === 'rejected' || r.status === 'Ditolak').length,
    total: requests.length
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab !== "Semua") {
      const s = r.status === "pending" ? "Menunggu" : r.status === "approved" ? "Disetujui" : r.status === "rejected" ? "Ditolak" : r.status;
      if (s !== activeTab) return false;
    }
    const q = search.toLowerCase();
    if (q && !((r.asset_name||'').toLowerCase().includes(q) || (r.asset_code||'').toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-800">Asset Approval</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; GA &gt; Asset Approval</p>
          </div>

          {/* Hero Banner dengan Efek "3D" */}
          <div className="bg-[#eef2ff] rounded-[1.5rem] overflow-hidden relative shadow-sm h-32 sm:h-40 border border-blue-100 flex items-center">
            {/* Latar Belakang Gambar 3D */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'right 20%',
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#eef2ff] via-[#eef2ff]/90 to-transparent"></div>
            
            <div className="relative z-20 flex items-start gap-4 p-6 sm:p-8 w-full max-w-2xl">
               <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                 <CheckCircle2 className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-[#0f2c59]">Persetujuan Aset</h2>
                 <p className="text-sm font-medium text-slate-600 mt-1">Kelola dan proses semua permintaan aset dari karyawan dengan lebih cepat dan transparan.</p>
               </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-amber-50/50 hover:bg-amber-50 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-amber-100 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Hourglass className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Menunggu</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.menunggu}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Permintaan menunggu persetujuan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-emerald-50/50 hover:bg-emerald-50 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-emerald-100 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Disetujui</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.disetujui}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Permintaan telah disetujui</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-rose-50/50 hover:bg-rose-50 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-rose-100 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Ditolak</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.ditolak}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Permintaan ditolak</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-blue-50/50 hover:bg-blue-50 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-blue-100 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Total Permintaan</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.total}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Seluruh permintaan aset</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Pill Tabs */}
          <div className="bg-white rounded-full p-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-wrap gap-2 items-center justify-center sm:justify-between max-w-5xl mx-auto">
            {["Menunggu", "Disetujui", "Ditolak", "Semua"].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] py-2.5 rounded-full flex items-center justify-center gap-2 text-[13px] font-black transition-all ${
                  activeTab === tab 
                    ? "bg-[#8b5cf6] text-white shadow-md shadow-purple-500/20" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab === "Menunggu" && <Hourglass className="w-4 h-4" />}
                {tab === "Disetujui" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {tab === "Ditolak" && <XCircle className="w-4 h-4 text-rose-500" />}
                {tab === "Semua" && <FileText className="w-4 h-4 text-blue-500" />}
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab ? "bg-white/20" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab === "Menunggu" ? stats.menunggu : tab === "Disetujui" ? stats.disetujui : tab === "Ditolak" ? stats.ditolak : stats.total}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Permintaan */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-2">
                 <Filter className="w-5 h-5 text-blue-600" />
                 <h3 className="text-lg font-black text-slate-800">Filter Permintaan</h3>
               </div>
               <div className="flex items-center gap-3">
                 <button onClick={handleReset} className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2">
                   <RefreshCw className="w-4 h-4" /> Reset
                 </button>
                 <button className="h-10 px-5 rounded-xl bg-[#0f2c59] text-white font-bold text-sm shadow-md hover:bg-blue-900 transition flex items-center gap-2">
                   <Filter className="w-4 h-4" /> Terapkan Filter
                 </button>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Tanggal Pengajuan</label>
                  <div className="relative">
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Jenis Aset</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    <option>Semua Jenis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Departemen</label>
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    <option>Semua Departemen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    <option>Menunggu</option>
                  </select>
                </div>
             </div>
          </div>

          {/* Table Daftar Permintaan */}
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-[15px] font-black text-slate-800">Daftar Permintaan Aset</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Cari nama, kode aset, atau departemen..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-9 pr-3 w-[300px] bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                 </div>
                 <button onClick={handleExportExcel} className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 bg-white font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                   <Download className="w-4 h-4" /> Export
                 </button>
              </div>
            </div>
            
            <div className="overflow-x-auto min-h-[300px] flex flex-col">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">#</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pemohon</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departemen</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Aset</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Aset</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Jumlah</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tujuan</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="10" className="text-center py-16 text-sm font-bold text-slate-400">Memuat data...</td></tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-24">
                        <div className="flex flex-col items-center justify-center">
                           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                             <PackageOpen className="w-12 h-12 text-slate-300" />
                           </div>
                           <h4 className="text-lg font-black text-slate-800">Tidak ada permintaan aset</h4>
                           <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">Saat ini tidak ada data permintaan aset yang menunggu persetujuan.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((row, idx) => {
                      const dt = row.performed_at ? new Date(row.performed_at) : new Date();
                      return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-4 text-xs font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-4">
                          <p className="text-[11px] font-black text-slate-700 whitespace-nowrap">{dt.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-800">{row.performed_by_name || '-'}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">-</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{row.action_type}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-800">{row.asset_name}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600 text-center">1</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-500">{row.to_location || '-'}</td>
                        <td className="px-4 py-4 text-center">{statusBadge(row.status)}</td>
                        <td className="px-4 py-4 text-center">-</td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex items-center justify-between mt-auto">
               <p className="text-xs font-bold text-slate-500">Showing 0 to {filteredRequests.length} of {filteredRequests.length} entries</p>
               <div className="flex items-center gap-1">
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-100">Previous</button>
                 <button className="w-8 h-8 rounded-lg text-xs font-bold text-white bg-blue-600 flex items-center justify-center shadow">1</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-100">Next</button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
