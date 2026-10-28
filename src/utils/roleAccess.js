export const SYSTEM_ROLES = [
  { value: "admin", label: "Admin & Super Admin", description: "Kelola seluruh sistem dan modul.", menu: "Dashboard Admin", path: "/dashboard" },
  { value: "hr", label: "HRD", description: "Kelola karyawan, absensi, dan perhitungan gaji.", menu: "Menu HRD", path: "/menu-hrd" },
  { value: "ga", label: "GA", description: "Kelola aset, fasilitas, dan maintenance.", menu: "Menu GA", path: "/menu-ga" },
  { value: "finance", label: "Finance", description: "Kelola transaksi, invoice, dan keuangan.", menu: "Dashboard Finance", path: "/dashboard-finance" },
];

export const SYSTEM_LOGIN_ROLES = ["admin", "super_admin", "hr", "hrd", "hr_admin", "manager", "ga", "finance", "finance_admin", "lpk"];
export const LMS_ACCOUNT_ROLES = ["sensei", "sensei_intensif", "peserta_intensif"];

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
  return !selected || (selected === "sensei" ? ["sensei", "sensei_intensif"].includes(current) : current === selected);
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
    admin: "/dashboard",
    super_admin: "/dashboard",
    lpk: "/dashboard-creativa",
    peserta_intensif: "/dashboard-siswa-intensif",
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
  return SYSTEM_ROLES.find(item => item.value === (["hrd", "hr_admin", "manager"].includes(normalized) ? "hr" : normalized === "finance_admin" ? "finance" : normalized));
}

export function canManageLoginAccess(role) {
  return ["admin", "super_admin", "hr", "hrd", "manager", "lpk"].includes(normalizeRole(role));
}
