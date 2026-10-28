import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Mail, Printer, RefreshCw, Send, X } from "lucide-react";
import { salaryDate } from "../utils/salaryApi";
import { formatBudgetDate, formatBudgetMonth } from "../utils/budgetApi";

const EMAIL_STATUS = { pending: "Menunggu Pengiriman", sending: "Sedang Dikirim", sent: "Diterima Server Email", failed: "Pengiriman Gagal" };
export default function SalarySlipPreview({ requestId, canPublish, onClose, onUpdated }) {
  const [preview, setPreview] = useState(null);
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const load = useCallback(async signal => {
    setLoading(true); setError("");
    try {
      const response = await axios.get("/api/salary_slips.php", { params: { id: requestId, _t: Date.now() }, signal });
      setPreview(response.data.data); setCsrf(response.data.csrf_token); setChecked(false);
    } catch (err) { if (!axios.isCancel(err)) { setPreview(null); setError(err.response?.data?.message || "Pratinjau slip gagal dimuat."); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [requestId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const act = async action => {
    if (busy) return; setBusy(true); setError("");
    try {
      const response = await axios.post("/api/salary_slips.php", { action, id: requestId, version: preview.salary_version, preview_token: preview.preview_token, checked }, { headers: { "X-CSRF-Token": csrf } });
      setPreview(response.data.data); setChecked(false); await onUpdated();
    } catch (err) { setError(err.response?.data?.message || "Slip gagal diproses. Muat ulang untuk memeriksa statusnya."); }
    finally { setBusy(false); }
  };
  const publication = preview?.publication;
  return <div className="rab-modal-backdrop"><section className="rab-modal salary-slip-modal" role="dialog" aria-modal="true" aria-labelledby="salary-slip-title">
    <div className="rab-modal-heading"><div><p>{preview ? formatBudgetMonth(preview.snapshot.month) : "Penggajian Karyawan"}</p><h2 id="salary-slip-title">Pratinjau Slip Gaji</h2><p>Periksa pendapatan, potongan, gaji bersih, rekening, nomor BPJS, dan email.</p></div><button aria-label="Tutup pratinjau slip" disabled={busy} onClick={onClose}><X size={20} /></button></div>
    <div className="rab-detail-body">
      {error && <div className="rab-error" role="alert">{error}</div>}
      {loading ? <p className="salary-help">Memuat slip gaji…</p> : preview && <>
        <div className="salary-slip-summary"><strong><Mail size={16} />{preview.snapshot.recipient_email || "Email belum diisi"}</strong><p>{preview.snapshot.payment_status === "paid" ? `Transfer dicatat ${salaryDate(preview.snapshot.paid_date)}` : `Disetujui Admin · Menunggu transfer · Jadwal ${salaryDate(preview.snapshot.payday)}`}</p></div>
        {preview.profile_warnings.map(warning => <div className="salary-attendance-note" key={warning}>{warning}</div>)}
        {!preview.email_configured && <div className="salary-payment-note">Pengiriman email kantor belum diaktifkan. Slip tetap dapat diterbitkan ke dashboard karyawan. Minta Admin mengaktifkan email kantor agar slip dapat dikirim.</div>}
        {publication && <div className="salary-slip-delivery"><strong><CheckCircle2 size={16} />Slip tersedia di dashboard karyawan</strong><p>Diperiksa dan diterbitkan {publication.published_by_name} · {formatBudgetDate(publication.published_at)}</p><p>Email: <strong>{EMAIL_STATUS[publication.email_status]}</strong>{publication.email_sent_at && ` · ${formatBudgetDate(publication.email_sent_at)}`}</p>{publication.email_error && <p className="salary-row-issue">{publication.email_error}</p>}</div>}
        <iframe className="salary-slip-document" title="Dokumen slip gaji" sandbox="allow-same-origin" srcDoc={preview.document_html} />
        {!preview.published && canPublish && <label className="salary-slip-check"><input type="checkbox" checked={checked} disabled={busy} onChange={event => setChecked(event.target.checked)} /><span>Saya sudah memeriksa pendapatan, potongan, gaji bersih, rekening, nomor BPJS, dan email. Slip ini sudah benar untuk diterbitkan.</span></label>}
        {publication?.events?.length > 0 && <details className="salary-slip-events"><summary>Riwayat Penerbitan dan Email</summary><ol className="rab-timeline">{publication.events.map((event, index) => <li key={`${event.created_at}:${index}`}><span className="rab-timeline-dot" /><div><strong>{event.note}</strong><p>{event.actor_name} · {formatBudgetDate(event.created_at)}</p></div></li>)}</ol></details>}
      </>}
    </div><div className="rab-modal-footer rab-detail-actions">
      <button className="rab-button" disabled={busy || loading} onClick={() => void load()}><RefreshCw size={15} />Muat Ulang</button>
      {preview && <button className="rab-button" disabled={busy || loading} onClick={() => window.open(`/api/salary_slips.php?id=${requestId}&format=html`, "_blank", "noopener,noreferrer")}><Printer size={15} />Cetak / Simpan PDF</button>}
      {preview && !preview.published && canPublish && <button className="rab-button rab-button-primary" disabled={busy || loading || !checked} onClick={() => void act("publish")}><Send size={15} />{busy ? "Memproses…" : "Terbitkan Slip & Kirim Email"}</button>}
      {publication && canPublish && ["pending", "failed"].includes(publication.email_status) && <button className="rab-button rab-button-primary" disabled={busy || loading || !preview.email_configured} onClick={() => void act("retry_email")}><Mail size={15} />{busy ? "Mengirim…" : publication.email_status === "failed" ? "Coba Kirim Email Lagi" : "Kirim Email"}</button>}
      <button className="rab-button" disabled={busy} onClick={onClose}>Tutup</button>
    </div>
  </section></div>;
}
