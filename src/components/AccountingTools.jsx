import { useState } from 'react';
import { FinanceField as Field, AccountSelect } from './AccountingTransactionForm';
import { financeMoney, sourceLabels } from '../utils/accountingApi';
export function FinanceTable({
  rows,
  columns,
  onRow
}) {
  return <div className="fw-table-wrap"><table className="fw-table"><thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={row.ledger_id || row.id || index}>{columns.map(([key,, render]) => <td key={key}>{render ? render(row[key], row) : row[key] ?? 'Belum tersedia'}</td>)}{onRow && <td><button className="fw-button" onClick={() => onRow(row)}>Rincian</button></td>}</tr>) : <tr><td colSpan={columns.length + (onRow ? 1 : 0)}>Belum ada data yang sesuai.</td></tr>}</tbody></table></div>;
}
const classGroups = {
  1: ['cash', 'receivable', 'inventory', 'fixed_asset', 'prepayment', 'other_asset'],
  2: ['payable', 'payroll_payable', 'loan', 'deferred_revenue', 'reimbursement_payable', 'tax_payable', 'other_liability'],
  3: ['capital', 'retained_earnings', 'other_equity'],
  4: ['revenue', 'other_income'],
  5: ['cost_of_services', 'operating_expense', 'other_expense', 'income_tax']
};
export default function AccountingTools({
  lookups,
  permissions,
  busy,
  onSave
}) {
  const [mode, setMode] = useState(permissions.configure ? 'account' : permissions.post ? 'recognize' : permissions.prepare ? 'vendor_bill' : 'approve_bill');
  const [form, setForm] = useState({});
  const [key, setKey] = useState(crypto.randomUUID());
  const [lines, setLines] = useState([{
    account_id: '',
    debit: '',
    credit: ''
  }, {
    account_id: '',
    debit: '',
    credit: ''
  }]);
  const field = (name, value) => setForm(previous => ({
    ...previous,
    [name]: value
  }));
  const reset = value => {
    setMode(value);
    setForm({});
    setKey(crypto.randomUUID());
  };
  const input = (name, type = 'text', required = true) => <input required={required} type={type} value={form[name] || ''} onChange={e => field(name, e.target.value)} />;
  const accounts = (name, filter = () => true) => <AccountSelect accounts={lookups.accounts} value={form[name]} filter={filter} onChange={e => field(name, e.target.value)} />;
  const sourceTypes = ['billing_invoice', 'invoice_client', 'salary', 'reimbursement', 'vendor_bill'];
  const modes = [...(permissions.configure ? [['account', 'COA'], ['bank', 'Rekening'], ['period', 'Periode'], ...(permissions.configure_roles ? [['permission', 'Izin']] : []), ['vendor', 'Vendor']] : []), ...(permissions.prepare ? [['vendor_bill', 'Tagihan Vendor']] : []), ...(permissions.approve ? [['approve_bill', 'Approval Tagihan']] : []), ...(permissions.post ? [['recognize', 'Pengakuan Piutang/Utang'], ['recognize_revenue', 'Pendapatan Terpenuhi'], ['adjustment', 'Adjustment'], ['reverse_journal', 'Reversal']] : [])];
  return <section className="fw-panel"><h2>Master Data & Pengakuan Akuntansi</h2><p className="fw-muted">Pengakuan dan adjustment langsung membuat jurnal posted yang seimbang. Koreksi menggunakan reversal dengan alasan.</p><div className="fw-tabs">{modes.map(([value, label]) => <button key={value} className={`fw-button ${mode === value ? 'active' : ''}`} onClick={() => reset(value)}>{label}</button>)}</div><form onSubmit={async e => {
      e.preventDefault();
      const payload = {
        ...form,
        action: mode,
        request_key: key
      };
      if (mode === 'adjustment') payload.lines = lines.map(l => ({
        ...l,
        debit: l.debit || '0',
        credit: l.credit || '0'
      }));
      if (await onSave(payload)) {
        setForm({});
        setKey(crypto.randomUUID());
      }
    }}><div className="fw-grid">
    {mode === 'account' && <><Field label="ID akun untuk edit (kosong = baru)">{input('id', 'number', false)}</Field><Field label="Kode COA *">{input('code')}</Field><Field label="Nama akun *">{input('name')}</Field><Field label="Kelompok *"><select required value={form.account_group || ''} onChange={e => {
              field('account_group', e.target.value);
              field('report_class', '');
            }}><option value="">Pilih</option>{Object.entries({
                1: 'Aset',
                2: 'Kewajiban',
                3: 'Ekuitas',
                4: 'Pendapatan',
                5: 'Beban'
              }).map(([id, name]) => <option key={id} value={id}>{id} - {name}</option>)}</select></Field><Field label="Klasifikasi laporan *"><select required value={form.report_class || ''} onChange={e => field('report_class', e.target.value)}><option value="">Pilih</option>{(classGroups[form.account_group] || []).map(c => <option key={c}>{c}</option>)}</select></Field><Field label="Normal balance"><select value={form.normal_balance || ([1, 5].includes(Number(form.account_group)) ? 'debit' : 'credit')} onChange={e => field('normal_balance', e.target.value)}><option>debit</option><option>credit</option></select></Field><Field label="Parent"><select value={form.parent_id || ''} onChange={e => field('parent_id', e.target.value)}><option value="">Tanpa parent</option>{lookups.accounts.filter(a => !Number(a.is_detail)).map(a => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}</select></Field><Field label="Akun detail"><input type="checkbox" checked={form.is_detail ?? true} onChange={e => field('is_detail', e.target.checked)} /></Field><Field label="Aktif"><input type="checkbox" checked={form.is_active ?? true} onChange={e => field('is_active', e.target.checked)} /></Field></>}
    {mode === 'bank' && <><Field label="Nama rekening *">{input('name')}</Field><Field label="COA kas/bank *">{accounts('account_id', a => a.report_class === 'cash')}</Field><Field label="Nama bank">{input('bank_name', 'text', false)}</Field><Field label="Nomor rekening">{input('account_number', 'text', false)}</Field></>}
    {mode === 'period' && <><Field label="Periode *">{input('month', 'month')}</Field><Field label="Status"><select value={form.status || 'open'} onChange={e => field('status', e.target.value)}><option value="open">Buka</option><option value="closed">Tutup</option></select></Field><Field label="Alasan *">{input('reason')}</Field></>}
    {mode === 'permission' && <><Field label="Role yang terdaftar *">{input('role')}</Field><Field label="Izin *"><select required value={form.permission || ''} onChange={e => field('permission', e.target.value)}><option value="">Pilih</option>{['read', 'prepare', 'approve', 'post', 'configure'].map(p => <option key={p}>{p}</option>)}</select></Field><Field label="Diizinkan"><input type="checkbox" checked={form.allowed ?? true} onChange={e => field('allowed', e.target.checked)} /></Field></>}
    {mode === 'vendor' && <><Field label="Nama vendor *">{input('name')}</Field><Field label="Kontak">{input('contact', 'text', false)}</Field></>}
    {mode === 'vendor_bill' && <><Field label="Nomor tagihan *">{input('number')}</Field><Field label="Vendor *"><select required value={form.vendor_id || ''} onChange={e => field('vendor_id', e.target.value)}><option value="">Pilih</option>{lookups.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field><Field label="Tanggal tagihan *">{input('bill_date', 'date')}</Field><Field label="Jatuh tempo">{input('due_date', 'date', false)}</Field><Field label="Nominal *">{input('amount')}</Field><Field label="Deskripsi *">{input('description')}</Field><Field label="Link dokumen *">{input('attachment_link', 'url')}</Field><Field label="COA aset / beban *">{accounts('account_id', a => [1, 5].includes(Number(a.account_group)))}</Field><Field label="COA utang vendor *">{accounts('liability_account_id', a => a.report_class === 'payable')}</Field></>}
    {mode === 'approve_bill' && <><Field label="Tagihan draft *"><select required value={form.id || ''} onChange={e => field('id', e.target.value)}><option value="">Pilih</option>{(lookups.vendor_bills || []).filter(b => b.status === 'draft').map(b => <option key={b.id} value={b.id}>{b.number} - {financeMoney(b.amount)}</option>)}</select></Field><Field label="Catatan keputusan *">{input('note')}</Field></>}
    {mode === 'recognize' && <><Field label="Jenis dokumen *"><select required value={form.source_type || ''} onChange={e => {
              field('source_type', e.target.value);
              field('source_id', '');
            }}><option value="">Pilih</option>{sourceTypes.map(t => <option key={t} value={t}>{sourceLabels[t]}</option>)}</select></Field><Field label="Dokumen sumber *"><select required value={form.source_id || ''} onChange={e => field('source_id', e.target.value)}><option value="">Pilih</option>{(lookups.sources[form.source_type] || []).map(s => <option key={s.id} value={s.id}>{s.number} {s.party_name} - {financeMoney(s.amount)}</option>)}</select></Field><Field label="Tanggal pengakuan *">{input('date', 'date')}</Field><Field label="Jatuh tempo">{input('due_date', 'date', false)}</Field><Field label="COA piutang/utang *">{accounts('control_account_id', a => ['receivable', 'payable', 'payroll_payable', 'reimbursement_payable'].includes(a.report_class))}</Field><Field label="COA pengakuan (pendapatan/deferred/aset/beban) *">{accounts('recognition_account_id', a => [1, 4, 5].includes(Number(a.account_group)) || a.report_class === 'deferred_revenue')}</Field>{form.source_type === 'salary' && ['kasbon_deduction', 'bpjs_tk_deduction', 'bpjs_kes_deduction'].map(name => <Field key={name} label={`COA ${name} jika ada`}><AccountSelect required={false} accounts={lookups.accounts} value={form.deduction_accounts?.[name]} onChange={e => field('deduction_accounts', {
              ...form.deduction_accounts,
              [name]: e.target.value
            })} /></Field>)}</>}
    {mode === 'recognize' && <><Field label="Departemen dokumen"><select value={form.department_id||''} onChange={e=>field('department_id',e.target.value)}><option value="">Tanpa departemen</option>{lookups.departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></Field><Field label="Siswa dokumen"><select value={form.student_id||''} onChange={e=>{const student=lookups.students.find(s=>String(s.id)===e.target.value);setForm(previous=>({...previous,student_id:e.target.value,batch:student?.batch||''}));}}><option value="">Tidak terkait siswa</option>{lookups.students.map(s=><option key={s.id} value={s.id}>{s.name} - {s.batch}</option>)}</select></Field><Field label="Batch dokumen">{input('batch','text',false)}</Field></>}
      {mode === 'recognize_revenue' && <><Field label="Dokumen deferred *"><select required value={form.document_id || ''} onChange={e => field('document_id', e.target.value)}><option value="">Pilih</option>{lookups.documents.filter(d => lookups.accounts.find(a => String(a.id) === String(d.recognition_account_id))?.report_class === 'deferred_revenue').map(d => <option key={d.id} value={d.id}>{d.number}</option>)}</select></Field><Field label="Tanggal layanan terpenuhi *">{input('date', 'date')}</Field><Field label="Nominal terpenuhi *">{input('amount')}</Field><Field label="COA pendapatan *">{accounts('account_id', a => Number(a.account_group) === 4)}</Field><Field label="Bukti layanan terpenuhi *">{input('evidence')}</Field></>}
    {['adjustment', 'reverse_journal'].includes(mode) && <><Field label="Tanggal jurnal *">{input('date', 'date')}</Field><Field label="Dokumen/alasan *">{input(mode === 'adjustment' ? 'description' : 'note')}</Field>{mode === 'reverse_journal' && <Field label="ID jurnal posted *">{input('id', 'number')}</Field>}</>}
    </div>{mode === 'adjustment' && <div className="fw-section">{lines.map((line, i) => <div className="fw-grid" key={i}><Field label={`COA baris ${i + 1}`}><AccountSelect accounts={lookups.accounts} value={line.account_id} onChange={e => setLines(previous => previous.map((l, j) => j === i ? {
              ...l,
              account_id: e.target.value
            } : l))} /></Field>{['debit', 'credit'].map(k => <Field key={k} label={k}><input inputMode="decimal" value={line[k]} onChange={e => setLines(previous => previous.map((l, j) => j === i ? {
              ...l,
              [k]: e.target.value
            } : l))} /></Field>)}</div>)}<button type="button" className="fw-button" onClick={() => setLines([...lines, {
          account_id: '',
          debit: '',
          credit: ''
        }])}>Tambah baris</button></div>}<div className="fw-section"><button disabled={busy} className="fw-button fw-primary" type="submit">{busy ? 'Memproses...' : ['recognize', 'recognize_revenue', 'adjustment', 'reverse_journal'].includes(mode) ? 'Posting Jurnal' : 'Simpan'}</button></div></form>
    <details className="fw-section"><summary>Master yang tersimpan</summary><h3>Chart of Accounts</h3><FinanceTable rows={lookups.accounts} columns={[["id", "ID"], ["code", "Kode"], ["name", "Akun"], ["account_group", "Kelompok"], ["normal_balance", "Normal"], ["parent_id", "Parent"], ["report_class", "Laporan"], ["is_active", "Aktif"]]} /><h3>Rekening</h3><FinanceTable rows={lookups.banks} columns={[["id", "ID"], ["name", "Rekening"], ["code", "COA"], ["account_number", "Nomor"]]} /><h3>Periode</h3><FinanceTable rows={lookups.periods} columns={[["month", "Periode"], ["status", "Status"]]} />{permissions.configure && <FinanceTable rows={lookups.role_permissions || []} columns={[["role_name", "Role"], ["permission", "Izin"], ["allowed", "Diizinkan"]]} />}</details>
  </section>;
}
