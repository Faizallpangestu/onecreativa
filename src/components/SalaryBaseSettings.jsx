import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Search, Settings2, X, History } from "lucide-react";
import { mutateSalary, salarySourceLabel } from "../utils/salaryApi";
import { formatBudgetMoney, formatBudgetMonth, formatBudgetDate } from "../utils/budgetApi";

export default function SalaryBaseSettings({ initialMonth, employeeId, onSaved, refreshKey }) {
  const [month, setMonth] = useState(initialMonth);
  const [employees, setEmployees] = useState([]);
  const [csrf, setCsrf] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(employeeId || null);
  const load = useCallback(async signal => {
    setLoading(true); setError("");
    try {
      const response = await axios.get("/api/salaries.php", { params: { view: "base_salary", month, _t: Date.now() }, signal });
      setEmployees(response.data.data.employees); setCsrf(response.data.csrf_token);
    } catch (err) {
      if (!axios.isCancel(err)) { setError(err.response?.data?.message || "Pengaturan gaji gagal dimuat."); setEmployees([]); }
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [month]);
  useEffect(() => {
    const controller = new AbortController(); void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);
  const employee = employees.find(row => Number(row.employee_id) === Number(selected));
  const filtered = employees.filter(row => [row.employee_name, row.employee_code].some(value => value.toLowerCase().includes(search.toLowerCase())));
  return <section className="rab-panel salary-base-panel">
    <div className="rab-panel-header"><h2>Gaji Pokok per Karyawan</h2><p>Atur sekali per karyawan. Nominal digunakan setiap bulan sampai ada perubahan yang mulai berlaku.</p></div>
    <div className="salary-base-help"><Settings2 size={20} /><div><strong>Pilih bulan absensi mulai berlaku</strong><p>Contoh: berlaku Oktober berarti dipakai untuk absensi Oktober, dengan jadwal gajian 4 November. Uang makan Rp30.000 dan transport Rp20.000 tetap otomatis per hari hadir.</p></div></div>
    {error && <div className="rab-error" role="alert">{error}</div>}
    {notice && <div className="rab-notice" role="status">{notice}</div>}
    <div className="rab-filters"><label className="rab-search"><Search size={16} /><input aria-label="Cari pengaturan gaji" placeholder="Cari nama atau NIK karyawan…" value={search} onChange={event => setSearch(event.target.value)} /></label><label className="salary-base-month">Gaji untuk absensi<input aria-label="Bulan pengaturan gaji" type="month" min="1900-01" max="2299-12" value={month} onChange={event => { if (event.target.value) setMonth(event.target.value); }} /></label></div>
    <div className="rab-table-scroll"><table className="rab-table"><thead><tr><th>Karyawan</th><th>Gaji Pokok · {formatBudgetMonth(month)}</th><th>Sumber / Mulai Berlaku</th><th>Aksi</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={4} className="rab-empty">Memuat pengaturan gaji…</td></tr> : !filtered.length ? <tr><td colSpan={4} className="rab-empty">Tidak ada karyawan yang sesuai.</td></tr> : filtered.map(row => <tr key={row.employee_id}><td><strong>{row.employee_name}</strong><span className="rab-cell-caption">{row.employee_code} · {row.position_name}</span></td><td><strong>{formatBudgetMoney(row.base_salary)}</strong>{Number(row.base_salary) <= 0 && <span className="salary-row-issue">Gaji pokok belum diatur.</span>}</td><td>{salarySourceLabel(row.salary_source)}<span className="rab-cell-caption">{row.base_salary_effective_month ? `Sejak ${formatBudgetMonth(row.base_salary_effective_month)}` : "Nilai awal dari data karyawan/jabatan"}</span>{row.history.some(rate => rate.effective_month > month) && <span className="salary-row-issue">Ada perubahan untuk bulan berikutnya · lihat riwayat</span>}</td><td><button className="rab-button rab-button-primary" onClick={() => { setNotice(""); setSelected(Number(row.employee_id)); }}><Settings2 size={15} />Atur Gaji Pokok</button></td></tr>)}
    </tbody></table></div>
    {!loading && <div className="rab-pagination"><span>{filtered.length} karyawan · Finance dan Admin dapat mengatur gaji pokok.</span></div>}
    {employee && !loading && <SalaryBaseEditor key={`${employee.employee_id}:${employee.revision}:${month}`} employee={employee} month={month} csrf={csrf} onClose={() => setSelected(null)} onSaved={async saved => {
      setSelected(null); setNotice(`Gaji pokok ${employee.employee_name} disimpan: ${formatBudgetMoney(saved.amount)}, mulai absensi ${formatBudgetMonth(saved.effective_month)}. Untuk draft yang sudah ada, buka rincian lalu pilih Simpan & Hitung Ulang.`);
      await load(); onSaved();
    }} />}
  </section>;
}

function SalaryBaseEditor({ employee, month, csrf, onClose, onSaved }) {
  const [amount, setAmount] = useState(String(Number(employee.base_salary) || ""));
  const [effectiveMonth, setEffectiveMonth] = useState(month);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async event => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const saved = await mutateSalary({ action: "set_base_salary", employee_id: employee.employee_id, revision: employee.revision, amount, effective_month: effectiveMonth, reason }, csrf);
      await onSaved(saved);
    } catch (err) { setError(err.response?.data?.message || "Gaji pokok gagal disimpan."); }
    finally { setBusy(false); }
  };
  return <div className="rab-modal-backdrop"><section className="rab-modal salary-base-modal" role="dialog" aria-modal="true" aria-labelledby="salary-base-title">
    <div className="rab-modal-heading"><div><p>{employee.employee_code} · {employee.position_name}</p><h2 id="salary-base-title">Gaji Pokok · {employee.employee_name}</h2></div><button disabled={busy} aria-label="Tutup pengaturan gaji" onClick={onClose}><X size={20} /></button></div>
    <form onSubmit={save}><div className="rab-form-body">
      <p className="salary-help">Gaji pokok berbeda untuk setiap karyawan. Tunjangan makan dan transport dihitung terpisah dari jumlah hari hadir.</p>
      {error && <div className="rab-error" role="alert">{error}</div>}
      <div className="salary-base-fields"><label>Gaji Pokok per Bulan (Rp)<input aria-label="Nominal gaji pokok" required type="number" inputMode="decimal" min="0.01" max="9999999999999.99" step="0.01" disabled={busy} value={amount} onChange={event => setAmount(event.target.value)} /></label><label>Bulan Absensi Mulai Berlaku<input aria-label="Mulai berlaku gaji pokok" required type="month" min="1900-01" max="2299-12" disabled={busy} value={effectiveMonth} onChange={event => setEffectiveMonth(event.target.value)} /></label></div>
      <label>Alasan Pengaturan / Perubahan<textarea aria-label="Alasan perubahan gaji" required maxLength={1000} rows={3} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} placeholder="Contoh: penetapan gaji awal atau kenaikan gaji" /></label>
      <p className="salary-help">Periode yang sudah diajukan, disetujui, atau dibayar dikunci. Riwayat nominal dan pengubahnya selalu disimpan.</p>
      <h3 className="rab-history-title"><History size={16} /> Riwayat Gaji Pokok</h3>
      <ol className="rab-timeline">{employee.history.map(rate => <li key={rate.id}><span className="rab-timeline-dot" /><div><strong>{formatBudgetMoney(rate.amount)} · mulai {formatBudgetMonth(rate.effective_month)}</strong><p>{rate.actor_name} · {formatBudgetDate(rate.created_at)}</p><p className="rab-history-note">{rate.reason}</p></div></li>)}</ol>
      <p className="salary-help">Nilai awal dari data karyawan/jabatan: {formatBudgetMoney(employee.baseline_salary)}. Digunakan sebelum pengaturan per bulan mulai berlaku.</p>
    </div><div className="rab-modal-footer rab-detail-actions"><button type="button" className="rab-button" disabled={busy} onClick={onClose}>Tutup</button><button className="rab-button rab-button-primary" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Gaji Pokok"}</button></div></form>
  </section></div>;
}
