import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ShieldCheck, Users, Wallet, Briefcase, Wrench, LogOut, Filter, LineChart } from "lucide-react";
import Layout from "../components/Layout";
import creativaLogo from "../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("A");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const displayName = user.name || user.full_name || "";
    if (displayName) setUserName(displayName.charAt(0).toUpperCase());
  }, []);

  const menus = [
    {
      title: "Karyawan",
      desc: "Absensi, Cuti, Data Diri",
      icon: Users,
      path: "/menu-karyawan"
    },
    {
      title: "HRD",
      desc: "Approval, Rekrutmen",
      icon: Briefcase,
      path: "/menu-hrd"
    },
    {
      title: "Finance",
      desc: "Penggajian, Reimbursement",
      icon: Wallet,
      path: "/menu-finance"
    },
    {
      title: "Admin",
      desc: "Master Data, Keamanan",
      icon: ShieldCheck,
      path: "/menu-admin"
    },
    {
      title: "General Affair",
      desc: "Aset, Inventaris, Sarana",
      icon: Wrench,
      path: "/menu-ga"
    },
    {
      title: "Laporan",
      desc: "Analitik & Insights",
      icon: LineChart,
      path: "/dashboard"
    }
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] relative overflow-hidden flex flex-col">
        
        {/* Navy Blue Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        <div className="relative z-10 px-5 pt-10 flex-1 flex flex-col">
          
          {/* Top Bar: Texts & Actions */}
          <div className="flex items-start justify-between mb-6">
            {/* Welcome Text */}
            <div className="flex-1 pr-2">
              <h1 className="text-[24px] font-bold text-white tracking-tight leading-tight">Hallo, Creativa</h1>
              <p className="text-[13px] text-blue-100 mt-1 opacity-90">Semangat terus ya, mau akses apa hari ini?</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 shrink-0">
              <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90">
                <Bell className="w-[20px] h-[20px]" />
              </button>
              <div 
                className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-md border-[2px] border-white/90 overflow-hidden shrink-0"
              >
                <img src={creativaLogo} alt="Creativa" className="w-full h-full object-contain p-1" />
              </div>
            </div>
          </div>

          {/* Search Bar & Filter */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3 shadow-md border border-slate-100">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari menu..." 
                className="w-full ml-3 bg-transparent border-none outline-none text-[14px] font-medium text-slate-700 placeholder-slate-400"
              />
            </div>
            <button className="w-[46px] h-[46px] bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 active:scale-90 transition-transform">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 gap-4 pb-6">
            {menus.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    const userStr = localStorage.getItem("user");
                    if (userStr) {
                      const user = JSON.parse(userStr);
                      const roleMap = {
                        "/menu-karyawan": ["karyawan"],
                        "/menu-hrd": ["hr", "manager"],
                        "/menu-finance": ["finance"],
                        "/menu-admin": ["admin", "super_admin"],
                        "/menu-ga": ["ga"],
                        "/dashboard": ["admin", "super_admin", "hr", "manager", "finance"]
                      };
                      const allowedRoles = roleMap[mod.path] || [];
                      if (allowedRoles.includes(user.role_name)) {
                        navigate(mod.path);
                      } else {
                        alert(`Akses ditolak. Menu ini hanya untuk: ${allowedRoles.join(", ")}.\nRole Anda: ${user.role_name}`);
                      }
                    } else {
                      navigate(`/login?redirect=${encodeURIComponent(mod.path)}`);
                    }
                  }}
                  className="bg-[#fcf8f2] rounded-3xl shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-[#eaddd1] hover:border-blue-200 active:scale-[0.96] transition-all duration-300 flex flex-col items-center justify-center p-6 aspect-[1.05/1]"
                >
                  <div className="w-[56px] h-[56px] bg-[#d7e5f0] text-[#0c2e59] rounded-2xl flex items-center justify-center mb-4 relative shadow-inner">
                    <Icon className="w-7 h-7 relative z-10" strokeWidth={2} />
                  </div>
                  <div className="text-center px-1">
                    <h3 className="text-[14px] font-bold text-[#0c2e59] leading-tight">
                      {mod.title}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-tight px-2">
                      {mod.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Footer Copyright */}
          <div className="text-center pb-6 pt-4">
            <p className="text-[11px] font-medium text-slate-400">
              &copy; 2026 ERP One Creativa Bridging International. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}
