import { X, Check, FileText, Send, Ban, Pencil, Copy } from "lucide-react";
import { BUDGET_STATUS, BUDGET_ACTION, budgetReference, formatBudgetMoney, formatBudgetDate, formatBudgetMonth } from "../utils/budgetApi";
import BudgetAttachment from "./BudgetAttachment";

export default function BudgetRequestDetail({ request, permissions, busy, onClose, onEdit, onCopy, onAction, onIncome, onRealize }) {
  const status = BUDGET_STATUS[request.status];
  const own = Number(request.created_by) === Number(permissions.actor_id);
  return (
    <div className="rab-modal-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="rab-detail-title" className="rab-modal">
        <div className="rab-modal-heading"><div><p>{budgetReference(request.id)} · {formatBudgetMonth(request.period)}</p><h2 id="rab-detail-title">{request.title}</h2></div><button onClick={onClose} disabled={busy} aria-label="Tutup rincian"><X size={20} /></button></div>
        <div className="rab-detail-body">
          <div className="rab-detail-meta"><span className={`rab-status ${status.className}`}>{status.label}</span><span>Pengaju: <strong>{request.created_by_name}</strong></span><span>Diajukan: {formatBudgetDate(request.submitted_at)}</span></div>
          {request.notes && <p className="rab-notes">{request.notes}</p>}
          <BudgetAttachment request={request} />
          <div className="rab-table-scroll"><table className="rab-table"><thead><tr><th>Kebutuhan</th><th>Kategori</th><th>Jumlah</th><th>Harga Satuan</th><th>Subtotal</th></tr></thead><tbody>{request.items.map(item => <tr key={item.id}><td>{item.description}</td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td>{formatBudgetMoney(item.unit_price)}</td><td><strong>{formatBudgetMoney(item.total_amount)}</strong></td></tr>)}</tbody></table></div>
          <div className="rab-detail-total"><span>Total RAB</span><strong>{formatBudgetMoney(request.total_amount)}</strong></div>
          {request.reviewed_at && <div className={`rab-decision-note ${request.status === "approved" ? "is-approved" : ""}`}><strong>{status.label} oleh {request.reviewed_by_name}</strong><span>{formatBudgetDate(request.reviewed_at)}</span>{request.review_note && <p>{request.review_note}</p>}</div>}
          {request.finance_record_id && <button className="rab-income-link" onClick={onIncome}><FileText size={18} />Catatan Approval Historis #{request.finance_record_id}<span>Review nonkas →</span></button>}
          {request.approved_amount!=null&&<div className="rab-detail-total"><span>Disetujui / Komitmen / Realisasi / Sisa</span><strong>{formatBudgetMoney(request.approved_amount)} / {formatBudgetMoney(request.committed_amount)} / {formatBudgetMoney(request.realized_amount)} / {formatBudgetMoney(request.remaining_amount)}</strong></div>}
          <h3 className="rab-history-title">Riwayat Pengajuan</h3>
          <ol className="rab-timeline">{request.history.map(event => {
            let snapshot = null;
            try { snapshot = JSON.parse(event.snapshot_json); } catch { /* Older history may not include a snapshot. */ }
            return <li key={event.id}><span className="rab-timeline-dot" /><div><strong>{BUDGET_ACTION[event.action] || event.action}</strong><p>{event.actor_name} · {formatBudgetDate(event.created_at)}</p>{event.note && <p className="rab-history-note">{event.note}</p>}{snapshot && <details><summary>Lihat rincian saat {BUDGET_ACTION[event.action]?.toLowerCase() || event.action}</summary><p>{snapshot.title} · {formatBudgetMonth(snapshot.period)} · {formatBudgetMoney(snapshot.total_amount)}</p><ul>{snapshot.items.map((item, index) => <li key={index}>{item.description}: {item.quantity} {item.unit} × {formatBudgetMoney(item.unit_price)} = {formatBudgetMoney(item.total_amount)}</li>)}</ul>{snapshot.notes && <p>{snapshot.notes}</p>}<BudgetAttachment request={snapshot} requestId={request.id} /></details>}</div></li>;
          })}</ol>
        </div>
        <div className="rab-modal-footer rab-detail-actions">
          {permissions.can_submit && own && request.status === "draft" && <><button disabled={busy} className="rab-button" onClick={onEdit}><Pencil size={16} />Edit Draft</button><button disabled={busy} className="rab-button rab-button-primary" onClick={() => onAction("submit")}><Send size={16} />Ajukan ke Admin</button></>}
          {permissions.can_submit && own && ["draft", "submitted"].includes(request.status) && <button disabled={busy} className="rab-button rab-button-danger" onClick={() => onAction("cancel")}><Ban size={16} />Batalkan</button>}
          {permissions.can_submit && ["rejected", "cancelled"].includes(request.status) && <button disabled={busy} className="rab-button rab-button-primary" onClick={onCopy}><Copy size={16} />Buat Pengajuan Baru</button>}
          {permissions.can_approve && ["submitted","under_review"].includes(request.status) && !own && <><button disabled={busy} className="rab-button" onClick={() => onAction("review")}>Mulai Review</button><button disabled={busy} className="rab-button" onClick={() => onAction("return_revision")}>Kembalikan untuk Revisi</button><button disabled={busy} className="rab-button rab-button-danger" onClick={() => onAction("reject")}><X size={16} />Tolak</button><button disabled={busy} className="rab-button rab-button-primary" onClick={() => onAction("approve")}><Check size={16} />Setujui RAB</button></>}
          {["approved","partially_realized","fully_realized"].includes(request.status)&&request.approved_amount!=null&&(permissions.can_submit||permissions.can_approve)&&<button className="rab-button rab-button-primary" disabled={busy} onClick={onRealize}>Komitmen & Realisasi</button>}
          <button className="rab-button" disabled={busy} onClick={onClose}>Tutup</button>
        </div>
      </section>
    </div>
  );
}
