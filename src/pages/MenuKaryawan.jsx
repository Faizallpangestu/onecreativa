import { logoutUser } from "../utils/logoutUser";
import { useNavigate } from "react-router-dom";
import { 
  ScanFace, CalendarClock, Briefcase, Banknote, ClipboardList, 
  Receipt, LogOut, Search, Clock, Calendar as CalendarIcon, FileText, CheckCircle, ArrowRight, Download, MoreHorizontal, ShieldCheck, Check, CheckSquare, ChevronLeft, ChevronRight, Activity
} from "lucide-react";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useSEO } from "../hooks/useSEO";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
export default function MenuKaryawan() {
  const navigate = useNavigate();
  useSEO({ title: "Dashboard Karyawan", description: "Dashboard utama karyawan" });

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { /* Invalid cached session leaves user unset. */ }

  const [dashboardData, setDashboardData] = useState({
    stats: { hadir_hari_ini: '--:--', status_absen: 'Belum Absen', total_kehadiran: 0, izin_cuti: 0, terlambat: 0, alpa: 0, total_hari_kerja: 22 },
    calendar: {},
    gaji: null,
    tugas: []
  });

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/dashboard_karyawan.php?user_id=${user.id}`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success') setDashboardData(res.data);
        })
        .catch(err => console.error("Failed to fetch dashboard data", err));
    }
  }, [user?.id]);

  // Date formatted: Kamis, 2 Oktober 2026
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateString = today.toLocaleDateString('id-ID', options);
  const currentMonthName = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Custom Calendar logic for UI
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0 instead of Sunday if desired, but default getDay(): Sun=0. Let's make Mon=0
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={false}>
      <div className="min-h-screen bg-[#f8fafc] md:bg-slate-50 relative pb-28 md:pb-12">
        <div className="px-4 sm:px-10 pt-6 flex-1 flex flex-col w-full max-w-6xl mx-auto space-y-6">
          
          {/* Hero Banner */}
          <div className="relative w-full h-[220px] md:h-[260px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e293b] border border-slate-700/50 shadow-2xl flex items-center">
            
            {/* The 3D Illustration */}
            <div className="absolute right-0 top-0 bottom-0 w-[200px] md:w-[300px]" style={{
              backgroundImage: "url('/images/dashboard_hero_dark.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              maskImage: 'linear-gradient(to right, transparent, black 40%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)'
            }}></div>
            
            <div className="p-6 md:p-10 relative z-10 w-full md:w-[65%] lg:w-[55%] flex flex-col gap-3 md:gap-4">
              
              {/* Date Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-blue-100 px-3 py-1.5 rounded-full w-max shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tracking-wide uppercase">{dateString}</span>
              </div>

              {/* Text Content */}
              <div>
                <h1 className="text-[24px] md:text-[32px] font-black text-white tracking-tight leading-[1.15]">
                  Selamat Datang, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#38bdf8]">
                    {user?.full_name || "Anggi Alfin S.Kom., M.Sc."}!
                  </span>
                </h1>
                <p className="text-slate-300 text-[13px] md:text-[14px] font-medium mt-2 leading-relaxed max-w-md hidden sm:block">
                  Terus berkontribusi dan raih prestasimu bersama LPK Creativa Bridging International.
                </p>
                <p className="text-slate-300 text-[12px] md:text-[14px] font-medium mt-1 leading-relaxed max-w-md sm:hidden">
                  Jangan lupa untuk mengisi presensi hari ini.
                </p>
              </div>


              
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-emerald-50/50 to-white backdrop-blur-sm p-6 rounded-[2rem] border border-emerald-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-12 h-12 rounded-[1rem] bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-5 relative z-10">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] font-bold text-slate-500 mb-1">Hadir Hari Ini</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-[28px] font-black text-emerald-600 leading-none">{dashboardData.stats.hadir_hari_ini}</h3>
                </div>
                <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-[11px] font-bold ${dashboardData.stats.status_absen === 'Sudah Absen' ? 'bg-emerald-100/80 text-emerald-700' : dashboardData.stats.status_absen === 'Terlambat' ? 'bg-rose-100/80 text-rose-700' : 'bg-slate-100/80 text-slate-700'}`}>{dashboardData.stats.status_absen}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/50 to-white backdrop-blur-sm p-6 rounded-[2rem] border border-blue-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-12 h-12 rounded-[1rem] bg-blue-100/80 text-blue-600 flex items-center justify-center mb-5 relative z-10">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] font-bold text-slate-500 mb-1">Total Kehadiran</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-[28px] font-black text-slate-800 leading-none">{dashboardData.stats.total_kehadiran}</h3>
                  <span className="text-[14px] font-bold text-slate-500 mb-0.5">hari</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.min(100, (dashboardData.stats.total_kehadiran / dashboardData.stats.total_hari_kerja) * 100)}%`}}></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{Math.round((dashboardData.stats.total_kehadiran / dashboardData.stats.total_hari_kerja) * 100) || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50/50 to-white backdrop-blur-sm p-6 rounded-[2rem] border border-amber-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-12 h-12 rounded-[1rem] bg-amber-100/80 text-amber-600 flex items-center justify-center mb-5 relative z-10">
                <Clock className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] font-bold text-slate-500 mb-1">Izin / Cuti</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-[28px] font-black text-slate-800 leading-none">{dashboardData.stats.izin_cuti}</h3>
                  <span className="text-[14px] font-bold text-slate-500 mb-0.5">hari</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{width: `${Math.min(100, (dashboardData.stats.izin_cuti / dashboardData.stats.total_hari_kerja) * 100)}%`}}></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{Math.round((dashboardData.stats.izin_cuti / dashboardData.stats.total_hari_kerja) * 100) || 0}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50/50 to-white backdrop-blur-sm p-6 rounded-[2rem] border border-rose-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-100/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-12 h-12 rounded-[1rem] bg-rose-100/80 text-rose-600 flex items-center justify-center mb-5 relative z-10">
                <ScanFace className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] font-bold text-slate-500 mb-1">Terlambat</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-[28px] font-black text-slate-800 leading-none">{dashboardData.stats.terlambat}</h3>
                  <span className="text-[14px] font-bold text-slate-500 mb-0.5">kali</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{width: `${Math.min(100, (dashboardData.stats.terlambat / dashboardData.stats.total_hari_kerja) * 100)}%`}}></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{Math.round((dashboardData.stats.terlambat / dashboardData.stats.total_hari_kerja) * 100) || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Grid */}
          <div className="sm:hidden bg-white p-6 rounded-[2rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <h3 className="text-[16px] font-black text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Menu Karyawan
            </h3>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            {[
              { label: 'Absensi', icon: ScanFace, color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/face-clock' },
              { label: 'Strava', icon: Activity, color: 'text-[#FC4C02]', bg: 'bg-orange-50', path: '/strava' },
              { label: 'Jadwal', icon: CalendarIcon, color: 'text-blue-500', bg: 'bg-blue-50', path: '/attendance' },
              { label: 'Tugas', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50', path: '/daily-report-karyawan' },
              { label: 'Slip Gaji', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-50', path: '/slip-gaji-karyawan' },
              { label: 'Cuti / Izin', icon: Briefcase, color: 'text-rose-500', bg: 'bg-rose-50', path: '/leaves' },
              { label: 'Histori', icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-50', path: '/attendance' },
              { label: 'Pengaturan', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50', path: '/settings' },
            ].map((menu, i) => (
              <button 
                key={i} 
                onClick={() => {
                  if (menu.action === 'logout') {
                    logoutUser();
                    navigate(menu.path);
                  } else if (menu.path !== '#') {
                    navigate(menu.path);
                  }
                }}
                className="flex flex-col items-center gap-2.5 group"
              >
                <div className={`w-[3.5rem] h-[3.5rem] rounded-[1.25rem] flex items-center justify-center transition-transform active:scale-95 ${menu.bg} ${menu.color}`}>
                  <menu.icon className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{menu.label}</span>
              </button>
            ))}
            </div>
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Kedisiplinan Kehadiran Chart */}
            <div className="lg:col-span-7 bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[17px] font-black text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Statistik Kedisiplinan
                </h3>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 lg:gap-16">
                
                {/* Donut Chart */}
                <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Hadir', value: dashboardData.stats.total_kehadiran, color: '#10b981' },
                          { name: 'Izin', value: dashboardData.stats.izin_cuti, color: '#f59e0b' },
                          { name: 'Sakit', value: 0, color: '#3b82f6' },
                          { name: 'Alpa', value: dashboardData.stats.alpa, color: '#f43f5e' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {[
                          { name: 'Hadir', value: dashboardData.stats.total_kehadiran, color: '#10b981' },
                          { name: 'Izin', value: dashboardData.stats.izin_cuti, color: '#f59e0b' },
                          { name: 'Sakit', value: 0, color: '#3b82f6' },
                          { name: 'Alpa', value: dashboardData.stats.alpa, color: '#f43f5e' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                        itemStyle={{ color: '#334155', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[36px] font-black text-slate-800 leading-none mb-1">{dashboardData.stats.total_hari_kerja}</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Hari</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  {[
                    { label: 'Hadir', value: dashboardData.stats.total_kehadiran, dotColor: 'bg-emerald-500', iconBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
                    { label: 'Izin / Cuti', value: dashboardData.stats.izin_cuti, dotColor: 'bg-amber-500', iconBg: 'bg-amber-50', textColor: 'text-amber-600' },
                    { label: 'Terlambat', value: dashboardData.stats.terlambat, dotColor: 'bg-rose-500', iconBg: 'bg-rose-50', textColor: 'text-rose-600' },
                    { label: 'Alpa', value: dashboardData.stats.alpa, dotColor: 'bg-slate-500', iconBg: 'bg-slate-50', textColor: 'text-slate-600' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between sm:w-[200px] p-3 rounded-[1rem] border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${stat.dotColor}`}></div>
                        </div>
                        <span className="text-[13px] font-bold text-slate-600">{stat.label}</span>
                      </div>
                      <span className={`text-[15px] font-black ${stat.textColor}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Calendar */}
            <div className="lg:col-span-5 bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-black text-slate-800">Presensi Bulan Ini</h3>
                <div className="flex items-center gap-2">
                  <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition"><ChevronLeft className="w-4 h-4"/></button>
                  <span className="text-[12px] font-bold text-slate-600 px-1">{currentMonthName}</span>
                  <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition"><ChevronRight className="w-4 h-4"/></button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center mb-4 text-[11px] font-bold text-slate-400">
                <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div className="text-rose-400">Sab</div><div className="text-rose-400">Min</div>
              </div>
              
              <div className="grid grid-cols-7 text-center gap-y-4 text-[13px] font-bold text-slate-700 flex-1 content-start">
                {blanks.map(b => <div key={`blank-${b}`} className="text-transparent">0</div>)}
                {days.map(d => {
                  let badge = null;
                  const isToday = d === today.getDate();
                  const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const calEntry = dashboardData.calendar[dateKey];
                  // Support both old string format and new object format
                  const calStatus = typeof calEntry === 'object' ? calEntry?.status : calEntry;
                  
                  if (calStatus === 'present' || calStatus === 'dinas') badge = "bg-emerald-500";
                  if (calStatus === 'late') badge = "bg-amber-400";
                  if (calStatus === 'absent') badge = "bg-rose-500";
                  if (calStatus === 'leave') badge = "bg-blue-400";
                  
                  return (
                    <div key={d} className="flex flex-col items-center justify-center gap-1">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : d % 7 === 6 || d % 7 === 0 ? 'text-rose-500 hover:bg-slate-50' : 'hover:bg-slate-100 cursor-pointer'}`}>
                        {d}
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${badge || 'bg-transparent'}`}></div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Hadir</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Terlambat</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Izin/Cuti</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Tidak Ada Jadwal</div>
              </div>
            </div>

          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Slip Gaji Terbaru */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><Banknote className="w-3.5 h-3.5" /></div>
                  Slip Gaji Terbaru
                </h3>
                <button onClick={() => navigate('/slip-gaji-karyawan')} className="text-[12px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {dashboardData.gaji ? (
                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-emerald-200 transition group cursor-pointer gap-4" onClick={() => navigate(`/slip-gaji-karyawan?month=${dashboardData.gaji.period_label || `${dashboardData.gaji.period_year}-${String(dashboardData.gaji.period_month).padStart(2, '0')}`}`)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-black text-slate-800 group-hover:text-emerald-700 transition">Gaji Bulan {dashboardData.gaji.period_month} {dashboardData.gaji.period_year}</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">Slip diterbitkan {dashboardData.gaji.created_at}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">{dashboardData.gaji.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <p className="text-[16px] font-black text-emerald-600">Rp {parseInt(dashboardData.gaji.net_salary).toLocaleString('id-ID')}</p>
                    <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition shadow-sm">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-[13px] font-bold">Belum ada slip gaji</p>
                </div>
              )}
            </div>

            {/* Tugas & Laporan Terbaru */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><ClipboardList className="w-3.5 h-3.5" /></div>
                  Laporan Kerja Terbaru
                </h3>
                <button onClick={() => navigate('/daily-report-karyawan')} className="text-[12px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {dashboardData.tugas && dashboardData.tugas.length > 0 ? dashboardData.tugas.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition cursor-pointer group" onClick={() => navigate('/daily-report-karyawan')}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-sm ${t.status === 'completed' ? 'bg-purple-50 text-purple-500 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'}`}>
                        {t.status === 'completed' ? <CheckSquare className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-black text-slate-800 group-hover:text-blue-700 transition line-clamp-1">{t.preview}</h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Dilaporkan: {t.report_date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {t.status === 'completed' ? 'Selesai' : 'Dalam Proses'}
                    </span>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-[13px] font-bold">Belum ada laporan</p>
                  </div>
                )}
              </div>
            </div>

            {/* Integrasi Strava Widget */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FC4C02] flex items-center justify-center"><Activity className="w-3.5 h-3.5" /></div>
                    Aktivitas Strava
                  </h3>
                  <button onClick={() => navigate('/strava')} className="text-[12px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                    Detail <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 bg-gradient-to-br from-orange-50/50 to-white border border-orange-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-orange-300 transition" onClick={() => navigate('/strava')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <Activity className="w-6 h-6 text-[#FC4C02]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-black text-slate-800">Akun Belum Terhubung</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">Tautkan untuk pantau olahraga</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#FC4C02] transition-colors" />
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100">
                <button onClick={() => navigate('/strava')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] transition-colors text-white text-[13px] font-bold shadow-lg shadow-orange-500/20">
                  Hubungkan Strava Sekarang
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
