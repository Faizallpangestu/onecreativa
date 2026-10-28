import React, { useState, useEffect } from "react";

import * as XLSX from "xlsx";
import {
  Wrench, Search, Filter, RefreshCw, Calendar, PlayCircle, CheckCircle2,
  FileText, Plus, Download, PackageOpen, MoreVertical, Edit, Trash2, Eye, X, Save
} from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useSEO } from "../../hooks/useSEO";

function statusBadge(s) {
  if (s === "scheduled" || s === "Terjadwal") return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-[10px] font-bold uppercase">Terjadwal</span>;
  if (s === "in_progress" || s === "Sedang Berjalan") return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] font-bold uppercase">Sedang Berjalan</span>;
  if (s === "completed" || s === "Selesai") return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[10px] font-bold uppercase">Selesai</span>;
  return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold uppercase">{s}</span>;
}

export default function Maintenance() {
  useSEO({ title: "Maintenance Asset", description: "Kelola jadwal, proses, dan riwayat maintenance aset" });

  
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    asset_id: "", // In a real app this would be a lookup, but for now we'll allow manual entry or select
    asset_code: "",
    asset_name: "",
    start_date: "",
    end_date: "",
    technician: "",
    cost: "",
    status: "Terjadwal",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/maintenance.php");
      let data = res.data?.data || [];
      // Empty logic to show the specific empty state design
      if (data.length === 0) {
        data = []; 
      }
      setItems(data);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch("");
    setFilterStatus("Semua Status");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData({
        id: item.id || "",
        asset_id: item.asset_id || "",
        asset_code: item.asset_code || "",
        asset_name: item.asset_name || "",
        start_date: item.start_date || "",
        end_date: item.end_date || "",
        technician: item.technician || "",
        cost: item.cost || "",
        status: item.status || "Terjadwal",
        notes: item.notes || ""
      });
    } else {
      setFormData({
        id: "", asset_id: "", asset_code: "", asset_name: "",
        start_date: "", end_date: "", technician: "",
        cost: "", status: "Terjadwal", notes: ""
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.id) {
        await api.put(`/maintenance.php?id=${payload.id}`, payload);
        alert("Berhasil mengupdate maintenance");
      } else {
        await api.post("/maintenance.php", payload);
        alert("Berhasil menjadwalkan maintenance");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus data maintenance ini?")) return;
    try {
      await api.delete(`/maintenance.php?id=${id}`);
      fetchData();
    } catch {
      alert("Gagal menghapus data");
    }
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      filteredItems.map((r, i) => ({
        "No": i + 1,
        "Kode Asset": r.asset_code || "-",
        "Nama Asset": r.asset_name || "-",
        "Tanggal Mulai": r.start_date || "-",
        "Tanggal Selesai": r.end_date || "-",
        "Teknisi": r.technician || "-",
        "Biaya (Rp)": r.cost || "0",
        "Status": r.status || "-",
        "Catatan": r.notes || "-"
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Maintenance");
    XLSX.writeFile(wb, "Data_Maintenance_Aset.xlsx");
  };

  // Mock stats
  const stats = {
    terjadwal: items.filter(r => r.status === 'scheduled' || r.status === 'Terjadwal').length,
    berjalan: items.filter(r => r.status === 'in_progress' || r.status === 'Sedang Berjalan').length,
    selesai: items.filter(r => r.status === 'completed' || r.status === 'Selesai').length,
    total_biaya: items.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0)
  };

  const filteredItems = items.filter(r => {
    const q = search.toLowerCase();
    if (q && !((r.asset_name||'').toLowerCase().includes(q) || (r.asset_code||'').toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });

  // Re-usable Sparkline
  const Sparkline = ({ color }) => (
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 15 L10 10 L20 18 L30 5 L38 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-800">Maintenance Asset</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; GA &gt; Maintenance Asset</p>
          </div>

          {/* Hero Banner dengan Efek "3D" / Gambar Latar Mekanik */}
          <div className="bg-[#eef2ff] rounded-[1.5rem] overflow-hidden relative shadow-sm h-32 sm:h-40 border border-blue-100 flex items-center">
            {/* Latar Belakang Gambar Mekanik / Engineer */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'right 20%',
              }}
            />
            {/* Gradient Overlay untuk meredupkan kiri dan memperjelas teks */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#eef2ff] via-[#eef2ff]/90 to-transparent"></div>
            
            <div className="relative z-20 flex items-start gap-4 p-6 sm:p-8 w-full max-w-2xl">
               <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                 <Wrench className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-[#0f2c59]">Maintenance Asset</h2>
                 <p className="text-sm font-medium text-slate-600 mt-1">Kelola jadwal, proses, dan riwayat maintenance aset perusahaan guna memastikan aset tetap dalam kondisi optimal.</p>
               </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* TERJADWAL */}
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Terjadwal</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.terjadwal}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Maintenance terjadwal</p>
                </div>
              </div>
              <Calendar className="w-6 h-6 text-amber-200" />
            </div>

            {/* SEDANG BERJALAN */}
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <PlayCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Sedang Berjalan</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.berjalan}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Maintenance dalam proses</p>
                </div>
              </div>
              <Sparkline color="#3b82f6" />
            </div>

            {/* SELESAI */}
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Selesai</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.selesai}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Maintenance selesai</p>
                </div>
              </div>
              <Sparkline color="#10b981" />
            </div>

            {/* TOTAL BIAYA */}
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Total Biaya</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">Rp {stats.total_biaya.toLocaleString('id-ID')}</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Biaya maintenance aset</p>
                </div>
              </div>
              <Sparkline color="#ec4899" />
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-2">
                 <Search className="w-5 h-5 text-blue-600" />
                 <h3 className="text-lg font-black text-slate-800">Filter & Pencarian</h3>
               </div>
               <button 
                 onClick={() => handleOpenModal()}
                 className="h-10 px-5 rounded-xl bg-amber-500 text-white font-bold text-sm shadow-md hover:bg-amber-600 transition flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" /> Jadwalkan Maintenance
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 relative mt-[1.3rem]">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Cari kode asset, nama asset, atau lokasi..." 
                     value={search} 
                     onChange={e => setSearch(e.target.value)} 
                     className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" 
                   />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Status Maintenance</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    <option>Semua Status</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Tanggal Mulai</label>
                  <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Tanggal Selesai</label>
                  <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" />
                </div>
             </div>

             <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
               <div className="flex items-center gap-3">
                 <button className="h-10 px-5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition flex items-center gap-2">
                   <Filter className="w-4 h-4" /> Terapkan Filter
                 </button>
                 <button onClick={handleReset} className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                   <RefreshCw className="w-4 h-4" /> Reset
                 </button>
               </div>
               <button onClick={handleExportExcel} className="h-10 px-5 rounded-xl border border-slate-200 text-slate-700 bg-white font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                   <Download className="w-4 h-4" /> Export Excel
               </button>
             </div>
          </div>

          {/* Table Daftar Maintenance */}
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-[15px] font-black text-slate-800">Daftar Maintenance Asset</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto min-h-[400px] flex flex-col">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">#</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Kode Asset</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Asset</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jadwal</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teknisi</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Biaya</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-16 text-sm font-bold text-slate-400">Memuat data...</td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-24">
                        <div className="flex flex-col items-center justify-center">
                           <div className="w-32 h-32 mb-4 relative">
                             {/* Kotak perkakas 3D look-alike (menggunakan SVG custom untuk empty state) */}
                             <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
                                <path d="M25 45 L75 45 L85 75 L15 75 Z" fill="#cbd5e1" />
                                <path d="M25 45 L75 45 L75 55 L25 55 Z" fill="#94a3b8" />
                                <path d="M40 30 L60 30 L55 55 L45 55 Z" fill="#3b82f6" />
                                <circle cx="45" cy="25" r="5" fill="#3b82f6" />
                                <circle cx="55" cy="25" r="5" fill="#3b82f6" />
                                <path d="M48 20 L52 20 L52 10 L48 10 Z" fill="#3b82f6" />
                             </svg>
                           </div>
                           <h4 className="text-xl font-black text-[#0f2c59]">Belum ada jadwal maintenance</h4>
                           <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm text-center">Mulai jadwalkan maintenance aset untuk memastikan aset tetap dalam kondisi optimal.</p>
                           <button onClick={() => handleOpenModal()} className="mt-6 h-11 px-6 rounded-xl bg-amber-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:bg-amber-600 transition-all flex items-center gap-2">
                             <Plus className="w-5 h-5" /> Jadwalkan Maintenance
                           </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((row, idx) => {
                      return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-4 text-xs font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{row.asset_code}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-800">{row.asset_name}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-500">{row.start_date}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">{row.technician || '-'}</td>
                        <td className="px-4 py-4 text-center">{statusBadge(row.status)}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">Rp {parseFloat(row.cost || 0).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4 text-center flex items-center justify-center gap-2">
                           <button onClick={() => handleOpenModal(row)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Edit">
                             <Edit className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDelete(row.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Hapus">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
            
          </div>

          {/* Modal Form Maintenance */}
          {showModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">{formData.id ? "Edit Maintenance" : "Jadwalkan Maintenance"}</h2>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Isi detail jadwal maintenance aset di bawah ini</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto">
                  <form id="maintenanceForm" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Kode Aset</label>
                        <input type="text" required value={formData.asset_code} onChange={e => setFormData({...formData, asset_code: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="Contoh: AST-001" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Nama Aset</label>
                        <input type="text" required value={formData.asset_name} onChange={e => setFormData({...formData, asset_name: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="Contoh: Laptop Asus" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Tanggal Mulai</label>
                        <input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Tanggal Selesai</label>
                        <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Teknisi</label>
                        <input type="text" required value={formData.technician} onChange={e => setFormData({...formData, technician: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="Nama Teknisi" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Biaya (Rp)</label>
                        <input type="number" min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition">
                          <option value="Terjadwal">Terjadwal</option>
                          <option value="Sedang Berjalan">Sedang Berjalan</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Catatan</label>
                      <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-4 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition resize-none" placeholder="Detail atau catatan terkait maintenance..."></textarea>
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                  <button type="button" onClick={() => setShowModal(false)} className="h-11 px-6 rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-sm hover:bg-slate-50 transition">
                    Batal
                  </button>
                  <button type="submit" form="maintenanceForm" disabled={isSubmitting} className="h-11 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-md shadow-blue-500/30 flex items-center gap-2">
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
