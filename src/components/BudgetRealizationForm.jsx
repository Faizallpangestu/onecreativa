import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountingGet, accountingMutate, accountingError, financeMoney } from '../utils/accountingApi';
import { FinanceField as Field, AccountSelect } from './AccountingTransactionForm';
import { FinanceTable } from './AccountingTools';
import '../pages/FinanceWorkspace.css';
export default function BudgetRealizationForm({
  budget,
  onClose,
  onSaved
}) {
  const [session, setSession] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState(null);
  const [form, setForm] = useState({
    action: 'realize',
    request_key: crypto.randomUUID(),
    budget_request_id: budget.id,
    mode: 'realization',
    classification: 'expense',
    budget_item_id: '',
    amount: '',
    vendor_id: '',
    party_name: '',
    attachment_link: '',
    transaction_date: new Date().toLocaleDateString('en-CA'),
    cash_account_id: '',
    counter_account_id: '',
    reference: '',
    payment_method: 'Transfer'
  });
  useEffect(() => {
    let active = true;
    accountingGet('lookups').then(r => {
      if (active) {
        setSession(r);
        if (!r.permissions.prepare) setForm(previous => ({
          ...previous,
          mode: "close"
        }));
      }
    }).catch(e => {
      if (active) setError(accountingError(e));
    });
    return () => {
      active = false;
    };
  }, []);
  const field = (key, value) => setForm(previous => ({
    ...previous,
    [key]: value
  }));
  const item = budget.items.find(i => String(i.id) === String(form.budget_item_id));
  return <div className="fw-modal-backdrop"><section className="fw-modal" role="dialog" aria-modal="true" aria-label="Komitmen dan realisasi RAB"><div className="fw-modal-heading"><div><h2>Komitmen & Realisasi RAB #{budget.id}</h2><p>{budget.title}</p></div><button className="fw-button" disabled={busy} onClick={onClose}>Tutup</button></div><div className="fw-notice">Disetujui {financeMoney(budget.approved_amount)} / Komitmen {financeMoney(budget.committed_amount)} / Realisasi tercatat {financeMoney(budget.realized_amount)} / Sisa {financeMoney(budget.remaining_amount)}. Realisasi membuat draft pembayaran. Jurnal mengikuti pengakuan tagihan dan pembayaran terverifikasi.</div>{error && <div className="fw-notice fw-error" role="alert">{error}</div>}{session ? <form onSubmit={async e => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await accountingMutate(form, session.csrf_token, file);
          await onSaved();
          onClose();
        } catch (err) {
          setError(accountingError(err));
        } finally {
          setBusy(false);
        }
      }}><div className="fw-grid"><Field label="Aksi"><select value={form.mode} onChange={e => field('mode', e.target.value)}>{session.permissions.prepare && <><option value="realization">Realisasi / draft pembayaran</option><option value="commitment">Komitmen kebutuhan</option><option value="cancel_commitment">Batalkan komitmen</option></>}{session.permissions.approve && <option value="close">Tutup RAB</option>}</select></Field>{form.mode === 'close' ? <Field label="Alasan penutupan *"><input required value={form.note || ''} onChange={e => field('note', e.target.value)} /></Field> : <><Field label="Item disetujui *"><select required value={form.budget_item_id} onChange={e => field('budget_item_id', e.target.value)}><option value="">Pilih</option>{budget.items.filter(i => Number(i.approved_amount) > 0).map(i => <option key={i.id} value={i.id}>{i.description} / Sisa {financeMoney(i.remaining_amount)}</option>)}</select></Field>{item && <div className="fw-notice">Disetujui {financeMoney(item.approved_amount)} / Komitmen {financeMoney(item.committed_amount)} / Realisasi {financeMoney(item.realized_amount)} / Sisa {financeMoney(item.remaining_amount)}</div>}{form.mode !== 'commitment' && <Field label={form.mode === 'cancel_commitment' ? 'Komitmen yang dibatalkan *' : 'Gunakan komitmen (opsional)'}><select required={form.mode === 'cancel_commitment'} value={form.commitment_id || ''} onChange={e => field('commitment_id', e.target.value)}><option value="">Tanpa komitmen</option>{(budget.commitments || []).filter(c => String(c.budget_item_id) === String(form.budget_item_id) && c.status === 'open').map(c => <option key={c.id} value={c.id}>#{c.id} - {financeMoney(c.amount)}</option>)}</select></Field>}{form.mode !== 'cancel_commitment' && <Field label="Nominal IDR *"><input required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" value={form.amount} onChange={e => field('amount', e.target.value)} /></Field>}{form.mode === 'realization' && <><Field label="Substansi *"><select value={form.classification} onChange={e => setForm({
                  ...form,
                  classification: e.target.value,
                  counter_account_id: ''
                })}><option value="expense">Beban langsung</option><option value="asset">Aset tetap</option><option value="prepayment">Uang muka</option><option value="vendor_bill">Settlement tagihan vendor</option></select></Field><Field label="Vendor *"><select required value={form.vendor_id} onChange={e => {
                  const vendor = session.data.vendors.find(v => String(v.id) === e.target.value);
                  setForm({
                    ...form,
                    vendor_id: e.target.value,
                    party_name: vendor?.name || ''
                  });
                }}><option value="">Pilih vendor</option>{session.data.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>{form.classification === 'vendor_bill' && <Field label="Tagihan vendor yang telah diakui *"><select required value={form.vendor_bill_id || ''} onChange={e => field('vendor_bill_id', e.target.value)}><option value="">Pilih</option>{(session.data.sources.vendor_bill || []).filter(b => session.data.documents.some(d => d.source_type === 'vendor_bill' && String(d.source_id) === String(b.id))).map(b => <option key={b.id} value={b.id}>{b.number}</option>)}</select></Field>}<Field label="Tanggal transaksi *"><input required type="date" value={form.transaction_date} onChange={e => field('transaction_date', e.target.value)} /></Field><Field label="Rekening pembayaran *"><select required value={form.cash_account_id} onChange={e => field('cash_account_id', e.target.value)}><option value="">Pilih rekening</option>{session.data.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field><Field label="COA beban / aset / uang muka / utang *"><AccountSelect accounts={session.data.accounts} value={form.counter_account_id} onChange={e => field('counter_account_id', e.target.value)} filter={a => form.classification === 'expense' ? Number(a.account_group) === 5 : a.report_class === {
                  asset: 'fixed_asset',
                  prepayment: 'prepayment',
                  vendor_bill: 'payable'
                }[form.classification]} /></Field><Field label="Dokumen pendukung *"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required={!form.attachment_link} onChange={e => setFile(e.target.files?.[0] || null)} /></Field><Field label="Atau link dokumen HTTP(S)"><input type="url" value={form.attachment_link} onChange={e => field('attachment_link', e.target.value)} /></Field><Field label="Referensi pembayaran"><input value={form.reference} onChange={e => field('reference', e.target.value)} /></Field></>}</>}</div><button className="fw-button fw-primary fw-section" disabled={busy}>{busy ? 'Memproses...' : 'Simpan'}</button></form> : <p>Memuat master akuntansi...</p>}<FinanceTable rows={budget.realizations || []} columns={[["id", "Realisasi"], ["budget_item_id", "Item"], ["amount", "Nominal", financeMoney], ["classification", "Substansi"], ["status", "Status"], ["transaction_id", "Pembayaran", id => id ? <Link to="/buku-transaksi">Buka buku transaksi #{id}</Link> : 'Belum tersedia']]} /><FinanceTable rows={budget.commitments || []} columns={[["id", "Komitmen"], ["budget_item_id", "Item"], ["amount", "Nominal", financeMoney], ["status", "Status"]]} /></section></div>;
}
