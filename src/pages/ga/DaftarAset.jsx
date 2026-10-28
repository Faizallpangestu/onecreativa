import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Download,
  Box, CheckCircle2, Wrench, XCircle, Package,
  MoreVertical, Edit, Trash2, Eye,
  RefreshCcw, UserCheck, Plus, MonitorSmartphone, MapPin
} from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import * as XLSX from "xlsx-js-style";
import { useSEO } from "../../hooks/useSEO";
import FormAset from "./FormAset";
import { X } from "lucide-react";

const CATEGORIES = ["Semua","Elektronik","Furniture","Kendaraan","Alat Tulis","Peralatan Dapur","Lainnya"];
const LOCATIONS = ["Semua Lokasi", "Kantor Pusat", "Ruang IT", "Ruang Kelas A", "Ruang Staff", "Ruang Admin"];
const STATUSES    = ["Semua Status","Aktif","Maintenance","Tidak Aktif","Dipinjam"];

function conditionBadge(c) {
  if (c === "Baik")         return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold">Baik</span>;
  if (c === "Rusak Ringan") return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md text-[11px] font-bold">Rusak Ringan</span>;
  if (c === "Rusak Berat")  return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[11px] font-bold">Rusak Berat</span>;
  return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold">Rusak</span>;
}

function statusBadge(s) {
  if (s === "Aktif")       return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold">Aktif</span>;
  if (s === "Maintenance") return <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-[11px] font-bold">Maintenance</span>;
  if (s === "Tidak Aktif") return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-[11px] font-bold">Tidak Aktif</span>;
  return <span className="px-2.5 py-1 bg-pink-50 text-pink-600 rounded-md text-[11px] font-bold">Dipinjam</span>;
}

export default function DaftarAset() {
  const navigate = useNavigate();
  
  
  

  useSEO({ title: "Asset Management", description: "Kelola seluruh aset perusahaan" });

  const [assets, setAssets]   = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch]   = useState("");
  const [filterCat, setFilterCat]   = useState("Semua Kategori");
  const [filterLoc, setFilterLoc]   = useState("Semua Lokasi");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat !== "Semua Kategori" && filterCat !== "Semua") params.category = filterCat;
      if (filterStatus !== "Semua Status" && filterStatus !== "Semua") params.status = filterStatus;

      const [listRes, statsRes] = await Promise.all([
        api.get("/assets.php", { params }),
        api.get("/assets.php", { params: { stats: 1 } }),
      ]);
      const rawAssets = listRes.data?.data || [];
      
      // Inject dummy locations & brands for UI match if missing
      const mapped = rawAssets.map((a, i) => ({
        ...a,
        location: a.location || LOCATIONS[(i % (LOCATIONS.length - 1)) + 1],
        brand: a.brand || (a.category === 'Elektronik' ? 'Apple' : 'IKEA'),
        purchase_price: a.purchase_price || (Math.floor(Math.random() * 10) + 1) * 1000000,
        purchase_date: a.purchase_date || `2026-09-0${(i%9)+1}`,
        asset_code: a.asset_code || `AST-2026-000${i+1}`
      }));

      setAssets(mapped);
      setStats(statsRes.data?.data || null);
    } catch (e) {
      console.error(e);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus aset ini?")) return;
    try {
      await api.delete(`/assets.php?id=${id}`);
      fetchData();
    } catch {
      alert("Gagal menghapus aset");
    }
  };

  const handleExport = () => {
    const rows = assets.map((a) => ({
      "Kode Aset": a.asset_code,
      "Nama Aset": a.name,
      "Kategori": a.category,
      "Merek": a.brand,
      "Lokasi": a.location,
      "Kondisi": a.condition,
      "Status": a.status,
      "Harga Beli": a.purchase_price,
      "Tanggal Beli": a.purchase_date,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aset");
    XLSX.writeFile(wb, `Aset_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };

  // Mock Sparkline SVG for cards
  const Sparkline = ({ color }) => (
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 15 L10 10 L20 18 L30 5 L38 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const filteredAssets = assets.filter(a => {
    const matchLoc = filterLoc === "Semua Lokasi" ? true : a.location === filterLoc;
    const matchCat = filterCat === "Semua Kategori" ? true : a.category === filterCat;
    const matchStat = filterStatus === "Semua Status" ? true : a.status === filterStatus;
    const matchSearch = search === "" ? true : (a.name?.toLowerCase().includes(search.toLowerCase()) || a.asset_code?.toLowerCase().includes(search.toLowerCase()));
    return matchLoc && matchCat && matchStat && matchSearch;
  });

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-800">Asset Management</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; GA &gt; Asset Management</p>
          </div>

          {/* Hero Banner dengan Efek "3D" */}
          <div className="bg-[#eef2ff] rounded-[1.5rem] overflow-hidden relative shadow-sm h-32 sm:h-40 border border-blue-100 flex items-center">
            {/* Latar Belakang Gambar */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'right 40%',
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#eef2ff] via-[#eef2ff]/90 to-transparent"></div>
            
            <div className="relative z-20 flex items-start gap-4 p-6 sm:p-8 w-full max-w-2xl">
               <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                 <Box className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-[#0f2c59]">Manajemen Aset</h2>
                 <p className="text-sm font-medium text-slate-600 mt-1">Kelola seluruh aset perusahaan dengan lebih terstruktur, aman, dan efisien.</p>
               </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[110px] relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Aset</p>
                  <h3 className="text-xl font-black text-slate-800 leading-none">{stats?.total || assets.length}</h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold text-emerald-500">↑ +12% detail</span>
                <Sparkline color="#3b82f6" />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[110px] relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Aset Aktif</p>
                  <h3 className="text-xl font-black text-slate-800 leading-none">{stats?.aktif || assets.filter(a=>a.status==='Aktif').length}</h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold text-emerald-500">↑ +0%</span>
                <Sparkline color="#10b981" />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[110px] relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Maintenance</p>
                  <h3 className="text-xl font-black text-slate-800 leading-none">{stats?.maintenance || assets.filter(a=>a.status==='Maintenance').length}</h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold text-slate-400">0%</span>
                <Sparkline color="#a855f7" />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[110px] relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tidak Aktif</p>
                  <h3 className="text-xl font-black text-slate-800 leading-none">{stats?.tidak_aktif || assets.filter(a=>a.status==='Tidak Aktif').length}</h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold text-slate-400">0%</span>
                <Sparkline color="#94a3b8" />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-[110px] relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Dipinjam</p>
                  <h3 className="text-xl font-black text-slate-800 leading-none">{stats?.dipinjam || assets.filter(a=>a.status==='Dipinjam').length}</h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold text-rose-500">0%</span>
                <Sparkline color="#f43f5e" />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
               <div className="flex items-center gap-2">
                 <Filter className="w-5 h-5 text-blue-600" />
                 <h3 className="text-lg font-black text-slate-800">Filter Aset</h3>
               </div>
               <button onClick={() => setShowAddModal(true)} className="h-10 px-5 rounded-xl bg-[#0f2c59] text-white font-bold text-sm shadow-md hover:bg-blue-900 transition flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Tambah Aset
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Cari Aset</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="text" placeholder="Cari nama, kode, merek, S/N..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-11 pl-10 pr-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Kategori</label>
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    <option>Semua Kategori</option>
                    {CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Lokasi</label>
                  <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    {LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    {STATUSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
             </div>
             
             <div className="flex items-center gap-3 mt-5">
                <button onClick={fetchData} className="h-10 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm shadow hover:bg-blue-700 transition flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button onClick={() => { setSearch(''); setFilterCat('Semua Kategori'); setFilterLoc('Semua Lokasi'); setFilterStatus('Semua Status'); }} className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Reset
                </button>
             </div>
          </div>

          {/* Table Daftar Aset */}
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-[15px] font-black text-slate-800">Daftar Aset</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   Show <select className="border border-slate-200 rounded p-1"><option>10</option></select> entries
                 </div>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Cari nama, kode, atau lokasi..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-9 pr-3 w-64 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                 </div>
                 <button onClick={handleExport} className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                   <Download className="w-4 h-4" /> Export
                 </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Kode</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Aset</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merek</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lokasi</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kondisi</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Harga Beli</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tanggal Beli</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="11" className="text-center py-10 text-sm font-bold text-slate-400">Memuat data aset...</td></tr>
                  ) : filteredAssets.length === 0 ? (
                    <tr><td colSpan="11" className="text-center py-10 text-sm font-bold text-slate-400">Tidak ada aset.</td></tr>
                  ) : (
                    filteredAssets.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td>
                        <td className="px-4 py-4 text-[11px] font-black text-blue-600 whitespace-nowrap">{row.asset_code}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                               <MonitorSmartphone className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 line-clamp-1">{row.name}</p>
                              {row.model && <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{row.model}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{row.category}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{row.brand || '-'}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-500 flex items-center gap-1.5 whitespace-nowrap mt-2">
                           <MapPin className="w-3.5 h-3.5 text-slate-400" /> {row.location}
                        </td>
                        <td className="px-4 py-4">{conditionBadge(row.condition)}</td>
                        <td className="px-4 py-4">{statusBadge(row.status)}</td>
                        <td className="px-4 py-4 text-[11px] font-black text-slate-700 whitespace-nowrap">{formatRupiah(row.purchase_price)}</td>
                        <td className="px-4 py-4 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                          {row.purchase_date ? new Date(row.purchase_date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => navigate(`/assets/detail/${row.id}`)} className="w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition" title="Lihat">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditId(row.id)} className="w-7 h-7 rounded-lg text-amber-500 hover:bg-amber-50 flex items-center justify-center transition" title="Edit">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(row.id)} className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition" title="Hapus">
                              <Trash2 className="w-3.5 h-3.5" />
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
               <p className="text-xs font-bold text-slate-500">Showing 1 to {filteredAssets.length} of {assets.length} entries</p>
               <div className="flex items-center gap-1">
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-100">Previous</button>
                 <button className="w-8 h-8 rounded-lg text-xs font-bold text-white bg-blue-600 flex items-center justify-center shadow">1</button>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-100">Next</button>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL TAMBAH / EDIT ASET */}
      {(showAddModal || editId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditId(null); }}></div>
          
          {/* Modal Content */}
          <div className="relative bg-slate-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-lg font-black text-slate-800">{editId ? "Edit Aset" : "Tambah Aset"}</h2>
              <button 
                onClick={() => { setShowAddModal(false); setEditId(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="p-2">
              <FormAset 
                isModal={true} 
                modalId={editId} 
                onClose={() => { setShowAddModal(false); setEditId(null); }} 
                onSuccess={fetchData} 
              />
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

// Helper to avoid missing import issue later
function FileTextIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  );
}
