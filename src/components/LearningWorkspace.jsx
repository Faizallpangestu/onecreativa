import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Calendar, Clock, BookOpen, Plus, Edit2, Trash2, Download, 
  Search, Users, CheckCircle2, AlertCircle, QrCode, Camera, 
  FileText, Award, Trophy, ArrowRight, LayoutGrid, CalendarDays,
  Sparkles, X, Check, Filter, Layers
} from 'lucide-react';
import ModuleFrame, { 
  FormField, fieldClass, buttonClass, secondaryButtonClass, dangerButtonClass 
} from './ModuleFrame';
import MeetingCalendar from './MeetingCalendar';
import AgendaEducationSchedule from './AgendaEducationSchedule';
import { currentActor, moduleApi, moduleDate } from '../utils/moduleApi';

const titles = {
  agenda: 'Agenda & Jadwal',
  kalender: 'Kalender Pertemuan',
  tugas: 'Penugasan',
  quiz: 'Quiz & Evaluasi',
  tugas_quiz: 'Tugas & Quiz',
  ukom: 'Ujian Kompetensi',
  materi: 'Materi Pembelajaran',
  konsultasi: 'Konsultasi Pengajar',
  diskusi: 'Diskusi & Tanya Jawab',
  grades: 'Nilai Siswa',
  attendance: 'Presensi & Kehadiran',
  barcode: 'Presensi Barcode QR',
  profile: 'Profil Siswa',
  card: 'Kartu Siswa',
  leaderboard: 'Papan Peringkat (Leaderboard)'
};

const emptyMeeting = {
  title: '',
  description: '',
  meeting_date: '',
  start_time: '',
  end_time: '',
  assignment_id: '',
  type: 'Masuk'
};

export default function LearningWorkspace({ mode = 'agenda' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [viewMode, setViewMode] = useState(mode === 'kalender' ? 'calendar' : 'cards'); // 'cards' | 'calendar'
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarDayMeetings, setCalendarDayMeetings] = useState([]);
  const [qr, setQr] = useState(null);
  const [scan, setScan] = useState(false);
  const [scanAction, setScanAction] = useState('check_in');
  const [notice, setNotice] = useState('');
  const [agendaSubView, setAgendaSubView] = useState('schedule'); // 'schedule' | 'sessions'

  const scannerRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const actor = await currentActor();
      const paths = ['relationships', 'lms_meetings'];
      if (!['profile', 'card', 'agenda', 'kalender'].includes(mode)) {
        paths.push('lms_tasks', 'lms_submissions', 'lms_attendance');
      }
      if (mode === 'leaderboard') paths.push('lms_leaderboard');
      const values = await Promise.all(paths.map(p => moduleApi(p)));
      setData(Object.fromEntries(paths.map((p, i) => [p, values[i]])));
      setData(d => ({ ...d, actor }));
    } catch (e) {
      setError(e.message || 'Gagal memuat data pembelajaran.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const teacher = ['sensei', 'admin', 'super_admin'].includes(data?.actor?.role);
  const relations = data?.relationships;
  const meetings = data?.lms_meetings || [];
  
  const tasks = (data?.lms_tasks || []).filter(t => {
    let matchCategory = true;
    if (['tugas', 'quiz', 'ukom', 'materi', 'konsultasi'].includes(mode)) {
      matchCategory = t.category === mode;
    } else if (mode === 'tugas_quiz') {
      matchCategory = filterType === 'ALL' ? ['tugas', 'quiz'].includes(t.category) : t.category === filterType;
    } else if (mode === 'diskusi') {
      matchCategory = ['diskusi', 'konsultasi'].includes(t.category);
    }
    const matchSearch = `${t.title} ${t.class_name || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const submissions = data?.lms_submissions || [];

  const execute = async (action) => {
    setSaving(true);
    setNotice('');
    try {
      await action();
      setForm(null);
      setNotice('Data berhasil disimpan ke server.');
      await refresh();
    } catch (e) {
      setNotice(e.message || 'Gagal memproses aksi.');
    } finally {
      setSaving(false);
    }
  };

  const save = (event) => {
    event.preventDefault();
    execute(async () => {
      if (form.kind === 'meeting') {
        const payload = new FormData();
        Object.entries(form)
          .filter(([k]) => k !== 'kind' && k !== 'file')
          .forEach(([k, v]) => payload.append(k, v));
        if (form.file) payload.append('material_file', form.file);
        await moduleApi('lms_meetings', 'post', payload);
      }
      if (form.kind === 'task') {
        const payload = new FormData();
        for (const k of ['meeting_id', 'title', 'description', 'due_date', 'category']) {
          payload.append(k, form[k] || '');
        }
        if (form.file) payload.append('file_attachment', form.file);
        await moduleApi('lms_tasks', 'post', payload);
      }
      if (form.kind === 'submission') {
        const payload = new FormData();
        payload.append('task_id', form.task_id);
        payload.append('submission_text', form.submission_text || '');
        if (form.file) payload.append('submission_file', form.file);
        await moduleApi('lms_submissions', 'post', payload);
      }
      if (form.kind === 'attendance') {
        await moduleApi('lms_attendance', 'post', {
          action: 'status',
          meeting_id: form.meeting_id,
          siswa_id: form.siswa_id,
          status: form.status,
          notes: form.notes
        });
      }
      if (form.kind === 'grade') {
        await moduleApi('lms_submissions', 'post', {
          action: 'grade',
          submission_id: form.submission_id,
          grade: form.grade,
          feedback: form.feedback
        });
      }
    });
  };

  const issue = (meeting) => execute(async () => {
    const res = await moduleApi('lms_attendance', 'post', { action: 'issue_session', meeting_id: meeting.id });
    setQr(res);
    setSelected(meeting.id);
  });

  const recordScan = useCallback(async (text) => {
    const parsed = JSON.parse(text);
    if (parsed.type !== 'creativa_attendance' || !parsed.token || !parsed.meeting_id) {
      throw new Error('Format kode presensi QR tidak valid.');
    }
    await moduleApi('lms_attendance', 'post', {
      action: scanAction,
      meeting_id: parsed.meeting_id,
      token: parsed.token
    });
    setNotice('Presensi Anda berhasil dicatat di sistem.');
    await refresh();
  }, [scanAction, refresh]);

  useEffect(() => {
    if (!scan) return;
    let disposed = false;
    const scanner = new Html5Qrcode('learning-qr-reader');
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (text) => {
        if (disposed) return;
        disposed = true;
        try {
          await scanner.stop();
          await recordScan(text);
        } catch (e) {
          setNotice(e.message);
        } finally {
          setScan(false);
        }
      }
    ).catch(e => {
      setNotice(`Kamera tidak dapat diakses: ${e.message || e}`);
      setScan(false);
    });

    return () => {
      disposed = true;
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [scan, recordScan]);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const myStudent = relations?.profile || relations?.students?.[0];

  const visibleMeetings = meetings.filter(m => {
    const matchSearch = `${m.title} ${m.class_name || ''} ${m.description || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || m.type === filterType;
    return matchSearch && matchType;
  });

  // Calculate high-level metrics for Agenda
  const totalMeetings = meetings.length;
  const activeSessions = meetings.filter(m => m.type !== 'Libur').length;
  const withMaterials = meetings.filter(m => !!m.material_file).length;
  const linkedClasses = relations?.assignments?.length || relations?.classes?.length || 0;

  return (
    <ModuleFrame
      title={titles[mode] || 'Pembelajaran'}
      description="Portal terintegrasi ruang belajar, materi kelas, penugasan, dan evaluasi siswa ONE Creativa."
      loading={loading}
      error={error}
      refresh={refresh}
    >
      {/* Notice Banner */}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* AGENDA & JADWAL VIEW */}
      {mode === 'agenda' && (
        <div className="space-y-6">
          {/* Sub-view switcher between Rencana Penjadwalan & Sesi Pertemuan Harian */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAgendaSubView('schedule')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  agendaSubView === 'schedule'
                    ? 'bg-gradient-to-r from-[#0c2e59] to-[#1a56db] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Rencana Penjadwalan Intensif (Tabel)</span>
              </button>

              <button
                type="button"
                onClick={() => setAgendaSubView('sessions')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  agendaSubView === 'sessions'
                    ? 'bg-gradient-to-r from-[#0c2e59] to-[#1a56db] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Sesi Pertemuan Kelas</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-slate-400 hidden sm:block">
              {agendaSubView === 'schedule' ? 'Tabel Agenda Pendidikan LPK Creativa' : 'Daftar Pertemuan Kelas'}
            </div>
          </div>

          {agendaSubView === 'schedule' ? (
            <AgendaEducationSchedule />
          ) : (
            <>
              {/* STATS OVERVIEW CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pertemuan</p>
                <p className="text-2xl sm:text-3xl font-black text-[#0c2e59] mt-1">{totalMeetings}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Jadwal tercatat</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sesi Masuk</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{activeSessions}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Pertemuan aktif</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Materi Tersedia</p>
                <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{withMaterials}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Bahan ajar lampiran</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas Terhubung</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{linkedClasses}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Assignment kelas</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* CONTROLS, SEARCH & ACTIONS BAR */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  aria-label="Cari judul pertemuan atau kelas"
                  placeholder="Cari pertemuan, topik, atau kelas…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${fieldClass} pl-10`}
                />
              </div>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="ALL">Semua Sesi</option>
                <option value="Masuk">Hanya Sesi Masuk</option>
                <option value="Libur">Hanya Sesi Libur</option>
              </select>

              {/* View Switcher Toggle */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-[#0c2e59] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'calendar' ? 'bg-white text-[#0c2e59] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kalender</span>
                </button>
              </div>
            </div>

            {/* Teacher / Admin Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {relations?.can_manage && (
                <Link to="/lms/classes" className={secondaryButtonClass}>
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Kelola Kelas</span>
                </Link>
              )}

              {teacher && (
                <button
                  type="button"
                  disabled={saving || !relations?.assignments?.length}
                  className={buttonClass}
                  onClick={() => setForm({ kind: 'meeting', ...emptyMeeting })}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pertemuan</span>
                </button>
              )}
            </div>
          </div>

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              <MeetingCalendar
                meetings={meetings}
                isSensei={teacher}
                onDateClick={(dateStr, dayList) => {
                  setSelectedCalendarDate(dateStr);
                  setCalendarDayMeetings(dayList);
                }}
              />

              {/* Day meetings popup card */}
              {selectedCalendarDate && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-[#0c2e59]">
                        Jadwal: {moduleDate(selectedCalendarDate)}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {calendarDayMeetings.length} sesi pertemuan pada tanggal ini
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarDate(null)}
                      className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {calendarDayMeetings.map(m => (
                      <div key={m.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          m.type === 'Libur' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {m.type}
                        </span>
                        <h4 className="font-bold text-slate-900">{m.title}</h4>
                        <p className="text-xs text-slate-500">{m.start_time?.slice(0,5) || '—'} – {m.end_time?.slice(0,5) || '—'}</p>
                        <p className="text-xs text-slate-600 line-clamp-2">{m.description}</p>
                        {teacher && m.id && !String(m.id).startsWith('weekend') && (
                          <button
                            type="button"
                            onClick={() => setForm({ kind: 'meeting', ...m })}
                            className={`${secondaryButtonClass} text-xs py-1.5 px-3 w-full mt-2`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Sesi Ini</span>
                          </button>
                        )}
                      </div>
                    ))}
                    {!calendarDayMeetings.length && (
                      <p className="text-sm text-slate-500 py-4 col-span-full text-center">
                        Tidak ada sesi pertemuan di tanggal ini.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARDS GRID VIEW */}
          {viewMode === 'cards' && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleMeetings.map(m => {
                const isLibur = m.type === 'Libur';
                return (
                  <article
                    key={m.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden"
                  >
                    {/* Top colored accent line */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${
                      isLibur ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    }`} />

                    <div>
                      {/* Class Pill & Type Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[150px]">{m.class_name || 'Kelas Terdaftar'}</span>
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isLibur ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {m.type}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {m.title}
                      </h2>

                      {/* Date & Time Chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {moduleDate(m.meeting_date)}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {m.start_time?.slice(0, 5) || '—'} – {m.end_time?.slice(0, 5) || '—'} WIB
                        </span>
                      </div>

                      {/* Description */}
                      {m.description && (
                        <p className="mt-3 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          {m.description}
                        </p>
                      )}

                      {/* Material Attachment Download */}
                      {m.material_file && (
                        <a
                          className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 px-3 py-1.5 rounded-xl transition-all"
                          href={`/api/lms_meetings.php?view=file&id=${m.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Materi Lampiran</span>
                        </a>
                      )}
                    </div>

                    {/* Teacher Action Buttons */}
                    {teacher && (
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            onClick={() => setForm({ kind: 'meeting', ...m })}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {!isLibur && (
                            <button
                              type="button"
                              className={secondaryButtonClass}
                              onClick={() => issue(m)}
                              title="Buka Presensi QR untuk siswa"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                              <span>QR</span>
                            </button>
                          )}
                        </div>

                        {!isLibur && m.assignment_id && (
                          <button
                            type="button"
                            disabled={saving}
                            className={dangerButtonClass}
                            onClick={() => execute(() => moduleApi('lms_meetings', 'post', { id: m.id, type: 'Libur' }))}
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {!visibleMeetings.length && (
                <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Tidak ada jadwal pertemuan ditemukan</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    {search ? `Tidak ada pertemuan yang sesuai dengan pencarian "${search}".` : 'Belum ada agenda pertemuan yang dibuat untuk kelas ini.'}
                  </p>
                  {teacher && (
                    <button
                      type="button"
                      disabled={saving || !relations?.assignments?.length}
                      className={`${buttonClass} mt-5`}
                      onClick={() => setForm({ kind: 'meeting', ...emptyMeeting })}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Pertemuan Pertama</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* TASKS / QUIZ / UKOM / MATERI / KONSULTASI / DISKUSI VIEW */}
      {['tugas', 'quiz', 'tugas_quiz', 'ukom', 'materi', 'konsultasi', 'diskusi'].includes(mode) && (
        <div className="space-y-5">
          {/* Action Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  aria-label={`Cari ${titles[mode]}`}
                  placeholder={`Cari ${titles[mode]}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${fieldClass} pl-10`}
                />
              </div>

              {mode === 'tugas_quiz' && (
                <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition ${filterType === 'ALL' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('tugas')}
                    className={`px-3 py-1.5 rounded-lg transition ${filterType === 'tugas' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Tugas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('quiz')}
                    className={`px-3 py-1.5 rounded-lg transition ${filterType === 'quiz' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Quiz
                  </button>
                </div>
              )}
            </div>

            {teacher && (
              <button
                type="button"
                disabled={saving || !meetings.length}
                className={buttonClass}
                onClick={() => setForm({ 
                  kind: 'task', 
                  title: '', 
                  description: '', 
                  meeting_id: '', 
                  due_date: '', 
                  category: mode === 'tugas_quiz' ? (filterType !== 'ALL' ? filterType : 'tugas') : (mode === 'diskusi' ? 'diskusi' : mode) 
                })}
              >
                <Plus className="w-4 h-4" />
                <span>Terbitkan {titles[mode]}</span>
              </button>
            )}
          </div>

          {/* Task Cards List */}
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map(t => {
              const own = submissions.find(s => Number(s.task_id) === Number(t.id));
              const taskSubmissions = submissions.filter(s => Number(s.task_id) === Number(t.id));

              return (
                <article
                  key={t.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {t.class_name || 'Kelas'} · {t.meeting_title || 'Pertemuan'}
                      </span>
                      {t.due_date && (
                        <span className="text-xs font-medium text-slate-500">
                          Tenggat: {moduleDate(t.due_date)} {t.due_date.slice(11, 16)}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-[#0c2e59]">{t.title}</h2>
                    {t.description && (
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {t.file_attachment && (
                      <a
                        href={`/api/lms_tasks.php?view=file&id=${t.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Lampiran Tugas</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {!teacher && mode !== 'materi' && (
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          own?.published_at ? 'bg-emerald-100 text-emerald-800' : own ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {own ? (own.published_at ? `Nilai: ${own.grade}` : 'Sudah dikumpulkan') : 'Belum dikumpulkan'}
                        </span>
                        <button
                          type="button"
                          disabled={saving || !!own?.published_at}
                          className={buttonClass}
                          onClick={() => setForm({ kind: 'submission', task_id: t.id, submission_text: own?.submission_text || '' })}
                        >
                          {own ? 'Perbarui Jawaban' : 'Kumpulkan Jawaban'}
                        </button>
                      </div>
                    )}

                    {teacher && (
                      <div className="w-full space-y-3">
                        <button
                          type="button"
                          className={`${secondaryButtonClass} w-full justify-between`}
                          onClick={() => setSelected(selected === t.id ? null : t.id)}
                        >
                          <span>Jawaban Siswa ({taskSubmissions.length})</span>
                          <span className="text-xs font-bold text-blue-600">
                            {selected === t.id ? 'Tutup' : 'Lihat'}
                          </span>
                        </button>

                        {selected === t.id && (
                          <SubmissionRows
                            rows={taskSubmissions}
                            teacher={teacher}
                            saving={saving}
                            setForm={setForm}
                            publish={id => execute(() => moduleApi('lms_submissions', 'post', { action: 'publish', submission_id: id }))}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {!tasks.length && (
              <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Belum ada {titles[mode]?.toLowerCase() || 'data'} untuk kelas Anda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT PROFILE & CARD VIEW */}
      {['profile', 'card'].includes(mode) && (
        <section className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl mb-3 shadow-inner">
              {(myStudent?.name?.[0] || 'S').toUpperCase()}
            </div>
            <h2 className="text-xl font-black text-[#0c2e59]">{myStudent?.name || 'Siswa LPK Creativa'}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Kartu Tanda Siswa</p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <dt className="text-xs font-bold text-slate-400">ID Siswa</dt>
              <dd className="text-base font-black text-slate-800 mt-0.5">{myStudent?.id ?? '—'}</dd>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <dt className="text-xs font-bold text-slate-400">Level / Batch</dt>
              <dd className="text-base font-black text-slate-800 mt-0.5">{myStudent?.level || '—'} / {myStudent?.batch || '—'}</dd>
            </div>
            <div className="col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <dt className="text-xs font-bold text-slate-400">Kelas Aktif</dt>
              <dd className="text-sm font-bold text-slate-800 mt-0.5">
                {relations?.classes?.map(c => c.name).join(', ') || 'Belum ada enrollment aktif'}
              </dd>
            </div>
          </dl>

          {mode === 'card' && (
            <button
              type="button"
              className={`${buttonClass} w-full mt-6 py-3`}
              onClick={() => window.print()}
            >
              Cetak Kartu Siswa
            </button>
          )}
        </section>
      )}

      {/* ATTENDANCE & BARCODE VIEW */}
      {['attendance', 'barcode'].includes(mode) && (
        <section className="space-y-6">
          {teacher ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-[#0c2e59]">Pilih Pertemuan untuk Membuka Sesi Presensi</h2>
              <div className="flex flex-wrap gap-2.5">
                {meetings.filter(m => m.type !== 'Libur').map(m => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={saving || !m.assignment_id}
                    className={secondaryButtonClass}
                    onClick={() => issue(m)}
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>{m.title} · {moduleDate(m.meeting_date)}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setForm({ kind: 'attendance', meeting_id: '', siswa_id: '', status: 'izin', notes: '' })}
              >
                Koreksi Status Presensi Manual
              </button>

              {qr && (
                <div className="mt-5 p-6 rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 w-fit flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <QRCode value={qr.payload} size={220} />
                  </div>
                  <p className="mt-4 text-xs font-bold text-indigo-900 text-center max-w-xs">
                    Berlaku sampai {new Date(qr.expires_at).toLocaleTimeString('id-ID')}. Siswa dapat scan kode ini lewat aplikasi.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Aksi presensi"
                  className={`${fieldClass} max-w-xs`}
                  value={scanAction}
                  onChange={e => setScanAction(e.target.value)}
                >
                  <option value="check_in">Check-in Masuk</option>
                  <option value="check_out">Check-out Selesai</option>
                </select>

                <button
                  type="button"
                  disabled={scan || saving}
                  className={buttonClass}
                  onClick={() => setScan(true)}
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan QR Pengajar</span>
                </button>
              </div>

              {scan && (
                <div className="p-4 rounded-3xl bg-slate-900 text-white max-w-md">
                  <p className="text-xs text-slate-400 mb-2">Arahkan kamera ke QR code pengajar</p>
                  <div id="learning-qr-reader" className="w-full rounded-2xl overflow-hidden" />
                </div>
              )}
            </div>
          )}

          {/* Attendance History Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  {['Pertemuan', 'Tanggal', 'Siswa', 'Status', 'Jam Masuk', 'Jam Keluar'].map(h => (
                    <th key={h} className="p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.lms_attendance || []).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{a.meeting_title}</td>
                    <td className="p-4 text-slate-600">{moduleDate(a.meeting_date)}</td>
                    <td className="p-4 font-medium text-slate-700">{a.siswa_name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        a.status === 'hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{a.check_in || '—'}</td>
                    <td className="p-4 text-slate-600">{a.check_out || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.lms_attendance?.length && (
              <p className="p-8 text-center text-slate-500">Belum ada catatan presensi.</p>
            )}
          </div>
        </section>
      )}

      {/* LEADERBOARD VIEW */}
      {mode === 'leaderboard' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-[#0c2e59]">Peringkat Kumulatif Siswa</h2>
          </div>
          <p className="text-xs text-slate-500">
            Perhitungan nilai kumulatif dari seluruh tugas, quiz, dan evaluasi terpublikasi.
          </p>

          <div className="divide-y divide-slate-100 mt-4">
            {(data?.lms_leaderboard || []).map((s, idx) => (
              <div key={s.siswa_id || idx} className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-400 text-amber-950 font-black' :
                    idx === 1 ? 'bg-slate-300 text-slate-800 font-bold' :
                    idx === 2 ? 'bg-amber-700/30 text-amber-900 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.rank || idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{s.siswa_name}</span>
                </div>
                <span className="font-black text-blue-600">{s.total_poin ?? '0'} poin</span>
              </div>
            ))}
            {!data?.lms_leaderboard?.length && (
              <p className="p-6 text-center text-slate-500">Belum ada data nilai leaderboard terpublikasi.</p>
            )}
          </div>
        </section>
      )}

      {/* MODAL DIALOG */}
      {form && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-[#0c2e59]">
                {form.kind === 'meeting' ? (form.id ? 'Edit Pertemuan' : 'Tambah Pertemuan Baru') :
                 form.kind === 'task' ? `Terbitkan ${titles[form.category] || 'Pembelajaran'}` :
                 form.kind === 'grade' ? 'Penilaian Jawaban' :
                 form.kind === 'attendance' ? 'Koreksi Status Presensi' : 'Kumpulkan Jawaban'}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={save} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {['meeting', 'task'].includes(form.kind) && (
                <>
                  <FormField label="Judul">
                    <input
                      required
                      placeholder="Contoh: Pertemuan 1 - Tata Bahasa N5"
                      className={fieldClass}
                      value={form.title}
                      onChange={e => update('title', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Deskripsi & Topik">
                    <textarea
                      placeholder="Tuliskan ringkasan materi atau instruksi..."
                      className={fieldClass}
                      rows={3}
                      value={form.description || ''}
                      onChange={e => update('description', e.target.value)}
                    />
                  </FormField>
                </>
              )}

              {form.kind === 'meeting' && (
                <>
                  <FormField label="Pilih Kelas / Assignment">
                    <select
                      required
                      className={fieldClass}
                      value={form.assignment_id || ''}
                      onChange={e => update('assignment_id', e.target.value)}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {relations?.assignments?.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.class_name} · {a.starts_on}–{a.ends_on || 'berjalan'}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tanggal Pertemuan">
                      <input
                        required
                        type="date"
                        className={fieldClass}
                        value={form.meeting_date}
                        onChange={e => update('meeting_date', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Tipe Sesi">
                      <select
                        className={fieldClass}
                        value={form.type || 'Masuk'}
                        onChange={e => update('type', e.target.value)}
                      >
                        <option value="Masuk">Masuk</option>
                        <option value="Libur">Libur</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Jam Mulai (WIB)">
                      <input
                        required
                        type="time"
                        className={fieldClass}
                        value={form.start_time?.slice(0, 5) || ''}
                        onChange={e => update('start_time', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Jam Selesai (WIB)">
                      <input
                        required
                        type="time"
                        className={fieldClass}
                        value={form.end_time?.slice(0, 5) || ''}
                        onChange={e => update('end_time', e.target.value)}
                      />
                    </FormField>
                  </div>
                </>
              )}

              {form.kind === 'task' && (
                <>
                  {mode === 'tugas_quiz' && (
                    <FormField label="Kategori">
                      <select
                        className={fieldClass}
                        value={form.category || 'tugas'}
                        onChange={e => update('category', e.target.value)}
                      >
                        <option value="tugas">Tugas / Penugasan</option>
                        <option value="quiz">Quiz & Evaluasi</option>
                      </select>
                    </FormField>
                  )}

                  <FormField label="Hubungkan ke Pertemuan">
                    <select
                      required
                      className={fieldClass}
                      value={form.meeting_id}
                      onChange={e => update('meeting_id', e.target.value)}
                    >
                      <option value="">-- Pilih Pertemuan --</option>
                      {meetings.filter(m => m.assignment_id && m.type !== 'Libur').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.class_name} · {m.title}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Batas Waktu Pengumpulan (WIB)">
                    <input
                      type="datetime-local"
                      className={fieldClass}
                      value={form.due_date || ''}
                      onChange={e => update('due_date', e.target.value)}
                    />
                  </FormField>
                </>
              )}

              {form.kind === 'attendance' && (
                <>
                  <FormField label="Pertemuan">
                    <select
                      required
                      className={fieldClass}
                      value={form.meeting_id}
                      onChange={e => update('meeting_id', e.target.value)}
                    >
                      <option value="">-- Pilih Pertemuan --</option>
                      {meetings.filter(m => m.assignment_id && m.type !== 'Libur').map(m => (
                        <option key={m.id} value={m.id}>{m.class_name} · {m.title}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Siswa">
                    <select
                      required
                      className={fieldClass}
                      value={form.siswa_id}
                      onChange={e => update('siswa_id', e.target.value)}
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {relations?.students?.map(s => (
                        <option key={s.id} value={s.user_id}>{s.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Status Kehadiran">
                    <select
                      className={fieldClass}
                      value={form.status}
                      onChange={e => update('status', e.target.value)}
                    >
                      {['hadir', 'izin', 'sakit', 'terlambat', 'alpha'].map(v => (
                        <option key={v} value={v}>{v.toUpperCase()}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Catatan / Alasan Koreksi">
                    <textarea
                      required
                      className={fieldClass}
                      rows={2}
                      value={form.notes}
                      onChange={e => update('notes', e.target.value)}
                    />
                  </FormField>
                </>
              )}

              {form.kind === 'submission' && (
                <FormField label="Jawaban / Respon Anda">
                  <textarea
                    className={fieldClass}
                    rows={5}
                    placeholder="Tuliskan jawaban Anda di sini..."
                    value={form.submission_text}
                    onChange={e => update('submission_text', e.target.value)}
                  />
                </FormField>
              )}

              {form.kind === 'grade' && (
                <>
                  <FormField label="Nilai (0–100)">
                    <input
                      required
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={fieldClass}
                      value={form.grade}
                      onChange={e => update('grade', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Umpan Balik Pengajar">
                    <textarea
                      className={fieldClass}
                      rows={3}
                      placeholder="Catatan perbaikan atau feedback untuk siswa..."
                      value={form.feedback || ''}
                      onChange={e => update('feedback', e.target.value)}
                    />
                  </FormField>
                </>
              )}

              {!['grade', 'attendance'].includes(form.kind) && (
                <FormField label="Lampiran File (PDF / JPG / PNG / WebP, maks. 10 MB)">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className={fieldClass}
                    onChange={e => update('file', e.target.files?.[0])}
                  />
                </FormField>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setForm(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={buttonClass}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}

function SubmissionRows({ rows, teacher, saving, setForm, publish }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
          <tr>
            {['Siswa', 'Jawaban', 'Nilai', 'Status', 'Aksi'].map(h => (
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(s => (
            <tr key={s.id} className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-800">{s.siswa_name}</td>
              <td className="max-w-xs whitespace-pre-wrap p-3 text-slate-600">
                {s.submission_text}
                {s.submission_file && (
                  <a
                    className="mt-1 block font-bold text-blue-600 hover:underline"
                    href={`/api/lms_submissions.php?view=file&id=${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Unduh Jawaban File
                  </a>
                )}
              </td>
              <td className="p-3 font-bold text-slate-800">{s.grade ?? '—'}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  s.published_at ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.published_at ? 'Terpublikasi' : 'Draft'}
                </span>
              </td>
              <td className="p-3">
                {teacher && !s.published_at && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={saving}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      onClick={() => setForm({ kind: 'grade', submission_id: s.id, grade: s.grade ?? '', feedback: s.feedback || '' })}
                    >
                      Beri Nilai
                    </button>
                    {s.grade !== null && s.grade !== '' && (
                      <button
                        type="button"
                        disabled={saving}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        onClick={() => publish(s.id)}
                      >
                        Publikasi
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="p-5 text-center text-slate-400">Belum ada submission jawaban dari siswa.</p>
      )}
    </div>
  );
}
