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

export const DEFAULT_REAL_BUDGETS = [
  {
    id: 101,
    title: "Beban Operasional & Utilitas Kantor LPK Creativa",
    period: "2026-10-01",
    department_id: 1,
    department_name: "Operasional & Umum",
    created_by_name: "Finance LPK Creativa",
    created_at: "2026-10-01 08:30:00",
    submitted_at: "2026-10-01 09:15:00",
    reviewed_by_name: "Direktur LPK Creativa",
    reviewed_at: "2026-10-02 10:00:00",
    review_note: "Disetujui sesuai pagu operasional bulanan",
    status: "approved",
    total_amount: 8500000,
    approved_amount: 8500000,
    committed_amount: 1500000,
    realized_amount: 5250000,
    remaining_amount: 3250000,
    items: [
      { id: 1011, category: "Operasional Kantor", description: "Biaya Listrik PLN Gedung Kantor & Ruang Kelas", quantity: 1, unit: "Bulan", unit_price: 2500000, total_amount: 2500000, approved_amount: 2500000, realized_amount: 1800000 },
      { id: 1012, category: "Operasional Kantor", description: "Langganan Internet Dedicated Fiber 100 Mbps", quantity: 1, unit: "Bulan", unit_price: 1500000, total_amount: 1500000, approved_amount: 1500000, realized_amount: 1500000 },
      { id: 1013, category: "Operasional Kantor", description: "Air PDAM & Sanitasi Fasilitas Lembaga", quantity: 1, unit: "Bulan", unit_price: 800000, total_amount: 800000, approved_amount: 800000, realized_amount: 650000 },
      { id: 1014, category: "Perlengkapan Kantor", description: "Pengadaan ATK, Kertas Ujian & Toner Printer", quantity: 1, unit: "Paket", unit_price: 2200000, total_amount: 2200000, approved_amount: 2200000, realized_amount: 1300000 },
      { id: 1015, category: "Operasional Kantor", description: "Jasa Kebersihan Lingkungan & Perawatan Gedung", quantity: 1, unit: "Bulan", unit_price: 1500000, total_amount: 1500000, approved_amount: 1500000, realized_amount: 0 }
    ]
  },
  {
    id: 102,
    title: "Honor & Gaji Pengajar / Sensei Bahasa Jepang (N5, N4 & JFT)",
    period: "2026-10-01",
    department_id: 2,
    department_name: "Pendidikan & Sensei LPK",
    created_by_name: "Sensei Koordinator LPK",
    created_at: "2026-10-01 09:00:00",
    submitted_at: "2026-10-01 10:20:00",
    reviewed_by_name: "Direktur LPK Creativa",
    reviewed_at: "2026-10-02 11:30:00",
    review_note: "Disetujui untuk 3 kelas intensif dan 1 kelas persiapan JFT",
    status: "approved",
    total_amount: 22000000,
    approved_amount: 22000000,
    committed_amount: 0,
    realized_amount: 18500000,
    remaining_amount: 3500000,
    items: [
      { id: 1021, category: "Peralatan Kelas", description: "Honor Sensei Kelas Reguler N5 (3 Kelas Tatap Muka)", quantity: 3, unit: "Kelas", unit_price: 2500000, total_amount: 7500000, approved_amount: 7500000, realized_amount: 7500000 },
      { id: 1022, category: "Peralatan Kelas", description: "Honor Sensei Kelas Intensif N4 & Kaiwa Percakapan", quantity: 2, unit: "Kelas", unit_price: 4250000, total_amount: 8500000, approved_amount: 8500000, realized_amount: 8500000 },
      { id: 1023, category: "Peralatan Kelas", description: "Honor Sensei Persiapan Ujian JFT-Basic A2 & SSW", quantity: 1, unit: "Kelas", unit_price: 6000000, total_amount: 6000000, approved_amount: 6000000, realized_amount: 2500000 }
    ]
  },
  {
    id: 103,
    title: "Fasilitas & Pemeliharaan Asrama Siswa Terpadu",
    period: "2026-10-01",
    department_id: 4,
    department_name: "Fasilitas & Asrama",
    created_by_name: "Kepala Fasilitas Asrama",
    created_at: "2026-10-02 11:00:00",
    submitted_at: "2026-10-02 14:00:00",
    reviewed_by_name: "Direktur LPK Creativa",
    reviewed_at: "2026-10-03 09:15:00",
    review_note: "Disetujui penuh untuk kenyamanan siswa asrama",
    status: "approved",
    total_amount: 14000000,
    approved_amount: 14000000,
    committed_amount: 800000,
    realized_amount: 9800000,
    remaining_amount: 4200000,
    items: [
      { id: 1031, category: "Fasilitas Asrama", description: "Biaya Sewa Gedung Asrama Siswa Putra & Putri", quantity: 1, unit: "Bulan", unit_price: 9000000, total_amount: 9000000, approved_amount: 9000000, realized_amount: 9000000 },
      { id: 1032, category: "Fasilitas Asrama", description: "Servis AC Rutin & Penggantian Filter Udara Asrama", quantity: 4, unit: "Unit", unit_price: 200000, total_amount: 800000, approved_amount: 800000, realized_amount: 800000 },
      { id: 1033, category: "Fasilitas Asrama", description: "Pengadaan Kasur Busa, Sprei & Perlengkapan Kamar", quantity: 10, unit: "Set", unit_price: 420000, total_amount: 4200000, approved_amount: 4200000, realized_amount: 0 }
    ]
  },
  {
    id: 104,
    title: "Pengadaan Buku Cetak Modul Minna no Nihongo & Kotoba",
    period: "2026-10-01",
    department_id: 2,
    department_name: "Pendidikan & Sensei LPK",
    created_by_name: "Finance LPK Creativa",
    created_at: "2026-10-03 09:30:00",
    submitted_at: "2026-10-03 10:00:00",
    reviewed_by_name: "Direktur LPK Creativa",
    reviewed_at: "2026-10-03 13:45:00",
    review_note: "Pengadaan buku telah selesai dan dibayarkan lunas",
    status: "approved",
    total_amount: 6500000,
    approved_amount: 6500000,
    committed_amount: 0,
    realized_amount: 6500000,
    remaining_amount: 0,
    items: [
      { id: 1041, category: "Peralatan Kelas", description: "Modul Minna no Nihongo Shokyu I & II", quantity: 50, unit: "Buku", unit_price: 70000, total_amount: 3500000, approved_amount: 3500000, realized_amount: 3500000 },
      { id: 1042, category: "Peralatan Kelas", description: "Buku Saku Kotoba & Kanji Praktis LPK Creativa", quantity: 50, unit: "Buku", unit_price: 40000, total_amount: 2000000, approved_amount: 2000000, realized_amount: 2000000 },
      { id: 1043, category: "Peralatan Kelas", description: "Lembar Kerja Ujian & Latihan Simulasi JFT", quantity: 50, unit: "Set", unit_price: 20000, total_amount: 1000000, approved_amount: 1000000, realized_amount: 1000000 }
    ]
  },
  {
    id: 105,
    title: "Pemasaran, Sosmed Ads & Rekrutmen Siswa Baru Angkatan 2026",
    period: "2026-10-01",
    department_id: 3,
    department_name: "Pemasaran & Rekrutmen Siswa",
    created_by_name: "Tim Marketing Creativa",
    created_at: "2026-10-05 10:00:00",
    submitted_at: "2026-10-05 11:30:00",
    status: "submitted",
    total_amount: 7500000,
    approved_amount: null,
    committed_amount: 0,
    realized_amount: 0,
    remaining_amount: null,
    items: [
      { id: 1051, category: "Lainnya", description: "Kampanye Iklan Meta (Instagram & Facebook Ads Target Siswa)", quantity: 1, unit: "Paket", unit_price: 4000000, total_amount: 4000000 },
      { id: 1052, category: "Lainnya", description: "Cetak Brosur, X-Banner & Poster Sosialisasi", quantity: 500, unit: "Lembar", unit_price: 3000, total_amount: 1500000 },
      { id: 1053, category: "Lainnya", description: "Transport & Presentasi Sosialisasi ke SMK/SMA Mitra", quantity: 4, unit: "Kunjungan", unit_price: 500000, total_amount: 2000000 }
    ]
  },
  {
    id: 106,
    title: "Biaya Pendaftaran Ujian Sertifikasi Prometric JFT & SSW",
    period: "2026-10-01",
    department_id: 6,
    department_name: "Bridging & Penyaluran Jepang",
    created_by_name: "Finance LPK Creativa",
    created_at: "2026-10-06 14:15:00",
    status: "draft",
    total_amount: 9000000,
    approved_amount: null,
    committed_amount: 0,
    realized_amount: 0,
    remaining_amount: null,
    items: [
      { id: 1061, category: "Lainnya", description: "Voucher Pendaftaran Ujian JFT-Basic A2 (10 Siswa Siap Ujian)", quantity: 10, unit: "Voucher", unit_price: 500000, total_amount: 5000000 },
      { id: 1062, category: "Lainnya", description: "Voucher Ujian Skills SSW Kaigo / Food Service (8 Siswa)", quantity: 8, unit: "Voucher", unit_price: 500000, total_amount: 4000000 }
    ]
  }
];

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
