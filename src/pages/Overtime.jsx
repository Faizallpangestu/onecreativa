import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileDown, Clock, CheckCircle } from "lucide-react";

const OVERTIME_API   = "/api/overtime.php";
const EMPLOYEES_API  = "/api/employees.php";

const APPROVER_ROLES = ["super_admin", "manager"];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function getAvatarClass(name = "") {
  const palettes = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
  ];
  const i = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % palettes.length;
  return palettes[i];
}

const statusMap = {
  pending:  { label: "Menunggu",  cls: "bg-amber-100 text-amber-700"   },
  approved: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak",   cls: "bg-rose-100 text-rose-700"      },
};

export default function Overtime() {
  const navigate = useNavigate();
  const user       = getUser();
  const isApprover = user && APPROVER_ROLES.includes(user.role_name);
  const canExport  = user && ["super_admin", "manager", "hr"].includes(user.role_name);

  const [requests,   setRequests]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [submitMsg,  setSubmitMsg]  = useState({ type: "", text: "" });
  const [rejectId,   setRejectId]   = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  // Form state
  const [form, setForm] = useState({
    employee_id:      "",
    date:             new Date().toISOString().slice(0, 10),
    overtime_minutes: "",
    reason:           "",
  });

  // ── Fetch data ─────────────────────────────────────────────────────────
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const params = isApprover ? {} : { employee_id: user?.id };
      const res    = await axios.get(OVERTIME_API, { params });
      setRequests(res.data?.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEES_API);
      const arr = res.data?.data ?? res.data ?? [];
      setEmployees(arr);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadRequests();
    loadEmployees();
    // eslint-disable-next-line
  }, []);

  // ── Submit request lembur ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });

    if (!form.employee_id || !form.overtime_minutes || Number(form.overtime_minutes) <= 0) {
      setSubmitMsg({ type: "error", text: "Pilih karyawan dan isi durasi lembur." });
      return;
    }

    try {
      await axios.post(OVERTIME_API, {
        employee_id:      Number(form.employee_id),
        date:             form.date,
        overtime_minutes: Number(form.overtime_minutes),
        reason:           form.reason,
      });

      setSubmitMsg({ type: "success", text: "Request lembur berhasil disubmit! Menunggu persetujuan." });
      setForm({ employee_id: "", date: new Date().toISOString().slice(0, 10), overtime_minutes: "", reason: "" });
      loadRequests();
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.response?.data?.message ?? "Gagal submit request." });
    }
  };

  // ── Approve ────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await axios.put(OVERTIME_API, {
        id,
        action:        "approve",
        approver_id:   user?.id,
        approver_role: user?.role_name,
      });
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal approve");
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────
  const handleReject = async () => {
    try {
      await axios.put(OVERTIME_API, {
        id:            rejectId,
        action:        "reject",
        approver_id:   user?.id,
        approver_role: user?.role_name,
        reject_reason: rejectNote,
      });
      setRejectId(null);
      setRejectNote("");
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal reject");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = requests.map((item) => ({
      Nama: item.employee_name,
      Tanggal: item.date,
      "Durasi Lembur (Menit)": item.overtime_minutes,
      Alasan: item.reason || "-",
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Overtime");
    XLSX.writeFile(workbook, `Laporan_Lembur_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const pendingCount  = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">

        {/* ── Background Gradient Hero ── */}
        <div className="absolute top-0 left-0 right-0 h-[240px] bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 rounded-b-[2.5rem] shadow-md z-0">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        </div>

        {/* ── Header ── */}
        <div className="relative z-10 px-5 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-black text-white tracking-wide">Manajemen Lembur</h1>
            {canExport ? (
              <button
                onClick={handleExportExcel}
                className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition active:scale-95"
              >
                <FileDown className="w-5 h-5" strokeWidth={2.5} />
              </button>
            ) : <div className="w-10 h-10"></div>}
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-[1.5rem] p-4 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Menunggu</p>
              <p className="text-[24px] font-black text-slate-800 leading-none">{pendingCount}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-[1.5rem] p-4 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disetujui</p>
              <p className="text-[24px] font-black text-slate-800 leading-none">{approvedCount}</p>
            </div>
          </div>
        </div>

        {/* ── Form Submit Lembur ── */}
        <div className="relative z-10 px-5 mt-2">
          <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden mb-6">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-[16px] font-black text-slate-900">Ajukan Lembur</h2>
              <p className="text-[12px] font-semibold text-slate-400 mt-1">
                Request akan diteruskan ke Manager / Direktur untuk disetujui.
              </p>
            </div>

          {submitMsg.text && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                submitMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {submitMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Karyawan */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Karyawan</span>
              <select
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                required
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
              >
                <option value="">Pilih karyawan</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Tanggal */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tanggal</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
              />
            </label>

            {/* Durasi */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Durasi Lembur (menit)</span>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 60"
                value={form.overtime_minutes}
                onChange={(e) => setForm({ ...form, overtime_minutes: e.target.value })}
                required
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
              />
            </label>

            {/* Alasan */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Alasan</span>
              <input
                type="text"
                placeholder="Deskripsi singkat"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
              />
            </label>

            {/* Submit */}
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Ajukan Lembur
              </button>
            </div>
          </form>
          </div>
        </div>

        {/* ── Riwayat Request ── */}
        <div className="relative z-10 px-5">
          <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[16px] font-black text-slate-900">
                {isApprover ? "Semua Request Lembur" : "Request Lembur Saya"}
              </h2>
              {isApprover && (
                <p className="text-[11px] text-orange-600 font-bold">Bisa Approve/Reject</p>
              )}
            </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {requests.length === 0 ? (
                <div className="py-8 text-center text-sm font-medium text-slate-500">
                  Belum ada request lembur.
                </div>
              ) : null}

              {requests.map((r) => {
                const st = statusMap[r.status] ?? { label: r.status, cls: "bg-slate-100 text-slate-600" };
                const hours   = Math.floor(r.overtime_minutes / 60);
                const minutes = r.overtime_minutes % 60;
                const durasi  = hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m`;

                return (
                  <div key={r.id} className="bg-white p-4 rounded-[1.25rem] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col gap-3 transition-transform active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] text-[13px] font-bold ${getAvatarClass(r.employee_name)}`}>
                          {getInitials(r.employee_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">{r.employee_name}</p>
                          <p className="text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{r.date}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Durasi Lembur</span>
                        <span className="text-[12px] font-mono font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{durasi}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 shrink-0">Alasan</span>
                        <span className="text-[12px] font-medium text-slate-600 text-right leading-snug">{r.reason || "-"}</span>
                      </div>
                      {r.status === "rejected" && r.reject_reason && (
                        <div className="mt-2 pt-2 border-t border-rose-100">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Alasan Penolakan: </span>
                           <span className="text-[11px] font-medium text-rose-600">{r.reject_reason}</span>
                        </div>
                      )}
                      {r.status !== "pending" && r.approved_by_email && (
                        <div className="mt-1 flex justify-end">
                           <span className="text-[9px] text-slate-400 font-medium">By: {r.approved_by_email}</span>
                        </div>
                      )}
                    </div>

                    {isApprover && r.status === "pending" && (
                      <div className="grid grid-cols-2 gap-3 mt-1 pt-1 border-t border-slate-50">
                        <button
                          onClick={() => { setRejectId(r.id); setRejectNote(""); }}
                          className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-rose-50 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100 border border-rose-100/50"
                        >
                          ✕ Tolak
                        </button>
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-50 text-[12px] font-bold text-emerald-600 transition hover:bg-emerald-100 border border-emerald-100/50"
                        >
                          ✓ Setujui
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ── Modal Reject ── */}
      {rejectId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setRejectId(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-slate-900">Tolak Request Lembur</h3>
            <p className="mb-4 text-sm text-slate-500">Berikan alasan penolakan (opsional).</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Alasan penolakan..."
              rows={3}
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectId(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="flex-1 rounded-2xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
