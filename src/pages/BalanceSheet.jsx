import React, { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import {
  Building2,
  CreditCard,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  FileText,
  Calendar,
  PieChart as PieIcon,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Printer,
  RefreshCw
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
import * as XLSX from "xlsx-js-style";
import { getRealFinancialData } from "../services/realFinancialService";

// Helper format angka Rupiah standar akuntansi
const formatNum = (val, withPrefix = false) => {
  if (val === null || val === undefined) return withPrefix ? "Rp 0" : "0";
  const isNeg = val < 0;
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("id-ID").format(absVal);
  if (withPrefix) {
    return isNeg ? `(Rp ${formatted})` : `Rp ${formatted}`;
  }
  return isNeg ? `(${formatted})` : formatted;
};

export default function BalanceSheetPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Oktober 2026");
  const [comparePeriod, setComparePeriod] = useState("September 2026");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dengarkan event storage agar jika user menambah/mengedit transaksi atau invoice di tab lain, laporan langsung re-render
  useEffect(() => {
    const handleStorageChange = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ── KALKULASI DATA NERACA 100% DARI TRANSAKSI RIIL SISTEM ──
  const realReport = useMemo(() => {
    return getRealFinancialData(selectedPeriod, comparePeriod);
  }, [selectedPeriod, comparePeriod, refreshTrigger]);

  const { balanceSheet, kpis, ratios, compositions } = realReport;

  // ── EXPORT EXCEL DENGAN STYLING RAPI ──
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["LPK CREATIVA BRIDGING INTERNATIONAL"],
      ["LAPORAN POSISI KEUANGAN (NERACA / BALANCE SHEET) - DATA RIIL OPERASIONAL"],
      [`Periode: ${selectedPeriod} | Pembanding: ${comparePeriod}`],
      [""],
      ["AKUN", "CATATAN", `OKT 2026 (IDR)`, `SEP 2026 (IDR)`, "PERUBAHAN", "%"],
      ["A. ASET (ASSETS)", "", "", "", "", ""],
      ["Aset Lancar (Current Assets)", "", balanceSheet.totAsetLancarOkt, balanceSheet.totAsetLancarSep, balanceSheet.diffAsetLancar, `${balanceSheet.pctAsetLancar}%`],
    ];

    balanceSheet.asetLancar.forEach((item) => {
      rows.push([`  ${item.nama}`, item.catatan, item.okt, item.sep, item.diff, `${item.pct.toFixed(1)}%`]);
    });

    rows.push(["Aset Tidak Lancar (Non-Current Assets)", "", balanceSheet.totAsetTidakLancarOkt, balanceSheet.totAsetTidakLancarSep, balanceSheet.diffAsetTidakLancar, `${balanceSheet.pctAsetTidakLancar}%`]);
    balanceSheet.asetTidakLancar.forEach((item) => {
      rows.push([`  ${item.nama}`, item.catatan, item.okt, item.sep, item.diff, `${item.pct.toFixed(1)}%`]);
    });

    rows.push(["TOTAL ASET", "", balanceSheet.totalAsetOkt, balanceSheet.totalAsetSep, balanceSheet.diffTotalAset, `${balanceSheet.pctTotalAset}%`]);
    rows.push([""]);

    rows.push(["B. LIABILITAS (LIABILITIES)", "", "", "", "", ""]);
    rows.push(["Liabilitas Jangka Pendek (Current Liabilities)", "", balanceSheet.totLiabPendekOkt, balanceSheet.totLiabPendekSep, balanceSheet.diffLiabPendek, `${balanceSheet.pctLiabPendek}%`]);
    balanceSheet.liabilitasPendek.forEach((item) => {
      rows.push([`  ${item.nama}`, item.catatan, item.okt, item.sep, item.diff, `${item.pct.toFixed(1)}%`]);
    });

    rows.push(["Liabilitas Jangka Panjang (Non-Current Liabilities)", "", balanceSheet.totLiabPanjangOkt, balanceSheet.totLiabPanjangSep, balanceSheet.diffLiabPanjang, `${balanceSheet.pctLiabPanjang}%`]);
    balanceSheet.liabilitasPanjang.forEach((item) => {
      rows.push([`  ${item.nama}`, item.catatan, item.okt, item.sep, item.diff, `${item.pct.toFixed(1)}%`]);
    });

    rows.push(["TOTAL LIABILITAS", "", balanceSheet.totalLiabilitasOkt, balanceSheet.totalLiabilitasSep, balanceSheet.diffTotalLiab, `${balanceSheet.pctTotalLiab}%`]);
    rows.push([""]);

    rows.push(["C. EKUITAS (EQUITY)", "", "", "", "", ""]);
    balanceSheet.ekuitas.forEach((item) => {
      rows.push([`  ${item.nama}`, item.catatan || "", item.okt, item.sep, item.diff, `${item.pct.toFixed(1)}%`]);
    });
    rows.push(["TOTAL EKUITAS", "", balanceSheet.totalEkuitasOkt, balanceSheet.totalEkuitasSep, balanceSheet.diffTotalEkuitas, `${balanceSheet.pctTotalEkuitas}%`]);
    rows.push(["TOTAL LIABILITAS & EKUITAS", "", balanceSheet.totalLiabEkuitasOkt, balanceSheet.totalLiabEkuitasSep, balanceSheet.diffTotalLiabEkuitas, `${balanceSheet.pctTotalLiabEkuitas}%`]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
    XLSX.writeFile(wb, `Balance_Sheet_LPK_Creativa_${selectedPeriod.replace(/\s+/g, "_")}.xlsx`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-6 space-y-6">
        {/* ── HEADER NAVIGATION & CONTROLS ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <span>Keuangan</span>
              <span>&gt;</span>
              <span>Reports</span>
              <span>&gt;</span>
              <span className="text-slate-800 font-semibold">Balance Sheet</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Balance Sheet (Neraca)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Data Riil Terverifikasi
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Posisi keuangan LPK Creativa pada periode tertentu (dikalkulasi otomatis dari transaksi riil)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Periode Utama */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
              <span className="text-slate-400">Periode</span>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Oktober 2026">Oktober 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="Agustus 2026">Agustus 2026</option>
                </select>
              </div>
            </div>

            {/* Bandingkan Dengan */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
              <span className="text-slate-400">Bandingkan dengan</span>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={comparePeriod}
                  onChange={(e) => setComparePeriod(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="September 2026">September 2026</option>
                  <option value="Agustus 2026">Agustus 2026</option>
                  <option value="Juli 2026">Juli 2026</option>
                </select>
              </div>
            </div>

            {/* Refresh Live Button */}
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              title="Sinkronisasi data transaksi terbaru"
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Tombol Export Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            {/* Tombol Cetak PDF */}
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* ── 4 KPI CARDS (TOP ROW) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Aset */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Aset</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatNum(balanceSheet.totalAsetOkt, true)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{balanceSheet.pctTotalAset}% vs Sep 2026</span>
              </div>
            </div>
          </div>

          {/* 2. Total Liabilitas */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Liabilitas</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatNum(balanceSheet.totalLiabilitasOkt, true)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-rose-600">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{balanceSheet.pctTotalLiab}% vs Sep 2026</span>
              </div>
            </div>
          </div>

          {/* 3. Total Ekuitas */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Ekuitas</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatNum(balanceSheet.totalEkuitasOkt, true)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{balanceSheet.pctTotalEkuitas}% vs Sep 2026</span>
              </div>
            </div>
          </div>

          {/* 4. Rasio Lancar */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Rasio Lancar (Current Ratio)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.currentRatio.toFixed(2).replace(".", ",")}</p>
                <p className="text-[11px] text-slate-400 mt-1">Aset Lancar / Liabilitas Lancar</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
              {kpis.currentRatioStatus}
            </span>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID (LEFT: TABLE 8/12, RIGHT: CHARTS 4/12) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT COLUMN (8/12): DETAIL BALANCE SHEET TABLE ── */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Detail Balance Sheet</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Satuan: Indonesian Rupiah (IDR)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/50">
                    <th className="py-3 px-4 text-left">AKUN</th>
                    <th className="py-3 px-3 text-center">CATATAN</th>
                    <th className="py-3 px-4 text-right">OKT 2026 (IDR)</th>
                    <th className="py-3 px-4 text-right">SEP 2026 (IDR)</th>
                    <th className="py-3 px-4 text-right">PERUBAHAN</th>
                    <th className="py-3 px-4 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* ── A. ASET (ASSETS) ── */}
                  <tr className="bg-blue-50/60 font-bold text-blue-900">
                    <td colSpan={6} className="py-2.5 px-4 tracking-wide">
                      A. ASET (ASSETS)
                    </td>
                  </tr>

                  {/* Subheader: Aset Lancar */}
                  <tr className="font-bold text-slate-800 bg-slate-50/30">
                    <td className="py-2.5 px-4">Aset Lancar (Current Assets)</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totAsetLancarOkt)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totAsetLancarSep)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.diffAsetLancar)}</td>
                    <td className="py-2.5 px-4 text-right">{balanceSheet.pctAsetLancar}%</td>
                  </tr>
                  {/* Items Aset Lancar */}
                  {balanceSheet.asetLancar.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 text-slate-700 transition-colors">
                      <td className="py-2 px-8">{item.nama}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{item.catatan}</td>
                      <td className="py-2 px-4 text-right font-medium">{formatNum(item.okt)}</td>
                      <td className="py-2 px-4 text-right text-slate-500">{formatNum(item.sep)}</td>
                      <td className={`py-2 px-4 text-right ${item.diff < 0 ? "text-rose-600 font-medium" : "text-slate-700"}`}>
                        {formatNum(item.diff)}
                      </td>
                      <td className={`py-2 px-4 text-right ${item.pct < 0 ? "text-rose-600" : "text-slate-600"}`}>
                        {item.pct.toFixed(1).replace(".", ",")}%
                      </td>
                    </tr>
                  ))}

                  {/* Subheader: Aset Tidak Lancar */}
                  <tr className="font-bold text-slate-800 bg-slate-50/30">
                    <td className="py-2.5 px-4">Aset Tidak Lancar (Non-Current Assets)</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totAsetTidakLancarOkt)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totAsetTidakLancarSep)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.diffAsetTidakLancar)}</td>
                    <td className="py-2.5 px-4 text-right">{balanceSheet.pctAsetTidakLancar}%</td>
                  </tr>
                  {/* Items Aset Tidak Lancar */}
                  {balanceSheet.asetTidakLancar.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 text-slate-700 transition-colors">
                      <td className="py-2 px-8">{item.nama}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{item.catatan}</td>
                      <td className={`py-2 px-4 text-right font-medium ${item.okt < 0 ? "text-slate-700" : ""}`}>
                        {formatNum(item.okt)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500">{formatNum(item.sep)}</td>
                      <td className={`py-2 px-4 text-right ${item.diff < 0 ? "text-slate-700 font-medium" : "text-slate-700"}`}>
                        {formatNum(item.diff)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-600">
                        {item.pct.toFixed(1).replace(".", ",")}%
                      </td>
                    </tr>
                  ))}

                  {/* TOTAL ASET ROW */}
                  <tr className="bg-blue-100/70 font-bold text-blue-900 border-t-2 border-blue-200">
                    <td className="py-3 px-4">TOTAL ASET</td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-4 text-right font-extrabold">{formatNum(balanceSheet.totalAsetOkt)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(balanceSheet.totalAsetSep)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(balanceSheet.diffTotalAset)}</td>
                    <td className="py-3 px-4 text-right">{balanceSheet.pctTotalAset}%</td>
                  </tr>

                  {/* ── B. LIABILITAS (LIABILITIES) ── */}
                  <tr className="bg-blue-50/60 font-bold text-blue-900">
                    <td colSpan={6} className="py-2.5 px-4 tracking-wide">
                      B. LIABILITAS (LIABILITIES)
                    </td>
                  </tr>

                  {/* Subheader: Liabilitas Jangka Pendek */}
                  <tr className="font-bold text-slate-800 bg-slate-50/30">
                    <td className="py-2.5 px-4">Liabilitas Jangka Pendek (Current Liabilities)</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totLiabPendekOkt)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totLiabPendekSep)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.diffLiabPendek)}</td>
                    <td className="py-2.5 px-4 text-right">{balanceSheet.pctLiabPendek}%</td>
                  </tr>
                  {balanceSheet.liabilitasPendek.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 text-slate-700 transition-colors">
                      <td className="py-2 px-8">{item.nama}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{item.catatan}</td>
                      <td className="py-2 px-4 text-right font-medium">{formatNum(item.okt)}</td>
                      <td className="py-2 px-4 text-right text-slate-500">{formatNum(item.sep)}</td>
                      <td className="py-2 px-4 text-right text-slate-700">{formatNum(item.diff)}</td>
                      <td className="py-2 px-4 text-right text-slate-600">{item.pct.toFixed(1).replace(".", ",")}%</td>
                    </tr>
                  ))}

                  {/* Subheader: Liabilitas Jangka Panjang */}
                  <tr className="font-bold text-slate-800 bg-slate-50/30">
                    <td className="py-2.5 px-4">Liabilitas Jangka Panjang (Non-Current Liabilities)</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totLiabPanjangOkt)}</td>
                    <td className="py-2.5 px-4 text-right">{formatNum(balanceSheet.totLiabPanjangSep)}</td>
                    <td className="py-2.5 px-4 text-right">0</td>
                    <td className="py-2.5 px-4 text-right">0,0%</td>
                  </tr>
                  {balanceSheet.liabilitasPanjang.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 text-slate-700 transition-colors">
                      <td className="py-2 px-8">{item.nama}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{item.catatan}</td>
                      <td className="py-2 px-4 text-right font-medium">{formatNum(item.okt)}</td>
                      <td className="py-2 px-4 text-right text-slate-500">{formatNum(item.sep)}</td>
                      <td className="py-2 px-4 text-right text-slate-700">0</td>
                      <td className="py-2 px-4 text-right text-slate-600">0,0%</td>
                    </tr>
                  ))}

                  {/* TOTAL LIABILITAS ROW */}
                  <tr className="bg-blue-100/70 font-bold text-blue-900 border-t-2 border-blue-200">
                    <td className="py-3 px-4">TOTAL LIABILITAS</td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-4 text-right font-extrabold">{formatNum(balanceSheet.totalLiabilitasOkt)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(balanceSheet.totalLiabilitasSep)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(balanceSheet.diffTotalLiab)}</td>
                    <td className="py-3 px-4 text-right">{balanceSheet.pctTotalLiab}%</td>
                  </tr>

                  {/* ── C. EKUITAS (EQUITY) ── */}
                  <tr className="bg-blue-50/60 font-bold text-blue-900">
                    <td colSpan={6} className="py-2.5 px-4 tracking-wide">
                      C. EKUITAS (EQUITY)
                    </td>
                  </tr>
                  {balanceSheet.ekuitas.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 text-slate-700 transition-colors">
                      <td className="py-2 px-8">{item.nama}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{item.catatan || "-"}</td>
                      <td className="py-2 px-4 text-right font-medium">{formatNum(item.okt)}</td>
                      <td className="py-2 px-4 text-right text-slate-500">{formatNum(item.sep)}</td>
                      <td className="py-2 px-4 text-right text-slate-700">{formatNum(item.diff)}</td>
                      <td className="py-2 px-4 text-right text-slate-600">{item.pct.toFixed(1).replace(".", ",")}%</td>
                    </tr>
                  ))}

                  {/* TOTAL EKUITAS ROW */}
                  <tr className="bg-blue-100/70 font-bold text-blue-900 border-t-2 border-blue-200">
                    <td className="py-3 px-4">TOTAL EKUITAS</td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-4 text-right font-extrabold">{formatNum(balanceSheet.totalEkuitasOkt)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(balanceSheet.totalEkuitasSep)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(balanceSheet.diffTotalEkuitas)}</td>
                    <td className="py-3 px-4 text-right">{balanceSheet.pctTotalEkuitas}%</td>
                  </tr>

                  {/* TOTAL LIABILITAS & EKUITAS ROW (BALANCED WITH TOTAL ASSETS!) */}
                  <tr className="bg-[#dbeafe] font-black text-blue-950 border-t-2 border-blue-300">
                    <td className="py-3.5 px-4 tracking-tight">TOTAL LIABILITAS &amp; EKUITAS</td>
                    <td className="py-3.5 px-3 text-center">-</td>
                    <td className="py-3.5 px-4 text-right font-black text-sm">{formatNum(balanceSheet.totalLiabEkuitasOkt)}</td>
                    <td className="py-3.5 px-4 text-right font-bold">{formatNum(balanceSheet.totalLiabEkuitasSep)}</td>
                    <td className="py-3.5 px-4 text-right font-bold">{formatNum(balanceSheet.diffTotalLiabEkuitas)}</td>
                    <td className="py-3.5 px-4 text-right font-bold">{balanceSheet.pctTotalLiabEkuitas}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT COLUMN (4/12): DONUT CHARTS & FINANCIAL RATIOS ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Komposisi Aset */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Komposisi Aset</h3>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Donut Chart with center label */}
                <div className="relative w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={compositions.assets}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {compositions.assets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `${val}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-800">{formatNum(balanceSheet.totalAsetOkt, true).replace("Rp ", "Rp ").split(".")[0]} jt</span>
                    <span className="text-[10px] text-slate-400">Total Aset</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-2 text-xs">
                  {compositions.assets.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{item.value.toFixed(1).replace(".", ",")}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Komposisi Liabilitas & Ekuitas */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Komposisi Liabilitas &amp; Ekuitas</h3>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Donut Chart with center label */}
                <div className="relative w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={compositions.liabEquity}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {compositions.liabEquity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `${val}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-800">{formatNum(balanceSheet.totalLiabEkuitasOkt, true).replace("Rp ", "Rp ").split(".")[0]} jt</span>
                    <span className="text-[10px] text-slate-400">Total</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-2 text-xs">
                  {compositions.liabEquity.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{item.value.toFixed(1).replace(".", ",")}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Rasio Keuangan */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Rasio Keuangan</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                    <th className="py-2.5 px-4 text-left">RASIO</th>
                    <th className="py-2.5 px-3 text-right">OKT 2026</th>
                    <th className="py-2.5 px-3 text-right">SEP 2026</th>
                    <th className="py-2.5 px-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ratios.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-700 font-medium">{item.nama}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.okt}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.sep}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            item.status === "Sehat"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : item.status === "Normal"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
