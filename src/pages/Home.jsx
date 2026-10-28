
import { useNavigate } from "react-router-dom";
import { Search, Bell, ShieldCheck, Users, Wallet, Briefcase, Wrench, LogOut, Filter, LineChart } from "lucide-react";
import Layout from "../components/Layout";
import creativaLogo from "../assets/logo.png";
import hr3dBg from "../assets/hr_3d_bg.webp";

export default function Home() {
  const navigate = useNavigate();



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
    <Layout hideMobileHeader={true} hideBottomNav={true} hideSidebar={true}>
      <div className="min-h-full bg-slate-50 relative overflow-hidden flex flex-col">
        
        {/* Subtle Light Background Decorations for the white area */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-40 z-0 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-[120px] z-0 pointer-events-none"></div>
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-[120px] z-0 pointer-events-none"></div>

        {/* Modern Deep Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[320px] bg-[#0c1b33] rounded-b-[2.5rem] shadow-[0_10px_40px_rgb(12,46,89,0.3)] overflow-hidden z-0 pointer-events-none">
          
          {/* 3D Illustration Full Background */}
          <div className="absolute inset-0 w-full h-full opacity-50 mix-blend-luminosity">
            <img src={hr3dBg} alt="3D Office Environment" className="w-full h-full object-cover object-center" />
          </div>

          {/* Gradient overlays to ensure text remains highly readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1b33] via-[#0c2e59]/70 to-[#1e3a8a]/30 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1b33]/90 via-transparent to-transparent z-10"></div>

          {/* Glowing Orbs for dynamic design */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse z-10"></div>
          <div className="absolute top-[20%] right-[-5%] w-[250px] h-[250px] bg-indigo-400 rounded-full mix-blend-screen filter blur-[80px] opacity-30 z-10"></div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,white,transparent)] z-20"></div>
        </div>

        <div className="relative z-10 px-5 sm:px-10 pt-12 flex-1 flex flex-col w-full max-w-6xl mx-auto">
          
          {/* Top Bar: Texts & Actions */}
          <div className="flex items-start justify-between mb-10">
            {/* Welcome Text */}
            <div className="flex-1 pr-4">
              <h1 className="text-[30px] sm:text-[36px] font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">Hallo, Creativa</h1>
              <p className="text-[15px] sm:text-[17px] text-blue-100/90 mt-1.5 font-medium">Semangat terus ya, mau akses apa hari ini?</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-1 shrink-0">
              <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-300">
                <Bell className="w-[22px] h-[22px]" />
              </button>
              <div 
                className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)] border-[3px] border-white overflow-hidden shrink-0 transform hover:scale-105 transition-transform duration-300"
              >
                <img src={creativaLogo} alt="Creativa" className="w-full h-full object-contain p-1" />
              </div>
            </div>
          </div>

          {/* Search Bar & Filter - Centered Prominently */}
          <div className="flex items-center justify-center w-full mt-6 mb-16 relative z-50 pointer-events-auto">
            <div className="flex items-center gap-3 sm:gap-4 w-full max-w-3xl">
              <label className="flex-1 bg-white/95 backdrop-blur-md rounded-[1.5rem] flex items-center px-6 py-4 sm:py-5 shadow-[0_12px_40px_rgb(0,0,0,0.15)] border border-white/50 transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-400/30 focus-within:shadow-[0_15px_50px_rgb(12,46,89,0.25)] focus-within:-translate-y-1 group cursor-text">
                <Search className="w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors shrink-0 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Mau akses modul apa hari ini? (Misal: Absensi, HRD...)" 
                  className="w-full ml-4 bg-transparent border-none outline-none text-[15px] sm:text-[16px] font-semibold text-slate-700 placeholder-slate-400"
                />
              </label>
              <button className="w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] shrink-0 bg-white/95 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shadow-[0_12px_40px_rgb(0,0,0,0.15)] border border-white/50 hover:bg-white hover:-translate-y-1 hover:shadow-[0_15px_50px_rgb(12,46,89,0.25)] active:scale-95 transition-all duration-300 group cursor-pointer">
                <Filter className="w-6 h-6 sm:w-7 sm:h-7 text-slate-500 group-hover:text-blue-600 transition-colors pointer-events-none" />
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 sm:gap-6 pb-8">
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
                  className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-blue-100 hover:shadow-[0_12px_40px_rgba(12,46,89,0.08)] hover:-translate-y-1.5 active:scale-[0.97] transition-all duration-300 flex flex-col items-center justify-center p-6 sm:p-7 aspect-[1.05/1] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="w-[64px] h-[64px] bg-gradient-to-br from-slate-50 to-blue-50/50 text-[#0c2e59] rounded-[1.25rem] flex items-center justify-center mb-5 relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)] group-hover:scale-110 group-hover:text-blue-600 group-hover:shadow-[0_8px_20px_rgba(12,46,89,0.1)] transition-all duration-500 ease-out">
                    <Icon className="w-8 h-8 relative z-10" strokeWidth={2} />
                  </div>
                  <div className="text-center px-1 relative z-10">
                    <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800 leading-tight group-hover:text-[#0c2e59] transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-[11px] sm:text-[12px] font-semibold text-slate-500 mt-2 leading-snug px-2 group-hover:text-slate-600 transition-colors">
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
          <div className="text-center pb-8 pt-12">
            <p className="text-[13px] font-semibold text-slate-400">
              &copy; 2026 ERP One Creativa Bridging International. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}
