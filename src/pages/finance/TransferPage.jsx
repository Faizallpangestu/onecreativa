import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight
} from 'lucide-react';

const INITIAL_TRANSFER_HISTORY = [
  {
    id: 'TRF-2026-0034',
    tanggal: '2026-10-25',
    dari: 'Rekening BCA Creativa Bridging Intern',
    ke: 'Petty Cash (Kas Kecil Tunai & Vendor Kecil)',
    nominal: 5000000,
    biayaAdmin: 0,
    status: 'Selesai',
    catatan: 'Dropping kas kecil operasional & vendor bulanan',
  },
  {
    id: 'TRF-2026-0028',
    tanggal: '2026-10-15',
    dari: 'Rekening BCA Creativa Bridging Intern',
    ke: 'Rekening Cadangan Mandiri',
    nominal: 15000000,
    biayaAdmin: 2500,
    status: 'Selesai',
    catatan: 'Alokasi cadangan likuiditas darurat',
  },
  {
    id: 'TRF-2026-0020',
    tanggal: '2026-10-05',
    dari: 'Rekening BCA Creativa Bridging Intern',
    ke: 'E-Wallet Bisnis (DANA / Flip)',
    nominal: 2500000,
    biayaAdmin: 1000,
    status: 'Selesai',
    catatan: 'Topup operasional disbursement instan',
  },
];

function loadTransferAccounts() {
  let list = [];

  // 1. Ambil akun primer dari finance_rekening_data
  try {
    const rekRaw = localStorage.getItem('finance_rekening_data');
    if (rekRaw) {
      const rekList = JSON.parse(rekRaw);
      if (Array.isArray(rekList) && rekList.length > 0) {
        rekList.forEach((item) => {
          list.push({
            id: `rek_${item.id}`,
            name: `${item.nama}${item.noRek && item.noRek !== '—' ? ` (${item.noRek})` : ''}`,
            rawName: item.nama,
            bank: item.bank || item.nama,
            balance: Number(item.saldo || 0),
            source: 'rekening',
            originalId: item.id,
          });
        });
      }
    }
  } catch (e) {}

  // 2. Jika belum ada di rekening, ambil akun Kas & Bank dari COA
  if (list.length === 0) {
    try {
      const coaRaw = localStorage.getItem('finance_coa_data');
      if (coaRaw) {
        const coaList = JSON.parse(coaRaw);
        if (Array.isArray(coaList)) {
          const cb = coaList.filter(
            (c) => c.tipe === 'Assets' && (c.kategori === 'Cash and Bank' || c.subtype === 'AST-CB')
          );
          cb.forEach((item) => {
            list.push({
              id: `coa_${item.id}`,
              name: `${item.nama}${item.rekeningDetail ? ` (${item.rekeningDetail})` : item.kode ? ` (${item.kode})` : ''}`,
              rawName: item.nama,
              bank: item.nama,
              balance: Number(item.saldo || 0),
              source: 'coa',
              originalId: item.id,
            });
          });
        }
      }
    } catch (e) {}
  }

  // 3. Fallback akun resmi Creativa Bridging Intern
  if (list.length === 0) {
    list = [
      { id: 'rek_1', name: 'Rekening BCA Creativa Bridging Intern (1832-918-428)', rawName: 'Rekening BCA Creativa Bridging Intern', bank: 'Bank BCA', balance: 144200000, source: 'rekening', originalId: 1 },
      { id: 'rek_2', name: 'Petty Cash (Kas Kecil Tunai & Vendor Kecil) (CASH-01)', rawName: 'Petty Cash (Kas Kecil Tunai & Vendor Kecil)', bank: 'Kas Tunai Kasir', balance: 5000000, source: 'rekening', originalId: 2 },
      { id: 'rek_3', name: 'Rekening Cadangan Mandiri (130-0019283)', rawName: 'Rekening Cadangan Mandiri', bank: 'Bank Mandiri', balance: 25000000, source: 'rekening', originalId: 3 },
      { id: 'rek_4', name: 'E-Wallet Bisnis (DANA / Flip) (0812-9988-7766)', rawName: 'E-Wallet Bisnis (DANA / Flip)', bank: 'DANA Bisnis', balance: 12500000, source: 'rekening', originalId: 4 },
    ];
  }

  // Auto-heal balances dari COA jika tersedia
  try {
    const coaRaw = localStorage.getItem('finance_coa_data');
    if (coaRaw) {
      const coaList = JSON.parse(coaRaw);
      if (Array.isArray(coaList)) {
        list = list.map(acc => {
          const accLower = acc.name.toLowerCase();
          if (accLower.includes('bca')) {
            const bcaCoa = coaList.find(c => String(c.kode) === '1002' || (c.nama && c.nama.toLowerCase().includes('bca') && !c.nama.toLowerCase().includes('petty')));
            if (bcaCoa && Number(bcaCoa.saldo) > 0) {
              return { ...acc, balance: Number(bcaCoa.saldo) };
            }
          }
          if (accLower.includes('petty') || accLower.includes('kas kecil')) {
            const pettyCoa = coaList.find(c => String(c.kode) === '1001' || (c.nama && (c.nama.toLowerCase().includes('petty') || c.nama.toLowerCase().includes('kas kecil'))));
            if (pettyCoa && Number(pettyCoa.saldo) > 0) {
              return { ...acc, balance: Number(pettyCoa.saldo) };
            }
          }
          return acc;
        });
      }
    }
  } catch (e) {}

  return list;
}

export default function TransferPage() {
  const [accounts, setAccounts] = useState(() => loadTransferAccounts());
  const [fromAccount, setFromAccount] = useState(() => (accounts[0] ? accounts[0].id : ''));
  const [toAccount, setToAccount] = useState(() => (accounts[1] ? accounts[1].id : accounts[0] ? accounts[0].id : ''));
  const [nominal, setNominal] = useState('');
  const [adminFee, setAdminFee] = useState('0');
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [search, setSearch] = useState('');

  // Transfer history matching system
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('finance_transfer_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TRANSFER_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('finance_transfer_history', JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Pastikan akun sumber dan tujuan valid saat daftar akun berubah
  useEffect(() => {
    if (accounts.length > 0) {
      if (!accounts.some((a) => a.id === fromAccount)) {
        setFromAccount(accounts[0].id);
      }
      if (!accounts.some((a) => a.id === toAccount)) {
        setToAccount(accounts[1] ? accounts[1].id : accounts[0].id);
      }
    }
  }, [accounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numTransfer = parseFloat(nominal);
    const numFee = parseFloat(adminFee || 0);
    const totalDeduction = numTransfer + numFee;

    if (!nominal || numTransfer <= 0) {
      alert('Mohon masukkan nominal transfer yang valid');
      return;
    }
    if (fromAccount === toAccount) {
      alert('Rekening asal dan tujuan tidak boleh sama');
      return;
    }

    const fromAccObj = accounts.find((a) => a.id === fromAccount);
    const toAccObj = accounts.find((a) => a.id === toAccount);

    if (!fromAccObj || !toAccObj) {
      alert('Rekening tidak valid');
      return;
    }

    if (fromAccObj.balance < totalDeduction) {
      alert(
        `Saldo pada rekening ${fromAccObj.name} tidak mencukupi!\nSaldo tersedia: ${formatRupiah(fromAccObj.balance)}\nTotal dibutuhkan: ${formatRupiah(totalDeduction)} (termasuk admin ${formatRupiah(numFee)})`
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // 1. Potong saldo asal & tambah saldo tujuan di local state
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === fromAccount) {
          return { ...acc, balance: Math.max(0, acc.balance - totalDeduction) };
        }
        if (acc.id === toAccount) {
          return { ...acc, balance: acc.balance + numTransfer };
        }
        return acc;
      });
      setAccounts(updatedAccounts);

      // 2. Sinkronkan saldo baru ke Rekening (finance_rekening_data)
      try {
        const rekRaw = localStorage.getItem('finance_rekening_data');
        if (rekRaw) {
          let rekList = JSON.parse(rekRaw);
          rekList = rekList.map((item) => {
            const itemStr = `${item.nama} ${item.bank}`.toLowerCase();
            const fromStr = `${fromAccObj.name} ${fromAccObj.bank || ''}`.toLowerCase();
            const toStr = `${toAccObj.name} ${toAccObj.bank || ''}`.toLowerCase();

            if (item.id === fromAccObj.originalId || fromStr.includes(item.nama.toLowerCase())) {
              return { ...item, saldo: Math.max(0, Number(item.saldo || 0) - totalDeduction) };
            }
            if (item.id === toAccObj.originalId || toStr.includes(item.nama.toLowerCase())) {
              return { ...item, saldo: Number(item.saldo || 0) + numTransfer };
            }
            return item;
          });
          localStorage.setItem('finance_rekening_data', JSON.stringify(rekList));
        }
      } catch (e) {}

      // 3. Sinkronkan saldo baru ke COA (finance_coa_data)
      try {
        const coaRaw = localStorage.getItem('finance_coa_data');
        if (coaRaw) {
          let coaList = JSON.parse(coaRaw);
          coaList = coaList.map((item) => {
            const coaStr = `${item.kode} ${item.nama}`.toLowerCase();
            const fromStr = fromAccObj.name.toLowerCase();
            const toStr = toAccObj.name.toLowerCase();

            // Potong akun asal
            if ((fromStr.includes('bca') && String(item.kode) === '1002') ||
                (fromStr.includes('petty') && String(item.kode) === '1001') ||
                (fromAccObj.source === 'coa' && item.id === fromAccObj.originalId)) {
              return { ...item, saldo: Math.max(0, Number(item.saldo || 0) - totalDeduction) };
            }

            // Tambah akun tujuan
            if ((toStr.includes('petty') && String(item.kode) === '1001') ||
                (toStr.includes('bca') && String(item.kode) === '1002') ||
                (toAccObj.source === 'coa' && item.id === toAccObj.originalId)) {
              return { ...item, saldo: Number(item.saldo || 0) + numTransfer };
            }

            return item;
          });
          localStorage.setItem('finance_coa_data', JSON.stringify(coaList));
        }
      } catch (e) {}

      // 4. Catat riwayat transfer
      const newRef = `TRF-2026-00${history.length + 44}`;
      const cleanDari = fromAccObj?.rawName || fromAccObj?.name.split(' (')[0] || 'Rekening Asal';
      const cleanKe = toAccObj?.rawName || toAccObj?.name.split(' (')[0] || 'Rekening Tujuan';

      const newRecord = {
        id: newRef,
        tanggal: transferDate,
        dari: cleanDari,
        ke: cleanKe,
        nominal: numTransfer,
        biayaAdmin: numFee,
        status: 'Selesai',
        catatan: notes || 'Transfer pemindahan dana internal',
      };

      setHistory([newRecord, ...history]);

      // 5. Bukukan otomatis ke Jurnal Keuangan (finance_custom_journals)
      try {
        const jrnRaw = localStorage.getItem('finance_custom_journals');
        const jrnList = jrnRaw ? JSON.parse(jrnRaw) : [];
        jrnList.unshift({
          id: `jrn-${newRef}`,
          tanggal: transferDate,
          rawDate: transferDate,
          deskripsi: `Pemindahan Dana Internal: ${cleanDari} ke ${cleanKe} - ${notes || 'Dropping Saldo'}`,
          referensi: newRef,
          debitAccount: cleanKe.toLowerCase().includes('petty') ? '1001 - Petty Cash' : cleanKe,
          creditAccount: cleanDari.toLowerCase().includes('bca') ? '1002 - Bank BCA Operasional' : cleanDari,
          totalDebit: numTransfer,
          totalKredit: numTransfer,
          status: 'Posted',
          tipe: 'Transfer Bank'
        });
        localStorage.setItem('finance_custom_journals', JSON.stringify(jrnList));
      } catch (e) {}

      setIsSubmitting(false);
      setSuccessNotice(`Transfer sebesar ${formatRupiah(numTransfer)} dari ${cleanDari} ke ${cleanKe} berhasil dibukukan dan seluruh saldo kas & bank diperbarui!`);
      setNominal('');
      setNotes('');

      setTimeout(() => setSuccessNotice(null), 5000);
    }, 500);
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
                  disabled={isSubmitting}
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
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-500" />
                Saldo Rekening Kas & Bank Terdaftar
              </h4>
              <div className="space-y-2.5">
                {accounts.map((acc) => (
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
                Setiap transaksi pemindahan saldo langsung memotong saldo rekening asal, menambahkan ke rekening tujuan, serta mendebit/mengkredit Chart of Accounts (COA) dan Jurnal Keuangan secara instan.
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
              Tercatat permanen dalam sistem treasury LPK
            </span>
          </div>
          <FinanceTable
            columns={tableColumns}
            data={filteredHistory}
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
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Riwayat Transfer?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan transfer <strong className="text-slate-800">{deletingItem.id}</strong> ({formatRupiah(deletingItem.nominal)})?
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
                  onClick={() => {
                    setHistory(history.filter((h) => h.id !== deletingItem.id));
                    setDeletingItem(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition shadow-sm"
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
