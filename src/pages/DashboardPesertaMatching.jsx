import { logoutUser } from "../utils/logoutUser";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { LogOut, UploadCloud, File, CheckCircle2, User, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";

const API_URL = "/api/lpk_matching.php";

const BIDANG_OPTIONS = [
  "Keperawatan (Kaigo / Caregiver)",
  "Pengolahan Makanan & Minuman",
  "Pertanian & Perkebunan",
  "Pelayanan Restoran / F&B",
  "Manufaktur & Mesin",
  "Konstruksi & Bangunan",
  "Akomodasi & Perhotelan",
  "Pembersihan Gedung",
  "Otomotif & Perbengkelan",
  "Lainnya"
];

export default function DashboardPesertaMatching() {
  const navigate = useNavigate();

  useSEO({
    title: "Portal Kandidat Matching Job Jepang",
    description: "Portal pendaftaran dan pemantauan progress matching job ke Jepang PT Creativa Bridging International."
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
  const [usia, setUsia] = useState("");
  const [lpkPengirim, setLpkPengirim] = useState("");
  const [bidang, setBidang] = useState(BIDANG_OPTIONS[0]);
  const [noWa, setNoWa] = useState("");
  const [email, setEmail] = useState("");

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [sswFile, setSswFile] = useState(null);
  const [jftFile, setJftFile] = useState(null);
  const [jlptFile, setJlptFile] = useState(null);

  const refFoto = useRef(null);
  const refCv = useRef(null);
  const refSsw = useRef(null);
  const refJft = useRef(null);
  const refJlpt = useRef(null);

  useEffect(() => {
    if (user && user.name) {
      setNamaLengkap(user.name);
    }
    if (user && user.email) {
      setEmail(user.email);
    }
    if (user && user.phone) {
      setNoWa(user.phone);
    }
  }, [user]);

  const handleFotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaLengkap || !noWa || !email) {
      alert("Mohon lengkapi field wajib.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama_lengkap", namaLengkap);
    if (usia) formData.append("usia", usia);
    if (lpkPengirim) formData.append("lpk_pengirim", lpkPengirim);
    if (bidang) formData.append("bidang", bidang);
    formData.append("no_wa", noWa);
    formData.append("email", email);
    formData.append("progress", "Pendaftaran");
    
    if (fotoFile) formData.append("foto", fotoFile);
    if (cvFile) formData.append("file_cv", cvFile);
    if (sswFile) formData.append("file_ssw", sswFile);
    if (jftFile) formData.append("file_jft", jftFile);
    if (jlptFile) formData.append("file_jlpt", jlptFile);

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
          accept="image/*,.pdf,.doc,.docx"
        />
        {file ? (
          <div className="flex flex-col items-center text-center">
            <File className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center opacity-70 group-hover:opacity-100">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 leading-tight">{label}</p>
            <p className="text-[10px] text-slate-400 mt-1">PDF / JPG</p>
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
            <h2 className="text-[22px] font-black text-slate-800 mb-2">Pendaftaran Matching Berhasil!</h2>
            <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
              Data Anda telah diterima dan akan segera kami proses untuk matching job perusahaan di Jepang.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full h-12 bg-slate-900 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition cursor-pointer"
            >
              Keluar Sistem
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-[#0c2e59] to-[#1e4e8c] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
         <div>
            <h1 className="text-[16px] font-black tracking-wide">PORTAL MATCHING JOB</h1>
            <p className="text-[11px] font-medium text-blue-200">LPK Creativa Bridging International</p>
         </div>
         <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[12px] font-bold transition cursor-pointer"
         >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
         </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 py-8">
         <div className="mb-8 text-center sm:text-left">
           <h2 className="text-[24px] font-black text-slate-800">Formulir Pendaftaran Matching Job</h2>
           <p className="text-xs text-slate-500 mt-1">Lengkapi data diri dan lampiran dokumen untuk seleksi kerja ke Jepang</p>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* FOTO PAS PORTOFOLIO */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
              <div 
                onClick={() => refFoto.current.click()}
                className="w-28 h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer relative group transition shrink-0"
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Pas Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="p-3 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-bold text-slate-600 block">Pas Foto</span>
                    <span className="text-[9px] text-slate-400">JPG, PNG</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={refFoto} 
                  accept="image/*" 
                  onChange={handleFotoUpload} 
                  className="hidden" 
                />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Pas Foto Kandidat (Opsional / Disarankan)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah pas foto formal berpakaian rapi dengan latar belakang polos. Foto ini akan otomatis tampil di tabel database seleksi job matching.
                </p>
              </div>
            </div>

            {/* BIODATA */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 uppercase mb-4 border-b border-slate-100 pb-3">Biodata Kandidat (Wajib)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Nama Lengkap *</span>
                  <input required value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-[#0c2e59]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Usia (Tahun) *</span>
                  <input required type="number" min="18" max="50" value={usia} onChange={(e) => setUsia(e.target.value)}
                    placeholder="Contoh: 23"
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-[#0c2e59]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">LPK Pengirim / Asal Lembaga</span>
                  <input value={lpkPengirim} onChange={(e) => setLpkPengirim(e.target.value)}
                    placeholder="Contoh: LPK Creativa Yogyakarta"
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-[#0c2e59]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Bidang Pekerjaan (SSW)</span>
                  <select value={bidang} onChange={(e) => setBidang(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-[#0c2e59]">
                    {BIDANG_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Nomor WhatsApp *</span>
                  <input required value={noWa} onChange={(e) => setNoWa(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-[#0c2e59]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-600">Email *</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: nama@gmail.com"
                    className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold outline-none focus:bg-white focus:border-[#0c2e59]" />
                </label>
              </div>
            </div>

            {/* DOKUMEN */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 uppercase mb-4 border-b border-slate-100 pb-3">Dokumen Lampiran (CV & Sertifikat)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {renderFileUploadArea("Upload CV", cvFile, setCvFile, refCv)}
                {renderFileUploadArea("Sertifikat SSW", sswFile, setSswFile, refSsw)}
                {renderFileUploadArea("Sertifikat JFT", jftFile, setJftFile, refJft)}
                {renderFileUploadArea("Sertifikat JLPT", jlptFile, setJlptFile, refJlpt)}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-[#0c2e59] hover:bg-[#143e74] text-white rounded-2xl text-[16px] font-black transition disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer">
              {isSubmitting ? "Memproses..." : "Kirim Formulir Matching Job"}
            </button>
         </form>
      </div>
    </div>
  );
}
