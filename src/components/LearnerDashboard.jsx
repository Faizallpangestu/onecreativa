import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { 
  BookOpen, 
  Clock, 
  Calendar as CalendarIcon, 
  Star, 
  Award, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  Megaphone, 
  Eye, 
  Upload, 
  X,
  Compass
} from 'lucide-react';
import Swal from 'sweetalert2';
import bannerImg from '../assets/fuji_pagoda_banner.jpg';

export default function LearnerDashboard() {
  const navigate = useNavigate();

  // User State
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || { name: 'Rina Aulia' };
    } catch {
      return { name: 'Rina Aulia' };
    }
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Rina';

  // Greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Countdown timer for Ujian Mendatang (6 Hari 15 Jam 30 Menit 12 Detik)
  const [countdown, setCountdown] = useState({
    days: 6,
    hours: 15,
    minutes: 30,
    seconds: 12
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modal Submisi Tugas State
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [taskNotes, setTaskNotes] = useState('');

  // Handle Submit Tugas
  const handleSubmitTask = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Tugas Berhasil Dikumpulkan!',
      text: `File tugas untuk "${activeTaskModal.title}" telah tersimpan dan diteruskan ke Sensei.`,
      icon: 'success',
      confirmButtonColor: '#2563eb'
    });
    setActiveTaskModal(null);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        
        {/* ================= TOP HEADER WITH SAKURA & MOTIVATION BOX ================= */}
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
              {/* Greeting */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{getGreeting()}, {firstName}!</span>
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Terus semangat belajar bahasa Jepang!
              </p>
            </div>

            {/* Right: Japanese Motivation Box */}
            <div className="bg-gradient-to-r from-rose-50/90 to-pink-50/80 border border-rose-200/80 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                🌸
              </div>
              <div>
                <div className="text-xs font-black text-rose-700 tracking-wide">
                  継続は力なり
                </div>
                <div className="text-[11px] text-rose-500/90 font-medium">
                  Konsistensi adalah kekuatan.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4 METRIC CARDS (SISWA) ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Kelas Aktif */}
            <div 
              onClick={() => navigate('/lms/classes')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Kelas Aktif</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">3</div>
                <div className="text-[11px] text-slate-400">kelas</div>
              </div>
            </div>

            {/* Card 2: Tugas Menunggu */}
            <div 
              onClick={() => navigate('/lms/tugas-quiz')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Tugas Menunggu</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">2</div>
                <div className="text-[11px] text-slate-400">tugas</div>
              </div>
            </div>

            {/* Card 3: Ujian Mendatang */}
            <div 
              onClick={() => navigate('/lms/ukom')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-rose-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Ujian Mendatang</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">1</div>
                <div className="text-[11px] text-slate-400">ujian</div>
              </div>
            </div>

            {/* Card 4: Nilai Rata-rata */}
            <div 
              onClick={() => navigate('/lms/nilai')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400">Nilai Rata-rata</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">88.5</div>
                <div className="text-[11px] text-slate-400">dari 100</div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ROW 2: JADWAL HARI INI & PROGRES BELAJAR SAYA ================= */}
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

                <div className="space-y-4">
                  {/* Schedule 1 */}
                  <div className="flex items-center justify-between relative pl-4 border-l-2 border-rose-500">
                    <div>
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>08:00 - 09:30</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-extrabold text-slate-900">N5 A - Pagi</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Bab 3: Perkenalan Diri
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
                      Sedang Berlangsung
                    </span>
                  </div>

                  {/* Schedule 2 */}
                  <div className="flex items-center justify-between relative pl-4 border-l-2 border-slate-300">
                    <div>
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>13:00 - 14:30</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-extrabold text-slate-900">N5 B - Sore</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Latihan Percakapan
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      Akan Datang
                    </span>
                  </div>

                  {/* Schedule 3 */}
                  <div className="flex items-center justify-between relative pl-4 border-l-2 border-slate-300">
                    <div>
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>19:00 - 20:00</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-extrabold text-slate-900">N4 A - Online</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tata Bahasa Partikel
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      Akan Datang
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Progres Belajar Saya (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Progres Belajar Saya
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/materi')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">N5 A - Pagi</span>
                      <span className="text-slate-800">80%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">N5 B - Sore</span>
                      <span className="text-slate-800">65%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">N4 A - Online</span>
                      <span className="text-slate-800">70%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>

                {/* Total Materi Dipelajari Mini Box */}
                <div className="mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Total Materi Dipelajari</div>
                      <div className="text-base font-black text-slate-800">
                        45 <span className="text-xs text-slate-400 font-bold">/ 60</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-24 bg-purple-200/60 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ROW 3: TUGAS TERBARU & UJIAN MENDATANG ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Tugas Terbaru (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Tugas Terbaru
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/tugas-quiz')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  
                  {/* Task 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Latihan Menulis Hiragana
                        </div>
                        <div className="text-[11px] text-slate-400">
                          N5 A - Pagi
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>15 Okt 2026</span>
                      </div>
                      <button
                        onClick={() => setActiveTaskModal({ title: 'Latihan Menulis Hiragana', deadline: '15 Okt 2026' })}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200 rounded-full text-xs font-bold transition-all"
                      >
                        Kumpulkan
                      </button>
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Quiz Kosakata Bab 2
                        </div>
                        <div className="text-[11px] text-slate-400">
                          N5 B - Sore
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>18 Okt 2026</span>
                      </div>
                      <button
                        onClick={() => navigate('/lms/tugas-quiz')}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200 rounded-full text-xs font-bold transition-all"
                      >
                        Kerjakan
                      </button>
                    </div>
                  </div>

                  {/* Task 3 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Tugas Percakapan Sehari-hari
                        </div>
                        <div className="text-[11px] text-slate-400">
                          N4 A - Online
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>20 Okt 2026</span>
                      </div>
                      <button
                        onClick={() => navigate('/lms/tugas-quiz')}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200 rounded-full text-xs font-bold transition-all"
                      >
                        Kerjakan
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right: Ujian Mendatang (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Ujian Mendatang
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/ukom')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-extrabold text-slate-800">
                        Ujian Kompetensi N5 - Bab 1
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> 20 Okt 2026</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 08:00 - 09:00</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Counter Boxes */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl py-2 text-center">
                      <div className="text-base font-black text-rose-600">{countdown.days}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Hari</div>
                    </div>
                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl py-2 text-center">
                      <div className="text-base font-black text-rose-600">{countdown.hours}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Jam</div>
                    </div>
                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl py-2 text-center">
                      <div className="text-base font-black text-rose-600">{countdown.minutes}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Menit</div>
                    </div>
                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl py-2 text-center">
                      <div className="text-base font-black text-rose-600">{countdown.seconds}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Detik</div>
                    </div>
                  </div>

                  {/* Big Pink Button */}
                  <button
                    onClick={() => navigate('/lms/ukom')}
                    className="w-full mt-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ROW 4: NILAI TERBARU & PENGUMUMAN TERBARU ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Nilai Terbaru (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Nilai Terbaru
                  </h2>
                  <button 
                    onClick={() => navigate('/lms/nilai')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Quiz Kosakata Bab 1
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      90
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Tugas Percakapan
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      85
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Ujian Kompetensi Bab 1
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      80
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Quiz Tata Bahasa Partikel
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      88
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Right: Pengumuman Terbaru (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-sm md:text-base font-bold text-slate-800">
                    Pengumuman Terbaru
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
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Perubahan Jadwal Ujian Kompetensi N5
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
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Kegiatan Budaya Jepang (Culture Day)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          8 Okt 2026
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

        {/* ================= MODAL SUBMISI TUGAS ================= */}
        {activeTaskModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Kumpulkan Tugas</h3>
                  <p className="text-[11px] text-blue-100">{activeTaskModal.title}</p>
                </div>
                <button 
                  onClick={() => setActiveTaskModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmitTask} className="p-6 space-y-4">
                <div className="p-4 border-2 border-dashed border-blue-200 rounded-2xl text-center hover:bg-blue-50/50 cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-xs font-bold text-slate-700">Unggah Berkas Tugas</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Format file: PDF, DOCX, JPG, MP3 (Maks. 25MB)</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan untuk Sensei (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan catatan pengerjaan..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTaskModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                  >
                    Kirim Sekarang
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
