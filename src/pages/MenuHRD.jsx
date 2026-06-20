import { useNavigate } from "react-router-dom";
import { ChevronLeft, PieChart, Briefcase, CalendarClock, Users, Banknote, LogOut } from "lucide-react";
import Layout from "../components/Layout";

export default function MenuHRD() {
  const navigate = useNavigate();

  const modules = [
    { 
      title: "Dashboard HRIS", 
      desc: "Statistik Kepegawaian", 
      icon: PieChart, 
      color: "bg-purple-100 text-purple-600", 
      path: "/dashboard" 
    },
    { 
      title: "Approval Cuti", 
      desc: "Setujui Izin / Cuti", 
      icon: Briefcase, 
      color: "bg-orange-100 text-orange-600", 
      path: "/leaves" 
    },
    { 
      title: "Rekap Absensi", 
      desc: "Review Kehadiran", 
      icon: CalendarClock, 
      color: "bg-blue-100 text-blue-600", 
      path: "/attendance" 
    },
    { 
      title: "Data Karyawan", 
      desc: "Kelola Profil & Akun", 
      icon: Users, 
      color: "bg-emerald-100 text-emerald-600", 
      path: "/employees" 
    },
    { 
      title: "Kalkulasi Gaji", 
      desc: "Hitung & Simpan Draft", 
      icon: Banknote, 
      color: "bg-blue-100 text-blue-600", 
      path: "/payroll-hrd" 
    },
    { 
      title: "Keluar", 
      desc: "Akhiri sesi aktif", 
      icon: LogOut, 
      color: "bg-rose-100 text-rose-600", 
      action: "logout" 
    },
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] pb-12 relative overflow-hidden">
        
        {/* Navy Blue Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        {/* Top Navigation */}
        <div className="relative z-10 px-5 pt-8 pb-2 flex justify-between items-center">
           <button 
             onClick={() => navigate("/home")}
             className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition active:scale-95"
           >
             <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
           </button>
           <h1 className="text-white text-[17px] font-black tracking-wide">Human Resources</h1>
           <div className="w-10 h-10"></div> {/* Spacer */}
        </div>

        {/* Hero Title */}
        <div className="relative z-10 px-6 pt-4 pb-12">
           <p className="text-white/80 text-[12px] font-bold uppercase tracking-[0.2em] mb-1">Menu HRD</p>
           <h2 className="text-[26px] font-black text-white leading-tight">
             Pantau Produktivitas<br/>Karyawan
           </h2>
        </div>

        {/* Grid Modules */}
        <div className="relative z-10 px-5 mt-[-1.5rem]">
          <div className="grid grid-cols-2 gap-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (mod.action === "logout") {
                      localStorage.removeItem("user");
                      navigate("/login");
                    } else {
                      navigate(mod.path);
                    }
                  }}
                  className="bg-white p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left transition-all active:scale-95 flex flex-col justify-between h-36 border border-slate-100"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mod.color} mb-3`}>
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800 mb-1 leading-tight">{mod.title}</h3>
                    <p className="text-[11px] font-medium text-slate-400 leading-tight">{mod.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
