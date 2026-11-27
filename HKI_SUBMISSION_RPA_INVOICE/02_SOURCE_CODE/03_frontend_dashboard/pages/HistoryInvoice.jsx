import { useCallback, useEffect, useRef, useState } from "react";

import {
  ChevronLeft, Plus, Search, X, Check, Upload,
  FileText, Phone, Mail, User, Eye, Download, Link as LinkIcon,
  FileSpreadsheet, Calendar
} from "lucide-react";
import Layout from "../components/Layout";
import axios from "axios";

const PROGRAM_TYPES = [
  { value: "intensif_offline", label: "Intensif Offline", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "matching_job", label: "Matching Job", color: "bg-violet-50 text-violet-700 border-violet-100" },
];
function getProgramColor(type) {
  return PROGRAM_TYPES.find(p => p.value === type)?.color || "bg-slate-50 text-slate-700 border-slate-200";
}
function getProgramLabel(type) {
  return PROGRAM_TYPES.find(p => p.value === type)?.label || type;
}
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount || 0);
}
const formatInputCurrency = (val) => {
  if (!val) return "";
  const numeric = val.toString().replace(/\D/g, "");
  return numeric ? parseInt(numeric, 10).toLocaleString("id-ID") : "";
};
const parseCurrencyString = (val) => {
  if (!val) return 0;
  return parseInt(val.toString().replace(/\D/g, ""), 10) || 0;
};
function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

export default function HistoryInvoice() {
  
  const user = getUser();
  const [activeTab, setActiveTab] = useState("intensif_offline");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const requestKeys = useRef({client:crypto.randomUUID(),invoice:crypto.randomUUID()});
  const initialFormState = { 
    name: "", phone: "", email: "", total_biaya: "", keterangan: "",
    initial_amount: "", initial_keterangan: "DP / Pembayaran Awal", 
    initial_date: new Date().toISOString().split('T')[0],
    initial_attach_mode: "file", initial_link: "", initial_file: null 
  };
  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const addInvoiceRef = useRef(null);

  const [uploadTarget, setUploadTarget] = useState(null);
  
  // States for Invoice Upload (Modal Upload)
  const [invoiceAttachMode, setInvoiceAttachMode] = useState("file");
  const [invoiceLink, setInvoiceLink] = useState("");
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceNote, setInvoiceNote] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const invoiceRef = useRef(null);
  
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailInvoices, setDetailInvoices] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [detailError, setDetailError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/invoice.php?program_type=${activeTab}`);
      if (res.data?.status !== "success" || !Array.isArray(res.data.data)) throw new Error(res.data?.message || "Respons invoice tidak valid.");
      setLoadError(""); setData(res.data.data);
    } catch (err) { setLoadError(err.response?.data?.message || err.message || "Daftar invoice gagal dimuat."); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(r => {
    const q = search.toLowerCase();
    return !search || (r.name || "").toLowerCase().includes(q) || (r.phone || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append("request_key",requestKeys.current.client);fd.append("action", "add_client"); fd.append("name", form.name);
      fd.append("phone", form.phone); fd.append("email", form.email);
      fd.append("program_type", activeTab); 
      fd.append("total_biaya", parseCurrencyString(form.total_biaya));
      fd.append("keterangan", form.keterangan); fd.append("user_id", user?.id || 0);
      const res = await axios.post("/api/invoice.php", fd);
      const clientId = res.data?.id;
      if (res.data?.status !== "success" || !clientId) throw new Error("Klien belum terkonfirmasi tersimpan.");

      if (clientId && form.initial_amount) {
        const fdInv = new FormData();
        fdInv.append("request_key",requestKeys.current.invoice);fdInv.append("action", "add_invoice");
        fdInv.append("client_id", clientId);
        fdInv.append("keterangan", form.initial_keterangan || "DP / Pembayaran Awal");
        fdInv.append("jumlah", parseCurrencyString(form.initial_amount));
        fdInv.append("user_id", user?.id || 0);
        if (form.initial_date) fdInv.append("payment_date", form.initial_date + " 12:00:00");
        
        if (form.initial_attach_mode === "file" && form.initial_file) {
          fdInv.append("invoice_file", form.initial_file);
        }
        if (form.initial_attach_mode === "link" && form.initial_link) {
          fdInv.append("drive_link", form.initial_link);
        }
        await axios.post("/api/invoice.php", fdInv);
      }

      requestKeys.current={client:crypto.randomUUID(),invoice:crypto.randomUUID()};
      setShowForm(false);
      setForm(initialFormState);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || err.message || "Penyimpanan belum terkonfirmasi. Coba ulang tanpa mengubah isian."); } finally { setSaving(false); }
  };

  const resetUploadState = () => {
    requestKeys.current.invoice=crypto.randomUUID();
    setUploadTarget(null); setInvoiceFile(null); setInvoiceNote(""); 
    setInvoiceAmount(""); setInvoiceAttachMode("file"); setInvoiceLink("");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  };

  const handleUploadInvoice = async (e) => {
    e.preventDefault(); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("request_key",requestKeys.current.invoice);fd.append("action", "add_invoice"); fd.append("client_id", uploadTarget.id);
      fd.append("keterangan", invoiceNote); 
      fd.append("jumlah", parseCurrencyString(invoiceAmount));
      fd.append("user_id", user?.id || 0);
      if (invoiceDate) fd.append("payment_date", invoiceDate + " 12:00:00");
      
      if (invoiceAttachMode === "file" && invoiceFile) fd.append("invoice_file", invoiceFile);
      if (invoiceAttachMode === "link" && invoiceLink) fd.append("drive_link", invoiceLink);
      await axios.post("/api/invoice.php", fd);
      resetUploadState();
      fetchData();
      if (detailTarget?.id === uploadTarget.id) openDetail(detailTarget);
    } catch (err) { alert(err.response?.data?.message || err.message || "Upload belum terkonfirmasi. Coba ulang tanpa mengubah isian."); } finally { setUploading(false); }
  };

  const openDetail = async (client) => {
    setDetailTarget(client); setDetailLoading(true); setDetailError("");
    try {
      const res = await axios.get(`/api/invoice.php?action=invoices&client_id=${client.id}`);
      if (res.data?.status !== "success" || !Array.isArray(res.data.data)) throw new Error("Respons bukti invoice tidak valid.");
      setDetailInvoices(res.data.data);
    } catch (err) { setDetailError(err.response?.data?.message || err.message || "Bukti invoice gagal dimuat."); } finally { setDetailLoading(false); }
  };

  const sisaTagihan = (client) => parseFloat(client.total_biaya || 0) - parseFloat(client.total_paid || 0);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-16">
        <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-end">
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20">
              <Plus className="w-4 h-4" /> Tambah Peserta
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 pt-5">
          <div className="flex gap-2 mb-5">
            {PROGRAM_TYPES.map(pt => (
              <button key={pt.value} onClick={() => { setActiveTab(pt.value); setSearch(""); }}
                className={`px-5 py-2 rounded-xl text-sm font-black transition-all border ${activeTab === pt.value ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" : "bg-white text-slate-600 border-slate-200 hover:border-blue-200"}`}>
                {pt.label}
              </button>
            ))}
          </div>

          <div className="relative mb-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari nama, HP, atau email..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide w-8">NO</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">NAMA PESERTA</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">KONTAK</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">TOTAL BIAYA</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">SUDAH BAYAR</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">SISA</th>
                    <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">INVOICE</th>
                    <th className="text-right px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wide">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" /></td></tr>
                  ) : loadError ? (<tr><td colSpan={8} role="alert" className="p-4 text-red-700">{loadError}</td></tr>) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-semibold text-sm">Belum ada data peserta {getProgramLabel(activeTab)}.</td></tr>
                  ) : filtered.map((r, i) => {
                    const sisa = sisaTagihan(r);
                    const lunas = sisa <= 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-4 py-3 text-sm font-bold text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{r.name}</p>
                              {r.keterangan && <p className="text-[11px] text-slate-400 font-semibold">{r.keterangan}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone || "-"}</span>
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {r.email || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.total_biaya ? formatCurrency(r.total_biaya) : "-"}</td>
                        <td className="px-4 py-3 text-sm font-black text-emerald-600">{formatCurrency(r.total_paid || 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${lunas ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                            {lunas ? "✓ Lunas" : formatCurrency(sisa)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">{r.invoice_count || 0}x</span>
                            <button onClick={() => openDetail(r)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                              <Eye className="w-3.5 h-3.5" /> Lihat
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setUploadTarget({ id: r.id, name: r.name })}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Upload Invoice">
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
                <h2 className="text-[16px] font-black text-slate-900">+ Tambah Peserta</h2>
                <button type="button" onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-600" /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Program</label>
                  <div className="flex gap-2">
                    {PROGRAM_TYPES.map(pt => (
                      <button key={pt.value} type="button" onClick={() => setActiveTab(pt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition-colors ${activeTab === pt.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200"}`}>
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Nama Peserta</label>
                  <input type="text" placeholder="Nama lengkap..." value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">No. HP / WhatsApp</label>
                    <input type="text" placeholder="08xx-xxxx" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                    <input type="email" placeholder="email@contoh.com" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Total Biaya Program (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                    <input type="text" placeholder="0" value={form.total_biaya} onChange={e => setForm(p => ({...p, total_biaya: formatInputCurrency(e.target.value)}))} className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-slate-50 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Keterangan Peserta</label>
                  <input type="text" placeholder="Batch, angkatan, dll..." value={form.keterangan} onChange={e => setForm(p => ({...p, keterangan: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </div>
                
                <hr className="my-2 border-slate-100" />
                
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <h3 className="text-xs font-black text-blue-800 mb-3 uppercase tracking-wide">Pembayaran Awal / DP (Opsional)</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Tgl Pembayaran</label>
                      <input type="date" value={form.initial_date} onChange={e => setForm(p => ({...p, initial_date: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Ket. Pembayaran</label>
                      <input type="text" placeholder="DP..." value={form.initial_keterangan} onChange={e => setForm(p => ({...p, initial_keterangan: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Jumlah (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                      <input type="text" placeholder="0" value={form.initial_amount} onChange={e => setForm(p => ({...p, initial_amount: formatInputCurrency(e.target.value)}))} className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 font-bold" />
                    </div>
                  </div>
                  
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">Upload Bukti Bayar / Link Invoice</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setForm(p => ({...p, initial_attach_mode: "file"}))}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-black border transition-colors ${form.initial_attach_mode === "file" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}>
                      <Upload className="w-3 h-3 inline-block mr-1" /> Upload File
                    </button>
                    <button type="button" onClick={() => setForm(p => ({...p, initial_attach_mode: "link"}))}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-black border transition-colors ${form.initial_attach_mode === "link" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}>
                      <LinkIcon className="w-3 h-3 inline-block mr-1" /> Link URL
                    </button>
                  </div>

                  {form.initial_attach_mode === "file" ? (
                    <div onClick={() => addInvoiceRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 bg-white rounded-xl h-20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 transition-all relative overflow-hidden">
                      {form.initial_file ? (
                        <>
                          {form.initial_file.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(form.initial_file)} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <p className="text-[11px] font-semibold text-slate-600 truncate max-w-[150px]">{form.initial_file.name}</p>
                            </div>
                          )}
                          <button type="button" onClick={e => { e.stopPropagation(); setForm(p => ({...p, initial_file: null})); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <p className="text-[11px] font-semibold text-slate-400">Klik pilih JPG, PDF, Excel...</p>
                      )}
                    </div>
                  ) : (
                    <input type="url" placeholder="Masukkan link GDrive/Spreadsheet..." value={form.initial_link} onChange={e => setForm(p => ({...p, initial_link: e.target.value}))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
                  )}
                  {form.initial_attach_mode === "file" && <input ref={addInvoiceRef} type="file" accept="image/*,.pdf,.xls,.xlsx,.csv" onChange={e => { if (e.target.files[0]) setForm(p => ({...p, initial_file: e.target.files[0]})); }} className="hidden" />}
                </div>

                <div className="flex gap-3 mt-4 pt-2 sticky bottom-0 bg-white pb-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />} Simpan Peserta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {uploadTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[15px] font-black text-slate-900">Upload Invoice / Bukti Bayar</h2>
                <button onClick={resetUploadState} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-600" /></button>
              </div>
              <p className="text-xs text-blue-600 font-bold mb-5 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {uploadTarget.name}</p>
              <form onSubmit={handleUploadInvoice} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Tgl Bayar</label>
                    <div className="relative">
                      <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Jumlah (Rp)</label>
                    <input type="text" placeholder="0" value={invoiceAmount} onChange={e => setInvoiceAmount(formatInputCurrency(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Keterangan</label>
                  <input type="text" placeholder="cth: Cicilan 1, DP, Pelunasan..." value={invoiceNote} onChange={e => setInvoiceNote(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">File Invoice / Link Spreadsheet</label>
                  
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceAttachMode("file")}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition-colors ${invoiceAttachMode === "file" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}
                    >
                      <Upload className="w-3.5 h-3.5 inline-block mr-1" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceAttachMode("link")}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition-colors ${invoiceAttachMode === "link" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 inline-block mr-1" /> Link URL
                    </button>
                  </div>

                  {invoiceAttachMode === "file" ? (
                    <div onClick={() => invoiceRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all relative overflow-hidden">
                      {invoiceFile ? (
                        <>
                          {invoiceFile.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(invoiceFile)} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              {invoiceFile.name.endsWith('.pdf') ? <FileText className="w-8 h-8 text-rose-500" /> : <FileSpreadsheet className="w-8 h-8 text-emerald-500" />}
                              <p className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">{invoiceFile.name}</p>
                            </div>
                          )}
                          <button type="button" onClick={e => { e.stopPropagation(); setInvoiceFile(null); }}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-300 mb-1" />
                          <p className="text-xs font-semibold text-slate-400">Klik untuk upload invoice</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, PDF, Excel, CSV</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="Masukkan link Google Drive / Website..."
                      value={invoiceLink}
                      onChange={e => setInvoiceLink(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  )}
                  {invoiceAttachMode === "file" && <input ref={invoiceRef} type="file" accept="image/*,.pdf,.xls,.xlsx,.csv" onChange={e => { if (e.target.files[0]) setInvoiceFile(e.target.files[0]); }} className="hidden" />}
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={resetUploadState} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={uploading} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />} Upload Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {detailTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-slate-100 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[16px] font-black text-slate-900">{detailTarget.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {detailTarget.phone || "-"}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {detailTarget.email || "-"}</span>
                    </div>
                    <span className={`mt-2 inline-block text-[11px] font-black px-2.5 py-1 rounded-full border ${getProgramColor(detailTarget.program_type)}`}>
                      {getProgramLabel(detailTarget.program_type)}
                    </span>
                  </div>
                  <button onClick={() => setDetailTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 flex-shrink-0">
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                {detailTarget.total_biaya > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">Total Biaya</p>
                      <p className="text-sm font-black text-slate-800">{formatCurrency(detailTarget.total_biaya)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">Sudah Bayar</p>
                      <p className="text-sm font-black text-emerald-700">{formatCurrency(detailTarget.total_paid || 0)}</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${sisaTagihan(detailTarget) <= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                      <p className={`text-[10px] font-black uppercase tracking-wide mb-1 ${sisaTagihan(detailTarget) <= 0 ? "text-emerald-600" : "text-rose-600"}`}>Sisa</p>
                      <p className={`text-sm font-black ${sisaTagihan(detailTarget) <= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {sisaTagihan(detailTarget) <= 0 ? "✓ Lunas" : formatCurrency(sisaTagihan(detailTarget))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-700">Riwayat Invoice / Pembayaran</h3>
                  <button onClick={() => setUploadTarget({ id: detailTarget.id, name: detailTarget.name })}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Tambah Invoice
                  </button>
                </div>
                {detailError ? (<p role="alert" className="text-red-700">{detailError}</p>) : detailLoading ? (
                  <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" /></div>
                ) : detailInvoices.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-semibold text-sm">Belum ada invoice yang diupload.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {detailInvoices.map((inv, idx) => (
                      <div key={inv.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${inv.drive_link ? 'bg-violet-100' : 'bg-blue-100'}`}>
                              {inv.drive_link ? <LinkIcon className="w-4.5 h-4.5 text-violet-600" /> : <FileText className="w-4.5 h-4.5 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-black text-slate-500">#{idx + 1}</span>
                                {inv.keterangan && <span className="text-sm font-bold text-slate-800">{inv.keterangan}</span>}
                              </div>
                              {inv.jumlah > 0 && <p className="text-sm font-black text-emerald-600">{formatCurrency(inv.jumlah)}</p>}
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(inv.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {inv.payment_status==='needs_review' && <p className="text-sm font-semibold text-amber-700">Bukti belum verified dan posted. Catat pembayaran melalui Transaksi Pemasukan.</p>}{inv.file_path && (
                              <a href={`/api/invoice.php?view=file&id=${inv.id}`} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Download / Buka File">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {inv.drive_link && (
                              <a href={inv.drive_link.startsWith("http") ? inv.drive_link : `https://${inv.drive_link}`} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors" title="Buka Link URL">
                                <LinkIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        {inv.file_path && inv.file_path.match(/\.(jpg|jpeg|png|webp)$/i) && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-100">
                            <img src={`/api/invoice.php?view=file&id=${inv.id}`} alt="Invoice" className="w-full max-h-48 object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
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
