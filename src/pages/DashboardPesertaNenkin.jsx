import { logoutUser } from "../utils/logoutUser";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { LogOut, UploadCloud, File, X, CheckCircle2, FileText, Activity, Building, ChevronLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/karyawan_3d_bg.webp";

const API_URL = "/api/lpk_nenkin.php";
const UPLOAD_DIR = "/uploads/nenkin/";

export default function DashboardPesertaNenkin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myNenkinData, setMyNenkinData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Views: 'dashboard', 'form', 'bank', 'tracking', 'dokumen'
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      fetchMyData(u.email);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchMyData = async (email) => {
    try {
      const res = await axios.get(`${API_URL}?email=${email}`);
      if (res.data.status === "success" && res.data.data.length > 0) {
        setMyNenkinData(res.data.data[0]);
        // Pre-fill form
        const d = res.data.data[0];
        setKisoNenkinBango(d.kiso_nenkin_bango || "");
        setNamaLengkap(d.nama_lengkap || "");
        setEmail(d.email || "");
        setNoWa(d.no_wa || "");
        setTanggalLahir(d.tanggal_lahir || "");
        setAlamatIndonesia(d.alamat_indonesia || "");
        setNamaRekening(d.nama_rekening || "");
        setNamaBank(d.nama_bank || "");
        setTanggalPulang(d.tanggal_pulang || "");
        setNamaPerusahaan(d.nama_perusahaan || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "P";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  // --- FORM STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [kisoNenkinBango, setKisoNenkinBango] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [noWa, setNoWa] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamatIndonesia, setAlamatIndonesia] = useState("");
  const [namaRekening, setNamaRekening] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [tanggalPulang, setTanggalPulang] = useState("");
  const [namaPerusahaan, setNamaPerusahaan] = useState("");

  const [fotoProfil, setFotoProfil] = useState(null);
  const [fileNenkinTecho, setFileNenkinTecho] = useState(null);
  const [fileFormulir, setFileFormulir] = useState(null);
  const [filePaspor, setFilePaspor] = useState(null);
  const [fileRekening, setFileRekening] = useState(null);
  const [fileZairyu, setFileZairyu] = useState(null);

  const refFoto = useRef(null);
  const refTecho = useRef(null);
  const refFormulir = useRef(null);
  const refPaspor = useRef(null);
  const refRekening = useRef(null);
  const refZairyu = useRef(null);

  useEffect(() => {
    if (user && user.email && !email) {
       setEmail(user.email);
    }
    if (user && user.name && !namaLengkap) {
       setNamaLengkap(user.name);
    }
  }, [user, email, namaLengkap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("kiso_nenkin_bango", kisoNenkinBango);
      formData.append("nama_lengkap", namaLengkap);
      formData.append("email", email);
      formData.append("no_wa", noWa);
      formData.append("tanggal_lahir", tanggalLahir);
      formData.append("alamat_indonesia", alamatIndonesia);
      formData.append("nama_rekening", namaRekening);
      formData.append("nama_bank", namaBank);
      formData.append("tanggal_pulang", tanggalPulang);
      formData.append("nama_perusahaan", namaPerusahaan);

      const compressImage = async (file) => {
        if (!file || !file.type.startsWith('image/')) return file;
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (blob) {
                   resolve(new File([blob], file.name, {
                     type: 'image/jpeg',
                     lastModified: Date.now()
                   }));
                } else {
                   resolve(file);
                }
              }, 'image/jpeg', 0.6);
            };
          };
        });
      };

      if (fotoProfil) formData.append("foto_profil", await compressImage(fotoProfil));
      if (fileNenkinTecho) formData.append("file_nenkin_techo", await compressImage(fileNenkinTecho));
      if (fileFormulir) formData.append("file_formulir", await compressImage(fileFormulir));
      if (filePaspor) formData.append("file_paspor", await compressImage(filePaspor));
      if (fileRekening) formData.append("file_rekening", await compressImage(fileRekening));
      if (fileZairyu) formData.append("file_zairyu", await compressImage(fileZairyu));

      await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      await fetchMyData(user.email); // Refresh data
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setActiveView('dashboard');
      }, 3000);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menyimpan formulir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const renderFileUploadArea = (label, file, setFile, ref, accept = ".pdf,image/*", isRequired = false) => {
    return (
      <div className={`border-2 border-dashed ${isRequired && !file ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} rounded-2xl p-4 flex flex-col items-center justify-center relative hover:bg-slate-100 transition cursor-pointer group`}
           onClick={() => ref.current.click()}>
        <input type="file" ref={ref} className="hidden" onChange={(e) => setFile(e.target.files[0])} accept={accept} />
        {file ? (
          <div className="flex flex-col items-center text-center">
            <File className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-[12px] font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
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

  const modules = [
    { title: "Biodata Diri Nenkin", desc: "Isi form & dokumen", icon: FileText, color: "bg-blue-100 text-blue-600", view: "form" },
    { title: "Bank Nenkin", desc: "Info rekening", icon: CreditCard, color: "bg-emerald-100 text-emerald-600", view: "bank" },
    { title: "Tracking Proses", desc: "Status pengajuan", icon: Activity, color: "bg-orange-100 text-orange-600", view: "tracking" },
    { title: "Dokumen Hasil", desc: "Unduh hasil nenkin", icon: File, color: "bg-purple-100 text-purple-600", view: "dokumen" },
    { title: "Keluar", desc: "Akhiri sesi", icon: LogOut, color: "bg-rose-100 text-rose-600", view: "logout" },
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true} hideSidebar={true}>
      <div className="min-h-full bg-slate-50 relative overflow-hidden flex flex-col">
        
        {/* Background Decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-40 z-0 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-[120px] z-0 pointer-events-none"></div>

        {/* Header Background */}
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#2563eb] rounded-b-[2.5rem] shadow-[0_10px_40px_rgba(37,99,235,0.3)] overflow-hidden z-0 pointer-events-none">
          <div className="absolute inset-0 w-full h-full opacity-30 mix-blend-luminosity">
            <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-500"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#2563eb] via-[#2563eb]/60 to-transparent z-10"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-white/20 rounded-full blur-[80px] z-10"></div>
        </div>

        <div className="relative z-10 px-5 sm:px-10 pt-10 flex-1 flex flex-col w-full max-w-5xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center mb-6 mt-2 relative">
            {activeView !== 'dashboard' && !isSuccess && (
              <button onClick={() => setActiveView('dashboard')} className="absolute left-0 w-10 h-10 flex items-center justify-center bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur z-20 transition active:scale-95">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-[18px] font-black text-white tracking-wide w-full text-center drop-shadow-sm">
              {activeView === 'dashboard' ? 'Portal Nenkin' : 
               activeView === 'form' ? 'Biodata & Dokumen' :
               activeView === 'bank' ? 'Data Bank Nenkin' :
               activeView === 'tracking' ? 'Tracking Proses' : 'Dokumen Hasil'}
            </h1>
          </div>

          {/* Profile Section */}
          {activeView === 'dashboard' && (
            <div className="relative z-10 flex items-center gap-5 mb-8">
              <div className="relative shrink-0">
                <div className="relative w-[72px] h-[72px]">
                  <div className="absolute inset-0 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black text-white border-2 border-white/40 shadow-xl backdrop-blur-md overflow-hidden">
                    {myNenkinData?.foto_profil ? (
                      <img src={`${UPLOAD_DIR}${myNenkinData.foto_profil}`} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0 text-white">
                 <p className="text-white/90 text-[13px] font-semibold mb-0.5">Selamat datang,</p>
                 <h2 className="text-[22px] font-black truncate leading-tight drop-shadow-sm">
                   {user?.name || ""}
                 </h2>
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full mt-2.5 backdrop-blur-sm border border-white/10 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/95">
                      Peserta Nenkin • {user?.email}
                    </span>
                 </div>
              </div>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            <div className="mt-10 pb-10 max-w-4xl mx-auto w-full">
              <h3 className="text-[16px] font-black text-slate-800 mb-5 px-1 drop-shadow-sm">Pintasan Menu</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                {modules.map((mod, i) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (mod.view === 'logout') handleLogout();
                        else setActiveView(mod.view);
                      }}
                      className="group bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-transparent hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-active:scale-95 ${mod.color}`}>
                        <Icon className="w-6 h-6" strokeWidth={2.5} />
                      </div>
                      <h4 className="text-[14px] font-black text-slate-800 leading-tight mb-1">{mod.title}</h4>
                      <p className="text-[11px] font-semibold text-slate-500 line-clamp-2 leading-relaxed">{mod.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {isSuccess && (
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full mx-auto text-center border border-slate-100 mt-10">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-10 h-10 text-green-500" />
               </div>
               <h2 className="text-[22px] font-black text-slate-800 mb-2">Berhasil Tersimpan!</h2>
               <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">Data klaim Nenkin Anda telah diperbarui.</p>
            </div>
          )}

          {/* BIODATA FORM VIEW */}
          {activeView === 'form' && !isSuccess && (
            <div className="pb-12 max-w-3xl mx-auto w-full mt-6">
              {myNenkinData && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-2xl text-[13px] font-semibold border border-blue-100 flex gap-3 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  Anda sudah mengisi data pengajuan Nenkin. Anda bisa memperbarui dokumen jika diperlukan.
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                 {/* Foto Profil */}
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-3">Foto Diri</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                      <div className="sm:col-span-1">
                        {renderFileUploadArea("Upload Foto Anda", fotoProfil, setFotoProfil, refFoto, "image/*", !myNenkinData)}
                      </div>
                      <div className="sm:col-span-2 text-[13px] text-slate-500 leading-relaxed">
                        <p className="font-bold text-slate-700 mb-1">Ketentuan Foto:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Wajah terlihat jelas dan terang.</li>
                          <li>Pakaian rapi dan sopan.</li>
                          <li>Format file: JPG/PNG.</li>
                        </ul>
                        {myNenkinData?.foto_profil && !fotoProfil && (
                          <p className="mt-3 text-emerald-600 font-bold bg-emerald-50 inline-block px-3 py-1 rounded-lg border border-emerald-100 text-[11px]">✓ Foto sudah terupload sebelumnya</p>
                        )}
                      </div>
                    </div>
                 </div>

                 {/* Basic Info */}
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-3">Data Pribadi</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <label className="block">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">No Pensiun Dasar (Kiso Nenkin Bango) *</span>
                       <input required value={kisoNenkinBango} onChange={(e) => setKisoNenkinBango(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                     <label className="block">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Nama Lengkap *</span>
                       <input required value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                     <label className="block">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Email *</span>
                       <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                     <label className="block">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Nomor WhatsApp *</span>
                       <input required value={noWa} onChange={(e) => setNoWa(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                     <label className="block">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Tanggal Lahir *</span>
                       <input required type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                     <label className="block sm:row-span-2">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Alamat Lengkap di Indonesia *</span>
                       <textarea required value={alamatIndonesia} onChange={(e) => setAlamatIndonesia(e.target.value)}
                         className="h-[128px] w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 resize-none" />
                     </label>
                     <label className="block">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Tgl Berhenti/Pulang *</span>
                       <input required type="date" value={tanggalPulang} onChange={(e) => setTanggalPulang(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                     <label className="block sm:col-span-2">
                       <span className="mb-2 block text-[12px] font-bold text-slate-600">Nama Perusahaan di Jepang *</span>
                       <input required value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)}
                         className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" />
                     </label>
                   </div>
                 </div>

                 {/* File Uploads */}
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-3">Upload Dokumen (PDF/Image)</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {renderFileUploadArea("Buku Pensiun (Techo)", fileNenkinTecho, setFileNenkinTecho, refTecho, ".pdf,image/*", !myNenkinData)}
                     {renderFileUploadArea("Formulir Klaim", fileFormulir, setFileFormulir, refFormulir, ".pdf,image/*", !myNenkinData)}
                     {renderFileUploadArea("Fotokopi Paspor", filePaspor, setFilePaspor, refPaspor, ".pdf,image/*", !myNenkinData)}
                     {renderFileUploadArea("Zairyu Card Berlubang", fileZairyu, setFileZairyu, refZairyu, ".pdf,image/*", !myNenkinData)}
                     {renderFileUploadArea("Bukti Rekening Bank", fileRekening, setFileRekening, refRekening, ".pdf,image/*", !myNenkinData)}
                   </div>
                 </div>

                 <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-blue-600 text-white rounded-2xl text-[15px] font-black shadow-lg hover:bg-blue-700 active:scale-95 transition disabled:opacity-70 flex items-center justify-center gap-2">
                   {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Simpan Data"}
                 </button>
              </form>
            </div>
          )}

          {/* BANK VIEW */}
          {activeView === 'bank' && (
            <div className="pb-12 max-w-2xl mx-auto w-full mt-6">
              {!myNenkinData ? (
                <div className="bg-white p-8 text-center rounded-3xl shadow-sm border border-slate-100">
                  <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-semibold">Anda belum melengkapi form biodata.</p>
                  <button onClick={() => setActiveView('form')} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition">Isi Formulir Sekarang</button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-50 pb-3">Informasi Rekening Bank Indonesia</h3>
                   <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Bank Penerima</p>
                        <p className="text-[16px] font-black text-slate-800">{myNenkinData.nama_bank}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 p-4 mt-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Nama Pemilik Rekening</p>
                        <p className="text-[16px] font-black text-slate-800">{myNenkinData.nama_rekening}</p>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* TRACKING VIEW */}
          {activeView === 'tracking' && (
            <div className="pb-12 max-w-2xl mx-auto w-full mt-6">
              {!myNenkinData ? (
                <div className="bg-white p-8 text-center rounded-3xl shadow-sm border border-slate-100">
                  <Activity className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-semibold">Anda belum melengkapi form biodata.</p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                   <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-8 border-b border-slate-50 pb-3">Status Pengajuan Anda</h3>
                   
                   <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 
                    ${myNenkinData.status_pengajuan === 'Selesai' ? 'bg-green-100 text-green-500' : 
                     myNenkinData.status_pengajuan === 'Sedang Diproses' ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'}`}>
                     <Activity className="w-10 h-10" />
                   </div>
                   
                   <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2">Status Saat Ini:</p>
                   <p className={`text-[24px] font-black ${myNenkinData.status_pengajuan === 'Selesai' ? 'text-green-600' : myNenkinData.status_pengajuan === 'Sedang Diproses' ? 'text-orange-600' : 'text-blue-600'}`}>
                     {myNenkinData.status_pengajuan || 'Menunggu Review'}
                   </p>
                   
                   <p className="text-[14px] text-slate-500 mt-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                     {myNenkinData.status_pengajuan === 'Selesai' 
                       ? 'Proses pengajuan Nenkin Anda telah selesai. Anda dapat memeriksa dan mengunduh dokumen hasil pada menu Dokumen Hasil.'
                       : myNenkinData.status_pengajuan === 'Sedang Diproses'
                       ? 'Dokumen Anda sedang dalam proses pengurusan oleh tim kami. Harap bersabar menunggu info selanjutnya.'
                       : 'Data Anda telah kami terima dan sedang dalam antrean untuk direview oleh tim administrasi.'}
                   </p>
                </div>
              )}
            </div>
          )}

          {/* DOKUMEN HASIL VIEW */}
          {activeView === 'dokumen' && (
            <div className="pb-12 max-w-2xl mx-auto w-full mt-6">
              {!myNenkinData ? (
                <div className="bg-white p-8 text-center rounded-3xl shadow-sm border border-slate-100">
                  <File className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-semibold">Anda belum melengkapi form biodata.</p>
                </div>
              ) : !myNenkinData.dokumen_hasil ? (
                <div className="bg-white p-10 text-center rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <File className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-[18px] font-black text-slate-800 mb-2">Belum Ada Dokumen</h3>
                  <p className="text-[14px] text-slate-500 max-w-md mx-auto leading-relaxed">
                    Dokumen hasil klaim Nenkin belum diunggah oleh Admin. Hal ini biasanya terjadi jika status pengajuan Anda belum selesai.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-50 pb-3">Dokumen Hasil Pencairan Nenkin</h3>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                     <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                       <FileText className="w-8 h-8" />
                     </div>
                     <div className="flex-1 text-center sm:text-left">
                       <p className="text-[16px] font-black text-slate-800 mb-1">Bukti Pencairan / Hasil Nenkin</p>
                       <p className="text-[13px] text-slate-500 font-medium">Diunggah oleh Admin LPK Creativa</p>
                     </div>
                     <a 
                       href={`${UPLOAD_DIR}${myNenkinData.dokumen_hasil}`}
                       target="_blank"
                       rel="noreferrer"
                       className="px-6 py-3 bg-purple-600 text-white text-[14px] font-black rounded-xl hover:bg-purple-700 active:scale-95 transition-all w-full sm:w-auto text-center shadow-lg shadow-purple-200"
                     >
                       Unduh File
                     </a>
                   </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
