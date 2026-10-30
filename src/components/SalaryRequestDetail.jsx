import { useState } from "react";
import { X, RefreshCw, Send, Check, FileText } from "lucide-react";
import { formatBudgetMonth, formatBudgetDate } from "../utils/budgetApi";
import { SALARY_STATUS, SALARY_ACTION, SALARY_MANUAL_FIELDS, salaryDate, salaryReference, calculateNationalStandardDeductions } from "../utils/salaryApi";
import SalaryBreakdown from "./SalaryBreakdown";

function AttendanceTable({ attendance }) {
  return <div className="rab-table-scroll"><table className="rab-table"><thead><tr><th>Tanggal</th><th>Status</th><th>Masuk</th><th>Pulang</th></tr></thead><tbody>{attendance.map(row => <tr key={row.id}><td>{salaryDate(row.date)}</td><td>{({ present: "Hadir", late: "Terlambat", dinas: "Dinas" })[row.status?.toLowerCase()] || "Hadir"}</td><td>{formatBudgetDate(row.check_in_at)}</td><td>{formatBudgetDate(row.check_out_at)}</td></tr>)}</tbody></table></div>;
}
export default function SalaryRequestDetail({ request, permissions, busy, today, error, onClose, onRefresh, onReopen, onAction, onExpense, onBaseSettings, onSlip }) {
  const [bank, setBank] = useState({ bank_name: request.bank_name, account_name: request.account_name, account_number: request.account_number });
  const [manual, setManual] = useState(() => Object.fromEntries([...SALARY_MANUAL_FIELDS.map(field => [field.key, String(request[field.key] || "0.00")]), ["adjustment_note", request.adjustment_note || ""]]));
  const bankChanged = Object.entries(bank).some(([key, value]) => value !== request[key]);
  const manualChanged = Object.entries(manual).some(([key, value]) => key === "adjustment_note" ? value !== (request[key] || "") : value.trim() === "" || Number(value) !== Number(request[key] || 0));
  const saveDraft = event => { event.preventDefault(); onRefresh({ ...bank, ...manual }); };
  const handleAutoCalculateNational = () => {
    const gross = (Number(request.base_salary) || 0) + (Number(request.meal_allowance) || 0) + (Number(request.transport_allowance) || 0) + (Number(manual.thr_amount) || 0);
    const standard = calculateNationalStandardDeductions({
      baseSalary: request.base_salary,
      grossSalary: gross,
      maritalStatus: request.marital_status || "TK/0",
    });
    setManual(prev => ({
      ...prev,
      bpjs_tk_deduction: standard.bpjs_tk_deduction,
      bpjs_kes_deduction: standard.bpjs_kes_deduction,
      pph21_deduction: standard.pph21_deduction,
      adjustment_note: prev.adjustment_note ? prev.adjustment_note : "Dihitung otomatis standar regulasi nasional: BPJS TK 3% (JHT 2% + JP 1%), BPJS Kes 1%, PPh 21 TER (PMK 168/2023).",
    }));
  };

  return <div className="rab-modal-backdrop"><section className="rab-modal" role="dialog" aria-modal="true" aria-labelledby="salary-detail-title">
    <div className="rab-modal-heading"><div><p>{salaryReference(request.id)} · Absensi {formatBudgetMonth(request.month)}</p><h2 id="salary-detail-title">{request.employee_name}</h2><p>{request.employee_code} · {request.position_name}</p></div><button disabled={busy} onClick={onClose} aria-label="Tutup rincian"><X size={20} /></button></div>
    <div className="rab-detail-body"><div className="rab-detail-meta"><span className={`rab-status ${status.className}`}>{status.label}</span><span>Jadwal Gajian: <strong>{salaryDate(request.payday)}</strong></span></div>{error && <div role="alert" className="rab-error">{error}</div>}
      <SalaryBreakdown request={request} explainZeroAttendance />
      {["draft", "rejected"].includes(request.status) && onBaseSettings && <button className="rab-button" disabled={busy} onClick={onBaseSettings}>Atur Gaji Pokok Karyawan</button>}
      {draft ? <form className="salary-draft-form" onSubmit={saveDraft}><div className="salary-bank">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3>Pendapatan & Potongan Standar Nasional</h3>
            <p>Sesuai standar ketenagakerjaan dan perpajakan (PP 44/2015, PP 45/2015, Perpres 64/2020, dan PMK 168/2023 skema TER).</p>
          </div>
          <button type="button" className="rab-button" disabled={busy} onClick={handleAutoCalculateNational} title="Kalkulasi otomatis BPJS TK 3%, BPJS Kes 1%, dan PPh 21 TER">
            <RefreshCw size={14} style={{ marginRight: "4px" }} />
            Hitung Otomatis Standar BPJS &amp; Pajak
          </button>
        </div>
        <div className="salary-manual-fields">{SALARY_MANUAL_FIELDS.map(field => <label key={field.key} htmlFor={`salary-${field.key}`}>
          <span>{field.label} (Rp)</span>
          {field.hint && <small style={{ display: "block", color: "#64748b", fontSize: "11px", marginBottom: "2px" }}>{field.hint}</small>}
          <input id={`salary-${field.key}`} type="number" min="0" max="9999999999999.99" step="0.01" required disabled={busy} value={manual[field.key]} onChange={event => setManual({ ...manual, [field.key]: event.target.value })} />
        </label>)}</div>
        <label className="salary-manual-note" htmlFor="salary-adjustment-note">Catatan Pendapatan / Potongan<textarea id="salary-adjustment-note" rows={2} maxLength={2000} disabled={busy} value={manual.adjustment_note} onChange={event => setManual({ ...manual, adjustment_note: event.target.value })} placeholder="Contoh: BPJS periode ini dan potongan izin 1 hari" /></label>
      </div><div className="salary-bank"><h3>Rekening Tujuan Transfer</h3><div className="salary-bank-fields">{[{ key: "bank_name", label: "Nama Bank", max: 100 }, { key: "account_name", label: "Nama Pemilik Rekening", max: 150 }, { key: "account_number", label: "Nomor Rekening", max: 100 }].map(field => <label key={field.key}>{field.label}<input disabled={busy} maxLength={field.max} value={bank[field.key]} onChange={event => setBank({ ...bank, [field.key]: event.target.value })} /></label>)}</div><button type="submit" disabled={busy} className="rab-button"><RefreshCw size={15} />Simpan & Hitung Ulang</button><p>Simpan untuk memperbarui gaji bersih dari pendapatan dan potongan. Gaji pokok dan tunjangan memakai pengaturan serta absensi terbaru.{(bankChanged || manualChanged) && " Ada perubahan belum disimpan. Simpan sebelum mengajukan."}</p></div></form> : <div className="salary-bank"><h3>Rekening Tujuan Transfer</h3><strong>{request.bank_name || "Belum diisi"} · {request.account_number || "—"}</strong><p>a.n. {request.account_name || "—"}</p></div>}
      {request.reviewed_at && ["approved", "rejected", "paid"].includes(request.status) && <div className={`rab-decision-note ${request.status !== "rejected" ? "is-approved" : ""}`}><strong>{request.status === "rejected" ? "Ditolak" : "Disetujui"} oleh {request.reviewed_by_name}</strong><span>{formatBudgetDate(request.reviewed_at)}</span>{request.review_note && <p>{request.review_note}</p>}</div>}
      {request.status === "approved" && <p className="salary-payment-note">Menunggu transfer Finance{today < request.payday ? ` mulai ${salaryDate(request.payday)}` : ""}. Persetujuan belum menandakan uang telah ditransfer.</p>}
      {request.paid_date && <div className="salary-payment-note"><strong>Transfer {salaryDate(request.paid_date)}</strong><p>Referensi: {request.transfer_reference} · Dicatat {request.paid_by_name}</p></div>}
      {["approved", "paid"].includes(request.status) && <div className="salary-payment-note"><strong>{request.slip ? "Slip telah diterbitkan ke dashboard karyawan" : "Slip menunggu pemeriksaan Finance"}</strong><p>{request.slip ? `Diterbitkan ${request.slip.published_by_name} · ${formatBudgetDate(request.slip.published_at)}` : "Finance memeriksa pratinjau sebelum menerbitkan slip dan mengirim email karyawan."}</p></div>}
      {request.finance_record_id && <button className="rab-income-link" onClick={onExpense}><FileText size={16} />Pengeluaran Penggajian #{request.finance_record_id}<span>Lihat Pengeluaran →</span></button>}
      <h3 className="rab-history-title">Absensi yang Digunakan · {request.work_days} Hari</h3><p className="salary-help">{salaryDate(request.period_start)}–{salaryDate(request.period_end)}. Hadir, terlambat, dan dinas dihitung satu kali per tanggal. Cuti, izin, dan absen tidak mendapat tunjangan harian.</p>{request.attendance.length ? <AttendanceTable attendance={request.attendance} /> : <p className="salary-help">Belum ada hari hadir tercatat. Uang makan dan transport Rp0.</p>}
      <h3 className="rab-history-title">Riwayat Penggajian</h3><ol className="rab-timeline">{request.history.map(event => { let snapshot; try { snapshot = JSON.parse(event.snapshot_json); } catch { snapshot = null; } return <li key={event.id}><span className="rab-timeline-dot" /><div><strong>{SALARY_ACTION[event.action]}</strong><p>{event.actor_name} · {formatBudgetDate(event.created_at)}</p>{event.note && <p className="rab-history-note">{event.note}</p>}{snapshot && <details><summary>Lihat rincian pada saat ini</summary><SalaryBreakdown request={snapshot} /><p>{snapshot.bank_name || "—"} · {snapshot.account_number || "—"} · a.n. {snapshot.account_name || "—"}</p>{snapshot.transfer_reference && <p>Transfer {salaryDate(snapshot.paid_date)} · {snapshot.transfer_reference}</p>}<p>Absensi tersimpan: {snapshot.work_days} hari</p>{snapshot.attendance?.length > 0 && <AttendanceTable attendance={snapshot.attendance} />}</details>}</div></li>; })}</ol>
    </div><div className="rab-modal-footer rab-detail-actions">
      {draft && <button className="rab-button rab-button-primary" disabled={busy || bankChanged || manualChanged || !request.bank_name || !request.account_name || !request.account_number || today <= request.period_end} onClick={() => onAction("submit")}><Send size={16} />Ajukan ke Admin</button>}
      {draft && today <= request.period_end && <span className="salary-help">Pengajuan setelah periode absensi selesai.</span>}
      {request.status === "rejected" && permissions.can_prepare && <button className="rab-button rab-button-primary" disabled={busy} onClick={onReopen}><RefreshCw size={16} />Revisi & Hitung Ulang</button>}
      {request.status === "submitted" && permissions.can_approve && Number(request.submitted_by) !== permissions.actor_id && Number(request.created_by) !== permissions.actor_id && <><button className="rab-button rab-button-danger" disabled={busy} onClick={() => onAction("reject")}>Tolak Pengajuan</button><button className="rab-button rab-button-primary" disabled={busy} onClick={() => onAction("approve")}><Check size={16} />Setujui Gaji</button></>}
      {request.status === "approved" && permissions.can_prepare && <button className="rab-button rab-button-primary" disabled={busy || today < request.payday} onClick={() => onAction("pay")}>Catat Transfer</button>}
      {["approved", "paid"].includes(request.status) && onSlip && <button className="rab-button rab-button-primary" disabled={busy} onClick={onSlip}><FileText size={16} />{request.slip ? "Lihat Slip & Status Email" : "Pratinjau Slip Gaji"}</button>}
      <button disabled={busy} className="rab-button" onClick={onClose}>Tutup</button>
    </div>
  </section></div>;
}
