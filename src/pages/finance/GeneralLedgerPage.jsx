import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceKpiCard,
  FinanceFilterBar, 
  FinanceTable, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { Landmark, ArrowDownRight, ArrowUpRight, Wallet, RefreshCw } from "lucide-react";
import axios from "axios";

// Default Master COA Standar Akuntansi Perusahaan
const DEFAULT_COA_ACCOUNTS = [
  { kode: "1002", nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)", tipe: "Assets", normal: "Debit", baseSaldo: 120000000, rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428" },
  { kode: "1001", nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)", tipe: "Assets", normal: "Debit", baseSaldo: 5000000, rekeningDetail: "Kasir & Kas Kecil Tunai Kantor" },
  { kode: "1003", nama: "Bank Mandiri Utama", tipe: "Assets", normal: "Debit", baseSaldo: 25000000, rekeningDetail: "Mandiri a/n PT LPK Creativa 130-0019283" },
  { kode: "1101", nama: "Piutang SPP Siswa", tipe: "Assets", normal: "Debit", baseSaldo: 45000000, rekeningDetail: "Piutang Termin Siswa Intensif" },
  { kode: "4001", nama: "Pendapatan Kursus Bahasa Jepang", tipe: "Income", normal: "Kredit", baseSaldo: 0, rekeningDetail: "Pendapatan SPP & Pelatihan" },
  { kode: "5001", nama: "Beban Gaji Sensei & Karyawan", tipe: "Expenses", normal: "Debit", baseSaldo: 0, rekeningDetail: "Payroll Penggajian Staf & Sensei" },
  { kode: "5002", nama: "Beban Sewa Gedung Kampus", tipe: "Expenses", normal: "Debit", baseSaldo: 0, rekeningDetail: "Sewa Tempat Kampus LPK" },
  { kode: "5003", nama: "Beban Listrik, Internet & Operasional", tipe: "Expenses", normal: "Debit", baseSaldo: 0, rekeningDetail: "Token PLN, Internet, ATK Kantor" },
  { kode: "5004", nama: "Beban Pengadaan Modul & Seragam", tipe: "Expenses", normal: "Debit", baseSaldo: 0, rekeningDetail: "Buku Minna no Nihongo & Seragam" },
];

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

export default function GeneralLedgerPage() {
  const [selectedAccount, setSelectedAccount] = useState("1002");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Backend state
  const [serverSalaries, setServerSalaries] = useState([]);
  const [serverLedger, setServerLedger] = useState([]);

  // Ambil data backend
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

  // Master akun COA dengan Sanitasi dan Auto-Heal Nama Akun Bank BCA & Petty Cash
  const coaList = useMemo(() => {
    try {
      const coaRaw = localStorage.getItem("finance_coa_data");
      if (coaRaw) {
        let parsed = JSON.parse(coaRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let needFix = false;

          // Periksa akun BCA dan Petty Cash
          parsed = parsed.map(c => {
            const nameLower = (c.nama || "").toLowerCase();
            const detailLower = (c.rekeningDetail || "").toLowerCase();
            const isPetty = nameLower.includes("petty") || nameLower.includes("kas kecil") || detailLower.includes("kas kecil");
            const isBca = nameLower.includes("bca") || detailLower.includes("bca") || detailLower.includes("1832");

            // Jika kode 1002 salah tertulis Petty Cash, ubah menjadi Bank BCA
            if (c.kode === "1002" && isPetty) {
              needFix = true;
              return {
                ...c,
                nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)",
                rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428",
                saldo: c.saldo && Number(c.saldo) > 0 ? c.saldo : 120000000
              };
            }
            // Jika kode 1001 belum jelas namanya
            if (c.kode === "1001" && !isPetty) {
              needFix = true;
              return {
                ...c,
                nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)",
                rekeningDetail: "Kasir & Kas Kecil Tunai Kantor",
                saldo: c.saldo && Number(c.saldo) > 0 ? c.saldo : 5000000
              };
            }
            return c;
          });

          // Pastikan ada akun Bank BCA (1002)
          const hasBca = parsed.some(c => c.kode === "1002" || (c.nama && c.nama.toLowerCase().includes("bca")));
          if (!hasBca) {
            parsed.unshift({
              id: 2,
              kode: "1002",
              nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)",
              subtype: "AST-CB",
              rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428",
              tipe: "Assets",
              kategori: "Cash and Bank",
              saldo: 120000000,
              status: "Aktif"
            });
            needFix = true;
          }

          // Pastikan ada akun Petty Cash (1001)
          const hasPetty = parsed.some(c => c.kode === "1001" || (c.nama && c.nama.toLowerCase().includes("petty")));
          if (!hasPetty) {
            parsed.push({
              id: 1,
              kode: "1001",
              nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)",
              subtype: "AST-CB",
              rekeningDetail: "Kasir & Kas Kecil Tunai Kantor",
              tipe: "Assets",
              kategori: "Cash and Bank",
              saldo: 5000000,
              status: "Aktif"
            });
            needFix = true;
          }

          if (needFix) {
            try {
              localStorage.setItem("finance_coa_data", JSON.stringify(parsed));
            } catch (e) {}
          }

          return parsed.map(c => ({
            kode: c.kode,
            nama: c.nama,
            tipe: c.tipe,
            normal: c.tipe === "Income" || c.tipe === "Equity" || c.tipe === "Liabilities & Credit Cards" ? "Kredit" : "Debit",
            baseSaldo: Number(c.saldo || 0)
          }));
        }
      }
    } catch (e) {}
    return DEFAULT_COA_ACCOUNTS;
  }, []);

  const activeCoa = useMemo(() => {
    return coaList.find(c => String(c.kode) === String(selectedAccount)) || coaList[0];
  }, [coaList, selectedAccount]);

  // ── GATHER MUTASI BUKU BESAR RIIL SESUAI STANDAR KEUANGAN & INSTRUKSI CFO ──
  const ledgerRows = useMemo(() => {
    const rows = [];
    const addedRefs = new Set();
    const targetCode = String(activeCoa.kode);
    const isNormalDebit = activeCoa.normal === "Debit";

    // Kumpulkan seluruh kejadian ekonomi riil
    const events = [];

    // 1. Pembayaran Siswa (billing_pembayaran_custom) -> Masuk ke Rekening BCA (Pemasukan Besar)
    try {
      const savedPayments = JSON.parse(localStorage.getItem("billing_pembayaran_custom") || "[]");
      if (Array.isArray(savedPayments)) {
        savedPayments.forEach(p => {
          if (!p || !p.jumlah) return;
          const refKey = p.receiptNo || `PAY-${p.id || p.noInv}`;
          if (addedRefs.has(refKey)) return;
          addedRefs.add(refKey);

          events.push({
            ref: refKey,
            rawDate: p.tglBayar || "2026-10-29",
            deskripsi: `Penerimaan Pembayaran Siswa - ${p.customer || "Siswa LPK"} (${p.terminName || "Pelunasan"})`,
            amount: Number(p.jumlah),
            type: "income",
            sourceAccount: "1002", // Rekening BCA CREATIVA BRIDGING INTERN
            targetAccount: "4001", // Pendapatan Kursus
            altTargetAccount: "1101" // Piutang Siswa
          });
        });
      }
    } catch (e) {}

    // 2. Saved custom invoices (Nova Dwi Khalifah, dll.) -> Masuk ke Rekening BCA (Pemasukan Besar)
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

              const amt = Number(p.jumlah || 0);
              if (amt > 0) {
                events.push({
                  ref: refKey,
                  rawDate: p.tglBayar || inv.tanggal || "2026-10-29",
                  deskripsi: `Penerimaan ${p.terminName || ("Termin " + (idx + 1))} - ${inv.customer || "Siswa LPK"}`,
                  amount: amt,
                  type: "income",
                  sourceAccount: "1002", // Rekening BCA
                  targetAccount: "4001",
                  altTargetAccount: "1101"
                });
              }
            });
          } else if (Number(inv.terbayar || 0) > 0) {
            const refKey = `INV-PAID-${invId}`;
            if (!addedRefs.has(refKey) && !addedRefs.has(invId)) {
              addedRefs.add(refKey);
              events.push({
                ref: invId,
                rawDate: inv.paid_at || inv.tanggal || "2026-10-29",
                deskripsi: `Penerimaan Invoice #${invId} - ${inv.customer || "Siswa LPK"}`,
                amount: Number(inv.terbayar),
                type: "income",
                sourceAccount: "1002", // Rekening BCA
                targetAccount: "4001",
                altTargetAccount: "1101"
              });
            }
          }
        });
      }
    } catch (e) {}

    // 3. Blueprint Invoices (Hany Agesti & Siti Aminah) -> Masuk ke Rekening BCA
    DEFAULT_BLUEPRINT_INVOICES.forEach(defInv => {
      const refKey = defInv.receiptNo || defInv.id;
      if (!addedRefs.has(refKey) && !addedRefs.has(defInv.id)) {
        addedRefs.add(refKey);
        events.push({
          ref: defInv.receiptNo || defInv.id,
          rawDate: defInv.tanggal,
          deskripsi: `Penerimaan Invoice #${defInv.id} - ${defInv.customer}`,
          amount: Number(defInv.terbayar),
          type: "income",
          sourceAccount: "1002", // Rekening BCA
          targetAccount: "4001",
          altTargetAccount: "1101"
        });
      }
    });

    // 4. Suntikan Dana / Dropping Kas dari Rekening BCA ke Petty Cash (Transfer Rekening)
    // Sesuai penegasan CFO: "patty cash juga kan suntikan dananya dari transferan rek BCA creatva bridging intern"
    const droppingPettyCashEvents = [
      {
        ref: "TRF-2026-0034",
        rawDate: "2026-06-20",
        deskripsi: "Suntikan Dana Kas Kecil dari Rekening BCA Creativa Bridging Intern",
        amount: 5000000,
        type: "transfer",
        sourceAccount: "1002", // Keluar dari Rekening BCA (Kredit BCA)
        targetAccount: "1001"  // Masuk ke Petty Cash (Debit Petty Cash)
      }
    ];

    // Ambil riwayat transfer tambahan jika ada di localStorage
    try {
      const trfRaw = localStorage.getItem("finance_transfers_history");
      if (trfRaw) {
        const trfList = JSON.parse(trfRaw);
        if (Array.isArray(trfList)) {
          trfList.forEach(t => {
            const isFromBca = (t.dari || "").toLowerCase().includes("bca");
            const isToPetty = (t.ke || "").toLowerCase().includes("petty") || (t.ke || "").toLowerCase().includes("kas");
            if (isFromBca && isToPetty && !addedRefs.has(t.id)) {
              addedRefs.add(t.id);
              events.push({
                ref: t.id,
                rawDate: t.tanggal || "2026-06-20",
                deskripsi: `Suntikan Dana Dropping Kas Kecil dari Rekening BCA (${t.catatan || "Top-up Kasir"})`,
                amount: Number(t.nominal || 0),
                type: "transfer",
                sourceAccount: "1002",
                targetAccount: "1001"
              });
            }
          });
        }
      }
    } catch (e) {}

    droppingPettyCashEvents.forEach(d => {
      if (!addedRefs.has(d.ref)) {
        addedRefs.add(d.ref);
        events.push(d);
      }
    });

    // 5. Penggajian Karyawan Backend (Anggi Alfin, dll.) -> Pengeluaran Besar keluar dari Rekening BCA
    if (Array.isArray(serverSalaries) && serverSalaries.length > 0) {
      serverSalaries.forEach(s => {
        const refKey = s.transfer_reference || `PAYROLL-${s.id}`;
        if (addedRefs.has(refKey)) return;
        addedRefs.add(refKey);

        const amt = Math.abs(Number(s.total_salary || 0));
        events.push({
          ref: refKey,
          rawDate: s.paid_date || s.payday || "2026-10-07",
          deskripsi: `Beban Gaji Karyawan (${s.month || "Periode Berjalan"}) — ${s.employee_name}`,
          amount: amt,
          type: "expense",
          sourceAccount: "5001", // Beban Gaji
          targetAccount: "1002"  // Keluar dari Rekening BCA (Bukan Petty Cash!)
        });
      });
    }

    // 6. Pengeluaran Riil (finance_expense_data)
    // - Belanja kecil, token listrik PLN, ATK, vendor kecil -> Keluar dari Petty Cash (1001)
    // - Pengeluaran besar / via BCA -> Keluar dari Rekening BCA (1002)
    try {
      const expRaw = localStorage.getItem("finance_expense_data");
      if (expRaw) {
        const expList = JSON.parse(expRaw);
        if (Array.isArray(expList)) {
          expList.forEach(exp => {
            const refKey = exp.nomor || `EXP-${exp.id}`;
            if (addedRefs.has(refKey) || addedRefs.has(exp.id)) return;
            addedRefs.add(refKey);

            const amt = Math.abs(Number(exp.nominal || 0));
            const sumber = (exp.sumberDana || "").toLowerCase();
            const descLower = (exp.deskripsi || "").toLowerCase();
            const isSmallExpense = sumber.includes("kas") || sumber.includes("wallet") || descLower.includes("listrik") || descLower.includes("token") || descLower.includes("atk") || descLower.includes("modul") || (amt < 5000000 && !sumber.includes("bca"));

            // Tentukan akun kas/bank asal: Petty Cash (1001) untuk belanja kecil/token listrik/vendor kecil, atau Bank BCA (1002)
            const cashAcc = isSmallExpense ? "1001" : "1002";
            const expAcc = descLower.includes("modul") || descLower.includes("buku") ? "5004" : descLower.includes("gaji") ? "5001" : "5003";

            events.push({
              ref: refKey,
              rawDate: exp.tanggal || "2026-10-01",
              deskripsi: exp.deskripsi || `${exp.kategori || "Pengeluaran"}${exp.vendor ? ` (${exp.vendor})` : ""}`,
              amount: amt,
              type: "expense",
              sourceAccount: expAcc,
              targetAccount: cashAcc
            });
          });
        }
      }
    } catch (e) {}

    // Urutkan seluruh event berdasarkan tanggal secara kronologis (terlama ke terbaru untuk running ledger)
    events.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

    // Saldo awal akun
    let runningBalance = Number(activeCoa.baseSaldo || 0);

    // Entri baris saldo awal
    rows.push({
      id: "saldo-awal",
      rawDate: startDate || "2026-01-01",
      tanggal: formatDateIndo(startDate || "2026-01-01"),
      deskripsi: `Saldo Awal Akun (${activeCoa.kode} - ${activeCoa.nama})`,
      referensi: "SALDO-AWAL",
      debit: 0,
      kredit: 0,
      saldo: runningBalance
    });

    // Iterasi mutasi yang mempengaruhi akun terpilih
    events.forEach((ev, idx) => {
      let debitAmount = 0;
      let kreditAmount = 0;

      // A. Akun Rekening Bank BCA (1002)
      if (targetCode === "1002") {
        if (ev.type === "income" && ev.sourceAccount === "1002") {
          debitAmount = ev.amount; // Uang Masuk Besar ke Bank BCA -> Debit bertambah
        } else if (ev.type === "expense" && ev.targetAccount === "1002") {
          kreditAmount = ev.amount; // Uang Keluar Besar dari Bank BCA (Gaji dll) -> Kredit berkurang
        } else if (ev.type === "transfer" && ev.sourceAccount === "1002") {
          kreditAmount = ev.amount; // Suntikan transfer dana keluar ke Petty Cash -> Kredit berkurang
        }
      }
      // B. Akun Petty Cash / Kas Kecil (1001)
      else if (targetCode === "1001") {
        if (ev.type === "transfer" && ev.targetAccount === "1001") {
          debitAmount = ev.amount; // Suntikan dana transfer masuk dari Rekening BCA -> Debit bertambah
        } else if (ev.type === "expense" && ev.targetAccount === "1001") {
          kreditAmount = ev.amount; // Belanja kecil/token listrik/vendor kecil -> Kredit berkurang
        } else if (ev.type === "income" && ev.sourceAccount === "1001") {
          debitAmount = ev.amount; // Penerimaan kas kecil -> Debit bertambah
        }
      }
      // C. Akun Pendapatan Kursus (4001)
      else if (targetCode === "4001") {
        if (ev.type === "income" && (ev.targetAccount === "4001" || ev.altTargetAccount === "4001")) {
          kreditAmount = ev.amount; // Pendapatan bertambah di Kredit
        }
      }
      // D. Akun Beban Gaji (5001)
      else if (targetCode === "5001") {
        if (ev.type === "expense" && ev.sourceAccount === "5001") {
          debitAmount = ev.amount; // Beban bertambah di Debit
        }
      }
      // E. Akun Beban Operasional, Listrik & Internet (5003)
      else if (targetCode === "5003") {
        if (ev.type === "expense" && ev.sourceAccount === "5003") {
          debitAmount = ev.amount; // Beban bertambah di Debit
        }
      }
      // F. Akun Beban Pengadaan Modul & Seragam (5004)
      else if (targetCode === "5004") {
        if (ev.type === "expense" && ev.sourceAccount === "5004") {
          debitAmount = ev.amount; // Beban bertambah di Debit
        }
      }
      // G. Akun Piutang Siswa (1101)
      else if (targetCode === "1101") {
        if (ev.type === "income") {
          kreditAmount = ev.amount; // Pelunasan mengurangi Piutang di Kredit
        }
      }

      // Jika ada mutasi pada akun ini
      if (debitAmount > 0 || kreditAmount > 0) {
        if (isNormalDebit) {
          runningBalance = runningBalance + debitAmount - kreditAmount;
        } else {
          runningBalance = runningBalance + kreditAmount - debitAmount;
        }

        rows.push({
          id: `ledger-row-${idx}-${ev.ref}`,
          rawDate: ev.rawDate,
          tanggal: formatDateIndo(ev.rawDate),
          deskripsi: ev.deskripsi,
          referensi: ev.ref,
          debit: debitAmount,
          kredit: kreditAmount,
          saldo: runningBalance
        });
      }
    });

    return rows;
  }, [activeCoa, serverSalaries, serverLedger, startDate]);

  // Filtering
  const filteredData = useMemo(() => {
    return ledgerRows.filter(item => {
      if (item.rawDate) {
        if (startDate && item.rawDate < startDate) return false;
        if (endDate && item.rawDate > endDate) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.deskripsi.toLowerCase().includes(q) ||
          item.referensi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledgerRows, startDate, endDate, search]);

  // Hitung total Debit & Kredit untuk akun terpilih
  const summary = useMemo(() => {
    let totD = 0;
    let totK = 0;
    filteredData.forEach(r => {
      totD += (r.debit || 0);
      totK += (r.kredit || 0);
    });
    const lastRow = filteredData[filteredData.length - 1];
    return {
      totalDebit: totD,
      totalKredit: totK,
      finalSaldo: lastRow ? lastRow.saldo : Number(activeCoa.baseSaldo || 0)
    };
  }, [filteredData, activeCoa]);

  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => ({
        Tanggal: d.tanggal,
        Referensi: d.referensi,
        "Deskripsi Transaksi": d.deskripsi,
        Debit: d.debit,
        Kredit: d.kredit,
        "Saldo Berjalan": d.saldo,
      })),
      `General_Ledger_${activeCoa.kode}_${activeCoa.nama.replace(/\s+/g, "_")}`
    );
  };

  const columns = [
    { 
      header: "Tanggal", 
      accessor: "tanggal", 
      className: "whitespace-nowrap font-medium w-28 text-slate-700",
      render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>
    },
    { 
      header: "Deskripsi Transaksi Riil", 
      accessor: "deskripsi", 
      className: "font-semibold text-slate-800",
      render: (r) => (
        <div>
          <div className="text-slate-900 font-medium">{r.deskripsi}</div>
          {r.referensi && r.referensi !== "SALDO-AWAL" && (
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded mt-0.5 inline-block">
              {r.referensi}
            </span>
          )}
        </div>
      )
    },
    { 
      header: "Debit (Masuk)", 
      accessor: "debit", 
      align: "right",
      className: "font-mono font-medium text-emerald-600",
      render: (r) => r.debit > 0 ? `+${formatRupiah(r.debit)}` : "—" 
    },
    { 
      header: "Kredit (Keluar)", 
      accessor: "kredit", 
      align: "right",
      className: "font-mono font-medium text-rose-600",
      render: (r) => r.kredit > 0 ? `-${formatRupiah(r.kredit)}` : "—" 
    },
    { 
      header: "Saldo Berjalan", 
      accessor: "saldo", 
      align: "right", 
      className: "font-mono font-bold text-slate-900",
      render: (r) => formatRupiah(r.saldo) 
    },
  ];

  return (
    <Layout appearance="finance">
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="General Ledger (Buku Besar)"
          subtitle={`Rincian mutasi debit, kredit, dan saldo berjalan riil per akun COA (${activeCoa.kode} - ${activeCoa.nama})`}
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        >
          <button
            type="button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            title="Muat Ulang Buku Besar"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Perbarui Data</span>
          </button>
        </FinancePageHeader>

        {/* 3 KPI Cards Ringkasan Akun */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <FinanceKpiCard
            title="Total Mutasi Debit"
            value={formatRupiah(summary.totalDebit)}
            subtitle={`Akumulasi debit akun ${activeCoa.kode}`}
            icon={ArrowDownRight}
            color="emerald"
          />
          <FinanceKpiCard
            title="Total Mutasi Kredit"
            value={formatRupiah(summary.totalKredit)}
            subtitle={`Akumulasi kredit akun ${activeCoa.kode}`}
            icon={ArrowUpRight}
            color="rose"
          />
          <FinanceKpiCard
            title="Saldo Akhir Berjalan"
            value={formatRupiah(summary.finalSaldo)}
            subtitle={`Saldo akhir COA ${activeCoa.kode} (${activeCoa.nama})`}
            icon={Landmark}
            color="blue"
          />
        </div>

        {/* Filter Bar dengan Dropdown Akun COA Lengkap */}
        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari transaksi atau nomor referensi..."
          dropdowns={[
            {
              value: String(selectedAccount),
              onChange: (val) => {
                setSelectedAccount(val);
                setPage(1);
              },
              options: coaList.map(c => ({
                value: String(c.kode),
                label: `${c.kode} - ${c.nama} (${c.normal})`
              }))
            },
          ]}
          onReset={() => {
            setSelectedAccount("1002");
            setSearch("");
            setStartDate("2026-01-01");
            setEndDate("2026-12-31");
            setPage(1);
          }}
        />

        <FinanceTable
          columns={columns}
          data={paginatedData}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredData.length}
        />
      </div>
    </Layout>
  );
}
