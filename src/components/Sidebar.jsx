import { logoutUser } from "../utils/logoutUser";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { canManageLoginAccess, getRoleLandingPath, normalizeRole } from "../utils/roleAccess";
import { FINANCE_MENU_ITEMS } from "../utils/financeNavigation";
import { 
  LayoutGrid, FileText, DollarSign, TrendingUp, TrendingDown, WalletCards, CreditCard, 
  ChevronRight, LogOut, BookOpen, Landmark, Users, Target, PieChart, ShieldCheck, Settings 
} from "lucide-react";

function SidebarIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      {children}
    </svg>
  );
}

export default function Sidebar({ isOpen, setIsOpen, appearance }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = sessionStorage.getItem("sidebarExpanded");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem("sidebarExpanded", JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  useEffect(() => {
    if (navRef.current) {
      const scrollPos = sessionStorage.getItem("sidebarScroll");
      if (scrollPos) {
        navRef.current.scrollTop = parseInt(scrollPos, 10);
      }
    }
  }, []);

  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem("sidebarScroll", navRef.current.scrollTop);
    }
  };

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { user = null; }

  const role = normalizeRole(user?.role_name);
  const isEmployee = role === "employee" || role === "karyawan" || role === "staff";
  const isPesertaIntensif = role === "peserta_intensif" || role === "peserta_matching" || role === "peserta_mendang" || role === "peserta_alumni" || role === "peserta_nenkin";
  const isSensei = role === "sensei" || role === "sensei_intensif" || user?.is_sensei === true;
  const isHR = role === "hr" || role === "manager" || role === "hrd";
  const isFinance = role === "finance";
  const isGA = role === "ga";
  const isAdmin = role === "admin" || role === "super_admin" || role === "lpk";

  const menuGroups = [
    {
      category: "", // Empty category for top-level items
      items: [
        {
          label: "Dashboard",
          path: getRoleLandingPath(role),
          hidden: !(isAdmin || isHR || isGA || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Dashboard",
          path: "/menu-karyawan",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        // ==================== SIDEBAR SISWA ====================
        {
          label: "Dashboard",
          path: "/dashboard-siswa-intensif",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Absensi",
          path: "/lms/absensi",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Kelas Saya",
          path: "/lms/kelas-saya",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Materi",
          path: "/lms/materi",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Tugas",
          path: "/lms/tugas",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Quiz",
          path: "/lms/quiz",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <circle cx="12" cy="8" r="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Ujian Kompetensi",
          path: "/lms/ukom",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Nilai",
          path: "/lms/nilai",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M18 20V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Kalender",
          path: "/lms/kalender",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Kaiwa dengan AI",
          path: "/lms/latihan-kaiwa",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Kotoba",
          path: "/lms/kotoba",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
              <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold" fontFamily="sans-serif">あ</text>
            </SidebarIcon>
          ),
        },
        {
          label: "Pengumuman",
          path: "/lms/pengumuman",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Diskusi",
          path: "/lms/diskusi",
          hidden: !isPesertaIntensif,
          icon: (
            <SidebarIcon>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },

        // ==================== SIDEBAR SENSEI ====================
        {
          label: "Dashboard",
          path: "/dashboard-sensei",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Absensi",
          path: "/sensei/kehadiran",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Kelas Saya",
          path: "/lms/kelas-saya",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Materi",
          path: "/lms/materi",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Tugas",
          path: "/lms/tugas",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Quiz",
          path: "/lms/quiz",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <circle cx="12" cy="8" r="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Ujian Kompetensi",
          path: "/lms/ukom",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Nilai",
          path: "/lms/nilai",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M18 20V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Kalender",
          path: "/lms/kalender",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Kotoba",
          path: "/lms/kotoba",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Pengumuman",
          path: "/lms/pengumuman",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Diskusi",
          path: "/lms/diskusi",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Siswa",
          path: "/lpk-intensif",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M15 8h2M15 12h2M6 16h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Leaderboard",
          path: "/lms/leaderboard",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Laporan",
          path: "/daily-report-karyawan",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
      ]
    },
    {
      category: "KARYAWAN",
      items: [
        {
          label: "Absen Wajah",
          path: "/face-clock",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Riwayat Absen",
          path: "/attendance",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8 2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Cuti & Izin",
          path: "/leaves",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Slip Gaji",
          path: "/slip-gaji-karyawan",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Laporan Kerja",
          path: "/daily-report-karyawan",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Reimburse",
          path: "/reimbursement",
          hidden: !isEmployee,
          icon: (
            <SidebarIcon>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
      ]
    },
    {
      category: "HRD",
      items: [
        {
          label: "Manajemen Karyawan",
          path: "/employees",
          hidden: !(isAdmin || isHR),
          icon: (
            <SidebarIcon>
              <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19a5 5 0 0 1 10 0v1H3v-1Zm8 1v-1a5 5 0 0 1 8.66-3.46A5 5 0 0 1 21 19v1h-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Data Jabatan",
          path: "/positions",
          hidden: !(isAdmin || isHR),
          icon: (
            <SidebarIcon>
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3h-8v4h8V3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Riwayat Absensi",
          path: "/attendance",
          hidden: !(isAdmin || isHR || isGA || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8 2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Pengajuan Cuti",
          path: "/leaves",
          hidden: !(isAdmin || isHR || isGA || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Perhitungan Gaji",
          path: "/payroll-hrd",
          hidden: !(isAdmin || isHR),
          icon: (
            <SidebarIcon>
              <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9ZM3 9h18M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Penggajian Karyawan",
          path: "/salary",
          hidden: !(isAdmin || isFinance),
          icon: <SidebarIcon><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></SidebarIcon>,
        },
        {
          label: "Laporan Kerja",
          path: "/daily-report-admin",
          hidden: !(isAdmin || isHR || isGA || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Lembur",
          path: "/overtime",
          hidden: !(isAdmin || isHR || isGA || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M12 7v5l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },

      ]
    },
    {
      category: "GA",
      items: [
        {
          label: "Data Aset",
          path: "/assets",
          hidden: !(isAdmin || isGA),
          icon: (
            <SidebarIcon>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22.08V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Laporan Aset",
          path: "/assets/laporan",
          hidden: !(isAdmin || isGA),
          icon: (
            <SidebarIcon>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 13H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Laporan Audit",
          path: "/assets/audit",
          hidden: !(isAdmin || isGA),
          icon: (
            <SidebarIcon>
              <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Persetujuan Aset",
          path: "/assets/approval",
          hidden: !(isAdmin || isGA),
          icon: (
            <SidebarIcon>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Pemeliharaan",
          path: "/assets/maintenance",
          hidden: !(isAdmin || isGA),
          icon: (
            <SidebarIcon>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Scan QR Aset",
          path: "/assets/scan",
          hidden: !(isAdmin || isGA),
          icon: (
            <SidebarIcon>
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
      ]
    },
    {
      category: "KEUANGAN",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard-finance",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Invoice",
          path: "/invoice-penagihan",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Keuangan & Laba",
          path: "/profit",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Transaksi Pemasukan",
          path: "/transaksi-pemasukan",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M21 3v6h-6M21 3l-9 9-4-4-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Transaksi Pengeluaran",
          path: "/transaksi-pengeluaran",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M3 3v6h6M3 3l9 9 4-4 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },

        {
          label: "Anggaran",
          path: "/anggaran",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Reimburse",
          path: "/reimbursement",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
      ]
    },
    {
      category: "LPK CREATIVA",
      items: [
        {
          label: "Hak Akses",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
          subItems: [
            { label: "Akses Sensei", path: "/access-rights-sensei" },
            { label: "Akses Siswa", path: "/access-rights-siswa" }
          ]
        },
        {
          label: "LMS",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
          subItems: [
            { label: "Agenda", path: "/lms/agenda" },
            { label: "Kelas Saya", path: "/lms/kelas-saya" },
            { label: "Daftar Kelas", path: "/lms/classes" },
            { label: "Materi", path: "/lms/materi" },
            { label: "Kalender Pertemuan", path: "/lms/kalender" },
            { label: "Tugas", path: "/lms/tugas" },
            { label: "Quiz", path: "/lms/quiz" },
            { label: "Ujian Kompetensi", path: "/lms/ukom" },
            { label: "Nilai", path: "/lms/nilai" },
            { label: "Papan Peringkat", path: "/lms/leaderboard" },
            { label: "Pengumuman", path: "/lms/pengumuman" },
            { label: "Diskusi", path: "/lms/diskusi" }
          ]
        },
        {
          label: "Matching Job",
          path: "/matching-job",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22.08V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
        {
          label: "Nenkin",
          path: "/nenkin",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        }
      ]
    },
    {
      category: "SETTINGS",
      items: [
        {
          label: "Pengaturan Lokasi",
          path: "/location-settings",
          hidden: !(isAdmin || isFinance),
          icon: (
            <SidebarIcon>
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
        },
        {
          label: "Hak Akses Kantor",
          path: "/access-rights",
          hidden: !canManageLoginAccess(role),
          icon: (
            <SidebarIcon>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </SidebarIcon>
          ),
          subItems: [
            { label: "Semua Akun Kantor", path: "/access-rights" },
            { label: "Akses HRD & Admin", path: "/access-rights-hr" },
            { label: "Akses GA", path: "/access-rights-ga" },
            { label: "Akses Finance", path: "/access-rights-finance" },
          ]
        }
      ]
    }

  ];

  const isFinanceMode = isFinance || appearance === "finance";

  const financeModularGroups = [
    {
      category: "MODUL KEUANGAN",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard-finance",
          icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.8} />,
        },
        {
          label: "Invoice",
          path: "/invoice-penagihan",
          icon: <FileText className="h-5 w-5" strokeWidth={1.8} />,
        },
        {
          label: "Income",
          icon: <TrendingUp className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Transaksi Pemasukan", path: "/transaksi-pemasukan" },
            { label: "Invoice", path: "/invoice-penagihan" },
            { label: "Students", path: "/finance/student-billing" },
          ],
        },
        {
          label: "Expense",
          icon: <TrendingDown className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Transaksi Pengeluaran", path: "/transaksi-pengeluaran" },
            { label: "Bills (Tagihan)", path: "/bills" },
            { label: "Vendor", path: "/vendors" },
          ],
        },
        {
          label: "Accounting",
          icon: <BookOpen className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Buku Transaksi", path: "/buku-transaksi" },
            { label: "Chart of Accounts (COA)", path: "/coa" },
            { label: "Journal", path: "/journal" },
            { label: "General Ledger", path: "/general-ledger" },
            { label: "Reconciliation", path: "/reconciliation" },
          ],
        },
        {
          label: "Cash & Bank",
          icon: <Landmark className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Rekening", path: "/rekening" },
            { label: "Cashflow", path: "/cashflow" },
            { label: "Transfer", path: "/transfer" },
          ],
        },
        {
          label: "Payroll",
          icon: <Users className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Penggajian Karyawan", path: "/salary" },
          ],
        },
        {
          label: "Budget",
          icon: <Target className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Anggaran", path: "/anggaran" },
            { label: "Realisasi", path: "/realisasi" },
          ],
        },
        {
          label: "Reports",
          icon: <PieChart className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Profit & Loss", path: "/profit" },
            { label: "Balance Sheet", path: "/balance-sheet" },
            { label: "Cash Flow", path: "/cashflow" },
            { label: "Financial Report", path: "/laporan-keuangan" },
          ],
        },
        {
          label: "Audit",
          icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />,
          subItems: [
            { label: "Audit Trail", path: "/buku-transaksi" },
            { label: "Proyeksi vs Realisasi", path: "/dashboard-finance#analitik" },
          ],
        },
      ],
    },
  ];

  const displayedGroups = isFinanceMode ? financeModularGroups : menuGroups;

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  // Find the most specific active path
  let activePath = "";
  displayedGroups.forEach(group => {
    group.items.forEach(item => {
      if (!item.hidden) {
        if (!item.subItems) {
          if (item.path && (location.pathname === item.path || location.pathname.startsWith(item.path + "/"))) {
            if (item.path.length > activePath.length) {
              activePath = item.path;
            }
          }
        } else {
          item.subItems.forEach(sub => {
            if (sub.path) {
              const cleanSubPath = sub.path.split('?')[0];
              if (location.pathname === cleanSubPath || location.pathname.startsWith(cleanSubPath + "/")) {
                if (cleanSubPath.length > activePath.length) {
                  activePath = cleanSubPath;
                }
              }
            }
          });
        }
      }
    });
  });

  // Automatically expand the dropdown that contains the current active route
  useEffect(() => {
    setExpandedMenus(prev => {
      const newExpanded = { ...prev };
      let hasChanges = false;
      
      displayedGroups.forEach(group => {
        group.items.forEach(item => {
          if (item.subItems) {
            const isActive = item.subItems.some(sub => {
              const cleanSubPath = sub.path ? sub.path.split('?')[0] : "";
              return cleanSubPath && (location.pathname === cleanSubPath || location.pathname.startsWith(cleanSubPath + "/"));
            });
            if (isActive && !newExpanded[item.label]) {
              newExpanded[item.label] = true;
              hasChanges = true;
            }
          }
        });
      });

      return hasChanges ? newExpanded : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {/* Mobile & Tablet overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 xl:hidden"
          onClick={() => setIsOpen(false)} />
      )}      {/* Sidebar */}
      <aside
        aria-label="Menu navigasi"
        aria-expanded={isOpen}
        className={`app-sidebar ${isFinanceMode ? "finance-sidebar" : ""} fixed inset-y-0 left-0 z-50 flex flex-col ${isFinanceMode ? "bg-white border-r border-slate-200 text-slate-800" : "bg-[#102a43] border-r border-[#243b53] text-white"} transition-all duration-300 ease-in-out xl:static xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-20" : "w-[250px] shrink-0"}`}
      >
        {/* Brand Header */}
        <div className={`h-16 shrink-0 flex items-center justify-between px-4 ${isFinanceMode ? "border-b border-slate-100" : "mt-2"}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-center justify-center shrink-0">
                 <img src={logo} alt="Creativa Logo" className={`w-9 h-9 object-contain ${isFinanceMode ? "rounded-full" : "bg-white rounded-lg p-1"}`} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-black tracking-wider leading-tight ${isFinanceMode ? "text-slate-900" : "text-white"}`}>
                  LPK CREATIVA
                </span>
                <span className={`text-[8px] font-bold tracking-wider uppercase leading-tight mt-0.5 ${isFinanceMode ? "text-slate-400" : "text-white/60"}`}>
                  BRIDGING INTERNATIONAL
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <img src={logo} alt="Creativa Logo" className={`w-9 h-9 object-contain ${isFinanceMode ? "rounded-full" : "bg-white rounded-lg p-1"}`} />
            </div>
          )}

          {/* Hamburger toggle - visible on desktop, aligned right */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all ${isFinanceMode ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            aria-label="Toggle Sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {/* Mobile close button */}
          <button aria-label="Tutup Menu" onClick={() => setIsOpen(false)}
            className={`rounded p-1 lg:hidden shrink-0 ${isFinanceMode ? "text-slate-400 hover:bg-slate-100" : "text-white/70 hover:bg-white/10"}`}>
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Nav menu */}
        <nav 
          ref={navRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${isFinanceMode ? "py-3" : "py-6"}`}
        >
          {displayedGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter(item => !item.hidden);
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className={isFinanceMode ? "mb-4" : "mb-6"}>
                {!isCollapsed && group.category && (
                  <h3 className={`px-5 text-[11px] font-bold uppercase tracking-wider mb-2 mt-3 first:mt-1 ${isFinanceMode ? "text-slate-400" : "text-white/50"}`}>
                    {group.category}
                  </h3>
                )}
                
                {visibleItems.map((item) => {
                  const hasSubItems = !!item.subItems;
                  const isActive = hasSubItems 
                    ? item.subItems.some(sub => sub.path === activePath)
                    : item.path === activePath;
                  const isExpanded = expandedMenus[item.label];

                  return (
                    <div key={item.label}>
                      <button type="button" aria-label={item.label}
                        aria-current={isActive && !hasSubItems ? "page" : undefined}
                        onClick={() => {
                          if (hasSubItems) {
                            setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                          } else {
                            navigate(item.path); setIsOpen(false);
                          }
                        }}
                        className={isFinanceMode ? (
                          `flex w-full items-center gap-3.5 text-left text-[13px] font-medium transition cursor-pointer ${
                            isCollapsed ? 'justify-center px-0 py-2.5 my-1' : 'px-3.5 py-2.5 mx-2.5 my-0.5 rounded-xl w-[calc(100%-20px)]'
                          } ${
                            isActive
                              ? (hasSubItems ? "bg-blue-50/70 text-slate-900 font-semibold border border-blue-100/80" : "bg-[#eef5ff] text-[#1a73e8] font-semibold")
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`
                        ) : (
                          `flex w-full items-center gap-4 py-3.5 text-left text-[14.5px] font-medium transition cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'pl-6 pr-4'} ${
                            isActive
                              ? "bg-[#003d6d] text-white border-l-4 border-white" // Active midtrans style
                              : "text-white/90 border-l-4 border-transparent hover:bg-[#003d6d] hover:text-white"
                          }`
                        )}
                      >
                        <span aria-hidden="true" className={`${isCollapsed ? "shrink-0 ml-1" : ""} ${isActive ? (isFinanceMode ? "text-[#1a73e8]" : "text-white") : (isFinanceMode ? "text-slate-500" : "text-white/80")}`}>{item.icon}</span>
                        {!isCollapsed && <span>{item.label}</span>}
                        {item.hasChevron && !isCollapsed && (
                          <ChevronRight className="w-4 h-4 ml-auto text-slate-400 shrink-0" />
                        )}
                        {item.highlight && !isActive && !isCollapsed && (
                          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[#00a5cf] text-white rounded-full">NEW</span>
                        )}
                        {hasSubItems && !isCollapsed && (
                          <span className="ml-auto text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                              <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </button>
                      {hasSubItems && isExpanded && !isCollapsed && (
                        <div className={isFinanceMode ? "flex flex-col bg-slate-50/70 border-l-2 border-blue-400/40 ml-5 mr-2.5 my-1 py-1 rounded-r-xl space-y-0.5" : "flex flex-col bg-[#004073]"}>
                          {item.subItems.map((sub) => {
                            const hasSubSub = !!sub.subItems;
                            const isSubActive = hasSubSub 
                              ? sub.subItems.some(ss => ss.path === activePath) 
                              : (sub.path && (
                                  sub.path.includes('?')
                                    ? (location.pathname + location.search) === sub.path
                                    : location.pathname === sub.path.split('?')[0]
                                ));
                            const isSubExpanded = expandedMenus[sub.label];

                            return (
                              <div key={sub.label}>
                                <button type="button"
                                  onClick={() => {
                                    if (hasSubSub) {
                                      setExpandedMenus(prev => ({ ...prev, [sub.label]: !prev[sub.label] }));
                                    } else {
                                      navigate(sub.path); setIsOpen(false);
                                    }
                                  }}
                                  className={isFinanceMode ? (
                                    `flex items-center justify-between w-full text-left pl-3.5 pr-3 py-2 text-[12.5px] rounded-lg transition-colors ${
                                      isSubActive 
                                        ? "text-[#1a73e8] font-semibold bg-[#eef5ff]" 
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                    }`
                                  ) : (
                                    `flex items-center justify-between w-full text-left pl-[3.25rem] pr-4 py-3 text-[13.5px] transition ${
                                      isSubActive ? "text-white font-bold bg-white/10 border-l-2 border-white/40" : "text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                                    }`
                                  )}
                                >
                                  <span className="flex items-center gap-2.5 min-w-0">
                                    {isFinanceMode && (
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isSubActive ? "bg-[#1a73e8]" : "bg-slate-300"}`} />
                                    )}
                                    <span className="truncate">{sub.label}</span>
                                  </span>
                                  {hasSubSub && (
                                    <span className="ml-auto">
                                      <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 transition-transform ${isSubExpanded ? "rotate-180" : ""}`}>
                                        <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </span>
                                  )}
                                </button>
                                
                                {hasSubSub && isSubExpanded && (
                                  <div className="flex flex-col bg-[#002f54]">
                                    {sub.subItems.map((ss) => {
                                      const isSSActive = location.pathname.startsWith(ss.path);
                                      return (
                                        <button key={ss.label} type="button"
                                          onClick={() => { navigate(ss.path); setIsOpen(false); }}
                                          className={`text-left pl-[4.5rem] pr-4 py-2.5 text-[12.5px] transition ${
                                            isSSActive ? "text-white font-bold bg-white/10 border-l-2 border-white/20" : "text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                                          }`}
                                        >
                                          {ss.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User info + Logout di bawah */}
        <div className={`shrink-0 ${isFinanceMode ? "border-t border-slate-100 p-3" : "border-t border-white/10 py-2"}`}>
          <button aria-label="Keluar dari Aplikasi" onClick={handleLogout}
            className={isFinanceMode ? (
              `flex w-full items-center gap-3 text-left text-[13px] font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition ${isCollapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'}`
            ) : (
              `flex w-full items-center gap-4 py-3.5 text-left text-[14.5px] font-medium text-white/80 transition border-l-4 border-transparent hover:bg-[#003d6d] hover:text-white ${isCollapsed ? 'justify-center px-0' : 'pl-6 pr-4'}`
            )}>
            {isFinanceMode ? (
              <LogOut className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 shrink-0 ${isCollapsed ? "ml-1" : ""}`}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}






