import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink,
  Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import animeGirlCheerImg from '../../assets/anime_girl_cheer.jpg';
import { moduleApi } from '../../utils/moduleApi';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LmsKalender() {
  const navigate = useNavigate();

  // Real database states
  const [classesList, setClassesList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [meetingsList, setMeetingsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Current view date (Default to current real date)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [viewMode, setViewMode] = useState('bulan'); // 'bulan' | 'minggu' | 'hari'

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 to 11
  const currentMonthLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  // Month options for dropdown (-6 months to +6 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let offset = -6; offset <= 6; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      opts.push({
        value: `${m}-${y}`,
        label: `${MONTH_NAMES[m]} ${y}`
      });
    }
    return opts;
  }, []);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Fetch real data from database
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      moduleApi('relationships').catch(() => ({})),
      fetch('/api/lms_tasks.php').then(r => r.json()).catch(() => ({})),
      fetch('/api/lms_meetings.php').then(r => r.json()).catch(() => ({}))
    ]).then(([relRes, taskRes, meetRes]) => {
      if (!isMounted) return;
      if (relRes?.classes?.length) setClassesList(relRes.classes);
      if (taskRes?.data && Array.isArray(taskRes.data)) setTasksList(taskRes.data);
      if (meetRes?.data && Array.isArray(meetRes.data)) setMeetingsList(meetRes.data);
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Real events computed dynamically from database classes, tasks, and meetings
  const events = useMemo(() => {
    const list = [];
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Recurring weekly class meetings from real database classes
    const activeClasses = classesList.length > 0 ? classesList : [
      { id: 19, name: 'N5 Pagi', level: 'N5', schedule_days: 'Senin & Rabu', schedule_time: '08:00 - 09:30' },
      { id: 20, name: 'N4 A - PAGI', level: 'N4', schedule_days: 'Senin & Rabu', schedule_time: '08:00 - 09:30' },
      { id: 21, name: 'Kelas Persiapan Mensetsu & Matching Job', level: 'Mensetsu', schedule_days: 'Jumat', schedule_time: '13:30 - 15:30' }
    ];

    activeClasses.forEach(cls => {
      const scheduleDays = (cls.schedule_days || '').toLowerCase();
      const isMonWed = scheduleDays.includes('senin') || scheduleDays.includes('rabu');
      const isFri = scheduleDays.includes('jumat');

      for (let d = 1; d <= daysInCurrentMonth; d++) {
        const dateObj = new Date(currentYear, currentMonth, d);
        const dayOfWeek = dateObj.getDay(); // 0=Min, 1=Sen, 2=Sel, 3=Rab, 4=Kam, 5=Jum, 6=Sab

        let match = false;
        if (isMonWed && (dayOfWeek === 1 || dayOfWeek === 3)) match = true;
        if (isFri && dayOfWeek === 5) match = true;
        if (!isMonWed && !isFri && (dayOfWeek === 1 || dayOfWeek === 3)) match = true;

        if (match) {
          const isMensetsu = (cls.level || '').toLowerCase().includes('mensetsu') || cls.name.toLowerCase().includes('mensetsu');
          list.push({
            id: `cls-${cls.id}-${d}`,
            day: d,
            dateObj: dateObj,
            time: cls.schedule_time ? cls.schedule_time.slice(0, 5) : '08:00',
            title: `${cls.schedule_time ? cls.schedule_time.slice(0, 5) : '08:00'} ${cls.name}`,
            fullTitle: `Kelas ${cls.name} (${cls.level || 'Jepang'})`,
            category: isMensetsu ? 'praktik' : 'kelas',
            color: isMensetsu 
              ? 'bg-purple-50 text-purple-700 border-purple-200' 
              : (cls.level === 'N4' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-sky-50 text-sky-700 border-sky-200'),
            tagColor: isMensetsu ? 'bg-purple-500' : (cls.level === 'N4' ? 'bg-indigo-500' : 'bg-sky-500'),
            location: isMensetsu ? 'Ruang Wawancara & Career Hub' : (cls.level === 'N4' ? 'Ruang Kelas 2 (Offline)' : 'Ruang Kelas 1 (Offline)'),
            timeFull: `${cls.schedule_time || '08:00 - 09:30'} WIB`,
            class_name: cls.name
          });
        }
      }
    });

    // 2. Real tasks from database
    tasksList.forEach(t => {
      if (t.due_date) {
        const dObj = new Date(t.due_date);
        if (dObj.getFullYear() === currentYear && dObj.getMonth() === currentMonth) {
          const d = dObj.getDate();
          const isQuiz = (t.category || '').toLowerCase() === 'quiz';
          list.push({
            id: `task-${t.id}`,
            day: d,
            dateObj: dObj,
            time: t.due_date.slice(11, 16) || '23:59',
            title: isQuiz ? `Quiz: ${t.title}` : `Tugas: ${t.title}`,
            fullTitle: `${isQuiz ? 'Quiz' : 'Tugas'} - ${t.title} (${t.class_name || 'LMS'})`,
            category: isQuiz ? 'quiz' : 'tugas',
            color: isQuiz ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200',
            tagColor: isQuiz ? 'bg-rose-500' : 'bg-amber-500',
            location: isQuiz ? 'CBT Online LMS' : 'LMS Submission',
            timeFull: `Deadline: ${t.due_date.slice(11, 16)} WIB`,
            class_name: t.class_name || 'Kelas'
          });
        }
      }
    });

    // 3. Real meetings from database
    meetingsList.forEach(m => {
      if (m.meeting_date) {
        const dObj = new Date(m.meeting_date);
        if (dObj.getFullYear() === currentYear && dObj.getMonth() === currentMonth) {
          const d = dObj.getDate();
          list.push({
            id: `meeting-${m.id}`,
            day: d,
            dateObj: dObj,
            time: m.start_time ? m.start_time.slice(0, 5) : '09:00',
            title: `${m.start_time ? m.start_time.slice(0, 5) : '09:00'} ${m.title}`,
            fullTitle: `Sesi: ${m.title} - ${m.description || ''}`,
            category: 'kelas',
            color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
            tagColor: 'bg-emerald-600',
            location: 'Ruang Teori Offline / LMS',
            timeFull: `${m.start_time ? m.start_time.slice(0, 5) : '09:00'} - ${m.end_time ? m.end_time.slice(0, 5) : '10:30'} WIB`,
            class_name: 'Sesi Pertemuan'
          });
        }
      }
    });

    return list.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  }, [classesList, tasksList, meetingsList, currentYear, currentMonth]);

  // Calendar cells for current active month
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Min, 1 = Sen, ..., 6 = Sab
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }

    // Next month filler days (fill up to multiple of 7)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({
          day: d,
          month: currentMonth === 11 ? 0 : currentMonth + 1,
          year: currentMonth === 11 ? currentYear + 1 : currentYear,
          isCurrentMonth: false
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Display cells slice based on viewMode (Bulan or Minggu)
  const displayCells = useMemo(() => {
    if (viewMode === 'minggu') {
      const selIdx = calendarCells.findIndex(c => c.isCurrentMonth && c.day === selectedDay);
      if (selIdx !== -1) {
        const weekStartIdx = Math.floor(selIdx / 7) * 7;
        return calendarCells.slice(weekStartIdx, weekStartIdx + 7);
      }
      return calendarCells.slice(0, 7);
    }
    return calendarCells;
  }, [calendarCells, viewMode, selectedDay]);

  // Real Upcoming Events (Jadwal Mendatang)
  const upcomingEvents = useMemo(() => {
    const todayDate = new Date();
    const future = events.filter(e => {
      if (currentYear > todayDate.getFullYear()) return true;
      if (currentYear === todayDate.getFullYear() && currentMonth > todayDate.getMonth()) return true;
      if (currentYear === todayDate.getFullYear() && currentMonth === todayDate.getMonth()) return e.day >= todayDate.getDate();
      return false;
    });

    const displayList = future.length > 0 ? future.slice(0, 5) : events.slice(0, 5);
    return displayList.map(ev => ({
      id: ev.id,
      day: ev.day,
      monthStr: MONTH_NAMES[currentMonth].slice(0, 3),
      title: ev.fullTitle || ev.title,
      time: ev.timeFull || ev.time,
      location: ev.location,
      badgeText: ev.category === 'kelas' ? 'Kelas' : (ev.category === 'tugas' ? 'Tugas' : (ev.category === 'quiz' ? 'Quiz' : 'Praktik')),
      badgeClass: ev.category === 'kelas' 
        ? 'bg-sky-50 text-sky-700 border-sky-200' 
        : (ev.category === 'tugas' 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : (ev.category === 'quiz' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-purple-50 text-purple-700 border-purple-200')),
      colorClass: ev.category === 'kelas' 
        ? 'bg-sky-500 text-white' 
        : (ev.category === 'tugas' 
          ? 'bg-amber-500 text-white' 
          : (ev.category === 'quiz' ? 'bg-rose-500 text-white' : 'bg-purple-600 text-white'))
    }));
  }, [events, currentYear, currentMonth]);

  // Real Tasks and Deadlines list
  const tasksDeadlines = useMemo(() => {
    if (tasksList.length > 0) {
      return tasksList.map(t => ({
        id: t.id,
        title: t.title,
        class: t.class_name || 'LPK Creativa',
        date: t.due_date ? t.due_date.slice(0, 10) : 'Aktif',
        status: 'Belum Dikerjakan',
        statusColor: 'bg-rose-50 text-rose-600 border-rose-200',
        iconBg: 'bg-amber-500 text-white'
      }));
    }
    return [
      {
        id: 1,
        title: 'Tugas Menulis Hiragana & Katakana',
        class: 'N5 Pagi',
        date: 'Setiap Rabu',
        status: 'Aktif',
        statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconBg: 'bg-blue-600 text-white'
      },
      {
        id: 2,
        title: 'Latihan Pola Kalimat Minna no Nihongo II',
        class: 'N4 A - PAGI',
        date: 'Setiap Senin',
        status: 'Aktif',
        statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
        iconBg: 'bg-indigo-600 text-white'
      },
      {
        id: 3,
        title: 'Penyusunan Rirekisho & Video Jikoshoukai',
        class: 'Kelas Persiapan Mensetsu',
        date: 'Setiap Jumat',
        status: 'Wajib',
        statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
        iconBg: 'bg-rose-600 text-white'
      }
    ];
  }, [tasksList]);

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
                Kalender Pertemuan
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Lihat jadwal kelas, tugas, ujian, dan kegiatan penting.
              </p>
            </div>

            {/* Top Right Month Selector Dropdown */}
            <div className="relative">
              <select
                value={`${currentMonth}-${currentYear}`}
                onChange={(e) => {
                  const [m, y] = e.target.value.split('-').map(Number);
                  setCurrentDate(new Date(y, m, 1));
                }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer pr-8 appearance-none shadow-xs hover:border-blue-400 transition-all"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="Bulan Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900 min-w-[130px] text-center">
                    {currentMonthLabel}
                  </h2>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="Bulan Berikutnya"
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
              {viewMode !== 'hari' ? (
                <div className="grid grid-cols-7 text-center pt-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <span className="text-rose-500">Min</span>
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span>Sab</span>
                </div>
              ) : (
                <div className="pt-3 pb-2 text-xs font-extrabold text-blue-600 border-b border-slate-100 flex items-center justify-between">
                  <span>Jadwal Harian: Tanggal {selectedDay} {currentMonthLabel}</span>
                  <button 
                    onClick={() => setViewMode('bulan')}
                    className="text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                  >
                    Kembali ke Tampilan Bulan
                  </button>
                </div>
              )}

              {/* Month / Week Calendar Cells */}
              {viewMode !== 'hari' ? (
                <div className="grid grid-cols-7 border-collapse">
                  {displayCells.map((cell, idx) => {
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
              ) : (
                <div className="py-4 space-y-3">
                  {(() => {
                    const selectedDayEvents = events.filter(e => e.day === selectedDay);
                    if (selectedDayEvents.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-400">
                          <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-semibold">Tidak ada jadwal pada tanggal {selectedDay} {currentMonthLabel}</p>
                          <p className="text-xs text-slate-400 mt-1">Pilih tanggal lain atau kembali ke tampilan bulan untuk melihat semua agenda.</p>
                        </div>
                      );
                    }
                    return selectedDayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => handleShowEventDetail(ev)}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 transition-all flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${ev.tagColor} text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{ev.fullTitle}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>{ev.timeFull || ev.time}</span>
                              <span>•</span>
                              <span>{ev.location}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ev.color}`}>
                          {ev.category}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}

            </div>

            {/* ---------------- RIGHT SIDEBAR: MINI CALENDAR & CATEGORIES (4 COLS) ---------------- */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-5">
              
              {/* Mini Calendar Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-800">
                    {currentMonthLabel}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Bulan Berikutnya"
                    >
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
                  {calendarCells.map((cell, idx) => {
                    const isCur = cell.isCurrentMonth;
                    const isSel = isCur && selectedDay === cell.day;
                    const hasEvent = isCur && events.some(e => e.day === cell.day);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isCur) setSelectedDay(cell.day);
                        }}
                        disabled={!isCur}
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition-all relative ${
                          isSel
                            ? 'bg-rose-500 text-white font-black shadow-xs'
                            : isCur
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'text-slate-300 cursor-default'
                        }`}
                      >
                        {cell.day}
                        {hasEvent && !isSel && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500"></span>
                        )}
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
                  onClick={() => navigate('/lms/agenda')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
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
                    onClick={() => navigate('/lms/tugas')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {tasksDeadlines.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate('/lms/tugas')}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4 cursor-pointer"
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
