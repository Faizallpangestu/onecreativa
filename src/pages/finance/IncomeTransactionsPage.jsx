import React, { useState, useEffect } from "react";
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
  Eye, Plus, Pencil, Trash2, AlertTriangle, 
  UploadCloud, Link as LinkIcon, ExternalLink, X, FileText, Image as ImageIcon 
} from "lucide-react";

// Sample Receipt SVG data URI
const SAMPLE_RECEIPT = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%23f8fafc'/><rect x='20' y='20' width='360' height='460' rx='16' fill='%23ffffff' stroke='%23e2e8f0' stroke-width='2'/><circle cx='200' cy='80' r='30' fill='%2310b981'/><path d='M188 80l8 8 16-16' stroke='%23ffffff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><text x='200' y='140' font-family='sans-serif' font-size='16' font-weight='bold' fill='%231e293b' text-anchor='middle'>TRANSFER BERHASIL</text><text x='200' y='175' font-family='sans-serif' font-size='24' font-weight='bold' fill='%230f172a' text-anchor='middle'>Rp 2.500.000</text><line x1='50' y1='210' x2='350' y2='210' stroke='%23e2e8f0' stroke-dasharray='6 6'/><text x='50' y='245' font-family='sans-serif' font-size='12' fill='%2364748b'>Penerima:</text><text x='350' y='245' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>PT LPK Creativa</text><text x='50' y='280' font-family='sans-serif' font-size='12' fill='%2364748b'>Bank Tujuan:</text><text x='350' y='280' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>Bank BCA (002-998811)</text><text x='50' y='315' font-family='sans-serif' font-size='12' fill='%2364748b'>Pengirim:</text><text x='350' y='315' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>Andi Saputra</text><text x='50' y='350' font-family='sans-serif' font-size='12' fill='%2364748b'>Tanggal:</text><text x='350' y='350' font-family='sans-serif' font-size='12' font-weight='bold' fill='%231e293b' text-anchor='end'>01/10/2026 10:24 WIB</text><rect x='50' y='390' width='300' height='50' rx='8' fill='%23f1f5f9'/><text x='200' y='420' font-family='sans-serif' font-size='11' fill='%2364748b' text-anchor='middle'>Nomor Referensi: TRX-20261001-9981</text></svg>";

const INITIAL_INCOME_DATA = [
  { id: 1, tanggal: "2026-10-01", siswa: "Andi Saputra", kategori: "Biaya Kursus", sumberDana: "BCA", nominal: 2500000, status: "Lunas", deskripsi: "Pembayaran Kursus Bahasa Jepang Bulan Oktober", buktiFoto: SAMPLE_RECEIPT, buktiNama: "bukti-transfer-andi.png" },
  { id: 2, tanggal: "2026-10-01", siswa: "Siti Aminah", kategori: "Pendaftaran", sumberDana: "E-Wallet", nominal: 1500000, status: "Lunas", deskripsi: "Biaya pendaftaran dan seragam", buktiLink: "https://drive.google.com/file/d/bukti-siti-aminah/view" },
  { id: 3, tanggal: "2026-09-25", siswa: "Budi Santoso", kategori: "Biaya Kursus", sumberDana: "BCA", nominal: 3000000, status: "Pending", deskripsi: "Cicilan 1 Kursus Intensif", buktiFoto: "", buktiLink: "" },
  { id: 4, tanggal: "2026-09-20", siswa: "Rina Putri", kategori: "Penempatan", sumberDana: "BCA", nominal: 10000000, status: "Lunas", deskripsi: "Pelunasan Program Tokutei Ginou", buktiLink: "https://drive.google.com/file/d/bukti-rina-putri/view" },
  { id: 5, tanggal: "2026-09-18", siswa: "Fajar Pratama", kategori: "Biaya Kursus", sumberDana: "Bank Mandiri", nominal: 2500000, status: "Lunas", deskripsi: "Pembayaran Kelas Malam", buktiFoto: SAMPLE_RECEIPT, buktiNama: "struk_mandiri_fajar.jpg" },
  { id: 6, tanggal: "2026-09-15", siswa: "Dewi Lestari", kategori: "Pendaftaran", sumberDana: "BCA", nominal: 1500000, status: "Pending", deskripsi: "Biaya Administrasi Ujian JFT", buktiFoto: "", buktiLink: "" },
];

export default function IncomeTransactionsPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_income_data");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_INCOME_DATA;
  });
  const [loading, setLoading] = useState(false);
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("finance_income_data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  // Form State
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    siswa: "",
    kategori: "Biaya Kursus",
    sumberDana: "BCA",
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
    const targetId = String(deletingItem.id);
    const updated = data.filter(d => String(d.id) !== targetId);
    setData(updated);

    // Langsung simpan perubahan ke localStorage
    try {
      localStorage.setItem("finance_income_data", JSON.stringify(updated));
      const deletedIds = JSON.parse(localStorage.getItem("finance_income_deleted_ids") || "[]");
      if (!deletedIds.includes(targetId)) {
        deletedIds.push(targetId);
        localStorage.setItem("finance_income_deleted_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {}

    try {
      await accountingMutate({
        action: "delete",
        id: deletingItem.id,
        type: "income",
      });
    } catch {
      // Local state already updated and persisted
    }
    setBusy(false);
    setDeletingItem(null);
  };

  useEffect(() => {
    let active = true;
    accountingGet("ledger", { type: "income" })
      .then(res => {
        if (active && res.data?.rows?.length > 0) {
          const deletedIds = JSON.parse(localStorage.getItem("finance_income_deleted_ids") || "[]");
          const apiRows = res.data.rows
            .map((r, i) => ({
              id: r.ledger_id || r.id || i + 1,
              tanggal: r.transaction_date || r.date,
              siswa: r.party_name || r.student_name || "Peserta Didik",
              kategori: r.category || "Pemasukan",
              sumberDana: r.cash_account_name || "Kas/Bank",
              nominal: Number(r.incoming_amount || r.amount || 0),
              status: r.payment_status === "paid" || r.approval_status === "approved" ? "Lunas" : "Pending",
              deskripsi: r.description || "",
              buktiFoto: r.proof_url || r.attachment_url || "",
              buktiLink: r.reference_link || "",
            }))
            .filter(r => !deletedIds.includes(String(r.id)));

          // Hanya set dari API jika user belum punya data tersimpan di localStorage
          const hasSaved = localStorage.getItem("finance_income_data");
          if (!hasSaved && apiRows.length > 0) {
            setData(apiRows);
          }
        }
      })
      .catch(() => {
        // Fallback to initial starter data
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
        Siswa: d.siswa,
        Kategori: d.kategori,
        "Sumber Dana": d.sumberDana,
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
      setData(data.map(d => d.id === editingItem.id ? { ...d, ...payloadItem } : d));
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
    } else {
      const newItem = {
        id: Date.now(),
        ...payloadItem,
      };
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
      setData([newItem, ...data]);
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
    { header: "Siswa", accessor: "siswa", className: "font-semibold text-slate-900" },
    { header: "Kategori", accessor: "kategori" },
    { header: "Sumber Dana", accessor: "sumberDana" },
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
              onClick={() => setPreviewMedia({ type: "image", src: r.buktiFoto, title: `Bukti Transaksi - ${r.siswa}` })}
              className="relative group inline-block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition shadow-2xs"
              title="Klik untuk melihat bukti foto"
            >
              <img src={r.buktiFoto} alt="Bukti" className="w-8 h-8 object-cover rounded-lg group-hover:scale-105 transition" />
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
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Transaksi Pemasukan"
          subtitle="Kelola pencatatan transaksi pemasukan dan sumber dana kas"
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
          searchPlaceholder="Cari transaksi / siswa..."
          dropdowns={[
            {
              value: sumber,
              onChange: setSumber,
              options: [
                { value: "all", label: "Semua Sumber" },
                { value: "BCA", label: "Bank BCA" },
                { value: "Bank Mandiri", label: "Bank Mandiri" },
                { value: "E-Wallet", label: "E-Wallet" },
                { value: "Kas", label: "Kas Tunai" },
              ],
            },
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Lunas", label: "Lunas" },
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa / Pihak</label>
              <input
                type="text"
                required
                placeholder="Contoh: Andi Saputra"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Dana (Rekening)</label>
              <select
                value={form.sumberDana}
                onChange={e => setForm({ ...form, sumberDana: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="BCA">Rekening BCA</option>
                <option value="Bank Mandiri">Rekening Bank Mandiri</option>
                <option value="Bank BNI">Rekening Bank BNI</option>
                <option value="E-Wallet">E-Wallet (Petty Cash)</option>
                <option value="Kas">Kas Tunai Kantor</option>
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
                <option value="Lunas">Lunas (Paid)</option>
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
                Apakah Anda yakin ingin menghapus data pemasukan dari <strong className="text-slate-800">{deletingItem.siswa}</strong> senilai <strong className="text-slate-800">{formatRupiah(deletingItem.nominal)}</strong>?
              </p>
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
                <div className="flex justify-between"><span className="text-slate-500">Siswa / Pihak:</span><span className="font-semibold text-slate-800">{selectedItem.siswa}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kategori:</span><span className="font-semibold text-slate-800">{selectedItem.kategori}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sumber Dana:</span><span className="font-semibold text-slate-800">{selectedItem.sumberDana}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nominal:</span><span className="font-bold text-blue-600 text-sm">{formatRupiah(selectedItem.nominal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><FinanceBadge status={selectedItem.status} /></div>
                
                {/* Bukti Foto di Detail */}
                {selectedItem.buktiFoto && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-1.5 font-medium">Bukti Foto / Struk:</span>
                    <div 
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-white max-h-52 flex items-center justify-center group cursor-pointer"
                      onClick={() => setPreviewMedia({ type: "image", src: selectedItem.buktiFoto, title: `Bukti Transaksi - ${selectedItem.siswa}` })}
                    >
                      <img src={selectedItem.buktiFoto} alt="Bukti Transfer" className="max-h-48 w-auto object-contain rounded-lg" />
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
                <img src={previewMedia.src} alt={previewMedia.title} className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <a
                  href={previewMedia.src}
                  download="bukti-transaksi.jpg"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Unduh Foto
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
