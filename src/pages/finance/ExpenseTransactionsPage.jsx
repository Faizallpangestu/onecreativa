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
import { Eye, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

const INITIAL_EXPENSE_DATA = [
  { id: 1, tanggal: "2026-10-01", kategori: "Pembelian", deskripsi: "Laptop Admin", sumberDana: "BCA", nominal: 7500000, status: "Pending", vendor: "Toko Office Equipment" },
  { id: 2, tanggal: "2026-09-29", kategori: "Operasional", deskripsi: "Listrik Kantor", sumberDana: "E-Wallet", nominal: 1200000, status: "Approved", vendor: "PLN Persero" },
  { id: 3, tanggal: "2026-09-25", kategori: "Reimbursement", deskripsi: "Transport Dinas", sumberDana: "BCA", nominal: 500000, status: "Pending", vendor: "Staff Admin" },
  { id: 4, tanggal: "2026-09-20", kategori: "Gaji Karyawan", deskripsi: "Gaji Bulanan", sumberDana: "BCA", nominal: 25000000, status: "Paid", vendor: "Karyawan LPK" },
  { id: 5, tanggal: "2026-09-18", kategori: "Operasional", deskripsi: "Langganan Internet Dedicated", sumberDana: "BCA", nominal: 850000, status: "Approved", vendor: "PT Maju Internet" },
  { id: 6, tanggal: "2026-09-14", kategori: "Pembelian", deskripsi: "Buku Pelajaran & Modul N5", sumberDana: "Kas", nominal: 3200000, status: "Paid", vendor: "Percetakan Mitra" },
];

export default function ExpenseTransactionsPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_expense_data");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EXPENSE_DATA;
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [kategori, setKategori] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("finance_expense_data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  // Form State
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: "Operasional",
    deskripsi: "",
    sumberDana: "BCA",
    nominal: "",
    status: "Pending",
    vendor: "",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: "Operasional",
      deskripsi: "",
      sumberDana: "BCA",
      nominal: "",
      status: "Pending",
      vendor: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      tanggal: item.tanggal,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      sumberDana: item.sumberDana,
      nominal: item.nominal,
      status: item.status,
      vendor: item.vendor || "",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    const targetId = String(deletingItem.id);
    const updated = data.filter(d => String(d.id) !== targetId);
    setData(updated);

    // Langsung simpan perubahan ke localStorage
    try {
      localStorage.setItem("finance_expense_data", JSON.stringify(updated));
      const deletedIds = JSON.parse(localStorage.getItem("finance_expense_deleted_ids") || "[]");
      if (!deletedIds.includes(targetId)) {
        deletedIds.push(targetId);
        localStorage.setItem("finance_expense_deleted_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {}

    try {
      await accountingMutate({
        action: "delete",
        id: deletingItem.id,
        type: "expense",
      });
    } catch {
      // Local state fallback
    }
    setBusy(false);
    setDeletingItem(null);
  };

  useEffect(() => {
    let active = true;
    accountingGet("ledger", { type: "expense" })
      .then(res => {
        if (active && res.data?.rows?.length > 0) {
          const deletedIds = JSON.parse(localStorage.getItem("finance_expense_deleted_ids") || "[]");
          const apiRows = res.data.rows
            .map((r, i) => ({
              id: r.ledger_id || r.id || i + 1,
              tanggal: r.transaction_date || r.date,
              kategori: r.category || "Operasional",
              deskripsi: r.description || "Pengeluaran",
              sumberDana: r.cash_account_name || "Kas/Bank",
              nominal: Number(r.outgoing_amount || r.amount || 0),
              status: r.approval_status === "approved" ? "Approved" : r.payment_status === "paid" ? "Paid" : "Pending",
              vendor: r.party_name || r.vendor_name || "—",
            }))
            .filter(r => !deletedIds.includes(String(r.id)));

          const hasSaved = localStorage.getItem("finance_expense_data");
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
    if (kategori !== "all" && item.kategori.toLowerCase() !== kategori.toLowerCase()) return false;
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.deskripsi.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.sumberDana.toLowerCase().includes(q) ||
        (item.vendor && item.vendor.toLowerCase().includes(q))
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
        Kategori: d.kategori,
        Deskripsi: d.deskripsi,
        "Sumber Dana": d.sumberDana,
        Nominal: d.nominal,
        Status: d.status,
        Pihak: d.vendor,
      })),
      "Transaksi_Pengeluaran"
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.deskripsi || !form.nominal) return;
    setBusy(true);

    if (editingItem) {
      setData(data.map(d => d.id === editingItem.id ? {
        ...d,
        tanggal: form.tanggal,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        sumberDana: form.sumberDana,
        nominal: Number(form.nominal),
        status: form.status,
        vendor: form.vendor || "Staff/Vendor",
      } : d));
      try {
        await accountingMutate({
          action: "update",
          id: editingItem.id,
          type: "expense",
          transaction_date: form.tanggal,
          description: form.deskripsi,
          category: form.kategori,
          amount: Number(form.nominal),
          party_name: form.vendor,
        });
      } catch {}
    } else {
      const newItem = {
        id: Date.now(),
        tanggal: form.tanggal,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        sumberDana: form.sumberDana,
        nominal: Number(form.nominal),
        status: form.status,
        vendor: form.vendor || "Staff/Vendor",
      };
      try {
        await accountingMutate({
          action: "create",
          type: "expense",
          transaction_date: form.tanggal,
          description: form.deskripsi,
          category: form.kategori,
          amount: Number(form.nominal),
          party_name: form.vendor,
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
      kategori: "Operasional",
      deskripsi: "",
      sumberDana: "BCA",
      nominal: "",
      status: "Pending",
      vendor: "",
    });
  };

  const columns = [
    { header: "No", accessor: "no", align: "center", className: "w-12 text-slate-400 font-medium", render: (_, i) => (page - 1) * perPage + i + 1 },
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium" },
    { header: "Kategori", accessor: "kategori", className: "font-semibold text-slate-900" },
    { header: "Deskripsi", accessor: "deskripsi", className: "max-w-xs truncate" },
    { header: "Sumber Dana", accessor: "sumberDana" },
    { header: "Nominal", accessor: "nominal", align: "right", className: "font-bold text-slate-900", render: (r) => formatRupiah(r.nominal) },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
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
          title="Transaksi Pengeluaran"
          subtitle="Kelola dan pantau seluruh transaksi pengeluaran operasional"
          primaryLabel="+ Ajukan Pengeluaran"
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
          searchPlaceholder="Cari transaksi / deskripsi..."
          dropdowns={[
            {
              value: kategori,
              onChange: setKategori,
              options: [
                { value: "all", label: "Semua Kategori" },
                { value: "Operasional", label: "Operasional Kantor" },
                { value: "Pembelian", label: "Pembelian & Inventaris" },
                { value: "Reimbursement", label: "Klaim Reimbursement" },
                { value: "Gaji Karyawan", label: "Gaji Karyawan" },
              ],
            },
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Approved", label: "Approved (Disetujui)" },
                { value: "Pending", label: "Pending (Menunggu)" },
                { value: "Paid", label: "Paid (Sudah Ditransfer)" },
              ],
            },
          ]}
          onReset={() => {
            setKategori("all");
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

        {/* Modal Ajukan / Edit Pengeluaran */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Edit Pengeluaran" : "Ajukan Pengeluaran Baru"}
          subtitle={editingItem ? "Perbarui informasi pengeluaran biaya operasional" : "Catat pengeluaran biaya operasional atau pengadaan kantor"}
          onSubmit={handleSave}
          submitText={editingItem ? "Perbarui Pengeluaran" : "Ajukan Pengeluaran"}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pengeluaran</label>
              <select
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Operasional">Operasional Kantor</option>
                <option value="Pembelian">Pembelian Peralatan / Aset</option>
                <option value="Reimbursement">Reimbursement Staff</option>
                <option value="Gaji Karyawan">Penggajian</option>
                <option value="Lainnya">Beban Lain-lain</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Pengeluaran</label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembelian Laptop Admin atau Tagihan Listrik"
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Dana Kas/Bank</label>
              <select
                value={form.sumberDana}
                onChange={e => setForm({ ...form, sumberDana: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="BCA">Rekening BCA</option>
                <option value="Bank Mandiri">Rekening Bank Mandiri</option>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pihak / Vendor Penerima</label>
              <input
                type="text"
                placeholder="Contoh: CV Sukses Listrik / Toko IT"
                value={form.vendor}
                onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Awal</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Pending">Pending (Diajukan)</option>
                <option value="Approved">Approved (Disetujui)</option>
                <option value="Paid">Paid (Sudah Ditransfer)</option>
              </select>
            </div>
          </div>
        </FinanceModal>

        {/* Modal Konfirmasi Hapus */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Pengeluaran?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus data pengeluaran <strong className="text-slate-800">{deletingItem.deskripsi}</strong> senilai <strong className="text-slate-800">{formatRupiah(deletingItem.nominal)}</strong>?
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Detail Pengeluaran</h3>
              <p className="text-xs text-slate-400 mb-4">Informasi pengajuan biaya pengeluaran operasional</p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Tanggal:</span><span className="font-semibold text-slate-800">{selectedItem.tanggal}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kategori:</span><span className="font-semibold text-slate-800">{selectedItem.kategori}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Deskripsi:</span><span className="font-semibold text-slate-800">{selectedItem.deskripsi}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Pihak / Vendor:</span><span className="font-semibold text-slate-800">{selectedItem.vendor || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sumber Dana:</span><span className="font-semibold text-slate-800">{selectedItem.sumberDana}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nominal:</span><span className="font-bold text-rose-600 text-sm">{formatRupiah(selectedItem.nominal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><FinanceBadge status={selectedItem.status} /></div>
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
      </div>
    </Layout>
  );
}
