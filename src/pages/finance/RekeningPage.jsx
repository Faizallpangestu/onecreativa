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

const INITIAL_REKENING = [
  { id: 1, nama: "Rekening BCA Creativa Bridging Intern", jenis: "Bank", bank: "Bank BCA", noRek: "1832-918-428", saldo: 120000000, status: "Aktif" },
  { id: 2, nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)", jenis: "Tunai", bank: "Kas Tunai Kasir", noRek: "CASH-01", saldo: 5000000, status: "Aktif" },
  { id: 3, nama: "Rekening Cadangan Mandiri", jenis: "Bank", bank: "Bank Mandiri", noRek: "130-0019283", saldo: 25000000, status: "Aktif" },
  { id: 4, nama: "E-Wallet Bisnis (DANA / Flip)", jenis: "E-Wallet", bank: "DANA Bisnis", noRek: "0812-9988-7766", saldo: 12500000, status: "Aktif" },
];

export default function RekeningPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_rekening_data");
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Auto-heal penamaan akun BCA dan Petty Cash
          parsed = parsed.map(r => {
            const rStr = `${r.nama} ${r.bank} ${r.noRek}`.toLowerCase();
            if (r.id === 1 || (rStr.includes('bca') && !rStr.includes('petty'))) {
              return {
                ...r,
                nama: "Rekening BCA Creativa Bridging Intern",
                bank: "Bank BCA",
                noRek: r.noRek && r.noRek.includes('1832') ? r.noRek : "1832-918-428"
              };
            }
            if (r.id === 2 || rStr.includes('petty')) {
              return {
                ...r,
                nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)",
                jenis: "Tunai",
                bank: "Kas Tunai Kasir",
                noRek: "CASH-01"
              };
            }
            return r;
          });

          // Pastikan 4 akun standar kas & bank selalu tersedia
          const hasBca = parsed.some(r => r.id === 1 || r.nama.toLowerCase().includes('bca'));
          if (!hasBca) {
            parsed.unshift({ id: 1, nama: "Rekening BCA Creativa Bridging Intern", jenis: "Bank", bank: "Bank BCA", noRek: "1832-918-428", saldo: 120000000, status: "Aktif" });
          }

          const hasPetty = parsed.some(r => r.id === 2 || r.nama.toLowerCase().includes('petty') || r.nama.toLowerCase().includes('kas kecil'));
          if (!hasPetty) {
            parsed.push({ id: 2, nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)", jenis: "Tunai", bank: "Kas Tunai Kasir", noRek: "CASH-01", saldo: 5000000, status: "Aktif" });
          }

          const hasMandiri = parsed.some(r => r.nama.toLowerCase().includes('mandiri'));
          if (!hasMandiri) {
            parsed.push({ id: 3, nama: "Rekening Cadangan Mandiri", jenis: "Bank", bank: "Bank Mandiri", noRek: "130-0019283", saldo: 25000000, status: "Aktif" });
          }

          const hasWallet = parsed.some(r => r.nama.toLowerCase().includes('wallet') || r.nama.toLowerCase().includes('dana') || r.nama.toLowerCase().includes('flip'));
          if (!hasWallet) {
            parsed.push({ id: 4, nama: "E-Wallet Bisnis (DANA / Flip)", jenis: "E-Wallet", bank: "DANA Bisnis", noRek: "0812-9988-7766", saldo: 12500000, status: "Aktif" });
          }

          // Sinkronkan live saldo dari finance_coa_data jika tersedia
          try {
            const coaRaw = localStorage.getItem("finance_coa_data");
            if (coaRaw) {
              const coaList = JSON.parse(coaRaw);
              if (Array.isArray(coaList)) {
                parsed = parsed.map(r => {
                  const rStr = `${r.nama} ${r.bank}`.toLowerCase();
                  if (rStr.includes('bca')) {
                    const bcaCoa = coaList.find(c => String(c.kode) === '1002' || (c.nama && c.nama.toLowerCase().includes('bca') && !c.nama.toLowerCase().includes('petty')));
                    if (bcaCoa && Number(bcaCoa.saldo) > 0) {
                      return { ...r, saldo: Number(bcaCoa.saldo) };
                    }
                  }
                  if (rStr.includes('petty') || rStr.includes('kas kecil')) {
                    const pettyCoa = coaList.find(c => String(c.kode) === '1001' || (c.nama && (c.nama.toLowerCase().includes('petty') || c.nama.toLowerCase().includes('kas kecil'))));
                    if (pettyCoa && Number(pettyCoa.saldo) > 0) {
                      return { ...r, saldo: Number(pettyCoa.saldo) };
                    }
                  }
                  return r;
                });
              }
            }
          } catch (e) {}

          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_REKENING;
  });
  const [loading, setLoading] = useState(false);
  const [jenis, setJenis] = useState("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("finance_rekening_data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

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

  const confirmDelete = () => {
    if (!deletingItem) return;
    const targetId = String(deletingItem.id);
    const updated = data.filter(d => String(d.id) !== targetId);
    setData(updated);
    try {
      localStorage.setItem("finance_rekening_data", JSON.stringify(updated));
    } catch (e) {}
    setDeletingItem(null);
  };

  useEffect(() => {
    let active = true;
    axios.get("/api/accounting.php?view=lookups")
      .then(res => {
        if (active && res.data?.data?.banks?.length > 0) {
          const apiBanks = res.data.data.banks.map(b => ({
            id: b.id,
            nama: b.name,
            jenis: b.type || "Bank",
            bank: b.bank_name || b.name,
            noRek: b.account_number || "—",
            saldo: Number(b.balance || 0),
            status: "Aktif",
          }));
          const hasSaved = localStorage.getItem("finance_rekening_data");
          if (!hasSaved) {
            setData(apiBanks);
          }
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

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

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nama || !form.noRek) return;
    setBusy(true);

    if (editingItem) {
      setData(data.map(d => d.id === editingItem.id ? {
        ...d,
        nama: form.nama,
        jenis: form.jenis,
        bank: form.bank,
        noRek: form.noRek,
        saldo: Number(form.saldo || 0),
        status: form.status,
      } : d));
    } else {
      const newRek = {
        id: Date.now(),
        nama: form.nama,
        jenis: form.jenis,
        bank: form.bank,
        noRek: form.noRek,
        saldo: Number(form.saldo || 0),
        status: form.status,
      };
      setData([newRek, ...data]);
    }

    setBusy(false);
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
