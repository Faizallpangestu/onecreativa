import { logoutUser } from "../utils/logoutUser";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Search, FileDown, RefreshCw, FileText, Clock,
  CheckCircle2, XCircle, X, ShieldCheck, Pencil, Trash2, Eye
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx-js-style";
import Layout from "../components/Layout";
import BudgetRequestForm from "../components/BudgetRequestForm";
import BudgetRequestDetail from "../components/BudgetRequestDetail";
import useBudgetRequests from "../hooks/useBudgetRequests";
import {
  BUDGET_STATUS, budgetReference, formatBudgetMoney,
  formatBudgetMonth, formatBudgetDate, getBudgetDetail, mutateBudget
} from "../utils/budgetApi";
import "./AnggaranBiaya.css";

const ACTION_LABELS = {
  review: "Mulai Review",
  return_revision: "Kembalikan untuk Revisi",
  approve: "Setujui RAB",
  reject: "Tolak RAB",
  submit: "Ajukan RAB",
  cancel: "Batalkan RAB"
};

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
  const [approvedItems, setApprovedItems] = useState({});
  const [decision, setDecision] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!requestedId) return;
    let active = true;
    getBudgetDetail(requestedId)
      .then(request => { if (active) setDetail(request); })
      .catch(err => { if (active) setActionError(err.response?.data?.message || "Rincian RAB gagal dimuat."); });
    return () => { active = false; };
  }, [requestedId]);

  // Filter Data Anggaran
  const filtered = useMemo(() => {
    return requests.filter(request => {
      const matchStatus = !statusFilter || request.status === statusFilter;
      const matchSearch = [
        request.title || "",
        request.created_by_name || "",
        request.department_name || "",
        budgetReference(request.id)
      ].some(val => val.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  const sum = (status) => requests
    .filter(request => !status || (status === "approved" ? ["approved", "partially_realized", "fully_realized", "closed"].includes(request.status) : request.status === status))
    .reduce((total, request) => total + Number(status === "approved" ? (request.approved_amount ?? request.total_amount) : request.total_amount), 0);

  const monthlyHistory = useMemo(() => {
    return Object.values(requests.reduce((groups, request) => {
      const key = (request.period || "").slice(0, 7);
      if (!key) return groups;
      groups[key] ||= { period: key, count: 0, submitted: 0, approved: 0, approvedTotal: 0, total: 0 };
      groups[key].count++;
      groups[key].total += Number(request.total_amount || 0);
      if (["submitted", "under_review"].includes(request.status)) groups[key].submitted++;
      if (["approved", "partially_realized", "fully_realized", "closed"].includes(request.status)) {
        groups[key].approved++;
        groups[key].approvedTotal += Number(request.approved_amount ?? request.total_amount ?? 0);
      }
      return groups;
    }, {})).sort((a, b) => b.period.localeCompare(a.period));
  }, [requests]);

  const showDetail = async (request) => {
    if (busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try { setDetail(await getBudgetDetail(request.id)); }
    catch (err) { setActionError(err.response?.data?.message || "Rincian RAB gagal dimuat."); }
    finally { setBusy(false); }
  };

  const save = async (values) => {
    if (busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      const isEdit = Boolean(values.id);
      const targetAction = isEdit ? "save" : (values.submit ? "submit" : "create");
      const saved = await mutateBudget({ ...values, action: targetAction }, csrfToken);
      setForm(null);
      setDetail(saved);
      void refresh();
      Swal.fire({
        icon: "success",
        title: isEdit ? "✓ Perubahan Tersimpan!" : "✓ Anggaran Berhasil Dibuat!",
        text: isEdit ? `Perubahan pada anggaran "${saved.title}" telah diperbarui.` : `Anggaran "${saved.title}" telah tersimpan di sistem.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setActionError(err.response?.data?.message || "Anggaran/RAB gagal disimpan.");
    } finally {
      setBusy(false);
    }
  };

  const handleEditBudget = (request) => {
    openForm(request);
  };

  const handleDeleteBudget = async (request) => {
    const result = await Swal.fire({
      title: "Hapus Anggaran Ini?",
      html: `
        <div style="font-size: 13px; text-align: left; line-height: 1.6; color: #334155;">
          <p><strong>Judul:</strong> ${request.title}</p>
          <p><strong>Nomor RAB:</strong> ${budgetReference(request.id)}</p>
          <p><strong>Pagu Anggaran:</strong> ${formatBudgetMoney(request.total_amount)}</p>
          <p style="margin-top: 8px; color: #e11d48; font-weight: 600;">Pagu anggaran ini akan dihapus dari sistem.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      reverseButtons: true
    });

    if (result.isConfirmed) {
      const targetId = request.id;

      // 1. Remove from custom_saved_budgets
      const customBudgets = JSON.parse(localStorage.getItem("custom_saved_budgets") || "[]");
      const filteredCustom = customBudgets.filter(b => String(b.id) !== String(targetId));
      localStorage.setItem("custom_saved_budgets", JSON.stringify(filteredCustom));

      // 2. Track in deleted_budget_ids
      const deletedIds = JSON.parse(localStorage.getItem("deleted_budget_ids") || "[]");
      if (!deletedIds.includes(targetId)) {
        deletedIds.push(targetId);
        localStorage.setItem("deleted_budget_ids", JSON.stringify(deletedIds));
      }

      // 3. Try backend call
      try {
        await mutateBudget({ action: "cancel", id: targetId }, csrfToken);
      } catch (err) {}

      // 4. Refresh data
      void refresh();

      Swal.fire({
        icon: "success",
        title: "Anggaran Dihapus",
        text: `Data anggaran "${request.title}" berhasil dihapus.`,
        timer: 1800,
        showConfirmButton: false
      });
    }
  };

  const decide = async (event) => {
    event.preventDefault();
    if (busy || !detail) return;
    setBusy(true); setActionError("");
    try {
      const saved = await mutateBudget({
        action: decision,
        id: detail.id,
        version: detail.version,
        note: reviewNote,
        ...(decision === "approve" ? { approved_items: approvedItems } : {})
      }, csrfToken);
      setDetail(saved); setDecision(null);
      setNotice(decision === "approve" ? "Anggaran/RAB disetujui sebagai otorisasi pagu. Realisasi dapat dipantau di menu Realisasi." : "Status Anggaran/RAB berhasil diperbarui.");
      void refresh();
    } catch (err) { setActionError(err.response?.data?.message || "Keputusan gagal disimpan."); }
    finally { setBusy(false); }
  };

  const openForm = (initial) => {
    setDetail(null);
    setActionError("");
    setNotice("");
    setForm(initial || {});
  };

  const openDecision = (action) => {
    setApprovedItems(Object.fromEntries((detail.items || []).map(i => [i.id, i.total_amount])));
    setDecision(action);
    setReviewNote("");
    setActionError("");
  };

  const clearFilters = () => { setMonth(""); setStatusFilter(""); setSearch(""); setPage(1); };

  const exportHistory = () => {
    const headers = ["Nomor RAB", "Judul Anggaran", "Departemen", "Periode", "Pengaju", "Tanggal Dibuat", "Tanggal Pengajuan", "Status", "Total Pagu (Rp)", "Admin/Approver", "Tanggal Keputusan", "Catatan"];
    const data = filtered.map(request => [
      budgetReference(request.id),
      request.title,
      request.department_name || "Operasional",
      request.period ? request.period.slice(0, 7) : "-",
      request.created_by_name || "Finance",
      request.created_at || "-",
      request.submitted_at || "-",
      BUDGET_STATUS[request.status]?.label || request.status,
      Number(request.total_amount || 0),
      request.reviewed_by_name || "-",
      request.reviewed_at || "-",
      request.review_note || "-"
    ]);
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    sheet["!cols"] = headers.map((_, index) => ({ wch: index === 1 || index === 11 ? 36 : 20 }));
    XLSX.utils.book_append_sheet(workbook, sheet, "Riwayat Pagu Anggaran");
    XLSX.writeFile(workbook, `Pagu_Anggaran_${month || "Semua_Periode"}.xlsx`);
  };

  return (
    <Layout>
      <div className="rab-page">
        {/* ── TOP HEADER ── */}
        <div className="rab-page-heading">
          <div>
            <span className="rab-eyebrow">MODUL BUDGETING & PERENCANAAN BIAYA</span>
            <h1>Pagu Anggaran & RAB Kantor</h1>
            <p>Perencanaan plafon pagu anggaran (RAB), rincian kebutuhan per departemen, dan proses otorisasi persetujuan biaya manajemen.</p>
          </div>
          <div className="rab-heading-actions">
            <button className="rab-button" disabled={isLoading} onClick={refresh}>
              <RefreshCw size={16} /> Perbarui
            </button>
            <button className="rab-button" disabled={!filtered.length || !error} onClick={exportHistory}>
              <FileDown size={16} /> Export Laporan
            </button>
            {/* Tombol Tambah Anggaran: Selalu aktif dan terlihat */}
            <button
              className="rab-button rab-button-primary cursor-pointer shadow-sm hover:shadow"
              disabled={busy}
              onClick={() => openForm()}
              title="Buat rencana anggaran / RAB baru"
            >
              <Plus size={18} /> Tambah Anggaran
            </button>
          </div>
        </div>

        {/* ── ALUR KEUANGAN RESMI ── */}
        <div className="rab-flow">
          <span><FileText size={16} /> 1. Perencanaan Pagu & Kebutuhan</span>
          <i>→</i>
          <span><Clock size={16} /> 2. Pengajuan Anggaran (Finance/Divisi)</span>
          <i>→</i>
          <span><CheckCircle2 size={16} /> 3. Otorisasi & Persetujuan (Admin/CFO)</span>
          <i>→</i>
          <span className="text-slate-400">4. Realisasi Pengeluaran (Buka Menu Realisasi)</span>
        </div>

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className="rab-error" role="alert">
            <span>{error}</span>
            {needsLogin && (
              <button className="rab-button rab-button-small" onClick={() => { logoutUser(); navigate("/login?redirect=/anggaran"); }}>
                Masuk Kembali
              </button>
            )}
          </div>
        )}
        {actionError && !form && !decision && <div className="rab-error" role="alert">{actionError}</div>}
        {notice && <div className="rab-success" role="status">{notice}</div>}

        {/* ── 4 STAT CARDS (PAGU ANGGARAN RIIL) ── */}
        <div className="rab-stats">
          {[
            { label: "Total Pagu Diajukan", value: sum(), count: requests.length, icon: FileText, tone: "blue" },
            { label: "Menunggu Persetujuan", value: sum("submitted"), count: requests.filter(item => item.status === "submitted").length, icon: Clock, tone: "amber" },
            { label: "Anggaran Disetujui (Pagu Sah)", value: sum("approved"), count: requests.filter(item => ["approved", "partially_realized", "fully_realized", "closed"].includes(item.status)).length, icon: CheckCircle2, tone: "green" },
            { label: "Pengajuan Ditolak", value: sum("rejected"), count: requests.filter(item => item.status === "rejected").length, icon: XCircle, tone: "rose" }
          ].map(card => {
            const Icon = card.icon;
            return (
              <section className={`rab-stat rab-stat-${card.tone}`} key={card.label}>
                <span className="rab-stat-icon"><Icon size={21} /></span>
                <h2>{card.label}</h2>
                <strong>{error ? "—" : formatBudgetMoney(card.value)}</strong>
                <p>{error ? "Data belum tersedia" : `${card.count} pos pengajuan`}</p>
              </section>
            );
          })}
        </div>

        {/* ── PANEL TABEL DAFTAR ANGGARAN / RAB ── */}
        <section className="rab-panel">
          <div className="rab-panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2>Daftar Rencana Anggaran Biaya (Pagu Riil)</h2>
              <p>{updatedAt ? `Sinkronisasi terakhir ${updatedAt.toLocaleTimeString("id-ID")}` : "Data anggaran operasional LPK Creativa"}</p>
            </div>
            <button
              className="rab-button rab-button-primary rab-button-small cursor-pointer"
              onClick={() => openForm()}
            >
              <Plus size={15} /> Tambah Anggaran
            </button>
          </div>

          {/* Filter Bar */}
          <div className="rab-filters">
            <label className="rab-search">
              <Search size={17} />
              <input
                placeholder="Cari judul anggaran, nomor RAB, pengaju, atau departemen…"
                aria-label="Cari pengajuan RAB"
                value={search}
                onChange={event => { setSearch(event.target.value); setPage(1); }}
              />
            </label>
            <select aria-label="Jenis filter bulan" value={monthBy} onChange={event => { setMonthBy(event.target.value); setPage(1); }}>
              <option value="period">Periode RAB</option>
              <option value="submitted">Bulan Pengajuan</option>
            </select>
            <input type="month" aria-label="Filter bulan" value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} />
            <select aria-label="Filter status RAB" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {Object.entries(BUDGET_STATUS).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            {(month || statusFilter || search) && (
              <button className="rab-button" onClick={clearFilters}>Reset Filter</button>
            )}
          </div>

          {/* Table Data */}
          <div className="rab-table-scroll">
            <table className="rab-table">
              <thead>
                <tr>
                  <th>Pengajuan Anggaran</th>
                  <th>Periode RAB</th>
                  <th>Pengaju</th>
                  <th>Tanggal Diajukan</th>
                  <th>Total Pagu</th>
                  <th>Status Otorisasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="rab-empty" colSpan={7}>Memuat daftar anggaran…</td></tr>
                ) : rows.length ? (
                  rows.map(request => (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.title}</strong>
                        <span className="rab-cell-caption">
                          {budgetReference(request.id)}
                          {request.department_name ? ` · ${request.department_name}` : ""}
                        </span>
                      </td>
                      <td>{formatBudgetMonth(request.period || new Date().toISOString())}</td>
                      <td>{request.created_by_name || "Finance LPK"}</td>
                      <td>{formatBudgetDate(request.submitted_at || request.created_at)}</td>
                      <td><strong>{formatBudgetMoney(request.total_amount)}</strong></td>
                      <td>
                        <span className={`rab-status ${BUDGET_STATUS[request.status]?.className || "bg-slate-100 text-slate-700"}`}>
                          {BUDGET_STATUS[request.status]?.label || request.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            className="rab-button rab-button-small cursor-pointer"
                            disabled={busy}
                            onClick={() => showDetail(request)}
                            title="Lihat Rincian & Riwayat RAB"
                          >
                            <Eye size={13} /> Rincian
                          </button>
                          <button
                            className="rab-button rab-button-small cursor-pointer hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                            disabled={busy}
                            onClick={() => handleEditBudget(request)}
                            title="Edit Anggaran ini"
                          >
                            <Pencil size={13} className="text-amber-600" /> Edit
                          </button>
                          <button
                            className="rab-button rab-button-small cursor-pointer hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                            disabled={busy}
                            onClick={() => handleDeleteBudget(request)}
                            title="Hapus Anggaran ini"
                          >
                            <Trash2 size={13} className="text-rose-500" /> Hapus
                          </button>
                          {request.status === "approved" && (
                            <button
                              className="rab-button rab-button-small rab-button-primary cursor-pointer"
                              onClick={() => navigate("/realisasi")}
                              title="Buka monitoring di Halaman Realisasi"
                            >
                              Lihat Realisasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="rab-empty">
                      <div className="py-6 flex flex-col items-center justify-center gap-3">
                        <p className="text-slate-500 font-medium">
                          Belum ada anggaran yang terdaftar untuk filter ini.
                        </p>
                        <button
                          className="rab-button rab-button-primary cursor-pointer"
                          onClick={() => openForm()}
                        >
                          <Plus size={16} /> Buat Anggaran Pertama
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="rab-pagination">
            <span>{filtered.length} pengajuan{month ? ` pada ${formatBudgetMonth(month)}` : " · semua periode"}</span>
            <div>
              <button className="rab-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                Sebelumnya
              </button>
              <span>{currentPage} / {pageCount}</span>
              <button className="rab-button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                Berikutnya
              </button>
            </div>
          </div>
        </section>

        {/* ── RINGKASAN PER BULAN RAB ── */}
        <section className="rab-panel">
          <div className="rab-panel-header">
            <div>
              <h2>Ringkasan Pagu per Bulan RAB</h2>
              <p>Monitoring total pagu yang diajukan vs disetujui untuk setiap periode operasional.</p>
            </div>
          </div>
          <div className="rab-table-scroll">
            <table className="rab-table">
              <thead>
                <tr>
                  <th>Bulan Periode</th>
                  <th>Jumlah Pos</th>
                  <th>Total Pagu Diajukan</th>
                  <th>Menunggu Admin</th>
                  <th>Disetujui</th>
                  <th>Pagu Disetujui</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!monthlyHistory.length ? (
                  <tr><td className="rab-empty" colSpan={7}>Ringkasan bulanan akan tampil otomatis.</td></tr>
                ) : (
                  monthlyHistory.map(group => (
                    <tr key={group.period}>
                      <td><strong>{formatBudgetMonth(group.period)}</strong></td>
                      <td>{group.count}</td>
                      <td>{formatBudgetMoney(group.total)}</td>
                      <td>{group.submitted}</td>
                      <td>{group.approved}</td>
                      <td><strong className="text-emerald-700">{formatBudgetMoney(group.approvedTotal)}</strong></td>
                      <td>
                        <button
                          className="rab-button rab-button-small cursor-pointer"
                          onClick={() => { setMonthBy("period"); setMonth(group.period); setStatusFilter(""); setSearch(""); setPage(1); }}
                        >
                          Lihat Periode Ini
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── MODALS ── */}
        {form && (
          <BudgetRequestForm
            initial={form}
            saving={busy}
            error={actionError}
            onSave={save}
            onClose={() => { setForm(null); setActionError(""); }}
          />
        )}

        {detail && !form && !decision && (
          <BudgetRequestDetail
            request={detail}
            permissions={permissions}
            busy={busy}
            onClose={() => setDetail(null)}
            onEdit={() => openForm(detail)}
            onCopy={() => openForm({ ...detail, copy_attachment_from: detail.id, id: undefined, version: undefined })}
            onAction={openDecision}
            onRealize={() => navigate("/realisasi")}
            onIncome={() => navigate("/transaksi-pemasukan")}
          />
        )}

        {decision && detail && (
          <div className="rab-modal-backdrop">
            <section className="rab-modal rab-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="rab-decision-title">
              <div className="rab-modal-heading">
                <h2 id="rab-decision-title">{ACTION_LABELS[decision]}</h2>
                <button disabled={busy} aria-label="Tutup konfirmasi" onClick={() => setDecision(null)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={decide}>
                <div className="rab-detail-body">
                  {actionError && <div role="alert" className="rab-error">{actionError}</div>}
                  <p><strong>{budgetReference(detail.id)} · {detail.title}</strong></p>
                  <div className="rab-detail-total">
                    <span>Total Pengajuan</span>
                    <strong>{formatBudgetMoney(detail.total_amount)}</strong>
                  </div>
                  <p className="rab-confirm-description">
                    {decision === "approve"
                      ? "Persetujuan menetapkan batas plafon anggaran yang sah. Pengeluaran aktual dipantau pada halaman Realisasi."
                      : decision === "submit"
                      ? "RAB akan dikunci setelah diajukan dan diteruskan ke Manajemen/Admin untuk diverifikasi."
                      : decision === "cancel"
                      ? "Pengajuan dibatalkan namun tetap tersimpan dalam riwayat pembatalan."
                      : "Pengajuan yang ditolak tetap tercatat dalam arsip historis."}
                  </p>
                  {decision === "approve" && (detail.items || []).map(item => (
                    <label key={item.id}>
                      {item.description} - Diajukan {formatBudgetMoney(item.total_amount)}
                      <input
                        required
                        type="number"
                        min="0"
                        max={item.total_amount}
                        step="0.01"
                        value={approvedItems[item.id] ?? ""}
                        onChange={e => setApprovedItems({ ...approvedItems, [item.id]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label>
                    Catatan {["reject", "return_revision"].includes(decision) ? "(wajib)" : "(opsional)"}
                    <textarea
                      rows={3}
                      maxLength={2000}
                      required={["reject", "return_revision"].includes(decision)}
                      value={reviewNote}
                      onChange={event => setReviewNote(event.target.value)}
                    />
                  </label>
                </div>
                <div className="rab-modal-footer">
                  <button type="button" className="rab-button" disabled={busy} onClick={() => setDecision(null)}>
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className={`rab-button ${["reject", "cancel"].includes(decision) ? "rab-button-danger" : "rab-button-primary"}`}
                    disabled={busy}
                  >
                    {busy ? "Memproses…" : ACTION_LABELS[decision]}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
