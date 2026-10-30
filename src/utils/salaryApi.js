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
  { key: "thr_amount", label: "THR / Bonus Tambahan", income: true },
  { key: "bpjs_tk_deduction", label: "BPJS Ketenagakerjaan (3%)", hint: "JHT 2% + JP 1% (PP 44 & 45/2015)" },
  { key: "bpjs_kes_deduction", label: "BPJS Kesehatan (1%)", hint: "Pekerja 1% maks cap 12jt (Perpres 64/2020)" },
  { key: "pph21_deduction", label: "PPh 21 (Pajak TER)", hint: "TER Bulanan PP 58/2023 & PMK 168/2023" },
  { key: "kasbon_deduction", label: "Kasbon / Pinjaman" },
  { key: "leave_deduction", label: "Izin / Sakit / Potongan Absensi" },
];

/**
 * Kalkulasi Standar Nasional BPJS Ketenagakerjaan (Pekerja 3%: JHT 2% + JP 1% cap Rp 10.042.300)
 */
export function calculateBpjsTk(baseSalary) {
  const base = Math.max(0, Number(baseSalary) || 0);
  const jht = Math.round(base * 0.02);
  const cappedJpBase = Math.min(base, 10042300);
  const jp = Math.round(cappedJpBase * 0.01);
  return { jht, jp, total: jht + jp };
}

/**
 * Kalkulasi Standar Nasional BPJS Kesehatan (Pekerja 1% cap Rp 12.000.000)
 */
export function calculateBpjsKes(baseSalary) {
  const base = Math.max(0, Number(baseSalary) || 0);
  const cappedBase = Math.min(base, 12000000);
  const total = Math.round(cappedBase * 0.01);
  return { total };
}

/**
 * Kalkulasi Standar Nasional PPh 21 TER (PMK 168/2023 & PP 58/2023)
 */
export function calculatePph21Ter(grossSalary, maritalStatus = "TK/0") {
  const gross = Math.max(0, Number(grossSalary) || 0);
  const clean = String(maritalStatus || "").toUpperCase().trim();
  let category = "A";
  if (["TK/2", "TK/3", "K/1", "K/2", "MENIKAH 1", "MENIKAH 2", "MARRIED-1", "MARRIED-2"].includes(clean)) {
    category = "B";
  } else if (["K/3", "MENIKAH 3", "MARRIED-3"].includes(clean)) {
    category = "C";
  }

  let rate = 0;
  if (category === "A") {
    if (gross <= 5400000) rate = 0;
    else if (gross <= 5650000) rate = 0.0025;
    else if (gross <= 5950000) rate = 0.005;
    else if (gross <= 6300000) rate = 0.0075;
    else if (gross <= 6750000) rate = 0.01;
    else if (gross <= 7500000) rate = 0.0125;
    else if (gross <= 8550000) rate = 0.015;
    else if (gross <= 9650000) rate = 0.0175;
    else if (gross <= 10050000) rate = 0.02;
    else if (gross <= 10350000) rate = 0.0225;
    else if (gross <= 10700000) rate = 0.025;
    else if (gross <= 11050000) rate = 0.03;
    else if (gross <= 11600000) rate = 0.035;
    else if (gross <= 12500000) rate = 0.04;
    else if (gross <= 13750000) rate = 0.05;
    else if (gross <= 15100000) rate = 0.06;
    else if (gross <= 16950000) rate = 0.07;
    else if (gross <= 19750000) rate = 0.08;
    else if (gross <= 24150000) rate = 0.09;
    else rate = 0.1;
  } else if (category === "B") {
    if (gross <= 6200000) rate = 0;
    else if (gross <= 6500000) rate = 0.0025;
    else if (gross <= 6850000) rate = 0.005;
    else if (gross <= 7300000) rate = 0.0075;
    else if (gross <= 9200000) rate = 0.01;
    else if (gross <= 10750000) rate = 0.015;
    else if (gross <= 12550000) rate = 0.02;
    else if (gross <= 14150000) rate = 0.03;
    else if (gross <= 16150000) rate = 0.04;
    else rate = 0.05;
  } else {
    if (gross <= 6600000) rate = 0;
    else if (gross <= 6950000) rate = 0.0025;
    else if (gross <= 7350000) rate = 0.005;
    else if (gross <= 7800000) rate = 0.0075;
    else if (gross <= 8850000) rate = 0.01;
    else if (gross <= 9800000) rate = 0.0125;
    else if (gross <= 10950000) rate = 0.015;
    else if (gross <= 12050000) rate = 0.02;
    else rate = 0.03;
  }

  const amount = Math.round(gross * rate);
  return { amount, rate, ratePercent: (rate * 100).toFixed(2) + "%", category };
}

/**
 * Hitung seluruh potongan standar nasional secara menyeluruh
 */
export function calculateNationalStandardDeductions({ baseSalary, grossSalary, maritalStatus }) {
  const tk = calculateBpjsTk(baseSalary);
  const kes = calculateBpjsKes(baseSalary);
  const pph = calculatePph21Ter(grossSalary || baseSalary, maritalStatus);
  return {
    bpjs_tk_deduction: String(tk.total),
    bpjs_kes_deduction: String(kes.total),
    pph21_deduction: String(pph.amount),
    details: { tk, kes, pph },
  };
}

export const salaryReference = id => `GAJI-${String(id).padStart(6, "0")}`;
export const salaryDate = date => date ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";
export const previousSalaryMonth = () => { const now = new Date(); const month = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`; };
export async function getSalaryDetail(id) { return (await axios.get("/api/salaries.php", { params: { id, _t: Date.now() } })).data.data; }
export async function mutateSalary(data, csrfToken) { return (await axios.post("/api/salaries.php", data, { headers: { "X-CSRF-Token": csrfToken } })).data.data; }
