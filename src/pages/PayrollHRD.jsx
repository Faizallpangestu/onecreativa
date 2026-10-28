import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import {
  Search, Calendar, UserCheck, CheckCircle, Save,
  MoreVertical, FileText, PieChart as PieChartIcon, 
  ChevronDown, FileDown, ArrowRight, Printer, Clock, X
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const PAYROLL_API_URL = "/api/payroll.php?role=hrd";

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function getInitials(name) {
  const n = name || "";
  return n.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function getAvatarClass(name) {
  const n = name || "";
  const palettes = [
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-purple-100 text-purple-700",
  ];
  const index = n.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export default function PayrollHRD() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState("Semua");
  const [deptFilter, setDeptFilter] = useState("Semua Departemen");
  const [selectedSlip, setSelectedSlip] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${PAYROLL_API_URL}&month=${month}`);
      const payload = res.data?.data || [];
      setData(payload);
    } catch (error) {
      console.error("Error fetch payroll:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering
  const filteredData = data.filter((item) => {
    const keyword = searchQuery.toLowerCase();
    const matchesSearch = (item.name || "").toLowerCase().includes(keyword) || (item.nik || "").toLowerCase().includes(keyword);
    const matchesDept = deptFilter === "Semua Departemen" || item.department === deptFilter;
    const matchesTab = activeTab === "Semua" ? true :
                       activeTab === "Belum Diproses" ? item.status !== 'published' :
                       activeTab === "Sudah Diproses" ? item.status === 'published' : true;
    return matchesSearch && matchesDept && matchesTab;
  });

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((item) => ({
      NIK: item.nik,
      Nama: item.name,
      Jabatan: item.position,
      "Gaji Pokok": item.base_salary,
      Lembur: item.lembur,
      "Potongan Telat": item.potongan,
      "Total Potongan": item.total_potongan,
      "Total Gaji Bersih": item.total_salary,
      Status: item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    XLSX.writeFile(workbook, `Laporan_Payroll_${month}.xlsx`);
  };

  // Stats Logic
  const totalEstimasi = data.reduce((sum, item) => sum + Number(item.total_salary), 0);
  const totalPokok = data.reduce((sum, item) => sum + Number(item.base_salary), 0);
  const totalTunjangan = data.reduce((sum, item) => sum + (Number(item.uang_transport||0) + Number(item.uang_makan||0)), 0);
  const totalPotongan = data.reduce((sum, item) => sum + Number(item.total_potongan||0), 0);
  
  const processedCount = data.filter(i => i.status === 'published').length;
  const unprocessedCount = data.length - processedCount;
  const processedPercent = data.length ? Math.round((processedCount / data.length) * 100) : 0;

  const depts = ["Semua Departemen", ...new Set(data.map(i => i.department).filter(Boolean))];

  const pieData = [
    { name: 'Gaji Pokok', value: totalPokok, color: '#2563eb' },
    { name: 'Transport', value: data.reduce((s,i)=>s+Number(i.uang_transport||0),0), color: '#10b981' },
    { name: 'Makan', value: data.reduce((s,i)=>s+Number(i.uang_makan||0),0), color: '#a855f7' },
    { name: 'Potongan', value: totalPotongan, color: '#f43f5e' },
  ];

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12 print:hidden">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-800">Payroll Calculation</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; HRD &gt; Payroll Calculation</p>
          </div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Total Estimasi Pencairan</p>
                </div>
                <h3 className="text-xl font-black text-slate-800">{formatCurrency(totalEstimasi)}</h3>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">↑ +12% <span className="text-slate-400 font-medium">dari bulan lalu</span></p>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Total Karyawan</p>
                </div>
                <h3 className="text-xl font-black text-slate-800">{data.length}</h3>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">↑ +1 <span className="text-slate-400 font-medium">dari bulan lalu</span></p>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Periode Payroll</p>
                </div>
                <h3 className="text-xl font-black text-slate-800">
                  {new Date(month + "-01").toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}
                </h3>
                <div className="mt-1">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md">Aktif</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-4">
               <div className="flex-1 border-r border-slate-100 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Sudah Diproses</p>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{processedCount}</h3>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{width: `${processedPercent}%`}}></div>
                  </div>
               </div>
               <div className="flex-1 pl-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                      <Clock className="w-3 h-3 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Belum Diproses</p>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{unprocessedCount}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{100 - processedPercent}%</p>
               </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <div className="flex items-center gap-3 w-full md:w-auto flex-1">
               <div className="relative w-full md:w-80">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Cari nama karyawan, NIK, atau departemen..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition"
                 />
               </div>
               <div className="relative hidden md:block">
                 <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="appearance-none h-10 bg-white border border-slate-200 rounded-xl px-4 pr-10 text-sm font-bold text-slate-600 outline-none focus:border-blue-500 transition cursor-pointer">
                   {depts.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
               </div>
               <div className="relative hidden md:block">
                 <input 
                   type="month" 
                   value={month}
                   onChange={e => setMonth(e.target.value)}
                   className="h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-600 outline-none focus:border-blue-500 transition cursor-pointer"
                 />
               </div>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                <button onClick={handleExportExcel} className="h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-200 hover:bg-emerald-100 transition">
                  <FileDown className="w-4 h-4" /> Export
                </button>
                <span className="text-xs font-semibold text-slate-500">Pengajuan dan transfer dikelola Finance melalui Penggajian Karyawan.</span>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: EMPLOYEE LIST */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Tabs */}
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1">
                  {['Semua', 'Belum Diproses', 'Sudah Diproses'].map(tab => {
                    const count = tab === 'Semua' ? data.length : tab === 'Belum Diproses' ? unprocessedCount : processedCount;
                    return (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                      >
                        {tab === 'Sudah Diproses' ? <CheckCircle className="w-4 h-4" /> : tab === 'Belum Diproses' ? <Clock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        {tab} ({count})
                      </button>
                    )
                  })}
                </div>
                <button className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2 mr-1">
                  <Printer className="w-4 h-4" /> Lihat Slip Massal
                </button>
              </div>

              {/* Cards */}
              {isLoading ? (
                <div className="text-center p-12 text-sm font-bold text-slate-400">Memuat data payroll...</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-[1.5rem] text-sm font-bold text-slate-400 border border-slate-100 shadow-sm">
                  Tidak ada data yang sesuai.
                </div>
              ) : (
                filteredData.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col xl:flex-row gap-6 relative group hover:border-blue-100 transition">
                    
                    {/* Left Info */}
                    <div className="flex gap-4 xl:w-1/3 xl:border-r border-slate-50 xl:pr-4">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${getAvatarClass(item.name)}`}>
                         {getInitials(item.name)}
                       </div>
                       <div>
                         <h3 className="text-sm font-black text-slate-800 leading-tight">{item.name}</h3>
                         <div className="flex items-center gap-1.5 mt-1">
                           <CheckCircle className="w-3 h-3 text-emerald-500" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.role_name} • {item.nik}</span>
                         </div>
                         <p className="text-[12px] font-semibold text-slate-400 mt-1">{item.position || item.department}</p>
                       </div>
                    </div>

                    {/* Middle Details */}
                    <div className="flex-1 flex flex-col justify-center min-w-[200px]">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rincian Penghasilan</p>
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-[12px] font-bold text-slate-600">Gaji Pokok</span>
                         <span className="text-[12px] font-black text-slate-800">{formatCurrency(item.base_salary)}</span>
                       </div>
                       <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                           <span className="text-[12px] font-bold text-slate-600">Uang Transport</span>
                           <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{item.hari_kerja || 0} hari × Rp30.000</span>
                         </div>
                         <span className="text-[12px] font-black text-slate-800">{formatCurrency(item.uang_transport)}</span>
                       </div>
                       <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                           <span className="text-[12px] font-bold text-slate-600">Uang Makan</span>
                           <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{item.hari_kerja || 0} hari × Rp20.000</span>
                         </div>
                         <span className="text-[12px] font-black text-slate-800">{formatCurrency(item.uang_makan)}</span>
                       </div>
                       <div className="flex items-center justify-between mt-1">
                         <span className="text-[12px] font-bold text-rose-500">Pot. Telat</span>
                         <span className="text-[12px] font-black text-rose-500">-{formatCurrency(item.potongan)}</span>
                       </div>
                    </div>

                    {/* Right THP & Actions */}
                    <div className="xl:w-1/4 flex flex-col justify-center items-start xl:items-end xl:border-l border-slate-50 xl:pl-6 pt-4 xl:pt-0 border-t xl:border-t-0 mt-2 xl:mt-0">
                       <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1">Total Take Home Pay</p>
                       <h3 className="text-2xl font-black text-[#0f2c59] tracking-tight">{formatCurrency(item.total_salary)}</h3>
                       
                       <div className="flex flex-wrap items-center xl:justify-end gap-2 mt-4 w-full">
                         {item.status === 'published' ? (
                           <span className="px-2 py-1.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold whitespace-nowrap">Siap Diproses</span>
                         ) : (
                           <span className="px-2 py-1.5 rounded bg-amber-50 text-amber-600 text-[10px] font-bold whitespace-nowrap">Menunggu Approval</span>
                         )}
                         <button onClick={() => setSelectedSlip(item)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition">Detail</button>
                         <button onClick={() => setSelectedSlip(item)} className="px-3 py-1.5 rounded-lg bg-[#0f2c59] text-white text-[11px] font-bold hover:bg-blue-900 transition shadow-sm">Cetak Slip</button>
                         <button onClick={() => setSelectedSlip(item)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition shrink-0">
                           <MoreVertical className="w-3 h-3" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Ringkasan Payroll */}
              <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-[15px] font-black text-slate-800">Ringkasan Payroll</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-slate-600">Total Gaji Pokok</span>
                    <span className="text-[13px] font-black text-slate-800">{formatCurrency(totalPokok)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-slate-600">Total Tunjangan</span>
                    <span className="text-[13px] font-black text-slate-800">{formatCurrency(totalTunjangan)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-[13px] font-bold text-slate-600">Total Potongan</span>
                    <span className="text-[13px] font-black text-rose-500">-{formatCurrency(totalPotongan)}</span>
                  </div>
                  <div className="pt-2 bg-blue-50/50 -mx-6 px-6 py-4 border-t border-blue-100">
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1">Total Pencairan</p>
                    <h2 className="text-3xl font-black text-blue-600 tracking-tight">{formatCurrency(totalEstimasi)}</h2>
                  </div>
                </div>
              </div>

              {/* Distribusi Penghasilan */}
              <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-[15px] font-black text-slate-800">Distribusi Penghasilan</h3>
                </div>
                
                <div className="flex items-center">
                  <div className="w-1/2 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                      <span className="text-[10px] font-bold text-slate-400">Total</span>
                      <span className="text-[14px] font-black text-slate-800">{(totalEstimasi / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                  <div className="w-1/2 flex flex-col gap-3 pl-4 border-l border-slate-50">
                    {pieData.map((item, i) => {
                       const percent = totalEstimasi ? Math.round((item.value / (totalPokok+totalTunjangan+totalPotongan)) * 100) : 0;
                       return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                            <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-800">{percent}%</span>
                        </div>
                       )
                    })}
                  </div>
                </div>
              </div>

              {/* Proses Payroll (Stepper) */}
              <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-[15px] font-black text-slate-800">Proses Payroll</h3>
                </div>
                
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                  <div className="relative pl-6">
                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm">1</div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[13px] font-black text-slate-800">Hitung Payroll</h4>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">Menghitung gaji, tunjangan, dan potongan</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                    </div>
                  </div>
                  
                  <div className="relative pl-6">
                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-amber-500 border-[3px] border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm">2</div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[13px] font-black text-slate-800">Review & Approval</h4>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">Menunggu persetujuan HRD/Finance</p>
                      </div>
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-slate-200 border-[3px] border-white flex items-center justify-center text-slate-500 text-[10px] font-bold shadow-sm">3</div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[13px] font-black text-slate-400">Export & Pencairan</h4>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1">Kirim data ke Finance untuk pencairan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:shadow-none print:rounded-none print:max-h-none print:border-none">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 print:bg-white print:border-b-2">
              <div>
                <h2 className="text-lg font-black text-slate-800">Payslip Detail</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Periode: {new Date(month + "-01").toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}</p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition print:hidden">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${getAvatarClass(selectedSlip.name)}`}>
                   {getInitials(selectedSlip.name)}
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-800">{selectedSlip.name}</h3>
                   <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedSlip.nik} • {selectedSlip.position}</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-3">Penghasilan</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <span>Gaji Pokok</span>
                      <span className="text-slate-800 font-bold">{formatCurrency(selectedSlip.base_salary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <span>Uang Transport ({selectedSlip.hari_kerja || 0} hari)</span>
                      <span className="text-slate-800 font-bold">{formatCurrency(selectedSlip.uang_transport)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <span>Uang Makan ({selectedSlip.hari_kerja || 0} hari)</span>
                      <span className="text-slate-800 font-bold">{formatCurrency(selectedSlip.uang_makan)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <span>Lembur / Overtime</span>
                      <span className="text-slate-800 font-bold">{formatCurrency(selectedSlip.lembur || 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-3">Potongan</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <span>Potongan Keterlambatan</span>
                      <span className="text-rose-500 font-bold">-{formatCurrency(selectedSlip.potongan)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 print:bg-white print:border-t-2">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Take Home Pay</p>
                   <h3 className="text-3xl font-black text-[#0f2c59] tracking-tight">{formatCurrency(selectedSlip.total_salary)}</h3>
                 </div>
                 <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-[#0f2c59] text-white text-sm font-bold shadow-md hover:bg-blue-900 transition flex items-center gap-2 print:hidden">
                   <Printer className="w-4 h-4" /> Cetak PDF
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
