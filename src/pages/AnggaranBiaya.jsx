import { logoutUser } from "../utils/logoutUser";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, FileDown, RefreshCw, FileText, Clock, CheckCircle2, XCircle, X } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import Layout from "../components/Layout";
import BudgetRealizationForm from "../components/BudgetRealizationForm";
import BudgetRequestForm from "../components/BudgetRequestForm";
import BudgetRequestDetail from "../components/BudgetRequestDetail";
import useBudgetRequests from "../hooks/useBudgetRequests";
import { BUDGET_STATUS, budgetReference, formatBudgetMoney, formatBudgetMonth, formatBudgetDate, getBudgetDetail, mutateBudget } from "../utils/budgetApi";
import "./AnggaranBiaya.css";

const ACTION_LABELS = {review:"Mulai Review",return_revision:"Kembalikan untuk Revisi", approve: "Setujui RAB", reject: "Tolak RAB", submit: "Ajukan RAB", cancel: "Batalkan RAB" };

export default function AnggaranBiaya() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("request");
  const [month, setMonth] = useState("");
  const [monthBy, setMonthBy] = useState("period");
  const { requests, permissions, csrfToken, isLoading, error, needsLogin, updatedAt, refresh } = useBudgetRequests(month, monthBy);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [realizing,setRealizing]=useState(false);
  const [approvedItems,setApprovedItems]=useState({});
  const [decision, setDecision] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!requestedId || (!permissions.can_submit && !permissions.can_approve)) return;
    let active = true;
    getBudgetDetail(requestedId).then(request => { if (active) setDetail(request); })
      .catch(err => { if (active) setActionError(err.response?.data?.message || "Rincian RAB gagal dimuat."); });
    return () => { active = false; };
  }, [requestedId, permissions.can_submit, permissions.can_approve]);

  const filtered = requests.filter(request => (!statusFilter || request.status === statusFilter) &&
    [request.title, request.created_by_name, budgetReference(request.id)].some(value => value.toLowerCase().includes(search.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const sum = status => requests.filter(request => !status || (status==="approved" ? ["approved","partially_realized","fully_realized","closed"].includes(request.status) : request.status === status)).reduce((total, request) => total + Number(status==="approved" ? request.approved_amount??request.total_amount : request.total_amount), 0);
  const monthlyHistory = Object.values(requests.reduce((groups, request) => {
    const key = request.period.slice(0, 7);
    groups[key] ||= { period: key, count: 0, submitted: 0, approved: 0, approvedTotal: 0, total: 0 };
    groups[key].count++;
    groups[key].total += Number(request.total_amount);
    if (["submitted","under_review"].includes(request.status)) groups[key].submitted++;
    if (["approved","partially_realized","fully_realized","closed"].includes(request.status)) { groups[key].approved++; groups[key].approvedTotal += Number(request.approved_amount??request.total_amount); }
    return groups;
  }, {})).sort((a, b) => b.period.localeCompare(a.period));

  const showDetail = async request => {
    if (busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try { setDetail(await getBudgetDetail(request.id)); }
    catch (err) { setActionError(err.response?.data?.message || "Rincian RAB gagal dimuat."); }
    finally { setBusy(false); }
  };
  const save = async values => {
    if (busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      const saved = await mutateBudget({ ...values, action: values.id ? "save" : "create" }, csrfToken);
      setForm(null); setDetail(saved);
      setNotice(saved.status === "submitted" ? "RAB telah diajukan. Menunggu persetujuan Admin." : "Draft RAB tersimpan.");
      void refresh();
    } catch (err) { setActionError(err.response?.data?.message || "RAB gagal disimpan."); }
    finally { setBusy(false); }
  };
  const decide = async event => {
    event.preventDefault();
    if (busy || !detail) return;
    setBusy(true); setActionError("");
    try {
      const saved = await mutateBudget({ action: decision, id: detail.id, version: detail.version, note: reviewNote, ...(decision === "approve" ? {approved_items: approvedItems} : {}) }, csrfToken);
      setDetail(saved); setDecision(null);
      setNotice(decision === "approve" ? "RAB disetujui sebagai otorisasi anggaran. Realisasi dan pembayaran dicatat terpisah." : "Status RAB berhasil diperbarui.");
      void refresh();
    } catch (err) { setActionError(err.response?.data?.message || "Keputusan gagal disimpan."); }
    finally { setBusy(false); }
  };
  const openForm = initial => { setDetail(null); setActionError(""); setNotice(""); setForm(initial || {}); };
  const openDecision = action => { setApprovedItems(Object.fromEntries(detail.items.map(i=>[i.id,i.total_amount]))); setDecision(action); setReviewNote(""); setActionError(""); };
  const clearFilters = () => { setMonth(""); setStatusFilter(""); setSearch(""); setPage(1); };
  const exportHistory = () => {
    const headers = ["Nomor RAB", "Judul", "Periode RAB", "Pengaju", "Tanggal Dibuat", "Tanggal Pengajuan", "Status", "Total (Rp)", "Admin", "Tanggal Keputusan", "Catatan Keputusan", "Catatan Approval Historis"];
    const data = filtered.map(request => [budgetReference(request.id), request.title, request.period.slice(0, 7), request.created_by_name, request.created_at, request.submitted_at || "", BUDGET_STATUS[request.status].label, Number(request.total_amount), request.reviewed_by_name || "", request.reviewed_at || "", request.review_note || "", request.finance_record_id || ""]);
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    sheet["!cols"] = headers.map((_, index) => ({ wch: index === 1 || index === 10 ? 36 : 20 }));
    XLSX.utils.book_append_sheet(workbook, sheet, "Riwayat RAB");
    XLSX.writeFile(workbook, `Riwayat_RAB_${month || "Semua_Periode"}.xlsx`);
  };

  return (
    <Layout>
      <div className="rab-page">
        <div className="rab-page-heading">
          <div><span className="rab-eyebrow">KEUANGAN CREATIVA</span><h1>Anggaran & RAB Kantor</h1><p>Finance mengajukan kebutuhan kantor. Admin memeriksa dan menyetujui pendanaannya.</p></div>
          <div className="rab-heading-actions"><button className="rab-button" disabled={isLoading} onClick={refresh}><RefreshCw size={16} />Perbarui</button><button className="rab-button" disabled={!filtered.length || !!error} onClick={exportHistory}><FileDown size={16} />Export Riwayat</button>{permissions.can_submit && <button className="rab-button rab-button-primary" disabled={busy || !!error} onClick={() => openForm()}><Plus size={17} />Buat RAB</button>}</div>
        </div>
        <div className="rab-flow"><span><FileText size={16} />1. Rincian kebutuhan</span><i>→</i><span><Clock size={16} />2. Pengajuan Finance</span><i>→</i><span><CheckCircle2 size={16} />3. Persetujuan Admin</span><i>→</i><span>4. Komitmen & Realisasi</span></div>
        {error && <div className="rab-error" role="alert">{error}{needsLogin && <button className="rab-button" onClick={() => { logoutUser(); navigate("/login?redirect=/anggaran"); }}>Masuk Kembali</button>}</div>}
        {actionError && !form && !decision && <div className="rab-error" role="alert">{actionError}</div>}
        {notice && <div className="rab-success" role="status">{notice}</div>}
        <div className="rab-stats">
          {[{ label: "Total RAB", value: sum(), count: requests.length, icon: FileText, tone: "blue" }, { label: "Menunggu Persetujuan", value: sum("submitted"), count: requests.filter(item => item.status === "submitted").length, icon: Clock, tone: "amber" }, { label: "Anggaran Disetujui", value: sum("approved"), count: requests.filter(item => item.status === "approved").length, icon: CheckCircle2, tone: "green" }, { label: "Pengajuan Ditolak", value: sum("rejected"), count: requests.filter(item => item.status === "rejected").length, icon: XCircle, tone: "rose" }].map(card => { const Icon = card.icon; return <section className={`rab-stat rab-stat-${card.tone}`} key={card.label}><span className="rab-stat-icon"><Icon size={21} /></span><h2>{card.label}</h2><strong>{error ? "—" : formatBudgetMoney(card.value)}</strong><p>{error ? "Data belum tersedia" : `${card.count} pengajuan`}</p></section>; })}
        </div>

        <section className="rab-panel">
          <div className="rab-panel-header"><div><h2>Riwayat Seluruh Pengajuan</h2><p>{updatedAt ? `Diperbarui ${updatedAt.toLocaleTimeString("id-ID")}` : "Data dari pengajuan tersimpan"}</p></div></div>
          <div className="rab-filters">
            <label className="rab-search"><Search size={17} /><input placeholder="Cari judul, nomor RAB, atau pengaju…" aria-label="Cari pengajuan RAB" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
            <select aria-label="Jenis filter bulan" value={monthBy} onChange={event => { setMonthBy(event.target.value); setPage(1); }}><option value="period">Periode RAB</option><option value="submitted">Bulan Pengajuan</option></select>
            <input type="month" aria-label="Filter bulan" value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} />
            <select aria-label="Filter status RAB" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }}><option value="">Semua Status</option>{Object.entries(BUDGET_STATUS).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}</select>
            {(month || statusFilter || search) && <button className="rab-button" onClick={clearFilters}>Semua Riwayat</button>}
          </div>
          <div className="rab-table-scroll"><table className="rab-table"><thead><tr><th>Pengajuan</th><th>Periode RAB</th><th>Pengaju</th><th>Diajukan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
            {isLoading ? <tr><td className="rab-empty" colSpan={7}>Memuat riwayat RAB…</td></tr> : error ? <tr><td className="rab-empty" colSpan={7}>Riwayat belum dapat dimuat. Perbarui atau masuk kembali.</td></tr> : rows.length ? rows.map(request => <tr key={request.id}><td><strong>{request.title}</strong><span className="rab-cell-caption">{budgetReference(request.id)}{request.finance_record_id ? ` · Pemasukan #${request.finance_record_id}` : ""}</span></td><td>{formatBudgetMonth(request.period)}</td><td>{request.created_by_name}</td><td>{formatBudgetDate(request.submitted_at)}</td><td><strong>{formatBudgetMoney(request.total_amount)}</strong></td><td><span className={`rab-status ${BUDGET_STATUS[request.status].className}`}>{BUDGET_STATUS[request.status].label}</span></td><td><button className="rab-button rab-button-small" disabled={busy} onClick={() => showDetail(request)}>Rincian & Riwayat</button></td></tr>) : <tr><td colSpan={7} className="rab-empty">Belum ada pengajuan{month || statusFilter || search ? " yang sesuai filter." : ". Finance dapat membuat RAB pertama."}</td></tr>}
          </tbody></table></div>
          <div className="rab-pagination"><span>{filtered.length} pengajuan{month ? ` pada ${formatBudgetMonth(month)}` : " · semua bulan"}</span><div><button className="rab-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><span>{currentPage} / {pageCount}</span><button className="rab-button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></div></div>
        </section>

        <section className="rab-panel"><div className="rab-panel-header"><div><h2>Ringkasan per Bulan RAB</h2><p>Jumlah pengajuan dan anggaran yang disetujui pada setiap periode RAB.</p></div></div><div className="rab-table-scroll"><table className="rab-table"><thead><tr><th>Bulan RAB</th><th>Pengajuan</th><th>Total RAB</th><th>Menunggu Admin</th><th>Disetujui</th><th>Anggaran Disetujui</th><th>Riwayat</th></tr></thead><tbody>{!monthlyHistory.length ? <tr><td className="rab-empty" colSpan={7}>{error ? "Data belum dapat dimuat." : "Ringkasan akan muncul setelah RAB dibuat."}</td></tr> : monthlyHistory.map(group => <tr key={group.period}><td><strong>{formatBudgetMonth(group.period)}</strong></td><td>{group.count}</td><td>{formatBudgetMoney(group.total)}</td><td>{group.submitted}</td><td>{group.approved}</td><td><strong>{formatBudgetMoney(group.approvedTotal)}</strong></td><td><button className="rab-button rab-button-small" onClick={() => { setMonthBy("period"); setMonth(group.period); setStatusFilter(""); setSearch(""); setPage(1); }}>Lihat Bulan Ini</button></td></tr>)}</tbody></table></div></section>

        {form && <BudgetRequestForm initial={form} saving={busy} error={actionError} onSave={save} onClose={() => { setForm(null); setActionError(""); }} />}
        {detail && !form && !decision && !realizing && <BudgetRequestDetail request={detail} permissions={permissions} busy={busy} onClose={() => setDetail(null)} onEdit={() => openForm(detail)} onCopy={() => openForm({ ...detail, copy_attachment_from: detail.id, id: undefined, version: undefined })} onAction={openDecision} onRealize={()=>setRealizing(true)} onIncome={() => navigate("/transaksi-pemasukan")} />}
        {realizing&&detail&&<BudgetRealizationForm budget={detail} onClose={()=>setRealizing(false)} onSaved={async()=>{setDetail(await getBudgetDetail(detail.id));void refresh();}}/>}
        {decision && detail && <div className="rab-modal-backdrop"><section className="rab-modal rab-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="rab-decision-title"><div className="rab-modal-heading"><h2 id="rab-decision-title">{ACTION_LABELS[decision]}</h2><button disabled={busy} aria-label="Tutup konfirmasi" onClick={() => setDecision(null)}><X size={20} /></button></div><form onSubmit={decide}><div className="rab-detail-body">{actionError && <div role="alert" className="rab-error">{actionError}</div>}<p><strong>{budgetReference(detail.id)} · {detail.title}</strong></p><div className="rab-detail-total"><span>Total Pengajuan</span><strong>{formatBudgetMoney(detail.total_amount)}</strong></div><p className="rab-confirm-description">{decision === "approve" ? "Persetujuan menetapkan batas anggaran item. Approval tidak membuat kas masuk, pendapatan, beban, atau jurnal." : decision === "submit" ? "Rincian dikunci setelah diajukan dan hanya Admin yang dapat menyetujui." : decision === "cancel" ? "Pengajuan dibatalkan dan tetap tersimpan dalam riwayat." : "Pengajuan yang ditolak tetap tersimpan tanpa membuat transaksi pemasukan."}</p>{decision==="approve"&&detail.items.map(item=><label key={item.id}>{item.description} - Diajukan {formatBudgetMoney(item.total_amount)}<input required type="number" min="0" max={item.total_amount} step="0.01" value={approvedItems[item.id]??""} onChange={e=>setApprovedItems({...approvedItems,[item.id]:e.target.value})}/></label>)}<label>Catatan {["reject","return_revision"].includes(decision) ? "(wajib)" : "(opsional)"}<textarea rows={3} maxLength={2000} required={["reject","return_revision"].includes(decision)} value={reviewNote} onChange={event => setReviewNote(event.target.value)} /></label></div><div className="rab-modal-footer"><button type="button" className="rab-button" disabled={busy} onClick={() => setDecision(null)}>Kembali</button><button type="submit" className={`rab-button ${["reject", "cancel"].includes(decision) ? "rab-button-danger" : "rab-button-primary"}`} disabled={busy}>{busy ? "Memproses…" : ACTION_LABELS[decision]}</button></div></form></section></div>}
      </div>
    </Layout>
  );
}
