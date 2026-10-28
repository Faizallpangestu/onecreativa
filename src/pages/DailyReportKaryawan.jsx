import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, Save, CheckCircle, Plus, Trash2, 
  Pencil, Download, FileText, Clock, Hourglass, HelpCircle,
  MoreVertical, RefreshCw, Send, SendIcon, BarChart3, ChevronDown,
  ClipboardList, Check
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import Swal from "sweetalert2";

export default function DailyReportKaryawan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form input state
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [statusInput, setStatusInput] = useState("new");
  
  const [weeklyStats, setWeeklyStats] = useState([0,0,0,0,0,0,0]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      fetchReport(parsed.employee_id, selectedDate);
    } else {
      navigate("/login");
    }
  }, [navigate, selectedDate]);

  const fetchReport = async (employeeId, date) => {
    setLoading(true);
    try {
      const resp = await api.get(`/daily_reports.php?role=karyawan&employee_id=${employeeId}&date=${date}`);
      if (resp.data.status === "success" && resp.data.data.length > 0) {
        const report = resp.data.data[0];
        setTasks(Array.isArray(report.tasks) ? report.tasks : []);
        setNotes(report.notes || "");
      } else {
        setTasks([]);
        setNotes("");
      }

      // Ambil data bulan ini untuk statistik mingguan
      const month = date.slice(0, 7);
      const monthResp = await api.get(`/daily_reports.php?role=karyawan&employee_id=${employeeId}&month=${month}&date=`);
      if (monthResp.data.status === "success") {
         computeWeeklyStats(monthResp.data.data, date);
      }

    } catch (err) {
      console.error(err);
      setTasks([]);
      setNotes("");
    } finally {
      setLoading(false);
    }
  };

  const computeWeeklyStats = (reports, currentDateStr) => {
      const currDate = new Date(currentDateStr);
      const day = currDate.getDay(); 
      const diff = currDate.getDate() - day + (day === 0 ? -6 : 1); 
      const monday = new Date(currDate.setDate(diff));
      monday.setHours(0,0,0,0);
      
      const newStats = [0,0,0,0,0,0,0];
      
      reports.forEach(report => {
          const repDate = new Date(report.report_date);
          repDate.setHours(0,0,0,0);
          
          const diffTime = repDate - monday;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays < 7) {
              let completed = 0;
              if (Array.isArray(report.tasks)) {
                  completed = report.tasks.filter(t => t.status === 'done').length;
              }
              newStats[diffDays] = completed;
          }
      });
      setWeeklyStats(newStats);
  };

  const saveReport = async (tasksToSave = null, silent = false) => {
    if (!user) return;
    if (!silent) setSaving(true);
    try {
      const currentTasks = tasksToSave ?? tasks;
      const payload = {
        employee_id: user.employee_id,
        report_date: selectedDate,
        tasks: currentTasks,
        notes: notes
      };
      
      const res = await api.post('/daily_reports.php', payload);
      if(res.data.status === 'success'){
        if (tasksToSave !== null) {
            setTasks(tasksToSave);
        }
        if (!silent) {
            Swal.fire({
                title: 'Berhasil!',
                text: 'Laporan berhasil disimpan',
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        }
      } else {
        if (!silent) {
            Swal.fire('Gagal!', "Gagal menyimpan laporan: " + res.data.message, 'error');
        }
      }
    } catch(err) {
      console.error(err);
      if (!silent) Swal.fire('Error!', "Terjadi kesalahan jaringan.", 'error');
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const addTask = async () => {
    if (!judul.trim()) {
        Swal.fire('Perhatian', "Judul aktivitas wajib diisi.", 'warning');
        return;
    }
    const newTaskObj = {
        text: judul.trim(),
        category: kategori,
        description: deskripsi,
        status: statusInput,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        finished_at: statusInput === 'done' ? new Date().toISOString() : null
    };

    const newTasks = [...tasks, newTaskObj];
    setTasks(newTasks);
    
    // Reset form
    setJudul("");
    setKategori("");
    setDeskripsi("");
    setStatusInput("new");

    // Auto-save
    await saveReport(newTasks, true);
  };

  const resetForm = () => {
      setJudul("");
      setKategori("");
      setDeskripsi("");
      setStatusInput("new");
  };

  const removeTask = async (index) => {
    if(confirm("Yakin hapus aktivitas ini?")) {
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);
        await saveReport(newTasks, true);
    }
  };

  const toggleTaskStatus = async (index) => {
    const newTasks = [...tasks];
    const current = newTasks[index].status || 'new';
    const nextStatus = current === 'done' ? 'new' : 'done';
    newTasks[index].status = nextStatus;
    if (nextStatus === 'done') {
      newTasks[index].finished_at = new Date().toISOString();
    } else {
      newTasks[index].finished_at = null;
    }
    setTasks(newTasks);
    await saveReport(newTasks, true);
  };

  const exportToExcel = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const month = selectedDate.slice(0, 7);
      const resp = await api.get(`/daily_reports.php?role=karyawan&employee_id=${user.employee_id}&month=${month}&date=`);
      
      if (resp.data.status === "success" && resp.data.data.length > 0) {
        const reports = resp.data.data;
        const excelData = [];
        let index = 1;
        
        reports.sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
        
        reports.forEach(report => {
           const reportTasks = Array.isArray(report.tasks) ? report.tasks : [];
           if (reportTasks.length === 0) {
              excelData.push({
                 "No": index++,
                 "Tanggal": report.report_date,
                 "Aktivitas": "-",
                 "Kategori": "-",
                 "Deskripsi": "-",
                 "Status": "-",
                 "Waktu Selesai": "-"
              });
           } else {
              reportTasks.forEach(task => {
                 let statusLabel = 'Belum Dikerjakan';
                 if (task.status === 'progress') statusLabel = 'Dalam Proses';
                 if (task.status === 'done') statusLabel = 'Selesai';
                 
                 excelData.push({
                    "No": index++,
                    "Tanggal": report.report_date,
                    "Aktivitas": task.text,
                    "Kategori": task.category || "-",
                    "Deskripsi": task.description || "-",
                    "Status": statusLabel,
                    "Waktu Selesai": task.finished_at ? new Date(task.finished_at).toLocaleString('id-ID') : "-"
                 });
              });
           }
        });
        
        const XLSX = await import("xlsx-js-style");
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        worksheet["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 20 }];
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_col(C) + "1";
          if (!worksheet[address]) continue;
          worksheet[address].s = {
            fill: { fgColor: { rgb: "0C2E59" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Kerja");
        
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthNum = parseInt(month.split('-')[1], 10);
        const yearNum = month.split('-')[0];
        
        XLSX.writeFile(workbook, `Laporan_Kerja_${user.full_name}_${monthNames[monthNum-1]}_${yearNum}.xlsx`);
      } else {
        alert("Tidak ada data laporan di bulan ini.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const countSelesai = tasks.filter(t => t.status === 'done').length;
  const countProses = tasks.filter(t => t.status === 'progress').length;
  const countTertunda = tasks.filter(t => t.status === 'new').length;

  return (
    <Layout>
      <div className="min-h-screen bg-[#f4f7fe] p-4 lg:p-8 font-sans">
        
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Hero Section */}
          <div className="bg-[#eaf1ff] rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md">
                    <FileText className="w-6 h-6" />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold text-[#0c2e59] mb-2 tracking-tight">Laporan Kerja Harian</h1>
              <p className="text-slate-600 font-medium">Catat dan kelola aktivitas kerjamu dengan mudah.</p>
            </div>
            {/* 3D illustration */}
            <div className="hidden md:block relative z-10 mr-6">
               <img
                 src="/daily_report_3d.jpg"
                 alt="Ilustrasi Laporan Kerja Harian"
                 className="w-64 h-44 object-cover rounded-2xl mix-blend-multiply transition-transform duration-500 hover:scale-105 hover:-rotate-1"
               />
            </div>
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/3 -translate-y-1/3"></div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="col-span-2 md:col-span-1 bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col justify-center">
              <label className="text-[12px] font-bold text-slate-400 mb-1">Tanggal Laporan</label>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="font-extrabold text-slate-800 text-[15px] outline-none bg-transparent w-full"
                />
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-500">Selesai</div>
                <div className="text-[20px] font-black text-slate-800 leading-tight">{countSelesai}</div>
                <div className="text-[11px] text-slate-400">Tugas selesai hari ini</div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-500">Dalam Proses</div>
                <div className="text-[20px] font-black text-slate-800 leading-tight">{countProses}</div>
                <div className="text-[11px] text-slate-400">Masih dikerjakan</div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Hourglass className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-500">Tertunda</div>
                <div className="text-[20px] font-black text-slate-800 leading-tight">{countTertunda}</div>
                <div className="text-[11px] text-slate-400">Belum dikerjakan</div>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center justify-center">
               <button
                 onClick={exportToExcel}
                 disabled={exporting}
                 className="w-full h-full min-h-[50px] bg-emerald-50 text-emerald-600 rounded-[14px] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors border border-emerald-100 disabled:opacity-50"
               >
                 <Download className="w-4 h-4" />
                 {exporting ? 'Mengekspor...' : 'Export 1 Bulan'}
               </button>
            </div>

          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                <h2 className="text-[18px] font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                  </div>
                  Tambah Aktivitas
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Judul Aktivitas <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={judul}
                      onChange={e => setJudul(e.target.value)}
                      placeholder="Contoh: Koordinasi dengan tim"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Kategori <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={kategori}
                        onChange={e => setKategori(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                      >
                        <option value="">Pilih kategori</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Administrasi">Administrasi</option>
                        <option value="Dokumen">Dokumen</option>
                        <option value="Materi">Materi</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Deskripsi <span className="text-rose-500">*</span></label>
                    <textarea 
                      value={deskripsi}
                      onChange={e => setDeskripsi(e.target.value)}
                      placeholder="Jelaskan aktivitas yang dilakukan..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Status <span className="text-rose-500">*</span></label>
                    <div className="flex gap-3">
                      <div onClick={() => setStatusInput('done')} className="flex-1 flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${statusInput === 'done' ? 'border-emerald-500' : 'border-slate-300'}`}>
                           {statusInput === 'done' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Selesai</span>
                      </div>
                      <div onClick={() => setStatusInput('progress')} className="flex-1 flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${statusInput === 'progress' ? 'border-blue-500' : 'border-slate-300'}`}>
                           {statusInput === 'progress' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Dalam Proses</span>
                      </div>
                      <div onClick={() => setStatusInput('new')} className="flex-1 flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${statusInput === 'new' ? 'border-amber-500' : 'border-slate-300'}`}>
                           {statusInput === 'new' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Tertunda</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                        onClick={resetForm}
                        className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-[14px] font-bold text-[14px] hover:bg-slate-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={addTask}
                        className="flex-[2] py-3.5 bg-blue-600 text-white rounded-[14px] font-bold text-[14px] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        <SendIcon className="w-4 h-4" /> Simpan Aktivitas
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Column: Lists & Widgets */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Task List */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[400px]">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[18px] font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <ClipboardList className="w-4 h-4" />
                        </div>
                        Daftar Aktivitas Hari Ini
                    </h2>
                 </div>

                 {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
                    </div>
                 ) : tasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <ClipboardList className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">Belum ada aktivitas dilaporkan</p>
                        <p className="text-slate-400 text-sm mt-1">Tambahkan pekerjaan hari ini pada form di sebelah kiri.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        {tasks.map((task, i) => {
                            let badgeColor = "bg-amber-100 text-amber-600";
                            let badgeText = "Tertunda";
                            if (task.status === "progress") { badgeColor = "bg-blue-100 text-blue-600"; badgeText = "Dalam Proses"; }
                            if (task.status === "done") { badgeColor = "bg-emerald-100 text-emerald-600"; badgeText = "Selesai"; }
                            
                            return (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all group bg-white">
                                    <button 
                                        onClick={() => toggleTaskStatus(i)}
                                        className={`mt-1 shrink-0 w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-slate-50'}`}
                                    >
                                        {task.status === 'done' && <Check className="w-4 h-4" />}
                                    </button>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-[15px] mb-1 ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                            {task.text}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {task.time || "08:00 - 09:00"}</span>
                                            {task.category && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {task.category}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${badgeColor}`}>
                                            {badgeText}
                                        </span>
                                        <button onClick={() => removeTask(i)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 )}
              </div>

              {/* Bottom Widgets Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart Mockup */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            Aktivitas Minggu Ini
                        </h3>
                        <div className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            Minggu ini
                        </div>
                    </div>
                    {/* Weekly Chart */}
                    <div className="flex items-end justify-between h-32 pb-2">
                        {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((day, i) => {
                            const maxStat = Math.max(...weeklyStats, 1);
                            const val = weeklyStats[i] || 0;
                            const heightPct = val > 0 ? Math.max(10, (val/maxStat)*100) : 0;
                            return (
                                <div key={day} className="flex flex-col items-center gap-2">
                                    <div className="w-6 bg-slate-100 rounded-full h-24 flex flex-col justify-end overflow-hidden" title={`${val} aktivitas selesai`}>
                                        <div className={`w-full ${i===3?'bg-blue-500':i===1?'bg-blue-400':i===4?'bg-emerald-500':'bg-emerald-400'} rounded-full`} style={{height: `${heightPct}%`, transition: 'height 0.5s ease-out'}}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-50 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Selesai</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Dalam Proses</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Tertunda</span>
                    </div>
                </div>

                {/* Catatan */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Catatan / Evaluasi
                    </h3>
                    <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Tulis catatan atau evaluasi pekerjaan hari ini..."
                        className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-[14px] p-4 text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-all resize-none mb-4"
                    ></textarea>
                    <div className="flex justify-end">
                        <button 
                            onClick={() => saveReport(null, false)}
                            disabled={saving}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>

              </div>

            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}
