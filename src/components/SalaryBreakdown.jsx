import { formatBudgetMoney, formatBudgetMonth } from "../utils/budgetApi";
import { SALARY_MANUAL_FIELDS, salarySourceLabel } from "../utils/salaryApi";

export default function SalaryBreakdown({ request, explainZeroAttendance = false }) {
  return <>
    <div className="salary-breakdown">
      <div><span>Gaji Pokok</span><strong>{formatBudgetMoney(request.base_salary)}</strong><small>{salarySourceLabel(request.salary_source)}{request.base_salary_effective_month && ` · sejak ${formatBudgetMonth(request.base_salary_effective_month)}`}</small></div>
      <div><span>Uang Makan</span><strong>{formatBudgetMoney(request.meal_allowance)}</strong><small>{request.work_days} hari × {formatBudgetMoney(request.meal_rate)}</small></div>
      <div><span>Uang Transport</span><strong>{formatBudgetMoney(request.transport_allowance)}</strong><small>{request.work_days} hari × {formatBudgetMoney(request.transport_rate)}</small></div>
    </div>
    <div className="salary-component-summary"><div><h3>Pendapatan Tambahan</h3><p><span>THR</span><strong>{formatBudgetMoney(request.thr_amount || 0)}</strong></p></div><div><h3>Potongan Manual Finance</h3>{SALARY_MANUAL_FIELDS.filter(field => !field.income).map(field => <p key={field.key}><span>{field.label}</span><strong>{formatBudgetMoney(request[field.key] || 0)}</strong></p>)}</div></div>
    <div className="salary-component-totals"><p><span>Jumlah Pendapatan</span><strong>{formatBudgetMoney(request.gross_salary ?? (Number(request.base_salary) + Number(request.meal_allowance) + Number(request.transport_allowance) + Number(request.thr_amount || 0)))}</strong></p><p><span>Jumlah Potongan</span><strong>{formatBudgetMoney(request.total_deductions || 0)}</strong></p></div>
    <div className="rab-detail-total"><span>Gaji Bersih (Pendapatan − Potongan)</span><strong>{formatBudgetMoney(request.total_salary)}</strong></div>
    {request.adjustment_note && <p className="salary-help">Catatan Finance: {request.adjustment_note}</p>}
    {explainZeroAttendance && Number(request.work_days) === 0 && <div className="salary-attendance-note" role="note">
      <strong>Tunjangan Rp0 karena perhitungan memakai 0 hari hadir</strong>
      <p>Periode absensi {formatBudgetMonth(request.month)}. Uang makan dan transport mengikuti jumlah hari hadir yang tercatat pada perhitungan ini.</p>
      {request.status === "draft" ? <p>Jika karyawan bekerja pada periode ini, minta HRD memeriksa dan melengkapi absensi, lalu Finance memilih Simpan &amp; Hitung Ulang sebelum mengajukan.</p> : ["submitted", "approved"].includes(request.status) ? <p>Pendapatan berasal dari gaji pokok dan THR jika diisi, dikurangi potongan manual Finance. {request.status === "submitted" ? "Jika data perlu diperbaiki, Admin dapat menolak dengan catatan agar Finance merevisi dan mengajukan kembali." : "Nominal penggajian ini sudah dikunci sesuai persetujuan Admin."}</p> : <p>Hari hadir × Rp30.000 untuk uang makan, ditambah hari hadir × Rp20.000 untuk transport.</p>}
    </div>}
  </>;
}
