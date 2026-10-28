import React, { useState, useEffect } from 'react';
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
  Clock,
  Send,
  HelpCircle,
  FileText,
  AlertCircle,
  Trash2,
} from 'lucide-react';

const INITIAL_TRANSFER_HISTORY = [
  {
    id: 'TRF-2026-0042',
    tanggal: '2026-06-25',
    dari: 'Bank BCA Operasional',
    ke: 'Bank Mandiri Utama',
    nominal: 25000000,
    biayaAdmin: 2500,
    status: 'Selesai',
    catatan: 'Pengalihan likuiditas vendor mid-year',
  },
  {
    id: 'TRF-2026-0039',
    tanggal: '2026-06-20',
    dari: 'Bank BCA Operasional',
    ke: 'Kas Tunai Kasir',
    nominal: 10000000,
    biayaAdmin: 0,
    status: 'Selesai',
    catatan: 'Petty cash kantor cabang Jakarta',
  },
  {
    id: 'TRF-2026-0035',
    tanggal: '2026-06-15',
    dari: 'Bank Mandiri Utama',
    ke: 'Bank BNI Tabungan',
    nominal: 15000000,
    biayaAdmin: 6500,
    status: 'Selesai',
    catatan: 'Alokasi cadangan dana darurat',
  },
];

function loadTransferAccounts() {
  let list = [];

  // 1. Ambil akun Kas & Bank dari COA (Chart of Accounts)
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
            balance: Number(item.saldo || 0),
            source: 'coa',
            originalId: item.id,
          });
        });
      }
    }
  } catch (e) {}

  // 2. Ambil akun dari Rekening Perusahaan
  try {
    const rekRaw = localStorage.getItem('finance_rekening_data');
    if (rekRaw) {
      const rekList = JSON.parse(rekRaw);
      if (Array.isArray(rekList)) {
        rekList.forEach((item) => {
          const exists = list.some(
            (l) =>
              l.name.toLowerCase().includes(item.nama.toLowerCase()) ||
              item.nama.toLowerCase().includes(l.name.toLowerCase())
          );
          if (!exists) {
            list.push({
              id: `rek_${item.id}`,
              name: `${item.nama}${item.noRek && item.noRek !== '—' ? ` (${item.noRek})` : item.bank ? ` (${item.bank})` : ''}`,
              balance: Number(item.saldo || 0),
              source: 'rekening',
              originalId: item.id,
            });
          }
        });
      }
    }
  } catch (e) {}

  // 3. Fallback jika data belum ada
  if (list.length === 0) {
    list = [
      { id: '1', name: 'Bank BCA Operasional (002-998811)', balance: 145200000, source: 'default' },
      { id: '2', name: 'Bank Mandiri Utama (130-0019283)', balance: 78500000, source: 'default' },
      { id: '3', name: 'Bank BNI Tabungan (088-771122)', balance: 35000000, source: 'default' },
      { id: '4', name: 'Kas Tunai Kasir (000-001)', balance: 12500000, source: 'default' },
    ];
  } else if (list.length === 1) {
    list.push({
      id: 'default_petty_cash',
      name: 'Kas Tunai / Petty Cash Kantor (000-001)',
      balance: 5000000,
      source: 'default',
    });
  }

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
      // 1. Potong saldo asal & tambah saldo tujuan
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

      // 2. Sinkronkan saldo baru ke COA (finance_coa_data)
      try {
        const coaRaw = localStorage.getItem('finance_coa_data');
        if (coaRaw) {
          let coaList = JSON.parse(coaRaw);
          coaList = coaList.map((item) => {
            if (fromAccObj.source === 'coa' && item.id === fromAccObj.originalId) {
              return { ...item, saldo: Math.max(0, Number(item.saldo || 0) - totalDeduction) };
            }
            if (toAccObj.source === 'coa' && item.id === toAccObj.originalId) {
              return { ...item, saldo: Number(item.saldo || 0) + numTransfer };
            }
            return item;
          });
          localStorage.setItem('finance_coa_data', JSON.stringify(coaList));
        }
      } catch (e) {}

      // 3. Sinkronkan saldo baru ke Rekening (finance_rekening_data)
      try {
        const rekRaw = localStorage.getItem('finance_rekening_data');
        if (rekRaw) {
          let rekList = JSON.parse(rekRaw);
          rekList = rekList.map((item) => {
            if (fromAccObj.source === 'rekening' && item.id === fromAccObj.originalId) {
              return { ...item, saldo: Math.max(0, Number(item.saldo || 0) - totalDeduction) };
            }
            if (toAccObj.source === 'rekening' && item.id === toAccObj.originalId) {
              return { ...item, saldo: Number(item.saldo || 0) + numTransfer };
            }
            return item;
          });
          localStorage.setItem('finance_rekening_data', JSON.stringify(rekList));
        }
      } catch (e) {}

      // 4. Catat riwayat transfer
      const newRecord = {
        id: `TRF-2026-00${history.length + 43}`,
        tanggal: transferDate,
        dari: fromAccObj?.name.split(' (')[0] || 'Rekening Asal',
        ke: toAccObj?.name.split(' (')[0] || 'Rekening Tujuan',
        nominal: numTransfer,
        biayaAdmin: numFee,
        status: 'Selesai',
        catatan: notes || 'Transfer antar rekening',
      };

      setHistory([newRecord, ...history]);
      setIsSubmitting(false);
      setSuccessNotice(`Transfer sebesar ${formatRupiah(numTransfer)} berhasil dibukukan dan saldo diperbarui!`);
      setNominal('');
      setNotes('');

      setTimeout(() => setSuccessNotice(null), 5000);
    }, 500);
  };

  const handleExport = () => {
    const exportData = history.map((h, idx) => ({
      No: idx + 1,
      'No Referensi': h.id,
      Tanggal: h.tanggal,
      'Dari Rekening': h.dari,
      'Ke Rekening': h.ke,
      Nominal: h.nominal,
      'Biaya Admin': h.biayaAdmin,
      Status: h.status,
      Catatan: h.catatan,
    }));
    exportToExcel(exportData, 'Riwayat_Transfer_Dana');
  };

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
        <span className="text-xs font-medium text-slate-700">{row.tanggal}</span>
      ),
    },
    {
      key: 'dari_ke',
      header: 'Rekening Asal -> Tujuan',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{row.dari}</div>
          <div className="text-slate-400 flex items-center gap-1 text-[11px] mt-0.5">
            <ArrowRightLeft className="w-3 h-3 text-blue-500" /> Ke: {row.ke}
          </div>
        </div>
      ),
    },
    {
      key: 'nominal',
      header: 'Nominal',
      render: (row) => (
        <div>
          <div className="text-xs font-bold text-slate-900">
            {formatRupiah(row.nominal)}
          </div>
          {row.biayaAdmin > 0 && (
            <div className="text-[10px] text-slate-400">
              Admin: {formatRupiah(row.biayaAdmin)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'catatan',
      header: 'Catatan',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-[200px] block">
          {row.catatan}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <FinanceBadge
          status={row.status || 'Selesai'}
          label={row.status || 'Selesai'}
        />
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end">
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      {/* Header */}
      <FinancePageHeader
        title="Transfer Dana Antar Rekening"
        subtitle="Pemindahan saldo internal antar rekening bank dan kas tunai perusahaan"
        onExport={handleExport}
      />

      {successNotice && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Grid: Transfer Form (Mockup #15) + Quick Balance Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Formulir Pemindahan Dana
              </h3>
              <p className="text-xs text-slate-500">
                Pastikan saldo pada rekening asal mencukupi sebelum transfer
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dari Rekening */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Dari Rekening (Sumber)
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - Saldo: {formatRupiah(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ke Rekening */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Ke Rekening (Tujuan)
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - Saldo: {formatRupiah(acc.balance)}
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
                  placeholder="Contoh: 15000000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-900"
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
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Tujuan transfer dana..."
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
                    Memproses Transfer...
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

        {/* Info & Rekening Ringkasan (1 Col) */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              Saldo Rekening Terdaftar
            </h4>
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-colors"
                >
                  <div className="text-xs font-medium text-slate-700 truncate">
                    {acc.name}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {formatRupiah(acc.balance)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Informasi Rekonsiliasi Otomatis
            </div>
            <p className="leading-relaxed text-amber-700">
              Setiap pemindahan dana otomatis dicatat dalam Buku Transaksi dan Jurnal Akuntansi (Kredit di rekening asal, Debit di rekening tujuan).
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Transfer Dana Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">
          Riwayat Transfer Dana Internal
        </h3>
        <FinanceTable
          columns={tableColumns}
          data={history}
          totalItems={history.length}
          emptyMessage="Belum ada riwayat transfer"
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
  );
}
