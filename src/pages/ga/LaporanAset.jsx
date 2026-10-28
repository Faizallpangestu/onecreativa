import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Download, Filter, PieChart, BarChart2,
  Package, CheckCircle, Wrench, XCircle, UserCheck,
  TrendingUp, Calendar, RefreshCw, FileText, ArrowRightLeft, ShieldCheck
} from "lucide-react";
import { PieChart as RechartPie, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import Layout from "../../components/Layout";
import api from "../../services/api";
import * as XLSX from "xlsx-js-style";
import { useSEO } from "../../hooks/useSEO";

const CONDITION_COLORS = {
  "Baik"        : "#10b981",
  "Rusak Ringan": "#f59e0b",
  "Rusak Berat" : "#f97316",
  "Tidak Layak" : "#ef4444",
};
const STATUS_COLORS = {
  "Aktif"      : "#3b82f6",
  "Maintenance": "#8b5cf6",
  "Tidak Aktif": "#94a3b8",
  "Dipinjam"   : "#ec4899",
};

function formatRp(val) {
  return "Rp " + Number(val).toLocaleString("id-ID");
}

export default function LaporanAset() {
  const navigate = useNavigate();
  
  

  useSEO({ title: "Laporan Aset", description: "Laporan statistik dan ringkasan aset perusahaan" });

  const [stats, setStats]   = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("Semua");
  const [filterCond, setFilterCond] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [showFilter, setShowFilter] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCat    !== "Semua") params.category  = filterCat;
      if (filterCond   !== "Semua") params.condition  = filterCond;
      if (filterStatus !== "Semua") params.status     = filterStatus;

      const [statsRes, listRes] = await Promise.all([
        api.get("/assets.php", { params: { stats: 1 } }),
        api.get("/assets.php", { params }),
      ]);
      setStats(statsRes.data?.data || null);
      setAssets(listRes.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterCat, filterCond, filterStatus]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryRows = [
      ["LAPORAN ASET PERUSAHAAN"],
      ["Tanggal", new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })],
      [""],
      ["RINGKASAN", ""],
      ["Total Aset", stats?.total || 0],
      ["Aset Aktif", stats?.aktif || 0],
      ["Maintenance", stats?.maintenance || 0],
      ["Tidak Aktif", stats?.tidak_aktif || 0],
      ["Dipinjam", stats?.dipinjam || 0],
      ["Nilai Total Aset", formatRp(stats?.nilai_total || 0)],
      [""],
      ["STATISTIK RIWAYAT (Total Aktivitas)", ""],
      ["Total Perpindahan", stats?.riwayat?.pindah || 0],
      ["Total Peminjaman", stats?.riwayat?.pinjam || 0],
      ["Total Maintenance", stats?.riwayat?.maintenance || 0],
      ["Total Cek Fisik (Stock Opname)", stats?.riwayat?.cek_fisik || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    // Sheet 2: Daftar Aset
    const rows = assets.map((a, i) => ({
      "No"           : i + 1,
      "Kode Aset"    : a.asset_code,
      "Nama Aset"    : a.name,
      "Kategori"     : a.category,
      "Merek"        : a.brand || "-",
      "Model"        : a.model || "-",
      "Serial Number": a.serial_number || "-",
      "Lokasi"       : a.location,
      "Kondisi"      : a.condition,
      "Status"       : a.status,
      "Harga Beli"   : a.purchase_price ? Number(a.purchase_price) : 0,
      "Tgl Beli"     : a.purchase_date || "-",
    }));
    const wsAssets = XLSX.utils.json_to_sheet(rows);
    wsAssets["!cols"] = [5,18,30,15,15,15,20,20,15,15,18,12].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsAssets, "Daftar Aset");

    // Sheet 3: Per Kategori
    if (stats?.per_kategori) {
      const catRows = [["Kategori", "Jumlah"], ...(stats.per_kategori.map(c => [c.category, Number(c.jumlah)]))];
      const wsCat = XLSX.utils.aoa_to_sheet(catRows);
      XLSX.utils.book_append_sheet(wb, wsCat, "Per Kategori");
    }

    XLSX.writeFile(wb, `Laporan_Aset_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const statCards = [
    { label: "Total Aset", value: stats?.total || 0, icon: Package, color: "text-blue-700", bg: "from-blue-50 to-indigo-50", border: "border-blue-100" },
    { label: "Aktif", value: stats?.aktif || 0, icon: CheckCircle, color: "text-emerald-700", bg: "from-emerald-50 to-teal-50", border: "border-emerald-100" },
    { label: "Maintenance", value: stats?.maintenance || 0, icon: Wrench, color: "text-purple-700", bg: "from-purple-50 to-violet-50", border: "border-purple-100" },
    { label: "Tidak Aktif", value: stats?.tidak_aktif || 0, icon: XCircle, color: "text-slate-600", bg: "from-slate-50 to-slate-100", border: "border-slate-200" },
    { label: "Dipinjam", value: stats?.dipinjam || 0, icon: UserCheck, color: "text-pink-700", bg: "from-pink-50 to-rose-50", border: "border-pink-100" },
    { label: "Nilai Total", value: formatRp(stats?.nilai_total || 0), icon: TrendingUp, color: "text-amber-700", bg: "from-amber-50 to-orange-50", border: "border-amber-100" },
  ];

  const riwayatCards = [
    { label: "Total Perpindahan", value: stats?.riwayat?.pindah || 0, icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Peminjaman", value: stats?.riwayat?.pinjam || 0, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Maintenance", value: stats?.riwayat?.maintenance || 0, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Cek Fisik", value: stats?.riwayat?.cek_fisik || 0, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const pieKategori = (stats?.per_kategori || []).map((c, i) => ({
    name: c.category, value: Number(c.jumlah),
    fill: ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#64748b"][i % 6]
  }));
  const pieKondisi = (stats?.per_kondisi || []).map((c) => ({
    name: c.condition, value: Number(c.jumlah), fill: CONDITION_COLORS[c.condition] || "#94a3b8"
  }));

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-24">
        {/* Header Flat Banner */}
        <div className="bg-white border-b border-slate-200 py-4">
          <div className="px-5 sm:px-8 flex justify-end gap-4">
            <div className="flex gap-2">
              <button onClick={fetchData} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-slate-700">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 mt-5">

          {/* Stat Cards */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className={`text-[11px] font-bold ${s.color} uppercase tracking-wide`}>{s.label}</span>
                  </div>
                  <span className={`text-2xl font-black ${s.color}`}>{loading ? "—" : s.value}</span>
                </div>
              );
            })}
          </div>

          {/* Activity/History Stats */}
          {!loading && stats && (
            <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Ringkasan Aktivitas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {riwayatCards.map((rc, i) => {
                  const Icon = rc.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${rc.bg} rounded-xl flex items-center justify-center flex-none`}>
                        <Icon className={`w-5 h-5 ${rc.color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{rc.label}</p>
                        <p className="text-lg font-black text-slate-700">{rc.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="mt-5 flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800">Analitik</h2>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all ${showFilter ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          {showFilter && (
            <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label:"Kategori", value:filterCat, onChange:setFilterCat, opts:["Semua","Elektronik","Furniture","Kendaraan","Alat Tulis","Peralatan Dapur","Lainnya"] },
                { label:"Kondisi",  value:filterCond, onChange:setFilterCond, opts:["Semua","Baik","Rusak Ringan","Rusak Berat","Tidak Layak"] },
                { label:"Status",   value:filterStatus, onChange:setFilterStatus, opts:["Semua","Aktif","Maintenance","Tidak Aktif","Dipinjam"] },
              ].map((f,i) => (
                <div key={i}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">{f.label}</label>
                  <select value={f.value} onChange={(e) => f.onChange(e.target.value)} className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300">
                    {f.opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          {!loading && stats && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Pie: Per Kategori */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-blue-500" /> Per Kategori</h3>
                {pieKategori.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartPie>
                      <Pie data={pieKategori} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {pieKategori.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v, "Aset"]} />
                    </RechartPie>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm text-center py-8">Tidak ada data</p>}
              </div>

              {/* Pie: Per Kondisi */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-amber-500" /> Per Kondisi</h3>
                {pieKondisi.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartPie>
                      <Pie data={pieKondisi} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                        {pieKondisi.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm text-center py-8">Tidak ada data</p>}
              </div>

              {/* Bar: Kategori */}
              {pieKategori.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:col-span-2">
                  <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-indigo-500" /> Distribusi Aset per Kategori</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pieKategori} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip formatter={(v) => [v, "Aset"]} />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {pieKategori.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Tabel Daftar Aset */}
          <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Daftar Aset ({assets.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Kode","Nama Aset","Kategori","Lokasi","Kondisi","Status","Harga Beli"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <tr key={i}>
                        {Array(7).fill(0).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : assets.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium">Tidak ada data aset</td></tr>
                  ) : (
                    assets.map((a) => (
                      <tr key={a.id} onClick={() => navigate(`/assets/detail/${a.id}`)} className="border-b border-slate-50 hover:bg-blue-50/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-bold text-blue-600 text-xs whitespace-nowrap">{a.asset_code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap max-w-[160px] truncate">{a.name}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.category}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[120px] truncate">{a.location}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${{
                            "Baik": "bg-emerald-50 text-emerald-700 border-emerald-200",
                            "Rusak Ringan": "bg-amber-50 text-amber-700 border-amber-200",
                            "Rusak Berat": "bg-orange-50 text-orange-700 border-orange-200",
                            "Tidak Layak": "bg-red-50 text-red-700 border-red-200",
                          }[a.condition] || ""}`}>{a.condition}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${{
                            "Aktif": "bg-blue-50 text-blue-700 border-blue-200",
                            "Maintenance": "bg-purple-50 text-purple-700 border-purple-200",
                            "Tidak Aktif": "bg-slate-100 text-slate-500 border-slate-200",
                            "Dipinjam": "bg-pink-50 text-pink-700 border-pink-200",
                          }[a.status] || ""}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{formatRp(a.purchase_price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
