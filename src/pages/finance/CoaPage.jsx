import React, { useState, useEffect, useMemo } from "react";
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
import { accountingGet, accountingMutate, accountingError } from "../../utils/accountingApi";
import { Plus, Landmark, Wallet, CreditCard, ChevronRight, MoreHorizontal, Pencil, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

const TABS = [
  { key: "Assets", label: "Assets (Aset)", group: 1 },
  { key: "Liabilities & Credit Cards", label: "Liabilities (Kewajiban)", group: 2 },
  { key: "Equity", label: "Equity (Ekuitas)", group: 3 },
  { key: "Income", label: "Income (Pendapatan)", group: 4 },
  { key: "Expenses", label: "Expenses (Beban)", group: 5 },
];

const GROUP_MAP = {
  "Assets": 1,
  "Liabilities & Credit Cards": 2,
  "Equity": 3,
  "Income": 4,
  "Expenses": 5
};

const CLASS_OPTIONS = {
  1: [
    { value: "cash", label: "Kas dan Bank (Cash & Bank)" },
    { value: "receivable", label: "Piutang Usaha (Accounts Receivable)" },
    { value: "inventory", label: "Persediaan (Inventory)" },
    { value: "fixed_asset", label: "Aset Tetap (Fixed Assets)" },
    { value: "prepayment", label: "Uang Muka / Dibayar di Muka (Prepayments)" },
    { value: "other_asset", label: "Aset Lainnya (Other Assets)" },
  ],
  2: [
    { value: "payable", label: "Utang Usaha / Vendor (Accounts Payable)" },
    { value: "payroll_payable", label: "Utang Gaji (Payroll Payable)" },
    { value: "loan", label: "Utang Pinjaman (Loan Payable)" },
    { value: "deferred_revenue", label: "Pendapatan Diterima di Muka (Deferred Revenue)" },
    { value: "reimbursement_payable", label: "Utang Reimbursement (Reimbursement Payable)" },
    { value: "tax_payable", label: "Utang Pajak (Tax Payable)" },
    { value: "other_liability", label: "Kewajiban Lainnya (Other Liabilities)" },
  ],
  3: [
    { value: "capital", label: "Modal Pemilik / Saham (Paid-in Capital)" },
    { value: "retained_earnings", label: "Laba Ditahan (Retained Earnings)" },
    { value: "other_equity", label: "Ekuitas Lainnya (Other Equity)" },
  ],
  4: [
    { value: "revenue", label: "Pendapatan Operasional (Operating Revenue)" },
    { value: "other_income", label: "Pendapatan Non-Operasional (Other Income)" },
  ],
  5: [
    { value: "cost_of_services", label: "Beban Pokok Pendapatan (Cost of Services / HPP)" },
    { value: "operating_expense", label: "Beban Operasional & Administrasi (OPEX)" },
    { value: "other_expense", label: "Beban Non-Operasional / Bunga (Other Expenses)" },
    { value: "income_tax", label: "Beban Pajak Penghasilan (Income Tax)" },
  ]
};

const CLASS_LABELS = {
  cash: "Cash and Bank",
  receivable: "Accounts Receivable",
  inventory: "Inventory",
  fixed_asset: "Fixed Assets",
  prepayment: "Prepayments",
  other_asset: "Other Assets",
  payable: "Accounts Payable",
  payroll_payable: "Payroll Payable",
  loan: "Loan Payable",
  deferred_revenue: "Deferred Revenue",
  reimbursement_payable: "Reimbursement Payable",
  tax_payable: "Tax Payable",
  other_liability: "Other Liabilities",
  capital: "Owner's Equity / Capital",
  retained_earnings: "Retained Earnings",
  other_equity: "Other Equity",
  revenue: "Operating Revenue",
  other_income: "Other Income",
  cost_of_services: "Cost of Services",
  operating_expense: "Operating Expenses",
  other_expense: "Other Expenses",
  income_tax: "Income Tax"
};

export default function CoaPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_coa_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter(a => a.status !== 'Nonaktif' && a.kode !== '1100');
          localStorage.setItem("finance_coa_data", JSON.stringify(clean));
          return clean;
        }
      }
    } catch {}
    return [];
  });

  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Assets");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const typeMap = {
    1: "Assets",
    2: "Liabilities & Credit Cards",
    3: "Equity",
    4: "Income",
    5: "Expenses"
  };

  const transformAccounts = (rawAccounts, rawBanks = []) => {
    const bankMap = {};
    rawBanks.forEach(b => {
      bankMap[b.account_id] = `${b.name} (${b.bank_name || ''} ${b.account_number || ''})`.trim();
    });

    return rawAccounts
      .filter(a => Number(a.is_active) !== 0 && a.code !== '1100')
      .map(a => {
        const grp = Number(a.account_group) || 1;
        const rClass = a.report_class || "other_asset";
        return {
          id: a.id,
          kode: a.code,
          nama: a.name,
          account_group: grp,
          normal_balance: a.normal_balance || (grp === 1 || grp === 5 ? "debit" : "credit"),
          report_class: rClass,
          tipe: typeMap[grp] || "Assets",
          kategori: CLASS_LABELS[rClass] || rClass,
          subtype: `GRP-${grp}-${rClass}`,
          rekeningDetail: bankMap[a.id] || (rClass === 'cash' ? "Akun Kas & Bank Riil" : `Klasifikasi: ${rClass}`),
          saldo: Number(a.balance || 0),
          status: "Aktif"
        };
      });
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await accountingGet("lookups");
      if (res?.csrf_token) setCsrfToken(res.csrf_token);
      const rawAccounts = res?.data?.accounts || [];
      const rawBanks = res?.data?.banks || [];
      if (rawAccounts.length > 0) {
        const transformed = transformAccounts(rawAccounts, rawBanks);
        setData(transformed);
        localStorage.setItem("finance_coa_data", JSON.stringify(transformed));
      }
    } catch (err) {
      console.warn("Gagal mengambil data akun dari server:", err);
      // Fallback: jika localStorage kosong, coba panggil API langsung
      try {
        const alt = await axios.get("/api/accounting.php?view=lookups");
        if (alt.data?.csrf_token) setCsrfToken(alt.data.csrf_token);
        const altAccounts = alt.data?.data?.accounts || alt.data?.accounts || [];
        if (altAccounts.length > 0) {
          const transformed = transformAccounts(altAccounts, alt.data?.data?.banks || []);
          setData(transformed);
          localStorage.setItem("finance_coa_data", JSON.stringify(transformed));
        }
      } catch (e) {
        const msg = e?.response?.data?.message || err?.response?.data?.message || e?.message || err?.message || "Tidak dapat terhubung ke server akuntansi.";
        setErrorMsg(`${msg} (Periksa koneksi atau silakan login ulang jika sesi berakhir).`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const [form, setForm] = useState({
    kode: "",
    nama: "",
    tipe: "Assets",
    reportClass: "cash",
    rekeningDetail: "",
    bankName: "",
    accountNumber: "",
    saldo: "0",
    status: "Aktif",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setErrorMsg("");
    setSuccessMsg("");
    const grp = GROUP_MAP[activeTab] || 1;
    const defaultClass = CLASS_OPTIONS[grp]?.[0]?.value || "cash";
    setForm({
      kode: `${grp}000`,
      nama: "",
      tipe: activeTab,
      reportClass: defaultClass,
      rekeningDetail: "",
      bankName: "",
      accountNumber: "",
      saldo: "0",
      status: "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setErrorMsg("");
    setSuccessMsg("");
    setForm({
      kode: item.kode,
      nama: item.nama,
      tipe: item.tipe,
      reportClass: item.report_class,
      rekeningDetail: item.rekeningDetail || "",
      bankName: "",
      accountNumber: "",
      saldo: item.saldo,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType) => {
    const grp = GROUP_MAP[newType] || 1;
    const defaultClass = CLASS_OPTIONS[grp]?.[0]?.value || "cash";
    let newCode = form.kode;
    if (!newCode || newCode.length < 2 || !newCode.startsWith(String(grp))) {
      newCode = `${grp}000`;
    }
    setForm({
      ...form,
      tipe: newType,
      reportClass: defaultClass,
      kode: newCode
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.kode || !form.nama) {
      setErrorMsg("Kode akun dan nama akun wajib diisi.");
      return;
    }

    setBusy(true);
    setErrorMsg("");

    const grp = GROUP_MAP[form.tipe] || 1;
    let cleanCode = form.kode.trim();
    if (!cleanCode.startsWith(String(grp))) {
      cleanCode = `${grp}${cleanCode.replace(/^\d/, '')}`;
    }

    const payload = {
      action: "account",
      id: editingItem?.id ? Number(editingItem.id) : undefined,
      code: cleanCode,
      name: form.nama.trim(),
      account_group: grp,
      normal_balance: grp === 1 || grp === 5 ? "debit" : "credit",
      report_class: form.reportClass,
      saldo: Number(form.saldo || 0),
      is_detail: 1,
      is_active: form.status === "Aktif" ? 1 : 0
    };

    try {
      const savedAcc = await accountingMutate(payload, csrfToken);
      
      // Jika akun kas/bank baru dan ada detail bank, daftarkan juga ke cash_bank_accounts
      if (!editingItem && form.reportClass === 'cash' && (form.bankName || form.accountNumber)) {
        try {
          await accountingMutate({
            action: "bank",
            name: form.nama.trim(),
            account_id: savedAcc.id,
            bank_name: form.bankName.trim() || "Bank",
            account_number: form.accountNumber.trim() || "-"
          }, csrfToken);
        } catch (bankErr) {
          console.warn("Gagal mendaftarkan rekening bank:", bankErr);
        }
      }

      setSuccessMsg(`Akun ${cleanCode} - ${form.nama} berhasil disimpan.`);
      setIsModalOpen(false);
      setEditingItem(null);
      await fetchAccounts();
    } catch (err) {
      console.error("Gagal simpan akun:", err);
      setErrorMsg(accountingError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    setErrorMsg("");

    try {
      await accountingMutate({
        action: "delete_account",
        id: Number(deletingItem.id)
      }, csrfToken);

      setSuccessMsg(`Akun ${deletingItem.kode} - ${deletingItem.nama} berhasil dihapus permanen.`);
      
      const targetId = String(deletingItem.id);
      const updated = data.filter(d => String(d.id) !== targetId && String(d.kode) !== String(deletingItem.kode));
      setData(updated);
      try {
        localStorage.setItem("finance_coa_data", JSON.stringify(updated));
      } catch (e) {}

      setDeletingItem(null);
      await fetchAccounts();
    } catch (err) {
      console.error("Gagal menghapus akun:", err);
      // Fallback: hapus dari state lokal jika akun tidak ditemukan atau sudah terhapus di server
      const targetId = String(deletingItem.id);
      const updated = data.filter(d => String(d.id) !== targetId && String(d.kode) !== String(deletingItem.kode));
      setData(updated);
      try {
        localStorage.setItem("finance_coa_data", JSON.stringify(updated));
      } catch (e) {}
      setErrorMsg(accountingError(err));
      setDeletingItem(null);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = () => {
    exportToExcel(
      data.map(d => ({
        "Kode Akun": d.kode,
        "Nama Akun": d.nama,
        Tipe: d.tipe,
        Kategori: d.kategori,
        "Normal Balance": d.normal_balance,
        Keterangan: d.rekeningDetail,
        Saldo: d.saldo,
        Status: d.status,
      })),
      "Chart_of_Accounts_COA"
    );
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
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
  }, [data, activeTab, search]);

  const groupedAccounts = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      const group = curr.kategori || "Lainnya";
      if (!acc[group]) acc[group] = [];
      acc[group].push(curr);
      return acc;
    }, {});
  }, [filteredData]);

  const activeGroupNum = GROUP_MAP[activeTab] || 1;
  const currentClassOptions = CLASS_OPTIONS[GROUP_MAP[form.tipe] || 1] || [];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto space-y-6">
        <FinancePageHeader
          title="Chart of Accounts (COA)"
          subtitle="Bagan Akun Standar Akuntansi Internasional & PSAK • LPK Creativa Bridging"
          primaryLabel="+ Tambah Akun Baru"
          onPrimaryClick={handleOpenCreate}
          onSecondaryClick={handleExport}
        />

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-700 font-bold ml-2">×</button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-700 font-bold ml-2">×</button>
          </div>
        )}

        {/* Pill Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {TABS.map((tab) => {
              const count = data.filter(d => d.tipe === tab.key && d.status === "Aktif").length;
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

        {/* Search Bar & Refresh */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Cari kode akun, nama akun, atau nomor rekening..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none px-2"
          />
          <button
            type="button"
            onClick={fetchAccounts}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-1.5 transition whitespace-nowrap"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {/* Grouped Account Cards */}
        <div className="space-y-6">
          {loading && data.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Sedang memuat data akun dari server...
            </div>
          ) : Object.keys(groupedAccounts).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Tidak ada akun ditemukan untuk kelompok ini.
            </div>
          ) : (
            Object.entries(groupedAccounts).map(([groupName, items]) => (
              <div key={groupName} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {groupName.includes("Cash") || groupName.includes("Bank") ? (
                      <Landmark className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Wallet className="w-4 h-4 text-emerald-500" />
                    )}
                    {groupName}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                    {items.length} akun
                  </span>
                </div>

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
                            {acc.nama}
                          </span>
                          {acc.status === "Nonaktif" && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className={acc.status === "Aktif" ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                            {acc.status === "Aktif" ? "Akun Aktif" : "Nonaktif"}
                          </span>
                          <span>•</span>
                          <span>Normal: <b className="capitalize">{acc.normal_balance}</b></span>
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
                            title="Nonaktifkan Akun"
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
          subtitle={editingItem ? "Perbarui informasi akun pembukuan di database" : "Buat akun aset, kewajiban, ekuitas, pendapatan, atau beban baru"}
          onSubmit={handleSave}
          submitText={editingItem ? "Perbarui Akun" : "Simpan Akun"}
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Klasifikasi Utama</label>
              <select
                value={form.tipe}
                onChange={e => handleTypeChange(e.target.value)}
                disabled={Boolean(editingItem)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Assets">1 - Assets (Aset: Kas, Bank, Piutang, Aset Tetap)</option>
                <option value="Liabilities & Credit Cards">2 - Liabilities (Kewajiban: Utang, Akrual)</option>
                <option value="Equity">3 - Equity (Ekuitas: Modal, Laba Ditahan)</option>
                <option value="Income">4 - Income (Pendapatan: Pelatihan, Layanan)</option>
                <option value="Expenses">5 - Expenses (Beban: Operasional, Gaji, Pajak)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub Kategori / Klasifikasi IFRS</label>
              <select
                value={form.reportClass}
                onChange={e => setForm({ ...form, reportClass: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {currentClassOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Akun <span className="text-slate-400 font-normal">(Awali angka {GROUP_MAP[form.tipe] || 1})</span>
              </label>
              <input
                type="text"
                required
                placeholder={`Contoh: ${GROUP_MAP[form.tipe] || 1}110, ${GROUP_MAP[form.tipe] || 1}200`}
                value={form.kode}
                onChange={e => setForm({ ...form, kode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Akun</label>
              <input
                type="text"
                required
                placeholder="Contoh: Kas Kecil Operasional / Bank BNI"
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {form.reportClass === "cash" && !editingItem && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bank (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank BCA / Mandiri / Kasir"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1832-918-428"
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
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

        {/* Modal Konfirmasi Hapus Permanen Akun */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Permanen Akun COA?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-800">{deletingItem.kode} - {deletingItem.nama}</strong> secara permanen? Data akun akan dihapus dari sistem.
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm transition active:scale-95"
                >
                  {busy ? "Menghapus..." : "Ya, Hapus Permanen"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
