import { logoutUser } from "../utils/logoutUser";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { 
  User, Briefcase, MapPin, Users, FileText, Shield, 
  CheckCircle2, Camera, Calendar, UserCheck, Edit3, Loader2, Save, Cloud
} from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { PHOTO_BASE_URL } from "../services/api";

const PROFILE_API = "/api/profile.php";

function InputField({ label, name, type="text", value, onChange, disabled=false }) {
  return (
    <div>
      <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">
        {label} <span className="text-rose-500">*</span>
      </label>
      <input 
        name={name} 
        type={type} 
        value={value || ""} 
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-blue-500 transition-colors ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}`} 
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, disabled=false }) {
  return (
    <div>
      <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">
        {label} <span className="text-rose-500">*</span>
      </label>
      <select 
        name={name} 
        value={value || ""} 
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-blue-500 transition-colors appearance-none ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}`} 
      >
        <option value="">Select option</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("personal");
  const [profile, setProfile] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [imgError, setImgError] = useState(false);
  
  // Read-only logic can be added, but for now we let it be editable
  
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setSessionUser(JSON.parse(userStr));
    loadProfile();
  }, []);

  // Sesi di browser menunjuk ke akun yang sudah tidak ada di DB → paksa login ulang
  const handleInvalidSession = async (message) => {
    await Swal.fire({
      icon: 'warning',
      title: 'Sesi Berakhir',
      text: message || 'Sesi login Anda sudah tidak valid. Silakan login ulang.',
      confirmButtonText: 'Login Ulang',
      allowOutsideClick: false,
    });
    await logoutUser();
    window.location.href = "/login";
  };

  const isSessionInvalid = (err) => err?.response?.data?.code === 'SESSION_INVALID';

  const loadProfile = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      const res = await axios.get(PROFILE_API, { params: { user_id: user.id } });
      if (res.data?.status === 'success') {
        const data = res.data.data;
        setProfile(prev => ({
          ...prev,
          ...data,
          name: data.name || user?.name || "",
          nik: data.nik || "",
        }));

        // Ensure localStorage catches the latest photo/name on load
        try {
          let updated = false;
          if (data.name && user.name !== data.name) {
            user.name = data.name;
            user.full_name = data.name;
            updated = true;
          }
          if (data.position && user.position !== data.position) {
            user.position = data.position;
            updated = true;
          }
          if (data.photo_url && user.photo !== data.photo_url) {
            user.photo = data.photo_url;
            updated = true;
          }
          if (updated) localStorage.setItem("user", JSON.stringify(user));
        } catch { /* Best-effort cleanup or optional browser data. */ }
      }
    } catch (err) {
      console.error(err);
      if (isSessionInvalid(err)) handleInvalidSession(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImgError(false);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr);
      
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("name", profile.name || "");
      formData.append("nik", profile.nik || "");
      formData.append("birth_place", profile.birth_place || "");
      formData.append("birth_date", profile.birth_date || "");
      formData.append("gender", profile.gender || "");
      formData.append("religion", profile.religion || "");
      formData.append("marital_status", profile.marital_status || "");
      formData.append("blood_type", profile.blood_type || "");
      formData.append("phone", profile.phone || "");
      formData.append("address", profile.address || "");
      formData.append("city", profile.city || "");
      formData.append("emergency_name", profile.emergency_name || "");
      formData.append("emergency_relation", profile.emergency_relation || "");
      formData.append("emergency_phone", profile.emergency_phone || "");
      formData.append("npwp", profile.npwp || "");
      formData.append("bpjs_tk", profile.bpjs_tk || "");
      formData.append("bpjs_kes", profile.bpjs_kes || "");
      formData.append("bank_name", profile.bank_name || "");
      formData.append("bank_account", profile.bank_account || "");
      formData.append("position", profile.position || "");
      formData.append("work_type", profile.work_type || "");
      formData.append("email", profile.email || "");
      formData.append("department", profile.department || "");
      formData.append("join_date", profile.join_date || (profile.created_at ? profile.created_at.substring(0, 10) : ""));
      
      if (imageFile) {
        formData.append("photo", imageFile);
      }

      const res = await axios.post(PROFILE_API, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.status === 'success') {
        setShowSuccess(true);
        
        // Update global local storage for Layout.jsx to catch the new name/photo
        user.name = res.data.name || profile.name || user.name || user.full_name || "Admin";
        user.full_name = user.name;
        if (res.data.position || profile.position) {
          user.position = res.data.position || profile.position;
        }
        
        if (res.data.photo_url) {
          user.photo = res.data.photo_url;
        }
        localStorage.setItem("user", JSON.stringify(user));
        
        Swal.fire({
          icon: 'success',
          title: 'Data Berhasil Disimpan',
          text: 'Data profil Anda berhasil diupdate.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          setShowSuccess(false);
          window.location.reload(); // Force refresh to update top right header
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan Data',
          text: res.data.message || 'Terjadi kesalahan saat menyimpan data.'
        });
      }
    } catch (err) {
      console.error(err);
      if (isSessionInvalid(err)) {
        handleInvalidSession(err.response.data.message);
        return;
      }
      const serverMsg = err?.response?.data?.message;
      Swal.fire({
        icon: 'error',
        title: serverMsg ? 'Gagal Menyimpan Data' : 'Error Jaringan',
        text: serverMsg || 'Tidak dapat terhubung ke server.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", desc: "Identity information", icon: User },
    { id: "employment", label: "Employment Info", desc: "Job details", icon: Briefcase },
    { id: "contact", label: "Contact & Address", desc: "Email, phone, address", icon: MapPin },
    { id: "family", label: "Family Info", desc: "Family members", icon: Users },
    { id: "documents", label: "Documents", desc: "ID Card, Tax, etc", icon: FileText },
  ];

  if (isLoading) {
    return <Layout><div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div></Layout>;
  }

  const calculateCompletion = () => {
    const fields = [
      'name', 'nik', 'birth_place', 'birth_date', 'gender', 'religion', 'marital_status', 'blood_type', 'photo_url',
      'phone', 'address', 'city', 'emergency_name', 'emergency_relation', 'emergency_phone', 'npwp', 'bpjs_tk', 'bpjs_kes', 'bank_name', 'bank_account'
    ];
    let filled = 0;
    fields.forEach(f => {
      if (profile[f] || (f === 'photo_url' && selectedImage)) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  };
  const completionRate = calculateCompletion();

  const getProfileImage = () => {
    if (selectedImage) return selectedImage;
    if (profile.photo_url) return `${PHOTO_BASE_URL}${profile.photo_url}`;
    return null;
  };

  const profileImg = getProfileImage();

  return (
    <Layout>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        
        {/* Toast Notification */}
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 transition-all duration-300 ${showSuccess ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <p className="text-[14px] font-bold">Data successfully saved!</p>
        </div>

        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/30 border border-blue-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-sm">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                {profileImg && !imgError ? (
                  <img src={profileImg} alt="Profile" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition shadow-sm border-2 border-white">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800">{profile.name || sessionUser?.name || "Employee Name"}</h1>
                <span className="inline-flex px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-extrabold rounded-full w-fit mx-auto sm:mx-0">
                  {profile.work_type || "Permanent"}
                </span>
              </div>
              
              <div className="text-[14px] font-semibold text-slate-500 mb-4 flex items-center justify-center sm:justify-start gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" /> {profile.position || "Staff"}
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {profile.nik || "N/A"}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {profile.created_at ? new Date(profile.created_at).getFullYear() : "2024"}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active Status
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-64 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shrink-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[13px] font-bold text-slate-700">Profile Completion</span>
                <span className="text-[15px] font-black text-blue-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Complete your data for a better experience.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm h-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left mb-1 last:mb-0 ${
                    activeTab === tab.id 
                    ? 'bg-blue-50/50 border border-blue-100 shadow-sm' 
                    : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    <tab.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-[13px] font-bold ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-700'}`}>
                      {tab.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {activeTab === "personal" && (
                <form onSubmit={handleSave}>
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" /> Personal Info
                      </h2>
                      <p className="text-[13px] text-slate-500 mt-1">Your basic identity information</p>
                    </div>
                    <button type="button" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-[13px] px-4 py-2 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                      <Edit3 className="w-4 h-4" /> Edit Data
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Full Name" name="name" value={profile.name || sessionUser?.name || ""} onChange={handleChange} />
                      <InputField label="ID Number (NIK)" name="nik" value={profile.nik} onChange={handleChange} />
                      <InputField label="Place of Birth" name="birth_place" value={profile.birth_place} onChange={handleChange} />
                      <InputField label="Date of Birth" name="birth_date" type="date" value={profile.birth_date} onChange={handleChange} />
                      
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-slate-700 block">
                          Gender <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-4 items-center h-[42px]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="gender" value="Laki-laki" checked={profile.gender === 'Laki-laki'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                            <span className="text-[14px] font-semibold text-slate-700">Male</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="gender" value="Perempuan" checked={profile.gender === 'Perempuan'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                            <span className="text-[14px] font-semibold text-slate-700">Female</span>
                          </label>
                        </div>
                      </div>

                      <SelectField 
                        label="Religion" name="religion" value={profile.religion} onChange={handleChange}
                        options={[
                          {value: "Islam", label: "Islam"},
                          {value: "Kristen", label: "Christianity"},
                          {value: "Katolik", label: "Catholicism"},
                          {value: "Hindu", label: "Hinduism"},
                          {value: "Buddha", label: "Buddhism"}
                        ]}
                      />
                      
                      <SelectField 
                        label="Marital Status" name="marital_status" value={profile.marital_status} onChange={handleChange}
                        options={[
                          {value: "Single", label: "Single"},
                          {value: "Married", label: "Married"},
                          {value: "Divorced", label: "Divorced"}
                        ]}
                      />
                      
                      <SelectField 
                        label="Blood Type" name="blood_type" value={profile.blood_type} onChange={handleChange}
                        options={[
                          {value: "A", label: "A"},
                          {value: "B", label: "B"},
                          {value: "AB", label: "AB"},
                          {value: "O", label: "O"}
                        ]}
                      />
                    </div>

                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
              
              {activeTab === "employment" && (
                <form onSubmit={handleSave} className="flex flex-col h-full">
                  <div className="p-6 flex-1">
                    <div className="mb-6">
                      <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" /> Employment Info
                      </h2>
                      <p className="text-[13px] text-slate-500 mt-1">Employment data details</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Employee ID" name="nik" value={profile.nik} onChange={handleChange} />
                      <InputField label="Position" name="position" value={profile.position} onChange={handleChange} />
                      <InputField label="Department" name="department" value={profile.department || ""} onChange={handleChange} />
                      <InputField label="Work Type" name="work_type" value={profile.work_type} onChange={handleChange} />
                      <InputField label="Join Date" type="date" name="join_date" value={profile.join_date || (profile.created_at ? profile.created_at.substring(0, 10) : "")} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "contact" && (
                <form onSubmit={handleSave} className="flex flex-col h-full">
                  <div className="p-6 flex-1">
                    <div className="mb-6">
                      <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" /> Contact & Address
                      </h2>
                      <p className="text-[13px] text-slate-500 mt-1">How we can reach you</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Email Address" name="email" value={profile.email || ""} onChange={handleChange} />
                      <InputField label="Phone Number" name="phone" value={profile.phone} onChange={handleChange} />
                      <InputField label="City of Domicile" name="city" value={profile.city} onChange={handleChange} />
                      <div className="md:col-span-2">
                        <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">
                          Current Address <span className="text-rose-500">*</span>
                        </label>
                        <textarea 
                          name="address" 
                          value={profile.address || ""} 
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-blue-500 transition-colors bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "family" && (
                <form onSubmit={handleSave} className="flex flex-col h-full">
                  <div className="p-6 flex-1">
                    <div className="mb-6">
                      <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" /> Emergency Contact
                      </h2>
                      <p className="text-[13px] text-slate-500 mt-1">Person to contact in case of emergency</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Contact Name" name="emergency_name" value={profile.emergency_name} onChange={handleChange} />
                      <SelectField 
                        label="Relation" name="emergency_relation" value={profile.emergency_relation} onChange={handleChange}
                        options={[
                          {value: "Ayah", label: "Father"},
                          {value: "Ibu", label: "Mother"},
                          {value: "Suami/Istri", label: "Spouse"},
                          {value: "Saudara", label: "Sibling"},
                          {value: "Lainnya", label: "Other"}
                        ]}
                      />
                      <InputField label="Contact Phone" name="emergency_phone" value={profile.emergency_phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "documents" && (
                <form onSubmit={handleSave} className="flex flex-col h-full">
                  <div className="p-6 flex-1">
                    <div className="mb-6">
                      <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" /> Documents & Bank
                      </h2>
                      <p className="text-[13px] text-slate-500 mt-1">Tax, Insurance, and Payroll Account</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <InputField label="NPWP Number" name="npwp" value={profile.npwp} onChange={handleChange} />
                      </div>
                      <InputField label="BPJS Ketenagakerjaan" name="bpjs_tk" value={profile.bpjs_tk} onChange={handleChange} />
                      <InputField label="BPJS Kesehatan" name="bpjs_kes" value={profile.bpjs_kes} onChange={handleChange} />
                      
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 border-t border-slate-100 pt-6">
                        <SelectField 
                          label="Bank Name" name="bank_name" value={profile.bank_name} onChange={handleChange}
                          options={[
                            {value: "BCA", label: "BCA"},
                            {value: "Mandiri", label: "Mandiri"},
                            {value: "BNI", label: "BNI"},
                            {value: "BRI", label: "BRI"},
                            {value: "BSI", label: "BSI"}
                          ]}
                        />
                        <InputField label="Account Number" name="bank_account" value={profile.bank_account} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
