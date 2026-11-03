import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { FinancePageHeader, FinanceKpiCard } from './FinancePageComponents';
import { accountingGet, accountingError, financeMoney } from '../../utils/accountingApi';
import { CheckCircle2, AlertCircle, FileCheck, RefreshCw, Landmark, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Keep comparison exact to the two decimal places supported by accounting.
function cents(value) {
  const text = String(value ?? '').trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) throw new Error('Nominal harus berupa angka dengan maksimal dua desimal.');
  const amount = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(amount)) throw new Error('Nominal di luar rentang yang didukung.');
  return amount;
}

export default function ReconciliationPage() {
  const [from, setFrom] = useState(() => `${today().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const [accountId, setAccountId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [statement, setStatement] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [matchedRows, setMatchedRows] = useState(new Set());
  const [reconciliationHistory, setReconciliationHistory] = useState([]);

  const validDates = Boolean(from && to && from <= to);
  const requestKey = `${from}:${to}:${refresh}`;

  // Fetch lookups and reports
  useEffect(() => {
    if (!validDates) return;
    const controller = new AbortController();
    Promise.all([
      accountingGet('lookups', {}, controller.signal),
      accountingGet('reports', { from, to }, controller.signal),
      axios.get('/api/accounting.php?view=reconciliations').catch(() => ({ data: { data: [] } })),
    ]).then(([master, response, recRes]) => {
      if (master.csrf_token) setCsrfToken(master.csrf_token);
      const report = response.data;
      if (!Array.isArray(master.data.accounts) || !Array.isArray(report.cash_history)
        || !Array.isArray(report.trial_balance?.rows) || !Array.isArray(report.period_movements?.rows)
        || report.from !== from || report.to !== to) throw new Error('Struktur laporan akuntansi tidak valid.');
      for (const row of report.trial_balance.rows) cents(row.balance);
      for (const row of report.period_movements.rows) { cents(row.debit); cents(row.credit); }
      for (const row of report.cash_history) { cents(row.debit); cents(row.credit); cents(row.running_balance); }
      if (!controller.signal.aborted) {
        setResult({ key: requestKey, accounts: master.data.accounts.filter(a => a.report_class === 'cash'), report });
        const serverRecs = recRes.data?.data || [];
        setReconciliationHistory(Array.isArray(serverRecs) ? serverRecs : []);
      }
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key: requestKey, error: accountingError(error) });
    });
    return () => controller.abort();
  }, [from, to, validDates, requestKey]);

  const current = validDates && result?.key === requestKey ? result : null;
  const report = current?.report;
  const accounts = current?.accounts || [];
  const account = accounts.find(a => String(a.id) === accountId);
  const ready = Boolean(report && account);
  const balanceRow = ready && report.trial_balance.rows.find(row => String(row.id) === accountId);
  const movement = ready && report.period_movements.rows.find(row => String(row.id) === accountId);
  const closing = ready ? (balanceRow ? cents(balanceRow.balance) : 0) : null;
  const incoming = ready ? (movement ? cents(movement.debit) : 0) : null;
  const outgoing = ready ? (movement ? cents(movement.credit) : 0) : null;
  const opening = ready ? closing - incoming + outgoing : null;
  const rows = ready ? report.cash_history.filter(row => String(row.account_id) === accountId) : [];

  let statementCents = null;
  let statementError = '';
  if (statement.trim()) {
    try { statementCents = cents(statement); } catch (error) { statementError = error.message; }
  }
  const comparable = ready && statementCents !== null && reference.trim() && !statementError;
  const diffCents = comparable ? (statementCents - closing) : null;
  const isBalanced = diffCents === 0;

  const money = value => financeMoney(value === null ? null : value / 100);
  const resetStatement = () => { setStatement(''); setReference(''); setNotes(''); setMatchedRows(new Set()); };
  const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  const toggleMatch = (id) => {
    setMatchedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMatchAll = () => {
    if (matchedRows.size === rows.length) {
      setMatchedRows(new Set());
    } else {
      setMatchedRows(new Set(rows.map(r => r.id)));
    }
  };

  // Simpan rekonsiliasi ke backend dan update riwayat
  const handleSaveReconciliation = async () => {
    if (!ready || !comparable) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Data',
        text: 'Silakan pilih akun kas/bank, masukkan nomor referensi statement, dan saldo akhir rekening koran.'
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        action: 'save_reconciliation',
        account_id: Number(accountId),
        period_from: from,
        period_to: to,
        statement_balance: statementCents / 100,
        book_balance: closing / 100,
        statement_reference: reference.trim(),
        notes: notes.trim() || `Rekonsiliasi ${account.name} per ${to}`
      };

      const res = await axios.post('/api/accounting.php', payload, {
        headers: { 'X-CSRF-Token': csrfToken || '' }
      });

      if (res.data?.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Rekonsiliasi Berhasil Disahkan!',
          text: `Akun ${account.name} dinyatakan ${isBalanced ? 'Terekonsiliasi Sempurna (Selisih Rp 0)' : 'Terekonsiliasi dengan Catatan Selisih'}.`,
          confirmButtonColor: '#2563EB'
        });

        // Refresh riwayat
        const newEntry = {
          id: res.data.data?.id || Date.now(),
          account_id: Number(accountId),
          account_name: account.name,
          account_code: account.code,
          period_from: from,
          period_to: to,
          statement_balance: statementCents / 100,
          book_balance: closing / 100,
          difference: diffCents / 100,
          statement_reference: reference.trim(),
          notes: notes.trim(),
          status: isBalanced ? 'reconciled' : 'variance',
          reconciled_at: new Date().toISOString()
        };
        setReconciliationHistory(prev => [newEntry, ...prev]);
        setRefresh(r => r + 1);
      } else {
        throw new Error(res.data?.message || 'Gagal menyimpan rekonsiliasi');
      }
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: e.response?.data?.message || e.message || 'Terjadi kesalahan sistem saat menyimpan rekonsiliasi.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Cek apakah akun dan periode ini sudah pernah direkonsiliasi
  const latestRec = reconciliationHistory.find(r => String(r.account_id) === String(accountId));

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5">
        <FinancePageHeader 
          title="Rekonsiliasi Kas & Bank" 
          subtitle="Pencocokan mutasi kas buku besar dengan rekening koran bank eksternal." 
          secondaryLabel={null} 
        />

        {/* Status Banner */}
        <div className={`rounded-xl border p-4 text-sm flex items-start gap-3 ${
          latestRec && latestRec.status === 'reconciled' 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900' 
            : 'border-blue-200 bg-blue-50 text-blue-900'
        }`}>
          <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
          <div className="space-y-1">
            <p className="font-semibold">
              {latestRec 
                ? `Status Terakhir: ${latestRec.status === 'reconciled' ? 'Terekonsiliasi (Reconciled)' : 'Ada Catatan Selisih'} per ${latestRec.period_to}` 
                : 'Modul Rekonsiliasi Bank Aktif — Siap Digunakan'}
            </p>
            <p className="text-xs opacity-90">
              Pilih akun kas/bank, masukkan saldo rekening koran bank Anda, cocokkan mutasi, lalu klik &quot;Sahkan Rekonsiliasi&quot; untuk mencatat pengesahan secara permanen.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid gap-4 md:grid-cols-4 rounded-xl border bg-white p-4 shadow-sm">
          <label className="text-xs font-semibold text-slate-600">
            Dari tanggal
            <input className={inputClass} type="date" value={from} onChange={e => { setFrom(e.target.value); resetStatement(); }} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Sampai tanggal
            <input className={inputClass} type="date" value={to} onChange={e => { setTo(e.target.value); resetStatement(); }} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Akun buku besar kas/bank
            <select className={inputClass} value={accountId} onChange={e => { setAccountId(e.target.value); resetStatement(); }} disabled={!report}>
              <option value="">Pilih akun kas/bank</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </label>
          <button 
            type="button" 
            className="self-end rounded-lg bg-blue-600 hover:bg-blue-700 p-2.5 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2" 
            disabled={!validDates} 
            onClick={() => setRefresh(value => value + 1)}
          >
            <RefreshCw className="w-4 h-4" />
            Muat ulang laporan
          </button>
        </div>

        {!validDates && <p role="alert" className="text-red-700 text-sm font-medium">Isi tanggal yang valid; tanggal awal tidak boleh melewati tanggal akhir.</p>}
        {validDates && !current && <p role="status" className="text-slate-500 text-sm">Memuat laporan akuntansi dari server...</p>}
        {current?.error && <p role="alert" className="text-red-700 text-sm font-medium">Laporan gagal dimuat: {current.error}.</p>}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <FinanceKpiCard title="Saldo buku awal" value={money(opening)} subtitle={`Saldo s/d ${from}`} />
          <FinanceKpiCard title="Total debit (masuk)" value={money(incoming)} subtitle="Penerimaan periode ini" />
          <FinanceKpiCard title="Total kredit (keluar)" value={money(outgoing)} subtitle="Pengeluaran periode ini" />
          <FinanceKpiCard title="Saldo buku akhir" value={money(closing)} subtitle={`Saldo buku per ${to}`} />
        </div>

        {/* Input Statement Bank & Rekonsiliasi */}
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                Data Rekening Koran / Statement Bank
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan saldo akhir dan nomor referensi rekening koran per {to || 'tanggal akhir'} untuk dicocokkan dengan saldo buku.
              </p>
            </div>
            {comparable && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isBalanced 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {isBalanced ? 'Saldo Cocok (Balance Match)' : 'Terdapat Selisih'}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Referensi statement / No. Dokumen
              <input 
                className={inputClass} 
                value={reference} 
                disabled={!ready} 
                onChange={e => setReference(e.target.value)} 
                placeholder="Contoh: STMT-BCA-202611 / Rek. Koran Okt" 
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Saldo akhir statement bank (IDR)
              <input 
                className={inputClass} 
                type="text" 
                inputMode="decimal" 
                value={statement} 
                disabled={!ready} 
                onChange={e => setStatement(e.target.value)} 
                placeholder="Contoh: 200000 (tanpa pemisah ribuan)" 
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Catatan Rekonsiliasi
              <input 
                className={inputClass} 
                value={notes} 
                disabled={!ready} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Catatan hasil verifikasi atau mutasi pending" 
              />
            </label>
          </div>

          {statementError && <p role="alert" className="text-red-700 text-xs">{statementError}</p>}

          {/* Variance Box & Submit */}
          <div className="p-4 rounded-xl bg-slate-50 border flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">Perhitungan Selisih (Statement − Saldo Buku):</p>
              <p className={`text-xl font-bold mt-0.5 ${
                !comparable ? 'text-slate-400' : isBalanced ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {comparable ? money(diffCents) : 'Belum tersedia (isi akun, referensi & saldo)'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {comparable 
                  ? (isBalanced ? 'Saldo buku dan statement bank telah cocok sempurna.' : 'Ada perbedaan antara saldo buku dan statement bank.')
                  : 'Silakan pilih akun kas/bank di atas untuk memulai perbandingan.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveReconciliation}
              disabled={!comparable || saving}
              className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Sahkan & Simpan Rekonsiliasi'}
            </button>
          </div>
        </section>

        {/* Mutation Matching Table */}
        {ready && (
          <section className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">
                  Daftar Mutasi Kas Buku Besar — {account.code} {account.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rows.length} baris jurnal ({matchedRows.size} dicocokkan)
                </p>
              </div>
              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={toggleMatchAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  {matchedRows.size === rows.length ? 'Batal Pilih Semua' : 'Tandai Semua Cocok'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs">
                    <th className="p-2.5 border-b text-center w-12">Cocok</th>
                    <th className="p-2.5 border-b">Tanggal</th>
                    <th className="p-2.5 border-b">No. Jurnal</th>
                    <th className="p-2.5 border-b">Sumber / Referensi</th>
                    <th className="p-2.5 border-b">Deskripsi</th>
                    <th className="p-2.5 border-b text-right">Debit (Masuk)</th>
                    <th className="p-2.5 border-b text-right">Kredit (Keluar)</th>
                    <th className="p-2.5 border-b text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(row => (
                    <tr 
                      key={row.id} 
                      className={matchedRows.has(row.id) ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-slate-50'}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={matchedRows.has(row.id)}
                          onChange={() => toggleMatch(row.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2.5 text-xs text-slate-600">{row.entry_date}</td>
                      <td className="p-2.5 text-xs font-mono font-medium text-slate-700">{row.number}</td>
                      <td className="p-2.5 text-xs text-slate-500">{row.source_type} / {row.source_id}</td>
                      <td className="p-2.5 text-xs text-slate-700">{row.description || '—'}</td>
                      <td className="p-2.5 text-xs text-right font-medium text-emerald-600">{money(cents(row.debit))}</td>
                      <td className="p-2.5 text-xs text-right font-medium text-rose-600">{money(cents(row.credit))}</td>
                      <td className="p-2.5 text-xs text-right font-bold text-slate-800">{money(cents(row.running_balance))}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada mutasi transaksi pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* History of Reconciliations */}
        {reconciliationHistory.length > 0 && (
          <section className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-800 text-sm">Riwayat Pengesahan Rekonsiliasi Tersimpan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs">
                    <th className="p-2.5 border-b">Tanggal Pengesahan</th>
                    <th className="p-2.5 border-b">Akun Kas/Bank</th>
                    <th className="p-2.5 border-b">Periode</th>
                    <th className="p-2.5 border-b">No. Referensi</th>
                    <th className="p-2.5 border-b text-right">Saldo Statement</th>
                    <th className="p-2.5 border-b text-right">Saldo Buku</th>
                    <th className="p-2.5 border-b text-right">Selisih</th>
                    <th className="p-2.5 border-b text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliationHistory.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 text-xs">
                      <td className="p-2.5 text-slate-600">
                        {rec.reconciled_at ? String(rec.reconciled_at).slice(0, 16).replace('T', ' ') : '-'}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">
                        {rec.account_code ? `${rec.account_code} — ` : ''}{rec.account_name || `Akun #${rec.account_id}`}
                      </td>
                      <td className="p-2.5 text-slate-600">{rec.period_from} s/d {rec.period_to}</td>
                      <td className="p-2.5 font-mono text-slate-700">{rec.statement_reference}</td>
                      <td className="p-2.5 text-right font-medium">{money(Number(rec.statement_balance) * 100)}</td>
                      <td className="p-2.5 text-right font-medium">{money(Number(rec.book_balance) * 100)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-800">{money(Number(rec.difference) * 100)}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          rec.status === 'reconciled' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rec.status === 'reconciled' ? 'Terekonsiliasi' : 'Selisih'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
