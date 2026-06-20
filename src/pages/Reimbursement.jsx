import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Image as ImageIcon, Camera, CheckCircle2, XCircle, Clock, Search, Receipt } from "lucide-react";
import Layout from "../components/Layout";
import api, { API_BASE } from "../services/api";

export default function Reimbursement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("history"); // history, new, approval
  const [loading, setLoading] = useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  
  // Form State
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
      if (['finance', 'admin', 'super_admin'].includes(parsed.role_name)) {
        setActiveTab("approval");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchReimbursements = async (currentUser) => {
    setLoading(true);
    try {
      const resp = await api.get(`/reimbursements.php?user_id=${currentUser.id}&role=${currentUser.role_name}`);
      if (resp.data.status === "success") {
        setReimbursements(resp.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isFinance = user && ['finance', 'admin', 'super_admin'].includes(user.role_name);

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
        alert("Klaim berhasil diajukan!");
        setAmount("");
        setDescription("");
        setReceiptFile(null);
        setPreviewUrl(null);
        setActiveTab("history");
        fetchReimbursements(user);
      } else {
        alert(resp.data.message || "Gagal mengajukan klaim.");
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat upload struk.");
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
        alert("Status berhasil diperbarui!");
        setSelectedReceipt(null);
        setFinanceNotes("");
        fetchReimbursements(user);
      } else {
        alert(resp.data.message || "Gagal update.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"><CheckCircle2 className="w-3 h-3"/> Disetujui</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100"><XCircle className="w-3 h-3"/> Ditolak</span>;
      default: return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100"><Clock className="w-3 h-3"/> Menunggu Review</span>;
    }
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-[#f4f6f8] pb-24 relative overflow-hidden flex flex-col">
        
        {/* Navy Blue Header */}
        <div className="absolute top-0 left-0 right-0 h-[220px] bg-[#0c2e59] rounded-b-[2rem] shadow-lg"></div>

        {/* Header Section */}
        <div className="flex items-center justify-between pt-6 px-5 mb-6 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-white font-bold text-[16px] tracking-wide">Klaim Pengeluaran</span>
          <div className="w-10"></div>
        </div>

        <div className="relative z-10 px-5 flex-1 flex flex-col">
          
          {/* Tabs */}
          <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1 mb-6 border border-white/10">
            {isFinance && (
              <button 
                onClick={() => setActiveTab("approval")}
                className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${activeTab === "approval" ? "bg-white text-[#0c2e59] shadow-md" : "text-white/70 hover:text-white"}`}
              >
                Approval Finance
              </button>
            )}
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${activeTab === "history" ? "bg-white text-[#0c2e59] shadow-md" : "text-white/70 hover:text-white"}`}
            >
              Riwayat Saya
            </button>
            <button 
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${activeTab === "new" ? "bg-white text-[#0c2e59] shadow-md" : "text-white/70 hover:text-white"}`}
            >
              Klaim Baru
            </button>
          </div>

          {/* Main Content Area */}
          <div className="bg-white flex-1 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-slate-100 p-5 overflow-hidden flex flex-col">
            
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#0c2e59] border-t-transparent rounded-full"></div>
              </div>
            )}

            {/* TAB: NEW CLAIM */}
            {activeTab === "new" && (
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="mb-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h2 className="text-[18px] font-bold text-[#0c2e59]">Buat Klaim Baru</h2>
                  <p className="text-[12px] text-slate-500 mt-1">Upload foto struk belanja untuk diganti oleh perusahaan.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5 ml-1">Kategori Pengeluaran</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#f4f6f8] border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Transportasi">🚗 Transportasi (Bensin, Parkir, Tol)</option>
                      <option value="Konsumsi">🍔 Konsumsi / Makan</option>
                      <option value="ATK / Operasional">📝 ATK / Operasional Kantor</option>
                      <option value="Lainnya">📦 Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5 ml-1">Nominal (Rp)</label>
                    <input 
                      type="text" 
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setAmount(val ? new Intl.NumberFormat("id-ID").format(val) : "");
                      }}
                      placeholder="Contoh: 150.000"
                      className="w-full bg-[#f4f6f8] border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5 ml-1">Keterangan / Tujuan</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contoh: Bensin meeting klien PT Angkasa..."
                      className="w-full bg-[#f4f6f8] border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none h-24"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5 ml-1">Foto Struk / Bukti Bayar</label>
                    
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={handleFileChange} 
                    />

                    {previewUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 group">
                        {receiptFile?.type.includes('pdf') ? (
                          <div className="h-40 bg-slate-100 flex items-center justify-center flex-col">
                            <Receipt className="w-10 h-10 text-slate-400 mb-2" />
                            <span className="text-[12px] font-bold text-slate-600">{receiptFile.name}</span>
                          </div>
                        ) : (
                          <img src={previewUrl} alt="Preview Struk" className="w-full h-48 object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => { setReceiptFile(null); setPreviewUrl(null); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="flex flex-col items-center justify-center gap-2 h-28 bg-[#f4f6f8] border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-500 hover:text-blue-600"
                        >
                          <ImageIcon className="w-7 h-7" />
                          <span className="text-[11px] font-bold">Pilih Galeri</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            // Trick: add capture attribute for mobile
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                            fileInputRef.current.removeAttribute('capture');
                          }}
                          className="flex flex-col items-center justify-center gap-2 h-28 bg-[#f4f6f8] border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-500 hover:text-blue-600"
                        >
                          <Camera className="w-7 h-7" />
                          <span className="text-[11px] font-bold">Buka Kamera</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#0c2e59] text-white font-bold text-[15px] py-4 rounded-2xl shadow-[0_8px_20px_rgba(12,46,89,0.3)] active:scale-[0.98] transition-all mt-4"
                  >
                    Ajukan Klaim Sekarang
                  </button>
                </form>
              </div>
            )}

            {/* TAB: HISTORY & APPROVAL */}
            {(activeTab === "history" || activeTab === "approval") && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
                {reimbursements.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60 pt-10">
                    <Receipt className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-[14px] font-bold text-slate-600">Belum Ada Data Klaim</p>
                    <p className="text-[12px] text-slate-400 mt-1">Data struk dan klaim yang diajukan akan muncul di sini.</p>
                  </div>
                ) : (
                  reimbursements.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {activeTab === "approval" && (
                            <p className="text-[11px] font-bold text-blue-600 mb-0.5">{item.employee_name} ({item.employee_code})</p>
                          )}
                          <h3 className="text-[14px] font-bold text-slate-800">{item.category}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">{new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-black text-[#0c2e59]">{formatRupiah(item.amount)}</p>
                          <div className="mt-1 flex justify-end">{getStatusBadge(item.status)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-[#f4f6f8] rounded-xl p-3 mb-3">
                        <p className="text-[12px] text-slate-700 italic">"{item.description}"</p>
                      </div>

                      {item.finance_notes && (
                        <div className={`text-[11px] p-2 rounded-lg mb-3 font-medium border ${item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                          <strong>Catatan Finance:</strong> {item.finance_notes}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedReceipt(item)}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[12px] font-bold hover:bg-slate-200 transition-colors"
                        >
                          Lihat Bukti Struk
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>

        {/* Modal Lihat Struk & Approval */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-[14px] font-bold text-slate-800">Bukti {selectedReceipt.category}</h3>
                  <p className="text-[11px] text-slate-500">{formatRupiah(selectedReceipt.amount)}</p>
                </div>
                {getStatusBadge(selectedReceipt.status)}
              </div>
              
              <div className="flex-1 overflow-auto bg-slate-100 p-2 flex items-center justify-center min-h-[250px]">
                {selectedReceipt.receipt_path.endsWith('.pdf') ? (
                   <a href={`${API_BASE.replace('/api', '')}/${selectedReceipt.receipt_path}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">Buka PDF Dokumen</a>
                ) : (
                  <img 
                    src={`${API_BASE.replace('/api', '')}/${selectedReceipt.receipt_path}`} 
                    alt="Receipt" 
                    className="max-w-full h-auto rounded-xl shadow-md"
                  />
                )}
              </div>

              {/* Aksi Khusus Finance jika status masih pending */}
              {activeTab === "approval" && selectedReceipt.status === 'pending' && (
                <div className="p-5 border-t border-slate-100 bg-white">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                  <input 
                    type="text"
                    value={financeNotes}
                    onChange={(e) => setFinanceNotes(e.target.value)}
                    placeholder="Alasan tolak / catatan approve..."
                    className="w-full bg-[#f4f6f8] border border-slate-200 rounded-xl px-3 py-2.5 text-[12px] mb-3 outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleAction(selectedReceipt.id, 'rejected')}
                      className="py-3 bg-rose-100 text-rose-700 font-bold text-[13px] rounded-xl hover:bg-rose-200"
                    >
                      Tolak Klaim
                    </button>
                    <button 
                      onClick={() => handleAction(selectedReceipt.id, 'approved')}
                      className="py-3 bg-emerald-600 text-white font-bold text-[13px] rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:bg-emerald-700"
                    >
                      Setujui Klaim
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
