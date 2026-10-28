import { logoutUser } from "../utils/logoutUser";
import { useNavigate } from "react-router-dom";
import { 
  PieChart, Briefcase, CalendarClock, Users, Banknote, 
  LogOut, Search
} from "lucide-react";
import Layout from "../components/Layout";
import { useState } from "react";
import { useSEO } from "../hooks/useSEO";

export default function MenuHRD() {
  const navigate = useNavigate();
  useSEO({ title: "Menu HRD", description: "Menu navigasi HRD" });

  const [searchQuery, setSearchQuery] = useState("");

  const menuGroups = [
    {
      category: "HRD",
      items: [
        { title: "Dashboard HRIS", icon: PieChart, color: "text-purple-600 bg-purple-100", path: "/dashboard" },
        { title: "Approval Cuti", icon: Briefcase, color: "text-orange-600 bg-orange-100", path: "/leaves" },
        { title: "Rekap Absensi", icon: CalendarClock, color: "text-blue-600 bg-blue-100", path: "/attendance" },
        { title: "Data Karyawan", icon: Users, color: "text-emerald-600 bg-emerald-100", path: "/employees" },
        { title: "Kalkulasi Gaji", icon: Banknote, color: "text-blue-600 bg-blue-100", path: "/payroll-hrd" },
      ]
    },
    {
      category: "SISTEM",
      items: [
        { title: "Keluar", icon: LogOut, color: "text-rose-600 bg-rose-50", action: "logout" },
      ]
    }
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={false} >
      <div className="min-h-screen bg-[#f8fafc] md:bg-slate-50 relative pb-24 md:pb-12">
        <div className="px-5 sm:px-10 pt-8 flex-1 flex flex-col w-full max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-[28px] font-black text-slate-800 tracking-tight">Menu</h1>
          </div>

          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[52px] pl-12 pr-4 bg-white border border-slate-200/80 rounded-2xl text-[14px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" 
            />
          </div>

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
