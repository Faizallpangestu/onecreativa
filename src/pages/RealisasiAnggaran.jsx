import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, TrendingUp, CheckCircle2, Clock, Plus,
  Search, RefreshCw, FileDown, ShieldCheck, Wallet,
  Calendar, Building2, Tag, Eye, ArrowUpRight, DollarSign,
  AlertTriangle, Check, X, FileText, Image as ImageIcon,
  ChevronRight, UploadCloud
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx-js-style";
import Layout from "../components/Layout";
import useBudgetRequests from "../hooks/useBudgetRequests";
import {
  budgetReference, formatBudgetMoney, formatBudgetMonth,
  formatBudgetDate, DEFAULT_REAL_BUDGETS
} from "../utils/budgetApi";
import "./AnggaranBiaya.css";

const formatRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function RealisasiAnggaran() {
  const navigate = useNavigate();
  const { requests, isLoading, error, refresh } = useBudgetRequests();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Semua Departemen");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [selectedBudgetForDetail, setSelectedBudgetForDetail] = useState(null);
  const [showRealizeModal, setShowRealizeModal] = useState(false);
  const [targetBudgetForRealize, setTargetBudgetForRealize] = useState(null);

  // Form State Catat Realisasi Cepat
  const [formRealize, setFormRealize] = useState({
    budgetId: "",
    nominal: "",
    tanggal: new Date().toISOString().slice(0, 10),
    deskripsi: "",
    sumberDana: "Bank BCA Operasional",
    vendor: "",
    buktiFoto: ""
  });

  // Ambil transaksi pengeluaran aktual dari local storage
  const [expenses, setExpenses] = useState(() => {
    try {
      const raw = localStorage.getItem("finance_expense_data");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 1, tanggal: "2026-10-01", kategori: "Pembelian", deskripsi: "Laptop Admin & Modul LMS", sumberDana: "Bank BCA Operasional", nominal: 7500000, status: "Paid", vendor: "Toko Office Equipment" },
      { id: 2, tanggal: "2026-10-02", kategori: "Operasional", deskripsi: "Biaya Listrik Kantor & Ruang Kelas", sumberDana: "Bank BCA Operasional", nominal: 1800000, status: "Paid", vendor: "PLN Persero" },
      { id: 3, tanggal: "2026-10-02", kategori: "Operasional", deskripsi: "Langganan Internet Dedicated Fiber 100 Mbps", sumberDana: "Bank BCA Operasional", nominal: 1500000, status: "Paid", vendor: "PT Maju Internet" },
      { id: 4, tanggal: "2026-10-03", kategori: "Operasional", deskripsi: "Air PDAM & Sanitasi Fasilitas Lembaga", sumberDana: "Petty Cash (Kasir)", nominal: 650000, status: "Paid", vendor: "PDAM Tirta" },
      { id: 5, tanggal: "2026-10-03", kategori: "Gaji Karyawan", deskripsi: "Honor Sensei Bahasa Jepang N5 & N4", sumberDana: "Bank BCA Operasional", nominal: 16000000, status: "Paid", vendor: "Sensei LPK" },
      { id: 6, tanggal: "2026-10-03", kategori: "Pembelian", deskripsi: "Modul Minna no Nihongo & Kotoba Cetak", sumberDana: "Petty Cash (Kasir)", nominal: 5500000, status: "Paid", vendor: "Percetakan Mitra" },
      { id: 7, tanggal: "2026-10-04", kategori: "Operasional", deskripsi: "Sewa Asrama Siswa Putra & Putri", sumberDana: "Bank BCA Operasional", nominal: 9000000, status: "Paid", vendor: "Pemilik Gedung Asrama" },
      { id: 8, tanggal: "2026-10-04", kategori: "Operasional", deskripsi: "Perawatan & Servis AC Asrama", sumberDana: "Petty Cash (Kasir)", nominal: 800000, status: "Paid", vendor: "CV Mandiri Teknik" }
    ];
  });

  // Sinkronkan daftar anggaran yang sudah disetujui (Approved)
  const approvedBudgets = useMemo(() => {
    const list = requests.filter(r =>
      ["approved", "partially_realized", "fully_realized", "closed"].includes(r.status) ||
      Number(r.approved_amount || 0) > 0
    );
    return list.length > 0 ? list : DEFAULT_REAL_BUDGETS.filter(b => b.status === "approved");
  }, [requests]);

  // Kalkulasi CFO Metrics Variance
  const cfoMetrics = useMemo(() => {
    const totalPagu = approvedBudgets.reduce((s, r) => s + Number(r.approved_amount || r.total_amount || 0), 0);
    const totalCommitted = approvedBudgets.reduce((s, r) => s + Number(r.committed_amount || 0), 0);
    const totalRealized = approvedBudgets.reduce((s, r) => s + Number(r.realized_amount || 0), 0);
    const totalSisa = Math.max(0, totalPagu - totalRealized);
    const absorptionRate = totalPagu > 0 ? Math.min(100, Math.round((totalRealized / totalPagu) * 100)) : 0;

    return {
      totalPagu,
      totalCommitted,
      totalRealized,
      totalSisa,
      absorptionRate
    };
  }, [approvedBudgets]);

  // Filter Table Realisasi
  const filteredBudgets = useMemo(() => {
    return approvedBudgets.filter(b => {
      const matchSearch = [
        b.title || "",
        b.department_name || "",
        budgetReference(b.id)
      ].some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchDept = deptFilter === "Semua Departemen" || (b.department_name && b.department_name === deptFilter);
      
      const approvedAmt = Number(b.approved_amount || b.total_amount || 0);
      const realizedAmt = Number(b.realized_amount || 0);
      const pct = approvedAmt > 0 ? Math.round((realizedAmt / approvedAmt) * 100) : 0;

      let statusCategory = "Efisien";
      if (pct > 95) statusCategory = "Overbudget";
      else if (pct > 75) statusCategory = "Waspada";

      const matchStatus = statusFilter === "Semua Status" || statusCategory === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [approvedBudgets, search, deptFilter, statusFilter]);

  // List unique departments
  const departmentsList = useMemo(() => {
    const setDept = new Set(approvedBudgets.map(b => b.department_name || "Operasional & Umum"));
    return ["Semua Departemen", ...Array.from(setDept)];
  }, [approvedBudgets]);

  // Handler Submit Catat Realisasi Baru
  const handleSaveRealization = (e) => {
    e.preventDefault();
    const budgetId = formRealize.budgetId || targetBudgetForRealize?.id;
    if (!budgetId) {
      Swal.fire("Pilih Pos Anggaran", "Silakan tentukan pos anggaran yang akan direalisasikan.", "warning");
      return;
    }

    const nominalNum = Number(formRealize.nominal) || 0;
    if (nominalNum <= 0) {
      Swal.fire("Nominal Tidak Valid", "Masukkan nominal realisasi pengeluaran yang lebih dari 0.", "warning");
      return;
    }

    const matchedBudget = approvedBudgets.find(b => String(b.id) === String(budgetId));
    const budgetTitle = matchedBudget?.title || "Anggaran Operasional";

    // 1. Update Realized Amount di custom_saved_budgets
    const customBudgets = JSON.parse(localStorage.getItem("custom_saved_budgets") || "[]");
    const mergedBudgets = customBudgets.length > 0 ? customBudgets : [...DEFAULT_REAL_BUDGETS];
    const budgetIdx = mergedBudgets.findIndex(b => String(b.id) === String(budgetId));

    if (budgetIdx >= 0) {
      const oldRealized = Number(mergedBudgets[budgetIdx].realized_amount || 0);
      const approvedVal = Number(mergedBudgets[budgetIdx].approved_amount || mergedBudgets[budgetIdx].total_amount || 0);
      const newRealized = oldRealized + nominalNum;
      const newRemaining = Math.max(0, approvedVal - newRealized);

      mergedBudgets[budgetIdx] = {
        ...mergedBudgets[budgetIdx],
        realized_amount: newRealized,
        remaining_amount: newRemaining,
        status: newRemaining === 0 ? "fully_realized" : "partially_realized"
      };
      localStorage.setItem("custom_saved_budgets", JSON.stringify(mergedBudgets));
    }

    // 2. Tambahkan ke Transaksi Pengeluaran Riil (finance_expense_data)
    const newExpenseEntry = {
      id: Date.now(),
      tanggal: formRealize.tanggal,
      kategori: matchedBudget?.department_name?.includes("Pendidikan") ? "Pendidikan" : "Operasional",
      deskripsi: formRealize.deskripsi || `Realisasi ${budgetTitle} (#${budgetReference(budgetId)})`,
      sumberDana: formRealize.sumberDana,
      nominal: nominalNum,
      status: "Paid",
      vendor: formRealize.vendor || "Mitra / Vendor LPK",
      buktiBayar: formRealize.buktiFoto || "",
      waktuPelunasan: `${formRealize.tanggal}T11:00`,
      petugasPelunasan: "FINANCE LPK CREATIVA"
    };

    const updatedExpenses = [newExpenseEntry, ...expenses];
    setExpenses(updatedExpenses);
    localStorage.setItem("finance_expense_data", JSON.stringify(updatedExpenses));

    // 3. Potong Saldo Rekening Bank / Kas
    try {
      const rekRaw = localStorage.getItem("finance_rekening_data");
      if (rekRaw) {
        const reks = JSON.parse(rekRaw);
        const updatedReks = reks.map(r => {
          if (formRealize.sumberDana.includes("BCA") && r.nama?.includes("BCA")) {
            return { ...r, saldo: Math.max(0, Number(r.saldo || 0) - nominalNum) };
          }
          if (formRealize.sumberDana.includes("Petty") && (r.nama?.includes("Petty") || r.nama?.includes("Kas"))) {
            return { ...r, saldo: Math.max(0, Number(r.saldo || 0) - nominalNum) };
          }
          return r;
        });
        localStorage.setItem("finance_rekening_data", JSON.stringify(updatedReks));
      }
    } catch (err) {}

    // 4. Refresh & Reset
    refresh();
    setShowRealizeModal(false);
    setTargetBudgetForRealize(null);
    setFormRealize({
      budgetId: "",
      nominal: "",
      tanggal: new Date().toISOString().slice(0, 10),
      deskripsi: "",
      sumberDana: "Bank BCA Operasional",
      vendor: "",
      buktiFoto: ""
    });

    Swal.fire({
      icon: "success",
      title: "✓ Realisasi Berhasil Dicatat!",
      html: `
        <div style="font-size: 13px; text-align: left; line-height: 1.6; color: #334155;">
          <p><strong>Pos Anggaran:</strong> ${budgetTitle}</p>
          <p><strong>Nominal Realisasi:</strong> ${formatRp(nominalNum)}</p>
          <p><strong>Sumber Dana:</strong> ${formRealize.sumberDana}</p>
          <p><strong>Tanggal Bayar:</strong> ${formRealize.tanggal}</p>
          <p style="margin-top: 8px; font-size: 12px; color: #64748b;">
            Pengeluaran ini telah otomatis tercatat ke Buku Transaksi Pengeluaran dan memotong sisa pagu anggaran.
          </p>
        </div>
      `,
      confirmButtonColor: "#059669",
      confirmButtonText: "Selesai"
    });
  };

  const exportRealisasiReport = () => {
    const headers = [
      "Nomor RAB", "Pos Anggaran / Judul", "Departemen", "Periode",
      "Pagu Disetujui (Rp)", "Komitmen (Rp)", "Realisasi Aktual (Rp)",
      "Sisa Pagu (Rp)", "Penyerapan (%)", "Status Kontrol"
    ];
    const data = filteredBudgets.map(b => {
      const approvedAmt = Number(b.approved_amount || b.total_amount || 0);
      const realizedAmt = Number(b.realized_amount || 0);
      const sisaAmt = Math.max(0, approvedAmt - realizedAmt);
      const pct = approvedAmt > 0 ? Math.round((realizedAmt / approvedAmt) * 100) : 0;
      let status = "Efisien (Aman)";
      if (pct > 95) status = "Overbudget / Kritis";
      else if (pct > 75) status = "Waspada Plafon";

      return [
        budgetReference(b.id),
        b.title,
        b.department_name || "Operasional",
        b.period ? b.period.slice(0, 7) : "-",
        approvedAmt,
        Number(b.committed_amount || 0),
        realizedAmt,
        sisaAmt,
        `${pct}%`,
        status
      ];
    });

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    sheet["!cols"] = headers.map((_, i) => ({ wch: i === 1 ? 38 : 18 }));
    XLSX.utils.book_append_sheet(workbook, sheet, "Realisasi Anggaran");
    XLSX.writeFile(workbook, `Laporan_Realisasi_Anggaran_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Layout>
      <div className="rab-page">
        {/* ── TOP HEADER ── */}
        <div className="rab-page-heading">
          <div>
            <span className="rab-eyebrow">MODUL AUDIT KEUANGAN & VARIANCE CONTROL</span>
            <h1>Realisasi Anggaran (Budget vs Actual)</h1>
            <p>Monitoring penyerapan pagu dana riil terhadap pengeluaran aktual operasional, honor pengajar, dan sarana LPK Creativa.</p>
          </div>
          <div className="rab-heading-actions">
            <button className="rab-button" onClick={() => refresh()}>
              <RefreshCw size={16} /> Perbarui
            </button>
            <button className="rab-button" onClick={exportRealisasiReport}>
              <FileDown size={16} /> Export Realisasi
            </button>
            <button
              className="rab-button rab-button-primary cursor-pointer shadow-sm hover:shadow"
              onClick={() => {
                setTargetBudgetForRealize(approvedBudgets[0] || null);
                setShowRealizeModal(true);
              }}
            >
              <Plus size={18} /> Catat Realisasi Baru
            </button>
          </div>
        </div>

        {/* ── ALUR KEUANGAN ── */}
        <div className="rab-flow">
          <span className="text-slate-400">1. Pagu Anggaran (Di Menu Anggaran)</span>
          <i>→</i>
          <span className="text-slate-400">2. Persetujuan Manajemen</span>
          <i>→</i>
          <span className="text-blue-700 font-bold"><Wallet size={16} /> 3. Pembayaran Beban Kas Riil</span>
          <i>→</i>
          <span className="text-emerald-700 font-bold"><BarChart2 size={16} /> 4. Realisasi Aktual & Kontrol Pagu</span>
        </div>

        {/* ── 4 KARTU KPI EKSEKUTIF REALISASI (CFO METRICS) ── */}
        <div className="rab-stats">
          <section className="rab-stat rab-stat-green">
            <span className="rab-stat-icon"><CheckCircle2 size={21} /></span>
            <h2>Pagu Anggaran Disetujui</h2>
            <strong>{formatBudgetMoney(cfoMetrics.totalPagu)}</strong>
            <p>{approvedBudgets.length} pos pagu resmi telah diotorisasi</p>
          </section>

          <section className="rab-stat rab-stat-blue">
            <span className="rab-stat-icon"><BarChart2 size={21} /></span>
            <h2>Total Realisasi Pengeluaran</h2>
            <strong className="text-blue-700">{formatBudgetMoney(cfoMetrics.totalRealized)}</strong>
            <p>Pengeluaran kas riil yang telah dibayarkan</p>
          </section>

          <section className="rab-stat rab-stat-amber">
            <span className="rab-stat-icon"><TrendingUp size={21} /></span>
            <h2>Sisa Pagu Tersedia</h2>
            <strong className="text-emerald-700">{formatBudgetMoney(cfoMetrics.totalSisa)}</strong>
            <p>Saldo plafon aman yang belum terserap</p>
          </section>

          <section className="rab-stat rab-stat-rose">
            <span className="rab-stat-icon"><ShieldCheck size={21} /></span>
            <h2>Tingkat Penyerapan Pagu</h2>
            <strong className={cfoMetrics.absorptionRate > 95 ? "text-rose-600" : "text-emerald-600"}>
              {cfoMetrics.absorptionRate}%
            </strong>
            <div className="rab-progress-track">
              <div
                className={`rab-progress-bar ${
                  cfoMetrics.absorptionRate > 95
                    ? "rab-progress-rose"
                    : cfoMetrics.absorptionRate > 75
                    ? "rab-progress-amber"
                    : "rab-progress-green"
                }`}
                style={{ width: `${Math.min(100, cfoMetrics.absorptionRate)}%` }}
              />
            </div>
          </section>
        </div>

        {/* ── PANEL AUDIT REALISASI PER POS ANGGARAN ── */}
        <section className="rab-panel">
          <div className="rab-panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2>Laporan Penyerapan Anggaran (Data Riil)</h2>
              <p>Perbandingan nominal pagu yang disetujui terhadap beban kas riil yang telah terverifikasi.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rab-button rab-button-small cursor-pointer"
                onClick={() => navigate("/anggaran")}
                title="Buka halaman Pagu Anggaran"
              >
                Lihat Pagu Anggaran
              </button>
            </div>
          </div>

          {/* Indikator Efisiensi */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Status Ambang Batas Kontrol Biaya (Budget Variance Control)</h3>
                <p className="text-[11px] text-slate-500">
                  Parameter efisiensi: Hijau (&lt;75% Efisien), Kuning (75-95% Waspada Plafon), Merah (&gt;95% Overbudget).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rab-badge-pill rab-pill-green">● Efisien (&lt; 75%)</span>
              <span className="rab-badge-pill rab-pill-amber">● Waspada (75 - 95%)</span>
              <span className="rab-badge-pill rab-pill-rose">● Kritis (&gt; 95%)</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="rab-filters">
            <label className="rab-search">
              <Search size={17} />
              <input
                placeholder="Cari pos anggaran, nomor RAB, atau departemen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="Semua Status">Semua Status Kontrol</option>
              <option value="Efisien">Efisien (Aman)</option>
              <option value="Waspada">Waspada Plafon</option>
              <option value="Overbudget">Overbudget / Kritis</option>
            </select>
            {(search || deptFilter !== "Semua Departemen" || statusFilter !== "Semua Status") && (
              <button
                className="rab-button"
                onClick={() => {
                  setSearch("");
                  setDeptFilter("Semua Departemen");
                  setStatusFilter("Semua Status");
                }}
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Tabel Realisasi */}
          <div className="rab-table-scroll">
            <table className="rab-table">
              <thead>
                <tr>
                  <th>Pos Anggaran / Judul RAB</th>
                  <th>Departemen</th>
                  <th>Pagu Disetujui</th>
                  <th>Komitmen (PO)</th>
                  <th>Realisasi Aktual</th>
                  <th>Sisa Pagu</th>
                  <th>% Penyerapan</th>
                  <th>Status Kontrol</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="rab-empty">
                      <p className="text-slate-500 font-medium py-4">Tidak ada data realisasi yang cocok dengan filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBudgets.map(item => {
                    const approvedAmt = Number(item.approved_amount || item.total_amount || 0);
                    const committedAmt = Number(item.committed_amount || 0);
                    const realizedAmt = Number(item.realized_amount || 0);
                    const sisaAmt = Math.max(0, approvedAmt - realizedAmt);
                    const pct = approvedAmt > 0 ? Math.round((realizedAmt / approvedAmt) * 100) : 0;

                    let statusBadge = "rab-pill-green";
                    let statusText = "Efisien (Aman)";
                    if (pct > 95) {
                      statusBadge = "rab-pill-rose";
                      statusText = "Overbudget / Kritis";
                    } else if (pct > 75) {
                      statusBadge = "rab-pill-amber";
                      statusText = "Waspada Plafon";
                    }

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <span className="rab-cell-caption">{budgetReference(item.id)}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-700">{item.department_name || "Operasional"}</span>
                          <span className="rab-cell-caption">{formatBudgetMonth(item.period || new Date().toISOString())}</span>
                        </td>
                        <td><strong className="text-slate-800">{formatBudgetMoney(approvedAmt)}</strong></td>
                        <td className="text-slate-600">{formatBudgetMoney(committedAmt)}</td>
                        <td><strong className="text-blue-700">{formatBudgetMoney(realizedAmt)}</strong></td>
                        <td><strong className="text-emerald-700">{formatBudgetMoney(sisaAmt)}</strong></td>
                        <td style={{ minWidth: 120 }}>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>{pct}%</span>
                          </div>
                          <div className="rab-progress-track">
                            <div
                              className={`rab-progress-bar ${
                                pct > 95 ? "rab-progress-rose" : pct > 75 ? "rab-progress-amber" : "rab-progress-green"
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </td>
                        <td>
                          <span className={`rab-badge-pill ${statusBadge}`}>
                            {statusText}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              className="rab-button rab-button-small rab-button-primary cursor-pointer"
                              onClick={() => {
                                setTargetBudgetForRealize(item);
                                setFormRealize(prev => ({
                                  ...prev,
                                  budgetId: String(item.id),
                                  deskripsi: `Realisasi ${item.title}`
                                }));
                                setShowRealizeModal(true);
                              }}
                              title="Catat bukti transaksi pengeluaran baru untuk RAB ini"
                            >
                              + Realisasi
                            </button>
                            <button
                              className="rab-button rab-button-small cursor-pointer"
                              onClick={() => setSelectedBudgetForDetail(item)}
                              title="Lihat rincian item pengeluaran"
                            >
                              Rincian
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── PANEL BUKU PENGELUARAN KAS RIIL TERVERIFIKASI ── */}
        <section className="rab-panel">
          <div className="rab-panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2>Arsip Beban Kas Riil Terverifikasi (Basis Realisasi)</h2>
              <p>Rincian transaksi riil pembayaran kas yang membentuk angka realisasi di atas.</p>
            </div>
            <button
              className="rab-button rab-button-small cursor-pointer"
              onClick={() => navigate("/transaksi-pengeluaran")}
            >
              Buka Buku Pengeluaran
            </button>
          </div>

          <div className="rab-table-scroll">
            <table className="rab-table">
              <thead>
                <tr>
                  <th>Tanggal Bayar</th>
                  <th>Uraian Pengeluaran</th>
                  <th>Kategori</th>
                  <th>Pihak / Vendor</th>
                  <th>Sumber Dana</th>
                  <th>Nominal Dibayar</th>
                  <th>Status Kas</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 6).map((exp, i) => (
                  <tr key={exp.id || i}>
                    <td>{exp.tanggal}</td>
                    <td><strong>{exp.deskripsi}</strong></td>
                    <td><span className="rab-status bg-slate-100 text-slate-700">{exp.kategori || "Beban Operasional"}</span></td>
                    <td>{exp.vendor || "Vendor LPK"}</td>
                    <td><span className="font-mono text-xs">{exp.sumberDana || "Bank BCA"}</span></td>
                    <td><strong className="text-slate-800">{formatRp(exp.nominal)}</strong></td>
                    <td><span className="rab-status bg-emerald-100 text-emerald-700">Terbayar (Paid)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── MODAL CATAT REALISASI PENGELUARAN ── */}
        {showRealizeModal && (
          <div className="rab-modal-backdrop">
            <section className="rab-modal" style={{ maxWidth: 600 }}>
              <div className="rab-modal-heading">
                <div>
                  <h2>Catat Realisasi Pengeluaran Kas</h2>
                  <p>Mencatat bukti pembayaran riil terhadap pagu anggaran yang telah disetujui.</p>
                </div>
                <button onClick={() => setShowRealizeModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveRealization}>
                <div className="rab-form-body">
                  <label>
                    Pilih Pos Anggaran *
                    <select
                      required
                      value={formRealize.budgetId || targetBudgetForRealize?.id || ""}
                      onChange={e => {
                        const val = e.target.value;
                        const found = approvedBudgets.find(b => String(b.id) === String(val));
                        setTargetBudgetForRealize(found || null);
                        setFormRealize(p => ({
                          ...p,
                          budgetId: val,
                          deskripsi: found ? `Realisasi ${found.title}` : p.deskripsi
                        }));
                      }}
                    >
                      <option value="">Pilih Pos Anggaran</option>
                      {approvedBudgets.map(b => (
                        <option key={b.id} value={b.id}>
                          {budgetReference(b.id)} - {b.title} (Sisa Pagu: {formatRp(b.remaining_amount || (Number(b.approved_amount || b.total_amount) - Number(b.realized_amount || 0)))})
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rab-form-grid">
                    <label>
                      Nominal Realisasi (Rp) *
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Contoh: 1500000"
                        value={formRealize.nominal}
                        onChange={e => setFormRealize({ ...formRealize, nominal: e.target.value })}
                      />
                    </label>
                    <label>
                      Tanggal Pembayaran *
                      <input
                        required
                        type="date"
                        value={formRealize.tanggal}
                        onChange={e => setFormRealize({ ...formRealize, tanggal: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="rab-form-grid">
                    <label>
                      Sumber Dana / Akun Kas *
                      <select
                        value={formRealize.sumberDana}
                        onChange={e => setFormRealize({ ...formRealize, sumberDana: e.target.value })}
                      >
                        <option value="Bank BCA Operasional">Bank BCA Operasional (1832-918-428)</option>
                        <option value="Petty Cash (Kasir)">Petty Cash (Kasir Tunai)</option>
                      </select>
                    </label>
                    <label>
                      Penerima Dana / Vendor
                      <input
                        placeholder="Contoh: CV Mitra Sarana"
                        value={formRealize.vendor}
                        onChange={e => setFormRealize({ ...formRealize, vendor: e.target.value })}
                      />
                    </label>
                  </div>

                  <label>
                    Uraian / Keterangan Pembayaran *
                    <textarea
                      required
                      rows={2}
                      placeholder="Uraian kebutuhan yang dibayarkan..."
                      value={formRealize.deskripsi}
                      onChange={e => setFormRealize({ ...formRealize, deskripsi: e.target.value })}
                    />
                  </label>

                  <label>
                    Bukti Nota / Struk Transfer (Opsional)
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setFormRealize(p => ({ ...p, buktiFoto: reader.result }));
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="rab-modal-footer">
                  <button type="button" className="rab-button" onClick={() => setShowRealizeModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="rab-button rab-button-primary">
                    Simpan & Realisasikan
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ── MODAL RINCIAN ITEM ANGGARAN ── */}
        {selectedBudgetForDetail && (
          <div className="rab-modal-backdrop">
            <section className="rab-modal" style={{ maxWidth: 700 }}>
              <div className="rab-modal-heading">
                <div>
                  <h2>Rincian Kebutuhan & Realisasi #{budgetReference(selectedBudgetForDetail.id)}</h2>
                  <p>{selectedBudgetForDetail.title} ({selectedBudgetForDetail.department_name || "Operasional"})</p>
                </div>
                <button onClick={() => setSelectedBudgetForDetail(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="rab-detail-body">
                <div className="rab-detail-total">
                  <span>Pagu Anggaran Disetujui</span>
                  <strong className="text-slate-900">{formatBudgetMoney(selectedBudgetForDetail.approved_amount || selectedBudgetForDetail.total_amount)}</strong>
                </div>
                <div className="rab-detail-total">
                  <span>Total Realisasi Aktual</span>
                  <strong className="text-blue-700">{formatBudgetMoney(selectedBudgetForDetail.realized_amount || 0)}</strong>
                </div>
                <div className="rab-detail-total">
                  <span>Sisa Saldo Pagu</span>
                  <strong className="text-emerald-700">
                    {formatBudgetMoney(Math.max(0, Number(selectedBudgetForDetail.approved_amount || selectedBudgetForDetail.total_amount) - Number(selectedBudgetForDetail.realized_amount || 0)))}
                  </strong>
                </div>

                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mt-4 mb-2">Item Rincian Anggaran:</h3>
                <div className="rab-table-scroll">
                  <table className="rab-table">
                    <thead>
                      <tr>
                        <th>Uraian Kebutuhan</th>
                        <th>Qty</th>
                        <th>Satuan</th>
                        <th>Harga</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedBudgetForDetail.items || []).map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td><strong>{it.description}</strong><span className="rab-cell-caption">{it.category}</span></td>
                          <td>{it.quantity}</td>
                          <td>{it.unit}</td>
                          <td>{formatRp(it.unit_price)}</td>
                          <td><strong>{formatRp(it.total_amount || (it.quantity * it.unit_price))}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rab-modal-footer">
                <button className="rab-button" onClick={() => setSelectedBudgetForDetail(null)}>
                  Tutup
                </button>
                <button
                  className="rab-button rab-button-primary"
                  onClick={() => {
                    setTargetBudgetForRealize(selectedBudgetForDetail);
                    setFormRealize(p => ({
                      ...p,
                      budgetId: String(selectedBudgetForDetail.id),
                      deskripsi: `Realisasi ${selectedBudgetForDetail.title}`
                    }));
                    setSelectedBudgetForDetail(null);
                    setShowRealizeModal(true);
                  }}
                >
                  + Catat Realisasi untuk RAB Ini
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
