import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  MapPin, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Mic, 
  Sparkles, 
  Folder, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';
import animeGirlCheerImg from '../../assets/anime_girl_cheer.jpg';

export default function LmsKalender() {
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2026');
  const [viewMode, setViewMode] = useState('bulan'); // 'bulan' | 'minggu' | 'hari'
  const [selectedDay, setSelectedDay] = useState(15); // Default highlighted on 15 Oct

  // Master events data for October 2026
  const events = [
    {
      id: 1,
      day: 1,
      time: '09:00',
      title: '09:00 N5 A Kelas',
      fullTitle: 'Kelas N5 A - Pengenalan Hiragana Dasar',
      category: 'kelas',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      tagColor: 'bg-sky-500',
      location: 'Ruang Kelas 1 (Offline)',
      timeFull: '09:00 - 10:30 WIB'
    },
    {
      id: 2,
      day: 3,
      time: '13:00',
      title: '13:00 N4 B Kelas',
      fullTitle: 'Kelas N4 B - Tata Bahasa Bentuk Te',
      category: 'kelas',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      tagColor: 'bg-purple-500',
      location: 'Online (Zoom)',
      timeFull: '13:00 - 14:30 WIB'
    },
    {
      id: 3,
      day: 6,
      time: '23:59',
      title: 'Tugas Kosakata',
      fullTitle: 'Pengumpulan Tugas Kosakata Bab 1 & 2',
      category: 'tugas',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      tagColor: 'bg-amber-500',
      location: 'LMS Submission',
      timeFull: 'Deadline: 23:59 WIB'
    },
    {
      id: 4,
      day: 8,
      time: '10:00',
      title: 'Quiz Bab 1',
      fullTitle: 'Quiz Evaluasi Bab 1 - Kosakata & Partikel',
      category: 'quiz',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      tagColor: 'bg-rose-500',
      location: 'CBT Online LMS',
      timeFull: '10:00 - 10:45 WIB'
    },
    {
      id: 5,
      day: 10,
      time: '09:00',
      title: 'Kelas Tata Bahasa',
      fullTitle: 'Kelas N3 - Pola Kalimat Menengah Bab 4',
      category: 'kelas',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      tagColor: 'bg-sky-500',
      location: 'Ruang Teori 3',
      timeFull: '09:00 - 11:00 WIB'
    },
    {
      id: 6,
      day: 13,
      time: '10:00',
      title: 'Kelas Percakapan',
      fullTitle: 'Kelas N5 A - Latihan Percakapan (Kaiwa)',
      category: 'kelas',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      tagColor: 'bg-sky-500',
      location: 'Lab Bahasa 2',
      timeFull: '10:00 - 11:30 WIB'
    },
    {
      id: 7,
      day: 15,
      time: '13:00',
      title: 'Ujian Bab 2',
      fullTitle: 'Ujian Bab 2 - N4 B (Kompetensi Tata Bahasa)',
      category: 'ujian',
      color: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
      tagColor: 'bg-rose-600',
      location: 'Lab Komputer 1',
      timeFull: '13:00 - 14:30 WIB'
    },
    {
      id: 8,
      day: 18,
      time: '08:00',
      title: 'Praktik Percakapan',
      fullTitle: 'Praktik Percakapan - N5 C (Simulasi Wawancara)',
      category: 'praktik',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      tagColor: 'bg-purple-500',
      location: 'Ruang 2',
      timeFull: '08:00 - 09:30 WIB'
    },
    {
      id: 9,
      day: 20,
      time: '10:00',
      title: 'Kelas Dialog',
      fullTitle: 'Kelas Dialog - N4 A (Roleplay Pelayanan)',
      category: 'kelas',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      tagColor: 'bg-sky-500',
      location: 'Online (Zoom)',
      timeFull: '10:00 - 11:30 WIB'
    },
    {
      id: 10,
      day: 22,
      time: '23:59',
      title: 'Tugas Presentasi',
      fullTitle: 'Tugas Presentasi - N3 (Video Pengenalan Budaya)',
      category: 'tugas',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      tagColor: 'bg-amber-500',
      location: 'Upload Video LMS',
      timeFull: 'Deadline: 23:59 WIB'
    },
    {
      id: 11,
      day: 25,
      time: '09:00',
      title: 'Kelas Review',
      fullTitle: 'Kelas N5 A - Review Komprehensif Ujian',
      category: 'kelas',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      tagColor: 'bg-sky-500',
      location: 'Ruang 1',
      timeFull: '09:00 - 11:00 WIB'
    },
    {
      id: 12,
      day: 28,
      time: '13:00',
      title: 'Quiz Bab 3',
      fullTitle: 'Quiz Bab 3 - N4 B (Evaluasi Cepat)',
      category: 'quiz',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      tagColor: 'bg-rose-500',
      location: 'Online LMS CBT',
      timeFull: '13:00 - 14:00 WIB'
    },
    {
      id: 13,
      day: 30,
      time: '08:00',
      title: 'Ujian Akhir',
      fullTitle: 'Ujian Akhir Semester (UAS) N5 & N4',
      category: 'praktik',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
      tagColor: 'bg-emerald-600',
      location: 'Aula Utama & Lab CBT',
      timeFull: '08:00 - 11:30 WIB'
    }
  ];

  // Calendar structure generation for October 2026
  // October 2026 starts on Thursday (index 4 in Min=0, Sen=1, Sel=2, Rab=3, Kam=4, Jum=5, Sab=6)
  const calendarCells = useMemo(() => {
    const cells = [];
    // Previous month (September 2026): 27, 28, 29, 30
    [27, 28, 29, 30].forEach((d) => {
      cells.push({ day: d, isCurrentMonth: false, month: 'sep' });
    });
    // Current month (October 2026): 1 to 31
    for (let d = 1; d <= 31; d++) {
      cells.push({ day: d, isCurrentMonth: true, month: 'oct' });
    }
    // Next month (November 2026): 1, 2, 3
    [1, 2, 3].forEach((d) => {
      cells.push({ day: d, isCurrentMonth: false, month: 'nov' });
    });
    return cells;
  }, []);

  // Events happening on the selected day or upcoming
  const upcomingEvents = [
    {
      id: 1,
      day: 15,
      monthStr: 'Okt',
      dateStr: '15 Okt',
      colorClass: 'bg-rose-500 text-white',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200',
      badgeText: 'Ujian',
      title: 'Ujian Bab 2 - N4 B',
      time: '13:00 - 14:30',
      location: 'Lab Komputer'
    },
    {
      id: 2,
      day: 18,
      monthStr: 'Okt',
      dateStr: '18 Okt',
      colorClass: 'bg-purple-600 text-white',
      badgeClass: 'bg-purple-50 text-purple-600 border border-purple-200',
      badgeText: 'Praktik',
      title: 'Praktik Percakapan - N5 C',
      time: '08:00 - 09:30',
      location: 'Ruang 2'
    },
    {
      id: 3,
      day: 20,
      monthStr: 'Okt',
      dateStr: '20 Okt',
      colorClass: 'bg-sky-500 text-white',
      badgeClass: 'bg-sky-50 text-sky-600 border border-sky-200',
      badgeText: 'Kelas',
      title: 'Kelas Dialog - N4 A',
      time: '10:00 - 11:30',
      location: 'Online (Zoom)'
    },
    {
      id: 4,
      day: 22,
      monthStr: 'Okt',
      dateStr: '22 Okt',
      colorClass: 'bg-amber-500 text-white',
      badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200',
      badgeText: 'Tugas',
      title: 'Tugas Presentasi - N3',
      time: 'Deadline: 23:59',
      location: 'Upload LMS'
    },
    {
      id: 5,
      day: 28,
      monthStr: 'Okt',
      dateStr: '28 Okt',
      colorClass: 'bg-rose-500 text-white',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200',
      badgeText: 'Quiz',
      title: 'Quiz Bab 3 - N4 B',
      time: '13:00 - 14:00',
      location: 'Online'
    }
  ];

  // Tasks and deadlines list
  const tasksDeadlines = [
    {
      id: 1,
      title: 'Kosakata Bab 2',
      class: 'N4 B',
      date: '5 Okt 2026',
      status: 'Belum Dikerjakan',
      statusColor: 'bg-rose-50 text-rose-600 border-rose-200',
      iconBg: 'bg-amber-500 text-white'
    },
    {
      id: 2,
      title: 'Presentasi Kelompok',
      class: 'N3',
      date: '22 Okt 2026',
      status: 'Dalam Proses',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-500 text-white'
    },
    {
      id: 3,
      title: 'Latihan Soal',
      class: 'N5 A',
      date: '26 Okt 2026',
      status: 'Belum Dikerjakan',
      statusColor: 'bg-rose-50 text-rose-600 border-rose-200',
      iconBg: 'bg-emerald-500 text-white'
    }
  ];

  const handleShowEventDetail = (ev) => {
    Swal.fire({
      title: ev.fullTitle || ev.title,
      html: `
        <div class="text-left text-xs space-y-2 mt-3 text-slate-600">
          <div class="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
            <div class="flex justify-between"><span>Kategori:</span> <b class="capitalize">${ev.category || 'Jadwal'}</b></div>
            <div class="flex justify-between"><span>Waktu:</span> <b>${ev.timeFull || ev.time}</b></div>
            <div class="flex justify-between"><span>Lokasi:</span> <b>${ev.location}</b></div>
            <div class="flex justify-between"><span>Peserta:</span> <b>Seluruh Siswa Terdaftar</b></div>
          </div>
          <p class="text-[11px] text-slate-400 text-center mt-2">Pastikan hadir 10 menit sebelum jadwal dimulai.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#2563eb',
      customClass: { popup: 'rounded-3xl' }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans">
        
        {/* ============================================================ */}
        {/* HEADER SECTION (EXACT 1:1 WITH SISWA REFERENCE) */}
        {/* ============================================================ */}
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-5">
          <div className="max-w-[1450px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">Kalender</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kalender Saya
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Lihat jadwal kelas, tugas, ujian, dan kegiatan penting.
              </p>
            </div>

            {/* Top Right Month Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer pr-8 appearance-none shadow-xs hover:border-blue-400 transition-all"
              >
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="Desember 2026">Desember 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY AREA */}
        {/* ============================================================ */}
        <div className="max-w-[1450px] mx-auto px-4 md:px-8 mt-6 space-y-6">
          
          {/* ================= TOP SECTION: CALENDAR & SIDEBAR ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------- MAIN CALENDAR GRID (8 COLS) ---------------- */}
            <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 md:p-6">
              
              {/* Calendar Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                {/* Month Navigator */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => Swal.fire('Informasi', 'Menampilkan bulan sebelumnya', 'info')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Oktober 2026
                  </h2>
                  <button 
                    onClick={() => Swal.fire('Informasi', 'Menampilkan bulan berikutnya', 'info')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* View Switcher Pills */}
                <div className="inline-flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('bulan')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'bulan'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bulan
                  </button>
                  <button
                    onClick={() => setViewMode('minggu')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'minggu'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Minggu
                  </button>
                  <button
                    onClick={() => setViewMode('hari')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'hari'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hari
                  </button>
                </div>
              </div>

              {/* Day Headers (Min, Sen, Sel, Rab, Kam, Jum, Sab) */}
              <div className="grid grid-cols-7 text-center pt-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <span className="text-rose-500">Min</span>
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
              </div>

              {/* Month Calendar Cells (7 Columns) */}
              <div className="grid grid-cols-7 border-collapse">
                {calendarCells.map((cell, idx) => {
                  const isCurrentMonth = cell.isCurrentMonth;
                  const isSelected = isCurrentMonth && selectedDay === cell.day;
                  const dayEvents = isCurrentMonth 
                    ? events.filter(e => e.day === cell.day)
                    : [];

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isCurrentMonth) setSelectedDay(cell.day);
                      }}
                      className={`min-h-[82px] sm:min-h-[96px] p-1.5 sm:p-2 border-b border-r border-slate-100 transition-colors relative cursor-pointer ${
                        idx % 7 === 0 ? 'border-l' : ''
                      } ${!isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white hover:bg-slate-50/70'}`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white font-black shadow-sm'
                              : isCurrentMonth
                              ? 'text-slate-700'
                              : 'text-slate-300'
                          }`}
                        >
                          {cell.day}
                        </span>
                      </div>

                      {/* Event Badges inside this cell */}
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowEventDetail(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate border transition-transform hover:scale-[1.02] shadow-2xs ${ev.color}`}
                            title={ev.fullTitle}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* ---------------- RIGHT SIDEBAR: MINI CALENDAR & CATEGORIES (4 COLS) ---------------- */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-5">
              
              {/* Mini Calendar Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-800">
                    Oktober 2026
                  </h3>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mini Calendar Weekday Header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
                  <span className="text-rose-500">Min</span>
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span>Sab</span>
                </div>

                {/* Mini Calendar Numbers */}
                <div className="grid grid-cols-7 text-center text-[10px] gap-y-1 font-semibold text-slate-700">
                  {/* Sep muted */}
                  <span className="text-slate-300 py-1">27</span>
                  <span className="text-slate-300 py-1">28</span>
                  <span className="text-slate-300 py-1">29</span>
                  <span className="text-slate-300 py-1">30</span>
                  
                  {/* Oct 1-31 */}
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-rose-500 text-white font-black shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kategori Jadwal (Legend Card) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800">
                  Kategori Jadwal
                </h3>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-sky-500"></span>
                    <span>Kelas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
                    <span>Tugas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-rose-400"></span>
                    <span>Quiz</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-rose-600"></span>
                    <span>Ujian</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
                    <span>Praktik</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ================= BOTTOM SECTION: JADWAL MENDATANG & TUGAS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------- LEFT: JADWAL MENDATANG (6 COLS) ---------------- */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Jadwal Mendatang
                </h3>
                <button 
                  onClick={() => Swal.fire('Jadwal Lengkap', 'Seluruh agenda aktif semester ganjil 2026', 'info')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Lihat Semua
                </button>
              </div>

              {/* List of 5 Upcoming Items */}
              <div className="space-y-3">
                {upcomingEvents.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleShowEventDetail(item)}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Date Badge Box */}
                      <div className={`w-11 h-11 rounded-xl ${item.colorClass} flex flex-col items-center justify-center font-bold flex-shrink-0 shadow-2xs`}>
                        <span className="text-sm leading-none font-black">{item.day}</span>
                        <span className="text-[9px] uppercase tracking-wider">{item.monthStr}</span>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-slate-800">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.time}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category Pill */}
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${item.badgeClass}`}>
                      {item.badgeText}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------------- RIGHT: TUGAS & DEADLINE + MOTIVASI (6 COLS) ---------------- */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Tugas & Deadline Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Tugas & Deadline
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Daftar Tugas', 'Seluruh tugas aktif dari kelas N5, N4, dan N3', 'info')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {tasksDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${task.iconBg} flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs md:text-sm font-bold text-slate-800">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {task.class} • Tenggat: {task.date}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 text-[10px] md:text-[11px] font-bold rounded-full border ${task.statusColor}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation Card: Terus Semangat Belajar! */}
              <div className="bg-gradient-to-r from-pink-50 via-rose-50/60 to-pink-50/30 border border-pink-100/90 rounded-3xl p-5 md:p-6 shadow-xs flex items-center gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-pink-200 shadow-sm bg-white">
                  <img
                    src={animeGirlCheerImg}
                    alt="Anime Schoolgirl Cheering"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h4 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <span>Terus Semangat Belajar!</span>
                    <Sparkles className="w-4 h-4 text-pink-500 fill-pink-400" />
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Setiap langkah kecil membawa kamu lebih dekat dengan mimpi besar.
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-pink-700">
                    🌸 Tetap disiplin & pantang menyerah!
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
