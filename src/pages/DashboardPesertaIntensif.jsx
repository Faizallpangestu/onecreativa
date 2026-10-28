import { logoutUser } from "../utils/logoutUser";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { LogOut, UploadCloud, File, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";

const API_URL = "/api/lpk_intensif.php";

export default function DashboardPesertaIntensif() {
  const navigate = useNavigate();

  useSEO({
    title: "Portal Siswa Intensif LPK",
    description: "Portal belajar dan kelengkapan berkas siswa intensif LPK PT Creativa Bridging International."
  });

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
  const [batch, setBatch] = useState("");

  const [fotoKtp, setFotoKtp] = useState(null);
  const [sertifikatPendukung, setSertifikatPendukung] = useState(null);
  const [dokumenPendukung, setDokumenPendukung] = useState(null);
  const [fotoProfil, setFotoProfil] = useState(null);

  const refKtp = useRef(null);
  const refSertif = useRef(null);
  const refDok = useRef(null);
  const refFoto = useRef(null);

  useEffect(() => {
    if (user && user.name) {
       setNamaLengkap(user.name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaLengkap || !noWa || !email || !batch) {
      alert("Mohon lengkapi field wajib.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama_lengkap", namaLengkap);
    formData.append("no_wa", noWa);
    formData.append("email", email);
    formData.append("batch", batch);
    
    if (fotoKtp) formData.append("foto_ktp", fotoKtp);
    if (sertifikatPendukung) formData.append("sertifikat_pendukung", sertifikatPendukung);
    if (dokumenPendukung) formData.append("dokumen_pendukung", dokumenPendukung);
    if (fotoProfil) formData.append("foto_profil", fotoProfil);

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

  const renderFileUploadArea = (label, file, setFile, ref, accept = "image/*,.pdf", isRequired = false) => {
    return (
      <div className={`border-2 border-dashed ${isRequired && !file ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} rounded-2xl p-4 flex flex-col items-center justify-center relative hover:bg-slate-100 transition cursor-pointer group`}
           onClick={() => ref.current.click()}>
        <input 
          type="file" 
          ref={ref} 
          className="hidden" 
          onChange={(e) => setFile(e.target.files[0])} 
          accept={accept}
        />
        {file ? (
          <div className="flex flex-col items-center text-center">
            <File className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center opacity-70 group-hover:opacity-100">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 leading-tight">{label} {isRequired && <span className="text-red-500">*</span>}</p>
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
            <h2 className="text-[22px] font-black text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
              Biodata dan dokumen Anda sebagai peserta Intensif telah berhasil dikirimkan.
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
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
         <div>
            <h1 className="text-[16px] font-black tracking-wide">PORTAL SISWA INTENSIF</h1>
            <p className="text-[11px] font-medium text-blue-200">LPK Creativa Bridging International</p>
         </div>
         <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-blue-700/50 hover:bg-blue-700 px-4 py-2 rounded-xl text-[12px] font-bold transition"
         >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
         </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 py-8">
         <div className="mb-8 text-center sm:text-left">
           <h2 className="text-[24px] font-black text-slate-800">Formulir Peserta Intensif</h2>
           <p className="text-[14px] text-slate-500 mt-2 max-w-2xl">
             Silakan lengkapi formulir di bawah ini dengan sebenar-benarnya.
           </p>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 uppercase mb-4 border-b border-slate-100 pb-3">Biodata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Nama Lengkap *</span>
                  <input required value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-blue-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Nomor WhatsApp *</span>
                  <input required value={noWa} onChange={(e) => setNoWa(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-blue-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Email *</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-blue-400" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Batch *</span>
                  <input required placeholder="Misal: Batch 1" value={batch} onChange={(e) => setBatch(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-blue-400" />
                </label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 uppercase mb-4 border-b border-slate-100 pb-3">Dokumen Lampiran</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {renderFileUploadArea("Foto KTP", fotoKtp, setFotoKtp, refKtp)}
                {renderFileUploadArea("Foto Profil (Diri)", fotoProfil, setFotoProfil, refFoto, "image/*")}
                {renderFileUploadArea("Sertifikat", sertifikatPendukung, setSertifikatPendukung, refSertif)}
                {renderFileUploadArea("Dokumen Lain", dokumenPendukung, setDokumenPendukung, refDok)}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-blue-600 text-white rounded-2xl text-[16px] font-black hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center gap-2">
              {isSubmitting ? "Memproses..." : "Kirim Formulir"}
            </button>
         </form>
      </div>
    </div>
  );
}
