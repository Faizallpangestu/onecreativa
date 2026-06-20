import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileDown, Search, Banknote, Calendar, UserCheck, ShieldCheck, Printer, X, CheckCircle, Send } from "lucide-react";

const PAYROLL_API_URL = "/api/payroll.php";

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
  ];
  const index = n.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function Payroll() {
  const navigate = useNavigate();
  const user = getUser();
  const canExport = user && ["super_admin", "manager", "hr", "finance"].includes(user.role_name);

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedSlip, setSelectedSlip] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${PAYROLL_API_URL}?month=${month}`);
      const payload = res.data?.data || [];
      setData(payload);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetch payroll:", error);
      setData([]);
      setErrorMessage("Data payroll gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [month]);

  const filteredData = data.filter((item) => {
    const keyword = searchQuery.toLowerCase();
    return (item.name || "").toLowerCase().includes(keyword) || (item.nik || "").toLowerCase().includes(keyword);
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
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    XLSX.writeFile(workbook, `Laporan_Payroll_${month}.xlsx`);
  };

  const handlePublish = async () => {
    if (!window.confirm("Kirim slip gaji bulan ini ke seluruh karyawan? Angka ini akan disimpan permanen.")) return;
    
    setIsLoading(true);
    try {
      const resp = await axios.post("/api/publish_payroll.php", { month: month });
      if (resp.data.status === "success") {
        alert(resp.data.message);
        fetchData(); // refresh to show published status
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mempublikasi slip gaji.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (isPublished) => {
    if (isPublished) {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-bold border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Terkirim
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[11px] font-bold border border-amber-200">
        <Calendar className="w-3.5 h-3.5" />
        Preview
      </div>
    );
  };

  const totalGajiBulanIni = filteredData.reduce((sum, item) => sum + Number(item.total_salary), 0);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden print:bg-white print:pb-0">
        
        {/* Background Graphic Premium */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 rounded-b-[2.5rem] shadow-md z-0 print:hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        </div>

        {/* Header Section */}
        <div className="relative z-10 px-5 pt-8 pb-4 print:hidden">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition active:scale-95 border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-black text-white tracking-wide">Payroll & Slip Gaji</h1>
            <div className="w-10 h-10"></div>
          </div>

          <div className="mb-6">
             <p className="text-emerald-100 text-[12px] font-bold uppercase tracking-widest mb-1">Total Estimasi Pencairan</p>
             <h2 className="text-[32px] font-black text-white leading-none tracking-tight">
               {formatCurrency(totalGajiBulanIni)}
             </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                 <UserCheck className="w-5 h-5 text-white" />
               </div>
               <div>
                 <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest">Karyawan</p>
                 <p className="text-[18px] font-black text-white leading-none mt-1">{filteredData.length}</p>
               </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                 <Calendar className="w-5 h-5 text-white" />
               </div>
               <div className="w-full">
                 <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest">Periode</p>
                 <input
                   type="month"
                   value={month}
                   onChange={(e) => setMonth(e.target.value)}
                   className="bg-transparent border-none text-white text-[14px] font-black outline-none w-full p-0 m-0 mt-0.5 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                 />
               </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {canExport && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-6 mb-6 gap-4 relative z-10">
            <div className="relative w-full md:w-64">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0c2e59] focus:ring-1 focus:ring-[#0c2e59] transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleExportExcel}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <FileDown className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#0c2e59] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#0c2e59]/20 hover:bg-[#082040] active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                Kirim Slip
              </button>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="relative z-10 px-5 print:hidden">
          {isLoading ? (
             <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
          ) : errorMessage ? (
             <div className="bg-rose-50 p-4 rounded-2xl text-rose-600 text-sm font-bold text-center border border-rose-100">{errorMessage}</div>
          ) : filteredData.length === 0 ? (
             <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm">
               <Banknote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
               <p className="text-[15px] font-bold text-slate-600">Tidak ada data payroll</p>
               <p className="text-[13px] font-semibold text-slate-400 mt-1">Belum ada perhitungan gaji di periode ini.</p>
             </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredData.map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                   
                   <div className="flex items-center gap-4 mb-4">
                     <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] text-[16px] font-black shadow-inner ${getAvatarClass(item.name)}`}>
                       {getInitials(item.name)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[16px] font-black text-slate-900 truncate">{item.name}</p>
                       <p className="text-[12px] font-bold text-slate-400 mt-0.5 truncate flex items-center gap-1.5 uppercase tracking-wider">
                         <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                         {item.position || "Employee"} • {item.nik}
                       </p>
                     </div>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200/60">
                         <span className="text-[12px] font-bold text-slate-500">Gaji Pokok</span>
                         <span className="text-[14px] font-bold text-slate-800">{formatCurrency(item.base_salary)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[12px] font-bold text-emerald-600">Uang Lembur ({item.overtime_minutes} mnt)</span>
                         <span className="text-[13px] font-bold text-emerald-600">+{formatCurrency(item.lembur)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[12px] font-bold text-rose-500">Pot. Telat ({item.late_minutes} mnt)</span>
                         <span className="text-[13px] font-bold text-rose-500">-{formatCurrency(item.potongan)}</span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between mt-3 mb-2">
                    <div className="text-xs text-slate-500 font-medium">Take Home Pay</div>
                    <div className="text-lg font-black text-[#0c2e59]">
                      {formatCurrency(item.total_salary)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    {getStatusBadge(item.is_published)}
                    <button
                       onClick={() => setSelectedSlip(item)}
                       className="h-10 px-5 rounded-xl bg-slate-900 text-[13px] font-bold text-white shadow-lg transition-transform active:scale-95"
                     >
                       Cetak Slip
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Dokumen Slip Gaji (Professional PDF Style) */}
        {selectedSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 print:block">
            <div className="w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-[800px] bg-slate-100 sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden print:shadow-none print:rounded-none print:h-auto print:bg-white">
              
              {/* Toolbar Atas (Disembunyikan saat print) */}
              <div className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedSlip(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-[15px] font-black text-slate-800">Preview Dokumen</h3>
                </div>
                <button
                  onClick={() => window.print()}
                  className="h-10 px-5 rounded-full bg-blue-600 text-[13px] font-bold text-white shadow-lg flex items-center gap-2 hover:bg-blue-700 active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Cetak / PDF
                </button>
              </div>

              {/* Area Kertas Slip Gaji (A4 Style) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:overflow-visible">
                 <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-md border border-slate-200 p-8 sm:p-12 relative print:shadow-none print:border-none print:m-0 print:p-0 print:min-h-0">
                    
                    {/* Watermark Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                       <img src="/logo.png" alt="" className="w-[80%] object-contain grayscale" />
                    </div>

                    {/* Kop Surat */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8 relative z-10">
                      <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">SLIP GAJI</h1>
                        <p className="text-[14px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Periode: {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <img src="/logo.png" alt="Creativa" className="h-10 object-contain ml-auto mb-2" onError={(e) => { e.target.style.display = 'none' }} />
                        <p className="text-[12px] font-bold text-slate-800">PT. ONE CREATIVA INDONESIA</p>
                        <p className="text-[10px] text-slate-500">Jl. Jendral Sudirman No. 123, Jakarta</p>
                      </div>
                    </div>

                    {/* Identitas Karyawan */}
                    <div className="grid grid-cols-2 gap-8 mb-8 relative z-10 text-[13px]">
                       <div className="flex flex-col gap-2">
                          <div className="flex"><span className="w-24 font-bold text-slate-500">NIK</span><span className="font-black text-slate-900">: {selectedSlip.nik || '-'}</span></div>
                          <div className="flex"><span className="w-24 font-bold text-slate-500">Nama</span><span className="font-black text-slate-900">: {selectedSlip.name.toUpperCase()}</span></div>
                          <div className="flex"><span className="w-24 font-bold text-slate-500">Jabatan</span><span className="font-black text-slate-900">: {selectedSlip.position?.toUpperCase() || '-'}</span></div>
                       </div>
                       <div className="flex flex-col gap-2">
                          <div className="flex"><span className="w-24 font-bold text-slate-500">Departemen</span><span className="font-black text-slate-900">: {selectedSlip.department?.toUpperCase() || '-'}</span></div>
                          <div className="flex"><span className="w-24 font-bold text-slate-500">Status</span><span className="font-black text-slate-900">: KARYAWAN TETAP</span></div>
                       </div>
                    </div>

                    {/* Tabel Gaji Utama */}
                    <div className="grid grid-cols-2 gap-8 mb-8 relative z-10">
                       
                       {/* Kolom Penerimaan */}
                       <div className="border border-slate-300 rounded-xl overflow-hidden">
                          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
                             <h3 className="font-bold text-[13px] text-slate-800 uppercase">PENERIMAAN</h3>
                          </div>
                          <div className="p-4 flex flex-col gap-3 text-[13px]">
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">Gaji Pokok</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedSlip.base_salary)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">Uang Lembur ({selectedSlip.overtime_minutes} mnt)</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedSlip.lembur)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">Tunjangan Lainnya</span>
                                <span className="font-black text-slate-900">Rp0</span>
                             </div>
                          </div>
                          <div className="bg-emerald-50 px-4 py-3 border-t border-slate-300 flex justify-between">
                             <span className="font-black text-[13px] text-emerald-800">TOTAL PENERIMAAN</span>
                             <span className="font-black text-[14px] text-emerald-800">{formatCurrency(Number(selectedSlip.base_salary) + Number(selectedSlip.lembur))}</span>
                          </div>
                       </div>

                       {/* Kolom Potongan */}
                       <div className="border border-slate-300 rounded-xl overflow-hidden">
                          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
                             <h3 className="font-bold text-[13px] text-slate-800 uppercase">POTONGAN</h3>
                          </div>
                          <div className="p-4 flex flex-col gap-3 text-[13px]">
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">Potongan Telat ({selectedSlip.late_minutes} mnt)</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedSlip.potongan)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">BPJS Kesehatan</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedSlip.bpjs_kes || 0)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">BPJS Ketenagakerjaan</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedSlip.bpjs_tk || 0)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="font-semibold text-slate-600">Pajak PPh 21</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedSlip.pph21 || 0)}</span>
                             </div>
                          </div>
                          <div className="bg-rose-50 px-4 py-3 border-t border-slate-300 flex justify-between">
                             <span className="font-black text-[13px] text-rose-800">TOTAL POTONGAN</span>
                             <span className="font-black text-[14px] text-rose-800">{formatCurrency(selectedSlip.total_potongan)}</span>
                          </div>
                       </div>

                    </div>

                    {/* Total Take Home Pay */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white flex justify-between items-center mb-12 relative z-10 print:border print:border-black print:bg-white print:text-black">
                       <div>
                          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest print:text-slate-600">Total Gaji Diterima (Take Home Pay)</p>
                          <div className="flex items-center gap-2 mt-1">
                             <CheckCircle className="w-5 h-5 text-emerald-400 print:hidden" />
                             <p className="text-[11px] font-medium">Ditransfer ke Rekening Karyawan ybs.</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <h2 className="text-[32px] font-black leading-none">{formatCurrency(selectedSlip.total_salary)}</h2>
                       </div>
                    </div>

                    {/* Tanda Tangan */}
                    <div className="grid grid-cols-2 gap-8 relative z-10">
                       <div className="text-center">
                          <p className="text-[13px] font-semibold text-slate-600 mb-20">Penerima,</p>
                          <p className="text-[14px] font-black text-slate-900 border-b border-slate-400 inline-block px-4 pb-1">{selectedSlip.name.toUpperCase()}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[13px] font-semibold text-slate-600 mb-20">Mengetahui, HR & Finance</p>
                          <p className="text-[14px] font-black text-slate-900 border-b border-slate-400 inline-block px-4 pb-1">HR MANAGER</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
