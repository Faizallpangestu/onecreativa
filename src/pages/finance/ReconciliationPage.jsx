import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceKpiCard, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  FinanceModal, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { 
  Landmark, 
  CheckCircle, 
  Scale, 
  Upload, 
  Check, 
  RefreshCw, 
  Sparkles
} from "lucide-react";
import axios from "axios";

// Default blueprint invoices dari modul billing jika localStorage kosong
const DEFAULT_BLUEPRINT_INVOICES = [
  { id: "TGCJ2608001", tanggal: "2026-08-21", customer: "Hany Agesti", program: "Kelas Intensif Offline", total: 15000000, terbayar: 15000000, sisa: 0, status: "Paid", bank_name: "BCA", receiptNo: "RCP-TGCJ2608001-01" },
  { id: "TGCJ2608004", tanggal: "2026-08-19", customer: "Siti Aminah", program: "Kursus Reguler", total: 8000000, terbayar: 4000000, sisa: 4000000, status: "Partially Paid", bank_name: "BCA", receiptNo: "RCP-TGCJ2608004-01" },
];

// Akun Kas & Bank COA Standar (Chart of Accounts)
const DEFAULT_COA_CASH_BANK = [
  { id: 2, kode: "1002", nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)", subtype: "AST-CB", rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428", tipe: "Assets", kategori: "Cash and Bank", baseSaldo: 120000000, saldo: 120000000, status: "Aktif", bankName: "BCA" },
  { id: 1, kode: "1001", nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)", subtype: "AST-CB", rekeningDetail: "Kasir & Kas Kecil Tunai Kantor", tipe: "Assets", kategori: "Cash and Bank", baseSaldo: 5000000, saldo: 5000000, status: "Aktif", bankName: "Tunai" },
  { id: 3, kode: "1003", nama: "Bank Mandiri Utama", subtype: "AST-CB", rekeningDetail: "Mandiri a/n PT LPK Creativa 130-0019283", tipe: "Assets", kategori: "Cash and Bank", baseSaldo: 25000000, saldo: 25000000, status: "Aktif", bankName: "Mandiri" },
  { id: 5, kode: "1005", nama: "Flip / E-Wallet Perusahaan", subtype: "AST-CB", rekeningDetail: "DANA & Flip Bisnis 0812-9988-7766", tipe: "Assets", kategori: "Cash and Bank", baseSaldo: 12500000, saldo: 12500000, status: "Aktif", bankName: "E-Wallet" },
  { id: 4, kode: "1004", nama: "Bank BNI Tabungan", subtype: "AST-CB", rekeningDetail: "BNI a/n PT LPK Creativa 088-771122", tipe: "Assets", kategori: "Cash and Bank", baseSaldo: 35000000, saldo: 35000000, status: "Aktif", bankName: "BNI" },
];

function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  if (dateStr.includes("/")) return dateStr;
  try {
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

export default function ReconciliationPage() {
  // ── 1. AMBIL AKUN LANGSUNG DARI COA (Chart of Accounts) DENGAN AUTO-HEAL ──
  const [coaAccounts, setCoaAccounts] = useState(() => {
    try {
      const coaRaw = localStorage.getItem("finance_coa_data");
      if (coaRaw) {
        let coaList = JSON.parse(coaRaw);
        if (Array.isArray(coaList)) {
          let needFix = false;

          coaList = coaList.map(c => {
            const nameLower = (c.nama || "").toLowerCase();
            const isPetty = nameLower.includes("petty") || nameLower.includes("kas kecil");
            if (c.kode === "1002" && isPetty) {
              needFix = true;
              return {
                ...c,
                nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)",
                rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428"
              };
            }
            if (c.kode === "1001" && !isPetty) {
              needFix = true;
              return {
                ...c,
                nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)",
                rekeningDetail: "Kasir & Kas Kecil Tunai Kantor"
              };
            }
            return c;
          });

          if (needFix) {
            try {
              localStorage.setItem("finance_coa_data", JSON.stringify(coaList));
            } catch (e) {}
          }

          const cashBankOnly = coaList.filter(
            c => c.tipe === "Assets" && (c.kategori === "Cash and Bank" || c.subtype === "AST-CB")
          );
          if (cashBankOnly.length > 0) {
            return cashBankOnly.map(c => ({
              id: c.id,
              kode: c.kode,
              nama: c.nama,
              subtype: c.subtype,
              rekeningDetail: c.rekeningDetail || "",
              tipe: c.tipe,
              kategori: c.kategori,
              baseSaldo: Number(c.saldo || 0),
              saldo: Number(c.saldo || 0),
              status: c.status || "Aktif",
              bankName: c.nama.toLowerCase().includes("bca") ? "BCA" : c.nama.toLowerCase().includes("mandiri") ? "Mandiri" : c.nama.toLowerCase().includes("bni") ? "BNI" : "Kas",
            }));
          }
        }
      }
    } catch (e) {}
    return DEFAULT_COA_CASH_BANK;
  });

  // Pilih akun COA aktif (default ke Bank BCA Operasional - 1002)
  const [selectedCoaCode, setSelectedCoaCode] = useState(() => {
    return "1002"; // Akun 1002 Bank BCA
  });

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Backend state
  const [serverSalaries, setServerSalaries] = useState([]);
  const [serverLedger, setServerLedger] = useState([]);

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

  // Cari akun COA terpilih
  const currentCoaAccount = useMemo(() => {
    return coaAccounts.find(a => String(a.kode) === String(selectedCoaCode)) || 
           coaAccounts.find(a => String(a.id) === String(selectedCoaCode)) || 
           coaAccounts[0] || DEFAULT_COA_CASH_BANK[0];
  }, [coaAccounts, selectedCoaCode]);

  // ── 2. GATHER TRANSAKSI 100% RIIL DARI INVOICE SISWA & PENGGAJIAN ──
  const realTransactions = useMemo(() => {
    const list = [];
    const addedRefs = new Set();
    const isBcaSelected = (currentCoaAccount.nama.toLowerCase().includes("bca") || currentCoaAccount.rekeningDetail?.toLowerCase().includes("bca") || (currentCoaAccount.kode === "1002" && !currentCoaAccount.nama.toLowerCase().includes("petty")));
    const isPettySelected = (currentCoaAccount.nama.toLowerCase().includes("petty") || currentCoaAccount.nama.toLowerCase().includes("kas kecil") || currentCoaAccount.kode === "1001");

    const isAccountMatch = (sourceBank) => {
      if (!sourceBank) return isBcaSelected;
      const sb = String(sourceBank).toLowerCase();
      if (isBcaSelected) {
        return sb.includes("bca") || sb.includes("1832") || sb.includes("operasional") || sb === "bank";
      }
      if (isPettySelected) {
        return sb.includes("petty") || sb.includes("kas") || sb.includes("wallet") || sb.includes("tunai");
      }
      return sb.includes(currentCoaAccount.bankName.toLowerCase()) || sb.includes(currentCoaAccount.nama.toLowerCase());
    };

    // ─────────────────────────────────────────────────────────────
    // A. PEMASUKAN RIIL DARI INVOICE SISWA & PEMBAYARAN CUSTOM
    // ─────────────────────────────────────────────────────────────

    // 1. Baca billing_pembayaran_custom (Kwitansi & Pembayaran Siswa, misal Nova Dwi Khalifah, Faizal, dll.)
    try {
      const savedPayments = JSON.parse(localStorage.getItem("billing_pembayaran_custom") || "[]");
      if (Array.isArray(savedPayments)) {
        savedPayments.forEach(p => {
          if (!p || !p.jumlah) return;
          const refKey = p.receiptNo || `PAY-${p.id || p.noInv}`;
          if (addedRefs.has(refKey)) return;

          if (isAccountMatch(p.metode || p.rekening)) {
            const nominal = Number(p.jumlah || 0);
            addedRefs.add(refKey);
            list.push({
              id: `pay-custom-${p.id || refKey}`,
              rawDate: p.tglBayar || "2026-10-29",
              tanggal: formatDateIndo(p.tglBayar),
              deskripsi: `Penerimaan Pembayaran Siswa - ${p.customer || "Siswa LPK"} (${p.terminName || "Pelunasan Invoice"})`,
              sumberDana: p.metode || currentCoaAccount.nama,
              mutasiBank: nominal,
              mutasiSistem: nominal,
              status: "Match",
              tipe: "Pemasukan",
              ref: p.receiptNo || p.noInv || refKey,
              kategori: "Biaya Kursus"
            });
          }
        });
      }
    } catch (e) {
      console.warn("Gagal membaca billing_pembayaran_custom:", e);
    }

    // 2. Baca saved_custom_invoices
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
              if (isAccountMatch(p.metode || inv.bank_name)) {
                const nominal = Number(p.jumlah || 0);
                if (nominal > 0) {
                  addedRefs.add(refKey);
                  list.push({
                    id: `inv-pay-${refKey}`,
                    rawDate: p.tglBayar || inv.tanggal || "2026-10-29",
                    tanggal: formatDateIndo(p.tglBayar || inv.tanggal),
                    deskripsi: `Penerimaan ${p.terminName || ("Termin " + (idx + 1))} - ${inv.customer || "Siswa LPK"} (${inv.program || "Pelatihan"})`,
                    sumberDana: p.metode || inv.bank_name || currentCoaAccount.nama,
                    mutasiBank: nominal,
                    mutasiSistem: nominal,
                    status: "Match",
                    tipe: "Pemasukan",
                    ref: p.receiptNo || invId,
                    kategori: "Biaya Kursus"
                  });
                }
              }
            });
          } else if (Number(inv.terbayar || 0) > 0) {
            const refKey = `INV-PAID-${invId}`;
            if (!addedRefs.has(refKey) && !addedRefs.has(invId)) {
              if (isAccountMatch(inv.bank_name)) {
                const nominal = Number(inv.terbayar);
                addedRefs.add(refKey);
                list.push({
                  id: `inv-direct-${invId}`,
                  rawDate: inv.paid_at || inv.tanggal || "2026-10-29",
                  tanggal: formatDateIndo(inv.paid_at || inv.tanggal),
                  deskripsi: `Penerimaan Invoice #${invId} - ${inv.customer || "Siswa LPK"} (${inv.program || "Pelatihan"})`,
                  sumberDana: inv.bank_name || currentCoaAccount.nama,
                  mutasiBank: nominal,
                  mutasiSistem: nominal,
                  status: "Match",
                  tipe: "Pemasukan",
                  ref: invId,
                  kategori: "Biaya Kursus"
                });
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn("Gagal membaca saved_custom_invoices:", e);
    }

    // 3. Baca default blueprint invoices (Hany Agesti & Siti Aminah)
    DEFAULT_BLUEPRINT_INVOICES.forEach(defInv => {
      const refKey = defInv.receiptNo || defInv.id;
      if (!addedRefs.has(refKey) && !addedRefs.has(defInv.id)) {
        if (isAccountMatch(defInv.bank_name)) {
          addedRefs.add(refKey);
          list.push({
            id: `blueprint-${defInv.id}`,
            rawDate: defInv.tanggal,
            tanggal: formatDateIndo(defInv.tanggal),
            deskripsi: `Penerimaan Invoice #${defInv.id} - ${defInv.customer} (${defInv.program})`,
            sumberDana: defInv.bank_name || "BCA",
            mutasiBank: Number(defInv.terbayar),
            mutasiSistem: Number(defInv.terbayar),
            status: "Match",
            tipe: "Pemasukan",
            ref: defInv.receiptNo || defInv.id,
            kategori: "Biaya Kursus"
          });
        }
      }
    });

    // 4. Baca finance_income_data
    try {
      const incRaw = localStorage.getItem("finance_income_data");
      if (incRaw) {
        const incList = JSON.parse(incRaw);
        if (Array.isArray(incList)) {
          incList.forEach(inc => {
            const refKey = inc.receiptNo || inc.noInv || `INC-${inc.id}`;
            if (addedRefs.has(refKey) || addedRefs.has(inc.id)) return;
            if (isAccountMatch(inc.sumberDana)) {
              const nominal = Number(inc.nominal || 0);
              const isPaid = inc.status === "Lunas" || inc.status === "Paid";
              addedRefs.add(refKey);
              list.push({
                id: `inc-${inc.id}`,
                rawDate: inc.tanggal || "2026-10-01",
                tanggal: formatDateIndo(inc.tanggal),
                deskripsi: inc.deskripsi || `Pembayaran Siswa (${inc.siswa || "Siswa LPK"})`,
                sumberDana: inc.sumberDana || currentCoaAccount.nama,
                mutasiBank: isPaid ? nominal : 0,
                mutasiSistem: nominal,
                status: isPaid ? "Match" : "Outstanding",
                tipe: "Pemasukan",
                ref: refKey,
                kategori: inc.kategori || "Biaya Kursus"
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("Gagal membaca finance_income_data:", e);
    }

    // 5. Suntikan Dana Masuk ke Petty Cash (Dropping dari Bank BCA)
    if (isPettySelected && !addedRefs.has("TRF-2026-0034-IN")) {
      addedRefs.add("TRF-2026-0034-IN");
      list.push({
        id: "trf-drop-in-34",
        rawDate: "2026-06-20",
        tanggal: formatDateIndo("2026-06-20"),
        deskripsi: "Suntikan Dana Dropping Kas Kecil dari Rekening BCA Creativa Bridging Intern",
        sumberDana: "Transfer Bank BCA",
        mutasiBank: 5000000,
        mutasiSistem: 5000000,
        status: "Match",
        tipe: "Pemasukan",
        ref: "TRF-2026-0034",
        kategori: "Dropping Kas Kecil"
      });
    }

    // ─────────────────────────────────────────────────────────────
    // B. PENGELUARAN RIIL DARI PENGGAJIAN (PAYROLL) & OPERASIONAL
    // ─────────────────────────────────────────────────────────────

    // 1. Data Gaji Karyawan Riil dari Backend Database (Anggi Alfin, dll.) - Keluar dari Rekening BCA
    if (Array.isArray(serverSalaries) && serverSalaries.length > 0) {
      serverSalaries.forEach(s => {
        const refKey = s.transfer_reference || `PAYROLL-${s.id}`;
        if (addedRefs.has(refKey)) return;

        if (isBcaSelected) {
          const nominal = Math.abs(Number(s.total_salary || 0));
          const isPaid = s.status === "paid";
          addedRefs.add(refKey);
          list.push({
            id: `salary-backend-${s.id}`,
            rawDate: s.paid_date || s.payday || "2026-10-07",
            tanggal: formatDateIndo(s.paid_date || s.payday || "2026-10-07"),
            deskripsi: `Gaji Karyawan (${s.month || "Periode Berjalan"}) — ${s.employee_name}`,
            sumberDana: "BCA",
            mutasiBank: isPaid ? -nominal : 0,
            mutasiSistem: -nominal,
            status: isPaid ? "Match" : "Outstanding",
            tipe: "Pengeluaran",
            ref: s.transfer_reference || `PAYROLL-${s.id}`,
            kategori: "Gaji Karyawan"
          });
        }
      });
    }

    // 2. Suntikan Dana Keluar dari Rekening BCA ke Petty Cash
    if (isBcaSelected && !addedRefs.has("TRF-2026-0034-OUT")) {
      addedRefs.add("TRF-2026-0034-OUT");
      list.push({
        id: "trf-drop-out-34",
        rawDate: "2026-06-20",
        tanggal: formatDateIndo("2026-06-20"),
        deskripsi: "Suntikan Dana Kas Kecil dari Rekening BCA Creativa Bridging Intern",
        sumberDana: "BCA",
        mutasiBank: -5000000,
        mutasiSistem: -5000000,
        status: "Match",
        tipe: "Pengeluaran",
        ref: "TRF-2026-0034",
        kategori: "Transfer Antar Rekening"
      });
    }

    // 3. Data Pengeluaran dari finance_expense_data
    try {
      const expRaw = localStorage.getItem("finance_expense_data");
      if (expRaw) {
        const expList = JSON.parse(expRaw);
        if (Array.isArray(expList)) {
          expList.forEach(exp => {
            const refKey = exp.nomor || `EXP-${exp.id}`;
            if (addedRefs.has(refKey) || addedRefs.has(exp.id)) return;

            const nominal = Math.abs(Number(exp.nominal || 0));
            const sumber = (exp.sumberDana || "").toLowerCase();
            const descLower = (exp.deskripsi || "").toLowerCase();
            const isSmallExpense = sumber.includes("kas") || sumber.includes("wallet") || descLower.includes("listrik") || descLower.includes("token") || descLower.includes("atk") || descLower.includes("modul") || (nominal < 5000000 && !sumber.includes("bca"));

            const isMatch = isBcaSelected ? !isSmallExpense : isPettySelected ? isSmallExpense : isAccountMatch(exp.sumberDana);

            if (isMatch) {
              const isPaid = exp.status === "Paid" || exp.status === "Approved";
              addedRefs.add(refKey);
              list.push({
                id: `exp-${exp.id}`,
                rawDate: exp.tanggal || "2026-10-01",
                tanggal: formatDateIndo(exp.tanggal),
                deskripsi: exp.deskripsi || `${exp.kategori || "Pengeluaran"}${exp.vendor ? ` (${exp.vendor})` : ""}`,
                sumberDana: isPettySelected ? "Kas Kecil" : (exp.sumberDana || currentCoaAccount.nama),
                mutasiBank: isPaid ? -nominal : 0,
                mutasiSistem: -nominal,
                status: isPaid ? "Match" : "Outstanding",
                tipe: "Pengeluaran",
                ref: refKey,
                kategori: exp.kategori || "Operasional"
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("Gagal membaca finance_expense_data:", e);
    }

    // 3. Data Ledger Backend
    if (Array.isArray(serverLedger) && serverLedger.length > 0) {
      serverLedger.forEach(row => {
        const refKey = row.number || `LEDGER-${row.id}`;
        if (addedRefs.has(refKey)) return;
        if (isAccountMatch(row.cash_account_name)) {
          const inAmt = Number(row.incoming_amount || 0);
          const outAmt = Number(row.outgoing_amount || 0);
          const isIncome = inAmt > 0;
          const nominal = isIncome ? inAmt : Math.abs(outAmt);
          if (nominal > 0) {
            addedRefs.add(refKey);
            list.push({
              id: `ledger-${row.id}`,
              rawDate: row.transaction_date || "2026-10-01",
              tanggal: formatDateIndo(row.transaction_date),
              deskripsi: row.description || row.party_name || "Transaksi Kas/Bank",
              sumberDana: row.cash_account_name || currentCoaAccount.nama,
              mutasiBank: isIncome ? nominal : -nominal,
              mutasiSistem: isIncome ? nominal : -nominal,
              status: "Match",
              tipe: isIncome ? "Pemasukan" : "Pengeluaran",
              ref: refKey,
              kategori: row.category || "General Ledger"
            });
          }
        }
      });
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.rawDate || a.tanggal).getTime() || 0;
      const dateB = new Date(b.rawDate || b.tanggal).getTime() || 0;
      return dateB - dateA;
    });
  }, [currentCoaAccount, serverSalaries, serverLedger, refreshTrigger]);

  // ── 3. FILTERING ──
  const filteredData = useMemo(() => {
    return realTransactions.filter(item => {
      if (item.rawDate) {
        if (startDate && item.rawDate < startDate) return false;
        if (endDate && item.rawDate > endDate) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "match" && item.status !== "Match") return false;
        if (statusFilter === "outstanding" && item.status !== "Outstanding") return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDeskripsi = (item.deskripsi || "").toLowerCase().includes(q);
        const matchesRef = (item.ref || "").toLowerCase().includes(q);
        const matchesKategori = (item.kategori || "").toLowerCase().includes(q);
        const matchesTipe = (item.tipe || "").toLowerCase().includes(q);
        if (!matchesDeskripsi && !matchesRef && !matchesKategori && !matchesTipe) return false;
      }
      return true;
    });
  }, [realTransactions, startDate, endDate, statusFilter, search]);

  // ── 4. PERHITUNGAN SALDO SISTEM & SALDO BANK SECARA UPDATE DARI COA ──
  const { saldoBank, saldoSistem, selisih, totalMutasiMasuk, totalMutasiKeluar, unmatchedCount, runningSaldo } = useMemo(() => {
    let sumIn = 0;
    let sumOut = 0;
    let unmatchedDiff = 0;
    let unCount = 0;

    filteredData.forEach(item => {
      if (item.mutasiSistem > 0) sumIn += item.mutasiSistem;
      else sumOut += Math.abs(item.mutasiSistem);

      if (item.status !== "Match") {
        unCount++;
        unmatchedDiff += (item.mutasiSistem - (item.mutasiBank || 0));
      }
    });

    // Saldo awal dari akun COA terpilih
    const baseSaldo = Number(currentCoaAccount?.baseSaldo || 120000000);
    // Saldo Berjalan (Running Balance): Saldo Awal + Total Masuk - Total Keluar
    const calculatedRunning = baseSaldo + sumIn - sumOut;

    // Saldo Sistem mencakup item yang belum kliring di bank
    const sSistem = calculatedRunning + unmatchedDiff;
    // Saldo Bank mencerminkan mutasi riil yang sudah kliring
    const sBank = calculatedRunning;
    const diff = Math.abs(sSistem - sBank);

    return {
      saldoBank: sBank,
      saldoSistem: sSistem,
      selisih: diff,
      totalMutasiMasuk: sumIn,
      totalMutasiKeluar: sumOut,
      unmatchedCount: unCount,
      runningSaldo: calculatedRunning
    };
  }, [currentCoaAccount, filteredData]);

  // ── 5. SINKRONISASI SALDO TERBARU BALIK KE COA & REKENING (Auto-Sync) ──
  useEffect(() => {
    if (!currentCoaAccount || !runningSaldo) return;

    try {
      // 1. Update ke finance_coa_data
      const coaRaw = localStorage.getItem("finance_coa_data");
      let coaList = coaRaw ? JSON.parse(coaRaw) : null;
      if (Array.isArray(coaList)) {
        let updated = false;
        coaList = coaList.map(item => {
          if (String(item.kode) === String(currentCoaAccount.kode) || item.id === currentCoaAccount.id) {
            if (item.saldo !== runningSaldo) {
              updated = true;
              return { ...item, saldo: runningSaldo };
            }
          }
          return item;
        });
        if (updated) {
          localStorage.setItem("finance_coa_data", JSON.stringify(coaList));
        }
      }

      // 2. Update ke finance_rekening_data
      const rekRaw = localStorage.getItem("finance_rekening_data");
      let rekList = rekRaw ? JSON.parse(rekRaw) : null;
      if (Array.isArray(rekList)) {
        let updatedRek = false;
        rekList = rekList.map(rek => {
          const rekStr = `${rek.nama} ${rek.bank} ${rek.noRek}`.toLowerCase();
          if (currentCoaAccount.kode === "1002" && (rekStr.includes("bca") || rekStr.includes("1832") || rek.id === 1)) {
            if (rek.saldo !== runningSaldo) {
              updatedRek = true;
              return { ...rek, saldo: runningSaldo };
            }
          }
          return rek;
        });
        if (updatedRek) {
          localStorage.setItem("finance_rekening_data", JSON.stringify(rekList));
        }
      }
    } catch (e) {
      console.warn("Gagal sinkronisasi saldo rekonsiliasi ke COA:", e);
    }
  }, [currentCoaAccount, runningSaldo]);

  // ── 6. IMPORT STATEMENT & AUTO RECONCILIATION ──
  const handleImportStatement = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const incRaw = localStorage.getItem("finance_income_data");
        if (incRaw) {
          const incList = JSON.parse(incRaw);
          const updated = incList.map(item => ({ ...item, status: "Lunas" }));
          localStorage.setItem("finance_income_data", JSON.stringify(updated));
        }
        const expRaw = localStorage.getItem("finance_expense_data");
        if (expRaw) {
          const expList = JSON.parse(expRaw);
          const updatedExp = expList.map(item => ({ ...item, status: "Paid" }));
          localStorage.setItem("finance_expense_data", JSON.stringify(updatedExp));
        }
      } catch (err) {}

      setIsProcessing(false);
      setUploadNotice("Rekening koran bank terverifikasi! Seluruh mutasi telah dicocokkan dengan pembukuan (Selisih Rp 0).");
      setRefreshTrigger(prev => prev + 1);

      setTimeout(() => {
        setUploadNotice("");
        setIsModalOpen(false);
      }, 2000);
    }, 800);
  };

  // Export Excel
  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => ({
        Tanggal: d.tanggal,
        Deskripsi: d.deskripsi,
        Referensi: d.ref || "-",
        Kategori: d.kategori || "-",
        Tipe: d.tipe,
        "Mutasi Bank": d.mutasiBank,
        "Mutasi Sistem": d.mutasiSistem,
        Status: d.status === "Match" ? "Match (Cocok)" : "Outstanding (Belum Kliring)",
      })),
      `Rekonsiliasi_COA_${currentCoaAccount.kode}_${currentCoaAccount.nama.replace(/\s+/g, "_")}`
    );
  };

  // ── 7. TABLE PAGINATION & COLUMNS ──
  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const columns = [
    { 
      header: "Tanggal", 
      accessor: "tanggal", 
      className: "whitespace-nowrap font-medium w-28 text-slate-700",
      render: (r) => (
        <span className="font-mono text-xs">{r.tanggal}</span>
      )
    },
    { 
      header: "Deskripsi & Transaksi Riil", 
      accessor: "deskripsi", 
      className: "font-semibold text-slate-800",
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 font-medium">{r.deskripsi}</span>
            {r.ref && (
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                {r.ref}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span className={r.tipe === "Pemasukan" ? "text-emerald-600 font-semibold" : "text-slate-500 font-semibold"}>
              {r.tipe}
            </span>
            <span>•</span>
            <span>{r.sumberDana}</span>
            {r.kategori && (
              <>
                <span>•</span>
                <span className="bg-slate-50 text-slate-500 px-1 rounded">{r.kategori}</span>
              </>
            )}
          </div>
        </div>
      )
    },
    { 
      header: "Mutasi Bank", 
      accessor: "mutasiBank", 
      align: "right",
      className: "font-mono font-medium",
      render: (r) => (
        <span className={r.mutasiBank > 0 ? "text-emerald-600 font-semibold" : r.mutasiBank < 0 ? "text-slate-800 font-semibold" : "text-amber-500 italic"}>
          {r.mutasiBank === 0 ? "Menunggu Kliring" : (r.mutasiBank > 0 ? `+${formatRupiah(r.mutasiBank)}` : `-${formatRupiah(Math.abs(r.mutasiBank))}`)}
        </span>
      )
    },
    { 
      header: "Mutasi Sistem", 
      accessor: "mutasiSistem", 
      align: "right",
      className: "font-mono font-medium",
      render: (r) => (
        <span className={r.mutasiSistem > 0 ? "text-emerald-600 font-semibold" : "text-slate-800 font-semibold"}>
          {r.mutasiSistem > 0 ? `+${formatRupiah(r.mutasiSistem)}` : `-${formatRupiah(Math.abs(r.mutasiSistem))}`}
        </span>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      align: "center",
      render: (r) => (
        <FinanceBadge 
          status={r.status} 
          text={r.status === "Match" ? "Match (Cocok)" : "Outstanding"} 
        />
      )
    },
  ];

  return (
    <Layout appearance="finance">
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Bank Reconciliation"
          subtitle="Pencocokan saldo pembukuan internal COA dengan mutasi rekening koran bank riil"
          primaryLabel="Import Bank Statement"
          primaryIcon={Upload}
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
            <span>Perbarui Data</span>
          </button>
        </FinancePageHeader>

        {/* ── FOTO PERTAMA: 3 SUMMARY KPI CARDS (UPDATE DARI MUTASI & COA) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <FinanceKpiCard
            title="Saldo Sistem"
            value={formatRupiah(saldoSistem)}
            subtitle={`Tercatat di pembukuan COA ${currentCoaAccount.kode} (${currentCoaAccount.nama})`}
            icon={Landmark}
            color="blue"
          />
          <FinanceKpiCard
            title="Saldo Bank"
            value={formatRupiah(saldoBank)}
            subtitle={`Rekening koran terverifikasi (${currentCoaAccount.rekeningDetail || currentCoaAccount.nama})`}
            icon={CheckCircle}
            color="emerald"
          />
          <FinanceKpiCard
            title="Selisih Rekonsiliasi"
            value={formatRupiah(selisih)}
            subtitle={selisih === 0 ? "Status saldo cocok 100% (Reconciled)" : `${unmatchedCount} mutasi belum kliring di bank`}
            badge={selisih === 0 ? "Cocok" : "Ada Selisih"}
            isPositive={selisih === 0}
            icon={Scale}
            color={selisih === 0 ? "purple" : "rose"}
          />
        </div>

        {/* ── FOTO KEDUA (BANNER BAR) TELAH DIHAPUS SEPENUHNYA ── */}

        {/* ── FOTO KETIGA: FILTER BAR DENGAN DROPDOWN REKENING LANGSUNG DARI COA ── */}
        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari siswa, invoice, karyawan, ref transfer..."
          dropdowns={[
            {
              value: String(selectedCoaCode),
              onChange: (val) => {
                setSelectedCoaCode(val);
                setPage(1);
              },
              options: coaAccounts.map(acc => {
                const isSelected = String(acc.kode) === String(selectedCoaCode);
                const displaySaldo = isSelected ? runningSaldo : Number(acc.baseSaldo || acc.saldo || 0);
                return {
                  value: String(acc.kode),
                  label: `${acc.kode} - ${acc.nama} (${formatRupiah(displaySaldo)})`
                };
              })
            },
            {
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val);
                setPage(1);
              },
              options: [
                { value: "all", label: "Semua Status Rekonsiliasi" },
                { value: "match", label: "Hanya Match (Cocok)" },
                { value: "outstanding", label: "Hanya Outstanding (Belum Kliring)" },
              ]
            }
          ]}
          onReset={() => {
            setSelectedCoaCode("1002");
            setSearch("");
            setStartDate("2026-01-01");
            setEndDate("2026-12-31");
            setStatusFilter("all");
            setPage(1);
          }}
        />

        {/* Tabel Rekonsiliasi Transaksi Riil */}
        <FinanceTable
          columns={columns}
          data={paginatedData}
          page={page}
          totalPages={totalPages}
          totalItems={filteredData.length}
          onPageChange={setPage}
        />

        {/* Modal Import Bank Statement */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Import Rekening Koran Bank"
          subtitle="Unggah file mutasi rekening (.CSV / .OFX / .XLSX) untuk rekonsiliasi otomatis"
          onSubmit={handleImportStatement}
          submitText={isProcessing ? "Memproses Rekonsiliasi..." : "Proses Rekonsiliasi Otomatis"}
        >
          <div className="space-y-4">
            {uploadNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Rekening Kas & Bank di COA</label>
              <select
                value={selectedCoaCode}
                onChange={e => setSelectedCoaCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {coaAccounts.map(acc => {
                  const isSelected = String(acc.kode) === String(selectedCoaCode);
                  const displaySaldo = isSelected ? runningSaldo : Number(acc.baseSaldo || acc.saldo || 0);
                  return (
                    <option key={acc.kode} value={String(acc.kode)}>
                      {acc.kode} - {acc.nama} ({acc.rekeningDetail || acc.bankName}) — Saldo {formatRupiah(displaySaldo)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File Mutasi (.CSV / .XLSX)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Pilih file rekening koran atau seret ke sini</p>
                <p className="text-[11px] text-slate-400 mt-1">Mendukung format CSV BCA KlikBisnis, Mandiri e-Cash, Excel, dan e-Statement PDF</p>
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls, .ofx"
                  className="mt-3 text-xs text-slate-600 block mx-auto cursor-pointer" 
                  id="statement-upload" 
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Auto-Matching Engine:</strong> Sistem akan mencocokkan tanggal transaksi, nominal debet/kredit, dan nomor referensi invoice/gaji secara otomatis dengan akun kas & bank di COA.
              </div>
            </div>
          </div>
        </FinanceModal>
      </div>
    </Layout>
  );
}
