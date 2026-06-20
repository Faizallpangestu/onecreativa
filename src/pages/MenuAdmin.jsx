import { useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Briefcase, MapPin, Loader2, CalendarClock, ShieldCheck, TrendingUp, LogOut, Settings } from "lucide-react";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";

export default function MenuAdmin() {
  const navigate = useNavigate();

  const modules = [
    { 
      title: "Kelola Karyawan", 
      desc: "Data Akun & Profil", 
      icon: Users, 
      color: "bg-blue-100 text-blue-600", 
      path: "/employees" 
    },
    { 
      title: "Master Jabatan", 
      desc: "Hierarki & Gaji", 
      icon: Briefcase, 
      color: "bg-amber-100 text-amber-600", 
      path: "/positions" 
    },
    { 
      title: "Rekap Absensi", 
      desc: "Riwayat Kehadiran", 
      icon: CalendarClock, 
      color: "bg-indigo-100 text-indigo-600", 
      path: "/attendance" 
    },
    { 
      title: "Lokasi Kantor", 
      desc: "Radius & Kordinat GPS", 
      icon: MapPin, 
      color: "bg-emerald-100 text-emerald-600", 
      path: "/location-settings" 
    },
    { 
      title: "Hak Akses Login", 
      desc: "HRD, Finance, Admin", 
      icon: ShieldCheck, 
      color: "bg-indigo-100 text-indigo-600", 
      path: "/access-rights" 
    },
    { 
      title: "Keuangan & Profit", 
      desc: "Laporan Mutasi & Arus Kas", 
      icon: TrendingUp, 
      color: "bg-emerald-100 text-emerald-600", 
      path: "/profit" 
    },
    { 
      title: "Pengaturan Sistem", 
      desc: "Jam Masuk & Info PT", 
      icon: Settings, 
      color: "bg-slate-100 text-slate-700", 
      path: "/settings" 
    },
    { 
      title: "Keluar", 
      desc: "Akhiri sesi aktif", 
      icon: LogOut, 
      color: "bg-rose-100 text-rose-600", 
      action: "logout" 
    },
  ];

  const [stats, setStats] = useState({ employees: 0, departments: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          axios.get("/api/employees.php"),
          axios.get("/api/departments.php")
        ]);
        
        const allEmps = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
        const actualEmps = allEmps.filter(e => {
            const r = (e.role_name || "karyawan").toLowerCase();
            return r === "karyawan" || r === "employee";
        });
        const empCount = actualEmps.length;

        const deptCount = Array.isArray(deptRes.data) ? deptRes.data.length : (deptRes.data?.data?.length || 0);
        
        setStats({ employees: empCount, departments: deptCount });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] pb-12 relative overflow-hidden">
        
        {/* Navy Blue Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        {/* ── Top Navigation ── */}
        <div className="relative z-10 px-5 pt-8 pb-2 flex justify-between items-center">
           <button 
             onClick={() => navigate("/home")}
             className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition active:scale-95"
           >
             <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
           </button>
           <h1 className="text-white text-[17px] font-black tracking-wide">Administrator</h1>
           <div className="w-10 h-10"></div>
        </div>

        {/* ── Hero Title ── */}
        <div className="relative z-10 px-6 pt-4 pb-8">
           <p className="text-white/80 text-[12px] font-bold uppercase tracking-[0.2em] mb-1">Super Admin</p>
           <h2 className="text-[26px] font-black text-white leading-tight">
             Master Data &<br/>Konfigurasi Sistem
           </h2>
        </div>

        {/* ── Dashboard Floating Stat Cards ── */}
        <div className="relative z-20 px-5 mt-[-1rem]">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
              <h2 className="text-[36px] font-black text-slate-800 leading-none flex items-center relative z-10">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats.employees}
              </h2>
              <p className="text-[12px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider relative z-10">Total Karyawan</p>
            </div>
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-amber-100/50 rounded-full blur-xl"></div>
              <h2 className="text-[36px] font-black text-slate-800 leading-none flex items-center relative z-10">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats.departments}
              </h2>
              <p className="text-[12px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider relative z-10">Total Dept</p>
            </div>
          </div>
        </div>

        {/* ── 2x2 Grid Modules ── */}
        <div className="relative z-10 px-5 mt-8">
          <div className="flex justify-between items-end mb-4 px-1">
             <h3 className="text-[16px] font-black text-slate-800">Menu Utama</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (mod.action === "logout") {
                      localStorage.removeItem("user");
                      navigate("/home");
                    } else {
                      navigate(mod.path);
                    }
                  }}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col items-start gap-5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-slate-50 transition-all duration-300 active:scale-[0.96]"
                >
                  <div className={`w-[52px] h-[52px] ${mod.color} rounded-[1.2rem] flex items-center justify-center shrink-0`}>
                    <Icon className="w-[26px] h-[26px]" strokeWidth={2.5} />
                  </div>
                  <div className="text-left mt-1">
                    <h3 className="text-[15px] font-black text-slate-800 leading-snug">{mod.title}</h3>
                    <p className="text-[12px] font-semibold text-slate-400 mt-1 leading-snug">{mod.desc}</p>
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
