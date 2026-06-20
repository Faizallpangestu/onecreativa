import { useLocation, useNavigate } from "react-router-dom";

function SidebarIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      {children}
    </svg>
  );
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil data user dari localStorage
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch {}

  const isEmployee = user?.role_name === "employee";

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: (
        <SidebarIcon>
          <path d="M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Employees",
      path: "/employees",
      hidden: isEmployee,
      icon: (
        <SidebarIcon>
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19a5 5 0 0 1 10 0v1H3v-1Zm8 1v-1a5 5 0 0 1 8.66-3.46A5 5 0 0 1 21 19v1h-10Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Attendance",
      path: "/attendance",
      icon: (
        <SidebarIcon>
          <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8 2 2 5-5"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Assign RFID",
      path: "/assign-rfid",
      hidden: isEmployee,
      icon: (
        <SidebarIcon>
          <path d="M12 3v3m0 12v3M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M3 12h3m12 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Overtime",
      path: "/overtime",
      icon: (
        <SidebarIcon>
          <path d="M12 7v5l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Payroll",
      path: "/payroll",
      hidden: isEmployee,
      icon: (
        <SidebarIcon>
          <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9ZM3 9h18M7 15h4"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Cuti & Izin",
      path: "/leaves",
      icon: (
        <SidebarIcon>
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Persetujuan Dinas",
      path: "/dinas",
      hidden: isEmployee,
      icon: (
        <SidebarIcon>
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </SidebarIcon>
      ),
    },
    {
      label: "Settings",
      path: "/settings",
      hidden: isEmployee,
      icon: (
        <SidebarIcon>
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Master Jabatan",
      path: "/positions",
      hidden: isEmployee,
      icon: (
        <SidebarIcon>
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3h-8v4h8V3z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Absen Wajah 📷",
      path: "/face-clock",
      highlight: true,
      icon: (
        <SidebarIcon>
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
    {
      label: "Daftar Wajah",
      path: "/face-enrollment",
      icon: (
        <SidebarIcon>
          <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SidebarIcon>
      ),
    },
  ];

  const roleBadgeClass = {
    super_admin: "bg-amber-500/20 text-amber-300",
    manager:     "bg-blue-500/20 text-blue-300",
    hr:          "bg-emerald-500/20 text-emerald-300",
    finance:     "bg-purple-500/20 text-purple-300",
    employee:    "bg-slate-500/20 text-slate-300",
  }[user?.role_name] ?? "bg-slate-500/20 text-slate-300";

  const roleLabel = {
    super_admin: "Super Admin",
    manager:     "Manager",
    hr:          "HRD",
    finance:     "Finance",
    employee:    "Employee",
  }[user?.role_name] ?? user?.role_name ?? "Guest";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 px-6 py-7 text-slate-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">HRIS</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              PT.Creativa Bridging International
            </p>
          </div>
          <button onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 lg:hidden">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Nav menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {menuItems.filter(item => !item.hidden).map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button key={item.label} type="button"
                onClick={() => { navigate(item.path); setIsOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${
                  item.highlight && !isActive
                    ? "bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
                    : isActive
                    ? "bg-blue-950/70 text-blue-300"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── User info + Logout di bawah ── */}
        <div className="mt-6 border-t border-slate-700/60 pt-5">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-800/50 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
                {(user.email?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user.email?.split("@")[0] ?? "User"}
                </p>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${roleBadgeClass}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          )}

          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
