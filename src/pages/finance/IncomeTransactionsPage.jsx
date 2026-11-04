import React, { useState, useEffect } from "react";
import axios from "axios";
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
import { accountingGet, accountingMutate } from "../../utils/accountingApi";
import { 
  Eye, Zap, Plus, Pencil, Trash2, AlertTriangle, 
  UploadCloud, Link as LinkIcon, ExternalLink, X, FileText, Image as ImageIcon 
} from "lucide-react";

// Sample Receipt SVG data URI
const SAMPLE_RECEIPT = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%23f8fafc'/><rect x='20' y='20' width='360' height='460' rx='16' fill='%23ffffff' stroke='%23e2e8f0' stroke-width='2'/><circle cx='200' cy='80' r='30' fill='%2310b981'/><path d='M188 80l8 8 16-16' stroke='%23ffffff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><text x='200' y='140' font-family='sans-serif' font-size='16' font-weight='bold' fill='%231e293b' text-anchor='middle'>TRANSFER BERHASIL</text><text x='200' y='175' font-family='sans-serif' font-size='24' font-weight='bold' fill='%230f172a' text-anchor='middle'>Rp 2.500.000</text><line x1='50' y1='210' x2='350' y2='210' stroke='%23e2e8f0' stroke-dasharray='6 6'/><text x='50' y='245' font-family='sans-serif' font-size='12' fill='%2364748b'>Penerima:</text><text x='350' y='245' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>PT LPK Creativa</text><text x='50' y='280' font-family='sans-serif' font-size='12' fill='%2364748b'>Bank Tujuan:</text><text x='350' y='280' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>Bank BCA (002-998811)</text><text x='50' y='315' font-family='sans-serif' font-size='12' fill='%2364748b'>Pengirim:</text><text x='350' y='315' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>Andi Saputra</text><text x='50' y='350' font-family='sans-serif' font-size='12' fill='%2364748b'>Tanggal:</text><text x='350' y='350' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>01/10/2026 10:24 WIB</text><rect x='50' y='390' width='300' height='50' rx='8' fill='%23f1f5f9'/><text x='200' y='420' font-family='sans-serif' font-size='11' fill='%2364748b' text-anchor='middle'>Nomor Referensi: TRX-20261001-9981</text></svg>";

const INITIAL_INCOME_DATA = [];

function isPdfProof(src, mime = "") {
  return mime === "application/pdf" || /^data:application\/pdf/i.test(String(src || "")) || /\.pdf(?:$|[?#])/i.test(String(src || ""));
}

function IncomeProofThumbnail({ src, mime }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed || isPdfProof(src, mime)) {
    return (
      <span className="w-8 h-8 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400">
        {isPdfProof(src, mime) ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
      </span>
    );
  }
  return <img src={src} alt="Bukti" className="w-8 h-8 object-cover rounded-lg" onError={() => setFailed(true)} />;
}

function IncomeProofViewer({ src, mime, title }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="h-full min-h-48 w-full flex flex-col items-center justify-center gap-2 text-slate-400">
        <ImageIcon className="w-8 h-8" />
        <span className="text-xs">File bukti belum tersedia atau tidak dapat dibuka.</span>
      </div>
    );
  }
  if (isPdfProof(src, mime)) return <iframe src={src} title={title} className="w-full h-[65vh] rounded-lg" onError={() => setFailed(true)} />;
  return <img src={src} alt={title} className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs" onError={() => setFailed(true)} />;
}

function dataUrlToFile(dataUrl, filename = "bukti-transaksi.jpg") {
  if (!String(dataUrl || "").startsWith("data:")) return null;
  const [meta, body] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  return new File([bytes], filename, { type: mime });
}

async function saveLegacyProof(itemId, form) {
  const rawId = String(itemId || "").replace(/^legacy:/, "");
  if (!/^\d+$/.test(rawId)) return;
  const body = new FormData();
  body.append("action", "attach_proof");
  body.append("id", rawId);
  if (form.buktiType === "link") {
    body.append("link", form.buktiLink || "");
  } else {
    const file = dataUrlToFile(form.buktiFoto, form.buktiNama || "bukti-pemasukan.jpg");
    if (file) body.append("proof", file);
  }
  if (form.buktiType === "link" || form.buktiFoto) {
    const session = await axios.get("/api/session.php");
    await axios.post("/api/finance.php", body, { headers: { "X-CSRF-Token": session.data?.csrf_token || "" } });
  }
}


// ── AMBIL DAFTAR REKENING REAL DARI COA & MASTER REKENING ──
function getRegisteredReceivingAccounts(lookupData = null) {
  const accounts = [];
  const seen = new Set();

  // A. Dari API lookups (Database: cash_bank_accounts & COA accounts)
  if (lookupData) {
    const rawBanks = lookupData.banks || [];
    const rawAccounts = lookupData.accounts || [];

    rawBanks.filter(b => Number(b.is_active) !== 0).forEach(b => {
      const bName = b.bank_name ? b.bank_name.replace(/^bank\s+/i, "") : (b.name || "Bank");
      const noRek = b.account_number || "";
      const label = noRek ? `${bName} (${noRek}) - ${b.name}` : b.name;
      const val = noRek ? `${bName} (${noRek})` : b.name;
      const key = (noRek || val).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        accounts.push({ id: `db-bank-${b.id}`, label, value: val, noRek, bank: bName });
      }
    });

    rawAccounts.filter(a => Number(a.is_active) !== 0 && Number(a.account_group) === 1 && (a.report_class === 'cash' || String(a.name).toLowerCase().includes('bank') || String(a.name).toLowerCase().includes('kas'))).forEach(a => {
      const matchNo = (a.name || "").match(/\b[\d-]{7,20}\b/);
      const noRek = matchNo ? matchNo[0] : "";
      const key = (noRek || a.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        accounts.push({ id: `db-coa-${a.id || a.code}`, label: `[${a.code}] ${a.name}`, value: a.name, noRek, bank: a.name });
      }
    });
  }

  // B. Dari Master Rekening lokal (finance_rekening_data)
  try {
    const rawRek = localStorage.getItem("finance_rekening_data");
    if (rawRek) {
      const parsed = JSON.parse(rawRek);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.filter(r => r.status === "Aktif" || !r.status).forEach(r => {
          const bankName = r.bank ? r.bank.replace(/^bank\s+/i, "") : (r.nama || "Bank");
          const noRek = r.noRek || "";
          const label = noRek ? `${bankName} (${noRek}) - ${r.nama || r.pemilik || 'LPK Creativa'}` : (r.nama || bankName);
          const val = noRek ? `${bankName} (${noRek})` : (r.nama || bankName);
          const key = (noRek || val).toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            accounts.push({ id: `rek-${r.id}`, label, value: val, noRek, bank: bankName });
          }
        });
      }
    }
  } catch (e) {}

  // C. Dari Master COA lokal (finance_coa_data)
  try {
    const rawCoa = localStorage.getItem("finance_coa_data");
    if (rawCoa) {
      const parsed = JSON.parse(rawCoa);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.filter(c => (c.kategori === "Cash and Bank" || c.report_class === "cash" || c.subtype === "AST-CB" || c.account_group === 1) && c.status !== "Nonaktif" && (String(c.nama).toLowerCase().includes('bank') || String(c.nama).toLowerCase().includes('kas'))).forEach(c => {
          const matchNo = (c.rekeningDetail || c.nama || "").match(/\b[\d-]{7,20}\b/);
          const noRek = matchNo ? matchNo[0] : "";
          const key = (noRek || c.nama).toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            accounts.push({ id: `coa-${c.kode || c.id}`, label: `[${c.kode}] ${c.nama}`, value: c.nama, noRek, bank: c.nama });
          }
        });
      }
    }
  } catch (e) {}

  // D. Fallback aman jika database & storage masih kosong
  if (accounts.length === 0) {
    accounts.push({
      id: "default-bca",
      label: "BCA (1832-918-428) - PT CREATIVA BRIDGING INTERN",
      value: "BCA (1832-918-428)",
      noRek: "1832-918-428",
      bank: "BCA"
    });
  }

  return accounts;
}

export default function IncomeTransactionsPage() {
  const [rekeningList, setRekeningList] = useState(() => getRegisteredReceivingAccounts());
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_income_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !["Andi Saputra", "Siti Aminah", "Budi Santoso", "Rina Putri", "Fajar Pratama", "Dewi Lestari"].includes(item.siswa));
        }
      }
    } catch {
      // Ignore malformed historical local storage.
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [sumber, setSumber] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync to localStorage
  useEffect(() => {
    try {
      const localRows = data.filter(row => !["billing_payment", "invoice_payment", "legacy_finance"].includes(row.sourceType));
      localStorage.setItem("finance_income_data", JSON.stringify(localRows));
    } catch {
      // Local persistence is best effort.
    }
  }, [data]);

  // Form State
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    siswa: "",
    kategori: "Biaya Kursus",
    sumberDana: getRegisteredReceivingAccounts()[0]?.value || "BCA (1832-918-428)",
    nominal: "",
    status: "Lunas",
    deskripsi: "",
    buktiType: "file", // "file" or "link"
    buktiFoto: "",
    buktiNama: "",
    buktiLink: "",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    const defaultRek = rekeningList[0]?.value || "BCA (1832-918-428)";
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      siswa: "",
      kategori: "Biaya Kursus",
      sumberDana: defaultRek,
      nominal: "",
      status: "Lunas",
      deskripsi: "",
      buktiType: "file",
      buktiFoto: "",
      buktiNama: "",
      buktiLink: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenPay = (item) => {
    setEditingItem(item);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      siswa: item.siswa,
      kategori: item.kategori,
      sumberDana: item.sumberDana,
      nominal: item.nominal,
      status: "Lunas",
      deskripsi: item.deskripsi || "",
      buktiType: item.buktiLink ? "link" : "file",
      buktiFoto: item.buktiFoto || "",
      buktiNama: item.buktiNama || "",
      buktiLink: item.buktiLink || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      tanggal: item.tanggal,
      siswa: item.siswa,
      kategori: item.kategori,
      sumberDana: item.sumberDana,
      nominal: item.nominal,
      status: item.status,
      deskripsi: item.deskripsi || "",
      buktiType: item.buktiLink ? "link" : "file",
      buktiFoto: item.buktiFoto || "",
      buktiNama: item.buktiNama || "",
      buktiLink: item.buktiLink || "",
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        buktiFoto: event.target.result,
        buktiNama: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    setDeleteError("");
    const targetId = String(deletingItem.id);
    try {
      if (deletingItem.sourceType === "billing_payment") {
        await axios.delete("/api/billing.php", {
          params: { type: "pembayaran", scope: "single", id: deletingItem.sourceId }
        });
      } else {
        await accountingMutate({
          action: "delete",
          id: deletingItem.id,
          type: "income",
        });
      }
      const updated = data.filter(d => String(d.id) !== targetId);
      setData(updated);
      try {
        const localRows = updated.filter(row => !["billing_payment", "invoice_payment", "legacy_finance"].includes(row.sourceType));
        localStorage.setItem("finance_income_data", JSON.stringify(localRows));
        const deletedIds = JSON.parse(localStorage.getItem("finance_income_deleted_ids") || "[]");
        if (!deletedIds.includes(targetId)) {
          deletedIds.push(targetId);
          localStorage.setItem("finance_income_deleted_ids", JSON.stringify(deletedIds));
        }
      } catch {
        // Server deletion succeeded; local persistence is best effort.
      }
      setDeletingItem(null);
    } catch (error) {
      setDeleteError(error.response?.data?.message || error.message || "Pemasukan gagal dihapus.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      accountingGet("ledger", { type: "income" }).catch(() => ({ data: { rows: [] } })),
      axios.get("/api/finance.php", { params: { type: "income", _t: Date.now() } }).catch(() => ({ data: { data: [] } })),
      accountingGet("lookups").catch(() => ({ data: { accounts: [], banks: [] } })),
      axios.get("/api/billing.php", { params: { _t: Date.now() } }).catch(() => ({ data: { data: { pembayaran: [] } } })),
    ])
      .then(([res, legacyRes, lookupRes, billingRes]) => {
        if (!active) return;
        if (lookupRes?.data) {
          const freshAccounts = getRegisteredReceivingAccounts(lookupRes.data);
          setRekeningList(freshAccounts);
        }
        if (!active) return;
        const proofByPaymentId = new Map(
          (billingRes.data?.data?.pembayaran || []).map(payment => [
            String(payment.id),
            { url: payment.proof_url || payment.buktiBayar || "", mime: payment.proof_mime || payment.buktiMime || "" }
          ])
        );
        const apiRows = (res.data?.rows || [])
          .map((r, i) => {
            const paymentProof = r.source_type === "billing_payment" ? proofByPaymentId.get(String(r.source_id)) : null;
            return ({
            id: r.ledger_id || r.id || i + 1,
            sourceType: r.source_type || "",
            sourceId: r.source_id || "",
            sourceNumber: r.source_number || "",
            tanggal: r.transaction_date || r.date,
            siswa: r.party_name || r.student_name || "Peserta Didik",
            kategori: r.source_type === "billing_payment" ? "Pembayaran Invoice Siswa" : (r.category || "Pemasukan"),
            sumberDana: r.cash_account_name || (r.source_type === "billing_payment" ? r.payment_method : "") || "Kas/Bank",
            nominal: Number(r.incoming_amount || r.amount || 0),
            status: r.payment_status === "paid" ? "Lunas" : "Pending",
            deskripsi: r.description || "",
            buktiFoto: paymentProof?.url || r.proof_url || r.attachment_url || (r.source_type === "legacy_finance" && r.source_id ? `/api/finance.php?view=photo&id=${encodeURIComponent(r.source_id)}` : ""),
            buktiMime: paymentProof?.mime || "",
            buktiLink: r.reference_link || "",
          });});
        const legacyRows = (legacyRes.data?.data || []).map((r, i) => ({
          id: `legacy:${r.id || i + 1}`,
          sourceType: "legacy_finance",
          tanggal: r.transaction_date,
          siswa: r.account_name || r.source || "Transaksi historis",
          kategori: r.category || "Pemasukan",
          sumberDana: r.bank_name || r.metode || "Kas/Bank",
          nominal: Number(r.amount || 0),
          status: "Lunas",
          deskripsi: r.description || "",
          buktiFoto: r.photo_path ? `/api/finance.php?view=photo&id=${encodeURIComponent(r.id)}` : "",
          buktiLink: r.drive_link || "",
        }));
        const savedRaw = localStorage.getItem("finance_income_data");
        const existingLocal = savedRaw ? JSON.parse(savedRaw) : [];
        const deletedIds = new Set(JSON.parse(localStorage.getItem("finance_income_deleted_ids") || "[]").map(String));

        const rowsById = new Map();
        const invoicePaymentRows = apiRows.filter(row => row.sourceType === "billing_payment" && row.status === "Lunas");
        // A. Baris dari API/Database
        [...apiRows, ...legacyRows].forEach(row => {
          if (!deletedIds.has(String(row.id)) || ["billing_payment", "invoice_payment"].includes(row.sourceType)) {
            rowsById.set(String(row.id), row);
          }
        });
        // B. Baris yang diinput pengguna secara lokal (JANGAN DIHAPUS / OVERWRITE!)
        if (Array.isArray(existingLocal)) {
          existingLocal.forEach(row => {
            const rId = String(row.id);
            const localDescription = String(row.deskripsi || "");
            const isManualInvoiceAdjustment = /disesuaikan oleh/i.test(localDescription);
            const duplicatesInvoicePayment = isManualInvoiceAdjustment && invoicePaymentRows.some(payment =>
              String(payment.siswa || "").trim().toLowerCase() === String(row.siswa || "").trim().toLowerCase() &&
              Number(payment.nominal) === Number(row.nominal)
            );
            if (duplicatesInvoicePayment) return;
            if (!deletedIds.has(rId) && !rowsById.has(rId)) {
              rowsById.set(rId, row);
            }
          });
        }

        const rows = [...rowsById.values()];
        rows.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
        setData(rows);
        try {
          const localRows = rows.filter(row => !["billing_payment", "invoice_payment", "legacy_finance"].includes(row.sourceType));
          localStorage.setItem("finance_income_data", JSON.stringify(localRows));
        } catch {
          // Local persistence is best effort.
        }
      })
      .catch(error => { if (active) setLoadError(error.message || "Transaksi pemasukan gagal dimuat."); })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredData = data.filter(item => {
    if (sumber !== "all" && item.sumberDana.toLowerCase() !== sumber.toLowerCase()) return false;
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.siswa.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.sumberDana.toLowerCase().includes(q) ||
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
      filteredData.map((d, idx) => ({
        No: idx + 1,
        Tanggal: d.tanggal,
        "Diterima Dari": d.siswa,
        Kategori: d.kategori,
        "Rekening Penerima": d.sumberDana,
        Nominal: d.nominal,
        Status: d.status,
        Bukti: d.buktiLink ? d.buktiLink : d.buktiFoto ? "Ada Bukti Foto" : "Tidak Ada",
        Keterangan: d.deskripsi,
      })),
      "Transaksi_Pemasukan"
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.siswa || !form.nominal) return;
    setBusy(true);

    const payloadItem = {
      tanggal: form.tanggal,
      siswa: form.siswa,
      kategori: form.kategori,
      sumberDana: form.sumberDana,
      nominal: Number(form.nominal),
      status: form.status,
      deskripsi: form.deskripsi,
      buktiFoto: form.buktiType === "file" ? form.buktiFoto : "",
      buktiNama: form.buktiType === "file" ? form.buktiNama : "",
      buktiLink: form.buktiType === "link" ? form.buktiLink : "",
    };

    if (editingItem) {
      const updated = data.map(d => d.id === editingItem.id ? { ...d, ...payloadItem } : d);
      setData(updated);
      try {
        localStorage.setItem("finance_income_data", JSON.stringify(updated));
      } catch (e) {}
      try {
        await accountingMutate({
          action: "update",
          id: editingItem.id,
          type: "income",
          transaction_date: form.tanggal,
          party_name: form.siswa,
          category: form.kategori,
          amount: Number(form.nominal),
          description: form.deskripsi,
        });
      } catch {
        // Local state updated
      }
      try { await saveLegacyProof(editingItem.id, form); } catch (proofError) { console.warn("Bukti pemasukan gagal disimpan", proofError); }
    } else {
      const newItem = {
        id: 'inc-' + Date.now(),
        noTransaksi: 'TRX-' + (form.tanggal || new Date().toISOString().slice(0, 10)).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
        ...payloadItem,
      };
      const updated = [newItem, ...data];
      setData(updated);
      try {
        localStorage.setItem("finance_income_data", JSON.stringify(updated));
      } catch (e) {}
      try {
        await accountingMutate({
          action: "create",
          type: "income",
          transaction_date: form.tanggal,
          party_name: form.siswa,
          category: form.kategori,
          amount: Number(form.nominal),
          description: form.deskripsi,
        });
      } catch {
        // Local state update ensures immediate UX response
      }
    }

    setBusy(false);
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      siswa: "",
      kategori: "Biaya Kursus",
      sumberDana: "BCA",
      nominal: "",
      status: "Lunas",
      deskripsi: "",
      buktiType: "file",
      buktiFoto: "",
      buktiNama: "",
      buktiLink: "",
    });
  };

  const columns = [
    { header: "No", accessor: "no", align: "center", className: "w-12 text-slate-400 font-medium", render: (_, i) => (page - 1) * perPage + i + 1 },
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium" },
    { header: "Diterima Dari", accessor: "siswa", className: "font-semibold text-slate-900" },
    { header: "Kategori", accessor: "kategori" },
    { header: "Rekening Penerima", accessor: "sumberDana" },
    { header: "Nominal", accessor: "nominal", align: "right", className: "font-bold text-slate-900", render: (r) => formatRupiah(r.nominal) },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
    {
      header: "Bukti",
      accessor: "bukti",
      align: "center",
      className: "w-20",
      render: (r) => {
        if (r.buktiFoto) {
          return (
            <button
              type="button"
              onClick={() => setPreviewMedia({ type: "image", src: r.buktiFoto, mime: r.buktiMime, title: `Bukti Transaksi - ${r.siswa}` })}
              className="relative group inline-block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition shadow-2xs"
              title="Klik untuk melihat bukti foto"
            >
              <IncomeProofThumbnail src={r.buktiFoto} mime={r.buktiMime} />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Eye className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          );
        }
        if (r.buktiLink) {
          return (
            <a
              href={r.buktiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              title={r.buktiLink}
            >
              <LinkIcon className="w-3 h-3" /> Link
            </a>
          );
        }
        return <span className="text-slate-300 text-xs">—</span>;
      }
    },
    { 
      header: "Aksi", 
      accessor: "aksi", 
      align: "center",
      className: "w-28",
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedItem(r)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!["billing_payment", "invoice_payment"].includes(r.sourceType) && r.status !== 'Lunas' && (
            <button
              type="button"
              onClick={() => handleOpenPay(r)}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              title="Catat Pelunasan (Ubah ke Lunas & Upload Bukti)"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}
          {r.sourceType === "billing_payment" ? (
            <button
              type="button"
              onClick={() => setDeletingItem(r)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Hapus pembayaran invoice ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : !["billing_payment", "invoice_payment"].includes(r.sourceType) ? (
            <>
              <button
                type="button"
                onClick={() => handleOpenEdit(r)}
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                title="Edit Data"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingItem(r)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Hapus Data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Transaksi Pemasukan"
          subtitle="Pembayaran invoice terverifikasi tercatat otomatis sebagai pemasukan Lunas"
          primaryLabel="+ Tambah Pemasukan"
          onPrimaryClick={handleOpenCreate}
          onSecondaryClick={handleExport}
        />

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari transaksi / pihak pembayar..."
          dropdowns={[
            {
              value: sumber,
              onChange: setSumber,
              options: [
                { value: "all", label: "Semua Rekening Penerima" },
                ...rekeningList.map(rek => ({
                  value: rek.value,
                  label: rek.label
                }))
              ],
            },
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Lunas", label: "Lunas (Realisasi)" },
                { value: "Belum Lunas", label: "Belum Lunas (Rencana / Proyeksi)" },
                { value: "Pending", label: "Pending" },
              ],
            },
          ]}
          onReset={() => {
            setSumber("all");
            setStatus("all");
            setSearch("");
            setStartDate("2026-01-01");
            setEndDate("2026-12-31");
          }}
        />

        {loadError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Data pemasukan gagal dimuat dari database: {loadError}
          </div>
        )}

        <FinanceTable
          columns={columns}
          data={paginatedData}
          loading={loading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredData.length}
        />

        {/* Modal Tambah / Edit Transaksi */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Edit Transaksi Pemasukan" : "Tambah Transaksi Pemasukan"}
          subtitle={editingItem ? "Perbarui rincian transaksi penerimaan dana" : "Catat penerimaan kas atau transfer dari siswa/client"}
          onSubmit={handleSave}
          submitText={editingItem ? "Perbarui Pemasukan" : "Simpan Pemasukan"}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diterima Dari</label>
              <input
                type="text"
                required
                placeholder="Contoh: Siswa Andi Saputra / Samit (Investor)"
                value={form.siswa}
                onChange={e => setForm({ ...form, siswa: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pemasukan</label>
              <select
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Biaya Kursus">Biaya Kursus</option>
                <option value="Pendaftaran">Pendaftaran & Administrasi</option>
                <option value="Penempatan">Biaya Penempatan / Tokutei</option>
                <option value="Pelatihan Skill">Pelatihan Skill</option>
                <option value="Modal">Modal / Investasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rekening Penerima (Kas & Bank COA)</label>
              <select
                value={form.sumberDana}
                onChange={e => setForm({ ...form, sumberDana: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {rekeningList.map((rek, idx) => (
                  <option key={rek.id || idx} value={rek.value}>
                    {rek.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pembayaran</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Lunas">Lunas (Paid / Realisasi)</option>
                <option value="Belum Lunas">Belum Lunas (Rencana / Proyeksi)</option>
                <option value="Pending">Pending (Menunggu Verifikasi)</option>
              </select>
            </div>
          </div>

          {/* Bukti Transaksi: Foto atau Link */}
          <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Bukti Transaksi (Foto / Link)
              </label>
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, buktiType: "file" })}
                  className={`px-2.5 py-1 rounded-md transition ${form.buktiType === "file" ? "bg-white text-blue-600 shadow-2xs" : "hover:text-slate-900"}`}
                >
                  Upload Foto
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, buktiType: "link" })}
                  className={`px-2.5 py-1 rounded-md transition ${form.buktiType === "link" ? "bg-white text-blue-600 shadow-2xs" : "hover:text-slate-900"}`}
                >
                  Tautan Link
                </button>
              </div>
            </div>

            {form.buktiType === "file" ? (
              <div>
                {form.buktiFoto ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                    <img src={form.buktiFoto} alt="Bukti" className="w-12 h-12 object-cover rounded-md border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{form.buktiNama || "bukti-transaksi.jpg"}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Foto siap disimpan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, buktiFoto: "", buktiNama: "" })}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition"
                      title="Hapus Foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-xl cursor-pointer transition group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition mb-1" />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Pilih file foto bukti transfer</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau tautan bukti transfer online"
                  value={form.buktiLink}
                  onChange={e => setForm({ ...form, buktiLink: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan transaksi..."
              value={form.deskripsi}
              onChange={e => setForm({ ...form, deskripsi: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </FinanceModal>

        {/* Modal Konfirmasi Hapus */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Pemasukan?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus {deletingItem.sourceType === "billing_payment" ? "pembayaran invoice" : "data pemasukan"} dari <strong className="text-slate-800">{deletingItem.siswa}</strong> senilai <strong className="text-slate-800">{formatRupiah(deletingItem.nominal)}</strong>?{deletingItem.sourceType === "billing_payment" && " Status invoice akan dihitung ulang dari pembayaran terverifikasi yang tersisa."}
              </p>
              {deleteError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{deleteError}</p>}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {busy ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Item */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-slate-900">Detail Pemasukan</h3>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">Informasi lengkap transaksi penerimaan dana</p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Tanggal:</span><span className="font-semibold text-slate-800">{selectedItem.tanggal}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Diterima Dari:</span><span className="font-semibold text-slate-800">{selectedItem.siswa}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kategori:</span><span className="font-semibold text-slate-800">{selectedItem.kategori}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Rekening Penerima:</span><span className="font-semibold text-slate-800">{selectedItem.sumberDana}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nominal:</span><span className="font-bold text-blue-600 text-sm">{formatRupiah(selectedItem.nominal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><FinanceBadge status={selectedItem.status} /></div>
                
                {/* Bukti Foto di Detail */}
                {selectedItem.buktiFoto && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-1.5 font-medium">Bukti Foto / Struk:</span>
                    <div 
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-white max-h-52 flex items-center justify-center group cursor-pointer"
                      onClick={() => setPreviewMedia({ type: "image", src: selectedItem.buktiFoto, mime: selectedItem.buktiMime, title: `Bukti Transaksi - ${selectedItem.siswa}` })}
                    >
                      <IncomeProofThumbnail src={selectedItem.buktiFoto} mime={selectedItem.buktiMime} />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition">
                        <Eye className="w-4 h-4" /> Klik untuk Perbesar
                      </div>
                    </div>
                  </div>
                )}

                {/* Bukti Link di Detail */}
                {selectedItem.buktiLink && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-1 font-medium">Tautan Bukti / Dokumen:</span>
                    <a
                      href={selectedItem.buktiLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold text-xs break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {selectedItem.buktiLink}
                    </a>
                  </div>
                )}

                {selectedItem.deskripsi && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-0.5 font-medium">Keterangan:</span>
                    <p className="text-slate-700 italic">{selectedItem.deskripsi}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
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

        {/* Modal Lightbox Perbesar Foto Bukti */}
        {previewMedia && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setPreviewMedia(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-4 space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800">{previewMedia.title}</h4>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 max-h-[70vh]">
                <IncomeProofViewer src={previewMedia.src} mime={previewMedia.mime} title={previewMedia.title} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <a
                  href={previewMedia.src}
                  download={`bukti-transaksi.${isPdfProof(previewMedia.src, previewMedia.mime) ? "pdf" : "jpg"}`}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Unduh Bukti
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
