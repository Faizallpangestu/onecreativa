import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Banknote, CalendarDays, Clock, CheckCircle2, FileDown, RefreshCw, Search, X } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import Layout from "../components/Layout";
import SalaryRequestDetail from "../components/SalaryRequestDetail";
import SalaryBaseSettings from "../components/SalaryBaseSettings";
import SalaryBreakdown from "../components/SalaryBreakdown";
import SalarySlipPreview from "../components/SalarySlipPreview";
import useSalaryRequests from "../hooks/useSalaryRequests";
import { getSalaryDetail, mutateSalary, previousSalaryMonth, SALARY_STATUS, salaryDate } from "../utils/salaryApi";
import { formatBudgetMoney, formatBudgetMonth } from "../utils/budgetApi";
import { logoutUser } from "../utils/logoutUser";
import "./AnggaranBiaya.css";
import "./SalaryKaryawan.css";

const ACTION_LABEL = { submit: "Ajukan ke Admin", approve: "Setujui Gaji", reject: "Tolak Pengajuan", pay: "Catat Transfer" };
export default function SalaryKaryawan() {
  const navigate = useNavigate(); const [searchParams] = useSearchParams(); const requestedId = searchParams.get("request");
  const [month, setMonth] = useState(previousSalaryMonth); const [all, setAll] = useState(false);
  const [baseSettings, setBaseSettings] = useState(false); const [baseEmployee, setBaseEmployee] = useState(null);
  const [baseRefresh, setBaseRefresh] = useState(0);
  const [slipRequestId, setSlipRequestId] = useState(null);
  const { data, permissions, csrfToken, loading, error, needsLogin, refresh } = useSalaryRequests(month, all);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null); const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState(""); const [notice, setNotice] = useState("");
  const [decision, setDecision] = useState(null); const [note, setNote] = useState(""); const [paidDate, setPaidDate] = useState(""); const [reference, setReference] = useState("");
  useEffect(() => {
    if (!requestedId || (!permissions.can_prepare && !permissions.can_approve)) return;
    let active = true;
    getSalaryDetail(requestedId).then(request => { if (active) setDetail(request); }).catch(err => { if (active) setActionError(err.response?.data?.message || "Rincian gaji gagal dimuat."); });
    return () => { active = false; };
  }, [requestedId, permissions.can_prepare, permissions.can_approve]);
  const requestsByEmployee = new Map(data.requests.map(request => [Number(request.employee_id), request]));
  const previews = all ? [] : data.preview.map(employee => requestsByEmployee.get(Number(employee.employee_id)) || employee);
  const previewIds = new Set(previews.map(row => Number(row.employee_id)));
  const rows = all ? data.requests : [...previews, ...data.requests.filter(request => !previewIds.has(Number(request.employee_id)))];
  const filtered = rows.filter(row => (!status || (row.status || "unprepared") === status) && [row.employee_name, row.employee_code].some(value => value.toLowerCase().includes(search.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10)); const currentPage = Math.min(page, pageCount);
  const displayed = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const total = rows.reduce((sum, row) => sum + Number(row.total_salary), 0);
  const run = async (action, values = {}, request = detail) => {
    if (busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      const saved = await mutateSalary({ action, id: request?.id, version: request?.version, ...values }, csrfToken);
      setDetail(saved); setDecision(null);

      // Sinkronisasi Realisasi ke COA & Pengeluaran Kas ketika Gaji dibayarkan
      if (action === "pay") {
        const totalGaji = Number(saved?.total_salary || request?.total_salary || 0);
        const payDate = values.paid_date || new Date().toISOString().slice(0, 10);
        const refNo = values.transfer_reference || `PAY-${saved?.id || request?.id || Date.now()}`;

        // 1. Potong Saldo Rekening Bank di COA (finance_rekening_data & finance_coa_data)
        try {
          const rekRaw = localStorage.getItem("finance_rekening_data");
          if (rekRaw) {
            const rekList = JSON.parse(rekRaw);
            if (Array.isArray(rekList) && totalGaji > 0) {
              const updatedRekenings = rekList.map(rek => {
                const rekStr = `${rek.nama} ${rek.bank} ${rek.noRek}`.toLowerCase();
                const isPetty = rekStr.includes('petty') || rekStr.includes('kas kecil');
                const isBca = !isPetty && (
                  (rek.bank && rek.bank.toLowerCase().includes('bca')) ||
                  (rek.nama && rek.nama.toLowerCase().includes('bca')) ||
                  (rek.noRek && (rek.noRek.includes('1832-918-428') || rek.noRek.includes('1234567890')))
                );
                if (isBca) {
                  const currentSaldo = Number(rek.saldo) || 0;
                  return { ...rek, saldo: Math.max(0, currentSaldo - totalGaji) };
                }
                return rek;
              });
              localStorage.setItem("finance_rekening_data", JSON.stringify(updatedRekenings));
            }
          }

          // Sinkronkan pemotongan ke akun COA (finance_coa_data)
          const coaRaw = localStorage.getItem("finance_coa_data");
          if (coaRaw) {
            const coaList = JSON.parse(coaRaw);
            if (Array.isArray(coaList) && totalGaji > 0) {
              let bcaCoaFound = false;
              const updatedCoa = coaList.map(coa => {
                const coaStr = `${coa.kode} ${coa.nama} ${coa.rekeningDetail || ''}`.toLowerCase();
                const isPetty = coaStr.includes('petty') || coaStr.includes('kas kecil');
                if (!bcaCoaFound && !isPetty && (coaStr.includes('bca') || coaStr.includes('1832') || coa.kode === '1002')) {
                  bcaCoaFound = true;
                  const currentSaldo = Number(coa.saldo) || 0;
                  return { ...coa, saldo: Math.max(0, currentSaldo - totalGaji) };
                }
                return coa;
              });
              localStorage.setItem("finance_coa_data", JSON.stringify(updatedCoa));
            }
          }
        } catch (e) {
          console.warn("Gagal update saldo rekening & COA penggajian:", e);
        }

        // 2. Simpan ke Riwayat Transaksi Pengeluaran (finance_expense_data)
        try {
          const expRaw = localStorage.getItem("finance_expense_data");
          const expList = expRaw ? JSON.parse(expRaw) : [];
          const newExp = {
            id: `PAYROLL-${saved?.id || request?.id || Date.now()}`,
            nomor: `PAYROLL-${saved?.id || request?.id || 1}`,
            tanggal: payDate,
            kategori: "Gaji Karyawan",
            deskripsi: `Gaji ${saved?.month || request?.month} — ${saved?.employee_name || request?.employee_name} (${refNo})`,
            sumberDana: "BCA",
            nominal: totalGaji,
            status: "Paid",
            vendor: saved?.employee_name || request?.employee_name || "Karyawan LPK",
            salary_request_id: saved?.id || request?.id
          };
          const filteredExp = expList.filter(x => x.id !== newExp.id && x.nomor !== newExp.nomor);
          localStorage.setItem("finance_expense_data", JSON.stringify([newExp, ...filteredExp]));
        } catch (e) {
          console.warn("Gagal sync ke finance_expense_data:", e);
        }
      }

      setNotice(action === "approve" ? `Gaji disetujui. Jadwal transfer ${salaryDate(saved.payday)}.` : action === "pay" ? "Transfer dicatat dan pengeluaran penggajian tersimpan." : "Penggajian berhasil diperbarui.");
      void refresh();
    } catch (err) { setActionError(err.response?.data?.message || "Penggajian gagal diproses."); }
    finally { setBusy(false); }
  };
  const showDetail = async request => {
    if (busy) return; setBusy(true); setActionError(""); setNotice("");
    try { setDetail(await getSalaryDetail(request.id)); } catch (err) { setActionError(err.response?.data?.message || "Rincian gaji gagal dimuat."); } finally { setBusy(false); }
  };
  const openDecision = action => { setActionError(""); setDecision(action); setNote(""); setReference(""); setPaidDate(data.today >= detail.payday ? data.today : detail.payday); };
  const exportData = () => {
    const sheet = XLSX.utils.json_to_sheet(filtered.map(row => ({ "Periode Absensi": row.month, "Tanggal Gajian": row.payday, "NIK": row.employee_code, "Karyawan": row.employee_name,
      "Gaji Pokok": Number(row.base_salary), "Hari Hadir": Number(row.work_days), "Uang Makan": Number(row.meal_allowance), "Uang Transport": Number(row.transport_allowance), "THR / Bonus": Number(row.thr_amount || 0), "Jumlah Pendapatan": Number(row.gross_salary), "BPJS Ketenagakerjaan (3%)": Number(row.bpjs_tk_deduction || 0), "BPJS Kesehatan (1%)": Number(row.bpjs_kes_deduction || 0), "PPh 21 (Pajak TER)": Number(row.pph21_deduction || 0), "Kasbon": Number(row.kasbon_deduction || 0), "Izin / Sakit": Number(row.leave_deduction || 0), "Jumlah Potongan": Number(row.total_deductions || 0), "Gaji Bersih (THP)": Number(row.total_salary), "Catatan Finance": row.adjustment_note || "",
      "Status": SALARY_STATUS[row.status]?.label || "Belum Disiapkan", "Tanggal Transfer": row.paid_date || "", "Referensi Transfer": row.transfer_reference || "" })));
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Penggajian"); XLSX.writeFile(book, `Penggajian_${all ? "Semua" : month}.xlsx`);
  };
  return <Layout appearance="finance"><div className="rab-page salary-page">
    <div className="rab-page-heading"><div><p className="rab-eyebrow">KEUANGAN CREATIVA</p><h1>Penggajian Karyawan</h1><p>Hitung gaji dari absensi, terapkan potongan standar nasional (BPJS &amp; PPh 21), ajukan ke Admin, dan transfer via Bank BCA.</p></div><div className="rab-heading-actions"><button className="rab-button" onClick={() => { setBaseRefresh(value => value + 1); void refresh(); }} disabled={loading}><RefreshCw size={16} />Perbarui</button>{!baseSettings && <button className="rab-button" disabled={!filtered.length} onClick={exportData}><FileDown size={16} />Export</button>}</div></div>
    <div className="salary-policy"><Banknote size={24} /><div><strong>Standar Finansial Nasional: Pendapatan Bruto − Potongan Wajib (BPJS &amp; PPh 21) = Gaji Bersih (THP)</strong><p>Gaji pokok per karyawan + tunjangan makan (Rp30.000/hari) &amp; transport (Rp20.000/hari). Potongan otomatis: BPJS TK 3% (JHT 2% + JP 1% cap Rp10.042.300 sesuai PP 44 &amp; 45/2015), BPJS Kesehatan 1% (cap Rp12.000.000 sesuai Perpres 64/2020), dan PPh 21 TER bulanan (PP 58/2023 &amp; PMK 168/2023), serta kasbon &amp; ketidakhadiran.</p></div></div>
    {(error || actionError) && <div className="rab-error" role="alert">{error || actionError}{needsLogin && <button className="rab-button" onClick={() => { logoutUser(); navigate("/login"); }}>Masuk Kembali</button>}</div>}
    {notice && !baseSettings && <div className="rab-notice" role="status">{notice}</div>}
    {!baseSettings && <div className="rab-stats">
      {[{ label: "Total Gaji Bersih", value: formatBudgetMoney(total), icon: Banknote, color: "blue" }, { label: "Menunggu Admin", value: data.requests.filter(row => row.status === "submitted").length, icon: Clock, color: "amber" }, { label: "Disetujui · Belum Transfer", value: data.requests.filter(row => row.status === "approved").length, icon: CalendarDays, color: "green" }, { label: "Sudah Ditransfer", value: data.requests.filter(row => row.status === "paid").length, icon: CheckCircle2, color: "green" }].map(item => <div className={`rab-stat rab-stat-${item.color}`} key={item.label}><div className="rab-stat-icon"><item.icon size={20} /></div><div><h2>{item.label}</h2><strong>{item.value}</strong><p>{all ? "Seluruh riwayat" : formatBudgetMonth(month)}</p></div></div>)}
    </div>}
    <div className="salary-tabs"><button aria-pressed={!baseSettings && !all} onClick={() => { setBaseSettings(false); setAll(false); setPage(1); }}>Penggajian Bulanan</button><button aria-pressed={baseSettings} onClick={() => { setBaseEmployee(null); setBaseSettings(true); }}>Gaji Pokok</button><button aria-pressed={!baseSettings && all} onClick={() => { setBaseSettings(false); setAll(true); setPage(1); }}>Semua Riwayat</button></div>
    {baseSettings ? <SalaryBaseSettings initialMonth={month} employeeId={baseEmployee} refreshKey={baseRefresh} onSaved={() => void refresh()} /> : <section className="rab-panel"><div className="rab-panel-header"><h2>{all ? "Riwayat Penggajian Karyawan" : `Absensi ${formatBudgetMonth(month)}`}</h2><p>{all ? "Pengajuan, keputusan Admin, dan pembayaran setiap periode." : `Periode ${salaryDate(data.period?.period_start)}–${salaryDate(data.period?.period_end)} · Gajian ${salaryDate(data.period?.payday)}`}</p></div>
      <div className="rab-filters"><label className="rab-search"><Search size={16} /><input aria-label="Cari karyawan" placeholder="Cari nama atau NIK karyawan…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>{!all && <input aria-label="Periode absensi" type="month" min="1900-01" max="2299-12" value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} />}<select aria-label="Filter status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Semua Status</option>{!all && <option value="unprepared">Belum Disiapkan</option>}{Object.entries(SALARY_STATUS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div>
      <div className="rab-table-scroll"><table className="rab-table"><thead><tr><th>Karyawan</th>{all && <th>Periode</th>}<th>Gaji Pokok</th><th>Hari Hadir</th><th>Uang Makan</th><th>Uang Transport</th><th>Jumlah Potongan</th><th>Gaji Bersih</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
        {loading ? <tr><td className="rab-empty" colSpan={all ? 10 : 9}>Memuat data penggajian…</td></tr> : !displayed.length ? <tr><td className="rab-empty" colSpan={all ? 10 : 9}>{all ? "Belum ada riwayat penggajian." : "Tidak ada karyawan atau pengajuan yang sesuai filter."}</td></tr> : displayed.map(row => <tr key={row.id || `employee-${row.employee_id}`}><td><strong>{row.employee_name}</strong><span className="rab-cell-caption">{row.employee_code} · {row.position_name}</span>{row.issue && <span className="salary-row-issue">{row.issue}</span>}</td>{all && <td>{formatBudgetMonth(row.month)}<span className="rab-cell-caption">Gajian {salaryDate(row.payday)}</span></td>}<td>{formatBudgetMoney(row.base_salary)}</td><td>{row.work_days} hari</td><td>{formatBudgetMoney(row.meal_allowance)}</td><td>{formatBudgetMoney(row.transport_allowance)}</td><td>{formatBudgetMoney(row.total_deductions || 0)}</td><td><strong>{formatBudgetMoney(row.total_salary)}</strong></td><td>{row.status ? <span className={`rab-status ${SALARY_STATUS[row.status].className}`}>{SALARY_STATUS[row.status].label}</span> : <span className="rab-status bg-slate-100 text-slate-500">Belum Disiapkan</span>}</td><td>{row.id ? <button className="rab-button" disabled={busy} onClick={() => void showDetail(row)}>Lihat Rincian</button> : permissions.can_prepare ? <button className="rab-button rab-button-primary" disabled={busy || !row.can_prepare} onClick={() => void run("prepare", { employee_id: row.employee_id, month })}>Siapkan Gaji</button> : <span className="rab-cell-caption">Menunggu Finance</span>}</td></tr>)}
      </tbody></table></div><div className="rab-pagination"><span>{filtered.length} karyawan/pengajuan</span><div><button className="rab-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><span>{currentPage} / {pageCount}</span><button className="rab-button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></div></div>
    </section>}
    {detail && !decision && !slipRequestId && <SalaryRequestDetail key={`${detail.id}:${detail.version}`} request={detail} permissions={permissions} busy={busy} today={data.today} error={actionError} onClose={() => setDetail(null)} onRefresh={bank => void run("refresh", bank)} onReopen={() => void run("reopen")} onAction={openDecision} onExpense={() => navigate("/transaksi-pengeluaran")} onSlip={() => setSlipRequestId(detail.id)} onBaseSettings={() => { setMonth(detail.month); setBaseEmployee(Number(detail.employee_id)); setDetail(null); setBaseSettings(true); }} />}
    {decision && detail && <div className="rab-modal-backdrop"><section className="rab-modal rab-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="salary-decision-title"><div className="rab-modal-heading"><h2 id="salary-decision-title">{ACTION_LABEL[decision]}</h2><button disabled={busy} aria-label="Tutup keputusan" onClick={() => setDecision(null)}><X size={20} /></button></div><form onSubmit={event => { event.preventDefault(); void run(decision, { note, ...(decision === "pay" ? { paid_date: paidDate, transfer_reference: reference } : {}) }); }}><div className="rab-form-body"><p className="rab-confirm-description"><strong>{detail.employee_name}</strong> · {formatBudgetMonth(detail.month)}<br />Total {formatBudgetMoney(detail.total_salary)} · Jadwal {salaryDate(detail.payday)}<br />{decision === "approve" ? "Persetujuan menjadwalkan gaji untuk ditransfer Finance." : decision === "pay" ? "Catat setelah transfer bank berhasil. Isi tanggal dan referensi transaksi yang sebenarnya." : decision === "submit" ? "Gaji dan rincian absensi akan dikunci untuk pemeriksaan Admin." : "Finance dapat merevisi pengajuan berdasarkan catatan Anda."}</p><SalaryBreakdown request={detail} explainZeroAttendance />{actionError && <div className="rab-error" role="alert">{actionError}</div>}{decision === "pay" ? <><label>Tanggal Transfer<input required type="date" min={detail.payday > detail.reviewed_at?.slice(0, 10) ? detail.payday : detail.reviewed_at?.slice(0, 10)} max={data.today} value={paidDate} onChange={event => setPaidDate(event.target.value)} /></label><label>Referensi Transfer Bank<input required maxLength={180} value={reference} onChange={event => setReference(event.target.value)} placeholder="Nomor transaksi atau referensi bank" /></label></> : <label>Catatan {decision === "reject" ? "Penolakan (Wajib)" : "(Opsional)"}<textarea required={decision === "reject"} maxLength={2000} rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>}</div><div className="rab-modal-footer rab-detail-actions"><button type="button" className="rab-button" disabled={busy} onClick={() => setDecision(null)}>Batal</button><button className={`rab-button ${decision === "reject" ? "rab-button-danger" : "rab-button-primary"}`} type="submit" disabled={busy}>{busy ? "Memproses…" : ACTION_LABEL[decision]}</button></div></form></section></div>}
    {slipRequestId && <SalarySlipPreview requestId={slipRequestId} canPublish={permissions.can_prepare} onClose={() => setSlipRequestId(null)} onUpdated={async () => { setDetail(await getSalaryDetail(slipRequestId)); await refresh(); }} />}
  </div></Layout>;
}
