import React, { useState, useEffect, useMemo } from "react";
import { FINANCE_MENU_ITEMS } from "../utils/financeNavigation";
import axios from "axios";
import Layout from "../components/Layout";
import {
  GraduationCap, BookOpen, Users, ShieldCheck, UserPlus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, FileText, CheckCircle2,
  Megaphone, Download, TrendingUp, TrendingDown, Activity, Settings,
  Home, Briefcase, CalendarClock, CalendarCheck, ClipboardCheck, Banknote, CreditCard, ClipboardList,
  Box, BarChart2, ArrowRightLeft, Wrench, MapPin, WalletCards, DollarSign, LayoutDashboard, LayoutGrid, CheckCircle, Scan
} from "lucide-react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

export default function Dashboard() {
  const [timeNow, setTimeNow] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [finance, setFinance] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // State for expanding full menu on mobile
  const [showFullMenu, setShowFullMenu] = useState(false);

  // Define full menu groups for mobile inline dropdown
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
      ]
    }
  ];

  useEffect(() => {
    const t = setInterval(() => setTimeNow(new Date()), 60000);
    const fetchData = async () => {
      try {
        const [empRes, leaveRes, attRes, finRes, assetRes] = await Promise.all([
          axios.get('/api/employees.php'),
          axios.get('/api/leaves.php'),
          axios.get('/api/attendance.php'),
          axios.get('/api/finance.php'),
          axios.get('/api/assets.php')
        ]);
        if (empRes.data?.data) setEmployees(empRes.data.data);
        if (leaveRes.data?.data) setLeaves(leaveRes.data.data);
        if (attRes.data?.data) setAttendance(attRes.data.data);
        if (finRes.data?.data) setFinance(finRes.data.data);
        if (assetRes.data?.data) setAssets(assetRes.data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => String(e.is_active) === "1").length;
    const todayStr = new Date().toISOString().slice(0,10);
    const todayLeaves = leaves.filter(l => {
       if(l.status !== 'approved') return false;
       return l.start_date <= todayStr && l.end_date >= todayStr;
    }).length;
    const todayPresence = attendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'Hadir')).length;
    const todayLate = attendance.filter(a => a.date === todayStr && (a.status === 'late' || a.status === 'Terlambat')).length;
    return { total, active, todayLeaves, todayPresence, todayLate };
  }, [employees, leaves, attendance]);

  const pendingVerifications = useMemo(() => {
    return leaves.filter(l => l.status === 'pending').map(l => {
      const emp = employees.find(e => e.id === l.employee_id);
      return {
        id: l.id,
        name: l.employee_name || 'Unknown',
        dept: emp?.department || 'Lainnya',
        date: l.start_date,
        initial: (l.employee_name || 'U').charAt(0).toUpperCase(),
        bg: "bg-blue-100 text-blue-600"
      };
    }).slice(0, 5);
  }, [leaves, employees]);

  const todayAttendance = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0,10);
    return attendance.filter(a => a.date === todayStr).map(a => {
      return {
        name: a.name || 'Unknown',
        role: a.department || 'Lainnya',
        status: a.status === 'present' ? 'Hadir' : (a.status === 'late' ? 'Terlambat' : (a.status === 'absent' || a.status === 'alpa' ? 'Alpa' : 'Izin')),
        time: a.check_in ? a.check_in.split(' ')[1]?.substring(0,5) || a.check_in : '-',
        c: a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : (a.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'),
        initial: (a.name || 'U').charAt(0).toUpperCase()
      };
    }).slice(0, 5);
  }, [attendance]);

  const greet = () => {
    const h = timeNow.getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 15) return "Selamat Siang";
    if (h < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const cashFlowDynamic = useMemo(() => {
    const year = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = months.map(m => ({ name: m, pemasukan: 0, pengeluaran: 0 }));
    finance.forEach(f => {
       const d = new Date(f.transaction_date);
       if (d.getFullYear() === year) {
          const mIdx = d.getMonth();
          if (f.type === 'income') data[mIdx].pemasukan += Number(f.amount) / 1000000;
          else if (f.type === 'expense') data[mIdx].pengeluaran += Number(f.amount) / 1000000;
       }
    });
    const currentMonth = new Date().getMonth();
    return data.slice(0, currentMonth + 1);
  }, [finance]);

  const hrStats = useMemo(() => {
     const depts = {};
     let total = 0;
     employees.forEach(e => {
        const d = e.department || 'Lainnya';
        depts[d] = (depts[d] || 0) + 1;
        total++;
     });
     const colors = ["bg-[#2563eb]", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
     return Object.entries(depts).sort((a,b) => b[1] - a[1]).slice(0, 5).map((entry, idx) => ({
        lbl: entry[0],
        val: entry[1],
        max: total > 0 ? total : 50,
        color: colors[idx % colors.length]
     }));
  }, [employees]);

  const dynamicAssets = useMemo(() => {
    const colors = ["bg-blue-50 text-blue-500", "bg-orange-50 text-orange-500", "bg-emerald-50 text-emerald-500", "bg-rose-50 text-rose-500", "bg-purple-50 text-purple-500"];
    return assets.slice(0, 6).map((a, i) => ({
      title: a.name || 'Unknown Asset',
      loc: a.location || '-',
      user: a.created_by_name || 'Admin',
      cond: a.condition || '-',
      colorClass: colors[i % colors.length]
    }));
  }, [assets]);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={false}>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-4 md:pb-12">
        <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6">
          
          {/* HERO BANNER dengan Efek "3D" */}
          <div className="px-4 md:px-0">
            <div className="relative w-full h-[180px] md:h-[240px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-lg bg-[#eef2ff] flex items-center mt-2 md:mt-0 border border-blue-100">
              {/* Latar Belakang Gambar (Office modern/Corporate) */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop')`,
                  backgroundPosition: 'center 40%',
                }}
              />
              {/* Gradient Overlay dari biru ke transparan */}
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
          </div>

          {/* MOBILE DATE BAR & QUICK STATS (Visible on Mobile Only) */}
          <div className="md:hidden px-4 mb-6 mt-2">
            {/* Date Time Bar */}
            <div className="flex items-center justify-between bg-white rounded-[1rem] shadow-sm border border-slate-100 p-4 mb-5">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <span className="text-[12px] font-bold text-slate-700">
                  {timeNow.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <span className="text-[12px] font-bold text-slate-700">
                {timeNow.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>

            {/* 2x2 Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#eff6ff] rounded-[1rem] p-4 flex flex-col justify-between border border-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Total Karyawan</span>
                </div>
                <h3 className="text-[26px] font-black text-[#102a43] leading-none mb-1.5">{stats.total}</h3>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> +12%</span>
              </div>

              <div className="bg-emerald-50/70 rounded-[1rem] p-4 flex flex-col justify-between border border-emerald-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Hadir Hari Ini</span>
                </div>
                <h3 className="text-[26px] font-black text-[#102a43] leading-none mb-1.5">{stats.todayPresence || stats.active}</h3>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> +6%</span>
              </div>

              <div className="bg-orange-50/70 rounded-[1rem] p-4 flex flex-col justify-between border border-orange-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Izin / Cuti</span>
                </div>
                <h3 className="text-[26px] font-black text-[#102a43] leading-none mb-1.5">{stats.todayLeaves}</h3>
                <span className="text-[10px] font-bold text-rose-500 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> -2%</span>
              </div>

              <div className="bg-rose-50/70 rounded-[1rem] p-4 flex flex-col justify-between border border-rose-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Terlambat</span>
                </div>
                <h3 className="text-[26px] font-black text-[#102a43] leading-none mb-1.5">{stats.todayLate || 0}</h3>
                <span className="text-[10px] font-bold text-rose-500 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> +1%</span>
              </div>
            </div>

            {/* Menu Utama (Mobile) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[16px] font-black text-[#102a43]">Menu Utama</h3>
                <button 
                  onClick={() => setShowFullMenu(!showFullMenu)} 
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showFullMenu ? 'Tutup' : 'Lihat Semua'}
                  {showFullMenu ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              
              {showFullMenu ? (
                <div className="space-y-6 animate-fade-in">
                  {menuGroups.map((group, idx) => (
                    <div key={idx}>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{group.category}</h4>
                      <div className="grid grid-cols-4 gap-y-5 gap-x-2">
                        {group.items.map((item, itemIdx) => (
                          <button key={itemIdx} onClick={() => window.location.href=item.path} className="flex flex-col items-center group">
                            <div className={`w-[52px] h-[52px] rounded-[1.1rem] flex items-center justify-center mb-2.5 ${item.color} shadow-sm group-hover:scale-105 transition-transform`}>
                              <item.icon className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 text-center leading-tight line-clamp-2">{item.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-y-6 gap-x-2 animate-fade-in">
                  {[
                    { title: "Karyawan", icon: Users, color: "text-orange-500 bg-orange-50", path: "/employees" },
                    { title: "Jabatan", icon: UserPlus, color: "text-amber-500 bg-amber-50", path: "/positions" },
                    { title: "Absensi", icon: CalendarIcon, color: "text-emerald-500 bg-emerald-50", path: "/attendance" },
                    { title: "Cuti", icon: CheckCircle2, color: "text-blue-500 bg-blue-50", path: "/leaves" },
                    { title: "Gaji", icon: FileText, color: "text-emerald-600 bg-emerald-100", path: "/payroll-hrd" },
                    { title: "Laporan", icon: FileText, color: "text-blue-600 bg-blue-100", path: "/daily-report-admin" },
                    { title: "Lembur", icon: Clock, color: "text-amber-600 bg-amber-100", path: "/overtime" },
                    { title: "Pengaturan", icon: Settings, color: "text-purple-600 bg-purple-100", path: "/settings" },
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => window.location.href=item.path} className="flex flex-col items-center">
                      <div className={`w-[52px] h-[52px] rounded-[1.1rem] flex items-center justify-center mb-2.5 ${item.color} shadow-sm`}>
                        <item.icon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STATS ROW (Grid on Tablet/Desktop, Hidden on Mobile) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0 pb-4 md:pb-0">
            {[
              { label: "Total Employee", val: stats.total, inc: "Updated", icon: Users, color: "text-[#2563eb] bg-[#eff6ff]" },
              { label: "Employee Active", val: stats.active, inc: "Updated", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
              { label: "New Employee", val: "12", inc: "+2 dari bulan lalu", icon: UserPlus, color: "text-purple-600 bg-purple-50" },
              { label: "Employee Leave", val: stats.todayLeaves, inc: "Sedang Cuti", icon: Clock, color: "text-amber-600 bg-amber-50" },
            ].map((stat, i) => (
              <div key={i} className="min-w-[240px] md:min-w-0 snap-center bg-white rounded-[1rem] p-5 shadow-soft border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-2xl md:text-3xl font-black text-[#102a43] mb-2">{stat.val}</h3>
                  <p className={`text-[11px] font-bold text-emerald-500 flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" /> {stat.inc}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} transition-all duration-300`}>
                  <stat.icon className="w-6 h-6" strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-4 md:px-0">
            
            {/* LEFT COLUMN (Span 2) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Employee Verification */}
              <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h2 className="text-[14px] md:text-[15px] font-bold text-[#102a43]">Verifikasi Karyawan</h2>
                  </div>
                  <button className="text-[12px] font-bold text-[#2563eb] hover:text-[#1d4ed8]">Lihat Semua</button>
                </div>
                
                {/* Desktop Table (Hidden on Mobile) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 border-b border-slate-100">Nama</th>
                        <th className="px-5 py-3 border-b border-slate-100">Department</th>
                        <th className="px-5 py-3 border-b border-slate-100">Tanggal</th>
                        <th className="px-5 py-3 border-b border-slate-100">Status</th>
                        <th className="px-5 py-3 border-b border-slate-100 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pendingVerifications.length > 0 ? pendingVerifications.map((u, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${u.bg}`}>{u.initial}</div>
                              <span className="text-[13px] font-semibold text-slate-700">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[13px] font-medium text-slate-600">{u.dept}</td>
                          <td className="px-5 py-3 text-[12px] font-medium text-slate-500">{u.date}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">Menunggu</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition shadow-sm">
                              Verifikasi
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="text-center py-6 text-slate-500 text-sm">Tidak ada verifikasi tertunda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards (Hidden on Desktop) */}
                <div className="md:hidden flex flex-col divide-y divide-slate-100">
                  {pendingVerifications.length > 0 ? pendingVerifications.map((u, i) => (
                    <div key={i} className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold ${u.bg}`}>{u.initial}</div>
                          <div>
                            <p className="text-[13px] font-bold text-[#102a43]">{u.name}</p>
                            <p className="text-[11px] font-medium text-slate-500">{u.dept}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase">Menunggu</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-medium text-slate-400">{u.date}</span>
                        <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-1.5 rounded-lg text-[11px] font-bold transition shadow-sm">
                          Verifikasi
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-500 text-sm">Tidak ada verifikasi tertunda.</div>
                  )}
                </div>
              </div>

              {/* Middle Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Bar Chart: HR Statistic */}
                <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 p-5 flex flex-col h-[320px]">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h3 className="text-[14px] font-bold text-[#102a43]">HR Statistic</h3>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    {hrStats.length > 0 ? hrStats.map((bar, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-1/3 text-[12px] font-medium text-slate-600 truncate">{bar.lbl}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${(bar.val/bar.max)*100}%` }} />
                        </div>
                        <span className="w-6 text-right text-[12px] font-bold text-[#102a43]">{bar.val}</span>
                      </div>
                    )) : (
                      <div className="text-center text-sm text-slate-500 mt-4">Belum ada data</div>
                    )}
                  </div>
                </div>

                {/* Arus Kas */}
                <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 p-5 flex flex-col h-[320px]">
                   <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <span className="font-black text-lg">$</span>
                      </div>
                      <h3 className="text-[14px] font-bold text-[#102a43]">Finance Summary</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Pemasukan (Juta)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Pengeluaran (Juta)</span>
                  </div>
                  <div className="flex-1 min-h-0 w-full relative -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowDynamic}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                        <Area type="monotone" dataKey="pengeluaran" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN (Span 1) */}
            <div className="space-y-6">
              
              {/* Kalender & Agenda */}
              <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#3b82f6]" />
                    <h3 className="text-[14px] font-bold text-[#102a43]">Agenda</h3>
                  </div>
                </div>
                
                {/* Mini Calendar Mock */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                    <span className="text-[12px] font-bold text-slate-700">September 2026</span>
                    <button><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['M','S','S','R','K','J','S'].map((d, i) => (
                      <div key={i} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>
                    ))}
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className={`text-[12px] font-medium py-1.5 rounded-lg cursor-pointer ${i+1 === 27 ? 'bg-[#2563eb] text-white shadow-md font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agenda List */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Hari Ini</h4>
                  <div className="space-y-3">
                    {[
                      { time: "09:00", title: "Meeting Board", loc: "Ruang Meeting A", color: "bg-emerald-500" },
                      { time: "13:00", title: "Review Payroll", loc: "HRD Room", color: "bg-amber-500" },
                    ].map((ag, i) => (
                      <div key={i} className="flex gap-3 relative">
                        <div className="w-10 text-right shrink-0 text-[11px] font-medium text-slate-500 mt-0.5">{ag.time}</div>
                        <div className={`w-2 h-2 rounded-full mt-1.5 z-10 shrink-0 ${ag.color} ring-4 ring-white`}></div>
                        {i !== 1 && <div className="absolute left-[3.25rem] top-3 bottom-[-1rem] w-px bg-slate-100 z-0"></div>}
                        <div>
                          <p className="text-[12px] font-semibold text-[#102a43] leading-tight">{ag.title}</p>
                          <p className="text-[10px] font-medium text-slate-400">{ag.loc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions (Grid 2x2) */}
              <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-[#eff6ff] flex items-center justify-center text-[#2563eb]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#102a43]">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#bfdbfe] hover:bg-[#eff6ff] transition text-left group">
                    <UserPlus className="w-5 h-5 text-[#3b82f6] group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Tambah<br/>Employee</span>
                  </button>
                  <button className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition text-left group">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Approval<br/>Cuti</span>
                  </button>
                  <button className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition text-left group">
                    <FileText className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Report<br/>Bulanan</span>
                  </button>
                  <button className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition text-left group">
                    <Download className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Export<br/>Data</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* BOTTOM WIDGETS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-0">
            
            {/* Absensi Hari Ini (Mobile Card view, Desktop list) */}
            <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 p-5 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3b82f6]" />
                  <h3 className="text-[14px] font-bold text-[#102a43]">Attendance Summary</h3>
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                {todayAttendance.length > 0 ? todayAttendance.map((emp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-50 rounded-xl hover:border-slate-100 transition shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-bold">{emp.initial}</div>
                      <div>
                        <p className="text-[13px] font-bold text-[#102a43] leading-none">{emp.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">{emp.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${emp.c}`}>{emp.status}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{emp.time}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-slate-500 text-sm">Belum ada absensi hari ini.</div>
                )}
              </div>
            </div>

            {/* Laporan Aset (GA) */}
            <div className="bg-white rounded-[1rem] shadow-soft border border-slate-100 p-5 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <h3 className="text-[14px] font-bold text-[#102a43]">GA Asset Report</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 no-scrollbar">
                {dynamicAssets.length > 0 ? dynamicAssets.map((asset, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md ${asset.colorClass} flex items-center justify-center shrink-0`}>
                        <FileText className="w-3 h-3" />
                      </div>
                      <p className="text-[12px] font-bold text-[#102a43] truncate">{asset.title}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">{asset.loc}</p>
                        <p className="text-[10px] font-medium text-slate-600 truncate max-w-[80px]">{asset.user}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                         ['Bagus', 'Baik', 'Good'].includes(asset.cond) ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {asset.cond}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-1 md:col-span-2 text-center py-6 text-slate-500 text-sm">Belum ada data aset.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
