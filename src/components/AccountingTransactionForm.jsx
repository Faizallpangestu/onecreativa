import { useState } from 'react';
import { financeMoney, sourceLabels } from '../utils/accountingApi';
export function FinanceField({
  label,
  children
}) {
  return <label className="fw-field"><span>{label}</span>{children}</label>;
}
export function AccountSelect({
  accounts,
  value,
  onChange,
  required = true,
  filter = () => true
}) {
  return <select required={required} value={value || ''} onChange={onChange}><option value="">Pilih COA</option>{accounts.filter(a => Number(a.is_active) && Number(a.is_detail) && filter(a)).map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>;
}
export default function AccountingTransactionForm({
  lookups,
  initial = {},
  busy,
  error,
  onSave,
  onClose
}) {
  const [form, setForm] = useState(() => ({
    action: 'create',
    request_key: crypto.randomUUID(),
    classification: '',
    source_type: 'cash_transaction',
    source_id: '',
    transaction_date: new Date().toLocaleDateString('en-CA'),
    amount: '',
    party_name: '',
    description: '',
    category: '',
    cash_account_id: '',
    counter_account_id: '',
    payment_method: 'Transfer',
    reference: '',
    attachment_link: '',
    ...initial
  }));
  const [file, setFile] = useState(null);
  const update = (key, value) => setForm(previous => ({
    ...previous,
    [key]: value
  }));
  const rule = lookups.classifications[form.classification];
  const counter = lookups.accounts.find(a => String(a.id) === String(form.counter_account_id));
  const bank = lookups.banks.find(b => String(b.id) === String(form.cash_account_id));
  const sourceOptions = [...new Set([...(rule?.documents || Object.keys(lookups.sources)), ...(['legacy_finance', 'invoice_payment', 'billing_payment'].includes(form.source_type) ? [form.source_type] : [])])];
  const sourceRows = lookups.sources[form.source_type] || [];
  const selectSource = id => {
    const row = sourceRows.find(s => String(s.id) === id);
    const document = lookups.documents.find(d=>d.source_type===form.source_type&&String(d.source_id)===id);
    setForm(previous => ({
      ...previous,
      source_id: id,
      ...(document?.dimensions||{}),
      party_name: row?.party_name || previous.party_name,
      amount: ['salary', 'reimbursement', 'asset', 'legacy_finance'].includes(previous.source_type) ? row?.amount || '' : previous.amount,
      transaction_date: row?.transaction_date || row?.paid_date || previous.transaction_date
    }));
  };
  const debit = rule?.type === 'income' ? bank?.name : counter?.name;
  const credit = rule?.type === 'income' ? counter?.name : bank?.name;
  return <div className="fw-modal-backdrop"><section className="fw-modal" role="dialog" aria-modal="true" aria-labelledby="cash-form-title"><div className="fw-modal-heading"><div><h2 id="cash-form-title">Penerimaan / Pembayaran Kas dan Bank</h2><p className="fw-muted">Nomor transaksi dibuat server. Draft belum memengaruhi jurnal.</p></div><button className="fw-button" disabled={busy} onClick={onClose}>Tutup</button></div><form onSubmit={event => {
        event.preventDefault();
        onSave({
          ...form,
          category: form.category || rule?.label
        }, file);
      }}>
    {error && <div className="fw-notice fw-error" role="alert">{error}</div>}
    <div className="fw-grid">
      <FinanceField label="Jenis transaksi *"><select required value={form.classification} onChange={event => setForm({
              ...form,
              classification: event.target.value,
              counter_account_id: '',
              source_id: initial.action === 'update' ? initial.source_id : ['legacy_finance', 'invoice_payment', 'billing_payment'].includes(initial.source_type) ? initial.source_id : '',
              source_type: initial.action === 'update' ? initial.source_type : ['legacy_finance', 'invoice_payment', 'billing_payment'].includes(initial.source_type) ? initial.source_type : lookups.classifications[event.target.value]?.documents?.[0] || 'cash_transaction'
            })}><option value="">Pilih jenis transaksi</option>{Object.entries(lookups.classifications).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}</select></FinanceField>
      <FinanceField label="Tanggal transaksi *"><input required type="date" value={form.transaction_date} onChange={e => update('transaction_date', e.target.value)} /></FinanceField>
      <FinanceField label="Jenis dokumen sumber *"><select disabled={initial.action === 'update'} value={form.source_type} onChange={e => setForm({
              ...form,
              source_type: e.target.value,
              source_id: ''
            })}>{!rule?.documents && <option value="cash_transaction">Dokumen kas/bank ini</option>}{sourceOptions.map(type => <option key={type} value={type}>{sourceLabels[type]}</option>)}</select></FinanceField>
      {form.source_type !== 'cash_transaction' && <FinanceField label="Dokumen sumber *"><select disabled={initial.action === 'update'} required value={form.source_id} onChange={e => selectSource(e.target.value)}><option value="">Pilih dokumen nyata</option>{sourceRows.map(s => <option key={s.id} value={s.id}>{s.number} · {s.party_name} · {financeMoney(s.amount)}</option>)}</select></FinanceField>}
      <FinanceField label="Nominal IDR *"><input required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" value={form.amount} onChange={e => update('amount', e.target.value)} /></FinanceField>
      <FinanceField label={rule?.type === 'income' ? 'Rekening penerima perusahaan *' : 'Rekening sumber perusahaan *'}><select required value={form.cash_account_id} onChange={e => update('cash_account_id', e.target.value)}><option value="">Pilih rekening kas/bank</option>{lookups.banks.filter(b => Number(b.is_active)).map(b => <option key={b.id} value={b.id}>{b.name} · {b.code}</option>)}</select></FinanceField>
      {form.classification === 'bank_transfer' && <FinanceField label="Rekening tujuan perusahaan *"><select required value={form.destination_cash_account_id || ''} onChange={e => {
              const destination = lookups.banks.find(b => String(b.id) === e.target.value);
              setForm({
                ...form,
                destination_cash_account_id: e.target.value,
                counter_account_id: destination?.account_id || ''
              });
            }}><option value="">Pilih rekening tujuan</option>{lookups.banks.filter(b => String(b.id) !== String(form.cash_account_id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></FinanceField>}
      <FinanceField label="COA lawan *"><AccountSelect accounts={lookups.accounts} value={form.counter_account_id} onChange={e => update('counter_account_id', e.target.value)} filter={a => !rule || (!rule.groups || rule.groups.includes(Number(a.account_group))) && (!rule.classes || rule.classes.includes(a.report_class))} /></FinanceField>
      <FinanceField label="Pihak pembayar / penerima *"><input required maxLength={255} value={form.party_name} onChange={e => update('party_name', e.target.value)} /></FinanceField>
      <FinanceField label="Kategori"><input maxLength={100} value={form.category} placeholder={rule?.label} onChange={e => update('category', e.target.value)} /></FinanceField>
      <FinanceField label="Departemen"><select value={form.department_id || ''} onChange={e => update('department_id', e.target.value)}><option value="">Tanpa departemen</option>{lookups.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FinanceField>
      <FinanceField label="Siswa"><select value={form.student_id || ''} onChange={e => {
              const s = lookups.students.find(s => String(s.id) === e.target.value);
              setForm({
                ...form,
                student_id: e.target.value,
                batch: s?.batch || ''
              });
            }}><option value="">Tidak terkait siswa</option>{lookups.students.map(s => <option key={s.id} value={s.id}>{s.name} · {s.batch}</option>)}</select></FinanceField>
      <FinanceField label="Batch"><input maxLength={100} value={form.batch || ''} onChange={e => update('batch', e.target.value)} /></FinanceField>
      <FinanceField label="Vendor"><select value={form.vendor_id || ''} onChange={e => update('vendor_id', e.target.value)}><option value="">Tidak terkait vendor</option>{lookups.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></FinanceField>
      <FinanceField label="Metode pembayaran *"><select value={form.payment_method} onChange={e => update('payment_method', e.target.value)}><option>Transfer</option><option>Tunai</option><option>QRIS</option></select></FinanceField>
      <FinanceField label="Referensi pembayaran"><input maxLength={180} value={form.reference} onChange={e => update('reference', e.target.value)} /></FinanceField>
      <FinanceField label="Bukti JPG/PNG/WebP/PDF (maksimal 5 MB)"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} /></FinanceField>
      <FinanceField label="Link bukti HTTP(S)"><input type="url" maxLength={2048} value={form.attachment_link} onChange={e => update('attachment_link', e.target.value)} /></FinanceField>
    </div>
    {rule?.documents && form.source_type === 'legacy_finance' && <div className="fw-grid"><FinanceField label="Dokumen settlement *"><select required value={form.document_type || ''} onChange={e => setForm({
              ...form,
              document_type: e.target.value,
              document_id: ''
            })}><option value="">Pilih</option>{rule.documents.map(t => <option key={t} value={t}>{sourceLabels[t]}</option>)}</select></FinanceField><FinanceField label="ID dokumen *"><select required value={form.document_id || ''} onChange={e => update('document_id', e.target.value)}><option value="">Pilih</option>{(lookups.sources[form.document_type] || []).map(s => <option key={s.id} value={s.id}>{s.number}</option>)}</select></FinanceField></div>}
    {rule?.documents && <div className="fw-notice">Dokumen sumber harus diakui terlebih dahulu. Settlement memakai akun piutang/utang yang sama. Outstanding diverifikasi kembali saat posting.</div>}
    <div className="fw-section"><FinanceField label="Deskripsi / substansi transaksi *"><textarea required maxLength={2000} value={form.description} onChange={e => update('description', e.target.value)} /></FinanceField></div>
    {rule && counter && bank && <div className="fw-notice">Preview setelah verifikasi: Debit {debit} · Kredit {credit} · {financeMoney(form.amount || '0')}. {form.classification === 'bank_transfer' ? 'Transfer internal tidak masuk pendapatan atau beban.' : ''}</div>}
    <button className="fw-button fw-primary" disabled={busy || !rule} type="submit">{busy ? 'Menyimpan…' : 'Simpan Draft'}</button>
  </form></section></div>;
}
