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
import { Plus, Landmark, Wallet, CreditCard, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const INITIAL_COA = [
  // Assets -> Cash and Bank
  { id: 1, kode: "1001", nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)", subtype: "AST-CB", rekeningDetail: "Kasir & Kas Kecil Tunai Kantor", tipe: "Assets", kategori: "Cash and Bank", saldo: 5000000, status: "Aktif" },
  { id: 2, kode: "1002", nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)", subtype: "AST-CB", rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428", tipe: "Assets", kategori: "Cash and Bank", saldo: 145200000, status: "Aktif" },
  { id: 3, kode: "1003", nama: "Bank Mandiri Utama", subtype: "AST-CB", rekeningDetail: "Mandiri a/n PT LPK Creativa 130-0019283", tipe: "Assets", kategori: "Cash and Bank", saldo: 78500000, status: "Aktif" },
  { id: 4, kode: "1004", nama: "Bank BNI Tabungan", subtype: "AST-CB", rekeningDetail: "BNI a/n PT LPK Creativa 088-771122", tipe: "Assets", kategori: "Cash and Bank", saldo: 35000000, status: "Aktif" },
  { id: 5, kode: "1005", nama: "Flip / E-Wallet Perusahaan", subtype: "AST-CB", rekeningDetail: "DANA & Flip Bisnis 0812-9988-7766", tipe: "Assets", kategori: "Cash and Bank", saldo: 12500000, status: "Aktif" },
  { id: 6, kode: "1101", nama: "Piutang SPP Siswa", subtype: "AST-AR", rekeningDetail: "Tagihan Belum Lunas Siswa Intensif", tipe: "Assets", kategori: "Accounts Receivable", saldo: 45000000, status: "Aktif" },
  { id: 7, kode: "1201", nama: "Peralatan Komputer & Lab", subtype: "AST-FA", rekeningDetail: "Aset Tetap PC & Server", tipe: "Assets", kategori: "Fixed Assets", saldo: 65000000, status: "Aktif" },

  // Liabilities
  { id: 8, kode: "2001", nama: "Utang Usaha / Vendor", subtype: "LIA-AP", rekeningDetail: "Tagihan Supplier Buku & ATK", tipe: "Liabilities & Credit Cards", kategori: "Accounts Payable", saldo: 18500000, status: "Aktif" },
  { id: 9, kode: "2002", nama: "Kartu Kredit Corporate BCA", subtype: "LIA-CC", rekeningDetail: "Limit CC BCA 50jt", tipe: "Liabilities & Credit Cards", kategori: "Credit Cards", saldo: 6200000, status: "Aktif" },
  { id: 10, kode: "2101", nama: "Utang Gaji Instruktur", subtype: "LIA-AC", rekeningDetail: "Accrued Payroll Sensei", tipe: "Liabilities & Credit Cards", kategori: "Current Liabilities", saldo: 0, status: "Aktif" },

  // Income
  { id: 11, kode: "4001", nama: "Pendapatan Kursus Bahasa Jepang", subtype: "INC-OP", rekeningDetail: "SPP Bulanan Peserta Intensif", tipe: "Income", kategori: "Operating Revenue", saldo: 215000000, status: "Aktif" },
  { id: 12, kode: "4002", nama: "Pendapatan Pendaftaran Siswa Baru", subtype: "INC-OP", rekeningDetail: "Biaya Registrasi & Formulir", tipe: "Income", kategori: "Operating Revenue", saldo: 30000000, status: "Aktif" },
  { id: 13, kode: "4003", nama: "Pendapatan Program Matching Job", subtype: "INC-OTH", rekeningDetail: "Biaya Penempatan Tokutei Ginou", tipe: "Income", kategori: "Other Revenue", saldo: 85000000, status: "Aktif" },

  // Expenses
  { id: 14, kode: "5001", nama: "Beban Gaji Sensei & Karyawan", subtype: "EXP-OP", rekeningDetail: "Payroll Bulanan", tipe: "Expenses", kategori: "Operating Expenses", saldo: 85000000, status: "Aktif" },
  { id: 15, kode: "5002", nama: "Beban Sewa Gedung Kampus", subtype: "EXP-OP", rekeningDetail: "Sewa Tempat LPK", tipe: "Expenses", kategori: "Operating Expenses", saldo: 25000000, status: "Aktif" },
  { id: 16, kode: "5003", nama: "Beban Listrik, Internet & Air", subtype: "EXP-OP", rekeningDetail: "PLN, Indihome, PDAM", tipe: "Expenses", kategori: "Operating Expenses", saldo: 6500000, status: "Aktif" },
  { id: 17, kode: "5004", nama: "Beban Pengadaan Modul & Seragam", subtype: "EXP-OP", rekeningDetail: "Buku Minna no Nihongo & Seragam", tipe: "Expenses", kategori: "Course Material", saldo: 14000000, status: "Aktif" },

  // Equity
  { id: 18, kode: "3001", nama: "Modal Disetor Pemilik", subtype: "EQ-CAP", rekeningDetail: "Modal Saham Awal Perusahaan", tipe: "Equity", kategori: "Owner's Equity", saldo: 300000000, status: "Aktif" },
  { id: 19, kode: "3002", nama: "Laba Ditahan (Retained Earnings)", subtype: "EQ-RE", rekeningDetail: "Akumulasi Laba Bersih Periode Lalu", tipe: "Equity", kategori: "Retained Earnings", saldo: 86500000, status: "Aktif" },
];

const TABS = [
  { key: "Assets", label: "Assets" },
  { key: "Liabilities & Credit Cards", label: "Liabilities & Credit Cards" },
  { key: "Income", label: "Income" },
  { key: "Expenses", label: "Expenses" },
  { key: "Equity", label: "Equity" },
];

export default function CoaPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_coa_data");
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Auto-heal jika ada 1002 yang keliru bernama Petty Cash
          parsed = parsed.map(c => {
            const nameLower = (c.nama || "").toLowerCase();
            const isPetty = nameLower.includes("petty") || nameLower.includes("kas kecil");
            if (c.kode === "1002" && isPetty) {
              return {
                ...c,
                nama: "Bank BCA Operasional (LPK Creativa Bridging Intern)",
                rekeningDetail: "BCA a/n PT LPK Creativa Bridging Intern 1832-918-428"
              };
            }
            if (c.kode === "1001" && !isPetty) {
              return {
                ...c,
                nama: "Petty Cash (Kas Kecil Tunai & Vendor Kecil)",
                rekeningDetail: "Kasir & Kas Kecil Tunai Kantor"
              };
            }
            return c;
          });
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_COA;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Assets");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem("finance_coa_data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  const [form, setForm] = useState({
    kode: "",
    nama: "",
    subtype: "AST-CB",
    tipe: "Assets",
    kategori: "Cash and Bank",
    rekeningDetail: "",
    saldo: "0",
    status: "Aktif",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      kode: "",
      nama: "",
      subtype: activeTab === "Assets" ? "AST-CB" : activeTab === "Liabilities & Credit Cards" ? "LIA-AP" : activeTab === "Income" ? "INC-OP" : activeTab === "Expenses" ? "EXP-OP" : "EQ-CAP",
      tipe: activeTab,
      kategori: activeTab === "Assets" ? "Cash and Bank" : "General",
      rekeningDetail: "",
      saldo: "0",
      status: "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      kode: item.kode,
      nama: item.nama,
      subtype: item.subtype || "AST-CB",
      tipe: item.tipe,
      kategori: item.kategori,
      rekeningDetail: item.rekeningDetail || "",
      saldo: item.saldo,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    const targetId = String(deletingItem.id);
    const updated = data.filter(d => String(d.id) !== targetId);
    setData(updated);
    try {
      localStorage.setItem("finance_coa_data", JSON.stringify(updated));
      await accountingMutate({
        action: "delete",
        id: deletingItem.id,
        type: "coa",
      });
    } catch (e) {
      // Local state is already updated and saved to localStorage
    }
    setDeletingItem(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.kode || !form.nama) return;
    setBusy(true);

    if (editingItem) {
      setData(data.map(d => d.id === editingItem.id ? {
        ...d,
        kode: form.kode,
        nama: form.nama,
        subtype: form.subtype,
        tipe: form.tipe,
        kategori: form.kategori,
        rekeningDetail: form.rekeningDetail,
        saldo: Number(form.saldo || 0),
        status: form.status,
      } : d));
    } else {
      const newAccount = {
        id: Date.now(),
        kode: form.kode,
        nama: form.nama,
        subtype: form.subtype || "AST-CB",
        tipe: form.tipe,
        kategori: form.kategori,
        rekeningDetail: form.rekeningDetail,
        saldo: Number(form.saldo || 0),
        status: form.status,
      };
      setData([...data, newAccount]);
    }

    setBusy(false);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleExport = () => {
    exportToExcel(
      data.map(d => ({
        "Kode Akun": d.kode,
        "Nama Akun": d.nama,
        Tipe: d.tipe,
        Kategori: d.kategori,
        Subtype: d.subtype,
        Keterangan: d.rekeningDetail,
        Saldo: d.saldo,
        Status: d.status,
      })),
      "Chart_of_Accounts_COA"
    );
  };

  // Filter tab & search
  const filteredData = data.filter(item => {
    if (activeTab !== "all" && item.tipe !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        (item.rekeningDetail && item.rekeningDetail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by category (e.g. Cash and Bank, Fixed Assets, etc.)
  const groupedAccounts = filteredData.reduce((acc, curr) => {
    const group = curr.kategori || "Lainnya";
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto space-y-6">
        <FinancePageHeader
          title="Chart of Accounts"
          subtitle="Dashboard • Accounting • Chart of Accounts"
          primaryLabel="+ Add a New Account"
          onPrimaryClick={handleOpenCreate}
          onSecondaryClick={handleExport}
        />

        {/* Pill Navigation Tabs matching reference mockup */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {TABS.map((tab) => {
              const count = data.filter(d => d.tipe === tab.key).length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-2xs border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari akun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none px-2"
          />
        </div>

        {/* Grouped Account Cards matching exact screenshot */}
        <div className="space-y-6">
          {Object.keys(groupedAccounts).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Tidak ada akun ditemukan untuk kategori ini.
            </div>
          ) : (
            Object.entries(groupedAccounts).map(([groupName, items]) => (
              <div key={groupName} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {/* Group Header */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {groupName === "Cash and Bank" ? <Landmark className="w-4 h-4 text-blue-500" /> : <Wallet className="w-4 h-4 text-emerald-500" />}
                    {groupName}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                    {items.length} accounts
                  </span>
                </div>

                {/* Account Rows */}
                <div className="divide-y divide-slate-100">
                  {items.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {acc.kode}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {acc.nama} (IDR)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-emerald-600 font-semibold">Active account record</span>
                          <span>•</span>
                          <span>Subtype: {acc.subtype}</span>
                          {acc.rekeningDetail && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{acc.rekeningDetail}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right sm:mr-3">
                          <div className="text-xs font-bold text-slate-900">{formatRupiah(acc.saldo)}</div>
                          <div className="text-[10px] text-slate-400">Saldo Berjalan</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCreate()}
                            className="text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg px-2.5 py-1.5 transition"
                          >
                            + Add Child
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Akun"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(acc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Tambah / Edit Akun COA */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Edit Akun Akuntansi" : "Tambah Akun Akuntansi (COA)"}
          subtitle={editingItem ? "Perbarui informasi kode akun pembukuan" : "Buat akun rekening, kas kecil, aset, pendapatan, atau beban baru"}
          onSubmit={handleSave}
          submitText={editingItem ? "Perbarui Akun" : "Simpan Akun"}
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Akun</label>
              <input
                type="text"
                required
                placeholder="Contoh: 1001, 1002"
                value={form.kode}
                onChange={e => setForm({ ...form, kode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Akun / Rekening</label>
              <input
                type="text"
                required
                placeholder="Contoh: Petty Cash (IDR) / Bank BCA Operasional"
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Klasifikasi Utama</label>
              <select
                value={form.tipe}
                onChange={e => setForm({ ...form, tipe: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Assets">Assets (Kas, Bank, Piutang, Aset Tetap)</option>
                <option value="Liabilities & Credit Cards">Liabilities & Credit Cards (Utang, Kartu Kredit)</option>
                <option value="Income">Income (Pendapatan Kursus & Jasa)</option>
                <option value="Expenses">Expenses (Beban Operasional & Gaji)</option>
                <option value="Equity">Equity (Modal & Laba Ditahan)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub Kategori</label>
              <input
                type="text"
                placeholder="Contoh: Cash and Bank, Accounts Receivable, dll"
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detail Rekening / Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: BCA a/n PT LPK Creativa 883-131-8732"
                value={form.rekeningDetail}
                onChange={e => setForm({ ...form, rekeningDetail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Saldo Awal (Rp)</label>
              <input
                type="number"
                value={form.saldo}
                onChange={e => setForm({ ...form, saldo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
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
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Akun COA?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-800">{deletingItem.kode} - {deletingItem.nama}</strong>?
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
