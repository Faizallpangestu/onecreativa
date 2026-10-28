import { logoutUser } from "../utils/logoutUser";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Clock, Settings, LogOut, DollarSign, ArrowUpRight, ArrowDownRight, WalletCards, Menu as MenuIcon } from "lucide-react";
import { getRoleLandingPath, normalizeRole } from "../utils/roleAccess";

export default function BottomNav({ onOpenMenu }) {
  const navigate = useNavigate();
  const location = useLocation();

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { user = null; }

  let dashboardPath = "/dashboard";
  if (user) {
    const role = normalizeRole(user.role_name);
    if (role === "sensei" || role === "sensei_intensif" || user.is_sensei === true) {
      dashboardPath = "/dashboard-sensei";
    } else if (role === "peserta_intensif" || role === "peserta_matching" || role === "peserta_mendang" || role === "peserta_alumni" || role === "peserta_nenkin") {
      dashboardPath = "/dashboard-siswa-intensif";
    } else if (role === "finance") {
      dashboardPath = "/dashboard-finance";
    } else if (["hr", "hrd", "manager", "ga"].includes(role)) {
      dashboardPath = getRoleLandingPath(role);
    }
  }

  let navItems = [
    { label: "Absensi", path: "/attendance", icon: Clock },
    { label: "Dashboard", path: dashboardPath, icon: Home },
    { label: "Pengaturan", path: "/settings", icon: Settings },
    { label: "Keluar", path: "/login", icon: LogOut, isLogout: true },
  ];

  if (user) {
    const role = normalizeRole(user.role_name);
    if (role === "finance") {
      navItems = [
        { label: "Dashboard", path: "/dashboard-finance", icon: Home },
        { label: "Pemasukan", path: "/transaksi-pemasukan", icon: ArrowUpRight },
        { label: "Pengeluaran", path: "/transaksi-pengeluaran", icon: ArrowDownRight },
        { label: "Keluar", path: "/login", icon: LogOut, isLogout: true },
      ];
    } else if (role === "employee" || role === "karyawan" || role === "staff") {
      navItems = [
        { label: "Dashboard", path: "/menu-karyawan", icon: Home },
        { label: "Absensi", path: "/attendance", icon: Clock },
        { label: "Profil", path: "/account-settings", icon: Users },
        { label: "Keluar", path: "/login", icon: LogOut, isLogout: true },
      ];
    }
  }

  return (
    <nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-40 w-full md:hidden">
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-2 pt-2 pb-5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = !item.isMenuBtn && (location.pathname === item.path || location.pathname.startsWith(item.path + "/"));
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (item.isLogout) {
                  logoutUser();
                  navigate("/login");
                } else if (item.isMenuBtn) {
                  onOpenMenu?.();
                } else {
                  navigate(item.path);
                }
              }}
              className="flex flex-col items-center gap-1.5 group transition-all relative flex-1 py-1"
            >
              <div className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all ${
                isActive 
                  ? "bg-navy-900 text-white shadow-lg shadow-navy-900/30" 
                  : "text-slate-400 hover:text-navy-900 hover:bg-slate-50"
              }`}>
                <Icon
                  className="w-5 h-5 transition-transform group-hover:scale-105"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${
                isActive ? "text-navy-900" : "text-slate-400"
              }`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
