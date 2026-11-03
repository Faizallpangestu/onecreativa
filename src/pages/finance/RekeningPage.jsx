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
import { Landmark, CheckCircle2, XCircle, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import axios from "axios";

const INITIAL_REKENING = [];

import Swal from "sweetalert2";

export default function RekeningPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_rekening_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasDummyBalances = parsed.some(r => r.saldo === 120000000 || r.saldo === 25000000);
          if (!hasDummyBalances) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [jenis, setJenis] = useState("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const fetchBanks = async (active = true) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/accounting.php?view=lookups");
      if (!active) return;
      if (res.data?.csrf_token) setCsrfToken(res.data.csrf_token);
      const rawBanks = res.data?.data?.banks || res.data?.banks || [];
      if (rawBanks.length > 0) {
        const apiBanks = rawBanks.map((b, i) => {
          const isCash = b.name.toLowerCase().includes('kas') || b.name.toLowerCase().includes('petty');
          const isWallet = b.name.toLowerCase().includes('wallet') || b.name.toLowerCase().includes('dana');
          return {
            id: b.id || i + 1,
            nama: b.name,
            jenis: isCash ? "Tunai" : isWallet ? "E-Wallet" : (b.type || "Bank"),
            bank: b.bank_name || (isCash ? "Kas Tunai Kasir" : "Bank BCA"),
            noRek: b.account_number || (isCash ? "CASH-01" : "—"),
            saldo: Number(b.balance || 0),
            status: Number(b.is_active) === 0 ? "Nonaktif" : "Aktif"
          };
        });
        setData(apiBanks);
        localStorage.setItem("finance_rekening_data", JSON.stringify(apiBanks));
      }
    } catch (e) {
      console.warn("Gagal memuat rekening dari server:", e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchBanks(active);
    return () => { active = false; };
  }, []);

  const [form, setForm] = useState({
    nama: "",
    jenis: "Bank",
    bank: "Bank BCA",
    noRek: "",
    saldo: "",
    status: "Aktif",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      nama: "",
      jenis: "Bank",
      bank: "Bank BCA",
      noRek: "",
      saldo: "",
      status: "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      nama: item.nama,
      jenis: item.jenis,
      bank: item.bank,
      noRek: item.noRek,
      saldo: item.saldo,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    try {
      if (deletingItem.id && !isNaN(Number(deletingItem.id))) {
        await axios.post("/api/accounting.php", {
          action: "delete_bank",
          id: Number(deletingItem.id)
        }, {
          headers: { "X-CSRF-Token": csrfToken || "" }
        });
      }
    } catch (e) {
      console.warn("Gagal hapus rekening dari server:", e);
    } finally {
      const targetId = String(deletingItem.id);
      const updated = data.filter(d => String(d.id) !== targetId);
      setData(updated);
      try {
        localStorage.setItem("finance_rekening_data", JSON.stringify(updated));
      } catch (e) {}
      setBusy(false);
      setDeletingItem(null);
    }
  };

  const totalRekening = data.length;
  const rekeningAktif = data.filter(d => d.status === "Aktif").length;
  const totalSaldo = data.filter(d => d.status === "Aktif").reduce((acc, curr) => acc + (Number(curr.saldo) || 0), 0);
  const bcaAccount = data.find(d => d.nama.toLowerCase().includes('bca') || d.bank.toLowerCase().includes('bca'));
  const pettyAccount = data.find(d => d.nama.toLowerCase().includes('petty') || d.nama.toLowerCase().includes('kas kecil'));

  const filteredData = data.filter(item => {
    if (jenis !== "all" && item.jenis.toLowerCase() !== jenis.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.nama.toLowerCase().includes(q) ||
        item.bank.toLowerCase().includes(q) ||
        item.noRek.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => ({
        "Nama Rekening": d.nama,
        Jenis: d.jenis,
        "Bank/Provider": d.bank,
        "No. Rekening": d.noRek,
        Saldo: d.saldo,
        Status: d.status,
      })),
      "Data_Rekening_Kas_Bank"
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.nama.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Rekening Diperlukan',
        text: 'Silakan isi Nama Akun Rekening (contoh: Rekening Operasional BCA).',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }
    const cleanNoRek = form.noRek?.trim() || (form.jenis === 'Tunai' ? 'CASH-01' : '-');
    setBusy(true);

    try {
      const payload = {
        action: 'save_bank',
        nama: form.nama.trim(),
        jenis: form.jenis,
        bank: form.bank?.trim() || 'Bank BCA',
        noRek: cleanNoRek,
        saldo: Number(form.saldo || 0),
        status: form.status || 'Aktif',
      };
      if (editingItem?.id) {
        payload.id = editingItem.id;
      }

      await axios.post("/api/accounting.php", payload, {
        headers: { "X-CSRF-Token": csrfToken || "" }
      });

      setIsModalOpen(false);
      setEditingItem(null);
      setForm({
        nama: "",
        jenis: "Bank",
        bank: "Bank BCA",
        noRek: "",
        saldo: "",
        status: "Aktif",
      });

      await fetchBanks(true);

      Swal.fire({
        icon: 'success',
        title: editingItem ? 'Rekening Diperbarui' : 'Rekening Berhasil Disimpan',
        text: `Rekening ${form.nama} dengan saldo awal Rp ${Number(form.saldo || 0).toLocaleString('id-ID')} berhasil tersimpan.`,
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (err) {
      console.error("Gagal simpan rekening:", err);
      const serverMsg = err.response?.data?.message || err.message || 'Gagal menyimpan rekening ke server.';
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: serverMsg,
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { header: "Nama Rekening", accessor: "nama", className: "font-semibold text-slate-900" },
    { header: "Jenis", accessor: "jenis", className: "text-slate-600 font-medium" },
    { header: "Nama Bank/Provider", accessor: "bank" },
    { header: "No. Rekening", accessor: "noRek", className: "font-mono font-medium text-slate-700" },
    { header: "Saldo", accessor: "saldo", align: "right", className: "font-bold text-slate-900", render: (r) => formatRupiah(r.saldo) },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
    {
      header: "Aksi",
      accessor: "aksi",
      align: "center",
      className: "w-24",
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Edit Rekening"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(r)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Hapus Rekening"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Data Rekening"
          subtitle="Kelola rekening bank operasional, e-wallet, dan kas tunai perusahaan"
          primaryLabel="+ Tambah Rekening"
          onPrimaryClick={handleOpenCreate}
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        />

        {/* 4 Treasury KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FinanceKpiCard
            title="Total Saldo Kas & Bank"
            value={formatRupiah(totalSaldo)}
            subtitle="Konsolidasi Seluruh Rekening"
            icon={Landmark}
            color="blue"
          />
          <FinanceKpiCard
            title="Rekening BCA Utama"
            value={formatRupiah(bcaAccount?.saldo || 0)}
            subtitle="Penerimaan Siswa & Payroll"
            icon={CheckCircle2}
            color="emerald"
          />
          <FinanceKpiCard
            title="Petty Cash Operasional"
            value={formatRupiah(pettyAccount?.saldo || 0)}
            subtitle="Kas Kecil Tunai & Vendor"
            icon={Landmark}
            color="amber"
          />
          <FinanceKpiCard
            title="Rekening Aktif"
            value={`${rekeningAktif} / ${totalRekening}`}
            subtitle="Rekening Siap Transaksi"
            icon={CheckCircle2}
            color="indigo"
          />
        </div>

        <FinanceFilterBar
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari nama rekening, bank, no. rekening..."
          dropdowns={[
            {
              value: jenis,
              onChange: setJenis,
              options: [
                { value: "all", label: "Semua Jenis" },
                { value: "Bank", label: "Bank" },
                { value: "E-Wallet", label: "E-Wallet" },
                { value: "Tunai", label: "Kas Tunai" },
              ],
            },
          ]}
          onReset={() => {
            setJenis("all");
            setSearch("");
          }}
        />

        <FinanceTable
          columns={columns}
          data={filteredData}
          loading={loading}
          totalItems={filteredData.length}
        />

        {/* Modal Tambah / Edit Rekening */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Edit Data Rekening" : "Tambah Rekening Baru"}
          subtitle={editingItem ? "Perbarui informasi rekening kas / bank perusahaan" : "Daftarkan rekening bank operasional atau e-wallet baru"}
          onSubmit={handleSave}
          submitText={editingItem ? "Perbarui Rekening" : "Simpan Rekening"}
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Akun Rekening</label>
              <input
                type="text"
                required
                placeholder="Contoh: Rekening Operasional BCA"
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Rekening</label>
              <select
                value={form.jenis}
                onChange={e => setForm({ ...form, jenis: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Bank">Bank</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Tunai">Kas Tunai</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bank / Provider</label>
              <input
                type="text"
                required
                placeholder="Contoh: Bank BCA / DANA"
                value={form.bank}
                onChange={e => setForm({ ...form, bank: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                required
                placeholder="1234567890"
                value={form.noRek}
                onChange={e => setForm({ ...form, noRek: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Saldo Awal (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={form.saldo}
                onChange={e => setForm({ ...form, saldo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </FinanceModal>

        {/* Modal Konfirmasi Hapus Rekening */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Rekening?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus rekening <strong className="text-slate-800">{deletingItem.nama}</strong> ({deletingItem.bank} - {deletingItem.noRek})?
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm transition active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
