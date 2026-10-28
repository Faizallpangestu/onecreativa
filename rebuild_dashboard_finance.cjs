const fs = require('fs');

const code = `
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, TrendingDown, Wallet, Target, FileDown, 
  Calendar, BarChart2, PieChart, ArrowUpRight, ArrowDownRight,
  ChevronRight, Activity
} from "lucide-react";
import Layout from "../components/Layout";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import * as XLSX from "xlsx-js-style";

const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID ", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatShort(val) {
  if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(".0","") + "Jt";
  if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(0) + "Rb";
  return val;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 shadow-xl rounded-xl px-4 py-3 text-sm">
        <p className="font-bold text-slate-600 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-black text-[13px] flex items-center justify-between gap-4">
            <span>{p.name}</span>
            <span>{formatCurrency(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardFinance() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await axios.get(\`/api/finance.php?year=\${year}\`);
        setAllData(res.data?.data || []);
      } catch (e) {
        console.error("Failed to fetch finance data:", e);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year]);

  // Aggregate by month
  const monthlyData = BULAN.map((bulan, idx) => {
    const monthRecords = allData.filter(r => {
      const d = new Date(r.transaction_date);
      return d.getMonth() === idx;
    });
    const pemasukan = monthRecords.filter(r => r.type === "income").reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const pengeluaran = monthRecords.filter(r => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    return { bulan, pemasukan, pengeluaran, rataPemasukan: pemasukan * 0.8, rataPengeluaran: pengeluaran * 0.8 }; // mocked average
  });

  const totalPemasukan = allData.filter(r => r.type === "income").reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalPengeluaran = allData.filter(r => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalSaldo = totalPemasukan - totalPengeluaran;

  // Saldo kumulatif
  const saldoKumulatif = [];
  let runningBalance = 0;
  monthlyData.forEach(m => {
    runningBalance += (m.pemasukan - m.pengeluaran);
    saldoKumulatif.push({ 
      bulan: m.bulan, 
      saldo: runningBalance,
      pertumbuhan: runningBalance * 1.05 // mocked growth
    });
  });

  // Anggaran Data
  let kasAwal = 5000000;
  let totalAnggaran = 0;
  try {
    const savedKas = localStorage.getItem("anggaran_kas");
    if (savedKas) kasAwal = Number(savedKas);
    
    const savedData = localStorage.getItem("anggaran_data");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      totalAnggaran = parsed.reduce((sum, item) => sum + (item.total || 0), 0);
    }
  } catch(e) {}

  const anggaranData = monthlyData.map(m => ({
    bulan: m.bulan,
    realisasi: m.pengeluaran * 0.7, // mock realisasi
    target: kasAwal / 12 // mock target
  }));

  const handleExportAll = () => {
    const workbook = XLSX.utils.book_new();

    const GREEN = "4CAF50";
    const DARK_GREEN = "388E3C";
    const WHITE = "FFFFFF";
    const LIGHT_GREY = "F5F5F5";
    const BORDER_COLOR = "BDBDBD";

    const thin = { style: "thin", color: { rgb: BORDER_COLOR } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

    const createStyledSheet = (title, headersList, dataRows, colWidths) => {
      const sheetData = [
        [title],
        [\`Tanggal Export: \${new Date().toLocaleDateString("id-ID")}\`],
        [],
        headersList,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      const setStyle = (r, c, style) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { v: "", t: "s" };
        ws[ref].s = style;
      };

      setStyle(0, 0, {
        font: { bold: true, sz: 14, color: { rgb: DARK_GREEN } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "E8F5E9" } },
      });
      setStyle(1, 0, {
        font: { sz: 10, color: { rgb: "616161" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "F1F8E9" } },
      });

      for (let c = 0; c < headersList.length; c++) {
        setStyle(3, c, {
          font: { bold: true, sz: 11, color: { rgb: WHITE } },
          fill: { fgColor: { rgb: GREEN } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderAll,
        });
      }

      for (let i = 0; i < dataRows.length; i++) {
        const r = 4 + i;
        const bgColor = i % 2 === 0 ? WHITE : LIGHT_GREY;
        for (let c = 0; c < headersList.length; c++) {
          setStyle(r, c, {
            font: { sz: 10 },
            fill: { fgColor: { rgb: bgColor } },
            alignment: { horizontal: c===0 ? "center" : "left", vertical: "center" },
            border: borderAll,
          });
        }
      }

      ws["!cols"] = colWidths;
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headersList.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headersList.length - 1 } },
      ];
      ws["!freeze"] = { xSplit: 0, ySplit: 4 };

      return ws;
    };

    const incomeData = allData.filter(r => r.type === "income").map((r, i) => [
      i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.source || "-", r.description || "-", parseFloat(r.amount || 0)
    ]);
    const wsIncome = createStyledSheet("LAPORAN TRANSAKSI PEMASUKAN", ["NO", "TANGGAL", "KATEGORI", "SUMBER", "DESKRIPSI", "NOMINAL (Rp)"], incomeData, [{wch:5}, {wch:15}, {wch:22}, {wch:22}, {wch:40}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsIncome, "Pemasukan");

    const expenseData = allData.filter(r => r.type === "expense").map((r, i) => [
      i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.recipient || "-", r.description || "-", parseFloat(r.amount || 0)
    ]);
    const wsExpense = createStyledSheet("LAPORAN TRANSAKSI PENGELUARAN", ["NO", "TANGGAL", "KATEGORI", "PENERIMA", "DESKRIPSI", "NOMINAL (Rp)"], expenseData, [{wch:5}, {wch:15}, {wch:22}, {wch:22}, {wch:40}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsExpense, "Pengeluaran");

    const profitData = allData.map((r, i) => [
      i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.type==='income'?'Pemasukan':'Pengeluaran', r.category || "-", r.description || "-", parseFloat(r.amount || 0)
    ]);
    const wsProfit = createStyledSheet("LAPORAN LABA RUGI (PROFIT)", ["NO", "TANGGAL", "JENIS", "KATEGORI", "DESKRIPSI", "NOMINAL (Rp)"], profitData, [{wch:5}, {wch:15}, {wch:15}, {wch:22}, {wch:40}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsProfit, "Laba Rugi");

    let anggaranDataSheet = [];
    try {
      const saved = localStorage.getItem("anggaran_data");
      if (saved) {
        anggaranDataSheet = JSON.parse(saved).map((r, i) => [
           i + 1, new Date().toLocaleDateString("id-ID"), r.category || "-", r.description || "-", r.status || "-", parseFloat(r.total || 0)
        ]);
      }
    } catch(e) {}
    const wsAnggaran = createStyledSheet("LAPORAN ANGGARAN & BIAYA", ["NO", "TANGGAL", "KATEGORI", "DESKRIPSI", "STATUS", "NOMINAL (Rp)"], anggaranDataSheet, [{wch:5}, {wch:15}, {wch:22}, {wch:40}, {wch:15}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsAnggaran, "Keuangan");

    XLSX.writeFile(workbook, \`Master_Laporan_Finance_\${new Date().getTime()}.xlsx\`);
  };

  const kpiCards = [
    {
      label: "Saldo Saat Ini",
      value: formatCurrency(totalSaldo),
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
      iconBg: "bg-blue-100",
      trend: "+0% dari tahun lalu",
      trendColor: "text-emerald-500",
      chartIcon: "text-blue-200"
    },
    {
      label: "Total Pemasukan",
      value: formatCurrency(totalPemasukan),
      icon: ArrowUpRight,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
      iconBg: "bg-emerald-100",
      trend: "+0% dari tahun lalu",
      trendColor: "text-emerald-500",
      chartIcon: "text-emerald-200"
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(totalPengeluaran),
      icon: ArrowDownRight,
      color: "text-rose-600",
      bg: "bg-rose-50/50",
      iconBg: "bg-rose-100",
      trend: "+0% dari tahun lalu",
      trendColor: "text-emerald-500",
      chartIcon: "text-rose-200"
    },
    {
      label: "Total Anggaran",
      value: formatCurrency(kasAwal), // Use kasAwal as the real budget modal
      icon: PieChart,
      color: "text-purple-600",
      bg: "bg-purple-50/50",
      iconBg: "bg-purple-100",
      trend: "+0% dari tahun lalu",
      trendColor: "text-emerald-500",
      chartIcon: "text-purple-200"
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span className="text-slate-800">Dashboard</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span>Keuangan</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span>Dashboard</span>
        </div>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50/30 rounded-2xl p-6 md:p-8 flex items-center justify-between overflow-hidden border border-blue-100/50">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <BarChart2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 mb-2">Ringkasan Keuangan</h1>
              <p className="text-slate-500 font-medium text-sm md:text-base">
                Pantau performa keuangan dan anggaran LPK dengan mudah dan real-time.
              </p>
            </div>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none opacity-20">
             <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
             <div className="absolute bottom-[-20px] right-[40px] w-32 h-32 bg-indigo-400 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-600">Periode</span>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-sm font-black text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportAll} 
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              <FileDown className="w-4 h-4" /> Export Semua Laporan (Excel)
            </button>
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              <FileDown className="w-4 h-4" /> Download Excel
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {kpiCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className={\`\${card.bg} rounded-2xl p-5 relative overflow-hidden border border-white/50 shadow-sm\`}>
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${card.iconBg} mb-4\`}>
                          <Icon className={\`w-5 h-5 \${card.color}\`} strokeWidth={2.5} />
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 mb-1">{card.label}</p>
                        <p className={\`text-xl font-black \${card.color} mb-3\`}>{card.value}</p>
                        <p className={\`text-[11px] font-bold flex items-center gap-1 \${card.trendColor}\`}>
                          <TrendingUp className="w-3 h-3" strokeWidth={3} /> {card.trend}
                        </p>
                      </div>
                    </div>
                    {/* Background icon for aesthetic */}
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-40 pointer-events-none">
                      <BarChart2 className={\`w-24 h-24 \${card.chartIcon}\`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tren Pemasukan */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                    </div>
                    <h2 className="text-[15px] font-black text-slate-800">Tren Pemasukan</h2>
                  </div>
                  <div className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600">
                    Tahun {year} <ChevronDown className="w-3 h-3 inline-block ml-1" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                    <Line name="Pemasukan" type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    <Line name="Rata-rata" type="monotone" dataKey="rataPemasukan" stroke="#86efac" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tren Pengeluaran */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4 text-rose-600" strokeWidth={3} />
                    </div>
                    <h2 className="text-[15px] font-black text-slate-800">Tren Pengeluaran</h2>
                  </div>
                  <div className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600">
                    Tahun {year} <ChevronDown className="w-3 h-3 inline-block ml-1" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                    <Line name="Pengeluaran" type="monotone" dataKey="pengeluaran" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    <Line name="Rata-rata" type="monotone" dataKey="rataPengeluaran" stroke="#fda4af" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pertumbuhan Saldo */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-indigo-600" strokeWidth={3} />
                    </div>
                    <h2 className="text-[15px] font-black text-slate-800">Pertumbuhan Saldo (Bulanan)</h2>
                  </div>
                  <div className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600">
                    Tahun {year} <ChevronDown className="w-3 h-3 inline-block ml-1" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={saldoKumulatif} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                    <Line name="Saldo Akhir" type="monotone" dataKey="saldo" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    <Line name="Pertumbuhan" type="monotone" dataKey="pertumbuhan" stroke="#a5b4fc" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Realisasi Anggaran */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-amber-600" strokeWidth={3} />
                    </div>
                    <h2 className="text-[15px] font-black text-slate-800">Realisasi Anggaran</h2>
                  </div>
                  <div className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600">
                    Tahun {year} <ChevronDown className="w-3 h-3 inline-block ml-1" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={anggaranData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                    <Line name="Realisasi" type="monotone" dataKey="realisasi" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    <Line name="Target Anggaran" type="monotone" dataKey="target" stroke="#fcd34d" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
`;

fs.writeFileSync('src/pages/DashboardFinance.jsx', code);
