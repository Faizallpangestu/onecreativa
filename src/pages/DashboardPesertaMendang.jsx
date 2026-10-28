import { logoutUser } from "../utils/logoutUser";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { LogOut, UploadCloud, File, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "/api/lpk_mendang.php";

export default function DashboardPesertaMendang() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [namaLengkap, setNamaLengkap] = useState("");
  const [noWa, setNoWa] = useState("");
  const [email, setEmail] = useState("");
  const [perusahaanJepang, setPerusahaanJepang] = useState("");

  const [fotoProfil, setFotoProfil] = useState(null);
  const [fileLaporan, setFileLaporan] = useState(null);

  const refFoto = useRef(null);
  const refLaporan = useRef(null);

  useEffect(() => {
    if (user && user.name) {
       setNamaLengkap(user.name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaLengkap || !noWa) {
      alert("Mohon lengkapi field wajib.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama_lengkap", namaLengkap);
    formData.append("no_wa", noWa);
    formData.append("email", email);
    formData.append("perusahaan_jepang", perusahaanJepang);
    
    if (fotoProfil) formData.append("foto_profil", fotoProfil);
    if (fileLaporan) formData.append("file_laporan", fileLaporan);

    try {
      await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIsSuccess(true);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengirim formulir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const renderFileUploadArea = (label, file, setFile, ref) => {
    return (
      <div className={`border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center relative hover:bg-slate-100 transition cursor-pointer group`}
           onClick={() => ref.current.click()}>
        <input 
          type="file" 
          ref={ref} 
          className="hidden" 
          onChange={(e) => setFile(e.target.files[0])} 
          accept="image/*,.pdf"
        />
        {file ? (
          <div className="flex flex-col items-center text-center">
            <File className="w-8 h-8 text-pink-500 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center opacity-70 group-hover:opacity-100">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 leading-tight">{label}</p>
          </div>
        )}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
         <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-[22px] font-black text-slate-800 mb-2">Laporan Berhasil!</h2>
            <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
              Laporan Mendang Anda berhasil disubmit ke sistem LPK.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full h-12 bg-slate-900 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition"
            >
              Keluar Sistem
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-pink-600 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
         <div>
            <h1 className="text-[16px] font-black tracking-wide">PORTAL PESERTA MENDANG</h1>
            <p className="text-[11px] font-medium text-pink-200">LPK Creativa Bridging International</p>
         </div>
         <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-pink-700/50 hover:bg-pink-700 px-4 py-2 rounded-xl text-[12px] font-bold transition"
         >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
         </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 py-8">
         <div className="mb-8 text-center sm:text-left">
           <h2 className="text-[24px] font-black text-slate-800">Laporan Mendang</h2>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 uppercase mb-4 border-b border-slate-100 pb-3">Informasi Peserta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Nama Lengkap *</span>
                  <input required value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-pink-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Nomor WhatsApp *</span>
                  <input required value={noWa} onChange={(e) => setNoWa(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-pink-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Email</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-pink-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Perusahaan Jepang</span>
                  <input value={perusahaanJepang} onChange={(e) => setPerusahaanJepang(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-pink-400" />
                </label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 uppercase mb-4 border-b border-slate-100 pb-3">Dokumen Laporan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFileUploadArea("Foto Profil Terbaru", fotoProfil, setFotoProfil, refFoto)}
                {renderFileUploadArea("File Laporan Progress (PDF)", fileLaporan, setFileLaporan, refLaporan)}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-pink-500 text-white rounded-2xl text-[16px] font-black hover:bg-pink-600 transition disabled:opacity-70 flex justify-center items-center gap-2">
              {isSubmitting ? "Memproses..." : "Kirim Laporan"}
            </button>
         </form>
      </div>
    </div>
  );
}
