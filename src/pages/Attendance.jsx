import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, FileDown, Edit2, Trash2, Calendar, LogIn, LogOut, FileText, Clock } from "lucide-react";

const ATTENDANCE_API_URL = "/api/attendance.php";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function normalizeAttendanceResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getInitials(name) {
  if (!name) return "HR";
  return name.split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("");
}

function getAvatarClass(name) {
  const palettes = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
  ];
  const i = (name ?? "").split("").reduce((s, c) => s + c.charCodeAt(0), 0) % palettes.length;
  return palettes[i];
}

function formatDateFull(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeOnly(timeValue) {
  if (!timeValue) return "--:--";
  const timePart = timeValue.includes(' ') ? timeValue.split(' ')[1] : timeValue;
  const [hours = "00", minutes = "00"] = timePart.split(":");
  return `${hours}:${minutes}`;
}

export default function Attendance() {
  const navigate = useNavigate();
  const user = getUser();
  const isSuperAdmin = user?.role_name === "super_admin";
  const canExport = user && ["super_admin", "manager", "hr"].includes(user.role_name);
  const isKaryawan = user?.role_name === "karyawan" || user?.role_name === "employee";

  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterDateStr, setFilterDateStr] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(19);
  const [activeView, setActiveView] = useState("summary"); // 'summary' or 'list'

  // Edit state
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState(null);

  const loadAttendance = async () => {
    try {
      // Jika karyawan, hanya tampilkan datanya sendiri
      const params = (user?.role_name === "karyawan" || user?.role_name === "employee") ? { employee_id: user?.employee_id || user?.id } : {};
      const res = await axios.get(ATTENDANCE_API_URL, { params });
      setAttendance(normalizeAttendanceResponse(res.data));
      setErrorMessage("");
    } catch {
      setAttendance([]);
      setErrorMessage("Data attendance gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAttendance(); }, []);

  // ── Edit handlers ──────────────────────────────────────────────────────
  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      check_in: item.check_in ?? "",
      check_out: item.check_out ?? "",
      status: item.status ?? "present",
      late_minutes: item.late_minutes ?? 0,
      overtime_minutes: item.overtime_minutes ?? 0,
    });
  };

  const handleEdit = async () => {
    setEditLoading(true);
    try {
      await axios.put(ATTENDANCE_API_URL, {
        id: editItem.id,
        role: user?.role_name,
        ...editForm,
        late_minutes: Number(editForm.late_minutes),
        overtime_minutes: Number(editForm.overtime_minutes),
      });
      setEditItem(null);
      loadAttendance();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal update data absensi.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await axios.delete(ATTENDANCE_API_URL, {
        data: { id: deleteId, role: user?.role_name },
      });
      setDeleteId(null);
      loadAttendance();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal hapus data absensi.");
    }
  };

  // Jika filter bulan kosong (Semua), tampilkan semua
  // Untuk karyawan yang ingin lihat "sebulan full", jika di kalender tidak ada hari-hari kosong,
  // kita akan mengisi (fill) hari-hari kosong di bulan tersebut dengan status "Libur" (jika minggu) atau "Alpa" (jika hari kerja lewat)
  // Tapi untuk simpelnya, kita cukup render data dari server, dan modifikasi render untuk memformat tanggal & mengecek hari minggu.
  let filteredAttendance = attendance;
  if (filterDateStr) {
    filteredAttendance = attendance.filter((item) => item.date === filterDateStr);
  } else if (filterMonth) {
    filteredAttendance = attendance.filter((item) => item.date.startsWith(filterMonth));
  }
  if (searchQuery) {
    filteredAttendance = filteredAttendance.filter((item) => 
      (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Helper untuk Karyawan Card
  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[d.getDay()];
  };
  const getDayNumber = (dateStr) => new Date(dateStr).getDate();
  const getMonthYear = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };
  const isSunday = (dateStr) => new Date(dateStr).getDay() === 0;

  const renderKaryawanCard = (item) => {
    const sunday = isSunday(item.date);
    // Tentukan status untuk sidebar warna
    let statusLabel = "Hadir";
    let statusColor = "bg-[#005a9c]"; // Biru tua
    let statusText = "text-[#005a9c]";
    
    if (sunday) {
      statusLabel = "Libur";
      statusColor = "bg-[#808080]"; // Abu-abu
      statusText = "text-[#808080]";
    } else if (item.status === "absent" || item.status === "alpa") {
      statusLabel = "Alpa";
      statusColor = "bg-rose-600";
    } else if (item.status === "leave" || item.status === "cuti") {
      statusLabel = "Cuti";
      statusColor = "bg-[#008f39]"; // Hijau tua
    } else if (item.status === "dinas") {
      statusLabel = "Dinas";
      statusColor = "bg-[#8b5cf6]"; // Purple
      statusText = "text-[#8b5cf6]";
    }

    return (
      <div key={item.id} className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex overflow-hidden relative">
        {/* Left Color Bar */}
        <div className={`${statusColor} w-8 flex flex-col items-center justify-center shrink-0`}>
          <span className="text-white text-[11px] font-bold -rotate-90 tracking-widest whitespace-nowrap">
            {statusLabel}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex">
          {/* Date Column */}
          <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-100 pr-3">
            <span className="text-[13px] font-bold text-slate-800">{getDayName(item.date)}</span>
            <span className="text-[26px] font-black text-slate-900 leading-none my-1">{getDayNumber(item.date)}</span>
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{getMonthYear(item.date)}</span>
          </div>

          {/* Time Columns */}
          <div className="flex-1 flex px-2 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 font-bold">-</div>
            
            {/* Masuk */}
            <div className="flex-1 flex flex-col justify-between items-start pl-2">
              <div className="flex flex-col items-start w-full">
                <span className="text-[12px] font-bold text-slate-400">Masuk</span>
                <span className="text-[18px] font-black text-slate-800 leading-tight">
                  {item.check_in ? formatTimeOnly(item.check_in) : "--:--"}
                </span>
                <span className="text-[10px] font-semibold text-blue-500">Jadwal 08:00</span>
              </div>
              <div className={`mt-2 px-4 py-1 rounded-full flex items-center gap-1 ${statusColor} text-white`}>
                <span className="text-[10px] font-bold">WFO</span>
              </div>
            </div>

            {/* Keluar */}
            <div className="flex-1 flex flex-col justify-between items-end pr-1">
              <div className="flex flex-col items-end w-full">
                <span className="text-[12px] font-bold text-slate-400">Keluar</span>
                <span className="text-[18px] font-black text-slate-800 leading-tight">
                  {item.check_out ? formatTimeOnly(item.check_out) : "--:--"}
                </span>
                <span className="text-[10px] font-semibold text-blue-500">17:00</span>
              </div>
              <div className={`mt-2 px-4 py-1 rounded-full flex items-center gap-1 ${statusColor} text-white`}>
                <span className="text-[10px] font-bold">WFO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleExportExcel = () => {
    const dataToExport = filteredAttendance.map((item) => ({
      Nama: item.name,
      Tanggal: formatDateFull(item.date),
      "Check In": formatTimeOnly(item.check_in),
      "Check Out": formatTimeOnly(item.check_out),
      Status: item.status,
      "Telat (Menit)": item.late_minutes ?? 0,
      "Lembur (Menit)": item.overtime_minutes ?? 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Laporan_Absensi_${filterMonth || "Semua"}.xlsx`);
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12">
        
        {/* ── Karyawan Custom Header ── */}
        {isKaryawan && activeView === 'summary' && (
          <div className="bg-white px-5 pt-8 pb-4 sticky top-0 z-20">
            <div className="flex flex-col mb-6">
              <span className="text-[14px] font-bold text-slate-800">
                Selamat {(() => {
                  const h = new Date().getHours();
                  if (h >= 4 && h < 11) return "Pagi";
                  if (h >= 11 && h < 15) return "Siang";
                  if (h >= 15 && h < 18) return "Sore";
                  return "Malam";
                })()} {user?.gender === 'Perempuan' ? 'bu' : 'pak'},
              </span>
              <span className="text-[15px] font-black text-[#005a9c] uppercase tracking-wide">{user?.name}</span>
            </div>

            {/* Floating Presensi Card (Seperti Screenshot 1) */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100 flex flex-col gap-4 mb-8">
              
              {/* Header: Presensi & Jam Aktif */}
              <div className="flex items-center justify-between border-b border-blue-100/50 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-700" />
                  <span className="text-[14px] font-bold text-slate-800">Presensi hari ini</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span className="text-[14px] font-bold text-slate-800">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Content: Masuk & Keluar */}
              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[13px] font-bold text-slate-500">Masuk</span>
                  <span className="text-[18px] font-black text-slate-800">--:--</span>
                  <span className="text-[11px] font-semibold text-blue-400 mt-1">Jadwal 08:00</span>
                </div>
                
                <div className="text-slate-400 font-bold">-</div>
                
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[13px] font-bold text-slate-500">Keluar</span>
                  <span className="text-[18px] font-black text-slate-800">--:--</span>
                  <span className="text-[11px] font-semibold text-blue-400 mt-1">17:00</span>
                </div>
              </div>

              {/* Tombol Hijau: Riwayat Presensi */}
              <button 
                onClick={() => setActiveView('list')}
                className="w-full mt-2 bg-[#008f39] hover:bg-green-700 active:scale-[0.98] transition-all py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
              >
                <Calendar className="w-5 h-5 text-white" />
                <span className="text-white text-[15px] font-bold">Riwayat Presensi</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Karyawan Header for List View ── */}
        {isKaryawan && activeView === 'list' && (
          <div className="bg-white px-5 pt-8 pb-4 shadow-sm border-b border-slate-100 sticky top-0 z-20">
            <div className="flex items-center justify-between mb-5">
              <button 
                onClick={() => setActiveView('summary')}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-700 rounded-full hover:bg-slate-100 transition active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Riwayat Absensi</h1>
              <button 
                onClick={() => setShowCalendar(true)}
                className="w-10 h-10 flex items-center justify-center text-[#005a9c]"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                     <Calendar className="w-4.5 h-4.5 text-slate-400" strokeWidth={2.5} />
                  </div>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => { setFilterMonth(e.target.value); setFilterDateStr(null); }}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
                {filterMonth && (
                  <button 
                    onClick={() => { setFilterMonth(""); setFilterDateStr(null); }}
                    className="px-4 h-11 rounded-2xl bg-rose-50 text-rose-600 text-[12px] font-bold hover:bg-rose-100 transition whitespace-nowrap"
                  >
                    Semua
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Admin / HR Header ── */}
        {!isKaryawan && (
          <div className="bg-white px-5 pt-8 pb-4 shadow-sm border-b border-slate-100 sticky top-0 z-20">
            <div className="flex items-center justify-between mb-5">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-700 rounded-full hover:bg-slate-100 transition active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Riwayat Absensi</h1>
              {canExport ? (
                <button
                  onClick={handleExportExcel}
                  className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition active:scale-95"
                >
                  <FileDown className="w-5 h-5" strokeWidth={2.5} />
                </button>
              ) : <div className="w-10 h-10"></div>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                     <Calendar className="w-4.5 h-4.5 text-slate-400" strokeWidth={2.5} />
                  </div>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => { setFilterMonth(e.target.value); setFilterDateStr(null); }}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
                {filterMonth && (
                  <button 
                    onClick={() => { setFilterMonth(""); setFilterDateStr(null); }}
                    className="px-4 h-11 rounded-2xl bg-rose-50 text-rose-600 text-[12px] font-bold hover:bg-rose-100 transition whitespace-nowrap"
                  >
                    Semua
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                   <Search className="w-4.5 h-4.5 text-slate-400" strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Attendance List ── */}
        {(!isKaryawan || activeView === 'list') && (
          <div className="px-5 py-6 flex flex-col gap-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
               <p className="text-sm font-semibold text-slate-400">Memuat riwayat...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="py-12 text-center">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                 <FileText className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-[15px] font-bold text-slate-600">Belum Ada Absensi</p>
               <p className="text-sm text-slate-400 mt-1">Tidak ada data di bulan yang dipilih.</p>
            </div>
          ) : (
            filteredAttendance.map((item) => {
              if (isKaryawan) return renderKaryawanCard(item);

              const isLate = item.status === "late" || (item.late_minutes > 0);
              let statusLabel = isLate ? "Terlambat" : "Tepat Waktu";
              let statusClass = isLate 
                ? "bg-rose-100 text-rose-700 border-rose-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200";

              if (item.status === "dinas") {
                statusLabel = "Dinas Luar Kota";
                statusClass = "bg-purple-100 text-purple-700 border-purple-200";
              }

              return (
                <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative group">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[14px] font-black ${getAvatarClass(item.name)}`}>
                        {getInitials(item.name)}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-900 leading-tight">{item.name}</p>
                        <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{formatDateFull(item.date)}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${statusClass}`}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <LogIn className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Masuk</p>
                          <p className="text-[18px] font-black text-slate-800 tracking-tight leading-none mt-1">
                            {formatTimeOnly(item.check_in)}
                          </p>
                       </div>
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <LogOut className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Pulang</p>
                          <p className="text-[18px] font-black text-slate-800 tracking-tight leading-none mt-1">
                            {formatTimeOnly(item.check_out)}
                          </p>
                       </div>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-2 bg-white/90 backdrop-blur pl-3 rounded-full shadow-sm">
                      <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isSuperAdmin && (
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end gap-2 md:hidden">
                      <button onClick={() => openEdit(item)} className="px-4 py-2 rounded-xl bg-slate-100 text-[12px] font-bold text-slate-600 transition active:scale-95">Edit</button>
                      <button onClick={() => setDeleteId(item.id)} className="px-4 py-2 rounded-xl bg-rose-50 text-[12px] font-bold text-rose-600 transition active:scale-95">Hapus</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        )}
      </div>

      {/* ── Modal Edit Attendance (super_admin only) ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setEditItem(null)}>
          <div className="w-full sm:w-[450px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[18px] font-black text-slate-900">Edit Jam Absensi</h3>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">
                {editItem.name} — {formatDateFull(editItem.date)}
              </p>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Check In</span>
                  <input type="time" value={editForm.check_in}
                    onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-mono font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Check Out</span>
                  <input type="time" value={editForm.check_out}
                    onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-mono font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <label className="block">
                   <span className="mb-2 block text-[13px] font-bold text-slate-700">Menit Telat</span>
                   <input type="number" min="0" value={editForm.late_minutes}
                     onChange={(e) => setEditForm({ ...editForm, late_minutes: e.target.value })}
                     className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                 </label>
                 <label className="block">
                   <span className="mb-2 block text-[13px] font-bold text-slate-700">Status</span>
                   <select value={editForm.status}
                     onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                     className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white">
                     <option value="present">Tepat Waktu</option>
                     <option value="late">Terlambat</option>
                   </select>
                 </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-2">
              <button onClick={() => setEditItem(null)}
                className="flex-1 h-12 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95">
                Batal
              </button>
              <button onClick={handleEdit} disabled={editLoading}
                className="flex-1 h-12 rounded-2xl bg-blue-600 text-[14px] font-bold text-white hover:bg-blue-700 transition active:scale-95 shadow-[0_8px_20px_rgba(37,99,235,0.3)] disabled:opacity-60 disabled:scale-100">
                {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Trash2 className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="mb-2 text-[18px] font-black text-slate-900">Hapus Riwayat?</h3>
            <p className="mb-6 text-[13px] font-semibold text-slate-500 leading-relaxed">
              Data absensi ini akan dihapus permanen dan tidak bisa dikembalikan ke sistem.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95">
                Batal
              </button>
              <button onClick={handleDelete}
                className="flex-1 h-12 rounded-2xl bg-rose-600 text-[14px] font-bold text-white hover:bg-rose-700 transition active:scale-95 shadow-[0_8px_20px_rgba(225,29,72,0.3)]">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      {/* ── Custom Calendar Popup ── */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCalendar(false)}>
          <div className="bg-white w-full max-w-[340px] rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-[19px] font-bold text-slate-800 mb-2">Pilih tanggal</h3>
            <div className="bg-[#ffcc00] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg inline-block mb-6 shadow-sm w-full text-center">
              Hanya dapat memilih rentang tanggal 7 hari
            </div>

            {/* Header Bulan */}
            {(() => {
              const currentYear = filterMonth ? parseInt(filterMonth.slice(0, 4)) : new Date().getFullYear();
              const currentMonth = filterMonth ? parseInt(filterMonth.slice(5, 7)) : new Date().getMonth() + 1;
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const displayMonthName = monthNames[currentMonth - 1];

              const handlePrevMonth = () => {
                let y = currentYear; let m = currentMonth - 1;
                if (m === 0) { m = 12; y--; }
                setFilterMonth(`${y}-${m.toString().padStart(2, '0')}`);
              };
              const handleNextMonth = () => {
                let y = currentYear; let m = currentMonth + 1;
                if (m === 13) { m = 1; y++; }
                setFilterMonth(`${y}-${m.toString().padStart(2, '0')}`);
              };

              const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
              const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
              const blanks = Array.from({ length: firstDay }, (_, i) => i);
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

              return (
                <>
                  <div className="flex justify-between items-center mb-6 px-1">
                    <span className="text-[15px] font-bold text-slate-800">{displayMonthName} {currentYear}</span>
                    <div className="flex gap-4">
                      <button onClick={handlePrevMonth} className="text-slate-400 hover:text-slate-700 transition">
                         <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={handleNextMonth} className="text-slate-400 hover:text-slate-700 transition">
                         <ChevronLeft className="w-5 h-5 rotate-180" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center gap-y-4 mb-8">
                    {/* Nama Hari */}
                    <div className="text-[11px] font-medium text-rose-500 mb-2">SUN</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">MON</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">TUE</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">WED</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">THU</div>
                    <div className="text-[11px] font-medium text-[#005a9c] mb-2">FRI</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">SAT</div>

                    {/* Sel Kosong */}
                    {blanks.map((b) => <div key={`blank-${b}`}></div>)}

                    {/* Tanggal */}
                    {days.map((d) => {
                      const dayOfWeek = (firstDay + d - 1) % 7;
                      const isSunday = dayOfWeek === 0;
                      const isSelected = d === selectedDay;
                      
                      let textClass = "text-[14px] font-semibold text-slate-700";
                      if (isSunday) textClass = "text-[14px] font-semibold text-rose-500";
                      if (isSelected) textClass = "text-[14px] font-semibold text-[#005a9c]";

                      return (
                        <div key={d} className="flex justify-center items-center">
                          <div 
                            onClick={() => setSelectedDay(d)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition ${isSelected ? 'border-[1.5px] border-[#005a9c]' : 'hover:bg-slate-100'} ${textClass}`}
                          >
                            {d}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button onClick={() => setShowCalendar(false)} className="flex-1 py-3 text-rose-600 text-[14px] font-bold">
                Tutup
              </button>
              <button 
                onClick={() => {
                  const currentYear = filterMonth ? parseInt(filterMonth.slice(0, 4)) : new Date().getFullYear();
                  const currentMonth = filterMonth ? parseInt(filterMonth.slice(5, 7)) : new Date().getMonth() + 1;
                  const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
                  setFilterDateStr(dateStr);
                  setShowCalendar(false);
                }} 
                className="flex-1 py-3 rounded-full text-white text-[14px] font-bold bg-[#005a9c]"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
