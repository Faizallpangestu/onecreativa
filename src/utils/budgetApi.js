import axios from "axios";

export const BUDGET_STATUS = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  submitted: { label: "Menunggu Admin", className: "bg-amber-50 text-amber-700" },
  approved: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Ditolak", className: "bg-rose-50 text-rose-700" },
  under_review: {label:"Sedang direview",className:"bg-amber-50 text-amber-700"},
  partially_realized: {label:"Realisasi sebagian",className:"bg-blue-50 text-blue-700"},
  fully_realized: {label:"Realisasi penuh",className:"bg-emerald-50 text-emerald-700"},
  closed: {label:"Ditutup",className:"bg-slate-100 text-slate-600"},
  cancelled: { label: "Dibatalkan", className: "bg-slate-100 text-slate-500" },
};
export const BUDGET_ACTION = {review:"Mulai review",return_revision:"Dikembalikan untuk revisi",close:"RAB ditutup",realization:"Realisasi tercatat",commitment:"Komitmen dibuat",cancel_commitment:"Komitmen dibatalkan", create: "Draft dibuat", save: "Draft diperbarui", submit: "Diajukan ke Admin", approve: "Disetujui Admin", reject: "Ditolak Admin", cancel: "Dibatalkan pengaju" };
export const formatBudgetMoney = value => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: Number(value) % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(Number(value) || 0);
export const budgetReference = id => `RAB-${String(id).padStart(6, "0")}`;
export const formatBudgetMonth = value => new Date(`${value.slice(0, 7)}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
export const formatBudgetDate = value => value ? new Date(value.replace(" ", "T")).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

export async function getBudgetDetail(id) {
  const response = await axios.get("/api/budgets.php", { params: { id, _t: Date.now() } });
  return response.data.data;
}
export async function mutateBudget(data, csrfToken) {
  const { attachment_file, ...payload } = data;
  let body = payload;
  if (attachment_file) {
    body = new FormData();
    body.append("payload", JSON.stringify(payload));
    body.append("attachment", attachment_file);
  }
  const response = await axios.post("/api/budgets.php", body, { headers: { "X-CSRF-Token": csrfToken } });
  return response.data.data;
}

export const budgetImageUrl = (id, key) => `/api/budgets.php?id=${encodeURIComponent(id)}&image=${encodeURIComponent(key)}`;
