import { logoutUser } from "../utils/logoutUser";
import { useNavigate } from "react-router-dom";
import { 
  Users, MapPin, ShieldCheck, Search, CalendarClock, LogOut, 
  FileText, Settings, TrendingUp, TrendingDown, DollarSign, 
  WalletCards, Briefcase, Clock, ClipboardList, ClipboardCheck, 
  Banknote, CreditCard, Box, BarChart2, ArrowRightLeft, Wrench, Home, LayoutDashboard, GraduationCap, CalendarCheck, Calendar as CalendarIcon, LayoutGrid, CheckCircle, Scan, BookOpen
} from "lucide-react";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useSEO } from "../hooks/useSEO";
import { FINANCE_MENU_ITEMS } from "../utils/financeNavigation";

export default function MenuAdmin() {
  const navigate = useNavigate();
  useSEO({ title: "Admin Menu", description: "Menu navigasi administrator" });

  const [searchQuery, setSearchQuery] = useState("");
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greet = () => {
    const h = timeNow.getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 15) return "Selamat Siang";
    if (h < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const menuGroups = [
    {
      category: "HRD",
      items: [
        { title: "Dashboard", icon: Home, color: "text-blue-500 bg-blue-50", path: "/dashboard" },
        { title: "Manajemen Karyawan", icon: Users, color: "text-indigo-500 bg-indigo-50", path: "/employees" },
        { title: "Hak Akses GA", icon: ShieldCheck, color: "text-purple-500 bg-purple-50", path: "/access-rights-ga" },
        { title: "Hak Akses HRD & Admin", icon: ShieldCheck, color: "text-blue-500 bg-blue-50", path: "/access-rights-hr" },
        { title: "Hak Akses Finance", icon: ShieldCheck, color: "text-emerald-500 bg-emerald-50", path: "/access-rights-finance" },
        { title: "Hak Akses Sensei", icon: ShieldCheck, color: "text-rose-500 bg-rose-50", path: "/access-rights-sensei" },
        { title: "Hak Akses Siswa", icon: ShieldCheck, color: "text-indigo-500 bg-indigo-50", path: "/access-rights-siswa" },
        { title: "Data Jabatan", icon: Briefcase, color: "text-emerald-500 bg-emerald-50", path: "/positions" },
        { title: "Riwayat Absensi", icon: CalendarCheck, color: "text-emerald-500 bg-emerald-50", path: "/attendance" },
        { title: "Pengajuan Cuti", icon: CalendarIcon, color: "text-amber-500 bg-amber-50", path: "/leaves" },
        { title: "Perhitungan Gaji", icon: CreditCard, color: "text-purple-500 bg-purple-50", path: "/payroll-hrd" },
        FINANCE_MENU_ITEMS.find(item => item.path === "/salary"),
        { title: "Laporan Kerja", icon: ClipboardList, color: "text-rose-500 bg-rose-50", path: "/daily-report-admin" },
        { title: "Lembur", icon: Clock, color: "text-rose-500 bg-rose-50", path: "/overtime" },
      ]
    },
    {
      category: "GA",
      items: [
        { title: "Data Aset", icon: Box, color: "text-blue-500 bg-blue-50", path: "/assets" },
        { title: "Laporan Aset", icon: FileText, color: "text-emerald-500 bg-emerald-50", path: "/assets/laporan" },
        { title: "Laporan Audit", icon: ClipboardCheck, color: "text-rose-500 bg-rose-50", path: "/assets/audit" },
        { title: "Persetujuan Aset", icon: CheckCircle, color: "text-purple-500 bg-purple-50", path: "/assets/approval" },
        { title: "Pemeliharaan", icon: Wrench, color: "text-amber-500 bg-amber-50", path: "/assets/maintenance" },
        { title: "Scan QR Aset", icon: Scan, color: "text-indigo-500 bg-indigo-50", path: "/assets/scan" },
      ]
    },
    {
      category: "KEUANGAN",
      items: FINANCE_MENU_ITEMS.filter(item => item.path !== "/salary")
    },
    {
      category: "LPK CREATIVA",
      items: [
        { title: "LMS", icon: BookOpen, color: "text-blue-500 bg-blue-50", path: "/lms/agenda" },
        { title: "Matching Job", icon: Briefcase, color: "text-purple-500 bg-purple-50", path: "/matching-job" },
        { title: "Nenkin", icon: DollarSign, color: "text-indigo-500 bg-indigo-50", path: "/nenkin" },
      ]
    },
    {
      category: "SETTING",
      items: [
        { title: "Pengaturan Lokasi", icon: MapPin, color: "text-teal-500 bg-teal-50", path: "/location-settings" },
        { title: "Keluar", icon: LogOut, color: "text-rose-600 bg-rose-50", action: "logout" },
      ]
    }
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={false}>
      <div className="min-h-screen bg-[#f8fafc] md:bg-slate-50 relative pb-24 md:pb-12">
        <div className="px-4 sm:px-10 pt-6 flex-1 flex flex-col w-full max-w-5xl mx-auto">
          
          {/* Hero Banner Sama Seperti Dashboard */}
          <div className="relative w-full h-[180px] md:h-[240px] rounded-[1.25rem] md:rounded-[2rem] overflow-hidden shadow-lg bg-[#102a43] flex items-center mb-6 border border-blue-100/10">
            <div className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'center 40%',
              }}
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#102a43] via-[#102a43]/90 to-transparent"></div>
            
            <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center px-6 md:px-12">
              <div className="max-w-xl text-white">
                <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 tracking-tight drop-shadow-md">
                  {greet()}, <span className="text-yellow-400">Admin! 👋</span>
                </h1>
                <p className="text-blue-100/90 text-[13px] md:text-[15px] font-medium leading-relaxed drop-shadow-sm max-w-[250px] md:max-w-full line-clamp-2 md:line-clamp-none">
                  Kelola seluruh operasional HRIS dengan lebih efektif dan efisien.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-6 text-white">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px] shadow-soft">
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">
                    {timeNow.toLocaleDateString('id-ID', { weekday: 'long' })}
                  </p>
                  <p className="text-lg font-black tracking-tight">
                    {timeNow.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[52px] pl-12 pr-4 bg-white border border-slate-200/80 rounded-2xl text-[14px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" 
            />
          </div>

          {/* Modules Grid */}
          <div className="space-y-8 md:space-y-10">
            {menuGroups.map((group, i) => {
              const filteredItems = group.items.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              if (filteredItems.length === 0) return null;

              return (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <h2 className="text-[12px] md:text-[13px] font-black text-slate-500/80 uppercase tracking-widest mb-4 px-1">
                    {group.category}
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-7 gap-x-3 sm:gap-x-5">
                    {filteredItems.map((item, j) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={j}
                          onClick={() => {
                            if (item.action === "logout") {
                              logoutUser();
                              navigate("/home");
                            } else {
                              navigate(item.path);
                            }
                          }}
                          className="flex flex-col items-center text-center group"
                        >
                          <div className={`w-[60px] h-[60px] md:w-[64px] md:h-[64px] rounded-[1.25rem] flex items-center justify-center mb-3 ${item.color} shadow-sm group-hover:shadow-md group-hover:-translate-y-1 group-active:scale-95 transition-all duration-300`}>
                            <Icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />
                          </div>
                          <span className="text-[11px] md:text-[12px] font-extrabold text-slate-700 leading-[1.3] px-1 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </Layout>
  );
}
