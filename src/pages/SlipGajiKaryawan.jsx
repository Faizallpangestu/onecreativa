import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, FileText, Printer, RefreshCw, Wallet } from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import { formatBudgetDate, formatBudgetMoney, formatBudgetMonth } from "../utils/budgetApi";
import { previousSalaryMonth, salaryDate } from "../utils/salaryApi";
import "./AnggaranBiaya.css";
import "./SalaryKaryawan.css";

const isPaid = slip => (slip.payment_status || "paid") === "paid";
export default function SlipGajiKaryawan() {
  const [params] = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(() => /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get("month") || "") ? params.get("month") : "");
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async signal => {
    setLoading(true); setError("");
    try {
      // The server resolves the employee from the authenticated session.
      const response = await api.get("/payroll.php", { params: { all: 1, _t: Date.now() }, signal });
      setSlips(response.data.data);
    } catch (err) { if (!signal?.aborted) { setSlips([]); setError(err.response?.data?.message || "Slip gaji gagal dimuat."); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController(); void load(controller.signal);
    const reload = () => { if (document.visibilityState === "visible") void load(controller.signal); };
    window.addEventListener("focus", reload);
    return () => { controller.abort(); window.removeEventListener("focus", reload); };
  }, [load]);
  const month = selectedMonth || slips[0]?.month || previousSalaryMonth();
  const slip = slips.find(row => row.month === month);
  const print = () => { if (slip?.salary_request_id) window.open(`/api/salary_slips.php?id=${slip.salary_request_id}&format=html`, "_blank", "noopener,noreferrer"); else window.print(); };
  return <Layout hideMobileHeader hideBottomNav><div className="rab-page salary-page employee-slip-page">
    <div className="rab-page-heading"><div><p className="rab-eyebrow">KARYAWAN CREATIVA</p><h1>Slip Gaji Elektronik</h1><p>Slip yang sudah diperiksa dan diterbitkan Finance tersedia di sini.</p></div><button className="rab-button" disabled={loading} onClick={() => void load()}><RefreshCw size={16} />Perbarui</button></div>
    {error && <div className="rab-error" role="alert">{error}</div>}
    <div className="employee-slip-grid"><section className="rab-panel">
      <div className="rab-panel-header"><h2><CalendarDays size={18} />Riwayat Slip Gaji</h2><p>Pilih periode absensi untuk melihat rincian gaji.</p></div>
      <div className="employee-slip-history">{loading ? <p className="salary-help">Memuat riwayat slip…</p> : !slips.length ? <p className="salary-help">Belum ada slip yang diterbitkan Finance.</p> : slips.map(row => <button key={`${row.month}:${row.id}`} aria-pressed={month === row.month} onClick={() => setSelectedMonth(row.month)}><div><strong>{formatBudgetMonth(row.month)}</strong><span>{formatBudgetMoney(row.total_salary)}</span></div><span className={`rab-status ${isPaid(row) ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{isPaid(row) ? "Sudah Ditransfer" : "Menunggu Transfer"}</span></button>)}</div>
    </section><section className="rab-panel employee-slip-preview">
      <div className="rab-panel-header employee-slip-document-heading"><div><h2><FileText size={18} />Slip {formatBudgetMonth(month)}</h2><p>{slip ? `Diterbitkan ${formatBudgetDate(slip.published_at)}` : "Rincian slip gaji karyawan"}</p></div><button className="rab-button" disabled={!slip || loading} onClick={print}><Printer size={16} />Cetak / Simpan PDF</button></div>
      {loading ? <p className="rab-empty">Memuat slip gaji…</p> : !slip ? <p className="rab-empty">Belum ada slip untuk periode ini.</p> : <>
        <div className="employee-slip-payment"><Wallet size={20} /><div><strong>{isPaid(slip) ? "Sudah Ditransfer" : "Disetujui Admin · Menunggu Transfer"}</strong><p>{isPaid(slip) ? `Transfer ${salaryDate(slip.paid_date || slip.published_at)}${slip.transfer_reference ? ` · ${slip.transfer_reference}` : ""}` : `Jadwal gajian ${salaryDate(slip.payday)}. Penerbitan slip belum menandakan uang telah ditransfer.`}</p></div></div>
        {slip.salary_request_id ? <iframe className="salary-slip-document" title="Slip gaji karyawan" src={`/api/salary_slips.php?id=${slip.salary_request_id}&format=html`} /> : <LegacySlip slip={slip} />}
        <p className="salary-help employee-slip-print-help">Untuk menyimpan PDF, buka dokumen melalui tombol Cetak / Simpan PDF lalu pilih cetak ke PDF di browser.</p>
      </>}
    </section></div>
  </div></Layout>;
}

function LegacySlip({ slip }) {
  return <div className="employee-legacy-slip"><h2>PT. CREATIVA BRIDGING INTERNATIONAL</h2><p>Slip Gaji · {formatBudgetMonth(slip.month)}</p><h3>{slip.name} · {slip.nik}</h3><p>{slip.position}</p><table className="rab-table"><tbody>{[
    ["Gaji Pokok", slip.base_salary], ["Uang Makan", slip.uang_makan || 0], ["Uang Transport", slip.uang_transport || 0], ["Lembur", slip.lembur || 0],
    ["Potongan Terlambat", slip.potongan || 0], ["BPJS Kesehatan", slip.bpjs_kes || 0], ["BPJS Ketenagakerjaan", slip.bpjs_tk || 0], ["PPh 21", slip.pph21 || 0], ["Total Potongan", slip.total_potongan || 0], ["Total Gaji", slip.total_salary],
  ].map(([label, amount]) => <tr key={label}><td>{label}</td><td>{formatBudgetMoney(amount)}</td></tr>)}</tbody></table><p className="salary-help">Slip dari arsip penggajian sebelumnya.</p></div>;
}
