import { useNavigate } from "react-router-dom";
import { ChevronLeft, Box, Wrench, LogOut } from "lucide-react";
import Layout from "../components/Layout";

export default function MenuGA() {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Assets",
      desc: "Manajemen Aset",
      icon: Box,
      color: "bg-slate-100",
      iconColor: "text-slate-600",
      path: "/dashboard" // Placeholder
    },
    {
      title: "Maintenance",
      desc: "Jadwal & Laporan",
      icon: Wrench, color: "bg-rose-100 text-rose-600", path: "/home" }, // Placeholder path
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

        {/* Header */}
        <div className="relative z-10 px-5 pt-8 pb-2 flex justify-between items-center">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-white text-[17px] font-black tracking-wide">General Affair</h1>
          <div className="w-10 h-10"></div> {/* Spacer */}
        </div>

        {/* Hero Title */}
        <div className="relative z-10 px-6 pt-4 pb-12">
           <p className="text-white/80 text-[12px] font-bold uppercase tracking-[0.2em] mb-1">Fasilitas Kantor</p>
           <h2 className="text-[26px] font-black text-white leading-tight">
             Aset &<br/>Maintenance
           </h2>
        </div>

        {/* Modules */}
        <div className="relative z-10 px-5 mt-[-1.5rem] flex flex-col gap-4">
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
                className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center gap-5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 active:scale-[0.96] text-left"
              >
                <div className={`w-[56px] h-[56px] ${mod.color} rounded-[1.2rem] flex items-center justify-center shrink-0`}>
                  <Icon className="w-[28px] h-[28px] text-slate-700" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800 leading-snug">{mod.title}</h3>
                  <p className="text-[12px] font-semibold text-slate-400 mt-1 leading-snug">{mod.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}


