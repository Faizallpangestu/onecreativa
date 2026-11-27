import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import {
  FinancePageHeader,
  FinanceBadge,
  FinanceTable,
  FinanceFilterBar,
  formatRupiah,
  exportToExcel,
} from './FinancePageComponents';
import {
  ArrowRightLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Send,
  AlertCircle,
  Trash2,
  Landmark,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

function mapServerBanks(rawBanks = []) {
  return (rawBanks || []).map((b) => ({
    id: String(b.id),
    bankId: Number(b.id),
    accountId: Number(b.account_id),
    name: `${b.name}${b.account_number && b.account_number !== '—' && b.account_number !== '-' ? ` (${b.account_number})` : ''}`,
    rawName: b.name,
    bank: b.bank_name || b.name,
    noRek: b.account_number || '',
    balance: Number(b.balance || 0),
    source: 'rekening',
    originalId: b.id,
  }));
}

function mapServerTransfers(rawTransfers = []) {
  return (rawTransfers || []).map((t) => ({
    id: t.transfer_number,
    dbId: Number(t.id),
    tanggal: t.transfer_date,
    dari: t.from_name,
    ke: t.to_name,
    nominal: Number(t.amount || 0),
    biayaAdmin: Number(t.admin_fee || 0),
    status: t.status || 'Selesai',
    catatan: t.notes || '',
  }));
}

function loadCachedAccounts() {
  try {
    const rekRaw = localStorage.getItem('finance_rekening_data');
    if (rekRaw) {
      const rekList = JSON.parse(rekRaw);
      if (Array.isArray(rekList) && rekList.length > 0) {
        return rekList.map((item) => ({
          id: String(item.id),
          bankId: Number(item.id),
          name: `${item.nama}${item.noRek && item.noRek !== '—' && item.noRek !== '-' ? ` (${item.noRek})` : ''}`,
          rawName: item.nama,
          bank: item.bank || item.nama,
          noRek: item.noRek || '',
          balance: Number(item.saldo || 0),
          source: 'rekening',
          originalId: item.id,
        }));
      }
    }
  } catch (e) { }
  return [];
}

export default function TransferPage() {
  const [accounts, setAccounts] = useState(() => loadCachedAccounts());
  const [fromAccount, setFromAccount] = useState(() => (accounts[0] ? accounts[0].id : ''));
  const [toAccount, setToAccount] = useState(() => (accounts[1] ? accounts[1].id : accounts[0] ? accounts[0].id : ''));
  const [nominal, setNominal] = useState('');
  const [adminFee, setAdminFee] = useState('0');
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyDelete, setBusyDelete] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);

  const syncAccountsToLocalCache = (rawBanks = []) => {
    try {
      const cacheFormat = rawBanks.map((b, i) => {
        const isCash = (b.name || '').toLowerCase().includes('kas') || (b.name || '').toLowerCase().includes('petty');
        const isWallet = (b.name || '').toLowerCase().includes('wallet') || (b.name || '').toLowerCase().includes('dana');
        return {
          id: b.id || i + 1,
          nama: b.name,
          jenis: isCash ? 'Tunai' : isWallet ? 'E-Wallet' : 'Bank',
          bank: b.bank_name || (isCash ? 'Kas Tunai Kasir' : 'Bank BCA'),
          noRek: b.account_number || (isCash ? 'CASH-01' : '—'),
          saldo: Number(b.balance || 0),
          status: Number(b.is_active) === 0 ? 'Nonaktif' : 'Aktif',
        };
      });
      localStorage.setItem('finance_rekening_data', JSON.stringify(cacheFormat));
      localStorage.removeItem('finance_coa_data');
      localStorage.removeItem('finance_transfer_history');
    } catch (e) { }
  };

  const fetchTransferData = useCallback(async (isMountedCheck = () => true) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/accounting.php', {
        params: { view: 'transfers', _t: Date.now() },
      });
      if (!isMountedCheck()) return null;
      const token = res.data?.csrf_token || '';
      if (token) setCsrfToken(token);

      const rawBanks = res.data?.data?.banks || [];
      const rawTransfers = res.data?.data?.transfers || [];

      const mappedBanks = mapServerBanks(rawBanks);
      const mappedTransfers = mapServerTransfers(rawTransfers);

      setAccounts(mappedBanks);
      setHistory(mappedTransfers);
      syncAccountsToLocalCache(rawBanks);
      return token;
    } catch (err) {
      if (isMountedCheck()) {
        console.warn('Gagal memuat data transfer & saldo rekening:', err);
        setErrorNotice(err?.response?.data?.message || 'Gagal memuat saldo rekening dari database server.');
      }
      return null;
    } finally {
      if (isMountedCheck()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchTransferData(() => active);
    return () => { active = false; };
  }, [fetchTransferData]);

  // Pastikan akun sumber dan tujuan valid saat daftar akun berubah
  useEffect(() => {
    if (accounts.length > 0) {
      if (!accounts.some((a) => String(a.id) === String(fromAccount))) {
        setFromAccount(accounts[0].id);
      }
      if (!accounts.some((a) => String(a.id) === String(toAccount))) {
        setToAccount(accounts[1] ? accounts[1].id : accounts[0].id);
      }
    }
  }, [accounts, fromAccount, toAccount]);

  const ensureCsrfToken = async () => {
    if (csrfToken) return csrfToken;
    const res = await axios.get('/api/accounting.php', {
      params: { view: 'transfers', _t: Date.now() },
    });
    const freshToken = res.data?.csrf_token || '';
    if (freshToken) setCsrfToken(freshToken);
    return freshToken;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice(null);
    setSuccessNotice(null);

    const numTransfer = parseFloat(nominal);
    const numFee = parseFloat(adminFee || 0);
    const totalDeduction = numTransfer + numFee;

    if (!nominal || isNaN(numTransfer) || numTransfer <= 0) {
      setErrorNotice('Mohon masukkan nominal transfer yang valid (lebih dari 0).');
      return;
    }
    if (isNaN(numFee) || numFee < 0) {
      setErrorNotice('Biaya admin tidak valid.');
      return;
    }
    if (String(fromAccount) === String(toAccount)) {
      setErrorNotice('Rekening asal dan rekening tujuan tidak boleh sama.');
      return;
    }

    const fromAccObj = accounts.find((a) => String(a.id) === String(fromAccount));
    const toAccObj = accounts.find((a) => String(a.id) === String(toAccount));

    if (!fromAccObj || !toAccObj) {
      setErrorNotice('Rekening tidak valid atau belum dimuat dari server.');
      return;
    }

    if (fromAccObj.balance + 0.001 < totalDeduction) {
      setErrorNotice(
        `Saldo pada rekening ${fromAccObj.name} tidak mencukupi! Saldo tersedia: ${formatRupiah(fromAccObj.balance)}, Total dibutuhkan: ${formatRupiah(totalDeduction)}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await ensureCsrfToken();
      const payload = {
        action: 'bank_transfer',
        from_bank_id: Number(fromAccObj.bankId || fromAccObj.originalId),
        to_bank_id: Number(toAccObj.bankId || toAccObj.originalId),
        amount: numTransfer,
        admin_fee: numFee,
        transfer_date: transferDate,
        notes: notes?.trim() || 'Transfer pemindahan dana internal',
      };

      const res = await axios.post('/api/accounting.php', payload, {
        headers: { 'X-CSRF-Token': token },
      });

      const savedTrf = res.data?.data?.transfer;
      const trfNo = savedTrf?.transfer_number || '';

      // Refresh langsung dari database MySQL agar saldo & riwayat 100% sinkron
      await fetchTransferData();

      const cleanDari = fromAccObj?.rawName || fromAccObj?.name.split(' (')[0] || 'Rekening Asal';
      const cleanKe = toAccObj?.rawName || toAccObj?.name.split(' (')[0] || 'Rekening Tujuan';

      setSuccessNotice(
        `Transfer ${trfNo ? `[${trfNo}] ` : ''}sebesar ${formatRupiah(numTransfer)} dari ${cleanDari} ke ${cleanKe} berhasil tersimpan permanen di database & jurnal!`
      );
      setNominal('');
      setAdminFee('0');
      setNotes('');

      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err) {
      console.error('Transfer error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan pemindahan dana ke database.';
      setErrorNotice(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteTransfer = async () => {
    if (!deletingItem) return;
    setBusyDelete(true);
    setErrorNotice(null);
    try {
      const token = await ensureCsrfToken();
      await axios.post(
        '/api/accounting.php',
        { action: 'delete_bank_transfer', id: Number(deletingItem.dbId) },
        { headers: { 'X-CSRF-Token': token } }
      );
      const deletedNo = deletingItem.id;
      setDeletingItem(null);
      await fetchTransferData();
      setSuccessNotice(`Transfer ${deletedNo} berhasil dibatalkan & saldo kedua rekening dikembalikan seperti semula.`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      setErrorNotice(err?.response?.data?.message || err?.message || 'Gagal menghapus riwayat transfer.');
      setDeletingItem(null);
    } finally {
      setBusyDelete(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredHistory.map((h, idx) => ({
      No: idx + 1,
      'No Referensi': h.id,
      Tanggal: h.tanggal,
      'Dari Rekening (Asal)': h.dari,
      'Ke Rekening (Tujuan)': h.ke,
      'Nominal Transfer (Rp)': h.nominal,
      'Biaya Admin (Rp)': h.biayaAdmin,
      Status: h.status,
      Catatan: h.catatan,
    }));
    exportToExcel(exportData, 'Riwayat_Transfer_Dana_Kas_Bank');
  };

  const filteredHistory = useMemo(() => {
    if (!search) return history;
    const q = search.toLowerCase();
    return history.filter(
      (h) =>
        h.id.toLowerCase().includes(q) ||
        h.dari.toLowerCase().includes(q) ||
        h.ke.toLowerCase().includes(q) ||
        (h.catatan && h.catatan.toLowerCase().includes(q)) ||
        h.tanggal.includes(q)
    );
  }, [history, search]);

  const tableColumns = [
    {
      key: 'id',
      header: 'No. Referensi',
      render: (row) => (
        <span className="text-xs font-mono font-semibold text-blue-600">
          {row.id}
        </span>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{row.tanggal}</span>
      ),
    },
    {
      key: 'jalur',
      header: 'Jalur Transfer (Asal → Tujuan)',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800">{row.dari}</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="font-semibold text-emerald-700">{row.ke}</span>
        </div>
      ),
    },
    {
      key: 'nominal',
      header: 'Nominal Transfer',
      className: 'text-right',
      render: (row) => (
        <div className="text-right">
          <div className="text-xs font-bold text-slate-900 font-mono">
            {formatRupiah(row.nominal)}
          </div>
          {row.biayaAdmin > 0 && (
            <div className="text-[10px] text-slate-400 font-mono">
              Admin: +{formatRupiah(row.biayaAdmin)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'catatan',
      header: 'Keterangan',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.catatan || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <FinanceBadge status={row.status || 'Selesai'} />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'center',
      className: 'w-16',
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setDeletingItem(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Hapus Catatan Riwayat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <FinancePageHeader
          title="Transfer Dana Antar Rekening"
          subtitle="Pemindahan saldo internal antar rekening bank, dropping petty cash kasir, dan penyesuaian likuiditas"
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        />

        {successNotice && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorNotice}</span>
          </div>
        )}

        {/* Grid: Transfer Form + Quick Balance Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Pemindahan Dana Internal
                </h3>
                <p className="text-xs text-slate-500">
                  Dropping dana kas kecil (Petty Cash) atau alokasi likuiditas antar rekening bank
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Dari Rekening */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Dari Rekening (Sumber Dana)
                  </label>
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — Saldo: {formatRupiah(acc.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ke Rekening */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Ke Rekening (Tujuan Dana)
                  </label>
                  <select
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — Saldo: {formatRupiah(acc.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Nominal Transfer (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 5000000"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                    required
                  />
                </div>

                {/* Tanggal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Transfer
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                {/* Biaya Admin */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Biaya Admin Bank (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={adminFee}
                    onChange={(e) => setAdminFee(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                {/* Catatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Catatan / Keperluan Pemindahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dropping petty cash operasional mingguan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || loading || accounts.length < 2}
                  className="inline-flex items-center gap-2 bg-[#1a73e8] hover:bg-blue-600 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses Pemindahan...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Simpan & Eksekusi Transfer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info & Saldo Rekening Terdaftar (1 Col) */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-500" />
                  Saldo Rekening Kas & Bank Terdaftar
                </h4>
                <button
                  type="button"
                  onClick={() => fetchTransferData()}
                  disabled={loading}
                  title="Muat ulang saldo terbaru dari database"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-2.5">
                {accounts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                    {loading ? 'Memuat saldo rekening dari database...' : 'Belum ada rekening kas/bank terdaftar.'}
                  </div>
                ) : accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {acc.name}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                      {formatRupiah(acc.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Sinkronisasi Finansial Otomatis
              </div>
              <p className="leading-relaxed text-amber-700">
                Setiap transaksi pemindahan saldo langsung tersimpan di database server, memotong saldo rekening asal, menambahkan ke rekening tujuan, serta memposting Jurnal Keuangan secara permanen.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar Riwayat */}
        <FinanceFilterBar
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari no. referensi, rekening asal, rekening tujuan, catatan..."
          dropdowns={[]}
          onReset={() => setSearch('')}
        />

        {/* Riwayat Transfer Dana Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Riwayat Pemindahan Saldo ({filteredHistory.length})
            </h3>
            <span className="text-xs text-slate-500">
              Tercatat permanen dalam database treasury LPK
            </span>
          </div>
          <FinanceTable
            columns={tableColumns}
            data={filteredHistory}
            loading={loading}
            totalItems={filteredHistory.length}
            emptyMessage="Belum ada riwayat transfer internal yang cocok"
          />
        </div>

        {/* Modal Konfirmasi Hapus Riwayat */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Batalkan & Hapus Transfer?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Menghapus transfer <strong className="text-slate-800">{deletingItem.id}</strong> ({formatRupiah(deletingItem.nominal)}) akan otomatis melakukan jurnal balik dan mengembalikan saldo kedua rekening di database.
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={busyDelete}
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={busyDelete}
                  onClick={confirmDeleteTransfer}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {busyDelete ? 'Memproses...' : 'Ya, Batalkan & Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
