import axios from "axios";
export const SALARY_STATUS = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  submitted: { label: "Menunggu Admin", className: "bg-amber-50 text-amber-700" },
  approved: { label: "Disetujui · Belum Transfer", className: "bg-blue-50 text-blue-700" },
  rejected: { label: "Ditolak", className: "bg-rose-50 text-rose-700" },
  paid: { label: "Sudah Ditransfer", className: "bg-emerald-50 text-emerald-700" },
};
export const SALARY_ACTION = { prepare: "Perhitungan disiapkan", refresh: "Perhitungan diperbarui", submit: "Diajukan ke Admin", approve: "Disetujui Admin", reject: "Ditolak Admin", reopen: "Direvisi dan dihitung ulang", pay: "Transfer dicatat" };
SALARY_ACTION.publish_slip = "Slip diperiksa dan diterbitkan Finance";
SALARY_ACTION.send_slip_email = "Email slip diterima server SMTP";
export const salarySourceLabel = source => ({ master: "Pengaturan gaji per karyawan", employee: "Gaji individu karyawan", position: "Standar gaji jabatan" })[source] || "Gaji pokok tersimpan";
export const SALARY_MANUAL_FIELDS = [
  { key: "thr_amount", label: "THR", income: true },
  { key: "kasbon_deduction", label: "Kasbon" },
  { key: "bpjs_tk_deduction", label: "BPJS Ketenagakerjaan" },
  { key: "bpjs_kes_deduction", label: "BPJS Kesehatan" },
  { key: "leave_deduction", label: "Izin / Sakit" },
];
export const salaryReference = id => `GAJI-${String(id).padStart(6, "0")}`;
export const salaryDate = date => date ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";
export const previousSalaryMonth = () => { const now = new Date(); const month = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`; };
export async function getSalaryDetail(id) { return (await axios.get("/api/salaries.php", { params: { id, _t: Date.now() } })).data.data; }
export async function mutateSalary(data, csrfToken) { return (await axios.post("/api/salaries.php", data, { headers: { "X-CSRF-Token": csrfToken } })).data.data; }
