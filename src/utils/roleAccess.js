export const SYSTEM_ROLES = [
  { value: "admin", label: "Admin & Super Admin", description: "Kelola seluruh sistem dan modul.", menu: "Dashboard Admin", path: "/dashboard" },
  { value: "admin_lms", label: "Admin LMS & Akademik", description: "Kelola kurikulum, kelas, materi, dan siswa LPK.", menu: "Dashboard LPK", path: "/dashboard-creativa" },
  { value: "hr", label: "HRD", description: "Kelola karyawan, absensi, dan perhitungan gaji.", menu: "Menu HRD", path: "/menu-hrd" },
  { value: "ga", label: "GA", description: "Kelola aset, fasilitas, dan maintenance.", menu: "Menu GA", path: "/menu-ga" },
  { value: "finance", label: "Finance", description: "Kelola transaksi, invoice, dan keuangan.", menu: "Dashboard Finance", path: "/dashboard-finance" },
  { value: "karyawan", label: "Karyawan", description: "Akses mandiri karyawan, absensi, cuti, dan slip gaji.", menu: "Menu Karyawan", path: "/menu-karyawan" },
  { value: "mitra_telu", label: "Mitra Tel-U", description: "Akses invoice dan dashboard Telkom University.", menu: "Invoice Penagihan", path: "/invoice-penagihan" },
];

export const SYSTEM_LOGIN_ROLES = [
  "admin",
  "super_admin",
  "admin_lms",
  "lms_admin",
  "akademik",
  "admin_akademik",
  "lpk",
  "hr",
  "hrd",
  "hr_admin",
  "manager",
  "ga",
  "finance",
  "finance_admin",
  "karyawan",
  "employee",
  "staff",
  "mitra",
  "mitra_telu"
];
export const LMS_ACCOUNT_ROLES = ["sensei", "sensei_intensif", "peserta_intensif", "siswa"];

export function isSystemLoginRole(role) {
  return SYSTEM_LOGIN_ROLES.includes(normalizeRole(role));
}

export function isLmsAccountRole(role) {
  return LMS_ACCOUNT_ROLES.includes(normalizeRole(role));
}

export function matchesLmsAccountRole(accountRole, selectedRole) {
  const current = normalizeRole(accountRole);
  const selected = normalizeRole(selectedRole);
  if (!isLmsAccountRole(current)) return false;
  return !selected || (selected === "sensei" ? ["sensei", "sensei_intensif"].includes(current) : ["peserta_intensif", "siswa"].includes(current));
}

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function getRoleLandingPath(role) {
  const paths = {
    karyawan: "/menu-karyawan",
    employee: "/menu-karyawan",
    staff: "/menu-karyawan",
    hr: "/menu-hrd",
    hr_admin: "/menu-hrd",
    hrd: "/menu-hrd",
    manager: "/menu-hrd",
    ga: "/menu-ga",
    finance: "/dashboard-finance",
    finance_admin: "/dashboard-finance",
    mitra: "/invoice-penagihan",
    mitra_telu: "/invoice-penagihan",
    admin: "/dashboard",
    super_admin: "/dashboard",
    admin_lms: "/dashboard-creativa",
    lms_admin: "/dashboard-creativa",
    akademik: "/dashboard-creativa",
    admin_akademik: "/dashboard-creativa",
    lpk: "/dashboard-creativa",
    peserta_intensif: "/dashboard-siswa-intensif",
    siswa: "/dashboard-siswa-intensif",
    peserta_matching: "/dashboard-peserta-matching",
    peserta_mendang: "/dashboard-peserta-mendang",
    peserta_alumni: "/dashboard-peserta-alumni",
    peserta_nenkin: "/dashboard-peserta-nenkin",
    sensei: "/dashboard-sensei",
    sensei_intensif: "/dashboard-sensei",
  };
  return Object.hasOwn(paths, normalizeRole(role)) ? paths[normalizeRole(role)] : "/dashboard";
}

export function getSystemRole(role) {
  const normalized = normalizeRole(role);
  if (["super_admin", "admin"].includes(normalized)) {
    return { value: "admin", label: normalized === "super_admin" ? "Super Admin" : "Admin", description: "Kelola seluruh sistem dan modul.", menu: "Dashboard Admin", path: "/dashboard" };
  }
  if (["admin_lms", "lms_admin", "akademik", "admin_akademik", "lpk"].includes(normalized)) {
    return { value: "admin_lms", label: "Admin LMS & Akademik", description: "Kelola kurikulum, kelas, materi, dan siswa LPK.", menu: "Dashboard LPK", path: "/dashboard-creativa" };
  }
  if (["karyawan", "employee", "staff"].includes(normalized)) {
    return { value: "karyawan", label: "Karyawan", description: "Akses mandiri karyawan, absensi, cuti, dan slip gaji.", menu: "Menu Karyawan", path: "/menu-karyawan" };
  }
  return SYSTEM_ROLES.find(item => item.value === (["hrd", "hr_admin", "manager"].includes(normalized) ? "hr" : normalized === "finance_admin" ? "finance" : normalized));
}

export function canManageLoginAccess(role) {
  return ["admin", "super_admin", "hr", "hrd", "manager"].includes(normalizeRole(role));
}
