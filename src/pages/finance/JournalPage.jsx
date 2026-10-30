import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  FinanceModal, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { Plus, RefreshCw, BookOpen, Check, ArrowRight } from "lucide-react";
import axios from "axios";

// Default blueprint invoices dari modul billing
const DEFAULT_BLUEPRINT_INVOICES = [
  { id: "TGCJ2608001", tanggal: "2026-08-21", customer: "Hany Agesti", program: "Kelas Intensif Offline", total: 15000000, terbayar: 15000000, status: "Paid", bank_name: "BCA", receiptNo: "RCP-TGCJ2608001-01" },
  { id: "TGCJ2608004", tanggal: "2026-08-19", customer: "Siti Aminah", program: "Kursus Reguler", total: 8000000, terbayar: 4000000, status: "Partially Paid", bank_name: "BCA", receiptNo: "RCP-TGCJ2608004-01" },
];

function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  if (dateStr.includes("/")) return dateStr;
  try {
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
  } catch (e) {}
  return dateStr;
}

export default function JournalPage() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Backend state
  const [serverSalaries, setServerSalaries] = useState([]);
  const [serverLedger, setServerLedger] = useState([]);

  // Jurnal manual tersimpan di localStorage
  const [customJournals, setCustomJournals] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_custom_journals");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Fetch data penggajian riil dari backend (salary_requests)
  useEffect(() => {
    let active = true;

    axios.get("/api/salaries.php?all=1")
      .then(res => {
        if (active && Array.isArray(res.data?.data?.requests)) {
          setServerSalaries(res.data.data.requests);
        }
      })
      .catch(() => {});

    axios.get("/api/accounting.php?view=ledger")
      .then(res => {
        if (active && Array.isArray(res.data?.data?.rows)) {
          setServerLedger(res.data.data.rows);
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [refreshTrigger]);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    deskripsi: "",
    referensi: "",
    debitAccount: "1002 - Bank BCA Operasional",
    creditAccount: "4001 - Pendapatan Kursus",
    nominal: "",
    status: "Posted",
  });

  // ── GATHER JURNAL 100% RIIL DARI SELURUH TRANSAKSI AKTIF ──
  const realJournalEntries = useMemo(() => {
    const list = [];
    const addedRefs = new Set();

    // 1. Entri Jurnal dari Pembayaran Invoice Siswa (billing_pembayaran_custom)
    try {
      const savedPayments = JSON.parse(localStorage.getItem("billing_pembayaran_custom") || "[]");
      if (Array.isArray(savedPayments)) {
        savedPayments.forEach(p => {
          if (!p || !p.jumlah) return;
          const refKey = p.receiptNo || `PAY-${p.id || p.noInv}`;
          if (addedRefs.has(refKey)) return;
          addedRefs.add(refKey);

          const nominal = Number(p.jumlah || 0);
          list.push({
            id: `jrn-pay-${p.id || refKey}`,
            rawDate: p.tglBayar || "2026-10-29",
            tanggal: formatDateIndo(p.tglBayar),
            deskripsi: `Penerimaan Pembayaran Siswa - ${p.customer || "Siswa LPK"} (${p.terminName || "Pelunasan Invoice"})`,
            referensi: p.receiptNo || p.noInv || refKey,
            debitAccount: "1002 - Bank BCA Operasional",
            creditAccount: "4001 - Pendapatan Kursus / 1101 - Piutang SPP",
            totalDebit: nominal,
            totalKredit: nominal,
            status: "Posted",
            tipe: "Penerimaan Kas"
          });
        });
      }
    } catch (e) {
      console.warn("Gagal membaca billing_pembayaran_custom:", e);
    }

    // 2. Entri Jurnal dari saved_custom_invoices (Invoice yang Diterbitkan Finance)
    try {
      const savedInvoices = JSON.parse(localStorage.getItem("saved_custom_invoices") || "[]");
      if (Array.isArray(savedInvoices)) {
        savedInvoices.forEach(inv => {
          if (!inv) return;
          const invId = inv.id || inv.nomor || "";

          if (Array.isArray(inv.payments) && inv.payments.length > 0) {
            inv.payments.forEach((p, idx) => {
              const refKey = p.receiptNo || `RCP-${invId}-${idx + 1}`;
              if (addedRefs.has(refKey)) return;
              addedRefs.add(refKey);

              const nominal = Number(p.jumlah || 0);
              if (nominal > 0) {
                list.push({
                  id: `jrn-invpay-${refKey}`,
                  rawDate: p.tglBayar || inv.tanggal || "2026-10-29",
                  tanggal: formatDateIndo(p.tglBayar || inv.tanggal),
                  deskripsi: `Penerimaan ${p.terminName || ("Termin " + (idx + 1))} - ${inv.customer || "Siswa LPK"} (${inv.program || "Pelatihan"})`,
                  referensi: p.receiptNo || invId,
                  debitAccount: "1002 - Bank BCA Operasional",
                  creditAccount: "4001 - Pendapatan Kursus",
                  totalDebit: nominal,
                  totalKredit: nominal,
                  status: "Posted",
                  tipe: "Penerimaan Kas"
                });
              }
            });
          } else if (Number(inv.terbayar || 0) > 0) {
            const refKey = `INV-PAID-${invId}`;
            if (!addedRefs.has(refKey) && !addedRefs.has(invId)) {
              addedRefs.add(refKey);
              const nominal = Number(inv.terbayar);
              list.push({
                id: `jrn-inv-${invId}`,
                rawDate: inv.paid_at || inv.tanggal || "2026-10-29",
                tanggal: formatDateIndo(inv.paid_at || inv.tanggal),
                deskripsi: `Penerimaan Invoice #${invId} - ${inv.customer || "Siswa LPK"} (${inv.program || "Pelatihan"})`,
                referensi: invId,
                debitAccount: "1002 - Bank BCA Operasional",
                creditAccount: "4001 - Pendapatan Kursus",
                totalDebit: nominal,
                totalKredit: nominal,
                status: "Posted",
                tipe: "Penerimaan Kas"
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn("Gagal membaca saved_custom_invoices:", e);
    }

    // 3. Entri Jurnal Blueprint Resmi (Hany Agesti & Siti Aminah) -> Bank BCA
    DEFAULT_BLUEPRINT_INVOICES.forEach(defInv => {
      const refKey = defInv.receiptNo || defInv.id;
      if (!addedRefs.has(refKey) && !addedRefs.has(defInv.id)) {
        addedRefs.add(refKey);
        const nominal = Number(defInv.terbayar);
        list.push({
          id: `jrn-blueprint-${defInv.id}`,
          rawDate: defInv.tanggal,
          tanggal: formatDateIndo(defInv.tanggal),
          deskripsi: `Penerimaan Invoice #${defInv.id} - ${defInv.customer} (${defInv.program})`,
          referensi: defInv.receiptNo || defInv.id,
          debitAccount: "1002 - Bank BCA Operasional (LPK Creativa Bridging Intern)",
          creditAccount: "4001 - Pendapatan Kursus",
          totalDebit: nominal,
          totalKredit: nominal,
          status: "Posted",
          tipe: "Penerimaan Kas"
        });
      }
    });

    // 4. Entri Jurnal Suntikan Dana Kas Kecil (Dropping dari Rekening BCA ke Petty Cash)
    // Sesuai prinsip akuntansi & arahan CFO: "patty cash juga kan suntikan dananya dari transferan rek BCA creatva bridging intern"
    const droppingTransfers = [
      {
        id: "TRF-2026-0034",
        tanggal: "2026-06-20",
        deskripsi: "Suntikan Dana Kas Kecil dari Rekening BCA Creativa Bridging Intern",
        nominal: 5000000,
        status: "Posted"
      }
    ];

    try {
      const trfRaw = localStorage.getItem("finance_transfers_history");
      if (trfRaw) {
        const trfList = JSON.parse(trfRaw);
        if (Array.isArray(trfList)) {
          trfList.forEach(t => {
            const isFromBca = (t.dari || "").toLowerCase().includes("bca");
            const isToPetty = (t.ke || "").toLowerCase().includes("petty") || (t.ke || "").toLowerCase().includes("kas");
            if (isFromBca && isToPetty && !addedRefs.has(t.id)) {
              droppingTransfers.push({
                id: t.id,
                tanggal: t.tanggal || "2026-06-20",
                deskripsi: `Suntikan Dana Dropping Kas Kecil (${t.catatan || "Top-up Kasir"})`,
                nominal: Number(t.nominal || 0),
                status: "Posted"
              });
            }
          });
        }
      }
    } catch (e) {}

    droppingTransfers.forEach(d => {
      if (!addedRefs.has(d.id)) {
        addedRefs.add(d.id);
        list.push({
          id: `jrn-drop-${d.id}`,
          rawDate: d.tanggal,
          tanggal: formatDateIndo(d.tanggal),
          deskripsi: d.deskripsi,
          referensi: d.id,
          debitAccount: "1001 - Petty Cash (Kas Kecil Operasional)",
          creditAccount: "1002 - Bank BCA Operasional (LPK Creativa Bridging Intern)",
          totalDebit: d.nominal,
          totalKredit: d.nominal,
          status: d.status,
          tipe: "Transfer Kas"
        });
      }
    });

    // 5. Entri Jurnal dari Penggajian Karyawan Backend (salary_requests) -> Keluar dari Rekening BCA
    if (Array.isArray(serverSalaries) && serverSalaries.length > 0) {
      serverSalaries.forEach(s => {
        const refKey = s.transfer_reference || `PAYROLL-${s.id}`;
        if (addedRefs.has(refKey)) return;
        addedRefs.add(refKey);

        const nominal = Math.abs(Number(s.total_salary || 0));
        const isPaid = s.status === "paid";
        list.push({
          id: `jrn-salary-${s.id}`,
          rawDate: s.paid_date || s.payday || "2026-10-07",
          tanggal: formatDateIndo(s.paid_date || s.payday || "2026-10-07"),
          deskripsi: `Beban Gaji Karyawan (${s.month || "Periode Berjalan"}) — ${s.employee_name}`,
          referensi: s.transfer_reference || `PAYROLL-${s.id}`,
          debitAccount: "5001 - Beban Gaji Sensei & Karyawan",
          creditAccount: "1002 - Bank BCA Operasional (LPK Creativa Bridging Intern)",
          totalDebit: nominal,
          totalKredit: nominal,
          status: isPaid ? "Posted" : "Draft",
          tipe: "Pengeluaran Kas"
        });
      });
    }

    // 6. Entri Jurnal dari Pengeluaran Riil (finance_expense_data)
    // - Token Listrik PLN, ATK vendor kecil, operasional kecil -> Kredit Petty Cash (1001)
    // - Pengeluaran besar / via transfer BCA -> Kredit Bank BCA (1002)
    try {
      const expRaw = localStorage.getItem("finance_expense_data");
      if (expRaw) {
        const expList = JSON.parse(expRaw);
        if (Array.isArray(expList)) {
          expList.forEach(exp => {
            const refKey = exp.nomor || `EXP-${exp.id}`;
            if (addedRefs.has(refKey) || addedRefs.has(exp.id)) return;
            addedRefs.add(refKey);

            const nominal = Math.abs(Number(exp.nominal || 0));
            const isPaid = exp.status === "Paid" || exp.status === "Approved";
            const sumber = (exp.sumberDana || "").toLowerCase();
            const descLower = (exp.deskripsi || "").toLowerCase();
            const isSmallExpense = sumber.includes("kas") || sumber.includes("wallet") || descLower.includes("listrik") || descLower.includes("token") || descLower.includes("atk") || descLower.includes("modul") || (nominal < 5000000 && !sumber.includes("bca"));

            const creditAcc = isSmallExpense 
              ? "1001 - Petty Cash (Kas Kecil Operasional)"
              : "1002 - Bank BCA Operasional (LPK Creativa Bridging Intern)";

            const debitAcc = descLower.includes("modul") || descLower.includes("buku")
              ? "5004 - Beban Pengadaan Modul & Seragam"
              : descLower.includes("listrik") || descLower.includes("token")
              ? "5003 - Beban Listrik, Internet & Operasional"
              : descLower.includes("gaji")
              ? "5001 - Beban Gaji Sensei & Karyawan"
              : "5003 - Beban Operasional Kantor";

            list.push({
              id: `jrn-exp-${exp.id}`,
              rawDate: exp.tanggal || "2026-10-01",
              tanggal: formatDateIndo(exp.tanggal),
              deskripsi: exp.deskripsi || `${exp.kategori || "Pengeluaran Operasional"}${exp.vendor ? ` (${exp.vendor})` : ""}`,
              referensi: refKey,
              debitAccount: debitAcc,
              creditAccount: creditAcc,
              totalDebit: nominal,
              totalKredit: nominal,
              status: isPaid ? "Posted" : "Draft",
              tipe: "Pengeluaran Kas"
            });
          });
        }
      }
    } catch (e) {
      console.warn("Gagal membaca finance_expense_data:", e);
    }

    // 6. Entri Jurnal dari Ledger Backend
    if (Array.isArray(serverLedger) && serverLedger.length > 0) {
      serverLedger.forEach(row => {
        const refKey = row.number || `LEDGER-${row.id}`;
        if (addedRefs.has(refKey)) return;
        addedRefs.add(refKey);

        const inAmt = Number(row.incoming_amount || 0);
        const outAmt = Number(row.outgoing_amount || 0);
        const isIncome = inAmt > 0;
        const nominal = isIncome ? inAmt : Math.abs(outAmt);

        list.push({
          id: `jrn-ledger-${row.id}`,
          rawDate: row.transaction_date || "2026-10-01",
          tanggal: formatDateIndo(row.transaction_date),
          deskripsi: row.description || row.party_name || "Transaksi Kas/Bank",
          referensi: refKey,
          debitAccount: isIncome ? "1002 - Bank BCA Operasional" : (row.category || "5003 - Beban Operasional"),
          creditAccount: isIncome ? (row.category || "4001 - Pendapatan Kursus") : "1002 - Bank BCA Operasional",
          totalDebit: nominal,
          totalKredit: nominal,
          status: row.payment_status === "paid" ? "Posted" : "Draft",
          tipe: isIncome ? "Penerimaan Kas" : "Pengeluaran Kas"
        });
      });
    }

    // 7. Jurnal Manual Pengguna
    customJournals.forEach(cj => {
      list.push(cj);
    });

    // Urutkan berdasarkan tanggal terbaru
    return list.sort((a, b) => {
      const dateA = new Date(a.rawDate || a.tanggal).getTime() || 0;
      const dateB = new Date(b.rawDate || b.tanggal).getTime() || 0;
      return dateB - dateA;
    });
  }, [serverSalaries, serverLedger, customJournals, refreshTrigger]);

  const filteredData = useMemo(() => {
    return realJournalEntries.filter(item => {
      if (item.rawDate) {
        if (startDate && item.rawDate < startDate) return false;
        if (endDate && item.rawDate > endDate) return false;
      }
      if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (item.deskripsi || "").toLowerCase().includes(q) ||
          (item.referensi || "").toLowerCase().includes(q) ||
          (item.debitAccount || "").toLowerCase().includes(q) ||
          (item.creditAccount || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [realJournalEntries, startDate, endDate, status, search]);

  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => {
    exportToExcel(
      filteredData.map((d, idx) => ({
        No: idx + 1,
        Tanggal: d.tanggal,
        Deskripsi: d.deskripsi,
        Referensi: d.referensi,
        "Debit Akun": d.debitAccount || "-",
        "Kredit Akun": d.creditAccount || "-",
        "Total Debit": d.totalDebit,
        "Total Kredit": d.totalKredit,
        Status: d.status,
      })),
      "Journal_Akuntansi_Riil"
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.deskripsi || !form.nominal) return;
    setBusy(true);

    const nominal = Number(form.nominal);
    const newJournal = {
      id: `manual-jrn-${Date.now()}`,
      rawDate: form.tanggal,
      tanggal: formatDateIndo(form.tanggal),
      deskripsi: form.deskripsi,
      referensi: form.referensi || `JRN-${Date.now().toString().slice(-4)}`,
      debitAccount: form.debitAccount,
      creditAccount: form.creditAccount,
      totalDebit: nominal,
      totalKredit: nominal,
      status: form.status,
      tipe: "Jurnal Manual"
    };

    const updated = [newJournal, ...customJournals];
    setCustomJournals(updated);
    try {
      localStorage.setItem("finance_custom_journals", JSON.stringify(updated));
    } catch (err) {}

    setBusy(false);
    setIsModalOpen(false);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      deskripsi: "",
      referensi: "",
      debitAccount: "1002 - Bank BCA Operasional",
      creditAccount: "4001 - Pendapatan Kursus",
      nominal: "",
      status: "Posted",
    });
  };

  const columns = [
    { 
      header: "No", 
      accessor: "no", 
      align: "center", 
      className: "w-12 text-slate-400 font-medium", 
      render: (_, i) => (page - 1) * perPage + i + 1 
    },
    { 
      header: "Tanggal", 
      accessor: "tanggal", 
      className: "whitespace-nowrap font-medium text-slate-700 w-28",
      render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>
    },
    { 
      header: "Deskripsi & Akun Debit/Kredit", 
      accessor: "deskripsi", 
      className: "font-semibold text-slate-900",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-900">{r.deskripsi}</div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            <span className="font-mono text-blue-600 bg-blue-50/70 px-1.5 py-0.2 rounded">
              (D) {r.debitAccount || "1002 - Bank BCA"}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-emerald-600 bg-emerald-50/70 px-1.5 py-0.2 rounded">
              (K) {r.creditAccount || "4001 - Pendapatan"}
            </span>
          </div>
        </div>
      )
    },
    { 
      header: "Referensi", 
      accessor: "referensi", 
      className: "font-mono font-medium text-slate-600",
      render: (r) => (
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
          {r.referensi}
        </span>
      )
    },
    { 
      header: "Total Debit", 
      accessor: "totalDebit", 
      align: "right", 
      className: "font-bold text-slate-900 font-mono", 
      render: (r) => formatRupiah(r.totalDebit) 
    },
    { 
      header: "Total Kredit", 
      accessor: "totalKredit", 
      align: "right", 
      className: "font-bold text-slate-900 font-mono", 
      render: (r) => formatRupiah(r.totalKredit) 
    },
    { 
      header: "Status", 
      accessor: "status", 
      align: "center", 
      render: (r) => <FinanceBadge status={r.status} text={r.status} /> 
    },
  ];

  return (
    <Layout appearance="finance">
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Journal Akuntansi"
          subtitle="Daftar entri jurnal debit dan kredit otomatis dari seluruh transaksi riil (Double-Entry Bookkeeping)"
          primaryLabel="+ Buat Journal"
          onPrimaryClick={() => setIsModalOpen(true)}
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        >
          <button
            type="button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            title="Muat Ulang Transaksi Riil"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Perbarui Jurnal</span>
          </button>
        </FinancePageHeader>

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari siswa, invoice, karyawan, akun, ref..."
          dropdowns={[
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status Jurnal" },
                { value: "Posted", label: "Posted (Terposting)" },
                { value: "Draft", label: "Draft (Review)" },
              ],
            },
          ]}
          onReset={() => {
            setStatus("all");
            setSearch("");
            setStartDate("2026-01-01");
            setEndDate("2026-12-31");
            setPage(1);
          }}
        />

        <FinanceTable
          columns={columns}
          data={paginatedData}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredData.length}
        />

        {/* Modal Buat Journal Manual */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Buat Jurnal Manual"
          subtitle="Entri jurnal nonkas, penyesuaian, atau mutasi seimbang"
          onSubmit={handleSave}
          submitText="Simpan & Posting Jurnal"
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Referensi</label>
              <input
                type="text"
                placeholder="JRN-2026-001"
                value={form.referensi}
                onChange={e => setForm({ ...form, referensi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Transaksi</label>
              <input
                type="text"
                required
                placeholder="Contoh: Beban Operasional / Penyesuaian Sewa Kampus"
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Akun Debit (Bertambah/Beban/Kas)</label>
              <input
                type="text"
                value={form.debitAccount}
                onChange={e => setForm({ ...form, debitAccount: e.target.value })}
                placeholder="1002 - Bank BCA Operasional"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-blue-700 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Akun Kredit (Pendapatan/Keluar)</label>
              <input
                type="text"
                value={form.creditAccount}
                onChange={e => setForm({ ...form, creditAccount: e.target.value })}
                placeholder="4001 - Pendapatan Kursus"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-emerald-700 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Seimbang (Debit/Kredit)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.nominal}
                onChange={e => setForm({ ...form, nominal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Entri</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Posted">Posted (Terposting)</option>
                <option value="Draft">Draft (Dalam Review)</option>
              </select>
            </div>
          </div>
        </FinanceModal>
      </div>
    </Layout>
  );
}
