import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowUpRight, ArrowDownRight, TrendingUp, Plus, Search, Calendar, FileText, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const FINANCE_API = "/api/finance.php";

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
}

export default function Profit() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, profit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState("income"); // 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState("");
  
  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({
    amount: "",
    category: "Lainnya",
    description: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(FINANCE_API, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setRecords(res.data?.data || []);
      setSummary(res.data?.summary || { total_income: 0, total_expense: 0, profit: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [selectedMonth, selectedYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    try {
      await axios.post(FINANCE_API, {
        type: formType,
        amount: parseFloat(form.amount.replace(/[^0-9]/g, "")),
        category: form.category,
        description: form.description,
        transaction_date: form.transaction_date,
        user_id: JSON.parse(localStorage.getItem("user"))?.id || 0
      });
      
      setIsFormOpen(false);
      setForm({
        amount: "",
        category: "Lainnya",
        description: "",
        transaction_date: new Date().toISOString().slice(0, 10),
      });
      loadData();
    } catch (err) {
      alert("Gagal menyimpan transaksi");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus transaksi ini?")) return;
    try {
      await axios.delete(`${FINANCE_API}?id=${id}`);
      loadData();
    } catch (err) {
      alert("Gagal menghapus transaksi");
    }
  };

  // Group by date for chart
  const getChartData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const data = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayRecords = records.filter(r => r.transaction_date === dateStr);
      
      const inc = dayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const exp = dayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount), 0);
      
      data.push({
        date: i,
        pemasukan: inc,
        pengeluaran: exp,
      });
    }
    return data;
  };

  const chartData = getChartData();
  const filteredRecords = records.filter(r => r.description.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase()));

  const openForm = (type) => {
    setFormType(type);
    setForm(prev => ({ ...prev, category: type === 'income' ? 'Modal/Pendapatan' : 'Operasional' }));
    setIsFormOpen(true);
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">
        
        {/* Background Graphic */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-br from-indigo-800 via-blue-800 to-indigo-900 rounded-b-[2.5rem] shadow-md z-0">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        </div>

        <div className="relative z-10 px-5 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition active:scale-95 border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-black text-white tracking-wide">Analisa Profit</h1>
            <div className="w-10 h-10"></div>
          </div>

          <p className="text-white/70 text-[12px] font-bold uppercase tracking-widest mb-1">Total Laba / Profit Bersih</p>
          <div className="flex items-end gap-3">
            <h2 className="text-[32px] font-black text-white leading-none tracking-tight">
              {formatRupiah(summary.profit)}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10">
               <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                 <ArrowUpRight className="w-4 h-4 text-emerald-400" strokeWidth={3} />
               </div>
               <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1">Modal / Masuk</p>
               <p className="text-[15px] font-black text-white truncate">{formatRupiah(summary.total_income)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10">
               <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
                 <ArrowDownRight className="w-4 h-4 text-rose-400" strokeWidth={3} />
               </div>
               <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1">Pengeluaran</p>
               <p className="text-[15px] font-black text-white truncate">{formatRupiah(summary.total_expense)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative z-10 px-5 mt-2 mb-4 flex gap-3">
           <select 
             value={selectedMonth} 
             onChange={e => setSelectedMonth(Number(e.target.value))}
             className="flex-1 h-[3.25rem] bg-white rounded-2xl px-4 text-[14px] font-bold text-slate-700 shadow-sm border border-slate-100 outline-none"
           >
             {Array.from({length: 12}, (_, i) => i + 1).map(m => (
               <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
             ))}
           </select>
           <select 
             value={selectedYear} 
             onChange={e => setSelectedYear(Number(e.target.value))}
             className="w-1/3 h-[3.25rem] bg-white rounded-2xl px-4 text-[14px] font-bold text-slate-700 shadow-sm border border-slate-100 outline-none"
           >
             {[2024, 2025, 2026].map(y => (
               <option key={y} value={y}>{y}</option>
             ))}
           </select>
        </div>

        {/* Chart */}
        <div className="relative z-10 px-5 mb-6">
           <div className="bg-white rounded-[2rem] p-5 pb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <div className="flex items-center gap-2 mb-6">
               <TrendingUp className="w-5 h-5 text-indigo-600" />
               <h3 className="text-[15px] font-black text-slate-800">Arus Kas Bulanan</h3>
             </div>
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip 
                      formatter={(val) => formatRupiah(val)} 
                      labelFormatter={(l) => `Tanggal ${l}`} 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="pemasukan" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                    <Area type="monotone" dataKey="pengeluaran" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* Transactions List */}
        <div className="relative z-10 px-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-[17px] font-black text-slate-800">Riwayat Transaksi</h3>
           </div>
           
           <div className="relative mb-4">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white shadow-sm rounded-2xl pl-11 pr-4 text-[14px] font-semibold text-slate-800 border border-slate-100 outline-none focus:border-indigo-400 transition-all"
              />
           </div>

           <div className="flex flex-col gap-3">
             {isLoading ? (
               <div className="py-8 flex justify-center"><div className="w-6 h-6 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
             ) : filteredRecords.length === 0 ? (
               <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                 <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                 <p className="text-[14px] font-bold text-slate-500">Tidak ada transaksi bulan ini</p>
               </div>
             ) : (
               filteredRecords.map(r => (
                 <div key={r.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 ${r.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                     {r.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[15px] font-black text-slate-800 truncate">{r.description}</p>
                     <p className="text-[12px] font-semibold text-slate-400 mt-0.5 truncate flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(r.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        <span className="mx-1">•</span> {r.category}
                     </p>
                   </div>
                   <div className="text-right shrink-0">
                     <p className={`text-[15px] font-black ${r.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {r.type === 'income' ? '+' : '-'}{formatRupiah(r.amount)}
                     </p>
                     <button onClick={() => handleDelete(r.id)} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 mt-1 uppercase">Hapus</button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-6 right-0 left-0 pointer-events-none z-40 flex justify-center px-5 gap-3">
          <button
            onClick={() => openForm('expense')}
            className="flex-1 h-14 bg-white border border-rose-100 rounded-[1.5rem] flex items-center justify-center text-rose-600 text-[14px] font-black shadow-[0_8px_25px_rgba(244,63,94,0.15)] transition-transform hover:bg-rose-50 active:scale-[0.98] pointer-events-auto gap-2"
          >
            <ArrowDownRight className="w-5 h-5" strokeWidth={3} /> Pengeluaran
          </button>
          <button
            onClick={() => openForm('income')}
            className="flex-1 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-[14px] font-black shadow-[0_8px_25px_rgba(79,70,229,0.3)] transition-transform hover:bg-indigo-700 active:scale-[0.98] pointer-events-auto gap-2"
          >
            <ArrowUpRight className="w-5 h-5" strokeWidth={3} /> Modal
          </button>
        </div>

        {/* Bottom Sheet Form */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
             
             <div className="bg-white w-full sm:w-[400px] rounded-t-[2rem] sm:rounded-3xl shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out]">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                   <h2 className="text-[18px] font-black text-slate-900">
                     {formType === 'income' ? 'Tambah Modal' : 'Catat Pengeluaran'}
                   </h2>
                   <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Nominal (Rp)</span>
                    <input 
                      required 
                      type="number"
                      placeholder="0" 
                      value={form.amount} 
                      onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                      className="h-[3.5rem] w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[20px] font-black text-slate-800 outline-none transition focus:bg-white focus:border-indigo-400" 
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Kategori</span>
                    <select 
                      value={form.category} 
                      onChange={(e) => setForm({ ...form, category: e.target.value })} 
                      className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-800 outline-none transition focus:bg-white focus:border-indigo-400"
                    >
                      {formType === 'income' ? (
                        <>
                          <option value="Modal Pribadi">Modal Pribadi</option>
                          <option value="Suntikan Dana">Suntikan Dana</option>
                          <option value="Pendapatan Proyek">Pendapatan Proyek</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="Gaji Karyawan">Gaji Karyawan</option>
                          <option value="Operasional Kantor">Operasional Kantor (Listrik/Air/Internet)</option>
                          <option value="Inventaris/Peralatan">Inventaris / Peralatan</option>
                          <option value="Pemasaran/Ads">Pemasaran / Iklan</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Detail / Keterangan</span>
                    <input 
                      required 
                      placeholder="Misal: Beli laptop aset kantor" 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:bg-white focus:border-indigo-400" 
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Tanggal Transaksi</span>
                    <input 
                      required 
                      type="date"
                      value={form.transaction_date} 
                      onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} 
                      className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:bg-white focus:border-indigo-400" 
                    />
                  </label>

                  <button 
                    type="submit" 
                    className={`mt-2 w-full h-14 text-white rounded-2xl text-[15px] font-black tracking-wide shadow-lg transition active:scale-[0.98] ${formType === 'income' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'}`}
                  >
                    Simpan Data
                  </button>
                </form>
             </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </Layout>
  );
}
