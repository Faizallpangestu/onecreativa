import React, { useState, useEffect } from "react";
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
import { FileText, Clock, CheckCircle2, AlertTriangle, Eye, Plus, Trash2, UserCheck, Building2, CreditCard } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";

// Master vendor cadangan yang selaras 100% dengan Menu Vendor (VendorsPage)
const INITIAL_VENDORS_MASTER = [
  { id: 1, nama: "CV Sukses Listrik", kategori: "Operasional", kontak: "0812-xxxx-1234", email: "sukseslistrik@gmail.com", alamat: "Jl. Raya Cianjur No. 45", status: "Aktif" },
  { id: 2, nama: "PT Maju Internet", kategori: "Operasional", kontak: "0813-xxxx-5678", email: "sales@majuinternet.net", alamat: "Gedung Cyber Lt. 3, Jakarta", status: "Aktif" },
  { id: 3, nama: "Toko Office Equipment", kategori: "Peralatan", kontak: "0817-xxxx-9012", email: "office.eq@toko.com", alamat: "Jl. Pasirhayam, Cianjur", status: "Aktif" },
  { id: 4, nama: "Percetakan Mitra", kategori: "Modul & Bahan", kontak: "0852-xxxx-3456", email: "mitraprint@gmail.com", alamat: "Jl. Siliwangi No. 12", status: "Aktif" },
  { id: 5, nama: "Klinik Medika Pratama", kategori: "Medical Checkup", kontak: "0811-xxxx-4433", email: "info@medikapratama.id", alamat: "Jl. Dr. Muwardi, Cianjur", status: "Aktif" },
  { id: 6, nama: "Toko ATK Sentosa", kategori: "ATK", kontak: "0819-xxxx-7788", email: "atksentosa@gmail.com", alamat: "Jl. Mangunsarkoro, Cianjur", status: "Aktif" },
];

function getVendorsFromMenu() {
  try {
    const deletedVendorIds = JSON.parse(localStorage.getItem("finance_deleted_vendor_ids") || "[]");
    const saved = localStorage.getItem("finance_vendors_data");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(v => 
          !deletedVendorIds.includes(String(v.id)) && 
          !deletedVendorIds.includes(v.nama) &&
          (v.status ? v.status.toLowerCase() !== "nonaktif" : true)
        );
      }
    }
  } catch (e) {}
  return INITIAL_VENDORS_MASTER.filter(v => v.status === "Aktif");
}

function getNowDateTimeLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatWaktuIndo(dtString, fallbackDate) {
  if (!dtString && !fallbackDate) return "—";
  try {
    const raw = dtString || fallbackDate;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const datePart = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    if (raw.includes("T") || raw.includes(":") || raw.includes(" ")) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${datePart}, ${hours}:${minutes} WIB`;
    }
    return `${datePart}, 10:00 WIB`;
  } catch (e) {
    return dtString || fallbackDate || "—";
  }
}

function getNextBillNumber(existingList = []) {
  try {
    const saved = localStorage.getItem("finance_bills_data");
    const fullList = saved ? JSON.parse(saved) : existingList;
    const combined = Array.isArray(fullList) ? fullList : existingList;
    const numbers = combined
      .map(b => {
        const m = String(b.id || "").match(/BILL-(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `BILL-${String(maxNum + 1).padStart(4, "0")}`;
  } catch (e) {
    return `BILL-${String((existingList?.length || 0) + 1).padStart(4, "0")}`;
  }
}

const INITIAL_BILLS = [
  { id: "BILL-0001", tanggal: "2026-10-01", jatuhTempo: "2026-10-15", vendor: "CV Sukses Listrik", total: 1800000, status: "Belum Dibayar", deskripsi: "Instalasi dan perbaikan panel listrik kantor" },
  { id: "BILL-0002", tanggal: "2026-09-28", jatuhTempo: "2026-10-05", vendor: "PT Maju Internet", total: 700000, status: "Lunas", waktuPelunasan: "2026-09-29T10:15", petugasPelunasan: "FINANCE LPK CREATIVA", akunBayar: "Petty Cash", deskripsi: "Tagihan koneksi internet fiber bulan September" },
  { id: "BILL-0003", tanggal: "2026-09-20", jatuhTempo: "2026-09-30", vendor: "PT Office Equipment", total: 2500000, status: "Jatuh Tempo", deskripsi: "Sewa mesin fotokopi dan supplies printer" },
  { id: "BILL-0004", tanggal: "2026-09-15", jatuhTempo: "2026-10-15", vendor: "Percetakan Mitra", total: 4500000, status: "Lunas", waktuPelunasan: "2026-09-15T14:20", petugasPelunasan: "FINANCE LPK CREATIVA", akunBayar: "Petty Cash", deskripsi: "Cetak modul diktat bahasa Jepang N4" },
  { id: "BILL-0005", tanggal: "2026-09-10", jatuhTempo: "2026-09-25", vendor: "Toko ATK Sentosa", total: 1200000, status: "Lunas", waktuPelunasan: "2026-09-11T09:30", petugasPelunasan: "FINANCE LPK CREATIVA", akunBayar: "Petty Cash", deskripsi: "Pengadaan kertas A4, spidol, dan alat tulis" },
];

export default function BillsPage() {
  const [data, setData] = useState(() => {
    try {
      const deletedIds = JSON.parse(localStorage.getItem("finance_deleted_bill_ids") || "[]");
      const saved = localStorage.getItem("finance_bills_data");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(b => !deletedIds.includes(String(b.id))).map(b => ({
            ...b,
            waktuPelunasan: b.waktuPelunasan || (b.status === "Lunas" ? (b.tanggal ? `${b.tanggal}T10:00` : getNowDateTimeLocal()) : null),
            petugasPelunasan: b.petugasPelunasan || (b.status === "Lunas" ? "FINANCE LPK CREATIVA" : null),
          }));
        }
      }
      return INITIAL_BILLS.filter(b => !deletedIds.includes(String(b.id))).map(b => ({
        ...b,
        waktuPelunasan: b.waktuPelunasan || (b.status === "Lunas" ? `${b.tanggal}T10:00` : null),
        petugasPelunasan: b.petugasPelunasan || (b.status === "Lunas" ? "FINANCE LPK CREATIVA" : null),
      }));
    } catch (e) {}
    return INITIAL_BILLS;
  });

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("finance_bills_data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  // Listener sinkronisasi tagihan antar tab
  useEffect(() => {
    const handleRemoteBillsUpdate = () => {
      try {
        const deletedIds = JSON.parse(localStorage.getItem("finance_deleted_bill_ids") || "[]");
        const saved = localStorage.getItem("finance_bills_data");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setData(parsed.filter(b => !deletedIds.includes(String(b.id))).map(b => ({
              ...b,
              waktuPelunasan: b.waktuPelunasan || (b.status === "Lunas" ? (b.tanggal ? `${b.tanggal}T10:00` : getNowDateTimeLocal()) : null),
              petugasPelunasan: b.petugasPelunasan || (b.status === "Lunas" ? "FINANCE LPK CREATIVA" : null),
            })));
          }
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleRemoteBillsUpdate);
    window.addEventListener("finance_bills_updated", handleRemoteBillsUpdate);

    let bc = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("finance_bills_channel");
      bc.onmessage = () => {
        handleRemoteBillsUpdate();
      };
    }

    return () => {
      window.removeEventListener("storage", handleRemoteBillsUpdate);
      window.removeEventListener("finance_bills_updated", handleRemoteBillsUpdate);
      if (bc) bc.close();
    };
  }, []);

  // Master vendor yang ditarik 100% dari Menu Vendor (localStorage + sync antar-tab)
  const [vendorList, setVendorList] = useState(() => getVendorsFromMenu());

  // Sinkronisasi data vendor riil dari Menu Vendor secara real-time
  useEffect(() => {
    const syncVendors = () => {
      const list = getVendorsFromMenu();
      setVendorList(list);
      setForm(prev => {
        // Jika vendor yang dipilih sebelumnya tidak ada di list baru, ganti ke vendor pertama yang valid
        if (!prev.vendor || !list.some(v => v.nama === prev.vendor)) {
          return { ...prev, vendor: list[0]?.nama || "" };
        }
        return prev;
      });
    };

    syncVendors();

    const handleStorageChange = (e) => {
      if (!e.key || e.key === "finance_vendors_data" || e.key === "finance_deleted_vendor_ids") {
        syncVendors();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("finance_vendors_updated", syncVendors);

    let bc = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("finance_vendors_channel");
      bc.onmessage = () => {
        syncVendors();
      };
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("finance_vendors_updated", syncVendors);
      if (bc) bc.close();
    };
  }, []);

  // Re-sync otomatis saat modal Buat Tagihan dibuka
  useEffect(() => {
    if (isModalOpen) {
      const list = getVendorsFromMenu();
      setVendorList(list);
      setForm(prev => {
        if (!prev.vendor || !list.some(v => v.nama === prev.vendor)) {
          return { ...prev, vendor: list[0]?.nama || "" };
        }
        return prev;
      });
    }
  }, [isModalOpen]);

  const [payModalBill, setPayModalBill] = useState(null);
  const [payForm, setPayForm] = useState({
    petugasPelunasan: "FINANCE LPK CREATIVA",
    waktuPelunasan: getNowDateTimeLocal(),
    akunBayar: "Petty Cash",
    keterangan: "",
  });

  const handleOpenPayment = (bill) => {
    const defaultAccount = Number(bill.total) <= 5000000 ? "Petty Cash" : "Bank BCA Operasional";
    setPayForm({
      petugasPelunasan: bill.petugasPelunasan || "FINANCE LPK CREATIVA",
      waktuPelunasan: getNowDateTimeLocal(),
      akunBayar: bill.akunBayar || defaultAccount,
      keterangan: bill.deskripsi || `Pelunasan tagihan ${bill.id} - ${bill.vendor}`,
    });
    setPayModalBill(bill);
  };

  const handleOpenCreateModal = () => {
    const currentVendors = getVendorsFromMenu();
    setVendorList(currentVendors);
    const nextId = getNextBillNumber(data);
    setForm({
      id: nextId,
      tanggal: new Date().toISOString().slice(0, 10),
      jatuhTempo: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      vendor: currentVendors[0]?.nama || "",
      total: "",
      status: "Belum Dibayar",
      akunBayar: "Petty Cash",
      waktuPelunasan: getNowDateTimeLocal(),
      petugasPelunasan: "FINANCE LPK CREATIVA",
      deskripsi: "",
    });
    setIsModalOpen(true);
  };

  const [form, setForm] = useState(() => {
    const initialList = getVendorsFromMenu();
    return {
      id: getNextBillNumber([]),
      tanggal: new Date().toISOString().slice(0, 10),
      jatuhTempo: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      vendor: initialList[0]?.nama || "",
      total: "",
      status: "Belum Dibayar",
      akunBayar: "Petty Cash",
      waktuPelunasan: getNowDateTimeLocal(),
      petugasPelunasan: "FINANCE LPK CREATIVA",
      deskripsi: "",
    };
  });

  const totalTagihan = data.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const belumDibayar = data.filter(r => r.status === "Belum Dibayar").reduce((s, r) => s + (Number(r.total) || 0), 0);
  const lunas = data.filter(r => r.status === "Lunas").reduce((s, r) => s + (Number(r.total) || 0), 0);
  const jatuhTempo = data.filter(r => r.status === "Jatuh Tempo").reduce((s, r) => s + (Number(r.total) || 0), 0);

  const filteredData = data.filter(item => {
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => ({
        "No. Bill": d.id,
        Tanggal: d.tanggal,
        "Jatuh Tempo": d.jatuhTempo,
        Vendor: d.vendor,
        Total: d.total,
        Status: d.status,
        "Waktu Pelunasan": d.status === "Lunas" ? formatWaktuIndo(d.waktuPelunasan, d.tanggal) : "—",
        "Petugas Pelunasan": d.status === "Lunas" ? (d.petugasPelunasan || "FINANCE LPK CREATIVA") : "—",
        Keterangan: d.deskripsi,
      })),
      "Bills_Tagihan_Vendor"
    );
  };

  // Eksekusi pembayaran bill dan pemotongan saldo kas/bank serta pencatatan di pengeluaran
  const executePayment = (billObj, payAccount) => {
    const nominal = Number(billObj.total || 0);
    if (nominal <= 0) return;

    // 1. Potong saldo rekening di finance_rekening_data
    try {
      const rekRaw = localStorage.getItem("finance_rekening_data");
      if (rekRaw) {
        let rekList = JSON.parse(rekRaw);
        rekList = rekList.map(r => {
          const rStr = `${r.nama} ${r.bank}`.toLowerCase();
          const targetStr = payAccount.toLowerCase();
          if (rStr.includes(targetStr) || (targetStr.includes('petty') && rStr.includes('petty')) || (targetStr.includes('bca') && rStr.includes('bca'))) {
            return { ...r, saldo: Math.max(0, Number(r.saldo || 0) - nominal) };
          }
          return r;
        });
        localStorage.setItem("finance_rekening_data", JSON.stringify(rekList));
      }
    } catch (e) {}

    // 2. Potong saldo di finance_coa_data
    try {
      const coaRaw = localStorage.getItem("finance_coa_data");
      if (coaRaw) {
        let coaList = JSON.parse(coaRaw);
        coaList = coaList.map(c => {
          if (payAccount.toLowerCase().includes('petty') && String(c.kode) === '1001') {
            return { ...c, saldo: Math.max(0, Number(c.saldo || 0) - nominal) };
          }
          if (payAccount.toLowerCase().includes('bca') && String(c.kode) === '1002') {
            return { ...c, saldo: Math.max(0, Number(c.saldo || 0) - nominal) };
          }
          return c;
        });
        localStorage.setItem("finance_coa_data", JSON.stringify(coaList));
      }
    } catch (e) {}

    // 3. Catat di finance_expense_data (SINKRON NAMA VENDOR, WAKTU PELUNASAN, & PETUGAS)
    try {
      const expRaw = localStorage.getItem("finance_expense_data");
      const expList = expRaw ? JSON.parse(expRaw) : [];
      const expId = `EXP-${billObj.id}`;
      const filtered = expList.filter(e => e.id !== expId);
      
      const newExpense = {
        id: expId,
        tanggal: billObj.waktuPelunasan ? billObj.waktuPelunasan.slice(0, 10) : (billObj.tanggal || new Date().toISOString().slice(0, 10)),
        waktuPelunasan: billObj.waktuPelunasan || getNowDateTimeLocal(),
        petugasPelunasan: billObj.petugasPelunasan || "FINANCE LPK CREATIVA",
        kategori: "Operasional Kantor",
        vendor: billObj.vendor,
        pihak: billObj.vendor,
        deskripsi: `Pelunasan tagihan ${billObj.id} - ${billObj.vendor} (${billObj.deskripsi || 'Pengadaan vendor'})`,
        keterangan: `Pelunasan tagihan ${billObj.id} - ${billObj.vendor} (${billObj.deskripsi || 'Pengadaan vendor'})`,
        nominal: nominal,
        sumberDana: payAccount,
        akun: payAccount,
        status: "Paid"
      };
      
      filtered.unshift(newExpense);
      localStorage.setItem("finance_expense_data", JSON.stringify(filtered));
    } catch (e) {
      console.warn("Gagal simpan ke finance_expense_data:", e);
    }

    // 4. Catat di finance_custom_journals
    try {
      const jrnRaw = localStorage.getItem("finance_custom_journals");
      const jrnList = jrnRaw ? JSON.parse(jrnRaw) : [];
      const jrnId = `jrn-paybill-${billObj.id}`;
      const filteredJrn = jrnList.filter(j => j.id !== jrnId);
      filteredJrn.unshift({
        id: jrnId,
        tanggal: billObj.waktuPelunasan ? billObj.waktuPelunasan.slice(0, 10) : (billObj.tanggal || new Date().toISOString().slice(0, 10)),
        rawDate: billObj.waktuPelunasan ? billObj.waktuPelunasan.slice(0, 10) : (billObj.tanggal || new Date().toISOString().slice(0, 10)),
        deskripsi: `Pelunasan Tagihan #${billObj.id} - ${billObj.vendor} oleh ${billObj.petugasPelunasan || 'FINANCE LPK CREATIVA'}`,
        referensi: billObj.id,
        debitAccount: "2001 - Utang Usaha (Account Payable) / Beban Operasional",
        creditAccount: payAccount.toLowerCase().includes('petty') ? "1001 - Petty Cash" : "1002 - Bank BCA Operasional",
        totalDebit: nominal,
        totalKredit: nominal,
        status: "Posted",
        tipe: "Pengeluaran Kas"
      });
      localStorage.setItem("finance_custom_journals", JSON.stringify(filteredJrn));
    } catch (e) {}
  };

  const handleSave = (e) => {
    e.preventDefault();
    const activeVendor = form.vendor || vendorList[0]?.nama || "";
    if (!activeVendor) {
      Swal.fire({
        icon: "warning",
        title: "Vendor Belum Dipilih",
        text: "Silakan pilih vendor atau daftarkan vendor terlebih dahulu di menu Data Vendor.",
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: "rounded-2xl" }
      });
      return;
    }
    if (!form.total || Number(form.total) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Nominal Tagihan Wajib Diisi",
        text: "Silakan masukkan total tagihan dengan benar.",
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: "rounded-2xl" }
      });
      return;
    }
    setBusy(true);

    const billId = form.id || getNextBillNumber(data);
    const newBill = {
      id: billId,
      tanggal: form.tanggal,
      jatuhTempo: form.jatuhTempo,
      vendor: activeVendor,
      total: Number(form.total),
      status: form.status,
      akunBayar: form.akunBayar || (Number(form.total) <= 5000000 ? "Petty Cash" : "Bank BCA Operasional"),
      waktuPelunasan: form.status === "Lunas" ? (form.waktuPelunasan || getNowDateTimeLocal()) : null,
      petugasPelunasan: form.status === "Lunas" ? (form.petugasPelunasan || "FINANCE LPK CREATIVA") : null,
      deskripsi: form.deskripsi,
    };

    // 1. Bersihkan ID tagihan baru dari blacklist deleted agar tidak terfilter saat reload
    try {
      const deletedIds = JSON.parse(localStorage.getItem("finance_deleted_bill_ids") || "[]");
      const cleaned = deletedIds.filter(id => id !== String(newBill.id));
      localStorage.setItem("finance_deleted_bill_ids", JSON.stringify(cleaned));
    } catch (e) {}

    // 2. Eksekusi kas jika lunas
    if (newBill.status === "Lunas") {
      executePayment(newBill, newBill.akunBayar);
    }

    // 3. Simpan tagihan ke state & localStorage
    const filteredExisting = data.filter(b => b.id !== newBill.id);
    const updated = [newBill, ...filteredExisting];
    setData(updated);

    try {
      localStorage.setItem("finance_bills_data", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("finance_bills_updated", { detail: updated }));
      window.dispatchEvent(new Event("storage"));
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("finance_bills_channel");
        bc.postMessage({ type: "bill_change", bills: updated });
        bc.close();
      }
    } catch (err) {}

    setBusy(false);
    setIsModalOpen(false);
    setForm({
      id: getNextBillNumber(updated),
      tanggal: new Date().toISOString().slice(0, 10),
      jatuhTempo: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      vendor: vendorList[0]?.nama || "",
      total: "",
      status: "Belum Dibayar",
      akunBayar: "Petty Cash",
      waktuPelunasan: getNowDateTimeLocal(),
      petugasPelunasan: "FINANCE LPK CREATIVA",
      deskripsi: "",
    });

    Swal.fire({
      icon: "success",
      title: "Tagihan Dibuat",
      text: `Tagihan ${newBill.id} berhasil ditambahkan.${newBill.status === 'Lunas' ? ' Pembayaran otomatis dibukukan.' : ''}`,
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl" }
    });
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!payModalBill) return;
    setBusy(true);

    const updatedBill = {
      ...payModalBill,
      status: "Lunas",
      petugasPelunasan: payForm.petugasPelunasan || "FINANCE LPK CREATIVA",
      waktuPelunasan: payForm.waktuPelunasan || getNowDateTimeLocal(),
      akunBayar: payForm.akunBayar,
      deskripsi: payForm.keterangan || payModalBill.deskripsi,
    };

    // 1. Eksekusi kas & catat pengeluaran
    executePayment(updatedBill, payForm.akunBayar);

    // 2. Update bills state
    const updated = data.map(b => b.id === payModalBill.id ? updatedBill : b);
    setData(updated);
    try {
      localStorage.setItem("finance_bills_data", JSON.stringify(updated));
    } catch (err) {}

    setBusy(false);
    setPayModalBill(null);
    setSelectedItem(null);

    Swal.fire({
      icon: "success",
      title: "Pelunasan Berhasil!",
      html: `Tagihan <b>${updatedBill.id}</b> untuk vendor <b>${updatedBill.vendor}</b> telah lunas dibayarkan.<br/><br/><div style="font-size: 12px; text-align: left; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; line-height: 1.6;"><b>Petugas Pelunasan:</b> ${updatedBill.petugasPelunasan}<br/><b>Tanggal & Jam:</b> ${formatWaktuIndo(updatedBill.waktuPelunasan)}<br/><b>Rekening Pengeluaran:</b> ${updatedBill.akunBayar}</div>`,
      customClass: { popup: "rounded-2xl" }
    });
  };

  // ── AKSI HAPUS TAGIHAN PERMANEN ──
  const handleDelete = (bill) => {
    Swal.fire({
      title: "Hapus Tagihan Permanen?",
      html: `Apakah Anda yakin ingin menghapus tagihan <b>${bill.id}</b> (${bill.vendor} - ${formatRupiah(bill.total)})?<br/><span style="color: #ef4444; font-size: 11px;">Data tagihan akan dihapus secara permanen dari sistem.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus Permanen",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
      cancelButtonColor: "#64748b",
      customClass: { popup: "rounded-2xl" }
    }).then((result) => {
      if (result.isConfirmed) {
        // 1. Hapus dari state
        const updated = data.filter(d => d.id !== bill.id);
        setData(updated);

        // 2. Simpan list terbaru ke localStorage & broadcast
        try {
          localStorage.setItem("finance_bills_data", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("finance_bills_updated", { detail: updated }));
          window.dispatchEvent(new Event("storage"));
          if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("finance_bills_channel");
            bc.postMessage({ type: "bill_change", bills: updated });
            bc.close();
          }
        } catch (e) {}

        // 3. Catat ID yang dihapus permanen agar tidak kembali saat load ulang
        try {
          const deletedIds = JSON.parse(localStorage.getItem("finance_deleted_bill_ids") || "[]");
          if (!deletedIds.includes(String(bill.id))) {
            deletedIds.push(String(bill.id));
            localStorage.setItem("finance_deleted_bill_ids", JSON.stringify(deletedIds));
          }
        } catch (e) {}

        Swal.fire({
          icon: "success",
          title: "Berhasil Dihapus!",
          text: `Tagihan ${bill.id} telah dihapus permanen.`,
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: "rounded-2xl" }
        });
      }
    });
  };

  const columns = [
    { header: "No. Bill", accessor: "id", className: "font-mono font-bold text-slate-800" },
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium text-xs text-slate-600" },
    { 
      header: "Pihak / Vendor", 
      accessor: "vendor", 
      className: "font-semibold text-slate-900",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          {r.vendor}
        </span>
      )
    },
    { header: "Total Tagihan", accessor: "total", align: "right", className: "font-bold text-slate-900 font-mono text-xs", render: (r) => formatRupiah(r.total) },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
    {
      header: "Waktu Pelunasan",
      accessor: "waktuPelunasan",
      className: "whitespace-nowrap text-xs font-medium text-slate-700",
      render: (r) => r.status === "Lunas" ? (
        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
          {formatWaktuIndo(r.waktuPelunasan, r.tanggal)}
        </span>
      ) : (
        <span className="text-slate-400 italic text-[11px]">— Belum Lunas</span>
      )
    },
    {
      header: "Petugas Pelunasan",
      accessor: "petugasPelunasan",
      className: "whitespace-nowrap",
      render: (r) => r.status === "Lunas" ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          {r.petugasPelunasan || "FINANCE LPK CREATIVA"}
        </span>
      ) : (
        <span className="text-slate-400 italic text-[11px]">Menunggu Proses</span>
      )
    },
    { 
      header: "Aksi", 
      accessor: "aksi", 
      align: "center",
      className: "w-28",
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          {r.status !== "Lunas" && (
            <button
              type="button"
              onClick={() => handleOpenPayment(r)}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              title="Bayar & Lunasi Tagihan"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedItem(r)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Lihat Detail Bill"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Hapus Tagihan Permanen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <Layout appearance="finance">
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Bills (Tagihan)"
          subtitle="Kelola tagihan masuk dan kewajiban pembayaran operasional vendor"
          primaryLabel="+ Buat Tagihan"
          onPrimaryClick={handleOpenCreateModal}
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        />

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FinanceKpiCard
            title="Total Tagihan"
            value={formatRupiah(totalTagihan)}
            subtitle="Kewajiban berjalan"
            icon={FileText}
            color="blue"
          />
          <FinanceKpiCard
            title="Belum Dibayar"
            value={formatRupiah(belumDibayar)}
            subtitle="Menunggu proses transfer"
            icon={Clock}
            color="amber"
          />
          <FinanceKpiCard
            title="Lunas"
            value={formatRupiah(lunas)}
            subtitle="Tagihan terselesaikan"
            icon={CheckCircle2}
            color="emerald"
          />
          <FinanceKpiCard
            title="Jatuh Tempo"
            value={formatRupiah(jatuhTempo)}
            subtitle="Perlu perhatian segera"
            icon={AlertTriangle}
            color="rose"
          />
        </div>

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari no bill, vendor, keterangan..."
          dropdowns={[
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Belum Dibayar", label: "Belum Dibayar" },
                { value: "Lunas", label: "Lunas" },
                { value: "Jatuh Tempo", label: "Jatuh Tempo" },
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

        {/* Modal Buat Tagihan */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Buat Tagihan Vendor Baru"
          subtitle="Catat invoice masuk dari vendor / penyedia jasa"
          onSubmit={handleSave}
          submitText="Simpan Tagihan"
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Tagihan / Bill No.</label>
              <input
                type="text"
                required
                value={form.id}
                onChange={e => setForm({ ...form, id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Vendor</label>
              <select
                value={form.vendor}
                onFocus={() => {
                  const fresh = getVendorsFromMenu();
                  setVendorList(fresh);
                  if (!form.vendor && fresh.length > 0) {
                    setForm(prev => ({ ...prev, vendor: fresh[0].nama }));
                  }
                }}
                onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
              >
                {vendorList.length === 0 ? (
                  <option value="" disabled>Belum ada vendor di Data Vendor (Tambah di menu Vendor)</option>
                ) : (
                  vendorList.map((v) => (
                    <option key={v.id || v.nama} value={v.nama}>
                      {v.nama} {v.kategori ? `— (${v.kategori})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Tagihan</label>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                required
                value={form.jatuhTempo}
                onChange={e => setForm({ ...form, jatuhTempo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Tagihan (Rp)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.total}
                onChange={e => setForm({ ...form, total: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pembayaran</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Belum Dibayar">Belum Dibayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
              </select>
            </div>
            {form.status === "Lunas" && (
              <div className="md:col-span-2 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> Tanggal & Jam Pelunasan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.waktuPelunasan}
                      onChange={e => setForm({ ...form, waktuPelunasan: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Petugas Pelunasan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama user pemroses"
                      value={form.petugasPelunasan}
                      onChange={e => setForm({ ...form, petugasPelunasan: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    Sumber Dana Pembayaran (Kas / Bank)
                  </label>
                  <select
                    value={form.akunBayar}
                    onChange={e => setForm({ ...form, akunBayar: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Petty Cash">Petty Cash (Kas Kecil Tunai & Vendor Kecil)</option>
                    <option value="Bank BCA Operasional">Bank BCA Operasional (LPK Creativa Bridging Intern)</option>
                  </select>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Saldo rekening yang dipilih akan otomatis terpotong dan tercatat di pengeluaran kas & cashflow.
                  </p>
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Rincian Pengadaan</label>
              <textarea
                rows={2}
                placeholder="Rincian barang atau jasa yang ditagihkan..."
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </FinanceModal>

        {/* Modal Detail Bill */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 mb-1">Detail Tagihan Vendor</h3>
              <p className="text-xs text-slate-400 mb-4">{selectedItem.id} · {selectedItem.vendor}</p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Tanggal Tagihan:</span><span className="font-semibold text-slate-800">{selectedItem.tanggal}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jatuh Tempo:</span><span className="font-semibold text-slate-800">{selectedItem.jatuhTempo}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Vendor:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    {selectedItem.vendor}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Total Tagihan:</span><span className="font-bold text-slate-900 text-sm font-mono">{formatRupiah(selectedItem.total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><FinanceBadge status={selectedItem.status} /></div>
                
                {selectedItem.status === "Lunas" && (
                  <div className="pt-2.5 border-t border-slate-200/70 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tanggal & Jam Pelunasan:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {formatWaktuIndo(selectedItem.waktuPelunasan, selectedItem.tanggal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Petugas Pelunasan:</span>
                      <span className="font-semibold text-blue-700 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        {selectedItem.petugasPelunasan || "FINANCE LPK CREATIVA"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rekening Pembayaran:</span>
                      <span className="font-medium text-slate-800">{selectedItem.akunBayar || (Number(selectedItem.total) <= 5000000 ? "Petty Cash" : "Bank BCA Operasional")}</span>
                    </div>
                  </div>
                )}

                {selectedItem.deskripsi && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-0.5">Rincian Pengadaan:</span>
                    <p className="text-slate-700 italic">{selectedItem.deskripsi}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2 flex-wrap">
                {selectedItem.status !== "Lunas" && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedItem;
                      setSelectedItem(null);
                      handleOpenPayment(target);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bayar & Tandai Lunas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = selectedItem;
                    setSelectedItem(null);
                    handleDelete(toDelete);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                >
                  Hapus Tagihan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pelunasan Tagihan (Pay Modal) */}
        {payModalBill && (
          <FinanceModal
            isOpen={Boolean(payModalBill)}
            onClose={() => setPayModalBill(null)}
            title="Formulir Pelunasan Tagihan (Bills Payment)"
            subtitle={`Konfirmasi pelunasan tagihan ${payModalBill.id} kepada vendor rekanan`}
            onSubmit={handleConfirmPayment}
            submitText="Konfirmasi Pelunasan & Bayar Sekarang"
            busy={busy}
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Vendor Rekanan</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    {payModalBill.vendor}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">No. Tagihan: {payModalBill.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Tagihan</span>
                  <span className="text-base font-extrabold text-blue-700 font-mono">
                    {formatRupiah(payModalBill.total)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Tanggal & Jam Pelunasan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={payForm.waktuPelunasan}
                    onChange={e => setPayForm({ ...payForm, waktuPelunasan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Petugas Pelunasan (Nama User) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama user pemroses pelunasan"
                    value={payForm.petugasPelunasan}
                    onChange={e => setPayForm({ ...payForm, petugasPelunasan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sumber Rekening Kas / Bank <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payForm.akunBayar}
                    onChange={e => setPayForm({ ...payForm, akunBayar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                  >
                    <option value="Petty Cash">Petty Cash (Kas Kecil Tunai & Vendor Kecil)</option>
                    <option value="Bank BCA Operasional">Bank BCA Operasional (LPK Creativa Bridging Intern)</option>
                    <option value="Rekening Cadangan Mandiri">Rekening Cadangan Mandiri</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Saldo kas/bank akan otomatis terpotong dan terbit bukti pengeluaran di menu Transaksi Pengeluaran.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan / Catatan Pelunasan
                  </label>
                  <input
                    type="text"
                    value={payForm.keterangan}
                    onChange={e => setPayForm({ ...payForm, keterangan: e.target.value })}
                    placeholder="Catatan pelunasan tagihan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </FinanceModal>
        )}
      </div>
    </Layout>
  );
}
