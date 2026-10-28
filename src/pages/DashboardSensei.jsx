import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { 
  BookOpen, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  Calendar as CalendarIcon, 
  Award, 
  ChevronRight, 
  MessageSquare, 
  AlertCircle, 
  TrendingUp, 
  Play, 
  Send, 
  Eye, 
  Check, 
  X, 
  Edit3, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  Video,
  FileCheck
} from "lucide-react";
import Swal from "sweetalert2";
import bannerImg from "../assets/fuji_pagoda_banner.jpg";

export default function DashboardSensei() {
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || { name: "Sensei Ayu" };
    } catch {
      return { name: "Sensei Ayu" };
    }
  });

  // Time & Greeting
  const [timeNow, setTimeNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const h = timeNow.getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 15) return "Selamat Siang";
    if (h < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  // Grading Modal State
  const [selectedTaskToGrade, setSelectedTaskToGrade] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  // Master Schedule Today
  const scheduleToday = [
    {
      id: 1,
      time: "08:00 - 09:30",
      class: "N5 A - Pagi",
      topic: "Bab 3: Perkenalan Diri",
      status: "Mengajar",
      statusColor: "blue"
    },
    {
      id: 2,
      time: "10:00 - 11:30",
      class: "N4 B - Pagi",
      topic: "Latihan Percakapan",
      status: "Mengajar",
      statusColor: "blue"
    },
    {
      id: 3,
      time: "13:00 - 14:30",
      class: "N5 C - Sore",
      topic: "Tata Bahasa Partikel",
      status: "Persiapan",
      statusColor: "amber"
    },
    {
      id: 4,
      time: "15:00 - 16:30",
      class: "Konsultasi Siswa",
      topic: "Sesi Tanya Jawab",
      status: "Online",
      statusColor: "slate"
    }
  ];

  // Class Progress
  const classProgress = [
    { class: "N5 A - Pagi", progress: 78, color: "bg-blue-600" },
    { class: "N5 B - Sore", progress: 62, color: "bg-purple-600" },
    { class: "N4 A - Pagi", progress: 85, color: "bg-emerald-500" },
    { class: "N4 B - Sore", progress: 70, color: "bg-amber-500" },
    { class: "N3 Persiapan", progress: 55, color: "bg-rose-500" }
  ];

  // Tasks Waiting for Grading
  const [pendingTasks, setPendingTasks] = useState([
    {
      id: 1,
      title: "Latihan Menulis Hiragana",
      class: "N5 A - Pagi",
      submissions: "18 jawaban",
      iconBg: "bg-amber-500",
      studentName: "Budi Santoso",
      answerPreview: "Foto lembar latihan Hiragana あ - こ (10 baris rapi)."
    },
    {
      id: 2,
      title: "Quiz Kosakata Bab 2",
      class: "N5 B - Sore",
      submissions: "25 jawaban",
      iconBg: "bg-blue-600",
      studentName: "Rina Aulia",
      answerPreview: "Hasil skor pilihan ganda: 90 / 100."
    },
    {
      id: 3,
      title: "Tugas Percakapan Sehari-hari",
      class: "N4 A - Pagi",
      submissions: "12 jawaban",
      iconBg: "bg-cyan-500",
      studentName: "Dimas Pratama",
      answerPreview: "Audio rekaman percakapan durasi 2 menit 15 detik."
    },
    {
      id: 4,
      title: "Ujian Kompetensi Bab 1",
      class: "N4 B - Sore",
      submissions: "20 jawaban",
      iconBg: "bg-emerald-500",
      studentName: "Mika Sato",
      answerPreview: "Lembar jawaban CBT N4 Bab 1."
    }
  ]);

  // Handle Quick Grade
  const handleOpenGradeModal = (task) => {
    setSelectedTaskToGrade(task);
    setGradeInput("85");
    setFeedbackInput("Pengucapan dan intonasi sudah sangat baik, tingkatkan pemahaman kanji.");
  };

  const handleSaveGrade = () => {
    Swal.fire({
      title: "Nilai Berhasil Disimpan!",
      text: `Nilai ${gradeInput} telah diterbitkan untuk ${selectedTaskToGrade.studentName}.`,
      icon: "success",
      confirmButtonColor: "#2563eb"
    });
    setPendingTasks(prev => prev.filter(t => t.id !== selectedTaskToGrade.id));
    setSelectedTaskToGrade(null);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        
        {/* ================= TOP HEADER WITH SAKURA & MT FUJI ARTWORK ================= */}
        <div className="relative overflow-hidden bg-white border-b border-slate-100 shadow-sm px-6 py-6 md:px-8">
          <div 
            className="absolute top-0 right-0 w-[460px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 20%, transparent 100%)'
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1550px] mx-auto">
            <div>
              {/* Title Greeting */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{getGreeting()}, {user?.name || "Sensei Ayu"}!</span>
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Terima kasih telah berkontribusi dalam pembelajaran hari ini.
              </p>
            </div>

            {/* Right Date Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Selasa</div>
                <div className="text-xs md:text-sm font-extrabold text-slate-800">14 Oktober 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4 METRIC CARDS (SENSEI) ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Kelas Saya */}
            <div 
              onClick={() => navigate('/lms/classes')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Kelas Saya</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">5</div>
                <div className="text-[11px] text-slate-400">kelas aktif</div>
              </div>
            </div>

            {/* Card 2: Total Siswa */}
            <div 
              onClick={() => navigate('/lms/classes')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Total Siswa</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">96</div>
                <div className="text-[11px] text-slate-400">siswa</div>
              </div>
            </div>

            {/* Card 3: Tugas Perlu Dinilai */}
            <div 
              onClick={() => navigate('/lms/tugas-quiz')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-rose-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Tugas Perlu Dinilai</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">12</div>
                <div className="text-[11px] text-slate-400">menunggu penilaian</div>
              </div>
            </div>

            {/* Card 4: Pesan Baru */}
            <div 
              onClick={() => navigate('/lms/diskusi')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Pesan Baru</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">3</div>
                <div className="text-[11px] text-slate-400">dari siswa</div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ROW 2: JADWAL HARI INI & PROGRES KELAS ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Jadwal Hari Ini (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Jadwal Hari Ini
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/kalender')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Kalender &gt;
                  </button>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {scheduleToday.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between relative pl-4 border-l-2 border-blue-500/80">
                      <div>
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.time}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-extrabold text-slate-900">{item.class}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.topic}
                        </div>
                      </div>

                      {/* Pill Action Button */}
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: `Sesi Kelas ${item.class}`,
                            html: `Materi: <b>${item.topic}</b><br/>Waktu: <b>${item.time}</b><br/><br/><span style="font-size:12px; color:#64748b;">Ruang kelas digital siap digunakan.</span>`,
                            icon: "info",
                            confirmButtonColor: "#2563eb",
                            confirmButtonText: "Buka Kelas Sekarang"
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                          item.statusColor === 'blue'
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                            : item.statusColor === 'amber'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.status}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Progres Pembelajaran Kelas (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Progres Pembelajaran Kelas
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/classes')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  {classProgress.map((cp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{cp.class}</span>
                        <span className="text-slate-800">{cp.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${cp.color}`}
                          style={{ width: `${cp.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ROW 3: TUGAS MENUNGGU & STATISTIK KEHADIRAN ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Tugas Menunggu Penilaian (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Tugas Menunggu Penilaian
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/tugas-quiz')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  {pendingTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${t.iconBg} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 line-clamp-1">
                            {t.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {t.class}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">
                          {t.submissions}
                        </span>
                        <button
                          onClick={() => handleOpenGradeModal(t)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200 rounded-full text-xs font-bold transition-all"
                        >
                          Nilai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Statistik Kehadiran Siswa (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm md:text-base font-bold text-slate-800 pb-3 mb-4 border-b border-slate-100">
                  Statistik Kehadiran Siswa
                </h2>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                  {/* SVG Donut Chart */}
                  <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                      
                      {/* Hadir (88/96 = 91.6%) Green */}
                      <circle 
                        cx="50" cy="50" r="38" 
                        stroke="#10b981" strokeWidth="12" 
                        strokeDasharray="218 238" 
                        strokeDashoffset="0" 
                        fill="none" 
                      />
                      {/* Izin (6/96 = 6.2%) Blue */}
                      <circle 
                        cx="50" cy="50" r="38" 
                        stroke="#3b82f6" strokeWidth="12" 
                        strokeDasharray="15 238" 
                        strokeDashoffset="-218" 
                        fill="none" 
                      />
                      {/* Sakit (2/96 = 2%) Orange */}
                      <circle 
                        cx="50" cy="50" r="38" 
                        stroke="#f97316" strokeWidth="12" 
                        strokeDasharray="5 238" 
                        strokeDashoffset="-233" 
                        fill="none" 
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-800">92%</span>
                      <span className="text-[11px] text-slate-400 font-semibold">Hadir</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2.5 text-xs w-full max-w-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600 font-semibold">Hadir</span>
                      </div>
                      <span className="font-extrabold text-slate-800">88</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <span className="text-slate-600 font-semibold">Izin</span>
                      </div>
                      <span className="font-extrabold text-slate-800">6</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                        <span className="text-slate-600 font-semibold">Sakit</span>
                      </div>
                      <span className="font-extrabold text-slate-800">2</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="text-slate-600 font-semibold">Alpha</span>
                      </div>
                      <span className="font-extrabold text-slate-800">0</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ================= ROW 4: AKTIVITAS TERBARU & PENGUMUMAN PENTING ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Aktivitas Terbaru (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Aktivitas Terbaru
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/diskusi')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-3.5">
                  
                  {/* Activity 1 */}
                  <div className="flex items-start gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" 
                      alt="Rina Aulia" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-700 leading-tight">
                        <span className="font-bold text-slate-900">Rina Aulia</span> mengumpulkan tugas "Percakapan Sehari-hari"
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">10 menit lalu</div>
                    </div>
                  </div>

                  {/* Activity 2 */}
                  <div className="flex items-start gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" 
                      alt="Budi Santoso" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-700 leading-tight">
                        <span className="font-bold text-slate-900">Budi Santoso</span> mengajukan pertanyaan di forum kelas N5 A
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">25 menit lalu</div>
                    </div>
                  </div>

                  {/* Activity 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-700 leading-tight">
                        Quiz <span className="font-bold text-slate-900">"Kosakata Bab 2"</span> selesai dilaksanakan
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">1 jam lalu</div>
                    </div>
                  </div>

                  {/* Activity 4 */}
                  <div className="flex items-start gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" 
                      alt="Student" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-700 leading-tight">
                        Kelas <span className="font-bold text-slate-900">N4 B - Sore</span> berhasil diperbarui
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">2 jam lalu</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right: Pengumuman Penting (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Pengumuman Penting
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/pengumuman')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  
                  {/* Item 1 */}
                  <div 
                    onClick={() => navigate('/lms/pengumuman')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Perubahan Jadwal Ujian N5
                        </div>
                        <div className="text-[11px] text-slate-400">
                          12 Okt 2026
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>

                  {/* Item 2 */}
                  <div 
                    onClick={() => navigate('/lms/pengumuman')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Materi Baru Telah Tersedia
                        </div>
                        <div className="text-[11px] text-slate-400">
                          10 Okt 2026
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>

                  {/* Item 3 */}
                  <div 
                    onClick={() => navigate('/lms/pengumuman')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Informasi Program Beasiswa
                        </div>
                        <div className="text-[11px] text-slate-400">
                          5 Okt 2026
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= MODAL PENILAIAN TUGAS ================= */}
        {selectedTaskToGrade && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Penilaian Tugas Siswa</h3>
                  <p className="text-[11px] text-blue-100">{selectedTaskToGrade.title} - {selectedTaskToGrade.class}</p>
                </div>
                <button 
                  onClick={() => setSelectedTaskToGrade(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div className="text-slate-400">Nama Siswa:</div>
                  <div className="font-bold text-slate-800 text-sm">{selectedTaskToGrade.studentName}</div>
                  <div className="text-slate-500 mt-1">{selectedTaskToGrade.answerPreview}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai (0 - 100)
                  </label>
                  <input
                    type="number"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan / Feedback Sensei
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedTaskToGrade(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveGrade}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                  Simpan Nilai
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
