import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, Clock, CheckCircle2, XCircle, Search, Calendar, Filter, 
  FileDown, Plus, Receipt, Eye, Check, X, FileText, Image as ImageIcon, Camera
} from "lucide-react";
import Layout from "../components/Layout";
import api, { API_BASE } from "../services/api";
import * as XLSX from "xlsx";

export default function Reimbursement() {
  const requestKey = useRef(crypto.randomUUID());
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("approval"); // approval, history
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER = 10;

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transportasi");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Detail/Preview Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [financeNotes, setFinanceNotes] = useState("");
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      fetchReimbursements(parsed);
      
      // Auto set tab to approval if finance
      if (['finance', 'finance_admin', 'admin', 'super_admin'].includes(parsed.role_name)) {
        setActiveTab("approval");
      } else {
        setActiveTab("history");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchReimbursements = async (currentUser) => {
    setLoading(true);
    setLoadError("");
    try {
      const resp = await api.get(`/reimbursements.php?user_id=${currentUser.id}&role=${currentUser.role_name}`);
      if (resp.data.status === "success") {
        if (!Array.isArray(resp.data.data)) throw new Error("Respons klaim tidak valid.");
        setReimbursements(resp.data.data);
      } else { throw new Error(resp.data.message || "Data klaim gagal dimuat."); }
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || "Data klaim gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  const isFinance = user && ['finance', 'finance_admin', 'admin', 'super_admin'].includes(user.role_name);

  // Handle Form File
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Submit Klaim Baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile || !amount || !description) {
      alert("Harap lengkapi semua field dan sertakan foto struk.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
      formData.append("request_key",requestKey.current);
    formData.append("user_id", user.id);
    formData.append("amount", amount.replace(/\D/g, ""));
    formData.append("category", category);
    formData.append("description", description);
    formData.append("receipt", receiptFile);

    try {
      const resp = await api.post("/reimbursements.php", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (resp.data.status === "success") {
        requestKey.current = crypto.randomUUID();
        setAmount("");
        setDescription("");
        setReceiptFile(null);
        setPreviewUrl(null);
        setShowForm(false);
        setActiveTab("history");
        fetchReimbursements(user);
      } else {
        alert(resp.data.message || "Gagal mengajukan klaim.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Klaim belum terkonfirmasi. Coba kirim ulang tanpa mengganti isian.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Approve / Reject
  const handleAction = async (id, status) => {
    if (!window.confirm(`Yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} klaim ini?`)) return;
    
    setLoading(true);
    try {
      const resp = await api.put("/reimbursements.php", {
        id,
        status,
        finance_notes: financeNotes
      });
      if (resp.data.status === "success") {
        setSelectedReceipt(null);
        setFinanceNotes("");
        fetchReimbursements(user);
      } else {
        alert(resp.data.message || "Gagal update.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    const ws_data = [
      ["LAPORAN REIMBURSEMENT", "", "", "", "", "", ""],
      ["NO", "TANGGAL", "KODE KLAIM", "NAMA KARYAWAN", "DESKRIPSI", "JUMLAH", "STATUS"],
    ];
    filtered.forEach((r, i) => {
      ws_data.push([
        i + 1,
        new Date(r.created_at).toLocaleDateString('id-ID'),
        `REIM-${String(r.id).padStart(4, '0')}`,
        r.employee_name || "Unknown",
        r.description,
        r.amount,
        r.status
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reimbursement");
    XLSX.writeFile(wb, `Laporan_Reimbursement_${new Date().toLocaleDateString("id-ID").replaceAll("/","-")}.xlsx`);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5"/> Disetujui</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100"><XCircle className="w-3.5 h-3.5"/> Ditolak</span>;
      default: return <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100"><Clock className="w-3.5 h-3.5"/> Menunggu</span>;
    }
  };

  const filtered = reimbursements.filter(r => {
    if (activeTab === "approval" && r.status !== "pending") return false;
    if (activeTab === "history" && isFinance && r.status === "pending") return false;
    
    const q = search.toLowerCase();
    return !q || 
      (r.description || "").toLowerCase().includes(q) || 
      (r.employee_name || "").toLowerCase().includes(q) || 
      `reim-${r.id}`.includes(q);
  });
  
  const rows = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(filtered.length / PER);

  // Stats
  const statPending = reimbursements.filter(r => r.status === 'pending').length;
  const statApproved = reimbursements.filter(r => r.status === 'approved').length;
  const statRejected = reimbursements.filter(r => r.status === 'rejected').length;
  const statDalamProses = 0; 

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50/50 pb-16">
        {loadError && <p role="alert" className="p-4 bg-red-50 text-red-700">{loadError}</p>}
        
        {/* Header Breadcrumbs */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-5 py-6">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reimbursement</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Finance</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600">Reimbursement</span>
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 pt-6 space-y-6">
          
          {/* Banner Hero */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-100/30 rounded-2xl p-6 border border-blue-100 flex items-center gap-6 relative overflow-hidden">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center shrink-0 z-10">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div className="z-10">
              <h2 className="text-lg font-black text-slate-800">Manajemen Reimbursement</h2>
              <p className="text-sm font-medium text-slate-600 mt-0.5">Kelola pengajuan klaim, proses approval, dan pantau riwayat reimbursement dengan mudah.</p>
            </div>
            {/* Fake Illustration right side */}
            <div className="absolute right-0 bottom-0 opacity-40 pointer-events-none z-0 hidden md:block">
              <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="50" r="40" fill="#3B82F6" />
                <rect x="120" y="20" width="60" height="60" rx="10" fill="#60A5FA" />
                <path d="M140 80L160 80L150 40L140 80Z" fill="#93C5FD" />
              </svg>
            </div>
          </div>

          {/* Segmented Control / Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-2 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex flex-1 w-full gap-2">
              {isFinance && (
                <button 
                  onClick={() => setActiveTab("approval")}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "approval" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Clock className="w-4 h-4" /> Approval
                </button>
              )}
              <button 
                onClick={() => setActiveTab("history")}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <FileText className="w-4 h-4" /> Riwayat
              </button>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-sm w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Klaim Baru
            </button>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Menunggu Approval */}
            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5 relative group overflow-hidden">
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Menunggu Approval</p>
                </div>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <h3 className="text-3xl font-black text-blue-700 tracking-tight">{statPending}</h3>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform cursor-pointer" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-2">{statPending} pengajuan</p>
            </div>

            {/* Disetujui */}
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5 relative group overflow-hidden">
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Disetujui</p>
                </div>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <h3 className="text-3xl font-black text-emerald-700 tracking-tight">{statApproved}</h3>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform cursor-pointer" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-2">{statApproved} pengajuan</p>
            </div>

            {/* Dalam Proses */}
            <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 relative group overflow-hidden">
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Dalam Proses</p>
                </div>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <h3 className="text-3xl font-black text-amber-700 tracking-tight">{statDalamProses}</h3>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform cursor-pointer" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-2">{statDalamProses} pengajuan</p>
            </div>

            {/* Ditolak */}
            <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-5 relative group overflow-hidden">
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Ditolak</p>
                </div>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <h3 className="text-3xl font-black text-rose-700 tracking-tight">{statRejected}</h3>
                <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform cursor-pointer" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-2">{statRejected} pengajuan</p>
            </div>

          </div>

          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama karyawan, deskripsi, atau kode klaim..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">Semua Bulan</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-50">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">Semua Status</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
              </div>
              <button className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:bg-blue-100 transition-colors font-bold text-sm">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-black text-slate-800">Daftar Pengajuan Reimbursement</h2>
              </div>
              <button
                onClick={handleExcelExport}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider w-12">NO</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider min-w-[120px]">
                      <div className="flex items-center gap-1">TANGGAL <span className="text-slate-300">↕</span></div>
                    </th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider min-w-[130px]">
                      <div className="flex items-center gap-1">KODE KLAIM <span className="text-slate-300">↕</span></div>
                    </th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider min-w-[160px]">
                      <div className="flex items-center gap-1">NAMA KARYAWAN <span className="text-slate-300">↕</span></div>
                    </th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider min-w-[200px]">
                      <div className="flex items-center gap-1">DESKRIPSI <span className="text-slate-300">↕</span></div>
                    </th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider min-w-[120px]">
                      <div className="flex items-center gap-1">JUMLAH <span className="text-slate-300">↕</span></div>
                    </th>
                    <th className="text-center px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">STATUS <span className="text-slate-300">↕</span></th>
                    <th className="text-center px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 opacity-70">
                      <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                        <Receipt className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black text-slate-800 mb-1">Belum ada data klaim</p>
                      <p className="text-xs font-medium text-slate-500 mb-5">Data pengajuan reimbursement akan muncul di sini.</p>
                      <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" /> Buat Klaim Baru
                      </button>
                    </td></tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-slate-400">{(page-1)*PER + i + 1}</td>
                        <td className="px-5 py-4">
                          <p className="text-[12px] font-semibold text-slate-600">
                            {new Date(r.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[12px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            REIM-{String(r.id).padStart(4, '0')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800">{r.employee_name || "Admin"}</p>
                          {isFinance && <p className="text-[11px] font-semibold text-blue-600">{r.employee_code}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[11px] font-black text-blue-600 uppercase tracking-wide mb-1">{r.category}</p>
                          <p className="text-xs font-medium text-slate-600 truncate max-w-[200px]" title={r.description}>{r.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black text-slate-800">{formatRupiah(r.amount)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {getStatusBadge(r.status)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setSelectedReceipt(r)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors" title="Lihat Detail">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isFinance && activeTab === "approval" && r.status === "pending" && (
                              <>
                                <button onClick={() => handleAction(r.id, 'approved')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors" title="Setujui">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleAction(r.id, 'rejected')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors" title="Tolak">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Menampilkan {rows.length} dari {filtered.length} data</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage(p=>Math.max(1, p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">{page}</div>
                  <button onClick={() => setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages||totalPages===0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Buat Klaim Baru */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600"/> Buat Klaim Baru</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Kategori Pengeluaran</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Transportasi">Transportasi (Bensin, Parkir, Tol)</option>
                    <option value="Konsumsi">Konsumsi / Makan</option>
                    <option value="ATK / Operasional">ATK / Operasional Kantor</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Nominal (Rp)</label>
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAmount(val ? new Intl.NumberFormat("id-ID").format(val) : "");
                    }}
                    placeholder="Contoh: 150.000"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Keterangan / Tujuan</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Bensin meeting klien..."
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none h-24"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Foto Struk / Bukti Bayar</label>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange} 
                  />

                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                      {receiptFile?.type.includes('pdf') ? (
                        <div className="h-32 flex items-center justify-center flex-col">
                          <Receipt className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-[12px] font-bold text-slate-600 truncate max-w-[80%]">{receiptFile.name}</span>
                        </div>
                      ) : (
                        <img src={previewUrl} alt="Preview Struk" className="w-full h-32 object-contain" />
                      )}
                      <button 
                        type="button"
                        onClick={() => { setReceiptFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="flex flex-col items-center justify-center gap-2 h-24 bg-slate-50 border border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-500 hover:text-blue-600"
                      >
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[11px] font-bold">Pilih File</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          fileInputRef.current.setAttribute('capture', 'environment');
                          fileInputRef.current.click();
                          fileInputRef.current.removeAttribute('capture');
                        }}
                        className="flex flex-col items-center justify-center gap-2 h-24 bg-slate-50 border border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-500 hover:text-blue-600"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-[11px] font-bold">Buka Kamera</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    Kirim Klaim
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Lihat Struk & Approval Detail */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">Detail Klaim REIM-{String(selectedReceipt.id).padStart(4, '0')}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedReceipt.category} • {formatRupiah(selectedReceipt.amount)}</p>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto bg-slate-100 p-4 flex flex-col items-center justify-center min-h-[300px] relative">
                {selectedReceipt.receipt_path?.endsWith('.pdf') ? (
                   <a href={`/api/reimbursements.php?view=receipt&id=${selectedReceipt.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-sm text-blue-600 font-bold hover:text-blue-700 border border-slate-200">
                     <FileText className="w-5 h-5" /> Buka Dokumen PDF
                   </a>
                ) : (
                  <img 
                    src={`/api/reimbursements.php?view=receipt&id=${selectedReceipt.id}`} 
                    alt="Receipt" 
                    className="max-w-full h-auto rounded-xl shadow-sm border border-slate-200 bg-white"
                  />
                )}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(selectedReceipt.status)}
                </div>
              </div>

              {/* Info Tambahan */}
              <div className="p-5 bg-white border-t border-slate-100">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Deskripsi</p>
                <p className="text-sm font-medium text-slate-700 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedReceipt.description}</p>
                
                {selectedReceipt.finance_notes && (
                  <div className={`text-sm p-3 rounded-xl mb-4 font-medium border ${selectedReceipt.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                    <strong>Catatan Finance:</strong> {selectedReceipt.finance_notes}
                  </div>
                )}

                {isFinance && activeTab === "approval" && selectedReceipt.status === 'pending' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Catatan Approval (Opsional)</label>
                    <input 
                      type="text"
                      value={financeNotes}
                      onChange={(e) => setFinanceNotes(e.target.value)}
                      placeholder="Alasan tolak / catatan approve..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleAction(selectedReceipt.id, 'rejected')}
                        className="py-3 bg-white border border-rose-200 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Tolak Klaim
                      </button>
                      <button 
                        onClick={() => handleAction(selectedReceipt.id, 'approved')}
                        className="py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Setujui Klaim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

const ChevronDown = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
