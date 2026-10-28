import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import Layout from '../components/Layout';
import AccountingTransactionForm, { FinanceField as Field } from '../components/AccountingTransactionForm';
import AccountingTools, { FinanceTable } from '../components/AccountingTools';
import { ACCOUNTING_API, accountingGet, accountingMutate, accountingError, financeMoney as money, sourceLabels, reportLabels } from '../utils/accountingApi';
import './FinanceWorkspace.css';
const labels = {
  revenue: 'Pendapatan jasa',
  other_income: 'Pendapatan lain',
  cost_of_services: 'Biaya jasa',
  gross_profit: 'Laba kotor',
  operating_expense: 'Beban operasional',
  operating_profit: 'Laba operasi',
  other_expense: 'Beban lain/bunga',
  profit_before_tax: 'Laba sebelum pajak',
  income_tax: 'Pajak penghasilan',
  net_profit: 'Laba bersih',
  assets: 'Aset',
  liabilities: 'Kewajiban',
  equity: 'Ekuitas tercatat',
  unclosed_profit: 'Laba belum ditutup',
  total_equity: 'Total ekuitas',
  difference: 'Selisih persamaan neraca',
  cash_bank: 'Kas & bank',
  receivables: 'Piutang',
  payables: 'Utang',
  operating: 'Operasional',
  investing: 'Investasi',
  financing: 'Pendanaan',
  transfer: 'Transfer internal',
  noncash: 'Belum diklasifikasikan'
};
const statusLabels = {
  draft: 'Draft',
  submitted: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  unpaid: 'Belum dibayar',
  paid: 'Dibayar',
  verified: 'Terverifikasi',
  posted: 'Posted',
  unposted: 'Belum posted',
  reversed: 'Direversal',
  unknown: 'Perlu review'
};
const moneyCell = value => value == null ? '-' : money(value);
const journalColumns = [['journal_id', 'ID jurnal'], ['number', 'Nomor'], ['entry_date', 'Tanggal'], ['code', 'COA'], ['name', 'Akun'], ['debit', 'Debit', moneyCell], ['credit', 'Kredit', moneyCell], ['source_type', 'Sumber', v => sourceLabels[v] || v], ['source_id', 'ID sumber'], ['document_type', 'Dokumen'], ['document_id', 'ID dokumen']];
function DataFields({
  row,
  fields
}) {
  return <dl className="fw-detail-grid">{fields.map(([key, label, format]) => <div key={key}><dt>{label}</dt><dd>{format ? format(row[key]) : row[key] ?? 'Belum tersedia'}</dd></div>)}</dl>;
}
function RecordTree({
  value
}) {
  if (value == null) return <span>Belum tersedia</span>;
  if (typeof value !== 'object') return <span>{String(value)}</span>;
  if (Array.isArray(value)) return value.length ? <ol className="fw-history">{value.map((item, i) => <li key={i}><RecordTree value={item} /></li>)}</ol> : <span>Tidak ada catatan</span>;
  return <dl className="fw-detail-grid">{Object.entries(value).filter(([key]) => !['attachment_key', 'attachment_sha256', 'password', 'password_hash', 'csrf_token'].includes(key)).map(([key, v]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd><RecordTree value={v} /></dd></div>)}</dl>;
}
function Reports({
  reports,
  selected,
  setSelected,
  showJournal
}) {
  const rows = reports[selected];
  return <section className="fw-panel"><Field label="Laporan"><select value={selected} onChange={e => setSelected(e.target.value)}>{Object.entries(reportLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><h2 className="fw-section">{reportLabels[selected]}</h2>
    {['profit_loss', 'balance_sheet'].includes(selected) && <><div className="fw-report-grid">{Object.entries(rows).map(([key, value]) => <div className="fw-panel fw-kpi" key={key}><small>{labels[key] || key}</small><strong>{money(value)}</strong></div>)}</div><FinanceTable rows={selected === 'profit_loss' ? reports.period_movements.rows.filter(r => Number(r.account_group) >= 4) : reports.trial_balance.rows.filter(r => Number(r.account_group) <= 3)} columns={[["code", "COA"], ["name", "Akun"], ["debit", "Debit", moneyCell], ["credit", "Kredit", moneyCell], ["balance", "Saldo", moneyCell]]} /></>}
    {selected === 'cash_flow' && <><p className="fw-notice">Transfer internal ditampilkan terpisah. Nilainya tidak menambah penerimaan dan pengeluaran pada arus kas konsolidasi.</p><FinanceTable rows={rows.filter(r => r.cash_flow_class !== 'transfer')} columns={[["cash_flow_class", "Aktivitas", v => labels[v] || v], ["incoming", "Penerimaan", moneyCell], ["outgoing", "Pengeluaran", moneyCell], ["net", "Arus bersih", moneyCell]]} />{rows.some(r => r.cash_flow_class === 'transfer') && <FinanceTable rows={rows.filter(r => r.cash_flow_class === 'transfer')} columns={[["cash_flow_class", "Transfer internal"], ["net", "Arus bersih", moneyCell]]} />}</>}
    {selected === 'equity_changes' && <><DataFields row={rows} fields={[["opening_equity", "Ekuitas awal", money], ["period_profit", "Laba periode", money], ["closing_equity", "Ekuitas akhir", money]]} /><FinanceTable rows={rows.accounts} columns={[["code", "COA"], ["name", "Akun"], ["change_amount", "Perubahan modal / ekuitas", moneyCell]]} /></>}
    {selected === 'trial_balance' && <><p className="fw-notice">Debit {money(rows.debit)} / Kredit {money(rows.credit)} - {rows.balanced ? 'Seimbang' : 'Perlu pemeriksaan'}</p><FinanceTable rows={rows.rows} columns={[["code", "COA"], ["name", "Akun"], ["closing_debit", "Saldo debit", moneyCell], ["closing_credit", "Saldo kredit", moneyCell]]} /></>}
    {selected === 'cash_history' && <FinanceTable rows={rows} columns={[...journalColumns.slice(0, 7), ['running_balance', 'Saldo rekening', moneyCell]]} onRow={row => showJournal(row.journal_id)} />}
    {selected === 'general_ledger' && <FinanceTable rows={rows} columns={journalColumns} onRow={row => showJournal(row.journal_id)} />}
    {selected === 'aging' && <FinanceTable rows={rows} columns={[["document_type", "Sumber", v => sourceLabels[v] || v], ["document_id", "ID sumber"], ["report_class", "Piutang / Utang"], ["due_date", "Jatuh tempo"], ["days_overdue", "Hari terlambat"], ["bucket", "Bucket"], ["outstanding", "Outstanding", moneyCell]]} />}
    {selected === 'budget_vs_actual' && <><p className="fw-notice">Realisasi tercatat adalah otorisasi pemakaian anggaran. Beban akuntansi mengikuti jurnal posted; komitmen tidak membentuk beban.</p><FinanceTable rows={rows} columns={[["id", "ID RAB"], ["title", "RAB"], ["period", "Periode"], ["status", "Status"], ["requested", "Diajukan", moneyCell], ["approved_amount", "Disetujui", moneyCell], ["committed_amount", "Komitmen", moneyCell], ["realized_amount", "Realisasi tercatat", moneyCell], ["remaining_amount", "Sisa tersedia", moneyCell]]} /></>}
    {selected === 'fund_sources' && <><p className="fw-notice">Aliran dana berdasarkan jurnal dan dimensi transaksi. Kas umum tidak dianggap berasal dari penerimaan tertentu tanpa rekening atau pencatatan dana yang terpisah.</p><FinanceTable rows={rows} columns={[["classification", "Jenis"], ["department_id", "Departemen"], ["batch", "Batch"], ["student_id", "Siswa"], ["vendor_id", "Vendor"], ["amount", "Aliran bersih kas", moneyCell], ["transactions", "Jurnal"]]} /></>}
  </section>;
}
export default function FinanceWorkspace({
  initialTab = 'ledger',
  initialType = '',
  title = 'Buku Transaksi & Audit Keuangan'
}) {
  const [tab, setTab] = useState(initialTab),
    [filters, setFilters] = useState(() => ({
      type: initialType
    })),
    [version, setVersion] = useState(0);
  const [lookups, setLookups] = useState(null),
    [session, setSession] = useState(null),
    [ledger, setLedger] = useState(null),
    [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [form, setForm] = useState(null),
    [detail, setDetail] = useState(null),
    [journal, setJournal] = useState(null),
    [decision, setDecision] = useState(null),
    [selected, setSelected] = useState('profit_loss');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([accountingGet('lookups', {}, controller.signal), accountingGet('ledger', filters, controller.signal), accountingGet('reports', filters, controller.signal)]).then(([l, t, r]) => {
      setLookups(l.data);
      setSession(l);
      setLedger(t.data);
      setReports(r.data);
    }).catch(e => {
      if (e.code !== 'ERR_CANCELED') {
        setError(accountingError(e));
        setLedger(null);
        setReports(null);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [filters, version]);
  const permissions = session?.permissions || {};
  const filter = (key, value) => setFilters(previous => ({
    ...previous,
    [key]: value,
    page: 1
  }));
  const mutate = async (payload, file) => {
    if (busy) return false;
    setBusy(true);
    setActionError('');
    setNotice('');
    try {
      const result = await accountingMutate(payload, session.csrf_token, file);
      setNotice('Data berhasil tersimpan.');
      setVersion(v => v + 1);
      return result;
    } catch (e) {
      setActionError(accountingError(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const showDetail = async row => {
    setActionError('');
    try {
      setDetail((await accountingGet('detail', {
        id: row.ledger_id
      })).data);
    } catch (e) {
      setActionError(accountingError(e));
    }
  };
  const showJournal = async id => {
    try {
      setJournal((await accountingGet('journal', {
        id
      })).data);
    } catch (e) {
      setActionError(accountingError(e));
    }
  };
  const exportExcel = async () => {
    setBusy(true);
    setActionError('');
    try {
      const {
        data
      } = await accountingGet('export_data', filters);
      const rows = data.rows.map(r => Object.fromEntries(Object.entries(r).filter(([k]) => !['attachment_key'].includes(k)).map(([k, v]) => [k, ['amount', 'incoming_amount', 'outgoing_amount'].includes(k) && v != null ? Number(v) : v])));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Buku Transaksi');
      XLSX.writeFile(workbook, 'Buku_Transaksi.xlsx');
    } catch (e) {
      setActionError(accountingError(e));
    } finally {
      setBusy(false);
    }
  };
  const exportReport = () => {
    let rows = reports[selected];
    if (selected === 'trial_balance') rows = rows.rows;else if (selected === 'cash_flow') rows = rows.filter(r => r.cash_flow_class !== 'transfer');else if (selected === 'equity_changes') rows = [...rows.accounts, {
      name: 'Laba periode',
      change_amount: rows.period_profit
    }, {
      name: 'Ekuitas awal',
      change_amount: rows.opening_equity
    }, {
      name: 'Ekuitas akhir',
      change_amount: rows.closing_equity
    }];else if (!Array.isArray(rows)) rows = Object.entries(rows).map(([metric, amount]) => ({
      metric: labels[metric] || metric,
      amount
    }));
    const numeric = new Set(['amount', 'debit', 'credit', 'balance', 'closing_debit', 'closing_credit', 'incoming', 'outgoing', 'net', 'outstanding', 'change_amount', 'approved_amount', 'requested', 'committed_amount', 'realized_amount', 'remaining_amount', 'running_balance']);
    const sheet = XLSX.utils.json_to_sheet(rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, numeric.has(key) && value != null ? Number(value) : value]))));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Laporan');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
      from: reports.from,
      to: reports.to,
      ...reports.coverage
    }]), 'Cakupan');
    XLSX.writeFile(workbook, `${selected}.xlsx`);
  };
  const transaction = detail?.transaction;
  const actions = transaction && !detail.legacy && !detail.journal_only ? [...(permissions.prepare && Number(transaction.created_by) === session.actor_id && transaction.approval_status === 'draft' ? ['submit', 'cancel'] : []), ...(permissions.prepare && Number(transaction.created_by) === session.actor_id && ['cancelled', 'rejected'].includes(transaction.approval_status) && transaction.payment_status === 'unpaid' ? ['reopen'] : []), ...(permissions.approve && transaction.approval_status === 'submitted' && Number(transaction.created_by) !== session.actor_id ? ['approve', 'reject', 'return_revision'] : []), ...(permissions.approve && transaction.approval_status === 'approved' && transaction.payment_status === 'unpaid' && Number(transaction.created_by) !== session.actor_id ? ['return_revision'] : []), ...(permissions.prepare && transaction.approval_status === 'approved' && transaction.payment_status === 'unpaid' ? ['pay'] : []), ...(permissions.post && transaction.payment_status === 'paid' ? ['verify'] : []), ...(permissions.post && transaction.payment_status === 'verified' && transaction.journal_status === 'unposted' ? ['post'] : []), ...(permissions.post && transaction.journal_status === 'posted' ? ['reverse'] : [])] : [];
  const actionNames = {
    submit: 'Ajukan',
    cancel: 'Batalkan',
    reopen: 'Koreksi Draft',
    return_revision: 'Kembalikan untuk Revisi',
    approve: 'Setujui',
    reject: 'Tolak',
    pay: 'Catat Pembayaran',
    verify: 'Verifikasi Bukti',
    post: 'Posting Jurnal',
    reverse: 'Reversal'
  };
  const selects = [['source', 'Sumber', Object.entries(sourceLabels)], ['type', 'Jenis', [['income', 'Penerimaan'], ['expense', 'Pengeluaran'], ['transfer', 'Transfer'], ['journal', 'Jurnal nonkas']]], ['classification', 'Substansi', Object.entries(lookups?.classifications || {}).map(([key, v]) => [key, v.label])], ['account_id', 'COA', (lookups?.accounts || []).map(a => [a.id, `${a.code} ${a.name}`])], ['department_id', 'Departemen', (lookups?.departments || []).map(d => [d.id, d.name])], ['student_id', 'Siswa', (lookups?.students || []).map(s => [s.id, s.name])], ['vendor_id', 'Vendor', (lookups?.vendors || []).map(v => [v.id, v.name])], ['payment_account_id', 'Rekening', (lookups?.banks || []).map(b => [b.id, b.name])], ...['approval_status', 'payment_status', 'journal_status'].map((key, i) => [key, ['Approval', 'Pembayaran', 'Jurnal'][i], (i === 0 ? ['draft', 'submitted', 'approved', 'rejected', 'cancelled', 'unknown'] : i === 1 ? ['unpaid', 'paid', 'verified', 'reversed', 'unknown', 'not_applicable'] : ['unposted', 'posted', 'reversed']).map(s => [s, statusLabels[s]])])];
  return <Layout><main className="finance-workspace"><div className="fw-heading"><div><small>KEUANGAN CREATIVA</small><h1>{title}</h1><p>Dokumen sumber, persetujuan, pembayaran, dan jurnal yang dapat ditelusuri.</p></div><div className="fw-actions"><button className="fw-button" disabled={loading} onClick={() => setVersion(v => v + 1)}>Perbarui</button>{permissions.prepare && <button className="fw-button fw-primary" disabled={busy || !!error} onClick={() => {
            setActionError('');
            setForm({});
          }}>Tambah Transaksi</button>}</div></div><nav className="fw-tabs">{[['ledger', 'Buku Transaksi'], ['reports', 'Laporan Keuangan'], ['tools', 'Master & Pengakuan']].map(([key, label]) => <button key={key} className={`fw-button ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>)}</nav>
  {error && <div className="fw-notice fw-error" role="alert">{error}</div>}{actionError && <div className="fw-notice fw-error" role="alert">{actionError}</div>}{notice && <div className="fw-notice fw-success" role="status">{notice}</div>}
  <section className="fw-panel"><details open={tab !== 'tools'}><summary>Filter {tab === 'reports' ? 'laporan posted' : 'buku transaksi'}</summary><div className="fw-grid"><Field label="Dari tanggal"><input type="date" value={filters.from || ''} onChange={e => filter('from', e.target.value)} /></Field><Field label="Sampai tanggal"><input type="date" value={filters.to || ''} onChange={e => filter('to', e.target.value)} /></Field>{tab === 'ledger' && <><Field label="Bulan"><select value={filters.month || ''} onChange={e => filter('month', e.target.value)}><option value="">Semua</option>{Array.from({
                    length: 12
                  }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></Field><Field label="Tahun"><input inputMode="numeric" value={filters.year || ''} onChange={e => filter('year', e.target.value)} /></Field></>}{selects.filter(([key]) => tab === 'ledger' || ['account_id', 'department_id', 'student_id', 'vendor_id'].includes(key)).map(([key, label, options]) => <Field key={key} label={label}><select value={filters[key] || ''} onChange={e => filter(key, e.target.value)}><option value="">Semua</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field>)}<Field label="Batch"><input value={filters.batch || ''} onChange={e => filter('batch', e.target.value)} /></Field>{tab === 'ledger' && <><Field label="ID pembuat"><input inputMode="numeric" value={filters.created_by || ''} onChange={e => filter('created_by', e.target.value)} /></Field><Field label="Nomor / pihak / deskripsi"><input value={filters.search || ''} onChange={e => filter('search', e.target.value)} /></Field></>}</div><div className="fw-section"><button className="fw-button" onClick={() => setFilters({
              type: initialType
            })}>Reset Filter</button></div></details></section>
  {loading ? <section className="fw-panel">Memuat data tersimpan...</section> : !error && lookups && <>{tab === 'ledger' && ledger && <section className="fw-panel"><div className="fw-heading"><h2>{ledger.total} transaksi sesuai filter</h2><div className="fw-actions"><a className="fw-button" href={`${ACCOUNTING_API}?${new URLSearchParams({
                ...filters,
                view: 'export'
              })}`}>CSV</a><button className="fw-button" disabled={busy} onClick={exportExcel}>Excel</button></div></div><FinanceTable rows={ledger.rows} columns={[["number", "Nomor"], ["transaction_date", "Tanggal"], ["type", "Jenis"], ["source_type", "Sumber", v => sourceLabels[v] || v], ["source_number", "Dokumen"], ["category", "Kategori"], ["account_code", "COA"], ["department_name", "Departemen"], ["batch", "Batch"], ["party_name", "Pihak"], ["description", "Deskripsi"], ["incoming_amount", "Masuk", moneyCell], ["outgoing_amount", "Keluar", moneyCell], ["cash_account_name", "Rekening"], ["approval_status", "Approval", v => statusLabels[v] || v], ["payment_status", "Pembayaran", v => statusLabels[v] || v], ["journal_status", "Jurnal", v => statusLabels[v] || v], ["created_by_name", "Pembuat"], ["approved_by_name", "Penyetuju"], ["needs_review", "Review", v => Number(v) ? 'Perlu review' : 'Terkait dokumen']]} onRow={showDetail} /><div className="fw-actions fw-section"><button className="fw-button" disabled={ledger.page === 1} onClick={() => setFilters({
              ...filters,
              page: ledger.page - 1
            })}>Sebelumnya</button><span>Halaman {ledger.page}</span><button className="fw-button" disabled={ledger.page * ledger.page_size >= ledger.total} onClick={() => setFilters({
              ...filters,
              page: ledger.page + 1
            })}>Berikutnya</button></div></section>}
  {tab === 'reports' && reports && <><div className="fw-notice">{reports.coverage.notice} Jurnal posted: {reports.coverage.posted_journals}. Historis perlu review: {reports.coverage.legacy_needs_review}. Pembayaran belum posted: {reports.coverage.unposted_payments}. Dokumen belum diakui: {reports.coverage.unrecognized_documents}. {reports.coverage.posted_journals === 0 ? 'Belum ada jurnal posted; angka laporan belum mewakili kegiatan historis.' : ''}</div><button className="fw-button" onClick={exportReport}>Excel Laporan & Cakupan</button><Reports reports={reports} selected={selected} setSelected={setSelected} showJournal={showJournal} /></>}
  {tab === 'tools' && (permissions.prepare || permissions.configure || permissions.post || permissions.approve) && <AccountingTools lookups={lookups} permissions={permissions} busy={busy} onSave={mutate} />}</>}
  {form && lookups && <AccountingTransactionForm lookups={lookups} initial={form} busy={busy} error={actionError} onClose={() => setForm(null)} onSave={async (payload, file) => {
        const result = await mutate(payload, file);
        if (result) {
          setForm(null);
          await showDetail({
            ledger_id: `transaction:${result.id}`
          });
        }
      }} />}
  {detail && <div className="fw-modal-backdrop"><section className="fw-modal" role="dialog" aria-modal="true" aria-label="Rincian transaksi"><div className="fw-modal-heading"><h2>{transaction.number || `Transaksi historis #${transaction.id}`}</h2><button className="fw-button" disabled={busy} onClick={() => {
              setDetail(null);
              setDecision(null);
            }}>Tutup</button></div>{detail.notice && <div className="fw-notice">{detail.notice}</div>}{actionError && <div className="fw-notice fw-error">{actionError}</div>}<h3>Informasi Umum</h3><DataFields row={transaction} fields={[["transaction_date", "Tanggal"], ["source_type", "Sumber", v => sourceLabels[v] || v], ["id", "ID transaksi"], ["type", "Jenis"], ["category", "Kategori"], ["source_id", "ID sumber"], ["source_number", "Nomor sumber"], ["description", "Deskripsi"], ["party_name", "Pihak terkait"], ["created_by_name", "Pembuat"], ["created_at", "Dibuat"]]} /><h3 className="fw-section">Informasi Keuangan</h3><DataFields row={transaction} fields={[["amount", "Nominal IDR", money], ["currency", "Mata uang"], ["classification", "Substansi"], ["account_code", "COA"], ["account_name", "Akun"], ["cash_account_name", "Rekening sumber"], ["destination_cash_account_name", "Rekening tujuan"], ["payment_method", "Metode"], ["reference", "Referensi"], ["department_id", "ID departemen"], ["batch", "Batch"]]} /><h3 className="fw-section">Dokumen Pendukung</h3>{transaction.attachment_key && <a className="fw-button" target="_blank" rel="noreferrer" href={`${ACCOUNTING_API}?view=proof&id=${transaction.id}`}>Buka bukti tersimpan</a>}{transaction.attachment_link && <a className="fw-button" target="_blank" rel="noreferrer" href={transaction.attachment_link}>Link bukti</a>}<details><summary>Dokumen sumber & rincian</summary><RecordTree value={detail.source} /></details><h3 className="fw-section">Persetujuan & Pembayaran</h3><DataFields row={transaction} fields={[["approval_status", "Status approval"], ["approved_by_name", "Penyetuju"], ["approved_at", "Disetujui"], ["approval_note", "Catatan"], ["payment_status", "Pembayaran"], ["paid_at", "Dibayar"], ["verified_by", "ID verifikator"], ["verified_at", "Verifikasi"]]} /><h3 className="fw-section">Jurnal</h3>{detail.journal ? <><DataFields row={detail.journal} fields={[["id", "ID jurnal"], ["number", "Nomor"], ["entry_date", "Tanggal"], ["month", "Periode"], ["status", "Status"], ["reversal_of", "Reversal dari"]]} /><FinanceTable rows={detail.journal.lines} columns={[["code", "COA"], ["name", "Akun"], ["debit", "Debit", moneyCell], ["credit", "Kredit", moneyCell]]} /><RecordTree value={detail.journal.reversals} /></> : <p>Belum ada jurnal.</p>}<h3 className="fw-section">Riwayat Audit</h3><RecordTree value={detail.history} />{detail.allocations?.length > 0 && <><h3 className="fw-section">Alokasi pembayaran</h3><RecordTree value={detail.allocations} /></>}<div className="fw-actions fw-section">{!detail.legacy && !detail.journal_only && permissions.prepare && Number(transaction.created_by) === session.actor_id && transaction.approval_status === 'draft' && <button className="fw-button" disabled={busy} onClick={() => {
              setDetail(null);
              setForm({
                ...transaction,
                action: "update",
                request_key: crypto.randomUUID()
              });
            }}>Edit Draft</button>}{actions.map(action => <button key={action} className="fw-button fw-primary" disabled={busy} onClick={() => setDecision({
              action,
              id: transaction.id,
              request_key: crypto.randomUUID(),
              note: '',
              date: new Date().toISOString().slice(0, 10),
              reference: transaction.reference || ''
            })}>{actionNames[action]}</button>)}{detail.legacy && !transaction.budget_request_id && permissions.prepare && <button className="fw-button" onClick={() => {
              setDetail(null);
              setForm({
                source_type: ['invoice_payment', 'billing_payment'].includes(transaction.source_type) ? transaction.source_type : 'legacy_finance',
                source_id: String(transaction.id),
                amount: transaction.amount,
                transaction_date: transaction.transaction_date,
                party_name: transaction.source || transaction.description,
                description: transaction.description
              });
            }}>Review & Klasifikasikan</button>}</div>{decision && <form className="fw-section" onSubmit={async e => {
            e.preventDefault();
            const result = await mutate(decision);
            if (result) {
              setDecision(null);
              await showDetail({
                ledger_id: `transaction:${transaction.id}`
              });
            }
          }}><h3>{actionNames[decision.action]}</h3><p className="fw-muted">{decision.action === 'pay' ? 'Catat hanya pembayaran yang benar-benar terjadi dan memiliki bukti.' : decision.action === 'reverse' ? 'Reversal membuat jurnal lawan. Jurnal asli tetap tersimpan.' : 'Keputusan dan pelakunya tersimpan dalam audit.'}</p><Field label="Catatan / alasan"><textarea required={['reject', 'reverse', 'return_revision', 'reopen'].includes(decision.action)} value={decision.note} onChange={e => setDecision({
                ...decision,
                note: e.target.value
              })} /></Field>{decision.action === 'pay' && <Field label="Referensi pembayaran *"><input required value={decision.reference} onChange={e => setDecision({
                ...decision,
                reference: e.target.value
              })} /></Field>}{decision.action === 'post' && ['other_receipt', 'other_payment'].includes(transaction.classification) && <Field label="Aktivitas arus kas *"><select required value={decision.cash_flow_class || ''} onChange={e => setDecision({
                ...decision,
                cash_flow_class: e.target.value
              })}><option value="">Pilih</option><option value="operating">Operasional</option><option value="investing">Investasi</option><option value="financing">Pendanaan</option></select></Field>}{decision.action === 'reverse' && <Field label="Tanggal reversal *"><input required type="date" value={decision.date} onChange={e => setDecision({
                ...decision,
                date: e.target.value
              })} /></Field>}<button className="fw-button fw-primary" disabled={busy} type="submit">Konfirmasi {actionNames[decision.action]}</button></form>}</section></div>}
  {journal && <div className="fw-modal-backdrop"><section className="fw-modal" role="dialog" aria-modal="true" aria-label="Jurnal"><div className="fw-modal-heading"><h2>{journal.number}</h2><button className="fw-button" onClick={() => setJournal(null)}>Tutup</button></div><RecordTree value={{
            ...journal,
            lines: undefined
          }} /><FinanceTable rows={journal.lines} columns={[["code", "COA"], ["name", "Akun"], ["debit", "Debit", moneyCell], ["credit", "Kredit", moneyCell]]} /></section></div>}
  </main></Layout>;
}
