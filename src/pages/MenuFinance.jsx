import { useNavigate } from "react-router-dom";
import { ChevronLeft, Banknote, Receipt, TrendingUp, LogOut } from "lucide-react";
import Layout from "../components/Layout";

export default function MenuFinance() {
  const navigate = useNavigate();

  const modules = [
    { 
      title: "Payroll & Slip Gaji", 
      desc: "Hitung dan cetak slip gaji bulanan karyawan", 
      icon: Banknote, 
      color: "bg-emerald-500 text-white shadow-emerald-500/30", 
      path: "/payroll" 
    },
    { 
      title: "Laporan Profit", 
      desc: "Grafik arus kas, laba, dan pencatatan pengeluaran", 
      icon: TrendingUp, 
      color: "bg-indigo-600 text-white shadow-indigo-600/30", 
      path: "/profit" 
    },
    { 
      title: "Approval Reimbursement", 
      desc: "Validasi struk klaim karyawan", 
      icon: Receipt, 
      color: "bg-cyan-500 text-white shadow-cyan-500/30", 
      path: "/reimbursement" 
    },
    { 
      title: "Keluar", 
      desc: "Akhiri sesi aktif", 
      icon: LogOut, 
      color: "bg-rose-500 text-white shadow-rose-500/30", 
      action: "logout" 
    },
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] pb-12 relative overflow-hidden">
        
        {/* Navy Blue Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        {/* Header Section */}
        <div className="flex items-center justify-center pt-6 mb-8 relative">
          <span className="text-white/90 text-sm font-medium">Menu Keuangan</span>
          
          <button 
            onClick={() => navigate('/home')}
            className="absolute left-5 top-5 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="relative z-10 px-6">
          {/* Title Area */}
          <div className="mb-10 text-white">
            <h1 className="text-2xl font-bold mb-2">Keuangan & Akuntansi</h1>
            <p className="text-blue-100 text-[13px] opacity-90 leading-relaxed">
              Kelola aset, gaji, dan analisis arus kas perusahaan.
            </p>
          </div>

          {/* Menu Cards */}
          <div className="space-y-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (mod.action === "logout") {
                      if(window.confirm("Yakin ingin keluar?")) {
                        localStorage.removeItem("user");
                        navigate("/login");
                      }
                    } else if (mod.path) {
                      navigate(mod.path);
                    }
                  }}
                  className="w-full bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 active:scale-[0.98] transition-all flex items-center gap-5 group"
                >
                  <div className={`w-[52px] h-[52px] rounded-[1.2rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${mod.color}`}>
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-[15px] font-bold text-slate-800 mb-0.5">{mod.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">{mod.desc}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <ChevronLeft className="w-4 h-4 rotate-180" />
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
