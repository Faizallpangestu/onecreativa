import { useNavigate } from "react-router-dom";
import { ChevronLeft, ScanFace, CalendarClock, Briefcase, Banknote, Clock, MapPin, LogOut, Calendar, Receipt } from "lucide-react";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

export default function MenuKaryawan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return "K";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  const modules = [
    { title: "Absen Wajah", desc: "Clock in & Out harian", icon: ScanFace, color: "bg-blue-100 text-blue-600", path: "/face-clock" },
    { title: "Riwayat Absen", desc: "Data kehadiran", icon: CalendarClock, color: "bg-indigo-100 text-indigo-600", path: "/attendance" },
    { title: "Cuti & Izin", desc: "Pengajuan libur", icon: Briefcase, color: "bg-orange-100 text-orange-600", path: "/leaves" },
    { title: "Dinas Luar Kota", desc: "Kunjungan & meeting", icon: MapPin, color: "bg-purple-100 text-purple-600", path: "/dinas" },
    { title: "Slip Gaji", desc: "Rincian gaji bulanan", icon: Banknote, color: "bg-emerald-100 text-emerald-600", path: "/slip-gaji-karyawan" },
    { title: "Klaim / Struk", desc: "Reimbursement", icon: Receipt, color: "bg-cyan-100 text-cyan-600", path: "/reimbursement" },
    { title: "Keluar", desc: "Akhiri sesi aktif", icon: LogOut, color: "bg-rose-100 text-rose-600", action: "logout" },
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] pb-12 relative overflow-hidden">
        
        {/* Navy Blue Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[190px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        {/* Profile Section inside Hero */}
        <div className="relative z-10 px-6 pt-10 pb-10 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-[72px] h-[72px] rounded-full bg-white/20 flex items-center justify-center text-2xl font-black text-white overflow-hidden border-2 border-white/40 shadow-xl backdrop-blur-md">
              {user?.photo ? (
                <img 
                  src={`/uploads/photos/${user.photo}`} 
                  alt={user?.name || user?.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user?.name || user?.full_name)
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-[3px] border-blue-600 shadow-sm"></div>
          </div>
          
          <div className="flex-1 min-w-0 text-white">
             <p className="text-white/80 text-[13px] font-semibold mb-0.5">
               Selamat {(() => {
                 const h = new Date().getHours();
                 if (h >= 4 && h < 11) return "pagi,";
                 if (h >= 11 && h < 15) return "siang,";
                 if (h >= 15 && h < 18) return "sore,";
                 return "malam,";
               })()}
             </p>
             <h2 className="text-[22px] font-black truncate leading-tight drop-shadow-sm">
               {user?.gender === 'Perempuan' ? 'Ibu ' : (user?.gender === 'Laki-laki' ? 'Bapak ' : '')}{(user?.name || user?.full_name || user?.employee_code || "")}
             </h2>
             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full mt-2.5 backdrop-blur-sm border border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">
                  {user?.employee_code ? `${user.employee_code} • ` : ''}{user?.position || user?.position_name || user?.role_name || 'Staff'}
                </span>
             </div>
          </div>
        </div>

        {/* Floating Quick Info Card */}
        <div className="relative z-20 px-5 mt-[-1.5rem]">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f4f6f8] flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jam Masuk Hari Ini</p>
                <p className="text-[15px] font-black text-slate-800">08:00 AM</p>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Lokasi</p>
                <p className="text-[15px] font-black text-slate-800 text-right">Office</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="relative z-10 px-5 mt-8">
          <h3 className="text-[16px] font-black text-slate-800 mb-4 px-1">Menu Utama</h3>
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
