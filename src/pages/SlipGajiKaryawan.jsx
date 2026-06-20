import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar, FileText, Download, Printer } from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";

export default function SlipGajiKaryawan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payslip, setPayslip] = useState(null);
  
  // Default to current month
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      fetchPayslip(parsed.employee_id, selectedMonth);
    } else {
      navigate("/login");
    }
  }, [navigate, selectedMonth]);

  const fetchPayslip = async (employeeId, month) => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const resp = await api.get(`/payroll.php?employee_id=${employeeId}&month=${month}`);
      if (resp.data.status === "success" && resp.data.data.length > 0) {
        setPayslip(resp.data.data[0]); // Ambil data pertama karena difilter employee_id
      } else {
        setPayslip(null); // Kosong
      }
    } catch (err) {
      console.error(err);
      setPayslip(null);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      minimumFractionDigits: 0 
    }).format(number || 0);
  };

  // Generate Month Options (Last 6 months)
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const val = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      options.push({ value: val, label: label });
    }
    return options;
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] pb-12 relative overflow-hidden flex flex-col">
        
        {/* Header Biru Navy */}
        <div className="absolute top-0 left-0 right-0 h-[220px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        {/* Top Navbar */}
        <div className="flex items-center justify-between pt-6 px-5 mb-8 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-white font-bold text-[16px] tracking-wide">Slip Gaji Elektronik</span>
          <button 
            onClick={() => window.print()}
            className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 px-5 flex-1 flex flex-col">
          
          {/* Selector Bulan */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Periode Penggajian</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent text-[14px] font-bold text-slate-800 outline-none appearance-none"
              >
                {getMonthOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slip Gaji Kertas */}
          <div className="bg-white flex-1 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-200 p-6 overflow-hidden relative">
            
            {/* Tekstur Kertas (Opsional) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 relative z-10">
                <div className="animate-spin w-8 h-8 border-4 border-[#0c2e59] border-t-transparent rounded-full mb-3"></div>
                <p className="text-[13px] font-medium text-slate-500">Menyiapkan slip gaji...</p>
              </div>
            ) : !payslip ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60 relative z-10">
                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-[15px] font-bold text-slate-600">Belum Ada Data Gaji</p>
                <p className="text-[12px] text-slate-400 mt-1">Sistem belum memproses penggajian untuk periode ini.</p>
              </div>
            ) : (
              <div className="relative z-10">
                {/* Header Kop Surat */}
                <div className="text-center border-b-2 border-slate-100 pb-5 mb-5 flex flex-col items-center">
                  <img src="/logo.png" alt="Creativa" className="h-12 object-contain mb-3 mix-blend-multiply" />
                  <h1 className="text-[18px] font-black text-[#0c2e59] uppercase tracking-wide leading-tight">PT. CREATIVA BRIDGING<br/>INTERNATIONAL</h1>
                  <div className="mt-4 bg-[#f4f6f8] rounded-lg py-2 px-4 inline-block border border-slate-200">
                    <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Slip Gaji</h2>
                  </div>
                </div>

                {/* Info Karyawan */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[12px] mb-6">
                  <div>
                    <span className="text-slate-500 font-medium block">NAMA</span>
                    <span className="font-bold text-slate-800 uppercase">{payslip.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-medium block">NIK</span>
                    <span className="font-bold text-slate-800">{payslip.nik}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">JABATAN</span>
                    <span className="font-bold text-slate-800">{payslip.position}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-medium block">DEPARTEMEN</span>
                    <span className="font-bold text-slate-800">{payslip.department}</span>
                  </div>
                </div>

                {/* Pendapatan */}
                <div className="mb-5">
                  <h3 className="text-[12px] font-bold text-emerald-600 uppercase mb-2 border-b border-emerald-100 pb-1">Pendapatan (+)</h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Gaji Pokok</span>
                      <span className="font-bold text-slate-800">{formatRupiah(payslip.base_salary)}</span>
                    </div>
                    {payslip.lembur > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Uang Lembur ({payslip.overtime_minutes}mnt)</span>
                        <span className="font-bold text-slate-800">{formatRupiah(payslip.lembur)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Potongan */}
                <div className="mb-6">
                  <h3 className="text-[12px] font-bold text-rose-600 uppercase mb-2 border-b border-rose-100 pb-1">Potongan (-)</h3>
                  <div className="space-y-2 text-[13px]">
                    {payslip.potongan > 0 && (
                      <div className="flex justify-between items-center text-rose-700">
                        <span>Potongan Keterlambatan ({payslip.late_minutes}mnt)</span>
                        <span className="font-bold">-{formatRupiah(payslip.potongan)}</span>
                      </div>
                    )}
                    {payslip.bpjs_tk > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>BPJS Ketenagakerjaan (2%)</span>
                        <span className="font-medium text-rose-700">-{formatRupiah(payslip.bpjs_tk)}</span>
                      </div>
                    )}
                    {payslip.bpjs_kes > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>BPJS Kesehatan (1%)</span>
                        <span className="font-medium text-rose-700">-{formatRupiah(payslip.bpjs_kes)}</span>
                      </div>
                    )}
                    {payslip.pph21 > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Pajak Penghasilan (PPh 21)</span>
                        <span className="font-medium text-rose-700">-{formatRupiah(payslip.pph21)}</span>
                      </div>
                    )}
                    {payslip.total_potongan === 0 && (
                      <div className="text-slate-400 italic text-[12px]">Tidak ada potongan bulan ini.</div>
                    )}
                  </div>
                </div>

                {/* Total Bersih */}
                <div className="bg-[#0c2e59] rounded-xl p-4 flex justify-between items-center text-white shadow-lg shadow-[#0c2e59]/20">
                  <div>
                    <span className="block text-[11px] font-medium text-blue-200 uppercase tracking-wide">Total Diterima</span>
                    <span className="block text-[10px] text-blue-300 italic">(Take Home Pay)</span>
                  </div>
                  <div className="text-[20px] font-black tracking-tight">
                    {formatRupiah(payslip.total_salary)}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-[10px] text-slate-400 italic">Dokumen ini dihasilkan secara otomatis oleh Sistem ERP One Creativa dan sah tanpa tanda tangan basah.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
