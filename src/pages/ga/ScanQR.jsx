import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  ChevronLeft, QrCode, Camera, X, Package, MapPin, Tag,
  AlertTriangle, CheckCircle, ArrowRight, Info, RefreshCw,
  FlipHorizontal, RotateCcw, ClipboardCheck, User, Search
} from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useSEO } from "../../hooks/useSEO";

function conditionColor(c) {
  if (c === "Baik")         return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (c === "Rusak Ringan") return "text-amber-600 bg-amber-50 border-amber-200";
  if (c === "Rusak Berat")  return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

const CONDITIONS = ["Baik","Rusak Ringan","Rusak Berat","Tidak Layak"];
const STATUSES   = ["Aktif","Maintenance","Tidak Aktif","Dipinjam"];
const LOCATIONS  = ["Kantor Pusat","Ruang Meeting","Ruang Server","Gudang","Lobby","Lantai 1","Lantai 2","Dapur","Toilet","Parkiran","Area Produksi","Lainnya"];

export default function ScanQR() {
  useSEO({ title: "Scan QR Aset", description: "Pindai kode QR aset untuk melihat atau memperbarui informasi" });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [scanning, setScanning]   = useState(false);
  const [scanned, setScanned]     = useState(null);
  const [asset, setAsset]         = useState(null);
  const [notFound, setNotFound]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState("pindah");
  const [newLocation, setNewLocation] = useState("");
  const [newCondition, setNewCondition] = useState("Baik");
  const [newStatus, setNewStatus]   = useState("Aktif");
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [manualCode, setManualCode] = useState(searchParams.get("code") || "");
  const [, setShowManual] = useState(false);
  const [error, setError]           = useState("");
  // Camera facing mode: "environment" = belakang, "user" = depan
  const [facingMode, setFacingMode] = useState("environment");
  const [employees, setEmployees]   = useState([]);
  const [picId, setPicId]           = useState(""); // ID karyawan PIC/auditor

  const scannerInstanceRef = useRef(null);

  const stopScanner = async () => {
    try {
      if (scannerInstanceRef.current) {
        const state = scannerInstanceRef.current.getState();
        // state 2 = SCANNING
        if (state === 2) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      }
    } catch { /* Best-effort cleanup or optional browser data. */ }
    setScanning(false);
  };

  const startScanner = async (mode) => {
    const faceMode = mode || facingMode;
    await stopScanner();
    setScanning(true);
    setAsset(null);
    setNotFound(false);
    setScanned(null);
    setError("");

    // Tunggu sebentar agar DOM ter-render
    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode("qr-reader");
        scannerInstanceRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: faceMode },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            stopScanner().then(() => handleScanResult(decodedText));
          },
          () => {}
        );
      } catch (e) {
        console.error(e);
        setScanning(false);
        setError("Gagal mengakses kamera. Pastikan izin kamera diperbolehkan di browser, lalu coba lagi.");
      }
    }, 200);
  };

  

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleScanResult(code);
    }
    // Fetch daftar karyawan untuk dropdown PIC
    api.get("/employees.php").then(res => {
      setEmployees(res.data?.data || []);
      // Default PIC = user yang sedang login
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const found = (res.data?.data || []).find(e => e.id === currentUser.employee_id || e.name === currentUser.name);
      if (found) setPicId(String(found.id));
    }).catch(() => {});
    return () => { stopScanner(); };
  }, []);

  const handleScanResult = async (code) => {
    let cleanCode = code.trim();
    try {
      const url = new URL(cleanCode);
      const param = url.searchParams.get("code");
      if (param) cleanCode = param;
    } catch { /* Best-effort cleanup or optional browser data. */ }

    setScanned(cleanCode);
    setLoading(true);
    setNotFound(false);
    setAsset(null);
    setShowAction(false);
    setSaved(false);

    try {
      const res = await api.get(`/assets.php?qr_code=${encodeURIComponent(cleanCode)}`);
      const a = res.data?.data;
      setAsset(a);
      setNewLocation(a.location);
      setNewCondition(a.condition);
      setNewStatus(a.status);
    } catch (e) {
      if (e.response?.status === 404) {
        setNotFound(true);
      } else {
        setError("Gagal mengambil data aset. Periksa koneksi jaringan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = () => {
    if (manualCode.trim()) handleScanResult(manualCode.trim());
  };

  const handleSaveAction = async () => {
    if (!asset) return;
    setSaving(true);
    try {
      const auditDate = new Date().toLocaleString("id-ID", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" });
      const autoNotes = actionType === "stock_opname"
        ? (notes.trim() || `Stock opname dilakukan pada ${auditDate}`)
        : (notes || `${actionType === "pindah" ? "Dipindahkan ke " + newLocation : "Update via scan QR"}`);

      // Gunakan picId jika dipilih, fallback ke user login
      const performedBy = picId ? parseInt(picId) : (user.id || 0);

      const payload = {
        asset_id: asset.id,
        action_type: actionType,
        from_location: asset.location,
        to_location: actionType === "pindah" ? newLocation : asset.location,
        condition_before: asset.condition,
        condition_after: newCondition,
        status_before: asset.status,
        status_after: newStatus,
        notes: autoNotes,
        performed_by: performedBy,
      };
      await api.post("/asset_histories.php", payload);
      setSaved(true);
      const res = await api.get(`/assets.php?qr_code=${encodeURIComponent(asset.qr_code)}`);
      setAsset(res.data?.data);
      setShowAction(false);
      setNotes("");
    } catch {
      alert("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setAsset(null);
    setScanned(null);
    setNotFound(false);
    setSaved(false);
    setShowAction(false);
    setManualCode("");
    setError("");
    setShowManual(false);
  };

  

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800">Asset Management</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Dashboard &gt; GA &gt; Scan QR Asset</p>
            </div>
            <button
              onClick={() => navigate("/assets/audit")}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-bold shadow-sm transition-all"
            >
              <ClipboardCheck className="w-4 h-4" /> Laporan Audit
            </button>
          </div>

          {/* Hero Banner */}
          <div className="bg-[#eef2ff] rounded-[1.5rem] overflow-hidden relative shadow-sm h-32 sm:h-40 border border-blue-100 flex items-center">
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'right 30%',
              }}
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#eef2ff] via-[#eef2ff]/90 to-transparent"></div>
            
            <div className="relative z-20 flex items-start gap-4 p-6 sm:p-8 w-full max-w-2xl">
               <div className="w-14 h-14 bg-blue-100/80 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                 <QrCode className="w-7 h-7 text-blue-600" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-[#0f2c59]">Scan QR Asset</h2>
                 <p className="text-sm font-medium text-slate-600 mt-1 max-w-xl">Gunakan kamera untuk memindai QR Code aset atau masukkan kode aset secara manual untuk melihat informasi aset dengan cepat.</p>
               </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">{error}</p>
                <button onClick={() => setError("")} className="text-xs text-red-500 mt-1 underline">Tutup</button>
              </div>
            </div>
          )}

          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-none" />
                <p className="text-sm font-bold text-emerald-700">Data berhasil diupdate &amp; dicatat ke laporan audit!</p>
              </div>
              <button
                onClick={() => navigate("/assets/audit")}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <ClipboardCheck className="w-4 h-4" /> Lihat Laporan
              </button>
            </div>
          )}

          {/* ── Camera Scanner Area ── */}
          {!asset && !loading && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 flex flex-col items-center justify-center max-w-4xl mx-auto">
              
              {/* Graphic Target Box */}
              {!scanning ? (
                <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 border-[3px] border-dashed border-blue-200 rounded-[2rem]" />
                  {/* Corners */}
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[5px] border-l-[5px] border-blue-600 rounded-tl-[2rem]" />
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[5px] border-r-[5px] border-blue-600 rounded-tr-[2rem]" />
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[5px] border-l-[5px] border-blue-600 rounded-bl-[2rem]" />
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[5px] border-r-[5px] border-blue-600 rounded-br-[2rem]" />
                  {/* Decorative faint rings */}
                  <div className="absolute inset-4 rounded-full border border-blue-50 opacity-50 shadow-[0_0_40px_rgba(59,130,246,0.1)]" />
                  <div className="absolute inset-8 rounded-full border border-blue-50 opacity-50" />
                  <QrCode className="w-16 h-16 text-[#0f2c59]" strokeWidth={1.5} />
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] transform -translate-y-1/2" />
                </div>
              ) : (
                <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-black mb-6 shadow-xl border-4 border-slate-100" style={{ minHeight: 300 }}>
                  <div id="qr-reader" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-8 border-black/20 pointer-events-none rounded-[1.5rem]" />
                  {/* Target Box inside camera */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-56 h-56 border-2 border-white/40 rounded-[1.5rem] relative">
                      <div className="absolute -top-0.5 -left-0.5 w-10 h-10 border-t-[4px] border-l-[4px] border-blue-500 rounded-tl-[1.5rem]" />
                      <div className="absolute -top-0.5 -right-0.5 w-10 h-10 border-t-[4px] border-r-[4px] border-blue-500 rounded-tr-[1.5rem]" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-10 h-10 border-b-[4px] border-l-[4px] border-blue-500 rounded-bl-[1.5rem]" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-10 h-10 border-b-[4px] border-r-[4px] border-blue-500 rounded-br-[1.5rem]" />
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                    </div>
                  </div>
                </div>
              )}

              {!scanning && (
                <>
                  <h3 className="text-xl font-black text-[#0f2c59] mb-2">Siap untuk scan QR Code</h3>
                  <p className="text-slate-500 text-sm mb-8">Arahkan kamera ke QR Code pada aset</p>
                </>
              )}

              {/* Action Buttons */}
              <div className="w-full max-w-md">
                {scanning ? (
                  <button
                    onClick={stopScanner}
                    className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    <X className="w-5 h-5" /> Hentikan Kamera
                  </button>
                ) : (
                  <button
                    onClick={() => startScanner(facingMode)}
                    className="w-full h-12 bg-[#0d6efd] hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_6px_20px_rgba(13,110,253,0.3)] transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    <Camera className="w-5 h-5" /> Buka Kamera
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setFacingMode("environment")}
                    className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all ${facingMode === "environment" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  >
                    <Camera className="w-4 h-4" /> Kamera Belakang
                  </button>
                  <button
                    onClick={() => setFacingMode("user")}
                    className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all ${facingMode === "user" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  >
                    <User className="w-4 h-4" /> Kamera Depan
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400">atau</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Manual Input */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#0f2c59]">
                    <div className="w-4 h-4 bg-blue-100 rounded text-blue-600 flex items-center justify-center text-[10px]"><QrCode className="w-3 h-3"/></div>
                    Masukkan Kode Aset Manual
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                      placeholder="Contoh: AST-2026-0001"
                      className="w-full h-12 pl-4 pr-12 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                    <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  </div>
                  <button
                    onClick={handleManualLookup}
                    className="w-full h-12 bg-[#eef2ff] hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" /> Cari Aset
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-16 flex flex-col items-center justify-center max-w-4xl mx-auto">
              <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                 <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                 <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                 <QrCode className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-[#0f2c59] mb-2">Mencari Aset...</h3>
              <p className="text-slate-500 text-sm font-mono bg-slate-100 px-3 py-1 rounded-lg">{scanned}</p>
            </div>
          )}

          {/* Not Found */}
          {notFound && !loading && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 flex flex-col items-center justify-center max-w-4xl mx-auto text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="font-black text-[#0f2c59] text-2xl mb-2">Aset Tidak Ditemukan</h3>
              <p className="text-slate-500 mb-6 max-w-sm">Aset dengan QR Code <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-sm text-slate-800">{scanned}</code> belum terdaftar di sistem.</p>
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                <button onClick={reset} className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">Coba Lagi</button>
                <button onClick={() => navigate("/assets/tambah")} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all">Daftarkan Aset</button>
              </div>
            </div>
          )}

          {/* ── Asset Found (Tampilan Hasil Scan) ── */}
          {asset && !loading && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">Detail Aset Ditemukan</h3>
                {!showAction && (
                  <button onClick={reset} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm">
                    <RefreshCw className="w-4 h-4" /> Scan Aset Lain
                  </button>
                )}
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row">
                {asset.photo_path ? (
                  <div className="w-full md:w-1/3 h-64 md:h-auto bg-slate-100">
                    <img src={`/uploads/${asset.photo_path}`} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full md:w-1/3 h-64 md:h-auto bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100">
                    <Package className="w-16 h-16 text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm font-medium">Tidak ada foto</p>
                  </div>
                )}
                
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-extrabold font-mono tracking-wider mb-3">
                        {asset.asset_code}
                      </span>
                      <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1">{asset.name}</h2>
                      {asset.brand && <p className="text-sm font-semibold text-slate-500">{asset.brand} {asset.model}</p>}
                    </div>
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex-none ${conditionColor(asset.condition)}`}>
                      {asset.condition}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lokasi</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <MapPin className="w-4 h-4 text-blue-500" /> {asset.location}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Tag className="w-4 h-4 text-purple-500" /> {asset.category}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                      <p className="text-sm text-slate-700 font-bold">{asset.status}</p>
                    </div>
                    {asset.serial_number && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">S/N</p>
                        <p className="text-sm text-slate-700 font-bold font-mono truncate" title={asset.serial_number}>{asset.serial_number}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  {!showAction ? (
                    <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100">
                      {[
                        { type:"pindah", label:"Pindah", icon:<MapPin className="w-4 h-4"/>, color:"text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100" },
                        { type:"update_kondisi", label:"Kondisi", icon:<AlertTriangle className="w-4 h-4"/>, color:"text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100" },
                        { type:"stock_opname", label:"Audit", icon:<CheckCircle className="w-4 h-4"/>, color:"text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-100" },
                        { type:"detail", label:"Detail", icon:<Info className="w-4 h-4"/>, color:"text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200" },
                      ].map((a, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (a.type === "detail") navigate(`/assets/detail/${asset.id}`);
                            else { setActionType(a.type); setShowAction(true); }
                          }}
                          className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border transition-all ${a.color}`}
                        >
                          {a.icon}
                          <span className="text-[10px] font-bold">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-auto bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-slate-800">
                          {actionType === "pindah" ? "Catat Perpindahan Lokasi" : actionType === "update_kondisi" ? "Update Kondisi Aset" : "Audit / Stock Opname"}
                        </h4>
                        <button onClick={() => setShowAction(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                          <X className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {actionType === "pindah" && (
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Lokasi Baru</label>
                            <select value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none">
                              {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Kondisi</label>
                            <select value={newCondition} onChange={(e) => setNewCondition(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none">
                              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none">
                              {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><User className="w-3.5 h-3.5"/> PIC / Auditor</label>
                          {employees.length > 0 ? (
                            <select value={picId} onChange={e => setPicId(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none">
                              <option value="">— Pilih Auditor —</option>
                              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                          ) : (
                            <input type="text" placeholder="Nama PIC..." value={picId} onChange={e => setPicId(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none" />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Catatan Tambahan</label>
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Keterangan opsional..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none resize-none" />
                        </div>

                        <button onClick={handleSaveAction} disabled={saving} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                          {saving ? "Menyimpan..." : "Simpan Pembaruan"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tips Penggunaan */}
          {!asset && !loading && !notFound && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 max-w-6xl mx-auto">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <div className="text-blue-500">💡</div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0f2c59]">Tips Penggunaan</h3>
                  <p className="text-slate-500 text-sm">Ikuti langkah-langkah berikut untuk hasil scan terbaik.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Gunakan kamera belakang", desc: "Untuk hasil scan yang lebih jelas dan akurat.", icon: <Camera className="w-5 h-5 text-blue-500" /> },
                  { title: "Arahkan ke QR Code", desc: "Pastikan QR Code berada di dalam kotak pemindaian.", icon: <QrCode className="w-5 h-5 text-blue-500" /> },
                  { title: "Pastikan pencahayaan cukup", desc: "Scan di tempat yang terang dan tidak buram.", icon: <div className="text-blue-500 text-lg">☀️</div> },
                  { title: "Jarak ideal 15-30 cm", desc: "Jaga jarak kamera dengan QR Code.", icon: <div className="text-blue-500 font-black text-lg">||||</div> }
                ].map((tip, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex gap-4 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                    <div>
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                        {tip.icon}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{tip.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
