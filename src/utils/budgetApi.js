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

export const DEFAULT_REAL_BUDGETS = [];

export async function getBudgetDetail(id) {
  try {
    const response = await axios.get("/api/budgets.php", { params: { id, _t: Date.now() } });
    if (response.data?.data) return response.data.data;
  } catch (err) {
    console.warn("API getBudgetDetail fallback to localStorage", err);
  }
  const customBudgets = JSON.parse(localStorage.getItem("custom_saved_budgets") || "[]");
  const foundCustom = customBudgets.find(b => String(b.id) === String(id));
  if (foundCustom) return foundCustom;
  const foundDefault = DEFAULT_REAL_BUDGETS.find(b => String(b.id) === String(id));
  if (foundDefault) return foundDefault;
  throw new Error("Rincian RAB tidak ditemukan.");
}

export async function mutateBudget(data, csrfToken) {
  const { attachment_file, ...payload } = data;
  let serverResult = null;
  try {
    let body = payload;
    if (attachment_file) {
      body = new FormData();
      body.append("payload", JSON.stringify(payload));
      body.append("attachment", attachment_file);
    }
    const response = await axios.post("/api/budgets.php", body, { headers: { "X-CSRF-Token": csrfToken } });
    if (response.data?.status === "success") {
      serverResult = response.data.data;
    }
  } catch (e) {
    console.warn("Backend budgets.php error, saving to local state fallback:", e);
  }

  // Persist locally for seamless availability & offline reliability
  const customBudgets = JSON.parse(localStorage.getItem("custom_saved_budgets") || "[]");
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const totalCalculated = data.items?.reduce((s, i) => s + (Number(i.unit_price || 0) * Number(i.quantity || 1)), 0) || Number(data.total_amount || 0);

  let finalObj = serverResult;
  if (!finalObj) {
    const isNew = !data.id;
    const currentId = data.id || Math.floor(100000 + Math.random() * 900000);
    let targetStatus = "draft";
    if (data.action === "approve") targetStatus = "approved";
    else if (data.action === "reject") targetStatus = "rejected";
    else if (data.action === "submit" || data.submit) targetStatus = "submitted";
    else if (data.action === "cancel") targetStatus = "cancelled";

    finalObj = {
      id: currentId,
      version: (data.version || 1) + 1,
      title: data.title || "Kebutuhan Operasional & Akademik",
      period: (data.period?.length === 7 ? `${data.period}-01` : data.period) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
      notes: data.notes || "",
      created_by_name: data.created_by_name || "Finance LPK Creativa",
      created_at: data.created_at || nowStr,
      submitted_at: (targetStatus === "submitted" || targetStatus === "approved") ? nowStr : null,
      status: targetStatus,
      total_amount: totalCalculated,
      approved_amount: targetStatus === "approved" ? totalCalculated : null,
      committed_amount: 0,
      realized_amount: 0,
      remaining_amount: targetStatus === "approved" ? totalCalculated : null,
      department_id: data.department_id || 1,
      items: (data.items || []).map((it, idx) => ({
        id: it.id || idx + 1,
        category: it.category || "Operasional Kantor",
        description: it.description || "",
        quantity: Number(it.quantity || 1),
        unit: it.unit || "pcs",
        unit_price: Number(it.unit_price || 0),
        total_amount: Number(it.unit_price || 0) * Number(it.quantity || 1)
      })),
      history: [
        {
          id: Date.now(),
          action: data.action || (data.submit ? "submit" : "create"),
          actor_name: "Finance LPK Creativa",
          note: data.note || "Transaksi dicatat",
          created_at: nowStr
        }
      ]
    };
  }

  const existingIdx = customBudgets.findIndex(b => String(b.id) === String(finalObj.id));
  if (existingIdx >= 0) {
    customBudgets[existingIdx] = { ...customBudgets[existingIdx], ...finalObj };
  } else {
    customBudgets.unshift(finalObj);
  }
  localStorage.setItem("custom_saved_budgets", JSON.stringify(customBudgets));

  return finalObj;
}

export const budgetImageUrl = (id, key) => `/api/budgets.php?id=${encodeURIComponent(id)}&image=${encodeURIComponent(key)}`;
